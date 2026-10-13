// Cloudflare Worker host for Kütüp — the build ChatGPT Sites and `wrangler deploy` run.
// Static files come from the ASSETS binding (dist/), data lives in the D1 binding DB.
// Workers have no shared memory between requests, so clients poll /api/state?rev=…
// (an unchanged group costs one tiny query).
import { createApp } from "../server/app.js";

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

let app;
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== "/api" && !url.pathname.startsWith("/api/"))
      return env.ASSETS.fetch(request);
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
    app ??= createApp({
      db: d1Adapter(env.DB),
      live: "poll",
      config: {
        adminKey: env.ADMIN_KEY,
        publicOrigin: env.PUBLIC_ORIGIN,
        vapidSubject: env.VAPID_SUBJECT,
        pushExtraHosts: env.PUSH_EXTRA_HOSTS,
        testHooks: env.KUTUP_TEST_HOOKS === "1",
      },
    });
    return app.fetch(request, {
      ip: request.headers.get("cf-connecting-ip") || "",
      waitUntil: (promise) => ctx.waitUntil(promise),
    });
  },
};
