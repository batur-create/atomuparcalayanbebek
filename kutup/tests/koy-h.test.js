// n46 H — owner corrections across layouts (plan §11.4): taking a building
// back or removing a person while a draft waits, after the switch and before
// going back. Every layout lets go of their plots; nothing else moves.
// Temporary databases only.
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
const OWNER = "n46h-owner-key-1234";
const MODELS = ["ev", "kulube", "kahve", "sahaf", "bostan", "konak", "kule", "cicekci"];

async function team() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const db = sqliteAdapter(sqlite);
  const app = createApp({ db, config: { adminKey: OWNER, testHooks: true } });
  const ada = await call(app, "/groups", { method: "POST", body: { name: "Ada", username: "ada_n46h", password: "n46h-pass-1" } });
  const ege = await call(app, "/join", { method: "POST", body: { invite: ada.data.group.invite, name: "Ege", username: "ege_n46h", password: "n46h-pass-1" } });
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
    call(app, "/village", { headers: { Cookie: people[who], ...(v2 ? { "X-Kutup-Village-Version": "2" } : {}) } });
  const one = (sql, ...args) => sqlite.prepare(sql).get(...args);
  sqlite.prepare("UPDATE members SET bricks = 2000").run();
  return { sqlite, db, app, gid, ids, people, owner, gift, state, draft, village, one };
}

const placements = (t, id) => t.one("SELECT count(*) AS n FROM village_placements WHERE layout_id = ?", id).n;
const where = (layout) => Object.fromEntries(layout.plots.filter((p) => p.subject).map((p) => [p.subject.id, [p.id, p.x, p.y, p.facing]]));

test("n46 H: owner deletes reach the draft, the new village and the way back (plan §11.4)", async () => {
  const t = await team();
  const gifts = [];
  for (let i = 0; i < 6; i++) gifts.push(await t.gift(i % 2 ? "ege" : "ada"));
  const start = await call(t.app, "/focus", { method: "POST", headers: { Cookie: t.people.ege }, body: { action: "start", strict: true, model: "ev", minutes: 50, requestKey: "n46h-request-key-0001" } });
  assert.equal(start.status, 200, JSON.stringify(start.data));
  let s = (await t.draft()).data;
  const draftId = s.draft.id;
  const before = where((await readLayout(t.db, draftId)).layout);

  // 1. A wrong gift taken back while the draft waits: its plot goes from the draft and the old village alike.
  assert.equal((await call(t.app, `/owner/buildings/${gifts[0]}`, { method: "DELETE", headers: t.owner })).status, 200);
  let draft = (await readLayout(t.db, draftId)).layout;
  assert.equal(draft.plots.some((p) => p.subject?.id === gifts[0]), false);
  assert.equal(t.one("SELECT count(*) AS n FROM village_placements WHERE subject_id = ?", gifts[0]).n, 0);
  assert.deepEqual(validateLayout(draft), []);
  s = await t.state();
  assert.deepEqual([s.draft.coverage.missing, s.draft.coverage.extra], [0, 0]);
  // Catching up keeps everyone else where they were.
  if (s.draft.behind) s = (await t.draft({ base: draftId })).data;
  assert.equal(s.draft.behind, 0);
  const kept = where((await readLayout(t.db, s.draft.id)).layout);
  for (const [id, at] of Object.entries(kept)) if (before[id]) assert.deepEqual(at, before[id], id);

  // 2. The switch, then life in the new village.
  s = (await call(t.app, `/owner/village/${t.gid}/activate`, { method: "POST", headers: t.owner, body: { draftId: s.draft.id, active: null, contentRev: s.contentRev } })).data;
  const active = s.active.id;
  for (let i = 0; i < 10; i++) gifts.push(await t.gift(i % 2 ? "ege" : "ada"));

  // 3. Removing Ege (buildings, running session and all) and taking one of Ada's back, in the new village.
  assert.equal((await call(t.app, `/owner/members/${t.ids.ege}`, { method: "DELETE", headers: t.owner })).status, 200);
  const adaGift = gifts.find((id) => t.one("SELECT member_id AS m FROM buildings WHERE id = ?", id)?.m === t.ids.ada);
  assert.equal((await call(t.app, `/owner/buildings/${adaGift}`, { method: "DELETE", headers: t.owner })).status, 200);
  const left = t.one("SELECT count(*) AS n FROM buildings WHERE group_id = ?", t.gid).n;
  assert.equal(t.one("SELECT count(*) AS n FROM buildings WHERE member_id = ?", t.ids.ada).n, left);
  assert.equal(placements(t, active), left, "one plot per building left, Ege's site gone");
  assert.deepEqual(validateLayout((await readLayout(t.db, active)).layout), []);
  const v2 = (await t.village()).data;
  assert.equal(v2.buildings.length, left);
  assert.ok(v2.buildings.every((b) => b.placement));
  assert.equal(v2.sites?.length || 0, 0);

  // 4. Going back: the old village has exactly the same buildings, nothing missing, nothing extra.
  s = await t.state();
  assert.deepEqual([s.previous.coverage.missing, s.previous.coverage.extra], [0, 0]);
  // (The old village keeps its own positions on the buildings themselves, not as layout rows.)
  assert.equal(s.previous.kind, "legacy");
  const back = await call(t.app, `/owner/village/${t.gid}/rollback`, { method: "POST", headers: t.owner, body: { active, contentRev: s.contentRev } });
  assert.equal(back.status, 200, JSON.stringify(back.data));
  const old = (await t.village("ada", false)).data;
  assert.equal(old.buildings.length, left);
  // The left-behind new village, now a draft, let go of them as well.
  assert.ok(back.data.draft);
  assert.equal(placements(t, back.data.draft.id), left);
});

test("n46 H: the oldest buildings, saved before models existed, get their place as drawn today", async () => {
  const t = await team();
  const gifts = [];
  for (let i = 0; i < 4; i++) gifts.push(await t.gift());
  // As in a team from the first days: no model, only a kind (the old village draws them by kind).
  t.sqlite.prepare("UPDATE buildings SET model = NULL, kind = 'house' WHERE id = ?").run(gifts[0]);
  t.sqlite.prepare("UPDATE buildings SET model = NULL, kind = 'cottage' WHERE id = ?").run(gifts[1]);
  const source = (await call(t.app, `/owner/village/${t.gid}/source`, { headers: t.owner })).data;
  assert.equal(planDraft(source).missing.length, 0);
  const made = await t.draft();
  assert.equal(made.status, 201, JSON.stringify(made.data));
  const plots = (await readLayout(t.db, made.data.draft.id)).layout.plots;
  assert.equal(plots.find((p) => p.subject?.id === gifts[0]).model, "ev");
  assert.equal(plots.find((p) => p.subject?.id === gifts[1]).model, "kulube");
  assert.deepEqual([made.data.draft.coverage.missing, made.data.draft.sound], [0, true]);
});
