"use client";

import { useEffect, useState } from "react";

export default function Footer() {
  const [year, setYear] = useState(2026);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-[#081a10] py-[34px] text-white/75">
      <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] flex-wrap items-center justify-between gap-4">
        <strong className="text-white">Maneri Premier League</strong>
        <span>&copy; {year} MPL</span>
      </div>
    </footer>
  );
}
