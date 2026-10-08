"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { SPONSOR_TIERS } from "@/lib/sponsorTiers";
import { AlbumGrid, MAX_ALBUM_PHOTOS, PhotoLightbox, ViewAlbumButton } from "@/components/site/PhotoAlbum";

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
  cardHeight: "h-[400px] sm:h-[440px] lg:h-[470px]",
  initialsSize: "text-6xl sm:text-7xl",
  logoPad: "p-7 sm:p-9",
  nameSize: "line-clamp-1 text-[1.7rem] sm:text-[2.1rem]",
  infoPad: "px-5 pb-6 pt-5",
  compact: false,
};
const MEDIUM = {
  // 1 per row on phones, 2 from sm, 3 from lg.
  width: "w-full max-w-[400px] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]",
  cardHeight: "h-[370px] sm:h-[390px]",
  initialsSize: "text-6xl",
  logoPad: "p-7",
  nameSize: "line-clamp-1 text-[1.5rem] sm:text-[1.7rem]",
  infoPad: "px-5 pb-5 pt-4",
  compact: false,
};
const SMALL = {
  // 2 per row on phones, 3 from sm, 4 from lg.
  width: "w-[calc(50%-8px)] max-w-[300px] sm:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)]",
  cardHeight: "h-[300px] sm:h-[340px]",
  initialsSize: "text-4xl sm:text-5xl",
  logoPad: "p-4 sm:p-5",
  // Two lines on small cards so names are not cut short on phones.
  nameSize: "line-clamp-2 min-h-[2.1em] text-[1.05rem] sm:text-[1.25rem]",
  infoPad: "px-3 pb-4 pt-3 sm:px-4",
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

function ArrowIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function ExternalIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

function PhotosIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
    </svg>
  );
}

// A white card: logo on top, then the name and a clear "View Details" call to
// action. The whole card opens the full-screen view (an invisible button
// covers it); the website link sits above that button so it still works.
function SponsorCard({ sponsor, index, tierStyle, onOpen, t }) {
  const compact = tierStyle.compact;
  const photoCount = sponsor.images?.length || 0;
  const detailsLabel = compact ? t("sponsors.details") : t("sponsors.viewDetails");

  return (
    <article
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_14px_42px_rgba(6,66,39,0.08)] ring-1 ring-ink/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-panel-navy hover:ring-2 hover:ring-gold/60 ${tierStyle.cardHeight}`}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={t("sponsors.openSponsor", { name: sponsor.name })}
        className="absolute inset-0 z-[1] cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-gold/70"
      />

      {/* Logo area */}
      <div className={`relative flex min-h-0 flex-1 items-center justify-center overflow-hidden ${tierStyle.logoPad}`}>
        {sponsor.logo ? (
          <img
            src={sponsor.logo}
            alt={sponsor.name}
            className="max-h-full max-w-full object-contain transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <span
            className={`grid aspect-square w-[min(10rem,70%)] place-items-center rounded-full font-black transition-transform duration-700 ease-out group-hover:scale-105 ${tierStyle.initialsSize} ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
          >
            {initials(sponsor.name)}
          </span>
        )}

        {/* Light dim on hover; the Details button below also turns navy. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-navy-dark/0 transition duration-300 group-hover:bg-navy-dark/[0.04]"
        />

        {photoCount ? (
          <span className="pointer-events-none absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-navy-dark/85 px-2 py-1 text-[0.68rem] font-bold text-white shadow">
            <PhotosIcon />
            {photoCount}
          </span>
        ) : null}
      </div>

      {/* Name and actions */}
      <div className={`relative flex flex-col items-center border-t border-ink/[0.07] text-center ${tierStyle.infoPad}`}>
        <span className="absolute -top-[2px] left-1/2 h-[3px] w-12 -translate-x-1/2 rounded-full bg-gold" aria-hidden="true" />
        <h3
          className={`w-full uppercase leading-[1.05] text-navy-dark ${tierStyle.nameSize}`}
          title={sponsor.name}
        >
          {sponsor.name}
        </h3>

        <div className={`flex items-center justify-center gap-2 ${compact ? "mt-2.5" : "mt-4"}`}>
          {/* Visual only: the card-wide button above handles the click. */}
          <span
            className={`pointer-events-none inline-flex items-center gap-1.5 rounded-full bg-gold font-black uppercase text-navy-dark shadow transition duration-300 group-hover:bg-navy-dark group-hover:text-white ${
              compact ? "min-h-[34px] px-3.5 text-[0.7rem] sm:text-[0.74rem]" : "min-h-[42px] px-5 text-[0.8rem] tracking-[0.06em]"
            }`}
          >
            {detailsLabel}
            <ArrowIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180" />
          </span>
          {sponsor.url ? (
            <a
              href={sponsor.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`${t("sponsors.visitWebsite")}: ${sponsor.name}`}
              title={t("sponsors.visitWebsite")}
              className={`relative z-[2] inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-navy-dark/15 bg-white font-black uppercase text-navy-dark transition hover:border-gold hover:bg-gold ${
                compact ? "h-[34px] w-[34px]" : "min-h-[42px] px-4 text-[0.8rem]"
              }`}
            >
              {compact ? null : t("sponsors.visit")}
              <ExternalIcon />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

// Full-screen sponsor view: logo, category, name, details, website link, and
// photo album (which opens the shared full-screen photo viewer).
function SponsorDetail({ sponsor, onClose, t }) {
  const [photoIndex, setPhotoIndex] = useState(null);
  const tierStyle = TIER_STYLES[sponsor.category] || TIER_STYLES.silver;
  const images = (sponsor.images || []).slice(0, MAX_ALBUM_PHOTOS);
  const closePhoto = useCallback(() => setPhotoIndex(null), []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={sponsor.name} className="fixed inset-0 z-[60] overflow-y-auto bg-paper">
      <div className="sticky top-0 z-10 border-b border-ink/10 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-[min(1180px,calc(100%-32px))] items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-navy-dark transition hover:bg-ink/5"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 rtl:rotate-180" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
            {t("sponsors.back")}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("album.close")}
            className="grid h-10 w-10 place-items-center rounded-full bg-navy-dark text-lg text-white transition hover:bg-gold hover:text-navy-dark"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-10 -z-0 h-[420px] w-[min(900px,90vw)] -translate-x-1/2 rounded-full bg-gold/15 blur-3xl"
        />
        <div className="relative mx-auto flex w-[min(1180px,calc(100%-32px))] flex-col items-center py-10 text-center sm:py-14">
          <span
            className={`mb-6 inline-flex rounded-full px-4 py-1.5 text-[0.75rem] font-black uppercase tracking-[0.14em] shadow-sm ${tierStyle.chip}`}
          >
            {t(`sponsors.tier.${sponsor.category}`)}
          </span>

          <div className="mb-6 flex h-36 w-[min(320px,80vw)] items-center justify-center overflow-hidden rounded-2xl bg-white p-4 shadow-[0_14px_42px_rgba(6,66,39,0.12)] ring-1 ring-ink/5 sm:h-44">
            {sponsor.logo ? (
              <img src={sponsor.logo} alt={sponsor.name} className="h-full w-full object-contain" />
            ) : (
              <span className="text-5xl font-black text-navy-dark">{initials(sponsor.name)}</span>
            )}
          </div>

          <h2 className="max-w-4xl text-[clamp(1.9rem,5vw,3.6rem)] uppercase leading-[1] text-navy-dark">{sponsor.name}</h2>
          <span className="my-5 h-1 w-16 rounded-full bg-gold" aria-hidden="true" />

          {sponsor.details ? (
            <p className="max-w-2xl whitespace-pre-line text-[1.05rem] font-medium leading-relaxed text-muted">
              {sponsor.details}
            </p>
          ) : null}

          {sponsor.url ? (
            <a
              href={sponsor.url}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex min-h-[46px] items-center gap-2 rounded-full bg-gold px-6 text-[0.85rem] font-black uppercase tracking-[0.08em] text-navy-dark shadow transition hover:-translate-y-0.5"
            >
              {t("sponsors.visitWebsite")}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </a>
          ) : null}

          {images.length ? (
            <>
              <AlbumGrid name={sponsor.name} images={images} onOpen={setPhotoIndex} t={t} className="mt-12" />
              <ViewAlbumButton count={images.length} onClick={() => setPhotoIndex(0)} t={t} className="mt-8" />
            </>
          ) : null}
        </div>
      </div>

      {photoIndex !== null ? (
        <PhotoLightbox
          name={sponsor.name}
          images={images}
          index={photoIndex}
          onChange={setPhotoIndex}
          onClose={closePhoto}
          t={t}
        />
      ) : null}
    </div>
  );
}

export default function SponsorsSection() {
  const [sponsors, setSponsors] = useState([]);
  const [openId, setOpenId] = useState(null);
  const { lang, t } = useLanguage();

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

  // Show the Urdu details when the site is in Urdu and a translation exists.
  const localized = useMemo(
    () =>
      sponsors.map((sponsor) => ({
        ...sponsor,
        details: lang === "ur" && sponsor.detailsUr ? sponsor.detailsUr : sponsor.details || "",
      })),
    [sponsors, lang]
  );

  const groups = useMemo(
    () =>
      SPONSOR_TIERS.map((tier) => ({
        tier,
        sponsors: localized.filter((sponsor) => (sponsor.category || "silver") === tier),
      })).filter((group) => group.sponsors.length),
    [localized]
  );

  const closeDetail = useCallback(() => setOpenId(null), []);

  if (!localized.length) return null;

  const openSponsor = localized.find((sponsor) => sponsor.id === openId);

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
                        tierStyle={tierStyle}
                        onOpen={() => setOpenId(sponsor.id)}
                        t={t}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {openSponsor ? <SponsorDetail key={openSponsor.id} sponsor={openSponsor} onClose={closeDetail} t={t} /> : null}
    </section>
  );
}
