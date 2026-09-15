"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Panel from "@/components/admin/Panel";
import Notice from "@/components/admin/Notice";
import { EditIcon, TrashIcon } from "@/components/admin/icons";
import {
  DELETE_BUTTON_CLASSES,
  EDIT_BUTTON_CLASSES,
  EDITING_BOX_CLASSES,
  INPUT_CLASSES,
} from "@/components/admin/formStyles";
import { teamLogo } from "@/lib/matches";

const STAT_FIELDS = [
  { key: "played", label: "M" },
  { key: "won", label: "W" },
  { key: "lost", label: "L" },
  { key: "tied", label: "T" },
  { key: "noResult", label: "NR" },
  { key: "points", label: "P" },
];

const EMPTY_FORM = { team: "", played: "", won: "", lost: "", tied: "", noResult: "", points: "", netRunRate: "" };

const SMALL_INPUT_CLASSES = `${INPUT_CLASSES} px-2 py-1.5 tabular-nums`;

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

function StatChip({ label, value, tone = "" }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-ink/[0.05] px-1.5 py-0.5 text-xs tabular-nums">
      <span className="font-bold text-muted">{label}</span>
      <span className={`font-bold ${tone || "text-ink"}`}>{value}</span>
    </span>
  );
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
    <Panel
      title="Points Table"
      description="Manage league standings shown on the homepage. Rows are ranked automatically by points, then net run rate."
    >
      {error ? (
        <Notice tone="error" className="mb-4">
          {error}
        </Notice>
      ) : null}
      {loading ? <p className="text-sm text-muted">Loading points table...</p> : null}

      {!loading && rows.length ? (
        <ul className="mb-5 grid gap-3">
          {rows.map((row, index) =>
            editingId === row.id ? (
              <li key={row.id} className={`${EDITING_BOX_CLASSES} p-4`}>
                <input
                  value={editForm.team}
                  onChange={(event) => setEditForm((f) => ({ ...f, team: event.target.value }))}
                  placeholder="Team name"
                  className={`${INPUT_CLASSES} mb-2.5`}
                />
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-7">
                  {STAT_FIELDS.map((field) => (
                    <label key={field.key} className="text-sm">
                      <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted">
                        {field.label}
                      </span>
                      <input
                        type="number"
                        value={editForm[field.key]}
                        onChange={(event) =>
                          setEditForm((f) => ({ ...f, [field.key]: event.target.value }))
                        }
                        className={SMALL_INPUT_CLASSES}
                      />
                    </label>
                  ))}
                  <label className="text-sm">
                    <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted">
                      NRR
                    </span>
                    <input
                      type="number"
                      step="0.001"
                      value={editForm.netRunRate}
                      onChange={(event) =>
                        setEditForm((f) => ({ ...f, netRunRate: event.target.value }))
                      }
                      className={SMALL_INPUT_CLASSES}
                    />
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Button type="button" size="sm" disabled={saving} onClick={() => handleUpdate(row.id)}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </li>
            ) : (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3.5 rounded-xl border border-ink/10 p-3.5 transition hover:border-ink/20"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/[0.05] text-xs font-black tabular-nums text-muted">
                  {index + 1}
                </span>
                {teamLogo(row.team) ? (
                  <img
                    src={teamLogo(row.team)}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full border border-ink/10 bg-white object-contain p-0.5"
                  />
                ) : null}
                <div className="min-w-[160px] flex-1">
                  <p className="font-bold text-ink">{row.team}</p>
                  <p className="mt-1 flex flex-wrap gap-1.5">
                    <StatChip label="M" value={row.played} />
                    <StatChip label="W" value={row.won} />
                    <StatChip label="L" value={row.lost} />
                    <StatChip label="T" value={row.tied} />
                    <StatChip label="NR" value={row.noResult} />
                    <StatChip label="P" value={row.points} tone="text-green-dark" />
                    <StatChip
                      label="NRR"
                      value={`${row.netRunRate > 0 ? "+" : ""}${row.netRunRate}`}
                      tone={row.netRunRate >= 0 ? "text-green-dark" : "text-brand-red"}
                    />
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => startEdit(row)} className={EDIT_BUTTON_CLASSES}>
                    <EditIcon className="h-4 w-4" />
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(row.id)} className={DELETE_BUTTON_CLASSES}>
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      ) : null}

      {!loading && !rows.length ? <p className="mb-5 text-sm text-muted">No teams added yet.</p> : null}

      <form onSubmit={handleAdd} className="rounded-xl border border-dashed border-ink/20 bg-[#fafbfa] p-4">
        <p className="mb-2.5 text-xs font-black uppercase tracking-[0.12em] text-muted">Add a team</p>
        <input
          value={form.team}
          onChange={(event) => setForm((f) => ({ ...f, team: event.target.value }))}
          placeholder="Team name"
          className={`${INPUT_CLASSES} mb-2.5 sm:max-w-xs`}
        />
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-7">
          {STAT_FIELDS.map((field) => (
            <label key={field.key} className="text-sm">
              <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted">
                {field.label}
              </span>
              <input
                type="number"
                value={form[field.key]}
                onChange={(event) => setForm((f) => ({ ...f, [field.key]: event.target.value }))}
                className={SMALL_INPUT_CLASSES}
              />
            </label>
          ))}
          <label className="text-sm">
            <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted">NRR</span>
            <input
              type="number"
              step="0.001"
              value={form.netRunRate}
              onChange={(event) => setForm((f) => ({ ...f, netRunRate: event.target.value }))}
              className={SMALL_INPUT_CLASSES}
            />
          </label>
        </div>
        <Button type="submit" size="sm" disabled={saving || !form.team.trim()} className="mt-3">
          {saving ? "Adding..." : "Add Team"}
        </Button>
      </form>
    </Panel>
  );
}
