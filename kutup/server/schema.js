// Versioned schema shared by node:sqlite and Cloudflare D1.
// Every migration is a list of single statements (D1 cannot run multi-statement strings
// through prepared statements), applied together with the version bump in one batch.
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
