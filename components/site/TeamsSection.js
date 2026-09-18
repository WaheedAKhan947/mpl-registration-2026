"use client";

import { useState } from "react";
import Image from "next/image";
import { getTeamCards } from "@/lib/siteData";
import TeamRosterModal from "@/components/site/TeamRosterModal";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function TeamsSection() {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const { lang, t } = useLanguage();
  const teamCards = getTeamCards(lang);

  return (
    <section id="teams" className="bg-green-dark py-16 text-white sm:py-[84px]">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <div className="mb-8 flex flex-col gap-6 sm:mb-[34px] sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-[680px] text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98]">
            {t("teams.heading1")} <br />
            {t("teams.heading2")}
          </h2>
          <p className="max-w-[440px] font-semibold text-white/70">{t("teams.subtitle")}</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {teamCards.map((team) => (
            <button
              key={team.code}
              type="button"
              onClick={() => setSelectedTeam(team.name)}
              className="group relative h-[420px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-navy-light to-navy-dark text-left shadow-[0_14px_42px_rgba(6,15,34,0.35)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-panel-navy hover:ring-2 hover:ring-gold/40"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(244,182,61,0.22),transparent_62%)]" />
              <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
                <Image
                  src={team.code}
                  alt={t("teams.logoAlt")}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 46vw, 86vw"
                  className="object-contain p-10 drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)]"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-navy-dark/90 p-5 text-center backdrop-blur-sm">
                <h3 className="text-[1.15rem] leading-[1.15] text-white">{team.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-white/70">{team.copy}</p>
                <span className="mt-3 inline-flex items-center justify-center rounded-full bg-gold px-3.5 py-1.5 text-[0.75rem] font-black uppercase tracking-wide text-navy-dark shadow">
                  {t("teams.viewSquad")}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <TeamRosterModal teamName={selectedTeam} onClose={() => setSelectedTeam(null)} />
    </section>
  );
}
