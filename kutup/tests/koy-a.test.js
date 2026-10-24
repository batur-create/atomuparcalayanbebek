// n46 A — the renewal's fixed starting point: the four scenes rebuild to the
// committed files, what must never change has a checksum, today's /village
// wire format is pinned, and the legacy problems the renewal fixes are real.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { SCENES, makeFixture, protectedRows } from "../scripts/koy/fixtures.mjs";
import { legacyMetrics } from "../scripts/koy/legacy-metrics.mjs";
import { villageAnswer } from "../scripts/koy/baseline.mjs";

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const manifest = read("../docs/koy/baseline/manifest.json");
const sha = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex").slice(0, 16);

test("n46 A: every scene rebuilds byte for byte, with the same protected rows", () => {
  for (const name of SCENES) {
    const f = makeFixture(name);
    assert.deepEqual(f, read(`./fixtures/koy/${name}.json`), name);
    assert.equal(sha(protectedRows(f)), manifest.scenes[name].protectedSha, `${name}: protected checksum`);
    assert.ok(f.synthetic, "labelled synthetic");
    // Sessions under way are part of the inventory: building ones become sites, others never do.
    assert.equal(f.sessions.filter((s) => s.strict && !s.imece).length, manifest.scenes[name].sitesExpected);
  }
  const big = makeFixture("baskin100");
  const per = big.members.map((m) => big.buildings.filter((b) => b.memberId === m.id).length);
  assert.deepEqual(per, [76, 8, 8, 8], "the dominant builder scene");
});

test("n46 A: the legacy problems are reproduced, so the renewal can show them gone", () => {
  const y = legacyMetrics(makeFixture("yapi32"));
  // A watermill, a floating house and two bridges on dry ground; a station with no railway.
  assert.deepEqual(y.contextless.map((c) => c[1]).sort(), ["asmakopru", "istasyon", "kemer", "sudegirmeni", "yuzenev"]);
  assert.ok(y.squeezed.length >= 5, "landmarks squeezed below their own size");
  const b = legacyMetrics(makeFixture("baskin100"));
  assert.ok(b.doorsUnlinked.length + b.doorsThrough.length >= 5, "doors with no path, or a path through a neighbour");
  // What stays right today stays a requirement: nothing overlaps, nothing stands on a lane.
  for (const name of SCENES) {
    const m = legacyMetrics(makeFixture(name));
    assert.equal(m.overlaps.length, 0, name);
    assert.equal(m.laneHits.length, 0, name);
    assert.equal(m.unplaced.length, 0, name);
  }
});

test("n46 A: /api/village v1 wire format, from the production handler", async () => {
  const answer = await villageAnswer(makeFixture("baslangic"));
  assert.equal(answer.status, 200);
  assert.deepEqual(Object.keys(answer.data), manifest.villageWire.top);
  assert.deepEqual(answer.data, read("../docs/koy/baseline/village-v1.json"));
  const row = answer.data.buildings[0];
  assert.equal(row.length, manifest.villageWire.fields.length);
  // v1 carries no layout, scale, geometry version or district of a building:
  // the client guesses them (src/villageWorld.js). Contract v2 (n46 C) adds them.
  assert.ok(!("layoutId" in answer.data) && !("contractVersion" in answer.data));
});

test("n46 A: the historical catalogue stays intact and additions are explicit", async () => {
  const { CATALOG } = await import("../shared/catalog.js");
  // Later catalogue additions: Kuğulu Park, then the n48 small builds and the autumn weeklies.
  const ADDED = ['cesme', 'cardak', 'golkopru', 'arilik', 'meteo', 'sus', 'cobankulube', 'kestane', 'kusgozlem', 'kugulupark'];
  assert.deepEqual(manifest.models.map((m) => m.id), CATALOG.filter(i => !ADDED.includes(i.id)).map((i) => i.id));
  assert.deepEqual(CATALOG.filter(i => !manifest.models.some(m => m.id === i.id)).map(i => i.id), ADDED);
  assert.equal(manifest.models.length, 48);
  assert.equal(manifest.schemaVersions, 33, "taken on kutup-platform with PR #54 (migration 33)");
});
