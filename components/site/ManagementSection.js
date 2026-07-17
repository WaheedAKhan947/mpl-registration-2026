"use client";

import Carousel from "@/components/ui/Carousel";
import { MANAGEMENT } from "@/lib/siteData";

const AVATAR_COLORS = [
  "bg-navy-dark text-gold",
  "bg-gold text-navy-dark",
  "bg-brand-red text-white",
  "bg-ember text-white",
];

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function MemberCard({ member, index }) {
  return (
    <article className="group relative h-[420px] w-full overflow-hidden rounded-2xl shadow-[0_14px_42px_rgba(6,66,39,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-panel-navy hover:ring-2 hover:ring-gold/40">
      {member.photo ? (
        <img
          src={member.photo}
          alt={member.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
      ) : (
        <div
          className={`absolute inset-0 grid place-items-center text-6xl font-black transition-transform duration-700 ease-out group-hover:scale-110 ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
        >
          {initials(member.name)}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/95 via-navy-dark/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <span className="mb-3 inline-flex rounded-full bg-gold px-2.5 py-1.5 text-[0.75rem] font-black uppercase text-navy-dark shadow">
          {member.role}
        </span>
        <h3 className="mb-1.5 text-[1.3rem] leading-[1.15] text-white">{member.name}</h3>
        <p className="text-white/80">{member.copy}</p>
      </div>
    </article>
  );
}

export default function ManagementSection() {
  return (
    <section id="management" className="py-16 sm:py-[84px]">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <div className="mb-8 flex flex-col gap-6 sm:mb-[34px] sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-[680px] text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98]">
            Management MPL
          </h2>
          <p className="max-w-[440px] font-semibold text-muted">
            The people responsible for planning, operations, communication, finance, media, and match experience.
          </p>
        </div>
        <Carousel
          items={MANAGEMENT}
          ariaLabel="MPL management team"
          slideClassName="w-[86%] sm:w-[46%] lg:w-[31%]"
          renderItem={(member, index) => <MemberCard member={member} index={index} />}
        />
      </div>
    </section>
  );
}
