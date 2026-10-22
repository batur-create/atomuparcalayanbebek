import { dayStreak, partnersOf, statsOf, storyOf, storyWeek, weekOf } from "../server/stats.js";
import { pushReceiver } from "./helpers.js";
import { BY_ID, CATALOG, CATEGORIES, CLASSES, RARE, blueprintPool, fits, imeceBonus, modelOf, refundLater, refundNow, stateOf, streakBonus, unlocked, wageFor } from "../shared/catalog.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { createApp, dayStart, weekStart } from "../server/app.js";
import { sqliteAdapter } from "../server/sqlite.js";
import { SCHEMA_VERSION, migrations } from "../server/schema.js";
import { CAPACITY, cellLayout, chooseCell, placeIn, ringOf } from "../shared/village.js";
import { achievementsOf } from "../server/achievements.js";
import { ACHIEVEMENTS, shouting, teaCall } from "../shared/achievements.js";
import { ROOMS, deskNumber, elsewhere, headcount, roomOf, seatsOf, seating, tablesOf } from "../shared/rooms.js";

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

test("migration 21 keeps push subscriptions and lets one endpoint carry several accounts (n25)", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const db = sqliteAdapter(sqlite);
  // A database as it is live before n25 (schema 20), with one phone subscribed.
  for (const [i, statements] of migrations.slice(0, 20).entries())
    await db.batch([
      ...statements.map((sql) => [sql, []]),
      ["INSERT INTO settings (key, value) VALUES ('schema', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [String(i + 1)]],
    ]);
  const now = Date.now();
  sqlite.exec(`
    INSERT INTO groups (id, name, invite) VALUES ('g1', 'Ana tayfa', 'invite-123456789012'), ('g2', 'İkinci tayfa', 'invite-210987654321');
    INSERT INTO members (id, group_id, token, name, avatar, color, joined, updated) VALUES ('m1', 'g1', 't1', 'Batur', '🪐', 'lilac', 1, 1), ('m2', 'g2', 't2', 'Batur 2', '🪐', 'mint', 1, 1);
    INSERT INTO sessions (token, member_id, created, seen) VALUES ('s1', 'm1', ${now}, ${now}), ('s2', 'm2', ${now}, ${now});
    INSERT INTO subscriptions (endpoint, member_id, subscription, session_token) VALUES ('https://fcm.googleapis.com/phone', 'm1', '{}', 's1');
    INSERT INTO push_outbox (id, endpoint, subscription_table, payload, ttl, next_at, created, member_id, session_token, subject)
      VALUES ('q1', 'https://fcm.googleapis.com/phone', 'subscriptions', '{}', 60, 0, ${now}, 'm1', 's1', 'x');
  `);
  await createApp({ db, config: { adminKey: "k".repeat(20) } }).ready();
  assert.equal(sqlite.prepare("SELECT value FROM settings WHERE key = 'schema'").get().value, String(SCHEMA_VERSION));
  assert.deepEqual({ ...sqlite.prepare("SELECT * FROM subscriptions").get() }, { endpoint: "https://fcm.googleapis.com/phone", member_id: "m1", subscription: "{}", session_token: "s1" });
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM push_outbox").get().n, 1, "queued pushes survive the rebuild");
  // The same phone now carries the second account too.
  sqlite.exec("INSERT INTO subscriptions (endpoint, member_id, subscription, session_token) VALUES ('https://fcm.googleapis.com/phone', 'm2', '{}', 's2')");
  assert.throws(() => sqlite.exec("INSERT INTO subscriptions (endpoint, member_id, subscription, session_token) VALUES ('https://fcm.googleapis.com/phone', 'm2', '{}', 's2')"), /UNIQUE/);
  // Dropping the second account's row leaves the first account's queued push alone…
  sqlite.exec("DELETE FROM subscriptions WHERE member_id = 'm2'");
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM push_outbox").get().n, 1);
  // …and ending a session still takes its subscription and queued pushes with it.
  sqlite.exec("DELETE FROM sessions WHERE token = 's1'");
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM subscriptions").get().n, 0);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM push_outbox").get().n, 0);
  assert.deepEqual(
    sqlite.prepare("SELECT name FROM sqlite_master WHERE tbl_name = 'subscriptions' AND type IN ('index', 'trigger') AND sql IS NOT NULL ORDER BY name").all().map((r) => r.name),
    ["subscriptions_member", "subscriptions_outbox_delete", "subscriptions_outbox_rebind", "subscriptions_session"],
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

test("day streaks: one missed day a week is bridged by a freeze", () => {
  // A Monday: weeks start on the days where (day + 3) % 7 is 0.
  const mon = 20454 - ((20454 + 3) % 7);
  const days = (...list) => new Set(list.map((d) => mon + d));
  assert.deepEqual(dayStreak(days(0, 1, 2), mon + 2), { count: 3, frozen: 0 });
  assert.deepEqual(dayStreak(days(0, 2, 3), mon + 3), { count: 3, frozen: 1 }, "Tuesday missed, bridged");
  assert.deepEqual(dayStreak(days(0, 2, 4), mon + 4).count, 2, "two misses in one week break it");
  assert.deepEqual(dayStreak(days(0, 2, 3, 4, 5, 6, 8, 9), mon + 9), { count: 8, frozen: 2 }, "one freeze in each week");
  assert.equal(dayStreak(days(0, 1), mon + 2).count, 2, "today can still be empty");
  assert.deepEqual(dayStreak(days(0, 1), mon + 3), { count: 2, frozen: 1 }, "yesterday missed: still alive");
  assert.equal(dayStreak(days(0, 1), mon + 4).count, 0, "two missed days end it");
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
  assert.deepEqual(s.focus.streak, { current: 4, best: 4, frozen: 0 });
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
  assert.deepEqual(RARE.map((i) => i.id), ["fener", "sera", "agacevi", "japoncay", "sudegirmeni", "istasyon", "planetaryum", "kristalkutuphane", "kapadokya", "yuzenev", "asmakopru", "kervansaray", "mardinevi", "atakule", "kugulupark"]);
  // Weekly buildings: on sale for a fortnight from their Monday, then by blueprint only.
  const post = BY_ID.postane, DAY = 86400000;
  assert.deepEqual([post.since - 1, post.since, post.since + 13 * DAY, post.since + 14 * DAY].map((t) => stateOf(post, t)), ["soon", "new", "new", "locked"]);
  assert.equal(stateOf(post, post.since + 20 * DAY, ["postane"]), "open");
  assert.ok(!blueprintPool(post.since).includes(post) && blueprintPool(post.since + 15 * DAY).includes(post));
  assert.equal(stateOf(BY_ID.gozlemevi, 0), "hidden");
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

test("n44: a monument already in the village moves to the centre of a district of its own", async () => {
  const { monumentCells } = await import("../shared/village.js");
  const sqlite = new DatabaseSync(":memory:");
  const db = sqliteAdapter(sqlite);
  for (const [i, statements] of migrations.slice(0, 27).entries())
    await db.batch([
      ...statements.map((sql) => [sql, []]),
      ["INSERT INTO settings (key, value) VALUES ('schema', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [String(i + 1)]],
    ]);
  sqlite.exec(`
    INSERT INTO groups (id, name, invite) VALUES ('g', 'Tayfa', 'invite-123456789012');
    INSERT INTO members (id, group_id, token, name, avatar, color, joined, updated) VALUES ('m1', 'g', 't1', 'Elif', '🍒', 'pink', 1, 1);
  `);
  const insert = sqlite.prepare("INSERT INTO buildings (id, member_id, group_id, kind, model, minutes, seed, created) VALUES (?, 'm1', 'g', ?, ?, 75, ?, ?)");
  ["ev", "konak", "anitkabir", "kule"].forEach((model, i) => insert.run(`b${i}`, BY_ID[model].kind, model, i, 100 + i));
  // Placed the way it was before n44: squeezed between the houses.
  sqlite.prepare("UPDATE settings SET value = '27' WHERE key = 'schema'").run();
  await createApp({ db, config: { adminKey: "k".repeat(20) } }).ready();
  const where = () => sqlite.prepare("SELECT b.id, b.model, b.pos_x AS x, b.pos_y AS y, b.district_id AS districtId, d.dx AS q, d.dy AS r FROM buildings b JOIN districts d ON d.id = b.district_id ORDER BY b.created").all();
  let rows = where();
  const anit = rows.find((b) => b.model === "anitkabir");
  assert.equal(rows.filter((b) => b.districtId === anit.districtId).length, 1, "alone in its district");
  assert.ok(Math.hypot(anit.x - cellLayout("g", anit.q, anit.r).center[0], anit.y - cellLayout("g", anit.q, anit.r).center[1]) < 0.05, "on its centre");
  // An old placement (before migration 28) is lifted and placed again.
  const home = rows.find((b) => b.model === "ev");
  sqlite.prepare("UPDATE buildings SET pos_x = ?, pos_y = ?, district_id = ? WHERE id = ?").run(home.x + 5, home.y, home.districtId, anit.id);
  // Replay migration 28 alone; later additive migrations are already installed.
  for (const sql of migrations[27]) await db.run(sql);
  await createApp({ db, config: { adminKey: "k".repeat(20) } }).ready();
  rows = where();
  const moved = rows.find((b) => b.model === "anitkabir");
  assert.equal(monumentCells("g", rows.map((b) => [b.q, b.r]), rows).size, 1);
  assert.equal(rows.filter((b) => b.districtId === moved.districtId).length, 1);
  const counts = sqlite.prepare("SELECT SUM(buildings) AS n FROM districts").get().n;
  assert.equal(counts, 4, "districts recounted");
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

test("the week: Haftanın Ustası is crowned once, and the shared monument pays everyone", async () => {
  const { sqlite, app, headers } = await auditFixture();
  const me = sqlite.prepare("SELECT id FROM members").get().id;
  const week = weekStart(Date.now());
  // Last week: two hours of focus. (The group's first read already looked at an empty last week.)
  sqlite.prepare("INSERT INTO focus_log (id, member_id, minutes, created, strict) VALUES (?, ?, ?, ?, 0)").run("w1", me, 120, week - 2 * 86400000);
  sqlite.exec("DELETE FROM weekly");
  const crowned = (await call(app, "/state", { headers })).data;
  assert.deepEqual(crowned.week.master, { memberId: me, minutes: 120 });
  await call(app, "/state", { headers });
  assert.equal(sqlite.prepare("SELECT bricks FROM members").get().bricks, 50, "crowned exactly once");
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM unlocks WHERE source = 'master'").get().n, 1, "with a blueprint");
  assert.ok(crowned.messages.some((m) => m.text.startsWith("geçen haftanın ustası oldu 👑")));
  // This week: 580 minutes already; a 25-minute session crosses the 600 goal of a team of one.
  assert.equal(crowned.week.goal, 600);
  sqlite.prepare("INSERT INTO focus_log (id, member_id, minutes, created, strict) VALUES (?, ?, ?, ?, 0)").run("w2", me, 580, week + 1000);
  await call(app, "/focus", { method: "POST", headers, body: { action: "start", model: "kulube", strict: true } });
  sqlite.prepare("UPDATE members SET focus_end = ?, focus_beat = ?").run(Date.now() - 1000, Date.now() - 1000);
  const done = (await call(app, "/state", { headers })).data;
  assert.equal(done.week.monument.by, me);
  assert.equal(sqlite.prepare("SELECT SUM(delta) AS d FROM bricks_log WHERE reason = 'monument'").get().d, 50);
  assert.equal((await call(app, "/village", { headers })).data.monument, 1);
  assert.ok(done.messages.some((m) => m.text.startsWith("haftanın ortak anıtını tamamladı 🏛️")));
});

test("sessions that end together get one board line, rewritten as more settle", async () => {
  const { sqlite, app, headers } = await auditFixture();
  const invite = sqlite.prepare("SELECT invite FROM groups").get().invite;
  const second = await call(app, "/join", { method: "POST", body: { invite, name: "İkinci", username: "ikinci", password: "test123" } });
  assert.equal(second.status, 201);
  const end = Date.now() - 1000;
  sqlite.prepare("UPDATE members SET focus_end = ?, focus_minutes = 25, focus_strict = 0, focus_beat = ?").run(end, end);
  const s = (await call(app, "/state", { headers })).data;
  const line = s.messages.find((m) => m.id.startsWith("together-"));
  assert.ok(line && / ile birlikte 25 dk çalıştı 🤝$/.test(line.text), line?.text);
});

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

test("joining a friend's session needs twenty minutes and cannot grant short-session rewards", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const app = createApp({ db: sqliteAdapter(sqlite) });
  const ada = await call(app, "/groups", { method: "POST", body: { name: "Ada", username: "ada_d28", password: "join-pass-1" } });
  const invite = sqlite.prepare("SELECT invite FROM groups").get().invite;
  const join = (name, username) => call(app, "/join", { method: "POST", body: { invite, name, username, password: "join-pass-2" } });
  const bora = await join("Bora", "bora_d28"), cem = await join("Cem", "cem_d28");
  const focus = (cookie, body) => call(app, "/focus", { method: "POST", headers: { Cookie: cookie }, body });
  assert.equal((await focus(ada.cookie, { action: "start", minutes: 25 })).status, 200);
  const adaId = sqlite.prepare("SELECT id FROM members WHERE username = 'ada_d28'").get().id;
  sqlite.prepare("UPDATE members SET focus_end = ? WHERE id = ?").run(Date.now() + 21 * 60000, adaId);
  assert.equal((await focus(bora.cookie, { action: "start", joinMember: adaId })).status, 200, "21 minutes left: watched free focus can qualify");
  sqlite.prepare("UPDATE members SET focus_end = ? WHERE id = ?").run(Date.now() + 4 * 60000, adaId);
  const late = await focus(cem.cookie, { action: "start", joinMember: adaId });
  assert.equal(late.status, 400, "four minutes left: no bonus for a last-minute join");
  assert.match(late.data.error, /en az 20 dakika/);
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
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM messages WHERE kind = 'system' AND text = 'gizli bir rozet buldu 🤫'").get().n, 1, "one secret Pano line");
  assert.equal((await earn("made-up")).status, 400);
  assert.equal((await call(app, "/leave", { method: "POST", headers: { Cookie: friend.cookie }, body: {} })).status, 200);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM achievements").get().n, 0, "leaving removes badges too");
});

// ---------- n28: the week's story ----------
const H = 3600000,
  D = 24 * H;

test("the week's story is told from Sunday 18:00, and weeks follow Türkiye time (n28)", () => {
  const monday = Date.parse("2026-10-11T21:00:00Z"); // Monday 12 Oct, 00:00 in Istanbul
  assert.equal(weekOf(monday), monday);
  assert.equal(weekOf(monday + 7 * D - 1), monday, "Sunday 23:59 is the same week");
  assert.equal(weekOf(Date.parse("2026-10-14T10:00:00Z")), weekStart(Date.parse("2026-10-14T10:00:00Z")));
  assert.equal(storyWeek(monday + 6 * D + 18 * H - 1), monday - 7 * D, "Sunday 17:59: last week's story");
  assert.equal(storyWeek(monday + 6 * D + 18 * H), monday, "Sunday 18:00: this week's story");
  assert.equal(storyWeek(monday + 7 * D + H), monday, "Monday: the week that just ended");
});

test("the week's story: totals, the people who stood out and a card for me (n28)", () => {
  const start = Date.parse("2026-10-11T21:00:00Z"),
    at = (day, hour, min = 0) => start + day * D + hour * H + min * 60000; // Istanbul clock
  const members = [{ id: "ada" }, { id: "bora" }, { id: "cem" }];
  const focus = [
    // Ada: three mornings, one long session.
    { memberId: "ada", minutes: 50, created: at(0, 8, 50) },
    { memberId: "ada", minutes: 120, created: at(1, 12) },
    { memberId: "ada", minutes: 40, created: at(2, 8, 40) },
    // Bora: late nights.
    { memberId: "bora", minutes: 60, created: at(0, 23) },
    { memberId: "bora", minutes: 45, created: at(4, 23, 30) },
    // Someone who left the team is not in the story.
    { memberId: "gone", minutes: 600, created: at(3, 12) },
  ];
  const arrivals = [
    { memberId: "bora", created: at(0, 9) },
    { memberId: "bora", created: at(0, 15) },
    { memberId: "bora", created: at(2, 9) },
    { memberId: "bora", created: at(3, 9) },
    { memberId: "ada", created: at(1, 9) },
    { memberId: "gone", created: at(1, 9) },
  ];
  const days = new Map([
    ["ada", [-2, -1, 0, 1, 2, 3, 4, 5, 6].map((d) => at(d, 12))],
    ["bora", [at(0, 23), at(4, 23)]],
  ]);
  const story = storyOf({
    start,
    now: start + 8 * D,
    members,
    focus,
    previous: 200,
    arrivals,
    buildings: [
      { memberId: "ada", model: "kule", likes: 2 },
      { memberId: "ada", model: "kulube", likes: 0 },
      { memberId: "bora", model: "sahaf", likes: 3 },
    ],
    days,
    messages: 12,
    master: null,
    monument: true,
    meId: "bora",
  });
  assert.equal(story.week.complete, true);
  assert.equal(story.team.minutes, 315);
  assert.equal(story.team.sessions, 5);
  assert.equal(story.team.people, 2);
  assert.equal(story.team.size, 3);
  assert.equal(story.team.previous, 200);
  assert.deepEqual(story.team.days, [110, 120, 40, 0, 45, 0, 0]);
  assert.equal(story.team.visits, 5);
  assert.deepEqual(story.master, { id: "ada", minutes: 210 });
  assert.equal(story.crowned, false);
  assert.deepEqual(story.regular, { id: "bora", days: 3, visits: 4, on: [0, 2, 3] });
  assert.deepEqual(story.streak, { id: "ada", days: 9 }, "the streak as it stood when the week ended");
  assert.deepEqual(story.owl, { id: "bora", minutes: 105 }, "sessions begun after 21:00");
  assert.deepEqual(story.lark, { id: "ada", minutes: 90 }, "sessions begun between 05:00 and 09:00");
  assert.equal(story.longest.id, "ada");
  assert.equal(story.longest.minutes, 120);
  assert.deepEqual(story.village, { built: 3, builder: { id: "ada", n: 2 }, monument: true, liked: { id: "bora", model: "sahaf", likes: 3 } });
  assert.deepEqual(story.me, { minutes: 105, sessions: 2, days: 2, on: [0, 4], visits: 3, streak: 1, built: 1, bestDay: { day: 0, minutes: 60 }, peakHour: 22, share: 33, rank: 2, partner: null });
  assert.equal(story.duo, null, "nobody focused at the same time");

  // The crowned Haftanın Ustası wins over a recount; a quiet week leaves cards out.
  const crowned = storyOf({ start, now: start + 8 * D, members, focus, previous: 0, arrivals, buildings: [], days, messages: 0, master: { memberId: "bora", minutes: 105 }, monument: false, meId: "cem" });
  assert.deepEqual(crowned.master, { id: "bora", minutes: 105 });
  assert.equal(crowned.crowned, true);
  assert.equal(crowned.village, null);
  assert.equal(crowned.me.minutes, 0);
  assert.equal(crowned.me.rank, null);
  const quiet = storyOf({ start, now: start + 3 * D, members, focus: [], previous: 0, arrivals: [], buildings: [], days: new Map(), messages: 0, master: null, monument: false, meId: "ada" });
  assert.equal(quiet.week.complete, false);
  assert.equal(quiet.team.minutes, 0);
  for (const card of ["master", "regular", "streak", "owl", "lark", "longest", "village"]) assert.equal(quiet[card], null, card);
});

test("the story route answers for the asker's team only, and Sunday 18:00 tells each team once (n28)", async (t) => {
  const sqlite = new DatabaseSync(":memory:");
  const app = createApp({ db: sqliteAdapter(sqlite), config: { adminKey: "k".repeat(24), pushExtraHosts: "push.kutup.test" } });
  const ada = await call(app, "/groups", { method: "POST", body: { name: "Ada", groupName: "Gece kuşları", username: "ada_story", password: "story-123" } });
  const invite = (await call(app, "/session", { headers: { Cookie: ada.cookie } })).data.group.invite;
  const bora = await call(app, "/join", { method: "POST", body: { invite, name: "Bora", username: "bora_story", password: "story-123" } });
  const other = await call(app, "/groups", { method: "POST", body: { name: "Ece", groupName: "Başka ekip", username: "ece_story", password: "story-123" } });
  const id = (who) => sqlite.prepare("SELECT id FROM members WHERE name = ?").get(who).id;
  const week = storyWeek(Date.now()) - 7 * D;
  const log = sqlite.prepare("INSERT INTO focus_log (id, member_id, minutes, created, strict) VALUES (?, ?, ?, ?, 0)");
  log.run("f1", id("Ada"), 90, week + D + 12 * H);
  log.run("f2", id("Bora"), 30, week + 2 * D + 12 * H);
  log.run("f3", id("Ece"), 500, week + 2 * D + 12 * H);
  log.run("f4", id("Ada"), 25, week - D); // the week before

  const asked = await call(app, `/story?week=${week}`, { headers: { Cookie: bora.cookie } });
  assert.equal(asked.status, 200);
  assert.equal(asked.data.team.minutes, 120, "another team's focus is not counted");
  assert.equal(asked.data.team.previous, 25);
  assert.equal(asked.data.master.id, id("Ada"));
  assert.equal(asked.data.me.minutes, 30);
  assert.equal(asked.data.me.rank, 2);
  assert.equal((await call(app, "/story", { headers: { Cookie: other.cookie } })).status, 200);
  assert.equal((await call(app, "/story")).status, 401);
  for (const bad of [week + 7 * D + 7 * D, week + 1, week - 9 * 7 * D, "abc"])
    assert.equal((await call(app, `/story?week=${bad}`, { headers: { Cookie: ada.cookie } })).status, 404, String(bad));

  // Sunday 18:00: the story is ready. Bora's phone hears it once; Ece's team did not focus.
  const receiver = pushReceiver();
  const session = sqlite.prepare("SELECT token FROM sessions WHERE member_id = ?").get(id("Bora")).token;
  sqlite.prepare("INSERT INTO subscriptions (endpoint, member_id, subscription, session_token) VALUES (?, ?, ?, ?)").run(
    "https://push.kutup.test/bora",
    id("Bora"),
    JSON.stringify(receiver.subscription("https://push.kutup.test/bora")),
    session,
  );
  const thisWeek = week + 7 * D;
  log.run("f5", id("Bora"), 45, thisWeek + 2 * D);
  const sent = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    sent.push({ url, payload: JSON.parse(receiver.decrypt(new Uint8Array(await new Response(init.body).arrayBuffer()))) });
    return new Response(null, { status: 201 });
  });
  const realNow = Date.now;
  const tick = async () => {
    const pending = [];
    await app.tick((p) => pending.push(p));
    await Promise.all(pending);
  };
  try {
    Date.now = () => thisWeek + 6 * D + 17 * H;
    await tick();
    assert.equal(sent.length, 0, "not before Sunday 18:00");
    Date.now = () => thisWeek + 6 * D + 18 * H + 60000;
    await tick();
    await tick();
  } finally {
    Date.now = realNow;
  }
  const stories = sent.filter((p) => p.payload.title?.includes("Haftanın hikâyesi"));
  assert.equal(stories.length, 1, "once per team and week");
  assert.equal(stories[0].url, "https://push.kutup.test/bora");
  assert.equal(stories[0].payload.url, "/?story=1");
  assert.match(stories[0].payload.body, /0,8 saat odak/);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM weekly WHERE kind = 'story'").get().n, 1);
});

// ---------- Çalışma eşi ----------
test("study partners: shared days follow the İmece rule, the best pair focuses most per day together", () => {
  const start = Date.parse("2026-10-11T21:00:00Z"),
    at = (day, hour, min = 0) => start + day * D + hour * H + min * 60000; // Istanbul clock
  const ids = ["ada", "bora", "cem", "deniz"];
  const focus = [
    // Ada and Bora side by side on three days; on those days Ada does 3 hours.
    ...[0, 1, 2].flatMap((d) => [
      { memberId: "ada", minutes: 90, created: at(d, 11) },
      { memberId: "ada", minutes: 90, created: at(d, 15) },
      { memberId: "bora", minutes: 60, created: at(d, 11) },
    ]),
    // Ada alone on two other days: an hour each.
    { memberId: "ada", minutes: 60, created: at(4, 10) },
    { memberId: "ada", minutes: 60, created: at(5, 10) },
    // Cem overlaps Ada for less than half of either session: not together.
    { memberId: "cem", minutes: 100, created: at(4, 10, 50) },
    // Cem and Deniz: three shared days, but little focus on them.
    ...[0, 1, 2].flatMap((d) => [
      { memberId: "cem", minutes: 25, created: at(d, 20) },
      { memberId: "deniz", minutes: 25, created: at(d, 20, 5) },
    ]),
    // Someone who left is never anyone's partner.
    { memberId: "gone", minutes: 90, created: at(4, 10) },
  ];
  const p = partnersOf({ focus, ids, min: 3 });
  // Ada 180 a day, Bora 60 a day on their shared days: 120 per person per day.
  assert.deepEqual(p.duo, { ids: ["ada", "bora"], days: 3, together: 180, daily: 120 });
  assert.deepEqual(p.of("ada"), { id: "bora", days: 3, together: 180, daily: 180, usual: 60 });
  assert.deepEqual(p.of("bora"), { id: "ada", days: 3, together: 180, daily: 60, usual: null }, "no other days to compare with");
  assert.deepEqual(p.of("cem"), { id: "deniz", days: 3, together: 60, daily: 25, usual: null });
  assert.equal(partnersOf({ focus, ids, min: 4 }).duo, null, "too few shared days");
  assert.equal(partnersOf({ focus, ids, min: 3 }).of("gone"), null);
  // A short session inside a long one: together for the short one, and that day counts.
  const inside = partnersOf({ focus: [{ memberId: "ada", minutes: 120, created: at(0, 12) }, { memberId: "bora", minutes: 25, created: at(0, 11) }], ids, min: 1 });
  assert.deepEqual(inside.duo, { ids: ["ada", "bora"], days: 1, together: 25, daily: 73 });

  // The week's story names the duo, and the asker's own partner.
  const story = storyOf({ start, now: start + 8 * D, members: ids.map((id) => ({ id })), focus, previous: 0, arrivals: [], buildings: [], days: new Map(), messages: 0, master: null, monument: false, meId: "bora" });
  assert.deepEqual(story.duo, { ids: ["ada", "bora"], days: 3, together: 180, daily: 120 });
  assert.equal(story.me.partner.id, "ada");
});

test("your study partner shows on your own statistics only", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const app = createApp({ db: sqliteAdapter(sqlite), config: { adminKey: "k".repeat(24) } });
  const ada = await call(app, "/groups", { method: "POST", body: { name: "Ada", groupName: "Eşler", username: "ada_partner", password: "partner-123" } });
  const invite = (await call(app, "/session", { headers: { Cookie: ada.cookie } })).data.group.invite;
  const bora = await call(app, "/join", { method: "POST", body: { invite, name: "Bora", username: "bora_partner", password: "partner-123" } });
  const log = sqlite.prepare("INSERT INTO focus_log (id, member_id, minutes, created, strict) VALUES (?, ?, ?, ?, 0)");
  const now = Date.now();
  const mine = () => call(app, `/stats/${ada.data.memberId}`, { headers: { Cookie: ada.cookie } });
  assert.equal((await mine()).data.partner, null, "no partner yet, but the line is there");
  for (const d of [1, 2, 3]) {
    log.run(`a${d}`, ada.data.memberId, 50, now - d * D);
    log.run(`b${d}`, bora.data.memberId, 50, now - d * D + 60000);
  }
  log.run("old", bora.data.memberId, 50, now - 40 * D); // outside the 30 days
  const own = (await mine()).data.partner;
  assert.equal(own.id, bora.data.memberId);
  assert.equal(own.days, 3);
  assert.equal(own.member.name, "Bora");
  const theirs = await call(app, `/stats/${bora.data.memberId}`, { headers: { Cookie: ada.cookie } });
  assert.equal(theirs.status, 200);
  assert.equal("partner" in theirs.data, false, "nobody sees someone else's partner");
});

test("the desk map: numbered chairs, typed desks placed, the rest listed (n30)", () => {
  const [adnan, mujgan] = ROOMS;
  assert.equal(roomOf("Adnan Ötüken Okuma Salonu"), adnan);
  assert.equal(roomOf("Kafeterya"), null);
  assert.equal(seatsOf(adnan), 425);
  assert.equal(seatsOf(mujgan), 36);
  const tables = tablesOf(mujgan);
  assert.deepEqual(tablesOf(adnan), []);
  assert.deepEqual(tables[0][0], { number: 1, top: [1, 2, 3], bottom: [4, 5, 6] });
  assert.deepEqual(tables[0][1], { number: 2, top: [7, 8, 9], bottom: [10, 11, 12] });
  assert.equal(tables.at(-1).at(-1).bottom.at(-1), 36);
  assert.deepEqual(tables.flat().flatMap((t) => [...t.top, ...t.bottom]), Array.from({ length: 36 }, (_, i) => i + 1));
  for (const [typed, n] of [["24", 24], [" masa 7", 7], ["Masa12", 12], ["no. 3", 3], ["#9", 9], ["24 pencere yanı", 24], ["pencere yanı", null], ["2. kat 14", null], ["0", null], ["61", 61], ["425", 425], ["426", null], ["1234", null], ["", null], [null, null]])
    assert.equal(deskNumber(typed, adnan), n, String(typed));
  assert.equal(deskNumber("40", mujgan), null);
  const members = [
    { id: "a", status: "here", location: adnan.name, desk: "14" },
    { id: "b", status: "break", location: adnan.name, desk: "14" },
    { id: "c", status: "here", location: adnan.name, desk: "pencere yanı" },
    { id: "d", status: "coming", location: adnan.name, desk: "3" },
    { id: "e", status: "away", location: adnan.name, desk: "5" },
    { id: "f", status: "here", location: mujgan.name, desk: "5" },
    { id: "g", status: "here", location: "Kafeterya", desk: "" },
    { id: "h", status: "here", location: "", desk: "" },
  ];
  const { desks, loose } = seating(members, adnan);
  assert.deepEqual([...desks.keys()], [14]);
  assert.deepEqual(desks.get(14).map((x) => x.id), ["a", "b"]);
  assert.deepEqual(loose.map((x) => x.id), ["c"]);
  assert.deepEqual(elsewhere(members).map((x) => x.id), ["g", "h"]);
  assert.equal(headcount(members, adnan), 3);
  assert.equal(headcount(members, mujgan), 1);
});

test("Adnan's supplied plan retains 425 unique individual seats and source landmarks", () => {
  const plan = ROOMS[0].plan;
  assert.deepEqual(plan.seats.map((seat) => seat.number), Array.from({ length: 425 }, (_, i) => i + 1));
  for (const seat of plan.seats) {
    assert.ok(seat.width * 1.8 >= 44 && seat.height * 1.8 >= 44, `touch size: ${seat.number}`);
    assert.ok(seat.x >= 0 && seat.y >= 0 && seat.x + seat.width <= plan.width && seat.y + seat.height <= plan.height);
  }
  // These anchors cover opposite ends and the vertical bank in the supplied JSON.
  assert.deepEqual(plan.seats[0], { number: 1, x: 108, y: 1182, width: 52.2, height: 25 });
  assert.deepEqual(plan.seats[80], { number: 81, x: 468, y: 117, width: 36, height: 46.4 });
  assert.deepEqual(plan.seats[424], { number: 425, x: 1750.333, y: 1218.333, width: 76.667, height: 26 });
  assert.deepEqual(plan.entrance, { x: 1442, y: 1210 });
  assert.equal(plan.corridors.length, 3);
  const occupant = { id: "last", status: "here", location: ROOMS[0].name, desk: "425 pencere yanı" };
  assert.deepEqual(seating([occupant], ROOMS[0]).desks.get(425), [occupant]);
});

// ---------- n14: achievements ----------
test("achievements are worked out from the logs, with the moment each was earned (n14)", () => {
  const monday = Date.UTC(2026, 9, 5) - 3 * H; // Monday 5 Oct 2026, 00:00 in Türkiye
  const at = (day, hour, minute = 0) => monday + day * D + hour * H + minute * 60000;
  const none = { focus: [], buildings: [], ledger: [], masters: [], arrivals: [], messages: [], stored: [], now: at(40, 12) };
  const empty = achievementsOf(none);
  assert.deepEqual(empty.map((a) => a.key), ACHIEVEMENTS.map((a) => a.key));
  assert.ok(empty.every((a) => a.at === null && a.have === 0));

  // Eight days in a row (one day skipped is bridged by the week's freeze), sessions ending at 10:00.
  const focus = [];
  for (const d of [0, 1, 2, 4, 5, 6, 7, 8]) focus.push({ minutes: 50, created: at(d, 10) });
  focus.push({ minutes: 200, created: at(8, 15) }); // 250 that day: a marathon
  for (let i = 0; i < 5; i++) focus.push({ minutes: 40, created: at(10 + i, 8, 30) }); // began 07:50
  for (let i = 0; i < 4; i++) focus.push({ minutes: 45, created: at(10 + i, 23, 50) }); // began 23:05
  focus.push({ minutes: 20, created: at(15, 22) }); // too short to count as a night session
  focus.sort((a, b) => a.created - b.created);
  const models = ["kulube", "bostan", "cicekci", "kahve", "ev", "sahaf", "firin", "konak", "kulube"];
  const buildings = models.map((model, i) => ({ model, likes: i === 3 ? 5 : 1, created: at(20 + i, 18) }));
  const ledger = [
    ...Array.from({ length: 10 }, (_, i) => ({ reason: "imece", created: at(21 + i, 12) })),
    { reason: "monument", created: at(27, 19) },
  ];
  const arrivals = Array.from({ length: 22 }, (_, i) => ({ created: at(Math.floor(i / 1.1), 9) }));
  const messages = [
    { text: "Selam", created: at(30, 9) },
    { text: "SESSİZ OLUN", created: at(31, 9) },
    { text: " Çay ", created: at(32, 9) },
  ];
  const list = achievementsOf({ focus, buildings, ledger, masters: [{ created: at(14, 0, 5) }], arrivals, messages, stored: [{ key: "black-hole", created: at(3, 3) }], now: at(40, 12) });
  const got = Object.fromEntries(list.map((a) => [a.key, a]));
  assert.equal(got["first-build"].at, at(20, 18));
  assert.equal(got["week-streak"].at, at(7, 10), "the seventh day of focus: the skipped day is bridged, not counted");
  assert.equal(got["month-streak"].at, null);
  assert.equal(got["month-streak"].have, 0, "the streak is over by day 40");
  assert.equal(got.marathon.at, at(8, 15));
  assert.equal(got.early.at, at(14, 8, 30));
  assert.equal(got.night.at, null, "four long night sessions; the short one does not count");
  assert.equal(got.night.have, 4);
  assert.equal(got.hundred.at, null);
  assert.equal(got.hundred.have, 50 * 8 + 200 + 40 * 5 + 45 * 4 + 20);
  assert.equal(got.collector.at, at(27, 18), "the eighth kind");
  assert.equal(got.loved.at, at(40, 12), "likes carry no time: earned when first seen");
  assert.equal(got.imece.at, at(30, 12));
  assert.equal(got.master.at, at(14, 0, 5));
  assert.equal(got.monument.at, at(27, 19));
  assert.equal(got.regular.at, at(19, 9), "the twentieth library day");
  assert.equal(got.shush.at, at(31, 9));
  assert.equal(got.tea.at, at(32, 9));
  assert.equal(got["black-hole"].at, at(3, 3));

  // Once earned, kept: the stored moment wins even when the logs no longer show it.
  const kept = achievementsOf({ ...none, stored: [{ key: "first-build", created: at(1, 1) }] });
  assert.equal(kept.find((a) => a.key === "first-build").at, at(1, 1));

  assert.ok(shouting("SESSİZ OLUN") && !shouting("Sessiz") && !shouting("OK!") && !shouting("😀😀😀"));
  assert.ok(teaCall("çay") && teaCall(" ÇAY ") && !teaCall("çay?") && !teaCall("çay içelim"));
});

test("the achievements route answers for the team, and keeps what was earned (n14)", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const app = createApp({ db: sqliteAdapter(sqlite), config: { adminKey: "k".repeat(24) } });
  const ada = await call(app, "/groups", { method: "POST", body: { name: "Ada", groupName: "Rozetler", username: "ada_badge", password: "badge-123" } });
  const invite = (await call(app, "/session", { headers: { Cookie: ada.cookie } })).data.group.invite;
  const bora = await call(app, "/join", { method: "POST", body: { invite, name: "Bora", username: "bora_badge", password: "badge-123" } });
  const other = await call(app, "/groups", { method: "POST", body: { name: "Ece", groupName: "Başka", username: "ece_badge", password: "badge-123" } });
  const now = Date.now();
  sqlite.prepare("INSERT INTO focus_log (id, member_id, minutes, created, strict) VALUES (?, ?, ?, ?, 0)").run("f1", ada.data.memberId, 250, now - H);
  const list = async (who, id) => call(app, `/achievements/${id}`, { headers: { Cookie: who.cookie } });
  const seen = await list(bora, ada.data.memberId);
  assert.equal(seen.status, 200);
  const marathon = seen.data.list.find((a) => a.key === "marathon");
  assert.equal(marathon.at, now - H, "earned by the session that tipped it over");
  assert.equal(seen.data.list.find((a) => a.key === "hundred").have, 250);
  assert.equal(sqlite.prepare("SELECT created FROM achievements WHERE member_id = ? AND key = 'marathon'").get(ada.data.memberId).created, now - H, "written down");
  const news = (id) => sqlite.prepare("SELECT text FROM messages WHERE member_id = ? AND kind = 'system' ORDER BY created").all(id).map((m) => m.text).filter((t) => t.includes("rozet"));
  assert.deepEqual(news(ada.data.memberId), ["“Maraton” rozetini kazandı 🏅"], "a new badge is Pano news");
  await list(ada, ada.data.memberId);
  assert.equal(news(ada.data.memberId).length, 1, "announced once");
  sqlite.prepare("DELETE FROM focus_log").run();
  assert.notEqual((await list(ada, ada.data.memberId)).data.list.find((a) => a.key === "marathon").at, null, "kept once earned");
  assert.equal((await list(other, ada.data.memberId)).status, 404, "another team cannot look");
  assert.equal((await call(app, `/achievements/${ada.data.memberId}`)).status, 401);
  await call(app, "/messages", { method: "POST", headers: { Cookie: bora.cookie }, body: { text: "çay" } });
  assert.notEqual((await list(bora, bora.data.memberId)).data.list.find((a) => a.key === "tea").at, null);
  assert.deepEqual(news(bora.data.memberId), ["gizli bir rozet buldu 🤫"], "a hidden badge keeps its secret");

  // The past counted at once (old sessions, or many badges together) stays quiet.
  const old = now - 40 * 24 * H;
  for (let i = 0; i < 5; i++) sqlite.prepare("INSERT INTO focus_log (id, member_id, minutes, created, strict) VALUES (?, ?, ?, ?, 0)").run(`o${i}`, other.data.memberId, 50, old - (4 - i) * 24 * H);
  await list(other, other.data.memberId);
  assert.equal(news(other.data.memberId).length, 0, "old badges are not news");
});

test("changing a username or password needs the current password; wrong ones are counted (d23)", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const app = createApp({ db: sqliteAdapter(sqlite) });
  const me = await call(app, "/groups", { method: "POST", body: { name: "Ada", username: "ada_d23", password: "first-pass-1" } });
  const account = (body) => call(app, "/account", { method: "POST", headers: { Cookie: me.cookie }, body });
  assert.equal((await account({ username: "ada_d23", password: "taken-over-1" })).status, 403, "an unlocked phone is not enough");
  assert.equal((await account({ username: "ada_new", current: "yanlis-12" })).status, 403, "a new username needs it too");
  assert.equal((await account({ username: "ada_d23" })).status, 200, "saving nothing new needs nothing");
  const changed = await account({ username: "ada_new", password: "second-pass-2", current: "first-pass-1" });
  assert.deepEqual(changed.data, { ok: true, username: "ada_new" });
  assert.equal((await call(app, "/login", { method: "POST", body: { username: "ada_new", password: "second-pass-2" } })).status, 200);
  for (let i = 0; i < 4; i++) await account({ username: "ada_x", current: "guess-123" });
  assert.equal((await account({ username: "ada_x", current: "guess-123" })).status, 429, "guessing the current password is limited");

  // Login: a username takes at most 30 wrong passwords an hour, even when the
  // per-minute buckets keep emptying; the right password waits out the hour too.
  const wrongKey = createHash("sha256").update("wrong:ada_new").digest("hex");
  const login = (password) => call(app, "/login", { method: "POST", body: { username: "ada_new", password } });
  for (let i = 0; i < 30; i++) {
    sqlite.prepare("UPDATE auth_limits SET expires = 0 WHERE key <> ?").run(wrongKey);
    assert.equal((await login(`wrong-${i}-pass`)).status, 401);
  }
  sqlite.prepare("UPDATE auth_limits SET expires = 0 WHERE key <> ?").run(wrongKey);
  const locked = await login("second-pass-2");
  assert.equal(locked.status, 429);
  assert.match(locked.data.error, /Batur’dan kod iste/);
  sqlite.prepare("UPDATE auth_limits SET expires = 0").run();
  assert.equal((await login("second-pass-2")).status, 200, "an hour later it opens");
  // Unknown usernames are answered the same way, after the same hashing work.
  assert.equal((await call(app, "/login", { method: "POST", body: { username: "nobody_here", password: "whatever-1" } })).status, 401);
});

test("one person cannot flood the team with board messages or plans (d23)", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const app = createApp({ db: sqliteAdapter(sqlite) });
  const me = await call(app, "/groups", { method: "POST", body: { name: "Can", username: "can_d23", password: "flood-pass-1" } });
  const post = (text) => call(app, "/messages", { method: "POST", headers: { Cookie: me.cookie }, body: { text } });
  for (let i = 0; i < 20; i++) assert.equal((await post(`not ${i}`)).status, 201);
  assert.equal((await post("bir tane daha")).status, 429);
  const plan = (n) => call(app, "/plans", { method: "POST", headers: { Cookie: me.cookie }, body: { starts: Date.now() + (n + 1) * 3600000, separate:true, note:`Ayrı çalışma grubu ${n}` } });
  for (let i = 0; i < 6; i++) assert.equal((await plan(i)).status, 201);
  assert.equal((await plan(7)).status, 429);
});

test("timer pushes sign with the address the app is served from (d23)", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const app = createApp({ db: sqliteAdapter(sqlite) });
  const pending = [];
  const visit = (origin) =>
    app.fetch(new Request(`${origin}/api/health`), { ip: "test", waitUntil: (p) => pending.push(p) });
  await visit("http://localhost:3001");
  await Promise.all(pending);
  assert.equal(sqlite.prepare("SELECT value FROM settings WHERE key = 'origin'").get(), undefined, "plain http is never remembered");
  await visit("https://kutup.example.dev");
  await Promise.all(pending);
  assert.equal(sqlite.prepare("SELECT value FROM settings WHERE key = 'origin'").get().value, "https://kutup.example.dev");
  await visit("https://kutup.example.dev");
  assert.equal(pending.length, 1, "written once, not on every request");
});

test("Hesap ve cihazlar signs the account out of its other devices; this one stays (d27)", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const app = createApp({ db: sqliteAdapter(sqlite) });
  const me = await call(app, "/groups", { method: "POST", body: { name: "Ece", username: "ece_d27", password: "devices-pass-1" } });
  const login = () => call(app, "/login", { method: "POST", body: { username: "ece_d27", password: "devices-pass-1" } });
  const laptop = await login(), tablet = await login();
  const invite = sqlite.prepare("SELECT invite FROM groups").get().invite;
  const friend = await call(app, "/join", { method: "POST", body: { invite, name: "Arda", username: "arda_d27", password: "devices-pass-2" } });
  const hash = (cookie) => createHash("sha256").update(cookie.split("=")[1]).digest("hex");
  const subscribe = sqlite.prepare("INSERT INTO subscriptions (endpoint, member_id, subscription, session_token) SELECT ?, member_id, '{}', token FROM sessions WHERE token = ?");
  subscribe.run("https://fcm.googleapis.com/fcm/send/mine", hash(me.cookie));
  subscribe.run("https://fcm.googleapis.com/fcm/send/laptop", hash(laptop.cookie));
  const devices = (cookie) => call(app, "/devices", { headers: { Cookie: cookie } });
  const session = (cookie) => call(app, "/session", { headers: { Cookie: cookie } });

  const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
  const windows = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";
  await call(app, "/session", { headers: { Cookie: laptop.cookie, "User-Agent": windows } });
  await call(app, "/session", { headers: { Cookie: tablet.cookie, "User-Agent": iphone } });
  const seen = (await devices(me.cookie)).data;
  assert.equal(seen.others, 2);
  assert.deepEqual(seen.list.map((d) => d.name).sort(), ["Windows · Chrome", "iPhone · Safari"], "each device by name (anket)");
  assert.ok(seen.list.every((d) => /^[0-9a-f]{16}$/.test(d.id) && d.seen > 0));
  assert.deepEqual((await devices(friend.cookie)).data, { others: 0, list: [] });
  const iphoneRow = seen.list.find((d) => d.name === "iPhone · Safari");
  assert.equal((await call(app, "/devices/signout", { method: "POST", headers: { Cookie: friend.cookie }, body: { id: iphoneRow.id } })).status, 404, "not someone else's device");
  assert.deepEqual((await call(app, "/devices/signout", { method: "POST", headers: { Cookie: me.cookie }, body: { id: iphoneRow.id } })).data, { ok: true, closed: 1 });
  assert.equal((await session(tablet.cookie)).status, 401, "that one device is signed out");
  assert.equal((await session(laptop.cookie)).status, 200, "the others stay");
  const tablet2 = await login();
  const out = await call(app, "/devices/signout", { method: "POST", headers: { Cookie: me.cookie }, body: {} });
  assert.deepEqual(out.data, { ok: true, closed: 2 });
  assert.equal((await session(laptop.cookie)).status, 401);
  assert.equal((await session(tablet2.cookie)).status, 401);
  assert.equal((await session(me.cookie)).status, 200, "this device stays signed in");
  assert.equal((await session(friend.cookie)).status, 200, "teammates are untouched");
  assert.deepEqual((await devices(me.cookie)).data, { others: 0, list: [] });
  assert.deepEqual(
    sqlite.prepare("SELECT endpoint FROM subscriptions").all().map((s) => s.endpoint),
    ["https://fcm.googleapis.com/fcm/send/mine"],
    "the signed-out devices' notifications stop; this one's stay",
  );
  assert.equal((await call(app, "/devices/signout", { method: "POST", body: {} })).status, 401, "needs a session");
});

// n40, dürüst dakika: a watched free session counts only the minutes it was seen,
// and a build that cracked while its owner was away can be saved once.
async function honestFixture(tag, config = {}) {
  const sqlite = new DatabaseSync(":memory:");
  const app = createApp({ db: sqliteAdapter(sqlite), config: { leaveStep: 0, ...config } });
  const ada = await call(app, "/groups", { method: "POST", body: { name: "Ada", username: `ada_${tag}`, password: "honest-pass-1" } });
  const id = sqlite.prepare("SELECT id FROM members WHERE username = ?").get(`ada_${tag}`).id;
  const focus = (body) => call(app, "/focus", { method: "POST", headers: { Cookie: ada.cookie }, body });
  const row = () => sqlite.prepare("SELECT * FROM members WHERE id = ?").get(id);
  // Moves the whole session `ms` into the past (start, end and the last beat).
  const shift = (ms, beatAgo) => {
    const m = row();
    sqlite.prepare("UPDATE members SET focus_end = ?, focus_beat = ? WHERE id = ?").run(m.focus_end - ms, Date.now() - beatAgo, id);
  };
  const logged = () => sqlite.prepare("SELECT minutes, strict, rescued FROM focus_log WHERE member_id = ? ORDER BY created").all(id).map((r) => ({ ...r }));
  return { sqlite, app, id, focus, row, shift, logged, cookie: ada.cookie };
}

test("dürüst dakika: a watched free session loses the time away (n40)", async () => {
  const { focus, row, shift, logged, sqlite, id } = await honestFixture("away");
  assert.equal((await focus({ action: "start", minutes: 50, honest: true })).status, 200);
  assert.equal(row().focus_honest, 1);
  // 20 minutes in, the app was quiet for the last 4 minutes: that is time away.
  shift(20 * 60000, 4 * 60000);
  const back = await focus({ action: "beat" });
  assert.equal(back.data.away, 4 - 0, "about four minutes away (less one beat)");
  assert.ok(row().focus_away > 3 * 60000 && row().focus_away < 4 * 60000);
  // The session runs out with the app on screen.
  sqlite.prepare("UPDATE members SET focus_end = ?, focus_beat = ? WHERE id = ?").run(Date.now() - 1000, Date.now() - 2000, id);
  const done = await focus({ action: "finish" });
  assert.equal(done.data.credited, 46, "50 minutes less the 4 away (rounded down)");
  assert.deepEqual(logged().map((l) => l.minutes), [46]);
  const wage = sqlite.prepare("SELECT note FROM bricks_log WHERE member_id = ? AND reason = 'wage'").get(id).note;
  assert.match(wage, /46 dk serbest çalışma .*uzakta geçen 4 dk sayılmadı/);
});

test("dürüst dakika: five minutes away ends a free session where you left (n40)", async () => {
  const { focus, row, shift, logged } = await honestFixture("leave");
  await focus({ action: "start", minutes: 50, honest: true });
  // Left 30 minutes in and came back 6 minutes later.
  shift(36 * 60000, 6 * 60000);
  const back = await focus({ action: "beat" });
  assert.equal(back.data.stopped, true);
  assert.equal(back.data.credited, 30);
  assert.equal(row().focus_end, 0, "the session is over");
  assert.deepEqual(logged().map((l) => l.minutes), [30]);
});

test("dürüst dakika: stopping a free session keeps the minutes seen, if there are 20 (n40)", async () => {
  const short = await honestFixture("short");
  await short.focus({ action: "start", minutes: 25, honest: true });
  short.shift(12 * 60000, 5000);
  const stop = await short.focus({ action: "cancel" });
  assert.equal(stop.data.stopped, true);
  assert.equal(stop.data.credited, 0, "12 minutes is not a session");
  assert.deepEqual(short.logged(), []);
  assert.equal(short.row().focus_end, 0);
  const long = await honestFixture("long");
  await long.focus({ action: "start", minutes: 75, honest: true });
  long.shift(41 * 60000, 5000);
  assert.equal((await long.focus({ action: "cancel" })).data.credited, 41);
  // A free session without the flag (an older app) keeps the old rules.
  await long.focus({ action: "start", minutes: 25 });
  long.shift(10 * 60000, 9 * 60000);
  assert.equal((await long.focus({ action: "beat" })).data.away, undefined, "not watched");
});

test("kurtarma: a cracked build waits for its owner and is saved once (n40)", async () => {
  const { focus, row, shift, logged, sqlite, id } = await honestFixture("rescue");
  await focus({ action: "start", strict: true, model: "kulube" });
  // 20 minutes in, the phone was put away two minutes ago.
  shift(20 * 60000, 2 * 60000);
  assert.equal((await focus({ action: "away" })).status, 200);
  const before = row();
  const saved = await focus({ action: "rescue" });
  assert.equal(saved.status, 200);
  assert.equal(saved.data.extra, 5, "a fifth of 25 minutes");
  const after = row();
  assert.equal(after.focus_rescued, 1);
  const moved = after.focus_end - before.focus_end;
  assert.ok(moved >= 7 * 60000 && moved < 7 * 60000 + 2000, "two minutes away + five as the price");
  assert.equal(after.focus_left_at, 0);
  const again = await focus({ action: "rescue" });
  assert.equal(again.status, 400);
  assert.match(again.data.error, /ikinci şans yok/);
  // The session ends with the app on screen: a patched building, and no "telefona dokunmadan".
  sqlite.prepare("UPDATE members SET focus_end = ?, focus_beat = ? WHERE id = ?").run(Date.now() - 1000, Date.now() - 2000, id);
  assert.equal((await focus({ action: "finish" })).data.credited, 25);
  assert.deepEqual(logged(), [{ minutes: 25, strict: 1, rescued: 1 }]);
  assert.equal(sqlite.prepare("SELECT patched FROM buildings WHERE member_id = ?").get(id).patched, 1);
  const line = sqlite.prepare("SELECT text FROM messages WHERE member_id = ? AND kind = 'system' AND text LIKE '%bitirdi%'").get(id).text;
  assert.match(line, /bir kez kurtararak 🩹/);
});

test("kurtarma: a site left at the very end is not collapsed while it can still be saved (n40)", async () => {
  const { focus, row, sqlite, id, logged } = await honestFixture("hold");
  await focus({ action: "start", strict: true, model: "kulube" });
  // The session ended a minute ago; the app was last seen two minutes before that.
  sqlite.prepare("UPDATE members SET focus_end = ?, focus_beat = ? WHERE id = ?").run(Date.now() - 60000, Date.now() - 3 * 60000, id);
  const waiting = await focus({ action: "finish" });
  assert.equal(waiting.data.cracked, true);
  assert.ok(row().focus_end > 0, "still standing, cracked");
  assert.equal((await focus({ action: "rescue" })).status, 200);
  assert.ok(row().focus_end > Date.now() + 2 * 60000, "two minutes of it left again, plus the price");
  // Another session, left ten minutes ago: too late, it collapses.
  sqlite.prepare("UPDATE members SET focus_end = ?, focus_beat = ?, focus_rescued = 0 WHERE id = ?").run(Date.now() - 60000, Date.now() - 10 * 60000, id);
  const late = await focus({ action: "finish" });
  assert.equal(late.data.withered, true);
  assert.equal(row().focus_end, 0);
  assert.deepEqual(logged(), []);
  assert.ok(row().ruin_until > Date.now(), "rubble, as before");
});

test("telefon sayaç: one countdown on the phone, one alert on the computer, and the server cracks the site once (n40)", async (t) => {
  const { focus, row, sqlite, id, app, cookie } = await honestFixture("sayac", { pushExtraHosts: "push.kutup.test" });
  const receiver = pushReceiver();
  const phone = sqlite.prepare("SELECT token FROM sessions WHERE member_id = ?").get(id).token;
  sqlite.prepare("UPDATE sessions SET device = 'iPhone · ana ekran' WHERE token = ?").run(phone);
  sqlite.prepare("INSERT INTO sessions (token, member_id, created, device) VALUES ('desk-token', ?, ?, 'Windows · Chrome')").run(id, Date.now());
  const add = (endpoint, token) =>
    sqlite.prepare("INSERT INTO subscriptions (endpoint, member_id, subscription, session_token) VALUES (?, ?, ?, ?)").run(endpoint, id, JSON.stringify(receiver.subscription(endpoint)), token);
  add("https://push.kutup.test/phone", phone);
  add("https://push.kutup.test/desk", "desk-token");
  const sent = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    sent.push({ to: String(url).split("/").pop(), ...JSON.parse(receiver.decrypt(new Uint8Array(await new Response(init.body).arrayBuffer()))) });
    return new Response(null, { status: 201 });
  });
  // Runs a request and every background job it starts (the countdown and its pushes).
  const settled = async (body) => {
    const pending = [];
    const response = await app.fetch(
      new Request("http://kutup.test/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Kutup": "1", Cookie: cookie },
        body: JSON.stringify(body),
      }),
      { ip: "test", waitUntil: (p) => pending.push(p) },
    );
    for (let i = 0; i < pending.length; i++) await pending[i];
    return response.json();
  };
  await focus({ action: "start", strict: true, model: "kulube", device: "phone" });
  assert.equal(row().focus_device, "phone");
  await settled({ action: "away" });
  const to = (who) => sent.filter((p) => p.to === who);
  assert.deepEqual(to("phone").map((p) => p.title), ["⏳ 10 sn içinde dön!", "🩹 Binan çatladı!"], "one countdown, then the crack: no stream of pushes");
  assert.equal(to("phone")[0].countdown, 10, "the phone's own worker counts it down");
  assert.ok(to("phone").every((p) => p.tag === "kutup-build"));
  assert.deepEqual(to("desk").map((p) => p.title), ["📱 Telefonuna bak!"], "the computer hears it once");
  assert.ok(row().focus_cracked_at > 0, "the server cracked the site itself");
  // Another "away" for the same absence starts nothing new.
  sent.length = 0;
  await settled({ action: "away" });
  assert.equal(sent.length, 0);
  // A beat from either device cannot undo the crack.
  assert.equal((await focus({ action: "beat", device: "phone" })).data.cracked, true);
  assert.equal((await focus({ action: "beat", device: "desk" })).data.cracked, true);
  assert.ok(row().focus_cracked_at > 0);
  // The state says so, for every open device.
  const me = (await call(app, "/state", { headers: { Cookie: cookie } })).data.members.find((m) => m.id === id);
  assert.ok(me.focusCrackedAt > 0);
  // Saved once: the time since the phone left and a fifth of the session are added.
  const before = row();
  const saved = await focus({ action: "rescue" });
  assert.equal(saved.status, 200);
  const after = row();
  assert.equal(after.focus_cracked_at, 0);
  assert.equal(after.focus_left_at, 0);
  assert.ok(after.focus_end - before.focus_end >= 5 * 60000, "five minutes of price, plus the time away");

  // Back within the countdown: no crack.
  sqlite.prepare("UPDATE members SET focus_rescued = 0 WHERE id = ?").run(id);
  const pending = [];
  await app.fetch(
    new Request("http://kutup.test/api/focus", { method: "POST", headers: { "Content-Type": "application/json", "X-Kutup": "1", Cookie: cookie }, body: JSON.stringify({ action: "away" }) }),
    { ip: "test", waitUntil: (p) => pending.push(p) },
  );
  await focus({ action: "beat", device: "phone" });
  for (let i = 0; i < pending.length; i++) await pending[i];
  assert.equal(row().focus_cracked_at, 0);
  assert.equal(row().focus_left_at, 0);

  // The app says it came back too late (the server's countdown never ran).
  await focus({ action: "crack", away: 40000 });
  assert.ok(row().focus_cracked_at > 0);
  assert.ok(Date.now() - row().focus_left_at >= 40000);
  // Let go: the site falls.
  assert.equal((await focus({ action: "wither" })).status, 200);
  assert.equal(row().focus_end, 0);
  assert.equal(row().focus_cracked_at, 0, "cleared with the session");

  // A session started on the computer: the phone is free to glance at.
  await focus({ action: "start", minutes: 50, honest: true, device: "desk" });
  assert.equal(row().focus_device, "desk");
  sent.length = 0;
  await settled({ action: "away" });
  assert.equal(sent.length, 0);
  assert.equal(row().focus_left_at, 0);
});

test("kurtarma: a site the server cracked waits five minutes, then falls even if the app came back (n40)", async () => {
  const { focus, row, sqlite, id, logged } = await honestFixture("crackend");
  await focus({ action: "start", strict: true, model: "kulube" });
  // Cracked two minutes ago, the session has just ended with the app on screen.
  sqlite.prepare("UPDATE members SET focus_end = ?, focus_beat = ?, focus_left_at = ?, focus_cracked_at = ? WHERE id = ?").run(Date.now() - 1000, Date.now() - 2000, Date.now() - 140000, Date.now() - 120000, id);
  assert.equal((await focus({ action: "finish" })).data.cracked, true, "still within the rescue window");
  // Six minutes after the crack: rubble, no minutes, though the app beat to the end.
  sqlite.prepare("UPDATE members SET focus_cracked_at = ? WHERE id = ?").run(Date.now() - 6 * 60000, id);
  const late = await focus({ action: "finish" });
  assert.equal(late.data.withered, true);
  assert.equal(row().focus_end, 0);
  assert.deepEqual(logged(), []);
});


test("join preview and confirmation enforce duration, price, pauses, mission separation and the quoted session",async()=>{
  const sqlite=new DatabaseSync(":memory:"),app=createApp({db:sqliteAdapter(sqlite)});
  try{
    const ada=await call(app,"/groups",{method:"POST",body:{name:"Ada",username:"join_quote_a",password:"join-pass-1"}});
    const bora=await call(app,"/join",{method:"POST",body:{invite:ada.data.group.invite,name:"Bora",username:"join_quote_b",password:"join-pass-1"}});
    const aid=ada.data.memberId,bid=bora.data.memberId;
    const focus=(who,body)=>call(app,"/focus",{method:"POST",headers:{Cookie:who.cookie},body});
    assert.equal((await focus(ada,{action:"start",minutes:75})).status,200);
    sqlite.prepare("UPDATE members SET focus_end=? WHERE id=?").run(Date.now()+41*60000,aid);
    const preview=await call(app,`/focus/join/${aid}`,{headers:{Cookie:bora.cookie}});
    assert.equal(preview.status,200);assert.equal(preview.data.canFree,true);
    assert.ok(preview.data.models.some(m=>m.id==="kulube"));assert.ok(!preview.data.models.some(m=>m.id==="ev"));
    const wallet=sqlite.prepare("SELECT bricks FROM members WHERE id=?").get(bid).bricks;
    assert.equal((await focus(bora,{action:"start",joinMember:aid,strict:true,model:"ev"})).status,400);
    assert.equal(sqlite.prepare("SELECT bricks FROM members WHERE id=?").get(bid).bricks,wallet);
    sqlite.prepare("UPDATE members SET focus_paused_at=1 WHERE id=?").run(aid);
    assert.equal((await focus(bora,{action:"start",joinMember:aid})).status,409);
    sqlite.prepare("UPDATE members SET focus_paused_at=0,focus_imece=1 WHERE id=?").run(aid);
    assert.equal((await focus(bora,{action:"start",joinMember:aid})).status,409);
    sqlite.prepare("UPDATE members SET focus_imece=0,focus_end=? WHERE id=?").run(Date.now()+22*60000,aid);
    assert.equal((await focus(bora,{action:"start",joinMember:aid,joinEnd:preview.data.friend.end})).status,409);
    assert.equal((await focus(bora,{action:"start",joinMember:aid,strict:true})).status,400);
    assert.equal((await focus(bora,{action:"start",joinMember:aid,honest:false})).status,200);
    assert.equal(sqlite.prepare("SELECT focus_honest FROM members WHERE id=?").get(bid).focus_honest,1,"free joins always require watched minutes");
  }finally{sqlite.close();}
});
