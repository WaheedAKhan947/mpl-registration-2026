"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Footer() {
  const [year, setYear] = useState(2026);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t-2 border-gold/70 bg-navy-dark py-[34px] text-white/75">
      <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="MPL logo" width={36} height={36} />
          <strong className="text-white">Maneri Premier League</strong>
        </div>
        <span className="text-gold/90">&copy; {year} MPL</span>
      </div>
    </footer>
  );
}
