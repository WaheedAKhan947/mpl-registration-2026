"use client";

/* eslint-disable @next/next/no-img-element -- plain <img> renders identically
   inside OBS / PRISM web sources. */

import { useEffect, useState } from "react";
import { SPONSOR_TIER_LABELS } from "@/lib/sponsorTiers";

const ROTATE_MS = 6000;
// Logo links are signed for an hour; refresh the list well before that.
const REFRESH_MS = 30 * 60 * 1000;

// A small corner panel that fades through the league's sponsors, highest tier
// first (the order GET /api/sponsors returns). Hidden with ?sponsors=off or
// when there are none. A failed refresh keeps the current list.
export default function SponsorStrip({ params }) {
  const [sponsors, setSponsors] = useState([]);
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState(() => new Set());

  useEffect(() => {
    let stopped = false;
    async function load() {
      try {
        const res = await fetch("/api/sponsors", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const list = (data.sponsors || []).filter((s) => s.logo);
        if (!stopped) {
          setSponsors(list);
          setBroken(new Set());
        }
      } catch {
        // Keep the current list; try again on the next refresh.
      }
    }
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, []);

  const shown = sponsors.filter((s) => !broken.has(s.id));

  useEffect(() => {
    if (shown.length < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => i + 1), ROTATE_MS);
    return () => clearInterval(timer);
  }, [shown.length]);

  if (!params.sponsors || !shown.length) return null;
  const sponsor = shown[index % shown.length];
  return (
    <div
      className="absolute flex w-[340px] flex-col items-center rounded-2xl bg-white/95 px-4 pb-3 pt-2 shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
      style={{ right: params.width * 0.05, top: params.height * 0.05 }}
      data-sponsor={sponsor.id}
    >
      <span className="text-[14px] font-black uppercase tracking-[0.22em] text-[#0b6b3a]">
        {SPONSOR_TIER_LABELS[sponsor.category] || "Sponsor"}
      </span>
      <div key={sponsor.id} className="ovl-sponsor-in mt-1 grid h-[96px] w-full place-items-center">
        <img
          src={sponsor.logo}
          alt={sponsor.name}
          className="max-h-[96px] max-w-[300px] object-contain"
          onError={() => setBroken((prev) => new Set(prev).add(sponsor.id))}
        />
      </div>
      <span className="mt-1 max-w-full truncate text-[16px] font-extrabold uppercase tracking-wide text-[#060f22]">{sponsor.name}</span>
    </div>
  );
}
