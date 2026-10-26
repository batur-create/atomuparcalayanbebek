// n50: one person, several accounts (one per team) on one phone. A session
// started on screen can be started in the others too; from then on they are
// one session: every beat, absence, crack, rescue, break, give-up and finish
// happens to each account, by the same rules, with its own bricks and minutes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createApp } from "../server/app.js";
import { sqliteAdapter } from "../server/sqlite.js";

const PHONE = "telefon0000000001", LAPTOP = "laptop00000000003";
const KEY = "linked-test-owner-key";

async function fixture(t) {
  const sql = new DatabaseSync(":memory:");
  sql.exec("PRAGMA foreign_keys=ON");
  t.after(() => sql.close());
  const pending = [];
  const app = createApp({ db: sqliteAdapter(sql), config: { adminKey: KEY, leaveStep: 0, testHooks: true } });
  // A browser-like cookie jar for one phone: every Set-Cookie is kept or dropped.
  const jar = new Map();
  const phone = async (path, body, headers = {}) => {
    const response = await app.fetch(
      new Request(`https://kutup.test/api${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: { "Content-Type": "application/json", "X-Kutup": "1", Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "), ...headers },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
      { waitUntil: (p) => pending.push(p.catch(() => {})) },
    );
    for (const line of response.headers.getSetCookie()) {
      const [name, ...value] = line.split(";")[0].split("=");
      if (/Max-Age=0\b/.test(line)) jar.delete(name);
      else jar.set(name, value.join("="));
    }
    return { status: response.status, data: await response.json() };
  };
  const settle = async () => {
    while (pending.length) await pending.shift();
  };
  const signUp = async (name, groupName, username) => {
    const r = await phone("/groups", { name, groupName, username, password: "test-pass-123" });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    sql.prepare("UPDATE members SET bricks = 500 WHERE id = ?").run(r.data.memberId);
    return r.data.memberId;
  };
  // Four teams, four accounts; the last one signed up is the open one.
  const d = await signUp("Batur D", "Dördüncü", "n50_d");
  const c = await signUp("Batur C", "Üçüncü", "n50_c");
  const b = await signUp("Batur B", "İkinci", "n50_b");
  const a = await signUp("Batur A", "Birinci", "n50_a");
  const row = (id) => sql.prepare("SELECT * FROM members WHERE id = ?").get(id);
  const owner = () => phone("/owner/login", { key: KEY });
  const startLeader = (body = {}) => phone("/focus", { action: "start", strict: true, model: "kulube", device: "phone", deviceId: PHONE, ...body });
  const join = (memberId, body = {}) => phone("/owner/linked/start", { memberId, deviceId: PHONE, ...body });
  const switchTo = (memberId) => phone("/accounts/switch", { memberId });
  return { sql, app, jar, phone, settle, a, b, c, d, row, owner, startLeader, join, switchTo };
}

test("starting a link is Batur's: it needs his panel key on this device", async (t) => {
  const f = await fixture(t);
  assert.equal((await f.phone("/owner/linked")).status, 401);
  assert.equal((await f.startLeader()).status, 200);
  assert.equal((await f.join(f.b, { model: "kulube" })).status, 401);
  assert.equal(f.row(f.b).focus_end, 0);
  assert.equal((await f.owner()).status, 200);
  const list = await f.phone("/owner/linked");
  assert.equal(list.status, 200);
  assert.deepEqual(list.data.accounts.map((x) => [x.name, x.current]), [["Batur A", true], ["Batur B", false], ["Batur C", false], ["Batur D", false]]);
  assert.equal(list.data.accounts[0].focusModel, "kulube");
  assert.equal(list.data.accounts[1].bricks, 500);
});

test("each linked account builds its own choice with its own bricks, ending at the same moment", async (t) => {
  const f = await fixture(t);
  await f.owner();
  assert.equal((await f.startLeader()).status, 200);
  const lead = f.row(f.a);
  assert.equal((await f.join(f.b, { model: "ev" })).status, 400, "a 50-minute house does not fit a 25-minute session");
  assert.equal((await f.join(f.b, { model: "cardak" })).status, 200);
  assert.equal((await f.join(f.c)).status, 200, "no building: watched focus only");
  assert.equal((await f.join(f.c)).status, 409, "already running");
  assert.equal((await f.join("uydurma")).status, 403, "only accounts this device holds");
  const [A, B, C, D] = [f.a, f.b, f.c, f.d].map(f.row);
  assert.deepEqual([A.focus_link, B.focus_link, C.focus_link, D.focus_link], [f.a, f.a, f.a, null]);
  assert.equal(B.focus_end, A.focus_end);
  assert.equal(C.focus_end, A.focus_end);
  assert.deepEqual([B.focus_strict, B.focus_model, B.focus_device, B.focus_honest], [1, "cardak", "phone", 0]);
  assert.deepEqual([C.focus_strict, C.focus_model, C.focus_honest], [0, null, 1]);
  // Bricks come out of each account's own box; the open one paid only its own.
  const cost = (id) => f.sql.prepare("SELECT -SUM(delta) AS n FROM bricks_log WHERE member_id = ? AND reason = 'cost'").get(id).n;
  assert.equal(500 - B.bricks, cost(f.b));
  assert.equal(A.bricks, lead.bricks);
  assert.equal(C.bricks, 500);
  // The same device watches every one of them.
  const watch = (id) => f.sql.prepare("SELECT value FROM settings WHERE key = ?").get(`focus-watch:${id}`)?.value;
  assert.deepEqual([watch(f.a), watch(f.b), watch(f.c)], [PHONE, PHONE, PHONE]);
});

test("two accounts of one team cannot be linked; late joins and imece are refused", async (t) => {
  const f = await fixture(t);
  await f.owner();
  // A second account in team A's own group, on this same phone.
  const invite = f.sql.prepare("SELECT g.invite FROM groups g JOIN members m ON m.group_id = g.id WHERE m.id = ?").get(f.a).invite;
  const twin = await f.phone("/join", { invite, name: "Batur A2", username: "n50_a2", password: "test-pass-123" });
  assert.equal(twin.status, 201, JSON.stringify(twin.data));
  await f.switchTo(f.a);
  assert.equal((await f.startLeader()).status, 200);
  assert.equal((await f.join(twin.data.memberId, { model: "kulube" })).status, 409);
  // After the first two minutes nobody joins any more.
  f.sql.prepare("UPDATE members SET focus_end = focus_end - 180000 WHERE id = ?").run(f.a);
  assert.equal((await f.join(f.b, { model: "kulube" })).status, 409);
  // A free session takes only free company.
  await f.phone("/focus", { action: "cancel", end: f.row(f.a).focus_end, relaxed: false });
  assert.equal((await f.phone("/focus", { action: "start", minutes: 25, honest: true, device: "phone", deviceId: PHONE })).status, 200);
  assert.equal((await f.join(f.b, { model: "kulube" })).status, 400);
  assert.equal((await f.join(f.b)).status, 200);
  assert.deepEqual([f.row(f.b).focus_strict, f.row(f.b).focus_honest], [0, 1]);
});

test("beats, leaving the app, the crack and the rescue happen to the whole link", async (t) => {
  const f = await fixture(t);
  await f.owner();
  await f.startLeader();
  await f.join(f.b, { model: "kulube" });
  await f.join(f.c);
  // A beat on screen keeps every account seen.
  f.sql.prepare("UPDATE members SET focus_beat = focus_beat - 60000 WHERE id IN (?, ?, ?)").run(f.a, f.b, f.c);
  const before = Date.now() - 1000;
  assert.equal((await f.phone("/focus", { action: "beat", device: "phone", deviceId: PHONE })).status, 200);
  for (const id of [f.a, f.b, f.c]) assert.ok(f.row(id).focus_beat >= before, id);
  // The phone leaves: one countdown (for the open account), then all crack.
  await f.phone("/focus", { action: "away", deviceId: PHONE });
  await f.settle();
  const [A, B] = [f.row(f.a), f.row(f.b)];
  assert.ok(A.focus_cracked_at > 0);
  assert.ok(B.focus_cracked_at > 0, "the linked build cracked with it");
  assert.ok(Math.abs(B.focus_left_at - A.focus_left_at) < 1000);
  assert.equal(f.row(f.c).focus_cracked_at, 0, "a free session does not crack");
  // A laptop beat cannot heal what the phone broke, in any account.
  assert.equal((await f.phone("/focus", { action: "beat", device: "desk", deviceId: LAPTOP })).data.cracked, true);
  // One rescue saves all of them, by the same time.
  const rescued = await f.phone("/focus", { action: "rescue" });
  assert.equal(rescued.status, 200);
  const [A2, B2] = [f.row(f.a), f.row(f.b)];
  assert.deepEqual([A2.focus_rescued, B2.focus_rescued, A2.focus_cracked_at, B2.focus_cracked_at], [1, 1, 0, 0]);
  assert.ok(Math.abs(A2.focus_end - B2.focus_end) < 2000);
  assert.ok(A2.focus_end > A.focus_end);
});

test("the open account can change: the link follows whichever account is on screen", async (t) => {
  const f = await fixture(t);
  await f.owner();
  await f.startLeader();
  await f.join(f.b, { model: "kulube" });
  await f.join(f.c, { model: "cardak" });
  assert.equal((await f.switchTo(f.b)).status, 200);
  f.sql.prepare("UPDATE members SET focus_beat = focus_beat - 60000").run();
  const before = Date.now() - 1000;
  await f.phone("/focus", { action: "beat", device: "phone", deviceId: PHONE });
  for (const id of [f.a, f.b, f.c]) assert.ok(f.row(id).focus_beat >= before, id);
  assert.equal(f.row(f.d).focus_end, 0);
  // Giving up from any account gives up all of them (first two minutes: full refund).
  assert.equal(f.row(f.c).bricks, 480);
  const cancelled = await f.phone("/focus", { action: "cancel", end: f.row(f.b).focus_end, relaxed: false });
  assert.equal(cancelled.status, 200);
  for (const id of [f.a, f.b, f.c]) assert.equal(f.row(id).focus_end, 0, id);
  assert.equal(f.row(f.c).bricks, 500, "each got its own refund");
});

test("the finish credits every account on its own: minutes, bricks, building, team", async (t) => {
  const f = await fixture(t);
  await f.owner();
  await f.startLeader();
  await f.join(f.b, { model: "kulube" });
  await f.join(f.c);
  // The whole session was watched: fast-forward to its end, last seen at the end.
  const end = Date.now() - 1000;
  f.sql.prepare("UPDATE members SET focus_end = ?, focus_beat = ? WHERE id IN (?, ?, ?)").run(end, end, f.a, f.b, f.c);
  const done = await f.phone("/focus", { action: "finish" });
  assert.equal(done.status, 200);
  assert.equal(done.data.credited, 25);
  for (const id of [f.a, f.b, f.c]) assert.equal(f.row(id).focus_end, 0, id);
  const logged = (id) => f.sql.prepare("SELECT minutes, strict FROM focus_log WHERE member_id = ?").all(id).map((r) => [r.minutes, r.strict]);
  assert.deepEqual(logged(f.a), [[25, 1]]);
  assert.deepEqual(logged(f.b), [[25, 1]]);
  assert.deepEqual(logged(f.c), [[25, 0]]);
  assert.deepEqual(logged(f.d), []);
  const built = (id) => f.sql.prepare("SELECT model, group_id FROM buildings WHERE member_id = ?").all(id);
  assert.equal(built(f.a).length, 1);
  assert.equal(built(f.b).length, 1);
  assert.equal(built(f.c).length, 0);
  assert.notEqual(built(f.a)[0].group_id, built(f.b)[0].group_id, "each in its own team's village");
  // No account counts another as a friend working beside it.
  assert.equal(f.sql.prepare("SELECT count(*) AS n FROM bricks_log WHERE reason = 'imece'").get().n, 0);
  // Each got its own day's first-session bonus and wage.
  for (const id of [f.a, f.b, f.c]) assert.ok(f.sql.prepare("SELECT count(*) AS n FROM bricks_log WHERE member_id = ? AND reason = 'bonus'").get(id).n === 1, id);
  // The panel tells how it went.
  const list = await f.phone("/owner/linked");
  assert.deepEqual(list.data.accounts.slice(0, 3).map((x) => x.last?.status), ["completed", "completed", "completed"]);
});

test("a build left unwatched at the end fails in every linked account", async (t) => {
  const f = await fixture(t);
  await f.owner();
  await f.startLeader();
  await f.join(f.b, { model: "kulube" });
  const end = Date.now() - 1000;
  f.sql.prepare("UPDATE members SET focus_end = ?, focus_beat = ? WHERE id IN (?, ?)").run(end, end - 600000, f.a, f.b);
  await f.phone("/focus", { action: "finish" });
  for (const id of [f.a, f.b]) {
    assert.equal(f.row(id).focus_end, 0);
    assert.equal(f.sql.prepare("SELECT count(*) AS n FROM buildings WHERE member_id = ?").get(id).n, 0, id);
  }
});

test("a later solo session is not linked any more", async (t) => {
  const f = await fixture(t);
  await f.owner();
  await f.startLeader();
  await f.join(f.b, { model: "kulube" });
  await f.phone("/focus", { action: "cancel", end: f.row(f.a).focus_end, relaxed: false });
  await f.startLeader();
  assert.equal(f.row(f.a).focus_link, null);
  assert.equal(f.row(f.b).focus_end, 0);
  await f.phone("/focus", { action: "beat", device: "phone", deviceId: PHONE });
  assert.equal(f.row(f.b).focus_end, 0, "nothing restarts by itself");
});
