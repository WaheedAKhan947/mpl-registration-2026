"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import OverlayCanvas from "@/components/overlay/OverlayCanvas";
import CornerBug from "@/components/overlay/CornerBug";
import ScoreBar from "@/components/overlay/ScoreBar";
import EffectsLayer from "@/components/overlay/EffectsLayer";
import OverlayScreen from "@/components/overlay/Screens";
import SponsorStrip from "@/components/overlay/SponsorStrip";
import QuickPanel from "@/components/overlay/QuickPanel";
import { CARD_COMPONENTS } from "@/components/overlay/LowerThird";
import { CARD_DURATIONS, CARD_NAMES } from "@/lib/overlay/effects";
import { autoScreen, canShowScreen } from "@/lib/overlay/screens";
import { CONTROL_PANELS, resolveScreen } from "@/lib/overlay/control";
import useOverlayFeed from "@/components/overlay/useOverlayFeed";
import { MOCK_LIVE, demoEvent, demoScreenData } from "@/lib/overlay/mockData";

// Client root of /overlay/[matchId]: live feed (or demo data) -> graphics.
export default function OverlayApp({ matchId, params, initial }) {
  const demo = params.demo || matchId === "demo";
  const { data: live, status } = useOverlayFeed(matchId, {
    pollMs: params.pollMs,
    delayMs: params.delay * 1000,
    initial: demo ? null : initial,
    enabled: !demo,
    tickMs: params.lite ? 500 : 250,
  });
  // Demo mode can preview each full-screen screen (keys 1, 2, 3, 5; 0 clears).
  const [demoScreen, setDemoScreen] = useState(null);
  const demoData = useMemo(() => demoScreenData(demoScreen), [demoScreen]);
  const [demoPanel, setDemoPanel] = useState("none");
  const data = demo ? demoData : live;
  // The stream operator (Admin > Stream Overlay) can force a screen, a quick
  // panel and the sponsor panel; "auto" follows the match state. ?screens=off
  // only turns the automatic screens off.
  const control = data?.control;
  const automatic = params.screens && data ? autoScreen(data) : null;
  const wanted = demo ? demoScreen : resolveScreen(control, automatic);
  const screen = wanted && canShowScreen(wanted, data) ? wanted : null;
  const panel = demo ? demoPanel : control?.panel || "none";
  const showSponsors = params.sponsors && control?.sponsors !== false;

  // Extra effects: demo keyboard shortcuts and "replay the last effect".
  const [manual, setManual] = useState([]);
  const lastPlayed = useRef(null);
  const count = useRef(0);
  const onPlayed = useCallback((event) => {
    if (!event.replay) lastPlayed.current = event;
  }, []);
  // A new-batter card waits while a big effect (the wicket) is on screen.
  const [effectBusy, setEffectBusy] = useState(false);
  const push = useCallback((event) => setManual((list) => [...list.slice(-10), event]), []);

  useEffect(() => {
    if (!demo) return undefined;
    function onKey(e) {
      const key = e.key.toLowerCase();
      count.current += 1;
      if (key === "4") push(demoEvent("FOUR", count.current));
      else if (key === "6") push(demoEvent("SIX", count.current));
      else if (key === "m") push(demoEvent("SIX", count.current, { milestone: true }));
      else if (key === "w") push(demoEvent("WICKET", count.current));
      else if (key === "f") push(demoEvent("FIFTY", count.current));
      else if (key === "h") push(demoEvent("HUNDRED", count.current));
      else if (key === "n") push(demoEvent("FREE_HIT", count.current));
      else if (key === "o") push(demoEvent("OVER", count.current));
      else if (key === "z") push(demoEvent("MAIDEN", count.current));
      else if (key === "t") push(demoEvent("HATTRICK", count.current));
      else if (key === "i") push(demoEvent("NEW_BATTER", count.current));
      else if (key === "c") push(demoEvent("PLAYER_CARD", count.current));
      else if (key === "p") setDemoPanel((p) => CONTROL_PANELS[(CONTROL_PANELS.indexOf(p) + 1) % CONTROL_PANELS.length]);
      else if (key === "1") setDemoScreen("comingUp");
      else if (key === "2") setDemoScreen("preMatch");
      else if (key === "3") setDemoScreen("break");
      else if (key === "5") setDemoScreen("result");
      else if (key === "0") setDemoScreen(null);
      else if (key === "r" && lastPlayed.current) {
        push({ ...lastPlayed.current, id: `replay-${Date.now()}`, replay: true });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [demo, push]);

  return (
    <OverlayCanvas params={params}>
      {data ? (
        <>
          <CornerBug match={data.match} params={params} />
          {/* A full-screen screen (toss, lineups, break, result) replaces the score bar. */}
          {screen ? <OverlayScreen key={screen} screen={screen} data={data} params={params} /> : <ScoreBar data={data} params={params} />}
        </>
      ) : null}
      {data && !screen && panel !== "none" ? <QuickPanel key={panel} panel={panel} data={data} params={params} /> : null}
      {/* Hidden behind full screens, which use the whole safe area. */}
      {data && showSponsors && !screen ? <SponsorStrip params={params} /> : null}
      {/* Lower-third cards (new batter) play on their own channel, below the
          big effects, and only while the score bar is up. */}
      {data && !screen && params.cards ? (
        <EffectsLayer
          channel="card"
          snapshot={data}
          manual={manual}
          params={params}
          durations={CARD_DURATIONS}
          names={CARD_NAMES}
          components={CARD_COMPONENTS}
          liteComponent={null}
          fx={null}
          zIndex={25}
          paused={effectBusy}
        />
      ) : null}
      <EffectsLayer snapshot={data} manual={manual} params={params} onPlayed={onPlayed} onBusy={setEffectBusy} />
      {demo ? <DemoHint params={params} /> : null}
      {params.debug ? <FeedDebug demo={demo} status={status} params={params} hasData={Boolean(data)} /> : null}
    </OverlayCanvas>
  );
}

function DemoHint({ params }) {
  // Landscape: between the logo and the sponsor panel. Portrait: under the logo.
  const style = params.layout === "portrait" ? { left: "5%", right: "5%", top: "16%" } : { left: 600, width: 820, top: "5%" };
  return (
    <div className="absolute rounded-lg bg-black/60 px-4 py-2 text-center font-mono text-[18px] leading-snug text-white/85" style={style}>
      DEMO · 4 FOUR · 6 SIX · M SIX(50) · W WICKET · F 50 · H 100 · N FREE HIT · O OVER · Z MAIDEN · T HAT-TRICK · I NEW BATTER · C PLAYER CARD · P PANELS · R REPLAY ·
      SCREENS: 1 COMING UP · 2 TOSS + XI · 3 BREAK · 5 RESULT · 0 LIVE
    </div>
  );
}

// Frames per second, measured with requestAnimationFrame.
function useFps() {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    function tick(t) {
      frames += 1;
      if (t - last >= 1000) {
        setFps(Math.round((frames * 1000) / (t - last)));
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fps;
}

function clock(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// Setup-only readout (?debug=1): is the feed healthy, how delayed is it, and
// is the device keeping up (frame rate, memory, time since the last reload)?
// Leave it on during the 30-minute phone test, then take it off the URL.
function FeedDebug({ demo, status, params, hasData }) {
  const [now, setNow] = useState(() => Date.now());
  const [loadedAt] = useState(() => Date.now());
  const fps = useFps();
  // Read in the timer, not during render, so the first client render matches
  // the server's.
  const [heap, setHeap] = useState("...");
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      setHeap(performance.memory ? `${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB` : "n/a");
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const age = status.lastOkAt ? ((now - status.lastOkAt) / 1000).toFixed(1) : "-";
  return (
    <div className="absolute left-3 top-[64px] max-w-[95%] rounded bg-black/70 px-3 py-2 font-mono text-[22px] leading-snug text-cyan-200" data-debug="feed">
      <div>
        {demo
          ? "feed: demo data (no polling)"
          : `feed: ${status.notFound ? "MATCH NOT FOUND" : status.failures ? `retrying (${status.failures} failed)` : "ok"} · last ok ${age}s ago · poll ${params.pollMs / 1000}s · delay ${params.delay}s · buffered ${status.buffered}${hasData ? "" : " · no data yet"}`}
      </div>
      <div>
        <span className={fps && fps < 24 ? "text-[#ff7a70]" : "text-[#8df0a8]"}>fps {fps || "..."}</span> · memory {heap} · up {clock(now - loadedAt)} ·{" "}
        {params.lite ? "LITE" : "full"} mode
      </div>
    </div>
  );
}
