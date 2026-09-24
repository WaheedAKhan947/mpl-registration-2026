"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Panel from "@/components/admin/Panel";
import Notice from "@/components/admin/Notice";
import { EditIcon, TrashIcon } from "@/components/admin/icons";
import {
  DELETE_BUTTON_CLASSES,
  EDIT_BUTTON_CLASSES,
  EDITING_BOX_CLASSES,
  FILE_INPUT_CLASSES,
  INPUT_CLASSES,
} from "@/components/admin/formStyles";
import { readFileAsDataUrl } from "@/lib/files";
import { DEFAULT_SPONSOR_TIER, SPONSOR_TIERS, SPONSOR_TIER_LABELS } from "@/lib/sponsorTiers";

const EMPTY_FORM = { name: "", url: "", category: DEFAULT_SPONSOR_TIER, logoFile: null };

const TIER_BADGE_CLASSES = {
  diamond: "bg-sky-100 text-sky-800 ring-sky-300",
  platinum: "bg-slate-200 text-slate-700 ring-slate-300",
  gold: "bg-gold/20 text-[#8a5a00] ring-gold/40",
  silver: "bg-ink/[0.06] text-muted ring-ink/10",
  bronze: "bg-orange-100 text-orange-800 ring-orange-300",
  media: "bg-purple-100 text-purple-800 ring-purple-300",
  official: "bg-green/10 text-green-dark ring-green/30",
};

function TierBadge({ tier }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[0.66rem] font-black uppercase tracking-[0.08em] ring-1 ring-inset ${
        TIER_BADGE_CLASSES[tier] || TIER_BADGE_CLASSES.silver
      }`}
    >
      {SPONSOR_TIER_LABELS[tier] || tier}
    </span>
  );
}

function TierSelect({ value, onChange, className = "" }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Sponsor category"
      className={`${INPUT_CLASSES} ${className}`}
    >
      {SPONSOR_TIERS.map((tier) => (
        <option key={tier} value={tier}>
          {SPONSOR_TIER_LABELS[tier]}
        </option>
      ))}
    </select>
  );
}

export default function SponsorsSettingsCard() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  useEffect(() => {
    loadSponsors();
  }, []);

  async function loadSponsors() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/sponsors", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load sponsors.");
      setSponsors(data.sponsors);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(event) {
    event.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    setError("");
    try {
      const logo = form.logoFile ? await readFileAsDataUrl(form.logoFile) : null;
      const res = await fetch("/api/admin/sponsors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), url: form.url.trim(), category: form.category, logo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add sponsor.");
      setForm(EMPTY_FORM);
      await loadSponsors();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(sponsor) {
    setEditingId(sponsor.id);
    setEditForm({
      name: sponsor.name,
      url: sponsor.url || "",
      category: sponsor.category || DEFAULT_SPONSOR_TIER,
      logoFile: null,
    });
    setError("");
  }

  async function handleUpdate(id) {
    if (!editForm.name.trim()) return;

    setSaving(true);
    setError("");
    try {
      const logo = editForm.logoFile ? await readFileAsDataUrl(editForm.logoFile) : undefined;
      const res = await fetch("/api/admin/sponsors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editForm.name.trim(),
          url: editForm.url.trim(),
          category: editForm.category,
          logo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update sponsor.");
      setEditingId(null);
      await loadSponsors();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this sponsor? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/sponsors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete sponsor.");
      setSponsors((prev) => prev.filter((sponsor) => sponsor.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <Panel
      title="Sponsors"
      description="Manage the sponsor logos, names, links, and categories shown on the homepage. Sponsors are grouped by category in this order: Diamond, Platinum, Gold, Silver, Bronze, Media Partner, then Official Partner."
      actions={
        !loading ? (
          <span className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-xs font-bold tabular-nums text-muted">
            {sponsors.length} sponsor{sponsors.length === 1 ? "" : "s"}
          </span>
        ) : null
      }
    >
      {error ? (
        <Notice tone="error" className="mb-4">
          {error}
        </Notice>
      ) : null}
      {loading ? <p className="text-sm text-muted">Loading sponsors...</p> : null}

      {!loading && sponsors.length ? (
        <ul className="mb-5 grid gap-3">
          {sponsors.map((sponsor) =>
            editingId === sponsor.id ? (
              <li key={sponsor.id} className={`${EDITING_BOX_CLASSES} p-4`}>
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  <input
                    value={editForm.name}
                    onChange={(event) => setEditForm((f) => ({ ...f, name: event.target.value }))}
                    placeholder="Sponsor name"
                    className={INPUT_CLASSES}
                  />
                  <input
                    value={editForm.url}
                    onChange={(event) => setEditForm((f) => ({ ...f, url: event.target.value }))}
                    placeholder="https://sponsor-site.com"
                    className={INPUT_CLASSES}
                  />
                  <TierSelect
                    value={editForm.category}
                    onChange={(category) => setEditForm((f) => ({ ...f, category }))}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setEditForm((f) => ({ ...f, logoFile: event.target.files[0] || null }))}
                    className={FILE_INPUT_CLASSES}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button type="button" size="sm" disabled={saving} onClick={() => handleUpdate(sponsor.id)}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  {sponsor.logo ? (
                    <button
                      type="button"
                      className={DELETE_BUTTON_CLASSES}
                      onClick={async () => {
                        setSaving(true);
                        try {
                          const res = await fetch("/api/admin/sponsors", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: sponsor.id, removeLogo: true }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Could not remove logo.");
                          await loadSponsors();
                        } catch (err) {
                          setError(err.message);
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      Remove logo
                    </button>
                  ) : null}
                </div>
              </li>
            ) : (
              <li
                key={sponsor.id}
                className="flex flex-wrap items-center gap-3.5 rounded-xl border border-ink/10 p-3.5 transition hover:border-ink/20"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink/10 bg-[#fbfbf8] p-1">
                  {sponsor.logo ? (
                    <img src={sponsor.logo} alt={sponsor.name} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-center text-[0.6rem] font-bold uppercase text-muted">No logo</span>
                  )}
                </div>
                <div className="min-w-[140px] flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-bold text-ink">
                    {sponsor.name}
                    <TierBadge tier={sponsor.category} />
                  </p>
                  <p className="truncate text-sm text-muted">{sponsor.url || "No link set"}</p>
                </div>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => startEdit(sponsor)} className={EDIT_BUTTON_CLASSES}>
                    <EditIcon className="h-4 w-4" />
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(sponsor.id)} className={DELETE_BUTTON_CLASSES}>
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      ) : null}

      {!loading && !sponsors.length ? <p className="mb-5 text-sm text-muted">No sponsors added yet.</p> : null}

      <form
        onSubmit={handleAdd}
        className="grid gap-2.5 rounded-xl border border-dashed border-ink/20 bg-[#fafbfa] p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_190px_auto_auto]"
      >
        <p className="text-xs font-black uppercase tracking-[0.12em] text-muted sm:col-span-2 lg:col-span-5">Add a sponsor</p>
        <input
          value={form.name}
          onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
          placeholder="Sponsor name"
          className={INPUT_CLASSES}
        />
        <input
          value={form.url}
          onChange={(event) => setForm((f) => ({ ...f, url: event.target.value }))}
          placeholder="https://sponsor-site.com"
          className={INPUT_CLASSES}
        />
        <TierSelect value={form.category} onChange={(category) => setForm((f) => ({ ...f, category }))} />
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setForm((f) => ({ ...f, logoFile: event.target.files[0] || null }))}
          className={`${FILE_INPUT_CLASSES} lg:max-w-[240px]`}
        />
        <Button type="submit" size="sm" disabled={saving || !form.name.trim()}>
          {saving ? "Adding..." : "Add Sponsor"}
        </Button>
      </form>
    </Panel>
  );
}
