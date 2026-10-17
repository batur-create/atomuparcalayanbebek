// Cloudflare Worker host for Kütüp — the build ChatGPT Sites and `wrangler deploy` run.
// Static files come from the ASSETS binding (dist/), data lives in the D1 binding DB.
// Workers have no shared memory between requests, so each team gets a small
// Durable Object (LiveRoom) holding its members' WebSockets: a write rings the
// room and every open phone refetches at once (n29). The sockets hibernate, so
// a quiet room costs nothing. Clients keep polling /api/state?rev=… slowly as a
// safety net, and at the old 5 s pace whenever the socket is down.
import { DurableObject } from "cloudflare:workers";
import { createApp } from "../server/app.js";

export class LiveRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    // Keep-alive pings are answered without waking the room.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/connect") {
      const member = request.headers.get("x-kutup-member") || "";
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1], [member]);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (url.pathname === "/changed") {
      const { removed } = await request.json().catch(() => ({}));
      // Someone who left or was removed stops receiving the team's updates at once:
      // they hear "removed" (a close frame alone can sit in a phone's buffer) and the socket closes.
      for (const ws of this.ctx.getWebSockets()) {
        const gone = removed && this.ctx.getTags(ws).includes(removed);
        try {
          ws.send(gone ? "removed" : "changed");
          if (gone) ws.close(4001, "removed");
        } catch {}
      }
      return new Response(null, { status: 204 });
    }
    return new Response(null, { status: 404 });
  }
  webSocketClose(ws, code) {
    try {
      ws.close(code === 1005 ? 1000 : code, "bye");
    } catch {}
  }
}

function d1Adapter(d1) {
  const bind = (sql, params = []) =>
    d1.prepare(sql).bind(...params.map((p) => (p === undefined ? null : p)));
  return {
    async all(sql, params) {
      return (await bind(sql, params).all()).results;
    },
    async get(sql, params) {
      return (await bind(sql, params).first()) ?? null;
    },
    async run(sql, params) {
      return { changes: (await bind(sql, params).run()).meta.changes };
    },
    async read(list) {
      return (await d1.batch(list.map(([sql, params]) => bind(sql, params)))).map(
        (result) => result.results,
      );
    },
    async batch(list) {
      await d1.batch(list.map(([sql, params]) => bind(sql, params)));
    },
  };
}

// Rings started while handling a request; the request keeps them alive with waitUntil.
const rings = new Set();
function ring(env, groupId, { removed } = {}) {
  if (!env.LIVE || !groupId) return;
  const room = env.LIVE.get(env.LIVE.idFromName(groupId));
  const done = room
    .fetch("https://live/changed", { method: "POST", body: JSON.stringify({ removed: removed || null }) })
    .catch(() => {})
    .finally(() => rings.delete(done));
  rings.add(done);
}
const settle = () => Promise.all([...rings]);

let app;
function getApp(env) {
  if (!env.DB) throw new Error("Kütüp requires the DB binding");
  app ??= createApp({
    db: d1Adapter(env.DB),
    live: env.LIVE ? "ws" : "poll",
    onChange: (groupId, extra) => ring(env, groupId, extra),
    config: {
      adminKey: env.ADMIN_KEY,
      publicOrigin: env.PUBLIC_ORIGIN,
      vapidSubject: env.VAPID_SUBJECT,
      pushExtraHosts: env.PUSH_EXTRA_HOSTS,
      testHooks: env.KUTUP_TEST_HOOKS === "1",
    },
  });
  return app;
}
export default {
  async scheduled(_event, env, ctx) {
    const app = getApp(env);
    ctx.waitUntil(Promise.all([app.drainPushOutbox(), app.tick((p) => ctx.waitUntil(p)).catch(() => {})]).then(settle));
  },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== "/api" && !url.pathname.startsWith("/api/"))
      return env.ASSETS.fetch(request);
    if (url.pathname === "/api/live" && env.LIVE && env.DB) {
      if (request.headers.get("upgrade")?.toLowerCase() !== "websocket")
        return new Response(JSON.stringify({ error: "WebSocket bekleniyor." }), { status: 426, headers: { "Content-Type": "application/json" } });
      // Only this site's pages may open the team's channel.
      const origin = request.headers.get("origin");
      if (origin && new URL(origin).host !== new URL(env.PUBLIC_ORIGIN || url.origin).host)
        return new Response(JSON.stringify({ error: "Bu kaynaktan bağlanılamaz." }), { status: 403, headers: { "Content-Type": "application/json" } });
      const member = await getApp(env).authenticate(request);
      if (!member) return new Response(JSON.stringify({ error: "Ekibine katılmak için giriş yap." }), { status: 401, headers: { "Content-Type": "application/json" } });
      const room = env.LIVE.get(env.LIVE.idFromName(member.group_id));
      return room.fetch("https://live/connect", { headers: { upgrade: "websocket", "x-kutup-member": member.id } });
    }
    if (url.pathname === "/api/events")
      return new Response(JSON.stringify({ error: "Bu sunucu canlı akış yerine yoklama kullanır." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    if (!env.DB)
      return new Response(
        JSON.stringify({ error: "Veritabanı bağlı değil: D1 bağlantısının adı DB olmalı." }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    const response = await getApp(env).fetch(request, {
      ip: request.headers.get("cf-connecting-ip") || "",
      waitUntil: (promise) => ctx.waitUntil(promise),
    });
    if (rings.size) ctx.waitUntil(settle());
    return response;
  },
};
