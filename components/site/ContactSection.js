export default function ContactSection() {
  return (
    <section id="contact" className="bg-brand-red p-0 text-white">
      <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] grid-cols-1 items-center gap-8 py-14 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h2 className="mb-2.5 text-[clamp(2rem,5vw,4rem)] uppercase leading-none">Connect With MPL</h2>
          <p className="font-semibold text-white/85">
            For team coordination, announcements, sponsorship, media, or league inquiries, contact the Maneri
            Premier League management team.
          </p>
        </div>
        <div className="rounded-lg border border-white/20 bg-white/15 p-6">
          <span className="mt-2 block font-extrabold [&:first-child]:mt-0">Email</span>
          <a href="mailto:maneripremierleague@gmail.com" className="mt-2 block break-words font-extrabold">
            maneripremierleague@gmail.com
          </a>
          <span className="mt-2 block font-extrabold">Phone</span>
          <a href="tel:+923109898996" className="mt-2 block break-words font-extrabold">
            +92 310 9898996
          </a>
          <span className="mt-2 block font-extrabold">Location</span>
          <span className="mt-2 block break-words font-extrabold">Maneri Payan, Swabi, KP, Pakistan</span>
        </div>
      </div>
    </section>
  );
}
