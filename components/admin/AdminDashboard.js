"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardHeader from "@/components/admin/DashboardHeader";
import AnnouncementSettingsCard from "@/components/admin/AnnouncementSettingsCard";
import HighlightsSettingsCard from "@/components/admin/HighlightsSettingsCard";
import SponsorsSettingsCard from "@/components/admin/SponsorsSettingsCard";
import TeamOwnersCard from "@/components/admin/TeamOwnersCard";
import PointsTableCard from "@/components/admin/PointsTableCard";
import StatsRow from "@/components/admin/StatsRow";
import SearchBar from "@/components/admin/SearchBar";
import RegistrationsTable from "@/components/admin/RegistrationsTable";
import RegistrationCards from "@/components/admin/RegistrationCards";
import RegistrationDetailsModal from "@/components/admin/RegistrationDetailsModal";
import MFCRegistrationsTable from "@/components/admin/MFCRegistrationsTable";
import MFCRegistrationCards from "@/components/admin/MFCRegistrationCards";
import MFCRegistrationDetailsModal from "@/components/admin/MFCRegistrationDetailsModal";

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

const TABS = [
  { id: "mpl", label: "MPL Registrations" },
  { id: "mfc", label: "MFC Registrations" },
];

export default function AdminDashboard({ onLogout }) {
  const [tab, setTab] = useState("mpl");

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

  return (
    <main className="mx-auto w-[min(1100px,calc(100%-32px))] py-10 pb-[70px]">
      <DashboardHeader
        onRefresh={tab === "mpl" ? loadRegistrations : loadMfcRegistrations}
        onLogout={onLogout}
        title={tab === "mpl" ? "MPL Admin Dashboard" : "MFC Admin Dashboard"}
        exportHref={tab === "mpl" ? "/api/admin/export" : "/api/admin/mfc-export"}
      />
      <AnnouncementSettingsCard />
      <HighlightsSettingsCard />
      <SponsorsSettingsCard />

      <div className="mb-6 flex flex-wrap gap-2 border-b border-ink/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px rounded-t-lg border border-b-0 px-4 py-2.5 font-bold transition ${
              tab === t.id
                ? "border-ink/10 bg-white text-green-dark"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "mpl" ? (
        <>
          <TeamOwnersCard />
          <PointsTableCard />
          <StatsRow total={registrations.length} showing={filteredRegistrations.length} searching={searching} />
          <SearchBar value={search} onChange={setSearch} />

          {dataError ? (
            <p className="mb-4 rounded-lg bg-brand-red/10 px-3.5 py-3 font-semibold text-brand-red">{dataError}</p>
          ) : null}
          {loadingData ? <p className="mb-4 text-muted">Loading registrations...</p> : null}

          {!loadingData && filteredRegistrations.length === 0 ? (
            <p className="text-muted">
              {registrations.length === 0 ? "No registrations yet." : "No registrations match your search."}
            </p>
          ) : null}

          {filteredRegistrations.length > 0 ? (
            <>
              <RegistrationsTable registrations={filteredRegistrations} onSelect={setSelected} onDelete={handleDelete} />
              <RegistrationCards registrations={filteredRegistrations} onSelect={setSelected} onDelete={handleDelete} />
            </>
          ) : null}

          <RegistrationDetailsModal
            registration={selected}
            onClose={() => setSelected(null)}
            onDelete={handleDelete}
            onAllocate={handleAllocate}
          />
        </>
      ) : (
        <>
          <StatsRow
            total={mfcRegistrations.length}
            showing={filteredMfcRegistrations.length}
            searching={mfcSearching}
            label="Total MFC Registrations"
          />
          <SearchBar
            value={mfcSearch}
            onChange={setMfcSearch}
            placeholder="Search by name, phone, CNIC, village, position..."
          />

          {mfcDataError ? (
            <p className="mb-4 rounded-lg bg-brand-red/10 px-3.5 py-3 font-semibold text-brand-red">{mfcDataError}</p>
          ) : null}
          {mfcLoadingData ? <p className="mb-4 text-muted">Loading registrations...</p> : null}

          {!mfcLoadingData && filteredMfcRegistrations.length === 0 ? (
            <p className="text-muted">
              {mfcRegistrations.length === 0 ? "No registrations yet." : "No registrations match your search."}
            </p>
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

          <MFCRegistrationDetailsModal
            registration={mfcSelected}
            onClose={() => setMfcSelected(null)}
            onDelete={handleMfcDelete}
          />
        </>
      )}
    </main>
  );
}
