"use client";

import { useEffect, useState } from "react";

const COLUMNS = ["#", "Team", "M", "W", "L", "T", "NR", "P", "NRR"];

export default function PointsTableSection() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/points-table", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setRows(data.rows || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!rows.length) return null;

  return (
    <section id="points-table" className="py-16 sm:py-[84px]">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <div className="mb-8 flex flex-col gap-6 sm:mb-[34px] sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-[680px] text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98]">
            Points Table
          </h2>
          <p className="max-w-[440px] font-semibold text-muted">
            Current standings for the Maneri Premier League season.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white shadow-panel">
          <table className="w-full min-w-[620px] border-collapse text-[0.9rem]">
            <thead>
              <tr className="bg-gold">
                {COLUMNS.map((heading) => (
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
                      {row.netRunRate}
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
