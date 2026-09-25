"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Album tile layouts, keyed by photo count (1-6). Each entry has the grid
// classes and one class string per tile. On phones every album is a 2-column
// grid with the first photo full width; from `sm` up each count gets its own
// centered bento arrangement. Class names are written out in full so
// Tailwind can see them.
const ALBUM_LAYOUTS = {
  1: {
    grid: "max-w-3xl grid-cols-1 auto-rows-[220px] sm:auto-rows-[200px]",
    tiles: ["row-span-2"],
  },
  2: {
    grid: "max-w-4xl grid-cols-2 auto-rows-[150px] sm:auto-rows-[210px]",
    tiles: ["col-span-2 row-span-2 sm:col-span-1", "col-span-2 row-span-2 sm:col-span-1"],
  },
  3: {
    grid: "max-w-5xl grid-cols-2 auto-rows-[140px] sm:grid-cols-3 sm:auto-rows-[190px]",
    tiles: ["col-span-2 row-span-2", "", ""],
  },
  4: {
    grid: "max-w-5xl grid-cols-2 auto-rows-[140px] sm:grid-cols-4 sm:auto-rows-[190px]",
    tiles: ["col-span-2 row-span-2", "sm:col-span-2", "", ""],
  },
  5: {
    // Large photo in the middle, two on each side.
    grid: "max-w-6xl grid-cols-2 auto-rows-[140px] sm:grid-cols-4 sm:auto-rows-[190px]",
    tiles: [
      "col-span-2 row-span-2 sm:col-start-2 sm:row-start-1",
      "sm:col-start-1 sm:row-start-1",
      "sm:col-start-1 sm:row-start-2",
      "sm:col-start-4 sm:row-start-1",
      "sm:col-start-4 sm:row-start-2",
    ],
  },
  6: {
    // Large photo top-left, two stacked beside it, three along the bottom.
    grid: "max-w-5xl grid-cols-2 auto-rows-[140px] sm:grid-cols-3 sm:auto-rows-[180px]",
    tiles: ["col-span-2 row-span-2", "", "", "", "", "col-span-2 sm:col-span-1"],
  },
};

function ChevronIcon({ direction, className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {direction === "left" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}

function Lightbox({ ambassador, index, onChange, onClose, t }) {
  const total = ambassador.images.length;
  const go = useCallback((step) => onChange((index + step + total) % total), [index, total, onChange]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    }
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [go, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ambassador.name}
      className="fixed inset-0 z-[60] flex flex-col bg-[#04140c]"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 text-white sm:px-6" dir="ltr">
        <p className="min-w-0 truncate text-sm font-bold">
          {ambassador.name}
          <span className="ml-3 font-semibold text-white/60">
            {t("ambassadors.photoPosition", { n: index + 1, total })}
          </span>
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("ambassadors.close")}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-xl transition hover:bg-gold hover:text-navy-dark"
        >
          ✕
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20" dir="ltr">
        <img
          key={ambassador.images[index]}
          src={ambassador.images[index]}
          alt={t("ambassadors.photoAlt", { name: ambassador.name, n: index + 1 })}
          onClick={(event) => event.stopPropagation()}
          className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
        />
        {total > 1 ? (
          <>
            <button
              type="button"
              aria-label={t("ambassadors.previous")}
              onClick={(event) => {
                event.stopPropagation();
                go(-1);
              }}
              className="absolute left-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-gold hover:text-navy-dark sm:left-5"
            >
              <ChevronIcon direction="left" />
            </button>
            <button
              type="button"
              aria-label={t("ambassadors.next")}
              onClick={(event) => {
                event.stopPropagation();
                go(1);
              }}
              className="absolute right-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-gold hover:text-navy-dark sm:right-5"
            >
              <ChevronIcon direction="right" />
            </button>
          </>
        ) : null}
      </div>

      {total > 1 ? (
        <div className="flex justify-center gap-2 overflow-x-auto px-4 py-4" dir="ltr" onClick={(event) => event.stopPropagation()}>
          {ambassador.images.map((src, thumbIndex) => (
            <button
              key={src}
              type="button"
              onClick={() => onChange(thumbIndex)}
              aria-label={t("ambassadors.openPhoto", { n: thumbIndex + 1 })}
              aria-current={thumbIndex === index}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-16 sm:w-16 ${
                thumbIndex === index ? "border-gold" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <div className="h-6" />
      )}
    </div>
  );
}

function AlbumTile({ src, alt, label, className, single, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className={`group relative overflow-hidden rounded-2xl bg-navy-dark shadow-[0_14px_42px_rgba(6,66,39,0.12)] ring-1 ring-ink/5 transition duration-300 hover:-translate-y-1 hover:shadow-panel-navy hover:ring-2 hover:ring-gold/50 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 ${className}`}
    >
      {single ? (
        // A lone image is often a logo, so show all of it over a blurred copy.
        <>
          <img src={src} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl" />
          <img
            src={src}
            alt={alt}
            className="absolute inset-0 h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </>
      ) : (
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-navy-dark/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className="absolute bottom-3 right-3 grid h-9 w-9 scale-75 place-items-center rounded-full bg-gold text-navy-dark opacity-0 shadow transition duration-300 group-hover:scale-100 group-hover:opacity-100">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
      </span>
    </button>
  );
}

function AmbassadorSpotlight({ ambassador, t, onOpen }) {
  const images = ambassador.images.slice(0, 6);
  const layout = ALBUM_LAYOUTS[images.length] || ALBUM_LAYOUTS[6];

  return (
    <div className="flex flex-col items-center text-center">
      <span className="mb-4 inline-flex rounded-full bg-gold px-3 py-1.5 text-[0.72rem] font-black uppercase tracking-[0.12em] text-navy-dark shadow">
        {t("ambassadors.badge")}
      </span>
      <h3 className="text-[clamp(1.9rem,4.5vw,3.2rem)] uppercase leading-[1] text-navy-dark">{ambassador.name}</h3>
      <span className="my-5 h-1 w-16 rounded-full bg-gold" aria-hidden="true" />
      <p className="max-w-2xl whitespace-pre-line text-[1.05rem] font-medium leading-relaxed text-muted">
        {ambassador.details}
      </p>

      <div className={`mx-auto mt-10 grid w-full gap-3 sm:gap-4 ${layout.grid}`}>
        {images.map((src, index) => (
          <AlbumTile
            key={src}
            src={src}
            alt={t("ambassadors.photoAlt", { name: ambassador.name, n: index + 1 })}
            label={t("ambassadors.openPhoto", { n: index + 1 })}
            className={layout.tiles[index] || ""}
            single={images.length === 1}
            onOpen={() => onOpen(index)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => onOpen(0)}
        className="mt-8 inline-flex min-h-[44px] items-center gap-2.5 rounded-full border-2 border-navy-dark/15 bg-white px-5 text-[0.85rem] font-black uppercase tracking-[0.08em] text-navy-dark shadow-sm transition hover:-translate-y-0.5 hover:border-gold hover:bg-gold"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
        </svg>
        {t("ambassadors.viewAlbum")}
        <span className="text-navy-dark/60">
          · {images.length === 1 ? t("ambassadors.onePhoto") : t("ambassadors.photoCount", { n: images.length })}
        </span>
      </button>
    </div>
  );
}

export default function BrandAmbassadorsSection() {
  const { lang, t } = useLanguage();
  const [ambassadors, setAmbassadors] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/brand-ambassadors", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setAmbassadors(data.ambassadors || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Show the Urdu details when the site is in Urdu and a translation exists.
  const localized = useMemo(
    () =>
      ambassadors.map((ambassador) => ({
        ...ambassador,
        details: lang === "ur" && ambassador.detailsUr ? ambassador.detailsUr : ambassador.details,
      })),
    [ambassadors, lang]
  );

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  if (!localized.length) return null;

  const active = localized.find((ambassador) => ambassador.id === activeId) || localized[0];

  return (
    <section id="ambassadors" className="relative overflow-hidden py-16 sm:py-[84px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-24 -z-10 h-[520px] w-[min(900px,90vw)] -translate-x-1/2 rounded-full bg-gold/15 blur-3xl"
      />
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <div className="mx-auto mb-10 flex max-w-3xl flex-col items-center text-center sm:mb-12">
          <p className="mb-3 text-[0.8rem] font-black uppercase tracking-[0.2em] text-green">{t("ambassadors.eyebrow")}</p>
          <h2 className="text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98]">{t("ambassadors.heading")}</h2>
          <p className="mt-4 max-w-[520px] font-semibold text-muted">{t("ambassadors.subtitle")}</p>
        </div>

        {localized.length > 1 ? (
          <div className="mb-10 flex flex-wrap justify-center gap-2" role="tablist" aria-label={t("ambassadors.ariaLabel")}>
            {localized.map((ambassador) => {
              const selected = ambassador.id === active.id;
              return (
                <button
                  key={ambassador.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setActiveId(ambassador.id);
                    setLightboxIndex(null);
                  }}
                  className={`inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-bold transition ${
                    selected
                      ? "bg-navy-dark text-white shadow-panel-navy"
                      : "bg-white text-navy-dark ring-1 ring-ink/10 hover:ring-gold"
                  }`}
                >
                  <img src={ambassador.images[0]} alt="" className="h-8 w-8 rounded-full object-cover" />
                  {ambassador.name}
                </button>
              );
            })}
          </div>
        ) : null}

        <AmbassadorSpotlight key={active.id} ambassador={active} t={t} onOpen={setLightboxIndex} />
      </div>

      {lightboxIndex !== null ? (
        <Lightbox
          ambassador={active}
          index={Math.min(lightboxIndex, active.images.length - 1)}
          onChange={setLightboxIndex}
          onClose={closeLightbox}
          t={t}
        />
      ) : null}
    </section>
  );
}
