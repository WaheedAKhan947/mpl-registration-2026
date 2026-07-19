"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
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
    <section className="mb-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-panel">
      <h2 className="mb-1 text-lg font-bold text-ink">Match Highlights Video</h2>
      <p className="mb-4 text-muted">
        Paste a YouTube link (watch, share, or youtu.be). It shows on the homepage as an embedded video.
      </p>

      <form onSubmit={handleSave} className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <input
          type="url"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={loading}
          className="min-h-[46px] flex-1 rounded-lg border border-ink/15 px-3.5 font-medium outline-none focus:border-green"
        />
        <Button type="submit" disabled={saving || loading || !isDirty}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </form>

      {error ? <p className="mt-3 font-semibold text-brand-red">{error}</p> : null}
      {success && !isDirty ? <p className="mt-3 font-semibold text-green-dark">{success}</p> : null}
      {trimmedValue && !previewUrl ? (
        <p className="mt-3 font-semibold text-brand-red">This doesn't look like a valid YouTube link.</p>
      ) : null}

      {previewUrl ? (
        <div className="mt-4 aspect-video w-full max-w-md overflow-hidden rounded-lg">
          <iframe
            src={previewUrl}
            title="Highlight video preview"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : null}
    </section>
  );
}
