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

// n45 — Ekipler: Batur opens a team with nobody in it, renames it and hands
// out its invite; the team stays when its last member leaves.
const KEY = "n45-request-key-0001";
test("Batur opens an empty team: owner only, checked on the server, no person and no cookie (n45)", async () => {
  const { sqlite, app, owner, batur, friend, as } = await team();
  const count = (table) => sqlite.prepare(`SELECT count(*) AS n FROM ${table}`).get().n;
  const people = count("members"), sessions = count("sessions"), owners = count("owner_sessions");
  assert.equal((await call(app, "/owner/groups", { method: "POST", body: { name: "Hukuk", requestKey: KEY } })).status, 401);
  assert.equal((await call(app, "/owner/groups", { method: "POST", headers: { Cookie: batur.cookie }, body: { name: "Hukuk", requestKey: KEY } })).status, 401, "a member's session is not the owner");
  assert.equal((await call(app, "/owner/groups", { method: "POST", headers: owner, body: { name: "H", requestKey: KEY } })).status, 400);
  assert.equal((await call(app, "/owner/groups", { method: "POST", headers: owner, body: { name: "x".repeat(41), requestKey: KEY } })).status, 400);
  assert.equal((await call(app, "/owner/groups", { method: "POST", headers: owner, body: { name: "Hukuk" } })).status, 400, "the request key is required");
  assert.equal((await call(app, "/owner/groups", { method: "POST", headers: owner, body: { name: "Hukuk", requestKey: "kısa" } })).status, 400);
  const made = await call(app, "/owner/groups", { method: "POST", headers: owner, body: { name: "  Hukuk   tayfası ", requestKey: KEY } });
  assert.equal(made.status, 201);
  assert.equal(made.cookie, undefined, "no cookie: neither Batur's nor anyone's session changes");
  assert.equal(made.data.group.name, "Hukuk tayfası");
  assert.equal(made.data.group.ownerMade, 1);
  assert.deepEqual(made.data.group.members, []);
  assert.ok(made.data.group.invite.length >= 24);
  assert.equal(count("members"), people, "no placeholder member, no second account");
  assert.equal(count("sessions"), sessions);
  assert.equal(count("owner_sessions"), owners);
  assert.equal(count("districts"), 2, "no plot is drawn for nobody");
  // Both signed-in members are exactly where they were.
  assert.equal((await call(app, "/state", { headers: as(batur) })).data.group.id, batur.data.group.id);
  assert.equal((await call(app, "/state", { headers: as(friend) })).data.members.length, 2);
  const listed = (await call(app, "/owner/groups", { headers: owner })).data;
  assert.equal(listed[0].id, made.data.group.id, "newest first");
  assert.equal(listed[0].members.length, 0);
  assert.equal(listed[0].ownerMade, 1);
  assert.equal(listed.find((g) => g.id === batur.data.group.id).ownerMade, 0);
  const welcome = (await call(app, `/invites/${made.data.group.invite}`)).data;
  assert.deepEqual(welcome, { name: "Hukuk tayfası", count: 0, faces: [] });
});

test("sending the same create again, or twice at once, gives back one team (n45)", async () => {
  const { sqlite, app, owner } = await team();
  const groups = () => sqlite.prepare("SELECT count(*) AS n FROM groups").get().n;
  const first = await call(app, "/owner/groups", { method: "POST", headers: owner, body: { name: "Tıp", requestKey: KEY } });
  const again = await call(app, "/owner/groups", { method: "POST", headers: owner, body: { name: "Tıp", requestKey: KEY } });
  assert.equal(again.status, 200);
  assert.equal(again.data.created, false);
  assert.equal(again.data.group.id, first.data.group.id);
  assert.equal(again.data.group.invite, first.data.group.invite);
  assert.equal(groups(), 2);
  const other = "n45-request-key-0002";
  const both = await Promise.all([1, 2, 3].map(() => call(app, "/owner/groups", { method: "POST", headers: owner, body: { name: "Mimarlık", requestKey: other } })));
  assert.equal(new Set(both.map((r) => r.data.group.id)).size, 1);
  assert.deepEqual(both.map((r) => r.status).sort(), [200, 200, 201]);
  assert.equal(groups(), 3);
  // The same key with other starting parameters is refused and changes nothing.
  const clash = await call(app, "/owner/groups", { method: "POST", headers: owner, body: { name: "Hukuk", requestKey: KEY } });
  assert.equal(clash.status, 409);
  assert.match(clash.data.error, /“Tıp” adıyla/);
  assert.equal(groups(), 3);
  assert.equal(sqlite.prepare("SELECT name FROM groups WHERE request_key = ?").get(KEY).name, "Tıp");
  // Spacing is normalised the same way as on creation, so it is the same request.
  assert.equal((await call(app, "/owner/groups", { method: "POST", headers: owner, body: { name: "  Tıp ", requestKey: KEY } })).status, 200);
  // A new form (new key) is a new team, even with the same name.
  assert.equal((await call(app, "/owner/groups", { method: "POST", headers: owner, body: { name: "Tıp", requestKey: "n45-request-key-0003" } })).status, 201);
  assert.equal(groups(), 4);
});

test("a repeat is judged by the name the team was created with, not its current name (n45)", async () => {
  const { sqlite, app, owner } = await team();
  const groups = () => sqlite.prepare("SELECT count(*) AS n FROM groups").get().n;
  const first = await call(app, "/owner/groups", { method: "POST", headers: owner, body: { name: "Tıp", requestKey: KEY } });
  assert.equal(first.status, 201);
  assert.equal((await call(app, `/owner/groups/${first.data.group.id}/name`, { method: "POST", headers: owner, body: { name: "Tıp Fakültesi" } })).status, 200);
  // The late repeat of the original request still finds its team, under the new name.
  const late = await call(app, "/owner/groups", { method: "POST", headers: owner, body: { name: "Tıp", requestKey: KEY } });
  assert.equal(late.status, 200);
  assert.equal(late.data.created, false);
  assert.equal(late.data.group.id, first.data.group.id);
  assert.equal(late.data.group.name, "Tıp Fakültesi");
  // Sending the current name with the old key is a different request: refused.
  const renamedClash = await call(app, "/owner/groups", { method: "POST", headers: owner, body: { name: "Tıp Fakültesi", requestKey: KEY } });
  assert.equal(renamedClash.status, 409);
  assert.equal(groups(), 2);
  assert.deepEqual({ ...sqlite.prepare("SELECT name, request_name FROM groups WHERE id = ?").get(first.data.group.id) }, { name: "Tıp Fakültesi", request_name: "Tıp" }, "a rename never touches the starting parameters");
  // Teams opened in the app carry no request parameters.
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM groups WHERE owner_made = 0 AND (request_key IS NOT NULL OR request_name IS NOT NULL)").get().n, 0);
});

test("Batur renames a team; members see it on their next read (n45)", async () => {
  const { sqlite, app, owner, batur, friend, as } = await team();
  const id = batur.data.group.id;
  const rev = sqlite.prepare("SELECT rev FROM groups WHERE id = ?").get(id).rev;
  assert.equal((await call(app, `/owner/groups/${id}/name`, { method: "POST", body: { name: "Yeni ad" } })).status, 401);
  assert.equal((await call(app, `/owner/groups/${id}/name`, { method: "POST", headers: as(batur), body: { name: "Yeni ad" } })).status, 401);
  assert.equal((await call(app, `/owner/groups/${id}/name`, { method: "POST", headers: owner, body: { name: " " } })).status, 400);
  assert.equal((await call(app, `/owner/groups/${id}/name`, { method: "POST", headers: owner, body: { name: 5 } })).status, 400);
  assert.equal((await call(app, "/owner/groups/yok/name", { method: "POST", headers: owner, body: { name: "Yeni ad" } })).status, 404);
  const renamed = await call(app, `/owner/groups/${id}/name`, { method: "POST", headers: owner, body: { name: "Kütüp  çekirdek" } });
  assert.equal(renamed.status, 200);
  assert.equal(renamed.data.name, "Kütüp çekirdek");
  assert.ok(sqlite.prepare("SELECT rev FROM groups WHERE id = ?").get(id).rev > rev, "phones polling by revision pick it up");
  assert.equal((await call(app, "/state", { headers: as(friend) })).data.group.name, "Kütüp çekirdek");
  assert.equal((await call(app, `/invites/${batur.data.group.invite}`)).data.name, "Kütüp çekirdek", "the invite and the members are untouched");
  assert.equal((await call(app, "/state", { headers: as(batur) })).data.members.length, 2);
});

test("an owner-made team keeps its invite, takes members, and stays when the last one leaves (n45)", async () => {
  const { sqlite, app, owner, batur, as } = await team();
  const made = (await call(app, "/owner/groups", { method: "POST", headers: owner, body: { name: "Hukuk", requestKey: KEY } })).data.group;
  // Renewing with the panel's existing permission closes the old link.
  assert.equal((await call(app, `/owner/groups/${made.id}/invite`, { method: "POST", headers: as(batur), body: {} })).status, 401);
  const renewed = await call(app, `/owner/groups/${made.id}/invite`, { method: "POST", headers: owner, body: {} });
  assert.equal(renewed.status, 200);
  assert.equal((await call(app, `/invites/${made.invite}`)).status, 404);
  assert.equal((await call(app, "/join", { method: "POST", body: { invite: made.invite, name: "Eski", username: "eski_n45", password: "n45-pass-1" } })).status, 404);
  const ada = await call(app, "/join", { method: "POST", body: { invite: renewed.data.invite, name: "Ada", username: "ada_n45", password: "n45-pass-1" } });
  assert.equal(ada.status, 201);
  assert.equal(ada.data.group.id, made.id);
  assert.equal(ada.data.members.length, 1, "nobody else was hiding in the team");
  // Member and announcement tools work on it as on any team.
  assert.equal((await call(app, `/owner/groups/${made.id}/announce`, { method: "POST", headers: owner, body: { text: "Hoş geldin" } })).status, 409, "needs Batur's ✦ profile there, as before");
  const bricks = await call(app, `/owner/members/${ada.data.memberId}/bricks`, { method: "POST", headers: owner, body: { delta: 10, note: "hoş geldin" } });
  assert.equal(bricks.status, 200);
  // The last member leaves: the team, its name and invite stay; the next person joins it.
  assert.equal((await call(app, "/leave", { method: "POST", headers: as(ada), body: {} })).status, 200);
  const kept = sqlite.prepare("SELECT name, invite, owner_made FROM groups WHERE id = ?").get(made.id);
  assert.deepEqual({ ...kept }, { name: "Hukuk", invite: renewed.data.invite, owner_made: 1 });
  assert.equal((await call(app, "/owner/groups", { headers: owner })).data.find((g) => g.id === made.id).members.length, 0);
  const bora = await call(app, "/join", { method: "POST", body: { invite: renewed.data.invite, name: "Bora", username: "bora_n45", password: "n45-pass-1" } });
  assert.equal(bora.status, 201);
  assert.equal(bora.data.group.id, made.id);
  // Removing the last member from the panel keeps it too.
  assert.equal((await call(app, `/owner/members/${bora.data.memberId}`, { method: "DELETE", headers: owner })).status, 200);
  assert.ok(sqlite.prepare("SELECT 1 FROM groups WHERE id = ?").get(made.id));
  // A team opened in the app still goes away with its last member, as before.
  const solo = await call(app, "/groups", { method: "POST", body: { name: "Tek", groupName: "Geçici", username: "tek_n45", password: "n45-pass-1" } });
  await call(app, "/leave", { method: "POST", headers: as(solo), body: {} });
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM groups WHERE id = ?").get(solo.data.group.id).n, 0);
});

test("a new team shows in the Anıtkabir picker but no project starts by itself (n45)", async () => {
  const { sqlite, app, owner } = await team();
  const made = (await call(app, "/owner/groups", { method: "POST", headers: owner, body: { name: "Hukuk", requestKey: KEY } })).data.group;
  const listed = (await call(app, "/owner/groups", { headers: owner })).data;
  assert.ok(listed.some((g) => g.id === made.id), "the picker lists /owner/groups");
  assert.equal((await call(app, `/owner/imece?group=${made.id}`, { headers: owner })).data, null, "no project for the new team");
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM imece_projects").get().n, 0);
  // Four people from the same team are still required.
  const four = [];
  for (const name of ["Ali", "Can"]) {
    const r = await call(app, "/join", { method: "POST", body: { invite: made.invite, name, username: `${name.toLowerCase()}_n45`, password: "n45-pass-1" } });
    four.push(r.data.memberId);
  }
  assert.equal((await call(app, "/owner/imece", { method: "POST", headers: owner, body: { members: four, groupId: made.id } })).status, 400);
  assert.equal(sqlite.prepare("SELECT count(*) AS n FROM imece_projects").get().n, 0);
});

test("backup and restore keep a team Batur opened (n45)", async () => {
  const { app, owner } = await team();
  const made = (await call(app, "/owner/groups", { method: "POST", headers: owner, body: { name: "Hukuk", requestKey: KEY } })).data.group;
  const backup = (await call(app, "/owner/backup", { headers: owner })).data;
  assert.equal(backup.tables.groups.find((g) => g.id === made.id).owner_made, 1);
  const { restoreBackup } = await import("../server/restore.js");
  const copy = new DatabaseSync(":memory:");
  await restoreBackup(backup, copy);
  assert.deepEqual({ ...copy.prepare("SELECT name, owner_made, request_key, request_name FROM groups WHERE id = ?").get(made.id) }, { name: "Hukuk", owner_made: 1, request_key: KEY, request_name: "Hukuk" });
  copy.close();
});
