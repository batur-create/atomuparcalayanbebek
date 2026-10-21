// n46 C: today's village frozen as a "legacy" baseline layout, one per team,
// when migration 34 runs (and when an older backup is restored). Buildings
// keep their own pos_x/pos_y/facing/district, which stay the truth for V1;
// the snapshot only records where everything stood, for the comparison and
// the rollback report (plan §8.1). Sessions under way get a stable run id once.
export const VILLAGE_LEGACY_SNAPSHOT = [
  `INSERT OR IGNORE INTO village_layouts (id, group_id, kind, status, seed, generator_version, terrain_version, compatibility_version, created, snapshot)
   SELECT 'legacy-' || g.id, g.id, 'legacy', 'baseline', g.id, 0, 0, 1, CAST(strftime('%s', 'now') AS INTEGER) * 1000,
     (SELECT json_group_array(json_array(b.id, b.member_id, b.model, b.pos_x, b.pos_y, b.facing, b.district_id))
      FROM (SELECT id, member_id, model, pos_x, pos_y, facing, district_id FROM buildings WHERE group_id = g.id AND pos_x IS NOT NULL ORDER BY created, id) b)
   FROM groups g`,
  `INSERT OR IGNORE INTO focus_runs (id, member_id, group_id, mode, model, seed, minutes, started, ends)
   SELECT 'run-legacy-' || id || '-' || focus_end, id, group_id,
     CASE WHEN focus_imece = 1 THEN 'imece' WHEN focus_strict = 1 AND focus_relaxed = 1 THEN 'relaxed' WHEN focus_strict = 1 THEN 'strict' ELSE 'free' END,
     focus_model, COALESCE(focus_seed, 0), focus_minutes, focus_end - focus_minutes * 60000, focus_end
   FROM members WHERE focus_end > 0 AND focus_run_id IS NULL`,
  "UPDATE members SET focus_run_id = 'run-legacy-' || id || '-' || focus_end WHERE focus_end > 0 AND focus_run_id IS NULL",
];
