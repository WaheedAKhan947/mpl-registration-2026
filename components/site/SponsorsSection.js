"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { SPONSOR_TIERS } from "@/lib/sponsorTiers";

const AVATAR_COLORS = [
  "bg-navy-dark text-gold",
  "bg-gold text-navy-dark",
  "bg-brand-red text-white",
  "bg-ember text-white",
];

// Each tier is a centered, wrapping row of cards, so any number of sponsors
// stays visible and incomplete rows sit in the middle. Higher tiers get bigger
// cards and fewer per row so the ranking is visible at a glance.
// Widths subtract each card's share of the gap: gap-4 (16px) on phones,
// gap-6 (24px) from sm.
const LARGE = {
  // 1 per row on phones, 2 from sm.
  width: "w-full max-w-[520px] sm:w-[calc(50%-12px)]",
  cardHeight: "h-[340px] sm:h-[400px] lg:h-[440px]",
  initialsSize: "text-6xl sm:text-7xl",
  logoPad: "p-8 pb-28 sm:p-10 sm:pb-28",
  compact: false,
};
const MEDIUM = {
  // 1 per row on phones, 2 from sm, 3 from lg.
  width: "w-full max-w-[400px] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]",
  cardHeight: "h-[320px] sm:h-[360px]",
  initialsSize: "text-6xl",
  logoPad: "p-8 pb-28",
  compact: false,
};
const SMALL = {
  // 2 per row on phones, 3 from sm, 4 from lg.
  width: "w-[calc(50%-8px)] max-w-[300px] sm:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)]",
  cardHeight: "h-[230px] sm:h-[280px]",
  initialsSize: "text-4xl sm:text-5xl",
  logoPad: "p-4 pb-[92px] sm:p-6 sm:pb-24",
  compact: true,
};

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
    ...MEDIUM,
    chip: "bg-gradient-to-r from-[#f7d774] via-gold to-[#d99a1e] text-navy-dark ring-1 ring-gold/60",
  },
  official: {
    ...SMALL,
    chip: "bg-gradient-to-r from-[#0f5a24] via-[#1f8a3a] to-[#4cc36a] text-white ring-1 ring-[#1f8a3a]/60",
  },
  sports: {
    ...SMALL,
    chip: "bg-gradient-to-r from-[#b3261e] via-brand-red to-ember text-white ring-1 ring-brand-red/60",
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
  const compact = tierStyle.compact;
  return (
    <article
      className={`group relative w-full overflow-hidden rounded-2xl bg-white shadow-[0_14px_42px_rgba(6,66,39,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-panel-navy hover:ring-2 hover:ring-gold/40 ${tierStyle.cardHeight}`}
    >
      {sponsor.logo ? (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-white transition-transform duration-700 ease-out group-hover:scale-105 ${tierStyle.logoPad}`}
        >
          <img src={sponsor.logo} alt={sponsor.name} className="max-h-full max-w-full object-contain" />
        </div>
      ) : (
        <div
          className={`absolute inset-0 grid place-items-center pb-20 font-black transition-transform duration-700 ease-out group-hover:scale-110 ${tierStyle.initialsSize} ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
        >
          {initials(sponsor.name)}
        </div>
      )}
      <div
        className={`absolute inset-x-0 bottom-0 border-t-[3px] border-gold bg-gradient-to-r from-green-dark to-green text-center ${
          compact ? "p-3 sm:p-4" : "p-5"
        }`}
      >
        <h3
          className={`line-clamp-1 leading-[1.15] text-white ${
            compact ? "mb-2 text-[0.92rem] sm:text-[1.02rem]" : "mb-3 text-[1.15rem]"
          }`}
          title={sponsor.name}
        >
          {sponsor.name}
        </h3>
        {sponsor.url ? (
          <a
            href={sponsor.url}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center justify-center rounded-full bg-gold font-black uppercase text-navy-dark shadow transition hover:-translate-y-0.5 ${
              compact ? "min-h-[32px] px-3.5 text-[0.7rem] sm:min-h-[34px] sm:text-[0.75rem]" : "min-h-[38px] px-4 text-[0.8rem]"
            }`}
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
        <div className="mx-auto mb-10 flex max-w-3xl flex-col items-center text-center sm:mb-12">
          <h2 className="text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98]">{t("sponsors.heading")}</h2>
          <p className="mt-4 max-w-[520px] font-semibold text-muted">{t("sponsors.subtitle")}</p>
        </div>

        <div className="grid gap-12 sm:gap-14">
          {groups.map(({ tier, sponsors: tierSponsors }) => {
            const tierStyle = TIER_STYLES[tier] || TIER_STYLES.silver;
            const tierLabel = t(`sponsors.tiers.${tier}`);
            return (
              <div key={tier} role="group" aria-label={tierLabel}>
                <div className="mb-6 flex items-center gap-3 sm:gap-4">
                  <span className="h-px flex-1 bg-ink/10" aria-hidden="true" />
                  <h3
                    className={`inline-flex shrink-0 rounded-full px-4 py-1.5 text-[0.72rem] font-black uppercase tracking-[0.14em] shadow-sm sm:text-[0.8rem] ${tierStyle.chip}`}
                  >
                    {tierLabel}
                  </h3>
                  <span className="h-px flex-1 bg-ink/10" aria-hidden="true" />
                </div>
                <ul className="flex flex-wrap justify-center gap-4 sm:gap-6">
                  {tierSponsors.map((sponsor, index) => (
                    <li key={sponsor.id} className={tierStyle.width}>
                      <SponsorCard
                        sponsor={sponsor}
                        index={index}
                        visitLabel={t("sponsors.visit")}
                        tierStyle={tierStyle}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
