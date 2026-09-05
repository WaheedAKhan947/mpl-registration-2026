"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import { REGISTRATION_FIELDS } from "@/lib/siteData";
import { readFileAsDataUrl } from "@/lib/files";

export default function RegistrationForm() {
  const [status, setStatus] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [submittedRegistration, setSubmittedRegistration] = useState(null);

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
      registration.profilePicture = await readFileAsDataUrl(form.elements.profilePicture.files[0]);
      registration.cnicImage = await readFileAsDataUrl(form.elements.cnicImage.files[0]);
      registration.feeReceipt = await readFileAsDataUrl(form.elements.feeReceipt.files[0]);
      registration.agreedToTerms = form.elements.agreedToTerms.checked;
      registration.feeNonRefundableAcknowledged = form.elements.feeNonRefundableAcknowledged.checked;

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registration),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Registration could not be submitted.");

      form.reset();
      setSubmittedRegistration({ ...registration, id: result.id });
      setStatus({
        type: "success",
        text: `Registration submitted. Your registration ID is ${result.id}. MPL management can view it in Admin.`,
      });
    } catch (error) {
      setStatus({ type: "error", text: error.message || "Registration could not be submitted. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownloadPdf() {
    if (!submittedRegistration) return;

    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 48;
      let y = 56;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Maneri Premier League", marginX, y);
      y += 22;
      doc.setFontSize(13);
      doc.text("MPL 2026 - Player Registration Form", marginX, y);

      const profile = submittedRegistration.profilePicture;
      if (profile?.data) {
        try {
          const format = profile.type?.includes("png") ? "PNG" : "JPEG";
          doc.addImage(profile.data, format, pageWidth - marginX - 90, 40, 90, 90);
        } catch {
          // Skip the photo if it can't be decoded (e.g. unsupported image type).
        }
      }

      y += 26;
      doc.setDrawColor(200);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 22;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Registration ID: ${submittedRegistration.id}`, marginX, y);
      y += 16;
      doc.text(`Submitted On: ${new Date().toLocaleString()}`, marginX, y);
      y += 26;

      const rows = REGISTRATION_FIELDS.filter((field) => field.type !== "file").map((field) => [
        field.label,
        String(submittedRegistration[field.name] ?? "").trim() || "-",
      ]);
      rows.push(["Agreed to Playing Conditions", submittedRegistration.agreedToTerms ? "Yes" : "No"]);
      rows.push(["Fee Non-Refundable Acknowledged", submittedRegistration.feeNonRefundableAcknowledged ? "Yes" : "No"]);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Player Details", marginX, y);
      y += 18;
      doc.setFontSize(11);

      const labelWidth =
        Math.max(...rows.map(([label]) => doc.getTextWidth(`${label}:`))) + 14;

      for (const [label, value] of rows) {
        const valueLines = doc.splitTextToSize(value, pageWidth - marginX * 2 - labelWidth);
        const lineHeight = 16 * Math.max(valueLines.length, 1);
        if (y + lineHeight > pageHeight - 50) {
          doc.addPage();
          y = 56;
        }
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, marginX, y);
        doc.setFont("helvetica", "normal");
        doc.text(valueLines, marginX + labelWidth, y);
        y += lineHeight;
      }

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text(
        "This is a system-generated confirmation. Present this form if requested by MPL management.",
        marginX,
        Math.min(y + 14, pageHeight - 24)
      );

      doc.save(`MPL-Registration-${submittedRegistration.id}.pdf`);
    } catch (error) {
      setStatus({ type: "error", text: "Could not generate the PDF. Please try again." });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <form
      className="rounded-lg border border-ink/10 bg-white p-6 shadow-[0_14px_42px_rgba(6,66,39,0.08)]"
      id="playerRegistrationForm"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REGISTRATION_FIELDS.map((field) => (
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
          I have read and agree to the{" "}
          <Link
            href="/terms"
            target="_blank"
            className="font-black text-green underline hover:text-green-dark"
          >
            Official Playing Conditions &amp; Tournament Regulations
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
          I understand that the registration fee is <strong>non-refundable</strong> under any circumstances.{" "}
          <span className="font-black text-brand-red">*</span>
        </span>
      </label>

      <div className="mt-7 flex flex-wrap gap-3.5">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Registration"}
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
        <Button type="button" variant="secondary" className="mt-3" onClick={handleDownloadPdf} disabled={downloading}>
          {downloading ? "Preparing PDF..." : "Download Registration Form (PDF)"}
        </Button>
      ) : null}
    </form>
  );
}
