import { once } from "events";
import { Readable } from "stream";
import archiver from "archiver";
import * as XLSX from "xlsx";
import { getFileStream } from "@/lib/r2";

function slugify(text) {
  return (
    String(text || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "player"
  );
}

function extensionOf(key) {
  const match = /\.([a-z0-9]+)$/i.exec(key || "");
  return match ? match[1].toLowerCase() : "bin";
}

// Already-compressed formats are stored as-is; re-deflating them only
// burns CPU for no size gain.
const STORE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "pdf"]);

// Builds a streamed ZIP download containing an Excel sheet plus every
// player's uploaded files, so the export carries the actual photos and
// CNIC images instead of just "Yes/No" flags.
//
// - players: [{ folder: string (id + name), row: {...sheet columns}, files: [{ column, label, key }] }]
//   Each file lands at "files/<folder>/<label>.<ext>" and its column in the
//   sheet becomes a clickable link to that relative path (works once the
//   ZIP is extracted).
export function buildExportZipResponse({ players, sheetName, filePrefix }) {
  const archive = archiver("zip", { zlib: { level: 6 } });
  const missing = [];

  (async () => {
    const sheetRows = [];
    const links = []; // { rowIndex, column, target }

    for (const player of players) {
      const row = { ...player.row };
      const folder = `${slugify(player.folder)}`;

      for (const file of player.files) {
        if (!file.key) {
          row[file.column] = "Not uploaded";
          continue;
        }
        const body = await getFileStream(file.key);
        if (!body) {
          row[file.column] = "Missing from storage";
          missing.push(`${player.folder}: ${file.column} (${file.key})`);
          continue;
        }
        const ext = extensionOf(file.key);
        const path = `files/${folder}/${file.label}.${ext}`;
        archive.append(body, { name: path, store: STORE_EXTENSIONS.has(ext) });
        // Wait for this entry to be written before opening the next R2
        // stream, so we never hold hundreds of connections open at once.
        await once(archive, "entry");
        row[file.column] = path;
        links.push({ rowIndex: sheetRows.length, column: file.column, target: path });
      }

      sheetRows.push(row);
    }

    const worksheet = XLSX.utils.json_to_sheet(sheetRows);
    const headers = Object.keys(sheetRows[0] || {});
    worksheet["!cols"] = headers.map(() => ({ wch: 18 }));
    for (const { rowIndex, column, target } of links) {
      const colIndex = headers.indexOf(column);
      if (colIndex === -1) continue;
      const cell = worksheet[XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex })];
      if (cell) cell.l = { Target: target, Tooltip: "Open file" };
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    archive.append(buffer, { name: `${filePrefix}.xlsx` });

    if (missing.length) {
      archive.append(
        `These files are referenced by a registration but no longer exist in storage:\n\n${missing.join("\n")}\n`,
        { name: "missing-files.txt" }
      );
    }

    await archive.finalize();
  })().catch((error) => {
    console.error("Export ZIP failed:", error);
    archive.abort();
    archive.destroy(error);
  });

  return new Response(Readable.toWeb(archive), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filePrefix}-${Date.now()}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
