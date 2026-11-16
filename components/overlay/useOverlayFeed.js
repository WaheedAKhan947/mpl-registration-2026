"use client";

import { useEffect, useRef, useState } from "react";
import { nextPollDelay, pickSnapshot, pushSnapshot, snapshotKey } from "@/lib/overlay/feed";

const REQUEST_TIMEOUT_MS = 8000;

// Polls GET /api/matches/[id]/overlay and returns the snapshot to show.
// - Never clears the screen: on a network error or a bad response the last
//   good snapshot stays up and polling retries quietly with back-off.
// - `delayMs` holds new data back so graphics stay in sync with the video.
// - `initial` (rendered by the server) makes a reload show the score at once.
// Every timer, request and listener is cleaned up on unmount, so the page
// can run inside OBS / PRISM for hours.
export default function useOverlayFeed(matchId, { pollMs, delayMs, initial = null, enabled = true, tickMs = 250 }) {
  const [shown, setShown] = useState(initial);
  const [status, setStatus] = useState({ lastOkAt: 0, failures: 0, notFound: false, buffered: initial ? 1 : 0 });
  const bufferRef = useRef(initial ? pushSnapshot([], initial, Date.now()) : []);
  const shownKey = useRef(snapshotKey(initial));

  useEffect(() => {
    if (!enabled) return undefined;
    let stopped = false;
    let pollTimer = 0;
    let failures = 0;
    let controller = null;

    async function poll() {
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      let notFound = false;
      try {
        const res = await fetch(`/api/matches/${encodeURIComponent(matchId)}/overlay`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (res.status === 404) {
          notFound = true;
          throw new Error("not found");
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        bufferRef.current = pushSnapshot(bufferRef.current, data, Date.now());
        failures = 0;
        if (!stopped) setStatus({ lastOkAt: Date.now(), failures: 0, notFound: false, buffered: bufferRef.current.length });
      } catch {
        failures += 1;
        if (!stopped) setStatus((prev) => ({ ...prev, failures, notFound, buffered: bufferRef.current.length }));
      } finally {
        clearTimeout(timeout);
      }
      if (!stopped) pollTimer = setTimeout(poll, nextPollDelay(pollMs, failures));
    }

    // Moves delayed snapshots onto the screen.
    const ticker = setInterval(() => {
      const { shown: next, buffer } = pickSnapshot(bufferRef.current, Date.now(), delayMs);
      bufferRef.current = buffer;
      if (next && next.key !== shownKey.current) {
        shownKey.current = next.key;
        setShown(next.data);
      }
    }, tickMs);

    poll();
    return () => {
      stopped = true;
      clearTimeout(pollTimer);
      clearInterval(ticker);
      controller?.abort();
    };
  }, [matchId, pollMs, delayMs, enabled, tickMs]);

  return { data: shown, status };
}
