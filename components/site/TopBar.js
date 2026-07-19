const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/share/1CbeTudQ6f/?mibextid=wwXIfr" },
  { label: "TikTok", href: "https://www.tiktok.com/@maneri.premier.league?_r=1&_t=ZS-95h8v7XZhw5" },
  { label: "YouTube", href: "https://youtube.com/@maneripremierleague?si=CLwdeXA7aufIUHLZ" },
];

export default function TopBar() {
  return (
    <div className="border-b border-gold/20 bg-navy-dark text-sm text-white/90">
      <div className="mx-auto flex min-h-[42px] w-[min(1180px,calc(100%-32px))] flex-wrap items-center justify-between gap-4">
        <div className="hidden flex-wrap items-center gap-3 md:flex">
          <span>+92 310 9898996</span>
          <span>maneripremierleague@gmail.com</span>
        </div>
        <div className="flex flex-wrap items-center gap-3" aria-label="Social links">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              target="_blank"
              rel="noreferrer"
              href={link.href}
              className="opacity-90 transition hover:text-gold hover:opacity-100"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
