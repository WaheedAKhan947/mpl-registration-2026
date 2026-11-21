"use client";

/* eslint-disable @next/next/no-img-element -- html-to-image captures plain <img>. */

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import Panel from "@/components/admin/Panel";
import Notice from "@/components/admin/Notice";
import { formatMatchDate, teamLogo, todayInLeagueTimeZone } from "@/lib/matches";

// Admin > Points Table: download the table as it appears on the website,
// as an Excel file or as a 1080x1080 image for social media.

const SIZE = 1080;

async function toDataUrl(url) {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error("Could not load image.");
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(blob);
  });
}

function waitForImages(node) {
  return Promise.all(
    Array.from(node.querySelectorAll("img")).map((img) =>
      img.complete ? Promise.resolve() : new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      })
    )
  );
}

export function nrrText(value) {
  const n = Math.round((Number(value) || 0) * 1000) / 1000;
  return `${n > 0 ? "+" : ""}${n.toFixed(3)}`;
}

// The image itself: league crest, title, date and the table.
function StandingsGraphic({ rows, logos, crest, date }) {
  const cols = ["M", "W", "L", "T", "NR", "P", "NRR"];
  return (
    <div
      style={{
        width: SIZE,
        height: SIZE,
        background: "linear-gradient(160deg, #0b1c3d 0%, #060f22 55%, #06301c 100%)",
        color: "#fff",
        fontFamily: "inherit",
        padding: 64,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {crest ? <img src={crest} alt="" width={150} height={150} style={{ width: 150, height: 150, objectFit: "contain" }} /> : null}
        <div>
          <div style={{ color: "#f4b63d", fontSize: 26, fontWeight: 900, letterSpacing: "0.2em" }}>MANERI PREMIER LEAGUE</div>
          <div className="font-display" style={{ fontSize: 92, lineHeight: 1, letterSpacing: "0.03em" }}>
            POINTS TABLE
          </div>
          <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Season 2026 · Updated {date}</div>
        </div>
      </div>

      <div style={{ marginTop: 44, flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "60px 1fr repeat(5, 62px) 78px 130px",
            alignItems: "center",
            padding: "0 22px 14px",
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <span>#</span>
          <span>TEAM</span>
          {cols.map((c) => (
            <span key={c} style={{ textAlign: "right" }}>
              {c}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((row, i) => (
            <div
              key={row.team}
              style={{
                display: "grid",
                gridTemplateColumns: "60px 1fr repeat(5, 62px) 78px 130px",
                alignItems: "center",
                padding: "14px 22px",
                borderRadius: 18,
                background: i < 4 ? "rgba(244,182,61,0.13)" : "rgba(255,255,255,0.06)",
                border: i < 4 ? "2px solid rgba(244,182,61,0.45)" : "2px solid rgba(255,255,255,0.08)",
                fontSize: 30,
                fontWeight: 800,
              }}
            >
              <span style={{ color: "#f4b63d", fontWeight: 900 }}>{i + 1}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
                {logos[row.team] ? <img src={logos[row.team]} alt="" width={58} height={58} style={{ width: 58, height: 58, objectFit: "contain" }} /> : null}
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.team}</span>
              </span>
              {[row.played, row.won, row.lost, row.tied, row.noResult].map((v, k) => (
                <span key={k} style={{ textAlign: "right", color: "rgba(255,255,255,0.85)" }}>
                  {v}
                </span>
              ))}
              <span style={{ textAlign: "right", color: "#f4b63d", fontWeight: 900 }}>{row.points}</span>
              <span style={{ textAlign: "right", color: Number(row.netRunRate) >= 0 ? "#8df0a8" : "#ff8a80" }}>{nrrText(row.netRunRate)}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.55)", display: "flex", justifyContent: "space-between" }}>
        <span>Win 2 · Tie 1 · No result 1 · Top 4 highlighted</span>
        <span>maneripremierleague@gmail.com</span>
      </div>
    </div>
  );
}

export default function PointsTableDownload() {
  const graphicRef = useRef(null);
  const [graphic, setGraphic] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function downloadImage() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/points-table", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load the points table.");
      const rows = data.rows || [];
      if (!rows.length) throw new Error("The points table is empty.");
      const logos = {};
      await Promise.all(
        rows.map(async (row) => {
          const src = teamLogo(row.team);
          if (src) logos[row.team] = await toDataUrl(src).catch(() => null);
        })
      );
      const crest = await toDataUrl("/logo.png").catch(() => null);
      const today = todayInLeagueTimeZone();
      flushSync(() => setGraphic({ rows, logos, crest, date: formatMatchDate(today, { withYear: true }) }));
      await waitForImages(graphicRef.current);
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(graphicRef.current, { width: SIZE, height: SIZE, pixelRatio: 1 });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `mpl-points-table-${today}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(err?.message || "Could not create the image.");
    } finally {
      setGraphic(null);
      setBusy(false);
    }
  }

  return (
    <Panel title="Download points table" description="The table as it appears on the website. NRR to 3 decimal places.">
      <div className="flex flex-wrap gap-3">
        <a
          href="/api/admin/points-table/export"
          className="inline-flex min-h-[42px] items-center rounded-lg bg-green px-4 text-sm font-extrabold text-white transition hover:bg-green-dark"
        >
          Excel (.xlsx)
        </a>
        <button
          type="button"
          onClick={downloadImage}
          disabled={busy}
          className="inline-flex min-h-[42px] items-center rounded-lg border border-ink/15 bg-white px-4 text-sm font-extrabold text-green-dark transition hover:bg-green/5 disabled:opacity-60"
        >
          {busy ? "Creating image..." : "Image for social media (.png)"}
        </button>
      </div>
      {error ? (
        <Notice tone="error" className="mt-3">
          {error}
        </Notice>
      ) : null}
      {graphic ? (
        <div aria-hidden="true" style={{ position: "fixed", left: -20000, top: 0, pointerEvents: "none" }}>
          <div ref={graphicRef}>
            <StandingsGraphic {...graphic} />
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
