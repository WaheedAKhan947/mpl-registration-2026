"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const SEEN_KEY = "mpl-registration-alert-seen";

export default function RegistrationAlertModal() {
  const pathname = usePathname();
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const isAdminRoute = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdminRoute) return;
    let cancelled = false;
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const mpl = data.mplRegistrationOpen ?? true;
        const mfc = data.mfcRegistrationOpen ?? true;
        if (!mpl && !mfc) return;

        const signature = `${mpl}:${mfc}`;
        try {
          if (sessionStorage.getItem(SEEN_KEY) === signature) return;
        } catch {
          // Ignore -- e.g. private browsing blocking storage access.
        }

        setStatus({ mpl, mfc });
        setOpen(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAdminRoute]);

  if (isAdminRoute || !open || !status) return null;

  function handleClose() {
    try {
      sessionStorage.setItem(SEEN_KEY, `${status.mpl}:${status.mfc}`);
    } catch {
      // Ignore -- the alert just won't be remembered for this tab session.
    }
    setOpen(false);
  }

  const both = status.mpl && status.mfc;
  const title = both
    ? t("registrationAlert.titleBoth")
    : status.mpl
    ? t("registrationAlert.titleMpl")
    : t("registrationAlert.titleMfc");
  const message = both
    ? t("registrationAlert.messageBoth")
    : status.mpl
    ? t("registrationAlert.messageMpl")
    : t("registrationAlert.messageMfc");

  return (
    <Modal onClose={handleClose} title={title}>
      <div className="flex flex-col gap-4">
        <p className="text-ink">{message}</p>
        <div className="flex flex-wrap gap-3.5">
          {status.mpl ? (
            <Button as="a" href="/register" variant="gold" onClick={handleClose}>
              {t("registrationAlert.registerMpl")}
            </Button>
          ) : null}
          {status.mfc ? (
            <Button as="a" href="/mfc-register" onClick={handleClose}>
              {t("registrationAlert.registerMfc")}
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
