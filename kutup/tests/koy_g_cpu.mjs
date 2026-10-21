// n46 G: what each v2 village request spends in JavaScript (the part the
// Worker's free-plan 10 ms CPU budget counts; time inside the database is
// D1's and is subtracted). Temporary database, synthetic team.
//
//   node tests/koy_g_cpu.mjs 300 > /tmp/kutup-koy-g-cpu.json
import { DatabaseSync } from "node:sqlite";
import { createApp } from "../server/app.js";
import { sqliteAdapter } from "../server/sqlite.js";
import { mergeVillage2 } from "../src/koy2/village2.js";
import { plannerLayout, sendable } from "../src/koy2/browserPlan.js";
import { movePlans, planPlacement } from "../shared/koy2/planner.js";
import { planDraft } from "../shared/koy2/switch.js";

const N = Number(process.argv[2] || 100);
const REPEAT = 7;
const sqlite = new DatabaseSync(":memory:");
sqlite.exec("PRAGMA foreign_keys = ON");
const raw = sqliteAdapter(sqlite);
let inDb = 0,
  queries = 0;
const timed = (fn, count) => async (...a) => {
  const t = performance.now();
  try {
    return await fn(...a);
  } finally {
    inDb += performance.now() - t;
    queries += count(...a);
  }
};
const db = {
  all: timed(raw.all, () => 1),
  get: timed(raw.get, () => 1),
  run: timed(raw.run, () => 1),
  read: timed(raw.read, (l) => l.length),
  batch: timed(raw.batch, (l) => l.length),
};
const KEY = "koy-g-cpu-owner-key-1234";
const app = createApp({ db, config: { adminKey: KEY, testHooks: true } });
const results = {};
async function call(name, path, { method = "GET", body, headers = {} } = {}) {
  inDb = 0;
  queries = 0;
  const t = performance.now();
  const r = await app.fetch(
    new Request(`http://k.test/api${path}`, { method, headers: { "Content-Type": "application/json", "X-Kutup": "1", ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) }),
    { ip: "cpu" },
  );
  // The answer is already a string here (json() stringified it); reading it back is the test's own cost.
  const js = performance.now() - t - inDb;
  const data = await r.json();
  if (name) (results[name] ||= { js: [], queries: 0, status: r.status }).js.push(js), (results[name].queries = queries);
  if (!r.ok && name) throw new Error(`${name}: ${r.status} ${data.error}`);
  return { status: r.status, data, cookie: r.headers.get("set-cookie")?.split(";")[0] };
}
const MODELS = ["ev", "kulube", "kahve", "sahaf", "bostan", "konak", "kule", "cicekci"];
const ada = await call(null, "/groups", { method: "POST", body: { name: "Ada", username: "ada_cpu", password: "cpu-pass-123" } });
const ege = await call(null, "/join", { method: "POST", body: { invite: ada.data.group.invite, name: "Ege", username: "ege_cpu", password: "cpu-pass-123" } });
const owner = { Cookie: (await call(null, "/owner/login", { method: "POST", body: { key: KEY } })).cookie };
const gid = ada.data.group.id;
for (let i = 0; i < N; i++) await call(null, `/owner/members/${(i % 2 ? ege : ada).data.memberId}/gift`, { method: "POST", headers: owner, body: { model: MODELS[i % 8] } });
sqlite.prepare("UPDATE members SET bricks = 100000").run();

// Today's village (V1) first, for comparison: the same requests before the switch.
for (let i = 0; i < 5; i++) {
  await call("V1: köyün tamamı", "/village", { headers: { Cookie: ada.cookie } });
  await call("V1: inşaat seansı başlat", "/focus", { method: "POST", headers: { Cookie: ada.cookie }, body: { action: "start", strict: true, model: "ev", minutes: 50, requestKey: `koy-g-cpu-v1-${i}-0000001` } });
  sqlite.prepare("UPDATE members SET focus_end = ?, focus_beat = ? WHERE id = ?").run(Date.now() - 1000, Date.now() - 1000, ada.data.memberId);
  await call("V1: seans bitti, bina köye", "/state", { headers: { Cookie: ada.cookie } });
  await call("V1: hediye", `/owner/members/${ege.data.memberId}/gift`, { method: "POST", headers: owner, body: { model: MODELS[i % 8] } });
}
for (let i = 0; i < 3; i++) await call("V1: yedek (npm run yayin önce alır)", "/owner/backup", { headers: owner });
// The switch, as Komuta merkezi does it.
await call("owner: köy durumu", `/owner/village/${gid}`, { headers: owner });
const source = (await call("owner: kaynak", `/owner/village/${gid}/source`, { headers: owner })).data;
const t0 = performance.now();
const planned = planDraft(source);
const draftMs = performance.now() - t0;
let stored;
// Uploaded a few times (each replaces the last draft): the first one in a fresh isolate is the slowest.
for (let i = 0; i < 4; i++) stored = (await call("owner: taslak yükle", `/owner/village/${gid}/layouts`, { method: "POST", headers: owner, body: { layout: planned.layout, contentRev: source.contentRev } })).data;
for (let part = { checked: 0, sound: false }; !part.sound; ) part = (await call("owner: kural kontrolü (40 parsel)", `/owner/village/${gid}/layouts/${stored.draft.id}/check`, { method: "POST", headers: owner, body: { from: part.checked } })).data;
await call("owner: yeni köyü aç", `/owner/village/${gid}/activate`, { method: "POST", headers: owner, body: { draftId: stored.draft.id, active: null, contentRev: stored.contentRev } });

// Members, from their own copy of the village.
const V2 = { "X-Kutup-Village-Version": "2" };
const as = (who) => ({ Cookie: who.cookie, ...V2 });
let browserMs = [];
for (let i = 0; i < REPEAT; i++) {
  const v = (await call("üye: köyün tamamı", "/village", { headers: as(ada) })).data;
  const village = mergeVillage2(null, v);
  const t = performance.now();
  const plan = planPlacement(plannerLayout(village), { subject: { type: "site", id: "new" }, model: "ev", owner: ada.data.memberId, created: Date.now() });
  browserMs.push(performance.now() - t);
  const r = await call("üye: inşaat seansı başlat (tarayıcı planı)", "/focus", { method: "POST", headers: as(ada), body: { action: "start", strict: true, model: "ev", minutes: 50, requestKey: `koy-g-cpu-start-${i}-000001`, village: { layoutRev: village.layoutRev, plan: sendable(plan) } } });
  // Done: the site becomes its building on the same plot.
  sqlite.prepare("UPDATE members SET focus_end = ?, focus_beat = ? WHERE id = ?").run(Date.now() - 1000, Date.now() - 1000, ada.data.memberId);
  await call("üye: seans bitti, şantiye binaya dönüşür", "/state", { headers: as(ada) });
  void r;
}
for (let i = 0; i < REPEAT; i++) {
  const v = (await call(null, "/village", { headers: as(ege) })).data;
  await call("üye: köy güncellemesi (değişen satırlar)", `/village?cursor=${encodeURIComponent(v.cursor)}`, { headers: as(ege) });
  await call("üye: inşaat seansı başlat (sunucu planı, yedek yol)", "/focus", { method: "POST", headers: as(ege), body: { action: "start", strict: true, model: "ev", minutes: 50, requestKey: `koy-g-cpu-fallback-${i}-01` } });
  sqlite.prepare("UPDATE members SET focus_end = ?, focus_beat = ? WHERE id = ?").run(Date.now() - 1000, Date.now() - 1000, ege.data.memberId);
  await call(null, "/state", { headers: as(ege) });
}
for (let i = 0; i < REPEAT; i++) {
  const s = (await call(null, `/owner/village/${gid}/source?layout=active`, { headers: owner })).data;
  const plan = planPlacement(s.layout, { subject: { type: "building", id: "new" }, model: MODELS[i % 8], owner: ege.data.memberId, created: Date.now() });
  await call("owner: hediye (tarayıcı planı)", `/owner/members/${ege.data.memberId}/gift`, { method: "POST", headers: owner, body: { model: MODELS[i % 8], village: { layoutRev: s.layoutRev, plan: sendable(plan) } } });
}
for (let i = 0; i < 3; i++) {
  const village = mergeVillage2(null, (await call(null, "/village", { headers: as(ada) })).data);
  const own = village.buildings.find((b) => b.memberId === ada.data.memberId);
  const t = performance.now();
  const plans = movePlans(plannerLayout(village), { type: "building", id: own.id });
  browserMs.push(performance.now() - t);
  if (!plans.length) continue;
  await call("üye: binayı taşı (tarayıcı planı)", `/buildings/${own.id}/move`, { method: "POST", headers: as(ada), body: { x: plans[0].plot.x, y: plans[0].plot.y, village: { layoutRev: village.layoutRev, plan: sendable(plans[0]) } } });
}
for (let i = 0; i < 3; i++) await call("owner: yedek, yeni köy açıkken", "/owner/backup", { headers: owner });
const st = (await call(null, `/owner/village/${gid}`, { headers: owner })).data;
await call("owner: eski köye dön", `/owner/village/${gid}/rollback`, { method: "POST", headers: owner, body: { active: st.active.id, contentRev: st.contentRev } });

const med = (a) => [...a].sort((x, y) => x - y)[a.length >> 1];
const out = Object.fromEntries(Object.entries(results).map(([k, v]) => [k, { js_ms_median: +med(v.js).toFixed(2), js_ms_max: +Math.max(...v.js).toFixed(2), queries: v.queries, n: v.js.length }]));
console.log(JSON.stringify({ buildings: N, browser: { draft_ms: Math.round(draftMs), place_or_move_ms_median: +med(browserMs).toFixed(1) }, requests: out }, null, 1));
