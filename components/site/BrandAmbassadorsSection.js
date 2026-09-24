"use client";

import { useEffect, useMemo, useState } from "react";
import Carousel from "@/components/ui/Carousel";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function AmbassadorCard({ ambassador, t }) {
  const [active, setActive] = useState(0);
  const images = ambassador.images;
  const current = Math.min(active, images.length - 1);

  return (
    <article className="group flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_14px_42px_rgba(6,66,39,0.08)] ring-1 ring-ink/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-panel-navy hover:ring-2 hover:ring-gold/40">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-navy-dark">
        {/* The whole image is always shown (logos must not be cropped); a
            blurred copy behind it fills the rest of the frame. */}
        {images.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              index === current ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={src}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl"
            />
            <img
              src={src}
              alt={t("ambassadors.photoAlt", { name: ambassador.name, n: index + 1 })}
              className="absolute inset-0 h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy-dark/80 to-transparent" />

        {images.length > 1 ? (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2 px-3">
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => setActive(index)}
                aria-label={t("ambassadors.showPhoto", { n: index + 1 })}
                aria-pressed={index === current}
                className={`h-12 w-12 overflow-hidden rounded-lg border-2 shadow transition hover:-translate-y-0.5 ${
                  index === current ? "border-gold" : "border-white/70 opacity-80 hover:opacity-100"
                }`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <span className="mb-3 inline-flex w-fit rounded-full bg-gold px-2.5 py-1.5 text-[0.72rem] font-black uppercase text-navy-dark shadow">
          {t("ambassadors.badge")}
        </span>
        <h3 className="mb-2 text-[1.35rem] leading-[1.15] text-navy-dark">{ambassador.name}</h3>
        <p className="whitespace-pre-line text-muted">{ambassador.details}</p>
      </div>
    </article>
  );
}

export default function BrandAmbassadorsSection() {
  const { lang, t } = useLanguage();
  const [ambassadors, setAmbassadors] = useState([]);

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

  if (!localized.length) return null;

  return (
    <section id="ambassadors" className="py-16 sm:py-[84px]">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <div className="mb-8 flex flex-col gap-6 sm:mb-[34px] sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-[680px] text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98]">
            {t("ambassadors.heading")}
          </h2>
          <p className="max-w-[440px] font-semibold text-muted">{t("ambassadors.subtitle")}</p>
        </div>
        <Carousel
          items={localized}
          ariaLabel={t("ambassadors.ariaLabel")}
          slideClassName="w-[86%] sm:w-[46%] lg:w-[31%]"
          renderItem={(ambassador) => <AmbassadorCard ambassador={ambassador} t={t} />}
        />
      </div>
    </section>
  );
}
