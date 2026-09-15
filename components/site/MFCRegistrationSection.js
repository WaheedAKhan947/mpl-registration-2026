"use client";

import MFCRegistrationForm from "@/components/site/MFCRegistrationForm";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function MFCRegistrationSection() {
  const { t } = useLanguage();

  return (
    <section id="mfc-register" className="bg-paper py-16 sm:py-[84px]">
      <div className="mx-auto w-[min(1180px,calc(100%-32px))]">
        <div className="mb-8 flex flex-col gap-6 sm:mb-[34px] sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-[680px] text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.98]">
            {t("mfcSection.heading")}
          </h2>
          <p className="max-w-[440px] font-semibold text-muted">{t("mfcSection.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="rounded-lgp-6 text-white shadow-panel" />

          <MFCRegistrationForm />
        </div>
      </div>
    </section>
  );
}
