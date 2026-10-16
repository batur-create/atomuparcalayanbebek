// Durable Web Push retries, shared by Node and D1. Delivery to a push provider
// is not a device receipt; the latter belongs to the next delivery layer.
export const PUSH_BATCH_SIZE = 8; // Leave room for DB calls under the free Worker budget.
export const PUSH_LEASE_MS = 60000; // Longer than sendPush's 10-second timeout.
const RETRY_MS = [30000, 120000, 600000];
const TABLES = new Set(["subscriptions", "owner_subscriptions"]);

export function createPushOutbox({ db, send, allowed, ownerHash, sessionAge, ownerAge, now = Date.now }) {
  async function enqueue(subs, message, table, { subject, ttl = 1800, urgency = "normal" }) {
    if (!TABLES.has(table)) throw new Error("Unknown push subscription table");
    const created = now(), ids = [], statements = [];
    const owner = table === "owner_subscriptions" ? await ownerHash() : null;
    for (const sub of subs) {
      if (!allowed(sub.endpoint)) continue;
      const id = crypto.randomUUID();
      ids.push(id);
      const isMember = table === "subscriptions";
      // The original audience is captured, not whoever owns this endpoint later.
      const identity = isMember
        ? "s.member_id = ? AND s.session_token = ? AND EXISTS (SELECT 1 FROM sessions a WHERE a.token = s.session_token AND a.member_id = s.member_id AND a.created > ?)"
        : "s.key_hash = ? AND s.key_hash = ? AND s.session_token IS ? AND (s.session_token IS NULL OR EXISTS (SELECT 1 FROM owner_sessions a WHERE a.token = s.session_token AND a.key_hash = s.key_hash AND a.created > ?))";
      const binding = isMember
        ? [sub.member_id, sub.session_token, created - sessionAge]
        : [sub.key_hash, owner, sub.session_token ?? null, created - ownerAge];
      statements.push([
        `INSERT INTO push_outbox (id, endpoint, subscription_table, payload, urgency, ttl, next_at, created, member_id, session_token, key_hash, subject)
         SELECT ?, s.endpoint, ?, ?, ?, ?, ?, ?, ${isMember ? "s.member_id" : "NULL"}, s.session_token, ${isMember ? "NULL" : "s.key_hash"}, ?
         FROM ${table} s WHERE s.endpoint = ? AND s.subscription = ? AND ${identity}`,
        [id, table, JSON.stringify({ ...message, ...sub.extra, id }), urgency, ttl, created, created, subject,
          sub.endpoint, sub.subscription, ...binding],
      ]);
    }
    if (statements.length) await db.batch(statements);
    return ids;
  }

  async function attempt(id) {
    const started = now(), lease = crypto.randomUUID();
    // Claim and increment in one statement. A crashed sender's lease becomes
    // eligible again, but stale senders cannot delete or reschedule a new lease.
    const row = await db.get(
      `UPDATE push_outbox SET status = 'sending', attempts = attempts + 1, next_at = ?, lease_token = ?
       WHERE id = ? AND next_at <= ? AND attempts < 4 AND created + ttl * 1000 > ? RETURNING *`,
      [started + PUSH_LEASE_MS, lease, id, started, started],
    );
    if (!row) {
      await db.run("DELETE FROM push_outbox WHERE id = ? AND next_at <= ? AND (attempts >= 4 OR created + ttl * 1000 <= ?)", [id, started, started]);
      return;
    }
    const remove = () => db.run("DELETE FROM push_outbox WHERE id = ? AND lease_token = ?", [id, lease]);
    let sub;
    if (row.subscription_table === "subscriptions") {
      sub = await db.get(
        `SELECT s.subscription FROM subscriptions s JOIN sessions a ON a.token = s.session_token AND a.member_id = s.member_id
         JOIN push_outbox q ON q.id = ? AND q.lease_token = ?
         WHERE s.endpoint = ? AND s.member_id = ? AND s.session_token = ? AND a.created > ?`,
        [id, lease, row.endpoint, row.member_id, row.session_token, now() - sessionAge],
      );
    } else if (row.subscription_table === "owner_subscriptions") {
      const owner = await ownerHash();
      sub = await db.get(
        `SELECT s.subscription FROM owner_subscriptions s JOIN push_outbox q ON q.id = ? AND q.lease_token = ?
         WHERE s.endpoint = ? AND s.key_hash = ? AND s.key_hash = ? AND s.session_token IS ?
         AND (s.session_token IS NULL OR EXISTS (SELECT 1 FROM owner_sessions a WHERE a.token = s.session_token AND a.key_hash = s.key_hash AND a.created > ?))`,
        [id, lease, row.endpoint, row.key_hash, owner, row.session_token, now() - ownerAge],
      );
    }
    if (!sub || !allowed(row.endpoint)) { await remove(); return; }
    let subscription;
    try { subscription = JSON.parse(sub.subscription); } catch { await remove(); return; }
    if (subscription.endpoint !== row.endpoint) { await remove(); return; }
    const ttl = Math.ceil((row.created + row.ttl * 1000 - now()) / 1000);
    if (ttl <= 0) { await remove(); return; }
    let status;
    try {
      status = await send(subscription, row.payload, { subject: row.subject, urgency: row.urgency, ttl });
    } catch {
      status = 0; // Network failure or timeout: retry without logging endpoints/payloads.
    }
    if (status === 404 || status === 410) {
      // Do not remove a new binding if it changed while the request was in flight.
      const identity = row.subscription_table === "subscriptions"
        ? ["member_id = ? AND session_token = ?", [row.member_id, row.session_token]]
        : ["key_hash = ? AND session_token IS ?", [row.key_hash, row.session_token]];
      await db.batch([
        [`DELETE FROM ${row.subscription_table} WHERE endpoint = ? AND subscription = ? AND ${identity[0]} AND EXISTS (SELECT 1 FROM push_outbox WHERE id = ? AND lease_token = ?)`,
          [row.endpoint, sub.subscription, ...identity[1], id, lease]],
        ["DELETE FROM push_outbox WHERE id = ? AND lease_token = ?", [id, lease]],
      ]);
      return;
    }
    if (status === 0 || status === 429 || status >= 500 && status < 600) {
      const delay = RETRY_MS[row.attempts - 1];
      const next = now() + (delay || 0);
      if (delay && next < row.created + row.ttl * 1000) {
        await db.run("UPDATE push_outbox SET status = 'pending', next_at = ?, lease_token = NULL WHERE id = ? AND lease_token = ?", [next, id, lease]);
        return;
      }
    }
    // 2xx: accepted by provider. Other permanent failures, exhausted attempts,
    // and TTLs too short for the next attempt are discarded, without retry storms.
    await remove();
  }

  async function drain(ids) {
    const due = ids
      ? ids.slice(0, PUSH_BATCH_SIZE)
      : (await db.all("SELECT id FROM push_outbox WHERE next_at <= ? ORDER BY next_at, id LIMIT ?", [now(), PUSH_BATCH_SIZE])).map((r) => r.id);
    // Four senders: at most two 10-second waves, within waitUntil's time budget.
    let cursor = 0;
    await Promise.all(Array.from({ length: Math.min(4, due.length) }, async () => {
      while (cursor < due.length) await attempt(due[cursor++]);
    }));
  }

  return { enqueue, drain };
}
