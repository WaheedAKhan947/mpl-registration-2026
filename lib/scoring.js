// Ball-by-ball scoring engine.
//
// Everything here is pure: no database, no React, no "@/..." imports, so it
// runs the same on the server, in the scorer's browser (optimistic updates)
// and under `node --test`. Balls are the only source of truth -- every total,
// player figure and "who is on strike" answer is produced by replaying them.
//
// A ball (one document per delivery or scoring event) looks like:
//   {
//     seq,                    // order within the innings
//     striker, nonStriker, bowler,   // player ids (strings or ObjectIds)
//     runsOffBat,             // credited to the striker
//     extrasType,             // null | "wide" | "noball" | "bye" | "legbye" | "penalty"
//     extraRuns,              // every extra on this ball, INCLUDING the wide/no-ball penalty
//     boundary,               // 4 | 6 | null -- the runs went to the rope, nobody ran
//     wicket,                 // null | { type, playerOut, fielders: [ids] }
//     bowlerChange,           // true when a new bowler finishes an over (injury etc.)
//   }
//
// Examples: wide + 2 run => { extrasType: "wide", extraRuns: 3 }.
// No-ball hit for four => { extrasType: "noball", extraRuns: 1, runsOffBat: 4, boundary: 4 }.
// "penalty" and retirements are scoring events, not deliveries.

export const BALLS_PER_OVER = 6;

export const EXTRA_TYPES = ["wide", "noball", "bye", "legbye", "penalty"];

export const WICKET_TYPES = [
  "bowled",
  "caught",
  "lbw",
  "run_out",
  "stumped",
  "hit_wicket",
  "obstructing_field",
  "retired_hurt",
  "retired_out",
];

export const WICKET_LABELS = {
  bowled: "Bowled",
  caught: "Caught",
  lbw: "LBW",
  run_out: "Run out",
  stumped: "Stumped",
  hit_wicket: "Hit wicket",
  obstructing_field: "Obstructing the field",
  retired_hurt: "Retired hurt",
  retired_out: "Retired out",
};

// Dismissals the bowler is credited with.
export const BOWLER_WICKETS = new Set(["bowled", "caught", "lbw", "stumped", "hit_wicket"]);
// Retirements happen between deliveries.
const RETIREMENTS = new Set(["retired_hurt", "retired_out"]);
// Either batter can be out this way; every other dismissal is the striker's.
const EITHER_END_WICKETS = new Set(["run_out", "obstructing_field", "retired_hurt", "retired_out"]);
// Laws 21.18 / 22: what is still possible on a no-ball, free hit or wide.
const NOBALL_WICKETS = new Set(["run_out", "obstructing_field"]);
const FREE_HIT_WICKETS = NOBALL_WICKETS;
const WIDE_WICKETS = new Set(["stumped", "run_out", "hit_wicket", "obstructing_field"]);
const BYE_WICKETS = new Set(["run_out", "obstructing_field"]);
// Dismissals where no runs off the bat can stand.
const NO_BAT_RUNS_WICKETS = new Set(["bowled", "caught", "lbw", "stumped", "hit_wicket"]);

const MAX_RUNS_OFF_BAT = 7;
const MAX_EXTRA_RUNS = 10;

// ---------------------------------------------------------------- helpers

function toId(value) {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function toCount(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : 0;
}

function positiveInt(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) && num >= 1 ? Math.floor(num) : fallback;
}

function round(value, places = 2) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// 27 legal balls => "4.3"
export function formatOvers(legalBalls) {
  const balls = toCount(legalBalls);
  return `${Math.floor(balls / BALLS_PER_OVER)}.${balls % BALLS_PER_OVER}`;
}

export function strikeRate(runs, balls) {
  return balls > 0 ? round((runs * 100) / balls) : 0;
}

export function economyRate(runs, legalBalls) {
  return legalBalls > 0 ? round((runs * BALLS_PER_OVER) / legalBalls) : 0;
}

// ---------------------------------------------------------------- config

// Fills in league defaults. Max overs per bowler is a fifth of the innings,
// rounded up (20 overs => 4, 10 => 2, 6 => 2), unless set explicitly.
export function resolveConfig(config = {}) {
  const overs = positiveInt(config.overs, 20);
  return {
    overs,
    playersPerSide: positiveInt(config.playersPerSide, 11),
    widePenalty: config.widePenalty === undefined ? 1 : toCount(config.widePenalty),
    noBallPenalty: config.noBallPenalty === undefined ? 1 : toCount(config.noBallPenalty),
    maxOversPerBowler: positiveInt(config.maxOversPerBowler, Math.max(1, Math.ceil(overs / 5))),
    lastManStands: Boolean(config.lastManStands),
  };
}

// Wickets that end the innings: 10 of 11 normally, all 11 with last man stands.
export function maxWickets(config) {
  const resolved = resolveConfig(config);
  return resolved.lastManStands ? resolved.playersPerSide : resolved.playersPerSide - 1;
}

// ---------------------------------------------------------------- balls

export function normalizeBall(raw = {}) {
  const extrasType = EXTRA_TYPES.includes(raw.extrasType) ? raw.extrasType : null;
  const wicket =
    raw.wicket && raw.wicket.type
      ? {
          type: String(raw.wicket.type),
          playerOut: toId(raw.wicket.playerOut),
          fielders: (Array.isArray(raw.wicket.fielders) ? raw.wicket.fielders : [])
            .map(toId)
            .filter(Boolean),
        }
      : null;

  return {
    id: toId(raw.id ?? raw._id),
    clientId: raw.clientId ? String(raw.clientId) : null,
    seq: Number.isFinite(Number(raw.seq)) ? Number(raw.seq) : 0,
    striker: toId(raw.striker),
    nonStriker: toId(raw.nonStriker),
    bowler: toId(raw.bowler),
    runsOffBat: toCount(raw.runsOffBat),
    extrasType,
    extraRuns: toCount(raw.extraRuns),
    boundary: raw.boundary === 4 || raw.boundary === 6 ? raw.boundary : null,
    wicket,
    bowlerChange: Boolean(raw.bowlerChange),
  };
}

// Raw numbers straight off the input, so validation can reject a fraction or
// a negative instead of normalizeBall quietly flooring it.
function isWholeRun(value) {
  if (value === undefined || value === null || value === "") return true;
  const num = Number(value);
  return Number.isInteger(num) && num >= 0;
}

export function isDelivery(ball) {
  if (ball.extrasType === "penalty") return false;
  return !(ball.wicket && RETIREMENTS.has(ball.wicket.type));
}

export function isLegal(ball) {
  return isDelivery(ball) && ball.extrasType !== "wide" && ball.extrasType !== "noball";
}

export function ballRuns(ball) {
  return ball.runsOffBat + ball.extraRuns;
}

// Runs charged to the bowler. Byes and leg byes are not; the one-run no-ball
// penalty is, but byes run off a no-ball are not.
export function bowlerRuns(ball, config) {
  const { noBallPenalty } = resolveConfig(config);
  switch (ball.extrasType) {
    case "wide":
      return ball.extraRuns;
    case "noball":
      return Math.min(noBallPenalty, ball.extraRuns) + ball.runsOffBat;
    case "bye":
    case "legbye":
    case "penalty":
      return 0;
    default:
      return ball.runsOffBat;
  }
}

// Runs the batters physically ran -- decides whether they changed ends.
// Boundaries are not run, and neither are the wide/no-ball penalty runs.
export function runsRun(ball, config) {
  if (ball.boundary) return 0;
  const { widePenalty, noBallPenalty } = resolveConfig(config);
  switch (ball.extrasType) {
    case "wide":
      return Math.max(0, ball.extraRuns - widePenalty);
    case "noball":
      return ball.runsOffBat + Math.max(0, ball.extraRuns - noBallPenalty);
    case "bye":
    case "legbye":
      return ball.extraRuns;
    case "penalty":
      return 0;
    default:
      return ball.runsOffBat;
  }
}

// Short chip label: "•", "1", "4", "6", "W", "Wd", "3Wd", "Nb", "4Nb", "2B", "1Lb", "5P".
export function ballLabel(rawBall, config) {
  const ball = normalizeBall(rawBall);
  const { widePenalty, noBallPenalty } = resolveConfig(config);
  if (ball.wicket) {
    if (ball.wicket.type === "retired_hurt") return "RH";
    if (ball.wicket.type === "retired_out") return "RO";
    return "W";
  }
  switch (ball.extrasType) {
    case "wide": {
      const extra = ball.extraRuns - widePenalty;
      return extra > 0 ? `${extra}Wd` : "Wd";
    }
    case "noball": {
      const extra = ball.runsOffBat + ball.extraRuns - noBallPenalty;
      return extra > 0 ? `${extra}Nb` : "Nb";
    }
    case "bye":
      return `${ball.extraRuns}B`;
    case "legbye":
      return `${ball.extraRuns}Lb`;
    case "penalty":
      return `${ball.extraRuns}P`;
    default:
      return ball.runsOffBat === 0 ? "•" : String(ball.runsOffBat);
  }
}

// ---------------------------------------------------------------- replay

function newBatter(id, order) {
  return {
    id,
    order,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    dots: 0,
    out: false,
    retiredHurt: false,
    dismissal: null,
  };
}

function newBowler(id, order) {
  return { id, order, legalBalls: 0, runs: 0, wickets: 0, maidens: 0, wides: 0, noballs: 0, dots: 0 };
}

function newPartnership(wicketsFallen) {
  return { forWicket: wicketsFallen + 1, batters: [], runs: 0, balls: 0 };
}

// Replays an innings ball by ball and returns its full state.
//
// options:
//   config               match scoring config (see resolveConfig)
//   target               runs needed to win (second innings), or null
//   maxOvers             reduced-overs override (rain); defaults to config.overs
//   striker, nonStriker  openers, used before the first ball is bowled
//   bowler               opening bowler, used before the first ball is bowled
export function replayInnings(rawBalls = [], options = {}) {
  const config = resolveConfig(options.config);
  const target = options.target === null || options.target === undefined ? null : toCount(options.target);
  const quotaBalls = positiveInt(options.maxOvers, config.overs) * BALLS_PER_OVER;
  const wicketLimit = maxWickets(config);

  // Stable sort: balls without a seq keep their array order.
  const balls = rawBalls.map(normalizeBall).sort((a, b) => a.seq - b.seq);

  let runs = 0;
  let wickets = 0;
  let legalBalls = 0;
  const extras = { wides: 0, noballs: 0, byes: 0, legbyes: 0, penalty: 0 };

  const batters = new Map();
  const bowlers = new Map();
  const fallOfWickets = [];
  const partnerships = [];
  const overs = [];
  const annotated = [];

  let partnership = newPartnership(0);
  let striker = toId(options.striker);
  let nonStriker = toId(options.nonStriker);
  let freeHit = false;
  let currentOverBowler = null;
  let lastOverBowler = null;
  let overRunsCharged = 0;
  let overBowlers = new Set();
  let complete = false;
  let endReason = null;

  const ensureBatter = (id) => {
    if (!id) return null;
    if (!batters.has(id)) batters.set(id, newBatter(id, batters.size + 1));
    return batters.get(id);
  };
  const ensureBowler = (id) => {
    if (!id) return null;
    if (!bowlers.has(id)) bowlers.set(id, newBowler(id, bowlers.size + 1));
    return bowlers.get(id);
  };

  // The openers only matter before the first ball. After that every ball
  // names its own batters, which keeps the batting order true even when the
  // caller passes the current crease instead of the openers.
  if (!balls.length) {
    ensureBatter(striker);
    ensureBatter(nonStriker);
  }

  for (const ball of balls) {
    const delivery = isDelivery(ball);
    const legal = isLegal(ball);
    const overIndex = Math.floor(legalBalls / BALLS_PER_OVER);
    const ballInOver = (legalBalls % BALLS_PER_OVER) + 1;
    const wasFreeHit = delivery && freeHit;
    const total = ballRuns(ball);

    for (const id of [ball.striker, ball.nonStriker]) {
      const batter = ensureBatter(id);
      // A retired-hurt batter walking back out resumes the same innings.
      if (batter && batter.retiredHurt) {
        batter.retiredHurt = false;
        batter.dismissal = null;
      }
    }
    if (!partnership.batters.length) {
      partnership.batters = [ball.striker, ball.nonStriker].filter(Boolean);
    }

    runs += total;
    partnership.runs += total;
    if (legal) partnership.balls += 1;

    switch (ball.extrasType) {
      case "wide":
        extras.wides += ball.extraRuns;
        break;
      case "noball": {
        const penalty = Math.min(config.noBallPenalty, ball.extraRuns);
        extras.noballs += penalty;
        extras.byes += ball.extraRuns - penalty;
        break;
      }
      case "bye":
        extras.byes += ball.extraRuns;
        break;
      case "legbye":
        extras.legbyes += ball.extraRuns;
        break;
      case "penalty":
        extras.penalty += ball.extraRuns;
        break;
      default:
        break;
    }

    // Wides are not balls faced; no-balls, byes and leg byes are.
    const facer = delivery && ball.extrasType !== "wide" ? batters.get(ball.striker) : null;
    if (facer) {
      facer.balls += 1;
      facer.runs += ball.runsOffBat;
      if (ball.boundary === 4 && ball.runsOffBat === 4) facer.fours += 1;
      if (ball.boundary === 6 && ball.runsOffBat === 6) facer.sixes += 1;
      if (ball.runsOffBat === 0) facer.dots += 1;
    }

    const bowler = delivery ? ensureBowler(ball.bowler) : null;
    if (bowler) {
      const charged = bowlerRuns(ball, config);
      if (legal) bowler.legalBalls += 1;
      bowler.runs += charged;
      if (ball.extrasType === "wide") bowler.wides += 1;
      if (ball.extrasType === "noball") bowler.noballs += 1;
      if (legal && charged === 0) bowler.dots += 1;
      currentOverBowler = currentOverBowler || bowler.id;
      if (ball.bowlerChange) currentOverBowler = bowler.id;
      overBowlers.add(bowler.id);
      overRunsCharged += charged;
    }

    if (!overs[overIndex]) {
      overs[overIndex] = { number: overIndex + 1, bowler: null, runs: 0, wickets: 0, balls: [] };
    }
    const over = overs[overIndex];
    if (bowler) over.bowler = bowler.id;
    over.runs += total;

    if (ball.wicket) {
      const { type, playerOut, fielders } = ball.wicket;
      const outBatter = ensureBatter(playerOut);
      if (type === "retired_hurt") {
        if (outBatter) {
          outBatter.retiredHurt = true;
          outBatter.dismissal = { type, bowler: null, fielders: [] };
        }
      } else {
        wickets += 1;
        over.wickets += 1;
        const creditBowler = BOWLER_WICKETS.has(type) && delivery;
        if (outBatter) {
          outBatter.out = true;
          outBatter.retiredHurt = false;
          outBatter.dismissal = { type, bowler: creditBowler ? ball.bowler : null, fielders };
        }
        if (creditBowler && bowler) bowler.wickets += 1;
        const ballsAtFall = legalBalls + (legal ? 1 : 0);
        fallOfWickets.push({
          wicket: wickets,
          runs,
          legalBalls: ballsAtFall,
          overs: formatOvers(ballsAtFall),
          player: playerOut,
        });
      }
      partnerships.push({ ...partnership, endedBy: type });
      partnership = newPartnership(wickets);
    }

    // Who ends up where. Slots are [striker, nonStriker]; a dismissed batter's
    // slot becomes null so the incoming batter knows which end to take.
    let slots = [ball.striker, ball.nonStriker];
    if (ball.extrasType === "penalty") slots = [striker, nonStriker];
    if (slots[1] && runsRun(ball, config) % 2 === 1) slots = [slots[1], slots[0]];
    if (ball.wicket) {
      slots = slots.map((id) => (id === ball.wicket.playerOut ? null : id));
    }

    if (legal) legalBalls += 1;

    const overDone = legal && legalBalls % BALLS_PER_OVER === 0;
    if (overDone) {
      if (overBowlers.size === 1 && overRunsCharged === 0 && bowler) bowler.maidens += 1;
      lastOverBowler = currentOverBowler;
      currentOverBowler = null;
      overRunsCharged = 0;
      overBowlers = new Set();
      if (slots[0] || slots[1]) slots = [slots[1], slots[0]];
    }

    // Last man stands: the lone survivor faces every ball, nobody at the other end.
    if (config.lastManStands && wickets === config.playersPerSide - 1) {
      const survivor = slots.find(Boolean) || null;
      slots = [survivor, null];
    }

    [striker, nonStriker] = slots;

    // Free hit follows every no-ball and carries over a wide or another no-ball.
    if (ball.extrasType === "noball") freeHit = true;
    else if (legal) freeHit = false;

    const label = ballLabel(ball, config);
    over.balls.push(label);
    annotated.push({
      ...ball,
      over: overIndex,
      ballInOver,
      legal,
      delivery,
      freeHit: wasFreeHit,
      totalRuns: total,
      label,
      scoreAfter: { runs, wickets, legalBalls },
    });

    if (!complete) {
      if (target !== null && runs >= target) {
        complete = true;
        endReason = "target";
      } else if (wickets >= wicketLimit) {
        complete = true;
        endReason = "all_out";
      } else if (legalBalls >= quotaBalls) {
        complete = true;
        endReason = "overs";
      }
    }
  }

  // The unbroken stand belongs to whoever is at the crease now.
  const currentPair = [striker, nonStriker].filter(Boolean);
  if (currentPair.length) partnership.batters = currentPair;

  const loneBatter = config.lastManStands && wickets === config.playersPerSide - 1;
  const ballsRemaining = Math.max(0, quotaBalls - legalBalls);
  const runsNeeded = target === null ? null : Math.max(0, target - runs);

  const batterList = [...batters.values()]
    .sort((a, b) => a.order - b.order)
    .map((batter) => ({ ...batter, strikeRate: strikeRate(batter.runs, batter.balls) }));
  const bowlerList = [...bowlers.values()]
    .sort((a, b) => a.order - b.order)
    .map((bowler) => ({
      ...bowler,
      overs: formatOvers(bowler.legalBalls),
      economy: economyRate(bowler.runs, bowler.legalBalls),
    }));

  return {
    config,
    target,
    quotaBalls,
    maxWickets: wicketLimit,
    runs,
    wickets,
    legalBalls,
    overs: formatOvers(legalBalls),
    extras: { ...extras, total: extras.wides + extras.noballs + extras.byes + extras.legbyes + extras.penalty },
    batters: batterList,
    bowlers: bowlerList,
    fallOfWickets,
    partnerships,
    currentPartnership: partnership,
    overSummaries: overs.filter(Boolean),
    balls: annotated,
    lastSeq: balls.length ? balls[balls.length - 1].seq : 0,
    striker,
    nonStriker,
    currentBowler: currentOverBowler,
    lastOverBowler,
    // Before the first ball, the scorer's chosen opening bowler is "current".
    openingBowler: balls.length ? null : toId(options.bowler),
    freeHit,
    complete,
    endReason,
    needs: {
      batter: !complete && (!striker || (!nonStriker && !loneBatter)),
      bowler: !complete && !currentOverBowler,
    },
    runRate: legalBalls ? round((runs * BALLS_PER_OVER) / legalBalls) : 0,
    runsNeeded,
    ballsRemaining,
    requiredRate:
      runsNeeded === null ? null : ballsRemaining > 0 ? round((runsNeeded * BALLS_PER_OVER) / ballsRemaining) : null,
  };
}

// ---------------------------------------------------------------- validation

// Whether `bowlerId` may bowl the next ball. Mid-over, only the current
// bowler may continue unless this is a replacement (injury); at the start of
// an over, the previous over's bowler and anyone at their limit are out.
export function bowlerProblem(state, bowlerId, { midOverChange = false } = {}) {
  const config = state.config || resolveConfig();
  const id = toId(bowlerId);
  if (!id) return "Select the bowler.";
  if (state.currentBowler) {
    if (id === state.currentBowler) return null;
    if (!midOverChange) return "This over is being bowled by another bowler. Finish the over first.";
    if (id === state.lastOverBowler) return "A bowler cannot bowl two overs in a row.";
    return null;
  }
  if (id === state.lastOverBowler) return "A bowler cannot bowl two overs in a row.";
  const stats = state.bowlers.find((b) => b.id === id);
  const oversStarted = stats ? Math.ceil(stats.legalBalls / BALLS_PER_OVER) : 0;
  if (oversStarted >= config.maxOversPerBowler) {
    return `This bowler has already bowled the maximum of ${plural(config.maxOversPerBowler, "over")}.`;
  }
  return null;
}

// Batting XI players who can walk in next: not out and not already at the
// crease. A retired-hurt batter is listed so they can resume.
export function availableBatters(state, battingXI = []) {
  const out = new Set(state.batters.filter((b) => b.out).map((b) => b.id));
  const atCrease = new Set([state.striker, state.nonStriker].filter(Boolean));
  return battingXI.map(String).filter((id) => !out.has(id) && !atCrease.has(id));
}

// Checks every ball of an innings in order, each against the state built from
// the balls before it. Used after correcting or deleting an earlier ball, so
// a fix cannot leave a later ball impossible (a batter out twice, a bowler
// bowling back-to-back overs, a ball after the innings ended...).
// Returns null, or { index, seq, overBall, error } for the first bad ball.
export function validateInnings(rawBalls = [], options = {}) {
  const balls = rawBalls.map((b, i) => ({ raw: b, seq: normalizeBall(b).seq, i })).sort((a, b) => a.seq - b.seq || a.i - b.i);
  const accepted = [];
  for (let index = 0; index < balls.length; index += 1) {
    const state = replayInnings(accepted, options);
    const error = validateBall(balls[index].raw, state);
    if (error) {
      const overBall = `${Math.floor(state.legalBalls / BALLS_PER_OVER)}.${(state.legalBalls % BALLS_PER_OVER) + 1}`;
      return { index, seq: balls[index].seq, overBall, error };
    }
    accepted.push(balls[index].raw);
  }
  return null;
}

// Checks a ball against the innings state it would be added to. Returns an
// error message, or null when the ball is fine to record.
export function validateBall(rawBall, state) {
  const config = state.config || resolveConfig();
  const ball = normalizeBall(rawBall);

  if (state.complete) return "This innings is already complete.";

  for (const field of ["runsOffBat", "extraRuns"]) {
    if (!isWholeRun(rawBall?.[field])) return "Runs must be a whole number of zero or more.";
  }
  if (ball.runsOffBat > MAX_RUNS_OFF_BAT) return `Runs off the bat cannot be more than ${MAX_RUNS_OFF_BAT}.`;
  if (ball.extraRuns > MAX_EXTRA_RUNS) return `Extras on one ball cannot be more than ${MAX_EXTRA_RUNS}.`;
  if (rawBall?.extrasType && !ball.extrasType) return "Unknown extra type.";

  if (ball.extrasType === "penalty") {
    if (ball.runsOffBat || ball.wicket || ball.boundary) return "A penalty can only award runs.";
    if (ball.extraRuns < 1) return "Enter the penalty runs.";
    return null;
  }

  const outBatters = new Set(state.batters.filter((b) => b.out).map((b) => b.id));
  const loneBatter = config.lastManStands && state.wickets === config.playersPerSide - 1;

  if (!ball.striker) return "Select the striker.";
  if (!ball.nonStriker && !loneBatter) return "Select the non-striker.";
  if (ball.striker === ball.nonStriker) return "The striker and non-striker must be different players.";
  for (const id of [ball.striker, ball.nonStriker]) {
    if (id && outBatters.has(id)) return "That batter is already out.";
  }

  if (ball.wicket) {
    const { type, playerOut } = ball.wicket;
    if (!WICKET_TYPES.includes(type)) return "Unknown dismissal type.";
    if (!playerOut || ![ball.striker, ball.nonStriker].includes(playerOut)) {
      return "The player out must be one of the two batters.";
    }
    if (!EITHER_END_WICKETS.has(type) && playerOut !== ball.striker) {
      return "Only the striker can be out that way.";
    }
    if (RETIREMENTS.has(type)) {
      if (ball.runsOffBat || ball.extraRuns || ball.extrasType || ball.boundary) {
        return "Record the retirement on its own, without runs.";
      }
      return null;
    }
  }

  if (!ball.bowler) return "Select the bowler.";
  if (ball.bowler === ball.striker || ball.bowler === ball.nonStriker) {
    return "The bowler cannot also be one of the batters.";
  }

  const bowlerError = bowlerProblem(state, ball.bowler, { midOverChange: ball.bowlerChange });
  if (bowlerError) return bowlerError;

  switch (ball.extrasType) {
    case null:
      if (ball.extraRuns) return "Choose an extra type for extra runs.";
      break;
    case "wide":
      if (ball.runsOffBat) return "Runs cannot be scored off the bat on a wide.";
      if (ball.extraRuns < config.widePenalty) return `A wide is worth at least ${plural(config.widePenalty, "run")}.`;
      break;
    case "noball":
      if (ball.extraRuns < config.noBallPenalty) {
        return `A no-ball is worth at least ${plural(config.noBallPenalty, "run")}.`;
      }
      break;
    case "bye":
    case "legbye":
      if (ball.runsOffBat) return "Byes and leg byes cannot include runs off the bat.";
      if (ball.extraRuns < 1 && !ball.wicket) return "Enter how many byes were run.";
      break;
    default:
      break;
  }

  if (ball.boundary === 6) {
    if (ball.runsOffBat !== 6 || !(ball.extrasType === null || ball.extrasType === "noball")) {
      return "A six must be six runs off the bat.";
    }
  }
  if (ball.boundary === 4) {
    const batFour = ball.runsOffBat === 4 && (ball.extrasType === null || ball.extrasType === "noball");
    const penalty =
      ball.extrasType === "wide" ? config.widePenalty : ball.extrasType === "noball" ? config.noBallPenalty : 0;
    const extrasFour =
      ball.runsOffBat === 0 &&
      ["wide", "bye", "legbye", "noball"].includes(ball.extrasType) &&
      ball.extraRuns - penalty === 4;
    if (!batFour && !extrasFour) return "A four must be exactly four runs.";
  }

  if (ball.wicket) {
    const { type } = ball.wicket;
    if (ball.extrasType === "wide" && !WIDE_WICKETS.has(type)) {
      return "Off a wide a batter can only be stumped, run out, hit wicket or out obstructing the field.";
    }
    if (ball.extrasType === "noball" && !NOBALL_WICKETS.has(type)) {
      return "Off a no-ball a batter can only be run out or out obstructing the field.";
    }
    if ((ball.extrasType === "bye" || ball.extrasType === "legbye") && !BYE_WICKETS.has(type)) {
      return "Off byes or leg byes a batter can only be run out or out obstructing the field.";
    }
    if (state.freeHit && !FREE_HIT_WICKETS.has(type)) {
      return "Free hit: the batter can only be run out (or out obstructing the field).";
    }
    if (NO_BAT_RUNS_WICKETS.has(type) && ball.runsOffBat) {
      return "No runs off the bat count on that dismissal.";
    }
    if (ball.boundary) return "A boundary cannot also be a wicket.";
  }

  return null;
}

// ---------------------------------------------------------------- text

// Scorecard dismissal line, e.g. "c Ali b Khan", "run out (Ahmed)".
export function dismissalText(dismissal, nameOf = (id) => id || "") {
  if (!dismissal) return "not out";
  const bowler = nameOf(dismissal.bowler);
  const fielder = dismissal.fielders && dismissal.fielders[0] ? nameOf(dismissal.fielders[0]) : "";
  switch (dismissal.type) {
    case "bowled":
      return `b ${bowler}`;
    case "caught":
      if (dismissal.fielders?.[0] && dismissal.fielders[0] === dismissal.bowler) return `c & b ${bowler}`;
      return fielder ? `c ${fielder} b ${bowler}` : `c ? b ${bowler}`;
    case "lbw":
      return `lbw b ${bowler}`;
    case "run_out":
      return fielder ? `run out (${fielder})` : "run out";
    case "stumped":
      return fielder ? `st ${fielder} b ${bowler}` : `st b ${bowler}`;
    case "hit_wicket":
      return `hit wicket b ${bowler}`;
    case "obstructing_field":
      return "obstructing the field";
    case "retired_hurt":
      return "retired hurt";
    case "retired_out":
      return "retired out";
    default:
      return "out";
  }
}

// Auto-generated commentary line for a ball.
export function describeBall(rawBall, nameOf = (id) => id || "", config) {
  const ball = normalizeBall(rawBall);
  const { widePenalty, noBallPenalty } = resolveConfig(config);

  if (ball.extrasType === "penalty") {
    return `${plural(ball.extraRuns, "penalty run")} awarded to the batting side.`;
  }
  if (ball.wicket && RETIREMENTS.has(ball.wicket.type)) {
    return `${nameOf(ball.wicket.playerOut)} ${ball.wicket.type === "retired_hurt" ? "retires hurt" : "retires out"}.`;
  }

  let outcome;
  switch (ball.extrasType) {
    case "wide": {
      const extra = ball.extraRuns - widePenalty;
      outcome = ball.boundary === 4 ? "wide, and it runs away for FOUR" : extra > 0 ? `wide, and they run ${extra}` : "wide";
      break;
    }
    case "noball": {
      const byes = ball.extraRuns - noBallPenalty;
      if (ball.boundary === 6) outcome = "no ball, and it is smashed for SIX";
      else if (ball.boundary === 4 && ball.runsOffBat === 4) outcome = "no ball, and it is hit for FOUR";
      else if (ball.runsOffBat) outcome = `no ball, ${plural(ball.runsOffBat, "run")} off the bat`;
      else if (byes > 0) outcome = `no ball, ${plural(byes, "bye")}`;
      else outcome = "no ball";
      outcome += ". Free hit next";
      break;
    }
    case "bye":
      outcome = ball.boundary === 4 ? "FOUR byes" : plural(ball.extraRuns, "bye");
      break;
    case "legbye":
      outcome = ball.boundary === 4 ? "FOUR leg byes" : plural(ball.extraRuns, "leg bye");
      break;
    default:
      if (ball.boundary === 6) outcome = "SIX!";
      else if (ball.boundary === 4) outcome = "FOUR!";
      else if (ball.runsOffBat === 0) outcome = "no run";
      else outcome = plural(ball.runsOffBat, "run");
  }

  let line = `${nameOf(ball.bowler)} to ${nameOf(ball.striker)}, ${outcome}`;
  if (ball.wicket) {
    line += `. OUT! ${nameOf(ball.wicket.playerOut)} ${dismissalText(
      { type: ball.wicket.type, bowler: ball.bowler, fielders: ball.wicket.fielders },
      nameOf
    )}`;
  }
  return `${line}.`.replace(/!\.$/, "!").replace(/\.\.$/, ".");
}

// ---------------------------------------------------------------- result

// first / second: replayInnings() states plus { team }.
// Returns null while the chase is still going, otherwise
// { outcome: "win" | "tie" | "no_result", winner, margin, marginType, ballsLeft, text }.
export function computeResult({ first, second, abandoned = false, revisedTarget = false } = {}) {
  if (abandoned) {
    return { outcome: "no_result", winner: null, margin: null, marginType: null, ballsLeft: null, text: "No result" };
  }
  if (!first || !second || !second.complete) return null;

  const target = second.target ?? first.runs + 1;
  const suffix = revisedTarget ? " (DLS)" : "";

  if (second.runs >= target) {
    const margin = Math.max(0, second.maxWickets - second.wickets);
    const ballsLeft = Math.max(0, second.quotaBalls - second.legalBalls);
    const ballsText = ballsLeft > 0 ? ` (${plural(ballsLeft, "ball")} left)` : "";
    return {
      outcome: "win",
      winner: second.team,
      margin,
      marginType: "wickets",
      ballsLeft,
      text: `${second.team} won by ${plural(margin, "wicket")}${ballsText}${suffix}`,
    };
  }

  if (second.runs === target - 1) {
    return { outcome: "tie", winner: null, margin: null, marginType: null, ballsLeft: null, text: `Match tied${suffix}` };
  }

  const margin = target - 1 - second.runs;
  return {
    outcome: "win",
    winner: first.team,
    margin,
    marginType: "runs",
    ballsLeft: null,
    text: `${first.team} won by ${plural(margin, "run")}${suffix}`,
  };
}

// ---------------------------------------------------------------- player stats

function emptyPlayerStats(player, team) {
  return {
    player,
    team,
    batting: {
      didBat: false,
      order: null,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      out: false,
      dismissal: null,
      strikeRate: 0,
    },
    bowling: { legalBalls: 0, overs: "0.0", runs: 0, wickets: 0, maidens: 0, wides: 0, noballs: 0, dots: 0, economy: 0 },
    fielding: { catches: 0, runOuts: 0, stumpings: 0 },
  };
}

// Per-player figures for one match, from its replayed innings.
//   innings: [{ state, battingTeam, bowlingTeam }]  (regular innings only, no super over)
//   squads:  { [teamName]: [playerIds] }             (playing XI, so non-batters still count)
// Returns an array of PlayerMatchStats-shaped objects.
export function buildPlayerMatchStats(innings = [], squads = {}) {
  const stats = new Map();
  const get = (id, team) => {
    const key = toId(id);
    if (!key) return null;
    if (!stats.has(key)) stats.set(key, emptyPlayerStats(key, team || ""));
    const entry = stats.get(key);
    if (!entry.team && team) entry.team = team;
    return entry;
  };

  for (const [team, ids] of Object.entries(squads)) {
    for (const id of ids || []) get(id, team);
  }

  for (const { state, battingTeam, bowlingTeam } of innings) {
    for (const batter of state.batters) {
      const entry = get(batter.id, battingTeam);
      const bat = entry.batting;
      bat.didBat = true;
      bat.order = bat.order ?? batter.order;
      bat.runs += batter.runs;
      bat.balls += batter.balls;
      bat.fours += batter.fours;
      bat.sixes += batter.sixes;
      bat.out = bat.out || batter.out;
      bat.dismissal = batter.dismissal;
      bat.strikeRate = strikeRate(bat.runs, bat.balls);
    }

    for (const bowler of state.bowlers) {
      const entry = get(bowler.id, bowlingTeam);
      const bowl = entry.bowling;
      for (const key of ["legalBalls", "runs", "wickets", "maidens", "wides", "noballs", "dots"]) {
        bowl[key] += bowler[key];
      }
      bowl.overs = formatOvers(bowl.legalBalls);
      bowl.economy = economyRate(bowl.runs, bowl.legalBalls);
    }

    for (const ball of state.balls) {
      if (!ball.wicket || !ball.wicket.fielders.length) continue;
      const fielder = get(ball.wicket.fielders[0], bowlingTeam);
      if (ball.wicket.type === "caught") fielder.fielding.catches += 1;
      else if (ball.wicket.type === "stumped") fielder.fielding.stumpings += 1;
      else if (ball.wicket.type === "run_out") fielder.fielding.runOuts += 1;
    }
  }

  return [...stats.values()];
}

// ---------------------------------------------------------------- match summary

function shortOvers(legalBalls) {
  const text = formatOvers(legalBalls);
  return text.endsWith(".0") ? text.slice(0, -2) : text;
}

// The homepage scorecard's per-side summary (Match.teamAInnings shape) from
// a replayed innings: score, overs, top batter and the best bowler against.
export function inningsSummary(state, nameOf = (id) => id || "") {
  const topBatter = [...state.batters]
    .filter((b) => b.balls > 0 || b.runs > 0 || b.out)
    .sort((a, b) => b.runs - a.runs || a.balls - b.balls)[0];
  const topBowler = [...state.bowlers]
    .filter((b) => b.legalBalls > 0 || b.runs > 0 || b.wickets > 0)
    .sort((a, b) => b.wickets - a.wickets || a.runs - b.runs || b.legalBalls - a.legalBalls)[0];
  return {
    runs: state.runs,
    wickets: state.wickets,
    overs: shortOvers(state.legalBalls),
    topBatter: topBatter
      ? { name: nameOf(topBatter.id), figures: `${topBatter.runs}${topBatter.out ? "" : "*"} (${topBatter.balls})` }
      : { name: "", figures: "" },
    topBowler: topBowler
      ? { name: nameOf(topBowler.id), figures: `${topBowler.wickets}-${topBowler.runs}` }
      : { name: "", figures: "" },
  };
}

// One line for the homepage while a match is live, e.g.
// "Tigers need 25 runs from 18 balls".
//   toss:        { winner, decision }
//   first:       { state, chasingTeam }   the first innings
//   second:      { state, team } | null   the chase, once it has started
export function liveSituation({ toss, first, second }) {
  if (second && second.state) {
    const s = second.state;
    if (s.complete || s.runsNeeded === null) return "";
    return `${second.team} need ${plural(s.runsNeeded, "run")} from ${plural(s.ballsRemaining, "ball")}`;
  }
  if (first && first.state && first.state.complete) {
    return `Innings break: ${first.chasingTeam} need ${first.state.runs + 1} to win`;
  }
  if (toss?.winner && toss?.decision) {
    return `${toss.winner} won the toss and chose to ${toss.decision}`;
  }
  return "";
}
