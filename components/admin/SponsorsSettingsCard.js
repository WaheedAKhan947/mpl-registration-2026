"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { readFileAsDataUrl } from "@/lib/files";

const EMPTY_FORM = { name: "", url: "", logoFile: null };

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
        body: JSON.stringify({ name: form.name.trim(), url: form.url.trim(), logo }),
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
    setEditForm({ name: sponsor.name, url: sponsor.url || "", logoFile: null });
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
        body: JSON.stringify({ id, name: editForm.name.trim(), url: editForm.url.trim(), logo }),
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
    <section className="mb-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-panel">
      <h2 className="mb-1 text-lg font-bold text-ink">Sponsors</h2>
      <p className="mb-4 text-muted">
        Manage the sponsor logos, names, and website links shown on the homepage.
      </p>

      {error ? <p className="mb-3 font-semibold text-brand-red">{error}</p> : null}
      {loading ? <p className="text-muted">Loading sponsors...</p> : null}

      {!loading && sponsors.length ? (
        <ul className="mb-5 grid gap-3">
          {sponsors.map((sponsor) =>
            editingId === sponsor.id ? (
              <li key={sponsor.id} className="rounded-lg border border-green/30 bg-[#f6faf2] p-3.5">
                <div className="grid gap-2.5 sm:grid-cols-3">
                  <input
                    value={editForm.name}
                    onChange={(event) => setEditForm((f) => ({ ...f, name: event.target.value }))}
                    placeholder="Sponsor name"
                    className="rounded-lg border border-ink/15 px-3 py-2 font-medium outline-none focus:border-green"
                  />
                  <input
                    value={editForm.url}
                    onChange={(event) => setEditForm((f) => ({ ...f, url: event.target.value }))}
                    placeholder="https://sponsor-site.com"
                    className="rounded-lg border border-ink/15 px-3 py-2 font-medium outline-none focus:border-green"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setEditForm((f) => ({ ...f, logoFile: event.target.files[0] || null }))}
                    className="rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-sm"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button type="button" disabled={saving} onClick={() => handleUpdate(sponsor.id)}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  {sponsor.logo ? (
                    <button
                      type="button"
                      className="font-bold text-brand-red"
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
                className="flex flex-wrap items-center gap-3.5 rounded-lg border border-ink/10 p-3.5"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink/10 bg-[#fbfbf8]">
                  {sponsor.logo ? (
                    <img src={sponsor.logo} alt={sponsor.name} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-center text-[0.6rem] font-bold uppercase text-muted">No logo</span>
                  )}
                </div>
                <div className="min-w-[140px] flex-1">
                  <p className="font-bold text-ink">{sponsor.name}</p>
                  <p className="truncate text-sm text-muted">{sponsor.url || "No link set"}</p>
                </div>
                <div className="flex gap-3.5">
                  <button type="button" onClick={() => startEdit(sponsor)} className="font-bold text-green hover:text-green-dark">
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(sponsor.id)} className="font-bold text-brand-red">
                    Delete
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      ) : null}

      {!loading && !sponsors.length ? <p className="mb-5 text-muted">No sponsors added yet.</p> : null}

      <form
        onSubmit={handleAdd}
        className="grid gap-2.5 rounded-lg border border-dashed border-ink/15 p-3.5 sm:grid-cols-[1fr_1fr_auto_auto]"
      >
        <input
          value={form.name}
          onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
          placeholder="Sponsor name"
          className="rounded-lg border border-ink/15 px-3 py-2 font-medium outline-none focus:border-green"
        />
        <input
          value={form.url}
          onChange={(event) => setForm((f) => ({ ...f, url: event.target.value }))}
          placeholder="https://sponsor-site.com"
          className="rounded-lg border border-ink/15 px-3 py-2 font-medium outline-none focus:border-green"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setForm((f) => ({ ...f, logoFile: event.target.files[0] || null }))}
          className="rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-sm"
        />
        <Button type="submit" disabled={saving || !form.name.trim()}>
          {saving ? "Adding..." : "Add Sponsor"}
        </Button>
      </form>
    </section>
  );
}
