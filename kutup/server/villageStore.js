// n46 C: storing and serving the v2 village (plan §4.2, §4.5, §8). Nothing
// here runs for a team whose groups.active_layout_id is NULL: that team keeps
// today's village (V1) exactly as it is.
//
// A layout is written with one statement per table: the rows travel as one
// JSON array and SQLite unpacks them with json_each, so a whole village is a
// handful of statements on D1 (whose per-request query budget is small) and
// all of it lands in the same batch as its guard.
import { GENERATOR_VERSION } from "../shared/koy2/planner.js";
import { TERRAIN_VERSION } from "../shared/koy2/terrain.js";
import { GEOMETRY_VERSION } from "../shared/koy2/models.js";

export const CONTRACT_VERSION = 2;
// The app version that understands a v2 village (X-Kutup-Village-Version).
export const COMPATIBILITY_VERSION = 2;

/**
 * A change to the village's content, logged in order per team (plan §8.2):
 * two statements, written only while `guard` (SQL + args) holds.
 */
export function contentChange(groupId, type, id, op, ref, now, guard = null) {
  const where = guard ? ` AND ${guard[0]}` : "";
  const extra = guard ? guard[1] : [];
  return [
    [
      `INSERT INTO village_changes (group_id, rev, entity_type, entity_id, op, ref, created)
       SELECT id, village_content_rev + 1, ?, ?, ?, ?, ? FROM groups WHERE id = ?${where}`,
      [type, String(id), op, ref ?? null, now, groupId, ...extra],
    ],
    [`UPDATE groups SET village_content_rev = village_content_rev + 1 WHERE id = ?${where}`, [groupId, ...extra]],
  ];
}

const plain = (o) => JSON.stringify(o);
/**
 * Statements that write a whole planner layout as a new layout row.
 * status: draft | active | previous; `rev` stamps every row (the cursor base).
 */
export function layoutStatements(layoutId, groupId, layout, { status = "draft", sourceContentRev = 0, now = Date.now(), rev = 1 } = {}) {
  const meta = { seq: layout.seq };
  const placements = layout.plots.filter((p) => p.subject).map((p) => ({
    plot: p.id, type: p.subject.type, id: String(p.subject.id), x: p.x, y: p.y, z: p.z || 0, facing: p.facing, scale: p.scale, gv: p.gv, model: p.model,
  }));
  return [
    [
      `INSERT INTO village_layouts (id, group_id, kind, status, seed, generator_version, terrain_version, compatibility_version, rev, source_content_rev, applied_content_rev, created, meta)
       VALUES (?, ?, 'v2', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [layoutId, groupId, status, layout.seed, layout.generator, layout.terrainVersion, COMPATIBILITY_VERSION, rev, sourceContentRev, sourceContentRev, now, plain(meta)],
    ],
    ["INSERT INTO village_regions (layout_id, region_key, bounds, terrain, rev) VALUES (?, '*', NULL, ?, ?)", [layoutId, plain(layout.terrain), rev]],
    [
      "INSERT INTO village_nodes (layout_id, id, ord, data, rev) SELECT ?, json_extract(value, '$.id'), key, value, ? FROM json_each(?)",
      [layoutId, rev, plain(layout.nodes)],
    ],
    [
      "INSERT INTO village_roads (layout_id, id, ord, type, status, data, rev) SELECT ?, json_extract(value, '$.id'), key, json_extract(value, '$.type'), json_extract(value, '$.status'), value, ? FROM json_each(?)",
      [layoutId, rev, plain(layout.roads)],
    ],
    [
      "INSERT INTO village_neighborhoods (layout_id, id, ord, status, data, rev) SELECT ?, json_extract(value, '$.id'), key, json_extract(value, '$.status'), value, ? FROM json_each(?)",
      [layoutId, rev, plain(layout.foci)],
    ],
    [
      "INSERT INTO village_plots (layout_id, id, ord, data, rev) SELECT ?, json_extract(value, '$.id'), key, json_remove(value, '$.subject'), ? FROM json_each(?)",
      [layoutId, rev, plain(layout.plots)],
    ],
    [
      `INSERT INTO village_placements (layout_id, subject_type, subject_id, plot_id, x, y, z, facing, scale, geometry_version, model, rev)
       SELECT ?, json_extract(value, '$.type'), json_extract(value, '$.id'), json_extract(value, '$.plot'), json_extract(value, '$.x'), json_extract(value, '$.y'),
         json_extract(value, '$.z'), json_extract(value, '$.facing'), json_extract(value, '$.scale'), json_extract(value, '$.gv'), json_extract(value, '$.model'), ?
       FROM json_each(?)`,
      [layoutId, rev, plain(placements)],
    ],
  ];
}

/** A stored layout back as the planner's own object (same content as written). */
export async function readLayout(db, layoutId, { since = 0 } = {}) {
  const [rows, regions, nodes, roads, foci, plots, placements] = await db.read([
    ["SELECT * FROM village_layouts WHERE id = ?", [layoutId]],
    ["SELECT region_key AS key, bounds, terrain, rev FROM village_regions WHERE layout_id = ? AND rev > ? ORDER BY region_key", [layoutId, since]],
    ["SELECT id, data, deleted FROM village_nodes WHERE layout_id = ? AND rev > ? ORDER BY ord", [layoutId, since]],
    ["SELECT id, data, deleted FROM village_roads WHERE layout_id = ? AND rev > ? ORDER BY ord", [layoutId, since]],
    ["SELECT id, data, deleted FROM village_neighborhoods WHERE layout_id = ? AND rev > ? ORDER BY ord", [layoutId, since]],
    ["SELECT id, data, deleted FROM village_plots WHERE layout_id = ? AND rev > ? ORDER BY ord", [layoutId, since]],
    ["SELECT subject_type AS type, subject_id AS id, plot_id AS plot FROM village_placements WHERE layout_id = ?", [layoutId]],
  ]);
  const row = rows[0];
  if (!row) return null;
  const live = (list) => list.filter((r) => !r.deleted).map((r) => JSON.parse(r.data));
  const gone = (list) => list.filter((r) => r.deleted).map((r) => r.id);
  const subjects = new Map(placements.map((p) => [p.plot, { type: p.type, id: p.id }]));
  const meta = JSON.parse(row.meta || "{}");
  const layout = {
    generator: row.generator_version,
    terrainVersion: row.terrain_version,
    seed: row.seed,
    terrain: regions.length ? JSON.parse(regions[0].terrain) : null,
    nodes: live(nodes),
    roads: live(roads),
    foci: live(foci),
    plots: live(plots).map((p) => (subjects.has(p.id) ? { ...p, subject: subjects.get(p.id) } : p)),
    seq: meta.seq,
  };
  return { row, layout, deletes: { nodes: gone(nodes), roads: gone(roads), neighborhoods: gone(foci), plots: gone(plots) } };
}

const cursorOf = (row, contentRev) => `${row.id}:${row.rev}:${contentRev}`;
/** Parses "layoutId:layoutRev:contentRev"; anything else means "send it whole". */
export function parseCursor(text) {
  const m = /^([\w-]{1,80}):(\d{1,12}):(\d{1,12})$/.exec(text || "");
  return m ? { layoutId: m[1], rev: Number(m[2]), contentRev: Number(m[3]) } : null;
}

/**
 * The v2 /village answer (plan §4.5). Buildings and sites carry their owner,
 * model and placement explicitly; the client never guesses a district from
 * the owner. Others' sites show no device or heartbeat detail.
 */
export async function v2Village(db, { groupId, memberId, layoutId, cursor, now = Date.now() }) {
  const group = await db.get("SELECT village_content_rev AS contentRev FROM groups WHERE id = ?", [groupId]);
  const head = await db.get("SELECT id, rev FROM village_layouts WHERE id = ?", [layoutId]);
  if (!head) return null;
  const known = parseCursor(cursor);
  const current = cursorOf(head, group.contentRev);
  if (known && cursor === current) return { contractVersion: CONTRACT_VERSION, unchanged: true, cursor: current };
  // A delta only within the same layout and only forward; else the whole village.
  const delta = known && known.layoutId === head.id && known.rev <= head.rev ? known.rev : 0;
  const stored = await readLayout(db, layoutId, { since: delta });
  const { row, layout, deletes } = stored;
  const [placements, buildings, liked, runs, projects, stages] = await db.read([
    ["SELECT subject_type AS type, subject_id AS id, plot_id AS plot, x, y, z, facing, scale, geometry_version AS gv, model FROM village_placements WHERE layout_id = ?", [layoutId]],
    ["SELECT id, member_id AS memberId, kind, model, seed, minutes, created, likes, patched, gift FROM buildings WHERE group_id = ? ORDER BY created, id", [groupId]],
    ["SELECT building_id AS id FROM building_likes WHERE member_id = ? AND building_id IN (SELECT id FROM buildings WHERE group_id = ?)", [memberId, groupId]],
    [
      `SELECT r.id, r.member_id AS memberId, r.model, r.minutes, r.started, r.ends, r.status, r.timing_revision AS timingRevision, m.focus_paused_at AS paused
       FROM focus_runs r JOIN members m ON m.id = r.member_id AND m.focus_run_id = r.id WHERE r.group_id = ? AND r.status = 'running' AND r.mode IN ('strict','relaxed')`,
      [groupId],
    ],
    ["SELECT id, started, completed FROM imece_projects WHERE group_id = ?", [groupId]],
    ["SELECT count(*) AS n FROM weekly WHERE group_id = ? AND kind = 'monument'", [groupId]],
  ]);
  const at = new Map(placements.map((p) => [`${p.type}:${p.id}`, { plotId: p.plot, x: p.x, y: p.y, z: p.z, facing: p.facing, scale: p.scale, geometryVersion: p.gv, model: p.model }]));
  const mine = new Set(liked.map((l) => l.id));
  return {
    contractVersion: CONTRACT_VERSION,
    groupId,
    layoutId: row.id,
    layoutRev: row.rev,
    contentRev: group.contentRev,
    cursor: current,
    serverNow: now,
    generatorVersion: row.generator_version,
    terrainVersion: row.terrain_version,
    geometryManifest: { version: GEOMETRY_VERSION, generator: GENERATOR_VERSION, terrain: TERRAIN_VERSION },
    full: !delta,
    regions: layout.terrain ? [{ key: "*", terrain: layout.terrain }] : [],
    nodes: layout.nodes,
    roads: layout.roads,
    neighborhoods: layout.foci,
    plots: layout.plots.map(({ subject, ...p }) => p),
    deletes,
    // Every building of the team, placed or (in a draft that is behind) not yet.
    buildings: buildings.map((b) => ({ ...b, liked: mine.has(b.id), patched: !!b.patched, placement: at.get(`building:${b.id}`) || null })),
    sites: runs.map((r) => ({
      focusRunId: r.id,
      memberId: r.memberId,
      modelId: r.model,
      status: r.paused ? "paused" : "running",
      timingRevision: r.timingRevision,
      durationMs: r.minutes * 60000,
      verifiedElapsedMs: Math.max(0, Math.min(r.minutes * 60000, now - r.started)),
      serverAsOf: now,
      placement: at.get(`site:${r.id}`) || null,
    })),
    projects: projects.map((p) => ({ id: p.id, started: p.started, completed: p.completed, placement: at.get(`imece:${p.id}`) || null })),
    weeklyMonument: { stages: stages[0]?.n || 0, placement: at.get(`weekly_monument:${groupId}`) || null },
  };
}

/**
 * A subject leaves every layout (a building taken back, a member removed):
 * its placement goes and its plot is marked deleted at a new layout revision,
 * so a client holding a cursor hears about it. `subjects` is SQL selecting ids.
 */
export function releaseStatements(type, subjects, args) {
  const mine = `subject_type = ? AND subject_id IN (${subjects})`;
  return [
    [`UPDATE village_layouts SET rev = rev + 1 WHERE id IN (SELECT layout_id FROM village_placements WHERE ${mine})`, [type, ...args]],
    [
      `UPDATE village_plots SET deleted = 1, rev = (SELECT rev FROM village_layouts l WHERE l.id = village_plots.layout_id)
       WHERE EXISTS (SELECT 1 FROM village_placements p WHERE p.layout_id = village_plots.layout_id AND p.plot_id = village_plots.id AND p.subject_type = ? AND p.subject_id IN (${subjects}))`,
      [type, ...args],
    ],
    [`DELETE FROM village_placements WHERE ${mine}`, [type, ...args]],
  ];
}
