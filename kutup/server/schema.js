// Versioned schema shared by node:sqlite and Cloudflare D1.
// Every migration is a list of single statements (D1 cannot run multi-statement strings
// through prepared statements), applied together with the version bump in one batch.
import {WEEKLY_BACKFILL} from "../shared/blueprints.js";
import {PLAN_LEGACY_IMPORT} from "../shared/plans.js";
import {IMECE_TEAM_IMPORT} from "../shared/imeceMigration.js";
export const migrations = [
  // 1 — the original Kütüp schema (idempotent, so pre-versioning databases pass through).
  [
    "CREATE TABLE IF NOT EXISTS groups (id TEXT PRIMARY KEY, name TEXT NOT NULL, invite TEXT UNIQUE NOT NULL)",
    `CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id), token TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL, avatar TEXT NOT NULL, color TEXT NOT NULL, note TEXT DEFAULT '',
      status TEXT DEFAULT 'away', location TEXT DEFAULT '', desk TEXT DEFAULT '', arrival TEXT,
      status_until INTEGER DEFAULT 0, focus_end INTEGER DEFAULT 0, focus_minutes INTEGER DEFAULT 0,
      joined INTEGER NOT NULL, updated INTEGER NOT NULL)`,
    "CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id), member_id TEXT NOT NULL REFERENCES members(id), text TEXT NOT NULL, kind TEXT DEFAULT 'message', created INTEGER NOT NULL)",
    "CREATE TABLE IF NOT EXISTS reactions (message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE, member_id TEXT NOT NULL REFERENCES members(id), PRIMARY KEY(message_id, member_id))",
    "CREATE TABLE IF NOT EXISTS plans (id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id), member_id TEXT NOT NULL REFERENCES members(id), starts INTEGER NOT NULL, note TEXT DEFAULT '')",
    "CREATE TABLE IF NOT EXISTS attendees (plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE, member_id TEXT NOT NULL REFERENCES members(id), PRIMARY KEY(plan_id, member_id))",
    "CREATE TABLE IF NOT EXISTS focus_log (id TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id), minutes INTEGER NOT NULL, created INTEGER NOT NULL)",
    "CREATE TABLE IF NOT EXISTS subscriptions (endpoint TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id), subscription TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS feedback (id TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id), kind TEXT NOT NULL, text TEXT NOT NULL, status TEXT DEFAULT 'new', created INTEGER NOT NULL)",
    "CREATE INDEX IF NOT EXISTS members_group ON members(group_id)",
    "CREATE INDEX IF NOT EXISTS messages_group ON messages(group_id, created)",
    "CREATE INDEX IF NOT EXISTS plans_group ON plans(group_id, starts)",
  ],
  // 2 — live revisions, multi-device sessions, arrival times, push cooldowns.
  [
    "ALTER TABLE groups ADD COLUMN rev INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE groups ADD COLUMN created INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE members ADD COLUMN since INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE members ADD COLUMN pushed_kind TEXT",
    "ALTER TABLE members ADD COLUMN pushed_at INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE members ADD COLUMN transfer_hash TEXT",
    "ALTER TABLE members ADD COLUMN transfer_until INTEGER NOT NULL DEFAULT 0",
    "CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE, created INTEGER NOT NULL, seen INTEGER NOT NULL DEFAULT 0)",
    "INSERT OR IGNORE INTO sessions (token, member_id, created, seen) SELECT token, id, joined, updated FROM members",
    "CREATE INDEX IF NOT EXISTS sessions_member ON sessions(member_id)",
    "CREATE INDEX IF NOT EXISTS focus_member ON focus_log(member_id, created)",
    "CREATE INDEX IF NOT EXISTS subscriptions_member ON subscriptions(member_id)",
    "CREATE INDEX IF NOT EXISTS feedback_member ON feedback(member_id, created)",
    "CREATE INDEX IF NOT EXISTS members_transfer ON members(transfer_hash)",
  ],
  // 3 — request tracking for "Batur’a ilet" (stages, Batur’s note, history) and
  // remembered owner sign-ins.
  [
    "ALTER TABLE feedback ADD COLUMN reply TEXT",
    "ALTER TABLE feedback ADD COLUMN updated INTEGER NOT NULL DEFAULT 0",
    "UPDATE feedback SET status = 'accepted' WHERE status = 'planned'",
    "UPDATE feedback SET updated = created WHERE updated = 0",
    "CREATE TABLE IF NOT EXISTS feedback_events (id TEXT PRIMARY KEY, feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE, status TEXT NOT NULL, created INTEGER NOT NULL)",
    "INSERT INTO feedback_events (id, feedback_id, status, created) SELECT lower(hex(randomblob(16))), id, 'new', created FROM feedback",
    "INSERT INTO feedback_events (id, feedback_id, status, created) SELECT lower(hex(randomblob(16))), id, status, created + 1 FROM feedback WHERE status <> 'new'",
    "CREATE INDEX IF NOT EXISTS feedback_events_item ON feedback_events(feedback_id, created)",
    "CREATE INDEX IF NOT EXISTS feedback_created ON feedback(created)",
    "CREATE TABLE IF NOT EXISTS owner_sessions (token TEXT PRIMARY KEY, key_hash TEXT NOT NULL, created INTEGER NOT NULL)",
    "CREATE TABLE IF NOT EXISTS owner_subscriptions (endpoint TEXT PRIMARY KEY, subscription TEXT NOT NULL)",
  ],
  // 4 — "Fidan modu": strict focus sessions that wither if you leave the app.
  [
    "ALTER TABLE members ADD COLUMN focus_strict INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE members ADD COLUMN focus_beat INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE focus_log ADD COLUMN strict INTEGER NOT NULL DEFAULT 0",
  ],
  // 5 — the village: every completed build-mode session leaves a building.
  [
    "ALTER TABLE members ADD COLUMN focus_seed INTEGER NOT NULL DEFAULT 0",
    "CREATE TABLE IF NOT EXISTS buildings (id TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id), group_id TEXT NOT NULL, kind TEXT NOT NULL, minutes INTEGER NOT NULL, seed INTEGER NOT NULL, created INTEGER NOT NULL)",
    "CREATE INDEX IF NOT EXISTS buildings_group ON buildings(group_id, created)",
    `INSERT INTO buildings (id, member_id, group_id, kind, minutes, seed, created)
     SELECT f.id, f.member_id, m.group_id,
       CASE WHEN f.minutes >= 70 THEN 'tower' WHEN f.minutes >= 40 THEN 'house' ELSE 'cottage' END,
       f.minutes, abs(random()) % 1000000, f.created
     FROM focus_log f JOIN members m ON m.id = f.member_id WHERE f.strict = 1`,
  ],
  // 6 — one shared village: districts on a lattice, a stored spot for every
  // building (filled in by layoutVillages() at start-up), likes, 24-hour ruins.
  // Counters (districts.buildings, buildings.likes) and buildings.touched keep the
  // hot paths from scanning thousands of buildings once the village is big.
  [
    "CREATE TABLE IF NOT EXISTS districts (id TEXT PRIMARY KEY, group_id TEXT NOT NULL, member_id TEXT, dx INTEGER NOT NULL, dy INTEGER NOT NULL, seed INTEGER NOT NULL, created INTEGER NOT NULL, buildings INTEGER NOT NULL DEFAULT 0, UNIQUE(group_id, dx, dy))",
    "CREATE INDEX IF NOT EXISTS districts_member ON districts(member_id)",
    "ALTER TABLE buildings ADD COLUMN pos_x REAL",
    "ALTER TABLE buildings ADD COLUMN pos_y REAL",
    "ALTER TABLE buildings ADD COLUMN facing INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE buildings ADD COLUMN district_id TEXT",
    "ALTER TABLE buildings ADD COLUMN likes INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE buildings ADD COLUMN touched INTEGER NOT NULL DEFAULT 0",
    "UPDATE buildings SET touched = created",
    "CREATE INDEX IF NOT EXISTS buildings_district ON buildings(district_id)",
    "CREATE INDEX IF NOT EXISTS buildings_touched ON buildings(group_id, touched)",
    "CREATE TABLE IF NOT EXISTS building_likes (building_id TEXT NOT NULL, member_id TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY(building_id, member_id))",
    "CREATE INDEX IF NOT EXISTS building_likes_member ON building_likes(member_id)",
    "ALTER TABLE members ADD COLUMN ruin_until INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE members ADD COLUMN ruin_kind TEXT",
    "ALTER TABLE members ADD COLUMN ruin_x REAL",
    "ALTER TABLE members ADD COLUMN ruin_y REAL",
    "ALTER TABLE groups ADD COLUMN village_rev INTEGER NOT NULL DEFAULT 0",
  ],
  // 7 — accounts: a username and password open the same profile on any device;
  // Batur can hand out a one-day reset code.
  [
    "ALTER TABLE members ADD COLUMN username TEXT",
    "ALTER TABLE members ADD COLUMN pass_hash TEXT",
    "ALTER TABLE members ADD COLUMN reset_hash TEXT",
    "ALTER TABLE members ADD COLUMN reset_until INTEGER NOT NULL DEFAULT 0",
    "CREATE UNIQUE INDEX IF NOT EXISTS members_username ON members(username)",
    "CREATE INDEX IF NOT EXISTS members_reset ON members(reset_hash)",
  ],
  // 8 — shared authentication limits and push subscriptions bound to a device.
  // Old subscriptions are rebound by the client on its next authenticated visit.
  [
    "CREATE TABLE auth_limits (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires INTEGER NOT NULL)",
    "CREATE INDEX auth_limits_expires ON auth_limits(expires)",
    "ALTER TABLE subscriptions ADD COLUMN session_token TEXT REFERENCES sessions(token) ON DELETE CASCADE",
    "CREATE INDEX subscriptions_session ON subscriptions(session_token)",
    "ALTER TABLE owner_subscriptions ADD COLUMN session_token TEXT REFERENCES owner_sessions(token) ON DELETE CASCADE",
    "ALTER TABLE owner_subscriptions ADD COLUMN key_hash TEXT",
    "CREATE INDEX owner_subscriptions_session ON owner_subscriptions(session_token)",
    "CREATE INDEX sessions_created ON sessions(created)",
    "CREATE INDEX owner_sessions_created ON owner_sessions(created)",
  ],
  // 9 — a failed optimistic guard aborts the entire batch on SQLite and D1.
  [
    "CREATE TABLE write_guard (id INTEGER PRIMARY KEY CHECK(id = 1), valid INTEGER NOT NULL CONSTRAINT snapshot_changed CHECK(valid = 1))",
  ],
  // 10 — changing between arrival and break must not reset either cooldown.
  [
    "ALTER TABLE members ADD COLUMN pushed_here_at INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE members ADD COLUMN pushed_break_at INTEGER NOT NULL DEFAULT 0",
    "UPDATE members SET pushed_here_at = CASE WHEN pushed_kind = 'here' THEN pushed_at ELSE 0 END, pushed_break_at = CASE WHEN pushed_kind = 'break' THEN pushed_at ELSE 0 END",
  ],
  // 11 — subscriptions saved before migration 8 had no device; bind each to the
  // member's most recently used session so they keep receiving pushes. A device
  // that re-registers later rebinds itself to its own session.
  [
    "UPDATE subscriptions SET session_token = (SELECT s.token FROM sessions s WHERE s.member_id = subscriptions.member_id ORDER BY s.seen DESC, s.created DESC LIMIT 1) WHERE session_token IS NULL",
  ],
  // 12 — Batur's "dev" badge on his own profile in a team, and hidden badges
  // (the first one: finding the black hole; Paket 4 adds the rest).
  [
    "ALTER TABLE members ADD COLUMN badge TEXT",
    "CREATE TABLE IF NOT EXISTS achievements (member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE, key TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY(member_id, key))",
  ],
  // 13 — durable push retries, leased across Worker isolates. The subscription
  // identity is captured so rebinding an endpoint never delivers old private data.
  [
    `CREATE TABLE push_outbox (
      id TEXT PRIMARY KEY, endpoint TEXT NOT NULL,
      subscription_table TEXT NOT NULL CHECK(subscription_table IN ('subscriptions', 'owner_subscriptions')),
      payload TEXT NOT NULL, urgency TEXT NOT NULL DEFAULT 'normal', ttl INTEGER NOT NULL CHECK(ttl > 0),
      attempts INTEGER NOT NULL DEFAULT 0, next_at INTEGER NOT NULL, created INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sending')),
      lease_token TEXT, member_id TEXT, session_token TEXT, key_hash TEXT, subject TEXT NOT NULL)`,
    "CREATE INDEX push_outbox_due ON push_outbox(next_at, id)",
    "CREATE INDEX push_outbox_endpoint ON push_outbox(subscription_table, endpoint)",
    "CREATE TRIGGER subscriptions_outbox_delete AFTER DELETE ON subscriptions BEGIN DELETE FROM push_outbox WHERE subscription_table = 'subscriptions' AND endpoint = OLD.endpoint; END",
    "CREATE TRIGGER owner_subscriptions_outbox_delete AFTER DELETE ON owner_subscriptions BEGIN DELETE FROM push_outbox WHERE subscription_table = 'owner_subscriptions' AND endpoint = OLD.endpoint; END",
    "CREATE TRIGGER subscriptions_outbox_rebind AFTER UPDATE ON subscriptions WHEN OLD.endpoint IS NOT NEW.endpoint OR OLD.member_id IS NOT NEW.member_id OR OLD.session_token IS NOT NEW.session_token OR OLD.subscription IS NOT NEW.subscription BEGIN DELETE FROM push_outbox WHERE subscription_table = 'subscriptions' AND endpoint = OLD.endpoint; END",
    "CREATE TRIGGER owner_subscriptions_outbox_rebind AFTER UPDATE ON owner_subscriptions WHEN OLD.endpoint IS NOT NEW.endpoint OR OLD.key_hash IS NOT NEW.key_hash OR OLD.session_token IS NOT NEW.session_token OR OLD.subscription IS NOT NEW.subscription BEGIN DELETE FROM push_outbox WHERE subscription_table = 'owner_subscriptions' AND endpoint = OLD.endpoint; END",
  ],
  // 14 — tuğla: a balance that can never go negative, a ledger of every
  // movement, the catalogue model of each building and of the session under way,
  // and the 30% of an abandoned build waiting for its rubble to be cleared.
  // Everyone opens with one tuğla for every minute they have already focused.
  [
    "ALTER TABLE members ADD COLUMN bricks INTEGER NOT NULL DEFAULT 0 CHECK(bricks >= 0)",
    "ALTER TABLE members ADD COLUMN focus_model TEXT",
    "ALTER TABLE members ADD COLUMN focus_cost INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE members ADD COLUMN ruin_refund INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE buildings ADD COLUMN model TEXT",
    "CREATE TABLE bricks_log (id TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE, delta INTEGER NOT NULL, reason TEXT NOT NULL, ref TEXT, note TEXT, created INTEGER NOT NULL)",
    "CREATE INDEX bricks_log_member ON bricks_log(member_id, created)",
    "UPDATE members SET bricks = (SELECT COALESCE(SUM(minutes), 0) FROM focus_log WHERE member_id = members.id)",
    "INSERT INTO bricks_log (id, member_id, delta, reason, note, created) SELECT lower(hex(randomblob(16))), id, bricks, 'opening', 'Her odak dakikan için 1 tuğla', CAST(strftime('%s', 'now') AS INTEGER) * 1000 FROM members WHERE bricks > 0",
  ],
  // 15 — streaks: sessions in a row (short breaks allowed) and when the last one ended.
  [
    "ALTER TABLE members ADD COLUMN chain INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE members ADD COLUMN chain_end INTEGER NOT NULL DEFAULT 0",
  ],
  // 16 — statistics: arrivals at the library (with the room), leaving, and
  // collapsed builds. Earlier ones are recovered from the board's system lines.
  [
    "CREATE TABLE activity (id TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE, kind TEXT NOT NULL, detail TEXT, created INTEGER NOT NULL)",
    "CREATE INDEX activity_member ON activity(member_id, created)",
    "INSERT INTO activity (id, member_id, kind, detail, created) SELECT lower(hex(randomblob(16))), member_id, 'arrive', CASE WHEN instr(text, ' · ') > 0 AND instr(text, '. Bir sandalye') > 0 THEN substr(text, instr(text, ' · ') + 3, instr(text, '. Bir sandalye') - instr(text, ' · ') - 3) END, created FROM messages WHERE kind = 'system' AND text LIKE 'kütübe geldi%'",
    "INSERT INTO activity (id, member_id, kind, detail, created) SELECT lower(hex(randomblob(16))), member_id, 'leave', NULL, created FROM messages WHERE kind = 'system' AND text LIKE 'bugünlük paydos%'",
    "INSERT INTO activity (id, member_id, kind, detail, created) SELECT lower(hex(randomblob(16))), member_id, 'collapse', NULL, created FROM messages WHERE kind = 'system' AND text LIKE 'inşaatı çöktü%'",
  ],
  // 17 — blueprints: the rare buildings a member may build.
  [
    "CREATE TABLE unlocks (member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE, model TEXT NOT NULL, source TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY(member_id, model))",
  ],
  // 18 — the week: Haftanın Ustası ('master', for the week that ended) and the
  // team's shared monument ('monument', the week its goal was reached).
  [
    "CREATE TABLE weekly (group_id TEXT NOT NULL, week INTEGER NOT NULL, kind TEXT NOT NULL, member_id TEXT, minutes INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL, PRIMARY KEY(group_id, week, kind))",
  ],
  // 19 — studying together: the team's rhythm (and the last boundary announced)
  // and the tea break of a build-mode session.
  [
    "ALTER TABLE groups ADD COLUMN rhythm TEXT",
    "ALTER TABLE groups ADD COLUMN rhythm_at INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE members ADD COLUMN focus_paused_at INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE members ADD COLUMN focus_pause_used INTEGER NOT NULL DEFAULT 0",
  ],
  // 20 — messages that get seen: how far each member has read the board, a
  // coffee call addressed to one person, and replies to it.
  [
    "ALTER TABLE members ADD COLUMN board_seen INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE messages ADD COLUMN to_member TEXT",
    "ALTER TABLE messages ADD COLUMN reply_to TEXT",
  ],
  // 21 — several accounts on one device (n25): one phone's push endpoint can
  // carry a subscription for each account signed in on it, so the key becomes
  // (endpoint, member). The table is rebuilt (SQLite cannot change a primary
  // key); its indexes and outbox triggers come back, scoped to one account so
  // dropping one account's row never cancels another account's queued push.
  [
    "CREATE TABLE subscriptions_v21 (endpoint TEXT NOT NULL, member_id TEXT NOT NULL REFERENCES members(id), subscription TEXT NOT NULL, session_token TEXT REFERENCES sessions(token) ON DELETE CASCADE, PRIMARY KEY (endpoint, member_id))",
    "INSERT INTO subscriptions_v21 (endpoint, member_id, subscription, session_token) SELECT endpoint, member_id, subscription, session_token FROM subscriptions",
    "DROP TABLE subscriptions",
    "ALTER TABLE subscriptions_v21 RENAME TO subscriptions",
    "CREATE INDEX subscriptions_member ON subscriptions(member_id)",
    "CREATE INDEX subscriptions_session ON subscriptions(session_token)",
    "CREATE TRIGGER subscriptions_outbox_delete AFTER DELETE ON subscriptions BEGIN DELETE FROM push_outbox WHERE subscription_table = 'subscriptions' AND endpoint = OLD.endpoint AND member_id IS OLD.member_id; END",
    "CREATE TRIGGER subscriptions_outbox_rebind AFTER UPDATE ON subscriptions WHEN OLD.endpoint IS NOT NEW.endpoint OR OLD.member_id IS NOT NEW.member_id OR OLD.session_token IS NOT NEW.session_token OR OLD.subscription IS NOT NEW.subscription BEGIN DELETE FROM push_outbox WHERE subscription_table = 'subscriptions' AND endpoint = OLD.endpoint AND member_id IS OLD.member_id; END",
  ],
  // 22 — a shared plan link (n34) can be answered "Gelemem" too; those who
  // said no are kept apart from attendees so every "who is coming" count stays as it was.
  [
    "CREATE TABLE IF NOT EXISTS plan_skips (plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE, member_id TEXT NOT NULL REFERENCES members(id), PRIMARY KEY(plan_id, member_id))",
  ],
  // 23 — open devices by name (anket, 17 Eki): a short label from the
  // browser ("iPhone · Safari"), filled in as each device opens the app.
  ["ALTER TABLE sessions ADD COLUMN device TEXT"],
  // 24 — dürüst dakika (n40): a free session from a new app is watched too
  // (focus_honest), its time away is kept (focus_away), a build-mode site that
  // cracked can be saved once (focus_rescued, then a patched building), and the
  // moment the phone said it was left drives the "come back" pushes and stops a
  // computer keeping the session alive (focus_left_at); focus_device is where it started.
  [
    "ALTER TABLE members ADD COLUMN focus_honest INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE members ADD COLUMN focus_away INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE members ADD COLUMN focus_rescued INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE members ADD COLUMN focus_left_at INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE members ADD COLUMN focus_device TEXT",
    "ALTER TABLE buildings ADD COLUMN patched INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE focus_log ADD COLUMN rescued INTEGER NOT NULL DEFAULT 0",
  ],
  // 25 — one countdown (n40 düzeltme): the moment a build-mode site cracked is
  // kept on the server, so every device shows the same crack and it cannot be
  // beaten away.
  ["ALTER TABLE members ADD COLUMN focus_cracked_at INTEGER NOT NULL DEFAULT 0"],
  // 26 — relaxed builds keep server time without a foreground heartbeat.
  // Delivery is an acknowledgement of an already-credited building, never a reward action.
  [
    "ALTER TABLE members ADD COLUMN focus_relaxed INTEGER NOT NULL DEFAULT 0 CHECK(focus_relaxed IN (0, 1))",
    "CREATE INDEX members_relaxed_due ON members(focus_end) WHERE focus_relaxed = 1 AND focus_end > 0",
    "CREATE TABLE build_deliveries (id TEXT PRIMARY KEY REFERENCES buildings(id) ON DELETE CASCADE, member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE, model TEXT NOT NULL, kind TEXT NOT NULL, seed INTEGER NOT NULL, minutes INTEGER NOT NULL, ends INTEGER NOT NULL, reward INTEGER NOT NULL, created INTEGER NOT NULL, accepted_at INTEGER NOT NULL DEFAULT 0)",
    "CREATE INDEX build_deliveries_member ON build_deliveries(member_id, accepted_at, created)",
    "CREATE TABLE build_push_events (id TEXT PRIMARY KEY, nonce TEXT NOT NULL, member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE, ends INTEGER NOT NULL, stage INTEGER NOT NULL CHECK(stage IN (0, 25, 50, 75, 100)))",
    "CREATE UNIQUE INDEX build_push_stage ON build_push_events(member_id, ends, stage)",
  ],
  // 27 — komuta merkezi (n43): a building Batur gave as a present keeps his
  // note here (NULL for everything built in a session), so the village, the
  // delivery replay and the panel can say who it is from.
  ["ALTER TABLE buildings ADD COLUMN gift TEXT"],
  // 28 — n44: the widest landmarks get a district of their own (Batur chose
  // this). Those already standing are lifted from their plots; layoutVillages()
  // at start-up puts each on the centre of a new district (shared/village.js)
  // and recounts the districts.
  [
    "UPDATE buildings SET pos_x = NULL, pos_y = NULL WHERE model IN ('anitkabir', 'keops', 'kolezyum', 'sidney', 'suleymaniye') AND pos_x IS NOT NULL AND member_id IN (SELECT member_id FROM districts WHERE member_id IS NOT NULL)",
  ],
  // 29 — Bir Taş da Senden: one opt-in project shared by all villages.
  // No campaign or participant is created by migration. Batur launches it.
  [
    "ALTER TABLE members ADD COLUMN focus_imece INTEGER NOT NULL DEFAULT 0 CHECK(focus_imece IN (0,1))",
    "ALTER TABLE members ADD COLUMN focus_imece_phase INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE members ADD COLUMN focus_imece_personal INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE members ADD COLUMN focus_imece_ref TEXT",
    "CREATE INDEX members_imece ON members(focus_imece) WHERE focus_imece = 1",
    "CREATE TABLE imece_project (id TEXT PRIMARY KEY CHECK(id = 'bir-tas-da-senden'), rev INTEGER NOT NULL DEFAULT 1, started INTEGER NOT NULL, completed INTEGER NOT NULL DEFAULT 0)",
    "CREATE TABLE imece_crew (slot INTEGER PRIMARY KEY CHECK(slot BETWEEN 0 AND 3), member_id TEXT UNIQUE REFERENCES members(id) ON DELETE SET NULL, name TEXT NOT NULL, avatar TEXT NOT NULL, color TEXT NOT NULL, seen_minutes INTEGER NOT NULL DEFAULT 0)",
    "CREATE TABLE imece_contributions (id TEXT PRIMARY KEY, slot INTEGER NOT NULL REFERENCES imece_crew(slot), phase INTEGER NOT NULL CHECK(phase BETWEEN 0 AND 2), minutes INTEGER NOT NULL CHECK(minutes IN (25,50,75)), personal INTEGER NOT NULL CHECK(personal >= 0 AND personal <= minutes), session_end INTEGER NOT NULL, created INTEGER NOT NULL)",
    "CREATE INDEX imece_contributions_phase ON imece_contributions(phase, slot)",
  ],
  // 30 — one meeting response, personal arrival, edits/cancellation and opt-in reminders.
  // The old skips table is retained for recovery; attendees is the sole live answer table.
  [
    "ALTER TABLE plans ADD COLUMN ends INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE plans ADD COLUMN rev INTEGER NOT NULL DEFAULT 1",
    "ALTER TABLE plans ADD COLUMN schedule INTEGER NOT NULL DEFAULT 1",
    "ALTER TABLE plans ADD COLUMN cancelled INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE plans ADD COLUMN updated INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE plans ADD COLUMN request_key TEXT",
    "CREATE UNIQUE INDEX plans_request ON plans(member_id,request_key) WHERE request_key IS NOT NULL",
    "ALTER TABLE attendees ADD COLUMN answer TEXT NOT NULL DEFAULT 'yes' CHECK(answer IN ('yes','no','maybe'))",
    "ALTER TABLE attendees ADD COLUMN arrival INTEGER",
    "ALTER TABLE attendees ADD COLUMN schedule INTEGER NOT NULL DEFAULT 1",
    "ALTER TABLE attendees ADD COLUMN remind INTEGER NOT NULL DEFAULT 0 CHECK(remind IN (0,1))",
    "ALTER TABLE attendees ADD COLUMN response_note TEXT NOT NULL DEFAULT ''",
    "UPDATE attendees SET arrival=(SELECT starts FROM plans WHERE id=attendees.plan_id)",
    PLAN_LEGACY_IMPORT,
    "CREATE TABLE plan_push_events(id TEXT PRIMARY KEY,nonce TEXT NOT NULL,plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE)",
    "CREATE INDEX plan_remind ON attendees(remind,arrival) WHERE answer='yes' AND remind=1",
  ],
  // 31 — persistent, per-member discovery and earned weekly-building rights.
  [
    "CREATE TABLE blueprint_progress(member_id TEXT PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE, carry INTEGER NOT NULL DEFAULT 0 CHECK(carry>=0 AND carry<25), dry INTEGER NOT NULL DEFAULT 0 CHECK(dry>=0 AND dry<500), draws INTEGER NOT NULL DEFAULT 0 CHECK(draws>=0), seed TEXT NOT NULL)",
    ...WEEKLY_BACKFILL,
  ],
  // 32 — one independent monument per team; keep the original global archive.
  [
    "CREATE TABLE imece_projects(id TEXT PRIMARY KEY,group_id TEXT UNIQUE REFERENCES groups(id) ON DELETE SET NULL,rev INTEGER NOT NULL DEFAULT 1,started INTEGER NOT NULL,completed INTEGER NOT NULL DEFAULT 0)",
    "CREATE TABLE imece_slots(project_id TEXT NOT NULL REFERENCES imece_projects(id),slot INTEGER NOT NULL CHECK(slot BETWEEN 0 AND 3),member_id TEXT REFERENCES members(id) ON DELETE SET NULL,name TEXT NOT NULL,avatar TEXT NOT NULL,color TEXT NOT NULL,seen_minutes INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(project_id,slot),UNIQUE(project_id,member_id))",
    "CREATE TABLE imece_work(id TEXT PRIMARY KEY,project_id TEXT NOT NULL,slot INTEGER NOT NULL,phase INTEGER NOT NULL CHECK(phase BETWEEN 0 AND 2),minutes INTEGER NOT NULL CHECK(minutes IN (25,50,75)),personal INTEGER NOT NULL CHECK(personal>=0 AND personal<=minutes),session_end INTEGER NOT NULL,created INTEGER NOT NULL,FOREIGN KEY(project_id,slot) REFERENCES imece_slots(project_id,slot))",
    "CREATE INDEX imece_work_project ON imece_work(project_id,created,id)",
    "CREATE INDEX imece_slots_member ON imece_slots(member_id)",
    "ALTER TABLE members ADD COLUMN focus_imece_project TEXT",
    ...IMECE_TEAM_IMPORT,
  ],
  // 33 — n45: a team Batur opens from the panel starts with nobody in it and
  // stays when its last member leaves; the creating request's key makes a
  // repeated send return the same team. Teams opened from the app keep 0.
  [
    "ALTER TABLE groups ADD COLUMN owner_made INTEGER NOT NULL DEFAULT 0 CHECK(owner_made IN (0,1))",
    "ALTER TABLE groups ADD COLUMN request_key TEXT",
    "CREATE UNIQUE INDEX groups_request ON groups(request_key) WHERE request_key IS NOT NULL",
  ],
];

export const SCHEMA_VERSION = migrations.length;

export async function migrate(db) {
  const current = async () => {
    try {
      const row = await db.get("SELECT value FROM settings WHERE key = 'schema'");
      return row ? Number(row.value) : 0;
    } catch {
      return 0; // settings table does not exist yet
    }
  };
  let version = await current();
  while (version < SCHEMA_VERSION) {
    const next = version + 1;
    try {
      await db.batch([
        ...migrations[version].map((sql) => [sql, []]),
        [
          "INSERT INTO settings (key, value) VALUES ('schema', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
          [String(next)],
        ],
      ]);
    } catch (error) {
      // Another isolate/process may have applied the same migration concurrently.
      if ((await current()) < next) throw error;
    }
    version = await current();
  }
}
