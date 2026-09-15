"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

function ToggleRow({ label, description, checked, disabled, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-ink/10 bg-[#fbfbf8] p-4">
      <div>
        <p className="font-bold text-ink">{label}</p>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60 ${
          checked ? "bg-green" : "bg-ink/20"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function RegistrationStatusCard() {
  const [mplOpen, setMplOpen] = useState(true);
  const [mfcOpen, setMfcOpen] = useState(true);
  const [fee, setFee] = useState("1000");
  const [savedFee, setSavedFee] = useState("1000");
  const [savingFee, setSavingFee] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setMplOpen(data.mplRegistrationOpen ?? true);
        setMfcOpen(data.mfcRegistrationOpen ?? true);
        const loadedFee = String(data.mplRegistrationFee ?? 1000);
        setFee(loadedFee);
        setSavedFee(loadedFee);
      })
      .catch(() => setError("Could not load registration status."))
      .finally(() => setLoading(false));
  }, []);

  async function persist(field, value, revert) {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update registration status.");
      setSuccess("Registration status updated.");
    } catch (err) {
      setError(err.message);
      revert();
    } finally {
      setSaving(false);
    }
  }

  function handleMplChange(next) {
    setMplOpen(next);
    persist("mplRegistrationOpen", next, () => setMplOpen(!next));
  }

  function handleMfcChange(next) {
    setMfcOpen(next);
    persist("mfcRegistrationOpen", next, () => setMfcOpen(!next));
  }

  async function handleSaveFee(event) {
    event.preventDefault();
    const parsed = Number(fee);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a valid registration fee.");
      return;
    }

    setSavingFee(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mplRegistrationFee: parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update the registration fee.");
      const updatedFee = String(data.mplRegistrationFee);
      setFee(updatedFee);
      setSavedFee(updatedFee);
      setSuccess("Registration fee updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingFee(false);
    }
  }

  const feeDirty = fee.trim() !== savedFee.trim();

  return (
    <section className="mb-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-panel">
      <h2 className="mb-1 text-lg font-bold text-ink">Player Registration Status</h2>
      <p className="mb-4 text-muted">
        Open or close each registration form. When closed, the public page shows a "Registration Closed" notice
        and submissions are blocked, and visitors won't be alerted about it on arrival.
      </p>

      <div className="flex flex-col gap-3">
        <ToggleRow
          label="MPL Registration"
          description={mplOpen ? "Open — players can register." : "Closed — the registration form is hidden."}
          checked={mplOpen}
          disabled={loading || saving}
          onChange={handleMplChange}
        />

        <form
          onSubmit={handleSaveFee}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-ink/10 bg-[#fbfbf8] p-4"
        >
          <label className="min-w-[180px] flex-1">
            <span className="mb-1 block text-sm font-bold text-ink">MPL Registration Fee (Rs.)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={fee}
              onChange={(event) => setFee(event.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 font-medium outline-none focus:border-green"
            />
          </label>
          <Button type="submit" disabled={loading || savingFee || !feeDirty}>
            {savingFee ? "Saving..." : "Save"}
          </Button>
        </form>

        <ToggleRow
          label="MFC Registration"
          description={mfcOpen ? "Open — players can register." : "Closed — the registration form is hidden."}
          checked={mfcOpen}
          disabled={loading || saving}
          onChange={handleMfcChange}
        />
      </div>

      {error ? <p className="mt-3 font-semibold text-brand-red">{error}</p> : null}
      {success ? <p className="mt-3 font-semibold text-green-dark">{success}</p> : null}
    </section>
  );
}
