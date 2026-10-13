import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const root = resolve(import.meta.dirname, ".."),
  directory = mkdtempSync(resolve(tmpdir(), "kutup-test-"));
const adminKey = randomBytes(24).toString("hex");
let processHandle,
  base,
  alice,
  bob,
  charlie,
  group,
  plan,
  messageId,
  feedbackId;
async function start() {
  processHandle = spawn(process.execPath, ["server/index.js"], {
    cwd: root,
    env: {
      ...process.env,
      PORT: "0",
      DATA_DIR: directory,
      ADMIN_KEY: adminKey,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Server startup timeout")),
      10000,
    );
    processHandle.stdout.on("data", (chunk) => {
      const match = chunk.toString().match(/port (\d+)/);
      if (match) {
        base = `http://127.0.0.1:${match[1]}`;
        clearTimeout(timeout);
        resolve();
      }
    });
    processHandle.once("error", reject);
    processHandle.once("exit", (code) => {
      if (code) reject(new Error(`Server exited ${code}`));
    });
  });
}
async function stop() {
  if (!processHandle?.killed) {
    const done = new Promise((r) => processHandle.once("exit", r));
    processHandle.kill("SIGTERM");
    await done;
  }
}
async function request(
  path,
  { cookie, body, method, owner, headers = {} } = {},
) {
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
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
}
before(start);
after(async () => {
  await stop();
  rmSync(directory, { recursive: true, force: true });
});

test("authentication is required for group data", async () => {
  assert.equal((await request("/state")).status, 401);
  const denied = await request("/groups", {
    body: { name: "Aylin", groupName: "Tayfa" },
    headers: { "X-Kutup": "" },
  });
  assert.equal(denied.status, 403);
});
test("create a private group, join with its invitation, and reject duplicate names", async () => {
  const result = await request("/groups", {
    body: {
      name: "Aylin",
      groupName: "Test tayfa",
      avatar: "🍒",
      color: "pink",
    },
  });
  assert.equal(result.status, 201);
  alice = result.cookie;
  group = result.data.group;
  assert.equal(result.data.members.length, 1);
  assert.ok(group.invite.length >= 24);
  const second = await request("/join", {
    body: { invite: group.invite, name: "Deniz", avatar: "🪐" },
  });
  assert.equal(second.status, 201);
  bob = second.cookie;
  assert.equal(
    (await request("/join", { body: { invite: group.invite, name: "deniz" } }))
      .status,
    409,
  );
  const third = await request("/groups", {
    body: { name: "Ege", groupName: "Başka ekip" },
  });
  charlie = third.cookie;
  assert.equal(
    (await request("/state", { cookie: charlie })).data.members.length,
    1,
  );
});
test("presence and plans are shared between members and isolated from another group", async () => {
  assert.equal(
    (
      await request("/presence", {
        cookie: alice,
        body: { status: "here", location: "1. kat", desk: "24" },
      })
    ).status,
    200,
  );
  const state = (await request("/state", { cookie: bob })).data;
  assert.equal(state.members.find((x) => x.name === "Aylin").desk, "24");
  assert.equal(state.members.find((x) => x.name === "Aylin").status, "here");
  assert.equal(
    state.members.some((x) => "token" in x),
    false,
  );
  plan = (
    await request("/plans", {
      cookie: alice,
      body: { starts: Date.now() + 3600000, note: "Test çalışma buluşması" },
    })
  ).data.id;
  assert.equal(
    (await request(`/plans/${plan}/join`, { cookie: charlie, body: {} }))
      .status,
    404,
  );
  assert.equal(
    (await request(`/plans/${plan}/join`, { cookie: bob, body: {} })).status,
    200,
  );
  assert.equal(
    (await request("/state", { cookie: bob })).data.plans[0].attendees.length,
    2,
  );
  await request(`/plans/${plan}`, { cookie: bob, body: {}, method: "DELETE" });
  assert.equal(
    (await request("/state", { cookie: alice })).data.plans.length,
    1,
  );
  assert.equal(
    (
      await request("/plans", {
        cookie: bob,
        body: { starts: Date.now() - 86400000 },
      })
    ).status,
    400,
  );
});
test("messages and reactions are group-scoped; invalid and cross-origin writes fail", async () => {
  messageId = (
    await request("/messages", {
      cookie: alice,
      body: { text: "Pencere kenarında yer var!" },
    })
  ).data.id;
  assert.equal(
    (await request(`/messages/${messageId}/react`, { cookie: bob, body: {} }))
      .status,
    200,
  );
  assert.equal(
    (
      await request(`/messages/${messageId}/react`, {
        cookie: charlie,
        body: {},
      })
    ).status,
    404,
  );
  const msg = (await request("/state", { cookie: bob })).data.messages.find(
    (x) => x.id === messageId,
  );
  assert.equal(msg.reactions.length, 1);
  assert.equal(
    (await request("/messages", { cookie: alice, body: { text: "" } })).status,
    400,
  );
  assert.equal(
    (
      await request("/messages", {
        cookie: alice,
        body: { text: "x".repeat(281) },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/messages", {
        cookie: alice,
        body: { text: "test" },
        headers: { Origin: "https://unrelated.example" },
      })
    ).status,
    403,
  );
});
test("SSE sends new shared state after an action", async () => {
  const controller = new AbortController();
  const response = await fetch(`${base}/api/events`, {
    headers: { Cookie: bob },
    signal: controller.signal,
  });
  assert.equal(response.status, 200);
  const reader = response.body.getReader();
  await reader.read();
  await request("/messages", {
    cookie: alice,
    body: { text: "SSE integration marker" },
  });
  const next = await Promise.race([
    reader.read(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("SSE timeout")), 3000).unref(),
    ),
  ]);
  assert.match(new TextDecoder().decode(next.value), /SSE integration marker/);
  controller.abort();
});
test("focus validates duration, shares end time, and rejects premature rewards", async () => {
  assert.equal(
    (
      await request("/focus", {
        cookie: alice,
        body: { action: "start", minutes: 1 },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/focus", {
        cookie: alice,
        body: { action: "start", minutes: 25 },
      })
    ).status,
    200,
  );
  const member = (
    await request("/session", { cookie: alice })
  ).data.members.find((x) => x.name === "Aylin");
  assert.ok(member.focusEnd > Date.now() + 24 * 60000);
  assert.equal(
    (await request("/focus", { cookie: alice, body: { action: "finish" } }))
      .status,
    400,
  );
  assert.equal(
    (
      await request("/focus", {
        cookie: bob,
        body: { action: "start", joinMember: member.id },
      })
    ).status,
    200,
  );
  const state = (await request("/state", { cookie: bob })).data;
  assert.equal(
    state.members.find((x) => x.name === "Deniz").focusEnd,
    member.focusEnd,
  );
  assert.equal(
    (
      await request("/focus", {
        cookie: charlie,
        body: { action: "start", joinMember: member.id },
      })
    ).status,
    400,
  );
});
test("completed focus is counted once and an expired check-in can announce a fresh arrival", async () => {
  // Move only these test records past their deadline; no real-time wait is needed.
  const fixture = new DatabaseSync(resolve(directory, "kutup.sqlite"));
  fixture.prepare("UPDATE members SET focus_end = ?, status_until = 0 WHERE name = ?").run(Date.now() - 1000, "Aylin");
  fixture.close();
  assert.equal((await request("/focus", { cookie: alice, body: { action: "finish" } })).status, 200);
  assert.equal((await request("/focus", { cookie: alice, body: { action: "finish" } })).status, 400);
  const state = (await request("/state", { cookie: alice })).data;
  assert.equal(state.members.find(m => m.name === "Aylin").focusToday, 25);
  assert.equal(state.members.find(m => m.name === "Aylin").status, "away");
  const count = state.messages.length;
  await request("/presence", { cookie: alice, body: { status: "here", location: "Bahçe" } });
  const updated = (await request("/state", { cookie: bob })).data;
  assert.equal(updated.messages.length, count + 1);
  assert.equal(updated.members.find(m => m.name === "Aylin").status, "here");
});
test("feedback is private to its sender and Batur; owner can change its status", async () => {
  const result = await request("/feedback", {
    cookie: alice,
    body: { kind: "idea", text: "Ortak okuma listesi eklesek güzel olur." },
  });
  assert.equal(result.status, 201);
  feedbackId = result.data.id;
  assert.equal((await request("/feedback", { cookie: bob })).data.length, 0);
  assert.equal(
    (await request("/owner/feedback", { owner: "wrong" })).status,
    401,
  );
  const inbox = await request("/owner/feedback", { owner: adminKey });
  assert.equal(inbox.data.length, 1);
  assert.equal(inbox.data[0].name, "Aylin");
  assert.equal(
    (
      await request(`/owner/feedback/${feedbackId}`, {
        owner: adminKey,
        body: { status: "planned" },
      })
    ).status,
    200,
  );
  assert.equal(
    (await request("/feedback", { cookie: alice })).data[0].status,
    "planned",
  );
  assert.equal(
    (await request("/state", { cookie: alice })).data.messages.some((x) =>
      x.text.includes("Ortak okuma"),
    ),
    false,
  );
});
test("push rejects arbitrary endpoints and the server preserves state across restart", async () => {
  const push = await request("/push", {
    cookie: alice,
    body: {
      subscription: {
        endpoint: "https://127.0.0.1/private",
        keys: { auth: "x", p256dh: "y" },
      },
    },
  });
  assert.equal(push.status, 400);
  await stop();
  await start();
  const persisted = await request("/session", { cookie: alice });
  assert.equal(persisted.status, 200);
  assert.equal(persisted.data.group.id, group.id);
  assert.equal(persisted.data.plans[0].id, plan);
  assert.equal(
    (await request("/feedback", { cookie: alice })).data[0].id,
    feedbackId,
  );
  assert.equal((await request("/not-real")).status, 404);
});
