// n43 — komuta merkezi: gifts, blueprints, taking a building back, team
// announcements and building requests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createApp } from "../server/app.js";
import { sqliteAdapter } from "../server/sqlite.js";
import { REQUEST_KINDS, allowedStatuses, statusLabel, statusPush } from "../shared/requests.js";
import { mergeVillage } from "../src/villageWorld.js";

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

async function team() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const app = createApp({ db: sqliteAdapter(sqlite), config: { adminKey: "n43-owner-key-123" } });
  const owner = { "X-Owner-Key": "n43-owner-key-123" };
  const batur = await call(app, "/groups", { method: "POST", body: { name: "Batur", username: "batur_n43", password: "n43-pass-1" } });
  const friend = await call(app, "/join", { method: "POST", body: { invite: batur.data.group.invite, name: "Sıla", username: "sila_n43", password: "n43-pass-1" } });
  return { sqlite, app, owner, batur, friend, as: (who) => ({ Cookie: who.cookie }) };
}

test("Batur gives any building: it lands finished, replays as a gift, and says who it is from (n43)", async () => {
  const { sqlite, app, owner, friend, as } = await team();
  const id = friend.data.memberId;
  assert.equal((await call(app, `/owner/members/${id}/gift`, { method: "POST", body: { model: "kolezyum" } })).status, 401, "needs the owner");
  assert.equal((await call(app, `/owner/members/${id}/gift`, { method: "POST", headers: owner, body: { model: "yok-boyle" } })).status, 400);
  const gift = await call(app, `/owner/members/${id}/gift`, { method: "POST", headers: owner, body: { model: "kolezyum", note: "Az kalmıştı, al bakalım" } });
  assert.equal(gift.status, 201);
  const row = sqlite.prepare("SELECT * FROM buildings WHERE id = ?").get(gift.data.id);
  assert.equal(row.member_id, id);
  assert.equal(row.model, "kolezyum");
  assert.equal(row.kind, "house");
  assert.equal(row.gift, "Az kalmıştı, al bakalım");
  assert.ok(row.pos_x !== null && row.district_id, "it has a plot in the member's district");
  // The village shows it with its note; the next app opening plays the replay as a gift.
  const village = (await call(app, "/village", { headers: as(friend) })).data;
  const shown = village.buildings.find((b) => b[0] === gift.data.id);
  assert.equal(shown[11], "kolezyum");
  assert.equal(shown[13], "Az kalmıştı, al bakalım");
  assert.equal(village.total, 1);
  const deliveries = (await call(app, "/build-deliveries", { headers: as(friend) })).data;
  assert.equal(deliveries.length, 1);
  assert.equal(deliveries[0].gift, "Az kalmıştı, al bakalım");
  assert.equal(deliveries[0].reward, 0, "a gift pays nothing");
  // Board line and wallet line; the balance does not move.
  const state = (await call(app, "/state", { headers: as(friend) })).data;
  assert.ok(state.messages.some((m) => m.kind === "system" && m.memberId === id && /Batur'dan hediye aldı: Kolezyum/.test(m.text)));
  assert.equal(state.members.find((m) => m.id === id).buildings, 1, "the building counts in the village");
  const wallet = (await call(app, "/wallet", { headers: as(friend) })).data;
  assert.equal(wallet.built.kolezyum, 1);
  assert.equal(sqlite.prepare("SELECT bricks FROM members WHERE id = ?").get(id).bricks, 0);
  // Badges are earned by work: a present does not count towards them.
  const badges = (await call(app, `/achievements/${id}`, { headers: as(friend) })).data;
  assert.equal(badges.list.find((b) => b.key === "first-build").at, null, "no “İlk tuğla” for a present");
  // Without a note it still says it is a present.
  const plain = await call(app, `/owner/members/${id}/gift`, { method: "POST", headers: owner, body: { model: "kulube" } });
  assert.equal(sqlite.prepare("SELECT gift FROM buildings WHERE id = ?").get(plain.data.id).gift, "Batur'dan hediye");
});

test("Batur takes a building back; a client holding the village notices and refetches (n43)", async () => {
  const { sqlite, app, owner, friend, batur, as } = await team();
  const id = friend.data.memberId;
  const a = await call(app, `/owner/members/${id}/gift`, { method: "POST", headers: owner, body: { model: "kule" } });
  const b = await call(app, `/owner/members/${id}/gift`, { method: "POST", headers: owner, body: { model: "ev" } });
  await call(app, `/buildings/${a.data.id}/like`, { method: "POST", headers: as(batur), body: {} });
  const before = (await call(app, "/village", { headers: as(friend) })).data;
  let held = mergeVillage(null, before);
  assert.equal(held.buildings.length, 2);
  assert.equal(held.stale, false);
  const list = (await call(app, `/owner/members/${id}/village`, { headers: owner })).data;
  assert.deepEqual(list.buildings.map((x) => x.model).sort(), ["ev", "kule"]);
  assert.equal((await call(app, `/owner/buildings/${a.data.id}`, { method: "DELETE" })).status, 401);
  assert.equal((await call(app, `/owner/buildings/${a.data.id}`, { method: "DELETE", headers: owner })).status, 200);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM buildings").get().n, 1);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM building_likes").get().n, 0);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM build_deliveries WHERE id = ?").get(a.data.id).n, 0);
  const district = sqlite.prepare("SELECT buildings FROM districts WHERE member_id = ?").get(id);
  assert.equal(district.buildings, 1, "the plot is free again");
  // The partial answer carries no row for the removed one: the count gives it away.
  const after = (await call(app, `/village?rev=${held.rev}&after=${held.until}`, { headers: as(friend) })).data;
  held = mergeVillage(held, after);
  assert.equal(held.stale, true);
  const whole = mergeVillage(null, (await call(app, "/village", { headers: as(friend) })).data);
  assert.deepEqual(whole.buildings.map((x) => x.id), [b.data.id]);
  assert.equal((await call(app, `/owner/buildings/${a.data.id}`, { method: "DELETE", headers: owner })).status, 404);
});

test("Batur gives a blueprint once; only buildings that need one (n43)", async () => {
  const { sqlite, app, owner, friend, as } = await team();
  const id = friend.data.memberId;
  assert.equal((await call(app, `/owner/members/${id}/unlock`, { method: "POST", headers: owner, body: { model: "kulube" } })).status, 400, "the cottage is always open");
  assert.equal((await call(app, `/owner/members/${id}/unlock`, { method: "POST", headers: owner, body: { model: "fener" } })).status, 201);
  assert.equal((await call(app, `/owner/members/${id}/unlock`, { method: "POST", headers: owner, body: { model: "fener" } })).status, 409, "not twice");
  assert.deepEqual((await call(app, "/wallet", { headers: as(friend) })).data.unlocks, ["fener"]);
  assert.equal(sqlite.prepare("SELECT source FROM unlocks WHERE member_id = ?").get(id).source, "gift");
  assert.deepEqual((await call(app, `/owner/members/${id}/village`, { headers: owner })).data.unlocks, ["fener"]);
});

test("an announcement needs Batur's own profile, stands out on the board and is one per send (n43)", async () => {
  const { app, owner, batur, friend, as } = await team();
  const groupId = batur.data.group.id;
  assert.equal((await call(app, `/owner/groups/${groupId}/announce`, { method: "POST", headers: owner, body: { text: "Selam millet" } })).status, 409, "no ✦ profile yet");
  await call(app, `/owner/members/${batur.data.memberId}/badge`, { method: "POST", headers: owner, body: { dev: true } });
  assert.equal((await call(app, `/owner/groups/${groupId}/announce`, { method: "POST", body: { text: "Selam millet" } })).status, 401);
  const sent = await call(app, `/owner/groups/${groupId}/announce`, { method: "POST", headers: owner, body: { text: "Yeni sürüm geldi, Yeniliklere bakın!" } });
  assert.equal(sent.status, 201);
  const state = (await call(app, "/state", { headers: as(friend) })).data;
  const line = state.messages.find((m) => m.id === sent.data.id);
  assert.equal(line.kind, "announce");
  assert.equal(line.memberId, batur.data.memberId);
  // Friends can heart it like any other line.
  assert.equal((await call(app, `/messages/${line.id}/react`, { method: "POST", headers: as(friend), body: {} })).status, 200);
});

test("anyone can ask for a building; it reaches Batur as its own kind with its own stages (n43)", async () => {
  const { app, owner, friend, as } = await team();
  assert.ok(REQUEST_KINDS.includes("build"));
  assert.deepEqual(allowedStatuses("build"), ["new", "seen", "accepted", "building", "done", "declined"]);
  assert.deepEqual(statusLabel("build", "done"), ["Katalogda", "🏗️"]);
  assert.match(statusPush("build", "done"), /katalogda/);
  const sent = await call(app, "/feedback", { method: "POST", headers: as(friend), body: { kind: "build", text: "Ayasofya gelsin, kubbesiyle!" } });
  assert.equal(sent.status, 201);
  const box = (await call(app, "/owner/feedback", { headers: owner })).data;
  assert.equal(box[0].kind, "build");
  const moved = await call(app, `/owner/feedback/${box[0].id}`, { method: "POST", headers: owner, body: { status: "building" } });
  assert.equal(moved.data.item.status, "building");
  assert.deepEqual(statusLabel("build", "building"), ["Çiziliyor", "📐"]);
});
