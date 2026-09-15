"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { UI_TEXT } from "@/lib/i18n/dictionary";

const STORAGE_KEY = "mpl-lang";

const LanguageContext = createContext(null);

function lookup(dict, key) {
  return key.split(".").reduce((node, part) => (node && typeof node === "object" ? node[part] : undefined), dict);
}

function interpolate(value, vars) {
  if (!vars) return value;
  return Object.entries(vars).reduce((str, [name, replacement]) => str.split(`{${name}}`).join(replacement), value);
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "ur") setLangState(stored);
    } catch {
      // Ignore -- e.g. private browsing blocking storage access.
    }
  }, []);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore -- the choice just won't be remembered next visit.
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((current) => {
      const next = current === "en" ? "ur" : "en";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore -- the choice just won't be remembered next visit.
      }
      return next;
    });
  }, []);

  const dir = lang === "ur" ? "rtl" : "ltr";

  const t = useCallback(
    (key, vars) => {
      const dict = UI_TEXT[lang] || UI_TEXT.en;
      let value = lookup(dict, key);
      if (value === undefined) value = lookup(UI_TEXT.en, key);
      if (typeof value !== "string") return key;
      return interpolate(value, vars);
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, toggleLang, dir, t }), [lang, setLang, toggleLang, dir, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
