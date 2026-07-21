function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.957.925-1.957 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

const TIKTOK_PATH =
  "M16.6 5.82c-1.36-1.57-3.24-1.48-3.24-1.48h-3.09v13.62c0 1.51-1.22 2.73-2.73 2.73s-2.73-1.22-2.73-2.73 1.22-2.73 2.73-2.73c.27 0 .53.04.78.11v-3.13a5.9 5.9 0 0 0-.78-.05c-3.24 0-5.87 2.63-5.87 5.87s2.63 5.87 5.87 5.87 5.87-2.63 5.87-5.87V9.66a7.35 7.35 0 0 0 4.31 1.38V7.9c-1.98-.09-3.12-1.09-3.12-1.09.35-.32-.02.02 0 0Z";

function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path fill="#25F4EE" d={TIKTOK_PATH} transform="translate(-0.6,-0.6)" />
      <path fill="#FE2C55" d={TIKTOK_PATH} transform="translate(0.6,0.6)" />
      <path fill="#ffffff" d={TIKTOK_PATH} />
    </svg>
  );
}

function YouTubeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#FF0000"
        d="M23.498 6.186a2.994 2.994 0 0 0-2.107-2.117C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.391.524A2.994 2.994 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a2.994 2.994 0 0 0 2.107 2.117c1.886.524 9.391.524 9.391.524s7.505 0 9.391-.524a2.994 2.994 0 0 0 2.107-2.117C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.75 15.568V8.432L15.818 12Z"
      />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { label: "Facebook", icon: FacebookIcon, href: "https://www.facebook.com/share/1CbeTudQ6f/?mibextid=wwXIfr" },
  { label: "TikTok", icon: TikTokIcon, href: "https://www.tiktok.com/@maneri.premier.league?_r=1&_t=ZS-95h8v7XZhw5" },
  { label: "YouTube", icon: YouTubeIcon, href: "https://youtube.com/@maneripremierleague?si=CLwdeXA7aufIUHLZ" },
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
          {SOCIAL_LINKS.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              target="_blank"
              rel="noreferrer"
              href={href}
              aria-label={label}
              title={label}
              className="opacity-90 transition hover:scale-110 hover:opacity-100"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
