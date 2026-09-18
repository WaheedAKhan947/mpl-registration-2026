"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Panel from "@/components/admin/Panel";
import Notice from "@/components/admin/Notice";
import { INPUT_CLASSES } from "@/components/admin/formStyles";

const EMPTY_FORM = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function AccountSettingsCard({ user }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not change password.");
      setForm(EMPTY_FORM);
      setSuccess("Password updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel
      title="Your account"
      description={user?.email ? `Signed in as ${user.email}. Change your login password here.` : "Change your login password."}
    >
      {error ? (
        <Notice tone="error" className="mb-4">
          {error}
        </Notice>
      ) : null}
      {success ? (
        <Notice tone="success" className="mb-4">
          {success}
        </Notice>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-3 sm:max-w-[360px]">
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-ink">Current password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={(event) => setForm((f) => ({ ...f, currentPassword: event.target.value }))}
            required
            className={INPUT_CLASSES}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-ink">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={(event) => setForm((f) => ({ ...f, newPassword: event.target.value }))}
            required
            minLength={8}
            className={INPUT_CLASSES}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-ink">Confirm new password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(event) => setForm((f) => ({ ...f, confirmPassword: event.target.value }))}
            required
            minLength={8}
            className={INPUT_CLASSES}
          />
        </label>
        <Button type="submit" size="sm" disabled={saving} className="mt-1 w-full sm:w-auto">
          {saving ? "Updating..." : "Update password"}
        </Button>
      </form>
    </Panel>
  );
}
