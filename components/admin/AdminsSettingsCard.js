"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Panel from "@/components/admin/Panel";
import Notice from "@/components/admin/Notice";
import { TrashIcon } from "@/components/admin/icons";
import { DELETE_BUTTON_CLASSES, INPUT_CLASSES } from "@/components/admin/formStyles";

const EMPTY_FORM = { name: "", email: "", password: "", role: "admin" };

export default function AdminsSettingsCard({ currentUserId }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    loadAdmins();
  }, []);

  async function loadAdmins() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/admins", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load team accounts.");
      setAdmins(data.admins);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || form.password.length < 8) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add the account.");
      setForm(EMPTY_FORM);
      await loadAdmins();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this team member's access? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove the account.");
      setAdmins((prev) => prev.filter((admin) => admin.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <Panel
      title="Team access"
      description="Everyone here signs in with their own email and password. Owners can add or remove accounts."
      actions={
        !loading ? (
          <span className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-xs font-bold tabular-nums text-muted">
            {admins.length} account{admins.length === 1 ? "" : "s"}
          </span>
        ) : null
      }
    >
      {error ? (
        <Notice tone="error" className="mb-4">
          {error}
        </Notice>
      ) : null}
      {loading ? <p className="text-sm text-muted">Loading team accounts...</p> : null}

      {!loading && admins.length ? (
        <ul className="mb-5 grid gap-2.5">
          {admins.map((admin) => (
            <li
              key={admin.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-ink/10 p-3.5"
            >
              <div className="min-w-[160px] flex-1">
                <p className="font-bold text-ink">
                  {admin.name}
                  {admin.id === currentUserId ? (
                    <span className="ml-1.5 text-xs font-semibold text-muted">(you)</span>
                  ) : null}
                </p>
                <p className="truncate text-sm text-muted">{admin.email}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                  admin.role === "owner" ? "bg-gold/20 text-navy-dark" : "bg-ink/[0.06] text-muted"
                }`}
              >
                {admin.role}
              </span>
              {admin.id !== currentUserId ? (
                <button type="button" onClick={() => handleDelete(admin.id)} className={DELETE_BUTTON_CLASSES}>
                  <TrashIcon className="h-4 w-4" />
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <form
        onSubmit={handleAdd}
        className="grid gap-2.5 rounded-xl border border-dashed border-ink/20 bg-[#fafbfa] p-4 sm:grid-cols-2"
      >
        <p className="text-xs font-black uppercase tracking-[0.12em] text-muted sm:col-span-2">Add a team member</p>
        <input
          value={form.name}
          onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
          placeholder="Full name"
          className={INPUT_CLASSES}
        />
        <input
          type="email"
          value={form.email}
          onChange={(event) => setForm((f) => ({ ...f, email: event.target.value }))}
          placeholder="Email"
          className={INPUT_CLASSES}
        />
        <input
          type="password"
          value={form.password}
          onChange={(event) => setForm((f) => ({ ...f, password: event.target.value }))}
          placeholder="Temporary password (8+ characters)"
          minLength={8}
          className={INPUT_CLASSES}
        />
        <select
          value={form.role}
          onChange={(event) => setForm((f) => ({ ...f, role: event.target.value }))}
          className={INPUT_CLASSES}
        >
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
        <Button
          type="submit"
          size="sm"
          disabled={saving || !form.name.trim() || !form.email.trim() || form.password.length < 8}
          className="sm:col-span-2"
        >
          {saving ? "Adding..." : "Add team member"}
        </Button>
      </form>
    </Panel>
  );
}
