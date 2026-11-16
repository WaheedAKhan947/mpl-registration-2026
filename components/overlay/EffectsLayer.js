"use client";

import { useEffect, useRef, useState } from "react";
import { EFFECT_DURATIONS, FX_NAMES, enqueue, eventsToPlay, markSeen } from "@/lib/overlay/effects";
import {
  FourEffect,
  FreeHitEffect,
  HatTrickEffect,
  LiteEffect,
  MilestoneEffect,
  OverEffect,
  SixEffect,
  WicketEffect,
} from "@/components/overlay/Effects";

const EFFECT_COMPONENTS = {
  FOUR: FourEffect,
  SIX: SixEffect,
  WICKET: WicketEffect,
  FIFTY: MilestoneEffect,
  HUNDRED: MilestoneEffect,
  HATTRICK: HatTrickEffect,
  FREE_HIT: FreeHitEffect,
  OVER: OverEffect,
  MAIDEN: OverEffect,
};

// Plays feed events one at a time, each exactly once. Used twice: for the
// big effects (FOUR / SIX / WICKET ...) and, with other props, for the
// lower-third cards, so a card never holds up an effect.
//   snapshot:   the (delayed) feed snapshot
//   manual:     extra events (demo keys, replays) that always play
//   onPlayed:   reports each finished event
//   durations / names / components / lite: what this channel plays and how
//   enabled / fx: URL switches (effects=off, fx=...)
//   paused:     hold the next event (cards wait for a big effect to finish)
//   onBusy:     reports whether something is playing
export default function EffectsLayer({
  snapshot,
  manual = [],
  params,
  onPlayed,
  durations = EFFECT_DURATIONS,
  names = FX_NAMES,
  components = EFFECT_COMPONENTS,
  liteComponent = LiteEffect,
  enabled = params.effects,
  fx = params.fx,
  zIndex = 30,
  channel = "effect",
  paused = false,
  onBusy,
}) {
  const seen = useRef(new Set());
  const primed = useRef(false);
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);

  // New feed events. The first snapshot after a (re)load is only marked as
  // seen, so a reload never replays a moment that already happened.
  useEffect(() => {
    if (!snapshot) return;
    if (!primed.current) {
      primed.current = true;
      markSeen(seen.current, snapshot);
      return;
    }
    const fresh = eventsToPlay(snapshot, seen.current, { effects: enabled, fx, durations, names });
    markSeen(seen.current, snapshot);
    if (fresh.length) setQueue((q) => enqueue(q, fresh));
  }, [snapshot, enabled, fx, durations, names]);

  // Demo / replay events for this channel.
  useEffect(() => {
    const fresh = manual.filter((event) => durations[event.type] && !seen.current.has(event.id));
    fresh.forEach((event) => seen.current.add(event.id));
    if (fresh.length) setQueue((q) => enqueue(q, fresh));
  }, [manual, durations]);

  // Start the next event when nothing is playing.
  useEffect(() => {
    if (current || paused || !queue.length) return;
    setCurrent(queue[0]);
    setQueue((q) => q.slice(1));
  }, [current, queue, paused]);

  const busy = Boolean(current);
  useEffect(() => {
    onBusy?.(busy);
  }, [busy, onBusy]);

  // End the current event after its duration.
  useEffect(() => {
    if (!current) return undefined;
    const timer = setTimeout(() => {
      onPlayed?.(current);
      setCurrent(null);
    }, durations[current.type] || 3000);
    return () => clearTimeout(timer);
  }, [current, onPlayed, durations]);

  if (!current) return null;
  const Component = params.lite && liteComponent ? liteComponent : components[current.type];
  if (!Component) return null;
  const dataAttr = channel === "effect" ? { "data-effect": current.type } : { "data-card": current.type };
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex }} {...dataAttr}>
      <Component key={current.id} event={current} params={params} duration={durations[current.type]} />
    </div>
  );
}
