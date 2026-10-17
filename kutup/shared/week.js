// Weeks in Türkiye time (UTC+3 all year, no DST), shared by the server and the
// app: the week's story (n28) is told for the same week on both sides.
const HOUR = 3600000,
  DAY = 24 * HOUR,
  TR = 3 * HOUR;
/** Monday 00:00 in Türkiye of the week holding `t`. */
export const weekOf = (t) => {
  const day = Math.floor((t + TR) / DAY);
  return (day - ((day + 3) % 7)) * DAY - TR; // day 0 (1 Jan 1970) was a Thursday
};
/** The story is ready on Sunday at 18:00, when the notification goes out. */
export const storyReady = (start) => start + 6 * DAY + 18 * HOUR;
/** The week a story is told for: this week from Sunday 18:00 on, the week before until then. */
export const storyWeek = (now) => {
  const start = weekOf(now);
  return now >= storyReady(start) ? start : start - 7 * DAY;
};
