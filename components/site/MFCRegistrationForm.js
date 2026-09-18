"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import RegistrationClosedNotice from "@/components/site/RegistrationClosedNotice";
import { getMfcRegistrationFields, MFC_REGISTRATION_FIELDS } from "@/lib/siteData";
import { readFileAsDataUrl } from "@/lib/files";
import { generateRegistrationPdf } from "@/lib/pdf";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function MFCRegistrationForm() {
  const [status, setStatus] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [submittedRegistration, setSubmittedRegistration] = useState(null);
  const [registrationOpen, setRegistrationOpen] = useState(null);
  const { lang, t } = useLanguage();
  const fields = getMfcRegistrationFields(lang);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setRegistrationOpen(data.mfcRegistrationOpen ?? true);
      })
      .catch(() => {
        if (!cancelled) setRegistrationOpen(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", text: "" });
    setSubmittedRegistration(null);

    const form = event.target;
    const formData = new FormData(form);

    try {
      setSubmitting(true);
      const registration = {};
      for (const field of MFC_REGISTRATION_FIELDS) {
        if (field.type === "file") continue;
        const value = formData.get(field.name);
        registration[field.name] = field.trim ? value.trim() : value;
      }
      registration.photo = await readFileAsDataUrl(form.elements.photo.files[0]);
      registration.cnicImage = await readFileAsDataUrl(form.elements.cnicImage.files[0]);
      registration.declarationAgreed = form.elements.declarationAgreed.checked;

      const response = await fetch("/api/mfc-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registration),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t("registrationForm.genericError"));

      form.reset();
      const submitted = { ...registration, id: result.id };
      setSubmittedRegistration(submitted);
      setStatus({
        type: "success",
        text: t("mfcForm.success", { id: result.id }),
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
      const rows = MFC_REGISTRATION_FIELDS.filter((field) => field.type !== "file").map((field) => [
        field.label,
        registrationData[field.name],
      ]);

      const doc = await generateRegistrationPdf({
        orgName: "Maneri Football Club",
        orgTagline: "MFC - Player Registration Form",
        documentTitle: "Official Registration Confirmation",
        registrationId: registrationData.id,
        submittedAt: new Date().toLocaleString(),
        photo: registrationData.photo,
        sections: [{ heading: "Player Details", rows }],
        notes: [
          "The player has declared that all information provided is true and correct.",
          "Submitting this form does not guarantee selection in Maneri Football Club.",
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

  if (!registrationOpen) return <RegistrationClosedNotice orgName="MFC" />;

  return (
    <form
      className="rounded-lg border border-ink/10 bg-white p-6 shadow-[0_14px_42px_rgba(6,66,39,0.08)]"
      id="mfcRegistrationForm"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <FormField key={field.name} field={field} />
        ))}
      </div>

      <label className="mt-6 flex items-start gap-3 rounded-lg border border-ink/10 bg-[#fbfbf8] p-4 text-[0.9rem] font-bold text-ink">
        <input
          name="declarationAgreed"
          type="checkbox"
          required
          className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-green"
        />
        <span>
          {t("mfcForm.declaration")} <span className="font-black text-brand-red">*</span>
        </span>
      </label>

      <div className="mt-7 flex flex-wrap gap-3.5">
        <Button type="submit" disabled={submitting}>
          {submitting ? t("registrationForm.submitting") : t("mfcForm.submit")}
        </Button>
      </div>

      {status.text ? (
        <p
          className={`mt-4 rounded-lg px-3.5 py-3 font-extrabold ${
            status.type === "error" ? "bg-[#ffe3df] text-brand-red" : "bg-[#e8f2db] text-green-dark"
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
