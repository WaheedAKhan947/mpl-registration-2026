"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function RegistrationClosedNotice({ orgName }) {
  const { t } = useLanguage();

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-6 text-center shadow-[0_14px_42px_rgba(6,66,39,0.08)]">
      <h3 className="mb-2 text-xl font-black uppercase text-green-dark">{t("registrationClosed.title")}</h3>
      <p className="font-semibold text-muted">{t("registrationClosed.message", { org: orgName })}</p>
    </div>
  );
}
