"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { RESULTS_UPDATED_EVENT } from "@/components/site/ScorecardSection";

// Standings change the moment a scored match is finished, so keep them fresh
// while the page is open: refetch whenever the scorecard sees a result
// change, and every 30 seconds as a fallback.
const REFRESH_MS = 30 * 1000;

export default function PointsTableSection() {
  const [rows, setRows] = useState([]);
  const { t } = useLanguage();
  const columns = ["#", t("pointsTable.colTeam"), "M", "W", "L", "T", "NR", "P", "NRR"];

  useEffect(() => {
    let cancelled = false;

    function load() {
      fetch("/api/points-table", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled && Array.isArray(data.rows)) setRows(data.rows);
        })
        .catch(() => {});
    }

    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    window.addEventListener(RESULTS_UPDATED_EVENT, load);
    document.addEventListener("visibilitychange", load);

    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener(RESULTS_UPDATED_EVENT, load);
      document.removeEventListener("visibilitychange", load);
    };
  }, []);

  if (!rows.length) return null;

  return (
    <section id="points-table" className="py-16 sm:py-[84px]">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <div className="mb-8 flex flex-col gap-6 sm:mb-[34px] sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-[680px] text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98]">
            {t("pointsTable.heading")}
          </h2>
          <p className="max-w-[440px] font-semibold text-muted">{t("pointsTable.subtitle")}</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white shadow-panel">
          <table className="w-full min-w-[620px] border-collapse text-[0.9rem]">
            <thead>
              <tr className="bg-gold">
                {columns.map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-3.5 py-3 text-left font-black uppercase tracking-wide text-navy-dark first:pl-5 last:pr-5"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const rank = index + 1;
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-ink/10 last:border-0 ${
                      rank === 1 ? "bg-[#fbf1d8]" : index % 2 ? "bg-paper/60" : "bg-white"
                    }`}
                  >
                    <td className="whitespace-nowrap px-3.5 py-3 pl-5 font-bold text-muted">{rank}</td>
                    <td className="whitespace-nowrap px-3.5 py-3 font-black uppercase text-ink">{row.team}</td>
                    <td className="whitespace-nowrap px-3.5 py-3">{row.played}</td>
                    <td className="whitespace-nowrap px-3.5 py-3">{row.won}</td>
                    <td className="whitespace-nowrap px-3.5 py-3">{row.lost}</td>
                    <td className="whitespace-nowrap px-3.5 py-3">{row.tied}</td>
                    <td className="whitespace-nowrap px-3.5 py-3">{row.noResult}</td>
                    <td className="whitespace-nowrap px-3.5 py-3 font-black text-green-dark">{row.points}</td>
                    <td
                      className={`whitespace-nowrap px-3.5 py-3 pr-5 font-bold ${
                        row.netRunRate >= 0 ? "text-green-dark" : "text-brand-red"
                      }`}
                    >
                      {row.netRunRate > 0 ? "+" : ""}
                      {(Number(row.netRunRate) || 0).toFixed(3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
