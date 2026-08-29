"use client";

import { useEffect, useState } from "react";

function SponsorCard({ sponsor }) {
  return (
    <div className="flex h-64 w-44 shrink-0 flex-col items-center gap-3 rounded-lg border border-ink/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel sm:w-52">
      <div className="flex h-28 w-full items-center justify-center">
        {sponsor.logo ? (
          <img src={sponsor.logo} alt={sponsor.name} className="max-h-28 w-auto object-contain" />
        ) : (
          <span className="text-center text-sm font-bold uppercase tracking-wide text-ink/70">
            {sponsor.name}
          </span>
        )}
      </div>
      <p className="line-clamp-1 text-center text-[0.95rem] font-black text-green-dark">{sponsor.name}</p>
      <a
        href={sponsor.url || "#"}
        target="_blank"
        rel="noreferrer"
        className="mt-auto inline-flex min-h-[38px] items-center justify-center rounded-lg bg-green px-4 text-[0.8rem] font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-green-dark"
      >
        Visit
      </a>
    </div>
  );
}

export default function SponsorsSection() {
  const [sponsors, setSponsors] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/sponsors", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSponsors(data.sponsors || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!sponsors.length) return null;

  // The marquee works by rendering the list twice and scrolling exactly
  // halfway, so it loops seamlessly. With only a few sponsors that just
  // looks like duplicates sitting side by side, so only loop once there
  // are enough of them to actually need scrolling.
  const shouldLoop = sponsors.length > 5;

  return (
    <section id="sponsors" className="py-16 sm:py-[84px]">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <div className="mb-8 flex flex-col gap-6 sm:mb-[34px] sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-[680px] text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98]">
            Our Sponsors
          </h2>
          <p className="max-w-[440px] font-semibold text-muted">
            Proud partners powering the Maneri Premier League.
          </p>
        </div>

        {!shouldLoop ? (
          <div className="flex flex-wrap items-stretch justify-center gap-6">
            {sponsors.map((sponsor) => (
              <SponsorCard key={sponsor.id} sponsor={sponsor} />
            ))}
          </div>
        ) : null}
      </div>

      {shouldLoop ? (
        <div className="group overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <div className="flex w-max animate-marquee items-stretch gap-6 group-hover:[animation-play-state:paused]">
            {[...sponsors, ...sponsors].map((sponsor, index) => (
              <SponsorCard key={`${sponsor.id}-${index}`} sponsor={sponsor} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
