"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Avatar from "@/components/admin/Avatar";
import Notice from "@/components/admin/Notice";
import { DownloadIcon } from "@/components/admin/icons";
import { INPUT_CLASSES } from "@/components/admin/formStyles";
import { ROSTER_TEAMS } from "@/lib/siteData";

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
  ["CricPro ID", "cricProId"],
  ["Notes", "notes"],
];

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 border-b border-ink/[0.06] py-2.5 text-sm last:border-0">
      <span className="font-bold text-muted">{label}</span>
      <span className="break-words text-ink">{value || "—"}</span>
    </div>
  );
}

export default function RegistrationDetailsModal({ registration, onClose, onDelete, onAllocate, onVerify }) {
  const [team, setTeam] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTeam(registration?.allocatedTeam || "");
    setError("");
  }, [registration]);

  if (!registration) return null;

  const isDirty = team !== (registration.allocatedTeam || "");

  async function handleAllocate() {
    setSaving(true);
    setError("");
    try {
      await onAllocate(registration.id, team);
    } catch (err) {
      setError(err.message || "Could not update the allocated team.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title={registration.playerName}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <Avatar src={registration.profilePicture} name={registration.playerName} size="lg" />
          {registration.registrationId ? (
            <p className="font-mono text-xs font-bold tracking-wide text-muted">{registration.registrationId}</p>
          ) : null}
          {registration.allocatedTeam ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green/10 px-3 py-1 text-xs font-bold text-green-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-green" />
              {registration.allocatedTeam}
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-ink/[0.06] px-3 py-1 text-xs font-bold text-muted">
              Unassigned
            </span>
          )}
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
                : "Check the CNIC images and fee receipt below, then mark it verified."}
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

        <div className="rounded-xl border border-green/25 bg-[#f6faf2] p-4">
          <label className="mb-2 block text-sm font-bold text-green-dark">Allocated Team</label>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={team}
              onChange={(event) => setTeam(event.target.value)}
              className={`min-w-[180px] flex-1 ${INPUT_CLASSES}`}
            >
              <option value="">Unassigned</option>
              {ROSTER_TEAMS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <Button type="button" size="sm" disabled={!isDirty || saving} onClick={handleAllocate}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
          {error ? (
            <Notice tone="error" className="mt-3">
              {error}
            </Notice>
          ) : null}
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
          {registration.cnicFront ? (
            <a
              href={registration.cnicFront}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-2 text-sm font-bold text-green-dark transition hover:bg-green/10"
            >
              <DownloadIcon className="h-4 w-4" />
              View CNIC Front
            </a>
          ) : null}
          {registration.cnicBack ? (
            <a
              href={registration.cnicBack}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-2 text-sm font-bold text-green-dark transition hover:bg-green/10"
            >
              <DownloadIcon className="h-4 w-4" />
              View CNIC Back
            </a>
          ) : null}
          {registration.feeReceipt ? (
            <a
              href={registration.feeReceipt}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-2 text-sm font-bold text-green-dark transition hover:bg-green/10"
            >
              <DownloadIcon className="h-4 w-4" />
              View Fee Receipt
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
