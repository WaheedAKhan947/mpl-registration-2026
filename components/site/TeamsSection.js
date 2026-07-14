import { TEAM_CARDS } from "@/lib/siteData";

export default function TeamsSection() {
  return (
    <section id="teams" className="bg-green-dark py-16 text-white sm:py-[84px]">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <div className="mb-8 flex flex-col gap-6 sm:mb-[34px] sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-[680px] text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98]">
            Six Teams. One League.
          </h2>
          <p className="max-w-[440px] font-semibold text-white/70">
            Each side represents local pride, strong identity, and the competitive spirit of Maneri cricket.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM_CARDS.map((team) => (
            <article
              key={team.code}
              className="flex min-h-[170px] flex-col justify-between rounded-lg border border-white/15 bg-white/10 p-6"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-gold font-black text-green-dark">
                {team.code}
              </span>
              <div>
                <h3 className="mb-2 text-[1.3rem] leading-[1.15]">{team.name}</h3>
                <p className="font-semibold text-white/70">{team.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
