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

// ---------- n28: the week's story ----------
export { weekOf, storyWeek } from "../shared/week.js";
const WEEK = 7 * DAY;
const hourOf = (t) => new Date(t + TR).getUTCHours();
// The person with the most of something; ties go to whoever got there first
// in `order` (the member list), so the story never flips between reads.
function topOf(map, order) {
  let best = null;
  for (const id of order) {
    const v = map.get(id) || 0;
    if (v > 0 && (!best || v > best.value)) best = { id, value: v };
  }
  return best;
}
/**
 * The team's week, from raw rows of that week (focus, arrivals, buildings) and
 * each member's focus days up to its end (for streaks). Pure, so it is tested
 * without a server. `members` is the current team, in a stable order; rows of
 * people who left are ignored. Cards with nothing to say are left out.
 */
export function storyOf({ start, now, members, focus, previous, arrivals, buildings, days, messages, master, monument, meId }) {
  const end = start + WEEK,
    ids = members.map((m) => m.id),
    inTeam = new Set(ids);
  const perDay = new Array(7).fill(0),
    minutes = new Map(),
    sessions = new Map(),
    night = new Map(),
    early = new Map(),
    myDays = new Map(),
    myHours = new Array(24).fill(0);
  let total = 0,
    count = 0,
    longest = null;
  for (const f of focus) {
    if (!inTeam.has(f.memberId)) continue;
    const began = f.created - f.minutes * 60000,
      day = Math.min(6, Math.max(0, Math.floor((f.created - start) / DAY))),
      hour = hourOf(began);
    perDay[day] += f.minutes;
    total += f.minutes;
    count++;
    minutes.set(f.memberId, (minutes.get(f.memberId) || 0) + f.minutes);
    sessions.set(f.memberId, (sessions.get(f.memberId) || 0) + 1);
    if (hour >= 21 || hour < 4) night.set(f.memberId, (night.get(f.memberId) || 0) + f.minutes);
    if (hour >= 5 && hour < 9) early.set(f.memberId, (early.get(f.memberId) || 0) + f.minutes);
    if (!longest || f.minutes > longest.minutes) longest = { id: f.memberId, minutes: f.minutes, at: began };
    if (f.memberId === meId) {
      myDays.set(day, (myDays.get(day) || 0) + f.minutes);
      myHours[hour] += f.minutes;
    }
  }
  // Library days: distinct days each person checked in.
  const visitDays = new Map(),
    visits = new Map();
  for (const a of arrivals) {
    if (!inTeam.has(a.memberId)) continue;
    visits.set(a.memberId, (visits.get(a.memberId) || 0) + 1);
    if (!visitDays.has(a.memberId)) visitDays.set(a.memberId, new Set());
    visitDays.get(a.memberId).add(dayOf(a.created));
  }
  const dayCount = new Map([...visitDays].map(([id, set]) => [id, set.size]));
  // Streaks as they stood when the week ended (or now, for the week under way).
  const lastDay = dayOf(Math.min(now, end - 1)),
    streaks = new Map();
  for (const id of ids) {
    const set = new Set((days.get(id) || []).map(dayOf));
    streaks.set(id, dayStreak(set, lastDay).count);
  }
  const built = buildings.filter((b) => inTeam.has(b.memberId)),
    builders = new Map();
  for (const b of built) builders.set(b.memberId, (builders.get(b.memberId) || 0) + 1);
  const liked = built.reduce((best, b) => (b.likes > 0 && (!best || b.likes > best.likes) ? b : best), null);

  const top = topOf(minutes, ids),
    regular = topOf(dayCount, ids),
    streak = topOf(streaks, ids),
    owl = topOf(night, ids),
    lark = topOf(early, ids),
    builder = topOf(builders, ids);
  const crowned = master && inTeam.has(master.memberId) ? { id: master.memberId, minutes: master.minutes } : null;
  // Haftanın ikilisi: two shared days make a pair in a week.
  const partners = partnersOf({ focus, ids, min: 2 });
  const story = {
    week: { start, end, complete: now >= end },
    team: {
      minutes: total,
      sessions: count,
      previous,
      people: minutes.size,
      size: ids.length,
      days: perDay,
      messages,
      visits: [...visits.values()].reduce((t, v) => t + v, 0),
    },
    master: crowned || (top && { id: top.id, minutes: top.value }),
    crowned: !!crowned,
    regular: regular && {
      id: regular.id,
      days: regular.value,
      visits: visits.get(regular.id) || 0,
      on: [...visitDays.get(regular.id)].map((d) => d - dayOf(start)).sort((a, b) => a - b),
    },
    streak: streak && streak.value >= 2 ? { id: streak.id, days: streak.value } : null,
    owl: owl && owl.value >= 30 ? { id: owl.id, minutes: owl.value } : null,
    lark: lark && lark.value >= 30 ? { id: lark.id, minutes: lark.value } : null,
    longest,
    duo: partners.duo,
    village: built.length
      ? { built: built.length, builder: builder && { id: builder.id, n: builder.value }, monument: !!monument, liked: liked && { id: liked.memberId, model: liked.model, likes: liked.likes } }
      : monument
        ? { built: 0, builder: null, monument: true, liked: null }
        : null,
    me: null,
  };
  if (meId && inTeam.has(meId)) {
    const mine = minutes.get(meId) || 0;
    const best = [...myDays].sort((a, b) => b[1] - a[1])[0];
    const ranked = ids.filter((id) => (minutes.get(id) || 0) > mine).length;
    story.me = {
      minutes: mine,
      sessions: sessions.get(meId) || 0,
      days: myDays.size,
      on: [...myDays.keys()].sort((a, b) => a - b),
      visits: dayCount.get(meId) || 0,
      streak: streaks.get(meId) || 0,
      built: builders.get(meId) || 0,
      bestDay: best ? { day: best[0], minutes: best[1] } : null,
      peakHour: mine ? myHours.indexOf(Math.max(...myHours)) : null,
      share: total ? Math.round((mine / total) * 100) : 0,
      rank: mine ? ranked + 1 : null,
      partner: partners.of(meId),
    };
  }
  return story;
}

// ---------- Çalışma eşi: who studies best together ----------
/**
 * Pairs of the team who focused at the same time, from finished sessions
 * ({ memberId, minutes, created }). A session counts as "with" a friend when
 * the friend was focusing for at least half of it (the İmece rule); a day with
 * such a session is the pair's shared day. How productive a pair is together
 * is how much each of them focused, all day, on their shared days. A pair needs
 * `min` shared days to count. `duo` is the team's best pair; `of(id)` is that
 * person's best partner, with their usual day for comparison.
 */
export function partnersOf({ focus, ids, min }) {
  const inTeam = new Set(ids),
    spans = new Map(ids.map((id) => [id, []])),
    daily = new Map(ids.map((id) => [id, new Map()]));
  for (const f of focus) {
    if (!inTeam.has(f.memberId) || f.minutes <= 0) continue;
    spans.get(f.memberId).push([f.created - f.minutes * 60000, f.created]);
    const d = dayOf(f.created),
      days = daily.get(f.memberId);
    days.set(d, (days.get(d) || 0) + f.minutes);
  }
  for (const list of spans.values()) list.sort((x, y) => x[0] - y[0]);
  const pairs = [];
  ids.forEach((a, i) => {
    for (const b of ids.slice(i + 1)) {
      const shared = new Set(),
        other = spans.get(b);
      let together = 0,
        k = 0;
      // One person's sessions never overlap each other, so both lists are in
      // order of start and of end: a sweep finds every overlap.
      for (const [s1, e1] of spans.get(a)) {
        while (k < other.length && other[k][1] <= s1) k++;
        for (let n = k; n < other.length && other[n][0] < e1; n++) {
          const [s2, e2] = other[n],
            o = Math.min(e1, e2) - Math.max(s1, s2);
          together += o;
          if (o * 2 >= e1 - s1) shared.add(dayOf(e1));
          if (o * 2 >= e2 - s2) shared.add(dayOf(e2));
        }
      }
      if (shared.size < Math.max(1, min)) continue;
      const on = (id) => [...shared].reduce((t, d) => t + (daily.get(id).get(d) || 0), 0);
      pairs.push({ ids: [a, b], days: shared, together: Math.round(together / 60000), focus: [on(a), on(b)] });
    }
  });
  // Best first: the most focus per person per shared day, then the most time
  // side by side; ties keep the member order, so the answer never flips.
  const score = (p) => (p.focus[0] + p.focus[1]) / (2 * p.days.size);
  pairs.sort((x, y) => score(y) - score(x) || y.together - x.together);
  const top = pairs[0];
  return {
    duo: top ? { ids: top.ids, days: top.days.size, together: top.together, daily: Math.round(score(top)) } : null,
    of(id) {
      const p = pairs.find((x) => x.ids.includes(id));
      if (!p) return null;
      const side = p.ids.indexOf(id),
        rest = [...daily.get(id)].filter(([d]) => !p.days.has(d));
      return {
        id: p.ids[1 - side],
        days: p.days.size,
        together: p.together,
        daily: Math.round(p.focus[side] / p.days.size),
        // The person's other focus days, when there are enough to compare with.
        usual: rest.length >= 2 ? Math.round(rest.reduce((t, [, m]) => t + m, 0) / rest.length) : null,
      };
    },
  };
}
