import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { createApp, dayStart, weekStart } from "../server/app.js";
import { sqliteAdapter } from "../server/sqlite.js";
import { SCHEMA_VERSION, migrations } from "../server/schema.js";

const call = (app, path, { method = "GET", body, headers = {} } = {}) =>
  app
    .fetch(
      new Request(`http://kutup.test/api${path}`, {
        method,
        headers: { "Content-Type": "application/json", "X-Kutup": "1", ...headers },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
      { ip: "test" },
    )
    .then(async (r) => ({ status: r.status, data: await r.json() }));

test("a database from the first Kütüp release upgrades in place and keeps its sessions", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  // Exact v1 layout, written by the original server.
  sqlite.exec(`
    CREATE TABLE groups (id TEXT PRIMARY KEY, name TEXT NOT NULL, invite TEXT UNIQUE NOT NULL);
    CREATE TABLE members (id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id), token TEXT UNIQUE NOT NULL, name TEXT NOT NULL, avatar TEXT NOT NULL, color TEXT NOT NULL, note TEXT DEFAULT '', status TEXT DEFAULT 'away', location TEXT DEFAULT '', desk TEXT DEFAULT '', arrival TEXT, status_until INTEGER DEFAULT 0, focus_end INTEGER DEFAULT 0, focus_minutes INTEGER DEFAULT 0, joined INTEGER NOT NULL, updated INTEGER NOT NULL);
    CREATE TABLE messages (id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id), member_id TEXT NOT NULL REFERENCES members(id), text TEXT NOT NULL, kind TEXT DEFAULT 'message', created INTEGER NOT NULL);
    CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE feedback (id TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id), kind TEXT NOT NULL, text TEXT NOT NULL, status TEXT DEFAULT 'new', created INTEGER NOT NULL);
  `);
  const token = "a".repeat(64);
  sqlite.prepare("INSERT INTO groups VALUES ('g1', 'Eski tayfa', 'invite-old-1234567890')").run();
  sqlite
    .prepare("INSERT INTO members (id, group_id, token, name, avatar, color, joined, updated) VALUES ('m1', 'g1', ?, 'Batur', '🪐', 'lilac', 1, 1)")
    .run(createHash("sha256").update(token).digest("hex"));
  sqlite.prepare("INSERT INTO messages VALUES ('x', 'g1', 'm1', 'eski mesaj', 'message', 5)").run();
  sqlite.prepare("INSERT INTO feedback VALUES ('f1', 'm1', 'idea', 'eski fikir', 'planned', 7)").run();
  const app = createApp({ db: sqliteAdapter(sqlite), config: { adminKey: "k".repeat(20) } });
  const session = await call(app, "/session", { headers: { Cookie: `kutup_session=${token}` } });
  assert.equal(session.status, 200);
  assert.equal(session.data.group.name, "Eski tayfa");
  assert.equal(session.data.messages[0].text, "eski mesaj");
  const [request] = (await call(app, "/feedback", { headers: { Cookie: `kutup_session=${token}` } })).data;
  assert.equal(request.status, "accepted", "v1 'planned' becomes 'accepted'");
  assert.deepEqual(request.events.map((e) => e.status), ["new", "accepted"]);
  assert.equal(
    sqlite.prepare("SELECT value FROM settings WHERE key = 'schema'").get().value,
    String(SCHEMA_VERSION),
  );
});

test("without ADMIN_KEY, Batur claims the box once with a key of his own", async () => {
  const app = createApp({ db: sqliteAdapter(new DatabaseSync(":memory:")) });
  assert.equal((await call(app, "/owner/status")).data.claimed, false);
  assert.equal((await call(app, "/owner/claim", { method: "POST", body: { key: "kısa" } })).status, 400);
  const key = "uzun-ve-gizli-bir-anahtar";
  assert.equal((await call(app, "/owner/claim", { method: "POST", body: { key } })).status, 201);
  assert.equal((await call(app, "/owner/claim", { method: "POST", body: { key: "baska-biri-denedi-1" } })).status, 409);
  assert.equal((await call(app, "/owner/status")).data.claimed, true);
  assert.equal((await call(app, "/owner/feedback", { headers: { "X-Owner-Key": key } })).status, 200);
  assert.equal((await call(app, "/owner/feedback", { headers: { "X-Owner-Key": "yanlis-anahtar-123" } })).status, 401);
});

test("finished Fidan modu sessions turn into village buildings on upgrade", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const db = sqliteAdapter(sqlite);
  // A database as it was with Fidan modu (schema 4).
  for (const [i, statements] of migrations.slice(0, 4).entries())
    await db.batch([
      ...statements.map((sql) => [sql, []]),
      ["INSERT INTO settings (key, value) VALUES ('schema', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [String(i + 1)]],
    ]);
  sqlite.exec(`
    INSERT INTO groups (id, name, invite) VALUES ('g', 'Tayfa', 'invite-123456789012');
    INSERT INTO members (id, group_id, token, name, avatar, color, joined, updated) VALUES ('m', 'g', 't', 'Elif', '🍒', 'pink', 1, 1);
    INSERT INTO focus_log (id, member_id, minutes, created, strict) VALUES
      ('a', 'm', 25, 10, 1), ('b', 'm', 75, 20, 1), ('c', 'm', 50, 30, 0);
  `);
  await createApp({ db, config: { adminKey: "k".repeat(20) } }).ready();
  const rows = sqlite.prepare("SELECT kind, minutes FROM buildings ORDER BY created").all();
  assert.deepEqual(rows.map((r) => [r.kind, r.minutes]), [["cottage", 25], ["tower", 75]]);
  assert.equal(sqlite.prepare("SELECT value FROM settings WHERE key = 'schema'").get().value, String(SCHEMA_VERSION));
});

test("changing ADMIN_KEY signs every remembered owner device out", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const before = createApp({ db: sqliteAdapter(sqlite), config: { adminKey: "eski-anahtar-123456" } });
  const login = await before.fetch(
    new Request("https://kutup.test/api/owner/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Kutup": "1" },
      body: JSON.stringify({ key: "eski-anahtar-123456" }),
    }),
  );
  assert.match(login.headers.get("set-cookie"), /Secure/);
  const cookie = login.headers.get("set-cookie").split(";")[0];
  assert.equal((await call(before, "/owner/feedback", { headers: { Cookie: cookie } })).status, 200);
  const after = createApp({ db: sqliteAdapter(sqlite), config: { adminKey: "yeni-anahtar-654321" } });
  assert.equal((await call(after, "/owner/feedback", { headers: { Cookie: cookie } })).status, 401);
});

test("days and weeks follow Türkiye time", () => {
  // 01:30 on Wednesday 14 Oct in Istanbul is still 13 Oct in UTC.
  const now = Date.parse("2026-10-13T22:30:00Z");
  assert.equal(new Date(dayStart(now)).toISOString(), "2026-10-13T21:00:00.000Z");
  assert.equal(new Date(weekStart(now)).toISOString(), "2026-10-11T21:00:00.000Z");
  const sunday = Date.parse("2026-10-18T20:59:00Z"); // 23:59 Sunday in Istanbul
  assert.equal(new Date(weekStart(sunday)).toISOString(), "2026-10-11T21:00:00.000Z");
});
