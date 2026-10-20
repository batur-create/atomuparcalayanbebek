// End-to-end API suite. The same scenarios run against the Node host (node:sqlite + SSE)
// and against the Cloudflare Worker in local workerd with D1 (`wrangler dev`).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { fakePushService, freePort, pushReceiver, verifyVapid, waitFor } from "./helpers.js";
import { rhythmEnd } from "../shared/catalog.js";

const root = resolve(import.meta.dirname, "..");

export function defineSuite(target) {
  const directory = mkdtempSync(resolve(tmpdir(), `kutup-${target}-`));
  const adminKey = randomBytes(24).toString("hex");
  let child, base, push;
  const people = {};
  let group, plan, messageId, feedbackId;
  let accountNumber = 0;

  async function start() {
    if (target === "node") {
      child = spawn(process.execPath, ["server/index.js"], {
        cwd: root,
        env: {
          ...process.env,
          PORT: "0",
          HOST: "127.0.0.1",
          DATA_DIR: directory,
          ADMIN_KEY: adminKey,
          KUTUP_TEST_HOOKS: "1",
          PUSH_EXTRA_HOSTS: "127.0.0.1",
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      base = await new Promise((resolveBase, reject) => {
        const timer = setTimeout(() => reject(new Error("Server startup timeout")), 15000);
        child.stdout.on("data", (chunk) => {
          const match = chunk.toString().match(/port (\d+)/);
          if (match) {
            clearTimeout(timer);
            resolveBase(`http://127.0.0.1:${match[1]}`);
          }
        });
        child.stderr.on("data", (chunk) => process.stderr.write(chunk));
        child.once("exit", (code) => code && reject(new Error(`Server exited ${code}`)));
      });
    } else {
      const port = await freePort();
      child = spawn(
        process.execPath,
        [
          resolve(root, "node_modules/wrangler/bin/wrangler.js"),
          "dev",
          "--port", String(port),
          "--ip", "127.0.0.1",
          "--persist-to", directory,
          "--var", `ADMIN_KEY:${adminKey}`,
          "--var", "KUTUP_TEST_HOOKS:1",
          "--var", "PUSH_EXTRA_HOSTS:127.0.0.1",
          "--log-level", "error",
          "--show-interactive-dev-session=false",
        ],
        {
          cwd: root,
          env: {
            ...process.env,
            XDG_CONFIG_HOME: resolve(directory, "config"),
            WRANGLER_LOG_PATH: resolve(directory, "wrangler.log"),
            WRANGLER_SEND_METRICS: "false",
            CI: "1",
          },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      let output = "";
      child.stdout.on("data", (c) => (output += c));
      child.stderr.on("data", (c) => (output += c));
      base = `http://127.0.0.1:${port}`;
      try {
        await waitFor(
          () => {
            if (child.exitCode !== null) throw new Error(`Wrangler exited ${child.exitCode}`);
            return fetch(`${base}/api/health`).then((r) => r.ok).catch(() => false);
          },
          90000,
          "wrangler dev",
        );
      } catch (error) {
        console.error(output.replaceAll(adminKey, "[test owner key]"));
        throw error;
      }
    }
  }
  async function stop() {
    if (!child || child.exitCode !== null) return;
    const done = new Promise((r) => child.once("exit", r));
    if (process.platform === "win32")
      try {
        execFileSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      } catch {}
    else child.kill("SIGTERM");
    await done;
  }
  async function request(path, { cookie, body, method, owner, headers = {}, account = true } = {}) {
    if (account && ["/groups", "/join"].includes(path) && body?.name && body.username === undefined)
      body = { ...body, username: body.name === "Deniz" ? "deniz" : `test_${++accountNumber}`, password: "test-pass-123" };
    const response = await fetch(`${base}/api${path}`, {
      method: method || (body ? "POST" : "GET"),
      headers: {
        "Content-Type": "application/json",
        "X-Kutup": "1",
        ...(cookie ? { Cookie: cookie } : {}),
        ...(owner ? { "X-Owner-Key": owner } : {}),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return {
      status: response.status,
      data: await response.json(),
      setCookie: response.headers.get("set-cookie") || "",
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    };
  }
  const state = async (who) => (await request("/state", { cookie: people[who] })).data;
  // One remembered owner device: the owner key's own limit (20 a minute) is
  // spent quickly by the tests that send it with every request.
  let ownerCookie;
  const ownerSession = async () => (ownerCookie ||= (await request("/owner/login", { body: { key: adminKey } })).cookie);
  const member = (s, name) => s.members.find((m) => m.name === name);

  before(async () => {
    push = await fakePushService();
    await start();
  });
  after(async () => {
    await stop();
    await push?.close();
    // workerd may hold files briefly after exit on Windows.
    for (let i = 0; i < 10; i++)
      try {
        rmSync(directory, { recursive: true, force: true });
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 300));
      }
  });

  test(`[${target}] authentication is required and writes need the app header`, async () => {
    assert.equal((await request("/state")).status, 401);
    const denied = await request("/groups", {
      body: { name: "Aylin", groupName: "Tayfa" },
      headers: { "X-Kutup": "" },
    });
    assert.equal(denied.status, 403);
    assert.equal((await request("/groups", { body: [1] })).status, 400);
  });

  test(`[${target}] create a group, join with the invitation, reject duplicate names`, async () => {
    const created = await request("/groups", {
      body: { name: "Aylin", groupName: "Test tayfa", avatar: "🦄", color: "pink" },
    });
    assert.equal(created.status, 201);
    assert.match(created.setCookie, /HttpOnly/);
    assert.match(created.setCookie, /SameSite=Lax/);
    people.alice = created.cookie;
    group = created.data.group;
    assert.equal(created.data.members[0].avatar, "🦄");
    assert.ok(group.invite.length >= 24);
    assert.equal(created.data.live, target === "node" ? "sse" : "ws");
    const invited = (await request(`/invites/${group.invite}`)).data;
    assert.equal(invited.count, 1);
    // n27: the welcome shows who is in the team (names and faces only).
    assert.deepEqual(invited.faces, [{ name: "Aylin", avatar: "🦄", color: "pink" }]);
    const second = await request("/join", { body: { invite: group.invite, name: "Deniz", avatar: "🪐" } });
    assert.equal(second.status, 201);
    people.bob = second.cookie;
    const duplicate = await request("/join", { body: { invite: group.invite, name: "deniz" } });
    assert.equal(duplicate.status, 409);
    assert.match(duplicate.data.error, /Başka cihazda aç/);
    const third = await request("/groups", { body: { name: "Ege", groupName: "Başka ekip" } });
    people.charlie = third.cookie;
    assert.equal((await state("charlie")).members.length, 1);
  });

  test(`[${target}] drawn characters with accessories are kept; unknown or founder-only ones are not`, async () => {
    const save = async (avatar) => {
      const res = await request("/profile", { cookie: people.charlie, body: { name: "Ege", avatar, color: "mint", note: "" } });
      assert.equal(res.status, 200);
      return (await state("charlie")).members[0].avatar;
    };
    assert.equal(await save("k:tekir+gozluk+atki"), "k:tekir+gozluk+atki");
    assert.equal(await save("k:karadelik"), "k:karadelik");
    assert.equal(await save("k:sef"), "🪐");
    assert.equal(await save("k:tekir+atki+gozluk"), "🪐");
    assert.equal(await save("k:tekir+bere+kep"), "🪐");
    assert.equal(await save("k:yok"), "🪐");
    assert.equal(await save("🦊"), "🦊");
  });

  test(`[${target}] presence and plans are shared inside the group only`, async () => {
    const result = await request("/presence", {
      cookie: people.alice,
      body: { status: "here", location: "1. kat", desk: "24" },
    });
    assert.equal(result.status, 200);
    assert.equal(member(result.data.state, "Aylin").status, "here", "writes return fresh state");
    const s = await state("bob");
    const aylin = member(s, "Aylin");
    assert.equal(aylin.desk, "24");
    assert.ok(aylin.since > Date.now() - 60000);
    assert.equal(s.members.some((x) => "token" in x || "transfer_hash" in x), false);
    assert.ok(s.messages.some((m) => m.kind === "system" && m.text.includes("kütübe geldi")));
    // n27 privacy: an invite link shows names and faces, never who is at the
    // library, on the way or focusing, even while someone is there.
    const invite = (await request(`/invites/${group.invite}`)).data;
    assert.deepEqual(Object.keys(invite).sort(), ["count", "faces", "name"]);
    assert.ok(invite.faces.length >= 2);
    for (const face of invite.faces) assert.deepEqual(Object.keys(face).sort(), ["avatar", "color", "name"]);
    assert.doesNotMatch(JSON.stringify(invite), /here|status|location|desk|since|arrival|focus|1\. kat/);
    plan = (await request("/plans", {
      cookie: people.alice,
      body: { starts: Date.now() + 3600000, note: "Test çalışma buluşması" },
    })).data.id;
    assert.equal((await request(`/plans/${plan}/join`, { cookie: people.charlie, body: {} })).status, 404);
    assert.equal((await request(`/plans/${plan}/join`, { cookie: people.bob, body: {} })).status, 200);
    assert.equal((await state("bob")).plans[0].attendees.length, 2);
    // n34: a shared plan link answers "Gelemem" too; the answer is set, not toggled.
    const answer = (who, going) => request(`/plans/${plan}/answer`, { cookie: people[who], body: { going } });
    assert.equal((await answer("bob", false)).status, 200);
    assert.equal((await answer("bob", false)).status, 200);
    let shared = (await state("alice")).plans[0];
    assert.equal(shared.attendees.length, 1);
    assert.equal(shared.skips.length, 1);
    assert.equal((await answer("bob", true)).status, 200);
    shared = (await state("alice")).plans[0];
    assert.deepEqual([shared.attendees.length, shared.skips.length], [2, 0]);
    await answer("bob", false);
    assert.equal((await request(`/plans/${plan}/join`, { cookie: people.bob, body: {} })).status, 200);
    shared = (await state("alice")).plans[0];
    assert.deepEqual([shared.attendees.length, shared.skips.length], [2, 0], "Ben de clears an earlier Gelemem");
    assert.equal((await answer("alice", true)).status, 400, "the planner does not answer their own plan");
    assert.equal((await answer("charlie", false)).status, 404, "another team cannot see the plan");
    assert.equal((await request(`/plans/${plan}`, { cookie: people.bob, method: "DELETE", body: {} })).status, 404);
    assert.equal((await state("alice")).plans.length, 1);
    assert.equal((await request("/plans", { cookie: people.bob, body: { starts: Date.now() - 86400000 } })).status, 400);
    assert.equal((await request("/plans", { cookie: people.bob, body: { starts: Date.now() + 40 * 86400000 } })).status, 400);
  });

  test(`[${target}] one meeting supports personal arrival, stable links and schedule reconfirmation`,async()=>{
    const day=86400000,start=Math.floor((Date.now()+10800000)/day)*day-10800000+day+14*3600000;
    const created=await request("/plans",{cookie:people.alice,body:{starts:start,ends:start+6*3600000,note:"Ayrı sınav grubu",separate:true,requestKey:"meeting-e2e-request"}});
    assert.equal(created.status,201);const id=created.data.id;
    const later=await request("/plans",{cookie:people.bob,body:{starts:start+2*3600000}});
    assert.equal(later.data.id,id,"a later arrival joins the existing meeting");
    let p=(await request(`/plans/${id}`,{cookie:people.bob})).data;
    assert.equal(p.starts,start);assert.ok(p.responses.some(r=>r.arrival===start+2*3600000));
    assert.equal((await request(`/plans/${id}/answer`,{cookie:people.bob,body:{}})).status,400);
    assert.equal((await request(`/plans/${id}`,{cookie:people.charlie})).status,404);
    const edited=await request(`/plans/${id}`,{cookie:people.alice,method:"PATCH",body:{rev:p.rev,starts:start+3600000}});
    assert.equal(edited.status,200);p=(await request(`/plans/${id}`,{cookie:people.bob})).data;
    assert.equal(p.schedule,2);assert.ok(p.responses.some(r=>r.answer==="pending"));
    assert.equal((await request(`/plans/${id}/answer`,{cookie:people.bob,body:{answer:"yes",schedule:1,arrival:start+2*3600000}})).status,409);
    assert.equal((await request(`/plans/${id}/answer`,{cookie:people.bob,body:{answer:"yes",schedule:2,arrival:start+2*3600000}})).status,200);
    assert.equal((await request(`/plans/${id}`,{cookie:people.alice,method:"DELETE",body:{rev:p.rev}})).status,200);
    assert.ok((await request(`/plans/${id}`,{cookie:people.bob})).data.cancelled);
  });

  test(`[${target}] messages and hearts are group-scoped; bad and cross-origin writes fail`, async () => {
    messageId = (await request("/messages", { cookie: people.alice, body: { text: "Pencere kenarında yer var!" } })).data.id;
    assert.equal((await request(`/messages/${messageId}/react`, { cookie: people.bob, body: {} })).status, 200);
    assert.equal((await request(`/messages/${messageId}/react`, { cookie: people.charlie, body: {} })).status, 404);
    const msg = (await state("bob")).messages.find((x) => x.id === messageId);
    assert.deepEqual(msg.reactions.length, 1);
    const system = (await state("bob")).messages.find((x) => x.kind === "system");
    assert.equal((await request(`/messages/${system.id}/react`, { cookie: people.bob, body: {} })).status, 404);
    assert.equal((await request("/messages", { cookie: people.alice, body: { text: "  " } })).status, 400);
    assert.equal((await request("/messages", { cookie: people.alice, body: { text: "x".repeat(281) } })).status, 400);
    assert.equal(
      (await request("/messages", {
        cookie: people.alice,
        body: { text: "test" },
        headers: { Origin: "https://unrelated.example" },
      })).status,
      403,
    );
  });

  test(`[${target}] busy activity does not push real messages off the board`, async () => {
    for (let i = 0; i < 16; i++)
      await request("/presence", { cookie: people.bob, body: { status: i % 2 ? "away" : "break" } });
    const s = await state("alice");
    assert.ok(s.messages.some((m) => m.id === messageId));
    assert.ok(s.messages.filter((m) => m.kind === "system").length <= 25);
  });

  test(`[${target}] polling returns only the revision when nothing changed`, async () => {
    const first = await state("bob");
    const rev = first.group.rev;
    const idle = (await request(`/state?rev=${rev}`, { cookie: people.bob })).data;
    assert.deepEqual(idle, { unchanged: true, rev });
    await request("/messages", { cookie: people.alice, body: { text: "Polling marker" } });
    const fresh = (await request(`/state?rev=${rev}`, { cookie: people.bob })).data;
    assert.ok(fresh.group.rev > rev);
    assert.ok(fresh.messages.some((m) => m.text === "Polling marker"));
  });

  if (target === "node")
    test(`[${target}] SSE pushes new shared state after an action`, async () => {
      const controller = new AbortController();
      const response = await fetch(`${base}/api/events`, {
        headers: { Cookie: people.bob },
        signal: controller.signal,
      });
      assert.equal(response.status, 200);
      const reader = response.body.getReader();
      await reader.read();
      await request("/messages", { cookie: people.alice, body: { text: "SSE integration marker" } });
      let seen = "";
      await waitFor(async () => {
        const next = await reader.read();
        seen += new TextDecoder().decode(next.value);
        return seen.includes("SSE integration marker");
      }, 3000, "SSE event");
      controller.abort();
    });

  // n29: on Cloudflare a team's live room rings every open phone on a change.
  const liveSocket = (cookie) =>
    new WebSocket(`${base.replace("http", "ws")}/api/live`, { headers: cookie ? { Cookie: cookie } : {} });
  const opened = (ws) =>
    new Promise((ok, fail) => {
      ws.onopen = () => ok(ws);
      ws.onerror = () => fail(new Error("live socket did not open"));
      ws.onclose = (e) => fail(new Error(`live socket closed ${e.code}`));
    });
  if (target === "worker")
    test(`[${target}] the team's live room rings open phones within a second`, async () => {
      const refused = liveSocket();
      await assert.rejects(opened(refused), "no session, no live room");
      const ws = await opened(liveSocket(people.bob));
      const heard = [];
      ws.onmessage = (e) => heard.push({ data: e.data, at: Date.now() });
      ws.send("ping");
      await waitFor(() => heard.some((h) => h.data === "pong"), 3000, "pong");
      const sent = Date.now();
      await request("/messages", { cookie: people.alice, body: { text: "Canlı oda işareti" } });
      await waitFor(() => heard.some((h) => h.data === "changed"), 3000, "changed");
      const lag = heard.find((h) => h.data === "changed").at - sent;
      assert.ok(lag < 1000, `rang after ${lag} ms`);
      ws.close();
    });

  test(`[${target}] focus validates duration and lets friends join the same timer`, async () => {
    assert.equal((await request("/focus", { cookie: people.alice, body: { action: "start", minutes: 1 } })).status, 400);
    const starts = await Promise.all([1, 2].map(() => request("/focus", { cookie: people.alice, body: { action: "start", minutes: 25 } })));
    assert.deepEqual(starts.map((r) => r.status).sort(), [200, 400], "one timer wins across devices");
    const aylin = member(await state("alice"), "Aylin");
    assert.ok(aylin.focusEnd > Date.now() + 24 * 60000);
    const early = await request("/focus", { cookie: people.alice, body: { action: "finish" } });
    assert.equal(early.data.credited, 0);
    assert.equal((await request("/focus", { cookie: people.alice, body: { action: "start", minutes: 25 } })).status, 400);
    assert.equal(
      (await request("/focus", { cookie: people.bob, body: { action: "start", joinMember: aylin.id } })).status,
      200,
    );
    assert.equal(member(await state("bob"), "Deniz").focusEnd, aylin.focusEnd);
    assert.equal(
      (await request("/focus", { cookie: people.charlie, body: { action: "start", joinMember: aylin.id } })).status,
      400,
    );
    await request("/focus", { cookie: people.bob, body: { action: "cancel" } });
    assert.equal(member(await state("bob"), "Deniz").focusEnd, 0);
  });

  test(`[${target}] finished focus is credited exactly once, even when its owner is offline`, async () => {
    await request("/__test/expire", { body: { name: "Aylin" } });
    // Bob's read credits Aylin's finished session.
    const s = await state("bob");
    assert.equal(member(s, "Aylin").focusToday, 25);
    assert.equal(member(s, "Aylin").focusWeek, 25);
    assert.equal(member(s, "Aylin").focusEnd, 0);
    assert.equal(member(s, "Aylin").status, "away", "check-ins expire");
    const finish = await request("/focus", { cookie: people.alice, body: { action: "finish" } });
    assert.equal(finish.data.credited, 0);
    assert.equal(member(await state("alice"), "Aylin").focusToday, 25);
    const count = (await state("alice")).messages.filter((m) => m.kind === "system").length;
    await request("/presence", { cookie: people.alice, body: { status: "here", location: "Bahçe" } });
    const after = await state("bob");
    assert.equal(member(after, "Aylin").status, "here");
    assert.ok(after.messages.filter((m) => m.kind === "system").length >= Math.min(count + 1, 25));
  });

  test(`[${target}] build mode adds a building to the village only if the app stayed open`, async () => {
    // Kept the app open to the end: a cottage, minutes and a board message.
    await request("/focus", { cookie: people.bob, body: { action: "start", minutes: 25, strict: true } });
    const building = member(await state("bob"), "Deniz");
    assert.equal(building.focusStrict, 1);
    assert.ok(Number.isInteger(building.focusSeed));
    assert.deepEqual((await request("/focus", { cookie: people.bob, body: { action: "beat" } })).data, { ok: true });
    await request("/__test/expire", { body: { name: "Deniz" } });
    const built = await request("/focus", { cookie: people.bob, body: { action: "finish" } });
    assert.equal(built.data.credited, 25);
    assert.equal(built.data.withered, false);
    const deniz = member(built.data.state, "Deniz");
    assert.equal(deniz.buildsWeek, 1);
    assert.equal(deniz.buildings, 1);
    assert.equal(deniz.focusWeek, 25);
    assert.ok(built.data.state.messages.some((m) => m.text.startsWith("kulübesini bitirdi 🏡 25")));
    const village = (await request("/village", { cookie: people.alice })).data;
    assert.equal(village.buildings.length, 1);
    const [buildingId, owner, kind, seed, x, y, facing] = village.buildings[0];
    assert.equal(kind, "cottage");
    assert.equal(owner, deniz.id);
    assert.equal(seed, building.focusSeed, "the finished building keeps the look it was built with");
    assert.ok(Number.isFinite(x) && Number.isFinite(y), "the server stores where it stands");
    assert.ok(facing === 0 || facing === 1);
    const aylinId = member(await state("alice"), "Aylin").id;
    const districtOf = (v, id) => v.districts.find((d) => d[1] === id);
    assert.ok(districtOf(village, deniz.id) && districtOf(village, aylinId), "everyone gets a district");
    assert.notDeepEqual(districtOf(village, deniz.id).slice(2, 4), districtOf(village, aylinId).slice(2, 4));
    assert.deepEqual((await request(`/village?rev=${village.rev}`, { cookie: people.alice })).data, { unchanged: true, rev: village.rev });
    const charlieVillage = (await request("/village", { cookie: people.charlie })).data;
    assert.equal(charlieVillage.buildings.length, 0, "villages stay in their group");
    assert.equal(charlieVillage.districts.length, 1);
    // Friends heart a building; nobody hearts their own.
    const liked = await request(`/buildings/${buildingId}/like`, { cookie: people.alice, body: {} });
    assert.deepEqual([liked.data.liked, liked.data.likes], [true, 1]);
    assert.equal((await request(`/buildings/${buildingId}/like`, { cookie: people.bob, body: {} })).status, 400);
    assert.equal((await request(`/buildings/${buildingId}/like`, { cookie: people.charlie, body: {} })).status, 404);
    const seen = (await request("/village", { cookie: people.alice })).data;
    assert.deepEqual(seen.buildings[0].slice(9, 12), [1, 1, "kulube"]);
    assert.deepEqual(seen.buildings[0].slice(12), [0, null], "not patched, not a gift (n43: both travel now)");
    assert.deepEqual((await request("/village", { cookie: people.bob })).data.buildings[0].slice(9, 12), [1, 0, "kulube"]);
    // A client that already has the village only gets what changed since then.
    assert.equal((await request(`/village?after=${seen.until + 6000}`, { cookie: people.alice })).data.buildings.length, 0);
    // The cottage was free and paid its wage, the day's first-session bonus and
    // +5% imece: Aylin's session ran alongside it.
    const wallet = (await request("/wallet", { cookie: people.bob })).data;
    assert.equal(wallet.bricks, 36);
    assert.deepEqual(wallet.log.map((r) => [r.reason, r.delta]).sort(), [["bonus", 10], ["imece", 1], ["wage", 25]]);
    assert.deepEqual(wallet.built, { kulube: 1 });
    const bricks = async () => member(await state("bob"), "Deniz").bricks;
    // A two-storey house needs 40 tuğla of materials, paid up front.
    const short = await request("/focus", { cookie: people.bob, body: { action: "start", model: "ev", strict: true } });
    assert.equal(short.status, 400);
    assert.match(short.data.error, /4 tuğla eksik/);
    assert.equal((await request("/focus", { cookie: people.bob, body: { action: "start", model: "ev", minutes: 25, strict: true } })).status, 400);
    assert.equal((await request("/focus", { cookie: people.bob, body: { action: "start", model: "yok", strict: true } })).status, 400);
    const grant = await request(`/owner/members/${deniz.id}/bricks`, { owner: adminKey, body: { delta: 200, note: "test" } });
    assert.equal(grant.data.bricks, 236);
    assert.equal((await request(`/owner/members/${deniz.id}/bricks`, { owner: adminKey, body: { delta: -1000 } })).status, 400);
    assert.equal((await request("/focus", { cookie: people.bob, body: { action: "start", model: "ev", strict: true } })).status, 200);
    const house = member(await state("bob"), "Deniz");
    assert.deepEqual([house.focusMinutes, house.focusModel, house.focusCost, house.bricks], [50, "ev", 40, 196]);
    // Closed the app mid-session: no minutes, no building, a collapse on the
    // board, half the materials back and 30% waiting for the rubble.
    await request("/__test/expire", { body: { name: "Deniz", away: true } });
    const later = await state("alice"); // anyone's read settles it
    assert.equal(member(later, "Deniz").focusWeek, 25);
    assert.equal(member(later, "Deniz").buildings, 1);
    assert.deepEqual([member(later, "Deniz").bricks, member(later, "Deniz").ruinRefund], [216, 12]);
    assert.ok(later.messages.some((m) => m.text.startsWith("inşaatı çöktü 🧱")));
    const ruin = (await request("/village", { cookie: people.alice })).data.ruins.find((r) => r[0] === deniz.id);
    assert.equal(ruin[1], "house", "the collapsed site stays as rubble");
    assert.ok(ruin[4] > Date.now() + 2 * 24 * 3600000);
    // Changing your mind in the first two minutes costs nothing and leaves no rubble.
    await request("/focus", { cookie: people.bob, body: { action: "start", model: "kule", strict: true } });
    assert.equal(await bricks(), 126);
    const early = await request("/focus", { cookie: people.bob, body: { action: "cancel" } });
    assert.deepEqual([early.data.withered, early.data.refunded, early.data.pending], [false, 90, 0]);
    assert.deepEqual([member(early.data.state, "Deniz").bricks, member(early.data.state, "Deniz").ruinRefund], [216, 12]);
    // Leaving the app later on (reported by the client) collapses it right away.
    await request("/focus", { cookie: people.bob, body: { action: "start", model: "kule", strict: true } });
    await request("/__test/age", { body: { name: "Deniz" } });
    const left = await request("/focus", { cookie: people.bob, body: { action: "wither" } });
    assert.deepEqual([left.data.withered, left.data.refunded, left.data.pending], [true, 45, 27]);
    assert.equal(member(left.data.state, "Deniz").focusEnd, 0);
    assert.deepEqual([member(left.data.state, "Deniz").bricks, member(left.data.state, "Deniz").ruinRefund], [171, 27]);
    // A plain session builds nothing and pays half a wage, but it is a real
    // session: it clears the rubble and brings back the waiting 30%.
    await request("/focus", { cookie: people.bob, body: { action: "start", minutes: 25 } });
    await request("/__test/expire", { body: { name: "Deniz", away: true } });
    const plain = member(await state("bob"), "Deniz");
    assert.equal(plain.focusWeek, 50);
    assert.equal(plain.buildings, 1);
    assert.deepEqual([plain.bricks, plain.ruinRefund, plain.ruinUntil], [212, 0, 0]);
    const receipt = (await request("/wallet", { cookie: people.bob })).data.log.slice(0, 3).map((r) => [r.reason, r.delta]);
    assert.deepEqual(receipt.sort(), [["imece", 1], ["ruin-refund", 27], ["wage", 13]]);
    assert.equal((await request("/village", { cookie: people.alice })).data.ruins.some((r) => r[0] === deniz.id), false);
    // The next building clears the rubble and never moves the first one.
    await request("/focus", { cookie: people.bob, body: { action: "start", minutes: 25, strict: true } });
    await request("/focus", { cookie: people.bob, body: { action: "beat" } });
    await request("/__test/expire", { body: { name: "Deniz" } });
    await request("/focus", { cookie: people.bob, body: { action: "finish" } });
    const grown = (await request("/village", { cookie: people.alice })).data;
    assert.equal(grown.buildings.length, 2);
    assert.deepEqual(grown.buildings.find((b) => b[0] === buildingId).slice(4, 7), [x, y, facing]);
    assert.equal(grown.ruins.some((r) => r[0] === deniz.id), false);
    // Started straight after the plain session: the second in a row, +10%.
    assert.equal(await bricks(), 241);
    const streak = (await request("/wallet", { cookie: people.bob })).data.log.find((r) => r.reason === "streak");
    assert.equal(streak.delta, 3);
    assert.equal(member(await state("bob"), "Deniz").chain, 2);
    const [, , , , x2, y2] = grown.buildings.find((b) => b[0] !== buildingId);
    assert.ok(Math.hypot(x2 - x, y2 - y) > 4, "buildings keep their distance");
    // Statistics, for friends in the same team only.
    const stats = (await request(`/stats/${deniz.id}`, { cookie: people.alice })).data;
    assert.deepEqual([stats.focus.total, stats.focus.sessions, stats.focus.strict], [75, 3, 2]);
    assert.deepEqual([stats.builds.total, stats.builds.collapses, stats.builds.success], [2, 2, 50]);
    assert.equal(stats.focus.streak.current, 1);
    assert.equal(stats.focus.last14.at(-1)[1], 75);
    assert.equal((await request(`/stats/${deniz.id}`, { cookie: people.charlie })).status, 404);
    // An owner can move a building to another free plot in their own district.
    const spots = (await request(`/buildings/${buildingId}/spots`, { cookie: people.bob })).data.spots;
    assert.ok(spots.length >= 2, "free plots to move to");
    assert.equal((await request(`/buildings/${buildingId}/spots`, { cookie: people.alice })).status, 404);
    assert.equal((await request(`/buildings/${buildingId}/move`, { cookie: people.bob, body: { x: 999, y: 999 } })).status, 400);
    const moved = await request(`/buildings/${buildingId}/move`, { cookie: people.bob, body: { x: spots[0][0], y: spots[0][1] } });
    assert.equal(moved.status, 200);
    const after = (await request("/village", { cookie: people.alice })).data.buildings.find((b) => b[0] === buildingId);
    assert.deepEqual(after.slice(4, 7), spots[0]);
    // Rare buildings need a blueprint; the observatory is the founder's alone.
    const noPlan = await request("/focus", { cookie: people.bob, body: { action: "start", model: "sera", strict: true } });
    assert.equal(noPlan.status, 400);
    assert.match(noPlan.data.error, /planını/);
    assert.equal((await request("/focus", { cookie: people.bob, body: { action: "start", model: "gozlemevi", strict: true } })).status, 400);
    await request("/__test/unlock", { body: { name: "Deniz", model: "sera" } });
    assert.deepEqual((await request("/wallet", { cookie: people.bob })).data.unlocks, ["sera"]);
    assert.equal((await request("/focus", { cookie: people.bob, body: { action: "start", model: "sera", strict: true } })).status, 200);
    assert.equal(member(await state("bob"), "Deniz").focusModel, "sera");
    assert.equal((await request("/focus", { cookie: people.bob, body: { action: "cancel" } })).data.refunded, 45);
  });

  test(`[${target}] a team rhythm aligns rounds, and a tea break pauses a build once`, async () => {
    assert.equal((await request("/rhythm", { cookie: people.alice, body: { rhythm: "nope" } })).status, 400);
    const set = await request("/rhythm", { cookie: people.alice, body: { rhythm: "50-10" } });
    assert.equal(set.data.state.group.rhythm, "50-10");
    assert.ok(set.data.state.messages.some((m) => m.text.startsWith("masa ritmini 50+10 yaptı")));
    const t0 = Date.now();
    const round = await request("/focus", { cookie: people.alice, body: { action: "start", rhythm: true, minutes: 25 } });
    assert.equal(round.status, 200);
    assert.ok([rhythmEnd("50-10", t0), rhythmEnd("50-10", Date.now())].includes(member(round.data.state, "Aylin").focusEnd), "the round ends at the shared break");
    await request("/focus", { cookie: people.alice, body: { action: "cancel" } });
    await request("/rhythm", { cookie: people.alice, body: { rhythm: null } });
    // Çay molası: a two-storey house may stop once for up to five minutes.
    const house = await request("/focus", { cookie: people.bob, body: { action: "start", model: "ev", strict: true } });
    assert.equal(house.status, 200);
    const end = member(house.data.state, "Deniz").focusEnd;
    const paused = await request("/focus", { cookie: people.bob, body: { action: "pause" } });
    assert.equal(paused.data.paused, true);
    assert.ok(member(paused.data.state, "Deniz").focusPausedAt > 0);
    assert.equal((await request("/focus", { cookie: people.bob, body: { action: "pause" } })).status, 400);
    const resumed = member((await request("/focus", { cookie: people.bob, body: { action: "resume" } })).data.state, "Deniz");
    assert.equal(resumed.focusPausedAt, 0);
    assert.ok(resumed.focusEnd >= end && resumed.focusEnd < end + 60000, "the end moves on by the break");
    assert.equal((await request("/focus", { cookie: people.bob, body: { action: "pause" } })).status, 400, "only once");
    const quit = await request("/focus", { cookie: people.bob, body: { action: "cancel" } });
    assert.equal(quit.data.withered, true, "after a break, giving up is no longer free");
  });

  test(`[${target}] a coffee call for one person, its reply, and who has seen the board`, async () => {
    const deniz = member(await state("bob"), "Deniz");
    const call = await request("/messages", { cookie: people.alice, body: { text: "Deniz, kahve?", kind: "coffee", to: deniz.id } });
    assert.equal(call.status, 201);
    const msg = (await state("bob")).messages.find((m) => m.id === call.data.id);
    assert.equal(msg.toMember, deniz.id);
    const reply = await request("/messages", { cookie: people.bob, body: { text: "Geliyorum ☕", replyTo: call.data.id } });
    assert.equal((await state("alice")).messages.find((m) => m.id === reply.data.id).replyTo, call.data.id);
    assert.ok(member(await state("alice"), "Deniz").boardSeen >= msg.created, "writing means having read");
    await request("/seen", { cookie: people.alice, body: { at: Date.now() } });
    assert.ok(member(await state("bob"), "Aylin").boardSeen >= reply.data.state.messages.at(-1).created);
  });

  test(`[${target}] web push reaches friends, encrypted and signed, with an arrival cooldown`, async () => {
    const receiver = pushReceiver();
    const endpoint = push.url("/push/deniz");
    assert.equal(
      (await request("/push", {
        cookie: people.bob,
        body: { subscription: receiver.subscription("https://127.0.0.2/private") },
      })).status,
      400,
    );
    assert.equal(
      (await request("/push", { cookie: people.bob, body: { subscription: receiver.subscription(endpoint) } })).status,
      200,
    );
    // Switching the bell on proves itself with a test notification to that device only.
    const bell = push.url("/push/bell");
    const switched = await request("/push", { cookie: people.bob, body: { subscription: receiver.subscription(bell), test: true } });
    assert.equal(switched.data.test, true);
    await waitFor(() => push.received.some((p) => p.path === "/push/bell"), 8000, "bell test push");
    const bellPush = push.received.find((p) => p.path === "/push/bell");
    assert.equal(JSON.parse(receiver.decrypt(bellPush.body)).title, "Bildirimler açık 🔔");
    assert.equal(bellPush.headers.urgency, "high");
    assert.equal(push.received.some((p) => p.path === "/push/deniz"), false, "the test push goes to that device only");
    const ece = await request("/join", { body: { invite: group.invite, name: "Ece", avatar: "🌸" } });
    people.ece = ece.cookie;
    const publicKey = ece.data.pushPublicKey;
    const pushes = () => push.received.filter((p) => p.path === "/push/deniz");
    const arrivals = await Promise.all([1, 2].map(() =>
      request("/presence", { cookie: people.ece, body: { status: "here", location: "Kafeterya" } }),
    ));
    assert.ok(arrivals.every((r) => r.status === 200), "simultaneous arrivals both succeed");
    await waitFor(() => pushes().length >= 1, 8000, "arrival push");
    const [first] = pushes();
    assert.equal(first.headers["content-encoding"], "aes128gcm");
    // Arrivals go out at high urgency (no Android doze delay) and live for two hours.
    assert.equal(first.headers.ttl, "7200");
    assert.equal(first.headers.urgency, "high");
    await verifyVapid(first.headers.authorization, endpoint, publicKey);
    const payload = JSON.parse(receiver.decrypt(first.body));
    assert.equal(payload.title, "Ece kütüpte! 📚");
    assert.equal(payload.body, "Kafeterya");
    assert.equal(payload.sticky, true);
    // Leaving and arriving again within 5 minutes does not ping again.
    await request("/presence", { cookie: people.ece, body: { status: "away" } });
    await request("/presence", { cookie: people.ece, body: { status: "here" } });
    await request("/presence", { cookie: people.ece, body: { status: "break" } });
    await waitFor(() => pushes().length >= 2, 8000, "first break push");
    // Switching between two notifying statuses must not reset their timers.
    await request("/presence", { cookie: people.ece, body: { status: "here" } });
    await request("/presence", { cookie: people.ece, body: { status: "break" } });
    await request("/presence", { cookie: people.ece, body: { status: "here" } });
    await request("/messages", { cookie: people.ece, body: { text: "Kafeteryada kahve?", kind: "coffee" } });
    await waitFor(() => pushes().length >= 3, 8000, "coffee push");
    await new Promise((r) => setTimeout(r, 500));
    const titles = pushes().map((p) => JSON.parse(receiver.decrypt(p.body)).title);
    assert.deepEqual(titles, ["Ece kütüpte! 📚", "Ece molada ☕", "Ece: mola? ☕"]);
    // Plans notify too and deep-link to the plans tab.
    const pushedMeeting=await request("/plans", { cookie: people.ece, body: { starts: Date.now() + 86400000, note: "Sabah kulübü" } });
    await waitFor(() => pushes().length >= 4, 8000, "plan push");
    const planPush = JSON.parse(receiver.decrypt(pushes()[3].body));
    assert.match(planPush.body, /Sabah kulübü/);
    assert.equal(planPush.url, `/?plan=${pushedMeeting.data.id}`);
  });

  test(`[${target}] a transfer code opens the same profile on a second device`, async () => {
    const { data } = await request("/transfer", { cookie: people.alice, body: {} });
    assert.match(data.code, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    assert.equal((await request("/transfer/claim", { body: { code: "ABCD-EFGH" } })).status, 404);
    const typed = data.code.toLowerCase().replace("-", " ");
    const claimed = await request("/transfer/claim", { body: { code: typed } });
    assert.equal(claimed.status, 200);
    assert.equal(member(claimed.data, "Aylin").id, claimed.data.memberId);
    people.alicePhone = claimed.cookie;
    assert.equal((await request("/session", { cookie: people.alicePhone })).status, 200);
    assert.equal((await request("/session", { cookie: people.alice })).status, 200, "first device stays signed in");
    assert.equal((await request("/transfer/claim", { body: { code: data.code } })).status, 404, "single use");
  });

  test(`[${target}] a username and password open the same profile anywhere; Batur can reset it`, async () => {
    assert.equal((await request("/account", { cookie: people.alice, body: { username: "Ay lin", password: "gizli123" } })).status, 400);
    assert.equal((await request("/account", { cookie: people.alice, body: { username: "Aylin", password: "short", current: "test-pass-123" } })).status, 400, "a valid password is needed");
    assert.equal((await request("/account", { cookie: people.alice, body: { username: "Aylin.K", password: "gizli123" } })).status, 403, "the current password is needed (d23)");
    const set = await request("/account", { cookie: people.alice, body: { username: "Aylin.K", password: "gizli123", current: "test-pass-123" } });
    assert.deepEqual(set.data, { ok: true, username: "aylin.k" });
    assert.equal((await request("/session", { cookie: people.alice })).data.username, "aylin.k");
    assert.equal((await request("/account", { cookie: people.bob, body: { username: "AYLIN.K", password: "baska123" } })).status, 409);
    assert.equal((await request("/login", { body: { username: "aylin.k", password: "yanlis12" } })).status, 401);
    const login = await request("/login", { body: { username: "Aylin.K", password: "gizli123" } });
    assert.equal(login.status, 200);
    assert.equal(member(login.data, "Aylin").id, login.data.memberId);
    assert.equal((await request("/session", { cookie: login.cookie })).status, 200, "a new browser is signed in");
    assert.equal((await state("alice")).members.some((m) => "username" in m || "pass_hash" in m), false, "nobody else sees it");
    // New friends create their account while joining.
    const fresh = await request("/join", { body: { invite: group.invite, name: "Selin", username: "selin", password: "kutup123" } });
    assert.equal(fresh.status, 201);
    assert.equal(fresh.data.username, "selin");
    assert.equal((await request("/join", { body: { invite: group.invite, name: "Selin 2", username: "selin", password: "kutup123" } })).status, 409);
    // Forgot it: Batur makes a one-day code, the code sets a new password (and a username if there was none).
    const bobId = member(await state("bob"), "Deniz").id;
    assert.equal((await request(`/owner/members/${bobId}/reset`, { body: {} })).status, 401);
    const reset = await request(`/owner/members/${bobId}/reset`, { owner: adminKey, body: {} });
    assert.match(reset.data.code, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    assert.equal((await request("/reset", { body: { code: "AAAA-BBBB", username: "deniz", password: "yeni1234" } })).status, 404);
    const back = await request("/reset", { body: { code: reset.data.code, username: "Deniz", password: "yeni1234" } });
    assert.equal(back.status, 200);
    assert.equal((await request("/session", { cookie: people.bob })).status, 401, "reset revokes old devices");
    people.bob = back.cookie;
    assert.equal(back.data.username, "deniz");
    assert.equal((await request("/login", { body: { username: "deniz", password: "yeni1234" } })).status, 200);
    assert.equal((await request("/reset", { body: { code: reset.data.code, username: "deniz", password: "yeni5678" } })).status, 404, "single use");
    // Batur’s code also works on the “Zaten ekipteyim” screen, once.
    const again = await request(`/owner/members/${bobId}/reset`, { owner: adminKey, body: {} });
    const claimed = await request("/transfer/claim", { body: { code: again.data.code } });
    assert.equal(claimed.data.memberId, bobId);
    people.bob = claimed.cookie;
    assert.equal((await request("/transfer/claim", { body: { code: again.data.code } })).status, 404);
    await request("/leave", { cookie: fresh.cookie, body: {} });
  });

  test(`[${target}] feedback is private to its sender and Batur`, async () => {
    const result = await request("/feedback", {
      cookie: people.alice,
      body: { kind: "idea", text: "Ortak okuma listesi eklesek güzel olur." },
    });
    assert.equal(result.status, 201);
    feedbackId = result.data.id;
    assert.equal((await request("/feedback", { cookie: people.bob })).data.length, 0);
    assert.equal((await request("/owner/feedback", { owner: "wrong" })).status, 401);
    const inbox = await request("/owner/feedback", { owner: adminKey });
    assert.equal(inbox.data.length, 1);
    assert.equal(inbox.data[0].name, "Aylin");
    assert.equal(
      (await request(`/owner/feedback/${feedbackId}`, { owner: adminKey, body: { status: "accepted" } })).status,
      200,
    );
    assert.equal((await request("/feedback", { cookie: people.alice })).data[0].status, "accepted");
    assert.equal((await state("alice")).messages.some((x) => x.text.includes("Ortak okuma")), false);
    assert.equal((await request("/owner/status")).data.claimed, true);
  });

  test(`[${target}] requests move through stages Batur picks, and the sender is told`, async () => {
    // The recovered device re-registers its browser subscription on sign-in.
    const recoveredPhone = pushReceiver();
    assert.equal((await request("/push", { cookie: people.bob, body: { subscription: recoveredPhone.subscription(push.url("/push/deniz")) } })).status, 200);
    // Batur signs in once; the panel then works on its cookie alone.
    assert.equal((await request("/owner/login", { body: { key: "nope" } })).status, 401);
    const login = await request("/owner/login", { body: { key: adminKey } });
    assert.equal(login.status, 200);
    assert.match(login.setCookie, /Path=\/api\/owner/);
    assert.match(login.setCookie, /SameSite=Strict/);
    const owner = login.cookie;
    assert.equal((await request("/owner/status", { cookie: owner })).data.signedIn, true);
    // Batur's phone hears about new requests.
    const baturPhone = pushReceiver();
    assert.equal(
      (await request("/owner/push", { body: { subscription: baturPhone.subscription(push.url("/push/batur")) } })).status,
      401,
    );
    assert.equal(
      (await request("/owner/push", {
        cookie: owner,
        body: { subscription: baturPhone.subscription(push.url("/push/batur")) },
      })).status,
      200,
    );
    const sent = await request("/feedback", {
      cookie: people.bob,
      body: { kind: "idea", text: "Haftanın en erken geleni için taç rozeti 👑" },
    });
    assert.equal(sent.data.item.status, "new");
    assert.deepEqual(sent.data.item.events.map((e) => e.status), ["new"]);
    const ownerPush = await waitFor(
      () => push.received.find((p) => p.path === "/push/batur"),
      8000,
      "owner push",
    );
    assert.equal(JSON.parse(baturPhone.decrypt(ownerPush.body)).title, "Deniz bir fikir yolladı 💡");
    const id = sent.data.id;
    const pushes = () => push.received.filter((p) => p.path === "/push/deniz").length;
    const before = pushes();
    // Opening it in the panel marks it as reviewed, once.
    const seen = await request(`/owner/feedback/${id}/seen`, { cookie: owner, body: {} });
    assert.equal(seen.data.item.status, "seen");
    assert.equal(seen.data.item.name, "Deniz");
    assert.equal(seen.data.item.groupName, "Test tayfa");
    await waitFor(() => pushes() > before, 8000, "seen push");
    await request(`/owner/feedback/${id}/seen`, { cookie: owner, body: {} });
    const accepted = await request(`/owner/feedback/${id}`, {
      cookie: owner,
      body: { status: "accepted", reply: "Süper fikir, cumaya hazır!" },
    });
    assert.equal(accepted.data.item.status, "accepted");
    await request(`/owner/feedback/${id}`, { cookie: owner, body: { status: "building" } });
    const mine = (await request("/feedback", { cookie: people.bob })).data.find((x) => x.id === id);
    assert.deepEqual(mine.events.map((e) => e.status), ["new", "seen", "accepted", "building"]);
    assert.equal(mine.reply, "Süper fikir, cumaya hazır!");
    assert.equal(mine.name, undefined, "senders do not get the owner view");
    assert.equal(
      (await request(`/owner/feedback/${id}`, { cookie: owner, body: { status: "planned" } })).status,
      400,
    );
    const hello = await request("/feedback", { cookie: people.bob, body: { kind: "hello", text: "Eline sağlık aga 🫶" } });
    assert.equal(
      (await request(`/owner/feedback/${hello.data.id}`, { cookie: owner, body: { status: "building" } })).status,
      400,
      "small talk has no build stage",
    );
    assert.equal((await request(`/owner/feedback/${hello.data.id}`, { cookie: owner, method: "DELETE" })).status, 200);
    const raced = await request("/feedback", { cookie: people.bob, body: { kind: "idea", text: "İki açık panel aynı isteği güncelliyor." } });
    const competing = await Promise.all([
      request(`/owner/feedback/${raced.data.id}/seen`, { cookie: owner, body: {} }),
      request(`/owner/feedback/${raced.data.id}`, { cookie: owner, body: { status: "building" } }),
    ]);
    assert.ok(competing.every((r) => r.status === 200));
    const finalStage = (await request("/feedback", { cookie: people.bob })).data.find((r) => r.id === raced.data.id);
    assert.equal(finalStage.status, "building", "opening an older panel cannot undo progress");
    assert.equal(finalStage.events.at(-1).status, "building");
    await request(`/owner/feedback/${raced.data.id}`, { cookie: owner, method: "DELETE" });
    assert.equal((await request(`/owner/feedback/${id}`, { cookie: people.bob, body: { status: "done" } })).status, 401);
    await waitFor(() => pushes() >= before + 3, 8000, "stage pushes");
    // Signing out ends the cookie session.
    await request("/owner/logout", { cookie: owner, body: {} });
    assert.equal((await request("/owner/feedback", { cookie: owner })).status, 401);
  });

  test(`[${target}] Batur can rotate an invite and remove someone`, async () => {
    const groups = (await request("/owner/groups", { owner: adminKey })).data;
    const mine = groups.find((g) => g.id === group.id);
    assert.deepEqual(mine.members.map((m) => m.name), ["Aylin", "Deniz", "Ece"]);
    assert.ok(mine.members.every((m) => Number.isInteger(m.devices) && Number.isInteger(m.builds)));
    // A full JSON copy for safekeeping, without anything that opens a session.
    assert.equal((await request("/owner/backup")).status, 401);
    const backup = (await request("/owner/backup", { owner: adminKey })).data;
    assert.ok(backup.tables.members.some((m) => m.name === "Aylin" && m.username === "aylin.k"));
    assert.equal(backup.tables.members.some((m) => "token" in m || "reset_hash" in m), false);
    assert.ok(backup.tables.buildings.length >= 1 && backup.tables.messages.length >= 1);
    // Signing someone out everywhere keeps their data.
    const ece = mine.members.find((m) => m.name === "Ece");
    assert.equal((await request(`/owner/members/${ece.id}/signout`, { owner: adminKey, body: {} })).status, 200);
    assert.equal((await request("/session", { cookie: people.ece })).status, 401);
    assert.ok((await request("/owner/groups", { owner: adminKey })).data.find((g) => g.id === group.id).members.some((m) => m.name === "Ece"));
    assert.equal((await request(`/owner/groups/${group.id}/invite`, { body: {} })).status, 401);
    const rotated = await request(`/owner/groups/${group.id}/invite`, { owner: adminKey, body: {} });
    assert.equal((await request(`/invites/${group.invite}`)).status, 404);
    assert.equal((await request(`/invites/${rotated.data.invite}`)).status, 200);
    group.invite = rotated.data.invite;
    const other = groups.find((g) => g.name === "Başka ekip");
    const removed = await request(`/owner/members/${other.members[0].id}`, { owner: adminKey, method: "DELETE" });
    assert.equal(removed.status, 200);
    assert.equal((await request("/session", { cookie: people.charlie })).status, 401);
    const after = (await request("/owner/groups", { owner: adminKey })).data;
    assert.equal(after.some((g) => g.name === "Başka ekip"), false, "empty groups disappear");
  });

  test(`[${target}] leaving removes the profile and its traces`, async () => {
    let stream;
    if (target === "node") {
      // An open live stream of the leaving person is closed immediately.
      const response = await fetch(`${base}/api/events`, { headers: { Cookie: people.bob } });
      stream = response.body.getReader();
      await stream.read();
    }
    let heard;
    if (target === "worker") {
      // The leaving person's live socket hears "removed" at once and is closed.
      const ws = await opened(liveSocket(people.bob));
      ws.onmessage = (e) => (heard = e.data);
      ws.onclose = () => {};
    }
    const left = await request("/leave", { cookie: people.bob, body: {} });
    if (stream)
      await waitFor(async () => (await stream.read()).done, 3000, "stream close");
    if (target === "worker") await waitFor(() => heard === "removed", 3000, "live socket removed");
    assert.equal(left.status, 200);
    assert.match(left.setCookie, /Max-Age=0/);
    assert.equal((await request("/session", { cookie: people.bob })).status, 401);
    const s = await state("alice");
    assert.equal(member(s, "Deniz"), undefined);
    assert.equal(s.messages.some((m) => m.memberId && !s.members.some((x) => x.id === m.memberId)), false);
    assert.equal(s.messages.find((m) => m.id === messageId).reactions.length, 0);
    const village = (await request("/village", { cookie: people.alice })).data;
    assert.equal(village.buildings.length, 0, "their buildings go with them");
    assert.ok(village.districts.some((d) => d[1] === null), "their district stays as an empty plot");
  });

  test(`[${target}] accounts are required and concurrent recovery codes are single use`, async () => {
    // A fresh process keeps the persisted auth limits but resets the burst limiter
    // accumulated by the preceding simulated users on this one test IP.
    await stop();
    await start();
    assert.equal((await request("/groups", { account: false, body: { name: "Eksik hesap" } })).status, 400);
    assert.equal((await request("/join", { account: false, body: { name: "Eksik hesap", invite: group.invite } })).status, 400);
    const created = await request("/groups", { body: { name: "Kurtarma testi", username: "recover", password: "before-123" } });
    assert.equal(created.status, 201);
    const transfer = await request("/transfer", { cookie: created.cookie, body: {} });
    const claims = await Promise.all([1, 2].map(() => request("/transfer/claim", { body: { code: transfer.data.code } })));
    assert.deepEqual(claims.map((r) => r.status).sort(), [200, 404]);
    const owner = (await request("/owner/login", { body: { key: adminKey } })).cookie;
    const reset = await request(`/owner/members/${created.data.memberId}/reset`, { cookie: owner, body: {} });
    const resets = await Promise.all([1, 2].map((n) => request("/reset", { body: { code: reset.data.code, password: `after-${n}-123` } })));
    assert.deepEqual(resets.map((r) => r.status).sort(), [200, 404]);
    assert.equal((await request("/session", { cookie: created.cookie })).status, 401);
    assert.equal((await request("/session", { cookie: claims.find((r) => r.status === 200).cookie })).status, 401);
    assert.equal((await request("/session", { cookie: resets.find((r) => r.status === 200).cookie })).status, 200);
  });

  test(`[${target}] revocation closes streams, disables push and cancels issued codes`, async () => {
    const ownerPushCount = push.received.filter((p) => p.path === "/push/batur").length;
    const owner = await ownerSession();
    const revoked = await request("/groups", { body: { name: "Kayıp cihaz" } });
    const friend = await request("/join", { body: { name: "Arkadaş", invite: revoked.data.group.invite } });
    const receiver = pushReceiver();
    const endpoint = push.url("/push/revoked");
    assert.equal((await request("/push", { cookie: revoked.cookie, body: { subscription: receiver.subscription(endpoint) } })).status, 200);
    const code = (await request("/transfer", { cookie: revoked.cookie, body: {} })).data.code;
    let stream;
    if (target === "node") {
      const r = await fetch(`${base}/api/events`, { headers: { Cookie: revoked.cookie }, signal: AbortSignal.timeout(5000) });
      stream = r.body.getReader();
      await stream.read();
    }
    assert.equal((await request(`/owner/members/${revoked.data.memberId}/signout`, { cookie: owner, body: {} })).status, 200);
    assert.equal((await request("/session", { cookie: revoked.cookie })).status, 401);
    assert.equal((await request("/transfer/claim", { body: { code } })).status, 404);
    if (stream) await waitFor(async () => (await stream.read()).done, 3000, "revoked stream closes");
    await request("/presence", { cookie: friend.cookie, body: { status: "here" } });
    await request("/feedback", { cookie: friend.cookie, body: { kind: "hello", text: "Çıkıştan sonra bildirim testi" } });
    await new Promise((r) => setTimeout(r, 200));
    assert.equal(push.received.some((p) => p.path === "/push/revoked"), false);
    assert.equal(push.received.filter((p) => p.path === "/push/batur").length, ownerPushCount, "logged-out owner gets no more requests");
  });

  test(`[${target}] durable push retries survive restart and concurrent scheduled jobs`, async () => {
    const person = await request("/groups", { body: { name: "Kuyruk testi", groupName: "Geçici kuyruk" } });
    assert.equal(person.status, 201);
    const receiver = pushReceiver();
    const path = "/push/outbox-retry", endpoint = push.url(path);
    const sent = (p = path) => push.received.filter((r) => r.path === p);
    const inspect = async (ep = endpoint, action = "inspect") => {
      const result = await request("/__test/push-outbox", { body: { endpoint: ep, action } });
      assert.equal(result.status, 200);
      return result.data;
    };
    const runScheduled = async () => {
      if (target === "worker") {
        const r = await fetch(`${base}/cdn-cgi/local/scheduled?cron=${encodeURIComponent("* * * * *")}`);
        assert.equal(r.status, 200, "real workerd scheduled handler runs");
        assert.doesNotMatch(await r.text(), /<!doctype html>/i, "scheduled probe must not return the SPA");
      } else await inspect(endpoint, "drain");
    };
    const subscribe = async (ep) => {
      const r = await request("/push", { cookie: person.cookie, body: { subscription: receiver.subscription(ep), test: true } });
      assert.equal(r.status, 200); assert.equal(r.data.test, true);
    };
    try {
      push.respond(path, [500, 429, 201], 150);
      await subscribe(endpoint);
      await waitFor(async () => (await inspect()).rows.some((r) => r.attempts === 1 && r.status === "pending"));
      assert.equal(sent().length, 1);
      const [first] = (await inspect()).rows;
      assert.ok(first.next_at >= first.created + 30000);
      assert.equal(JSON.parse(receiver.decrypt(sent()[0].body)).id, first.id);
      await stop(); await start();
      assert.equal((await inspect()).rows[0].id, first.id, "restart preserves the unsent notification");
      await inspect(endpoint, "due");
      await Promise.all([runScheduled(), runScheduled()]);
      await waitFor(async () => (await inspect()).rows.some((r) => r.attempts === 2 && r.status === "pending"));
      assert.equal(sent().length, 2, "concurrent schedulers send exactly one retry");
      assert.ok((await inspect()).rows[0].next_at >= Date.now() + 110000);
      await inspect(endpoint, "due"); await runScheduled();
      await waitFor(async () => !(await inspect()).rows.length);
      assert.equal(sent().length, 3);
      assert.ok(sent().every((r) => JSON.parse(receiver.decrypt(r.body)).id === first.id));

      const gone = "/push/outbox-gone", goneEndpoint = push.url(gone);
      push.respond(gone, [410]); await subscribe(goneEndpoint);
      await waitFor(async () => !(await inspect(goneEndpoint)).subscribed);
      assert.equal(sent(gone).length, 1);
      assert.equal((await inspect(goneEndpoint)).rows.length, 0);

      const old = "/push/outbox-expired", oldEndpoint = push.url(old);
      push.respond(old, [500]); await subscribe(oldEndpoint);
      await waitFor(async () => (await inspect(oldEndpoint)).rows.some((r) => r.status === "pending" && r.attempts === 1));
      await inspect(oldEndpoint, "expire"); await runScheduled();
      assert.equal(sent(old).length, 1, "expired TTL is not resent");
      assert.equal((await inspect(oldEndpoint)).rows.length, 0);

      const revoked = "/push/outbox-revoked", revokedEndpoint = push.url(revoked);
      push.respond(revoked, [500]); await subscribe(revokedEndpoint);
      await waitFor(async () => (await inspect(revokedEndpoint)).rows.some((r) => r.status === "pending" && r.attempts === 1));
      const logout = await request(`/owner/members/${person.data.memberId}/signout`, { owner: adminKey, body: {} });
      assert.equal(logout.status, 200);
      assert.equal((await inspect(revokedEndpoint)).rows.length, 0);
      await runScheduled(); assert.equal(sent(revoked).length, 1, "revoked device is never retried");
    } finally {
      await request(`/owner/members/${person.data.memberId}`, { owner: adminKey, method: "DELETE" });
    }
  });

  test(`[${target}] one device keeps several accounts, switches with one tap and gets pushes for each (n25)`, async () => {
    // A fresh process resets the burst limiter; this test signs up nine people.
    await stop();
    await start();
    // A browser-like cookie jar for one phone: every Set-Cookie is kept or dropped.
    const jar = new Map();
    const phone = async (path, { body, method } = {}) => {
      const response = await fetch(`${base}/api${path}`, {
        method: method || (body ? "POST" : "GET"),
        headers: { "Content-Type": "application/json", "X-Kutup": "1", Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; ") },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      for (const line of response.headers.getSetCookie()) {
        assert.match(line, /HttpOnly/, "no session token is readable by page scripts");
        const [name, ...value] = line.split(";")[0].split("=");
        if (/Max-Age=0\b/.test(line)) jar.delete(name);
        else jar.set(name, value.join("="));
      }
      return { status: response.status, data: await response.json() };
    };
    const signUp = (name, groupName) => phone("/groups", { body: { name, groupName, username: `n25_${groupName.toLowerCase().replace(/[^a-z0-9]/g, "")}`, password: "test-pass-123" } });
    const first = await signUp("Batur", "Ana tayfa");
    const second = await signUp("Batur 2", "Ikinci tayfa");
    assert.equal(second.status, 201);
    assert.ok(jar.has("kutup_accounts"), "signing up again keeps the first account on the phone");
    const accounts = async () => (await phone("/accounts")).data.accounts;
    assert.deepEqual((await accounts()).map((a) => [a.name, a.team, a.current]), [["Batur 2", "Ikinci tayfa", true], ["Batur", "Ana tayfa", false]]);
    // Only an account this phone really signed in to can be switched to.
    const stranger = await request("/groups", { body: { name: "Yabancı", groupName: "Başka" } });
    assert.equal((await phone("/accounts/switch", { body: { memberId: stranger.data.memberId } })).status, 403);
    assert.equal((await phone("/accounts/switch", { body: { memberId: "uydurma" } })).status, 403);
    assert.equal((await request("/accounts/switch", { cookie: stranger.cookie, body: { memberId: first.data.memberId } })).status, 403, "another browser cannot");
    const switched = await phone("/accounts/switch", { body: { memberId: first.data.memberId } });
    assert.equal(switched.status, 200);
    assert.equal(switched.data.memberId, first.data.memberId);
    assert.equal(switched.data.group.name, "Ana tayfa");
    assert.equal((await phone("/state")).data.group.name, "Ana tayfa", "the other team's data, nothing mixed");

    // Push: both accounts on one endpoint; a renewed subscription takes both along.
    const receiver = pushReceiver();
    const old = push.url("/push/n25-old"), path = "/push/n25-phone", endpoint = push.url(path);
    assert.equal((await phone("/push", { body: { subscription: receiver.subscription(old) } })).status, 200);
    await phone("/accounts/switch", { body: { memberId: second.data.memberId } });
    assert.equal((await phone("/push", { body: { subscription: receiver.subscription(old) } })).status, 200);
    const off = await phone("/push", { method: "DELETE", body: { endpoint: old } });
    assert.equal(off.data.others, 1, "the first account still uses this browser subscription");
    await phone("/push", { body: { subscription: receiver.subscription(old) } });
    await phone("/push", { body: { subscription: receiver.subscription(endpoint), previous: old } });
    const friendA = await request("/join", { body: { invite: first.data.group.invite, name: "Ana arkadaş" } });
    const friendB = await request("/join", { body: { invite: second.data.group.invite, name: "İkinci arkadaş" } });
    await request("/presence", { cookie: friendA.cookie, body: { status: "here" } });
    await request("/presence", { cookie: friendB.cookie, body: { status: "here" } });
    const sent = () => push.received.filter((p) => p.path === path).map((p) => JSON.parse(receiver.decrypt(p.body)));
    await waitFor(() => sent().length >= 2, 8000, "a push for each account");
    assert.equal(push.received.some((p) => p.path === "/push/n25-old"), false);
    const titles = Object.fromEntries(sent().map((p) => [p.account, p.title]));
    assert.deepEqual(titles, {
      [first.data.memberId]: "Ana tayfa · Ana arkadaş kütüpte! 📚",
      [second.data.memberId]: "Ikinci tayfa · İkinci arkadaş kütüpte! 📚",
    });

    // Batur signs the first account out everywhere: it leaves the switcher and
    // its pushes stop; the second account carries on.
    const owner = await ownerSession();
    assert.equal((await request(`/owner/members/${first.data.memberId}/signout`, { cookie: owner, body: {} })).status, 200);
    assert.deepEqual((await accounts()).map((a) => a.name), ["Batur 2"]);
    assert.equal((await phone("/accounts/switch", { body: { memberId: first.data.memberId } })).status, 403);
    assert.equal((await phone("/state")).status, 200);
    let seen = sent().length;
    await request("/messages", { cookie: friendA.cookie, body: { text: "Kimse yok mu?" } });
    await request("/messages", { cookie: friendB.cookie, body: { text: "Buradayım" } });
    await waitFor(() => sent().length > seen, 8000, "the remaining account's push");
    await new Promise((r) => setTimeout(r, 300));
    assert.deepEqual(sent().slice(seen).map((p) => p.account), [second.data.memberId]);

    // Five accounts at most; signing in again to one already here replaces it.
    for (const n of [3, 4, 5, 6]) assert.equal((await signUp(`Hesap ${n}`, `Tayfa ${n}`)).status, 201);
    const full = await signUp("Hesap 7", "Tayfa 7");
    assert.equal(full.status, 409);
    assert.match(full.data.error, /en fazla 5 hesap/);
    assert.equal((await accounts()).length, 5);
    assert.equal((await phone("/login", { body: { username: "n25_ikincitayfa", password: "test-pass-123" } })).status, 200);
    assert.equal((await accounts()).length, 5);
    seen = sent().length;
    await request("/messages", { cookie: friendB.cookie, body: { text: "Hâlâ buradayım" } });
    await waitFor(() => sent().length > seen, 8000, "push after signing in again");
    // Signing out of one account: it stops getting pushes, the next one opens.
    assert.equal((await phone("/logout", { body: {} })).data.others, 4);
    const next = await phone("/session");
    assert.equal(next.status, 200);
    assert.notEqual(next.data.memberId, second.data.memberId);
    assert.equal((await accounts()).length, 4);
    seen = sent().length;
    await request("/messages", { cookie: friendB.cookie, body: { text: "Son kez" } });
    await new Promise((r) => setTimeout(r, 500));
    assert.equal(sent().length, seen, "a signed-out account gets nothing on this phone");
    // Leaving a team hands the phone to another account as well.
    assert.equal((await phone("/leave", { body: {} })).status, 200);
    assert.equal((await phone("/session")).status, 200);
    assert.equal((await accounts()).length, 3);
  });

  test(`[${target}] relaxed construction completes without foreground proof and delivery cannot pay twice`, async () => {
    const created = await request("/groups", { body: { name: "RahatDeneme", groupName: "Rahat test" } });
    assert.equal(created.status, 201);
    const cookie = created.cookie;
    people.discovery=cookie;
    const started = await request("/focus", { cookie, body: { action: "start", model: "kulube", strict: true, relaxed: true } });
    assert.equal(started.status, 200);
    const person = started.data.state.members.find((m) => m.id === created.data.memberId);
    assert.equal(person.focusRelaxed, 1);
    for (const action of ["away", "crack", "beat"])
      assert.equal((await request("/focus", { cookie, body: { action } })).status, 200);
    await request("/__test/expire", { body: { name: "RahatDeneme", away: true } });
    const delivered = await request("/build-deliveries", { cookie });
    assert.equal(delivered.status, 200);
    assert.equal(delivered.data.length, 1);
    assert.equal(delivered.data[0].seed, person.focusSeed);
    const before = (await request("/wallet", { cookie })).data;
    assert.equal(before.built.kulube, 1);
    const path = `/build-deliveries/${delivered.data[0].id}`;
    assert.equal((await request(path, { cookie: people.alice, body: {} })).status, 404);
    for (let i = 0; i < 2; i++) assert.equal((await request(path, { cookie, body: {} })).status, 200);
    assert.deepEqual((await request("/build-deliveries", { cookie })).data, []);
    assert.deepEqual((await request("/wallet", { cookie })).data, before);
  });

  test(`[${target}] blueprint discovery counts minutes, persists a 500-minute guarantee and settles once`, async()=>{
    const name="RahatDeneme",cookie=people.discovery;
    assert.equal((await request("/wallet",{cookie})).data.discovery.remaining,475);
    for(let i=0;i<7;i++){
      assert.equal((await request("/focus",{cookie,body:{action:"start",minutes:i===6?50:75}})).status,200);
      await request("/__test/expire",{body:{name}});
      await Promise.all([request("/state",{cookie}),request("/focus",{cookie,body:{action:"finish"}})]);
      const wallet=(await request("/wallet",{cookie})).data;
      if(i===0)assert.equal(wallet.discovery.remaining,400);
    }
    const wallet=(await request("/wallet",{cookie})).data;
    assert.equal(wallet.unlocks.length,1);assert.equal(wallet.discovery.remaining,475);
    assert.equal(wallet.log.filter(r=>r.reason==="blueprint").length,1);
    assert.match(wallet.log.find(r=>r.reason==="blueprint").note,/500 dk/);
    await request("/focus",{cookie,body:{action:"finish"}});
    assert.deepEqual((await request("/wallet",{cookie})).data.discovery,wallet.discovery);
    assert.equal(JSON.stringify(wallet).includes('seed'),false);
    assert.equal((await request('/leave',{cookie,body:{}})).status,200);
  });

  test(`[${target}] one Anıtkabir across villages: full 2000 minute project, reservations and all personal signatures`, async () => {
    const crew=[];
    for(let i=0;i<4;i++) {
      const name=`İmeceUsta${i}`;
      const r=await request("/groups",{body:{name,username:`imece_usta_${i}`,password:"imece-test-123"}});
      assert.equal(r.status,201);crew.push({id:r.data.memberId,cookie:r.cookie,name});
    }
    assert.equal((await request("/imece")).status,401);
    assert.equal((await request("/owner/imece",{cookie:crew[0].cookie,body:{members:crew.map(p=>p.id)}})).status,401);
    const owner=await ownerSession();
    assert.equal((await request("/owner/imece",{cookie:owner,body:{members:crew.map(p=>p.id)}})).status,201);
    const read=async(i=0)=>(await request("/imece",{cookie:crew[i].cookie})).data;
    assert.equal((await read(2)).crew.length,4);
    assert.equal((await state("alice")).group.id,group.id,"global project never replaces the private team state");
    assert.equal((await request("/focus",{cookie:people.alice,body:{action:"start",imece:true,relaxed:true,minutes:25}})).status,403);
    const work=async(i,minutes)=>{
      const r=await request("/focus",{cookie:crew[i].cookie,body:{action:"start",imece:true,relaxed:true,minutes}});
      assert.equal(r.status,200,JSON.stringify(r.data));
      await request("/__test/expire",{body:{name:crew[i].name,away:true}});
      const done=await request("/focus",{cookie:crew[i].cookie,body:{action:"finish"}});
      assert.equal(done.status,200);
    };
    // The remaining three workers' compulsory minutes are protected.
    for(let i=0;i<3;i++)await work(0,75);
    await work(0,25);
    assert.equal((await request("/focus",{cookie:crew[0].cookie,body:{action:"start",imece:true,relaxed:true,minutes:25}})).status,409);
    assert.equal((await read()).phase,0);
    const parallel=await Promise.all(crew.slice(1).map(p=>request("/focus",{cookie:p.cookie,body:{action:"start",imece:true,relaxed:true,minutes:50}})));
    assert.ok(parallel.every(r=>r.status===200),"different villages can reserve distinct personal jobs together");
    for(let i=1;i<4;i++)await request("/__test/expire",{body:{name:crew[i].name,away:true}});
    await Promise.all([read(0),read(1),read(2)]);
    assert.equal((await read()).phase,1);
    for(let round=0;round<6;round++)for(let i=0;i<4;i++)await work(i,50);
    assert.equal((await read()).minutes,1600);
    for(let round=0;round<2;round++)for(let i=0;i<4;i++)await work(i,50);
    const done=await read(3);
    assert.equal(done.minutes,2000);assert.equal(done.complete,true);assert.ok(done.completed>0);
    for(const person of done.crew)assert.deepEqual(person.personal,[50,150,50]);
    assert.ok(done.delivery.minutes>0);
    await request("/imece/seen",{cookie:crew[3].cookie,body:{minutes:999999}});
    assert.equal((await read(3)).delivery,null);
    assert.equal((await read()).minutes,2000);
    for(const person of crew){
      const village=(await request("/village",{cookie:person.cookie})).data;
      assert.equal(village.total,0,"shared work must not create private copies of a building");
    }
  });

  test(`[${target}] data survives a restart`, async () => {
    await stop();
    await start();
    const persisted = await request("/session", { cookie: people.alice });
    assert.equal(persisted.status, 200);
    assert.equal(persisted.data.group.id, group.id);
    assert.ok(persisted.data.plans.some((p) => p.id === plan));
    assert.equal(member(persisted.data, "Aylin").focusToday, 25);
    assert.equal((await request("/feedback", { cookie: people.alice })).data[0].id, feedbackId);
    assert.equal((await request("/session", { cookie: people.alicePhone })).status, 200);
    assert.equal((await request("/not-real")).status, 404);
  });
}
