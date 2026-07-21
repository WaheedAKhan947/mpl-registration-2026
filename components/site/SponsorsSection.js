import Image from "next/image";
import { SPONSORS } from "@/lib/siteData";

function SponsorLogo({ sponsor }) {
  return (
    <a
      href={sponsor.url}
      target="_blank"
      rel="noreferrer"
      aria-label={sponsor.name}
      title={sponsor.name}
      className="flex h-60 w-40 shrink-0 items-center justify-center rounded-lg border border-ink/10 bg-white px-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel sm:w-48"
    >
      {sponsor.logo ? (
        <Image
          src={sponsor.logo}
          alt={sponsor.name}
          width={170}
          height={170}
          className="max-h-56 w-auto object-contain transition hover:grayscale-0"
        />
      ) : (
        <span className="text-center text-sm font-bold uppercase tracking-wide text-ink/70">
          {sponsor.name}
        </span>
      )}
    </a>
  );
}

export default function SponsorsSection() {
  if (!SPONSORS.length) return null;
  const sponsors = [...SPONSORS, ...SPONSORS];

  return (
    <section id="sponsors" className="py-16 sm:py-[84px]">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <div className="mb-8 flex flex-col gap-6 sm:mb-[34px] sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-[680px] text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98]">
            Our Sponsors
          </h2>
          <p className="max-w-[440px] font-semibold text-muted">
            Proud partners powering the Maneri Premier League.
          </p>
        </div>
      </div>

      <div className="group overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
        <div className="flex w-max animate-marquee items-center gap-6 group-hover:[animation-play-state:paused]">
          {sponsors.map((sponsor, index) => (
            <SponsorLogo key={`${sponsor.name}-${index}`} sponsor={sponsor} />
          ))}
        </div>
      </div>
    </section>
  );
}
