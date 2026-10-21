// n46 D: the one spatial service every v2 village write goes through (plan
// §7.1, §7.4): plan on a fresh read of the active layout, then write only what
// changed, guarded by the layout's revision, in the caller's batch. Two writers
// racing for the same ground: one batch wins, the other fails its guard and
// plans again from the new layout (or gives up with a clear answer).
import { applyPlan, movePlans, planPlacement, releaseSubject } from "../shared/koy2/planner.js";
import { readLayout } from "./villageStore.js";

/** The team's active v2 layout, read whole, or null for a V1 team. */
export async function activeLayout(db, groupId) {
  const head = await db.get(
    "SELECT l.id, l.rev FROM groups g JOIN village_layouts l ON l.id = g.active_layout_id WHERE g.id = ? AND l.kind = 'v2'",
    [groupId],
  );
  if (!head) return null;
  const stored = await readLayout(db, head.id);
  return { id: head.id, rev: stored.row.rev, layout: stored.layout };
}

const layoutGuard = (id, rev) => [
  "INSERT OR REPLACE INTO write_guard (id, valid) VALUES (1, CASE WHEN EXISTS (SELECT 1 FROM village_layouts WHERE id = ? AND rev = ?) THEN 1 ELSE 0 END)",
  [id, rev],
];
const keyOf = (s) => `${s.type}:${s.id}`;
const withoutSubject = ({ subject, ...p }) => p;

// Rows of one collection that are new, changed or gone between two layouts.
function diff(before, after, shape = (x) => x) {
  const old = new Map(before.map((x) => [x.id, JSON.stringify(shape(x))]));
  const now = new Map(after.map((x) => [x.id, x]));
  const added = [],
    changed = [];
  for (const x of after) {
    const was = old.get(x.id);
    if (was === undefined) added.push(shape(x));
    else if (was !== JSON.stringify(shape(x))) changed.push(shape(x));
  }
  const gone = before.filter((x) => !now.has(x.id)).map((x) => x.id);
  return { added, changed, gone };
}

/**
 * Statements turning stored layout `base` (at `rev`) into `next`: the guard,
 * then inserts, updates and tombstones per table, the placements, and the
 * layout's new revision. Only non-empty steps are written (D1 query budget).
 */
export function changeStatements(layoutId, rev, base, next) {
  const at = rev + 1;
  const ord = at * 10000; // new rows sort after every older one
  const out = [layoutGuard(layoutId, rev)];
  const tables = [
    ["village_nodes", base.nodes, next.nodes, "", "", (x) => x],
    ["village_roads", base.roads, next.roads, ", type, status", ", json_extract(value, '$.type'), json_extract(value, '$.status')", (x) => x],
    ["village_neighborhoods", base.foci, next.foci, ", status", ", json_extract(value, '$.status')", (x) => x],
    ["village_plots", base.plots, next.plots, "", "", withoutSubject],
  ];
  for (const [table, a, b, cols, vals, shape] of tables) {
    const d = diff(a, b, shape);
    if (d.added.length)
      out.push([
        `INSERT INTO ${table} (layout_id, id, ord, data, rev${cols}) SELECT ?, json_extract(value, '$.id'), ? + key, value, ?${vals} FROM json_each(?)`,
        [layoutId, ord, at, JSON.stringify(d.added)],
      ]);
    if (d.changed.length) {
      const pick = `(SELECT c.value FROM json_each(?) c WHERE json_extract(c.value, '$.id') = ${table}.id)`;
      const status = cols.includes("status") ? `, status = json_extract(${pick}, '$.status')` : "";
      const json = JSON.stringify(d.changed);
      out.push([
        `UPDATE ${table} SET data = ${pick}${status}, rev = ?, deleted = 0 WHERE layout_id = ? AND id IN (SELECT json_extract(value, '$.id') FROM json_each(?))`,
        [json, ...(status ? [json] : []), at, layoutId, json],
      ]);
    }
    if (d.gone.length)
      out.push([`UPDATE ${table} SET deleted = 1, rev = ? WHERE layout_id = ? AND id IN (SELECT value FROM json_each(?))`, [at, layoutId, JSON.stringify(d.gone)]]);
  }
  // Placements: one per subject, keyed by subject.
  const placed = (layout) => new Map(layout.plots.filter((p) => p.subject).map((p) => [keyOf(p.subject), p]));
  const was = placed(base),
    is = placed(next);
  const gone = [...was.keys()].filter((k) => !is.has(k) || is.get(k).id !== was.get(k).id);
  const put = [...is.entries()].filter(([k, p]) => !was.has(k) || was.get(k).id !== p.id).map(([, p]) => p);
  for (const k of gone) {
    const s = was.get(k).subject;
    out.push(["DELETE FROM village_placements WHERE layout_id = ? AND subject_type = ? AND subject_id = ?", [layoutId, s.type, String(s.id)]]);
  }
  if (put.length)
    out.push([
      `INSERT INTO village_placements (layout_id, subject_type, subject_id, plot_id, x, y, z, facing, scale, geometry_version, model, rev)
       SELECT ?, json_extract(value, '$.subject.type'), json_extract(value, '$.subject.id'), json_extract(value, '$.id'), json_extract(value, '$.x'), json_extract(value, '$.y'),
         COALESCE(json_extract(value, '$.z'), 0), json_extract(value, '$.facing'), json_extract(value, '$.scale'), json_extract(value, '$.gv'), json_extract(value, '$.model'), ?
       FROM json_each(?)`,
      [layoutId, at, JSON.stringify(put.map((p) => ({ ...p, subject: { type: p.subject.type, id: String(p.subject.id) } })))],
    ]);
  out.push(["UPDATE village_layouts SET rev = ?, meta = json_set(COALESCE(meta, '{}'), '$.seq', json(?)) WHERE id = ? AND rev = ?", [at, JSON.stringify(next.seq), layoutId, rev]]);
  return out;
}

/**
 * A plot for `subject` in the active layout: { statements, plot } or
 * { error } when there is no room that fits the model (nothing is written).
 */
export function placeStatements(active, { subject, model, owner, created }) {
  const plan = planPlacement(active.layout, { subject, model, owner, created });
  if (!plan.ok) return { error: plan.error };
  const next = applyPlan(active.layout, plan);
  return { statements: changeStatements(active.id, active.rev, active.layout, next), plot: plan.plot };
}

/** Where a building could move: up to six plans, its own plot ignored. */
export const moveOptions = (active, buildingId) => movePlans(active.layout, { type: "building", id: buildingId });

/** The move to the plan at (x, y): its old plot is let go, the new one taken. */
export function moveStatements(active, buildingId, x, y) {
  const plans = moveOptions(active, buildingId);
  const plan = plans.find((p) => Math.abs(p.plot.x - x) < 0.01 && Math.abs(p.plot.y - y) < 0.01);
  if (!plan) return { error: "taken" };
  const subject = { type: "building", id: buildingId };
  const next = applyPlan(releaseSubject(active.layout, subject), { ...plan, plot: { ...plan.plot, subject } });
  return { statements: changeStatements(active.id, active.rev, active.layout, next), plot: plan.plot };
}

/** A site becomes its building on the very same plot, in every layout that holds it. */
export const convertStatements = (runId, buildingId, guard) => [
  [`UPDATE village_layouts SET rev = rev + 1 WHERE id IN (SELECT layout_id FROM village_placements WHERE subject_type = 'site' AND subject_id = ?) AND ${guard[0]}`, [runId, ...guard[1]]],
  [
    `UPDATE village_placements SET subject_type = 'building', subject_id = ?, rev = (SELECT rev FROM village_layouts l WHERE l.id = village_placements.layout_id)
     WHERE subject_type = 'site' AND subject_id = ? AND ${guard[0]}`,
    [buildingId, runId, ...guard[1]],
  ],
];
