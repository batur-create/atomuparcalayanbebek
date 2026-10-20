// Discovery advances on credited work, never on the number of sessions.
export const DISCOVERY_STEP = 25;
export const DISCOVERY_CHANCE = 0.05;
export const DISCOVERY_GUARANTEE = 500;

export function advanceDiscovery(previous, minutes, pool, roll) {
  const state = { carry: 0, dry: 0, draws: 0, ...previous };
  const left = [...pool], awards = [];
  if (!left.length) return { state, awards };
  state.carry += Math.max(0, Math.floor(minutes));
  while (state.carry >= DISCOVERY_STEP && left.length) {
    state.carry -= DISCOVERY_STEP;
    state.dry += DISCOVERY_STEP;
    const [chance, pick] = roll(state.draws++);
    const guaranteed = state.dry >= DISCOVERY_GUARANTEE;
    if (guaranteed || chance < DISCOVERY_CHANCE) {
      const item = left.splice(Math.min(left.length - 1, Math.floor(pick * left.length)), 1)[0];
      awards.push({ item, source: guaranteed ? "guarantee" : "luck" });
      state.dry = 0;
    }
  }
  // Work after completing the entire collection is not banked for future releases.
  if (!left.length) state.carry = 0;
  return { state, awards };
}

export function discoveryStatus(state, pool, unlocks) {
  const left = pool.filter(item => !unlocks.includes(item.id)).length;
  const worked = Math.min(DISCOVERY_GUARANTEE, (state?.dry || 0) + (state?.carry || 0));
  return { worked, remaining: DISCOVERY_GUARANTEE - worked, guarantee: DISCOVERY_GUARANTEE, left, total: pool.length };
}

// Immutable migration-31 backfill. Future catalogue changes must not rewrite it.
export const WEEKLY_LEGACY = [["postane", Date.UTC(2026,9,12)-10800000], ["cay", Date.UTC(2026,9,19)-10800000]];
export const WEEKLY_BACKFILL = WEEKLY_LEGACY.map(([id, since]) =>
  `INSERT OR IGNORE INTO unlocks(member_id,model,source,created) SELECT member_id,'${id}','weekly',MIN(created) FROM buildings WHERE model='${id}' AND gift IS NULL AND created>=${since} AND created<${since+14*86400000} GROUP BY member_id`);
