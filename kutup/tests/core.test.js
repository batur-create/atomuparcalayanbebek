import { statsOf } from "../server/stats.js";
import { BY_ID, CATALOG, CATEGORIES, CLASSES, RARE, fits, imeceBonus, modelOf, refundLater, refundNow, streakBonus, unlocked, wageFor } from "../shared/catalog.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { createApp, dayStart, weekStart } from "../server/app.js";
import { sqliteAdapter } from "../server/sqlite.js";
import { SCHEMA_VERSION, migrations } from "../server/schema.js";
import { CAPACITY, cellLayout, chooseCell, placeIn, ringOf } from "../shared/village.js";

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
    .then(async (r) => ({ status: r.status, data: await r.json(), cookie: r.headers.get("set-cookie")?.split(";")[0] }));

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
  sqlite.prepare("UPDATE members SET joined = ?, updated = ?").run(Date.now(), Date.now());
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
  // Tuğla open at one per minute already focused, build mode or not.
  assert.equal(sqlite.prepare("SELECT bricks FROM members WHERE id = 'm'").get().bricks, 150);
  assert.deepEqual({ ...sqlite.prepare("SELECT delta, reason FROM bricks_log WHERE member_id = 'm'").get() }, { delta: 150, reason: "opening" });
  assert.throws(() => sqlite.exec("UPDATE members SET bricks = -1 WHERE id = 'm'"), /CHECK/);
});

test("statistics: day streaks, the best day, library visits and the usual arrival", () => {
  const day = 86400000,
    at = (d, h, m = 0) => Date.UTC(2026, 9, d, h - 3, m); // Türkiye local time
  const s = statsOf({
    now: at(15, 20),
    focus: [
      { minutes: 50, created: at(12, 11), strict: 1 },
      { minutes: 25, created: at(13, 10), strict: 0 },
      { minutes: 75, created: at(14, 16), strict: 1 },
      { minutes: 25, created: at(14, 17), strict: 1 },
      { minutes: 50, created: at(15, 11), strict: 1 },
    ],
    activity: [
      { kind: "arrive", detail: "Adnan", created: at(14, 9, 30) },
      { kind: "leave", created: at(14, 17, 30) },
      { kind: "arrive", detail: "Adnan", created: at(15, 10, 10) },
      { kind: "arrive", detail: "Müjgan", created: at(15, 13) },
      { kind: "collapse", detail: "ev", created: at(15, 14) },
    ],
    built: [{ model: "kulube", n: 3, likes: 2 }, { model: "firin", n: 1, likes: 1 }],
    ledger: [{ reason: "wage", total: 230 }, { reason: "cost", total: -70 }],
    social: { messages: 4, plans: 1, joined: 2 },
    bricks: 160,
  });
  assert.deepEqual([s.focus.total, s.focus.sessions, s.focus.longest], [225, 5, 75]);
  assert.deepEqual(s.focus.streak, { current: 4, best: 4 });
  assert.equal(s.focus.bestDay.minutes, 100);
  assert.equal(s.focus.last14.length, 14);
  assert.equal(s.focus.today, 50);
  assert.deepEqual([s.builds.total, s.builds.likes, s.builds.collapses, s.builds.success], [4, 3, 1, 80]);
  assert.deepEqual([s.library.visits, s.library.days, s.library.room], [3, 2, "Adnan"]);
  assert.equal(s.library.minutes, 8 * 60 + 170 + 7 * 60, "a visit ends at leaving, the next arrival or after 8 hours");
  assert.equal(s.library.usualArrival, 10 * 60 + 10);
  assert.deepEqual([s.bricks.earned, s.bricks.spent], [230, 70]);
  assert.ok(day > 0);
});

test("the tuğla economy: wages grow with session length, refunds split 50/30/20", () => {
  assert.deepEqual([25, 50, 75].map((m) => wageFor(m)), [25, 55, 90]);
  assert.deepEqual([25, 50, 75].map((m) => wageFor(m, false)), [13, 28, 45]);
  for (const item of CATALOG) {
    assert.ok(BY_ID[item.id] === item && CLASSES[item.class] && CATEGORIES[item.category] && ["cottage", "house", "tower"].includes(item.kind), item.id);
    assert.ok(Number.isInteger(item.cost) && item.cost >= 0 && item.done && item.name, item.id);
    // Every building leaves 20% of its materials behind when abandoned.
    if (item.cost) assert.ok(Math.abs(item.cost - refundNow(item.cost) - refundLater(item.cost) - item.cost * 0.2) <= 1, item.id);
  }
  assert.equal(BY_ID.kulube.cost, 0, "a cottage is always free");
  assert.equal(modelOf(null, "house").id, "ev");
  assert.equal(modelOf("firin", "cottage").id, "firin");
  assert.equal(fits(BY_ID.kule, 60), false);
  assert.equal(fits(BY_ID.ev, 60), true);
  assert.deepEqual([1, 2, 3, 7].map(streakBonus), [0, 0.1, 0.2, 0.2]);
  assert.deepEqual([0, 1, 3, 9].map((n) => imeceBonus(n)), [0, 0.05, 0.15, 0.2]);
  assert.equal(imeceBonus(2, true), 0.16);
  for (const id of ["firin", "sahaf", "kahve", "kutuphane", "degirmen"]) assert.ok(BY_ID[id].effect, id);
  assert.deepEqual(RARE.map((i) => i.id), ["fener", "sera"]);
  assert.deepEqual([unlocked(BY_ID.sera), unlocked(BY_ID.sera, ["sera"]), unlocked(BY_ID.gozlemevi, ["gozlemevi"]), unlocked(BY_ID.gozlemevi, [], true), unlocked(BY_ID.ev)], [false, true, false, true, true]);
});

test("the shared village gives old buildings a stored spot, in the order they were built", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const db = sqliteAdapter(sqlite);
  for (const [i, statements] of migrations.slice(0, 5).entries())
    await db.batch([
      ...statements.map((sql) => [sql, []]),
      ["INSERT INTO settings (key, value) VALUES ('schema', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [String(i + 1)]],
    ]);
  sqlite.exec(`
    INSERT INTO groups (id, name, invite) VALUES ('g', 'Tayfa', 'invite-123456789012');
    INSERT INTO members (id, group_id, token, name, avatar, color, joined, updated) VALUES
      ('m1', 'g', 't1', 'Elif', '🍒', 'pink', 1, 1), ('m2', 'g', 't2', 'Ege', '🎧', 'mint', 2, 2);
  `);
  const insert = sqlite.prepare("INSERT INTO buildings (id, member_id, group_id, kind, minutes, seed, created) VALUES (?, ?, 'g', ?, ?, ?, ?)");
  for (let i = 0; i < 12; i++) insert.run(`b${String(i).padStart(2, "0")}`, "m1", ["cottage", "house", "tower"][i % 3], 25, i, 100 + i);
  insert.run("e1", "m2", "house", 50, 7, 500);
  await createApp({ db, config: { adminKey: "k".repeat(20) } }).ready();
  const districts = sqlite.prepare("SELECT id, member_id, dx, dy, buildings FROM districts ORDER BY created, id").all();
  const rows = sqlite.prepare("SELECT id, member_id, kind, pos_x, pos_y, district_id FROM buildings ORDER BY created").all();
  assert.ok(rows.every((b) => b.pos_x !== null && b.district_id), "every building has a spot");
  const elif = districts.filter((d) => d.member_id === "m1");
  assert.ok(elif.length >= 2, "a full district opens a neighbouring one");
  assert.equal(elif.reduce((n, d) => n + d.buildings, 0), 12);
  assert.ok(elif.every((d) => d.buildings <= CAPACITY));
  assert.equal(districts.find((d) => d.member_id === "m2").buildings, 1);
  // The first districts are the cells next to the square.
  assert.ok(districts.slice(0, 2).every((d) => ringOf(d.dx, d.dy) === 1));
  for (const a of rows)
    for (const b of rows)
      if (a !== b) assert.ok(Math.hypot(a.pos_x - b.pos_x, a.pos_y - b.pos_y) > 3.5, `${a.id} and ${b.id} overlap`);
  // A second start changes nothing: spots are stored once.
  const before = JSON.stringify(rows);
  await createApp({ db, config: { adminKey: "k".repeat(20) } }).ready();
  assert.equal(JSON.stringify(sqlite.prepare("SELECT id, member_id, kind, pos_x, pos_y, district_id FROM buildings ORDER BY created").all()), before);
});

test("district choice: newcomers near the square, full districts grow next door", () => {
  const cells = new Map();
  const first = chooseCell(cells);
  assert.equal(ringOf(...first), 1);
  cells.set(first.join(","), { memberId: "a" });
  const second = chooseCell(cells);
  assert.equal(ringOf(...second), 1);
  assert.notDeepEqual(second, first);
  cells.set(second.join(","), { memberId: "b" });
  const grow = chooseCell(cells, [first]);
  assert.equal(Math.max(Math.abs(grow[0] - first[0]), Math.abs(grow[1] - first[1]), Math.abs(grow[0] + grow[1] - first[0] - first[1])), 1, "next to their own district");
  // An empty plot left by someone who quit is handed out again.
  cells.set(second.join(","), { memberId: null });
  assert.deepEqual(chooseCell(cells), second);
  // The same seeds always draw the same lanes and give the same spots.
  const layout = cellLayout("g", 1, 0);
  assert.deepEqual(placeIn(layout, [], "house"), placeIn(cellLayout("g", 1, 0), [], "house"));
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

test("authentication rate limits survive new application instances", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const first = createApp({ db: sqliteAdapter(sqlite) });
  const second = createApp({ db: sqliteAdapter(sqlite) });
  await first.ready();
  await second.ready();
  for (let i = 0; i < 8; i++)
    assert.equal((await call(i % 2 ? first : second, "/login", { method: "POST", body: { username: "missing", password: "password" } })).status, 401);
  assert.equal((await call(second, "/login", { method: "POST", body: { username: "missing", password: "password" } })).status, 429);
  assert.ok(sqlite.prepare("SELECT key FROM auth_limits").all().every((r) => /^[a-f0-9]{64}$/.test(r.key)));
  sqlite.prepare("UPDATE auth_limits SET expires = 0").run();
  assert.equal((await call(first, "/login", { method: "POST", body: { username: "missing", password: "password" } })).status, 401);
});

test("session lifetimes are enforced on the server, even with a copied cookie", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const app = createApp({ db: sqliteAdapter(sqlite), config: { adminKey: "a-test-owner-key" } });
  const signup = await app.fetch(new Request("https://kutup.test/api/groups", {
    method: "POST", headers: { "X-Kutup": "1" },
    body: JSON.stringify({ name: "Test", username: "test", password: "test123" }),
  }));
  const cookie = signup.headers.get("set-cookie").split(";")[0];
  assert.equal((await call(app, "/session", { headers: { Cookie: cookie } })).status, 200);
  sqlite.exec("UPDATE sessions SET created = 1");
  assert.equal((await call(app, "/session", { headers: { Cookie: cookie } })).status, 401);
  const owner = await app.fetch(new Request("https://kutup.test/api/owner/login", {
    method: "POST", headers: { "X-Kutup": "1" }, body: JSON.stringify({ key: "a-test-owner-key" }),
  }));
  const ownerCookie = owner.headers.get("set-cookie").split(";")[0];
  sqlite.exec("UPDATE owner_sessions SET created = 1");
  assert.equal((await call(app, "/owner/feedback", { headers: { Cookie: ownerCookie } })).status, 401);
});

async function auditFixture() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const app = createApp({ db: sqliteAdapter(sqlite) });
  const joined = await call(app, "/groups", { method: "POST", body: { name: "Birinci", username: "birinci", password: "test123" } });
  assert.equal(joined.status, 201);
  const headers = { Cookie: joined.cookie };
  return { sqlite, app, joined, headers };
}

test("an expired presence changes the revision seen by idle polling clients", async () => {
  const { sqlite, app, headers } = await auditFixture();
  const here = await call(app, "/presence", { method: "POST", headers, body: { status: "here" } });
  const rev = here.data.state.group.rev;
  sqlite.exec("UPDATE members SET status_until = 1");
  const fresh = (await call(app, `/state?rev=${rev}`, { headers })).data;
  assert.equal(fresh.members[0].status, "away");
  assert.ok(fresh.group.rev > rev);
  assert.equal((await call(app, `/state?rev=${fresh.group.rev}`, { headers })).data.unchanged, true);
});

test("late focus settlement appears in village deltas without moving existing buildings", async () => {
  const { sqlite, app, headers } = await auditFixture();
  const start = () => call(app, "/focus", { method: "POST", headers, body: { action: "start", minutes: 25, strict: true } });
  const finishAt = async (time) => {
    sqlite.prepare("UPDATE members SET focus_end = ?, focus_beat = ?").run(time, time);
    return call(app, "/state", { headers });
  };
  await start();
  await finishAt(Date.now() - 1000);
  const village = (await call(app, "/village", { headers })).data;
  assert.equal(village.buildings.length, 1);
  await start();
  const earlier = village.until - 3600000;
  await finishAt(earlier);
  const delta = (await call(app, `/village?rev=${village.rev}&after=${village.until}`, { headers })).data;
  assert.equal(delta.partial, true);
  assert.ok(delta.buildings.some((b) => b[8] === earlier), "late credit has its insertion time as the sync cursor");
  const full = (await call(app, "/village", { headers })).data;
  assert.equal(full.buildings.length, 2);
  assert.deepEqual(full.buildings.find((b) => b[0] === village.buildings[0][0]).slice(4, 7), village.buildings[0].slice(4, 7));
});

test("parallel joins reclaim distinct plots and cannot duplicate names", async () => {
  const { app, joined, sqlite } = await auditFixture();
  const join = (name, username) => call(app, "/join", { method: "POST", body: { invite: joined.data.group.invite, name, username, password: "test123" } });
  const leaver = await join("Ayrılan", "ayrilan");
  await call(app, "/leave", { method: "POST", headers: { Cookie: leaver.cookie }, body: {} });
  const people = await Promise.all([join("İkinci", "ikinci"), join("Üçüncü", "ucuncu")]);
  assert.deepEqual(people.map((r) => r.status), [201, 201]);
  for (const p of people) assert.equal(sqlite.prepare("SELECT count(*) AS n FROM districts WHERE member_id = ?").get(p.data.memberId).n, 1);
  const duplicates = await Promise.all([join("Aynı İsim", "ayni1"), join("aynı isim", "ayni2")]);
  assert.deepEqual(duplicates.map((r) => r.status).sort(), [201, 409]);
  const edits = await Promise.all(people.map((p) => call(app, "/profile", { method: "POST", headers: { Cookie: p.cookie }, body: { name: "Yeni isim" } })));
  assert.deepEqual(edits.map((r) => r.status).sort(), [200, 409]);
});

test("two devices cannot replace each other's newly started focus timer", async () => {
  const { app, headers } = await auditFixture();
  const starts = await Promise.all([25, 50].map((minutes) => call(app, "/focus", { method: "POST", headers, body: { action: "start", minutes } })));
  assert.deepEqual(starts.map((r) => r.status).sort(), [200, 400]);
  const winner = starts.find((r) => r.status === 200).data.state.members[0];
  assert.equal((await call(app, "/state", { headers })).data.members[0].focusEnd, winner.focusEnd);
});

test("a delayed seen request cannot overwrite a newer feedback stage", async () => {
  const { sqlite, app, headers } = await auditFixture();
  const sent = await call(app, "/feedback", { method: "POST", headers, body: { kind: "idea", text: "Eşzamanlı panel testi" } });
  const id = sent.data.id;
  const db = sqliteAdapter(sqlite), originalGet = db.get;
  let hold = true, release, reached;
  const gate = new Promise((resolve) => { release = resolve; });
  const read = new Promise((resolve) => { reached = resolve; });
  db.get = async (sql, params) => {
    const row = await originalGet(sql, params);
    if (hold && sql.startsWith("SELECT id, kind, text, status, reply, member_id")) {
      hold = false;
      reached();
      await gate;
    }
    return row;
  };
  const owner = createApp({ db, config: { adminKey: "feedback-test-owner-key" } });
  const opts = { method: "POST", headers: { "X-Owner-Key": "feedback-test-owner-key" }, body: {} };
  const seen = call(owner, `/owner/feedback/${id}/seen`, opts);
  await read;
  const progressed = await call(owner, `/owner/feedback/${id}`, { ...opts, body: { status: "building", reply: "Üzerinde çalışıyorum." } });
  assert.equal(progressed.data.item.status, "building");
  release();
  const late = await seen;
  assert.equal(late.data.item.status, "building");
  assert.equal(late.data.item.reply, "Üzerinde çalışıyorum.");
  assert.deepEqual(late.data.item.events.map((e) => e.status), ["new", "building"]);
});

test("oversized streaming requests stop early and invalid origins and paths fail cleanly", async () => {
  const { app } = await auditFixture();
  let chunks = 0, cancelled = false;
  const body = new ReadableStream({
    pull(controller) { chunks++; controller.enqueue(new Uint8Array(10000)); },
    cancel() { cancelled = true; },
  });
  const oversized = await app.fetch(new Request("https://kutup.test/api/login", {
    method: "POST", headers: { "X-Kutup": "1" }, body, duplex: "half",
  }));
  assert.equal(oversized.status, 413);
  assert.ok(cancelled && chunks <= 3, "the whole body is never buffered");
  assert.equal((await call(app, "/login", { method: "POST", headers: { Origin: "null" }, body: {} })).status, 403);
  assert.equal((await call(app, "/invites/%ZZ")).status, 400);
});

test("upgrading status cooldowns preserves the last known notification time", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const db = sqliteAdapter(sqlite);
  for (const [i, statements] of migrations.slice(0, 9).entries()) {
    await db.batch([
      ...statements.map((sql) => [sql, []]),
      ["INSERT INTO settings (key, value) VALUES ('schema', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [String(i + 1)]],
    ]);
  }
  sqlite.exec(`
    INSERT INTO groups (id, name, invite) VALUES ('g', 'Tayfa', 'old-cooldown-invite');
    INSERT INTO members (id, group_id, token, name, avatar, color, joined, updated, pushed_kind, pushed_at) VALUES
      ('m1', 'g', 't1', 'Elif', '🍒', 'pink', 1, 1, 'here', 1000),
      ('m2', 'g', 't2', 'Ege', '🎧', 'mint', 2, 2, 'break', 2000);
  `);
  await createApp({ db, config: { adminKey: "cooldown-upgrade-test-key" } }).ready();
  const timers = sqlite.prepare("SELECT pushed_here_at, pushed_break_at FROM members ORDER BY id").all();
  assert.deepEqual(timers.map((r) => [r.pushed_here_at, r.pushed_break_at]), [[1000, 0], [0, 2000]]);
});

test("presence cooldowns expire independently and concurrent arrivals share one activity", async () => {
  const { app, sqlite, headers } = await auditFixture();
  const presence = (status) => call(app, "/presence", { method: "POST", headers, body: { status } });
  const results = await Promise.all([presence("here"), presence("here")]);
  assert.ok(results.every((r) => r.status === 200));
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM messages WHERE text LIKE '%kütübe geldi%'").get().n, 1);
  await presence("break");
  const before = sqlite.prepare("SELECT pushed_here_at, pushed_break_at FROM members").get();
  await presence("here");
  await presence("break");
  assert.deepEqual(sqlite.prepare("SELECT pushed_here_at, pushed_break_at FROM members").get(), before);
  // Only the arrival timer has elapsed; a fresh arrival can notify again.
  sqlite.prepare("UPDATE members SET pushed_here_at = ?").run(Date.now() - 46 * 60000);
  const boundary = Date.now();
  assert.equal((await presence("here")).status, 200);
  const after = sqlite.prepare("SELECT pushed_here_at, pushed_break_at FROM members").get();
  assert.ok(after.pushed_here_at >= boundary);
  assert.equal(after.pushed_break_at, before.pushed_break_at);
});

test("a real arrival notifies again after five minutes; a return from a break waits out 45", async () => {
  const { app, sqlite, headers } = await auditFixture();
  const presence = (status) => call(app, "/presence", { method: "POST", headers, body: { status } });
  const pushedHere = () => sqlite.prepare("SELECT pushed_here_at FROM members").get().pushed_here_at;
  await presence("here");
  const first = pushedHere();
  assert.ok(first > 0);
  await presence("away");
  await presence("here");
  assert.equal(pushedHere(), first, "flipping away/here within five minutes does not ping again");
  const sixMinutesAgo = Date.now() - 6 * 60000;
  sqlite.prepare("UPDATE members SET pushed_here_at = ?").run(sixMinutesAgo);
  await presence("break");
  await presence("here");
  assert.equal(pushedHere(), sixMinutesAgo, "coming back from a break keeps the long cooldown");
  await presence("away");
  await presence("here");
  assert.ok(pushedHere() > sixMinutesAgo, "a real arrival after five minutes notifies");
});

test("migration 11 binds subscriptions saved before devices existed to the latest session", async () => {
  const { sqlite } = await auditFixture();
  const member = sqlite.prepare("SELECT id FROM members").get().id;
  sqlite.prepare("INSERT INTO sessions (token, member_id, created, seen) VALUES ('old', ?, 1, 1), ('newest', ?, 2, ?)").run(member, member, Date.now() + 1000);
  sqlite.prepare("INSERT INTO subscriptions (endpoint, member_id, subscription) VALUES ('https://fcm.googleapis.com/fcm/send/legacy', ?, '{}')").run(member);
  sqlite.prepare("INSERT INTO subscriptions (endpoint, member_id, subscription, session_token) VALUES ('https://fcm.googleapis.com/fcm/send/bound', ?, '{}', 'old')").run(member);
  for (const sql of migrations[10]) sqlite.exec(sql);
  const token = (endpoint) => sqlite.prepare("SELECT session_token FROM subscriptions WHERE endpoint = ?").get(endpoint).session_token;
  assert.equal(token("https://fcm.googleapis.com/fcm/send/legacy"), "newest");
  assert.equal(token("https://fcm.googleapis.com/fcm/send/bound"), "old", "already bound subscriptions are untouched");
});

test("opening the app renews a month-old session; an unused one still expires after a year", async () => {
  const { app, sqlite, headers } = await auditFixture();
  const DAY = 86400000;
  sqlite.prepare("UPDATE sessions SET created = ?").run(Date.now() - 40 * DAY);
  const renewed = await call(app, "/session", { headers });
  assert.equal(renewed.status, 200);
  assert.ok(renewed.cookie?.startsWith("kutup_session="), "the cookie gets a fresh year");
  assert.ok(sqlite.prepare("SELECT created FROM sessions").get().created > Date.now() - 60000);
  const fresh = await call(app, "/session", { headers });
  assert.equal(fresh.cookie, undefined, "a recent session is not rewritten on every visit");
  sqlite.prepare("UPDATE sessions SET created = ?").run(Date.now() - 366 * DAY);
  assert.equal((await call(app, "/session", { headers })).status, 401);
});

test("a JSON backup restores into an empty database with sign-in and stored spots intact", async () => {
  const { restoreBackup, restoreSql } = await import("../server/restore.js");
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const app = createApp({ db: sqliteAdapter(sqlite), config: { adminKey: "restore-test-owner-key" } });
  const made = await call(app, "/groups", { method: "POST", body: { name: "Yedekli", username: "yedekli", password: "yedek-123" } });
  const headers = { Cookie: made.cookie };
  await call(app, "/presence", { method: "POST", headers, body: { status: "here" } });
  await call(app, "/messages", { method: "POST", headers, body: { text: "yedekten önce bir mesaj" } });
  await call(app, "/plans", { method: "POST", headers, body: { starts: Date.now() + 86400000, note: "yarın" } });
  const backup = (await call(app, "/owner/backup", { headers: { "X-Owner-Key": "restore-test-owner-key" } })).data;
  const copy = new DatabaseSync(":memory:");
  const report = await restoreBackup(backup, copy);
  assert.equal(report.counts.members, 1);
  assert.equal(report.counts.plans, 1);
  assert.ok(report.counts.messages >= 2);
  await assert.rejects(restoreBackup(backup, copy), /boş değil/, "never restores over existing data");
  const restored = createApp({ db: sqliteAdapter(copy) });
  assert.equal((await call(restored, "/login", { method: "POST", body: { username: "yedekli", password: "yedek-123" } })).status, 200);
  const sql = restoreSql(copy);
  assert.match(sql, /INSERT INTO plans/);
  const replay = new DatabaseSync(":memory:");
  replay.exec(sql);
  assert.equal(replay.prepare("SELECT count(*) AS n FROM members").get().n, 1, "the D1 file replays on an empty database");
});

test("Batur's dev badge is one per team, visible in state, and the black hole badge is awarded once", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const app = createApp({ db: sqliteAdapter(sqlite), config: { adminKey: "badge-test-owner-key" } });
  const owner = { "X-Owner-Key": "badge-test-owner-key" };
  const batur = await call(app, "/groups", { method: "POST", body: { name: "Batur", username: "batur_dev", password: "badge-123" } });
  const invite = batur.data.group.invite;
  const friend = await call(app, "/join", { method: "POST", body: { invite, name: "Sıla", username: "sila_x", password: "badge-123" } });
  const state = async () => (await call(app, "/state", { headers: { Cookie: friend.cookie } })).data;
  const badgeOf = (s, id) => s.members.find((m) => m.id === id).badge;
  assert.equal((await call(app, `/owner/members/${batur.data.memberId}/badge`, { method: "POST", headers: owner, body: { dev: true } })).status, 200);
  assert.equal(badgeOf(await state(), batur.data.memberId), "dev", "everyone sees the badge");
  await call(app, `/owner/members/${friend.data.memberId}/badge`, { method: "POST", headers: owner, body: { dev: true } });
  let s = await state();
  assert.equal(badgeOf(s, friend.data.memberId), "dev");
  assert.equal(badgeOf(s, batur.data.memberId), null, "only one dev profile per team");
  await call(app, `/owner/members/${friend.data.memberId}/badge`, { method: "POST", headers: owner, body: { dev: false } });
  assert.equal(badgeOf(await state(), friend.data.memberId), null);
  assert.equal((await call(app, `/owner/members/${friend.data.memberId}/badge`, { method: "POST", body: { dev: true } })).status, 401, "needs the owner");

  const earn = (key) => call(app, "/achievements", { method: "POST", headers: { Cookie: friend.cookie }, body: { key } });
  assert.equal((await earn("black-hole")).data.new, true);
  assert.equal((await earn("black-hole")).data.new, false, "awarded once");
  assert.equal((await earn("made-up")).status, 400);
  assert.equal((await call(app, "/leave", { method: "POST", headers: { Cookie: friend.cookie }, body: {} })).status, 200);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM achievements").get().n, 0, "leaving removes badges too");
});
