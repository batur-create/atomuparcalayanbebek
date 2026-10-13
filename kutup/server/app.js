// Kütüp API as a Fetch handler. It only uses Web-standard APIs (Request, Response,
// crypto.subtle) and an async database adapter, so the exact same code serves the
// Node build (node:sqlite + SSE) and the Cloudflare Worker / ChatGPT Sites build (D1).
import { migrate } from "./schema.js";
import { generateVapidKeys, sendPush } from "./push.js";

export const AVATARS = [
  "🪐", "🌱", "🐈", "🌻", "🧋", "🍒", "🎧", "📚", "🦊", "🪼", "🍄", "🦋",
  "🐻", "🐼", "🦄", "🌙", "⭐", "🍓", "🌸", "🐸", "🧸", "🍵", "🎨", "🐝",
];
export const COLORS = ["lilac", "mint", "peach", "blue", "pink", "lemon"];
const STATUSES = ["here", "coming", "break", "away"];
const HOUR = 3600000;
const DAY = 24 * HOUR;
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
const TRANSFER_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

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
function profile(body) {
  return {
    name: text(body.name, 24, "İsim", 2),
    avatar: AVATARS.includes(body.avatar) ? body.avatar : "🪐",
    color: COLORS.includes(body.color) ? body.color : "lilac",
    note: text(body.note || "", 70, "Masa notu"),
  };
}
const sameName = (a, b) =>
  a.toLocaleLowerCase("tr") === b.toLocaleLowerCase("tr");

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
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
    if (bucket.count > max)
      fail("Biraz hızlı gittik. Bir dakika sonra tekrar dene.", 429);
  }

  // ---------- session ----------
  function cookieToken(request) {
    const cookie = request.headers.get("cookie") || "";
    for (const part of cookie.split(";")) {
      const [name, ...rest] = part.trim().split("=");
      if (name === "kutup_session") return rest.join("=");
    }
    return "";
  }
  function sessionCookie(request, token, maxAge = 365 * 24 * 3600) {
    const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
    return `kutup_session=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
  }
  async function authenticate(request) {
    await ensureReady();
    const token = cookieToken(request);
    if (!token || token.length > 128) return null;
    return db.get(
      `SELECT m.*, g.rev AS group_rev, s.token AS session_token, s.seen AS session_seen
       FROM sessions s JOIN members m ON m.id = s.member_id JOIN groups g ON g.id = m.group_id
       WHERE s.token = ?`,
      [await sha(token)],
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
  const systemMessage = (groupId, memberId, value) => [
    "INSERT INTO messages (id, group_id, member_id, text, kind, created) VALUES (?, ?, ?, ?, 'system', ?)",
    [crypto.randomUUID(), groupId, memberId, value, Date.now()],
  ];

  // ---------- state ----------
  const memberColumns =
    "id, name, avatar, color, note, status, location, desk, arrival, since, status_until, focus_end AS focusEnd, focus_minutes AS focusMinutes, updated";
  async function readSnapshot(groupId, now) {
    const [groups, members, focus, messages, reactions, plans, attendees] =
      await db.read([
        ["SELECT id, name, invite, rev FROM groups WHERE id = ?", [groupId]],
        [`SELECT ${memberColumns} FROM members WHERE group_id = ? ORDER BY joined`, [groupId]],
        [
          `SELECT f.member_id AS id, SUM(CASE WHEN f.created >= ? THEN f.minutes ELSE 0 END) AS today, SUM(f.minutes) AS week
           FROM focus_log f JOIN members m ON m.id = f.member_id
           WHERE m.group_id = ? AND f.created >= ? GROUP BY f.member_id`,
          [dayStart(now), groupId, weekStart(now)],
        ],
        [
          `SELECT * FROM (SELECT id, member_id AS memberId, text, kind, created FROM messages WHERE group_id = ? AND kind <> 'system' ORDER BY created DESC LIMIT ${MESSAGE_LIMIT})
           UNION ALL
           SELECT * FROM (SELECT id, member_id AS memberId, text, kind, created FROM messages WHERE group_id = ? AND kind = 'system' ORDER BY created DESC LIMIT ${ACTIVITY_LIMIT})`,
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
      ]);
    const group = groups[0];
    if (!group) return null;
    const totals = new Map(focus.map((f) => [f.id, f]));
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
    return {
      group,
      expiredFocus: members.some((m) => m.focusEnd > 0 && m.focusEnd <= now),
      members: members.map(({ status_until, ...m }) => {
        const expired = m.status !== "away" && status_until < now;
        return {
          ...m,
          status: expired ? "away" : m.status,
          since: expired ? 0 : m.since,
          focusToday: totals.get(m.id)?.today || 0,
          focusWeek: totals.get(m.id)?.week || 0,
        };
      }),
      messages: messages
        .sort((a, b) => a.created - b.created)
        .map((m) => ({ ...m, reactions: hearts.get(m.id) || [] })),
      plans: plans.map((p) => ({ ...p, attendees: going.get(p.id) || [] })),
    };
  }
  // Completed focus sessions are credited by whoever reads the state next, so
  // minutes count even if the owner closed the tab. The conditional SQL makes it
  // safe to run concurrently: only one transaction can move a session to the log.
  const finalizeFocus = (groupId, now, memberId) => {
    const scope = memberId ? "id = ?" : "group_id = ?";
    const key = memberId || groupId;
    return [
      [
        `INSERT INTO focus_log (id, member_id, minutes, created)
         SELECT lower(hex(randomblob(16))), id, focus_minutes, focus_end FROM members
         WHERE ${scope} AND focus_end > 0 AND focus_end <= ? AND focus_minutes > 0`,
        [key, now],
      ],
      [
        `UPDATE members SET focus_end = 0, focus_minutes = 0 WHERE ${scope} AND focus_end > 0 AND focus_end <= ?`,
        [key, now],
      ],
      bump(groupId),
    ];
  };
  async function snapshot(groupId) {
    const now = Date.now();
    let state = await readSnapshot(groupId, now);
    if (state?.expiredFocus) {
      await db.batch(finalizeFocus(groupId, now));
      state = await readSnapshot(groupId, now);
    }
    if (!state) return null;
    delete state.expiredFocus;
    return { ...state, serverTime: now };
  }

  // ---------- push ----------
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
  async function notify(ctx, groupId, senderId, message) {
    const subs = await db.all(
      "SELECT s.endpoint, s.subscription FROM subscriptions s JOIN members m ON m.id = s.member_id WHERE m.group_id = ? AND m.id <> ?",
      [groupId, senderId],
    );
    if (!subs.length) return;
    const subject = config.vapidSubject || ctx.origin;
    const payload = JSON.stringify({ tag: `${senderId}-${Date.now()}`, ...message });
    ctx.waitUntil(
      Promise.allSettled(
        subs.map(async (sub) => {
          try {
            const subscription = JSON.parse(sub.subscription);
            if (!pushAllowed(subscription.endpoint)) return;
            const status = await sendPush(subscription, payload, { keys: vapid, subject });
            if (status === 404 || status === 410)
              await db.run("DELETE FROM subscriptions WHERE endpoint = ?", [sub.endpoint]);
          } catch {
            // A dead push service must never break the request.
          }
        }),
      ),
    );
  }

  // ---------- owner ----------
  async function ownerAuthorized(request, ip) {
    limit(`${ip}:owner`, 30);
    const key = request.headers.get("x-owner-key") || "";
    if (!key) return false;
    if (config.adminKey) return sameSecret(key, config.adminKey);
    const stored = await db.get("SELECT value FROM settings WHERE key = 'owner-hash'");
    return !!stored && (await sameSecret(await sha(key), stored.value));
  }
  async function requireOwner(request, ip) {
    if (!(await ownerAuthorized(request, ip)))
      fail("Bu anahtar Batur’un kutusunu açmıyor.", 401);
  }
  function deleteMember(member) {
    const id = member.id;
    return [
      ["DELETE FROM reactions WHERE member_id = ? OR message_id IN (SELECT id FROM messages WHERE member_id = ?)", [id, id]],
      ["DELETE FROM attendees WHERE member_id = ? OR plan_id IN (SELECT id FROM plans WHERE member_id = ?)", [id, id]],
      ["DELETE FROM plans WHERE member_id = ?", [id]],
      ["DELETE FROM messages WHERE member_id = ?", [id]],
      ["DELETE FROM focus_log WHERE member_id = ?", [id]],
      ["DELETE FROM subscriptions WHERE member_id = ?", [id]],
      ["DELETE FROM feedback WHERE member_id = ?", [id]],
      ["DELETE FROM sessions WHERE member_id = ?", [id]],
      ["DELETE FROM members WHERE id = ?", [id]],
      [
        "DELETE FROM groups WHERE id = ? AND NOT EXISTS (SELECT 1 FROM members WHERE group_id = ?)",
        [member.group_id, member.group_id],
      ],
      bump(member.group_id),
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
    const existing = await db.all("SELECT name FROM members WHERE group_id = ?", [group.id]);
    if (existing.length >= 80) fail("Bu ekip 80 kişiye ulaştı. Yeni bir ekip kurabilirsiniz.");
    if (existing.some((m) => sameName(m.name, p.name)))
      fail(
        "Bu isim ekipte zaten var. Sen misin? Eski cihazında “Benim köşem → Başka cihazda aç” ile kod alıp gir.",
        409,
      );
    const id = crypto.randomUUID(),
      now = Date.now(),
      session = await newSession(id);
    await db.batch([
      ...extraStatements,
      [
        "INSERT INTO members (id, group_id, token, name, avatar, color, note, joined, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id, group.id, session.hash, p.name, p.avatar, p.color, p.note, now, now],
      ],
      session.statement,
      systemMessage(group.id, id, "ekibe katıldı. Hoş geldin! ✨"),
      bump(group.id),
    ]);
    onChange(group.id);
    return json(
      { memberId: id, live, pushPublicKey: vapid.publicKey, ...(await snapshot(group.id)) },
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

  route("POST", "/transfer/claim", async ({ request, body }) => {
    const code = text(body.code, 20, "Kod", 8).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length !== 8) fail("Kod 8 karakter olmalı.");
    const member = await db.get(
      "SELECT id, group_id, name FROM members WHERE transfer_hash = ? AND transfer_until > ?",
      [await sha(code), Date.now()],
    );
    if (!member) fail("Bu kod geçersiz ya da süresi dolmuş. Diğer cihazdan yeni kod al.", 404);
    const session = await newSession(member.id);
    await db.batch([
      session.statement,
      ["UPDATE members SET transfer_hash = NULL, transfer_until = 0 WHERE id = ?", [member.id]],
    ]);
    return json(
      { memberId: member.id, live, pushPublicKey: vapid.publicKey, ...(await snapshot(member.group_id)) },
      200,
      { "Set-Cookie": sessionCookie(request, session.token) },
    );
  }, false);

  route("GET", "/session", async ({ member }) => {
    if (Date.now() - member.session_seen > HOUR)
      await db.run("UPDATE sessions SET seen = ? WHERE token = ?", [Date.now(), member.session_token]);
    return json({
      memberId: member.id,
      live,
      pushPublicKey: vapid.publicKey,
      ...(await snapshot(member.group_id)),
    });
  });

  // Cheap polling: when nothing changed since `rev`, only the revision travels.
  route("GET", "/state", async ({ member, url }) => {
    const known = url.searchParams.get("rev");
    if (known !== null && Number(known) === member.group_rev) {
      const due = await db.get(
        "SELECT 1 AS due FROM members WHERE group_id = ? AND focus_end > 0 AND focus_end <= ? LIMIT 1",
        [member.group_id, Date.now()],
      );
      if (!due) return json({ unchanged: true, rev: member.group_rev });
    }
    return json(await snapshot(member.group_id));
  });

  route("POST", "/profile", async ({ member, body }) => {
    const p = profile(body);
    const names = await db.all("SELECT name FROM members WHERE group_id = ? AND id <> ?", [
      member.group_id,
      member.id,
    ]);
    if (names.some((x) => sameName(x.name, p.name))) fail("Bu isim ekipte zaten var.", 409);
    await db.batch([
      [
        "UPDATE members SET name = ?, avatar = ?, color = ?, note = ?, updated = ? WHERE id = ?",
        [p.name, p.avatar, p.color, p.note, Date.now(), member.id],
      ],
      bump(member.group_id),
    ]);
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
    const previous = m.status_until < now ? "away" : m.status;
    const statements = [
      [
        "UPDATE members SET status = ?, location = ?, desk = ?, arrival = ?, status_until = ?, since = ?, updated = ? WHERE id = ?",
        [
          status,
          location,
          desk,
          arrival,
          status === "away" ? 0 : now + 8 * HOUR,
          status === "away" ? 0 : previous === status ? m.since || now : now,
          now,
          m.id,
        ],
      ],
      bump(m.group_id),
    ];
    let push = null;
    if (previous !== status) {
      const phrases = {
        here: `kütübe geldi${location ? ` · ${location}` : ""}. Bir sandalye çek! 🪑`,
        coming: `yola koyuldu · ${arrival} 🛵`,
        break: "molaya çıktı. Kahveye eşlik eden? ☕",
        away: "bugünlük paydos etti. Görüşürüz! 👋",
      };
      statements.push(systemMessage(m.group_id, m.id, phrases[status]));
      // One arrival ping per person per 45 minutes, even if they flip statuses.
      const cooling = m.pushed_kind === status && now - m.pushed_at < PUSH_COOLDOWN;
      if ((status === "here" || status === "break") && !cooling) {
        statements.push([
          "UPDATE members SET pushed_kind = ?, pushed_at = ? WHERE id = ?",
          [status, now, m.id],
        ]);
        push =
          status === "here"
            ? {
                title: `${m.name} kütüpte! 📚`,
                body: `${location || "Milli Kütüphane"}${desk ? ` · Masa ${desk}` : ""}`,
                url: "/",
              }
            : { title: `${m.name} molada ☕`, body: "Bir kahvelik ara verelim mi?", url: "/?tab=board" };
      }
    }
    await db.batch(statements);
    if (push) await notify(ctx, m.group_id, m.id, push);
    return changed(m);
  });

  route("POST", "/messages", async ({ member: m, body, ctx }) => {
    const value = text(body.text, 280, "Mesaj", 1);
    const kind = body.kind === "coffee" ? "coffee" : "message";
    const id = crypto.randomUUID();
    await db.batch([
      [
        "INSERT INTO messages (id, group_id, member_id, text, kind, created) VALUES (?, ?, ?, ?, ?, ?)",
        [id, m.group_id, m.id, value, kind, Date.now()],
      ],
      bump(m.group_id),
    ]);
    if (kind === "coffee")
      await notify(ctx, m.group_id, m.id, { title: `${m.name}: mola? ☕`, body: value, url: "/?tab=board" });
    return changed(m, { id }, 201);
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

  route("POST", "/focus", async ({ member: m, body }) => {
    const action = body.action,
      now = Date.now();
    if (action === "finish") {
      const before = await db.get("SELECT focus_minutes AS minutes FROM members WHERE id = ? AND focus_end > 0 AND focus_end <= ?", [m.id, now]);
      if (before) await db.batch(finalizeFocus(m.group_id, now, m.id));
      return changed(m, { credited: before?.minutes || 0 });
    }
    if (action === "cancel") {
      await db.batch([
        ["UPDATE members SET focus_end = 0, focus_minutes = 0 WHERE id = ?", [m.id]],
        bump(m.group_id),
      ]);
      return changed(m);
    }
    if (action !== "start") fail("Geçersiz odak işlemi.");
    if (m.focus_end > now) fail("Önce mevcut odak oturumunu tamamla veya durdur.");
    let minutes = Number(body.minutes),
      end;
    if (body.joinMember) {
      const other = await db.get("SELECT focus_end FROM members WHERE id = ? AND group_id = ?", [
        String(body.joinMember),
        m.group_id,
      ]);
      if (!other || other.focus_end < now + 60000)
        fail("Bu odak oturumu sona ermek üzere. Yeni oturum başlat.");
      end = other.focus_end;
      minutes = Math.floor((end - now) / 60000);
    } else {
      if (![25, 45, 50].includes(minutes)) fail("25, 45 veya 50 dakika seç.");
      end = now + minutes * 60000;
    }
    await db.batch([
      // An expired, uncredited session is credited before the new one starts.
      ...finalizeFocus(m.group_id, now, m.id),
      ["UPDATE members SET focus_end = ?, focus_minutes = ? WHERE id = ?", [end, minutes, m.id]],
    ]);
    return changed(m);
  });

  route("POST", "/push", async ({ member, body }) => {
    const sub = body.subscription;
    if (
      !sub ||
      typeof sub.endpoint !== "string" ||
      !sub.keys ||
      typeof sub.keys.p256dh !== "string" ||
      typeof sub.keys.auth !== "string"
    )
      fail("Bildirim aboneliği geçerli değil.");
    if (sub.endpoint.length > 2000 || sub.keys.p256dh.length > 256 || sub.keys.auth.length > 128)
      fail("Bildirim aboneliği geçerli değil.");
    if (!pushAllowed(sub.endpoint)) fail("Bu bildirim sağlayıcısı desteklenmiyor.");
    const clean = { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } };
    await db.run(
      "INSERT INTO subscriptions (endpoint, member_id, subscription) VALUES (?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET member_id = excluded.member_id, subscription = excluded.subscription",
      [sub.endpoint, member.id, JSON.stringify(clean)],
    );
    return json({ ok: true });
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

  route("POST", "/feedback", async ({ member, body }) => {
    const kind = body.kind;
    if (!["idea", "bug", "hello"].includes(kind)) fail("Bir mesaj türü seç.");
    const value = text(body.text, 1200, "Mesaj", 5),
      id = crypto.randomUUID();
    const recent = await db.get(
      "SELECT count(*) AS n FROM feedback WHERE member_id = ? AND created > ?",
      [member.id, Date.now() - HOUR],
    );
    if (recent.n >= 8) fail("Mesajların ulaştı! Yeni bir not için biraz bekle.", 429);
    await db.run(
      "INSERT INTO feedback (id, member_id, kind, text, status, created) VALUES (?, ?, ?, ?, 'new', ?)",
      [id, member.id, kind, value, Date.now()],
    );
    return json({ id }, 201);
  });

  route("GET", "/feedback", async ({ member }) =>
    json(
      await db.all(
        "SELECT id, kind, text, status, created FROM feedback WHERE member_id = ? ORDER BY created DESC LIMIT 30",
        [member.id],
      ),
    ),
  );

  // Batur's box. Protected by ADMIN_KEY, or — when the host has no secret set —
  // by a key Batur chooses on the first visit to /batur.
  route("GET", "/owner/status", async () => {
    if (config.adminKey) return json({ claimed: true });
    return json({ claimed: !!(await db.get("SELECT 1 AS hit FROM settings WHERE key = 'owner-hash'")) });
  }, false);

  route("POST", "/owner/claim", async ({ body, ip }) => {
    limit(`${ip}:owner`, 30);
    if (config.adminKey) fail("Bu kutunun anahtarı yayın ayarlarında tanımlı.", 409);
    const key = text(body.key, 200, "Anahtar", 12);
    const result = await db.run(
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('owner-hash', ?)",
      [await sha(key)],
    );
    if (!result.changes) fail("Bu kutunun zaten bir sahibi var.", 409);
    return json({ ok: true }, 201);
  }, false);

  route("GET", "/owner/feedback", async ({ request, ip }) => {
    await requireOwner(request, ip);
    return json(
      await db.all(
        "SELECT f.id, f.kind, f.text, f.status, f.created, m.name, m.avatar, m.color, g.name AS group_name FROM feedback f JOIN members m ON m.id = f.member_id JOIN groups g ON g.id = m.group_id ORDER BY f.created DESC LIMIT 500",
      ),
    );
  }, false);

  route("POST", "/owner/feedback/:id", async ({ request, ip, params, body }) => {
    await requireOwner(request, ip);
    if (!["new", "planned", "done"].includes(body.status)) fail("Geçersiz durum.");
    await db.run("UPDATE feedback SET status = ? WHERE id = ?", [body.status, params.id]);
    return json({ ok: true });
  }, false);

  route("GET", "/owner/groups", async ({ request, ip }) => {
    await requireOwner(request, ip);
    const [groups, members] = await db.read([
      ["SELECT id, name, invite, created FROM groups ORDER BY created DESC", []],
      [
        "SELECT m.id, m.group_id AS groupId, m.name, m.avatar, m.color, m.status, m.status_until AS statusUntil, m.joined, MAX(s.seen) AS seen FROM members m LEFT JOIN sessions s ON s.member_id = m.id GROUP BY m.id ORDER BY m.joined",
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
      await db.run(
        "UPDATE members SET focus_end = CASE WHEN focus_end > 0 THEN ? ELSE 0 END, status_until = 0 WHERE name = ?",
        [Date.now() - 1000, body.name],
      );
      return json({ ok: true });
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
        if (origin && origin !== "null") {
          let allowed;
          try {
            allowed = new URL(origin).origin === new URL(config.publicOrigin || url.origin).origin;
          } catch {
            allowed = false;
          }
          if (!allowed) fail("Bu kaynaktan işlem yapılamaz.", 403);
        }
        const joining = /^\/(groups|join|transfer\/claim|owner\/claim)$/.test(path);
        limit(`${ip}:${joining ? "join" : "write"}`, joining ? 15 : 120);
      }
      const match = routes
        .map((r) => ({ r, m: r.method === method && path.match(r.pattern) }))
        .find((x) => x.m);
      if (!match) fail("Bu işlem bulunamadı.", 404);
      await ensureReady();
      let body = {};
      if (writes) {
        const raw = await request.text();
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
      const params = Object.fromEntries(
        match.r.keys.map((key, i) => [key, decodeURIComponent(match.m[i + 1])]),
      );
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

  return { fetch: handle, authenticate, snapshot, ready: ensureReady, live };
}
