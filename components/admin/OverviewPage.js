"use client";

import { useEffect, useState } from "react";
import Panel from "@/components/admin/Panel";
import Avatar from "@/components/admin/Avatar";
import Notice from "@/components/admin/Notice";
import StatsRow from "@/components/admin/StatsRow";
import {
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  ChartIcon,
  ShieldIcon,
  StarIcon,
  VideoIcon,
} from "@/components/admin/icons";

const RECENT_LIMIT = 5;

function byNewest(a, b) {
  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
}

function timeAgo(value) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "just now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function withinDays(value, days) {
  if (!value) return false;
  const diff = Date.now() - new Date(value).getTime();
  return Number.isFinite(diff) && diff >= 0 && diff <= days * 86400000;
}

function StatusPill({ open }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
        open ? "bg-green/10 text-green-dark" : "bg-brand-red/10 text-brand-red"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-green" : "bg-brand-red"}`} />
      {open ? "Open" : "Closed"}
    </span>
  );
}

function RecentList({ items, loading, emptyText, getPhoto, getName, getMeta, onSelect }) {
  if (loading && !items.length) {
    return <p className="px-5 py-6 text-sm text-muted sm:px-6">Loading...</p>;
  }
  if (!items.length) {
    return <p className="px-5 py-6 text-sm text-muted sm:px-6">{emptyText}</p>;
  }
  return (
    <ul className="divide-y divide-ink/[0.06]">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onSelect(item)}
            className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-green/[0.035] sm:px-6"
          >
            <Avatar src={getPhoto(item)} name={getName(item)} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-ink">{getName(item)}</span>
              <span className="block truncate text-xs text-muted">{getMeta(item)}</span>
            </span>
            <span className="shrink-0 text-xs font-semibold text-muted">{timeAgo(item.createdAt)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function ViewAllButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold text-green-dark transition hover:bg-green/10"
    >
      View all
      <ArrowRightIcon className="h-4 w-4" />
    </button>
  );
}

const QUICK_LINKS = [
  { id: "matches", label: "Scorecard & Fixtures", copy: "Add fixtures and update live scores.", icon: CalendarIcon },
  { id: "teams", label: "Teams & Captains", copy: "Set franchise owners and captains.", icon: ShieldIcon },
  { id: "points", label: "Points Table", copy: "Manage the league standings.", icon: ChartIcon },
  { id: "sponsors", label: "Sponsors", copy: "Logos and links on the homepage.", icon: StarIcon },
];

export default function OverviewPage({
  registrations,
  mfcRegistrations,
  loadingMpl,
  loadingMfc,
  onNavigate,
  onSelectMpl,
  onSelectMfc,
}) {
  const [settings, setSettings] = useState(null);
  const [settingsError, setSettingsError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSettings(data);
      })
      .catch(() => {
        if (!cancelled) setSettingsError("Could not load site settings.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allocated = registrations.filter((r) => r.allocatedTeam).length;
  const unassigned = registrations.length - allocated;
  const mplThisWeek = registrations.filter((r) => withinDays(r.createdAt, 7)).length;
  const mfcThisWeek = mfcRegistrations.filter((r) => withinDays(r.createdAt, 7)).length;

  const recentMpl = [...registrations].sort(byNewest).slice(0, RECENT_LIMIT);
  const recentMfc = [...mfcRegistrations].sort(byNewest).slice(0, RECENT_LIMIT);

  const mplOpen = settings ? settings.mplRegistrationOpen ?? true : null;
  const mfcOpen = settings ? settings.mfcRegistrationOpen ?? true : null;
  const fee = settings ? Number(settings.mplRegistrationFee ?? 1000) : null;
  const announcementOn = settings
    ? Boolean(settings.announcementEnabled ?? true) && Boolean(String(settings.announcementText || "").trim())
    : null;
  const highlightSet = settings ? Boolean(String(settings.highlightVideoUrl || "").trim()) : null;

  return (
    <div className="grid gap-6">
      <StatsRow
        items={[
          {
            label: "MPL Registrations",
            value: registrations.length,
            caption: `${mplThisWeek.toLocaleString()} in the last 7 days`,
          },
          {
            label: "Allocated to Teams",
            value: allocated,
            caption: registrations.length
              ? `${Math.round((allocated / registrations.length) * 100)}% of MPL players`
              : "no players yet",
            accent: true,
          },
          {
            label: "Awaiting Allocation",
            value: unassigned,
            caption: "players without a team",
          },
          {
            label: "MFC Registrations",
            value: mfcRegistrations.length,
            caption: `${mfcThisWeek.toLocaleString()} in the last 7 days`,
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Recent MPL registrations"
          description="Newest cricket sign-ups. Click a player to view details or allocate a team."
          actions={<ViewAllButton onClick={() => onNavigate("mpl")} />}
          bodyClassName="py-1"
        >
          <RecentList
            items={recentMpl}
            loading={loadingMpl}
            emptyText="No MPL registrations yet."
            getPhoto={(r) => r.profilePicture}
            getName={(r) => r.playerName}
            getMeta={(r) =>
              [r.preferredTeam, r.playingRole, r.allocatedTeam ? `Allocated: ${r.allocatedTeam}` : "Unassigned"]
                .filter(Boolean)
                .join(" • ")
            }
            onSelect={onSelectMpl}
          />
        </Panel>

        <Panel
          title="Recent MFC registrations"
          description="Newest football sign-ups. Click a player to view the full form."
          actions={<ViewAllButton onClick={() => onNavigate("mfc")} />}
          bodyClassName="py-1"
        >
          <RecentList
            items={recentMfc}
            loading={loadingMfc}
            emptyText="No MFC registrations yet."
            getPhoto={(r) => r.photo}
            getName={(r) => r.fullName}
            getMeta={(r) => [r.position, r.village].filter(Boolean).join(" • ")}
            onSelect={onSelectMfc}
          />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Panel
          title="Site status"
          description="What visitors currently see on the public website."
          actions={
            <button
              type="button"
              onClick={() => onNavigate("settings")}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold text-green-dark transition hover:bg-green/10"
            >
              Manage
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          }
          bodyClassName="px-5 py-2 sm:px-6"
        >
          {settingsError ? (
            <Notice tone="error" className="my-3">
              {settingsError}
            </Notice>
          ) : null}
          <dl className="divide-y divide-ink/[0.06]">
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm font-semibold text-ink">MPL registration</dt>
              <dd>{mplOpen === null ? <span className="text-xs text-muted">Loading...</span> : <StatusPill open={mplOpen} />}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm font-semibold text-ink">MFC registration</dt>
              <dd>{mfcOpen === null ? <span className="text-xs text-muted">Loading...</span> : <StatusPill open={mfcOpen} />}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm font-semibold text-ink">MPL registration fee</dt>
              <dd className="text-sm font-bold tabular-nums text-ink">
                {fee === null ? <span className="text-xs font-normal text-muted">Loading...</span> : `Rs. ${fee.toLocaleString()}`}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="flex items-center gap-2 text-sm font-semibold text-ink">
                <BellIcon className="h-4 w-4 text-muted" />
                Announcement bar
              </dt>
              <dd className="text-sm font-bold text-ink">
                {announcementOn === null ? (
                  <span className="text-xs font-normal text-muted">Loading...</span>
                ) : announcementOn ? (
                  <span className="text-green-dark">Showing</span>
                ) : (
                  <span className="text-muted">Hidden</span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="flex items-center gap-2 text-sm font-semibold text-ink">
                <VideoIcon className="h-4 w-4 text-muted" />
                Highlights video
              </dt>
              <dd className="text-sm font-bold text-ink">
                {highlightSet === null ? (
                  <span className="text-xs font-normal text-muted">Loading...</span>
                ) : highlightSet ? (
                  <span className="text-green-dark">Set</span>
                ) : (
                  <span className="text-muted">Not set</span>
                )}
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Quick actions" description="Jump straight to the league tools.">
          <div className="grid gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => onNavigate(link.id)}
                  className="group flex items-start gap-3 rounded-xl border border-ink/10 bg-[#fafbfa] p-4 text-left transition hover:border-green/30 hover:bg-green/[0.05]"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-green ring-1 ring-ink/10 transition group-hover:bg-green group-hover:text-white group-hover:ring-green">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink">{link.label}</span>
                    <span className="block text-xs text-muted">{link.copy}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
