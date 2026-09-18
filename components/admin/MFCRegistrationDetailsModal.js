"use client";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Avatar from "@/components/admin/Avatar";
import { DownloadIcon } from "@/components/admin/icons";

const FIELD_ROWS = [
  ["Father's Name", "fatherName"],
  ["Date of Birth", "dob"],
  ["CNIC / B-Form Number", "cnicNumber"],
  ["Phone", "phone"],
  ["Email", "email"],
  ["Village / Area", "village"],
  ["Tehsil", "tehsil"],
  ["District", "district"],
  ["Preferred Position", "position"],
  ["Preferred Foot", "preferredFoot"],
  ["Previous Club / Team", "previousClub"],
  ["Football Experience", "experience"],
  ["Previous Tournaments", "previousTournaments"],
  ["Height", "height"],
  ["Jersey Size", "jerseySize"],
  ["Jersey Number", "jerseyNumber"],
];

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 border-b border-ink/[0.06] py-2.5 text-sm last:border-0">
      <span className="font-bold text-muted">{label}</span>
      <span className="break-words text-ink">{value || "—"}</span>
    </div>
  );
}

export default function MFCRegistrationDetailsModal({ registration, onClose, onDelete, onVerify }) {
  if (!registration) return null;

  return (
    <Modal onClose={onClose} title={registration.fullName}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <Avatar src={registration.photo} name={registration.fullName} size="lg" />
          {registration.registrationId ? (
            <p className="font-mono text-xs font-bold tracking-wide text-muted">{registration.registrationId}</p>
          ) : null}
          {registration.position ? (
            <span className="inline-flex rounded-full bg-navy/[0.08] px-3 py-1 text-xs font-bold text-navy">
              {registration.position}
            </span>
          ) : null}
        </div>

        <div
          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
            registration.verified ? "border-green/25 bg-[#f6faf2]" : "border-gold/30 bg-[#fff8e8]"
          }`}
        >
          <div>
            <p className={`text-sm font-bold ${registration.verified ? "text-green-dark" : "text-navy-dark"}`}>
              {registration.verified ? "Verified" : "Not verified yet"}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {registration.verified
                ? "This registration has been reviewed and confirmed."
                : "Check the CNIC / B-Form image below, then mark it verified."}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant={registration.verified ? "secondary" : "primary"}
            onClick={() => onVerify(registration.id, !registration.verified)}
          >
            {registration.verified ? "Mark Unverified" : "Mark Verified"}
          </Button>
        </div>

        <div className="rounded-xl border border-ink/10 px-4">
          {FIELD_ROWS.map(([label, key]) => (
            <DetailRow key={key} label={label} value={registration[key]} />
          ))}
          <DetailRow
            label="Submitted"
            value={registration.createdAt ? new Date(registration.createdAt).toLocaleString() : "—"}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {registration.cnicImage ? (
            <a
              href={registration.cnicImage}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-2 text-sm font-bold text-green-dark transition hover:bg-green/10"
            >
              <DownloadIcon className="h-4 w-4" />
              View CNIC / B-Form Image
            </a>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <button
            type="button"
            onClick={() => onDelete(registration.id)}
            className="font-bold text-brand-red hover:underline"
          >
            Delete Registration
          </button>
        </div>
      </div>
    </Modal>
  );
}
