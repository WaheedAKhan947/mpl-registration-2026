"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import RegistrationClosedNotice from "@/components/site/RegistrationClosedNotice";
import { getRegistrationFields, REGISTRATION_FIELDS } from "@/lib/siteData";
import { readFileAsDataUrl, uploadFileDirect } from "@/lib/files";
import { safeJsonResponse } from "@/lib/http";
import { generateRegistrationPdf } from "@/lib/pdf";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function RegistrationForm() {
  const [status, setStatus] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [submittedRegistration, setSubmittedRegistration] = useState(null);
  const [registrationOpen, setRegistrationOpen] = useState(null);
  const [fee, setFee] = useState(1000);
  const { lang, t } = useLanguage();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setRegistrationOpen(data.mplRegistrationOpen ?? true);
        setFee(data.mplRegistrationFee ?? 1000);
      })
      .catch(() => {
        if (!cancelled) setRegistrationOpen(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fields = getRegistrationFields(lang).map((field) =>
    field.name === "feeReceipt"
      ? {
          ...field,
          help: t("registrationForm.feeHelp", { fee }),
        }
      : field
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", text: "" });
    setSubmittedRegistration(null);

    const form = event.target;
    const formData = new FormData(form);

    try {
      setSubmitting(true);
      const registration = {};
      for (const field of REGISTRATION_FIELDS) {
        if (field.type === "file") continue;
        const value = formData.get(field.name);
        registration[field.name] = field.trim ? value.trim() : value;
      }

      const profilePictureFile = form.elements.profilePicture.files[0];
      const cnicFrontFile = form.elements.cnicFront.files[0];
      const cnicBackFile = form.elements.cnicBack.files[0];
      const feeReceiptFile = form.elements.feeReceipt.files[0];
      const uploadContext = { playerName: registration.playerName, cnicNumber: registration.cnicNumber };

      // Upload the four files straight to R2 first (small requests each,
      // no size limit imposed by our own server), then submit everything
      // else -- including only the resulting object keys, not file bytes
      // -- as one small JSON request. This is what actually fixes the
      // submit failures: the old flow embedded all four files as base64 in
      // a single JSON body large enough to be rejected or dropped by the
      // hosting platform on slower mobile connections.
      setStatus({ type: "info", text: t("registrationForm.uploadingFiles") });
      const [profilePicture, cnicFront, cnicBack, feeReceipt] = await Promise.all([
        uploadFileDirect(profilePictureFile, { field: "profilePicture", ...uploadContext }),
        uploadFileDirect(cnicFrontFile, { field: "cnicFront", ...uploadContext }),
        uploadFileDirect(cnicBackFile, { field: "cnicBack", ...uploadContext }),
        uploadFileDirect(feeReceiptFile, { field: "feeReceipt", ...uploadContext }),
      ]);

      // Read the profile picture locally too, just to embed it in the
      // confirmation PDF further down -- this never touches the network.
      const profilePictureDataUrl = await readFileAsDataUrl(profilePictureFile);

      registration.profilePicture = profilePicture;
      registration.cnicFront = cnicFront;
      registration.cnicBack = cnicBack;
      registration.feeReceipt = feeReceipt;
      registration.agreedToTerms = form.elements.agreedToTerms.checked;
      registration.feeNonRefundableAcknowledged = form.elements.feeNonRefundableAcknowledged.checked;

      setStatus({ type: "info", text: t("registrationForm.savingRegistration") });
      let response;
      try {
        response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registration),
        });
      } catch {
        throw new Error(t("registrationForm.networkError"));
      }
      const result = await safeJsonResponse(response);
      if (!response.ok) throw new Error(result.error || t("registrationForm.genericError"));

      form.reset();
      const submitted = { ...registration, profilePicture: profilePictureDataUrl, id: result.id };
      setSubmittedRegistration(submitted);
      setStatus({
        type: "success",
        text: t("registrationForm.success", { id: result.id }),
      });
      // Auto-download the confirmation PDF right away; the button below
      // stays as a manual fallback/re-download.
      await downloadPdf(submitted);
    } catch (error) {
      setStatus({ type: "error", text: error.message || t("registrationForm.genericError") });
    } finally {
      setSubmitting(false);
    }
  }

  async function downloadPdf(registrationData) {
    if (!registrationData) return;

    setDownloading(true);
    try {
      const rows = REGISTRATION_FIELDS.filter((field) => field.type !== "file").map((field) => [
        field.label,
        registrationData[field.name],
      ]);

      const doc = await generateRegistrationPdf({
        orgName: "Maneri Premier League",
        orgTagline: "MPL 2026 - Player Registration Form",
        documentTitle: "Official Registration Confirmation",
        registrationId: registrationData.id,
        submittedAt: new Date().toLocaleString(),
        photo: registrationData.profilePicture,
        sections: [{ heading: "Player Details", rows }],
        notes: [
          "The player has read and agreed to the Official Playing Conditions & Tournament Regulations.",
          `The registration fee of Rs. ${fee} paid by the player is NON-REFUNDABLE under any circumstances.`,
        ],
      });

      doc.save(`${registrationData.id}.pdf`);
    } catch (error) {
      setStatus({ type: "error", text: t("registrationForm.pdfError") });
    } finally {
      setDownloading(false);
    }
  }

  if (registrationOpen === null) return null;

  if (!registrationOpen) return <RegistrationClosedNotice orgName="MPL" />;

  return (
    <form
      className="rounded-lg border border-ink/10 bg-white p-6 shadow-[0_14px_42px_rgba(6,66,39,0.08)]"
      id="playerRegistrationForm"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields
          .filter((field) => field.name !== "feeReceipt")
          .map((field) => (
            <FormField key={field.name} field={field} />
          ))}

        <div className="rounded-lg border border-green/25 bg-[#f6faf2] p-4 sm:col-span-2">
          <p className="font-black text-green-dark">{t("registrationForm.paymentHeading")}</p>
          <p className="mt-1 text-[0.85rem] font-bold text-muted">{t("registrationForm.paymentInstructions")}</p>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-ink/10 bg-white p-3.5 text-[0.88rem] text-ink">
              <p className="font-black text-green-dark">{t("registrationForm.paymentMobileMethod")}</p>
              <p className="mt-1.5">
                {t("registrationForm.paymentAccountTitle")}: <span className="font-black">Muhammad Hashim Khan</span>
              </p>
              <p>
                {t("registrationForm.paymentAccountNumber")}: <span className="font-black">03109898996</span>
              </p>
            </div>

            <div className="rounded-lg border border-ink/10 bg-white p-3.5 text-[0.88rem] text-ink">
              <p className="font-black text-green-dark">{t("registrationForm.paymentBankMethod")}</p>
              <p className="mt-1.5">
                {t("registrationForm.paymentAccountTitle")}: <span className="font-black">Muhammad Hashim</span>
              </p>
              <p>
                {t("registrationForm.paymentAccountNumber")}: <span className="font-black">02017902189503</span>
              </p>
              <p>
                {t("registrationForm.paymentIban")}: <span className="font-black">PK30HABB0002017902189503</span>
              </p>
              <p>
                {t("registrationForm.paymentBranch")}: <span className="font-black">HBL-SWABI</span>
              </p>
            </div>
          </div>
        </div>

        {fields
          .filter((field) => field.name === "feeReceipt")
          .map((field) => (
            <FormField key={field.name} field={field} />
          ))}
      </div>

      <label className="mt-6 flex items-start gap-3 rounded-lg border border-ink/10 bg-[#fbfbf8] p-4 text-[0.9rem] font-bold text-ink">
        <input
          name="agreedToTerms"
          type="checkbox"
          required
          className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-green"
        />
        <span>
          {t("registrationForm.agreeTermsPrefix")}{" "}
          <Link
            href="/terms"
            target="_blank"
            className="font-black text-green underline hover:text-green-dark"
          >
            {t("registrationForm.agreeTermsLink")}
          </Link>
          . <span className="font-black text-brand-red">*</span>
        </span>
      </label>

      <label className="mt-3 flex items-start gap-3 rounded-lg border border-ink/10 bg-[#fbfbf8] p-4 text-[0.9rem] font-bold text-ink">
        <input
          name="feeNonRefundableAcknowledged"
          type="checkbox"
          required
          className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-green"
        />
        <span>
          {t("registrationForm.feeAck", { fee })} <span className="font-black text-brand-red">*</span>
        </span>
      </label>

      <div className="mt-7 flex flex-wrap gap-3.5">
        <Button type="submit" disabled={submitting}>
          {submitting ? t("registrationForm.submitting") : t("registrationForm.submit")}
        </Button>
      </div>

      {status.text ? (
        <p
          className={`mt-4 rounded-lg px-3.5 py-3 font-extrabold ${
            status.type === "error"
              ? "bg-[#ffe3df] text-brand-red"
              : status.type === "success"
              ? "bg-[#e8f2db] text-green-dark"
              : "bg-[#eef2f7] text-ink"
          }`}
        >
          {status.text}
        </p>
      ) : null}

      {status.type === "success" && submittedRegistration ? (
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={() => downloadPdf(submittedRegistration)}
          disabled={downloading}
        >
          {downloading ? t("registrationForm.preparingPdf") : t("registrationForm.downloadPdf")}
        </Button>
      ) : null}
    </form>
  );
}
