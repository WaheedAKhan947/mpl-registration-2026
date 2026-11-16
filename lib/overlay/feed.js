// Delay buffer for the overlay feed. Pure (no timers, no fetch), so it is
// unit tested. The camera reaches viewers a few seconds late, so `?delay=N`
// holds each new score back N seconds to stay in sync with the video.
//
// buffer: [{ at, key, data }] oldest first. buffer[0] is always the snapshot
// currently on screen (or the first one ever received).

// Identity of a snapshot, ignoring fields that change on every request.
export function snapshotKey(data) {
  if (!data) return "";
  // eslint-disable-next-line no-unused-vars
  const { serverTime, ...rest } = data;
  return JSON.stringify(rest);
}

// Adds a freshly fetched snapshot. Unchanged data is not stored again, so an
// idle match does not grow the buffer.
export function pushSnapshot(buffer, data, now) {
  const key = snapshotKey(data);
  const last = buffer[buffer.length - 1];
  if (last && last.key === key) return buffer;
  return [...buffer, { at: now, key, data }];
}

// Picks what to show at `now`: the newest snapshot at least `delayMs` old.
// If none is old enough yet, keep showing buffer[0]; on start-up that is the
// first snapshot, so the overlay is never blank after a (re)load.
// Older entries are dropped. Returns { shown, buffer }.
export function pickSnapshot(buffer, now, delayMs = 0) {
  if (!buffer.length) return { shown: null, buffer };
  let index = 0;
  for (let i = buffer.length - 1; i >= 0; i -= 1) {
    if (buffer[i].at <= now - delayMs) {
      index = i;
      break;
    }
  }
  const next = index > 0 ? buffer.slice(index) : buffer;
  return { shown: next[0], buffer: next };
}

// Wait before the next poll: the normal interval while healthy, backing off
// to at most 10 seconds after repeated failures.
export function nextPollDelay(pollMs, failures) {
  if (!failures) return pollMs;
  return Math.min(10000, pollMs * 2 ** Math.min(failures, 3));
}
