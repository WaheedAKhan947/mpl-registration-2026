import Reveal from "@/components/ui/Reveal";

const PHOTOS = [
  {
    src: `/image2.jpeg`,
    alt: "Cricket match moment",
    className:
      "w-full rounded-lg bg-white object-cover shadow-panel-navy ring-2 ring-gold/40 transition-transform duration-500 hover:-rotate-1 hover:scale-[1.03] sm:absolute sm:left-0 sm:top-[34px] sm:w-[70%]",
  },
  {
    src: `/image1.jpeg`,
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

const PILLS = [
  { label: "Discipline", className: "bg-navy-dark text-gold" },
  { label: "Fair Play", className: "bg-gold text-navy-dark" },
  { label: "Teamwork", className: "bg-brand-red text-white" },
  { label: "Talent Development", className: "bg-ember text-white" },
];

export default function AboutSection() {
  return (
    <section id="about" className="overflow-hidden py-16 sm:py-[84px]">
      <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-center gap-9 lg:grid-cols-[0.95fr_1.05fr]">
        <Reveal className="relative grid gap-3.5 sm:block sm:min-h-[480px]" aria-label="Cricket images">
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
            About Us
          </p>
          <h2 className="mb-[18px] text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98] text-navy-dark">
            Local Cricket With Professional Standards
          </h2>
          <div className="grid gap-4 text-[1.05rem] text-muted">
            <p>
              Maneri Premier League was created to provide a serious and organized platform
              for emerging players. The league brings teams together under proper rules,
              transparent management, and a competitive tournament structure.
            </p>
            <p>
              Since formation, MPL has focused on discipline, teamwork, and talent
              development, turning local cricket into a stronger opportunity-driven system
              for future players.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {PILLS.map((pill, index) => (
              <span
                key={pill.label}
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
