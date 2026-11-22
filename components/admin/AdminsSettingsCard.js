"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Panel from "@/components/admin/Panel";
import Notice from "@/components/admin/Notice";
import { TrashIcon } from "@/components/admin/icons";
import { DELETE_BUTTON_CLASSES, INPUT_CLASSES } from "@/components/admin/formStyles";

const EMPTY_FORM = { name: "", email: "", password: "", role: "admin" };
const TIME_ZONE = "Asia/Karachi";

function clock(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-GB", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function ago(value) {
  if (!value) return "never";
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return clock(value);
}

// On/off switch for an account (owners use it on admins and scorers).
function AccessSwitch({ on, busy, onChange, name }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`Access for ${name}`}
      disabled={busy}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50 ${on ? "bg-green" : "bg-ink/25"}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

// What the owner sees about each account's use of the dashboard.
function Activity({ admin }) {
  const parts = [
    `Last active ${ago(admin.lastActiveAt)}`,
    admin.lastLoginAt ? `last login ${clock(admin.lastLoginAt)}${admin.loginHistory?.[0]?.device ? ` (${admin.loginHistory[0].device})` : ""}` : "never logged in",
    `${admin.loginCount} login${admin.loginCount === 1 ? "" : "s"}`,
  ];
  if (admin.ballsScored) parts.push(`${admin.ballsScored} ball${admin.ballsScored === 1 ? "" : "s"} scored (last ${clock(admin.lastBallAt)})`);
  return (
    <div className="w-full border-t border-ink/[0.07] pt-2.5 text-xs text-muted">
      <p>{parts.join(" · ")}</p>
      {admin.lockedUntil ? (
        <p className="mt-1 font-bold text-brand-red">Locked after failed sign-ins until {clock(admin.lockedUntil)}</p>
      ) : admin.failedAttempts ? (
        <p className="mt-1 font-semibold text-brand-red">
          {admin.failedAttempts} failed sign-in attempt{admin.failedAttempts === 1 ? "" : "s"} (last {clock(admin.lastFailedLoginAt)})
        </p>
      ) : null}
      {!admin.active && admin.disabledAt ? <p className="mt-1 font-semibold text-brand-red">Access turned off {clock(admin.disabledAt)}</p> : null}
      {admin.loginHistory?.length ? (
        <details className="mt-1.5">
          <summary className="cursor-pointer font-bold text-ink/70">Recent logins</summary>
          <ul className="mt-1 grid gap-0.5">
            {admin.loginHistory.map((entry, i) => (
              <li key={i}>
                {clock(entry.at)}
                {entry.device ? ` · ${entry.device}` : ""}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

export default function AdminsSettingsCard({ currentUserId }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [toggling, setToggling] = useState("");

  useEffect(() => {
    loadAdmins();
    // Keep "last active" fresh while the owner has this open.
    const timer = setInterval(() => loadAdmins({ quiet: true }), 60000);
    return () => clearInterval(timer);
  }, []);

  async function loadAdmins({ quiet = false } = {}) {
    if (!quiet) setLoading(true);
    if (!quiet) setError("");
    try {
      const res = await fetch("/api/admin/admins", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load team accounts.");
      setAdmins(data.admins);
    } catch (err) {
      if (!quiet) setError(err.message);
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  async function handleToggle(admin, active) {
    if (!active && !confirm(`Turn off access for ${admin.name}? They are signed out straight away and cannot sign in until you turn it back on.`)) return;
    setToggling(admin.id);
    setError("");
    try {
      const res = await fetch("/api/admin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: admin.id, active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not change access.");
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? data.admin : a)));
    } catch (err) {
      setError(err.message);
    } finally {
      setToggling("");
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
      description="Everyone here signs in with their own email and password. Owners can add or remove accounts, and switch an admin's or scorer's access off and on: switched off, they are signed out at once and cannot sign in."
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
              data-account={admin.email}
              className={`flex flex-wrap items-center gap-3 rounded-xl border p-3.5 ${admin.active ? "border-ink/10" : "border-brand-red/25 bg-brand-red/[0.03]"}`}
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
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                  admin.active ? "bg-green/10 text-green-dark" : "bg-brand-red/10 text-brand-red"
                }`}
              >
                {admin.active ? "Active" : "Off"}
              </span>
              {admin.role !== "owner" && admin.id !== currentUserId ? (
                <AccessSwitch on={admin.active} busy={toggling === admin.id} onChange={(on) => handleToggle(admin, on)} name={admin.name} />
              ) : null}
              {admin.id !== currentUserId ? (
                <button type="button" onClick={() => handleDelete(admin.id)} className={DELETE_BUTTON_CLASSES}>
                  <TrashIcon className="h-4 w-4" />
                  Remove
                </button>
              ) : null}
              <Activity admin={admin} />
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
          <option value="scorer">Scorer (scores &amp; League section only)</option>
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
