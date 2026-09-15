"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const DISMISS_KEY = "mpl-announcement-dismissed";

export default function AnnouncementBar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  // The marquee is for visitors; the admin dashboard has its own chrome.
  const isAdminRoute = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdminRoute) return undefined;
    let cancelled = false;
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const text = String(data.announcementText || "").trim();
        if (!data.announcementEnabled || !text) return;
        setAnnouncement(text);
        try {
          if (localStorage.getItem(DISMISS_KEY) === text) setDismissed(true);
        } catch {
          // Ignore -- e.g. private browsing blocking storage access.
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!announcement || dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, announcement);
    } catch {
      // Ignore -- dismissal just won't be remembered next visit.
    }
  }

  return (
    <div
      role="region"
      aria-label={t("announcement.aria")}
      className="relative flex items-center gap-3 border-b border-gold/30 bg-navy-dark py-2 pl-4 pr-11 text-white"
    >
      <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-gold px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-wide text-navy-dark sm:inline-flex">
        {t("announcement.latest")}
      </span>
      <div className="group flex-1 overflow-hidden">
        <div className="flex w-max animate-marquee gap-24 group-hover:[animation-play-state:paused]">
          <span className="whitespace-nowrap text-[0.8rem] font-bold sm:text-[0.92rem]">{announcement}</span>
          <span aria-hidden="true" className="whitespace-nowrap text-[0.8rem] font-bold sm:text-[0.92rem]">
            {announcement}
          </span>
        </div>
      </div>
      {/* <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        ✕
      </button> */}
    </div>
  );
}
