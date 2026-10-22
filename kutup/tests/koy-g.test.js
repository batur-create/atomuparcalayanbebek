// n46 G — moving a team between village layouts (plan §8, §11.4): a draft
// planned in the owner's browser and checked by the server, kept up to date
// while people keep building, a guarded switch, and the way back within 14
// days with nothing earned in between lost. Temporary databases only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createApp } from "../server/app.js";
import { sqliteAdapter } from "../server/sqlite.js";
import { readLayout } from "../server/villageStore.js";
import { validateLayout } from "../shared/koy2/planner.js";
import { planDraft } from "../shared/koy2/switch.js";

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
const OWNER = "n46g-owner-key-1234";
const MODELS = ["ev", "kulube", "kahve", "sahaf", "bostan", "konak", "kule", "cicekci"];

async function team() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const db = sqliteAdapter(sqlite);
  const app = createApp({ db, config: { adminKey: OWNER, testHooks: true } });
  const ada = await call(app, "/groups", { method: "POST", body: { name: "Ada", username: "ada_n46g", password: "n46g-pass-1" } });
  const ege = await call(app, "/join", { method: "POST", body: { invite: ada.data.group.invite, name: "Ege", username: "ege_n46g", password: "n46g-pass-1" } });
  const people = { ada: ada.cookie, ege: ege.cookie };
  // One owner sign-in, as the panel has (key attempts are limited per address).
  const owner = { Cookie: (await call(app, "/owner/login", { method: "POST", body: { key: OWNER } })).cookie };
  const gid = ada.data.group.id;
  const ids = { ada: ada.data.memberId, ege: ege.data.memberId };
  let n = 0;
  const gift = async (who = "ada") => {
    const r = await call(app, `/owner/members/${ids[who]}/gift`, { method: "POST", headers: owner, body: { model: MODELS[n++ % MODELS.length] } });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    return r.data.id;
  };
  const state = async () => (await call(app, `/owner/village/${gid}`, { headers: owner })).data;
  // What the owner panel does: fetch the source, plan in "the browser", send it.
  const draft = async ({ role = "draft", base = null } = {}) => {
    const source = (await call(app, `/owner/village/${gid}/source${base ? `?layout=${base}` : ""}`, { headers: owner })).data;
    const planned = planDraft(source, source.layout);
    const stored = await call(app, `/owner/village/${gid}/layouts`, { method: "POST", headers: owner, body: { layout: planned.layout, base, role, contentRev: source.contentRev } });
    if (stored.status !== 201) return stored;
    // The panel then has every rule checked, a part per request.
    const id = stored.data[role].id;
    for (let part = { checked: 0, sound: false }; !part.sound; ) {
      const r = await call(app, `/owner/village/${gid}/layouts/${id}/check`, { method: "POST", headers: owner, body: { from: part.checked } });
      assert.equal(r.status, 200, JSON.stringify(r.data));
      part = r.data;
    }
    return { ...stored, data: await state() };
  };
  const village = async (who = "ada", v2 = true) =>
    call(app, "/village", { headers: { Cookie: people[who], ...(v2 ? { "X-Kutup-Village-Version": "3" } : {}) } });
  const one = (sql, ...args) => sqlite.prepare(sql).get(...args);
  sqlite.prepare("UPDATE members SET bricks = 2000").run();
  return { sqlite, db, app, gid, ids, people, owner, gift, state, draft, village, one };
}

test("n46 G: draft, catch up, switch, keep building, go back — nothing earned is lost (plan §8, §11.4)", async () => {
  const t = await team();
  for (let i = 0; i < 6; i++) await t.gift(i % 2 ? "ege" : "ada");
  // A building session already under way: its site must have a place in the draft too.
  const start = await call(t.app, "/focus", { method: "POST", headers: { Cookie: t.people.ada }, body: { action: "start", strict: true, model: "ev", minutes: 50, requestKey: "n46g-request-key-0001" } });
  assert.equal(start.status, 200, JSON.stringify(start.data));
  let s = await t.state();
  assert.deepEqual([s.active.id, s.draft, s.previous, s.counts], [null, null, null, { buildings: 6, sites: 1, projects: 0 }]);

  // 1. A draft from the owner's browser: complete, valid, not yet live.
  const made = await t.draft();
  assert.equal(made.status, 201, JSON.stringify(made.data));
  s = made.data;
  assert.deepEqual([s.draft.behind, s.draft.coverage.missing, s.draft.coverage.extra], [0, 0, 0]);
  assert.equal(s.draft.coverage.plots, 7);
  assert.equal((await t.village()).data.contractVersion, undefined, "members still see the old village");
  const firstDraft = (await readLayout(t.db, s.draft.id)).layout;
  assert.deepEqual(validateLayout(firstDraft), []);

  // 2. People keep building while the draft waits: it falls behind and cannot be switched to.
  await t.gift("ege");
  t.sqlite.prepare("UPDATE members SET focus_end = ?, focus_beat = ? WHERE id = ?").run(Date.now() - 1000, Date.now() - 1000, t.ids.ada);
  await call(t.app, "/state", { headers: { Cookie: t.people.ada } });
  s = await t.state();
  assert.ok(s.draft.behind > 0);
  const stale = await call(t.app, `/owner/village/${t.gid}/activate`, { method: "POST", headers: t.owner, body: { draftId: s.draft.id, active: null, contentRev: s.contentRev } });
  assert.equal(stale.status, 409);
  // The finished session's site became its building on the same plot in the draft as well.
  const built = t.one("SELECT id FROM buildings WHERE source_focus_run_id = ?", start.data.run).id;
  const converted = (await readLayout(t.db, s.draft.id)).layout.plots.find((p) => p.subject?.id === built);
  assert.equal(converted.id, firstDraft.plots.find((p) => p.subject?.id === start.data.run).id);

  // 3. Catching up keeps every placed plot where it was and plans only the new gift.
  const caught = await t.draft({ base: s.draft.id });
  assert.equal(caught.status, 201, JSON.stringify(caught.data));
  s = caught.data;
  assert.equal(s.draft.behind, 0);
  const second = (await readLayout(t.db, s.draft.id)).layout;
  for (const p of firstDraft.plots) {
    if (!p.subject) continue;
    const id = p.subject.type === "site" ? built : p.subject.id;
    const now = second.plots.find((q) => q.subject?.id === id);
    assert.deepEqual([now.id, now.x, now.y, now.facing], [p.id, p.x, p.y, p.facing]);
  }
  assert.equal(t.one("SELECT count(*) AS n FROM village_layouts WHERE group_id = ? AND kind = 'v2'", t.gid).n, 1, "the replaced draft is cleaned up");

  // 4. The switch: guarded on the active layout too.
  const wrong = await call(t.app, `/owner/village/${t.gid}/activate`, { method: "POST", headers: t.owner, body: { draftId: s.draft.id, active: "v2-elsewhere", contentRev: s.contentRev } });
  assert.equal(wrong.status, 409);
  const on = await call(t.app, `/owner/village/${t.gid}/activate`, { method: "POST", headers: t.owner, body: { draftId: s.draft.id, active: null, contentRev: s.contentRev } });
  assert.equal(on.status, 200, JSON.stringify(on.data));
  s = on.data;
  assert.equal(s.active.kind, "v2");
  assert.deepEqual([s.previous.kind, s.previous.open, s.previous.daysLeft], ["legacy", true, 14]);
  const v2 = (await t.village()).data;
  assert.equal(v2.contractVersion, 2);
  assert.equal(v2.buildings.length, 8);
  assert.ok(v2.buildings.every((b) => b.placement));
  assert.equal((await t.village("ada", false)).status, 426, "an old app is asked to update");

  // 5. Life goes on in the new village: 100 gifts, each placed on its own plot.
  for (let i = 0; i < 100; i++) await t.gift(i % 2 ? "ege" : "ada");
  const busy = (await t.village()).data;
  assert.equal(busy.buildings.length, 108);
  assert.ok(busy.buildings.every((b) => b.placement));
  assert.deepEqual(validateLayout((await readLayout(t.db, s.active.id)).layout), []);

  // 6. Back to the old village within the window: every building, old and new, is there.
  s = await t.state();
  assert.equal(s.previous.coverage.missing, 0);
  const back = await call(t.app, `/owner/village/${t.gid}/rollback`, { method: "POST", headers: t.owner, body: { active: s.active.id, contentRev: s.contentRev } });
  assert.equal(back.status, 200, JSON.stringify(back.data));
  s = back.data;
  assert.deepEqual([s.active.id, s.previous], [null, null]);
  assert.ok(s.draft, "the new village waits as a draft");
  const old = await t.village("ada", false);
  assert.equal(old.status, 200);
  assert.equal(old.data.buildings.length, 108);
  assert.equal(t.one("SELECT count(*) AS n FROM buildings WHERE group_id = ?", t.gid).n, 108);
  assert.equal(t.one("SELECT count(*) AS n FROM bricks_log WHERE reason = 'gift'").n, 107);
});

test("n46 G: from one new village to another, and back only once the old one has caught up", async () => {
  const t = await team();
  for (let i = 0; i < 4; i++) await t.gift();
  let s = (await t.draft()).data;
  s = (await call(t.app, `/owner/village/${t.gid}/activate`, { method: "POST", headers: t.owner, body: { draftId: s.draft.id, active: null, contentRev: s.contentRev } })).data;
  const first = s.active.id;
  await t.gift();
  // A second, fresh draft (say, a newer planner) replaces the first village; the first can be gone back to.
  s = (await t.draft()).data;
  s = (await call(t.app, `/owner/village/${t.gid}/activate`, { method: "POST", headers: t.owner, body: { draftId: s.draft.id, active: first, contentRev: s.contentRev } })).data;
  assert.deepEqual([s.previous.id, s.previous.kind, s.previous.daysLeft], [first, "v2", 14]);
  assert.equal(t.one("SELECT status FROM village_layouts WHERE id = ?", `legacy-${t.gid}`).status, "baseline");
  // Something new while the second village is live: the first is behind and going back is refused…
  await t.gift("ege");
  s = await t.state();
  assert.ok(s.previous.behind > 0);
  const refused = await call(t.app, `/owner/village/${t.gid}/rollback`, { method: "POST", headers: t.owner, body: { active: s.active.id, contentRev: s.contentRev } });
  assert.equal(refused.status, 409);
  // …until it is brought up to date (it keeps its window).
  const synced = await t.draft({ role: "previous", base: s.previous.id });
  assert.equal(synced.status, 201, JSON.stringify(synced.data));
  s = synced.data;
  assert.deepEqual([s.previous.behind, s.previous.coverage.missing, s.previous.daysLeft], [0, 0, 14]);
  const back = await call(t.app, `/owner/village/${t.gid}/rollback`, { method: "POST", headers: t.owner, body: { active: s.active.id, contentRev: s.contentRev } });
  assert.equal(back.status, 200, JSON.stringify(back.data));
  const v = (await t.village()).data;
  assert.equal(v.layoutId, back.data.active.id);
  assert.equal(v.buildings.length, 6);
  assert.ok(v.buildings.every((b) => b.placement));
});

test("n46 G: the server checks what the browser sends, and only the owner may switch", async () => {
  const t = await team();
  for (let i = 0; i < 5; i++) await t.gift();
  const source = (await call(t.app, `/owner/village/${t.gid}/source`, { headers: t.owner })).data;
  const { layout } = planDraft(source);
  const send = (l, extra = {}) => call(t.app, `/owner/village/${t.gid}/layouts`, { method: "POST", headers: t.owner, body: { layout: l, contentRev: source.contentRev, ...extra } });
  // Another team's seed, a missing building, two on one spot, an old content revision.
  assert.equal((await send({ ...layout, seed: "group:other" })).status, 422);
  assert.equal((await send({ ...layout, plots: layout.plots.slice(0, -1) })).status, 422);
  const [a, b] = layout.plots.filter((p) => p.subject);
  const clash = { ...layout, plots: layout.plots.map((p) => (p === b ? { ...b, x: a.x, y: a.y, ground: a.ground, plot: a.plot, over: a.over } : p)) };
  // Two on one spot is found by the rule check, which runs in parts after storing; such a draft never goes live.
  const stored = await send(clash);
  assert.equal(stored.status, 201);
  const check = await call(t.app, `/owner/village/${t.gid}/layouts/${stored.data.draft.id}/check`, { method: "POST", headers: t.owner, body: { from: 0 } });
  assert.equal(check.status, 422);
  assert.match(check.data.error, /kural sorunu/);
  const unsound = await t.state();
  assert.equal(unsound.draft.sound, false);
  assert.equal((await call(t.app, `/owner/village/${t.gid}/activate`, { method: "POST", headers: t.owner, body: { draftId: unsound.draft.id, active: null, contentRev: unsound.contentRev } })).status, 409);
  assert.equal((await send(layout, { contentRev: source.contentRev - 1 })).status, 409);
  // Nobody else gets in.
  for (const path of [`/owner/village/${t.gid}`, `/owner/village/${t.gid}/source`]) assert.equal((await call(t.app, path, { headers: { Cookie: t.people.ada } })).status, 401);
  assert.equal((await call(t.app, `/owner/village/${t.gid}/layouts`, { method: "POST", headers: { Cookie: t.people.ada }, body: { layout, contentRev: source.contentRev } })).status, 401);
  assert.equal((await call(t.app, `/owner/village/${t.gid}/activate`, { method: "POST", headers: { "X-Owner-Key": "wrong-key-wrong-key" }, body: {} })).status, 401);
  // The good one goes in; no going back before a switch.
  assert.equal((await send(layout)).status, 201);
  const s = await t.state();
  assert.equal((await call(t.app, `/owner/village/${t.gid}/rollback`, { method: "POST", headers: t.owner, body: { active: null, contentRev: s.contentRev } })).status, 409);
});

test("n46 G: the 14-day window closes; an old village is not gone back to after it", async () => {
  const t = await team();
  await t.gift();
  let s = (await t.draft()).data;
  s = (await call(t.app, `/owner/village/${t.gid}/activate`, { method: "POST", headers: t.owner, body: { draftId: s.draft.id, active: null, contentRev: s.contentRev } })).data;
  t.sqlite.prepare("UPDATE village_layouts SET rollback_until = ? WHERE id = ?").run(Date.now() - 1, `legacy-${t.gid}`);
  s = await t.state();
  assert.deepEqual([s.previous.open, s.previous.daysLeft], [false, 0]);
  const late = await call(t.app, `/owner/village/${t.gid}/rollback`, { method: "POST", headers: t.owner, body: { active: s.active.id, contentRev: s.contentRev } });
  assert.equal(late.status, 409);
  assert.match(late.data.error, /süresi doldu/);
});
