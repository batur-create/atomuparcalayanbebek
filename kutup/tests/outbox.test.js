import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { sqliteAdapter } from "../server/sqlite.js";
import { migrate } from "../server/schema.js";
import { createPushOutbox, PUSH_BATCH_SIZE, PUSH_LEASE_MS } from "../server/outbox.js";

const AGE = 365 * 86400000, OWNER_AGE = 30 * 86400000;
async function fixture(t) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  t.after(() => sqlite.close());
  const db = sqliteAdapter(sqlite);
  await migrate(db);
  const f = { sqlite, db, time: Date.now(), owner: "owner-key-hash", sends: [], reply: async () => 201 };
  sqlite.exec(`INSERT INTO groups (id, name, invite) VALUES ('g', 'Test', 'test-invite');
    INSERT INTO members (id, group_id, token, name, avatar, color, joined, updated) VALUES ('m', 'g', 'legacy', 'Test', '🪐', 'mint', 1, 1);`);
  await db.run("INSERT INTO sessions (token, member_id, created) VALUES ('device', 'm', ?)", [f.time]);
  await db.run("INSERT INTO owner_sessions (token, key_hash, created) VALUES ('owner-device', ?, ?)", [f.owner, f.time]);
  f.endpoint = "https://fcm.googleapis.com/outbox-test";
  const subscription = JSON.stringify({ endpoint: f.endpoint, keys: {} });
  await db.run("INSERT INTO subscriptions (endpoint, member_id, session_token, subscription) VALUES (?, 'm', 'device', ?)", [f.endpoint, subscription]);
  await db.run("INSERT INTO owner_subscriptions (endpoint, session_token, key_hash, subscription) VALUES (?, 'owner-device', ?, ?)", [f.endpoint, f.owner, subscription]);
  f.sub = () => db.get("SELECT * FROM subscriptions WHERE endpoint = ?", [f.endpoint]);
  f.rows = () => db.all("SELECT * FROM push_outbox ORDER BY created, id");
  f.options = { subject: "https://kutup.test", urgency: "high", ttl: 7200 };
  f.makeQueue = () => createPushOutbox({
    db, allowed: (url) => url.startsWith("https://fcm.googleapis.com/"), ownerHash: async () => f.owner,
    sessionAge: AGE, ownerAge: OWNER_AGE, now: () => f.time,
    send: async (sub, payload, options) => {
      f.sends.push({ sub, payload: JSON.parse(payload), ...options });
      return f.reply();
    },
  });
  f.queue = f.makeQueue();
  f.enqueue = async (options = {}) => f.queue.enqueue([await f.sub()], { title: "Test", tag: "stable-tag" }, "subscriptions", { ...f.options, ...options });
  return f;
}

test("outbox retries 500, 429 and network failures with stable payload and remaining TTL", async (t) => {
  const f = await fixture(t);
  const replies = [500, 429, new Error("network"), 201];
  f.reply = async () => { const next = replies.shift(); if (next instanceof Error) throw next; return next; };
  await f.enqueue();
  for (const [i, delay] of [30000, 120000, 600000].entries()) {
    await f.makeQueue().drain(); // A new process can pick up the persisted job.
    const [row] = await f.rows();
    assert.equal(row.attempts, i + 1);
    assert.equal(row.next_at, f.time + delay);
    assert.equal(row.status, "pending");
    await f.queue.drain();
    assert.equal(f.sends.length, i + 1, "not before the scheduled retry");
    f.time += delay;
  }
  await f.queue.drain();
  assert.equal((await f.rows()).length, 0);
  assert.equal(f.sends.length, 4);
  assert.equal(new Set(f.sends.map((s) => s.payload.id)).size, 1);
  assert.ok(f.sends.every((s) => s.payload.tag === "stable-tag" && s.urgency === "high"));
  assert.deepEqual(f.sends.map((s) => s.ttl), [7200, 7170, 7050, 6450]);
});

test("outbox stops after four attempts and drops permanent failures and expired TTLs", async (t) => {
  const f = await fixture(t);
  f.reply = async () => 503;
  await f.enqueue();
  for (const delay of [30000, 120000, 600000, 0]) { await f.queue.drain(); f.time += delay; }
  assert.equal(f.sends.length, 4);
  assert.equal((await f.rows()).length, 0);
  await f.queue.drain();
  assert.equal(f.sends.length, 4);
  f.reply = async () => 400;
  await f.enqueue(); await f.queue.drain();
  assert.equal((await f.rows()).length, 0, "a permanent 400 is not retried");
  f.reply = async () => 500;
  await f.enqueue({ ttl: 20 }); await f.queue.drain();
  assert.equal((await f.rows()).length, 0, "a retry after TTL is never scheduled");
  const sent = f.sends.length;
  await f.enqueue({ ttl: 20 }); f.time += 20000; await f.queue.drain();
  assert.equal(f.sends.length, sent, "already expired payload is not sent");
  assert.equal((await f.rows()).length, 0);
});

test("two concurrent outbox runners claim a job only once", { timeout: 5000 }, async (t) => {
  const f = await fixture(t);
  let release, started;
  const gate = new Promise((r) => { release = r; });
  const sending = new Promise((r) => { started = r; });
  f.reply = async () => { started(); await gate; return 201; };
  await f.enqueue();
  const first = f.queue.drain();
  await sending;
  await f.makeQueue().drain();
  assert.equal(f.sends.length, 1);
  release(); await first;
  assert.equal((await f.rows()).length, 0);
});

test("an abandoned lease recovers and a stale sender cannot erase the next attempt", { timeout: 5000 }, async (t) => {
  const f = await fixture(t);
  let release, started;
  const gate = new Promise((r) => { release = r; });
  const sending = new Promise((r) => { started = r; });
  f.reply = async () => { started(); await gate; return 201; };
  await f.enqueue();
  const oldSender = f.queue.drain(); await sending;
  f.time += PUSH_LEASE_MS;
  f.reply = async () => 500;
  await f.makeQueue().drain();
  const [next] = await f.rows();
  assert.equal(next.attempts, 2);
  assert.equal(next.status, "pending");
  release(); await oldSender;
  assert.deepEqual(await f.rows(), [next], "old success must not erase the new lease's retry");
  f.time = next.next_at; f.reply = async () => 201;
  await f.queue.drain();
  assert.equal((await f.rows()).length, 0);
});

test("session expiry, revocation and endpoint rebinding invalidate queued private notifications", async (t) => {
  const f = await fixture(t);
  await f.enqueue();
  await f.db.run("UPDATE sessions SET created = ? WHERE token = 'device'", [f.time - AGE]);
  await f.queue.drain(); assert.equal(f.sends.length, 0);
  await f.db.run("UPDATE sessions SET created = ? WHERE token = 'device'", [f.time]);
  await f.enqueue();
  const old = await f.sub();
  await f.db.run("INSERT INTO sessions (token, member_id, created) VALUES ('new-device', 'm', ?)", [f.time]);
  await f.db.run("UPDATE subscriptions SET session_token = 'new-device'");
  assert.equal((await f.rows()).length, 0, "rebind immediately purges old queued data");
  await f.queue.enqueue([old], { title: "old audience" }, "subscriptions", f.options);
  assert.equal((await f.rows()).length, 0, "audience cannot change between selection and enqueue");
  await f.enqueue();
  await f.db.run("DELETE FROM sessions WHERE token = 'new-device'");
  assert.equal((await f.rows()).length, 0, "session cascade also removes queue rows");
  await f.queue.drain(); assert.equal(f.sends.length, 0);
});

test("410 removes a dead subscription but never a replacement bound during the send", async (t) => {
  const f = await fixture(t);
  f.reply = async () => {
    await f.db.run("INSERT INTO sessions (token, member_id, created) VALUES ('replacement', 'm', ?)", [f.time]);
    await f.db.run("UPDATE subscriptions SET session_token = 'replacement'");
    return 410;
  };
  await f.enqueue(); await f.queue.drain();
  assert.equal((await f.sub()).session_token, "replacement");
  f.reply = async () => 410;
  await f.enqueue(); await f.queue.drain();
  assert.equal(await f.sub(), null);
  assert.equal((await f.rows()).length, 0);
});

test("owner retries respect key rotation, session expiry and legacy key-authorized devices", async (t) => {
  const f = await fixture(t);
  const enqueueOwner = async () => f.queue.enqueue([await f.db.get("SELECT * FROM owner_subscriptions")], { title: "Private feedback" }, "owner_subscriptions", f.options);
  await enqueueOwner(); f.owner = "rotated-key-hash";
  await f.queue.drain(); assert.equal(f.sends.length, 0);
  f.owner = "owner-key-hash";
  await enqueueOwner();
  await f.db.run("UPDATE owner_sessions SET created = ?", [f.time - OWNER_AGE]);
  await f.queue.drain(); assert.equal(f.sends.length, 0);
  await f.db.run("UPDATE owner_subscriptions SET session_token = NULL");
  await enqueueOwner(); await f.queue.drain();
  assert.equal(f.sends.length, 1, "legacy owner devices retain their existing key authorization");
  await enqueueOwner(); await f.db.run("DELETE FROM owner_subscriptions");
  assert.equal((await f.rows()).length, 0);
});

test("outbox drains bounded batches using the due index and leaves future jobs untouched", async (t) => {
  const f = await fixture(t);
  for (let i = 0; i < PUSH_BATCH_SIZE + 3; i++) await f.enqueue();
  await f.queue.drain();
  assert.equal(f.sends.length, PUSH_BATCH_SIZE);
  assert.equal((await f.rows()).length, 3);
  await f.db.run("UPDATE push_outbox SET next_at = ?", [f.time + 10000]);
  await f.queue.drain(); assert.equal(f.sends.length, PUSH_BATCH_SIZE);
  const plan = await f.db.all("EXPLAIN QUERY PLAN SELECT id FROM push_outbox WHERE next_at <= ? ORDER BY next_at, id LIMIT ?", [f.time, PUSH_BATCH_SIZE]);
  assert.ok(plan.some((r) => /SEARCH .*push_outbox_due/.test(r.detail)), "idle cron uses the index instead of scanning the queue");
});
