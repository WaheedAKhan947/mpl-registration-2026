"use client";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

const FIELD_ROWS = [
  ["Father Name", "fatherName"],
  ["Age", "age"],
  ["Phone", "phone"],
  ["CNIC Number", "cnicNumber"],
  ["Village / Area", "area"],
  ["Preferred Team", "preferredTeam"],
  ["Playing Role", "playingRole"],
  ["Batting Style", "battingStyle"],
  ["Bowling Style", "bowlingStyle"],
  ["Experience", "experience"],
  ["Notes", "notes"],
];

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 border-b border-ink/10 py-2 text-sm last:border-0">
      <span className="font-bold text-muted">{label}</span>
      <span className="break-words text-ink">{value || "—"}</span>
    </div>
  );
}

export default function RegistrationDetailsModal({ registration, onClose, onDelete }) {
  if (!registration) return null;

  return (
    <Modal onClose={onClose} title={registration.playerName}>
      <div className="flex flex-col gap-4">
        {registration.profilePicture ? (
          <img
            src={registration.profilePicture}
            alt={registration.playerName}
            className="mx-auto h-28 w-28 rounded-full border border-ink/10 object-cover"
          />
        ) : null}

        <div>
          {FIELD_ROWS.map(([label, key]) => (
            <DetailRow key={key} label={label} value={registration[key]} />
          ))}
          <DetailRow
            label="Submitted"
            value={registration.createdAt ? new Date(registration.createdAt).toLocaleString() : "—"}
          />
        </div>

        <div className="flex flex-wrap gap-4">
          {registration.cnicImage ? (
            <a
              href={registration.cnicImage}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-green underline"
            >
              View CNIC Image
            </a>
          ) : null}
          {registration.feeReceipt ? (
            <a
              href={registration.feeReceipt}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-green underline"
            >
              View Fee Receipt
            </a>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-ink/10 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <button
            type="button"
            onClick={() => onDelete(registration.id)}
            className="font-bold text-brand-red"
          >
            Delete Registration
          </button>
        </div>
      </div>
    </Modal>
  );
}
