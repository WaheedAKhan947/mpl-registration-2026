"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Notice from "@/components/admin/Notice";
import PlayerCard, { PLAYER_CARD_SIZE } from "@/components/admin/PlayerCard";
import { ChevronLeftIcon, DownloadIcon, XIcon } from "@/components/admin/icons";
import { ROSTER_TEAMS, TEAM_CARDS } from "@/lib/siteData";

const BADGE_BY_TEAM = Object.fromEntries(TEAM_CARDS.map((team) => [team.name, team.code]));

function slugify(text) {
  return (
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "player"
  );
}

// Fetches a same-origin image and turns it into a data URL, so the PNG
// export never has to read a cross-origin (R2) image.
async function toDataUrl(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load image.");
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(blob);
  });
}

function waitForImages(node) {
  const images = Array.from(node.querySelectorAll("img"));
  return Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          })
    )
  );
}

// Scales the fixed 1080px card down to whatever width its box gets.
function ScaledCard({ children }) {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return undefined;
    const update = () => setScale(box.clientWidth / PLAYER_CARD_SIZE);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      className="relative mx-auto w-full overflow-hidden rounded-xl bg-navy-dark shadow-panel-navy"
      style={{ maxWidth: "min(100%, calc(85vh - 7rem))", height: PLAYER_CARD_SIZE * scale }}
    >
      <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

export default function DraftPlayerModal({
  player,
  sponsors,
  position,
  total,
  onPrev,
  onNext,
  onClose,
  onAllocate,
  message,
}) {
  const cardRef = useRef(null);
  const [exportAssets, setExportAssets] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    setExportError("");
  }, [player?.id]);

  async function handleDownload() {
    if (!cardRef.current) return;
    setExporting(true);
    setExportError("");
    try {
      const [photo, logos] = await Promise.all([
        player.photo ? toDataUrl(`/api/admin/draft-players/image?player=${player.id}`) : null,
        Promise.all(
          sponsors.map(async (sponsor) => {
            // Static fallback logos from /public are already same-origin.
            if (!sponsor.id) return sponsor;
            try {
              return { ...sponsor, logo: await toDataUrl(`/api/admin/draft-players/image?sponsor=${sponsor.id}`) };
            } catch {
              return { ...sponsor, logo: null };
            }
          })
        ),
      ]);

      flushSync(() => setExportAssets({ photo, sponsors: logos }));
      await waitForImages(cardRef.current);

      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        width: PLAYER_CARD_SIZE,
        height: PLAYER_CARD_SIZE,
        pixelRatio: 1,
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `mpl-${slugify(player.playerName)}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setExportError(error?.message || "Could not create the image.");
    } finally {
      setExportAssets(null);
      setExporting(false);
    }
  }

  if (!player) return null;

  const pending = message?.pending;

  return (
    <Modal onClose={onClose} hideHeader maxWidthClassName="max-w-6xl" panelClassName="bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-bold text-muted">{player.registrationId || "-"}</p>
          <h2 className="truncate text-lg font-bold text-ink">{player.playerName}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold tabular-nums text-muted">
            {position + 1} / {total}
          </span>
          <button
            type="button"
            onClick={onPrev}
            disabled={position <= 0}
            aria-label="Previous player"
            title="Previous (Left arrow)"
            className="grid h-9 w-9 place-items-center rounded-lg border border-ink/10 text-ink transition hover:bg-ink/5 disabled:opacity-40"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={position >= total - 1}
            aria-label="Next player"
            title="Next (Right arrow)"
            className="grid h-9 w-9 place-items-center rounded-lg border border-ink/10 text-ink transition hover:bg-ink/5 disabled:opacity-40"
          >
            <ChevronLeftIcon className="h-4 w-4 rotate-180" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-1 grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-ink/5 hover:text-ink"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <ScaledCard>
          <PlayerCard
            ref={cardRef}
            player={player}
            photo={exportAssets ? exportAssets.photo : undefined}
            sponsors={exportAssets ? exportAssets.sponsors : sponsors}
          />
        </ScaledCard>

        <div className="grid gap-4">
          <div>
            <p className="mb-2 text-[0.68rem] font-black uppercase tracking-[0.14em] text-muted">Draft to team</p>
            <div className="grid grid-cols-2 gap-2">
              {ROSTER_TEAMS.map((team) => {
                const active = player.allocatedTeam === team;
                return (
                  <button
                    key={team}
                    type="button"
                    disabled={pending}
                    onClick={() => onAllocate(player, team)}
                    aria-pressed={active}
                    className={`flex min-h-[44px] items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[0.8rem] font-bold leading-tight transition disabled:cursor-wait disabled:opacity-60 ${
                      active
                        ? "border-green bg-green text-white"
                        : "border-ink/15 bg-white text-ink hover:border-green/40 hover:bg-green/[0.05]"
                    }`}
                  >
                    {BADGE_BY_TEAM[team] ? (
                      <img src={BADGE_BY_TEAM[team]} alt="" className="h-7 w-7 shrink-0 rounded-full bg-white object-contain" />
                    ) : null}
                    <span className="min-w-0">{team}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={pending || !player.allocatedTeam}
              onClick={() => onAllocate(player, "")}
              className="mt-2 min-h-[40px] w-full rounded-lg border border-brand-red/25 text-sm font-bold text-brand-red transition hover:bg-brand-red/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Unassign
            </button>
          </div>

          {message?.text ? <Notice tone={message.tone}>{message.text}</Notice> : null}

          <div className="grid gap-1.5 rounded-xl border border-ink/10 bg-[#fafbfa] p-3 text-sm">
            <p className="flex justify-between gap-3">
              <span className="text-muted">Preferred team</span>
              <span className="text-right font-semibold text-ink">{player.preferredTeam || "-"}</span>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-muted">Father&apos;s name</span>
              <span className="text-right font-semibold text-ink">{player.fatherName || "-"}</span>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-muted">Status</span>
              <span className={`font-semibold ${player.verified ? "text-green-dark" : "text-navy-dark"}`}>
                {player.verified ? "Verified" : "Unverified"}
              </span>
            </p>
          </div>

          <Button type="button" onClick={handleDownload} disabled={exporting} size="sm">
            <DownloadIcon className="h-4 w-4" />
            {exporting ? "Preparing image..." : "Download card"}
          </Button>
          {exportError ? <Notice tone="error">{exportError}</Notice> : null}
          <p className="hidden text-xs text-muted lg:block">Tip: use the Left and Right arrow keys to move between players.</p>
        </div>
      </div>
    </Modal>
  );
}
