"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Panel from "@/components/admin/Panel";
import Notice from "@/components/admin/Notice";
import { INPUT_CLASSES } from "@/components/admin/formStyles";
import { getYoutubeEmbedUrl } from "@/lib/youtube";

export default function HighlightsSettingsCard() {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setValue(data.highlightVideoUrl || "");
        setSaved(data.highlightVideoUrl || "");
      })
      .catch(() => setError("Could not load the current highlight link."))
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
        body: JSON.stringify({ highlightVideoUrl: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the link.");
      setSaved(data.highlightVideoUrl);
      setSuccess("Match highlight video updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const trimmedValue = value.trim();
  const previewUrl = getYoutubeEmbedUrl(trimmedValue);
  const isDirty = trimmedValue !== saved.trim();

  return (
    <Panel
      title="Match Highlights Video"
      description="Paste a YouTube link (watch, share, or youtu.be). It shows on the homepage as an embedded video."
    >
      <form onSubmit={handleSave} className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <input
          type="url"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={loading}
          className={`${INPUT_CLASSES} min-h-[40px] flex-1 px-3.5`}
        />
        <Button type="submit" size="sm" disabled={saving || loading || !isDirty}>
          {saving ? "Saving..." : "Save"}
        </Button>
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
      {trimmedValue && !previewUrl ? (
        <Notice tone="error" className="mt-4">
          This doesn&apos;t look like a valid YouTube link.
        </Notice>
      ) : null}

      {previewUrl ? (
        <div className="mt-4 aspect-video w-full max-w-md overflow-hidden rounded-xl border border-ink/10 bg-ink/5">
          <iframe
            src={previewUrl}
            title="Highlight video preview"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : null}
    </Panel>
  );
}
