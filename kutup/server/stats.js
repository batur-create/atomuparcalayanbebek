// A member's statistics, computed from the raw logs: focus_log, activity
// (arrivals, leaving, collapses), buildings and the tuğla ledger. Pure, so it
// is cheap to run per request and easy to test.
const HOUR = 3600000,
  DAY = 24 * HOUR,
  TR = 3 * HOUR; // Türkiye has no DST: UTC+3 all year
const dayOf = (t) => Math.floor((t + TR) / DAY); // calendar day number in Türkiye
const minuteOfDay = (t) => {
  const d = new Date(t + TR);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};
const median = (list) => {
  const s = [...list].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
/**
 * Days in a row with a finished session, counted back from `today` (today
 * itself may still be empty). One missed day a week (Monday to Sunday) is
 * bridged by a freeze, so a single slip never wipes out a long streak.
 */
export function dayStreak(days, today) {
  let d = days.has(today) ? today : today - 1,
    count = 0;
  const frozen = new Set();
  for (;;) {
    if (days.has(d)) {
      count++;
      d--;
      continue;
    }
    const week = Math.floor((d + 3) / 7); // day 0 (1 Jan 1970) was a Thursday
    if (!frozen.has(week) && days.has(d - 1)) {
      frozen.add(week);
      d--;
      continue;
    }
    return { count, frozen: frozen.size };
  }
}
// A visit lasts until leaving, the next arrival or the 8 hours a check-in holds.
const VISIT_CAP = 8 * HOUR;

export function statsOf({ focus, activity, built, ledger, social, bricks, now }) {
  const today = dayOf(now);
  const perDay = new Map(),
    hours = new Array(24).fill(0);
  let total = 0,
    longest = 0,
    strict = 0;
  for (const f of focus) {
    const d = dayOf(f.created);
    perDay.set(d, (perDay.get(d) || 0) + f.minutes);
    total += f.minutes;
    longest = Math.max(longest, f.minutes);
    if (f.strict) strict++;
    hours[Math.floor(minuteOfDay(f.created - f.minutes * 60000) / 60)] += f.minutes;
  }
  // Day streaks: days in a row with at least one finished session; today
  // still counts as "kept" until it is over.
  const days = [...perDay.keys()].sort((a, b) => a - b);
  const daySet = new Set(days);
  const now_ = dayStreak(daySet, today);
  const current = now_.count;
  const best = days.reduce((b, d) => Math.max(b, dayStreak(daySet, d).count), 0);
  const bestDay = days.reduce((b, d) => (b === null || perDay.get(d) > perDay.get(b) ? d : b), null);
  const since = (n) => days.filter((d) => d > today - n).reduce((t, d) => t + perDay.get(d), 0);

  const arrivals = activity.filter((a) => a.kind === "arrive");
  let inside = 0;
  activity.forEach((a, i) => {
    if (a.kind !== "arrive") return;
    const next = activity.slice(i + 1).find((b) => b.kind === "arrive" || b.kind === "leave");
    inside += Math.max(0, Math.min(next ? next.created : now, a.created + VISIT_CAP) - a.created);
  });
  const rooms = {};
  for (const a of arrivals) if (a.detail) rooms[a.detail] = (rooms[a.detail] || 0) + 1;
  const collapses = activity.filter((a) => a.kind === "collapse").length;
  const money = Object.fromEntries(ledger.map((l) => [l.reason, l.total || 0]));

  return {
    focus: {
      total,
      sessions: focus.length,
      strict,
      longest,
      average: focus.length ? Math.round(total / focus.length) : 0,
      today: perDay.get(today) || 0,
      week: since(7),
      month: since(30),
      last14: Array.from({ length: 14 }, (_, i) => {
        const d = today - 13 + i;
        return [d * DAY - TR, perDay.get(d) || 0];
      }),
      bestDay: bestDay === null ? null : { at: bestDay * DAY - TR, minutes: perDay.get(bestDay) },
      peakHour: total ? hours.indexOf(Math.max(...hours)) : null,
      streak: { current, best, frozen: now_.frozen },
    },
    builds: {
      total: built.reduce((t, b) => t + b.n, 0),
      models: Object.fromEntries(built.map((b) => [b.model, b.n])),
      likes: built.reduce((t, b) => t + (b.likes || 0), 0),
      collapses,
      success: strict + collapses ? Math.round((strict / (strict + collapses)) * 100) : null,
    },
    library: {
      visits: arrivals.length,
      days: new Set(arrivals.map((a) => dayOf(a.created))).size,
      minutes: Math.round(inside / 60000),
      room: Object.entries(rooms).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
      usualArrival: arrivals.length ? Math.round(median(arrivals.map((a) => minuteOfDay(a.created)))) : null,
    },
    bricks: {
      balance: bricks,
      earned: (money.wage || 0) + (money.bonus || 0) + (money.streak || 0),
      spent: -(money.cost || 0),
      refunded: (money.refund || 0) + (money["ruin-refund"] || 0),
    },
    social: { messages: social?.messages || 0, plans: social?.plans || 0, joined: social?.joined || 0 },
  };
}
