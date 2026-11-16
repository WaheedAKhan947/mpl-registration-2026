// Rules for the overlay's broadcast effects (FOUR / SIX / WICKET...). Pure,
// so they are unit tested; components/overlay/EffectsLayer.js applies them.

export const EFFECT_DURATIONS = {
  FOUR: 2500,
  SIX: 3500,
  WICKET: 4000,
  FIFTY: 3500,
  HUNDRED: 4000,
  HATTRICK: 4000,
  FREE_HIT: 2500,
  OVER: 3500,
  MAIDEN: 3500,
};
// Lower-third cards play on their own channel, so they never hold up an effect.
export const CARD_DURATIONS = { NEW_BATTER: 6000, PLAYER_CARD: 8000 };
export const CARD_NAMES = { NEW_BATTER: "newbatter", PLAYER_CARD: "player" };

export const STALE_MS = 10000;
export const MAX_QUEUE = 3;

// Event type -> its name in the `fx=` URL parameter.
export const FX_NAMES = {
  FOUR: "four",
  SIX: "six",
  WICKET: "wicket",
  FIFTY: "fifty",
  HUNDRED: "hundred",
  HATTRICK: "hattrick",
  FREE_HIT: "freehit",
  OVER: "over",
  MAIDEN: "maiden",
};

// Is an event recent enough to animate? Age is measured on the server's
// clock (snapshot serverTime minus event time), so a wrong clock on the
// streaming device does not matter. Missing times count as fresh.
export function isFresh(event, serverTime, staleMs = STALE_MS) {
  if (!event?.at || !serverTime) return true;
  const age = Date.parse(serverTime) - Date.parse(event.at);
  return !Number.isFinite(age) || age <= staleMs;
}

// Events in a snapshot that should play now: not played before, enabled by
// the URL parameters, known type, and not stale. Oldest first.
//   seen: Set of event ids already played (or deliberately skipped)
//   durations / names: which event types this channel plays (effects by default)
export function eventsToPlay(
  snapshot,
  seen,
  { effects = true, fx, staleMs = STALE_MS, durations = EFFECT_DURATIONS, names = FX_NAMES } = {}
) {
  const allowed = fx || Object.values(names);
  if (!effects) return [];
  return (snapshot?.events || []).filter(
    (event) =>
      event?.id &&
      !seen.has(event.id) &&
      durations[event.type] &&
      allowed.includes(names[event.type]) &&
      isFresh(event, snapshot.serverTime, staleMs)
  );
}

// Adds events to the waiting line, keeping only the newest `max`, so a burst
// (say, the feed catching up after a network drop) never stacks up.
export function enqueue(queue, events, max = MAX_QUEUE) {
  const next = [...queue, ...events];
  return next.length > max ? next.slice(next.length - max) : next;
}

// Marks every event in a snapshot as seen without playing it. Used for the
// first snapshot after the page (re)loads, so a reload never replays moments
// that already happened.
export function markSeen(seen, snapshot, limit = 200) {
  for (const event of snapshot?.events || []) if (event?.id) seen.add(event.id);
  // Keep the set small on a page that runs for hours.
  if (seen.size > limit) {
    const keep = [...seen].slice(-limit);
    seen.clear();
    keep.forEach((id) => seen.add(id));
  }
  return seen;
}
