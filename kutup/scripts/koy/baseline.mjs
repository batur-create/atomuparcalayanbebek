// n46 A: writes the renewal's starting point.
//   node scripts/koy/baseline.mjs
// → tests/fixtures/koy/<scene>.json       the four fixed scenes (synthetic)
// → docs/koy/baseline/manifest.json        HEAD, schema, models, checksums, legacy numbers
// → docs/koy/baseline/village-v1.json      a real /api/village answer (temp database)
// Never reads kutup/data or anything live.
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { createApp } from "../../server/app.js";
import { sqliteAdapter } from "../../server/sqlite.js";
import { migrations } from "../../server/schema.js";
import { CATALOG } from "../../shared/catalog.js";
import { MONUMENTS, REAL, claimOf, targetHeightOf } from "../../shared/olcek.js";
import { SCENES, makeFixture, protectedRows } from "./fixtures.mjs";
import { count, legacyGrowth, legacyMetrics } from "./legacy-metrics.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const sha = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex").slice(0, 16);
const git = (cmd) => {
  try {
    return execSync(`git ${cmd}`, { cwd: root, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return null;
  }
};

/** A real /api/village answer: the fixture's rows in a throwaway database. */
export async function villageAnswer(f) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const app = createApp({ db: sqliteAdapter(sqlite), config: { adminKey: "n46-baseline-key" } });
  const call = (path, { method = "GET", body, cookie } = {}) =>
    app
      .fetch(new Request(`http://kutup.test/api${path}`, { method, headers: { "Content-Type": "application/json", "X-Kutup": "1", ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }), { ip: "baseline" })
      .then(async (r) => ({ status: r.status, data: await r.json(), cookie: r.headers.get("set-cookie")?.split(";")[0] }));
  const ids = new Map();
  const first = await call("/groups", { method: "POST", body: { name: f.members[0].name, username: "n46_m0", password: "n46-pass-0" } });
  ids.set("m0", first.data.memberId);
  for (const m of f.members.slice(1)) {
    const j = await call("/join", { method: "POST", body: { invite: first.data.group.invite, name: m.name, username: `n46_${m.id}`, password: "n46-pass-1" } });
    ids.set(m.id, j.data.memberId);
  }
  const group = first.data.group.id;
  sqlite.exec("DELETE FROM districts");
  const dIns = sqlite.prepare("INSERT INTO districts (id, group_id, member_id, dx, dy, seed, created, buildings) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  for (const d of f.districts) dIns.run(d.id, group, ids.get(d.memberId) ?? null, d.q, d.r, d.seed, f.now, f.buildings.filter((b) => b.districtId === d.id).length);
  const bIns = sqlite.prepare("INSERT INTO buildings (id, member_id, group_id, kind, model, minutes, seed, created, touched, pos_x, pos_y, facing, district_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  for (const b of f.buildings) bIns.run(b.id, ids.get(b.memberId), group, b.kind, b.model, b.minutes, b.seed, b.created, b.created, b.x, b.y, b.facing, b.districtId);
  const answer = await call("/village", { cookie: first.cookie });
  // Ids are random per run; give them back their fixture names.
  const back = new Map([...ids].map(([k, v]) => [v, k]));
  const data = JSON.parse(JSON.stringify(answer.data), (k, v) => (typeof v === "string" && back.has(v) ? back.get(v) : v));
  return { status: answer.status, data };
}

async function main() {
  const out = { fixtures: `${root}tests/fixtures/koy`, docs: `${root}docs/koy/baseline` };
  mkdirSync(out.fixtures, { recursive: true });
  mkdirSync(out.docs, { recursive: true });
  const scenes = {};
  for (const name of SCENES) {
    const f = makeFixture(name);
    writeFileSync(`${out.fixtures}/${name}.json`, `${JSON.stringify(f, null, 1)}\n`);
    const metrics = legacyMetrics(f);
    const growth = await legacyGrowth(f);
    scenes[name] = {
      people: f.members.length,
      buildings: f.buildings.length,
      activeSessions: f.sessions.length,
      sitesExpected: f.sessions.filter((s) => s.strict && !s.imece).length,
      protectedSha: sha(protectedRows(f)),
      legacy: { counts: count(metrics), detail: metrics, growth: { added: growth.added, changed: growth.changed } },
    };
  }
  const sample = await villageAnswer(makeFixture("baslangic"));
  writeFileSync(`${out.docs}/village-v1.json`, `${JSON.stringify(sample.data, null, 1)}\n`);
  const manifest = {
    note: "n46 A taban manifesti. Sentetik fixture; canlı veri okunmadı.",
    head: git("rev-parse HEAD"),
    branch: git("rev-parse --abbrev-ref HEAD"),
    schemaVersions: migrations.length,
    models: CATALOG.map((i) => ({
      id: i.id, kind: i.kind, class: i.class, cost: i.cost, rare: !!i.rare, weekly: !!i.since,
      special: !!i.look?.special, monument: MONUMENTS.has(i.id), realHeight: REAL[i.id]?.boy ?? null, realPlan: REAL[i.id]?.plan ?? null,
      targetHeight: round(targetHeightOf(i.id)), claim: round(claimOf(i.id)),
    })),
    villageWire: {
      fields: ["id", "memberId", "kind", "seed", "x", "y", "facing", "minutes", "created", "likes", "mine", "model", "patched", "gift"],
      districts: ["id", "memberId", "q", "r", "seed"],
      ruins: ["memberId", "kind", "x", "y", "until"],
      top: Object.keys(sample.data),
      sample: "village-v1.json",
    },
    scenes,
  };
  writeFileSync(`${out.docs}/manifest.json`, `${JSON.stringify(manifest, null, 1)}\n`);
  console.log(JSON.stringify(Object.fromEntries(Object.entries(scenes).map(([k, v]) => [k, v.legacy.counts]))));
}
const round = (v) => (v == null ? null : Math.round(v * 100) / 100);
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
