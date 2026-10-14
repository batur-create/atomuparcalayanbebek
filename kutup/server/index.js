// Node host for Kütüp: node:sqlite storage, Server-Sent Events for instant updates,
// static files from dist/ (or Vite in --dev). Used for local development, Docker,
// Render, Railway or any VPS. The Cloudflare / ChatGPT Sites build lives in worker/.
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp, SECURITY_HEADERS } from "./app.js";
import { sqliteAdapter } from "./sqlite.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const dev = process.argv.includes("--dev");
const trustProxy = process.env.TRUST_PROXY !== "0";
const dataDir = resolve(process.env.DATA_DIR || resolve(root, "data"));
mkdirSync(dataDir, { recursive: true });

const database = new DatabaseSync(resolve(dataDir, "kutup.sqlite"));
database.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");

// Without ADMIN_KEY a local key is generated once into data/batur-key.txt.
let adminKey = process.env.ADMIN_KEY;
if (!adminKey) {
  const keyPath = resolve(dataDir, "batur-key.txt");
  if (existsSync(keyPath)) adminKey = readFileSync(keyPath, "utf8").trim();
  else {
    adminKey = randomBytes(32).toString("base64url");
    writeFileSync(keyPath, adminKey + "\n", { mode: 0o600 });
  }
}

// groupId → Map(open SSE response → authenticated device)
const clients = new Map();
const pending = new Set();
let activeSession;
function validDevice(res, device) {
  if (res.writableEnded) return false;
  if (activeSession.get(device.token, Date.now() - 365 * 86400000)) return true;
  res.end();
  return false;
}
function broadcast(groupId, { removed } = {}) {
  const group = clients.get(groupId);
  // Someone who left or was removed stops receiving the group's updates at once.
  if (removed && group)
    for (const [res, device] of group) if (device.id === removed) res.end();
  if (!group?.size || pending.has(groupId)) return;
  pending.add(groupId);
  setImmediate(async () => {
    pending.delete(groupId);
    try {
      const state = await app.snapshot(groupId);
      if (!state) return;
      const data = `event: state\ndata: ${JSON.stringify(state)}\n\n`;
      for (const [res, device] of clients.get(groupId) || [])
        if (validDevice(res, device)) res.write(data);
    } catch (error) {
      console.error("Kütüp broadcast error:", error.message);
    }
  });
}

const app = createApp({
  db: sqliteAdapter(database),
  live: "sse",
  onChange: broadcast,
  config: {
    adminKey,
    publicOrigin: process.env.PUBLIC_ORIGIN,
    vapidSubject: process.env.VAPID_SUBJECT,
    pushExtraHosts: process.env.PUSH_EXTRA_HOSTS,
    testHooks: process.env.KUTUP_TEST_HOOKS === "1",
  },
});
await app.ready();
activeSession = database.prepare("SELECT 1 FROM sessions WHERE token = ? AND created > ?");

function requestUrl(req) {
  const forwarded = trustProxy && req.headers["x-forwarded-proto"];
  const protocol = forwarded ? String(forwarded).split(",")[0].trim() : "http";
  return new URL(req.url, `${protocol}://${req.headers.host || "localhost"}`);
}
function clientIp(req) {
  const forwarded = trustProxy && req.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",").pop().trim();
  return req.socket.remoteAddress || "";
}
async function toRequest(req, url) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers))
    if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  let body;
  if (!["GET", "HEAD"].includes(req.method)) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 16384) return null;
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks);
  }
  return new Request(url, { method: req.method, headers, body });
}
async function send(res, response) {
  const headers = {};
  response.headers.forEach((value, key) => {
    if (key !== "set-cookie") headers[key] = value;
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) headers["set-cookie"] = cookies;
  res.writeHead(response.status, headers);
  res.end(Buffer.from(await response.arrayBuffer()));
}

async function events(req, res, request) {
  const member = await app.authenticate(request);
  if (!member) {
    res.writeHead(401, { "Content-Type": "application/json", ...SECURITY_HEADERS });
    return res.end(JSON.stringify({ error: "Ekibine katılmak için giriş yap." }));
  }
  const groupId = member.group_id;
  if (!clients.has(groupId)) clients.set(groupId, new Map());
  const group = clients.get(groupId);
  if (group.size >= 200) {
    res.writeHead(503);
    return res.end();
  }
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
    ...SECURITY_HEADERS,
  });
  const device = { id: member.id, token: member.session_token };
  group.set(res, device);
  const state = await app.snapshot(groupId);
  if (validDevice(res, device)) res.write(`retry: 3000\nevent: state\ndata: ${JSON.stringify(state)}\n\n`);
  const heartbeat = setInterval(() => {
    if (validDevice(res, device)) res.write(": heartbeat\n\n");
  }, 20000);
  req.on("close", () => {
    clearInterval(heartbeat);
    group.delete(res);
    if (!group.size) clients.delete(groupId);
  });
}

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
function serveStatic(req, res, pathname) {
  let file;
  try {
    file = resolve(dist, "." + decodeURIComponent(pathname));
  } catch {
    file = null;
  }
  const inside = file && file.startsWith(dist + sep) && !basename(file).startsWith("_");
  const exists = inside && existsSync(file) && statSync(file).isFile();
  if (!exists) {
    // Unknown files are 404; everything else is a client-side route.
    if (extname(pathname)) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", ...SECURITY_HEADERS });
      return res.end("Bulunamadı");
    }
    file = resolve(dist, "index.html");
  }
  const name = basename(file);
  const cache = pathname.startsWith("/assets/")
    ? "public, max-age=31536000, immutable"
    : ["index.html", "sw.js", "manifest.webmanifest"].includes(name)
      ? "no-cache"
      : "public, max-age=3600";
  res.writeHead(200, {
    "Content-Type": types[extname(file)] || "application/octet-stream",
    "Cache-Control": cache,
    ...SECURITY_HEADERS,
    ...(name === "index.html" ? { "Content-Security-Policy": CSP } : {}),
  });
  if (req.method === "HEAD") return res.end();
  createReadStream(file).pipe(res);
}

let vite;
const server = createServer(async (req, res) => {
  try {
    const url = requestUrl(req);
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      const request = await toRequest(req, url);
      if (!request) {
        res.writeHead(413, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "İstek çok büyük." }));
      }
      if (url.pathname === "/api/events" && req.method === "GET")
        return await events(req, res, request);
      return await send(res, await app.fetch(request, { ip: clientIp(req) }));
    }
    if (vite) return vite.middlewares(req, res);
    serveStatic(req, res, url.pathname);
  } catch (error) {
    console.error("Kütüp server error:", error);
    if (!res.headersSent) res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Bir şey takıldı. Birazdan tekrar dene." }));
  }
});
if (dev) {
  const { createServer: createVite } = await import("vite");
  vite = await createVite({ root, server: { middlewareMode: true, hmr: { server } }, appType: "spa" });
}

server.listen(Number(process.env.PORT || 3001), process.env.HOST || (dev ? "127.0.0.1" : "0.0.0.0"), () =>
  console.log(`Kütüp listening on port ${server.address().port}`),
);
// Statuses expire after 8 hours and focus sessions end on their own; refresh open screens.
setInterval(() => {
  for (const groupId of clients.keys()) broadcast(groupId);
}, 60000).unref();

function stop() {
  for (const group of clients.values()) for (const res of group.keys()) res.end();
  server.close(() => {
    database.close();
    process.exit(0);
  });
  vite?.close();
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
