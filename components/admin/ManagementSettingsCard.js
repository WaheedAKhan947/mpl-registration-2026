"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Panel from "@/components/admin/Panel";
import Notice from "@/components/admin/Notice";
import { ChevronDownIcon, ChevronUpIcon, EditIcon, TrashIcon } from "@/components/admin/icons";
import {
  DELETE_BUTTON_CLASSES,
  EDIT_BUTTON_CLASSES,
  EDITING_BOX_CLASSES,
  FILE_INPUT_CLASSES,
  INPUT_CLASSES,
} from "@/components/admin/formStyles";
import { readFileAsDataUrl } from "@/lib/files";

const EMPTY_FORM = { name: "", role: "", roleUr: "", copy: "", copyUr: "", photoFile: null };

export default function ManagementSettingsCard() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [movingId, setMovingId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/management", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load management members.");
      setMembers(data.members);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.role.trim() || !form.copy.trim()) return;

    setSaving(true);
    setError("");
    try {
      const photo = form.photoFile ? await readFileAsDataUrl(form.photoFile) : null;
      const res = await fetch("/api/admin/management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          role: form.role.trim(),
          roleUr: form.roleUr.trim(),
          copy: form.copy.trim(),
          copyUr: form.copyUr.trim(),
          photo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add the member.");
      setForm(EMPTY_FORM);
      await loadMembers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(member) {
    setEditingId(member.id);
    setEditForm({
      name: member.name,
      role: member.role,
      roleUr: member.roleUr || "",
      copy: member.copy,
      copyUr: member.copyUr || "",
      photoFile: null,
    });
    setError("");
  }

  async function handleUpdate(id) {
    if (!editForm.name.trim() || !editForm.role.trim() || !editForm.copy.trim()) return;

    setSaving(true);
    setError("");
    try {
      const photo = editForm.photoFile ? await readFileAsDataUrl(editForm.photoFile) : undefined;
      const res = await fetch("/api/admin/management", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editForm.name.trim(),
          role: editForm.role.trim(),
          roleUr: editForm.roleUr.trim(),
          copy: editForm.copy.trim(),
          copyUr: editForm.copyUr.trim(),
          photo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update the member.");
      setEditingId(null);
      await loadMembers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemovePhoto(id) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/management", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, removePhoto: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove the photo.");
      await loadMembers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this management member? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/management", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete the member.");
      setMembers((prev) => prev.filter((member) => member.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleMove(id, direction) {
    setMovingId(id);
    setError("");
    try {
      const res = await fetch("/api/admin/management", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, move: direction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reorder the members.");
      await loadMembers();
    } catch (err) {
      setError(err.message);
    } finally {
      setMovingId("");
    }
  }

  return (
    <Panel
      title="Management"
      description="Manage the committee members, roles, bios, and photos shown on the homepage. Use the arrows to change the display order."
      actions={
        !loading ? (
          <span className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-xs font-bold tabular-nums text-muted">
            {members.length} member{members.length === 1 ? "" : "s"}
          </span>
        ) : null
      }
    >
      {error ? (
        <Notice tone="error" className="mb-4">
          {error}
        </Notice>
      ) : null}
      {loading ? <p className="text-sm text-muted">Loading management members...</p> : null}

      {!loading && members.length ? (
        <ul className="mb-5 grid gap-3">
          {members.map((member, index) =>
            editingId === member.id ? (
              <li key={member.id} className={`${EDITING_BOX_CLASSES} p-4`}>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <input
                    value={editForm.name}
                    onChange={(event) => setEditForm((f) => ({ ...f, name: event.target.value }))}
                    placeholder="Full name"
                    className={INPUT_CLASSES}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setEditForm((f) => ({ ...f, photoFile: event.target.files[0] || null }))}
                    className={FILE_INPUT_CLASSES}
                  />
                  <input
                    value={editForm.role}
                    onChange={(event) => setEditForm((f) => ({ ...f, role: event.target.value }))}
                    placeholder="Role (English)"
                    className={INPUT_CLASSES}
                  />
                  <input
                    value={editForm.roleUr}
                    onChange={(event) => setEditForm((f) => ({ ...f, roleUr: event.target.value }))}
                    placeholder="Role (Urdu, optional)"
                    dir="rtl"
                    className={INPUT_CLASSES}
                  />
                  <textarea
                    value={editForm.copy}
                    onChange={(event) => setEditForm((f) => ({ ...f, copy: event.target.value }))}
                    placeholder="Bio (English)"
                    rows={3}
                    className={`${INPUT_CLASSES} min-h-[80px] resize-y`}
                  />
                  <textarea
                    value={editForm.copyUr}
                    onChange={(event) => setEditForm((f) => ({ ...f, copyUr: event.target.value }))}
                    placeholder="Bio (Urdu, optional)"
                    dir="rtl"
                    rows={3}
                    className={`${INPUT_CLASSES} min-h-[80px] resize-y`}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button type="button" size="sm" disabled={saving} onClick={() => handleUpdate(member.id)}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  {member.photo ? (
                    <button
                      type="button"
                      className={DELETE_BUTTON_CLASSES}
                      disabled={saving}
                      onClick={() => handleRemovePhoto(member.id)}
                    >
                      Remove photo
                    </button>
                  ) : null}
                </div>
              </li>
            ) : (
              <li
                key={member.id}
                className="flex flex-wrap items-center gap-3.5 rounded-xl border border-ink/10 p-3.5 transition hover:border-ink/20"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ink/10 bg-[#fbfbf8]">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-center text-[0.6rem] font-bold uppercase text-muted">No photo</span>
                  )}
                </div>
                <div className="min-w-[160px] flex-1">
                  <p className="font-bold text-ink">{member.name}</p>
                  <p className="truncate text-sm text-muted">{member.role}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(member.id, "up")}
                    disabled={index === 0 || movingId === member.id}
                    aria-label={`Move ${member.name} up`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-ink/[0.06] hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronUpIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(member.id, "down")}
                    disabled={index === members.length - 1 || movingId === member.id}
                    aria-label={`Move ${member.name} down`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-ink/[0.06] hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => startEdit(member)} className={EDIT_BUTTON_CLASSES}>
                    <EditIcon className="h-4 w-4" />
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(member.id)} className={DELETE_BUTTON_CLASSES}>
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      ) : null}

      {!loading && !members.length ? <p className="mb-5 text-sm text-muted">No management members added yet.</p> : null}

      <form onSubmit={handleAdd} className="grid gap-2.5 rounded-xl border border-dashed border-ink/20 bg-[#fafbfa] p-4">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-muted">Add a member</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
            placeholder="Full name"
            className={INPUT_CLASSES}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setForm((f) => ({ ...f, photoFile: event.target.files[0] || null }))}
            className={FILE_INPUT_CLASSES}
          />
          <input
            value={form.role}
            onChange={(event) => setForm((f) => ({ ...f, role: event.target.value }))}
            placeholder="Role (English)"
            className={INPUT_CLASSES}
          />
          <input
            value={form.roleUr}
            onChange={(event) => setForm((f) => ({ ...f, roleUr: event.target.value }))}
            placeholder="Role (Urdu, optional)"
            dir="rtl"
            className={INPUT_CLASSES}
          />
          <textarea
            value={form.copy}
            onChange={(event) => setForm((f) => ({ ...f, copy: event.target.value }))}
            placeholder="Bio (English)"
            rows={3}
            className={`${INPUT_CLASSES} min-h-[80px] resize-y`}
          />
          <textarea
            value={form.copyUr}
            onChange={(event) => setForm((f) => ({ ...f, copyUr: event.target.value }))}
            placeholder="Bio (Urdu, optional)"
            dir="rtl"
            rows={3}
            className={`${INPUT_CLASSES} min-h-[80px] resize-y`}
          />
        </div>
        <div>
          <Button
            type="submit"
            size="sm"
            disabled={saving || !form.name.trim() || !form.role.trim() || !form.copy.trim()}
          >
            {saving ? "Adding..." : "Add Member"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
