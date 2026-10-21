// n46 F — the v2 village's shared life (plan §6.4, §10 F): real places only,
// nobody inside a wall, the people budget, shared weather and motion settings.
// Synthetic layouts only; nothing here reads a database or a reward.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SCENES, inventoryOf, makeFixture } from "../scripts/koy/fixtures.mjs";
import { layoutFrom } from "../shared/koy2/draft.js";
import { applyPlan, planPlacement } from "../shared/koy2/planner.js";
import { growth } from "../scripts/koy/grow.mjs";
import { EVENTS, LIFE, WEATHER, createLife, lodFor, walkable, weatherAt } from "../src/koy2/life.js";

const T0 = Date.UTC(2026, 9, 21, 9);
const ALL = [-1e4, -1e4, 1e4, 1e4];
const SUMMER = { night: 0, season: "summer" };
const scene = (name) => {
  const f = makeFixture(name);
  return layoutFrom(f.groupKey, inventoryOf(f)).layout;
};
const layouts = () => [...SCENES.map((n) => [n, scene(n)]), ["grow300", growth({ seed: "n46f-300", count: 300 }).layout]];
const venueOf = (id) => id.split(":").slice(0, 2).join(":");

test("n46 F: every street, door path and square crossing the life walks is walkable ground", () => {
  for (const [name, layout] of layouts()) {
    const life = createLife({ layout });
    assert.ok(life.graph.V.size > 0, name);
    for (const v of life.graph.V.values())
      for (const e of v.out)
        for (let i = 1; i < e.pts.length; i++)
          for (let t = 0; t <= 1; t += 0.1) {
            const [a, b] = [e.pts[i - 1], e.pts[i]];
            const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
            assert.ok(walkable(layout, p), `${name}: ${v.key} → ${e.to} at ${p}`);
          }
    // Every home's door joins the walk.
    const doors = layout.plots.filter((p) => p.door).length;
    assert.equal(life.graph.doors.size, doors, name);
  }
});

test("n46 F: two hours of village life — real places, nobody in a wall, the budget kept", () => {
  for (const [name, layout] of layouts()) {
    const life = createLife({ layout });
    const plots = new Map(layout.plots.map((p) => [p.id, p]));
    for (const v of life.venues) {
      if (v.kind === "cay") assert.equal(plots.get(v.plot).model, "kahve", name);
      if (v.kind === "sahaf") assert.ok(["sahaf", "kutuphane"].includes(plots.get(v.plot).model), name);
      if (v.kind === "market") assert.equal(plots.get(v.plot).model, "pazar", name);
    }
    const seen = new Set();
    for (let s = 0; s < 7200; s += 3) {
      const out = life.at(T0 + s * 1000, ALL, { lod: 1, sky: SUMMER });
      assert.ok(out.people.length <= LIFE.people, `${name} ${s}`);
      const others = out.people.filter((p) => p.kind !== "market");
      assert.ok(others.length <= LIFE.lodPeople[1], `${name} ${s}`);
      assert.ok(out.people.filter((p) => p.kind === "market").length <= 4);
      // One neighbour in one place at a time.
      assert.equal(new Set(out.people.map((p) => p.home)).size, out.people.length, `${name} ${s}`);
      const per = new Map();
      for (const p of out.people) {
        seen.add(p.kind);
        assert.ok(walkable(layout, [p.x, p.y]), `${name} ${p.id} at ${p.x},${p.y}`);
        per.set(venueOf(p.id), (per.get(venueOf(p.id)) || 0) + 1);
      }
      for (const [v, n] of per) {
        const kind = v.split(":")[0];
        const most = { cay: 2, sahaf: 2, bench: 1, greet: 2, market: 4 }[kind];
        assert.ok(n <= most, `${name} ${v} has ${n}`);
      }
    }
    assert.ok(seen.size >= 2, `${name}: ${[...seen]}`);
  }
});

test("n46 F: no kahve, no tea visit; a new kahve brings its visits, along the new streets", () => {
  const layout = scene("yapi32");
  const without = { ...layout, plots: layout.plots.filter((p) => p.model !== "kahve") };
  const life = createLife({ layout: without });
  assert.equal(life.venues.filter((v) => v.kind === "cay").length, 0);
  for (let s = 0; s < 3600; s += 5) assert.ok(life.at(T0 + s * 1000, ALL, { lod: 1, sky: SUMMER }).people.every((p) => p.kind !== "cay"));
  // A kahve placed later (a layout revision): the new world's life finds it and walks to it.
  const plan = planPlacement(layout, { subject: { type: "building", id: "new-kahve" }, model: "kahve", owner: "m0", created: 99 });
  assert.ok(plan.ok);
  const next = applyPlan(layout, plan);
  const after = createLife({ layout: next });
  assert.ok(after.venues.some((v) => v.kind === "cay" && v.plot === plan.plot.id));
  let visits = 0;
  for (let s = 0; s < 7200; s += 3)
    for (const p of after.at(T0 + s * 1000, ALL, { lod: 1, sky: SUMMER }).people) {
      assert.ok(walkable(next, [p.x, p.y]));
      if (p.id.startsWith(`cay:${plan.plot.id}`)) visits++;
    }
  assert.ok(visits > 0);
});

test("n46 F: the same clock gives the same village on every phone, in any order", () => {
  const layout = scene("baskin100");
  const [a, b] = [createLife({ layout }), createLife({ layout })];
  const times = Array.from({ length: 40 }, (_, i) => T0 + i * 97000);
  const forward = times.map((t) => JSON.stringify(a.at(t, ALL, { lod: 1, sky: SUMMER })));
  const backward = [...times].reverse().map((t) => JSON.stringify(b.at(t, ALL, { lod: 1, sky: SUMMER }))).reverse();
  assert.deepEqual(backward, forward);
});

test("n46 F: a visit's place rests between visits; greetings and markets stay small and rare", () => {
  const layout = growth({ seed: "n46f-300", count: 300 }).layout;
  const life = createLife({ layout });
  const visits = new Map();
  let markets = 0;
  for (let s = 0; s < 4 * 3600; s += 2) {
    const out = life.at(T0 + s * 1000, ALL, { lod: 1, sky: SUMMER });
    const groups = new Set(out.people.filter((p) => p.kind === "market").map((p) => venueOf(p.id)));
    assert.ok(groups.size <= 1, "one group event at a time");
    markets += groups.size;
    for (const p of out.people) {
      if (p.kind !== "cay") continue;
      const lane = p.id.split(":").slice(0, 3).join(":");
      const list = visits.get(lane) || [];
      const last = list.at(-1);
      if (last && last.id === p.id) last.end = s;
      else list.push({ id: p.id, start: s, end: s });
      visits.set(lane, list);
    }
  }
  for (const [lane, list] of visits)
    for (let i = 1; i < list.length; i++) assert.ok(list[i].start - list[i - 1].end >= EVENTS.cay.gap[0] - 4, `${lane}: ${list[i].start - list[i - 1].end}`);
  assert.ok(markets > 0, "the pazar's market met at least once in four hours");
});

test("n46 F: calm, still, the whole-village view and my own focus keep the village quiet", () => {
  const layout = scene("baskin100");
  const life = createLife({ layout });
  let busy = 0;
  for (let s = 0; s < 3600; s += 4) {
    const t = T0 + s * 1000;
    for (const motion of ["calm", "still"]) {
      const out = life.at(t, ALL, { lod: 1, motion, sky: SUMMER });
      assert.deepEqual([out.people, out.nature], [[], null]);
      assert.equal(out.moving, false);
    }
    assert.deepEqual(life.at(t, ALL, { lod: 0, sky: SUMMER }).people, []);
    const focus = life.at(t, ALL, { lod: 2, focus: true, sky: SUMMER });
    assert.ok(focus.people.length <= LIFE.focusPeople);
    assert.ok(focus.people.every((p) => p.kind !== "market"));
    if (life.at(t, ALL, { lod: 1, sky: SUMMER }).people.length > 4) busy++;
  }
  assert.ok(busy > 0, "the budget is really used when nobody is focusing");
});

test("n46 F: shared weather — short showers far apart, snow only in winter, nothing lives in the rain", () => {
  const seed = "n46f-hava:life";
  for (const season of ["winter", "spring", "summer", "autumn"]) {
    const showers = [];
    let puddleAfterSnow = 0;
    for (let s = 0; s < 7 * 86400; s += 10) {
      const w = weatherAt(seed, T0 + s * 1000, season);
      if (w.kind) {
        assert.equal(w.kind, season === "winter" ? "snow" : "rain");
        const last = showers.at(-1);
        if (last && s - last.end <= 10) last.end = s;
        else showers.push({ start: s, end: s });
      }
      if (season === "winter" && w.puddles) puddleAfterSnow++;
    }
    assert.ok(showers.length > 5, `${season}: ${showers.length}`);
    for (const r of showers) assert.ok(r.end - r.start <= WEATHER.rain[1] && r.end - r.start >= WEATHER.rain[0] - 20, `${season} ${r.end - r.start}`);
    for (let i = 1; i < showers.length; i++) assert.ok(showers[i].start - showers[i - 1].end >= 15 * 60, `${season} gap ${showers[i].start - showers[i - 1].end}`);
    assert.equal(puddleAfterSnow, 0);
  }
  // In the rain: no birds, butterflies, benches, greetings or markets; tea and books carry on.
  const layout = scene("yapi32");
  const life = createLife({ layout });
  let wet = 0;
  for (let s = 0; s < 2 * 86400; s += 7) {
    const out = life.at(T0 + s * 1000, ALL, { lod: 1, sky: { night: 0, season: "spring" } });
    if (!out.weather.kind) continue;
    wet++;
    assert.equal(out.nature, null);
    assert.ok(out.people.every((p) => p.kind === "cay" || p.kind === "sahaf"));
    assert.equal(out.moving, true);
  }
  assert.ok(wet > 0);
});

test("n46 F: butterflies only by spring and summer days; birds by day", () => {
  const layout = scene("baslangic");
  const life = createLife({ layout, trees: [{ x: 30, y: 30, size: 1 }] });
  const kinds = (sky) => {
    const out = new Set();
    for (let s = 0; s < 3 * 3600; s += 5) {
      const n = life.at(T0 + s * 1000, ALL, { lod: 1, sky }).nature;
      if (n) out.add(n.kind);
    }
    return out;
  };
  assert.ok(kinds({ night: 0, season: "summer" }).has("butterflies"));
  assert.ok(kinds({ night: 0, season: "summer" }).has("birds"));
  for (const season of ["autumn", "winter"]) assert.ok(!kinds({ night: 0, season }).has("butterflies"), season);
  const night = kinds({ night: 1, season: "summer" });
  assert.ok(!night.has("butterflies") && !night.has("birds"));
  assert.ok(night.has("wind"), "leaves still rustle at night");
});

test("n46 F: level of detail follows a house's width on screen, with ±15 % hysteresis", () => {
  assert.equal(lodFor(null, 30), 0);
  assert.equal(lodFor(null, 80), 1);
  assert.equal(lodFor(null, 200), 2);
  // Just past an edge is not enough to switch…
  assert.equal(lodFor(0, 46), 0);
  assert.equal(lodFor(1, 44), 1);
  assert.equal(lodFor(1, 125), 1);
  assert.equal(lodFor(2, 115), 2);
  // …clearly past it is.
  assert.equal(lodFor(0, 52), 1);
  assert.equal(lodFor(1, 38), 0);
  assert.equal(lodFor(1, 140), 2);
  assert.equal(lodFor(2, 101), 1);
  // A pinch back and forth across the edge does not flicker.
  let lod = 1;
  for (const px of [44, 46, 43, 47, 42, 46]) lod = lodFor(lod, px);
  assert.equal(lod, 1);
});

test("n46 F: life is decoration — it imports only plane geometry and reads no rewards", () => {
  const source = readFileSync(new URL("../src/koy2/life.js", import.meta.url), "utf8");
  const imports = [...source.matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(imports, ["../../shared/koy2/geom.js"]);
  const code = source.replace(/\/\/.*$/gm, "");
  for (const word of ["brick", "tugla", "minutes", "reward", "fetch(", "localStorage"]) assert.ok(!code.includes(word), word);
});
