// Başarımlar (n14): who has earned what, worked out from the logs. Pure, like
// server/stats.js, so it runs per request and is easy to test. Each badge
// carries the moment it was earned (the session, building or day that tipped
// it over) and how far along the member is, for the progress bars.
import { ACHIEVEMENTS, shouting, teaCall } from "../shared/achievements.js";
import { dayStreak } from "./stats.js";

const HOUR = 3600000,
  DAY = 24 * HOUR,
  TR = 3 * HOUR;
const dayOf = (t) => Math.floor((t + TR) / DAY);
const hourOf = (t) => new Date(t + TR).getUTCHours();
const need = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.key, a.need]));

/** The time the n-th item of a list (sorted by time) arrived, or null. */
const nth = (list, n) => (list.length >= n ? list[n - 1].created : null);

export function achievementsOf({ focus, buildings, ledger, masters, arrivals, messages, stored, now }) {
  const got = new Map(),
    have = new Map();
  const earn = (key, at, value) => {
    have.set(key, value);
    if (at !== null && at !== undefined) got.set(key, at);
  };

  // Focus: day streaks, early and late sessions, the long day, the hundred hours.
  const perDay = new Map(),
    lastOfDay = new Map();
  let total = 0,
    hundredAt = null,
    marathonAt = null,
    longestDay = 0;
  for (const f of focus) {
    const d = dayOf(f.created);
    const before = perDay.get(d) || 0;
    perDay.set(d, before + f.minutes);
    lastOfDay.set(d, f.created);
    longestDay = Math.max(longestDay, before + f.minutes);
    if (marathonAt === null && before + f.minutes >= need.marathon) marathonAt = f.created;
    total += f.minutes;
    if (hundredAt === null && total >= need.hundred) hundredAt = f.created;
  }
  const days = [...perDay.keys()].sort((a, b) => a - b),
    daySet = new Set(days);
  const streakAt = (n) => {
    const d = days.find((day) => dayStreak(daySet, day).count >= n);
    return d === undefined ? null : lastOfDay.get(d);
  };
  const current = dayStreak(daySet, dayOf(now)).count;
  earn("week-streak", streakAt(need["week-streak"]), current);
  earn("month-streak", streakAt(need["month-streak"]), current);
  const long = focus.filter((f) => f.minutes >= 30);
  const early = long.filter((f) => {
    const h = hourOf(f.created - f.minutes * 60000);
    return h >= 5 && h < 9;
  });
  const night = long.filter((f) => {
    const h = hourOf(f.created - f.minutes * 60000);
    return h >= 21 || h < 4;
  });
  earn("early", nth(early, need.early), early.length);
  earn("night", nth(night, need.night), night.length);
  earn("marathon", marathonAt, longestDay);
  earn("hundred", hundredAt, total);

  // The village: the first building, eight kinds, a well-liked one.
  earn("first-build", nth(buildings, 1), buildings.length);
  const kinds = new Set();
  let collectorAt = null;
  for (const b of buildings) {
    kinds.add(b.model);
    if (collectorAt === null && kinds.size >= need.collector) collectorAt = b.created;
  }
  earn("collector", collectorAt, kinds.size);
  const mostLiked = buildings.reduce((m, b) => Math.max(m, b.likes || 0), 0);
  earn("loved", mostLiked >= need.loved ? now : null, mostLiked);

  // Together: sessions alongside friends, crowns, monuments, library days.
  const imece = ledger.filter((l) => l.reason === "imece");
  earn("imece", nth(imece, need.imece), imece.length);
  earn("master", nth(masters, 1), masters.length);
  const monuments = ledger.filter((l) => l.reason === "monument");
  earn("monument", nth(monuments, 1), monuments.length);
  const seen = new Set(),
    firsts = [];
  for (const a of arrivals) {
    const d = dayOf(a.created);
    if (!seen.has(d)) {
      seen.add(d);
      firsts.push(a);
    }
  }
  earn("regular", nth(firsts, need.regular), firsts.length);

  // Secrets: shouting on the Pano, calling for tea, and what the page reports.
  const shout = messages.find((m) => shouting(m.text)),
    tea = messages.find((m) => teaCall(m.text));
  earn("shush", shout ? shout.created : null, shout ? 1 : 0);
  earn("tea", tea ? tea.created : null, tea ? 1 : 0);

  // Once earned, a badge stays (the stored moment wins), even if the logs change.
  const kept = new Map(stored.map((s) => [s.key, s.created]));
  return ACHIEVEMENTS.map(({ key, need: n }) => {
    const at = kept.get(key) ?? got.get(key) ?? null;
    return { key, at, have: at !== null ? Math.max(n, have.get(key) || 0) : Math.min(have.get(key) || 0, n) };
  });
}
