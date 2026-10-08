"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { AlbumGrid, PhotoLightbox, ViewAlbumButton } from "@/components/site/PhotoAlbum";

function AmbassadorSpotlight({ ambassador, t, onOpen }) {
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
      <AlbumGrid name={ambassador.name} images={ambassador.images} onOpen={onOpen} t={t} className="mt-10" />
      <ViewAlbumButton count={Math.min(ambassador.images.length, 6)} onClick={() => onOpen(0)} t={t} className="mt-8" />
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
        <PhotoLightbox
          name={active.name}
          images={active.images}
          index={lightboxIndex}
          onChange={setLightboxIndex}
          onClose={closeLightbox}
          t={t}
        />
      ) : null}
    </section>
  );
}
