import Reveal from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";

function MailIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function PhoneIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function PinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

const CONTACT_ITEMS = [
  {
    icon: MailIcon,
    label: "Email",
    value: "maneripremierleague@gmail.com",
    href: "mailto:maneripremierleague@gmail.com",
    badge: "bg-gold text-navy-dark",
  },
  {
    icon: PhoneIcon,
    label: "Phone",
    value: "+92 310 9898996",
    href: "tel:+923109898996",
    badge: "bg-ember text-white",
  },
  {
    icon: PinIcon,
    label: "Location",
    value: "Maneri Payan, Swabi, KP, Pakistan",
    href: "https://maps.app.goo.gl/2LiV29eyEhodga1t7",
    badge: "bg-brand-red text-white",
  },
];

export default function ContactSection() {
  return (
    <section id="contact" className="relative overflow-hidden border-t-4 border-gold bg-navy-dark text-white">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 top-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-brand-red/20 blur-3xl"
      />

      <div className="relative mx-auto grid w-[min(1180px,calc(100%-32px))] grid-cols-1 items-center gap-10 py-16 sm:py-[84px] lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <p className="mb-[18px] inline-flex items-center gap-2.5 text-[0.88rem] font-black uppercase text-gold before:h-[3px] before:w-9 before:rounded-full before:bg-gold before:content-['']">
            Get In Touch
          </p>
          <h2 className="mb-3.5 text-[clamp(2rem,5vw,4rem)] uppercase leading-none">Connect With MPL</h2>
          <p className="mb-7 max-w-md font-semibold text-white/70">
            For team coordination, announcements, sponsorship, media, or league inquiries, contact the Maneri
            Premier League management team.
          </p>
          <Button as="a" href="mailto:maneripremierleague@gmail.com" variant="gold">
            Email Us
          </Button>
        </Reveal>

        <div className="grid gap-4">
          {CONTACT_ITEMS.map(({ icon: Icon, label, value, href, badge }, index) => (
            <Reveal key={label} delay={150 + index * 100}>
              <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:bg-white/10">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${badge}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <span className="block text-[0.75rem] font-bold uppercase tracking-wide text-white/50">{label}</span>
                  {href ? (
                    <a
                      href={href}
                      {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                      className="block break-words font-extrabold transition-colors hover:text-gold"
                    >
                      {value}
                    </a>
                  ) : (
                    <span className="block break-words font-extrabold">{value}</span>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
