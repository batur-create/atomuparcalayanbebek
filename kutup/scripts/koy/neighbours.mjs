// Reproducible acceptance scenes. The 200/500 scenes continue the exact 47
// layout, including sites and centres; no convenient reseeding between shots.
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { applyPlan, emptyLayout, planPlacement, seedNeighbourhoods, validateLayout } from "../../shared/koy2/planner.js";

export const MEMBERS = ["Batur", "Bensu", "Sıla", "Ediz"].map((name, i) => ({ id: `m${i}`, name, color: ["lilac", "mint", "blue", "peach"][i], avatar: "📚", status: "away" }));
export const STAGES = [[17, 13, 10, 7], [65, 50, 45, 40], [250, 120, 80, 50]];
const EVERYDAY = ["kulube", "ev", "bostan", "kahve", "sahaf", "konak", "kule", "cicekci", "firin", "pazar"];
const RARE = { 8: "kutuphane", 16: "suleymaniye", 22: "kemer", 28: "serender", 35: "kubbe", 43: "degirmen", 72: "mardinevi", 109: "atakule", 149: "sudegirmeni", 177: "istasyon", 238: "fener", 300: "yuzenev" };
export function acceptanceScenes(seed, generator = 3) {
  let layout = seedNeighbourhoods(emptyLayout(seed, generator), MEMBERS.map((m) => m.id));
  const counts = [0, 0, 0, 0], items = [], stages = [], missing = [], times = [];
  for (const target of STAGES) {
    while (counts.some((v, i) => v < target[i])) for (let owner = 0; owner < 4; owner++) {
      if (counts[owner] >= target[owner]) continue;
      const i = items.length;
      const item = { subject: { type: "building", id: `accept-${i}` }, model: RARE[i] || EVERYDAY[i % EVERYDAY.length], owner: `m${owner}`, created: 100000 + i };
      items.push(item); counts[owner]++;
      const start = performance.now(), plan = planPlacement(layout, item);
      times.push(performance.now() - start);
      if (!plan.ok) { missing.push({ ...item, error: plan.error, rejected: plan.rejected }); continue; }
      layout = applyPlan(layout, plan);
    }
    const n = target.reduce((a, b) => a + b, 0);
    const purity = MEMBERS.map((m) => {
      const mine = layout.plots.filter((p) => p.owner === m.id), centres = layout.foci.filter((f) => f.personal);
      let correct = 0;
      for (const p of mine) if ([...centres].sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0]?.personal === m.id) correct++;
      const centre = centres.find((f) => f.personal === m.id);
      const dx = mine.reduce((s, p) => s + (p.x - (centre?.x || 0)) ** 2, 0) / (mine.length || 1);
      const dy = mine.reduce((s, p) => s + (p.y - (centre?.y || 0)) ** 2, 0) / (mine.length || 1);
      return { owner: m.id, count: mine.length, nearestCentreFraction: +(correct / (mine.length || 1)).toFixed(3), axisRatio: +Math.sqrt(Math.max(dx, dy) / (Math.min(dx, dy) || 1)).toFixed(2) };
    });
    const sorted = [...times].sort((a, b) => a - b);
    stages.push({ count: n, layout, items: [...items], members: MEMBERS, missing: [...missing], problems: validateLayout(layout), metrics: { owners: purity, planMedianMs: sorted[Math.floor(sorted.length / 2)], planP95Ms: sorted[Math.floor(sorted.length * .95)] } });
  }
  return stages;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = process.argv[2] || "/tmp/kutup-neighbours";
  mkdirSync(output, { recursive: true });
  const results = [];
  for (const seed of process.argv.slice(3).length ? process.argv.slice(3) : ["komsu-1", "komsu-2", "komsu-3"]) {
    for (const stage of acceptanceScenes(seed)) {
      writeFileSync(`${output}/${seed}-${stage.count}.json`, JSON.stringify(stage));
      const brief = { seed, count: stage.count, placed: stage.layout.plots.length, missing: stage.missing.map((x) => ({ id: x.subject.id, model: x.model, error: x.error })), problems: stage.problems, ...stage.metrics };
      console.log(JSON.stringify(brief)); results.push(brief);
    }
  }
  writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  if (results.some((r) => r.missing.length || r.problems.length)) process.exitCode = 1;
}
