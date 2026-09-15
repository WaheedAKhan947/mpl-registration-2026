"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Keeps the <html> element's lang/dir/font in sync with the selected
// language. The inline bootstrap script in the layout handles the very
// first paint (before hydration); this effect takes over after that and on
// every language change.
export default function HtmlLangSync() {
  const { lang, dir } = useLanguage();

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = dir;
    root.classList.toggle("lang-ur", lang === "ur");
  }, [lang, dir]);

  return null;
}
