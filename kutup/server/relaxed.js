// Best-effort milestones; no persistent OS countdown or foreground heartbeat.
export const relaxedTag = (memberId, ends) => `relaxed-${memberId}-${ends}`;

export function createRelaxedNotices({ db, notifyMember, now = Date.now }) {
  return async function announce(ctx, memberId = null) {
    const at = now();
    const stage = `CASE WHEN focus_end <= ${at} THEN 100
      WHEN ${at} >= focus_end - focus_minutes * 60000 * .25 THEN 75
      WHEN ${at} >= focus_end - focus_minutes * 60000 * .5 THEN 50
      WHEN ${at} >= focus_end - focus_minutes * 60000 * .75 THEN 25 ELSE 0 END`;
    const [running, completed] = await db.read([
      [`SELECT * FROM (SELECT id AS memberId, focus_end AS ends, focus_model AS model, ${stage} AS stage
         FROM members WHERE focus_relaxed = 1 AND focus_end > ${at - 86400000}${memberId ? ' AND id = ?' : ''}) r
        WHERE NOT EXISTS (SELECT 1 FROM build_push_events e WHERE e.member_id = r.memberId AND e.ends = r.ends AND e.stage = r.stage)
        ORDER BY stage DESC, ends LIMIT 4`, memberId ? [memberId] : []],
      [`SELECT member_id AS memberId, ends, model, 100 AS stage FROM build_deliveries d
        WHERE accepted_at = 0 AND ends > ${at - 86400000}${memberId ? ' AND member_id = ?' : ''}
        AND NOT EXISTS (SELECT 1 FROM build_push_events e WHERE e.member_id = d.member_id AND e.ends = d.ends AND e.stage = 100)
        ORDER BY ends LIMIT 4`, memberId ? [memberId] : []],
    ]);
    const seen = new Set();
    for (const event of [...completed, ...running].slice(0, 4)) {
      const id = `${relaxedTag(event.memberId, event.ends)}-${event.stage}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const end = new Date(event.ends + 3 * 3600000).toISOString().slice(11, 16);
      const done = event.stage === 100;
      const ttl = done ? 24 * 3600 : Math.min(900, Math.floor((event.ends - at) / 1000));
      if (ttl <= 0) continue;
      await notifyMember(ctx, event.memberId, {
        title: done ? '🏗️ Binan hazır · Teslim al' : '🏗️ Rahat inşaat sürüyor',
        body: done ? 'Şantiyenin hızlandırılmış yapımını izle, binanı köyde gör.' : `Son bildirilen ilerleme: %${event.stage} · Bitiş: ${end}.`,
        tag: relaxedTag(event.memberId, event.ends),
        url: '/?tab=focus', sticky: true, quiet: !done,
        buildEnd: event.ends, buildProgress: event.stage,
      }, { ttl, defer: !memberId, urgency: done ? 'high' : 'normal', dedupe: { ...event, id } }, 'phone'); // the computer stays quiet
    }
    await db.run('DELETE FROM build_push_events WHERE ends < ?', [at - 7 * 86400000]);
  };
}
