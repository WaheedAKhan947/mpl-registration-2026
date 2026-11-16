// Reads the broadcast overlay's URL parameters (`/overlay/<matchId>?...`).
// Pure, so it is unit tested and shared by the page (server) and the
// overlay components (client). Unknown or out-of-range values fall back to
// safe defaults: a typo in a streaming app's URL field must never break the
// stream.

export const EFFECT_KEYS = ["four", "six", "wicket", "fifty", "hundred", "freehit", "over", "hattrick", "maiden"];

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function number(value, fallback, min, max) {
  const raw = first(value);
  if (raw === undefined || raw === null || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function choice(value, allowed, fallback) {
  const raw = String(first(value) ?? "").trim().toLowerCase();
  return allowed.includes(raw) ? raw : fallback;
}

function flag(value, fallback = false) {
  const raw = first(value);
  if (raw === undefined || raw === null) return fallback;
  return ["1", "true", "on", "yes"].includes(String(raw).trim().toLowerCase());
}

// searchParams: Next.js page searchParams or a plain object of strings.
export function parseOverlayParams(searchParams = {}) {
  const sp = searchParams || {};
  const layout = choice(sp.layout, ["landscape", "portrait"], "landscape");
  const portraitDefault = layout === "portrait" && first(sp.w) === undefined && first(sp.h) === undefined;
  const lite = flag(sp.lite);

  const fxList = String(first(sp.fx) ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => EFFECT_KEYS.includes(s));

  return {
    // Look and placement
    theme: choice(sp.theme, ["mpl", "dark", "light"], "mpl"),
    position: choice(sp.position, ["bottom", "top"], "bottom"),
    layout,
    // Design canvas; the page then fits it to whatever size the web source is.
    width: portraitDefault ? 1080 : Math.round(number(sp.w, 1920, 320, 3840)),
    height: portraitDefault ? 1920 : Math.round(number(sp.h, 1080, 320, 3840)),
    scale: number(sp.scale, 1, 0.25, 3),
    bg: choice(sp.bg, ["transparent", "solid", "chroma"], "transparent"),
    // Behaviour
    delay: number(sp.delay, 0, 0, 60),
    pollMs: Math.round(number(sp.poll, lite ? 3.5 : 2, 1, 30) * 1000),
    sponsors: choice(sp.sponsors, ["on", "off"], "on") === "on",
    effects: choice(sp.effects, ["on", "off"], "on") === "on",
    // Full-screen screens (toss, lineups, innings break, result) from the match state.
    screens: choice(sp.screens, ["on", "off"], "on") === "on",
    // Lower-third cards (new batter).
    cards: choice(sp.cards, ["on", "off"], "on") === "on",
    fx: fxList.length ? fxList : EFFECT_KEYS,
    sound: flag(sp.sound),
    lite,
    lang: choice(sp.lang, ["en", "ur"], "en"),
    debug: flag(sp.debug),
    demo: flag(sp.demo),
  };
}

// Background colour behind the canvas for each `bg` mode.
export const BACKGROUNDS = {
  transparent: "transparent",
  solid: "#060f22",
  chroma: "#00ff00",
};

// Scale that fits a design canvas inside the viewport (letterboxed), times
// the operator's own `scale` multiplier. Returns { scale, left, top }.
export function fitCanvas({ viewportWidth, viewportHeight, width, height, scale = 1 }) {
  if (!viewportWidth || !viewportHeight) return { scale, left: 0, top: 0 };
  const fit = Math.min(viewportWidth / width, viewportHeight / height) * scale;
  return {
    scale: fit,
    left: Math.round((viewportWidth - width * fit) / 2),
    top: Math.round((viewportHeight - height * fit) / 2),
  };
}
