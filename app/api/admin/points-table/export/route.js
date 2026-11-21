import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as XLSX from "xlsx";
import { verifyLeagueSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { pointsTable } from "@/lib/pointsTable";
import { todayInLeagueTimeZone } from "@/lib/matches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: the points table exactly as the website shows it (automatic standings
// with manual overrides), as an Excel file. NRR to 3 decimal places.
export async function GET() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!verifyLeagueSessionToken(token)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await connectToDatabase();
  const { rows } = await pointsTable();
  const today = todayInLeagueTimeZone();

  const header = ["Pos", "Team", "Matches", "Won", "Lost", "Tied", "No result", "Points", "NRR"];
  const aoa = [
    ["Maneri Premier League: Points Table"],
    [`Updated ${today}`],
    [],
    header,
    ...rows.map((row, i) => [
      i + 1,
      row.team,
      row.played,
      row.won,
      row.lost,
      row.tied,
      row.noResult,
      row.points,
      Math.round((Number(row.netRunRate) || 0) * 1000) / 1000,
    ]),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  // NRR column: always 3 decimals, with a + for positive values.
  for (let r = 4; r < aoa.length; r += 1) {
    const cell = sheet[XLSX.utils.encode_cell({ r, c: 8 })];
    if (cell) cell.z = "+0.000;-0.000;0.000";
  }
  sheet["!cols"] = [{ wch: 5 }, { wch: 22 }, { wch: 9 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 10 }, { wch: 8 }, { wch: 9 }];
  sheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Points Table");
  const buffer = XLSX.write(book, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="mpl-points-table-${today}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
