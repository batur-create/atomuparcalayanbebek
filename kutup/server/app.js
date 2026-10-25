import { advanceDiscovery, discoveryStatus, DISCOVERY_STEP, DISCOVERY_GUARANTEE } from "../shared/blueprints.js";
import { createPlans } from "./plans.js";
import { PLAN_COLUMNS, PLAN_ANSWERS, PLAN_VISIBLE_SQL, assemblePlans } from "../shared/plans.js";
// Kütüp API as a Fetch handler. It only uses Web-standard APIs (Request, Response,
// crypto.subtle) and an async database adapter, so the exact same code serves the
// Node build (node:sqlite + SSE) and the Cloudflare Worker / ChatGPT Sites build (D1).
import { SCHEMA_VERSION, migrate } from "./schema.js";
import { generateVapidKeys, sendPush } from "./push.js";
import { createPushOutbox } from "./outbox.js";
import { createRelaxedNotices, relaxedTag } from "./relaxed.js";
import {createBlueprintNotices} from "./blueprintNotices.js";
import { createImece } from "./imece.js";
import { layoutFrom } from "../shared/koy2/draft.js";
import { emptyLayout } from "../shared/koy2/planner.js";
import { activeLayout, convertStatements, moveOptions, moveStatements, placeStatements } from "./villageSpatial.js";
import { COMPATIBILITY_VERSION, contentChange, layoutStatements, readLayout, releaseStatements, v2Village } from "./villageStore.js";
import { activateStatements, checkLayout, checkPart, inventory, rollbackStatements, storeStatements, switchState } from "./villageSwitch.js";
import { BACKUP_TABLES } from "../shared/backup.js";
import { avatarAllowed } from "../shared/avatars.js";
import { REQUEST_KINDS, allowedStatuses, statusPush } from "../shared/requests.js";
import { CAPACITY, cellKey, cellLayout, createPlanner, freeSpots, isMonument, kindFor, monumentCells } from "../shared/village.js";
import { dayStreak, partnersOf, statsOf, storyOf, storyWeek } from "./stats.js";
import { achievementsOf } from "./achievements.js";
import { REPORTED, ACHIEVEMENTS } from "../shared/achievements.js";
import { BEAT_EVERY, BEAT_GAP, BLUEPRINT_STREAKS, weeklyEnd, BUILD_LEAVE, BY_ID, CHAIN_GAP, COUNTDOWN,CATALOG, LEAVE_GRACE, FREE_LEAVE, HONEST_MIN, RESCUE_HOLD, RESCUE_WINDOW, rescueMinutes, seenMinutes, DAILY_BONUS, DEFAULT_MODEL, GRACE, JOIN_LEAD, MASTER_PRIZE, MONUMENT_PRIZE, RHYTHMS, RUIN_DAYS, blueprintPool, fits, imeceBonus, minutesOf, modelOf, monumentGoal, refundLater, refundNow, rhythmAt, rhythmEnd, stateOf, streakBonus, teaBreakFor, wageFor } from "../shared/catalog.js";

export const AVATARS = [
  "🪐", "🌱", "🐈", "🌻", "🧋", "🍒", "🎧", "📚", "🦊", "🪼", "🍄", "🦋",
  "🐻", "🐼", "🦄", "🌙", "⭐", "🍓", "🌸", "🐸", "🧸", "🍵", "🎨", "🐝",
  "🦉", "🐧", "🐙", "🦖", "🐢", "🦔", "🐳", "🌵", "🍀", "🍩", "🎸", "🧠",
];
// Only the profile with the founder's badge may wear these.
export const FOUNDER_AVATARS = ["✳", "🕳️", "🌌", "🛸", "🏗️"];
export const COLORS = ["lilac", "mint", "peach", "blue", "pink", "lemon", "slate", "sand", "olive"];
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
// Çalışma eşi on your statistics: the last 30 days, three shared days at least.
const PARTNER_DAYS = 30;
const PARTNER_MIN = 3;
const BADGE_NEWS_WINDOW = DAY; // a badge earned within a day is news on the Pano
const BADGE_NEWS_MAX = 2; // more at once is the past being counted
const TRANSFER_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const BEAT_GRACE = 90000; // a build-mode session must have been seen in its last 90 seconds
// n40: a build-mode site whose app went quiet has cracked; until RESCUE_HOLD has
// passed it can still be saved, so it is not settled (or collapsed) yet.
// A crack the server saw (focus_cracked_at) can be saved for RESCUE_WINDOW.
const CRACK_HOLD = RESCUE_WINDOW + 40000;
const RESCUABLE = `focus_strict = 1 AND focus_relaxed = 0 AND focus_rescued = 0 AND (CASE WHEN focus_cracked_at > 0 THEN ? - focus_cracked_at <= ${CRACK_HOLD} ELSE focus_beat < focus_end - ${BEAT_GRACE} AND ? - focus_beat <= ${RESCUE_HOLD} END)`;
const rescuable = (m, now) =>
  !!m.focusStrict && !m.focusRelaxed && !m.focusRescued && (m.focusCrackedAt > 0 ? now - m.focusCrackedAt <= CRACK_HOLD : m.focusBeat < m.focusEnd - BEAT_GRACE && now - m.focusBeat <= RESCUE_HOLD);
/** A short, readable device label from the browser's user agent ("iPhone · Safari"). */
export function deviceName(agent) {
  const ua = String(agent || "");
  if (!ua) return null;
  const kind = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? (/Mobile/.test(ua) ? "Android telefon" : "Android tablet") : /Windows/.test(ua) ? "Windows" : /Macintosh|Mac OS X/.test(ua) ? "Mac" : /CrOS/.test(ua) ? "Chromebook" : /Linux/.test(ua) ? "Linux" : "Cihaz";
  // On iPhone and iPad the home screen app drops "Safari" from the agent.
  if ((kind === "iPhone" || kind === "iPad") && !/Safari\//.test(ua)) return `${kind} · ana ekran`;
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /SamsungBrowser/.test(ua) ? "Samsung" : /Firefox\/|FxiOS/.test(ua) ? "Firefox" : /Chrome\/|CriOS/.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : null;
  return browser ? `${kind} · ${browser}` : kind;
}
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
  const dev = member?.badge === "dev";
  const founder = dev && FOUNDER_AVATARS.includes(body.avatar);
  return {
    name: text(body.name, 24, "İsim", 2),
    avatar: AVATARS.includes(body.avatar) || founder || avatarAllowed(body.avatar, dev) ? body.avatar : "🪐",
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
// Checked against when a username does not exist; no password matches it.
const DUMMY_HASH = `pbkdf2$${PBKDF2_ROUNDS}$${"0".repeat(32)}$${"0".repeat(64)}`;
const sameName = (a, b) =>
  a.toLocaleLowerCase("tr") === b.toLocaleLowerCase("tr");

// `headers` is an object, or a list of pairs when a header repeats (Set-Cookie).
function json(data, status = 200, headers = {}) {
  const list = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  for (const [key, value] of Array.isArray(headers) ? headers : Object.entries(headers)) list.append(key, value);
  return new Response(JSON.stringify(data), { status, headers: list });
}
async function readBody(request, max = 16384) {
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
// A whole village layout (about 90 KB for a hundred buildings), owner only.
const BIG_BODY = 2_000_000;
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
  const imece = createImece({ db, fail });
  const blueprintNotices=createBlueprintNotices({db,fail});
  let ready, vapid, lastCleanup = 0;
  // The address the app is really served from, for pushes sent by the timer,
  // which has no request of its own (d23). PUBLIC_ORIGIN wins when it is set.
  let knownOrigin = null;
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
    knownOrigin = (await db.get("SELECT value FROM settings WHERE key = 'origin'"))?.value || null;
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
  async function authLimit(key, max, window = 60000) {
    const now = Date.now();
    const bucket = await db.get(
      `INSERT INTO auth_limits (key, attempts, expires) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET
         attempts = CASE WHEN expires <= ? THEN 1 ELSE attempts + 1 END,
         expires = CASE WHEN expires <= ? THEN excluded.expires ELSE expires END
       RETURNING attempts`,
      [await sha(key), now + window, now, now],
    );
    if (bucket.attempts > max) fail("Biraz hızlı gittik. Bir dakika sonra tekrar dene.", 429);
  }
  // Wrong passwords for one username over an hour (d23). The per-minute limit
  // alone still allows ~11,000 guesses a day; only failures count here, so the
  // owner of the account is never slowed down by their own correct logins.
  const WRONG_PER_HOUR = 30;
  const wrongKey = (username) => `wrong:${username}`;
  async function tooManyWrong(username) {
    const row = await db.get("SELECT attempts FROM auth_limits WHERE key = ? AND expires > ?", [await sha(wrongKey(username)), Date.now()]);
    if ((row?.attempts || 0) >= WRONG_PER_HOUR)
      fail("Bu hesapta çok fazla yanlış şifre denendi. Bir saat sonra tekrar dene ya da Batur’dan kod iste.", 429);
  }
  const countWrong = (username) => authLimit(wrongKey(username), Infinity, HOUR);

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
    return memberFor(readCookie(request, "kutup_session"));
  }
  async function memberFor(token) {
    if (!token || token.length > 128) return null;
    return db.get(
      `SELECT m.*, g.rev AS group_rev, s.token AS session_token, s.seen AS session_seen, s.created AS session_created, s.device AS session_device
       FROM sessions s JOIN members m ON m.id = s.member_id JOIN groups g ON g.id = m.group_id
       WHERE s.token = ? AND s.created > ?`,
      [await sha(token), Date.now() - SESSION_AGE],
    );
  }
  // ---------- accounts on this device (n25) ----------
  // A device keeps every account signed in on it, Instagram style: the active
  // one in kutup_session, the others in kutup_accounts. Both cookies are
  // HttpOnly, so no token reaches page scripts. The server keeps only hashes
  // and checks every token on each read, so an account that was signed out,
  // revoked, recovered elsewhere or expired drops out of the list by itself.
  const MAX_ACCOUNTS = 5;
  const TOKEN = /^[\w-]{16,128}$/;
  const savedTokens = (request) =>
    readCookie(request, "kutup_accounts").split(".").filter((t) => TOKEN.test(t)).slice(0, MAX_ACCOUNTS);
  // The valid sessions this device holds, one per account, the active one first.
  async function deviceAccounts(request) {
    const active = readCookie(request, "kutup_session");
    const tokens = [...new Set([active, ...savedTokens(request)])].filter((t) => TOKEN.test(t));
    if (!tokens.length) return [];
    const hashes = await Promise.all(tokens.map(sha));
    const rows = await db.all(
      `SELECT s.token AS hash, m.id, m.name, m.avatar, m.color, g.name AS team
       FROM sessions s JOIN members m ON m.id = s.member_id JOIN groups g ON g.id = m.group_id
       WHERE s.token IN (${hashes.map(() => "?").join(", ")}) AND s.created > ?`,
      [...hashes, Date.now() - SESSION_AGE],
    );
    const seen = new Set();
    return tokens.flatMap((token, i) => {
      const row = rows.find((r) => r.hash === hashes[i]);
      if (!row || seen.has(row.id)) return [];
      seen.add(row.id);
      return [{ ...row, token, active: token === active }];
    });
  }
  // Set-Cookie pairs: the active session ("" signs this device out of it) and,
  // when there are any or there were before, the other saved accounts.
  function deviceCookies(request, active, saved) {
    const pairs = [["Set-Cookie", active ? sessionCookie(request, active) : sessionCookie(request, "", 0)]];
    const value = saved.filter((t) => t !== active).slice(0, MAX_ACCOUNTS - 1).join(".");
    if (value || readCookie(request, "kutup_accounts"))
      pairs.push(["Set-Cookie", cookie(request, "kutup_accounts", value, value ? 365 * 24 * 3600 : 0, "/api")]);
    return pairs;
  }
  // Before a new session is made on this device: room for one more account.
  // An older session of the same account here is replaced, not counted.
  async function deviceRoom(request, memberId) {
    const held = await deviceAccounts(request);
    const others = held.filter((a) => a.id !== memberId);
    if (others.length >= MAX_ACCOUNTS)
      fail(`Bu cihazda en fazla ${MAX_ACCOUNTS} hesap açık kalabilir. Önce Hesaplarım’dan birinden çık.`, 409);
    return { others, previous: held.find((a) => a.id === memberId) };
  }
  // After it exists: the replaced session hands its push binding over and
  // ends; the cookies keep every other account of the device.
  async function signedInCookies(request, session, room) {
    if (room.previous && room.previous.hash !== session.hash)
      await db.batch([
        ["UPDATE OR IGNORE subscriptions SET session_token = ? WHERE session_token = ?", [session.hash, room.previous.hash]],
        ["DELETE FROM sessions WHERE token = ?", [room.previous.hash]],
      ]);
    return deviceCookies(request, session.token, room.others.map((a) => a.token));
  }
  const sessionData = async (member) => ({
    memberId: member.id,
    username: member.username || null,
    live,
    pushPublicKey: vapid.publicKey,
    ...(await snapshot(member.group_id)),
  });
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
  // One account, many devices (n47). Each browser sends a random id of its own;
  // the device that started a session is the one that watches it. Any other
  // open device only shows it: it cannot report leaving, crack or let it go.
  const deviceOf = (body) => (typeof body.deviceId === "string" && /^[a-z0-9]{12,40}$/.test(body.deviceId) ? body.deviceId : null);
  const watchKey = (memberId) => `focus-watch:${memberId}`;
  const modeKey = (memberId) => `build-mode:${memberId}`;
  const keep = (key, value) => ["INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [key, value]];
  // A device that is not the watcher. Sessions started by an older app have no
  // watcher: there every device keeps the old rules.
  const notWatcher = async (memberId, body) => {
    const watch = (await db.get("SELECT value FROM settings WHERE key = ?", [watchKey(memberId)]))?.value;
    return !!watch && deviceOf(body) !== watch;
  };
  // The village has its own revision so the map is only refetched when it changed.
  const bumpVillage = (groupId) => ["UPDATE groups SET village_rev = village_rev + 1 WHERE id = ?", [groupId]];
  // n14 + anket (17 Eki): a new badge gets one Pano line; hidden ones stay secret.
  const badgeNews = (key) => {
    const badge = ACHIEVEMENTS.find((a) => a.key === key);
    return !badge || badge.hidden ? "gizli bir rozet buldu 🤫" : `“${badge.name}” rozetini kazandı 🏅`;
  };
  const systemMessage = (groupId, memberId, value) => [
    "INSERT INTO messages (id, group_id, member_id, text, kind, created) VALUES (?, ?, ?, ?, 'system', ?)",
    [crypto.randomUUID(), groupId, memberId, value, Date.now()],
  ];

  // ---------- state ----------
  const memberColumns =
    "id, name, avatar, color, note, status, location, desk, arrival, since, status_until, focus_end AS focusEnd, focus_minutes AS focusMinutes, focus_strict AS focusStrict, focus_relaxed AS focusRelaxed, focus_imece AS focusImece, focus_seed AS focusSeed, focus_model AS focusModel, focus_cost AS focusCost, bricks, ruin_until AS ruinUntil, ruin_refund AS ruinRefund, chain, chain_end AS chainEnd, focus_paused_at AS focusPausedAt, focus_pause_used AS focusPauseUsed, focus_beat AS focusBeat, focus_honest AS focusHonest, focus_away AS focusAway, focus_rescued AS focusRescued, focus_left_at AS focusLeftAt, focus_device AS focusDevice, focus_cracked_at AS focusCrackedAt, focus_link AS focusLink, board_seen AS boardSeen, updated, badge, " +
    // n47: which device of the account watches the running session, and the
    // account's screen-off choice for the next build (kept in settings, per member).
    "(SELECT value FROM settings WHERE key = 'focus-watch:' || members.id) AS focusWatch, (SELECT value FROM settings WHERE key = 'build-mode:' || members.id) AS buildMode";
  async function readSnapshot(groupId, now) {
    const [groups, members, focus, messages, reactions, plans, attendees, villages, weekly, planTotals] =
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
        [`SELECT ${PLAN_COLUMNS} FROM plans p WHERE p.group_id=? AND p.cancelled=0 AND ${PLAN_VISIBLE_SQL}>? ORDER BY p.starts,p.id LIMIT 30`,[groupId,now]],
        [`SELECT ${PLAN_ANSWERS} FROM attendees a JOIN plans p ON p.id=a.plan_id WHERE p.id IN(SELECT p.id FROM plans p WHERE p.group_id=? AND p.cancelled=0 AND ${PLAN_VISIBLE_SQL}>? ORDER BY p.starts,p.id LIMIT 30)`,[groupId,now]],
        [
          "SELECT member_id AS id, SUM(buildings) AS n FROM districts WHERE group_id = ? AND member_id IS NOT NULL GROUP BY member_id",
          [groupId],
        ],
        ["SELECT kind, week, member_id AS memberId, minutes FROM weekly WHERE group_id = ? AND week >= ?", [groupId, weekStart(now) - 7 * DAY]],
        [`SELECT count(*) AS n FROM plans p WHERE p.group_id=? AND p.cancelled=0 AND ${PLAN_VISIBLE_SQL}>?`,[groupId,now]],
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
      expiredFocus: members.some((m) => m.focusEnd > 0 && m.focusEnd <= now && !m.focusPausedAt && !rescuable(m, now)),
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
      plans: assemblePlans(plans,attendees),
      plansTotal: planTotals[0].n,
    };
  }
  // ---------- village ----------
  // Spots are chosen by shared/village.js and stored for good, so nothing ever
  // moves. Only districts that still have room are loaded.
  async function loadPlanner(groupId) {
    const [districts, buildings] = await db.read([
      ["SELECT id, member_id AS memberId, dx AS q, dy AS r, buildings AS n FROM districts WHERE group_id = ? ORDER BY created, id", [groupId]],
      [
        `SELECT b.district_id AS districtId, b.kind, b.model, b.pos_x AS x, b.pos_y AS y FROM districts d JOIN buildings b ON b.district_id = d.id
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

  // Stable private draw stream: retries and session splitting use the same draws.
  async function blueprintsFor(s, now) {
    const [have, days, progress] = await db.read([
      ["SELECT model FROM unlocks WHERE member_id = ?", [s.id]],
      [`SELECT DISTINCT (created + ${TR_OFFSET}) / ${DAY} AS d FROM focus_log WHERE member_id = ? ORDER BY d DESC LIMIT 40`, [s.id]],
      ["SELECT carry,dry,draws,seed FROM blueprint_progress WHERE member_id=?",[s.id]],
    ]);
    const previous=progress[0]||{carry:0,dry:0,draws:0,seed:randomHex(24)};
    const left=blueprintPool(now).filter(item=>!have.some(h=>h.model===item.id));
    const awards=[];
    const today=Math.floor((s.ends+TR_OFFSET)/DAY);
    const streak=dayStreak(new Set(days.map(r=>r.d).concat(today)),today).count;
    if(left.length&&!s.earlier&&BLUEPRINT_STREAKS.includes(streak)) {
      const pick=crypto.getRandomValues(new Uint32Array(1))[0]/2**32;
      awards.push({item:left.splice(Math.floor(pick*left.length),1)[0],source:"streak",days:streak});
    }
    const count=left.length?Math.floor((previous.carry+s.credit)/DISCOVERY_STEP):0;
    const rolls=await Promise.all(Array.from({length:count},async(_,i)=>{
      const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(`${previous.seed}:${previous.draws+i}`));
      const v=new DataView(hash);
      return [config.testHooks?1:v.getUint32(0)/2**32,v.getUint32(4)/2**32];
    }));
    const result=advanceDiscovery(previous,s.credit,left,index=>rolls[index-previous.draws]);
    return {state:result.state,awards:[...awards,...result.awards],owned:have.map(h=>h.model)};
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
    const due = `${memberId ? "id = ?" : "group_id = ?"} AND focus_end > 0 AND focus_end <= ? AND focus_paused_at = 0 AND NOT (${RESCUABLE})`;
    const args = [memberId || groupId, now, now, now];
    const day = `(focus_end + ${TR_OFFSET}) / ${DAY} * ${DAY} - ${TR_OFFSET}`;
    const sessions = await db.all(
      `SELECT id, focus_minutes AS minutes, focus_strict AS strict, focus_beat AS beat, focus_end AS ends, focus_model AS model,
              focus_cost AS cost, ruin_until AS ruinUntil, ruin_refund AS ruinRefund, chain, chain_end AS chainEnd,
              focus_honest AS honest, focus_away AS away, focus_rescued AS rescued, focus_cracked_at AS cracked, focus_relaxed AS relaxed,
              focus_imece AS imece, focus_imece_phase AS imecePhase, focus_imece_personal AS imecePersonal, focus_imece_ref AS imeceRef, focus_imece_project AS imeceProject,
              focus_run_id AS runId,
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
      const start = s.ends - s.minutes * 60000;
      // Dürüst dakika (n40): a watched free session counts the minutes it was seen.
      s.credit = !s.strict && s.honest ? seenMinutes({ start, ends: s.ends, beat: s.beat, away: s.away }) : s.minutes;
      const finished = (s.done = s.minutes > 0 && (s.imece ? s.credit === s.minutes : s.strict ? s.relaxed || s.beat >= s.ends - BEAT_GRACE && !s.cracked : !s.honest || s.credit >= HONEST_MIN));
      const pay = [];
      if (finished) {
        // A session started within ten minutes of the last one's end continues its streak.
        const chain = s.chainEnd > 0 && start - s.chainEnd <= CHAIN_GAP ? s.chain + 1 : 1;
        // Rahat inşaat is not watched (the screen may be off), so like a free
        // session it pays half; the building is still yours.
        const wage = wageFor(s.credit, !!s.strict && !s.relaxed);
        // Workshops already standing in the member's village help every session.
        const owned = new Set((await db.all("SELECT DISTINCT model FROM buildings WHERE member_id = ?", [s.id])).map((b) => b.model));
        const pct = (v) => `+%${Math.round(v * 100)}`;
        const lost = s.minutes - s.credit;
        pay.push([wage, "wage", s.imece ? `Bir Taş da Senden: ${s.credit} dk ortak emek (yarım maaş)` : s.strict ? `${item.name}: ${s.minutes} dk inşaat${s.rescued ? " (kurtarıldı)" : ""}` : `${s.credit} dk serbest çalışma (yarım maaş${lost > 0 ? `, uzakta geçen ${lost} dk sayılmadı` : ""})`]);
        const streak = streakBonus(chain) + (chain >= 2 && owned.has("kutuphane") ? 0.05 : 0);
        if (streak) pay.push([Math.round(wage * streak), "streak", `Seri: art arda ${chain}. seans (${pct(streak)}${owned.has("kutuphane") ? ", kütüphanen sayesinde" : ""})`]);
        const friends = await imeceOf(groupId, s.id, start, s.ends);
        const imece = imeceBonus(friends, owned.has("kahve"));
        if (imece) pay.push([Math.round(wage * imece), "imece", `İmece: ${friends} arkadaşınla aynı anda (${pct(imece)})`]);
        if (owned.has("firin")) pay.push([Math.round(wage * 0.05), "effect", "Fırının: maaşa +%5"]);
        if (owned.has("sahaf")) pay.push([3, "effect", "Sahafın: +3 🧱"]);
        s.chainNext = chain;
        if (!s.earlier) pay.push([DAILY_BONUS * (owned.has("degirmen") ? 2 : 1), "bonus", owned.has("degirmen") ? "Günün ilk seansı (değirmenin: iki katı)" : "Günün ilk seansı"]);
        const discovery=await blueprintsFor(s,now);
        for(const plan of discovery.awards) {
          pay.push([0,"blueprint",`🎁 Nadir plan: ${plan.item.name}${plan.source==="streak"?` (${plan.days} günlük seri ödülü)`:plan.source==="guarantee"?` (${DISCOVERY_GUARANTEE} dk emek garantisi)`:""}`]);
          statements.push(["INSERT OR IGNORE INTO unlocks(member_id,model,source,created) SELECT id,?,?,? FROM members WHERE id=? AND focus_end=?",[plan.item.id,plan.source,now,s.id,s.ends]]);
        }
        const d=discovery.state;
        statements.push([`INSERT INTO blueprint_progress(member_id,carry,dry,draws,seed) SELECT id,?,?,?,? FROM members WHERE id=? AND focus_end=?
          ON CONFLICT(member_id) DO UPDATE SET carry=excluded.carry,dry=excluded.dry,draws=excluded.draws,seed=excluded.seed`,[d.carry,d.dry,d.draws,d.seed,s.id,s.ends]]);
        // n48: a build started while the weekly one was open earns its plan, even if it ends after.
        if(s.strict&&item.since&&!discovery.owned.includes(item.id)&&s.ends>=item.since&&s.ends-s.minutes*60000<weeklyEnd(item)) {
          pay.push([0,"blueprint",`📜 ${item.name}: açık dönemde bitirdin, planı kalıcı senin.`]);
          statements.push(["INSERT OR IGNORE INTO unlocks(member_id,model,source,created) SELECT id,?,'weekly',? FROM members WHERE id=? AND focus_end=?",[item.id,now,s.id,s.ends]]);
        }
        if (s.ruinUntil > now && s.ruinRefund > 0) pay.push([s.ruinRefund, "ruin-refund", "Enkaz kaldırıldı: kalan %30"]);
        statements.push(
          [
            "INSERT INTO focus_log (id, member_id, minutes, created, strict, rescued) SELECT ?, id, ?, focus_end, focus_strict, focus_rescued FROM members WHERE id = ? AND focus_end = ?",
            [randomHex(16), s.credit, s.id, s.ends],
          ],
          [
            "UPDATE members SET bricks = bricks + ?, ruin_until = 0, ruin_refund = 0, chain = ?, chain_end = focus_end WHERE id = ? AND focus_end = ?",
            [pay.reduce((t, [delta]) => t + delta, 0), s.chainNext, s.id, s.ends],
          ],
        );
        if (s.strict) {
          const guard = ["EXISTS (SELECT 1 FROM members WHERE id = ? AND focus_end = ?)", [s.id, s.ends]];
          const buildingId = randomHex(16);
          const spot = planner.place(s.id, item.kind, newDistrictId, { model: item.id });
          statements.push(
            ...districtChanges(groupId, spot?.changes, guard),
            [
              `INSERT INTO buildings (id, member_id, group_id, kind, model, minutes, seed, created, touched, pos_x, pos_y, facing, district_id, patched, source_focus_run_id)
               SELECT ?, id, group_id, ?, ?, focus_minutes, focus_seed, focus_end, ?, ?, ?, ?, ?, focus_rescued, focus_run_id FROM members WHERE id = ? AND focus_end = ?`,
              [buildingId, item.kind, item.id, now, spot?.x ?? null, spot?.y ?? null, spot?.facing ?? 0, spot?.district.id ?? null, s.id, s.ends],
            ],
            // n46 C: the run's site becomes this building, once (unique source run).
            ...(s.runId ? [...convertStatements(s.runId, buildingId, guard), ...contentChange(groupId, "site", s.runId, "convert", buildingId, now, guard)] : []),
            ...contentChange(groupId, "building", buildingId, "create", s.runId, now, guard),
            ...(s.relaxed ? [[
              `INSERT INTO build_deliveries (id, member_id, model, kind, seed, minutes, ends, reward, created)
               SELECT ?, id, ?, ?, focus_seed, focus_minutes, focus_end, ?, ? FROM members WHERE id = ? AND focus_end = ?`,
              [buildingId, item.id, item.kind, pay.reduce((total, entry) => total + entry[0], 0), now, s.id, s.ends],
            ]] : []),
            [`UPDATE districts SET buildings = buildings + 1 WHERE id = ? AND ${guard[0]}`, [spot?.district.id ?? null, ...guard[1]]],
            [
              "INSERT INTO messages (id, group_id, member_id, text, kind, created) SELECT ?, group_id, id, ?, 'system', focus_end FROM members WHERE id = ? AND focus_end = ?",
              [crypto.randomUUID(), s.relaxed ? `${item.done} bitirdi ${item.emoji} ${s.minutes} dakika rahat inşaatla.` : s.rescued ? `${item.done} bitirdi ${item.emoji} ${s.minutes} dakika, bir kez kurtararak 🩹` : `${item.done} bitirdi ${item.emoji} ${s.minutes} dakika telefona dokunmadan!`, s.id, s.ends],
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
          ...(s.runId ? [...releaseStatements("site", "?", [s.runId]), ...contentChange(groupId, "site", s.runId, "release", "failed", now, ["EXISTS (SELECT 1 FROM members WHERE id = ? AND focus_end = ?)", [s.id, s.ends]])] : []),
        );
      }
      // n46 C: the stable run gets its one result; its building, if any, is the one above.
      statements.push([
        "UPDATE focus_runs SET status = ?, ends = ?, result = ?, building_id = (SELECT id FROM buildings WHERE source_focus_run_id = focus_runs.id), settled = ? WHERE id = (SELECT focus_run_id FROM members WHERE id = ? AND focus_end = ?) AND status = 'running'",
        [finished ? "completed" : "failed", s.ends, finished ? `${s.credit}` : null, now, s.id, s.ends],
      ]);
      for (const [delta, reason, note] of pay) statements.push(ledgerRow(s.id, delta, reason, ref, note, now, s.ends));
    }
    statements.push(...await imece.settle(sessions, now));
    if (planner) statements.push(bumpVillage(groupId));
    const finishing = sessions.filter((s) => s.done);
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
      const minutes = finishing.find((s) => s.id === me).credit;
      statements.push([
        "INSERT OR REPLACE INTO messages (id, group_id, member_id, text, kind, created) VALUES (?, ?, ?, ?, 'system', ?)",
        [`together-${groupId}-${end}`, groupId, me, `${list} ile birlikte ${minutes} dk çalıştı 🤝`, end],
      ]);
    }
    if (finishing.length)
      statements.push(...(await monumentStatements(groupId, now, finishing.reduce((t, s) => t + s.credit, 0), finishing.at(-1).id)));
    statements.push(
      [`UPDATE members SET focus_end = 0, focus_minutes = 0, focus_strict = 0, focus_relaxed = 0, focus_imece = 0, focus_imece_phase = 0, focus_imece_personal = 0, focus_imece_ref = NULL, focus_imece_project = NULL, focus_model = NULL, focus_cost = 0, focus_pause_used = 0, focus_honest = 0, focus_away = 0, focus_rescued = 0, focus_left_at = 0, focus_device = NULL, focus_cracked_at = 0, focus_run_id = NULL WHERE ${due}`, args],
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
        ["SELECT id, member_id AS memberId, group_id AS groupId, kind, model FROM buildings WHERE pos_x IS NULL ORDER BY created", []],
      ]);
      if (!members.length && !buildings.length) return;
      try {
        for (const groupId of new Set([...members, ...buildings].map((x) => x.groupId))) {
          const planner = await loadPlanner(groupId);
          const statements = [];
          for (const m of members.filter((x) => x.groupId === groupId))
            statements.push(...districtChanges(groupId, [planner.ensure(m.id, newDistrictId)]));
          for (const b of buildings.filter((x) => x.groupId === groupId)) {
            const spot = planner.place(b.memberId, b.kind, newDistrictId, { model: b.model });
            if (!spot) continue;
            statements.push(...districtChanges(groupId, spot.changes), [
              "UPDATE buildings SET pos_x = ?, pos_y = ?, facing = ?, district_id = ?, touched = ? WHERE id = ? AND pos_x IS NULL",
              [spot.x, spot.y, spot.facing, spot.district.id, Date.now(), b.id],
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
        // n46 D: the site's timing changed; its run stays the same.
        [`UPDATE focus_runs SET timing_revision = timing_revision + 1 WHERE id IN (SELECT focus_run_id FROM members WHERE group_id = ? AND focus_paused_at > 0 AND ? - focus_paused_at >= ${pause})`, [groupId, now]],
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
  // A member push knows its account and team, and whether the same endpoint
  // (one phone) also carries other accounts.
  const pushColumns =
    "s.endpoint, s.subscription, s.member_id, s.session_token, g.name AS team, (SELECT count(*) FROM subscriptions x WHERE x.endpoint = s.endpoint) AS accounts";
  // Everyone in the group except the sender.
  async function notify(ctx, groupId, senderId, message, options) {
    const subs = await db.all(
      `SELECT ${pushColumns} FROM subscriptions s JOIN members m ON m.id = s.member_id JOIN groups g ON g.id = m.group_id JOIN sessions a ON a.token = s.session_token AND a.member_id = m.id WHERE m.group_id = ? AND m.id <> ? AND a.created > ?`,
      [groupId, senderId, Date.now() - SESSION_AGE],
    );
    await deliver(ctx, subs, { tag: `${senderId}-${Date.now()}`, ...message }, "subscriptions", options);
  }
  // One person, on all of their devices.
  // n40: `on` picks the member's phones or computers, told apart by the device
  // name their session last reported; a device that never said counts as a phone.
  const PHONE_DEVICE = "(a.device IS NULL OR a.device LIKE 'iPhone%' OR a.device LIKE 'iPad%' OR a.device LIKE 'Android%')";
  async function notifyMember(ctx, memberId, message, options, on) {
    const only = on === "phone" ? ` AND ${PHONE_DEVICE}` : on === "desk" ? ` AND NOT ${PHONE_DEVICE}` : "";
    const subs = await db.all(
      `SELECT ${pushColumns} FROM subscriptions s JOIN members m ON m.id = s.member_id JOIN groups g ON g.id = m.group_id JOIN sessions a ON a.token = s.session_token AND a.member_id = s.member_id WHERE s.member_id = ? AND a.created > ?${only}`,
      [memberId, Date.now() - SESSION_AGE],
    );
    await deliver(ctx, subs, { tag: `request-${Date.now()}`, ...message }, "subscriptions", options);
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
    if (!subs.length && !options.dedupe) return;
    const subject = config.vapidSubject || ctx.origin;
    // n25: a tap opens the account the push is for; on a phone with several
    // accounts the title starts with the team's name.
    if (table === "subscriptions")
      subs = subs.map((s) => ({
        ...s,
        extra: { account: s.member_id, ...(s.accounts > 1 && s.team ? { team: s.team, title: `${s.team} · ${message.title}` } : {}) },
      }));
    const ids = await outbox.enqueue(subs, message, table, { subject, ...options });
    if (!options.defer) ctx.waitUntil(outbox.drain(ids).catch(() => console.error("Kütüp push queue: retry deferred.")));
  }

  const relaxedNotices = createRelaxedNotices({ db, notifyMember });
  const meetups=createPlans({db,retrying,bump,fail,text,notify,notifyMember,systemMessage,authLimit,sessionAge:SESSION_AGE});

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
      ...imece.release(member.id,member.focus_imece_project),
      ["DELETE FROM reactions WHERE member_id = ? OR message_id IN (SELECT id FROM messages WHERE member_id = ?)", [id, id]],
      ["DELETE FROM attendees WHERE member_id = ? OR plan_id IN (SELECT id FROM plans WHERE member_id = ?)", [id, id]],
      ["DELETE FROM plan_skips WHERE member_id = ? OR plan_id IN (SELECT id FROM plans WHERE member_id = ?)", [id, id]],
      ["DELETE FROM plans WHERE member_id = ?", [id]],
      ["DELETE FROM messages WHERE member_id = ?", [id]],
      ["DELETE FROM focus_log WHERE member_id = ?", [id]],
      [
        "UPDATE buildings SET likes = likes - 1, touched = ? WHERE id IN (SELECT building_id FROM building_likes WHERE member_id = ?)",
        [Date.now(), id],
      ],
      ["DELETE FROM building_likes WHERE member_id = ? OR building_id IN (SELECT id FROM buildings WHERE member_id = ?)", [id, id]],
      // n46 C: their buildings and any site leave every layout; the change is logged.
      ...releaseStatements("building", "SELECT id FROM buildings WHERE member_id = ?", [id]),
      ...releaseStatements("site", "SELECT id FROM focus_runs WHERE member_id = ?", [id]),
      ...contentChange(member.group_id, "member", id, "delete", null, Date.now()),
      ["DELETE FROM request_receipts WHERE actor = ?", [id]],
      ["DELETE FROM focus_runs WHERE member_id = ?", [id]],
      ["DELETE FROM buildings WHERE member_id = ?", [id]],
      ["UPDATE districts SET member_id = NULL, buildings = 0 WHERE member_id = ?", [id]],
      ["DELETE FROM subscriptions WHERE member_id = ?", [id]],
      ["DELETE FROM feedback_events WHERE feedback_id IN (SELECT id FROM feedback WHERE member_id = ?)", [id]],
      ["DELETE FROM feedback WHERE member_id = ?", [id]],
      ["DELETE FROM achievements WHERE member_id = ?", [id]],
      ["DELETE FROM bricks_log WHERE member_id = ?", [id]],
      ["DELETE FROM activity WHERE member_id = ?", [id]],
      ["DELETE FROM unlocks WHERE member_id = ?", [id]],
      ["DELETE FROM settings WHERE key=?",[blueprintNotices.key(id)]],
      ["DELETE FROM settings WHERE key IN (?, ?)", [watchKey(id), modeKey(id)]],
      ["DELETE FROM sessions WHERE member_id = ?", [id]],
      ["DELETE FROM members WHERE id = ?", [id]],
      [
        "DELETE FROM districts WHERE group_id = ? AND NOT EXISTS (SELECT 1 FROM members WHERE group_id = ?)",
        [member.group_id, member.group_id],
      ],
      [
        // n45: a team Batur opened from the panel outlives its last member.
        "DELETE FROM groups WHERE id = ? AND owner_made = 0 AND NOT EXISTS (SELECT 1 FROM members WHERE group_id = ?)",
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
      ["DELETE FROM plan_skips WHERE plan_id IN (SELECT id FROM plans WHERE starts < ?)", [now - 30 * DAY]],
      ["DELETE FROM plans WHERE starts < ?", [now - 30 * DAY]],
      ["DELETE FROM sessions WHERE created <= ?", [now - SESSION_AGE]],
      ["DELETE FROM owner_sessions WHERE created <= ?", [now - OWNER_AGE]],
      ["DELETE FROM auth_limits WHERE expires <= ?", [now]],
    ]);
  }

  // ---------- routes ----------
  const routes = [];
  // `big`: an owner-only route that takes a whole village layout; the owner is checked before the body is read.
  const route = (method, path, handler, auth = true, big = false) => {
    const keys = [];
    const pattern = new RegExp(
      `^${path.replace(/:(\w+)/g, (_, key) => (keys.push(key), "([^/]+)"))}$`,
    );
    routes.push({ method, pattern, keys, handler, auth, big });
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
      "SELECT g.id, g.name, (SELECT count(*) FROM members WHERE group_id = g.id) AS count FROM groups g WHERE invite = ?",
      [params.invite],
    );
    if (!group) fail("Bu davet bağlantısı bulunamadı.", 404);
    // The welcome shows who is in the team: names and faces only, in the order
    // they joined. Nothing about who is at the library, on the way or focusing
    // reaches someone who has not joined (n27).
    const faces = await db.all("SELECT name, avatar, color FROM members WHERE group_id = ? ORDER BY joined, id LIMIT 8", [group.id]);
    return json({ name: group.name, count: group.count, faces });
  }, false);

  async function join(request, group, body, extraStatements = []) {
    const p = profile(body);
    const account = usernameOf(body.username);
    const secret = await hashPassword(passwordOf(body.password));
    if (account && (await db.get("SELECT 1 AS hit FROM members WHERE username = ?", [account])))
      fail("Bu kullanıcı adı alınmış. Başka bir tane dene.", 409);
    const id = crypto.randomUUID(),
      now = Date.now(),
      session = await newSession(id),
      room = await deviceRoom(request, id);
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
      await signedInCookies(request, session, room),
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
    // d23: an account that already has a password changes only with it, so an
    // unlocked phone in someone else's hand cannot take the account over.
    if (member.pass_hash && (username !== member.username || body.password)) {
      await authLimit(`account:${member.id}`, 6);
      if (!(await checkPassword(String(body.current || ""), member.pass_hash)))
        fail("Şu anki şifren yanlış.", 403);
    }
    const secret = body.password ? await hashPassword(passwordOf(body.password)) : member.pass_hash;
    const result = await db.run("UPDATE members SET username = ?, pass_hash = ?, reset_hash = NULL, reset_until = 0 WHERE id = ? AND pass_hash IS ?", [
      username,
      secret,
      member.id,
      member.pass_hash ?? null,
    ]);
    if (!result.changes) fail("Hesabın bu arada değişti. Sayfayı yenileyip tekrar dene.", 409);
    return json({ ok: true, username });
  });
  async function signIn(request, member) {
    const room = await deviceRoom(request, member.id);
    const session = await newSession(member.id);
    const now = Date.now();
    await db.run("INSERT INTO sessions (token, member_id, created, seen) SELECT ?, id, ?, ? FROM members WHERE id = ? AND pass_hash = ?", [session.hash, now, now, member.id, member.pass_hash]);
    if (!(await db.get("SELECT 1 FROM sessions WHERE token = ?", [session.hash])))
      fail("Hesabın değişti. Güncel şifrenle yeniden giriş yap.", 401);
    return json(
      { memberId: member.id, username: member.username, live, pushPublicKey: vapid.publicKey, ...(await snapshot(member.group_id)) },
      200,
      await signedInCookies(request, session, room),
    );
  }
  route("POST", "/login", async ({ request, body, ip }) => {
    const username = usernameOf(body.username);
    await authLimit(`${ip}:login`, 12);
    await authLimit(`login:${username}`, 8);
    await tooManyWrong(username);
    const member = await db.get("SELECT id, group_id, username, pass_hash FROM members WHERE username = ?", [username]);
    // An unknown name costs the same hashing time, so timing does not tell
    // which usernames exist.
    const right = await checkPassword(String(body.password || ""), member?.pass_hash || DUMMY_HASH);
    if (!member || !right) {
      await countWrong(username);
      fail("Kullanıcı adı ya da şifre yanlış.", 401);
    }
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
    const room = await deviceRoom(request, member.id);
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
      200, await signedInCookies(request, session, room),
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
    const room = await deviceRoom(request, member.id);
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
      await signedInCookies(request, session, room),
    );
  }, false);

  // Opening the app keeps a device signed in: once a month the year starts
  // again, on the server and in the cookie, so only an unused device expires.
  // When the active account has ended here (signed out, revoked, left), the
  // next account saved on this device takes over, as if switched to (n25).
  route("GET", "/session", async ({ request }) => {
    const now = Date.now();
    let member = await authenticate(request), headers = [];
    if (!member) {
      const held = await deviceAccounts(request);
      if (held[0]) member = await memberFor(held[0].token);
      if (!member)
        return json({ error: "Ekibine katılmak için giriş yap." }, 401, readCookie(request, "kutup_accounts") ? deviceCookies(request, "", []) : {});
      headers = deviceCookies(request, held[0].token, held.slice(1).map((a) => a.token));
    }
    const renew = now - member.session_created > 30 * DAY;
    const device = deviceName(request.headers.get("user-agent"));
    if (renew)
      await db.run("UPDATE sessions SET created = ?, seen = ?, device = ? WHERE token = ?", [now, now, device, member.session_token]);
    else if (now - member.session_seen > HOUR || member.session_device !== device)
      await db.run("UPDATE sessions SET seen = ?, device = ? WHERE token = ?", [now, device, member.session_token]);
    if (renew && !headers.length) headers = [["Set-Cookie", sessionCookie(request, readCookie(request, "kutup_session"))]];
    return json(await sessionData(member), 200, headers);
  }, false);

  // The accounts this device holds, for the switcher. Ended ones are pruned
  // from the cookie as they are noticed.
  route("GET", "/accounts", async ({ request }) => {
    const held = await deviceAccounts(request);
    const saved = held.filter((a) => !a.active).map((a) => a.token);
    const pruned = saved.join(".") !== savedTokens(request).join(".");
    return json(
      { max: MAX_ACCOUNTS, accounts: held.map(({ id, name, avatar, color, team, active }) => ({ id, name, avatar, color, team, current: active })) },
      200,
      pruned ? deviceCookies(request, readCookie(request, "kutup_session"), saved) : {},
    );
  });

  // One tap to another account, only one this device really signed in to and
  // whose session is still valid: its token is in this device's HttpOnly cookie.
  route("POST", "/accounts/switch", async ({ request, body }) => {
    const held = await deviceAccounts(request);
    const target = held.find((a) => a.id === String(body.memberId || ""));
    const member = target && (await memberFor(target.token));
    if (!member) fail("Bu hesap bu cihazda açık değil. “Hesap ekle” ile giriş yap.", 403);
    return json(await sessionData(member), 200, deviceCookies(request, target.token, held.filter((a) => a !== target).map((a) => a.token)));
  }, false);

  // Signs this device out of the active account only; its other accounts stay,
  // and the next /session opens one of them.
  route("POST", "/logout", async ({ request, member }) => {
    await db.batch([
      ["DELETE FROM subscriptions WHERE session_token = ?", [member.session_token]],
      ["DELETE FROM sessions WHERE token = ?", [member.session_token]],
    ]);
    const others = (await deviceAccounts(request)).length;
    return json({ ok: true, others }, 200, [["Set-Cookie", sessionCookie(request, "", 0)]]);
  });

  // Ben → Hesap ve cihazlar: how many other devices this account is open on,
  // and signing them all out at once (a lost phone, a friend's laptop). This
  // device and the other accounts on it stay as they are (d27).
  const otherSessions = (member) =>
    db.get("SELECT count(*) AS n FROM sessions WHERE member_id = ? AND token <> ? AND created > ?", [
      member.id,
      member.session_token,
      Date.now() - SESSION_AGE,
    ]);
  // Each other device by name and last visit (anket, 17 Eki). The id is the
  // start of the stored hash, enough to pick one, never the cookie itself.
  route("GET", "/devices", async ({ member }) => {
    const list = await db.all(
      "SELECT substr(token, 1, 16) AS id, device, seen FROM sessions WHERE member_id = ? AND token <> ? AND created > ? ORDER BY seen DESC",
      [member.id, member.session_token, Date.now() - SESSION_AGE],
    );
    return json({ others: list.length, list: list.map((d) => ({ id: d.id, name: d.device || "Bilinmeyen cihaz", seen: d.seen })) });
  });
  route("POST", "/devices/signout", async ({ member, body }) => {
    // One device by id, or all the others.
    if (body.id !== undefined) {
      const id = String(body.id);
      if (!/^[0-9a-f]{16}$/.test(id)) fail("Cihaz bulunamadı.", 404);
      const row = await db.get("SELECT token FROM sessions WHERE member_id = ? AND token <> ? AND substr(token, 1, 16) = ?", [member.id, member.session_token, id]);
      if (!row) fail("Cihaz bulunamadı.", 404);
      await db.batch([
        ["DELETE FROM subscriptions WHERE member_id = ? AND session_token = ?", [member.id, row.token]],
        ["DELETE FROM sessions WHERE token = ?", [row.token]],
      ]);
      return json({ ok: true, closed: 1 });
    }
    const { n } = await otherSessions(member);
    await db.batch([
      ["DELETE FROM subscriptions WHERE member_id = ? AND (session_token IS NULL OR session_token <> ?)", [member.id, member.session_token]],
      ["DELETE FROM sessions WHERE member_id = ? AND token <> ?", [member.id, member.session_token]],
    ]);
    return json({ ok: true, closed: n });
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
    // Every board line reaches everyone's phone; one person cannot flood them (d23).
    await authLimit(`message:${m.id}`, 20);
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

  route("GET","/plans",async({member,url})=>json(await meetups.list(member,Number(url.searchParams.get("offset")||0),url.searchParams.get("day"))));
  route("GET","/plans/:id",async({member,params})=>json(await meetups.detail(member,params.id)));
  route("POST","/plans",async({member,body,ctx})=>{const result=await meetups.create(member,body,ctx);return changed(member,result,result.created?201:200);});
  route("POST","/plans/:id/answer",async({member,params,body})=>{await meetups.answer(member,params.id,body);return changed(member);});
  // Compatibility URL; every surface now sets an answer rather than toggling it.
  route("POST","/plans/:id/join",async({member,params})=>{await meetups.answer(member,params.id,{},true);return changed(member);});
  route("PATCH","/plans/:id",async({member,params,body,ctx})=>{await meetups.update(member,params.id,body,ctx);return changed(member);});
  route("DELETE","/plans/:id",async({member,params,body,ctx})=>{await meetups.update(member,params.id,body,ctx,true);return changed(member);});

  // A watched free session ends at `at` (now, or where its owner left): it is
  // cut to the whole minutes up to then and settled like any finished session.
  async function endFree(m, current, at) {
    // Project work is a whole 25/50/75 min commitment. An interrupted watched
    // session releases its reservation, never pretends the selected work is done.
    if (m.focus_imece) {
      await retrying(async () => [
        ["UPDATE focus_runs SET status='cancelled', settled=?, result='stopped' WHERE id=(SELECT focus_run_id FROM members WHERE id=? AND focus_end=?) AND status='running'", [Date.now(),m.id,current.focus_end]],
        ["UPDATE members SET focus_end=0, focus_minutes=0, focus_imece=0, focus_imece_phase=0, focus_imece_personal=0, focus_imece_ref=NULL,focus_imece_project=NULL, focus_relaxed=0, focus_honest=0, focus_away=0, focus_left_at=0, focus_device=NULL, focus_run_id=NULL WHERE id=? AND focus_end=?", [m.id,current.focus_end]],
        ...imece.release(m.id,m.focus_imece_project), bump(m.group_id),
      ], m.group_id);
      return { credited: 0, seen: 0 };
    }
    const start = current.focus_end - current.focus_minutes * 60000,
      minutes = Math.max(0, Math.floor((at - start) / 60000));
    // A joined timer has whole-minute duration; its inferred start can be a few
    // seconds in the future. Cancelling immediately must still clear it now.
    const cut = await db.run("UPDATE members SET focus_end = ?, focus_minutes = ? WHERE id = ? AND focus_end = ?", [Math.min(at,start + minutes * 60000), minutes, m.id, current.focus_end]);
    if (!cut.changes) fail("Odak oturumu değişti. Sayfayı yenile.", 409);
    const row = await db.get("SELECT focus_beat AS beat, focus_away AS away FROM members WHERE id = ?", [m.id]);
    const seen = seenMinutes({ start, ends: start + minutes * 60000, beat: row.beat, away: row.away });
    await retrying(() => settleFocus(m.group_id, Date.now(), m.id), m.group_id);
    return { credited: minutes > 0 && seen >= HONEST_MIN ? seen : 0, seen };
  }
  // Marks a build-mode site cracked (n40), once: returns whether this call did it.
  async function crack(m, end, at) {
    const done = await db.run(
      "UPDATE members SET focus_cracked_at = ? WHERE id = ? AND focus_end = ? AND focus_strict = 1 AND focus_relaxed = 0 AND focus_cracked_at = 0 AND focus_left_at > 0",
      [at, m.id, end],
    );
    if (done.changes) {
      await db.run(...bump(m.group_id));
      onChange(m.group_id);
    }
    return done.changes > 0;
  }
  route("GET", "/focus/join/:id", async ({member,params})=>{
    const friend=await db.get("SELECT id,name,focus_end,focus_paused_at,focus_imece FROM members WHERE id=? AND group_id=?",[params.id,member.group_id]);
    if(!friend||friend.id===member.id||friend.focus_end<=Date.now())fail("Bu arkadaşının devam eden bir seansı yok.",409);
    const minutes=Math.max(0,Math.floor((friend.focus_end-Date.now())/60000));
    const plans=(await db.all("SELECT model FROM unlocks WHERE member_id=?",[member.id])).map(p=>p.model);
    const models=CATALOG.filter(item=>item.id!=="anitkabir"&&fits(item,minutes)&&item.cost<=member.bricks&&["open","new"].includes(stateOf(item,Date.now(),plans,member.badge==="dev"))).map(({id,name,emoji,cost,class:kind})=>({id,name,emoji,cost,minutes:minutesOf({class:kind})}));
    return json({friend:{id:friend.id,name:friend.name,end:friend.focus_end},minutes,paused:!!friend.focus_paused_at,imece:!!friend.focus_imece,canFree:minutes>=HONEST_MIN,models});
  });
  // n50: the handler of one account's focus action. `reply` answers like
  // `changed` (a linked account's copy answers without a snapshot); `opts.link`
  // is the account a linked start follows, `opts.follower` marks a copy.
  async function focusAction(m, body, ctx, reply = changed, opts = {}) {
    const action = body.action,
      now = Date.now();
    if (action === "finish") {
      const before = await db.get(
        "SELECT focus_minutes AS minutes, focus_strict AS strict, focus_beat AS beat, focus_end AS ends, focus_honest AS honest, focus_away AS away, focus_rescued AS rescued, focus_cracked_at AS cracked, focus_relaxed AS relaxed, focus_imece AS imece FROM members WHERE id = ? AND focus_end > 0 AND focus_end <= ?",
        [m.id, now],
      );
      // A cracked site that can still be saved waits for its owner (n40).
      if (before && rescuable({ focusStrict: before.strict, focusRelaxed: before.relaxed, focusRescued: before.rescued, focusBeat: before.beat, focusEnd: before.ends, focusCrackedAt: before.cracked }, now))
        return reply(m, { credited: 0, withered: false, cracked: true });
      if (before) await retrying(() => settleFocus(m.group_id, now, m.id), m.group_id);
      const withered = !!before?.strict && !before?.relaxed && (before.beat < before.ends - BEAT_GRACE || before.cracked > 0);
      const seen = before && !before.strict && before.honest ? seenMinutes({ start: before.ends - before.minutes * 60000, ends: before.ends, beat: before.beat, away: before.away }) : before?.minutes || 0;
      return reply(m, { credited: withered || (before?.imece && seen!==before.minutes) || seen < (before?.honest ? HONEST_MIN : 0) ? 0 : seen, withered });
    }
    // Kurtarma (n40): a build-mode site that cracked while you were away is saved
    // once. The time away does not count, and a fifth of the session is added.
    if (action === "rescue") {
      const current = await db.get("SELECT * FROM members WHERE id = ?", [m.id]);
      if (!current?.focus_strict || current.focus_relaxed || !current.focus_end) fail("Kurtarılacak bir inşaat yok.");
      if (current.focus_rescued) fail("Bu inşaat bir kez kurtarıldı; ikinci şans yok.");
      // Away since the phone left (or since the app was last seen), and saved in time.
      const cracked = current.focus_cracked_at > 0;
      const gone = now - (cracked && current.focus_left_at > 0 ? current.focus_left_at : current.focus_beat);
      if (cracked ? now - current.focus_cracked_at > CRACK_HOLD : gone > RESCUE_HOLD) fail("Kurtarma süresi geçti; bina çöktü.");
      const extra = rescueMinutes(current.focus_minutes),
        end = current.focus_end + Math.max(0, gone) + extra * 60000;
      await db.batch([
        ["UPDATE bricks_log SET ref = ? WHERE member_id = ? AND ref = ?", [sessionRef(m.id, end), m.id, sessionRef(m.id, current.focus_end)]],
        ["UPDATE focus_runs SET timing_revision = timing_revision + 1 WHERE id = (SELECT focus_run_id FROM members WHERE id = ? AND focus_end = ? AND focus_rescued = 0)", [m.id, current.focus_end]],
        ["UPDATE members SET focus_end = ?, focus_beat = ?, focus_rescued = 1, focus_left_at = 0, focus_cracked_at = 0 WHERE id = ? AND focus_end = ? AND focus_rescued = 0", [end, now, m.id, current.focus_end]],
        bump(m.group_id),
      ]);
      return reply(m, { rescued: true, extra });
    }
    // The phone left the app (n40). Five quiet seconds, then one countdown: the
    // phone gets a single notification that counts 10 … 1 (its service worker
    // counts; the server sends it once), an open computer gets one "look at your
    // phone", and at zero the server itself marks the site cracked, once.
    if (action === "away") {
      const current = await db.get("SELECT focus_end, focus_strict, focus_honest, focus_paused_at, focus_left_at, focus_rescued, focus_device, focus_cracked_at, focus_relaxed FROM members WHERE id = ?", [m.id]);
      if (!current || current.focus_relaxed || current.focus_end <= now || current.focus_paused_at || (!current.focus_strict && !current.focus_honest)) return json({ ok: true });
      // A session started on a computer is the computer's to watch; a glance at the phone is fine.
      if (current.focus_device === "desk") return json({ ok: true });
      // Another phone or tablet of the same account going dark is not leaving (n47).
      if (await notWatcher(m.id, body)) return json({ ok: true, ignored: true });
      // Already away or cracked: this is the same absence, not a new countdown.
      if (current.focus_left_at > 0 || current.focus_cracked_at > 0) return json({ ok: true });
      const left = await db.run("UPDATE members SET focus_left_at = ? WHERE id = ? AND focus_end = ? AND focus_left_at = 0 AND focus_cracked_at = 0", [now, m.id, current.focus_end]);
      if (!left.changes) return json({ ok: true });
      // n50: a linked account only notes the absence; the account the phone
      // was on runs the one countdown, and its crack cracks the whole link.
      if (opts.follower) return json({ ok: true });
      const send = (message, on, ttl = 60) => notifyMember(ctx, m.id, { tag: "kutup-build", url: "/", sticky: true, ...message }, { urgency: "high", ttl }, on).catch(() => {});
      const still = async () =>
        !!(await db.get("SELECT 1 FROM members WHERE id = ? AND focus_left_at = ? AND focus_end = ? AND focus_cracked_at = 0", [m.id, now, current.focus_end]));
      // Tests set leaveStep: 0 so the countdown runs at once.
      const wait = (ms) => new Promise((r) => setTimeout(r, config.leaveStep === 0 ? 0 : ms));
      ctx.waitUntil(
        (async () => {
          await wait(LEAVE_GRACE);
          if (!(await still())) return;
          // Bumped now, so an open computer hears it and sounds its own alarm.
          await db.run(...bump(m.group_id));
          onChange(m.group_id);
          if (!current.focus_strict)
            return send({ title: "🎧 Seansın seni bekliyor", body: `Uzakta geçen dakika sayılmaz. ${FREE_LEAVE / 60000} dk içinde dönmezsen seans biter.` }, "phone");
          await send({ title: `⏳ ${COUNTDOWN} sn içinde dön!`, body: "Kütüp'e dön, yoksa binan çatlar.", countdown: COUNTDOWN, session: now }, "phone", 15);
          await send({ title: "📱 Telefonuna bak!", body: `Kütüp'e hemen dön, ${COUNTDOWN} saniye içinde binan çatlayacak.`, tag: "kutup-phone" }, "desk", 15);
          await wait(COUNTDOWN * 1000);
          if (!(await crack(m, current.focus_end, now))) return;
          // n50: the link cracks as one, with the same moment of leaving.
          for (const f of await linkedOf(m)) {
            await db.run("UPDATE members SET focus_left_at = ? WHERE id = ? AND focus_end = ? AND focus_left_at = 0", [now, f.id, f.focus_end]).catch(() => {});
            await crack(f, f.focus_end, now).catch(() => {});
          }
          await send(
            current.focus_rescued
              ? { title: "🧱 Binan çöktü", body: "Bu inşaatın kurtarma hakkı kullanılmıştı.", session: now, crack: true }
              : { title: "🩹 Binan çatladı!", body: `${RESCUE_WINDOW / 60000} dakika içinde dönersen bir kez kurtarabilirsin.`, session: now, crack: true },
            "phone",
            RESCUE_WINDOW / 1000,
          );
        })().catch(() => {}),
      );
      return json({ ok: true });
    }
    // The phone came back too late, or found the app closed and reopened: the
    // app says so itself, in case the server's countdown never ran.
    if (action === "crack") {
      const current = await db.get("SELECT focus_end, focus_strict, focus_relaxed, focus_left_at FROM members WHERE id = ?", [m.id]);
      if (current?.focus_strict && !current.focus_relaxed && current.focus_end > now && !(await notWatcher(m.id, body))) {
        const away = Math.min(Math.max(0, Number(body.away) || 0), RESCUE_HOLD);
        if (!current.focus_left_at) await db.run("UPDATE members SET focus_left_at = ? WHERE id = ? AND focus_end = ? AND focus_left_at = 0", [now - away, m.id, current.focus_end]);
        await crack(m, current.focus_end, now);
      }
      return reply(m);
    }
    // Çay molası: a build-mode session stops for a few minutes, once; the end
    // moves on by the time taken (and the session's ledger rows follow it).
    if (action === "pause" || action === "resume") {
      const current = await db.get("SELECT * FROM members WHERE id = ?", [m.id]);
      if (!current?.focus_strict || current.focus_relaxed || current.focus_end <= now) fail("Duraklatılacak bir inşaat yok.");
      if (action === "pause") {
        if (current.focus_paused_at) fail("Zaten moladasın.");
        if (current.focus_pause_used) fail("Bu inşaatın çay molası kullanıldı.");
        if (!teaBreakFor(current.focus_minutes)) fail("25 dakikalık yapılarda çay molası yok.");
        await db.batch([
          ["UPDATE focus_runs SET timing_revision = timing_revision + 1 WHERE id = (SELECT focus_run_id FROM members WHERE id = ? AND focus_end = ?)", [m.id, current.focus_end]],
          ["UPDATE members SET focus_paused_at = ?, focus_pause_used = 1 WHERE id = ? AND focus_end = ?", [now, m.id, current.focus_end]],
          bump(m.group_id),
        ]);
        return reply(m, { paused: true });
      }
      if (!current.focus_paused_at) fail("Şu an mola yok.");
      const taken = Math.min(now - current.focus_paused_at, teaBreakFor(current.focus_minutes)),
        end = current.focus_end + taken;
      await db.batch([
        ["UPDATE bricks_log SET ref = ? WHERE member_id = ? AND ref = ?", [sessionRef(m.id, end), m.id, sessionRef(m.id, current.focus_end)]],
        ["UPDATE focus_runs SET timing_revision = timing_revision + 1 WHERE id = (SELECT focus_run_id FROM members WHERE id = ? AND focus_paused_at > 0)", [m.id]],
        ["UPDATE members SET focus_end = ?, focus_paused_at = 0, focus_beat = ? WHERE id = ? AND focus_paused_at > 0", [end, now, m.id]],
        bump(m.group_id),
      ]);
      return reply(m, { resumed: true });
    }
    // Build mode: the app reports it is still on screen.
    if (action === "beat") {
      const current = await db.get("SELECT focus_end, focus_beat, focus_strict, focus_honest, focus_minutes, focus_left_at, focus_cracked_at, focus_relaxed FROM members WHERE id = ?", [m.id]);
      if (!current || current.focus_relaxed || current.focus_end <= now || (!current.focus_strict && !current.focus_honest)) return json({ ok: true });
      // A cracked site stays cracked until it is saved or let go.
      if (current.focus_cracked_at > 0) return json({ ok: true, cracked: true });
      // Phone and computer together (n40): while the phone is out of the app,
      // the computer cannot keep the session alive; only the phone coming back can.
      // Only the watching phone coming back clears it; any other device is a helper (n47).
      const desk = body.device === "desk" || (await notWatcher(m.id, body));
      if (desk && current.focus_left_at > 0) return json({ ok: true, phoneAway: true });
      const back = !desk && current.focus_left_at > 0 ? [bump(m.group_id)] : [];
      if (current.focus_strict) {
        await db.batch([["UPDATE members SET focus_beat = ?, focus_left_at = 0 WHERE id = ? AND focus_strict = 1 AND focus_end > ?", [now, m.id, now]], ...back]);
        return json({ ok: true });
      }
      // Dürüst dakika (n40): a free session's silences are time away; one longer
      // than five minutes ends it where you left.
      const gap = now - current.focus_beat;
      if (gap > FREE_LEAVE) {
        return reply(m, { stopped: true, ...(await endFree(m, current, current.focus_beat)) });
      }
      await db.batch([
        ["UPDATE members SET focus_away = focus_away + ?, focus_beat = ?, focus_left_at = 0 WHERE id = ? AND focus_end = ?", [gap > BEAT_GAP ? gap - BEAT_EVERY : 0, now, m.id, current.focus_end]],
        ...back,
      ]);
      return json({ ok: true, away: gap > BEAT_GAP ? Math.round((gap - BEAT_EVERY) / 60000) : 0 });
    }
    // Giving up, or leaving the app in build mode, ends the session without minutes.
    // In the first two minutes it costs nothing; after that the site collapses,
    // half of the materials come back now and 30% when the rubble is cleared.
    if (action === "cancel" || action === "wither") {
      if (action === "wither" && m.focus_relaxed) return json({ ok: true, ignored: true });
      // Only the watching device lets a site go by itself; anyone may choose to (n47).
      if (action === "wither" && body.chosen !== true && (await notWatcher(m.id, body))) return json({ ok: true, ignored: true });
      // Giving up names the session it means (n47): a device showing an old
      // picture (another session, or a screen-off one it took for a watched
      // one) is sent to refresh instead of ending what it did not see.
      if (action === "cancel" && m.focus_end > 0 && body.end != null) {
        if (body.end !== m.focus_end) fail("Bu seans başka bir cihazda değişti. Sayfayı yenile.", 409);
        if (!!m.focus_relaxed !== (body.relaxed === true)) fail("Bu seansın ekran ayarı başka bir cihazda farklı. Sayfayı yenile.", 409);
      }
      if(m.focus_imece && m.focus_end>0 && m.focus_end<=now){
        await retrying(()=>settleFocus(m.group_id,now,m.id),m.group_id);
        const done=await db.get("SELECT minutes FROM imece_work WHERE id=?",[m.focus_imece_ref]);
        return reply(m,{stopped:true,credited:done?.minutes||0,withered:false});
      }
      // A watched free session that is stopped keeps the minutes it was seen (n40).
      if (action === "cancel") {
        const current = await db.get("SELECT focus_end, focus_beat, focus_strict, focus_honest, focus_minutes FROM members WHERE id = ?", [m.id]);
        if (current && !current.focus_strict && current.focus_honest && current.focus_end > now) {
          const gap = now - current.focus_beat;
          if (gap > BEAT_GAP && gap <= FREE_LEAVE) await db.run("UPDATE members SET focus_away = focus_away + ?, focus_beat = ? WHERE id = ? AND focus_end = ?", [gap - BEAT_EVERY, now, m.id, current.focus_end]);
          const ended = await endFree(m, current, gap > FREE_LEAVE ? current.focus_beat : now);
          return reply(m, { withered: false, refunded: 0, pending: 0, stopped: true, ...ended });
        }
      }
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
          ...(current.focus_relaxed ? [["DELETE FROM push_outbox WHERE member_id = ? AND json_extract(payload, '$.tag') = ?", [m.id, relaxedTag(m.id, current.focus_end)]]] : []),
          ...(current.focus_imece ? imece.release(m.id,m.focus_imece_project) : []),
          // n46 C: the run ends cancelled; a building site gives its plot back.
          ...(current.focus_run_id
            ? [
                ["UPDATE focus_runs SET status = 'cancelled', settled = ?, result = ? WHERE id = ? AND status = 'running'", [now, outcome.withered ? "withered" : early ? "early" : "stopped", current.focus_run_id]],
                ...(current.focus_strict ? [...releaseStatements("site", "?", [current.focus_run_id]), ...contentChange(m.group_id, "site", current.focus_run_id, "release", "cancelled", now)] : []),
              ]
            : []),
          ["UPDATE members SET focus_end = 0, focus_minutes = 0, focus_strict = 0, focus_relaxed = 0, focus_imece = 0, focus_imece_phase = 0, focus_imece_personal = 0, focus_imece_ref = NULL, focus_imece_project = NULL, focus_model = NULL, focus_cost = 0, focus_paused_at = 0, focus_pause_used = 0, focus_honest = 0, focus_away = 0, focus_rescued = 0, focus_left_at = 0, focus_device = NULL, focus_cracked_at = 0, focus_run_id = NULL WHERE id = ?", [m.id]],
          bump(m.group_id),
        ];
      }, m.group_id);
      return reply(m, outcome);
    }
    if (action !== "start") fail("Geçersiz odak işlemi.");
    // n46 C: a start may carry the app's request key. The same key with the
    // same choices is the same start (a lost answer, a double tap): it returns
    // the session already begun instead of an error or a second charge; the
    // same key with other choices is refused. Older apps send no key.
    const requestKey = body.requestKey == null ? null : String(body.requestKey);
    if (requestKey !== null && !/^[A-Za-z0-9_-]{16,64}$/.test(requestKey)) fail("İstek anahtarı geçerli değil.");
    const requestHash = await sha(JSON.stringify([body.strict === true, body.relaxed === true, body.imece === true, body.model ?? null, body.minutes ?? null, body.joinMember ?? null, body.rhythm === true]));
    const replay = async () => {
      if (!requestKey) return null;
      const seen = await db.get("SELECT payload_hash AS hash, result_ref AS run FROM request_receipts WHERE scope = 'focus-start' AND actor = ? AND key = ?", [m.id, requestKey]);
      if (!seen) return null;
      if (seen.hash !== requestHash) fail("Bu istek başka seçimlerle zaten gönderildi. Sayfayı yenile.", 409);
      return reply(m, { replayed: true, run: seen.run });
    };
    const again = await replay();
    if (again) return again;
    if (body.imece != null && typeof body.imece !== "boolean") fail("Ortak görev seçimi geçerli değil.");
    const project = body.imece === true;
    if (project && (body.strict === true || body.model != null || body.joinMember || body.rhythm)) fail("Ortak görev, kişisel bina veya masa ritmiyle aynı seans olamaz.");
    if (project) await snapshot(m.group_id);
    if (m.focus_end > now) fail("Önce mevcut odak oturumunu tamamla veya durdur.");
    // Build mode builds something from the catalogue; its materials are paid now.
    // Older apps send only minutes: they get the plain building of that size.
    const strict = body.strict === true;
    if (body.relaxed != null && typeof body.relaxed !== "boolean") fail("İnşaat şekli geçerli değil.");
    const relaxed = body.relaxed === true;
    if (relaxed && !strict && !project) fail("Rahat mod yalnız inşaatta veya ortak görevde kullanılabilir.");
    let item = null;
    if (strict && body.model != null) {
      item = BY_ID[body.model];
      if (!item) fail("Bu yapı katalogda yok.");
    }
    let minutes = item && body.minutes == null && !body.joinMember ? minutesOf(item) : Number(body.minutes),
      end;
    const rhythm = body.rhythm === true && !body.joinMember ? (await db.get("SELECT rhythm FROM groups WHERE id = ?", [m.group_id]))?.rhythm : null;
    if (opts.link) {
      // n50: a linked account ends with the session it follows, to the millisecond.
      end = opts.link.focus_end;
      minutes = opts.link.focus_minutes;
      if (strict && item && !fits(item, minutes)) fail(`${item.name} bu seansın süresine sığmaz.`);
      if (strict && !item) item = BY_ID[DEFAULT_MODEL[kindFor(minutes)]];
    } else if (rhythm && RHYTHMS[rhythm]) {
      // The team's rhythm: this round ends at its shared break.
      end = rhythmEnd(rhythm, now);
      minutes = Math.floor((end - now) / 60000);
      if (strict && item && !fits(item, minutes)) fail(`Bu tura ${minutes} dk kaldı; ${item.name} sığmaz. Daha küçük bir yapı seç.`);
      if (strict && !item) item = BY_ID.kulube;
    } else if (body.joinMember) {
      const other = await db.get("SELECT focus_end,focus_paused_at,focus_imece FROM members WHERE id = ? AND group_id = ?", [
        String(body.joinMember),
        m.group_id,
      ]);
      // Joining must leave enough watched time; a building also needs its
      // exact catalogue duration, never a rounded duration class.
      if (!other || other.focus_end < now + JOIN_LEAD)fail("Birlikte odak için en az 20 dakika kalmalı. Yeni bir 25 dakikalık seans başlat.");
      if(other.focus_paused_at)fail("Arkadaşın çay molasında. Döndüğünde katılabilirsin.",409);
      if(other.focus_imece)fail("Bu bir Anıtkabir görevi. Kendi görevini Bir Taş da Senden kartından başlat.",409);
      if(body.joinEnd!=null&&body.joinEnd!==other.focus_end)fail("Arkadaşının seansı değişti. Katılım penceresini yeniden aç.",409);
      end = other.focus_end;
      minutes = Math.floor((end - now) / 60000);
      if (strict && item && !fits(item, minutes)) fail("Kalan süre bu yapıya yetmez. Daha küçük bir yapı seç.");
      if (strict && !item) item = BY_ID.kulube;
      if(strict&&!fits(item,minutes))fail("İnşaat için en az 25 dakika kalmalı. Yalnız odak seçebilirsin.");
    } else {
      if (![25, 50, 75].includes(minutes)) fail("25, 50 veya 75 dakika seç.");
      if (item && minutesOf(item) !== minutes) fail(`${item.name} ${minutesOf(item)} dakikalık bir yapı.`);
      if (strict && !item) item = BY_ID[DEFAULT_MODEL[kindFor(minutes)]];
      end = now + minutes * 60000;
    }
    if (item?.id === "anitkabir")
      fail("Anıtkabir ekibinin ortak görevi. Köy sekmesindeki Bir Taş da Senden kartını aç.", 409);
    const cost = item?.cost || 0;
    if (item && (item.rare || item.since)) {
      const plans = (await db.all("SELECT model FROM unlocks WHERE member_id = ?", [m.id])).map((u) => u.model);
      const state = stateOf(item, now, plans, m.badge === "dev");
      if (state === "hidden") fail("Bu yapı yalnız Kütüp'ün kurucusuna ait.");
      if (state === "soon") fail(`${item.name} henüz gelmedi; pazartesi katalogda.`);
      if (state === "locked") fail(`${item.name} nadir bir yapı: önce planını bulman lazım. Bitirdiğin her seansta şansın var.`);
    }
    const seed = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
    const runId = `run-${randomHex(12)}`;
    const mode = project ? "imece" : strict ? (relaxed ? "relaxed" : "strict") : "free";
    try { await retrying(async () => {
      const current = await db.get("SELECT focus_end, bricks FROM members WHERE id = ?", [m.id]);
      if (!current || current.focus_end > now) fail("Önce mevcut odak oturumunu tamamla veya durdur.");
      if (cost > current.bricks) fail(`${item.name} için ${cost - current.bricks} tuğla eksik.`);
      if(body.joinMember){
        const friend=await db.get("SELECT focus_end,focus_paused_at,focus_imece FROM members WHERE id=? AND group_id=?",[String(body.joinMember),m.group_id]);
        if(!friend||friend.focus_end!==end||friend.focus_paused_at||friend.focus_imece)fail("Arkadaşının seansı değişti. Yeniden katılmayı dene.",409);
      }
      const reservation = project ? await imece.reserve(m.id, minutes) : null;
      // n46 D: in a v2 village a building session reserves its final plot now
      // and shows a real site; the plot is planned after any older session of
      // this member is settled, on the layout as it stands (guarded by its rev).
      let site = [];
      if (strict && (await db.get("SELECT active_layout_id AS a FROM groups WHERE id = ?", [m.group_id]))?.a) {
        await retrying(() => settleFocus(m.group_id, now, m.id), m.group_id);
        const active = await activeLayout(db, m.group_id);
        if (active) {
          const placed = placeStatements(active, { subject: { type: "site", id: runId }, model: item.id, owner: m.id, created: now }, body.village, { browserOnly: !!config.browserPlanningOnly });
          if (placed.error === "replan") fail("Köy değişti veya yer planı hazır değil. Köyü yenileyip çalışmaya başlamayı tekrar dene; tuğlaların harcanmadı.", 409);
          if (placed.error) fail(`Köyde ${item.name} için şu an uygun yer hazırlanamadı. Başka bir yapı seç ya da biraz sonra dene.`, 409);
          site = placed.statements;
        }
      }
      return [
      ...site,
      // An expired, uncredited session is settled before the new one starts.
      ...(await settleFocus(m.group_id, now, m.id)),
      ...(reservation?.statements || []),
      ["UPDATE members SET focus_imece=?, focus_imece_phase=?, focus_imece_personal=?, focus_imece_ref=?,focus_imece_project=? WHERE id=?", [project ? 1 : 0, reservation?.phase || 0, reservation?.personal || 0, project ? crypto.randomUUID() : null,reservation?.projectId||null, m.id]],
      [
        "UPDATE members SET focus_end = ?, focus_minutes = ?, focus_strict = ?, focus_relaxed = ?, focus_beat = ?, focus_seed = ?, focus_model = ?, focus_cost = ?, bricks = bricks - ?, focus_honest = ?, focus_away = 0, focus_rescued = 0, focus_left_at = 0, focus_device = ?, focus_cracked_at = 0, focus_link = ? WHERE id = ?",
        [end, minutes, strict ? 1 : 0, relaxed ? 1 : 0, now, seed, item?.id ?? null, cost, cost, project ? (relaxed ? 0 : 1) : !strict && (body.joinMember || body.honest === true) ? 1 : 0, ["phone", "desk"].includes(body.device) ? body.device : null, opts.link?.id ?? null, m.id],
      ],
      ...(cost ? [ledgerRow(m.id, -cost, "cost", sessionRef(m.id, end), `${item.name} malzemesi`, now)] : []),
      // n46 C: the session's stable run. Nothing else is open for this member
      // now (the old one was settled above), so a stray running row is closed.
      ["UPDATE focus_runs SET status = 'cancelled', result = 'orphan', settled = ? WHERE member_id = ? AND status = 'running'", [now, m.id]],
      [
        "INSERT INTO focus_runs (id, member_id, group_id, request_key, request_hash, mode, model, seed, minutes, started, ends) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [runId, m.id, m.group_id, requestKey, requestHash, mode, item?.id ?? null, seed, minutes, end - minutes * 60000, end],
      ],
      ["UPDATE members SET focus_run_id = ? WHERE id = ?", [runId, m.id]],
      ...(strict ? contentChange(m.group_id, "site", runId, "start", item.id, now) : []),
      ...(requestKey ? [["INSERT INTO request_receipts (scope, actor, key, payload_hash, result_ref, created) VALUES ('focus-start', ?, ?, ?, ?, ?)", [m.id, requestKey, requestHash, runId, now]]] : []),
      deviceOf(body) ? keep(watchKey(m.id), deviceOf(body)) : ["DELETE FROM settings WHERE key = ?", [watchKey(m.id)]],
      ...(strict ? [keep(modeKey(m.id), relaxed ? "relaxed" : "strict")] : []),
      bump(m.group_id),
      ];
    }, m.group_id); } catch (error) {
      // A twin request that won the race already began this very session.
      const again = await replay();
      if (again) return again;
      throw error;
    }
    // "Ekibi çağır": everyone gets a tap-to-join for the same end time.
    if (body.invite === true && !opts.link && minutes*60000 >= JOIN_LEAD) {
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
    // A linked account's screen-off build is announced by the one it follows.
    if (relaxed && !project && !opts.link) await relaxedNotices(ctx, m.id).catch(() => {});
    return reply(m, { run: runId });
  }

  // ---------- linked accounts (n50) ----------
  // Batur keeps several accounts (one per team) on one device. A session can be
  // started in all of them at once: each account gets its own session (its own
  // building, bricks, minutes, team) ending at the same millisecond, and from
  // then on they are one session. Whatever happens to the one on screen (a
  // beat, leaving the app, a crack, a rescue, a tea break, giving up, the
  // finish) happens to each of the others too, through the same handler, so
  // every rule stays the one rule. Starting a link is Batur's for now (his
  // panel key on this device); following one needs nothing more.
  const LINKED_ACTIONS = new Set(["finish", "rescue", "away", "crack", "pause", "resume", "beat", "cancel", "wither"]);
  const LINK_WINDOW = GRACE; // other accounts join within the first two minutes
  // The other running members of `m`'s link.
  const linkedOf = async (m) =>
    m.focus_link
      ? db.all("SELECT m.*, g.rev AS group_rev FROM members m JOIN groups g ON g.id = m.group_id WHERE m.focus_link = ? AND m.id <> ? AND m.focus_end > 0", [m.focus_link, m.id])
      : [];
  // A linked copy answers without the (costly) snapshot; its team still hears of it.
  const quietly = async (member, extra = {}) => {
    onChange(member.group_id);
    return json({ ok: true, ...extra });
  };
  async function followLinked(m, body, ctx) {
    if (!LINKED_ACTIONS.has(body.action)) return;
    for (const f of await linkedOf(m)) {
      // Each copy names its own session, so "this changed elsewhere" checks hold.
      const copy = body.action === "cancel" ? { ...body, end: f.focus_end, relaxed: !!f.focus_relaxed } : body;
      try {
        await focusAction(f, copy, ctx, quietly, { follower: true });
      } catch {
        // A copy that does not apply (a free session has no tea break) is skipped.
      }
    }
  }
  route("POST", "/focus", async ({ member: m, body, ctx }) => {
    const response = await focusAction(m, body, ctx);
    await followLinked(m, body, ctx);
    return response;
  });
  // The accounts this device holds, with their sessions, for the picker and
  // the one panel. Batur's only, for now.
  route("GET", "/owner/linked", async ({ request, ip }) => {
    await requireOwner(request, ip);
    const held = await deviceAccounts(request);
    if (!held.length) return json({ accounts: [] });
    const ids = held.map((a) => a.id),
      marks = ids.map(() => "?").join(", ");
    const [rows, plans, runs] = await db.read([
      [`SELECT m.id, m.group_id AS groupId, m.bricks, m.badge, m.focus_end AS focusEnd, m.focus_minutes AS focusMinutes, m.focus_strict AS focusStrict,
          m.focus_relaxed AS focusRelaxed, m.focus_honest AS focusHonest, m.focus_imece AS focusImece, m.focus_model AS focusModel, m.focus_link AS focusLink,
          m.focus_paused_at AS focusPausedAt, m.focus_cracked_at AS focusCrackedAt, m.focus_rescued AS focusRescued, m.focus_left_at AS focusLeftAt,
          g.active_layout_id IS NOT NULL AS v2
        FROM members m JOIN groups g ON g.id = m.group_id WHERE m.id IN (${marks})`, ids],
      [`SELECT member_id AS id, model FROM unlocks WHERE member_id IN (${marks})`, ids],
      // The newest run of each, to say how a link that just ended went.
      [`SELECT r.member_id AS id, r.mode, r.model, r.minutes, r.ends, r.status, r.result FROM focus_runs r
        WHERE r.member_id IN (${marks}) AND r.started = (SELECT MAX(started) FROM focus_runs x WHERE x.member_id = r.member_id)`, ids],
    ]);
    return json({
      accounts: held.map((a) => {
        const row = rows.find((r) => r.id === a.id) || {};
        return {
          id: a.id, name: a.name, avatar: a.avatar, color: a.color, team: a.team, current: a.active,
          ...row, v2: !!row.v2,
          plans: plans.filter((p) => p.id === a.id).map((p) => p.model),
          last: runs.find((r) => r.id === a.id) || null,
        };
      }),
    });
  }, false);
  // Another account of this device joins the session just started on screen.
  // It builds its own choice with its own bricks (or focuses without a
  // building), in its own team; it cannot be in the same team as any account
  // of the link (that would count as friends working together).
  route("POST", "/owner/linked/start", async ({ request, ip, body, ctx }) => {
    await requireOwner(request, ip);
    const held = await deviceAccounts(request);
    const lead = held.find((a) => a.active),
      other = held.find((a) => !a.active && a.id === String(body.memberId || ""));
    if (!lead || !other) fail("Bu hesap bu cihazda açık değil. Hesaplarım listesini yenile.", 403);
    const [leader, f] = await Promise.all([memberFor(lead.token), memberFor(other.token)]);
    if (!leader || !f) fail("Bu hesap bu cihazda açık değil. Hesaplarım listesini yenile.", 403);
    const now = Date.now();
    if (!(leader.focus_end > now) || leader.focus_imece) fail("Önce bu hesapta bir seans başlat.", 409);
    if (leader.focus_link && leader.focus_link !== leader.id) fail("Bu seans başka bir hesabın bağlı seansı. O hesaptan başlat.", 409);
    if (now - (leader.focus_end - leader.focus_minutes * 60000) > LINK_WINDOW) fail("Diğer hesaplar seansın ilk 2 dakikasında katılabilir.", 409);
    if (f.focus_end > now) fail(`${f.name} hesabında zaten süren bir seans var.`, 409);
    const link = [leader, ...(await linkedOf({ id: leader.id, focus_link: leader.id }))];
    if (link.some((x) => x.group_id === f.group_id)) fail("Aynı ekipteki iki hesap birlikte çalışamaz; her biri ayrı ekipte olmalı.", 409);
    // The mode is the leader's: a watched build is followed by watched builds
    // (or watched focus where none is chosen), a screen-off build by screen-off
    // ones (or plain focus), a watched free session by watched free sessions.
    const build = !!leader.focus_strict && body.model != null;
    if (!leader.focus_strict && body.model != null) fail("Binasız seansa bağlı hesaplar da binasız katılır.");
    const watched = !leader.focus_relaxed && (!!leader.focus_strict || !!leader.focus_honest);
    const started = await focusAction(
      f,
      {
        action: "start",
        strict: build,
        relaxed: build && !!leader.focus_relaxed,
        honest: !build && watched,
        ...(build ? { model: body.model } : {}),
        minutes: leader.focus_minutes,
        device: leader.focus_device || undefined,
        deviceId: body.deviceId,
        requestKey: body.requestKey,
        village: body.village,
      },
      ctx,
      quietly,
      { link: leader },
    );
    // The leader becomes a member of its own link (once a first account joins).
    await db.run("UPDATE members SET focus_link = id WHERE id = ? AND focus_end = ? AND focus_link IS NULL", [leader.id, leader.focus_end]);
    onChange(leader.group_id);
    return started;
  }, false);

  // Acceptance acknowledges an already-credited building, never creates rewards.
  route("GET", "/build-deliveries", async ({ member }) => {
    await snapshot(member.group_id);
    return json(await db.all("SELECT d.id, d.model, d.kind, d.seed, d.minutes, d.ends, d.reward, b.gift FROM build_deliveries d LEFT JOIN buildings b ON b.id = d.id WHERE d.member_id = ? AND d.accepted_at = 0 ORDER BY d.ends LIMIT 5", [member.id]));
  });
  route("POST", "/build-deliveries/:id", async ({ member, params }) => {
    const row = await db.get("SELECT ends FROM build_deliveries WHERE id = ? AND member_id = ?", [params.id, member.id]);
    if (!row) fail("Teslim kaydı bulunamadı.", 404);
    await db.batch([
      ["UPDATE build_deliveries SET accepted_at = ? WHERE id = ? AND member_id = ? AND accepted_at = 0", [Date.now(), params.id, member.id]],
      ["DELETE FROM push_outbox WHERE member_id = ? AND json_extract(payload, '$.tag') = ?", [member.id, relaxedTag(member.id, row.ends)]],
    ]);
    return json({ ok: true });
  });

  // The member's own tuğla: balance, recent movements, what they have built (the
  // collection) and, with ?session=<end>, the receipt of that session.
  route("GET", "/wallet", async ({ member, url }) => {
    const session = Number(url.searchParams.get("session")) || 0;
    const [me, log, built, receipt, unlocks, discovery] = await db.read([
      ["SELECT bricks, ruin_until AS ruinUntil, ruin_refund AS ruinRefund FROM members WHERE id = ?", [member.id]],
      ["SELECT delta, reason, ref, note, created FROM bricks_log WHERE member_id = ? ORDER BY created DESC, rowid DESC LIMIT 40", [member.id]],
      ["SELECT COALESCE(model, CASE kind WHEN 'tower' THEN 'kule' WHEN 'house' THEN 'ev' ELSE 'kulube' END) AS model, count(*) AS n FROM buildings WHERE member_id = ? GROUP BY 1", [member.id]],
      ["SELECT delta, reason, note, created FROM bricks_log WHERE member_id = ? AND ref = ? ORDER BY rowid", [member.id, sessionRef(member.id, session)]],
      ["SELECT model FROM unlocks WHERE member_id = ?", [member.id]],
      ["SELECT carry,dry FROM blueprint_progress WHERE member_id=?",[member.id]],
    ]);
    return json({
      bricks: me[0]?.bricks || 0,
      ruin: me[0]?.ruinUntil > Date.now() ? { until: me[0].ruinUntil, refund: me[0].ruinRefund } : null,
      log,
      built: Object.fromEntries(built.map((b) => [b.model, b.n])),
      receipt: session ? receipt : [],
      unlocks: unlocks.map((u) => u.model),
      discovery: discoveryStatus(discovery[0],blueprintPool(Date.now()),unlocks.map(u=>u.model)),
    });
  });

  route("GET","/blueprints/rewards",async({member})=>json({items:(await blueprintNotices.pending(member.id)).filter(p=>BY_ID[p.model])}));
  route("POST","/blueprints/rewards/seen",async({member,body})=>{
    await blueprintNotices.seen(member.id,body.memberId,body.models);
    return json({ok:true});
  });

  // The team's rhythm: anyone may set it; the board says who did.
  // The screen-off choice for the next build follows the account (n47): every
  // device shows the same switch. A running session keeps the mode it began with.
  route("POST", "/build-mode", async ({ member: m, body }) => {
    if (typeof body.relaxed !== "boolean") fail("İnşaat şekli geçerli değil.");
    await db.batch([keep(modeKey(m.id), body.relaxed ? "relaxed" : "strict"), bump(m.group_id)]);
    return changed(m);
  });
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
        "SELECT (SELECT count(*) FROM messages WHERE member_id = ? AND kind <> 'system') AS messages, (SELECT count(*) FROM plans WHERE member_id = ?) AS plans, (SELECT count(*) FROM attendees WHERE member_id = ? AND answer='yes') AS joined",
        [id, id, id],
      ],
    ]);
    const now = Date.now(),
      stats = statsOf({ focus, activity, built, ledger, social: social[0], bricks: target.bricks, now });
    // Çalışma eşi: only on your own statistics, over the last 30 days. Nobody
    // sees whom someone else studies best with.
    if (id === m.id) {
      const [team, recent] = await db.read([
        ["SELECT id, name, avatar, color FROM members WHERE group_id = ? ORDER BY joined, id", [m.group_id]],
        ["SELECT f.member_id AS memberId, f.minutes, f.created FROM focus_log f JOIN members m ON m.id = f.member_id WHERE m.group_id = ? AND f.created >= ?", [m.group_id, now - PARTNER_DAYS * DAY]],
      ]);
      const best = partnersOf({ focus: recent, ids: team.map((t) => t.id), min: PARTNER_MIN }).of(id);
      stats.partner = best && { ...best, member: team.find((t) => t.id === best.id) };
    }
    return json(stats);
  });

  // n28: the week's story for the team, and a card only the asker sees. Any of
  // the last eight weeks can be asked for; the default is storyWeek().
  route("GET", "/story", async ({ member: m, url }) => {
    const now = Date.now(),
      latest = storyWeek(now),
      asked = url.searchParams.get("week");
    const start = asked === null ? latest : Number(asked);
    if (!Number.isInteger(start) || start > latest || start < latest - 8 * 7 * DAY || (latest - start) % (7 * DAY))
      fail("Bu haftanın hikâyesi yok.", 404);
    const end = start + 7 * DAY,
      g = m.group_id;
    const [members, focus, previous, arrivals, buildings, history, messages, weekly] = await db.read([
      ["SELECT id FROM members WHERE group_id = ? ORDER BY joined, id", [g]],
      ["SELECT f.member_id AS memberId, f.minutes, f.created FROM focus_log f JOIN members m ON m.id = f.member_id WHERE m.group_id = ? AND f.created >= ? AND f.created < ? ORDER BY f.created", [g, start, end]],
      ["SELECT COALESCE(SUM(f.minutes), 0) AS minutes FROM focus_log f JOIN members m ON m.id = f.member_id WHERE m.group_id = ? AND f.created >= ? AND f.created < ?", [g, start - 7 * DAY, start]],
      ["SELECT a.member_id AS memberId, a.created FROM activity a JOIN members m ON m.id = a.member_id WHERE m.group_id = ? AND a.kind = 'arrive' AND a.created >= ? AND a.created < ?", [g, start, end]],
      ["SELECT member_id AS memberId, COALESCE(model, CASE kind WHEN 'tower' THEN 'kule' WHEN 'house' THEN 'ev' ELSE 'kulube' END) AS model, likes FROM buildings WHERE group_id = ? AND created >= ? AND created < ?", [g, start, end]],
      // Enough history for any streak a week can end on.
      ["SELECT f.member_id AS memberId, f.created FROM focus_log f JOIN members m ON m.id = f.member_id WHERE m.group_id = ? AND f.created >= ? AND f.created < ?", [g, end - 120 * DAY, end]],
      ["SELECT count(*) AS n FROM messages WHERE group_id = ? AND kind <> 'system' AND created >= ? AND created < ?", [g, start, end]],
      ["SELECT kind, member_id AS memberId, minutes FROM weekly WHERE group_id = ? AND week = ?", [g, start]],
    ]);
    const days = new Map();
    for (const h of history) {
      if (!days.has(h.memberId)) days.set(h.memberId, []);
      days.get(h.memberId).push(h.created);
    }
    return json(
      storyOf({
        start,
        now,
        members,
        focus,
        previous: previous[0]?.minutes || 0,
        arrivals,
        buildings,
        days,
        messages: messages[0]?.n || 0,
        master: weekly.find((w) => w.kind === "master" && w.memberId) || null,
        monument: weekly.some((w) => w.kind === "monument"),
        meId: m.id,
      }),
    );
  });

  route("POST", "/push", async ({ request, member, body, ctx }) => {
    const clean = validSubscription(body.subscription);
    const subscription = JSON.stringify(clean);
    // n25: one endpoint carries a row for each account signed in on this
    // device, and never one for an account this device no longer holds.
    const held = (await deviceAccounts(request)).map((a) => a.hash);
    const list = (n) => Array(n).fill("?").join(", ");
    const others = held.filter((h) => h !== member.session_token);
    const statements = [];
    // The browser renewed its subscription: this device's accounts move with it.
    const previous = typeof body.previous === "string" && body.previous.length <= 2000 && body.previous !== clean.endpoint ? body.previous : "";
    if (previous && held.length)
      statements.push(
        [`INSERT OR IGNORE INTO subscriptions (endpoint, member_id, subscription, session_token) SELECT ?, member_id, ?, session_token FROM subscriptions WHERE endpoint = ? AND session_token IN (${list(held.length)})`, [clean.endpoint, subscription, previous, ...held]],
        [`DELETE FROM subscriptions WHERE endpoint = ? AND session_token IN (${list(held.length)})`, [previous, ...held]],
      );
    statements.push(
      [
        "INSERT INTO subscriptions (endpoint, member_id, subscription, session_token) VALUES (?, ?, ?, ?) ON CONFLICT(endpoint, member_id) DO UPDATE SET subscription = excluded.subscription, session_token = excluded.session_token",
        [clean.endpoint, member.id, subscription, member.session_token],
      ],
      [
        `DELETE FROM subscriptions WHERE endpoint = ? AND member_id <> ?${others.length ? ` AND (session_token IS NULL OR session_token NOT IN (${list(others.length)}))` : ""}`,
        [clean.endpoint, member.id, ...others],
      ],
    );
    await db.batch(statements);
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
        [{
          endpoint: clean.endpoint, subscription, member_id: member.id, session_token: member.session_token,
          ...(await db.get("SELECT g.name AS team, (SELECT count(*) FROM subscriptions WHERE endpoint = ?) AS accounts FROM groups g WHERE g.id = ?", [clean.endpoint, member.group_id])),
        }],
        { title: "Bildirimler açık 🔔", body: "Biri kütübe gelince ilk sen duyacaksın.", url: "/", tag: `test-${Date.now()}` },
        "subscriptions",
        { urgency: "high", ttl: 600 },
      );
    return json({ ok: true, test });
  });

  // Hidden badges, from an allowlist. "black-hole": found Batur's door.
  route("POST", "/achievements", async ({ member, body }) => {
    if (!REPORTED.includes(body.key)) fail("Böyle bir rozet yok.");
    limit(`${member.id}:achievement`, 20);
    const result = await db.run(
      "INSERT OR IGNORE INTO achievements (member_id, key, created) VALUES (?, ?, ?)",
      [member.id, body.key, Date.now()],
    );
    if (result.changes === 1) await db.batch([systemMessage(member.group_id, member.id, badgeNews(body.key)), bump(member.group_id)]);
    return json({ ok: true, new: result.changes === 1 });
  });

  // n14: a member's badges, worked out from the logs for anyone in the same
  // team. Newly earned ones are written down, so they stay once earned.
  route("GET", "/achievements/:id", async ({ member: m, params }) => {
    const target = await db.get("SELECT id, group_id FROM members WHERE id = ? AND group_id = ?", [params.id, m.group_id]);
    if (!target) fail("Kişi bulunamadı.", 404);
    const id = target.id;
    const [focus, buildings, ledger, masters, arrivals, messages, stored] = await db.read([
      ["SELECT minutes, created FROM focus_log WHERE member_id = ? ORDER BY created", [id]],
      ["SELECT COALESCE(model, CASE kind WHEN 'tower' THEN 'kule' WHEN 'house' THEN 'ev' ELSE 'kulube' END) AS model, likes, created FROM buildings WHERE member_id = ? AND gift IS NULL ORDER BY created", [id]],
      ["SELECT reason, created FROM bricks_log WHERE member_id = ? AND reason IN ('imece', 'monument') ORDER BY created", [id]],
      ["SELECT created FROM weekly WHERE member_id = ? AND kind = 'master' AND group_id = ? ORDER BY created", [id, target.group_id]],
      ["SELECT created FROM activity WHERE member_id = ? AND kind = 'arrive' ORDER BY created", [id]],
      ["SELECT text, created FROM messages WHERE member_id = ? AND kind = 'message' ORDER BY created", [id]],
      ["SELECT key, created FROM achievements WHERE member_id = ?", [id]],
    ]);
    const list = achievementsOf({ focus, buildings, ledger, masters, arrivals, messages, stored, now: Date.now() });
    const known = new Set(stored.map((s) => s.key));
    const fresh = list.filter((a) => a.at !== null && !known.has(a.key));
    // Pano news for badges earned just now. A pile at once is the past being
    // counted (first look, or a long absence), so that stays quiet.
    const now = Date.now();
    const news = fresh.filter((a) => now - a.at < BADGE_NEWS_WINDOW);
    const announce = news.length <= BADGE_NEWS_MAX ? news : [];
    if (fresh.length)
      await db.batch([
        // Written before the badge row and only while it is missing, so two
        // teammates opening the card at once announce it once.
        ...announce.map((a) => [
          "INSERT INTO messages (id, group_id, member_id, text, kind, created) SELECT ?, ?, ?, ?, 'system', ? WHERE NOT EXISTS (SELECT 1 FROM achievements WHERE member_id = ? AND key = ?)",
          [crypto.randomUUID(), target.group_id, id, badgeNews(a.key), now, id, a.key],
        ]),
        ...fresh.map((a) => ["INSERT OR IGNORE INTO achievements (member_id, key, created) VALUES (?, ?, ?)", [id, a.key, a.at]]),
        ...(announce.length ? [bump(target.group_id)] : []),
      ]);
    return json({ list });
  });

  // Off for this account only; `others` tells the app whether another account
  // on this device still uses the browser subscription (then it is kept).
  route("DELETE", "/push", async ({ request, member, body }) => {
    const endpoint = String(body.endpoint || "");
    await db.run("DELETE FROM subscriptions WHERE member_id = ? AND endpoint = ?", [member.id, endpoint]);
    const held = (await deviceAccounts(request)).map((a) => a.hash);
    const others = held.length
      ? (await db.get(`SELECT count(*) AS n FROM subscriptions WHERE endpoint = ? AND session_token IN (${held.map(() => "?").join(", ")})`, [endpoint, ...held])).n
      : 0;
    return json({ ok: true, others });
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
    const what = { idea: "bir fikir yolladı 💡", bug: "bir hata bildirdi 🐛", hello: "sana iki çift laf etti 💬", build: "yeni bir yapı istedi 🏗️" };
    await notifyOwner(ctx, {
      title: `${member.name} ${what[kind]}`,
      body: value.length > 90 ? `${value.slice(0, 90)}…` : value,
      url: "/batur",
    });
    return json({ id, item: (await requests("f.id = ?", [id], { limit: 1 }))[0] }, 201);
  });

  // The authenticated team is the scope, never a client-supplied project id.
  route("GET", "/imece", async ({ member }) => {
    await snapshot(member.group_id);
    return json(await imece.view(member.id));
  });
  route("POST", "/imece/seen", async ({ member, body }) => {
    await imece.seen(member.id,body.through);
    return json({ok:true});
  });

  // The shared village in compact rows. Unchanged since `rev` → only the number
  // travels. `bbox=x0,y0,x1,y1` limits buildings to an area for very big villages.
  route("GET", "/village", async ({ member, url, request }) => {
    const gid = member.group_id,
      now = Date.now();
    const { rev, layout, minimum } = await db.get("SELECT g.village_rev AS rev, g.active_layout_id AS layout, l.compatibility_version AS minimum FROM groups g LEFT JOIN village_layouts l ON l.id = g.active_layout_id WHERE g.id = ?", [gid]);
    // n46 C: a team on a v2 layout is served only to an app that says it
    // understands one (X-Kutup-Village-Version: 2); an older app is asked to
    // update instead of guessing districts from owners. Every other team gets
    // today's answer below, unchanged, whatever the app says.
    if (layout) {
      const version = Number(request.headers.get("x-kutup-village-version") || url.searchParams.get("v") || 1);
      if (version < (minimum || COMPATIBILITY_VERSION)) return json({ updateRequired: true, contractVersion: 2, error: "Köy yenilendi. Görmek için uygulamayı güncelle." }, 426);
      const answer = await v2Village(db, { groupId: gid, memberId: member.id, layoutId: layout, cursor: url.searchParams.get("cursor"), now });
      if (!answer) fail("Köy düzeni bulunamadı.", 503);
      return json(answer);
    }
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
    const [districts, buildings, liked, ruins, stages, total] = await db.read([
      ["SELECT id, member_id AS memberId, dx, dy, seed FROM districts WHERE group_id = ? ORDER BY created, id", [gid]],
      [
        `SELECT id, member_id AS memberId, kind, model, seed, pos_x AS x, pos_y AS y, facing, minutes, created, likes, touched, patched, gift
         FROM buildings WHERE group_id = ? AND touched > ? AND pos_x IS NOT NULL${range} ORDER BY touched`,
        [gid, since, ...rangeArgs],
      ],
      [
        "SELECT building_id AS id FROM building_likes WHERE member_id = ? AND building_id IN (SELECT id FROM buildings WHERE group_id = ? AND touched > ?)",
        [member.id, gid, since],
      ],
      ["SELECT id, ruin_kind AS kind, ruin_x AS x, ruin_y AS y, ruin_until AS until FROM members WHERE group_id = ? AND ruin_until > ?", [gid, now]],
      ["SELECT count(*) AS n FROM weekly WHERE group_id = ? AND kind = 'monument'", [gid]],
      // n43: Batur can take a building back; a client holding the village sees
      // the count drop and fetches it whole once.
      ["SELECT count(*) AS n FROM buildings WHERE group_id = ? AND pos_x IS NOT NULL", [gid]],
    ]);
    const mine = new Set(liked.map((l) => l.id));
    return json({
      rev,
      partial: !!after,
      until: buildings.reduce((t, b) => Math.max(t, b.touched), after),
      districts: districts.map((d) => [d.id, d.memberId, d.dx, d.dy, d.seed]),
      buildings: buildings.map((b) => [b.id, b.memberId, b.kind, b.seed, b.x, b.y, b.facing, b.minutes, b.created, b.likes, mine.has(b.id) ? 1 : 0, b.model, b.patched ? 1 : 0, b.gift]),
      ruins: ruins.map((r) => [r.id, r.kind, r.x, r.y, r.until]),
      monument: stages[0]?.n || 0,
      total: area ? undefined : total[0].n,
    });
  });

  // Moving one's own building to a free plot in one's own districts (never
  // into someone else's, never into a district that is already full).
  async function spotsFor(member, building) {
    const [districts, inside] = await db.read([
      ["SELECT id, dx AS q, dy AS r, buildings AS n FROM districts WHERE group_id = ? AND member_id = ? ORDER BY created, id", [member.group_id, member.id]],
      [
        "SELECT b.id, b.kind, b.model, b.pos_x AS x, b.pos_y AS y, b.district_id AS districtId FROM buildings b JOIN districts d ON d.id = b.district_id WHERE d.member_id = ? AND b.pos_x IS NOT NULL",
        [member.id],
      ],
    ]);
    const spots = [];
    // A monument keeps its district of its own (n44), and nothing moves into one.
    if (isMonument(building.model)) return spots;
    const monuments = monumentCells(member.group_id, districts.map((d) => [d.q, d.r]), inside);
    for (const d of districts) {
      if (d.id !== building.district_id && d.n >= CAPACITY) continue;
      if (monuments.has(cellKey(d.q, d.r))) continue;
      const others = inside.filter((b) => b.districtId === d.id && b.id !== building.id);
      for (const s of freeSpots(cellLayout(member.group_id, d.q, d.r), others, building.kind, 6, building.model))
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
    // n46 D: in a v2 village the choices are planned on its streets.
    const active = await activeLayout(db, m.group_id);
    if (active) {
      const own = await db.get("SELECT id FROM buildings WHERE id = ? AND member_id = ?", [params.id, m.id]);
      if (!own) fail("Bu bina senin değil ya da bulunamadı.", 404);
      if (config.browserPlanningOnly && active.layout.generator >= 3) return json({ planInBrowser: true, layoutRev: active.rev, spots: [] });
      return json({ spots: moveOptions(active, own.id).map((p) => [p.plot.x, p.plot.y, p.plot.facing]), layoutRev: active.rev });
    }
    const spots = await spotsFor(m, await ownBuilding(m, params.id));
    return json({ spots: spots.map((s) => [s.x, s.y, s.facing]) });
  });
  route("POST", "/buildings/:id/move", async ({ member: m, params, body }) => {
    const building = await ownBuilding(m, params.id);
    // n46 D: in a v2 village a move is planned on its streets, never on the old
    // lattice. The target is checked again on a fresh read; if someone took it
    // meanwhile the building stays where it is.
    if ((await db.get("SELECT active_layout_id AS a FROM groups WHERE id = ?", [m.group_id]))?.a) {
      for (let attempt = 0; ; attempt++) {
        const active = await activeLayout(db, m.group_id);
        const moved = moveStatements(active, building.id, Number(body.x), Number(body.y), body.village, { browserOnly: !!config.browserPlanningOnly });
        if (moved.error === "replan") fail("Taşıma planı yenilenmeli. Köyü yenileyip tekrar yer seç; binan yerinde duruyor.", 409);
        if (moved.error) fail("Bu arsa artık boş değil. Başka birini seç.", 409);
        try {
          await db.batch([...moved.statements, ...contentChange(m.group_id, "building", building.id, "move", moved.plot.id, Date.now()), bumpVillage(m.group_id)]);
          break;
        } catch (error) {
          if (attempt >= 3) throw error;
        }
      }
      return changed(m);
    }
    const spot = (await spotsFor(m, building)).find((s) => Math.abs(s.x - Number(body.x)) < 0.01 && Math.abs(s.y - Number(body.y)) < 0.01);
    if (!spot) fail("Bu arsa artık boş değil. Başka birini seç.");
    await db.batch([
      ...contentChange(m.group_id, "building", building.id, "move", null, Date.now()),
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

  route("GET", "/owner/imece", async ({ request, ip, url }) => {
    await requireOwner(request, ip);
    const groupId=url.searchParams.get("group");
    const project=await imece.view(null,groupId)||await imece.view(null,"unassigned");
    if(project){
      // Finish old sessions before an owner corrects the project's team. Even
      // a legacy worker from another team keeps their exact credited work.
      const due=await db.all("SELECT DISTINCT group_id AS id FROM members WHERE focus_imece_project=? AND focus_imece=1 AND focus_end>0 AND focus_end<=?",[project.id,Date.now()]);
      for(const g of due){await snapshot(g.id);onChange(g.id);}
    }
    return json(await imece.view(null,groupId)||await imece.view(null,"unassigned"));
  }, false);
  // n46 E: the shared Anıtkabir takes its own big plot in a planned (v2) village,
  // in the same batch that opens or moves the project; a lost race plans again.
  const imeceSpatial = (now, sent = null) => async (projectId, groupId) => {
    const from = await db.get("SELECT group_id FROM imece_projects WHERE id = ?", [projectId]);
    const out = [];
    if (from?.group_id && from.group_id !== groupId) out.push(...releaseStatements("imece", "?", [projectId]), ...contentChange(from.group_id, "imece", projectId, "release", null, now), bumpVillage(from.group_id));
    const active = await activeLayout(db, groupId);
    if (!active) return out;
    const placed = placeStatements(active, { subject: { type: "imece", id: projectId }, model: "anitkabir", owner: null, created: now }, sent, { browserOnly: !!config.browserPlanningOnly });
    if (placed.error === "replan") fail("Köy değişti. Komuta merkezini yenileyip projeyi tekrar başlat; katkılar korunuyor.", 409);
    if (placed.error) fail("Köyde ortak Anıtkabir için yeterince büyük bir yer hazırlanamadı. Batur’a haber ver; proje açılmadı.", 409);
    return [...out, ...placed.statements, ...contentChange(groupId, "imece", projectId, "create", null, now), bumpVillage(groupId)];
  };
  const spatialRetry = async (run) => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await run();
      } catch (error) {
        if (error instanceof HttpError || attempt >= 3) throw error;
      }
    }
  };
  // ---------- n46 G: a team's village layout (owner only, plan §8) ----------
  // Drafts are planned in the owner's browser and only checked here; the
  // switch and the way back are one guarded batch each.
  const switchFailed = () => fail("Bu arada köyde bir şey değişti (yeni bina, şantiye ya da başka bir geçiş). Durumu yenileyip tekrar dene.", 409);
  async function switchBatch(statements) {
    try {
      await db.batch(statements);
    } catch (error) {
      if (error instanceof HttpError) throw error;
      switchFailed();
    }
  }
  route("GET", "/owner/village/:groupId", async ({ request, ip, params }) => {
    await requireOwner(request, ip);
    const state = await switchState(db, params.groupId);
    if (!state) fail("Ekip bulunamadı.", 404);
    return json(state);
  }, false);
  // What the owner's browser needs to plan or preview: the inventory and, if asked, a stored layout.
  route("GET", "/owner/village/:groupId/source", async ({ request, ip, params, url }) => {
    await requireOwner(request, ip);
    const inv = await inventory(db, params.groupId);
    if (!inv) fail("Ekip bulunamadı.", 404);
    // "active": the team's live layout, for a gift or the Anıtkabir planned in the owner's browser.
    const asked = url.searchParams.get("layout");
    const id = asked === "active" ? inv.group.active : asked;
    let layout = null,
      layoutRev = null;
    if (id) {
      const row = await db.get("SELECT id FROM village_layouts WHERE id = ? AND group_id = ? AND kind = 'v2'", [id, params.groupId]);
      if (!row) fail("Düzen bulunamadı.", 404);
      const stored = await readLayout(db, id);
      layout = stored.layout;
      layoutRev = stored.row.rev;
    }
    const members = await db.all("SELECT id, name, color, avatar FROM members WHERE group_id = ?", [params.groupId]);
    return json({ seed: `group:${params.groupId}`, contentRev: inv.group.rev, items: inv.items, members, layout, layoutId: id || null, layoutRev });
  }, false);
  route("POST", "/owner/village/:groupId/layouts", async ({ request, ip, params, body }) => {
    await requireOwner(request, ip);
    const role = body.role === "previous" ? "previous" : "draft";
    const inv = await inventory(db, params.groupId);
    if (!inv) fail("Ekip bulunamadı.", 404);
    if (Number(body.contentRev) !== inv.group.rev) switchFailed();
    let base = null,
      until = 0,
      rerail = false;
    if (body.rerail && role === "draft") {
      // n49-2: the live layout with its railway re-laid; checked against the live layout itself.
      if (!inv.group.active) fail("Bu ekip henüz yeni köyde değil.");
      base = (await readLayout(db, inv.group.active)).layout;
      rerail = true;
    } else if (body.base) {
      const row = await db.get("SELECT id, rollback_until AS until FROM village_layouts WHERE id = ? AND group_id = ? AND kind = 'v2' AND status = ?", [String(body.base), params.groupId, role]);
      if (!row) switchFailed();
      base = (await readLayout(db, row.id)).layout;
      until = row.until;
    } else if (role === "previous") fail("Geri dönüş düzeni yalnız eşitlenebilir.");
    const problem = await checkLayout(db, params.groupId, body.layout, { base, items: inv.items, rerail });
    if (problem) fail(problem, 422);
    const id = `v2-${randomHex(8)}`;
    await switchBatch(storeStatements(id, params.groupId, body.layout, { role, contentRev: inv.group.rev, replaces: base && !rerail ? String(body.base) : null, until, now: Date.now() }));
    return json(await switchState(db, params.groupId), 201);
  }, false, true);
  // Every rule of a stored layout, a part per request (a whole village at once is more CPU than a free-plan request has).
  route("POST", "/owner/village/:groupId/layouts/:layoutId/check", async ({ request, ip, params, body }) => {
    await requireOwner(request, ip);
    const part = await checkPart(db, params.groupId, params.layoutId, Number(body.from) || 0);
    if (!part) fail("Düzen bulunamadı.", 404);
    if (part.problem) fail(part.problem, 422);
    if (part.statements) await db.batch(part.statements);
    return json({ checked: part.checked, total: part.total, sound: part.sound });
  }, false);
  route("POST", "/owner/village/:groupId/activate", async ({ request, ip, params, body }) => {
    await requireOwner(request, ip);
    const state = await switchState(db, params.groupId);
    if (!state) fail("Ekip bulunamadı.", 404);
    const draft = state.draft;
    if (!draft || draft.id !== body.draftId) switchFailed();
    if ((state.active.id || null) !== (body.active || null) || state.contentRev !== Number(body.contentRev)) switchFailed();
    if (draft.behind) fail("Taslak geride: önce eşitle.", 409);
    if (!draft.sound) fail("Taslağın kontrolü bitmedi.", 409);
    if (draft.coverage.missing || draft.coverage.extra || draft.coverage.twice) fail("Taslakta eksik ya da fazla yapı var; önce eşitle.", 409);
    await switchBatch([
      ...activateStatements(params.groupId, { draftId: draft.id, active: state.active.id, contentRev: state.contentRev, now: Date.now() }),
      bumpVillage(params.groupId),
      bump(params.groupId),
    ]);
    onChange(params.groupId);
    return json(await switchState(db, params.groupId));
  }, false);
  route("POST", "/owner/village/:groupId/rollback", async ({ request, ip, params, body }) => {
    await requireOwner(request, ip);
    const state = await switchState(db, params.groupId);
    if (!state) fail("Ekip bulunamadı.", 404);
    const back = state.previous;
    if (!state.active.id || !back) fail("Dönülecek bir önceki köy yok.", 409);
    if (!back.open) fail("Geri dönüş süresi doldu.", 409);
    if ((state.active.id || null) !== (body.active || null) || state.contentRev !== Number(body.contentRev)) switchFailed();
    if (back.kind === "v2" && (back.behind || back.coverage.missing || back.coverage.extra || !back.sound)) fail("Önceki köy geride: önce onu eşitle.", 409);
    if (back.kind === "legacy" && back.coverage.missing) fail("Bazı binaların eski köyde yeri henüz yok; biraz sonra tekrar dene.", 409);
    await switchBatch([
      ...rollbackStatements(params.groupId, { previous: back, active: state.active.id, contentRev: state.contentRev, now: Date.now() }),
      bumpVillage(params.groupId),
      bump(params.groupId),
    ]);
    onChange(params.groupId);
    return json(await switchState(db, params.groupId));
  }, false);

  route("POST", "/owner/imece", async ({ request, ip, body, ctx }) => {
    await requireOwner(request, ip);
    const groupId=await spatialRetry(()=>imece.launch(body.members,Date.now(),body.groupId,imeceSpatial(Date.now(),body.village)));
    for (const id of body.members) await notifyMember(ctx, id, {
      title: "Kara: Bir Taş da Senden", body: "Ortak Anıtkabir şantiyesi açıldı. Kişisel görevin seni bekliyor; dördümüzün de emeği olmadan açılış yok.", url: "/?tab=focus&imece=1", tag: "imece-launch",
    }).catch(() => {});
    return json(await imece.view(null,groupId), 201);
  }, false);
  route("POST", "/owner/imece/assign", async ({request,ip,body})=>{
    await requireOwner(request,ip);
    await spatialRetry(()=>imece.assign(body.projectId,body.groupId,body.rev,imeceSpatial(Date.now(),body.village)));
    return json(await imece.view(null,body.groupId));
  },false);
  route("POST", "/owner/imece/crew/:slot", async ({ request, ip, body, params }) => {
    await requireOwner(request, ip);
    await imece.replace(Number(params.slot),body.memberId,body.rev,body.groupId);
    return json(await imece.view(null,body.groupId));
  }, false);

  route("GET", "/owner/groups", async ({ request, ip }) => {
    await requireOwner(request, ip);
    const [groups, members] = await db.read([
      ["SELECT id, name, invite, created, owner_made AS ownerMade FROM groups ORDER BY created DESC", []],
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

  // n45: Batur opens a team from the panel. Nobody is added to it (not even
  // him), no cookie is set. The same request key with the same starting name
  // (a double tap, a retried call) gives back the team it already made, even
  // after a rename; the same key with a different name is refused. The
  // comparison uses the name the team was created with, never its current one.
  route("POST", "/owner/groups", async ({ request, ip, body }) => {
    await requireOwner(request, ip);
    const name = text(body.name, 40, "Ekip adı", 2);
    const key = body.requestKey;
    if (typeof key !== "string" || !/^[A-Za-z0-9_-]{16,64}$/.test(key))
      fail("İstek doğrulanamadı. Sayfayı yenileyip tekrar dene.");
    const id = crypto.randomUUID();
    if (!(await db.get("SELECT 1 AS hit FROM groups WHERE request_key = ?", [key])))
      await db.run(
        "INSERT OR IGNORE INTO groups (id, name, invite, rev, created, owner_made, request_key, request_name) VALUES (?, ?, ?, 0, ?, 1, ?, ?)",
        [id, name, randomToken(18), Date.now(), key, name],
      );
    const group = await db.get(
      "SELECT id, name, invite, created, owner_made AS ownerMade, request_name AS requested FROM groups WHERE request_key = ?",
      [key],
    );
    if (!group) fail("Ekip kurulamadı. Tekrar dene.", 503);
    const { requested, ...team } = group;
    if (requested !== name)
      fail(`Bu istek daha önce “${requested}” adıyla bir ekip kurdu. Pencereyi kapatıp Ekipler listesine bak; yeni bir ekip için formu yeniden aç.`, 409);
    const created = team.id === id;
    return json({ group: { ...team, members: [] }, created }, created ? 201 : 200);
  }, false);

  route("POST", "/owner/groups/:id/name", async ({ request, ip, params, body }) => {
    await requireOwner(request, ip);
    const name = text(body.name, 40, "Ekip adı", 2);
    const result = await db.run("UPDATE groups SET name = ?, rev = rev + 1 WHERE id = ?", [name, params.id]);
    if (!result.changes) fail("Ekip bulunamadı.", 404);
    onChange(params.id);
    return json({ ok: true, name });
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

  // n43 — komuta merkezi. A building as a present: any catalogue building lands
  // finished in the member's village (a spot chosen like any other), plays the
  // delivery replay the next time they open the app, and the board and their
  // phone say who it is from. For friends whose session ended a minute short.
  route("POST", "/owner/members/:id/gift", async ({ request, ip, params, body, ctx }) => {
    await requireOwner(request, ip);
    const item = BY_ID[body.model];
    if (!item) fail("Katalogda böyle bir yapı yok.");
    const member = await db.get("SELECT id, group_id FROM members WHERE id = ?", [params.id]);
    if (!member) fail("Kişi bulunamadı.", 404);
    const note = text(body.note || "", 60, "Not") || "Batur'dan hediye";
    const buildingId = randomHex(16),
      seed = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000,
      minutes = minutesOf(item);
    let now;
    await retrying(async () => {
      now = Date.now();
      const spot = (await loadPlanner(member.group_id)).place(member.id, item.kind, newDistrictId, { model: item.id });
      if (!spot) fail("Köyde bu yapıya yer bulunamadı.", 409);
      // n46 D: a v2 village gives the gift its own plot on a street, like any building.
      const active = await activeLayout(db, member.group_id);
      const placed = active ? placeStatements(active, { subject: { type: "building", id: buildingId }, model: item.id, owner: member.id, created: now }, body.village, { browserOnly: !!config.browserPlanningOnly }) : null;
      if (placed?.error === "replan") fail("Köy değişti. Komuta merkezini yenileyip hediyeyi tekrar gönder; hiçbir şey harcanmadı.", 409);
      if (placed?.error) fail("Köyde bu yapıya yer bulunamadı.", 409);
      return [
        ...(placed?.statements || []),
        ...districtChanges(member.group_id, spot.changes),
        [
          `INSERT INTO buildings (id, member_id, group_id, kind, model, minutes, seed, created, touched, pos_x, pos_y, facing, district_id, gift)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [buildingId, member.id, member.group_id, item.kind, item.id, minutes, seed, now, now, spot.x, spot.y, spot.facing ?? 0, spot.district.id, note],
        ],
        [
          "INSERT INTO build_deliveries (id, member_id, model, kind, seed, minutes, ends, reward, created) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)",
          [buildingId, member.id, item.id, item.kind, seed, minutes, now, now],
        ],
        ["UPDATE districts SET buildings = buildings + 1 WHERE id = ?", [spot.district.id]],
        ...contentChange(member.group_id, "building", buildingId, "create", "gift", now),
        systemMessage(member.group_id, member.id, `Batur'dan hediye aldı: ${item.name} ${item.emoji} 🎁`),
        ledgerRow(member.id, 0, "gift", buildingId, `🎁 ${note}: ${item.name}`, now),
        bumpVillage(member.group_id),
        bump(member.group_id),
      ];
    }, member.group_id);
    onChange(member.group_id);
    await notifyMember(ctx, member.id, {
      title: `Batur sana ${item.name} hediye etti ${item.emoji}`,
      body: note === "Batur'dan hediye" ? "Köyünde bitmiş halde seni bekliyor. Aç, şantiyesini izle 🎁" : `“${note}” · Köyünde seni bekliyor 🎁`,
      url: "/?tab=focus",
    });
    return json({ ok: true, id: buildingId }, 201);
  }, false);

  // A blueprint as a present: a rare building (or a weekly one past its
  // fortnight) opens in the member's catalogue, and they build it themselves.
  route("POST", "/owner/members/:id/unlock", async ({ request, ip, params, body, ctx }) => {
    await requireOwner(request, ip);
    const item = BY_ID[body.model];
    if (!item || !(item.rare === true || item.since)) fail("Bu yapının planı yok; katalogda zaten açık.");
    const member = await db.get("SELECT id, group_id FROM members WHERE id = ?", [params.id]);
    if (!member) fail("Kişi bulunamadı.", 404);
    const now = Date.now();
    const result = await db.run("INSERT OR IGNORE INTO unlocks (member_id, model, source, created) VALUES (?, ?, 'gift', ?)", [member.id, item.id, now]);
    if (!result.changes) fail("Bu plan onda zaten var.", 409);
    await db.batch([
      ledgerRow(member.id, 0, "blueprint", null, `🎁 Batur'dan plan: ${item.name}`, now),
      systemMessage(member.group_id, member.id, `Batur'dan nadir plan aldı: ${item.name} ${item.emoji} 📜`),
      bump(member.group_id),
    ]);
    onChange(member.group_id);
    await notifyMember(ctx, member.id, {
      title: `Batur sana ${item.name} planını verdi 📜`,
      body: "Katalogda açıldı. Bir seansla kendin inşa edebilirsin.",
      url: "/?tab=focus",
    });
    return json({ ok: true }, 201);
  }, false);

  // A member's buildings, newest first, and the blueprints they hold, for the
  // panel (to take a building back, or not to give a plan twice).
  route("GET", "/owner/members/:id/village", async ({ request, ip, params, url }) => {
    await requireOwner(request, ip);
    const [buildings, unlocks] = await db.read([
      [`SELECT id, model, kind, minutes, created, likes, patched, gift FROM buildings WHERE member_id = ?${url.searchParams.get("model")==="anitkabir"?" AND model='anitkabir'":""} ORDER BY created DESC LIMIT 200`, [params.id]],
      ["SELECT model FROM unlocks WHERE member_id = ?", [params.id]],
    ]);
    return json({ buildings, unlocks: unlocks.map((u) => u.model) });
  }, false);

  // Taking a building back (a wrong gift, a bug). Its plot frees up; the
  // member's tuğla and focus minutes are left as they are.
  route("DELETE", "/owner/buildings/:id", async ({ request, ip, params }) => {
    await requireOwner(request, ip);
    const building = await db.get("SELECT id, group_id, district_id FROM buildings WHERE id = ?", [params.id]);
    if (!building) fail("Bina bulunamadı.", 404);
    await db.batch([
      ["DELETE FROM building_likes WHERE building_id = ?", [building.id]],
      ["DELETE FROM build_deliveries WHERE id = ?", [building.id]],
      ...releaseStatements("building", "?", [building.id]),
      ...contentChange(building.group_id, "building", building.id, "delete", "owner", Date.now()),
      ["DELETE FROM buildings WHERE id = ?", [building.id]],
      ["UPDATE districts SET buildings = (SELECT count(*) FROM buildings b WHERE b.district_id = districts.id) WHERE id = ?", [building.district_id]],
      bumpVillage(building.group_id),
      bump(building.group_id),
    ]);
    onChange(building.group_id);
    return json({ ok: true });
  }, false);

  // One line from Batur to a whole team: it stands out on the board, sits on
  // everyone's home page for three days, and reaches every phone. It is
  // written by Batur's own profile in that team (the one wearing ✦).
  route("POST", "/owner/groups/:id/announce", async ({ request, ip, params, body, ctx }) => {
    await requireOwner(request, ip);
    const value = text(body.text, 280, "Duyuru", 2);
    const me = await db.get("SELECT id, group_id FROM members WHERE group_id = ? AND badge = 'dev'", [params.id]);
    if (!me) fail("Önce bu ekipte kendi profilini ✦ ile işaretle; duyuru onun ağzından çıkar.", 409);
    const id = crypto.randomUUID(),
      now = Date.now();
    await db.batch([
      ["INSERT INTO messages (id, group_id, member_id, text, kind, created) VALUES (?, ?, ?, ?, 'announce', ?)", [id, me.group_id, me.id, value, now]],
      ["UPDATE members SET board_seen = ? WHERE id = ? AND board_seen < ?", [now, me.id, now]],
      bump(me.group_id),
    ]);
    onChange(me.group_id);
    await notify(ctx, me.group_id, me.id, { title: "📣 Batur'dan duyuru", body: value, url: "/" });
    return json({ ok: true, id }, 201);
  }, false);

  // Everything, as JSON: a copy Batur can keep. Secrets that open accounts or
  // sessions directly (cookie hashes, one-time codes, push keys) stay out.
  route("GET", "/owner/backup", async ({ request, ip }) => {
    await requireOwner(request, ip);
    const tables = BACKUP_TABLES;
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
    route("POST", "/__test/village-v2", async ({ body }) => {
      // n46 C: puts the named person's team on a v2 layout drawn from its
      // buildings and building sites (the owner panel does this in package G).
      const who = await db.get("SELECT group_id FROM members WHERE name = ?", [body.name]);
      const [buildings, runs, group, projects] = await db.read([
        ["SELECT id, member_id, model, created FROM buildings WHERE group_id = ? ORDER BY created, id", [who.group_id]],
        ["SELECT id, member_id, model, started FROM focus_runs WHERE group_id = ? AND status = 'running' AND mode IN ('strict','relaxed')", [who.group_id]],
        ["SELECT village_content_rev AS rev FROM groups WHERE id = ?", [who.group_id]],
        ["SELECT id, started FROM imece_projects WHERE group_id = ?", [who.group_id]],
      ]);
      const items = [
        ...projects.map((p) => ({ subject: { type: "imece", id: p.id }, model: "anitkabir", owner: null, created: p.started })),
        ...buildings.map((b) => ({ subject: { type: "building", id: b.id }, model: b.model, owner: b.member_id, created: b.created })),
        ...runs.map((r) => ({ subject: { type: "site", id: r.id }, model: r.model, owner: r.member_id, created: r.started })),
      ];
      const { layout, missing } = layoutFrom(`group:${who.group_id}`, items, emptyLayout(`group:${who.group_id}`, body.generator === 2 ? 2 : undefined));
      const id = `v2-${randomHex(8)}`;
      await db.batch([
        ...layoutStatements(id, who.group_id, layout, { status: "active", sourceContentRev: group[0].rev }),
        ["UPDATE groups SET active_layout_id = ? WHERE id = ?", [id, who.group_id]],
        bumpVillage(who.group_id),
      ]);
      return json({ id, layout, missing });
    }, false);

  if (config.testHooks)
    route("POST", "/__test/village-rows", async ({ body }) => {
      const who = await db.get("SELECT id, group_id FROM members WHERE name = ?", [body.name]);
      const [runs, changes, receipts, group, me] = await db.read([
        ["SELECT * FROM focus_runs WHERE group_id = ? ORDER BY started, id", [who.group_id]],
        ["SELECT * FROM village_changes WHERE group_id = ? ORDER BY rev", [who.group_id]],
        ["SELECT scope, key, result_ref FROM request_receipts WHERE actor = ?", [who.id]],
        ["SELECT village_content_rev, active_layout_id FROM groups WHERE id = ?", [who.group_id]],
        ["SELECT focus_run_id, focus_end, bricks FROM members WHERE id = ?", [who.id]],
      ]);
      return json({ runs, changes, receipts, group: group[0], me: me[0] });
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
        if (!(config.testHooks && path.startsWith("/__test/"))) limit(`${ip}:${joining ? "join" : "write"}`, joining ? (config.testHooks ? 30 : 15) : config.testHooks ? 400 : 120);
      }
      const match = routes
        .map((r) => ({ r, m: r.method === method && path.match(r.pattern) }))
        .find((x) => x.m);
      if (!match) fail("Bu işlem bulunamadı.", 404);
      await ensureReady();
      if (!config.publicOrigin && ctx.origin !== knownOrigin && ctx.origin.startsWith("https://")) {
        knownOrigin = ctx.origin;
        ctx.waitUntil(db.run("INSERT INTO settings (key, value) VALUES ('origin', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [ctx.origin]));
      }
      let body = {};
      if (writes) {
        if (match.r.big) await requireOwner(request, ip);
        const raw = await readBody(request, match.r.big ? BIG_BODY : 16384);
        if (!match.r.big && raw.length > 12000) fail("İstek çok büyük.", 413);
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
    await meetups.tick({origin:config.publicOrigin||knownOrigin||"https://kutup.app",waitUntil}).catch(()=>console.error("Kütüp plan reminders: retry deferred."));
    await relaxedNotices({ origin: config.publicOrigin || knownOrigin || "https://kutup.app", waitUntil }).catch(() => console.error("Kütüp relaxed build notifications: retry deferred."));
    const groups = await db.all("SELECT id, rhythm, rhythm_at AS at FROM groups WHERE rhythm IS NOT NULL AND rhythm <> ''");
    for (const g of groups) {
      const r = rhythmAt(g.rhythm, now);
      if (!r) continue;
      const boundary = r.inBreak ? r.workEnd : r.roundStart;
      if (now - boundary > 90000 || g.at >= boundary) continue;
      const won = await db.run("UPDATE groups SET rhythm_at = ? WHERE id = ? AND rhythm_at < ?", [boundary, g.id, boundary]);
      if (!won?.changes) continue;
      const subs = await db.all(
        `SELECT ${pushColumns} FROM subscriptions s JOIN members m ON m.id = s.member_id JOIN groups g ON g.id = m.group_id
         JOIN sessions a ON a.token = s.session_token AND a.member_id = m.id
         WHERE m.group_id = ? AND m.status IN ('here', 'break') AND m.status_until > ? AND a.created > ?`,
        [g.id, now, now - SESSION_AGE],
      );
      const message = r.inBreak
        ? { title: "☕ Ortak mola!", body: `${r.rest} dakika: kahve, su, biraz hava. İnşaatlar bekliyor.` }
        : { title: "📚 Yeni tur başladı", body: `${r.work} dakika birlikte. Masaya dönüyoruz.` };
      await deliver({ origin: config.publicOrigin || knownOrigin || "https://kutup.app", waitUntil }, subs, { tag: `rhythm-${g.id}`, url: "/", ...message }, "subscriptions", { urgency: "high", ttl: 600 });
    }
    // n28: Sunday 18:00, the week's story is ready. Each team that focused this
    // week hears it once (the weekly 'story' row is the guard), whoever ticks first.
    const week = weekStart(now);
    if (now < week + 6 * DAY + 18 * HOUR) return;
    const teams = await db.all(
      `SELECT m.group_id AS id, SUM(f.minutes) AS minutes FROM focus_log f JOIN members m ON m.id = f.member_id
       WHERE f.created >= ? AND NOT EXISTS (SELECT 1 FROM weekly w WHERE w.group_id = m.group_id AND w.week = ? AND w.kind = 'story')
       GROUP BY m.group_id`,
      [week, week],
    );
    for (const t of teams) {
      const won = await db.run("INSERT OR IGNORE INTO weekly (group_id, week, kind, member_id, minutes, created) VALUES (?, ?, 'story', NULL, ?, ?)", [t.id, week, t.minutes, now]);
      if (!won?.changes) continue;
      const subs = await db.all(
        `SELECT ${pushColumns} FROM subscriptions s JOIN members m ON m.id = s.member_id JOIN groups g ON g.id = m.group_id
         JOIN sessions a ON a.token = s.session_token AND a.member_id = m.id WHERE m.group_id = ? AND a.created > ?`,
        [t.id, now - SESSION_AGE],
      );
      const hours = Math.round((t.minutes / 60) * 10) / 10;
      await deliver(
        { origin: config.publicOrigin || "https://kutup.app", waitUntil },
        subs,
        { tag: `story-${t.id}-${week}`, url: "/?story=1", title: "📖 Haftanın hikâyesi hazır", body: `Ekipçe ${String(hours).replace(".", ",")} saat odak. Kim öne geçti, köyde neler yükseldi? Dokun, birlikte bakalım.` },
        "subscriptions",
        { ttl: 12 * 3600 },
      );
    }
  }

  return { fetch: handle, authenticate, snapshot, ready: ensureReady, drainPushOutbox, tick, live };
}
