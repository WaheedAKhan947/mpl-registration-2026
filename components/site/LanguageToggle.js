"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LanguageToggle({ className = "", variant = "dark" }) {
  const { lang, setLang, t } = useLanguage();
  const isDark = variant === "dark";

  return (
    <div
      role="group"
      aria-label={t("languageToggle.aria")}
      className={`inline-flex items-center gap-0.5 rounded-full border p-0.5 text-[0.72rem] font-black ${
        isDark ? "border-white/25 bg-white/5" : "border-ink/15 bg-paper"
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`rounded-full px-2.5 py-1 uppercase tracking-wide transition ${
          lang === "en"
            ? "bg-gold text-navy-dark"
            : isDark
            ? "text-white/70 hover:text-white"
            : "text-muted hover:text-ink"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("ur")}
        aria-pressed={lang === "ur"}
        style={{ fontFamily: "var(--font-urdu)" }}
        className={`rounded-full px-2.5 py-1 transition ${
          lang === "ur"
            ? "bg-gold text-navy-dark"
            : isDark
            ? "text-white/70 hover:text-white"
            : "text-muted hover:text-ink"
        }`}
      >
        اردو
      </button>
    </div>
  );
}
