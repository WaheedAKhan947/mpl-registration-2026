"use client";

import { useEffect, useMemo, useState } from "react";
import { INPUT_CLASSES } from "@/components/admin/formStyles";

// The broadcast overlay address for one match, ready to paste into PRISM /
// OBS as a web source, with the common options as checkboxes.
export default function OverlayLinkBox({ matchId, defaultOpen = false }) {
  const [origin, setOrigin] = useState("");
  const [lite, setLite] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const [top, setTop] = useState(false);
  const [delay, setDelay] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = useMemo(() => {
    const query = new URLSearchParams();
    if (lite) query.set("lite", "1");
    if (portrait) query.set("layout", "portrait");
    if (top) query.set("position", "top");
    const seconds = Number(delay);
    if (Number.isFinite(seconds) && seconds > 0) query.set("delay", String(Math.min(60, Math.round(seconds))));
    const qs = query.toString();
    return `${origin}/overlay/${matchId}${qs ? `?${qs}` : ""}`;
  }, [origin, matchId, lite, portrait, top, delay]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard blocked (http on a phone): select the text so it can be copied by hand.
      document.getElementById(`overlay-url-${matchId}`)?.select();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const option = (label, checked, onChange) => (
    <label className="flex items-center gap-2 text-sm font-semibold text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-green" />
      {label}
    </label>
  );

  return (
    <details open={defaultOpen || undefined} className="rounded-xl border border-ink/10 bg-white p-3.5 text-sm">
      <summary className="cursor-pointer font-bold text-ink">Stream overlay link (PRISM / OBS)</summary>
      <p className="mt-2 text-xs text-muted">
        Add this address as a Web / Browser source on top of the camera. It shows this match&apos;s live score with a
        transparent background.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {option("Phone (light mode)", lite, setLite)}
        {option("Vertical stream", portrait, setPortrait)}
        {option("Score bar at top", top, setTop)}
        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          Delay
          <input
            type="number"
            min="0"
            max="60"
            inputMode="numeric"
            value={delay}
            onChange={(e) => setDelay(e.target.value)}
            placeholder="0"
            className={`${INPUT_CLASSES} w-20 py-1`}
          />
          sec
        </label>
      </div>
      <div className="mt-3 flex gap-2">
        <input id={`overlay-url-${matchId}`} readOnly value={url} onFocus={(e) => e.target.select()} className={`${INPUT_CLASSES} font-mono text-xs`} />
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg bg-green px-3 text-sm font-extrabold text-white transition hover:bg-green-dark"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="grid shrink-0 place-items-center rounded-lg border border-ink/15 px-3 text-sm font-extrabold text-green-dark hover:bg-green/5"
        >
          Open
        </a>
      </div>
      <p className="mt-2 text-xs text-muted">
        Delay: how many seconds the stream video runs behind real time, so the score changes together with the video.
      </p>
    </details>
  );
}
