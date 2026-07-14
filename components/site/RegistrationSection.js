import RegistrationForm from "@/components/site/RegistrationForm";

export default function RegistrationSection() {
  return (
    <section id="register" className="bg-paper py-16 sm:py-[84px]">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <div className="mb-8 flex flex-col gap-6 sm:mb-[34px] sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-[680px] text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98]">
            Player Registration MPL 2026
          </h2>
          <p className="max-w-[440px] font-semibold text-muted">
            Players can register themselves for the upcoming MPL 2026 season. Submissions are saved for the admin
            and can be exported to Excel.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="rounded-lg bg-green-dark p-6 text-white shadow-panel">
            <h3 className="mb-2.5 text-[1.6rem] leading-[1.1]">Before You Submit</h3>
            <p className="font-semibold text-white/80">
              Use correct contact details so the MPL management team can reach you for selection, trials, or team
              coordination.
            </p>
            <ul className="mt-4 list-disc pl-5 font-bold text-white/90">
              <li>Register only once with your active phone number.</li>
              <li>Choose the playing role that best describes you.</li>
              <li>Admin can export all entries as an Excel file.</li>
            </ul>
          </aside>

          <RegistrationForm />
        </div>
      </div>
    </section>
  );
}
