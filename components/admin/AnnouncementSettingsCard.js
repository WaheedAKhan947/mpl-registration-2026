"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Panel from "@/components/admin/Panel";
import Notice from "@/components/admin/Notice";
import { INPUT_CLASSES } from "@/components/admin/formStyles";

const MAX_LENGTH = 240;

export default function AnnouncementSettingsCard() {
  const [text, setText] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [saved, setSaved] = useState({ text: "", enabled: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setText(data.announcementText || "");
        setEnabled(data.announcementEnabled ?? true);
        setSaved({ text: data.announcementText || "", enabled: data.announcementEnabled ?? true });
      })
      .catch(() => setError("Could not load the current announcement."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementText: text, announcementEnabled: enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the announcement.");
      setSaved({ text: data.announcementText, enabled: data.announcementEnabled });
      setSuccess("Announcement bar updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const trimmedText = text.trim();
  const isDirty = trimmedText !== saved.text.trim() || enabled !== saved.enabled;

  return (
    <Panel
      title="Top Announcement Bar"
      description="Shown at the very top of every page on both mobile and desktop. Use it for time-sensitive news like a registration deadline extension."
    >
      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Example: Registration deadline extended to 30 Nov 2025 - register now!"
          maxLength={MAX_LENGTH}
          disabled={loading}
          rows={2}
          className={`${INPUT_CLASSES} min-h-[72px] resize-y px-3.5 py-2.5`}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-bold text-ink">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              disabled={loading}
              className="h-[18px] w-[18px] rounded accent-green"
            />
            Show announcement bar on the site
          </label>
          <span className="text-xs font-semibold tabular-nums text-muted">
            {trimmedText.length}/{MAX_LENGTH}
          </span>
        </div>
        <div>
          <Button type="submit" size="sm" disabled={saving || loading || !isDirty}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>

      {error ? (
        <Notice tone="error" className="mt-4">
          {error}
        </Notice>
      ) : null}
      {success && !isDirty ? (
        <Notice tone="success" className="mt-4">
          {success}
        </Notice>
      ) : null}
    </Panel>
  );
}
