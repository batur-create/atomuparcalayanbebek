import express from "express";
import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  randomUUID,
  createHash,
  timingSafeEqual,
} from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import webpush from "web-push";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = resolve(process.env.DATA_DIR || resolve(root, "data"));
mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(resolve(dataDir, "kutup.sqlite"));
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS groups (id TEXT PRIMARY KEY, name TEXT NOT NULL, invite TEXT UNIQUE NOT NULL);
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id), token TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL, avatar TEXT NOT NULL, color TEXT NOT NULL, note TEXT DEFAULT '',
    status TEXT DEFAULT 'away', location TEXT DEFAULT '', desk TEXT DEFAULT '', arrival TEXT,
    status_until INTEGER DEFAULT 0, focus_end INTEGER DEFAULT 0, focus_minutes INTEGER DEFAULT 0,
    joined INTEGER NOT NULL, updated INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id), member_id TEXT NOT NULL REFERENCES members(id), text TEXT NOT NULL, kind TEXT DEFAULT 'message', created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS reactions (message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE, member_id TEXT NOT NULL REFERENCES members(id), PRIMARY KEY(message_id, member_id));
  CREATE TABLE IF NOT EXISTS plans (id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES groups(id), member_id TEXT NOT NULL REFERENCES members(id), starts INTEGER NOT NULL, note TEXT DEFAULT '');
  CREATE TABLE IF NOT EXISTS attendees (plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE, member_id TEXT NOT NULL REFERENCES members(id), PRIMARY KEY(plan_id, member_id));
  CREATE TABLE IF NOT EXISTS focus_log (id TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id), minutes INTEGER NOT NULL, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS subscriptions (endpoint TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id), subscription TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS feedback (id TEXT PRIMARY KEY, member_id TEXT NOT NULL REFERENCES members(id), kind TEXT NOT NULL, text TEXT NOT NULL, status TEXT DEFAULT 'new', created INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS members_group ON members(group_id);
  CREATE INDEX IF NOT EXISTS messages_group ON messages(group_id, created);
  CREATE INDEX IF NOT EXISTS plans_group ON plans(group_id, starts);
`);
let keys = db.prepare("SELECT value FROM settings WHERE key = ?").get("vapid");
if (!keys) {
  const generated = webpush.generateVAPIDKeys();
  db.prepare("INSERT INTO settings VALUES (?, ?)").run(
    "vapid",
    JSON.stringify(generated),
  );
  keys = { value: JSON.stringify(generated) };
}
const vapid = JSON.parse(keys.value);
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "https://kutup.app",
  vapid.publicKey,
  vapid.privateKey,
);
let ownerKey = process.env.ADMIN_KEY;
if (!ownerKey) {
  let stored = db
    .prepare("SELECT value FROM settings WHERE key=?")
    .get("owner-key");
  if (!stored) {
    stored = { value: randomBytes(32).toString("base64url") };
    db.prepare("INSERT INTO settings VALUES (?,?)").run(
      "owner-key",
      stored.value,
    );
  }
  ownerKey = stored.value;
  const keyPath = resolve(dataDir, "batur-key.txt");
  if (!existsSync(keyPath))
    writeFileSync(keyPath, ownerKey + "\n", { mode: 0o600 });
}

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "12kb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  if (req.path.startsWith("/api")) res.setHeader("Cache-Control", "no-store");
  next();
});
const buckets = new Map();
app.use("/api", (req, res, next) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    if (req.headers["x-kutup"] !== "1")
      return res
        .status(403)
        .json({ error: "İstek doğrulanamadı. Sayfayı yenile." });
    if (req.headers.origin) {
      try {
        const allowed =
          process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get("host")}`;
        if (new URL(req.headers.origin).origin !== new URL(allowed).origin)
          return res
            .status(403)
            .json({ error: "Bu kaynaktan işlem yapılamaz." });
      } catch {
        return res.status(403).json({ error: "Geçersiz kaynak." });
      }
    }
    const key = `${req.ip}:${/\/groups$|\/join$/.test(req.path) ? "join" : "write"}`;
    const now = Date.now();
    const limit = key.endsWith("join") ? 15 : 100;
    const bucket = buckets.get(key) || { start: now, count: 0 };
    if (now - bucket.start > 60000) {
      bucket.start = now;
      bucket.count = 0;
    }
    bucket.count++;
    buckets.set(key, bucket);
    if (bucket.count > limit)
      return res
        .status(429)
        .json({ error: "Biraz hızlı gittik. Bir dakika sonra tekrar dene." });
  }
  next();
});
setInterval(() => {
  for (const [key, value] of buckets)
    if (Date.now() - value.start > 120000) buckets.delete(key);
}, 60000).unref();

const sha = (token) => createHash("sha256").update(token).digest("hex");
const memberColumns =
  "id, name, avatar, color, note, status, location, desk, arrival, focus_end AS focusEnd, focus_minutes AS focusMinutes, updated";
const clients = new Map();
const colors = ["lilac", "mint", "peach", "blue", "pink", "lemon"];
const avatars = [
  "🪐",
  "🌱",
  "🐈",
  "🌻",
  "🧋",
  "🍒",
  "🎧",
  "📚",
  "🦊",
  "🪼",
  "🍄",
  "🦋",
];
const fail = (message, status = 400) => {
  const e = new Error(message);
  e.status = status;
  throw e;
};
function text(value, max, label, min = 0) {
  if (typeof value !== "string") fail(`${label} geçerli değil.`);
  const clean = value.trim();
  if (clean.length < min || clean.length > max)
    fail(`${label} ${min || 1}–${max} karakter olmalı.`);
  return clean;
}
function profile(body) {
  return {
    name: text(body.name, 24, "İsim", 2),
    avatar: avatars.includes(body.avatar) ? body.avatar : "🪐",
    color: colors.includes(body.color) ? body.color : "lilac",
    note: text(body.note || "", 70, "Masa notu"),
  };
}
function authenticate(req, res, next) {
  const token = req.headers.cookie
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("kutup_session="))
    ?.slice(14);
  const member =
    token &&
    db.prepare("SELECT * FROM members WHERE token = ?").get(sha(token));
  if (!member)
    return res.status(401).json({ error: "Ekibine katılmak için giriş yap." });
  req.member = member;
  next();
}
function setCookie(res, req, token) {
  res.cookie("kutup_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: req.secure,
    maxAge: 365 * 24 * 3600000,
    path: "/",
  });
}
function addMember(req, res, group, p) {
  const existing = db
    .prepare("SELECT name FROM members WHERE group_id = ?")
    .all(group.id);
  if (existing.length >= 80)
    fail("Bu ekip 80 kişiye ulaştı. Yeni bir ekip kurabilirsiniz.");
  if (
    existing.some(
      (m) => m.name.toLocaleLowerCase("tr") === p.name.toLocaleLowerCase("tr"),
    )
  )
    fail("Bu isim ekipte var. İsminin yanına bir takma ad ekle.", 409);
  const id = randomUUID(),
    token = randomBytes(32).toString("hex"),
    now = Date.now();
  db.prepare(
    "INSERT INTO members (id,group_id,token,name,avatar,color,note,joined,updated) VALUES (?,?,?,?,?,?,?,?,?)",
  ).run(id, group.id, sha(token), p.name, p.avatar, p.color, p.note, now, now);
  setCookie(res, req, token);
  message(group.id, id, "ekibe katıldı. Hoş geldin! ✨", "system");
  broadcast(group.id);
  return id;
}
function message(group, member, value, kind = "message") {
  const id = randomUUID();
  db.prepare("INSERT INTO messages VALUES (?,?,?,?,?,?)").run(
    id,
    group,
    member,
    value,
    kind,
    Date.now(),
  );
  return id;
}
function snapshot(groupId) {
  const now = Date.now();
  const group = db
    .prepare("SELECT id,name,invite FROM groups WHERE id = ?")
    .get(groupId);
  const members = db
    .prepare(
      `SELECT ${memberColumns}, status_until FROM members WHERE group_id = ? ORDER BY joined`,
    )
    .all(groupId)
    .map((m) => {
      if (m.status_until < now && m.status !== "away") m.status = "away";
      delete m.status_until;
      m.focusToday = db
        .prepare(
          "SELECT COALESCE(SUM(minutes),0) AS total FROM focus_log WHERE member_id = ? AND date(created / 1000,'unixepoch','+3 hours') = date('now','+3 hours')",
        )
        .get(m.id).total;
      return m;
    });
  const messages = db
    .prepare(
      "SELECT id,member_id AS memberId,text,kind,created FROM messages WHERE group_id = ? ORDER BY created DESC LIMIT 60",
    )
    .all(groupId)
    .reverse()
    .map((m) => ({
      ...m,
      reactions: db
        .prepare("SELECT member_id FROM reactions WHERE message_id = ?")
        .all(m.id)
        .map((x) => x.member_id),
    }));
  const plans = db
    .prepare(
      "SELECT id,member_id AS memberId,starts,note FROM plans WHERE group_id = ? AND starts > ? ORDER BY starts LIMIT 30",
    )
    .all(groupId, now - 2 * 3600000)
    .map((p) => ({
      ...p,
      attendees: db
        .prepare("SELECT member_id FROM attendees WHERE plan_id = ?")
        .all(p.id)
        .map((x) => x.member_id),
    }));
  return { group, members, messages, plans, serverTime: now };
}
function broadcast(groupId) {
  const data = `event: state\ndata: ${JSON.stringify(snapshot(groupId))}\n\n`;
  for (const res of clients.get(groupId) || []) res.write(data);
}
async function notify(groupId, senderId, title, body) {
  const subs = db
    .prepare(
      "SELECT s.endpoint,s.subscription FROM subscriptions s JOIN members m ON m.id=s.member_id WHERE m.group_id=? AND m.id<>?",
    )
    .all(groupId, senderId);
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          JSON.parse(sub.subscription),
          JSON.stringify({ title, body, tag: `${senderId}-${Date.now()}` }),
          { TTL: 1800, timeout: 10000 },
        );
      } catch (error) {
        if ([404, 410].includes(error.statusCode))
          db.prepare("DELETE FROM subscriptions WHERE endpoint = ?").run(
            sub.endpoint,
          );
      }
    }),
  );
}

app.get("/api/health", (req, res) => {
  db.prepare("SELECT 1").get();
  res.json({ ok: true });
});
app.get("/api/invites/:invite", (req, res) => {
  const group = db
    .prepare("SELECT id,name FROM groups WHERE invite = ?")
    .get(req.params.invite);
  if (!group) fail("Bu davet bağlantısı bulunamadı.", 404);
  const count = db
    .prepare("SELECT count(*) AS n FROM members WHERE group_id = ?")
    .get(group.id).n;
  res.json({ name: group.name, count });
});
app.post("/api/groups", (req, res) => {
  const p = profile(req.body);
  const group = {
    id: randomUUID(),
    name: text(req.body.groupName || "Bizim ekip", 40, "Ekip adı", 2),
    invite: randomBytes(18).toString("base64url"),
  };
  db.exec("BEGIN");
  try {
    db.prepare("INSERT INTO groups VALUES (?,?,?)").run(
      group.id,
      group.name,
      group.invite,
    );
    const memberId = addMember(req, res, group, p);
    db.exec("COMMIT");
    res
      .status(201)
      .json({
        memberId,
        ...snapshot(group.id),
        pushPublicKey: vapid.publicKey,
      });
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
});
app.post("/api/join", (req, res) => {
  const p = profile(req.body);
  const group = db
    .prepare("SELECT * FROM groups WHERE invite = ?")
    .get(text(req.body.invite, 64, "Davet", 10));
  if (!group)
    fail("Davet bulunamadı. Bağlantıyı arkadaşından yeniden iste.", 404);
  const memberId = addMember(req, res, group, p);
  res
    .status(201)
    .json({ memberId, ...snapshot(group.id), pushPublicKey: vapid.publicKey });
});
app.get("/api/session", authenticate, (req, res) =>
  res.json({
    memberId: req.member.id,
    ...snapshot(req.member.group_id),
    pushPublicKey: vapid.publicKey,
  }),
);
app.get("/api/state", authenticate, (req, res) =>
  res.json(snapshot(req.member.group_id)),
);
app.get("/api/events", authenticate, (req, res) => {
  const groupId = req.member.group_id;
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  if (!clients.has(groupId)) clients.set(groupId, new Set());
  const groupClients = clients.get(groupId);
  if (groupClients.size >= 200) return res.end();
  groupClients.add(res);
  res.write(`event: state\ndata: ${JSON.stringify(snapshot(groupId))}\n\n`);
  const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 20000);
  req.on("close", () => {
    clearInterval(heartbeat);
    groupClients.delete(res);
    if (!groupClients.size) clients.delete(groupId);
  });
});
app.post("/api/profile", authenticate, (req, res) => {
  const p = profile(req.body),
    m = req.member;
  const names = db
    .prepare("SELECT name FROM members WHERE group_id=? AND id<>?")
    .all(m.group_id, m.id);
  if (
    names.some(
      (x) => x.name.toLocaleLowerCase("tr") === p.name.toLocaleLowerCase("tr"),
    )
  )
    fail("Bu isim ekipte zaten var.", 409);
  db.prepare(
    "UPDATE members SET name=?,avatar=?,color=?,note=?,updated=? WHERE id=?",
  ).run(p.name, p.avatar, p.color, p.note, Date.now(), m.id);
  broadcast(m.group_id);
  res.json({ ok: true });
});
app.post("/api/presence", authenticate, (req, res) => {
  const m = req.member,
    status = req.body.status;
  if (!["here", "coming", "break", "away"].includes(status))
    fail("Geçersiz durum.");
  const location = text(req.body.location || "", 40, "Salon");
  const desk = text(req.body.desk || "", 16, "Masa");
  const arrival =
    status === "coming"
      ? text(req.body.arrival || "Birazdan", 32, "Geliş saati")
      : null;
  db.prepare(
    "UPDATE members SET status=?,location=?,desk=?,arrival=?,status_until=?,updated=? WHERE id=?",
  ).run(
    status,
    location,
    desk,
    arrival,
    status === "away" ? 0 : Date.now() + 8 * 3600000,
    Date.now(),
    m.id,
  );
  const previousStatus = m.status_until < Date.now() ? "away" : m.status;
  if (previousStatus !== status) {
    const phrases = {
      here: "kütübe geldi. Bir sandalye çek! 🪑",
      coming: `yola koyuluyor · ${arrival} 🛵`,
      break: "molaya çıktı. Kahveye eşlik eden? ☕",
      away: "bugünlük paydos etti. Görüşürüz! 👋",
    };
    message(m.group_id, m.id, phrases[status], "system");
    if (status === "here" || status === "break")
      void notify(
        m.group_id,
        m.id,
        `${m.name} ${status === "here" ? "kütüpte! 📚" : "molada! ☕"}`,
        status === "here"
          ? `${location || "Milli Kütüphane"}${desk ? ` · Masa ${desk}` : ""}`
          : "Bir kahvelik ara verelim mi?",
      );
  }
  broadcast(m.group_id);
  res.json({ ok: true });
});
app.post("/api/messages", authenticate, (req, res) => {
  const m = req.member,
    value = text(req.body.text, 280, "Mesaj", 1),
    kind = req.body.kind === "coffee" ? "coffee" : "message";
  const id = message(m.group_id, m.id, value, kind);
  if (kind === "coffee")
    void notify(m.group_id, m.id, `${m.name}: mola? ☕`, value);
  broadcast(m.group_id);
  res.status(201).json({ id });
});
app.post("/api/messages/:id/react", authenticate, (req, res) => {
  const m = req.member,
    msg = db
      .prepare("SELECT id FROM messages WHERE id=? AND group_id=?")
      .get(req.params.id, m.group_id);
  if (!msg) fail("Mesaj bulunamadı.", 404);
  const old = db
    .prepare("SELECT 1 FROM reactions WHERE message_id=? AND member_id=?")
    .get(msg.id, m.id);
  if (old)
    db.prepare("DELETE FROM reactions WHERE message_id=? AND member_id=?").run(
      msg.id,
      m.id,
    );
  else db.prepare("INSERT INTO reactions VALUES (?,?)").run(msg.id, m.id);
  broadcast(m.group_id);
  res.json({ ok: true });
});
app.post("/api/plans", authenticate, (req, res) => {
  const m = req.member,
    starts = Number(req.body.starts),
    note = text(req.body.note || "", 80, "Plan notu");
  if (
    !Number.isFinite(starts) ||
    starts < Date.now() - 60000 ||
    starts > Date.now() + 14 * 86400000
  )
    fail("Önümüzdeki 14 gün içinde bir saat seç.");
  if (
    db
      .prepare("SELECT count(*) AS n FROM plans WHERE member_id=? AND starts>?")
      .get(m.id, Date.now()).n >= 10
  )
    fail("En fazla 10 gelecek planın olabilir.");
  const id = randomUUID();
  db.prepare("INSERT INTO plans VALUES (?,?,?,?,?)").run(
    id,
    m.group_id,
    m.id,
    starts,
    note,
  );
  db.prepare("INSERT INTO attendees VALUES (?,?)").run(id, m.id);
  message(
    m.group_id,
    m.id,
    "yeni bir kütüp planı yaptı. Takvime göz at! 🗓️",
    "system",
  );
  broadcast(m.group_id);
  res.status(201).json({ id });
});
app.post("/api/plans/:id/join", authenticate, (req, res) => {
  const m = req.member,
    plan = db
      .prepare("SELECT * FROM plans WHERE id=? AND group_id=?")
      .get(req.params.id, m.group_id);
  if (!plan) fail("Plan bulunamadı.", 404);
  if (plan.member_id === m.id)
    fail("Bu planı sen oluşturdun; istersen silebilirsin.");
  if (plan.starts < Date.now() - 2 * 3600000) fail("Bu planın zamanı geçti.");
  const old = db
    .prepare("SELECT 1 FROM attendees WHERE plan_id=? AND member_id=?")
    .get(plan.id, m.id);
  if (old)
    db.prepare("DELETE FROM attendees WHERE plan_id=? AND member_id=?").run(
      plan.id,
      m.id,
    );
  else db.prepare("INSERT INTO attendees VALUES (?,?)").run(plan.id, m.id);
  broadcast(m.group_id);
  res.json({ ok: true });
});
app.delete("/api/plans/:id", authenticate, (req, res) => {
  const m = req.member;
  db.prepare("DELETE FROM plans WHERE id=? AND member_id=?").run(
    req.params.id,
    m.id,
  );
  broadcast(m.group_id);
  res.json({ ok: true });
});
app.post("/api/focus", authenticate, (req, res) => {
  const m = req.member,
    action = req.body.action;
  if (action === "finish") {
    if (!m.focus_end || m.focus_end > Date.now())
      fail("Odak süren henüz tamamlanmadı.");
    db.exec("BEGIN");
    try {
      db.prepare("INSERT INTO focus_log VALUES (?,?,?,?)").run(
        randomUUID(),
        m.id,
        m.focus_minutes,
        Date.now(),
      );
      db.prepare(
        "UPDATE members SET focus_end=0,focus_minutes=0 WHERE id=?",
      ).run(m.id);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  } else if (action === "cancel")
    db.prepare("UPDATE members SET focus_end=0,focus_minutes=0 WHERE id=?").run(
      m.id,
    );
  else if (action === "start") {
    if (m.focus_end) fail("Önce mevcut odak oturumunu tamamla veya durdur.");
    let minutes = Number(req.body.minutes),
      end;
    if (req.body.joinMember) {
      const other = db
        .prepare("SELECT focus_end FROM members WHERE id=? AND group_id=?")
        .get(req.body.joinMember, m.group_id);
      if (!other || other.focus_end < Date.now() + 60000)
        fail("Bu odak oturumu sona ermek üzere. Yeni oturum başlat.");
      end = other.focus_end;
      minutes = Math.floor((end - Date.now()) / 60000);
    } else {
      if (![25, 45, 50].includes(minutes)) fail("25, 45 veya 50 dakika seç.");
      end = Date.now() + minutes * 60000;
    }
    db.prepare("UPDATE members SET focus_end=?,focus_minutes=? WHERE id=?").run(
      end,
      minutes,
      m.id,
    );
  } else fail("Geçersiz odak işlemi.");
  broadcast(m.group_id);
  res.json({ ok: true });
});
app.post("/api/push", authenticate, (req, res) => {
  const sub = req.body.subscription;
  if (
    !sub ||
    typeof sub.endpoint !== "string" ||
    !sub.keys ||
    typeof sub.keys.p256dh !== "string" ||
    typeof sub.keys.auth !== "string"
  )
    fail("Bildirim aboneliği geçerli değil.");
  let url;
  try {
    url = new URL(sub.endpoint);
  } catch {
    fail("Bildirim adresi geçerli değil.");
  }
  const hosts = [
    "fcm.googleapis.com",
    "updates.push.services.mozilla.com",
    "web.push.apple.com",
  ];
  if (
    url.protocol !== "https:" ||
    url.port ||
    url.username ||
    url.password ||
    !hosts.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))
  )
    fail("Bu bildirim sağlayıcısı desteklenmiyor.");
  if (
    sub.endpoint.length > 2000 ||
    sub.keys.p256dh.length > 256 ||
    sub.keys.auth.length > 128
  )
    fail("Bildirim aboneliği geçerli değil.");
  db.prepare(
    "INSERT INTO subscriptions VALUES (?,?,?) ON CONFLICT(endpoint) DO UPDATE SET member_id=excluded.member_id,subscription=excluded.subscription",
  ).run(sub.endpoint, req.member.id, JSON.stringify(sub));
  res.json({ ok: true });
});
app.delete("/api/push", authenticate, (req, res) => {
  db.prepare("DELETE FROM subscriptions WHERE member_id=? AND endpoint=?").run(
    req.member.id,
    req.body.endpoint || "",
  );
  res.json({ ok: true });
});
app.post("/api/feedback", authenticate, (req, res) => {
  const kind = req.body.kind;
  if (!["idea", "bug", "hello"].includes(kind)) fail("Bir mesaj türü seç.");
  const value = text(req.body.text, 1200, "Mesaj", 5),
    id = randomUUID();
  const recent = db
    .prepare(
      "SELECT count(*) AS n FROM feedback WHERE member_id=? AND created>?",
    )
    .get(req.member.id, Date.now() - 3600000).n;
  if (recent >= 8)
    fail("Mesajların ulaştı! Yeni bir not için biraz bekle.", 429);
  db.prepare(
    "INSERT INTO feedback(id,member_id,kind,text,created) VALUES (?,?,?,?,?)",
  ).run(id, req.member.id, kind, value, Date.now());
  res.status(201).json({ id });
});
app.get("/api/feedback", authenticate, (req, res) => {
  res.json(
    db
      .prepare(
        "SELECT id,kind,text,status,created FROM feedback WHERE member_id=? ORDER BY created DESC LIMIT 30",
      )
      .all(req.member.id),
  );
});
function owner(req, res, next) {
  const now = Date.now(),
    bucketKey = `${req.ip}:owner`,
    bucket = buckets.get(bucketKey) || { start: now, count: 0 };
  if (now - bucket.start > 60000) {
    bucket.start = now;
    bucket.count = 0;
  }
  bucket.count++;
  buckets.set(bucketKey, bucket);
  if (bucket.count > 30)
    return res.status(429).json({ error: "Bir dakika bekleyip tekrar dene." });
  const key = req.get("X-Owner-Key") || "";
  if (!timingSafeEqual(Buffer.from(sha(key)), Buffer.from(sha(ownerKey))))
    return res
      .status(401)
      .json({ error: "Bu anahtar Batur’un kutusunu açmıyor." });
  next();
}
app.get("/api/owner/feedback", owner, (req, res) => {
  res.json(
    db
      .prepare(
        "SELECT f.*,m.name,m.avatar,m.color,g.name AS group_name FROM feedback f JOIN members m ON m.id=f.member_id JOIN groups g ON g.id=m.group_id ORDER BY f.created DESC LIMIT 500",
      )
      .all(),
  );
});
app.post("/api/owner/feedback/:id", owner, (req, res) => {
  if (!["new", "planned", "done"].includes(req.body.status))
    fail("Geçersiz durum.");
  db.prepare("UPDATE feedback SET status=? WHERE id=?").run(
    req.body.status,
    req.params.id,
  );
  res.json({ ok: true });
});

app.use("/api", (req, res) =>
  res.status(404).json({ error: "Bu işlem bulunamadı." }),
);
if (process.argv.includes("--dev")) {
  const { createServer } = await import("vite");
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(resolve(root, "dist"), { index: false }));
  app.get("/{*path}", (req, res, next) =>
    req.path.startsWith("/api/")
      ? next()
      : res.sendFile(resolve(root, "dist/index.html")),
  );
}
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (!error.status) console.error("Kütüp server error:", error.message);
  res
    .status(error.status || 500)
    .json({
      error: error.status
        ? error.message
        : "Bir şey takıldı. Birazdan tekrar dene.",
    });
});
const server = app.listen(Number(process.env.PORT || 3001), "0.0.0.0", () =>
  console.log(`Kütüp listening on port ${server.address().port}`),
);
setInterval(() => {
  for (const groupId of clients.keys()) broadcast(groupId);
}, 60000).unref();
function stop() {
  for (const group of clients.values()) for (const res of group) res.end();
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
