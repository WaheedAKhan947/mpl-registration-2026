"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Panel from "@/components/admin/Panel";
import Notice from "@/components/admin/Notice";
import MatchSetup from "@/components/admin/scoring/MatchSetup";
import LiveScorer from "@/components/admin/scoring/LiveScorer";
import OverlayLinkBox from "@/components/admin/scoring/OverlayLinkBox";
import { ChevronLeftIcon, RefreshIcon } from "@/components/admin/icons";
import { formatMatchDate, teamLogo } from "@/lib/matches";
import { safeJsonResponse } from "@/lib/http";

const SELECTED_KEY = "mpl-scoring-match";

const SCORING_PILLS = {
  not_started: { label: "Not started", className: "bg-ink/[0.06] text-muted" },
  in_progress: { label: "Scoring live", className: "bg-brand-red text-white" },
  completed: { label: "Finished", className: "bg-green/10 text-green-dark" },
};

function readStored() {
  try {
    return localStorage.getItem(SELECTED_KEY) || "";
  } catch {
    return "";
  }
}

function writeStored(id) {
  try {
    if (id) localStorage.setItem(SELECTED_KEY, id);
    else localStorage.removeItem(SELECTED_KEY);
  } catch {
    // Storage blocked (private mode): the scorer just picks the match again.
  }
}

function Logo({ team }) {
  const logo = teamLogo(team);
  if (!logo) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={logo} alt="" className="h-7 w-7 shrink-0 object-contain" />;
}

function ScoringPill({ status }) {
  const pill = SCORING_PILLS[status] || SCORING_PILLS.not_started;
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-wide ${pill.className}`}>
      {pill.label}
    </span>
  );
}

function MatchRow({ match, onOpen }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(match.id)}
        className="flex min-h-[64px] w-full flex-wrap items-center gap-3 rounded-xl border border-ink/10 bg-white px-3.5 py-3 text-left transition hover:border-green/40 hover:shadow-sm"
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            {match.matchNumber ? `Match ${match.matchNumber} · ` : ""}
            {formatMatchDate(match.date)}
            {match.time ? ` · ${match.time}` : ""}
          </p>
          <p className="mt-0.5 flex min-w-0 items-center gap-2 font-bold text-ink">
            <Logo team={match.teamA} />
            <span className="truncate">{match.teamA}</span>
            <span className="text-xs font-black text-muted">vs</span>
            <Logo team={match.teamB} />
            <span className="truncate">{match.teamB}</span>
          </p>
          {match.result ? <p className="mt-0.5 truncate text-sm text-green-dark">{match.result}</p> : null}
        </div>
        <ScoringPill status={match.scoringStatus} />
      </button>
    </li>
  );
}

function MatchList({ matches, loading, error, onOpen, onRefresh }) {
  const groups = [
    { title: "Live now", items: matches.filter((m) => m.scoringStatus === "in_progress") },
    { title: "Ready to score", items: matches.filter((m) => m.scoringStatus === "not_started" && m.status !== "abandoned") },
    { title: "Finished", items: matches.filter((m) => m.scoringStatus === "completed") },
  ];

  return (
    <Panel
      title="Live scoring"
      description="Pick a match to set up the toss and playing XI, then score it ball by ball."
      actions={
        <Button type="button" variant="secondary" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {error ? <Notice tone="error">{error}</Notice> : null}
      {loading && !matches.length ? <p className="text-sm text-muted">Loading matches...</p> : null}
      {!loading && !error && !matches.length ? (
        <p className="text-sm text-muted">No fixtures yet. Add them under Scorecard &amp; Fixtures.</p>
      ) : null}
      <div className="grid gap-5">
        {groups
          .filter((group) => group.items.length)
          .map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-muted">{group.title}</h3>
              <ul className="grid gap-2">
                {group.items.map((match) => (
                  <MatchRow key={match.id} match={match} onOpen={onOpen} />
                ))}
              </ul>
            </div>
          ))}
      </div>
    </Panel>
  );
}

function MatchView({ matchId, user, onBack, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingSetup, setEditingSetup] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/scoring/matches/${matchId}`, { cache: "no-store" });
      const result = await safeJsonResponse(res);
      if (!res.ok) throw new Error(result.error || "Could not load the match.");
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleStarted(result) {
    setData(result);
    setEditingSetup(false);
    onChanged();
  }

  const match = data?.match;
  const showSetup = match && (match.scoringStatus === "not_started" || editingSetup);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={onBack}>
          <ChevronLeftIcon className="h-4 w-4" />
          All matches
        </Button>
        {match ? (
          <div className="order-last flex w-full min-w-0 items-center gap-2 font-sans text-lg font-black text-navy-dark sm:order-none sm:w-auto sm:flex-1">
            <Logo team={match.teamA} />
            <span className="truncate">{match.teamA}</span>
            <span className="text-sm text-muted">vs</span>
            <Logo team={match.teamB} />
            <span className="truncate">{match.teamB}</span>
          </div>
        ) : null}
        {match ? (
          <span className="ml-auto sm:ml-0">
            <ScoringPill status={match.scoringStatus} />
          </span>
        ) : null}
      </div>

      {match ? <OverlayLinkBox matchId={match.id} /> : null}

      {error ? (
        <Notice tone="error">
          {error}{" "}
          <button type="button" onClick={load} className="underline">
            Try again
          </button>
        </Notice>
      ) : null}
      {loading && !data ? <p className="text-sm text-muted">Loading match...</p> : null}

      {showSetup ? (
        <MatchSetup
          data={data}
          onStarted={handleStarted}
          onCancel={editingSetup ? () => setEditingSetup(false) : undefined}
        />
      ) : null}
      {match && !showSetup ? (
        <LiveScorer
          data={data}
          setData={setData}
          user={user}
          onEditSetup={() => setEditingSetup(true)}
          onChanged={onChanged}
        />
      ) : null}
    </div>
  );
}

export default function ScoringCard({ user }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/scoring/matches", { cache: "no-store" });
      const result = await safeJsonResponse(res);
      if (!res.ok) throw new Error(result.error || "Could not load matches.");
      setMatches(result.matches || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelectedId(readStored());
    loadMatches();
  }, [loadMatches]);

  function open(id) {
    setSelectedId(id);
    writeStored(id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  function back() {
    setSelectedId("");
    writeStored("");
    loadMatches();
  }

  if (selectedId) {
    return <MatchView key={selectedId} matchId={selectedId} user={user} onBack={back} onChanged={loadMatches} />;
  }

  return <MatchList matches={matches} loading={loading} error={error} onOpen={open} onRefresh={loadMatches} />;
}
