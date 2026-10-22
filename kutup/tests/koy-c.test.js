// n46 C — the renewal's records and contract: a focus session has one stable
// run and one result, a repeated start is the same start, a failing batch
// leaves nothing half-written, village changes are logged in order, a v2
// layout is stored and served whole, an old app is asked to update, and a
// backup carries every new record. Today's village (V1) stays the default.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createApp } from "../server/app.js";
import { sqliteAdapter } from "../server/sqlite.js";
import { migrations } from "../server/schema.js";
import { restoreBackup } from "../server/restore.js";
import { layoutStatements, readLayout } from "../server/villageStore.js";
import { inventoryOf, makeFixture } from "../scripts/koy/fixtures.mjs";
import { layoutFrom } from "../shared/koy2/draft.js";

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

const OWNER = "n46c-owner-key-1234";
async function team(wrap = (db) => db) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const app = createApp({ db: wrap(sqliteAdapter(sqlite)), config: { adminKey: OWNER, testHooks: true } });
  const ada = await call(app, "/groups", { method: "POST", body: { name: "Ada", username: "ada_n46c", password: "n46c-pass-1" } });
  const ege = await call(app, "/join", { method: "POST", body: { invite: ada.data.group.invite, name: "Ege", username: "ege_n46c", password: "n46c-pass-1" } });
  const as = (who) => ({ Cookie: who.cookie });
  const one = (sql, ...args) => sqlite.prepare(sql).get(...args);
  const all = (sql, ...args) => sqlite.prepare(sql).all(...args);
  const expire = (id) => sqlite.prepare("UPDATE members SET focus_end = ?, focus_beat = ? WHERE id = ?").run(Date.now() - 1000, Date.now() - 1000, id);
  return { sqlite, app, ada, ege, as, one, all, expire, owner: { "X-Owner-Key": OWNER } };
}
const key = (n) => `n46c-request-key-${String(n).padStart(4, "0")}`;
const startBody = (k, extra = {}) => ({ action: "start", strict: true, model: "kulube", minutes: 25, requestKey: k, ...extra });

test("n46 C: a start has one stable run; the same key is the same start, a changed one is refused", async () => {
  const t = await team();
  const id = t.ada.data.memberId;
  const before = t.one("SELECT bricks FROM members WHERE id = ?", id).bricks;
  // Two copies of the same tap at once, and a late third: one session, one charge.
  const twins = await Promise.all([1, 2].map(() => call(t.app, "/focus", { method: "POST", headers: t.as(t.ada), body: startBody(key(1)) })));
  assert.deepEqual(twins.map((r) => r.status), [200, 200]);
  const late = await call(t.app, "/focus", { method: "POST", headers: t.as(t.ada), body: startBody(key(1)) });
  assert.equal(late.status, 200);
  assert.equal(late.data.replayed, true);
  const runs = t.all("SELECT * FROM focus_runs WHERE member_id = ?", id);
  assert.equal(runs.length, 1);
  assert.equal(runs[0].status, "running");
  assert.equal(runs[0].mode, "strict");
  assert.equal(t.one("SELECT focus_run_id FROM members WHERE id = ?", id).focus_run_id, runs[0].id);
  assert.equal(t.one("SELECT bricks FROM members WHERE id = ?", id).bricks, before - 0, "a kulübe costs nothing; never twice anyway");
  assert.equal(t.all("SELECT * FROM bricks_log WHERE member_id = ? AND reason = 'cost'", id).length <= 1, true);
  // Same key, other choices: refused, nothing changes.
  const other = await call(t.app, "/focus", { method: "POST", headers: t.as(t.ada), body: startBody(key(1), { model: "ev", minutes: 50 }) });
  assert.equal(other.status, 409);
  assert.equal(t.all("SELECT * FROM focus_runs WHERE member_id = ?", id).length, 1);
  // A new key while running is an ordinary "finish the current one first".
  assert.equal((await call(t.app, "/focus", { method: "POST", headers: t.as(t.ada), body: startBody(key(2)) })).status, 400);
  assert.equal((await call(t.app, "/focus", { method: "POST", headers: t.as(t.ada), body: startBody("short") })).status, 400, "malformed key");
  // A site was logged for the village.
  const changes = t.all("SELECT entity_type, entity_id, op FROM village_changes ORDER BY rev").map((r) => ({ ...r }));
  assert.deepEqual(changes, [{ entity_type: "site", entity_id: runs[0].id, op: "start" }]);
});

test("n46 C: a finished build keeps its run: one building, pointing back once; content changes are in order", async () => {
  const t = await team();
  const id = t.ada.data.memberId;
  const started = await call(t.app, "/focus", { method: "POST", headers: t.as(t.ada), body: startBody(key(3)) });
  const run = started.data.run;
  // A rescue/break moves the end; the run stays the same.
  t.sqlite.prepare("UPDATE members SET focus_end = focus_end + 60000 WHERE id = ?").run(id);
  assert.equal(t.one("SELECT focus_run_id FROM members WHERE id = ?", id).focus_run_id, run);
  t.expire(id);
  await call(t.app, "/state", { headers: t.as(t.ada) });
  await call(t.app, "/state", { headers: t.as(t.ada) });
  const building = t.one("SELECT * FROM buildings WHERE member_id = ?", id);
  assert.equal(building.source_focus_run_id, run);
  const done = t.one("SELECT * FROM focus_runs WHERE id = ?", run);
  assert.equal(done.status, "completed");
  assert.equal(done.building_id, building.id);
  assert.equal(t.one("SELECT focus_run_id FROM members WHERE id = ?", id).focus_run_id, null);
  // The unique source keeps a second building for the same run out.
  assert.throws(() =>
    t.sqlite.prepare("INSERT INTO buildings (id, member_id, group_id, kind, model, minutes, seed, created, source_focus_run_id) SELECT 'dupe', member_id, group_id, kind, model, minutes, seed, created, source_focus_run_id FROM buildings WHERE id = ?").run(building.id),
  );
  const changes = t.all("SELECT rev, entity_type, entity_id, op, ref FROM village_changes ORDER BY rev");
  assert.deepEqual(changes.map((c) => [c.rev, c.entity_type, c.op]), [[1, "site", "start"], [2, "site", "convert"], [3, "building", "create"]]);
  assert.equal(changes[1].ref, building.id);
  assert.equal(t.one("SELECT village_content_rev AS r FROM groups").r, 3);
  // Cancel: the run ends cancelled and the site's plot is given back.
  const second = await call(t.app, "/focus", { method: "POST", headers: t.as(t.ada), body: startBody(key(4)) });
  assert.equal((await call(t.app, "/focus", { method: "POST", headers: t.as(t.ada), body: { action: "cancel" } })).status, 200);
  assert.equal(t.one("SELECT status FROM focus_runs WHERE id = ?", second.data.run).status, "cancelled");
  assert.deepEqual(t.all("SELECT op FROM village_changes ORDER BY rev").map((c) => c.op).slice(-2), ["start", "release"]);
  // A free session has a run too, but no site.
  const free = await call(t.app, "/focus", { method: "POST", headers: t.as(t.ege), body: { action: "start", minutes: 25 } });
  assert.equal(t.one("SELECT mode FROM focus_runs WHERE id = ?", free.data.run).mode, "free");
  assert.equal(t.all("SELECT * FROM village_changes WHERE entity_id = ?", free.data.run).length, 0);
});

test("n46 C: a start whose batch fails leaves no run, no receipt, no charge and no session", async () => {
  let fail = false;
  const t = await team((db) => ({
    ...db,
    async batch(list) {
      if (fail && list.some(([sql]) => sql.startsWith("INSERT INTO request_receipts"))) {
        // Fail mid-way, after the run row was already sent.
        const upto = list.findIndex(([sql]) => sql.startsWith("INSERT INTO request_receipts"));
        return db.batch([...list.slice(0, upto), ["INSERT INTO no_such_table VALUES (1)", []]]);
      }
      return db.batch(list);
    },
  }));
  const id = t.ada.data.memberId;
  await call(t.app, "/owner/members/" + id + "/gift", { method: "POST", headers: t.owner, body: { model: "ev" } });
  t.sqlite.prepare("UPDATE members SET bricks = 100 WHERE id = ?").run(id);
  fail = true;
  const res = await call(t.app, "/focus", { method: "POST", headers: t.as(t.ada), body: startBody(key(5), { model: "ev", minutes: 50 }) });
  assert.equal(res.status, 500);
  fail = false;
  assert.equal(t.all("SELECT * FROM focus_runs").length, 0);
  assert.equal(t.all("SELECT * FROM request_receipts").length, 0);
  assert.equal(t.one("SELECT bricks, focus_end, focus_run_id FROM members WHERE id = ?", id).bricks, 100);
  assert.equal(t.one("SELECT focus_end FROM members WHERE id = ?", id).focus_end, 0);
  assert.equal(t.all("SELECT * FROM village_changes WHERE entity_type = 'site'").length, 0);
  // The same key then goes through once.
  assert.equal((await call(t.app, "/focus", { method: "POST", headers: t.as(t.ada), body: startBody(key(5), { model: "ev", minutes: 50 }) })).status, 200);
  assert.equal(t.all("SELECT * FROM focus_runs").length, 1);
});

test("n46 C: a v2 layout is written in a handful of statements and read back exactly", async () => {
  const f = makeFixture("baskin100");
  const { layout } = layoutFrom(f.groupKey, inventoryOf(f));
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const db = sqliteAdapter(sqlite);
  for (const m of migrations) await db.batch(m.map((sql) => [sql, []]));
  sqlite.prepare("INSERT INTO groups (id, name, invite) VALUES ('g1', 'Baskın', 'invite-g1-123456789012')").run();
  const statements = layoutStatements("v2-test", "g1", layout, { status: "draft", sourceContentRev: 7 });
  assert.ok(statements.length <= 8, "D1: one statement per table");
  await db.batch(statements);
  const back = await readLayout(db, "v2-test");
  assert.deepEqual(back.layout, layout);
  assert.equal(back.row.source_content_rev, 7);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM village_placements WHERE layout_id = 'v2-test'").get().n, 102);
  // One subject, one plot: a second placement for the same plot or subject is refused.
  assert.throws(() => sqlite.prepare("INSERT INTO village_placements (layout_id, subject_type, subject_id, plot_id, x, y, facing, scale, geometry_version, model) VALUES ('v2-test', 'building', 'other', 'p0', 0, 0, 0, 1, 1, 'ev')").run());
  assert.throws(() => sqlite.prepare("INSERT INTO village_placements (layout_id, subject_type, subject_id, plot_id, x, y, facing, scale, geometry_version, model) VALUES ('v2-test', 'building', 'b000', 'p999', 0, 0, 0, 1, 1, 'ev')").run());
});

test("n46 C: V1 stays the default; a v2 team is served to new apps only, with cursors and tombstones", async () => {
  const t = await team();
  const id = t.ada.data.memberId;
  const gift = await call(t.app, `/owner/members/${id}/gift`, { method: "POST", headers: t.owner, body: { model: "ev" } });
  await call(t.app, `/owner/members/${t.ege.data.memberId}/gift`, { method: "POST", headers: t.owner, body: { model: "kahve" } });
  // Today's answer, whatever the app says, while no layout is active.
  const v1 = await call(t.app, "/village", { headers: { ...t.as(t.ada), "X-Kutup-Village-Version": "3" } });
  assert.equal(v1.status, 200);
  assert.equal(v1.data.contractVersion, undefined);
  assert.ok(Array.isArray(v1.data.buildings[0]), "compact V1 rows");
  assert.ok(t.one("SELECT count(*) AS n FROM village_layouts WHERE kind = 'v2'").n === 0);
  // Ege is building while the team switches: the site comes along.
  const site = await call(t.app, "/focus", { method: "POST", headers: t.as(t.ege), body: startBody(key(6)) });
  const made = await call(t.app, "/__test/village-v2", { method: "POST", body: { name: "Ada" } });
  assert.deepEqual(made.data.missing, []);
  const old = await call(t.app, "/village", { headers: t.as(t.ada) });
  assert.equal(old.status, 426);
  assert.equal(old.data.updateRequired, true);
  const v2 = await call(t.app, "/village", { headers: { ...t.as(t.ada), "X-Kutup-Village-Version": "3" } });
  assert.equal(v2.status, 200);
  assert.equal(v2.data.contractVersion, 2);
  assert.equal(v2.data.full, true);
  assert.equal(v2.data.buildings.length, 2);
  assert.ok(v2.data.buildings.every((b) => b.placement && b.memberId), "owner and placement explicit");
  assert.equal(v2.data.sites.length, 1);
  assert.equal(v2.data.sites[0].focusRunId, site.data.run);
  assert.ok(v2.data.sites[0].placement, "the running site has its plot");
  assert.equal(v2.data.sites[0].device, undefined);
  assert.equal(v2.data.plots.length, 3);
  // Same cursor: nothing travels. A taken-back building: a delta with a tombstone.
  const same = await call(t.app, `/village?cursor=${v2.data.cursor}`, { headers: { ...t.as(t.ada), "X-Kutup-Village-Version": "3" } });
  assert.deepEqual(Object.keys(same.data).sort(), ["contractVersion", "cursor", "unchanged"]);
  const plot = v2.data.buildings.find((b) => b.id === gift.data.id).placement.plotId;
  assert.equal((await call(t.app, `/owner/buildings/${gift.data.id}`, { method: "DELETE", headers: t.owner })).status, 200);
  const delta = await call(t.app, `/village?cursor=${v2.data.cursor}`, { headers: { ...t.as(t.ada), "X-Kutup-Village-Version": "3" } });
  assert.equal(delta.data.full, false);
  assert.deepEqual(delta.data.deletes.plots, [plot]);
  assert.equal(delta.data.roads.length, 0, "unchanged streets do not travel again");
  assert.equal(delta.data.buildings.length, 1);
  assert.equal(t.one("SELECT count(*) AS n FROM village_placements WHERE subject_id = ?", gift.data.id).n, 0);
  // A move on the old lattice is closed for a v2 team (package D plans moves on streets).
  const own = t.one("SELECT id FROM buildings WHERE member_id = ?", t.ege.data.memberId);
  assert.equal((await call(t.app, `/buildings/${own.id}/move`, { method: "POST", headers: t.as(t.ege), body: { x: 1, y: 1 } })).status, 409);
});

test("n46 C: a member who leaves takes their placements, runs and receipts along; nothing is orphaned", async () => {
  const t = await team();
  await call(t.app, `/owner/members/${t.ege.data.memberId}/gift`, { method: "POST", headers: t.owner, body: { model: "ev" } });
  await call(t.app, "/focus", { method: "POST", headers: t.as(t.ege), body: startBody(key(7)) });
  await call(t.app, "/__test/village-v2", { method: "POST", body: { name: "Ada" } });
  assert.equal(t.one("SELECT count(*) AS n FROM village_placements").n, 2);
  assert.equal((await call(t.app, `/owner/members/${t.ege.data.memberId}`, { method: "DELETE", headers: t.owner })).status, 200);
  assert.equal(t.one("SELECT count(*) AS n FROM village_placements").n, 0);
  assert.equal(t.one("SELECT count(*) AS n FROM focus_runs").n, 0);
  assert.equal(t.one("SELECT count(*) AS n FROM request_receipts").n, 0);
  assert.equal(t.one("SELECT count(*) AS n FROM village_plots WHERE deleted = 0").n, 0);
  assert.deepEqual(t.sqlite.prepare("PRAGMA foreign_key_check").all(), []);
});

test("n46 C: a backup carries every new record and restores to the same layout", async () => {
  const t = await team();
  await call(t.app, `/owner/members/${t.ada.data.memberId}/gift`, { method: "POST", headers: t.owner, body: { model: "galata" } });
  await call(t.app, "/focus", { method: "POST", headers: t.as(t.ege), body: startBody(key(8)) });
  const made = await call(t.app, "/__test/village-v2", { method: "POST", body: { name: "Ada" } });
  const backup = (await call(t.app, "/owner/backup", { headers: t.owner })).data;
  for (const table of ["focus_runs", "request_receipts", "village_changes", "village_layouts", "village_regions", "village_nodes", "village_roads", "village_neighborhoods", "village_plots", "village_placements"])
    assert.ok(backup.tables[table].length > 0, table);
  const copy = new DatabaseSync(":memory:");
  const report = await restoreBackup(backup, copy);
  assert.equal(report.counts.village_placements, 2);
  const back = await readLayout(sqliteAdapter(copy), made.data.id);
  assert.deepEqual(back.layout, made.data.layout);
  assert.equal(copy.prepare("SELECT active_layout_id AS a FROM groups").get().a, made.data.id);
  assert.equal(copy.prepare("SELECT count(*) AS n FROM focus_runs WHERE status = 'running'").get().n, 1);
});

test("n46 C: an older database and an older backup get the legacy baseline and stable runs once", async () => {
  // A team at schema 33 with a building and a session under way.
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const db = sqliteAdapter(sqlite);
  for (const m of migrations.slice(0, 33)) await db.batch(m.map((sql) => [sql, []]));
  sqlite.prepare("INSERT INTO settings (key, value) VALUES ('schema', '33')").run();
  sqlite.prepare("INSERT INTO groups (id, name, invite) VALUES ('g1', 'Eski', 'invite-old-g1-12345678')").run();
  sqlite.prepare("INSERT INTO members (id, group_id, token, name, avatar, color, joined, updated, focus_end, focus_minutes, focus_strict, focus_model, focus_seed) VALUES ('m1', 'g1', 't1', 'Ada', '🪐', 'mint', 1, 1, ?, 50, 1, 'ev', 42)").run(Date.now() + 600000);
  sqlite.prepare("INSERT INTO buildings (id, member_id, group_id, kind, model, minutes, seed, created, pos_x, pos_y, facing) VALUES ('b1', 'm1', 'g1', 'house', 'ev', 50, 7, 5, 3.5, -2, 1)").run();
  const before = sqlite.prepare("SELECT * FROM buildings").all().map((b) => ({ ...b }));
  const app = createApp({ db, config: { adminKey: OWNER } });
  await call(app, "/health");
  const legacy = sqlite.prepare("SELECT * FROM village_layouts").get();
  assert.equal(legacy.kind, "legacy");
  assert.equal(legacy.status, "baseline");
  assert.deepEqual(JSON.parse(legacy.snapshot), [["b1", "m1", "ev", 3.5, -2, 1, null]]);
  assert.equal(sqlite.prepare("SELECT active_layout_id AS a FROM groups").get().a, null, "V1 stays active");
  const run = sqlite.prepare("SELECT * FROM focus_runs").get();
  assert.equal(run.mode, "strict");
  assert.equal(sqlite.prepare("SELECT focus_run_id FROM members").get().focus_run_id, run.id);
  const after = sqlite.prepare("SELECT * FROM buildings").all().map(({ source_focus_run_id, ...b }) => b);
  assert.deepEqual(after, before, "no building moved or changed");
});
