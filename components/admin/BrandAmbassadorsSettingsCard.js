"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Panel from "@/components/admin/Panel";
import Notice from "@/components/admin/Notice";
import { ChevronDownIcon, ChevronUpIcon, EditIcon, TrashIcon, XIcon } from "@/components/admin/icons";
import {
  DELETE_BUTTON_CLASSES,
  EDIT_BUTTON_CLASSES,
  EDITING_BOX_CLASSES,
  FILE_INPUT_CLASSES,
  INPUT_CLASSES,
} from "@/components/admin/formStyles";
import { readFileAsDataUrl } from "@/lib/files";

// Mirrors MAX_AMBASSADOR_IMAGES in models/BrandAmbassador.js (the server enforces it).
const MAX_IMAGES = 6;

const EMPTY_FORM = { name: "", details: "", detailsUr: "", imageFiles: [] };

async function requestJson(method, body) {
  const res = await fetch("/api/admin/brand-ambassadors", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

// Images go up one per request so each request body stays small.
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

export default function BrandAmbassadorsSettingsCard() {
  const [ambassadors, setAmbassadors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [movingId, setMovingId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [formKey, setFormKey] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editFileKey, setEditFileKey] = useState(0);

  useEffect(() => {
    loadAmbassadors();
  }, []);

  async function loadAmbassadors() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/brand-ambassadors", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load brand ambassadors.");
      setAmbassadors(data.ambassadors);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function selectNewImages(fileList) {
    const all = Array.from(fileList || []);
    const files = pickImages(all, MAX_IMAGES);
    setForm((f) => ({ ...f, imageFiles: files }));
    setNotice(all.length > MAX_IMAGES ? `Only the first ${MAX_IMAGES} images will be used.` : "");
  }

  const canAdd = form.name.trim() && form.details.trim() && form.imageFiles.length > 0;

  async function handleAdd(event) {
    event.preventDefault();
    if (!canAdd) return;

    setSaving(true);
    setError("");
    setNotice("");
    let createdId = null;
    try {
      const [first, ...rest] = form.imageFiles;
      const image = await readFileAsDataUrl(first);
      const data = await requestJson("POST", {
        name: form.name.trim(),
        details: form.details.trim(),
        detailsUr: form.detailsUr.trim(),
        image,
      });
      createdId = data.id;
      await uploadImages(createdId, rest);
      setForm(EMPTY_FORM);
      setFormKey((k) => k + 1);
    } catch (err) {
      setError(
        createdId
          ? `The ambassador was added, but some images failed to upload: ${err.message} You can add them from Edit.`
          : err.message
      );
    } finally {
      await loadAmbassadors();
      setSaving(false);
    }
  }

  function startEdit(ambassador) {
    setEditingId(ambassador.id);
    setEditForm({
      name: ambassador.name,
      details: ambassador.details,
      detailsUr: ambassador.detailsUr || "",
      imageFiles: [],
    });
    setError("");
    setNotice("");
  }

  async function handleUpdate(ambassador) {
    if (!editForm.name.trim() || !editForm.details.trim()) return;

    setSaving(true);
    setError("");
    try {
      await requestJson("PUT", {
        id: ambassador.id,
        name: editForm.name.trim(),
        details: editForm.details.trim(),
        detailsUr: editForm.detailsUr.trim(),
      });
      await uploadImages(ambassador.id, editForm.imageFiles);
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      await loadAmbassadors();
      setSaving(false);
    }
  }

  async function handleRemoveImage(id, key) {
    if (!confirm("Remove this image?")) return;
    setSaving(true);
    setError("");
    try {
      await requestJson("PUT", { id, removeImage: key });
      await loadAmbassadors();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this brand ambassador and all their images? This cannot be undone.")) return;
    try {
      await requestJson("DELETE", { id });
      setAmbassadors((prev) => prev.filter((ambassador) => ambassador.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleMove(id, direction) {
    setMovingId(id);
    setError("");
    try {
      await requestJson("PUT", { id, move: direction });
      await loadAmbassadors();
    } catch (err) {
      setError(err.message);
    } finally {
      setMovingId("");
    }
  }

  return (
    <Panel
      title="Brand Ambassadors"
      description="Add the brand ambassadors shown on the homepage. Each one has a name, details, and 1 to 6 images. The images appear as a photo album on the homepage. Use the arrows to change the display order."
      actions={
        !loading ? (
          <span className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-xs font-bold tabular-nums text-muted">
            {ambassadors.length} ambassador{ambassadors.length === 1 ? "" : "s"}
          </span>
        ) : null
      }
    >
      {error ? (
        <Notice tone="error" className="mb-4">
          {error}
        </Notice>
      ) : null}
      {loading && !ambassadors.length ? <p className="text-sm text-muted">Loading brand ambassadors...</p> : null}

      {ambassadors.length ? (
        <ul className="mb-5 grid gap-3">
          {ambassadors.map((ambassador, index) =>
            editingId === ambassador.id ? (
              <li key={ambassador.id} className={`${EDITING_BOX_CLASSES} p-4`}>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <input
                    value={editForm.name}
                    onChange={(event) => setEditForm((f) => ({ ...f, name: event.target.value }))}
                    placeholder="Full name"
                    className={`${INPUT_CLASSES} sm:col-span-2`}
                  />
                  <textarea
                    value={editForm.details}
                    onChange={(event) => setEditForm((f) => ({ ...f, details: event.target.value }))}
                    placeholder="Details (English)"
                    rows={3}
                    className={`${INPUT_CLASSES} min-h-[80px] resize-y`}
                  />
                  <textarea
                    value={editForm.detailsUr}
                    onChange={(event) => setEditForm((f) => ({ ...f, detailsUr: event.target.value }))}
                    placeholder="Details (Urdu, optional)"
                    dir="rtl"
                    rows={3}
                    className={`${INPUT_CLASSES} min-h-[80px] resize-y`}
                  />
                </div>

                <p className="mb-2 mt-4 text-xs font-black uppercase tracking-[0.12em] text-muted">
                  Images ({ambassador.images.length}/{MAX_IMAGES})
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {ambassador.images.map((image, imageIndex) => (
                    <div
                      key={image.key}
                      className="relative h-24 w-24 overflow-hidden rounded-lg border border-ink/10 bg-[#fbfbf8]"
                    >
                      <img
                        src={image.url}
                        alt={`${ambassador.name} image ${imageIndex + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {ambassador.images.length > 1 ? (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleRemoveImage(ambassador.id, image.key)}
                          aria-label={`Remove image ${imageIndex + 1}`}
                          title="Remove image"
                          className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/95 text-brand-red shadow transition hover:bg-brand-red hover:text-white disabled:opacity-50"
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
                {ambassador.images.length < MAX_IMAGES ? (
                  <div className="mt-2.5">
                    <input
                      key={editFileKey}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) =>
                        setEditForm((f) => ({
                          ...f,
                          imageFiles: pickImages(event.target.files, MAX_IMAGES - ambassador.images.length),
                        }))
                      }
                      className={`${FILE_INPUT_CLASSES} sm:max-w-[360px]`}
                    />
                    <p className="mt-1 text-xs text-muted">
                      You can add up to {MAX_IMAGES - ambassador.images.length} more image
                      {MAX_IMAGES - ambassador.images.length === 1 ? "" : "s"}. They upload when you save.
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted">
                    This ambassador has the maximum of {MAX_IMAGES} images. Remove one to add another.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button type="button" size="sm" disabled={saving} onClick={() => handleUpdate(ambassador)}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingId(null);
                      setEditFileKey((k) => k + 1);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </li>
            ) : (
              <li
                key={ambassador.id}
                className="flex flex-wrap items-center gap-3.5 rounded-xl border border-ink/10 p-3.5 transition hover:border-ink/20"
              >
                <div className="flex shrink-0 -space-x-3">
                  {ambassador.images.length ? (
                    ambassador.images.map((image, imageIndex) => (
                      <img
                        key={image.key}
                        src={image.url}
                        alt={`${ambassador.name} image ${imageIndex + 1}`}
                        className="h-14 w-14 rounded-full border-2 border-white object-cover shadow-sm"
                      />
                    ))
                  ) : (
                    <span className="grid h-14 w-14 place-items-center rounded-full border border-ink/10 bg-[#fbfbf8] text-center text-[0.6rem] font-bold uppercase text-muted">
                      No image
                    </span>
                  )}
                </div>
                <div className="min-w-[160px] flex-1">
                  <p className="font-bold text-ink">{ambassador.name}</p>
                  <p className="line-clamp-2 text-sm text-muted">{ambassador.details}</p>
                  {!ambassador.images.length ? (
                    <p className="mt-1 text-xs font-bold text-brand-red">
                      Hidden on the homepage until an image is added.
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(ambassador.id, "up")}
                    disabled={index === 0 || movingId === ambassador.id}
                    aria-label={`Move ${ambassador.name} up`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-ink/[0.06] hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronUpIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(ambassador.id, "down")}
                    disabled={index === ambassadors.length - 1 || movingId === ambassador.id}
                    aria-label={`Move ${ambassador.name} down`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-ink/[0.06] hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => startEdit(ambassador)} className={EDIT_BUTTON_CLASSES}>
                    <EditIcon className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ambassador.id)}
                    className={DELETE_BUTTON_CLASSES}
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      ) : null}

      {!loading && !ambassadors.length ? (
        <p className="mb-5 text-sm text-muted">No brand ambassadors added yet.</p>
      ) : null}

      <form onSubmit={handleAdd} className="grid gap-2.5 rounded-xl border border-dashed border-ink/20 bg-[#fafbfa] p-4">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-muted">Add a brand ambassador</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
            placeholder="Full name"
            className={INPUT_CLASSES}
          />
          <div>
            <input
              key={formKey}
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => selectNewImages(event.target.files)}
              className={FILE_INPUT_CLASSES}
            />
            <p className="mt-1 text-xs text-muted">
              {form.imageFiles.length
                ? `${form.imageFiles.length} image${form.imageFiles.length === 1 ? "" : "s"} selected.`
                : `Choose 1 to ${MAX_IMAGES} images.`}{" "}
              {notice}
            </p>
          </div>
          <textarea
            value={form.details}
            onChange={(event) => setForm((f) => ({ ...f, details: event.target.value }))}
            placeholder="Details (English)"
            rows={3}
            className={`${INPUT_CLASSES} min-h-[80px] resize-y`}
          />
          <textarea
            value={form.detailsUr}
            onChange={(event) => setForm((f) => ({ ...f, detailsUr: event.target.value }))}
            placeholder="Details (Urdu, optional)"
            dir="rtl"
            rows={3}
            className={`${INPUT_CLASSES} min-h-[80px] resize-y`}
          />
        </div>
        <div>
          <Button type="submit" size="sm" disabled={saving || !canAdd}>
            {saving ? "Saving..." : "Add Brand Ambassador"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
