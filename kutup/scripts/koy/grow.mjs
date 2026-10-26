// n46 E: grows a synthetic v2 village one building at a time, the way a team
// would over months (plan §11.2: 32 / 100 / 500 / 1,000). Each building is
// planned against everything placed before it; nothing placed is revisited.
//
//   node scripts/koy/grow.mjs [count…]     → a table and docs/koy/e-buyume.json
//
// The mix: mostly everyday buildings, and every tenth one a model from the
// whole catalogue in turn (towers, landmarks, water and rail models).
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { MODEL_IDS, modelSpec } from "../../shared/koy2/models.js";
import { applyPlan, emptyLayout, planPlacement, validateLayout } from "../../shared/koy2/planner.js";

const EVERYDAY = ["kulube", "ev", "bostan", "kahve", "sahaf", "konak", "kule", "cicekci", "firin", "pazar"];
const groupOf = (model) => {
  const spec = modelSpec(model);
  return spec.context !== "dry" ? "water" : spec.landmark ? "dry-landmark" : "ordinary";
};

export function growth({ seed, count, unbalanced = false, onStep = null, terrainVersion }) {
  // A stride sharing a factor with the catalogue size silently omits models
  // (7 with 49 entries never reaches the pazar). Keep the old stride for 48.
  const gcd = (a,b) => b ? gcd(b,a%b) : a;
  let stride = 7;
  while (gcd(stride, MODEL_IDS.length) !== 1) stride++;
  let layout = terrainVersion ? emptyLayout(seed, undefined, terrainVersion) : emptyLayout(seed);
  const missed = [],
    near = [],
    times = [];
  for (let i = 0; i < count; i++) {
    // The everyday list is walked by everyday picks, so the slot that every
    // tenth building takes for the catalogue no longer hides its last entry
    // (the pazar, which then only came by luck of the stride; n48).
    const model = i % 10 === 9 ? MODEL_IDS[(i * stride) % MODEL_IDS.length] : EVERYDAY[(i - Math.floor(i / 10)) % EVERYDAY.length];
    // Four people; "unbalanced" is the 76 / 8 / 8 / 8 of the baskin100 scene.
    const owner = unbalanced ? (i % 100 < 76 ? "m0" : `m${1 + (i % 3)}`) : `m${i % 4}`;
    const mine = layout.plots.filter((p) => p.owner === owner);
    const t0 = performance.now();
    const plan = planPlacement(layout, { subject: { type: "building", id: `b${i}` }, model, owner, created: i });
    times.push(performance.now() - t0);
    if (!plan.ok) {
      missed.push({ i, model, group: groupOf(model), error: plan.error, rejected: plan.rejected });
      continue;
    }
    if (mine.length) near.push(Math.min(...mine.map((p) => Math.hypot(p.x - plan.plot.x, p.y - plan.plot.y))));
    layout = applyPlan(layout, plan);
    onStep?.(layout, plan);
  }
  near.sort((a, b) => a - b);
  times.sort((a, b) => a - b);
  const pick = (list, f) => (list.length ? list[Math.min(list.length - 1, Math.floor(list.length * f))] : 0);
  return {
    layout,
    missed,
    ownerMedian: pick(near, 0.5),
    ms: { median: pick(times, 0.5), p95: pick(times, 0.95), max: times.at(-1) || 0, total: times.reduce((a, b) => a + b, 0) },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const counts = process.argv.slice(2).map(Number).filter(Boolean);
  const rows = [];
  for (const count of counts.length ? counts : [32, 100, 500, 1000]) {
    for (const unbalanced of count === 100 ? [false, true] : [false]) {
      const run = growth({ seed: `n46e-${count}`, count, unbalanced });
      const row = {
        count,
        unbalanced,
        placed: run.layout.plots.length,
        missed: run.missed.map((m) => `${m.model} (${m.error})`),
        squares: run.layout.foci.filter((f) => f.status === "open" && !f.landmark).length,
        streets: run.layout.roads.filter((r) => r.status === "usable").length,
        violations: validateLayout(run.layout).length,
        ownerMedian: +run.ownerMedian.toFixed(1),
        ms: Object.fromEntries(Object.entries(run.ms).map(([k, v]) => [k, +v.toFixed(1)])),
      };
      rows.push(row);
      console.log(JSON.stringify(row));
    }
  }
  writeFileSync(new URL("../../docs/koy/e-buyume.json", import.meta.url), `${JSON.stringify(rows, null, 2)}\n`);
}
