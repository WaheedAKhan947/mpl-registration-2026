"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import { REGISTRATION_FIELDS } from "@/lib/siteData";
import { readFileAsDataUrl } from "@/lib/files";

export default function RegistrationForm() {
  const [status, setStatus] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", text: "" });

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

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registration),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Registration could not be submitted.");

      form.reset();
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
    </form>
  );
}
