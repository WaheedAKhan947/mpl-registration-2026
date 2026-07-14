import { MANAGEMENT } from "@/lib/siteData";

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {MANAGEMENT.map((member) => (
            <article
              key={member.name}
              className="min-h-[170px] rounded-lg border border-ink/10 bg-white p-6 shadow-[0_14px_42px_rgba(6,66,39,0.08)]"
            >
              <span className="mb-3.5 inline-flex rounded-full bg-[#e8f2db] px-2.5 py-1.5 text-[0.8rem] font-black uppercase text-green-dark">
                {member.role}
              </span>
              <h3 className="mb-2 text-[1.3rem] leading-[1.15]">{member.name}</h3>
              <p className="text-muted">{member.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
