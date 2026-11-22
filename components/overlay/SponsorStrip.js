"use client";

/* eslint-disable @next/next/no-img-element -- plain <img> renders identically
   inside OBS / PRISM web sources. */

import { useEffect, useState } from "react";

const ROTATE_MS = 6000;
// Logo links are signed for an hour; refresh the list well before that.
const REFRESH_MS = 30 * 60 * 1000;

// Top-right corner: fades through the league's sponsors (logo only, no panel
// behind it), highest tier first (the order GET /api/sponsors
// returns). Hidden with ?sponsors=off or when there are none. A failed
// refresh keeps the current list.
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
      key={sponsor.id}
      className="ovl-sponsor-in absolute flex w-[340px] flex-col items-center"
      style={{ right: params.width * 0.05, top: params.height * 0.05 }}
      data-sponsor={sponsor.id}
    >
      <div className="grid h-[110px] w-full place-items-center">
        <img
          src={sponsor.logo}
          alt={sponsor.name}
          className="max-h-[110px] max-w-[320px] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)]"
          onError={() => setBroken((prev) => new Set(prev).add(sponsor.id))}
        />
      </div>
    </div>
  );
}
