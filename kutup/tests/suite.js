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

const root = resolve(import.meta.dirname, "..");

export function defineSuite(target) {
  const directory = mkdtempSync(resolve(tmpdir(), `kutup-${target}-`));
  const adminKey = randomBytes(24).toString("hex");
  let child, base, push;
  const people = {};
  let group, plan, messageId, feedbackId;

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
          env: { ...process.env, WRANGLER_SEND_METRICS: "false", CI: "1" },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      let output = "";
      child.stdout.on("data", (c) => (output += c));
      child.stderr.on("data", (c) => (output += c));
      base = `http://127.0.0.1:${port}`;
      try {
        await waitFor(
          () => fetch(`${base}/api/health`).then((r) => r.ok).catch(() => false),
          90000,
          "wrangler dev",
        );
      } catch (error) {
        console.error(output);
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
  async function request(path, { cookie, body, method, owner, headers = {} } = {}) {
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
    assert.ok(created.data.live === "sse" || created.data.live === "poll");
    assert.equal((await request(`/invites/${group.invite}`)).data.count, 1);
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
    plan = (await request("/plans", {
      cookie: people.alice,
      body: { starts: Date.now() + 3600000, note: "Test çalışma buluşması" },
    })).data.id;
    assert.equal((await request(`/plans/${plan}/join`, { cookie: people.charlie, body: {} })).status, 404);
    assert.equal((await request(`/plans/${plan}/join`, { cookie: people.bob, body: {} })).status, 200);
    assert.equal((await state("bob")).plans[0].attendees.length, 2);
    assert.equal((await request(`/plans/${plan}`, { cookie: people.bob, method: "DELETE", body: {} })).status, 404);
    assert.equal((await state("alice")).plans.length, 1);
    assert.equal((await request("/plans", { cookie: people.bob, body: { starts: Date.now() - 86400000 } })).status, 400);
    assert.equal((await request("/plans", { cookie: people.bob, body: { starts: Date.now() + 40 * 86400000 } })).status, 400);
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

  test(`[${target}] focus validates duration and lets friends join the same timer`, async () => {
    assert.equal((await request("/focus", { cookie: people.alice, body: { action: "start", minutes: 1 } })).status, 400);
    assert.equal((await request("/focus", { cookie: people.alice, body: { action: "start", minutes: 25 } })).status, 200);
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
    assert.equal(village.length, 1);
    assert.equal(village[0].kind, "cottage");
    assert.equal(village[0].memberId, deniz.id);
    assert.equal(village[0].seed, building.focusSeed, "the finished building keeps the look it was built with");
    assert.equal((await request("/village", { cookie: people.charlie })).data.length, 0, "villages stay in their group");
    // Closed the app mid-session: no minutes, no building, a collapse on the board.
    await request("/focus", { cookie: people.bob, body: { action: "start", minutes: 50, strict: true } });
    await request("/__test/expire", { body: { name: "Deniz", away: true } });
    const later = await state("alice"); // anyone's read settles it
    assert.equal(member(later, "Deniz").focusWeek, 25);
    assert.equal(member(later, "Deniz").buildings, 1);
    assert.ok(later.messages.some((m) => m.text.startsWith("inşaatı çöktü 🧱")));
    // Leaving the app (reported by the client) collapses it right away.
    await request("/focus", { cookie: people.bob, body: { action: "start", minutes: 75, strict: true } });
    const left = await request("/focus", { cookie: people.bob, body: { action: "wither" } });
    assert.equal(left.data.withered, true);
    assert.equal(member(left.data.state, "Deniz").focusEnd, 0);
    // A plain session never collapses and builds nothing.
    await request("/focus", { cookie: people.bob, body: { action: "start", minutes: 25 } });
    await request("/__test/expire", { body: { name: "Deniz", away: true } });
    const plain = member(await state("bob"), "Deniz");
    assert.equal(plain.focusWeek, 50);
    assert.equal(plain.buildings, 1);
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
    const ece = await request("/join", { body: { invite: group.invite, name: "Ece", avatar: "🌸" } });
    people.ece = ece.cookie;
    const publicKey = ece.data.pushPublicKey;
    const pushes = () => push.received.filter((p) => p.path === "/push/deniz");
    await request("/presence", { cookie: people.ece, body: { status: "here", location: "Kafeterya" } });
    await waitFor(() => pushes().length >= 1, 8000, "arrival push");
    const [first] = pushes();
    assert.equal(first.headers["content-encoding"], "aes128gcm");
    assert.equal(first.headers.ttl, "1800");
    await verifyVapid(first.headers.authorization, endpoint, publicKey);
    const payload = JSON.parse(receiver.decrypt(first.body));
    assert.equal(payload.title, "Ece kütüpte! 📚");
    assert.equal(payload.body, "Kafeterya");
    // Leaving and arriving again within 45 minutes does not ping again.
    await request("/presence", { cookie: people.ece, body: { status: "away" } });
    await request("/presence", { cookie: people.ece, body: { status: "here" } });
    await request("/messages", { cookie: people.ece, body: { text: "Kafeteryada kahve?", kind: "coffee" } });
    await waitFor(() => pushes().length >= 2, 8000, "coffee push");
    await new Promise((r) => setTimeout(r, 500));
    const titles = pushes().map((p) => JSON.parse(receiver.decrypt(p.body)).title);
    assert.deepEqual(titles, ["Ece kütüpte! 📚", "Ece: mola? ☕"]);
    // Plans notify too and deep-link to the plans tab.
    await request("/plans", { cookie: people.ece, body: { starts: Date.now() + 86400000, note: "Sabah kulübü" } });
    await waitFor(() => pushes().length >= 3, 8000, "plan push");
    const planPush = JSON.parse(receiver.decrypt(pushes()[2].body));
    assert.match(planPush.body, /Sabah kulübü/);
    assert.equal(planPush.url, "/?tab=plans");
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
    const left = await request("/leave", { cookie: people.bob, body: {} });
    if (stream)
      await waitFor(async () => (await stream.read()).done, 3000, "stream close");
    assert.equal(left.status, 200);
    assert.match(left.setCookie, /Max-Age=0/);
    assert.equal((await request("/session", { cookie: people.bob })).status, 401);
    const s = await state("alice");
    assert.equal(member(s, "Deniz"), undefined);
    assert.equal(s.messages.some((m) => m.memberId && !s.members.some((x) => x.id === m.memberId)), false);
    assert.equal(s.messages.find((m) => m.id === messageId).reactions.length, 0);
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
