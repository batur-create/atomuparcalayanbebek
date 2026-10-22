// n46 G: moving a team from one village layout to another (plan §8), for the
// owner only. A draft is planned in the owner's own browser (the whole village
// at once costs far more than one request may spend on Cloudflare's free plan)
// and sent here; the server only checks it: the team's own seed and terrain,
// every rule of the layout, one place for every living building, site and
// shared project, and nothing that has already stood moved. Switching and
// going back are one guarded batch each: the pointer, the statuses and the
// 14-day window. Nothing here touches bricks, rewards, minutes or deliveries.
import { modelOf } from "../shared/catalog.js";
import { GENERATOR_VERSION, emptyLayout, validateLayout } from "../shared/koy2/planner.js";
import { layoutAt, layoutStatements } from "./villageStore.js";

export const ROLLBACK_DAYS = 14;
// Plots checked per request: a free-plan request has about 10 ms of CPU (n46 G).
export const CHECK_PART = 40;
// A team's ground, made once per isolate (it costs a few milliseconds and never changes for a seed).
const GROUNDS = new Map();
const groundOf = (seed, generator) => {
  const key = `${generator}:${seed}`;
  if (!GROUNDS.has(key)) {
    const g = emptyLayout(seed, generator);
    GROUNDS.set(key, { terrain: JSON.stringify(g.terrain), version: g.terrainVersion });
    if (GROUNDS.size > 32) GROUNDS.delete(GROUNDS.keys().next().value);
  }
  return GROUNDS.get(key);
};
const DAY = 86400000;
const keyOf = (s) => `${s.type}:${s.id}`;

/** Everything that must stand in a layout: buildings, building sites and shared projects. */
export async function inventory(db, groupId) {
  const [buildings, runs, projects, group] = await db.read([
    ["SELECT id, member_id, kind, model, seed, created FROM buildings WHERE group_id = ? ORDER BY created, id", [groupId]],
    [
      "SELECT r.id, r.member_id, r.model, r.started, r.ends, m.focus_seed AS seed FROM focus_runs r LEFT JOIN members m ON m.id = r.member_id WHERE r.group_id = ? AND r.status = 'running' AND r.mode IN ('strict','relaxed')",
      [groupId],
    ],
    ["SELECT id, started, completed FROM imece_projects WHERE group_id = ?", [groupId]],
    ["SELECT id, name, village_content_rev AS rev, active_layout_id AS active FROM groups WHERE id = ?", [groupId]],
  ]);
  if (!group[0]) return null;
  const items = [
    ...projects.map((p) => ({ subject: { type: "imece", id: String(p.id) }, model: "anitkabir", owner: null, created: p.started })),
    // The oldest buildings were saved before models existed: they are drawn by kind, as in the old village.
    ...buildings.map((b) => ({ subject: { type: "building", id: String(b.id) }, model: modelOf(b.model, b.kind).id, owner: b.member_id, created: b.created, kind: b.kind, seed: b.seed })),
    ...runs.map((r) => ({ subject: { type: "site", id: String(r.id) }, model: r.model, owner: r.member_id, created: r.started, ends: r.ends, seed: r.seed })),
  ];
  return { group: group[0], items, counts: { buildings: buildings.length, sites: runs.length, projects: projects.length } };
}

/** Which living subjects a layout lacks, holds twice, or holds though they are gone (`held`: its placed subjects). */
export function coverage(items, held) {
  const want = new Set(items.map((i) => keyOf(i.subject)));
  const seen = new Map();
  for (const s of held) seen.set(keyOf(s), (seen.get(keyOf(s)) || 0) + 1);
  return {
    missing: [...want].filter((k) => !seen.has(k)),
    extra: [...seen.keys()].filter((k) => !want.has(k)),
    twice: [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k),
  };
}

/** A team's layouts as the owner panel shows them. */
export async function switchState(db, groupId, now = Date.now()) {
  const inv = await inventory(db, groupId);
  if (!inv) return null;
  // A few statements whatever the village's size (D1 counts every one).
  const open = "SELECT id FROM village_layouts WHERE group_id = ? AND kind = 'v2' AND status IN ('draft','active','previous')";
  const [rows, held, plots, unplaced] = await db.read([
    [
      "SELECT id, kind, status, rev, generator_version AS generator, applied_content_rev AS applied, created, rollback_until AS until, json_extract(meta, '$.checked') AS checked, json_extract(meta, '$.sound') AS sound FROM village_layouts WHERE group_id = ? AND status IN ('draft','active','previous') ORDER BY created",
      [groupId],
    ],
    [`SELECT layout_id AS layout, subject_type AS type, subject_id AS id FROM village_placements WHERE layout_id IN (${open})`, [groupId]],
    [`SELECT layout_id AS layout, count(*) AS n FROM village_plots WHERE layout_id IN (${open}) GROUP BY layout_id`, [groupId]],
    ["SELECT count(*) AS n FROM buildings WHERE group_id = ? AND pos_x IS NULL", [groupId]],
  ]);
  const pick = (status) => rows.filter((r) => r.status === status).at(-1) || null;
  const active = inv.group.active ? rows.find((r) => r.id === inv.group.active) || null : null;
  const draft = pick("draft"),
    previous = pick("previous");
  const coverageOf = (row) => {
    if (!row || row.kind !== "v2") return null;
    const c = coverage(inv.items, held.filter((h) => h.layout === row.id));
    return { missing: c.missing.length, extra: c.extra.length, twice: c.twice.length, plots: plots.find((p) => p.layout === row.id)?.n || 0 };
  };
  const brief = (row) =>
    row && {
      id: row.id,
      kind: row.kind,
      generatorVersion: row.generator,
      appliedContentRev: row.applied,
      behind: Math.max(0, inv.group.rev - row.applied),
      created: row.created,
      // Checked in parts after it was stored; only a sound layout can go live.
      sound: row.kind === "legacy" || row.sound === 1,
      checked: row.checked || 0,
      coverage: coverageOf(row),
    };
  const back = previous && {
    ...brief(previous),
    until: previous.until,
    daysLeft: Math.max(0, Math.ceil((previous.until - now) / DAY)),
    open: previous.until > now,
  };
  // Going back to the old village needs every building to have its old place too (kept by every write).
  if (back && previous.kind === "legacy") back.coverage = { missing: unplaced[0].n, extra: 0, twice: 0 };
  return {
    group: { id: inv.group.id, name: inv.group.name },
    contentRev: inv.group.rev,
    counts: inv.counts,
    active: active ? brief(active) : { id: null, kind: "legacy" },
    draft: brief(draft),
    previous: back,
  };
}

/**
 * The first look at a layout the owner's browser planned, cheap enough for one
 * request: the team's seed and ground, every living subject once, nothing that
 * stood moved. Every rule of the layout is then checked in parts (checkPart).
 * Returns the problem in words, or null.
 */
export async function checkLayout(db, groupId, layout, options) {
  try {
    const problem = check(groupId, layout, options);
    if (problem) return problem;
    if (layout.generator >= 3) {
      const members = new Set((await db.all("SELECT id FROM members WHERE group_id = ?", [groupId])).map((m) => m.id));
      const previous = new Set((options.base?.foci || []).filter((f) => f.personal).map((f) => f.personal));
      const homes = layout.foci.filter((f) => f.personal);
      if (new Set(homes.map((f) => f.personal)).size !== homes.length || homes.some((f) => !members.has(f.personal) && !previous.has(f.personal))) return "Kişisel köy merkezlerinin sahipliği bu ekiple eşleşmiyor.";
    }
    return null;
  } catch {
    return "Düzen okunamadı.";
  }
}
function check(groupId, layout, { base = null, items }) {
  if (!layout || typeof layout !== "object" || !Array.isArray(layout.plots)) return "Düzen okunamadı.";
  if (layout.seed !== `group:${groupId}`) return "Bu düzen bu ekibin tohumuyla planlanmamış.";
  if (layout.generator !== GENERATOR_VERSION && !(base?.generator === 2 && layout.generator === 2)) return "Düzen eski bir planlayıcıyla hazırlanmış; sayfayı yenileyip yeniden hazırla.";
  if (base && layout.generator !== base.generator) return "Eşitleme düzen sürümünü değiştiremez; yeni taslak hazırla.";
  const ground = groundOf(layout.seed, layout.generator);
  if (ground.terrain !== JSON.stringify(layout.terrain) || layout.terrainVersion !== ground.version) return "Arazi bu ekibin arazisi değil.";
  const c = coverage(items, layout.plots.filter((p) => p.subject).map((p) => p.subject));
  if (c.twice.length) return `Aynı yapı iki kez yerleşmiş (${c.twice.length}).`;
  if (c.extra.length) return `Artık köyde olmayan ${c.extra.length} yapı düzende duruyor.`;
  if (c.missing.length) return `${c.missing.length} yapının yeri yok; taslak eksik.`;
  // Nothing that already stood in the layout this one continues may move.
  if (base) {
    for (const f of base.foci.filter((x) => x.personal)) {
      const now = layout.foci.find((x) => x.id === f.id);
      if (!now || JSON.stringify(now) !== JSON.stringify(f)) return "Kişisel köy merkezi eşitleme sırasında değişmiş.";
    }
    const before = new Map(base.plots.filter((p) => p.subject).map((p) => [keyOf(p.subject), p]));
    for (const p of layout.plots) {
      if (!p.subject) continue;
      const was = before.get(keyOf(p.subject));
      if (was && (was.id !== p.id || was.x !== p.x || was.y !== p.y || was.facing !== p.facing || was.gv !== p.gv)) return "Taslakta önceden yerleşmiş bir yapı yer değiştirmiş.";
    }
  }
  return null;
}

/** The next part of a stored layout's rule check: { checked, total, sound } or { problem }. */
export async function checkPart(db, groupId, layoutId, from) {
  const head = await db.get("SELECT rev, group_id, kind, meta FROM village_layouts WHERE id = ?", [layoutId]);
  if (!head || head.group_id !== groupId || head.kind !== "v2") return null;
  // Kept parsed between the parts (and its indexes with it).
  const stored = await layoutAt(db, layoutId, head.rev);
  if (!stored) return null;
  // The progress is read fresh (it is not part of the layout's revision).
  const meta = JSON.parse(head.meta || "{}");
  const total = stored.layout.plots.length;
  if (meta.sound) return { checked: total, total, sound: true };
  if ((meta.checked || 0) !== from) return { checked: meta.checked || 0, total, sound: false, moved: true };
  const partSize = stored.layout.generator >= 3 ? 8 : CHECK_PART;
  const problems = validateLayout(stored.layout, { from, count: partSize });
  if (problems.length) return { problem: `Düzende ${problems.length} kural sorunu var (${problems[0][0]}: ${problems[0][1]}).` };
  const checked = Math.min(total, from + partSize);
  return { checked, total, sound: checked >= total, statements: [["UPDATE village_layouts SET meta = json_set(COALESCE(meta, '{}'), '$.checked', ?, '$.sound', ?) WHERE id = ? AND json_extract(meta, '$.sound') IS NOT 1", [checked, checked >= total ? 1 : 0, layoutId]]] };
}

const guard = (sql, args) => [`INSERT OR REPLACE INTO write_guard (id, valid) VALUES (1, CASE WHEN ${sql} THEN 1 ELSE 0 END)`, args];
const contentAt = (groupId, rev) => guard("EXISTS (SELECT 1 FROM groups WHERE id = ? AND village_content_rev = ?)", [groupId, rev]);
const activeIs = (groupId, id) => guard("EXISTS (SELECT 1 FROM groups WHERE id = ? AND active_layout_id IS ?)", [groupId, id]);
// Layouts nobody can return to are deleted outright (their rows cascade with them).
const VILLAGE_TABLES = ["village_placements", "village_plots", "village_neighborhoods", "village_roads", "village_nodes", "village_regions"];
const dropRetired = (groupId) => [
  ...VILLAGE_TABLES.map((t) => [`DELETE FROM ${t} WHERE layout_id IN (SELECT id FROM village_layouts WHERE group_id = ? AND kind = 'v2' AND status = 'retired')`, [groupId]]),
  ["DELETE FROM village_layouts WHERE group_id = ? AND kind = 'v2' AND status = 'retired'", [groupId]],
];

/** Stores a checked layout as the team's draft (or its brought-up-to-date previous), retiring the one it replaces. */
export function storeStatements(id, groupId, layout, { role, contentRev, replaces, until = 0, now }) {
  return [
    contentAt(groupId, contentRev),
    ...(replaces ? [guard("EXISTS (SELECT 1 FROM village_layouts WHERE id = ? AND group_id = ? AND status = ?)", [replaces, groupId, role])] : []),
    // One draft at a time; the previous keeps its window.
    ["UPDATE village_layouts SET status = 'retired' WHERE group_id = ? AND kind = 'v2' AND status = ?", [groupId, role]],
    ...dropRetired(groupId),
    ...layoutStatements(id, groupId, layout, { status: role, sourceContentRev: contentRev, now }),
    ...(role === "previous" ? [["UPDATE village_layouts SET rollback_until = ? WHERE id = ?", [until, id]]] : []),
  ];
}

/** The switch to a draft: guarded on the active layout, the content and the draft being up to date. */
export function activateStatements(groupId, { draftId, active, contentRev, now }) {
  const until = now + ROLLBACK_DAYS * DAY;
  return [
    activeIs(groupId, active),
    contentAt(groupId, contentRev),
    guard("EXISTS (SELECT 1 FROM village_layouts WHERE id = ? AND group_id = ? AND status = 'draft' AND applied_content_rev = ? AND json_extract(meta, '$.sound') = 1)", [draftId, groupId, contentRev]),
    // Only the layout being left can be gone back to.
    ["UPDATE village_layouts SET status = 'retired' WHERE group_id = ? AND kind = 'v2' AND status = 'previous'", [groupId]],
    ["UPDATE village_layouts SET status = 'baseline', rollback_until = 0 WHERE group_id = ? AND kind = 'legacy'", [groupId]],
    ...(active
      ? [["UPDATE village_layouts SET status = 'previous', rollback_until = ? WHERE id = ?", [until, active]]]
      : [
          // From the old village: its frozen baseline row is what "going back" points at.
          [
            `INSERT OR IGNORE INTO village_layouts (id, group_id, kind, status, seed, generator_version, terrain_version, compatibility_version, created)
             VALUES ('legacy-' || ?, ?, 'legacy', 'baseline', ?, 0, 0, 1, ?)`,
            [groupId, groupId, groupId, now],
          ],
          ["UPDATE village_layouts SET status = 'previous', rollback_until = ? WHERE id = 'legacy-' || ?", [until, groupId]],
        ]),
    ["UPDATE village_layouts SET status = 'active' WHERE id = ?", [draftId]],
    ["UPDATE groups SET active_layout_id = ? WHERE id = ?", [draftId, groupId]],
    ...dropRetired(groupId),
  ];
}

/** Back to the previous layout within its window; the one left becomes the draft again. */
export function rollbackStatements(groupId, { previous, active, contentRev, now }) {
  return [
    activeIs(groupId, active),
    contentAt(groupId, contentRev),
    guard("EXISTS (SELECT 1 FROM village_layouts WHERE id = ? AND group_id = ? AND status = 'previous' AND rollback_until > ? AND (kind = 'legacy' OR (applied_content_rev = ? AND json_extract(meta, '$.sound') = 1)))", [
      previous.id,
      groupId,
      now,
      contentRev,
    ]),
    ["UPDATE village_layouts SET status = 'retired' WHERE group_id = ? AND kind = 'v2' AND status = 'draft'", [groupId]],
    ["UPDATE village_layouts SET status = 'draft', rollback_until = 0 WHERE id = ?", [active]],
    ...(previous.kind === "legacy"
      ? [
          ["UPDATE village_layouts SET status = 'baseline', rollback_until = 0 WHERE id = ?", [previous.id]],
          ["UPDATE groups SET active_layout_id = NULL WHERE id = ?", [groupId]],
        ]
      : [
          ["UPDATE village_layouts SET status = 'active', rollback_until = 0 WHERE id = ?", [previous.id]],
          ["UPDATE groups SET active_layout_id = ? WHERE id = ?", [previous.id, groupId]],
        ]),
    ...dropRetired(groupId),
  ];
}
