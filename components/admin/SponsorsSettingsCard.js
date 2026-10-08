"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Panel from "@/components/admin/Panel";
import Notice from "@/components/admin/Notice";
import { EditIcon, TrashIcon, XIcon } from "@/components/admin/icons";
import {
  DELETE_BUTTON_CLASSES,
  EDIT_BUTTON_CLASSES,
  EDITING_BOX_CLASSES,
  FILE_INPUT_CLASSES,
  INPUT_CLASSES,
} from "@/components/admin/formStyles";
import { readFileAsDataUrl } from "@/lib/files";
import { DEFAULT_SPONSOR_TIER, SPONSOR_TIERS, SPONSOR_TIER_LABELS } from "@/lib/sponsorTiers";

// Mirrors MAX_SPONSOR_IMAGES in models/Sponsor.js (the server enforces it).
const MAX_IMAGES = 6;

const EMPTY_FORM = {
  name: "",
  url: "",
  category: DEFAULT_SPONSOR_TIER,
  details: "",
  detailsUr: "",
  logoFile: null,
  imageFiles: [],
};

const TIER_BADGE_CLASSES = {
  diamond: "bg-sky-100 text-sky-800 ring-sky-300",
  platinum: "bg-slate-200 text-slate-700 ring-slate-300",
  gold: "bg-gold/20 text-[#8a5a00] ring-gold/40",
  silver: "bg-ink/[0.06] text-muted ring-ink/10",
  bronze: "bg-orange-100 text-orange-800 ring-orange-300",
  media: "bg-purple-100 text-purple-800 ring-purple-300",
  official: "bg-green/10 text-green-dark ring-green/30",
  sports: "bg-red-100 text-red-800 ring-red-300",
};

const LABEL_CLASSES = "mb-1 block text-xs font-bold text-muted";

async function requestJson(method, body) {
  const res = await fetch("/api/admin/sponsors", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

// Album images go up one per request so each request body stays small.
async function uploadImages(id, files) {
  for (const file of files) {
    const image = await readFileAsDataUrl(file);
    await requestJson("PUT", { id, addImage: image });
  }
}

function pickImages(fileList, remaining) {
  const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
  return files.slice(0, Math.max(0, remaining));
}

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

// Name, link, category, logo, and details inputs shared by the add and edit forms.
function SponsorFields({ form, setForm, fileKey }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
      <label>
        <span className={LABEL_CLASSES}>Name</span>
        <input
          value={form.name}
          onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
          placeholder="Sponsor name"
          className={INPUT_CLASSES}
        />
      </label>
      <label>
        <span className={LABEL_CLASSES}>Website link (optional)</span>
        <input
          value={form.url}
          onChange={(event) => setForm((f) => ({ ...f, url: event.target.value }))}
          placeholder="https://sponsor-site.com"
          className={INPUT_CLASSES}
        />
      </label>
      <label>
        <span className={LABEL_CLASSES}>Category</span>
        <TierSelect value={form.category} onChange={(category) => setForm((f) => ({ ...f, category }))} />
      </label>
      <label>
        <span className={LABEL_CLASSES}>Logo</span>
        <input
          key={fileKey}
          type="file"
          accept="image/*"
          onChange={(event) => setForm((f) => ({ ...f, logoFile: event.target.files[0] || null }))}
          className={FILE_INPUT_CLASSES}
        />
      </label>
      <label className="sm:col-span-2">
        <span className={LABEL_CLASSES}>Details (English, optional)</span>
        <textarea
          value={form.details}
          onChange={(event) => setForm((f) => ({ ...f, details: event.target.value }))}
          placeholder="What the sponsor does, what they support this season..."
          rows={3}
          className={`${INPUT_CLASSES} min-h-[80px] resize-y`}
        />
      </label>
      <label className="sm:col-span-2">
        <span className={LABEL_CLASSES}>Details (Urdu, optional)</span>
        <textarea
          value={form.detailsUr}
          onChange={(event) => setForm((f) => ({ ...f, detailsUr: event.target.value }))}
          placeholder="تفصیل"
          dir="rtl"
          rows={3}
          className={`${INPUT_CLASSES} min-h-[80px] resize-y`}
        />
      </label>
    </div>
  );
}

export default function SponsorsSettingsCard() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formKey, setFormKey] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editFileKey, setEditFileKey] = useState(0);

  useEffect(() => {
    loadSponsors();
  }, []);

  async function loadSponsors() {
    setLoading(true);
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
    let createdId = null;
    try {
      const logo = form.logoFile ? await readFileAsDataUrl(form.logoFile) : null;
      const data = await requestJson("POST", {
        name: form.name.trim(),
        url: form.url.trim(),
        category: form.category,
        details: form.details.trim(),
        detailsUr: form.detailsUr.trim(),
        logo,
      });
      createdId = data.id;
      await uploadImages(createdId, form.imageFiles);
      setForm(EMPTY_FORM);
      setFormKey((k) => k + 1);
    } catch (err) {
      setError(
        createdId
          ? `The sponsor was added, but some album images failed to upload: ${err.message} You can add them from Edit.`
          : err.message
      );
    } finally {
      await loadSponsors();
      setSaving(false);
    }
  }

  function startEdit(sponsor) {
    setEditingId(sponsor.id);
    setEditForm({
      name: sponsor.name,
      url: sponsor.url || "",
      category: sponsor.category || DEFAULT_SPONSOR_TIER,
      details: sponsor.details || "",
      detailsUr: sponsor.detailsUr || "",
      logoFile: null,
      imageFiles: [],
    });
    setEditFileKey((k) => k + 1);
    setError("");
  }

  async function handleUpdate(sponsor) {
    if (!editForm.name.trim()) return;

    setSaving(true);
    setError("");
    try {
      const logo = editForm.logoFile ? await readFileAsDataUrl(editForm.logoFile) : undefined;
      await requestJson("PUT", {
        id: sponsor.id,
        name: editForm.name.trim(),
        url: editForm.url.trim(),
        category: editForm.category,
        details: editForm.details.trim(),
        detailsUr: editForm.detailsUr.trim(),
        logo,
      });
      await uploadImages(sponsor.id, editForm.imageFiles);
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      await loadSponsors();
      setSaving(false);
    }
  }

  async function runUpdate(body, failMessage) {
    setSaving(true);
    setError("");
    try {
      await requestJson("PUT", body);
      await loadSponsors();
    } catch (err) {
      setError(err.message || failMessage);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this sponsor, its logo, and its album? This cannot be undone.")) return;
    try {
      await requestJson("DELETE", { id });
      setSponsors((prev) => prev.filter((sponsor) => sponsor.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <Panel
      title="Sponsors"
      description="Manage the sponsors shown on the homepage. Each sponsor has a logo, a category, and optional details and a photo album of up to 6 images, which visitors see when they open the sponsor. Sponsors are grouped by category in this order: Diamond, Platinum, Gold, Official Partner, Sports Partner, Silver, Bronze, then Media Partner."
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
      {loading && !sponsors.length ? <p className="text-sm text-muted">Loading sponsors...</p> : null}

      {sponsors.length ? (
        <ul className="mb-5 grid gap-3">
          {sponsors.map((sponsor) => {
            const images = sponsor.images || [];
            const remaining = MAX_IMAGES - images.length;
            return editingId === sponsor.id ? (
              <li key={sponsor.id} className={`${EDITING_BOX_CLASSES} p-4`}>
                <SponsorFields form={editForm} setForm={setEditForm} fileKey={`logo-${editFileKey}`} />

                <p className="mb-2 mt-4 text-xs font-black uppercase tracking-[0.12em] text-muted">
                  Album ({images.length}/{MAX_IMAGES})
                </p>
                {images.length ? (
                  <div className="flex flex-wrap gap-2.5">
                    {images.map((image, imageIndex) => (
                      <div
                        key={image.key}
                        className="relative h-24 w-24 overflow-hidden rounded-lg border border-ink/10 bg-[#fbfbf8]"
                      >
                        <img
                          src={image.url}
                          alt={`${sponsor.name} album image ${imageIndex + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => {
                            if (confirm("Remove this album image?")) {
                              runUpdate({ id: sponsor.id, removeImage: image.key }, "Could not remove the image.");
                            }
                          }}
                          aria-label={`Remove album image ${imageIndex + 1}`}
                          title="Remove image"
                          className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/95 text-brand-red shadow transition hover:bg-brand-red hover:text-white disabled:opacity-50"
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted">No album images yet.</p>
                )}
                {remaining > 0 ? (
                  <div className="mt-2.5">
                    <input
                      key={`album-${editFileKey}`}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) =>
                        setEditForm((f) => ({ ...f, imageFiles: pickImages(event.target.files, remaining) }))
                      }
                      className={`${FILE_INPUT_CLASSES} sm:max-w-[360px]`}
                    />
                    <p className="mt-1 text-xs text-muted">
                      You can add up to {remaining} more image{remaining === 1 ? "" : "s"}. They upload when you save.
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted">
                    The album is full ({MAX_IMAGES} images). Remove one to add another.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button type="button" size="sm" disabled={saving} onClick={() => handleUpdate(sponsor)}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  {sponsor.logo ? (
                    <button
                      type="button"
                      className={DELETE_BUTTON_CLASSES}
                      disabled={saving}
                      onClick={() => runUpdate({ id: sponsor.id, removeLogo: true }, "Could not remove logo.")}
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
                <div className="min-w-[160px] flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-bold text-ink">
                    {sponsor.name}
                    <TierBadge tier={sponsor.category} />
                  </p>
                  <p className="truncate text-sm text-muted">{sponsor.url || "No link set"}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {sponsor.details ? "Has details" : "No details"} · {images.length} album image
                    {images.length === 1 ? "" : "s"}
                  </p>
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
            );
          })}
        </ul>
      ) : null}

      {!loading && !sponsors.length ? <p className="mb-5 text-sm text-muted">No sponsors added yet.</p> : null}

      <form onSubmit={handleAdd} className="grid gap-3 rounded-xl border border-dashed border-ink/20 bg-[#fafbfa] p-4">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-muted">Add a sponsor</p>
        <SponsorFields form={form} setForm={setForm} fileKey={`new-logo-${formKey}`} />
        <label className="sm:max-w-[360px]">
          <span className={LABEL_CLASSES}>Album images (optional, up to {MAX_IMAGES})</span>
          <input
            key={`new-album-${formKey}`}
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setForm((f) => ({ ...f, imageFiles: pickImages(event.target.files, MAX_IMAGES) }))}
            className={FILE_INPUT_CLASSES}
          />
          {form.imageFiles.length ? (
            <span className="mt-1 block text-xs text-muted">
              {form.imageFiles.length} image{form.imageFiles.length === 1 ? "" : "s"} selected.
            </span>
          ) : null}
        </label>
        <div>
          <Button type="submit" size="sm" disabled={saving || !form.name.trim()}>
            {saving ? "Saving..." : "Add Sponsor"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
