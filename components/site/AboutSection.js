import { IMG_BASE } from "@/lib/siteData";

const PHOTOS = [
  {
    src: `/image2.jpeg`,
    alt: "Cricket match moment",
    className: "w-full rounded-lg bg-white object-cover shadow-panel sm:absolute sm:left-0 sm:top-[34px] sm:w-[70%]",
  },
  {
    src: `/image1.jpeg`,
    alt: "Cricket player",
    className: "w-full rounded-lg bg-white object-cover shadow-panel sm:absolute sm:right-0 sm:top-0 sm:w-[58%]",
  },
  {
    src: `/image3.jpeg`,
    alt: "Cricketer in action",
    className: "w-full rounded-lg bg-white object-cover shadow-panel sm:absolute sm:bottom-0 sm:right-[8%] sm:w-[48%]",
  },
];

const PILLS = ["Discipline", "Fair Play", "Teamwork", "Talent Development"];

export default function AboutSection() {
  return (
    <section id="about" className="py-16 sm:py-[84px]">
      <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] items-center gap-9 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-3.5 sm:relative sm:block sm:min-h-[480px]" aria-label="Cricket images">
          {PHOTOS.map((photo) => (
            <img key={photo.src} src={photo.src} alt={photo.alt} className={photo.className} />
          ))}
        </div>
        <div>
          <p className="mb-[18px] inline-flex items-center gap-2.5 text-[0.88rem] font-black uppercase text-lime before:h-[3px] before:w-9 before:rounded-full before:bg-gold before:content-['']">
            About Us
          </p>
          <h2 className="mb-[18px] text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98]">
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
            {PILLS.map((pill) => (
              <span key={pill} className="rounded-full bg-[#e8f2db] px-3.5 py-2.5 font-extrabold text-green-dark">
                {pill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
