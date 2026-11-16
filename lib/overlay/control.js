// Operator control of the broadcast overlay (Admin > Stream Overlay). Pure,
// no imports, so it is shared by the model, the API, the admin panel and the
// overlay page, and unit tested directly.

// Full-screen screens the operator can force. "auto" follows the match state
// (lib/overlay/screens.js), "none" keeps the plain score bar up.
export const CONTROL_SCREENS = ["auto", "none", "comingUp", "preMatch", "scorecard", "break", "result"];

// Small panels above the score bar.
export const CONTROL_PANELS = ["none", "partnership", "runrate"];

// Highlights the "Replay effect" button can re-run.
export const REPLAY_TYPES = ["FOUR", "SIX", "WICKET"];

// How long after a request a one-shot (card, replay) still plays. The overlay
// drops events older than 10 s anyway; this keeps the feed small.
export const ONE_SHOT_MS = 20000;

export const DEFAULT_CONTROL = { screen: "auto", panel: "none", sponsors: true };

// The control state as sent to the overlay (no ids or people).
export function publicControl(doc) {
  if (!doc) return { ...DEFAULT_CONTROL };
  return {
    screen: CONTROL_SCREENS.includes(doc.screen) ? doc.screen : "auto",
    panel: CONTROL_PANELS.includes(doc.panel) ? doc.panel : "none",
    sponsors: doc.sponsors !== false,
  };
}

// Which screen the overlay shows: the operator's choice, or the automatic one.
export function resolveScreen(control, automatic) {
  const screen = control?.screen || "auto";
  if (screen === "auto") return automatic || null;
  if (screen === "none") return null;
  return screen;
}

// The newest FOUR / SIX / WICKET from a list of overlay events (oldest first).
export function lastHighlight(events = []) {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    if (REPLAY_TYPES.includes(events[i].type)) return events[i];
  }
  return null;
}

// A replay of `highlight` requested at `at` (ISO): same graphic, new id, a
// REPLAY tag, and timed from the request so it is not dropped as stale.
export function replayEvent(highlight, request) {
  if (!highlight || !request?.id || !request.at) return null;
  return { ...highlight, id: `replay-${request.id}`, replay: true, at: request.at };
}

function isRecent(at, now, windowMs = ONE_SHOT_MS) {
  if (!at) return false;
  const age = now - new Date(at).getTime();
  return age >= -5000 && age <= windowMs;
}

// One-shot events from the control document that are still recent.
//   doc:        OverlayState (lean) or null
//   highlight:  lastHighlight(...) of the match
//   playerCard: (playerId) => PLAYER_CARD event body (without id / at), or null
export function controlEvents({ doc, highlight, playerCard, now = Date.now() }) {
  if (!doc) return [];
  const events = [];
  const replay = doc.replay?.id && isRecent(doc.replay.at, now) ? replayEvent(highlight, { id: doc.replay.id, at: new Date(doc.replay.at).toISOString() }) : null;
  if (replay) events.push(replay);
  if (doc.card?.id && doc.card.player && isRecent(doc.card.at, now)) {
    const body = playerCard(String(doc.card.player));
    if (body) events.push({ ...body, type: "PLAYER_CARD", id: `card-${doc.card.id}`, at: new Date(doc.card.at).toISOString() });
  }
  return events;
}
