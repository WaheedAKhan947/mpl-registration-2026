// Builds the broadcast overlay feed (GET /api/matches/[id]/overlay and the
// overlay page's first frame): the live score, screen data, recent events and
// the operator's control state (Admin > Stream Overlay).

import OverlayState from "@/models/OverlayState";
import { attachCareers } from "@/lib/statsServer";
import { buildLive, buildOverlayExtras, buildOverlayEvents, buildScorecard } from "@/lib/publicMatch";
import { replayFor } from "@/lib/scoringServer";
import { overlayEvents } from "@/lib/overlay/events";
import { REPLAY_TYPES, controlEvents, publicControl } from "@/lib/overlay/control";
import { toHighlightRows } from "@/lib/overlay/highlights";

const photoOf = (id) => (id ? `/api/players/${id}/photo` : null);

// The newest FOUR / SIX / WICKET in the match (current innings first), as an
// overlay event, or null. Only replays the balls it needs.
export function findLastHighlight(data) {
  const { match, innings, nameOf } = data;
  const ordered = [...innings].filter((i) => i.doc.number <= (match.currentInnings || 99)).reverse();
  for (const inn of ordered) {
    const balls = inn.state.balls;
    let index = -1;
    for (let i = balls.length - 1; i >= 0; i -= 1) {
      const b = balls[i];
      if ((b.wicket && b.wicket.type !== "retired_hurt") || b.boundary === 4 || b.boundary === 6) {
        index = i;
        break;
      }
    }
    if (index < 0) continue;
    const times = new Map(inn.balls.map((b) => [b.seq, b.createdAt ? new Date(b.createdAt).toISOString() : null]));
    const events = overlayEvents({
      balls: balls.slice(0, index + 1),
      replayUpTo: (count) => replayFor(match, inn.doc, inn.balls.slice(0, count)),
      number: inn.doc.number,
      battingTeam: inn.doc.battingTeam,
      bowlingTeam: inn.doc.bowlingTeam,
      nameOf,
      photoOf,
      timeOf: (seq) => times.get(seq) || null,
      limit: 1,
    });
    const found = events.find((e) => REPLAY_TYPES.includes(e.type));
    if (found) return found;
  }
  return null;
}

// Every four, six, wicket, fifty, hundred and hat-trick of the match, oldest
// first, for the highlights log. Replays each innings ball by ball, so it is
// only built on request (admin), never for the overlay feed.
export function allHighlights(data) {
  const { match, innings, nameOf } = data;
  return innings.flatMap((inn) => {
    const times = new Map(inn.balls.map((b) => [b.seq, b.createdAt ? new Date(b.createdAt).toISOString() : null]));
    return toHighlightRows(
      overlayEvents({
        balls: inn.state.balls,
        replayUpTo: (count) => replayFor(match, inn.doc, inn.balls.slice(0, count)),
        number: inn.doc.number,
        battingTeam: inn.doc.battingTeam,
        bowlingTeam: inn.doc.bowlingTeam,
        nameOf,
        photoOf,
        timeOf: (seq) => times.get(seq) || null,
        limit: inn.state.balls.length,
      })
    );
  });
}

// Body of a PLAYER_CARD event for one playing-XI player: who they are and
// what they have done in this match so far. Tournament numbers are added by
// attachCareers. Null for anyone outside the two XIs.
export function playerCardBody(data, playerId) {
  const { match, innings, nameOf, roles } = data;
  const id = String(playerId);
  const inA = (match.playingXI?.teamA || []).map(String).includes(id);
  const inB = (match.playingXI?.teamB || []).map(String).includes(id);
  if (!inA && !inB) return null;
  const team = inA ? match.teamA : match.teamB;

  let batting = null;
  let bowling = null;
  for (const { state } of innings) {
    const bat = state.batters.find((b) => b.id === id);
    if (bat && (bat.balls > 0 || bat.runs > 0 || bat.out)) {
      batting = { runs: bat.runs, balls: bat.balls, out: bat.out };
    }
    const bowl = state.bowlers.find((b) => b.id === id);
    if (bowl && bowl.legalBalls > 0) {
      bowling = { overs: bowl.overs, runs: bowl.runs, wickets: bowl.wickets };
    }
  }

  return {
    team,
    batter: { id, name: nameOf(id), role: roles.get(id) || "", photo: photoOf(id) },
    today: { batting, bowling },
  };
}

// The full overlay payload.
export async function buildOverlayPayload(data) {
  const doc = await OverlayState.findOne({ match: data.match._id }).lean();
  const control = publicControl(doc);
  const wantsReplay = Boolean(doc?.replay?.id);
  const extra = controlEvents({
    doc,
    highlight: wantsReplay ? findLastHighlight(data) : null,
    playerCard: (id) => playerCardBody(data, id),
  });

  const scorecard =
    control.screen === "scorecard"
      ? (() => {
          const card = buildScorecard(data);
          const current = card.innings.find((i) => i.number === data.match.currentInnings) || card.innings[card.innings.length - 1] || null;
          return current;
        })()
      : null;

  return {
    ...buildLive(data),
    ...buildOverlayExtras(data),
    control,
    scorecard,
    events: await attachCareers([...buildOverlayEvents(data), ...extra]),
    serverTime: new Date().toISOString(),
  };
}
