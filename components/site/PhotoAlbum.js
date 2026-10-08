"use client";

import { useCallback, useEffect } from "react";

// Shared by the Brand Ambassadors and Sponsors sections: a bento-style photo
// grid (1-6 photos), a full-screen photo viewer, and a "View Album" button.

export const MAX_ALBUM_PHOTOS = 6;

// Tile layouts keyed by photo count. Each entry has the grid classes and one
// class string per tile. On phones every album is a 2-column grid with the
// first photo full width; from `sm` up each count gets its own centered
// arrangement. Class names are written out in full so Tailwind can see them.
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
    tiles: ["col-span-2 row-span-2", "col-span-2", "", ""],
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

// Full-screen photo viewer with arrows, keyboard support, and a thumbnail strip.
export function PhotoLightbox({ name, images, index, onChange, onClose, t }) {
  const total = images.length;
  const current = Math.min(index, total - 1);
  const go = useCallback((step) => onChange((current + step + total) % total), [current, total, onChange]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        // Close only the viewer, not a full-screen panel underneath it.
        event.stopImmediatePropagation();
        onClose();
      }
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    }
    // Capture phase so this runs before listeners on panels beneath it.
    document.addEventListener("keydown", handleKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [go, onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={name} className="fixed inset-0 z-[70] flex flex-col bg-[#04140c]" onClick={onClose}>
      <div className="flex items-center justify-between gap-4 px-4 py-3 text-white sm:px-6" dir="ltr">
        <p className="min-w-0 truncate text-sm font-bold">
          {name}
          <span className="ml-3 font-semibold text-white/60">{t("album.photoPosition", { n: current + 1, total })}</span>
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("album.close")}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-xl transition hover:bg-gold hover:text-navy-dark"
        >
          ✕
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20" dir="ltr">
        <img
          key={images[current]}
          src={images[current]}
          alt={t("album.photoAlt", { name, n: current + 1 })}
          onClick={(event) => event.stopPropagation()}
          className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
        />
        {total > 1 ? (
          <>
            <button
              type="button"
              aria-label={t("album.previous")}
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
              aria-label={t("album.next")}
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
          {images.map((src, thumbIndex) => (
            <button
              key={src}
              type="button"
              onClick={() => onChange(thumbIndex)}
              aria-label={t("album.openPhoto", { n: thumbIndex + 1 })}
              aria-current={thumbIndex === current}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-16 sm:w-16 ${
                thumbIndex === current ? "border-gold" : "border-transparent opacity-60 hover:opacity-100"
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

// The bento grid of photos. `onOpen(index)` opens the viewer at that photo.
export function AlbumGrid({ name, images, onOpen, t, className = "" }) {
  const photos = images.slice(0, MAX_ALBUM_PHOTOS);
  if (!photos.length) return null;
  const layout = ALBUM_LAYOUTS[photos.length];

  return (
    <div className={`mx-auto grid w-full gap-3 sm:gap-4 ${layout.grid} ${className}`}>
      {photos.map((src, index) => (
        <AlbumTile
          key={src}
          src={src}
          alt={t("album.photoAlt", { name, n: index + 1 })}
          label={t("album.openPhoto", { n: index + 1 })}
          className={layout.tiles[index] || ""}
          single={photos.length === 1}
          onOpen={() => onOpen(index)}
        />
      ))}
    </div>
  );
}

export function ViewAlbumButton({ count, onClick, t, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-[44px] items-center gap-2.5 rounded-full border-2 border-navy-dark/15 bg-white px-5 text-[0.85rem] font-black uppercase tracking-[0.08em] text-navy-dark shadow-sm transition hover:-translate-y-0.5 hover:border-gold hover:bg-gold ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
      </svg>
      {t("album.viewAlbum")}
      <span className="text-navy-dark/60">· {count === 1 ? t("album.onePhoto") : t("album.photoCount", { n: count })}</span>
    </button>
  );
}
