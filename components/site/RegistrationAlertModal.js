"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

const SEEN_KEY = "mpl-registration-alert-seen";

export default function RegistrationAlertModal() {
  const pathname = usePathname();
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);

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
    ? "Player Registrations Are Open!"
    : status.mpl
    ? "MPL Player Registration Is Open!"
    : "MFC Player Registration Is Open!";
  const message = both
    ? "Player registration is now open for both the Maneri Premier League (cricket) and Maneri Football Club. Don't miss your spot — register today."
    : status.mpl
    ? "Player registration is now open for the Maneri Premier League. Don't miss your spot — register today."
    : "Player registration is now open for Maneri Football Club. Don't miss your spot — register today.";

  return (
    <Modal onClose={handleClose} title={title}>
      <div className="flex flex-col gap-4">
        <p className="text-ink">{message}</p>
        <div className="flex flex-wrap gap-3.5">
          {status.mpl ? (
            <Button as="a" href="/register" variant="gold" onClick={handleClose}>
              Register for MPL
            </Button>
          ) : null}
          {status.mfc ? (
            <Button as="a" href="/mfc-register" onClick={handleClose}>
              Register for MFC
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
