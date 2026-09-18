"use client";

import { useEffect, useState } from "react";
import Carousel from "@/components/ui/Carousel";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const AVATAR_COLORS = [
  "bg-navy-dark text-gold",
  "bg-gold text-navy-dark",
  "bg-brand-red text-white",
  "bg-ember text-white",
];

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SponsorCard({ sponsor, index, visitLabel }) {
  return (
    <article className="group relative h-[420px] w-full overflow-hidden rounded-2xl shadow-[0_14px_42px_rgba(6,66,39,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-panel-navy hover:ring-2 hover:ring-gold/40">
      {sponsor.logo ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white p-10 transition-transform duration-700 ease-out group-hover:scale-105">
          <img src={sponsor.logo} alt={sponsor.name} className="max-h-full max-w-full object-contain" />
        </div>
      ) : (
        <div
          className={`absolute inset-0 grid place-items-center text-6xl font-black transition-transform duration-700 ease-out group-hover:scale-110 ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
        >
          {initials(sponsor.name)}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-[#700F0F] p-5">
        <h3 className="mb-3 line-clamp-1 text-[1.15rem] leading-[1.15] text-white">{sponsor.name}</h3>
        <a
          href={sponsor.url || "#"}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[38px] items-center justify-center rounded-full bg-gold px-4 text-[0.8rem] font-black uppercase text-navy-dark shadow transition hover:-translate-y-0.5"
        >
          {visitLabel}
        </a>
      </div>
    </article>
  );
}

export default function SponsorsSection() {
  const [sponsors, setSponsors] = useState([]);
  const { t } = useLanguage();

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

  return (
    <section id="sponsors" className="py-16 sm:py-[84px]">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <div className="mb-8 flex flex-col gap-6 sm:mb-[34px] sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-[680px] text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98]">
            {t("sponsors.heading")}
          </h2>
          <p className="max-w-[440px] font-semibold text-muted">{t("sponsors.subtitle")}</p>
        </div>
        <Carousel
          items={sponsors}
          ariaLabel={t("sponsors.heading")}
          slideClassName="w-[86%] sm:w-[46%] lg:w-[31%]"
          renderItem={(sponsor, index) => (
            <SponsorCard sponsor={sponsor} index={index} visitLabel={t("sponsors.visit")} />
          )}
        />
      </div>
    </section>
  );
}
