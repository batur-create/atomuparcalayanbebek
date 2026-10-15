// Kütüp API as a Fetch handler. It only uses Web-standard APIs (Request, Response,
// crypto.subtle) and an async database adapter, so the exact same code serves the
// Node build (node:sqlite + SSE) and the Cloudflare Worker / ChatGPT Sites build (D1).
import { SCHEMA_VERSION, migrate } from "./schema.js";
import { generateVapidKeys, sendPush } from "./push.js";
import { createPushOutbox } from "./outbox.js";
import { REQUEST_KINDS, allowedStatuses, statusPush } from "../shared/requests.js";
import { CAPACITY, cellLayout, createPlanner, freeSpots, kindFor } from "../shared/village.js";
import { dayStreak, statsOf } from "./stats.js";
import { BLUEPRINT_CHANCE, BLUEPRINT_STREAKS, BY_ID, CHAIN_GAP, DAILY_BONUS, DEFAULT_MODEL, GRACE, MASTER_PRIZE, MONUMENT_PRIZE, RHYTHMS, RUIN_DAYS, blueprintPool, fits, imeceBonus, minutesOf, modelOf, monumentGoal, refundLater, refundNow, rhythmAt, rhythmEnd, stateOf, streakBonus, teaBreakFor, wageFor } from "../shared/catalog.js";

export const AVATARS = [
  "🪐", "🌱", "🐈", "🌻", "🧋", "🍒", "🎧", "📚", "🦊", "🪼", "🍄", "🦋",
  "🐻", "🐼", "🦄", "🌙", "⭐", "🍓", "🌸", "🐸", "🧸", "🍵", "🎨", "🐝",
  "🦉", "🐧", "🐙", "🦖", "🐢", "🦔", "🐳", "🌵", "🍀", "🍩", "🎸", "🧠",
];
// Only the profile with the founder's badge may wear these.
export const FOUNDER_AVATARS = ["✳", "🕳️", "🌌", "🛸", "🏗️"];
export const COLORS = ["lilac", "mint", "peach", "blue", "pink", "lemon"];
const STATUSES = ["here", "coming", "break", "away"];
const HOUR = 3600000;
const DAY = 24 * HOUR;
const SESSION_AGE = 365 * DAY;
const OWNER_AGE = 30 * DAY;
const TR_OFFSET = 3 * HOUR; // Türkiye has no DST: UTC+3 all year.
const PUSH_HOSTS = [
  "fcm.googleapis.com",
  "push.services.mozilla.com",
  "web.push.apple.com",
  "notify.windows.com",
];
const MESSAGE_LIMIT = 50;
const ACTIVITY_LIMIT = 25;
const PUSH_COOLDOWN = 45 * 60000;
// A real arrival (from away or on the way) always notifies; this only stops
// someone from pinging everyone by flipping away/here in a loop.
const ARRIVAL_REPEAT = 5 * 60000;
const ACHIEVEMENTS = ["black-hole"];
const TRANSFER_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const BEAT_GRACE = 90000; // a build-mode session must have been seen in its last 90 seconds
const WITHERED = "inşaatı çöktü 🧱 Telefon bu sefer kazandı.";
const RUIN_TIME = RUIN_DAYS * 24 * 3600000; // rubble waits this long for the next session to clear it

class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const fail = (message, status) => {
  throw new HttpError(message, status);
};

const encoder = new TextEncoder();
const hex = (bytes) =>
  [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
const randomHex = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));
const randomToken = (n) => {
  let binary = "";
  for (const b of crypto.getRandomValues(new Uint8Array(n))) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const sha = async (value) =>
  hex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
async function sameSecret(a, b) {
  const [x, y] = await Promise.all([sha(a), sha(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}
export const dayStart = (now) =>
  Math.floor((now + TR_OFFSET) / DAY) * DAY - TR_OFFSET;
export const weekStart = (now) => {
  const start = dayStart(now);
  const weekday = (new Date(start + TR_OFFSET).getUTCDay() + 6) % 7; // Monday = 0
  return start - weekday * DAY;
};

function text(value, max, label, min = 0) {
  if (typeof value !== "string") fail(`${label} geçerli değil.`);
  const clean = value.trim().replace(/\s+/g, " ");
  if (clean.length < min || clean.length > max)
    fail(`${label} ${min || 1}–${max} karakter olmalı.`);
  return clean;
}
function profile(body, member = null) {
  const founder = member?.badge === "dev" && FOUNDER_AVATARS.includes(body.avatar);
  return {
    name: text(body.name, 24, "İsim", 2),
    avatar: AVATARS.includes(body.avatar) || founder ? body.avatar : "🪐",
    color: COLORS.includes(body.color) ? body.color : "lilac",
    note: text(body.note || "", 70, "Masa notu"),
  };
}
// Usernames: 3–24 letters, digits, dots or underscores; stored lower-case.
function usernameOf(value) {
  // ı and i count as the same letter, so AYLIN, Aylın and aylin are one name.
  const clean = text(value, 24, "Kullanıcı adı", 3).toLocaleLowerCase("tr").replace(/ı/g, "i");
  if (!/^[a-z0-9çğöşü._]+$/.test(clean))
    fail("Kullanıcı adında sadece harf, rakam, nokta ve alt çizgi olabilir.");
  return clean;
}
function passwordOf(value) {
  if (typeof value !== "string" || value.length < 6) fail("Şifre en az 6 karakter olmalı.");
  if (value.length > 128) fail("Şifre çok uzun.");
  return value;
}
// PBKDF2 through Web Crypto (works in Node and Workers). The iteration count is
// kept moderate for the Workers free-plan CPU budget; logins are rate limited.
const PBKDF2_ROUNDS = 20000;
async function derive(password, salt, rounds) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: rounds }, key, 256));
}
async function hashPassword(password) {
  const salt = randomHex(16);
  return `pbkdf2$${PBKDF2_ROUNDS}$${salt}$${await derive(password, salt, PBKDF2_ROUNDS)}`;
}
async function checkPassword(password, stored) {
  const [kind, rounds, salt, hash] = String(stored || "").split("$");
  if (kind !== "pbkdf2" || !hash) return false;
  return sameSecret(await derive(password, salt, Number(rounds)), hash);
}
const sameName = (a, b) =>
  a.toLocaleLowerCase("tr") === b.toLocaleLowerCase("tr");

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}
async function readBody(request) {
  const max = 16384;
  if (Number(request.headers.get("content-length")) > max) fail("İstek çok büyük.", 413);
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0, body = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        fail("İstek çok büyük.", 413);
      }
      body += decoder.decode(value, { stream: true });
    }
    return body + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}
export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

/**
 * @param {object} options
 * @param {object} options.db       async adapter: all/get/run/batch/read
 * @param {object} [options.config] adminKey, publicOrigin, vapidSubject, pushExtraHosts, testHooks
 * @param {"sse"|"poll"} [options.live]
 * @param {(groupId: string) => void} [options.onChange]
 */
export function createApp({ db, config = {}, live = "poll", onChange = () => {} }) {
  let ready, vapid, lastCleanup = 0;
  const buckets = new Map();
  const extraPushHosts = String(config.pushExtraHosts || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  async function init() {
    await migrate(db);
    // A layout failure must not take the whole app down; unplaced buildings
    // are retried on the next cold start.
    await layoutVillages().catch((error) => console.error("Kütüp village layout:", error));
    // Owner devices that subscribed before migration 8 belong to the current key.
    const owner = await ownerHash();
    if (owner) await db.run("UPDATE owner_subscriptions SET key_hash = ? WHERE key_hash IS NULL", [owner]);
    const stored = await db.get("SELECT value FROM settings WHERE key = 'vapid'");
    if (stored) vapid = JSON.parse(stored.value);
    else {
      const generated = await generateVapidKeys();
      await db.run(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('vapid', ?)",
        [JSON.stringify(generated)],
      );
      // Re-read in case a parallel isolate won the insert.
      vapid = JSON.parse(
        (await db.get("SELECT value FROM settings WHERE key = 'vapid'")).value,
      );
    }
  }
  const ensureReady = () => {
    ready ??= init().catch((error) => {
      ready = undefined;
      throw error;
    });
    return ready;
  };

  function limit(key, max) {
    const now = Date.now();
    if (buckets.size > 2000)
      for (const [k, v] of buckets) if (now - v.start > 120000) buckets.delete(k);
    const bucket = buckets.get(key) || { start: now, count: 0 };
    if (now - bucket.start > 60000) {
      bucket.start = now;
      bucket.count = 0;
    }
    bucket.count++;
    buckets.set(key, bucket);
    if (buckets.size > 4096) buckets.delete(buckets.keys().next().value);
    if (bucket.count > max)
      fail("Biraz hızlı gittik. Bir dakika sonra tekrar dene.", 429);
  }

  // SQLite/D1 serializes this upsert across processes and Worker isolates.
  // Hash the key so IP addresses and usernames are not retained in this table.
  async function authLimit(key, max) {
    const now = Date.now();
    const bucket = await db.get(
      `INSERT INTO auth_limits (key, attempts, expires) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET
         attempts = CASE WHEN expires <= ? THEN 1 ELSE attempts + 1 END,
         expires = CASE WHEN expires <= ? THEN excluded.expires ELSE expires END
       RETURNING attempts`,
      [await sha(key), now + 60000, now, now],
    );
    if (bucket.attempts > max) fail("Biraz hızlı gittik. Bir dakika sonra tekrar dene.", 429);
  }

  // ---------- session ----------
  function readCookie(request, wanted) {
    const header = request.headers.get("cookie") || "";
    for (const part of header.split(";")) {
      const [name, ...rest] = part.trim().split("=");
      if (name === wanted) return rest.join("=");
    }
    return "";
  }
  function cookie(request, name, value, maxAge, path = "/", sameSite = "Lax") {
    const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
    return `${name}=${value}; Path=${path}; Max-Age=${maxAge}; HttpOnly; SameSite=${sameSite}${secure}`;
  }
  const sessionCookie = (request, token, maxAge = 365 * 24 * 3600) =>
    cookie(request, "kutup_session", token, maxAge);
  async function authenticate(request) {
    await ensureReady();
    const token = readCookie(request, "kutup_session");
    if (!token || token.length > 128) return null;
    return db.get(
      `SELECT m.*, g.rev AS group_rev, s.token AS session_token, s.seen AS session_seen, s.created AS session_created
       FROM sessions s JOIN members m ON m.id = s.member_id JOIN groups g ON g.id = m.group_id
       WHERE s.token = ? AND s.created > ?`,
      [await sha(token), Date.now() - SESSION_AGE],
    );
  }
  async function newSession(memberId) {
    const token = randomHex(32);
    const hash = await sha(token);
    return {
      token,
      hash,
      statement: [
        "INSERT INTO sessions (token, member_id, created, seen) VALUES (?, ?, ?, ?)",
        [hash, memberId, Date.now(), Date.now()],
      ],
    };
  }
  const bump = (groupId) => ["UPDATE groups SET rev = rev + 1 WHERE id = ?", [groupId]];
  // The village has its own revision so the map is only refetched when it changed.
  const bumpVillage = (groupId) => ["UPDATE groups SET village_rev = village_rev + 1 WHERE id = ?", [groupId]];
  const systemMessage = (groupId, memberId, value) => [
    "INSERT INTO messages (id, group_id, member_id, text, kind, created) VALUES (?, ?, ?, ?, 'system', ?)",
    [crypto.randomUUID(), groupId, memberId, value, Date.now()],
  ];

  // ---------- state ----------
  const memberColumns =
    "id, name, avatar, color, note, status, location, desk, arrival, since, status_until, focus_end AS focusEnd, focus_minutes AS focusMinutes, focus_strict AS focusStrict, focus_seed AS focusSeed, focus_model AS focusModel, focus_cost AS focusCost, bricks, ruin_until AS ruinUntil, ruin_refund AS ruinRefund, chain, chain_end AS chainEnd, focus_paused_at AS focusPausedAt, focus_pause_used AS focusPauseUsed, board_seen AS boardSeen, updated, badge";
  async function readSnapshot(groupId, now) {
    const [groups, members, focus, messages, reactions, plans, attendees, villages, weekly] =
      await db.read([
        ["SELECT id, name, invite, rev, village_rev AS villageRev, rhythm FROM groups WHERE id = ?", [groupId]],
        [`SELECT ${memberColumns} FROM members WHERE group_id = ? ORDER BY joined`, [groupId]],
        [
          `SELECT f.member_id AS id, SUM(CASE WHEN f.created >= ? THEN f.minutes ELSE 0 END) AS today, SUM(f.minutes) AS week, SUM(f.strict) AS builds
           FROM focus_log f JOIN members m ON m.id = f.member_id
           WHERE m.group_id = ? AND f.created >= ? GROUP BY f.member_id`,
          [dayStart(now), groupId, weekStart(now)],
        ],
        [
          `SELECT * FROM (SELECT id, member_id AS memberId, text, kind, created, to_member AS toMember, reply_to AS replyTo FROM messages WHERE group_id = ? AND kind <> 'system' ORDER BY created DESC LIMIT ${MESSAGE_LIMIT})
           UNION ALL
           SELECT * FROM (SELECT id, member_id AS memberId, text, kind, created, to_member AS toMember, reply_to AS replyTo FROM messages WHERE group_id = ? AND kind = 'system' ORDER BY created DESC LIMIT ${ACTIVITY_LIMIT})`,
          [groupId, groupId],
        ],
        [
          `SELECT r.message_id AS messageId, r.member_id AS memberId FROM reactions r JOIN messages m ON m.id = r.message_id
           WHERE m.group_id = ? AND m.kind <> 'system' AND m.created >= COALESCE((SELECT MIN(created) FROM (SELECT created FROM messages WHERE group_id = ? AND kind <> 'system' ORDER BY created DESC LIMIT ${MESSAGE_LIMIT})), 0)`,
          [groupId, groupId],
        ],
        [
          "SELECT id, member_id AS memberId, starts, note FROM plans WHERE group_id = ? AND starts > ? ORDER BY starts LIMIT 30",
          [groupId, now - 2 * HOUR],
        ],
        [
          "SELECT a.plan_id AS planId, a.member_id AS memberId FROM attendees a JOIN plans p ON p.id = a.plan_id WHERE p.group_id = ? AND p.starts > ?",
          [groupId, now - 2 * HOUR],
        ],
        [
          "SELECT member_id AS id, SUM(buildings) AS n FROM districts WHERE group_id = ? AND member_id IS NOT NULL GROUP BY member_id",
          [groupId],
        ],
        ["SELECT kind, week, member_id AS memberId, minutes FROM weekly WHERE group_id = ? AND week >= ?", [groupId, weekStart(now) - 7 * DAY]],
      ]);
    const group = groups[0];
    if (!group) return null;
    const totals = new Map(focus.map((f) => [f.id, f]));
    const built = new Map(villages.map((v) => [v.id, v.n]));
    const hearts = new Map();
    for (const r of reactions) {
      if (!hearts.has(r.messageId)) hearts.set(r.messageId, []);
      hearts.get(r.messageId).push(r.memberId);
    }
    const going = new Map();
    for (const a of attendees) {
      if (!going.has(a.planId)) going.set(a.planId, []);
      going.get(a.planId).push(a.memberId);
    }
    const lastWeek = weekStart(now) - 7 * DAY;
    const master = weekly.find((w) => w.kind === "master" && w.week === lastWeek);
    const monument = weekly.find((w) => w.kind === "monument" && w.week === weekStart(now));
    return {
      group,
      // Last week's Haftanın Ustası is crowned on the first read of a new week.
      crownDue: !master,
      week: {
        master: master?.memberId ? { memberId: master.memberId, minutes: master.minutes } : null,
        goal: monumentGoal(members.length),
        monument: monument ? { by: monument.memberId, at: monument.week } : null,
      },
      expiredFocus: members.some((m) => m.focusEnd > 0 && m.focusEnd <= now && !m.focusPausedAt),
      expiredPause: members.some((m) => m.focusPausedAt > 0 && now - m.focusPausedAt >= teaBreakFor(m.focusMinutes)),
      expiredPresence: members.some((m) => m.status !== "away" && m.status_until <= now),
      members: members.map(({ status_until, ...m }) => {
        const expired = m.status !== "away" && status_until < now;
        return {
          ...m,
          status: expired ? "away" : m.status,
          since: expired ? 0 : m.since,
          focusToday: totals.get(m.id)?.today || 0,
          focusWeek: totals.get(m.id)?.week || 0,
          buildsWeek: totals.get(m.id)?.builds || 0,
          buildings: built.get(m.id) || 0,
          crown: !!master?.memberId && master.memberId === m.id,
        };
      }),
      messages: messages
        .sort((a, b) => a.created - b.created)
        .map((m) => ({ ...m, reactions: hearts.get(m.id) || [] })),
      plans: plans.map((p) => ({ ...p, attendees: going.get(p.id) || [] })),
    };
  }
  // ---------- village ----------
  // Spots are chosen by shared/village.js and stored for good, so nothing ever
  // moves. Only districts that still have room are loaded.
  async function loadPlanner(groupId) {
    const [districts, buildings] = await db.read([
      ["SELECT id, member_id AS memberId, dx AS q, dy AS r, buildings AS n FROM districts WHERE group_id = ? ORDER BY created, id", [groupId]],
      [
        `SELECT b.district_id AS districtId, b.kind, b.pos_x AS x, b.pos_y AS y FROM districts d JOIN buildings b ON b.district_id = d.id
         WHERE d.group_id = ? AND d.buildings < ${CAPACITY} AND b.pos_x IS NOT NULL`,
        [groupId],
      ],
    ]);
    const full = districts.filter((d) => d.n >= CAPACITY).map((d) => d.id);
    return createPlanner(groupId, districts, buildings, full);
  }
  // New or reclaimed districts, optionally only while `guard` (SQL + args) holds.
  function districtChanges(groupId, changes = [], guard = null) {
    const where = guard ? ` AND ${guard[0]}` : "";
    const extra = guard ? guard[1] : [];
    return changes
      .filter((c) => c?.change)
      .map(({ district: d, change }) =>
        change === "insert"
          ? [
              `INSERT INTO districts (id, group_id, member_id, dx, dy, seed, created) SELECT ?, ?, ?, ?, ?, ?, ? WHERE 1 = 1${where}`,
              [d.id, groupId, d.memberId, d.q, d.r, d.seed, Date.now(), ...extra],
            ]
          : [
              `UPDATE districts SET member_id = ?, created = ? WHERE id = ? AND member_id IS NULL${where}`,
              [d.memberId, Date.now(), d.id, ...extra],
            ],
      );
  }
  const newDistrictId = () => crypto.randomUUID();
  // Writes racing for the same lattice cell fail on UNIQUE(group_id, dx, dy);
  // planning again from a fresh read settles it.
  async function retrying(build, groupId) {
    for (let attempt = 0; ; attempt++) {
      try {
        const before = groupId && await db.get("SELECT rev FROM groups WHERE id = ?", [groupId]);
        const statements = await build();
        return await db.batch([
          ...(before ? [[
            "INSERT OR REPLACE INTO write_guard (id, valid) VALUES (1, CASE WHEN EXISTS (SELECT 1 FROM groups WHERE id = ? AND rev = ?) THEN 1 ELSE 0 END)",
            [groupId, before.rev],
          ]] : []),
          ...statements,
        ]);
      } catch (error) {
        if (error instanceof HttpError || attempt >= 4) throw error;
      }
    }
  }

  // A ledger row; with `openEnd`, written only while that session is still open.
  const ledgerRow = (memberId, delta, reason, ref, note, now, openEnd = null) =>
    openEnd
      ? [
          "INSERT INTO bricks_log (id, member_id, delta, reason, ref, note, created) SELECT ?, id, ?, ?, ?, ?, ? FROM members WHERE id = ? AND focus_end = ?",
          [randomHex(16), delta, reason, ref, note, now, memberId, openEnd],
        ]
      : [
          "INSERT INTO bricks_log (id, member_id, delta, reason, ref, note, created) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [randomHex(16), memberId, delta, reason, ref, note, now],
        ];
  const sessionRef = (memberId, end) => `${memberId}:${end}`;
  const activityRow = (memberId, kind, detail, now) => [
    "INSERT INTO activity (id, member_id, kind, detail, created) VALUES (?, ?, ?, ?, ?)",
    [randomHex(16), memberId, kind, detail, now],
  ];


  // Friends who focused alongside a session for at least half of it (finished
  // sessions from the log, and sessions still under way).
  async function imeceOf(groupId, memberId, start, end) {
    const rows = await db.all(
      `SELECT f.member_id AS id, f.created - f.minutes * 60000 AS a, f.created AS b FROM focus_log f JOIN members m ON m.id = f.member_id
       WHERE m.group_id = ? AND f.member_id <> ? AND f.created > ? AND f.created - f.minutes * 60000 < ?
       UNION ALL
       SELECT id, focus_end - focus_minutes * 60000, focus_end FROM members
       WHERE group_id = ? AND id <> ? AND focus_end > ? AND focus_end - focus_minutes * 60000 < ?`,
      [groupId, memberId, start, end, groupId, memberId, start, end],
    );
    const half = (end - start) / 2;
    return new Set(rows.filter((r) => Math.min(r.b, end) - Math.max(r.a, start) >= half).map((r) => r.id)).size;
  }

  // Haftanın Ustası: the most minutes in the week that just ended earns a
  // crown for the week, +50 tuğla and a blueprint. Every write is guarded by the
  // week's row, so concurrent readers crown exactly once.
  async function crownMaster(groupId, now) {
    const week = weekStart(now) - 7 * DAY;
    const top = await db.get(
      `SELECT f.member_id AS id, SUM(f.minutes) AS minutes FROM focus_log f JOIN members m ON m.id = f.member_id
       WHERE m.group_id = ? AND f.created >= ? AND f.created < ? GROUP BY f.member_id ORDER BY minutes DESC, MIN(f.created) LIMIT 1`,
      [groupId, week, week + 7 * DAY],
    );
    const open = ["NOT EXISTS (SELECT 1 FROM weekly WHERE group_id = ? AND week = ? AND kind = 'master')", [groupId, week]];
    const statements = [];
    if (top) {
      const have = (await db.all("SELECT model FROM unlocks WHERE member_id = ?", [top.id])).map((u) => u.model);
      const pool = blueprintPool(now).filter((item) => !have.includes(item.id));
      const plan = pool.length ? pool[Math.floor((crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) * pool.length)] : null;
      const hours = Math.round((top.minutes / 60) * 10) / 10;
      statements.push(
        [`UPDATE members SET bricks = bricks + ? WHERE id = ? AND ${open[0]}`, [MASTER_PRIZE, top.id, ...open[1]]],
        [
          `INSERT INTO bricks_log (id, member_id, delta, reason, ref, note, created) SELECT ?, id, ?, 'master', NULL, ?, ? FROM members WHERE id = ? AND ${open[0]}`,
          [randomHex(16), MASTER_PRIZE, `👑 Haftanın Ustası: ${hours} saat odak`, now, top.id, ...open[1]],
        ],
        ...(plan
          ? [
              [`INSERT OR IGNORE INTO unlocks (member_id, model, source, created) SELECT id, ?, 'master', ? FROM members WHERE id = ? AND ${open[0]}`, [plan.id, now, top.id, ...open[1]]],
              [
                `INSERT INTO bricks_log (id, member_id, delta, reason, ref, note, created) SELECT ?, id, 0, 'blueprint', NULL, ?, ? FROM members WHERE id = ? AND ${open[0]}`,
                [randomHex(16), `🎁 Ustalık ödülü: ${plan.name} planı`, now, top.id, ...open[1]],
              ],
            ]
          : []),
        [
          `INSERT INTO messages (id, group_id, member_id, text, kind, created) SELECT ?, group_id, id, ?, 'system', ? FROM members WHERE id = ? AND ${open[0]}`,
          [crypto.randomUUID(), `geçen haftanın ustası oldu 👑 ${hours} saat odak! +${MASTER_PRIZE} 🧱${plan ? ` ve ${plan.name} planı` : ""}`, now, top.id, ...open[1]],
        ],
      );
    }
    statements.push(
      ["INSERT OR IGNORE INTO weekly (group_id, week, kind, member_id, minutes, created) VALUES (?, ?, 'master', ?, ?, ?)", [groupId, week, top?.id ?? null, top?.minutes ?? 0, now]],
      bump(groupId),
    );
    await db.batch(statements);
  }
  // The shared monument: once the team's minutes this week reach the goal,
  // everyone gets +50 and the Milli Kütüphane monument on the square grows a stage.
  async function monumentStatements(groupId, now, finishing, memberId) {
    const week = weekStart(now);
    const [done, total, people] = await db.read([
      ["SELECT 1 AS ok FROM weekly WHERE group_id = ? AND week = ? AND kind = 'monument'", [groupId, week]],
      ["SELECT COALESCE(SUM(f.minutes), 0) AS m FROM focus_log f JOIN members m ON m.id = f.member_id WHERE m.group_id = ? AND f.created >= ?", [groupId, week]],
      ["SELECT count(*) AS n FROM members WHERE group_id = ?", [groupId]],
    ]);
    const minutes = total[0].m + finishing;
    if (done.length || minutes < monumentGoal(people[0].n)) return [];
    const open = ["NOT EXISTS (SELECT 1 FROM weekly WHERE group_id = ? AND week = ? AND kind = 'monument')", [groupId, week]];
    return [
      [`UPDATE members SET bricks = bricks + ? WHERE group_id = ? AND ${open[0]}`, [MONUMENT_PRIZE, groupId, ...open[1]]],
      [
        `INSERT INTO bricks_log (id, member_id, delta, reason, ref, note, created) SELECT lower(hex(randomblob(16))), id, ?, 'monument', NULL, '🏛️ Ortak anıt tamamlandı: herkese', ? FROM members WHERE group_id = ? AND ${open[0]}`,
        [MONUMENT_PRIZE, now, groupId, ...open[1]],
      ],
      [
        `INSERT INTO messages (id, group_id, member_id, text, kind, created) SELECT ?, group_id, id, ?, 'system', ? FROM members WHERE id = ? AND ${open[0]}`,
        [crypto.randomUUID(), `haftanın ortak anıtını tamamladı 🏛️ Herkese +${MONUMENT_PRIZE} 🧱`, now, memberId, ...open[1]],
      ],
      ["INSERT OR IGNORE INTO weekly (group_id, week, kind, member_id, minutes, created) VALUES (?, ?, 'monument', ?, ?, ?)", [groupId, week, memberId, minutes, now]],
      bumpVillage(groupId),
    ];
  }

  // Which rare building's blueprint, if any, a finished session turns up.
  async function blueprintFor(s, now) {
    const [have, days] = await db.read([
      ["SELECT model FROM unlocks WHERE member_id = ?", [s.id]],
      [`SELECT DISTINCT (created + ${TR_OFFSET}) / ${DAY} AS d FROM focus_log WHERE member_id = ? ORDER BY d DESC LIMIT 40`, [s.id]],
    ]);
    const left = blueprintPool(now).filter((item) => !have.some((h) => h.model === item.id));
    if (!left.length) return null;
    const random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
    const pick = () => left[Math.floor(random() * left.length)];
    // The day streak this session makes, counted back from its own day.
    const today = Math.floor((s.ends + TR_OFFSET) / DAY);
    const streak = dayStreak(new Set(days.map((r) => r.d).concat(today)), today).count;
    if (!s.earlier && BLUEPRINT_STREAKS.includes(streak)) return { item: pick(), source: "streak", days: streak };
    if (random() < (config.testHooks ? 0 : BLUEPRINT_CHANCE)) return { item: pick(), source: "luck" };
    return null;
  }

  // Completed focus sessions are credited by whoever reads the state next, so
  // minutes count even if the owner closed the tab. Every write is pinned to the
  // exact session (member and end time) and retrying() pins the group revision,
  // so only one transaction can settle a session.
  // A build-mode session only leaves a building if the app was open near the end
  // (the client beats every 20 seconds while visible); otherwise it leaves rubble
  // and half of its materials come back. A finished session pays its wage, the
  // day's first-session bonus, and clears any rubble, paying its remaining 30%.
  async function settleFocus(groupId, now, memberId) {
    const due = `${memberId ? "id = ?" : "group_id = ?"} AND focus_end > 0 AND focus_end <= ? AND focus_paused_at = 0`;
    const args = [memberId || groupId, now];
    const day = `(focus_end + ${TR_OFFSET}) / ${DAY} * ${DAY} - ${TR_OFFSET}`;
    const sessions = await db.all(
      `SELECT id, focus_minutes AS minutes, focus_strict AS strict, focus_beat AS beat, focus_end AS ends, focus_model AS model,
              focus_cost AS cost, ruin_until AS ruinUntil, ruin_refund AS ruinRefund, chain, chain_end AS chainEnd,
              EXISTS (SELECT 1 FROM focus_log f WHERE f.member_id = members.id AND f.created >= ${day} AND f.created < members.focus_end) AS earlier
       FROM members WHERE ${due}`,
      args,
    );
    if (!sessions.length) return [];
    const statements = [];
    const planner = sessions.some((s) => s.strict) ? await loadPlanner(groupId) : null;
    for (const s of sessions) {
      const item = modelOf(s.model, kindFor(s.minutes));
      const ref = sessionRef(s.id, s.ends);
      const finished = s.minutes > 0 && (!s.strict || s.beat >= s.ends - BEAT_GRACE);
      const pay = [];
      if (finished) {
        // A session started within ten minutes of the last one's end continues its streak.
        const start = s.ends - s.minutes * 60000;
        const chain = s.chainEnd > 0 && start - s.chainEnd <= CHAIN_GAP ? s.chain + 1 : 1;
        const wage = wageFor(s.minutes, !!s.strict);
        // Workshops already standing in the member's village help every session.
        const owned = new Set((await db.all("SELECT DISTINCT model FROM buildings WHERE member_id = ?", [s.id])).map((b) => b.model));
        const pct = (v) => `+%${Math.round(v * 100)}`;
        pay.push([wage, "wage", s.strict ? `${item.name}: ${s.minutes} dk inşaat` : `${s.minutes} dk serbest çalışma (yarım maaş)`]);
        const streak = streakBonus(chain) + (chain >= 2 && owned.has("kutuphane") ? 0.05 : 0);
        if (streak) pay.push([Math.round(wage * streak), "streak", `Seri: art arda ${chain}. seans (${pct(streak)}${owned.has("kutuphane") ? ", kütüphanen sayesinde" : ""})`]);
        const friends = await imeceOf(groupId, s.id, start, s.ends);
        const imece = imeceBonus(friends, owned.has("kahve"));
        if (imece) pay.push([Math.round(wage * imece), "imece", `İmece: ${friends} arkadaşınla aynı anda (${pct(imece)})`]);
        if (owned.has("firin")) pay.push([Math.round(wage * 0.05), "effect", "Fırının: maaşa +%5"]);
        if (owned.has("sahaf")) pay.push([3, "effect", "Sahafın: +3 🧱"]);
        s.chainNext = chain;
        if (!s.earlier) pay.push([DAILY_BONUS * (owned.has("degirmen") ? 2 : 1), "bonus", owned.has("degirmen") ? "Günün ilk seansı (değirmenin: iki katı)" : "Günün ilk seansı"]);
        // A blueprint for a rare building: by luck, or for a day streak of 7, 14 or 30.
        const plan = await blueprintFor(s, now);
        if (plan) {
          pay.push([0, "blueprint", `🎁 Nadir plan: ${plan.item.name}${plan.source === "streak" ? ` (${plan.days} günlük seri ödülü)` : ""}`]);
          statements.push([
            "INSERT OR IGNORE INTO unlocks (member_id, model, source, created) SELECT id, ?, ?, ? FROM members WHERE id = ? AND focus_end = ?",
            [plan.item.id, plan.source, now, s.id, s.ends],
          ]);
        }
        if (s.ruinUntil > now && s.ruinRefund > 0) pay.push([s.ruinRefund, "ruin-refund", "Enkaz kaldırıldı: kalan %30"]);
        statements.push(
          [
            "INSERT INTO focus_log (id, member_id, minutes, created, strict) SELECT ?, id, focus_minutes, focus_end, focus_strict FROM members WHERE id = ? AND focus_end = ?",
            [randomHex(16), s.id, s.ends],
          ],
          [
            "UPDATE members SET bricks = bricks + ?, ruin_until = 0, ruin_refund = 0, chain = ?, chain_end = focus_end WHERE id = ? AND focus_end = ?",
            [pay.reduce((t, [delta]) => t + delta, 0), s.chainNext, s.id, s.ends],
          ],
        );
        if (s.strict) {
          const guard = ["EXISTS (SELECT 1 FROM members WHERE id = ? AND focus_end = ?)", [s.id, s.ends]];
          const spot = planner.place(s.id, item.kind, newDistrictId);
          statements.push(
            ...districtChanges(groupId, spot?.changes, guard),
            [
              `INSERT INTO buildings (id, member_id, group_id, kind, model, minutes, seed, created, touched, pos_x, pos_y, facing, district_id)
               SELECT ?, id, group_id, ?, ?, focus_minutes, focus_seed, focus_end, ?, ?, ?, ?, ? FROM members WHERE id = ? AND focus_end = ?`,
              [randomHex(16), item.kind, item.id, now, spot?.x ?? null, spot?.y ?? null, spot?.facing ?? 0, spot?.district.id ?? null, s.id, s.ends],
            ],
            [`UPDATE districts SET buildings = buildings + 1 WHERE id = ? AND ${guard[0]}`, [spot?.district.id ?? null, ...guard[1]]],
            [
              "INSERT INTO messages (id, group_id, member_id, text, kind, created) SELECT ?, group_id, id, ?, 'system', focus_end FROM members WHERE id = ? AND focus_end = ?",
              [crypto.randomUUID(), `${item.done} bitirdi ${item.emoji} ${s.minutes} dakika telefona dokunmadan!`, s.id, s.ends],
            ],
          );
        }
      } else if (s.strict) {
        const back = refundNow(s.cost);
        if (back) pay.push([back, "refund", `${item.name} yarım kaldı: %50 iade`]);
        const spot = planner.place(s.id, item.kind, newDistrictId, { allocate: false });
        statements.push(
          [
            `UPDATE members SET bricks = bricks + ?, ruin_until = focus_end + ${RUIN_TIME}, ruin_kind = ?, ruin_x = ?, ruin_y = ?, ruin_refund = ?, chain = 0, chain_end = 0 WHERE id = ? AND focus_end = ?`,
            [back, item.kind, spot?.x ?? null, spot?.y ?? null, refundLater(s.cost), s.id, s.ends],
          ],
          [
            "INSERT INTO messages (id, group_id, member_id, text, kind, created) SELECT ?, group_id, id, ?, 'system', focus_end FROM members WHERE id = ? AND focus_end = ?",
            [crypto.randomUUID(), WITHERED, s.id, s.ends],
          ],
          [
            "INSERT INTO activity (id, member_id, kind, detail, created) SELECT ?, id, 'collapse', ?, focus_end FROM members WHERE id = ? AND focus_end = ?",
            [randomHex(16), item.id, s.id, s.ends],
          ],
        );
      }
      for (const [delta, reason, note] of pay) statements.push(ledgerRow(s.id, delta, reason, ref, note, now, s.ends));
    }
    if (planner) statements.push(bumpVillage(groupId));
    const finishing = sessions.filter((s) => s.minutes > 0 && (!s.strict || s.beat >= s.ends - BEAT_GRACE));
    // Sessions that ended at the same moment were done together: one board line,
    // rewritten as more of them settle ("A ve B ile birlikte 50 dk çalıştı").
    for (const end of new Set(finishing.map((s) => s.ends))) {
      const here = finishing.filter((s) => s.ends === end).map((s) => s.id);
      const earlier = await db.all("SELECT f.member_id AS id FROM focus_log f JOIN members m ON m.id = f.member_id WHERE m.group_id = ? AND f.created = ?", [groupId, end]);
      const ids = [...new Set([...earlier.map((e) => e.id), ...here])];
      if (ids.length < 2) continue;
      const names = await db.all(`SELECT id, name FROM members WHERE id IN (${ids.map(() => "?").join(",")})`, ids);
      const me = here.at(-1),
        others = names.filter((n) => n.id !== me).map((n) => n.name),
        list = others.length > 1 ? `${others.slice(0, -1).join(", ")} ve ${others.at(-1)}` : others[0];
      const minutes = finishing.find((s) => s.id === me).minutes;
      statements.push([
        "INSERT OR REPLACE INTO messages (id, group_id, member_id, text, kind, created) VALUES (?, ?, ?, ?, 'system', ?)",
        [`together-${groupId}-${end}`, groupId, me, `${list} ile birlikte ${minutes} dk çalıştı 🤝`, end],
      ]);
    }
    if (finishing.length)
      statements.push(...(await monumentStatements(groupId, now, finishing.reduce((t, s) => t + s.minutes, 0), finishing.at(-1).id)));
    statements.push(
      [`UPDATE members SET focus_end = 0, focus_minutes = 0, focus_strict = 0, focus_model = NULL, focus_cost = 0, focus_pause_used = 0 WHERE ${due}`, args],
      bump(groupId),
    );
    return statements;
  }
  // Rubble for a session that was given up or abandoned half-way; `refund` is
  // what clearing it will pay back.
  async function ruinStatement(member, now, refund) {
    const kind = modelOf(member.focus_model, kindFor(member.focus_minutes)).kind;
    const spot = (await loadPlanner(member.group_id)).place(member.id, kind, newDistrictId, { allocate: false });
    return [
      "UPDATE members SET ruin_until = ?, ruin_kind = ?, ruin_x = ?, ruin_y = ?, ruin_refund = ?, chain = 0, chain_end = 0 WHERE id = ?",
      [now + RUIN_TIME, kind, spot?.x ?? null, spot?.y ?? null, refund, member.id],
    ];
  }
  // Start-up: every member gets a district and every older building a spot, in
  // the order they joined / were built. Idempotent; cheap when there is nothing to do.
  async function layoutVillages() {
    for (let attempt = 0; attempt < 3; attempt++) {
      const [members, buildings] = await db.read([
        ["SELECT m.id, m.group_id AS groupId FROM members m WHERE NOT EXISTS (SELECT 1 FROM districts d WHERE d.member_id = m.id) ORDER BY m.joined", []],
        ["SELECT id, member_id AS memberId, group_id AS groupId, kind FROM buildings WHERE pos_x IS NULL ORDER BY created", []],
      ]);
      if (!members.length && !buildings.length) return;
      try {
        for (const groupId of new Set([...members, ...buildings].map((x) => x.groupId))) {
          const planner = await loadPlanner(groupId);
          const statements = [];
          for (const m of members.filter((x) => x.groupId === groupId))
            statements.push(...districtChanges(groupId, [planner.ensure(m.id, newDistrictId)]));
          for (const b of buildings.filter((x) => x.groupId === groupId)) {
            const spot = planner.place(b.memberId, b.kind, newDistrictId);
            if (!spot) continue;
            statements.push(...districtChanges(groupId, spot.changes), [
              "UPDATE buildings SET pos_x = ?, pos_y = ?, facing = ?, district_id = ? WHERE id = ? AND pos_x IS NULL",
              [spot.x, spot.y, spot.facing, spot.district.id, b.id],
            ]);
          }
          await db.batch([
            ...statements,
            ["UPDATE districts SET buildings = (SELECT count(*) FROM buildings b WHERE b.district_id = districts.id) WHERE group_id = ?", [groupId]],
            bumpVillage(groupId),
          ]);
        }
        return;
      } catch (error) {
        if (attempt === 2) throw error;
      }
    }
  }
  async function snapshot(groupId) {
    const now = Date.now();
    let state = await readSnapshot(groupId, now);
    // A tea break that ran out continues the session by itself.
    if (state?.expiredPause) {
      const pause = "CASE WHEN focus_minutes >= 70 THEN 600000 WHEN focus_minutes >= 40 THEN 300000 ELSE 0 END";
      await db.batch([
        [`UPDATE members SET focus_end = focus_end + ${pause}, focus_beat = focus_paused_at + ${pause}, focus_paused_at = 0 WHERE group_id = ? AND focus_paused_at > 0 AND ? - focus_paused_at >= ${pause}`, [groupId, now]],
        bump(groupId),
      ]);
      state = await readSnapshot(groupId, now);
    }
    if (state?.expiredFocus) {
      await retrying(() => settleFocus(groupId, now), groupId);
      state = await readSnapshot(groupId, now);
    }
    if (state?.expiredPresence) {
      await db.batch([
        ["UPDATE groups SET rev = rev + 1 WHERE id = ? AND EXISTS (SELECT 1 FROM members WHERE group_id = ? AND status <> 'away' AND status_until <= ?)", [groupId, groupId, now]],
        ["UPDATE members SET status = 'away', since = 0, status_until = 0 WHERE group_id = ? AND status <> 'away' AND status_until <= ?", [groupId, now]],
      ]);
      state = await readSnapshot(groupId, now);
    }
    if (state?.crownDue) {
      await crownMaster(groupId, now).catch(() => {});
      state = await readSnapshot(groupId, now);
    }
    if (!state) return null;
    delete state.expiredFocus;
    delete state.expiredPause;
    delete state.expiredPresence;
    delete state.crownDue;
    return { ...state, serverTime: now };
  }

  // ---------- push ----------
  const outbox = createPushOutbox({
    db, allowed: pushAllowed, ownerHash, sessionAge: SESSION_AGE, ownerAge: OWNER_AGE,
    send: (subscription, payload, options) => sendPush(subscription, payload, { keys: vapid, ...options }),
  });
  async function drainPushOutbox() {
    await ensureReady();
    await outbox.drain();
  }
  function pushAllowed(endpoint) {
    let url;
    try {
      url = new URL(endpoint);
    } catch {
      return false;
    }
    if (url.username || url.password) return false;
    if (extraPushHosts.includes(url.hostname)) return true; // test receivers
    return (
      url.protocol === "https:" &&
      !url.port &&
      PUSH_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))
    );
  }
  // Everyone in the group except the sender.
  async function notify(ctx, groupId, senderId, message, options) {
    const subs = await db.all(
      "SELECT s.endpoint, s.subscription, s.member_id, s.session_token FROM subscriptions s JOIN members m ON m.id = s.member_id JOIN sessions a ON a.token = s.session_token AND a.member_id = m.id WHERE m.group_id = ? AND m.id <> ? AND a.created > ?",
      [groupId, senderId, Date.now() - SESSION_AGE],
    );
    await deliver(ctx, subs, { tag: `${senderId}-${Date.now()}`, ...message }, "subscriptions", options);
  }
  // One person, on all of their devices.
  async function notifyMember(ctx, memberId, message) {
    const subs = await db.all(
      "SELECT s.endpoint, s.subscription, s.member_id, s.session_token FROM subscriptions s JOIN sessions a ON a.token = s.session_token AND a.member_id = s.member_id WHERE s.member_id = ? AND a.created > ?",
      [memberId, Date.now() - SESSION_AGE],
    );
    await deliver(ctx, subs, { tag: `request-${Date.now()}`, ...message });
  }
  // Batur’s own devices, for new requests.
  async function notifyOwner(ctx, message) {
    const subs = await db.all(
      `SELECT s.endpoint, s.subscription, s.session_token, s.key_hash FROM owner_subscriptions s
       WHERE s.key_hash = ? AND (s.session_token IS NULL OR EXISTS
         (SELECT 1 FROM owner_sessions a WHERE a.token = s.session_token AND a.created > ?))`,
      [await ownerHash(), Date.now() - OWNER_AGE],
    );
    await deliver(ctx, subs, { tag: `owner-${Date.now()}`, ...message }, "owner_subscriptions");
  }
  function validSubscription(sub) {
    if (
      !sub ||
      typeof sub.endpoint !== "string" ||
      !sub.keys ||
      typeof sub.keys.p256dh !== "string" ||
      typeof sub.keys.auth !== "string" ||
      sub.endpoint.length > 2000 ||
      sub.keys.p256dh.length > 256 ||
      sub.keys.auth.length > 128
    )
      fail("Bildirim aboneliği geçerli değil.");
    if (!pushAllowed(sub.endpoint)) fail("Bu bildirim sağlayıcısı desteklenmiyor.");
    return { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } };
  }
  async function deliver(ctx, subs, message, table = "subscriptions", options = {}) {
    if (!subs.length) return;
    const subject = config.vapidSubject || ctx.origin;
    const ids = await outbox.enqueue(subs, message, table, { subject, ...options });
    ctx.waitUntil(outbox.drain(ids).catch(() => console.error("Kütüp push queue: retry deferred.")));
  }

  // ---------- owner ----------
  // Batur signs in once with the key; the device then keeps an HttpOnly owner
  // cookie for 30 days. Sessions remember which key opened them, so changing
  // ADMIN_KEY signs every device out.
  async function ownerHash() {
    if (config.adminKey) return sha(config.adminKey);
    return (await db.get("SELECT value FROM settings WHERE key = 'owner-hash'"))?.value || null;
  }
  async function keyMatches(key, ip) {
    await authLimit(`${ip}:owner`, 20);
    const hash = await ownerHash();
    return !!hash && !!key && sameSecret(await sha(key), hash);
  }
  async function ownerSignedIn(request) {
    const token = readCookie(request, "kutup_owner");
    if (!token || token.length > 128) return false;
    const [session, hash] = await Promise.all([
      db.get("SELECT key_hash FROM owner_sessions WHERE token = ? AND created > ?", [await sha(token), Date.now() - OWNER_AGE]),
      ownerHash(),
    ]);
    return !!session && !!hash && session.key_hash === hash;
  }
  async function requireOwner(request, ip) {
    if (await ownerSignedIn(request)) return;
    const key = request.headers.get("x-owner-key") || "";
    if (!key || !(await keyMatches(key, ip)))
      fail("Bu anahtar Batur’un kutusunu açmıyor.", 401);
  }
  async function ownerSessionCookie(request) {
    const token = randomHex(32);
    await db.run("INSERT INTO owner_sessions (token, key_hash, created) VALUES (?, ?, ?)", [
      await sha(token),
      await ownerHash(),
      Date.now(),
    ]);
    return cookie(request, "kutup_owner", token, 30 * 24 * 3600, "/api/owner", "Strict");
  }
  function deleteMember(member) {
    const id = member.id;
    return [
      ["DELETE FROM reactions WHERE member_id = ? OR message_id IN (SELECT id FROM messages WHERE member_id = ?)", [id, id]],
      ["DELETE FROM attendees WHERE member_id = ? OR plan_id IN (SELECT id FROM plans WHERE member_id = ?)", [id, id]],
      ["DELETE FROM plans WHERE member_id = ?", [id]],
      ["DELETE FROM messages WHERE member_id = ?", [id]],
      ["DELETE FROM focus_log WHERE member_id = ?", [id]],
      [
        "UPDATE buildings SET likes = likes - 1, touched = ? WHERE id IN (SELECT building_id FROM building_likes WHERE member_id = ?)",
        [Date.now(), id],
      ],
      ["DELETE FROM building_likes WHERE member_id = ? OR building_id IN (SELECT id FROM buildings WHERE member_id = ?)", [id, id]],
      ["DELETE FROM buildings WHERE member_id = ?", [id]],
      ["UPDATE districts SET member_id = NULL, buildings = 0 WHERE member_id = ?", [id]],
      ["DELETE FROM subscriptions WHERE member_id = ?", [id]],
      ["DELETE FROM feedback_events WHERE feedback_id IN (SELECT id FROM feedback WHERE member_id = ?)", [id]],
      ["DELETE FROM feedback WHERE member_id = ?", [id]],
      ["DELETE FROM achievements WHERE member_id = ?", [id]],
      ["DELETE FROM bricks_log WHERE member_id = ?", [id]],
      ["DELETE FROM activity WHERE member_id = ?", [id]],
      ["DELETE FROM unlocks WHERE member_id = ?", [id]],
      ["DELETE FROM sessions WHERE member_id = ?", [id]],
      ["DELETE FROM members WHERE id = ?", [id]],
      [
        "DELETE FROM districts WHERE group_id = ? AND NOT EXISTS (SELECT 1 FROM members WHERE group_id = ?)",
        [member.group_id, member.group_id],
      ],
      [
        "DELETE FROM groups WHERE id = ? AND NOT EXISTS (SELECT 1 FROM members WHERE group_id = ?)",
        [member.group_id, member.group_id],
      ],
      bump(member.group_id),
      bumpVillage(member.group_id),
    ];
  }

  // Old chat lines are not useful after a while; keep the database small.
  async function cleanup(now) {
    if (now - lastCleanup < 6 * HOUR) return;
    lastCleanup = now;
    await db.batch([
      ["DELETE FROM reactions WHERE message_id IN (SELECT id FROM messages WHERE created < ?)", [now - 120 * DAY]],
      ["DELETE FROM messages WHERE created < ?", [now - 120 * DAY]],
      ["DELETE FROM attendees WHERE plan_id IN (SELECT id FROM plans WHERE starts < ?)", [now - 30 * DAY]],
      ["DELETE FROM plans WHERE starts < ?", [now - 30 * DAY]],
      ["DELETE FROM sessions WHERE created <= ?", [now - SESSION_AGE]],
      ["DELETE FROM owner_sessions WHERE created <= ?", [now - OWNER_AGE]],
      ["DELETE FROM auth_limits WHERE expires <= ?", [now]],
    ]);
  }

  // ---------- routes ----------
  const routes = [];
  const route = (method, path, handler, auth = true) => {
    const keys = [];
    const pattern = new RegExp(
      `^${path.replace(/:(\w+)/g, (_, key) => (keys.push(key), "([^/]+)"))}$`,
    );
    routes.push({ method, pattern, keys, handler, auth });
  };
  // Every write answers with the fresh state so the client needs no second request.
  const changed = async (member, extra = {}, status = 200) => {
    onChange(member.group_id);
    return json({ ok: true, ...extra, state: await snapshot(member.group_id) }, status);
  };

  route("GET", "/health", async () => {
    await db.get("SELECT 1 AS ok");
    return json({ ok: true });
  }, false);

  route("GET", "/invites/:invite", async ({ params }) => {
    const group = await db.get(
      "SELECT g.name, (SELECT count(*) FROM members WHERE group_id = g.id) AS count FROM groups g WHERE invite = ?",
      [params.invite],
    );
    if (!group) fail("Bu davet bağlantısı bulunamadı.", 404);
    return json(group);
  }, false);

  async function join(request, group, body, extraStatements = []) {
    const p = profile(body);
    const account = usernameOf(body.username);
    const secret = await hashPassword(passwordOf(body.password));
    if (account && (await db.get("SELECT 1 AS hit FROM members WHERE username = ?", [account])))
      fail("Bu kullanıcı adı alınmış. Başka bir tane dene.", 409);
    const id = crypto.randomUUID(),
      now = Date.now(),
      session = await newSession(id);
    await retrying(async () => {
      if (await db.get("SELECT 1 FROM members WHERE username = ?", [account]))
        fail("Bu kullanıcı adı alınmış. Başka bir tane dene.", 409);
      const existing = await db.all("SELECT name FROM members WHERE group_id = ?", [group.id]);
      if (existing.length >= 80) fail("Bu ekip 80 kişiye ulaştı. Yeni bir ekip kurabilirsiniz.");
      if (existing.some((m) => sameName(m.name, p.name)))
        fail("Bu isim ekipte zaten var. Sen misin? Eski cihazında “Benim köşem → Başka cihazda aç” ile kod alıp gir.", 409);
      return [
      ...extraStatements,
      [
        "INSERT INTO members (id, group_id, token, name, avatar, color, note, joined, updated, username, pass_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id, group.id, session.hash, p.name, p.avatar, p.color, p.note, now, now, account, secret],
      ],
      session.statement,
      // A district of their own in the shared village, nearest free one to the square.
      ...districtChanges(group.id, [(await loadPlanner(group.id)).ensure(id, newDistrictId)]),
      systemMessage(group.id, id, "ekibe katıldı. Hoş geldin! ✨"),
      bump(group.id),
      bumpVillage(group.id),
      ];
    }, group.id);
    onChange(group.id);
    return json(
      { memberId: id, username: account, live, pushPublicKey: vapid.publicKey, ...(await snapshot(group.id)) },
      201,
      { "Set-Cookie": sessionCookie(request, session.token) },
    );
  }

  route("POST", "/groups", async ({ request, body }) => {
    profile(body); // validate before creating anything
    const group = {
      id: crypto.randomUUID(),
      name: text(body.groupName || "Bizim tayfa", 40, "Ekip adı", 2),
      invite: randomToken(18),
    };
    return join(request, group, body, [
      [
        "INSERT INTO groups (id, name, invite, rev, created) VALUES (?, ?, ?, 0, ?)",
        [group.id, group.name, group.invite, Date.now()],
      ],
    ]);
  }, false);

  route("POST", "/join", async ({ request, body }) => {
    const group = await db.get("SELECT id FROM groups WHERE invite = ?", [
      text(body.invite, 64, "Davet", 10),
    ]);
    if (!group) fail("Davet bulunamadı. Bağlantıyı arkadaşından yeniden iste.", 404);
    return join(request, group, body);
  }, false);

  // ---------- accounts ----------
  // A signed-in device can set or change the username and password at any time.
  route("POST", "/account", async ({ member, body }) => {
    const username = usernameOf(body.username);
    const taken = await db.get("SELECT 1 AS hit FROM members WHERE username = ? AND id <> ?", [username, member.id]);
    if (taken) fail("Bu kullanıcı adı alınmış. Başka bir tane dene.", 409);
    if (!member.pass_hash && !body.password) fail("Bir şifre belirle.");
    const secret = body.password ? await hashPassword(passwordOf(body.password)) : member.pass_hash;
    await db.run("UPDATE members SET username = ?, pass_hash = ?, reset_hash = NULL, reset_until = 0 WHERE id = ?", [
      username,
      secret,
      member.id,
    ]);
    return json({ ok: true, username });
  });
  async function signIn(request, member) {
    const session = await newSession(member.id);
    const now = Date.now();
    await db.run("INSERT INTO sessions (token, member_id, created, seen) SELECT ?, id, ?, ? FROM members WHERE id = ? AND pass_hash = ?", [session.hash, now, now, member.id, member.pass_hash]);
    if (!(await db.get("SELECT 1 FROM sessions WHERE token = ?", [session.hash])))
      fail("Hesabın değişti. Güncel şifrenle yeniden giriş yap.", 401);
    return json(
      { memberId: member.id, username: member.username, live, pushPublicKey: vapid.publicKey, ...(await snapshot(member.group_id)) },
      200,
      { "Set-Cookie": sessionCookie(request, session.token) },
    );
  }
  route("POST", "/login", async ({ request, body, ip }) => {
    const username = usernameOf(body.username);
    await authLimit(`${ip}:login`, 12);
    await authLimit(`login:${username}`, 8);
    const member = await db.get("SELECT id, group_id, username, pass_hash FROM members WHERE username = ?", [username]);
    if (!member || !(await checkPassword(String(body.password || ""), member.pass_hash)))
      fail("Kullanıcı adı ya da şifre yanlış.", 401);
    return signIn(request, member);
  }, false);
  // Forgot the password: Batur gives out a one-day code; it sets a new password.
  route("POST", "/reset", async ({ request, body, ip }) => {
    await authLimit(`${ip}:reset`, 12);
    const code = text(body.code, 20, "Kod", 8).toUpperCase().replace(/[^A-Z0-9]/g, "");
    const hashed = await sha(code);
    const member = await db.get(
      "SELECT id, group_id, username FROM members WHERE reset_hash = ? AND reset_until > ?",
      [hashed, Date.now()],
    );
    if (!member) fail("Bu kod geçersiz ya da süresi dolmuş. Batur’dan yenisini iste.", 404);
    const username = member.username || usernameOf(body.username);
    if (!member.username && (await db.get("SELECT 1 AS hit FROM members WHERE username = ?", [username])))
      fail("Bu kullanıcı adı alınmış. Başka bir tane dene.", 409);
    const secret = await hashPassword(passwordOf(body.password));
    const session = await newSession(member.id);
    const now = Date.now();
    await db.batch([
      ["INSERT INTO sessions (token, member_id, created, seen) SELECT ?, id, ?, ? FROM members WHERE id = ? AND reset_hash = ? AND reset_until > ?", [session.hash, now, now, member.id, hashed, now]],
      ["DELETE FROM sessions WHERE member_id = ? AND token <> ? AND EXISTS (SELECT 1 FROM sessions WHERE token = ?)", [member.id, session.hash, session.hash]],
      ["UPDATE members SET username = ?, pass_hash = ?, reset_hash = NULL, reset_until = 0, transfer_hash = NULL, transfer_until = 0 WHERE id = ? AND EXISTS (SELECT 1 FROM sessions WHERE token = ?)", [username, secret, member.id, session.hash]],
    ]);
    if (!(await db.get("SELECT 1 FROM sessions WHERE token = ?", [session.hash])))
      fail("Bu kod kullanılmış ya da süresi dolmuş. Batur’dan yenisini iste.", 404);
    onChange(member.group_id, { removed: member.id });
    return json(
      { memberId: member.id, username, live, pushPublicKey: vapid.publicKey, ...(await snapshot(member.group_id)) },
      200, { "Set-Cookie": sessionCookie(request, session.token) },
    );
  }, false);

  // Moving to another device (or from Safari to the iPhone home-screen app, which
  // has its own cookie jar): a short single-use code creates a second session.
  route("POST", "/transfer", async ({ member }) => {
    let code = "";
    for (const b of crypto.getRandomValues(new Uint8Array(8)))
      code += TRANSFER_ALPHABET[b % TRANSFER_ALPHABET.length];
    const until = Date.now() + 15 * 60000;
    await db.run("UPDATE members SET transfer_hash = ?, transfer_until = ? WHERE id = ?", [
      await sha(code),
      until,
      member.id,
    ]);
    return json({ code: `${code.slice(0, 4)}-${code.slice(4)}`, until });
  });

  route("POST", "/transfer/claim", async ({ request, body, ip }) => {
    await authLimit(`${ip}:transfer`, 12);
    const code = text(body.code, 20, "Kod", 8).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length !== 8) fail("Kod 8 karakter olmalı.");
    const hashed = await sha(code);
    const member = await db.get(
      // A code from another device, or a one-day code Batur made in his panel.
      "SELECT id, group_id, name, username, reset_hash FROM members WHERE (transfer_hash = ? AND transfer_until > ?) OR (reset_hash = ? AND reset_until > ?)",
      [hashed, Date.now(), hashed, Date.now()],
    );
    if (!member) fail("Bu kod geçersiz ya da süresi dolmuş. Diğer cihazdan ya da Batur’dan yeni kod al.", 404);
    const session = await newSession(member.id);
    const now = Date.now();
    const recovery = member.reset_hash === hashed;
    await db.batch([
      ["INSERT INTO sessions (token, member_id, created, seen) SELECT ?, id, ?, ? FROM members WHERE id = ? AND ((transfer_hash = ? AND transfer_until > ?) OR (reset_hash = ? AND reset_until > ?))", [session.hash, now, now, member.id, hashed, now, hashed, now]],
      ...(recovery ? [["DELETE FROM sessions WHERE member_id = ? AND token <> ? AND EXISTS (SELECT 1 FROM sessions WHERE token = ?)", [member.id, session.hash, session.hash]]] : []),
      [
        "UPDATE members SET transfer_hash = NULL, transfer_until = 0, reset_hash = NULL, reset_until = 0 WHERE id = ? AND EXISTS (SELECT 1 FROM sessions WHERE token = ?)",
        [member.id, session.hash],
      ],
    ]);
    if (!(await db.get("SELECT 1 FROM sessions WHERE token = ?", [session.hash])))
      fail("Bu kod kullanılmış ya da süresi dolmuş. Yeni kod al.", 404);
    if (recovery) onChange(member.group_id, { removed: member.id });
    return json(
      { memberId: member.id, username: member.username, live, pushPublicKey: vapid.publicKey, ...(await snapshot(member.group_id)) },
      200,
      { "Set-Cookie": sessionCookie(request, session.token) },
    );
  }, false);

  // Opening the app keeps a device signed in: once a month the year starts
  // again, on the server and in the cookie, so only an unused device expires.
  route("GET", "/session", async ({ request, member }) => {
    const now = Date.now();
    const renew = now - member.session_created > 30 * DAY;
    if (renew)
      await db.run("UPDATE sessions SET created = ?, seen = ? WHERE token = ?", [now, now, member.session_token]);
    else if (now - member.session_seen > HOUR)
      await db.run("UPDATE sessions SET seen = ? WHERE token = ?", [now, member.session_token]);
    return json(
      {
        memberId: member.id,
        username: member.username || null,
        live,
        pushPublicKey: vapid.publicKey,
        ...(await snapshot(member.group_id)),
      },
      200,
      renew ? { "Set-Cookie": sessionCookie(request, readCookie(request, "kutup_session")) } : {},
    );
  });

  // Cheap polling: when nothing changed since `rev`, only the revision travels.
  route("GET", "/state", async ({ member, url }) => {
    const known = url.searchParams.get("rev");
    if (known !== null && Number(known) === member.group_rev) {
      const due = await db.get(
        "SELECT 1 AS due FROM members WHERE group_id = ? AND ((focus_end > 0 AND focus_end <= ?) OR (status <> 'away' AND status_until <= ?)) LIMIT 1",
        [member.group_id, Date.now(), Date.now()],
      );
      if (!due) return json({ unchanged: true, rev: member.group_rev });
    }
    return json(await snapshot(member.group_id));
  });

  route("POST", "/profile", async ({ member, body }) => {
    const p = profile(body, member);
    await retrying(async () => {
      const names = await db.all("SELECT name FROM members WHERE group_id = ? AND id <> ?", [
      member.group_id,
      member.id,
    ]);
    if (names.some((x) => sameName(x.name, p.name))) fail("Bu isim ekipte zaten var.", 409);
      return [
      [
        "UPDATE members SET name = ?, avatar = ?, color = ?, note = ?, updated = ? WHERE id = ?",
        [p.name, p.avatar, p.color, p.note, Date.now(), member.id],
      ],
      bump(member.group_id),
      ];
    }, member.group_id);
    return changed(member);
  });

  route("POST", "/presence", async ({ member: m, body, ctx }) => {
    const status = body.status;
    if (!STATUSES.includes(status)) fail("Geçersiz durum.");
    const location = text(body.location || "", 40, "Salon");
    const desk = text(body.desk || "", 16, "Masa");
    const arrival =
      status === "coming" ? text(body.arrival || "Birazdan", 32, "Geliş saati") : null;
    const now = Date.now();
    let push = null;
    await retrying(async () => {
      // A second device may have changed presence after authentication. Re-read
      // within the revision guard so only one request records and sends a ping.
      const current = await db.get("SELECT * FROM members WHERE id = ?", [m.id]);
      if (!current) fail("Oturum kapanmış. Tekrar giriş yap.", 401);
      const previous = current.status_until < now ? "away" : current.status;
      push = null;
      const statements = [
        [
          "UPDATE members SET status = ?, location = ?, desk = ?, arrival = ?, status_until = ?, since = ?, updated = ? WHERE id = ?",
          [
            status,
            location,
            desk,
            arrival,
            status === "away" ? 0 : now + 8 * HOUR,
            status === "away" ? 0 : previous === status ? current.since || now : now,
            now,
            m.id,
          ],
        ],
        bump(m.group_id),
      ];
      if (previous !== status) {
        const phrases = {
          here: `kütübe geldi${location ? ` · ${location}` : ""}. Bir sandalye çek! 🪑`,
          coming: `yola koyuldu · ${arrival} 🛵`,
          break: "molaya çıktı. Kahveye eşlik eden? ☕",
          away: "bugünlük paydos etti. Görüşürüz! 👋",
        };
        statements.push(systemMessage(m.group_id, m.id, phrases[status]));
        // Statistics: a real arrival (not back from a break), and leaving.
        if (status === "here" && previous !== "break") statements.push(activityRow(m.id, "arrive", location || null, now));
        if (status === "away" && (previous === "here" || previous === "break")) statements.push(activityRow(m.id, "leave", null, now));
        // Each kind has its own persistent timer: here -> break -> here cannot
        // erase the arrival cooldown (and vice versa). Coming back from a break
        // waits out the long cooldown; a real arrival only the short one.
        const pushedAt = status === "here" ? current.pushed_here_at : current.pushed_break_at;
        const wait = status === "here" && previous !== "break" ? ARRIVAL_REPEAT : PUSH_COOLDOWN;
        const cooling = now - pushedAt < wait;
        if ((status === "here" || status === "break") && !cooling) {
          const column = status === "here" ? "pushed_here_at" : "pushed_break_at";
          statements.push([
            `UPDATE members SET pushed_kind = ?, pushed_at = ?, ${column} = ? WHERE id = ?`,
            [status, now, now, m.id],
          ]);
          push =
            status === "here"
              ? {
                  title: `${current.name} kütüpte! 📚`,
                  body: `${location || "Milli Kütüphane"}${desk ? ` · Masa ${desk}` : ""}`,
                  url: "/",
                  sticky: true,
                }
              : { title: `${current.name} molada ☕`, body: "Bir kahvelik ara verelim mi?", url: "/?tab=board" };
        }
      }
      return statements;
    }, m.group_id);
    if (push)
      await notify(ctx, m.group_id, m.id, push, { urgency: "high", ttl: status === "here" ? 2 * 3600 : 1800 });
    return changed(m);
  });

  route("POST", "/messages", async ({ member: m, body, ctx }) => {
    const value = text(body.text, 280, "Mesaj", 1);
    const kind = body.kind === "coffee" ? "coffee" : "message";
    const id = crypto.randomUUID();
    // A coffee call may be for one person; a reply may answer one.
    const to = body.to ? await db.get("SELECT id FROM members WHERE id = ? AND group_id = ? AND id <> ?", [String(body.to), m.group_id, m.id]) : null;
    const answered = body.replyTo ? await db.get("SELECT id, member_id AS memberId, kind FROM messages WHERE id = ? AND group_id = ?", [String(body.replyTo), m.group_id]) : null;
    const now = Date.now();
    await db.batch([
      [
        "INSERT INTO messages (id, group_id, member_id, text, kind, created, to_member, reply_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [id, m.group_id, m.id, value, kind, now, to?.id ?? null, answered?.id ?? null],
      ],
      // Writing on the board means having read it.
      ["UPDATE members SET board_seen = ? WHERE id = ? AND board_seen < ?", [now, m.id, now]],
      bump(m.group_id),
    ]);
    if (kind === "coffee" && to)
      await notifyMember(ctx, to.id, { title: `${m.name} seni kahveye çağırıyor ☕`, body: value, url: "/?tab=board", sticky: true, tag: `call-${id}` });
    else if (kind === "coffee") await notify(ctx, m.group_id, m.id, { title: `${m.name}: mola? ☕`, body: value, url: "/?tab=board" });
    // Board messages reach phones too; one notification per board, replaced by the next.
    else if (!answered) await notify(ctx, m.group_id, m.id, { title: `${m.name} panoya yazdı 💬`, body: value, url: "/?tab=board", tag: `board-${m.group_id}` });
    if (answered && answered.memberId !== m.id)
      await notifyMember(ctx, answered.memberId, { title: `${m.name}: ${value}`, body: answered.kind === "coffee" ? "Kahve çağrına cevap" : "Mesajına cevap", url: "/?tab=board" });
    return changed(m, { id }, 201);
  });

  // How far the member has read the board, so friends see who saw what.
  route("POST", "/seen", async ({ member: m, body }) => {
    const at = Math.min(Date.now(), Math.floor(Number(body.at) || 0));
    if (at > (m.board_seen || 0)) await db.batch([["UPDATE members SET board_seen = ? WHERE id = ? AND board_seen < ?", [at, m.id, at]], bump(m.group_id)]);
    return json({ ok: true });
  });

  route("POST", "/messages/:id/react", async ({ member: m, params }) => {
    const message = await db.get(
      "SELECT id FROM messages WHERE id = ? AND group_id = ? AND kind <> 'system'",
      [params.id, m.group_id],
    );
    if (!message) fail("Mesaj bulunamadı.", 404);
    const old = await db.get("SELECT 1 AS hit FROM reactions WHERE message_id = ? AND member_id = ?", [
      message.id,
      m.id,
    ]);
    await db.batch([
      old
        ? ["DELETE FROM reactions WHERE message_id = ? AND member_id = ?", [message.id, m.id]]
        : ["INSERT OR IGNORE INTO reactions (message_id, member_id) VALUES (?, ?)", [message.id, m.id]],
      bump(m.group_id),
    ]);
    return changed(m);
  });

  route("POST", "/plans", async ({ member: m, body, ctx }) => {
    const starts = Number(body.starts),
      note = text(body.note || "", 80, "Plan notu"),
      now = Date.now();
    if (!Number.isFinite(starts) || starts < now - 60000)
      fail("Geçmişe plan yapamıyoruz. İleri bir saat seç. 🙂");
    if (starts > now + 15 * DAY) fail("En fazla iki hafta sonrasına plan yapabilirsin.");
    const upcoming = await db.get(
      "SELECT count(*) AS n FROM plans WHERE member_id = ? AND starts > ?",
      [m.id, now],
    );
    if (upcoming.n >= 10) fail("En fazla 10 gelecek planın olabilir.");
    const id = crypto.randomUUID();
    await db.batch([
      [
        "INSERT INTO plans (id, group_id, member_id, starts, note) VALUES (?, ?, ?, ?, ?)",
        [id, m.group_id, m.id, starts, note],
      ],
      ["INSERT INTO attendees (plan_id, member_id) VALUES (?, ?)", [id, m.id]],
      systemMessage(m.group_id, m.id, "yeni bir kütüp planı yaptı. Takvime göz at! 🗓️"),
      bump(m.group_id),
    ]);
    const when = new Date(starts).toLocaleString("tr-TR", {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Istanbul",
    });
    await notify(ctx, m.group_id, m.id, {
      title: `${m.name} kütüp planı yaptı 🗓️`,
      body: `${note || "Kütüpte buluşalım"} · ${when}. Sen de gelir misin?`,
      url: "/?tab=plans",
    });
    await cleanup(now).catch(() => {});
    return changed(m, { id }, 201);
  });

  route("POST", "/plans/:id/join", async ({ member: m, params }) => {
    const plan = await db.get("SELECT * FROM plans WHERE id = ? AND group_id = ?", [
      params.id,
      m.group_id,
    ]);
    if (!plan) fail("Plan bulunamadı.", 404);
    if (plan.member_id === m.id) fail("Bu planı sen oluşturdun; istersen silebilirsin.");
    if (plan.starts < Date.now() - 2 * HOUR) fail("Bu planın zamanı geçti.");
    const old = await db.get("SELECT 1 AS hit FROM attendees WHERE plan_id = ? AND member_id = ?", [
      plan.id,
      m.id,
    ]);
    await db.batch([
      old
        ? ["DELETE FROM attendees WHERE plan_id = ? AND member_id = ?", [plan.id, m.id]]
        : ["INSERT OR IGNORE INTO attendees (plan_id, member_id) VALUES (?, ?)", [plan.id, m.id]],
      bump(m.group_id),
    ]);
    return changed(m);
  });

  route("DELETE", "/plans/:id", async ({ member: m, params }) => {
    const plan = await db.get("SELECT id FROM plans WHERE id = ? AND member_id = ?", [params.id, m.id]);
    if (!plan) fail("Plan bulunamadı.", 404);
    await db.batch([
      ["DELETE FROM attendees WHERE plan_id = ?", [plan.id]],
      ["DELETE FROM plans WHERE id = ?", [plan.id]],
      bump(m.group_id),
    ]);
    return changed(m);
  });

  route("POST", "/focus", async ({ member: m, body, ctx }) => {
    const action = body.action,
      now = Date.now();
    if (action === "finish") {
      const before = await db.get(
        "SELECT focus_minutes AS minutes, focus_strict AS strict, focus_beat AS beat, focus_end AS ends FROM members WHERE id = ? AND focus_end > 0 AND focus_end <= ?",
        [m.id, now],
      );
      if (before) await retrying(() => settleFocus(m.group_id, now, m.id), m.group_id);
      const withered = !!before?.strict && before.beat < before.ends - BEAT_GRACE;
      return changed(m, { credited: withered ? 0 : before?.minutes || 0, withered });
    }
    // Çay molası: a build-mode session stops for a few minutes, once; the end
    // moves on by the time taken (and the session's ledger rows follow it).
    if (action === "pause" || action === "resume") {
      const current = await db.get("SELECT * FROM members WHERE id = ?", [m.id]);
      if (!current?.focus_strict || current.focus_end <= now) fail("Duraklatılacak bir inşaat yok.");
      if (action === "pause") {
        if (current.focus_paused_at) fail("Zaten moladasın.");
        if (current.focus_pause_used) fail("Bu inşaatın çay molası kullanıldı.");
        if (!teaBreakFor(current.focus_minutes)) fail("25 dakikalık yapılarda çay molası yok.");
        await db.batch([
          ["UPDATE members SET focus_paused_at = ?, focus_pause_used = 1 WHERE id = ? AND focus_end = ?", [now, m.id, current.focus_end]],
          bump(m.group_id),
        ]);
        return changed(m, { paused: true });
      }
      if (!current.focus_paused_at) fail("Şu an mola yok.");
      const taken = Math.min(now - current.focus_paused_at, teaBreakFor(current.focus_minutes)),
        end = current.focus_end + taken;
      await db.batch([
        ["UPDATE bricks_log SET ref = ? WHERE member_id = ? AND ref = ?", [sessionRef(m.id, end), m.id, sessionRef(m.id, current.focus_end)]],
        ["UPDATE members SET focus_end = ?, focus_paused_at = 0, focus_beat = ? WHERE id = ? AND focus_paused_at > 0", [end, now, m.id]],
        bump(m.group_id),
      ]);
      return changed(m, { resumed: true });
    }
    // Build mode: the app reports it is still on screen.
    if (action === "beat") {
      await db.run(
        "UPDATE members SET focus_beat = ? WHERE id = ? AND focus_strict = 1 AND focus_end > ?",
        [now, m.id, now],
      );
      return json({ ok: true });
    }
    // Giving up, or leaving the app in build mode, ends the session without minutes.
    // In the first two minutes it costs nothing; after that the site collapses,
    // half of the materials come back now and 30% when the rubble is cleared.
    if (action === "cancel" || action === "wither") {
      let outcome = { withered: false, refunded: 0, pending: 0 };
      await retrying(async () => {
        const current = await db.get("SELECT * FROM members WHERE id = ?", [m.id]);
        if (!current || current.focus_end !== m.focus_end) fail("Odak oturumu değişti. Sayfayı yenile.", 409);
        const strictRunning = current.focus_strict === 1 && current.focus_end > now;
        const early = strictRunning && !current.focus_pause_used && now - (current.focus_end - current.focus_minutes * 60000) < GRACE;
        const cost = strictRunning ? current.focus_cost || 0 : 0;
        const item = modelOf(current.focus_model, kindFor(current.focus_minutes));
        outcome = {
          withered: strictRunning && !early,
          refunded: early ? cost : refundNow(cost),
          pending: strictRunning && !early ? refundLater(cost) : 0,
        };
        const ref = sessionRef(m.id, current.focus_end);
        return [
          ...(outcome.withered
            ? [await ruinStatement(current, now, outcome.pending), systemMessage(m.group_id, m.id, WITHERED), activityRow(m.id, "collapse", item.id, now), bumpVillage(m.group_id)]
            : []),
          ...(outcome.refunded
            ? [
                ["UPDATE members SET bricks = bricks + ? WHERE id = ?", [outcome.refunded, m.id]],
                ledgerRow(m.id, outcome.refunded, "refund", ref, early ? `${item.name}: ilk 2 dakikada vazgeçildi, tam iade` : `${item.name} yarım kaldı: %50 iade`, now),
              ]
            : []),
          ["UPDATE members SET focus_end = 0, focus_minutes = 0, focus_strict = 0, focus_model = NULL, focus_cost = 0, focus_paused_at = 0, focus_pause_used = 0 WHERE id = ?", [m.id]],
          bump(m.group_id),
        ];
      }, m.group_id);
      return changed(m, outcome);
    }
    if (action !== "start") fail("Geçersiz odak işlemi.");
    if (m.focus_end > now) fail("Önce mevcut odak oturumunu tamamla veya durdur.");
    // Build mode builds something from the catalogue; its materials are paid now.
    // Older apps send only minutes: they get the plain building of that size.
    const strict = body.strict === true;
    let item = null;
    if (strict && body.model != null) {
      item = BY_ID[body.model];
      if (!item) fail("Bu yapı katalogda yok.");
    }
    let minutes = item && body.minutes == null && !body.joinMember ? minutesOf(item) : Number(body.minutes),
      end;
    const rhythm = body.rhythm === true && !body.joinMember ? (await db.get("SELECT rhythm FROM groups WHERE id = ?", [m.group_id]))?.rhythm : null;
    if (rhythm && RHYTHMS[rhythm]) {
      // The team's rhythm: this round ends at its shared break.
      end = rhythmEnd(rhythm, now);
      minutes = Math.floor((end - now) / 60000);
      if (strict && item && !fits(item, minutes)) fail(`Bu tura ${minutes} dk kaldı; ${item.name} sığmaz. Daha küçük bir yapı seç.`);
      if (strict && !item) item = BY_ID.kulube;
    } else if (body.joinMember) {
      const other = await db.get("SELECT focus_end FROM members WHERE id = ? AND group_id = ?", [
        String(body.joinMember),
        m.group_id,
      ]);
      if (!other || other.focus_end < now + 60000)
        fail("Bu odak oturumu sona ermek üzere. Yeni oturum başlat.");
      end = other.focus_end;
      minutes = Math.floor((end - now) / 60000);
      if (strict && item && !fits(item, minutes)) fail("Kalan süre bu yapıya yetmez. Daha küçük bir yapı seç.");
      if (strict && !item) item = BY_ID.kulube;
    } else {
      if (![25, 50, 75].includes(minutes)) fail("25, 50 veya 75 dakika seç.");
      if (item && minutesOf(item) !== minutes) fail(`${item.name} ${minutesOf(item)} dakikalık bir yapı.`);
      if (strict && !item) item = BY_ID[DEFAULT_MODEL[kindFor(minutes)]];
      end = now + minutes * 60000;
    }
    const cost = item?.cost || 0;
    if (item && (item.rare || item.since)) {
      const plans = (await db.all("SELECT model FROM unlocks WHERE member_id = ?", [m.id])).map((u) => u.model);
      const state = stateOf(item, now, plans, m.badge === "dev");
      if (state === "hidden") fail("Bu yapı yalnız Kütüp'ün kurucusuna ait.");
      if (state === "soon") fail(`${item.name} henüz gelmedi; pazartesi katalogda.`);
      if (state === "locked") fail(`${item.name} nadir bir yapı: önce planını bulman lazım. Bitirdiğin her seansta şansın var.`);
    }
    const seed = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
    await retrying(async () => {
      const current = await db.get("SELECT focus_end, bricks FROM members WHERE id = ?", [m.id]);
      if (!current || current.focus_end > now) fail("Önce mevcut odak oturumunu tamamla veya durdur.");
      if (cost > current.bricks) fail(`${item.name} için ${cost - current.bricks} tuğla eksik.`);
      return [
      // An expired, uncredited session is settled before the new one starts.
      ...(await settleFocus(m.group_id, now, m.id)),
      [
        "UPDATE members SET focus_end = ?, focus_minutes = ?, focus_strict = ?, focus_beat = ?, focus_seed = ?, focus_model = ?, focus_cost = ?, bricks = bricks - ? WHERE id = ?",
        [end, minutes, strict ? 1 : 0, now, seed, item?.id ?? null, cost, cost, m.id],
      ],
      ...(cost ? [ledgerRow(m.id, -cost, "cost", sessionRef(m.id, end), `${item.name} malzemesi`, now)] : []),
      bump(m.group_id),
      ];
    }, m.group_id);
    // "Ekibi çağır": everyone gets a tap-to-join for the same end time.
    if (body.invite === true && minutes >= 10) {
      try {
        limit(`${m.id}:invite`, 3);
        await notify(
          ctx,
          m.group_id,
          m.id,
          { title: `${m.name} ${minutes} dk odakta 🎧`, body: "Katıl, aynı anda bitirelim. Her arkadaş +%5 imece.", url: `/?join=${m.id}`, tag: `invite-${m.id}` },
          { urgency: "high", ttl: minutes * 60 },
        );
      } catch {}
    }
    return changed(m);
  });

  // The member's own tuğla: balance, recent movements, what they have built (the
  // collection) and, with ?session=<end>, the receipt of that session.
  route("GET", "/wallet", async ({ member, url }) => {
    const session = Number(url.searchParams.get("session")) || 0;
    const [me, log, built, receipt, unlocks] = await db.read([
      ["SELECT bricks, ruin_until AS ruinUntil, ruin_refund AS ruinRefund FROM members WHERE id = ?", [member.id]],
      ["SELECT delta, reason, ref, note, created FROM bricks_log WHERE member_id = ? ORDER BY created DESC, rowid DESC LIMIT 40", [member.id]],
      ["SELECT COALESCE(model, CASE kind WHEN 'tower' THEN 'kule' WHEN 'house' THEN 'ev' ELSE 'kulube' END) AS model, count(*) AS n FROM buildings WHERE member_id = ? GROUP BY 1", [member.id]],
      ["SELECT delta, reason, note, created FROM bricks_log WHERE member_id = ? AND ref = ? ORDER BY rowid", [member.id, sessionRef(member.id, session)]],
      ["SELECT model FROM unlocks WHERE member_id = ?", [member.id]],
    ]);
    return json({
      bricks: me[0]?.bricks || 0,
      ruin: me[0]?.ruinUntil > Date.now() ? { until: me[0].ruinUntil, refund: me[0].ruinRefund } : null,
      log,
      built: Object.fromEntries(built.map((b) => [b.model, b.n])),
      receipt: session ? receipt : [],
      unlocks: unlocks.map((u) => u.model),
    });
  });

  // The team's rhythm: anyone may set it; the board says who did.
  route("POST", "/rhythm", async ({ member: m, body }) => {
    const rhythm = body.rhythm == null ? null : String(body.rhythm);
    if (rhythm && !RHYTHMS[rhythm]) fail("Bu ritim yok.");
    await db.batch([
      ["UPDATE groups SET rhythm = ?, rhythm_at = 0 WHERE id = ?", [rhythm, m.group_id]],
      systemMessage(m.group_id, m.id, rhythm ? `masa ritmini ${RHYTHMS[rhythm].label} yaptı 🕐 Molalar artık ortak.` : "masa ritmini kapattı."),
      bump(m.group_id),
    ]);
    return changed(m);
  });

  // A member's statistics, for anyone in the same team.
  route("GET", "/stats/:id", async ({ member: m, params }) => {
    const target = await db.get("SELECT id, bricks FROM members WHERE id = ? AND group_id = ?", [params.id, m.group_id]);
    if (!target) fail("Kişi bulunamadı.", 404);
    const id = target.id;
    const [focus, activity, built, ledger, social] = await db.read([
      ["SELECT minutes, created, strict FROM focus_log WHERE member_id = ? ORDER BY created", [id]],
      ["SELECT kind, detail, created FROM activity WHERE member_id = ? ORDER BY created", [id]],
      ["SELECT COALESCE(model, CASE kind WHEN 'tower' THEN 'kule' WHEN 'house' THEN 'ev' ELSE 'kulube' END) AS model, count(*) AS n, SUM(likes) AS likes FROM buildings WHERE member_id = ? GROUP BY 1", [id]],
      ["SELECT reason, SUM(delta) AS total FROM bricks_log WHERE member_id = ? GROUP BY reason", [id]],
      [
        "SELECT (SELECT count(*) FROM messages WHERE member_id = ? AND kind <> 'system') AS messages, (SELECT count(*) FROM plans WHERE member_id = ?) AS plans, (SELECT count(*) FROM attendees WHERE member_id = ?) AS joined",
        [id, id, id],
      ],
    ]);
    return json(statsOf({ focus, activity, built, ledger, social: social[0], bricks: target.bricks, now: Date.now() }));
  });

  route("POST", "/push", async ({ member, body, ctx }) => {
    const clean = validSubscription(body.subscription);
    await db.run(
      "INSERT INTO subscriptions (endpoint, member_id, subscription, session_token) VALUES (?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET member_id = excluded.member_id, subscription = excluded.subscription, session_token = excluded.session_token",
      [clean.endpoint, member.id, JSON.stringify(clean), member.session_token],
    );
    // Switching the bell on ends with a real notification on this device only,
    // so "on" is proven, not assumed. A few per minute at most.
    let test = false;
    if (body.test === true) {
      try {
        limit(`${member.id}:push-test`, 4);
        test = true;
      } catch {}
    }
    if (test)
      await deliver(
        ctx,
        [{ endpoint: clean.endpoint, subscription: JSON.stringify(clean), member_id: member.id, session_token: member.session_token }],
        { title: "Bildirimler açık 🔔", body: "Biri kütübe gelince ilk sen duyacaksın.", url: "/", tag: `test-${Date.now()}` },
        "subscriptions",
        { urgency: "high", ttl: 600 },
      );
    return json({ ok: true, test });
  });

  // Hidden badges, from an allowlist. "black-hole": found Batur's door.
  route("POST", "/achievements", async ({ member, body }) => {
    if (!ACHIEVEMENTS.includes(body.key)) fail("Böyle bir rozet yok.");
    limit(`${member.id}:achievement`, 20);
    const result = await db.run(
      "INSERT OR IGNORE INTO achievements (member_id, key, created) VALUES (?, ?, ?)",
      [member.id, body.key, Date.now()],
    );
    return json({ ok: true, new: result.changes === 1 });
  });

  route("DELETE", "/push", async ({ member, body }) => {
    await db.run("DELETE FROM subscriptions WHERE member_id = ? AND endpoint = ?", [
      member.id,
      String(body.endpoint || ""),
    ]);
    return json({ ok: true });
  });

  route("POST", "/leave", async ({ request, member }) => {
    await db.batch(deleteMember(member));
    onChange(member.group_id, { removed: member.id });
    return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(request, "", 0) });
  });

  // ---------- "Batur’a ilet": requests with a tracked status ----------
  // Items carry their full history so the sender sees a cargo-style tracker.
  async function requests(where, params, { sender = false, limit: max = 30 } = {}) {
    const from = `FROM feedback f JOIN members m ON m.id = f.member_id JOIN groups g ON g.id = m.group_id WHERE ${where}`;
    const [items, events] = await db.read([
      [
        `SELECT f.id, f.kind, f.text, f.status, f.reply, f.created, f.updated${
          sender
            ? ", f.member_id AS memberId, m.name, m.avatar, m.color, m.joined, g.name AS groupName"
            : ""
        } ${from} ORDER BY f.created DESC LIMIT ${max}`,
        params,
      ],
      [
        `SELECT e.feedback_id AS id, e.status, e.created FROM feedback_events e WHERE e.feedback_id IN (SELECT f.id ${from} ORDER BY f.created DESC LIMIT ${max}) ORDER BY e.created`,
        params,
      ],
    ]);
    return items.map((item) => ({
      ...item,
      events: events.filter((e) => e.id === item.id).map(({ status, created }) => ({ status, created })),
    }));
  }
  const ownerRequest = async (id) =>
    (await requests("f.id = ?", [id], { sender: true, limit: 1 }))[0] || null;

  async function updateRequest(ctx, id, { status, reply }, { onlyIfNew = false, attempt = 0 } = {}) {
    const item = await db.get("SELECT id, kind, text, status, reply, member_id, updated FROM feedback WHERE id = ?", [id]);
    if (!item) fail("İstek bulunamadı.", 404);
    if (onlyIfNew && item.status !== "new") return ownerRequest(id);
    const nextStatus = status ?? item.status;
    if (!allowedStatuses(item.kind).includes(nextStatus)) fail("Bu istek için geçersiz bir aşama.");
    const nextReply =
      reply === undefined ? item.reply : text(reply || "", 600, "Not") || null;
    const statusChanged = nextStatus !== item.status;
    const replyChanged = (nextReply || "") !== (item.reply || "");
    if (!statusChanged && !replyChanged) return ownerRequest(id);
    const now = Date.now();
    try {
      await db.batch([
      ["INSERT OR REPLACE INTO write_guard (id, valid) VALUES (1, CASE WHEN EXISTS (SELECT 1 FROM feedback WHERE id = ? AND status = ? AND reply IS ? AND updated = ?) THEN 1 ELSE 0 END)", [id, item.status, item.reply, item.updated]],
      ["UPDATE feedback SET status = ?, reply = ?, updated = ? WHERE id = ?", [nextStatus, nextReply, now, id]],
      ...(statusChanged
        ? [[
            "INSERT INTO feedback_events (id, feedback_id, status, created) VALUES (?, ?, ?, ?)",
            [crypto.randomUUID(), id, nextStatus, now],
          ]]
        : []),
      ]);
    } catch (error) {
      if (attempt < 4 && String(error.message).includes("snapshot_changed"))
        return updateRequest(ctx, id, { status, reply }, { onlyIfNew, attempt: attempt + 1 });
      throw error;
    }
    const preview = item.text.length > 70 ? `${item.text.slice(0, 70)}…` : item.text;
    await notifyMember(ctx, item.member_id, {
      title: statusChanged ? statusPush(item.kind, nextStatus) : "Batur sana bir not yazdı 💬",
      body: replyChanged && nextReply ? `Batur: ${nextReply}` : `“${preview}”`,
      url: "/?tab=feedback",
    });
    return ownerRequest(id);
  }

  route("POST", "/feedback", async ({ member, body, ctx }) => {
    const kind = body.kind;
    if (!REQUEST_KINDS.includes(kind)) fail("Bir mesaj türü seç.");
    const value = text(body.text, 1200, "Mesaj", 5),
      id = crypto.randomUUID(),
      now = Date.now();
    const recent = await db.get(
      "SELECT count(*) AS n FROM feedback WHERE member_id = ? AND created > ?",
      [member.id, now - HOUR],
    );
    if (recent.n >= 8) fail("Mesajların ulaştı! Yeni bir not için biraz bekle.", 429);
    await db.batch([
      [
        "INSERT INTO feedback (id, member_id, kind, text, status, created, updated) VALUES (?, ?, ?, ?, 'new', ?, ?)",
        [id, member.id, kind, value, now, now],
      ],
      [
        "INSERT INTO feedback_events (id, feedback_id, status, created) VALUES (?, ?, 'new', ?)",
        [crypto.randomUUID(), id, now],
      ],
    ]);
    const what = { idea: "bir fikir yolladı 💡", bug: "bir hata bildirdi 🐛", hello: "sana iki çift laf etti 💬" };
    await notifyOwner(ctx, {
      title: `${member.name} ${what[kind]}`,
      body: value.length > 90 ? `${value.slice(0, 90)}…` : value,
      url: "/batur",
    });
    return json({ id, item: (await requests("f.id = ?", [id], { limit: 1 }))[0] }, 201);
  });

  // The shared village in compact rows. Unchanged since `rev` → only the number
  // travels. `bbox=x0,y0,x1,y1` limits buildings to an area for very big villages.
  route("GET", "/village", async ({ member, url }) => {
    const gid = member.group_id,
      now = Date.now();
    const { rev } = await db.get("SELECT village_rev AS rev FROM groups WHERE id = ?", [gid]);
    const known = url.searchParams.get("rev");
    if (known !== null && Number(known) === rev) return json({ unchanged: true, rev });
    // Buildings never change after they are built except for likes, so a client
    // that already has the village only asks for rows touched since `after`
    // (with a little overlap for clock drift between hosts).
    const after = Math.max(0, Number(url.searchParams.get("after")) || 0);
    const since = after ? after - 5000 : -1;
    const box = (url.searchParams.get("bbox") || "").split(",").map(Number);
    const area = box.length === 4 && box.every(Number.isFinite);
    const range = area ? " AND pos_x BETWEEN ? AND ? AND pos_y BETWEEN ? AND ?" : "";
    const rangeArgs = area ? [box[0], box[2], box[1], box[3]] : [];
    const [districts, buildings, liked, ruins, stages] = await db.read([
      ["SELECT id, member_id AS memberId, dx, dy, seed FROM districts WHERE group_id = ? ORDER BY created, id", [gid]],
      [
        `SELECT id, member_id AS memberId, kind, model, seed, pos_x AS x, pos_y AS y, facing, minutes, created, likes, touched
         FROM buildings WHERE group_id = ? AND touched > ? AND pos_x IS NOT NULL${range} ORDER BY touched`,
        [gid, since, ...rangeArgs],
      ],
      [
        "SELECT building_id AS id FROM building_likes WHERE member_id = ? AND building_id IN (SELECT id FROM buildings WHERE group_id = ? AND touched > ?)",
        [member.id, gid, since],
      ],
      ["SELECT id, ruin_kind AS kind, ruin_x AS x, ruin_y AS y, ruin_until AS until FROM members WHERE group_id = ? AND ruin_until > ?", [gid, now]],
      ["SELECT count(*) AS n FROM weekly WHERE group_id = ? AND kind = 'monument'", [gid]],
    ]);
    const mine = new Set(liked.map((l) => l.id));
    return json({
      rev,
      partial: !!after,
      until: buildings.reduce((t, b) => Math.max(t, b.touched), after),
      districts: districts.map((d) => [d.id, d.memberId, d.dx, d.dy, d.seed]),
      buildings: buildings.map((b) => [b.id, b.memberId, b.kind, b.seed, b.x, b.y, b.facing, b.minutes, b.created, b.likes, mine.has(b.id) ? 1 : 0, b.model]),
      ruins: ruins.map((r) => [r.id, r.kind, r.x, r.y, r.until]),
      monument: stages[0]?.n || 0,
    });
  });

  // Moving one's own building to a free plot in one's own districts (never
  // into someone else's, never into a district that is already full).
  async function spotsFor(member, building) {
    const [districts, inside] = await db.read([
      ["SELECT id, dx AS q, dy AS r, buildings AS n FROM districts WHERE group_id = ? AND member_id = ? ORDER BY created, id", [member.group_id, member.id]],
      [
        "SELECT b.id, b.kind, b.pos_x AS x, b.pos_y AS y, b.district_id AS districtId FROM buildings b JOIN districts d ON d.id = b.district_id WHERE d.member_id = ? AND b.pos_x IS NOT NULL",
        [member.id],
      ],
    ]);
    const spots = [];
    for (const d of districts) {
      if (d.id !== building.district_id && d.n >= CAPACITY) continue;
      const others = inside.filter((b) => b.districtId === d.id && b.id !== building.id);
      for (const s of freeSpots(cellLayout(member.group_id, d.q, d.r), others, building.kind, 6))
        if (Math.hypot(s.x - building.pos_x, s.y - building.pos_y) > 1) spots.push({ ...s, district: d.id });
    }
    return spots.slice(0, 10);
  }
  const ownBuilding = async (m, id) => {
    const building = await db.get("SELECT * FROM buildings WHERE id = ? AND member_id = ? AND pos_x IS NOT NULL", [id, m.id]);
    if (!building) fail("Bu bina senin değil ya da bulunamadı.", 404);
    return building;
  };
  route("GET", "/buildings/:id/spots", async ({ member: m, params }) => {
    const spots = await spotsFor(m, await ownBuilding(m, params.id));
    return json({ spots: spots.map((s) => [s.x, s.y, s.facing]) });
  });
  route("POST", "/buildings/:id/move", async ({ member: m, params, body }) => {
    const building = await ownBuilding(m, params.id);
    const spot = (await spotsFor(m, building)).find((s) => Math.abs(s.x - Number(body.x)) < 0.01 && Math.abs(s.y - Number(body.y)) < 0.01);
    if (!spot) fail("Bu arsa artık boş değil. Başka birini seç.");
    await db.batch([
      ["UPDATE buildings SET pos_x = ?, pos_y = ?, facing = ?, district_id = ?, touched = ? WHERE id = ?", [spot.x, spot.y, spot.facing, spot.district, Date.now(), building.id]],
      ...(spot.district !== building.district_id
        ? [
            ["UPDATE districts SET buildings = buildings - 1 WHERE id = ?", [building.district_id]],
            ["UPDATE districts SET buildings = buildings + 1 WHERE id = ?", [spot.district]],
          ]
        : []),
      bumpVillage(m.group_id),
    ]);
    onChange(m.group_id);
    return json({ ok: true, x: spot.x, y: spot.y, facing: spot.facing });
  });

  route("POST", "/buildings/:id/like", async ({ member: m, params }) => {
    const building = await db.get("SELECT id, member_id FROM buildings WHERE id = ? AND group_id = ?", [
      params.id,
      m.group_id,
    ]);
    if (!building) fail("Bina bulunamadı.", 404);
    if (building.member_id === m.id) fail("Kendi binana kalp atamazsın. Arkadaşların atsın! 🙂");
    const old = await db.get("SELECT 1 AS hit FROM building_likes WHERE building_id = ? AND member_id = ?", [
      building.id,
      m.id,
    ]);
    await db.batch([
      old
        ? ["DELETE FROM building_likes WHERE building_id = ? AND member_id = ?", [building.id, m.id]]
        : ["INSERT OR IGNORE INTO building_likes (building_id, member_id, created) VALUES (?, ?, ?)", [building.id, m.id, Date.now()]],
      [
        "UPDATE buildings SET likes = (SELECT count(*) FROM building_likes WHERE building_id = ?), touched = ? WHERE id = ?",
        [building.id, Date.now(), building.id],
      ],
      bumpVillage(m.group_id),
      bump(m.group_id),
    ]);
    const { likes } = await db.get("SELECT likes FROM buildings WHERE id = ?", [building.id]);
    onChange(m.group_id);
    return json({ ok: true, liked: !old, likes });
  });

  route("GET", "/feedback", async ({ member }) =>
    json(await requests("f.member_id = ?", [member.id])),
  );

  // Batur's box. Protected by ADMIN_KEY, or — when the host has no secret set —
  // by a key Batur chooses on the first visit to /batur.
  route("GET", "/owner/status", async ({ request }) =>
    json({
      claimed: !!(await ownerHash()),
      signedIn: await ownerSignedIn(request),
      pushPublicKey: vapid.publicKey,
    }),
  false);

  route("POST", "/owner/push", async ({ request, ip, body }) => {
    await requireOwner(request, ip);
    const clean = validSubscription(body.subscription);
    const ownerToken = readCookie(request, "kutup_owner");
    await db.run(
      "INSERT INTO owner_subscriptions (endpoint, subscription, session_token, key_hash) VALUES (?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET subscription = excluded.subscription, session_token = excluded.session_token, key_hash = excluded.key_hash",
      [clean.endpoint, JSON.stringify(clean), await ownerSignedIn(request) ? await sha(ownerToken) : null, await ownerHash()],
    );
    return json({ ok: true });
  }, false);

  route("DELETE", "/owner/push", async ({ request, ip, body }) => {
    await requireOwner(request, ip);
    await db.run("DELETE FROM owner_subscriptions WHERE endpoint = ?", [String(body.endpoint || "")]);
    return json({ ok: true });
  }, false);

  route("POST", "/owner/claim", async ({ request, body, ip }) => {
    await authLimit(`${ip}:owner`, 20);
    if (config.adminKey) fail("Bu kutunun anahtarı yayın ayarlarında tanımlı.", 409);
    const key = text(body.key, 200, "Anahtar", 12);
    const result = await db.run(
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('owner-hash', ?)",
      [await sha(key)],
    );
    if (!result.changes) fail("Bu kutunun zaten bir sahibi var.", 409);
    return json({ ok: true }, 201, { "Set-Cookie": await ownerSessionCookie(request) });
  }, false);

  route("POST", "/owner/login", async ({ request, body, ip }) => {
    if (!(await keyMatches(typeof body.key === "string" ? body.key : "", ip)))
      fail("Bu anahtar Batur’un kutusunu açmıyor.", 401);
    return json({ ok: true }, 200, { "Set-Cookie": await ownerSessionCookie(request) });
  }, false);

  route("POST", "/owner/logout", async ({ request }) => {
    const token = readCookie(request, "kutup_owner");
    if (token) await db.run("DELETE FROM owner_sessions WHERE token = ?", [await sha(token)]);
    return json({ ok: true }, 200, {
      "Set-Cookie": cookie(request, "kutup_owner", "", 0, "/api/owner", "Strict"),
    });
  }, false);

  route("GET", "/owner/feedback", async ({ request, ip }) => {
    await requireOwner(request, ip);
    return json(await requests("1 = 1", [], { sender: true, limit: 500 }));
  }, false);

  route("POST", "/owner/feedback/:id", async ({ request, ip, params, body, ctx }) => {
    await requireOwner(request, ip);
    return json({ item: await updateRequest(ctx, params.id, body) });
  }, false);

  // Opening a request in the panel counts as "Batur inceledi".
  route("POST", "/owner/feedback/:id/seen", async ({ request, ip, params, ctx }) => {
    await requireOwner(request, ip);
    return json({ item: await updateRequest(ctx, params.id, { status: "seen" }, { onlyIfNew: true }) });
  }, false);

  route("DELETE", "/owner/feedback/:id", async ({ request, ip, params }) => {
    await requireOwner(request, ip);
    await db.batch([
      ["DELETE FROM feedback_events WHERE feedback_id = ?", [params.id]],
      ["DELETE FROM feedback WHERE id = ?", [params.id]],
    ]);
    return json({ ok: true });
  }, false);

  route("GET", "/owner/groups", async ({ request, ip }) => {
    await requireOwner(request, ip);
    const [groups, members] = await db.read([
      ["SELECT id, name, invite, created FROM groups ORDER BY created DESC", []],
      [
        `SELECT m.id, m.group_id AS groupId, m.name, m.avatar, m.color, m.status, m.status_until AS statusUntil, m.joined, m.username, m.badge,
           MAX(s.seen) AS seen, count(s.token) AS devices,
           (SELECT COALESCE(SUM(minutes), 0) FROM focus_log f WHERE f.member_id = m.id) AS minutes,
           (SELECT count(*) FROM buildings b WHERE b.member_id = m.id) AS builds, m.bricks,
           (SELECT count(*) FROM subscriptions p WHERE p.member_id = m.id) AS pushes
         FROM members m LEFT JOIN sessions s ON s.member_id = m.id GROUP BY m.id ORDER BY m.joined`,
        [],
      ],
    ]);
    const now = Date.now();
    return json(
      groups.map((g) => ({
        ...g,
        members: members
          .filter((m) => m.groupId === g.id)
          .map(({ statusUntil, ...m }) => ({ ...m, status: statusUntil < now ? "away" : m.status })),
      })),
    );
  }, false);

  route("POST", "/owner/groups/:id/invite", async ({ request, ip, params }) => {
    await requireOwner(request, ip);
    const invite = randomToken(18);
    const result = await db.run("UPDATE groups SET invite = ?, rev = rev + 1 WHERE id = ?", [
      invite,
      params.id,
    ]);
    if (!result.changes) fail("Ekip bulunamadı.", 404);
    onChange(params.id);
    return json({ invite });
  }, false);

  route("POST", "/owner/members/:id/reset", async ({ request, ip, params }) => {
    await requireOwner(request, ip);
    let code = "";
    for (const b of crypto.getRandomValues(new Uint8Array(8))) code += TRANSFER_ALPHABET[b % TRANSFER_ALPHABET.length];
    const result = await db.run("UPDATE members SET reset_hash = ?, reset_until = ? WHERE id = ?", [
      await sha(code),
      Date.now() + 24 * HOUR,
      params.id,
    ]);
    if (!result.changes) fail("Kişi bulunamadı.", 404);
    const { username } = await db.get("SELECT username FROM members WHERE id = ?", [params.id]);
    return json({ code: `${code.slice(0, 4)}-${code.slice(4)}`, username });
  }, false);

  // Signs a member out on every device (a lost phone, a shared computer).
  route("POST", "/owner/members/:id/signout", async ({ request, ip, params }) => {
    await requireOwner(request, ip);
    const member = await db.get("SELECT id, group_id FROM members WHERE id = ?", [params.id]);
    if (!member) fail("Kişi bulunamadı.", 404);
    const { count } = await db.get("SELECT count(*) AS count FROM sessions WHERE member_id = ?", [member.id]);
    await db.batch([
      ["DELETE FROM sessions WHERE member_id = ?", [member.id]],
      ["DELETE FROM subscriptions WHERE member_id = ?", [member.id]],
      ["UPDATE members SET transfer_hash = NULL, transfer_until = 0, reset_hash = NULL, reset_until = 0 WHERE id = ?", [member.id]],
    ]);
    onChange(member.group_id, { removed: member.id });
    return json({ ok: true, closed: count });
  }, false);

  // "This is me in this team": Batur's own profile wears the dev badge (the
  // orbiting black hole) for everyone. One per team; choosing again moves it.
  route("POST", "/owner/members/:id/badge", async ({ request, ip, params, body }) => {
    await requireOwner(request, ip);
    const member = await db.get("SELECT id, group_id FROM members WHERE id = ?", [params.id]);
    if (!member) fail("Kişi bulunamadı.", 404);
    await db.batch([
      ["UPDATE members SET badge = NULL WHERE group_id = ? AND badge = 'dev'", [member.group_id]],
      ...(body.dev === true ? [["UPDATE members SET badge = 'dev' WHERE id = ?", [member.id]]] : []),
      bump(member.group_id),
    ]);
    onChange(member.group_id);
    return json({ ok: true, dev: body.dev === true });
  }, false);

  // Batur can correct a balance (or hand out a prize); it is logged like any other movement.
  route("POST", "/owner/members/:id/bricks", async ({ request, ip, params, body }) => {
    await requireOwner(request, ip);
    const member = await db.get("SELECT id, group_id, bricks FROM members WHERE id = ?", [params.id]);
    if (!member) fail("Kişi bulunamadı.", 404);
    const delta = Math.trunc(Number(body.delta));
    if (!delta || Math.abs(delta) > 100000) fail("Geçerli bir miktar yaz.");
    if (member.bricks + delta < 0) fail("Bakiye eksiye düşemez.");
    const note = text(body.note || "", 60, "Not");
    await db.batch([
      ["UPDATE members SET bricks = bricks + ? WHERE id = ?", [delta, member.id]],
      ledgerRow(member.id, delta, "grant", null, note || null, Date.now()),
      bump(member.group_id),
    ]);
    onChange(member.group_id);
    return json({ ok: true, bricks: member.bricks + delta });
  }, false);

  // Everything, as JSON: a copy Batur can keep. Secrets that open accounts or
  // sessions directly (cookie hashes, one-time codes, push keys) stay out.
  route("GET", "/owner/backup", async ({ request, ip }) => {
    await requireOwner(request, ip);
    const tables = ["groups", "members", "districts", "buildings", "building_likes", "focus_log", "messages", "reactions", "plans", "attendees", "feedback", "feedback_events", "achievements", "bricks_log", "activity", "unlocks", "weekly"];
    const rows = await db.read(tables.map((t) => [`SELECT * FROM ${t}`, []]));
    const backup = { app: "kutup", created: Date.now(), schema: SCHEMA_VERSION, tables: {} };
    tables.forEach((t, i) => {
      backup.tables[t] = t === "members"
        ? rows[i].map(({ token, transfer_hash, reset_hash, ...m }) => m)
        : rows[i];
    });
    return json(backup, 200, { "Content-Disposition": `attachment; filename="kutup-yedek-${new Date().toISOString().slice(0, 10)}.json"` });
  }, false);

  route("DELETE", "/owner/members/:id", async ({ request, ip, params }) => {
    await requireOwner(request, ip);
    const member = await db.get("SELECT id, group_id FROM members WHERE id = ?", [params.id]);
    if (!member) fail("Kişi bulunamadı.", 404);
    await db.batch(deleteMember(member));
    onChange(member.group_id, { removed: member.id });
    return json({ ok: true });
  }, false);

  if (config.testHooks)
    route("POST", "/__test/expire", async ({ body }) => {
      // Ends the named person's focus session now; `away` pretends their app was
      // closed long before the end (no recent build-mode heartbeat).
      await db.run(
        "UPDATE members SET focus_end = CASE WHEN focus_end > 0 THEN ? ELSE 0 END, focus_beat = CASE WHEN ? THEN 0 ELSE ? END, status_until = 0 WHERE name = ?",
        [Date.now() - 1000, body.away ? 1 : 0, Date.now() - 1000, body.name],
      );
      return json({ ok: true });
    }, false);

  if (config.testHooks)
    route("POST", "/__test/unlock", async ({ body }) => {
      // Hands the named person a blueprint.
      await db.run("INSERT OR IGNORE INTO unlocks (member_id, model, source, created) SELECT id, ?, 'test', ? FROM members WHERE name = ?", [body.model, Date.now(), body.name]);
      return json({ ok: true });
    }, false);

  if (config.testHooks)
    route("POST", "/__test/age", async ({ body }) => {
      // The named person's session started long ago and is still running.
      await db.run("UPDATE members SET focus_end = ?, focus_beat = ? WHERE name = ? AND focus_end > 0", [Date.now() + 5 * 60000, Date.now(), body.name]);
      return json({ ok: true });
    }, false);

  if (config.testHooks)
    route("POST", "/__test/push-outbox", async ({ body }) => {
      // Isolated tests only. Production must never expose queue controls.
      if (body.action === "due")
        await db.run("UPDATE push_outbox SET next_at = 0 WHERE endpoint = ? AND status = 'pending'", [body.endpoint]);
      if (body.action === "expire")
        await db.run("UPDATE push_outbox SET created = 0, next_at = 0 WHERE endpoint = ?", [body.endpoint]);
      if (body.action === "drain") await drainPushOutbox();
      const rows = await db.all("SELECT id, attempts, status, next_at, created, ttl FROM push_outbox WHERE endpoint = ?", [body.endpoint || ""]);
      const subscribed = await db.get("SELECT 1 AS active FROM subscriptions WHERE endpoint = ?", [body.endpoint || ""]);
      return json({ rows, subscribed: !!subscribed });
    }, false);

  // ---------- request entry ----------
  async function handle(request, { ip = "", waitUntil } = {}) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, "") || "/";
    const method = request.method === "HEAD" ? "GET" : request.method;
    const writes = !["GET", "HEAD", "OPTIONS"].includes(method);
    const ctx = {
      origin: config.publicOrigin || url.origin,
      waitUntil: waitUntil || ((promise) => promise.catch(() => {})),
    };
    try {
      if (writes) {
        if (request.headers.get("x-kutup") !== "1")
          fail("İstek doğrulanamadı. Sayfayı yenile.", 403);
        const origin = request.headers.get("origin");
        if (origin) {
          let allowed;
          try {
            allowed = new URL(origin).origin === new URL(config.publicOrigin || url.origin).origin;
          } catch {
            allowed = false;
          }
          if (!allowed) fail("Bu kaynaktan işlem yapılamaz.", 403);
        }
        const joining = /^\/(groups|join|transfer\/claim|owner\/claim)$/.test(path);
        // Test-only clock controls are not real traffic.
        // Test runs (one IP, hundreds of writes) get more room; real traffic does not.
        if (!(config.testHooks && path.startsWith("/__test/"))) limit(`${ip}:${joining ? "join" : "write"}`, joining ? 15 : config.testHooks ? 400 : 120);
      }
      const match = routes
        .map((r) => ({ r, m: r.method === method && path.match(r.pattern) }))
        .find((x) => x.m);
      if (!match) fail("Bu işlem bulunamadı.", 404);
      await ensureReady();
      let body = {};
      if (writes) {
        const raw = await readBody(request);
        if (raw.length > 12000) fail("İstek çok büyük.", 413);
        if (raw) {
          try {
            body = JSON.parse(raw);
          } catch {
            fail("İstek okunamadı.");
          }
          if (!body || typeof body !== "object" || Array.isArray(body)) fail("İstek okunamadı.");
        }
      }
      let params;
      try {
        params = Object.fromEntries(match.r.keys.map((key, i) => [key, decodeURIComponent(match.m[i + 1])]));
      } catch { fail("Bağlantı okunamadı."); }
      let member = null;
      if (match.r.auth) {
        member = await authenticate(request);
        if (!member) fail("Ekibine katılmak için giriş yap.", 401);
      }
      const response = await match.r.handler({ request, url, body, params, member, ip, ctx });
      response.headers.set("Cache-Control", "no-store");
      for (const [k, v] of Object.entries(SECURITY_HEADERS)) response.headers.set(k, v);
      return response;
    } catch (error) {
      if (!error.status) console.error("Kütüp server error:", error);
      return json(
        { error: error.status ? error.message : "Bir şey takıldı. Birazdan tekrar dene." },
        error.status || 500,
        { "Cache-Control": "no-store", ...SECURITY_HEADERS },
      );
    }
  }

  // Every minute: at the start of a shared break and of a new round, tell the
  // people in the library (each boundary is announced once, whoever ticks first).
  async function tick(waitUntil = (p) => p) {
    await ensureReady();
    const now = Date.now();
    const groups = await db.all("SELECT id, rhythm, rhythm_at AS at FROM groups WHERE rhythm IS NOT NULL AND rhythm <> ''");
    for (const g of groups) {
      const r = rhythmAt(g.rhythm, now);
      if (!r) continue;
      const boundary = r.inBreak ? r.workEnd : r.roundStart;
      if (now - boundary > 90000 || g.at >= boundary) continue;
      const won = await db.run("UPDATE groups SET rhythm_at = ? WHERE id = ? AND rhythm_at < ?", [boundary, g.id, boundary]);
      if (!won?.changes) continue;
      const subs = await db.all(
        `SELECT s.endpoint, s.subscription, s.member_id, s.session_token FROM subscriptions s JOIN members m ON m.id = s.member_id
         JOIN sessions a ON a.token = s.session_token AND a.member_id = m.id
         WHERE m.group_id = ? AND m.status IN ('here', 'break') AND m.status_until > ? AND a.created > ?`,
        [g.id, now, now - SESSION_AGE],
      );
      const message = r.inBreak
        ? { title: "☕ Ortak mola!", body: `${r.rest} dakika: kahve, su, biraz hava. İnşaatlar bekliyor.` }
        : { title: "📚 Yeni tur başladı", body: `${r.work} dakika birlikte. Masaya dönüyoruz.` };
      await deliver({ origin: config.publicOrigin || "https://kutup.app", waitUntil }, subs, { tag: `rhythm-${g.id}`, url: "/", ...message }, "subscriptions", { urgency: "high", ttl: 600 });
    }
  }

  return { fetch: handle, authenticate, snapshot, ready: ensureReady, drainPushOutbox, tick, live };
}
