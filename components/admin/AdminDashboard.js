"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardHeader from "@/components/admin/DashboardHeader";
import HighlightsSettingsCard from "@/components/admin/HighlightsSettingsCard";
import StatsRow from "@/components/admin/StatsRow";
import SearchBar from "@/components/admin/SearchBar";
import RegistrationsTable from "@/components/admin/RegistrationsTable";
import RegistrationCards from "@/components/admin/RegistrationCards";
import RegistrationDetailsModal from "@/components/admin/RegistrationDetailsModal";

const SEARCH_FIELDS = [
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
];

export default function AdminDashboard({ onLogout }) {
  const [registrations, setRegistrations] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadRegistrations();
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

  const filteredRegistrations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return registrations;
    return registrations.filter((registration) =>
      SEARCH_FIELDS.some((field) => String(registration[field] || "").toLowerCase().includes(query))
    );
  }, [registrations, search]);

  const searching = Boolean(search.trim());

  return (
    <main className="mx-auto w-[min(1100px,calc(100%-32px))] py-10 pb-[70px]">
      <DashboardHeader onRefresh={loadRegistrations} onLogout={onLogout} />
      <HighlightsSettingsCard />
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

      <RegistrationDetailsModal registration={selected} onClose={() => setSelected(null)} onDelete={handleDelete} />
    </main>
  );
}
