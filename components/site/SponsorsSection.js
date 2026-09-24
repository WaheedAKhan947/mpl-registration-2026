"use client";

import { useEffect, useMemo, useState } from "react";
import Carousel from "@/components/ui/Carousel";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { SPONSOR_TIERS } from "@/lib/sponsorTiers";

const AVATAR_COLORS = [
  "bg-navy-dark text-gold",
  "bg-gold text-navy-dark",
  "bg-brand-red text-white",
  "bg-ember text-white",
];

// Higher tiers get bigger cards and fewer per row so the ranking is visible
// at a glance, not just from the label.
const LARGE = { cardHeight: "h-[440px]", initialsSize: "text-7xl", slideClassName: "w-[88%] sm:w-[48%] lg:w-[48%]" };
const MEDIUM = { cardHeight: "h-[380px]", initialsSize: "text-6xl", slideClassName: "w-[86%] sm:w-[46%] lg:w-[31%]" };
const SMALL = { cardHeight: "h-[300px]", initialsSize: "text-5xl", slideClassName: "w-[70%] sm:w-[31%] lg:w-[23%]" };

const TIER_STYLES = {
  diamond: {
    ...LARGE,
    chip: "bg-gradient-to-r from-[#0b3d91] via-[#1f7ae0] to-[#5cc8ff] text-white ring-1 ring-[#1f7ae0]/60",
  },
  platinum: {
    ...LARGE,
    chip: "bg-gradient-to-r from-[#e8ebef] via-white to-[#c9ced6] text-navy-dark ring-1 ring-[#b8bec8]",
  },
  gold: {
    chip: "bg-gradient-to-r from-[#f7d774] via-gold to-[#d99a1e] text-navy-dark ring-1 ring-gold/60",
    ...MEDIUM,
  },
  silver: {
    ...SMALL,
    chip: "bg-gradient-to-r from-[#f1f2f4] to-[#d7dade] text-[#3f4c45] ring-1 ring-[#c4c8ce]",
  },
  bronze: {
    ...SMALL,
    chip: "bg-gradient-to-r from-[#8a4b1c] via-[#c07a3a] to-[#e0a066] text-white ring-1 ring-[#a8612a]/60",
  },
  media: {
    ...SMALL,
    chip: "bg-gradient-to-r from-[#4b1d7a] via-[#7b3fc4] to-[#b07ae8] text-white ring-1 ring-[#7b3fc4]/60",
  },
  official: {
    ...SMALL,
    chip: "bg-gradient-to-r from-[#0f5a24] via-[#1f8a3a] to-[#4cc36a] text-white ring-1 ring-[#1f8a3a]/60",
  },
};

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SponsorCard({ sponsor, index, visitLabel, tierStyle }) {
  return (
    <article
      className={`group relative w-full overflow-hidden rounded-2xl shadow-[0_14px_42px_rgba(6,66,39,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-panel-navy hover:ring-2 hover:ring-gold/40 ${tierStyle.cardHeight}`}
    >
      {sponsor.logo ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white p-10 pb-28 transition-transform duration-700 ease-out group-hover:scale-105">
          <img src={sponsor.logo} alt={sponsor.name} className="max-h-full max-w-full object-contain" />
        </div>
      ) : (
        <div
          className={`absolute inset-0 grid place-items-center pb-20 font-black transition-transform duration-700 ease-out group-hover:scale-110 ${tierStyle.initialsSize} ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
        >
          {initials(sponsor.name)}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-[#700F0F] p-5">
        <h3 className="mb-3 line-clamp-1 text-[1.15rem] leading-[1.15] text-white">{sponsor.name}</h3>
        {sponsor.url ? (
          <a
            href={sponsor.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[38px] items-center justify-center rounded-full bg-gold px-4 text-[0.8rem] font-black uppercase text-navy-dark shadow transition hover:-translate-y-0.5"
          >
            {visitLabel}
          </a>
        ) : null}
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

  const groups = useMemo(
    () =>
      SPONSOR_TIERS.map((tier) => ({
        tier,
        sponsors: sponsors.filter((sponsor) => (sponsor.category || "silver") === tier),
      })).filter((group) => group.sponsors.length),
    [sponsors]
  );

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

        <div className="grid gap-12">
          {groups.map(({ tier, sponsors: tierSponsors }) => {
            const tierStyle = TIER_STYLES[tier];
            const tierLabel = t(`sponsors.tiers.${tier}`);
            return (
              <div key={tier}>
                <div className="mb-5 flex items-center gap-4">
                  <span
                    className={`inline-flex rounded-full px-4 py-1.5 text-[0.8rem] font-black uppercase tracking-[0.14em] shadow-sm ${tierStyle.chip}`}
                  >
                    {tierLabel}
                  </span>
                  <span className="h-px flex-1 bg-ink/10" aria-hidden="true" />
                </div>
                <Carousel
                  items={tierSponsors}
                  ariaLabel={`${t("sponsors.heading")}: ${tierLabel}`}
                  slideClassName={tierStyle.slideClassName}
                  renderItem={(sponsor, index) => (
                    <SponsorCard
                      sponsor={sponsor}
                      index={index}
                      visitLabel={t("sponsors.visit")}
                      tierStyle={tierStyle}
                    />
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
