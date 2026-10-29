// n51 — the train's status and timetable (for the notice and the card).
import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutFrom } from "../shared/koy2/draft.js";
import { KIND_NAMES, createTrain } from "../src/koy2/train.js";

const T0 = Date.UTC(2026, 9, 29, 9);
const houses = Array.from({ length: 16 }, (_, k) => ({ subject: { type: "building", id: `b${k}` }, model: ["ev", "kulube", "kahve", "sahaf"][k % 4], owner: `m${k % 3}`, created: k }));
const station = { subject: { type: "building", id: "st" }, model: "istasyon", owner: "m1", created: 100 };

test("n51: status follows the run and agrees with at()", () => {
  const { layout } = layoutFrom("group:n51-a", [...houses, station]);
  const tr = createTrain(layout);
  let seen = 0, standing = 0;
  for (let t = T0; t < T0 + 3 * 3600e3; t += 3000) {
    const st = tr.status(t), at = tr.at(t);
    assert.equal(!!st, !!at.run, `t=${t}`);
    if (!st) continue;
    seen++;
    assert.ok(KIND_NAMES[st.kind]);
    assert.equal(st.kind, at.run.kind);
    if (st.state === "standing") {
      standing++;
      assert.ok(st.leaves > 0 && st.eta === 0);
    }
    if (st.state === "coming" || st.state === "braking") assert.ok(st.eta > 0);
    if (!st.stops) assert.equal(st.state, "passing");
  }
  assert.ok(seen > 0 && standing > 0);
});

test("n51: the timetable is ordered, deterministic and starts with what is on the line or next", () => {
  const { layout } = layoutFrom("group:n51-b", [...houses, station]);
  const a = createTrain(layout), b = createTrain(layout);
  const t = T0 + 17 * 60e3;
  const x = a.timetable(t, 4);
  assert.deepEqual(x, b.timetable(t, 4));
  assert.ok(x.length >= 2);
  for (let i = 1; i < x.length; i++) assert.ok(x[i].n > x[i - 1].n);
  const on = a.status(t);
  if (on) assert.equal(x[0].n, on.n);
  else assert.ok(x[0].at >= t - 1);
});

test("n51: a materials train's status says whether its loads go to a site", () => {
  const { layout } = layoutFrom("group:n51-c", [...houses, station]);
  const tr = createTrain(layout);
  let found = 0;
  for (let t = T0; t < T0 + 24 * 3600e3 && !found; t += 20000) {
    const st = tr.status(t);
    if (st?.kind === "malzeme") {
      found++;
      assert.equal(typeof st.site, "boolean");
    }
  }
  assert.ok(found);
});
