"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

const STAT_FIELDS = [
  { key: "played", label: "M" },
  { key: "won", label: "W" },
  { key: "lost", label: "L" },
  { key: "tied", label: "T" },
  { key: "noResult", label: "NR" },
  { key: "points", label: "P" },
];

const EMPTY_FORM = { team: "", played: "", won: "", lost: "", tied: "", noResult: "", points: "", netRunRate: "" };

function toFormValues(row) {
  return {
    team: row.team,
    played: String(row.played ?? 0),
    won: String(row.won ?? 0),
    lost: String(row.lost ?? 0),
    tied: String(row.tied ?? 0),
    noResult: String(row.noResult ?? 0),
    points: String(row.points ?? 0),
    netRunRate: String(row.netRunRate ?? 0),
  };
}

export default function PointsTableCard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  useEffect(() => {
    loadRows();
  }, []);

  async function loadRows() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/points-table", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load the points table.");
      setRows(data.rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(event) {
    event.preventDefault();
    if (!form.team.trim()) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/points-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: form.team.trim(), ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add the team.");
      setForm(EMPTY_FORM);
      await loadRows();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(row) {
    setEditingId(row.id);
    setEditForm(toFormValues(row));
    setError("");
  }

  async function handleUpdate(id) {
    if (!editForm.team.trim()) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/points-table", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, team: editForm.team.trim(), ...editForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update the row.");
      setEditingId(null);
      await loadRows();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this team from the points table? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/points-table", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete the row.");
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-panel">
      <h2 className="mb-1 text-lg font-bold text-ink">Points Table</h2>
      <p className="mb-4 text-muted">
        Manage league standings shown on the homepage. Rows are ranked automatically by points, then net run rate.
      </p>

      {error ? <p className="mb-3 font-semibold text-brand-red">{error}</p> : null}
      {loading ? <p className="text-muted">Loading points table...</p> : null}

      {!loading && rows.length ? (
        <ul className="mb-5 grid gap-3">
          {rows.map((row) =>
            editingId === row.id ? (
              <li key={row.id} className="rounded-lg border border-green/30 bg-[#f6faf2] p-3.5">
                <input
                  value={editForm.team}
                  onChange={(event) => setEditForm((f) => ({ ...f, team: event.target.value }))}
                  placeholder="Team name"
                  className="mb-2.5 w-full rounded-lg border border-ink/15 px-3 py-2 font-medium outline-none focus:border-green"
                />
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-7">
                  {STAT_FIELDS.map((field) => (
                    <label key={field.key} className="text-sm">
                      <span className="mb-1 block font-bold text-muted">{field.label}</span>
                      <input
                        type="number"
                        value={editForm[field.key]}
                        onChange={(event) =>
                          setEditForm((f) => ({ ...f, [field.key]: event.target.value }))
                        }
                        className="w-full rounded-lg border border-ink/15 px-2 py-1.5 outline-none focus:border-green"
                      />
                    </label>
                  ))}
                  <label className="text-sm">
                    <span className="mb-1 block font-bold text-muted">NRR</span>
                    <input
                      type="number"
                      step="0.001"
                      value={editForm.netRunRate}
                      onChange={(event) =>
                        setEditForm((f) => ({ ...f, netRunRate: event.target.value }))
                      }
                      className="w-full rounded-lg border border-ink/15 px-2 py-1.5 outline-none focus:border-green"
                    />
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button type="button" disabled={saving} onClick={() => handleUpdate(row.id)}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </li>
            ) : (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3.5 rounded-lg border border-ink/10 p-3.5"
              >
                <div className="min-w-[160px] flex-1">
                  <p className="font-bold text-ink">{row.team}</p>
                  <p className="text-sm text-muted">
                    M {row.played} · W {row.won} · L {row.lost} · T {row.tied} · NR {row.noResult} · P{" "}
                    <span className="font-bold text-green-dark">{row.points}</span> · NRR{" "}
                    <span className={row.netRunRate >= 0 ? "font-bold text-green-dark" : "font-bold text-brand-red"}>
                      {row.netRunRate > 0 ? "+" : ""}
                      {row.netRunRate}
                    </span>
                  </p>
                </div>
                <div className="flex gap-3.5">
                  <button type="button" onClick={() => startEdit(row)} className="font-bold text-green hover:text-green-dark">
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(row.id)} className="font-bold text-brand-red">
                    Delete
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      ) : null}

      {!loading && !rows.length ? <p className="mb-5 text-muted">No teams added yet.</p> : null}

      <form onSubmit={handleAdd} className="rounded-lg border border-dashed border-ink/15 p-3.5">
        <input
          value={form.team}
          onChange={(event) => setForm((f) => ({ ...f, team: event.target.value }))}
          placeholder="Team name"
          className="mb-2.5 w-full rounded-lg border border-ink/15 px-3 py-2 font-medium outline-none focus:border-green sm:max-w-xs"
        />
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-7">
          {STAT_FIELDS.map((field) => (
            <label key={field.key} className="text-sm">
              <span className="mb-1 block font-bold text-muted">{field.label}</span>
              <input
                type="number"
                value={form[field.key]}
                onChange={(event) => setForm((f) => ({ ...f, [field.key]: event.target.value }))}
                className="w-full rounded-lg border border-ink/15 px-2 py-1.5 outline-none focus:border-green"
              />
            </label>
          ))}
          <label className="text-sm">
            <span className="mb-1 block font-bold text-muted">NRR</span>
            <input
              type="number"
              step="0.001"
              value={form.netRunRate}
              onChange={(event) => setForm((f) => ({ ...f, netRunRate: event.target.value }))}
              className="w-full rounded-lg border border-ink/15 px-2 py-1.5 outline-none focus:border-green"
            />
          </label>
        </div>
        <Button type="submit" disabled={saving || !form.team.trim()} className="mt-3">
          {saving ? "Adding..." : "Add Team"}
        </Button>
      </form>
    </section>
  );
}
