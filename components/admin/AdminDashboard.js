"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import DashboardHeader from "@/components/admin/DashboardHeader";
import OverviewPage from "@/components/admin/OverviewPage";
import Panel from "@/components/admin/Panel";
import Notice from "@/components/admin/Notice";
import RegistrationStatusCard from "@/components/admin/RegistrationStatusCard";
import AnnouncementSettingsCard from "@/components/admin/AnnouncementSettingsCard";
import HighlightsSettingsCard from "@/components/admin/HighlightsSettingsCard";
import SponsorsSettingsCard from "@/components/admin/SponsorsSettingsCard";
import TeamOwnersCard from "@/components/admin/TeamOwnersCard";
import PointsTableCard from "@/components/admin/PointsTableCard";
import MatchesCard from "@/components/admin/MatchesCard";
import StatsRow from "@/components/admin/StatsRow";
import SearchBar from "@/components/admin/SearchBar";
import RegistrationsTable from "@/components/admin/RegistrationsTable";
import RegistrationCards from "@/components/admin/RegistrationCards";
import RegistrationDetailsModal from "@/components/admin/RegistrationDetailsModal";
import MFCRegistrationsTable from "@/components/admin/MFCRegistrationsTable";
import MFCRegistrationCards from "@/components/admin/MFCRegistrationCards";
import MFCRegistrationDetailsModal from "@/components/admin/MFCRegistrationDetailsModal";
import {
  CalendarIcon,
  ChartIcon,
  GridIcon,
  SettingsIcon,
  ShieldIcon,
  StarIcon,
  TargetIcon,
  UsersIcon,
} from "@/components/admin/icons";

const MPL_SEARCH_FIELDS = [
  "playerName",
  "fatherName",
  "phone",
  "cnicNumber",
  "area",
  "preferredTeam",
  "playingRole",
  "battingStyle",
  "bowlingStyle",
  "cricProId",
  "notes",
  "allocatedTeam",
];

const MFC_SEARCH_FIELDS = [
  "fullName",
  "fatherName",
  "phone",
  "cnicNumber",
  "village",
  "tehsil",
  "district",
  "position",
  "preferredFoot",
  "previousClub",
];

const SECTIONS = {
  overview: {
    label: "Overview",
    title: "Overview",
    subtitle: "A quick look at registrations and the public site.",
    icon: GridIcon,
  },
  mpl: {
    label: "MPL Registrations",
    title: "MPL Registrations",
    subtitle: "Cricket player sign-ups for the Maneri Premier League.",
    icon: UsersIcon,
  },
  mfc: {
    label: "MFC Registrations",
    title: "MFC Registrations",
    subtitle: "Football player sign-ups.",
    icon: TargetIcon,
  },
  matches: {
    label: "Scorecard & Fixtures",
    title: "Scorecard & Fixtures",
    subtitle: "Fixtures, live scores and results shown on the homepage.",
    icon: CalendarIcon,
  },
  teams: {
    label: "Teams & Captains",
    title: "Teams & Captains",
    subtitle: "Franchise owners and captains shown on team rosters.",
    icon: ShieldIcon,
  },
  points: {
    label: "Points Table",
    title: "Points Table",
    subtitle: "League standings shown on the homepage.",
    icon: ChartIcon,
  },
  sponsors: {
    label: "Sponsors",
    title: "Sponsors",
    subtitle: "Sponsor logos and links shown on the homepage.",
    icon: StarIcon,
  },
  settings: {
    label: "Settings",
    title: "Settings",
    subtitle: "Registration status, fee, announcement bar and highlights video.",
    icon: SettingsIcon,
  },
};

const NAV_GROUPS = [
  { label: "Dashboard", items: ["overview"] },
  { label: "Registrations", items: ["mpl", "mfc"] },
  { label: "League", items: ["matches", "teams", "points"] },
  { label: "Website", items: ["sponsors", "settings"] },
];

const SIDEBAR_STORAGE_KEY = "mpl-admin-sidebar-collapsed";

function readHashSection() {
  if (typeof window === "undefined") return null;
  const id = window.location.hash.replace(/^#/, "");
  return SECTIONS[id] ? id : null;
}

function withinDays(value, days) {
  if (!value) return false;
  const diff = Date.now() - new Date(value).getTime();
  return Number.isFinite(diff) && diff >= 0 && diff <= days * 86400000;
}

function EmptyState({ icon: Icon, message, onClear }) {
  return (
    <div className="px-5 py-14 text-center sm:px-6">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ink/[0.05] text-muted">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-bold text-ink">{message}</p>
      {onClear ? (
        <button type="button" onClick={onClear} className="mt-1 text-sm font-bold text-green-dark hover:underline">
          Clear search
        </button>
      ) : null}
    </div>
  );
}

function ListToolbar({ search, onSearch, placeholder, showing, total }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.06] px-5 py-3 sm:px-6">
      <SearchBar value={search} onChange={onSearch} placeholder={placeholder} className="w-full sm:max-w-[380px]" />
      <p className="text-xs font-semibold tabular-nums text-muted">
        Showing <span className="text-ink">{showing.toLocaleString()}</span> of{" "}
        <span className="text-ink">{total.toLocaleString()}</span>
      </p>
    </div>
  );
}

export default function AdminDashboard({ onLogout }) {
  const [section, setSectionState] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [registrations, setRegistrations] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const [mfcRegistrations, setMfcRegistrations] = useState([]);
  const [mfcLoadingData, setMfcLoadingData] = useState(false);
  const [mfcDataError, setMfcDataError] = useState("");
  const [mfcSearch, setMfcSearch] = useState("");
  const [mfcSelected, setMfcSelected] = useState(null);

  useEffect(() => {
    loadRegistrations();
    loadMfcRegistrations();
  }, []);

  // Deep-link support: /admin#matches opens that section, and back/forward keep working.
  useEffect(() => {
    const initial = readHashSection();
    if (initial) setSectionState(initial);
    function handleHashChange() {
      const next = readHashSection();
      if (next) setSectionState(next);
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1") setCollapsed(true);
    } catch {
      // Ignore -- e.g. private browsing blocking storage access.
    }
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  function navigate(id) {
    setSectionState(id);
    setMobileOpen(false);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
      window.scrollTo({ top: 0 });
    }
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Ignore -- the preference just will not be remembered.
      }
      return next;
    });
  }

  async function loadRegistrations() {
    setLoadingData(true);
    setDataError("");
    try {
      const res = await fetch("/api/admin/registrations");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load registrations.");
      setRegistrations(data.registrations);
    } catch (error) {
      setDataError(error.message);
    } finally {
      setLoadingData(false);
    }
  }

  async function loadMfcRegistrations() {
    setMfcLoadingData(true);
    setMfcDataError("");
    try {
      const res = await fetch("/api/admin/mfc-registrations");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load registrations.");
      setMfcRegistrations(data.registrations);
    } catch (error) {
      setMfcDataError(error.message);
    } finally {
      setMfcLoadingData(false);
    }
  }

  async function handleAllocate(id, allocatedTeam) {
    const res = await fetch("/api/admin/registrations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, allocatedTeam }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not update the allocated team.");
    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, allocatedTeam: data.allocatedTeam } : r))
    );
    setSelected((prev) => (prev && prev.id === id ? { ...prev, allocatedTeam: data.allocatedTeam } : prev));
  }

  async function handleDelete(id) {
    if (!confirm("Delete this registration? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete registration.");
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
      setSelected((prev) => (prev && prev.id === id ? null : prev));
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleMfcDelete(id) {
    if (!confirm("Delete this registration? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/mfc-registrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete registration.");
      setMfcRegistrations((prev) => prev.filter((r) => r.id !== id));
      setMfcSelected((prev) => (prev && prev.id === id ? null : prev));
    } catch (error) {
      alert(error.message);
    }
  }

  const filteredRegistrations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return registrations;
    return registrations.filter((registration) =>
      MPL_SEARCH_FIELDS.some((field) => String(registration[field] || "").toLowerCase().includes(query))
    );
  }, [registrations, search]);

  const filteredMfcRegistrations = useMemo(() => {
    const query = mfcSearch.trim().toLowerCase();
    if (!query) return mfcRegistrations;
    return mfcRegistrations.filter((registration) =>
      MFC_SEARCH_FIELDS.some((field) => String(registration[field] || "").toLowerCase().includes(query))
    );
  }, [mfcRegistrations, mfcSearch]);

  const searching = Boolean(search.trim());
  const mfcSearching = Boolean(mfcSearch.trim());

  const allocatedCount = registrations.filter((r) => r.allocatedTeam).length;
  const mplThisWeek = registrations.filter((r) => withinDays(r.createdAt, 7)).length;
  const mfcThisWeek = mfcRegistrations.filter((r) => withinDays(r.createdAt, 7)).length;

  const navGroups = NAV_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.map((id) => ({
      id,
      label: SECTIONS[id].label,
      icon: SECTIONS[id].icon,
      badge: id === "mpl" ? registrations.length : id === "mfc" ? mfcRegistrations.length : undefined,
    })),
  }));

  const current = SECTIONS[section] || SECTIONS.overview;

  let headerRefresh;
  let headerRefreshing = false;
  let headerExport;
  if (section === "overview") {
    headerRefresh = () => {
      loadRegistrations();
      loadMfcRegistrations();
    };
    headerRefreshing = loadingData || mfcLoadingData;
  } else if (section === "mpl") {
    headerRefresh = loadRegistrations;
    headerRefreshing = loadingData;
    headerExport = "/api/admin/export";
  } else if (section === "mfc") {
    headerRefresh = loadMfcRegistrations;
    headerRefreshing = mfcLoadingData;
    headerExport = "/api/admin/mfc-export";
  }

  let content = null;
  if (section === "overview") {
    content = (
      <OverviewPage
        registrations={registrations}
        mfcRegistrations={mfcRegistrations}
        loadingMpl={loadingData}
        loadingMfc={mfcLoadingData}
        onNavigate={navigate}
        onSelectMpl={setSelected}
        onSelectMfc={setMfcSelected}
      />
    );
  } else if (section === "mpl") {
    content = (
      <div className="grid gap-6">
        <StatsRow
          items={[
            { label: "Total Registrations", value: registrations.length, caption: "MPL players registered" },
            { label: "Allocated", value: allocatedCount, caption: "assigned to a franchise", accent: true },
            {
              label: "Unassigned",
              value: registrations.length - allocatedCount,
              caption: "waiting for a team",
            },
            searching
              ? { label: "Matching Search", value: filteredRegistrations.length, caption: `for "${search.trim()}"` }
              : { label: "Last 7 Days", value: mplThisWeek, caption: "new sign-ups" },
          ]}
        />

        <Panel
          title="All registrations"
          description="Click a player to view the full form, allocate a team, or delete the entry."
          bodyClassName="p-0"
        >
          <ListToolbar
            search={search}
            onSearch={setSearch}
            showing={filteredRegistrations.length}
            total={registrations.length}
          />

          {dataError ? (
            <div className="px-5 pt-4 sm:px-6">
              <Notice tone="error">{dataError}</Notice>
            </div>
          ) : null}
          {loadingData ? <p className="px-5 py-6 text-sm text-muted sm:px-6">Loading registrations...</p> : null}

          {!loadingData && filteredRegistrations.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              message={registrations.length === 0 ? "No registrations yet." : "No registrations match your search."}
              onClear={searching ? () => setSearch("") : undefined}
            />
          ) : null}

          {filteredRegistrations.length > 0 ? (
            <>
              <RegistrationsTable registrations={filteredRegistrations} onSelect={setSelected} onDelete={handleDelete} />
              <RegistrationCards registrations={filteredRegistrations} onSelect={setSelected} onDelete={handleDelete} />
            </>
          ) : null}
        </Panel>
      </div>
    );
  } else if (section === "mfc") {
    content = (
      <div className="grid gap-6">
        <StatsRow
          items={[
            { label: "Total MFC Registrations", value: mfcRegistrations.length, caption: "football players registered" },
            { label: "Last 7 Days", value: mfcThisWeek, caption: "new sign-ups", accent: true },
            mfcSearching
              ? {
                  label: "Matching Search",
                  value: filteredMfcRegistrations.length,
                  caption: `for "${mfcSearch.trim()}"`,
                }
              : null,
          ]}
        />

        <Panel
          title="All registrations"
          description="Click a player to view the full form or delete the entry."
          bodyClassName="p-0"
        >
          <ListToolbar
            search={mfcSearch}
            onSearch={setMfcSearch}
            placeholder="Search by name, phone, CNIC, village, position..."
            showing={filteredMfcRegistrations.length}
            total={mfcRegistrations.length}
          />

          {mfcDataError ? (
            <div className="px-5 pt-4 sm:px-6">
              <Notice tone="error">{mfcDataError}</Notice>
            </div>
          ) : null}
          {mfcLoadingData ? <p className="px-5 py-6 text-sm text-muted sm:px-6">Loading registrations...</p> : null}

          {!mfcLoadingData && filteredMfcRegistrations.length === 0 ? (
            <EmptyState
              icon={TargetIcon}
              message={
                mfcRegistrations.length === 0 ? "No registrations yet." : "No registrations match your search."
              }
              onClear={mfcSearching ? () => setMfcSearch("") : undefined}
            />
          ) : null}

          {filteredMfcRegistrations.length > 0 ? (
            <>
              <MFCRegistrationsTable
                registrations={filteredMfcRegistrations}
                onSelect={setMfcSelected}
                onDelete={handleMfcDelete}
              />
              <MFCRegistrationCards
                registrations={filteredMfcRegistrations}
                onSelect={setMfcSelected}
                onDelete={handleMfcDelete}
              />
            </>
          ) : null}
        </Panel>
      </div>
    );
  } else if (section === "matches") {
    content = <MatchesCard />;
  } else if (section === "teams") {
    content = <TeamOwnersCard />;
  } else if (section === "points") {
    content = <PointsTableCard />;
  } else if (section === "sponsors") {
    content = <SponsorsSettingsCard />;
  } else if (section === "settings") {
    content = (
      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <RegistrationStatusCard />
        <div className="grid gap-6">
          <AnnouncementSettingsCard />
          <HighlightsSettingsCard />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f3f5f4] text-ink">
      <Sidebar
        groups={navGroups}
        active={section}
        onNavigate={navigate}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={onLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          title={current.title}
          subtitle={current.subtitle}
          onOpenMenu={() => setMobileOpen(true)}
          onRefresh={headerRefresh}
          refreshing={headerRefreshing}
          exportHref={headerExport}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1280px]">{content}</div>
        </main>
      </div>

      <RegistrationDetailsModal
        registration={selected}
        onClose={() => setSelected(null)}
        onDelete={handleDelete}
        onAllocate={handleAllocate}
      />
      <MFCRegistrationDetailsModal
        registration={mfcSelected}
        onClose={() => setMfcSelected(null)}
        onDelete={handleMfcDelete}
      />
    </div>
  );
}
