"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Panel from "@/components/admin/Panel";
import Notice from "@/components/admin/Notice";
import SearchBar from "@/components/admin/SearchBar";
import DraftPlayerModal from "@/components/admin/DraftPlayerModal";
import { INPUT_CLASSES } from "@/components/admin/formStyles";
import { ClipboardIcon, RefreshIcon } from "@/components/admin/icons";
import { safeJsonResponse } from "@/lib/http";
import { BATTING_STYLES, BOWLING_STYLES, ROLES, ROSTER_TEAMS, TEAM_CARDS } from "@/lib/siteData";

const BADGE_BY_TEAM = Object.fromEntries(TEAM_CARDS.map((team) => [team.name, team.code]));

// Signed photo URLs last 1 hour, so quietly reload a little before that
// during a long draft session.
const RELOAD_INTERVAL_MS = 50 * 60 * 1000;

// Used on the card only if the sponsors API has no logos to show.
const FALLBACK_SPONSORS = [
  { name: "Sponsor", logo: "/sponsor1.png" },
  { name: "Sponsor", logo: "/sponsor2.png" },
  { name: "Sponsor", logo: "/sponsor3.png" },
];

const SELECT_CLASSES = `${INPUT_CLASSES} h-11`;

function PlayerTile({ player, onOpen }) {
  const allocated = Boolean(player.allocatedTeam);
  return (
    <button
      type="button"
      onClick={() => onOpen(player.id)}
      className={`group overflow-hidden rounded-xl border border-ink/10 bg-white text-left transition hover:-translate-y-0.5 hover:border-green/40 hover:shadow-panel focus:outline-none focus-visible:ring-4 focus-visible:ring-green/20 ${
        allocated ? "opacity-60 hover:opacity-100" : ""
      }`}
    >
      <div className="relative aspect-square bg-navy">
        {player.photo ? (
          <img
            src={player.photo}
            alt={player.playerName}
            loading="lazy"
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-b from-navy-light to-navy-dark">
            <svg viewBox="0 0 200 200" className="h-2/3 w-2/3 opacity-30" aria-hidden="true">
              <circle cx="100" cy="70" r="38" fill="#ffffff" />
              <path d="M30 200c0-46 31-78 70-78s70 32 70 78z" fill="#ffffff" />
            </svg>
          </div>
        )}
        {allocated ? (
          <span className="absolute inset-x-1.5 bottom-1.5 flex items-center gap-1.5 rounded-full bg-white/95 py-0.5 pl-0.5 pr-2 text-[0.68rem] font-bold text-green-dark shadow">
            {BADGE_BY_TEAM[player.allocatedTeam] ? (
              <img src={BADGE_BY_TEAM[player.allocatedTeam]} alt="" className="h-5 w-5 shrink-0 rounded-full object-contain" />
            ) : null}
            <span className="truncate">{player.allocatedTeam}</span>
          </span>
        ) : null}
        {player.verified ? (
          <span
            title="Verified"
            className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-green text-[0.65rem] font-black text-white shadow"
          >
            ✓
          </span>
        ) : null}
      </div>
      <div className="p-2.5">
        <p className="truncate text-sm font-bold text-ink">{player.playerName}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate rounded-full bg-green/10 px-2 py-0.5 text-[0.68rem] font-bold text-green-dark">
            {player.playingRole || "-"}
          </span>
          <span className="shrink-0 font-mono text-[0.62rem] font-bold text-muted">
            {player.registrationId.replace(/^mpl-\d{4}-/i, "#")}
          </span>
        </div>
      </div>
    </button>
  );
}

function SkeletonTile() {
  return (
    <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
      <div className="aspect-square animate-pulse bg-ink/[0.07]" />
      <div className="grid gap-2 p-2.5">
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-ink/[0.07]" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-ink/[0.07]" />
      </div>
    </div>
  );
}

export default function DraftBoard({ onAllocated }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [sponsors, setSponsors] = useState(FALLBACK_SPONSORS);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [batting, setBatting] = useState("");
  const [bowling, setBowling] = useState("");
  const [teamStatus, setTeamStatus] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // The modal steps through a snapshot of the list taken when it opened, so
  // drafting a player while "Unallocated" is filtered doesn't reshuffle the
  // prev/next order mid-draft.
  const [openId, setOpenId] = useState(null);
  const [navIds, setNavIds] = useState([]);
  const [message, setMessage] = useState(null);
  const messageTimer = useRef(null);

  const loadPlayers = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/admin/draft-players", { cache: "no-store" });
      const data = await safeJsonResponse(res);
      if (!res.ok) throw new Error(data.error || "Could not load players.");
      setPlayers(data.players || []);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPlayers();
    const timer = setInterval(() => loadPlayers({ silent: true }), RELOAD_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadPlayers]);

  useEffect(() => {
    fetch("/api/sponsors")
      .then((res) => safeJsonResponse(res))
      .then((data) => {
        const withLogos = (data.sponsors || [])
          .filter((sponsor) => sponsor.logo)
          .slice(0, 6)
          .map((sponsor) => ({ id: sponsor.id, name: sponsor.name, logo: sponsor.logo }));
        if (withLogos.length) setSponsors(withLogos);
      })
      .catch(() => {
        // Keep the static fallback logos.
      });
  }, []);

  useEffect(() => () => clearTimeout(messageTimer.current), []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return players.filter((player) => {
      if (
        query &&
        !player.playerName.toLowerCase().includes(query) &&
        !player.registrationId.toLowerCase().includes(query)
      ) {
        return false;
      }
      if (role && player.playingRole !== role) return false;
      if (batting && player.battingStyle !== batting) return false;
      if (bowling && player.bowlingStyle !== bowling) return false;
      if (teamStatus === "unallocated" && player.allocatedTeam) return false;
      if (teamStatus === "allocated" && !player.allocatedTeam) return false;
      if (verifiedOnly && !player.verified) return false;
      return true;
    });
  }, [players, search, role, batting, bowling, teamStatus, verifiedOnly]);

  const teamCounts = useMemo(() => {
    const counts = Object.fromEntries(ROSTER_TEAMS.map((team) => [team, 0]));
    players.forEach((player) => {
      if (player.allocatedTeam in counts) counts[player.allocatedTeam] += 1;
    });
    return counts;
  }, [players]);

  const unallocatedCount = players.filter((player) => !player.allocatedTeam).length;
  const filtersActive = Boolean(search.trim() || role || batting || bowling || teamStatus !== "all" || verifiedOnly);

  function clearFilters() {
    setSearch("");
    setRole("");
    setBatting("");
    setBowling("");
    setTeamStatus("all");
    setVerifiedOnly(false);
  }

  function showMessage(next) {
    clearTimeout(messageTimer.current);
    setMessage(next);
    if (next?.tone === "success") {
      messageTimer.current = setTimeout(() => setMessage(null), 2500);
    }
  }

  function openPlayer(id) {
    setNavIds(filtered.map((player) => player.id));
    setOpenId(id);
    showMessage(null);
  }

  const closeModal = useCallback(() => {
    setOpenId(null);
    setNavIds([]);
    clearTimeout(messageTimer.current);
    setMessage(null);
  }, []);

  const position = navIds.indexOf(openId);

  const step = useCallback(
    (delta) => {
      const index = navIds.indexOf(openId);
      const next = navIds[index + delta];
      if (index === -1 || !next) return;
      setOpenId(next);
      clearTimeout(messageTimer.current);
      setMessage(null);
    },
    [navIds, openId]
  );

  useEffect(() => {
    if (!openId) return undefined;
    function handleKeyDown(event) {
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openId, step]);

  function setPlayerTeam(id, allocatedTeam) {
    setPlayers((prev) => prev.map((player) => (player.id === id ? { ...player, allocatedTeam } : player)));
  }

  // Uses the existing allocate endpoint (PUT /api/admin/registrations), with
  // an optimistic update that is rolled back if the request fails.
  async function handleAllocate(player, team) {
    const previous = player.allocatedTeam || "";
    if (previous === team) return;

    setPlayerTeam(player.id, team);
    showMessage({ tone: "info", text: "Saving...", pending: true });

    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: player.id, allocatedTeam: team }),
      });
      const data = await safeJsonResponse(res);
      if (!res.ok) throw new Error(data.error || "Could not update the allocated team.");

      const saved = data.allocatedTeam || "";
      setPlayerTeam(player.id, saved);
      onAllocated?.(player.id, saved);
      showMessage({
        tone: "success",
        text: saved ? `${player.playerName} drafted to ${saved}.` : `${player.playerName} is now unassigned.`,
      });
    } catch (error) {
      setPlayerTeam(player.id, previous);
      showMessage({ tone: "error", text: error.message });
    }
  }

  const openPlayerData = openId ? players.find((player) => player.id === openId) : null;

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {ROSTER_TEAMS.map((team) => (
          <div
            key={team}
            className="flex items-center gap-2.5 rounded-2xl border border-ink/10 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(16,32,24,0.04)]"
          >
            {BADGE_BY_TEAM[team] ? (
              <img src={BADGE_BY_TEAM[team]} alt="" className="h-9 w-9 shrink-0 rounded-full object-contain" />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-[0.7rem] font-bold text-muted">{team}</p>
              <p className="text-lg font-bold leading-none tabular-nums text-ink">{teamCounts[team]}</p>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2.5 rounded-2xl border border-gold/40 bg-gold/10 px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-[0.7rem] font-bold text-navy-dark">Unallocated</p>
            <p className="text-lg font-bold leading-none tabular-nums text-navy-dark">{unallocatedCount}</p>
          </div>
        </div>
      </div>

      <Panel
        title="Players"
        description="Click a player to open their stat card, draft them to a team, or download the card."
        bodyClassName="p-0"
        actions={
          <button
            type="button"
            onClick={() => loadPlayers({ silent: true })}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-1.5 text-sm font-bold text-green-dark transition hover:bg-green/10 disabled:opacity-50"
          >
            <RefreshIcon className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      >
        <div className="grid gap-3 border-b border-ink/[0.06] px-5 py-4 sm:px-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by name or registration ID..."
              className="col-span-2 md:col-span-1"
            />
            <select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)} className={SELECT_CLASSES}>
              <option value="">All roles</option>
              {ROLES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select aria-label="Batting style" value={batting} onChange={(e) => setBatting(e.target.value)} className={SELECT_CLASSES}>
              <option value="">All batting</option>
              {BATTING_STYLES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select aria-label="Bowling style" value={bowling} onChange={(e) => setBowling(e.target.value)} className={SELECT_CLASSES}>
              <option value="">All bowling</option>
              {BOWLING_STYLES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select aria-label="Team status" value={teamStatus} onChange={(e) => setTeamStatus(e.target.value)} className={SELECT_CLASSES}>
              <option value="all">All players</option>
              <option value="unallocated">Unallocated</option>
              <option value="allocated">Allocated</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="h-4 w-4 accent-green"
              />
              Verified only
            </label>
            <p className="text-xs font-semibold tabular-nums text-muted">
              <span className="text-ink">{filtered.length}</span> of <span className="text-ink">{players.length}</span>{" "}
              players <span className="mx-1 text-ink/20">|</span> <span className="text-ink">{unallocatedCount}</span>{" "}
              unallocated
              {filtersActive ? (
                <button type="button" onClick={clearFilters} className="ml-3 font-bold text-green-dark hover:underline">
                  Clear filters
                </button>
              ) : null}
            </p>
          </div>
        </div>

        {loadError ? (
          <div className="px-5 pt-4 sm:px-6">
            <Notice tone="error">{loadError}</Notice>
          </div>
        ) : null}

        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
              {Array.from({ length: 12 }, (_, index) => (
                <SkeletonTile key={index} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ink/[0.05] text-muted">
                <ClipboardIcon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-bold text-ink">
                {players.length === 0 ? "No players registered yet." : "No players match your filters."}
              </p>
              {filtersActive ? (
                <button type="button" onClick={clearFilters} className="mt-1 text-sm font-bold text-green-dark hover:underline">
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
              {filtered.map((player) => (
                <PlayerTile key={player.id} player={player} onOpen={openPlayer} />
              ))}
            </div>
          )}
        </div>
      </Panel>

      {openPlayerData ? (
        <DraftPlayerModal
          player={openPlayerData}
          sponsors={sponsors}
          position={position}
          total={navIds.length}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onClose={closeModal}
          onAllocate={handleAllocate}
          message={message}
        />
      ) : null}
    </div>
  );
}
