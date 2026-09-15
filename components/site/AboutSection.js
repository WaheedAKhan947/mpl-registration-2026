"use client";

import Reveal from "@/components/ui/Reveal";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const PHOTOS = [
  {
    src: `/image2.jpeg`,
    alt: "Cricket match moment",
    className:
      "w-full rounded-lg bg-white object-cover shadow-panel-navy ring-2 ring-gold/40 transition-transform duration-500 hover:-rotate-1 hover:scale-[1.03] sm:absolute sm:left-0 sm:top-[34px] sm:w-[70%]",
  },
  {
    src: `/image11.jpeg`,
    alt: "Cricket player",
    className:
      "w-full rounded-lg bg-white object-cover shadow-panel-navy ring-2 ring-gold/40 transition-transform duration-500 hover:rotate-1 hover:scale-[1.03] sm:absolute sm:right-0 sm:top-0 sm:w-[58%]",
  },
  {
    src: `/image3.jpeg`,
    alt: "Cricketer in action",
    className:
      "w-full rounded-lg bg-white object-cover shadow-panel-navy ring-2 ring-gold/40 transition-transform duration-500 hover:-rotate-1 hover:scale-[1.03] sm:absolute sm:bottom-0 sm:right-[8%] sm:w-[48%]",
  },
];

export default function AboutSection() {
  const { t } = useLanguage();

  const pills = [
    { key: "discipline", label: t("about.pillDiscipline"), className: "bg-navy-dark text-gold" },
    { key: "fairPlay", label: t("about.pillFairPlay"), className: "bg-gold text-navy-dark" },
    { key: "teamwork", label: t("about.pillTeamwork"), className: "bg-brand-red text-white" },
    { key: "talent", label: t("about.pillTalent"), className: "bg-ember text-white" },
  ];

  return (
    <section id="about" className="overflow-hidden py-16 sm:py-[84px]">
      <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-center gap-9 lg:grid-cols-[0.95fr_1.05fr]">
        <Reveal className="relative grid gap-3.5 sm:block sm:min-h-[480px]" aria-label={t("about.imagesAria")}>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-10 top-10 hidden h-56 w-56 rounded-full bg-gold/20 blur-3xl sm:block"
          />
          {PHOTOS.map((photo) => (
            <img key={photo.src} src={photo.src} alt={photo.alt} className={photo.className} />
          ))}
        </Reveal>
        <Reveal delay={150}>
          <p className="mb-[18px] inline-flex items-center gap-2.5 text-[0.88rem] font-black uppercase text-brand-red before:h-[3px] before:w-9 before:rounded-full before:bg-gold before:content-['']">
            {t("about.eyebrow")}
          </p>
          <h2 className="mb-[18px] text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98] text-navy-dark">
            {t("about.heading")}
          </h2>
          <div className="grid gap-4 text-[1.05rem] text-muted">
            <p>{t("about.paragraph1")}</p>
            <p>{t("about.paragraph2")}</p>
            <p>{t("about.paragraph3")}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {pills.map((pill, index) => (
              <span
                key={pill.key}
                className={`animate-fade-up rounded-full px-3.5 py-2.5 font-extrabold opacity-0 transition-transform duration-300 hover:-translate-y-1 ${pill.className}`}
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                {pill.label}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
