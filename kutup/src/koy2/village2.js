// n46 D: the client side of the /api/village v2 contract (plan §4.5). Keeps
// the planned layout row by row (a delta only adds, changes or tombstones rows
// of the same layout), and shapes what stands on it two ways: `things` for the
// v2 drawing (src/koy2/world2.js) and `buildings` in the shape the rest of the
// app already reads (cards, lists, Home), with x/y/facing from the placement.
const merge = (before, rows = [], gone = []) => {
  const byId = new Map(before.map((x) => [x.id, x]));
  for (const id of gone) byId.delete(id);
  for (const x of rows) byId.set(x.id, x);
  return [...byId.values()];
};

/** Merges a contractVersion 2 answer into what we hold (null, legacy or v2). */
export function mergeVillage2(prev, raw) {
  if (!raw || raw.unchanged) return prev;
  const same = prev?.v2 && !raw.full && prev.layoutId === raw.layoutId && raw.layoutRev >= prev.layoutRev;
  const base = same ? prev.rows : { nodes: [], roads: [], neighborhoods: [], plots: [] };
  const d = (same && raw.deletes) || {};
  const rows = {
    terrain: raw.regions?.[0]?.terrain || (same ? prev.rows.terrain : null),
    nodes: merge(base.nodes, raw.nodes, d.nodes),
    roads: merge(base.roads, raw.roads, d.roads),
    neighborhoods: merge(base.neighborhoods, raw.neighborhoods, d.neighborhoods),
    plots: merge(base.plots, raw.plots, d.plots),
  };
  // Who stands on which plot comes from the placements, never from guessing.
  const on = new Map(),
    things = new Map();
  const buildings = [];
  for (const b of raw.buildings || []) {
    const at = b.placement;
    if (at) on.set(at.plotId, { type: "building", id: b.id });
    things.set(`building:${b.id}`, { kind: b.kind, seed: b.seed, model: b.model, memberId: b.memberId });
    buildings.push({
      id: b.id, memberId: b.memberId, kind: b.kind, seed: b.seed, x: at ? at.x : null, y: at ? at.y : null, facing: at ? at.facing : 0,
      minutes: b.minutes, created: b.created, likes: b.likes, mine: !!b.liked, model: b.model || null, patched: !!b.patched, gift: b.gift || null, placement: at,
    });
  }
  const sites = (raw.sites || []).map((s) => ({ ...s, receivedAt: Date.now() }));
  for (const s of sites) {
    if (s.placement) on.set(s.placement.plotId, { type: "site", id: s.focusRunId });
    things.set(`site:${s.focusRunId}`, { model: s.modelId, memberId: s.memberId, site: { shown: s.verifiedStage }, run: s });
  }
  for (const p of raw.projects || []) {
    if (!p.placement) continue;
    on.set(p.placement.plotId, { type: "imece", id: p.id });
    // The shared Anıtkabir rises with the crew's minutes (the same 2,000-minute ledger).
    things.set(`imece:${p.id}`, { model: "anitkabir", site: p.completed ? null : { shown: p.stage ?? 0 }, project: p });
  }
  if (raw.weeklyMonument?.placement) on.set(raw.weeklyMonument.placement.plotId, { type: "weekly_monument", id: raw.groupId });
  const layout = {
    seed: raw.seed ?? raw.layoutId,
    terrain: rows.terrain,
    nodes: rows.nodes,
    roads: rows.roads,
    foci: rows.neighborhoods,
    // A plot with nobody on it is not drawn (a placement on its way, or let go).
    plots: rows.plots.filter((p) => on.has(p.id)).map((p) => ({ ...p, subject: on.get(p.id) })),
  };
  return {
    v2: true,
    layoutId: raw.layoutId,
    layoutRev: raw.layoutRev,
    contentRev: raw.contentRev,
    cursor: raw.cursor,
    serverNow: raw.serverNow,
    rows,
    layout,
    things,
    sites,
    buildings: buildings.sort((a, b) => a.created - b.created),
    districts: [],
    ruins: [],
    monument: raw.weeklyMonument?.stages || 0,
  };
}

/** The stage a site shows now: the server's verified minutes, run on while it says "running". */
export function siteStage(site, now = Date.now()) {
  if (site.status !== "running") return site.verifiedStage;
  const elapsed = site.verifiedElapsedMs + Math.max(0, now - site.receivedAt);
  return Math.min(1, elapsed / site.durationMs);
}
