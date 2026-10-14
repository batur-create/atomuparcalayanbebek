import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeState } from '../src/sync.js';
import { mergeVillage, skyAt, tinter } from '../src/villageWorld.js';
import { tileLevel } from '../src/villageView.js';

const raw = (rev, buildings = [], extra = {}) => ({ rev, until: rev * 1000, districts: [['d', 'm', 1, 0, 7]], buildings, ruins: [], ...extra });
const home = (id, likes = 0, mine = 0) => [id, 'm', 'cottage', 4, 10, 11, 1, 25, 100, likes, mine];

test('state never moves backwards when a slow request arrives after a write', () => {
  const current = { group: { id: 'g', rev: 8 }, serverTime: 100 };
  assert.equal(mergeState(current, { group: { id: 'g', rev: 7 }, serverTime: 200 }), current);
  assert.equal(mergeState(current, { group: { id: 'g', rev: 8 }, serverTime: 99 }), current);
  assert.equal(mergeState(current, {}), current);
  const next = { group: { id: 'g', rev: 9 }, serverTime: 101 };
  assert.equal(mergeState(current, next), next);
});

test('village deltas keep positions, update likes, discard departures and ignore stale responses', () => {
  const first = mergeVillage(null, raw(1, [home('a')]));
  const next = mergeVillage(first, raw(2, [home('a', 2, 1), home('b')], { partial: true }));
  assert.equal(next.buildings.length, 2);
  assert.equal(next.buildings[0].mine, true);
  assert.equal(next.buildings[0].likes, 2);
  assert.equal(next.buildings[0].x, first.buildings[0].x);
  assert.equal(mergeVillage(next, raw(1, [])), next);
  assert.equal(mergeVillage(next, { unchanged: true, rev: 2 }), next);
  assert.equal(mergeVillage(next, raw(3, [], { partial: true, districts: [['d', null, 1, 0, 7]] })).buildings.length, 0);
  assert.equal(mergeVillage(next, raw(3, [home('a')])).buildings.length, 1, 'full replies replace rather than append');
});

test('sky follows Ankara time at noon, midnight and seasonal boundaries', () => {
  for (const date of ['2026-01-01', '2026-06-21', '2026-10-14', '2026-12-31']) {
    assert.equal(skyAt(Date.parse(`${date}T09:00:00Z`)).night, 0);
    assert.equal(skyAt(Date.parse(`${date}T21:00:00Z`)).night, 1);
    for (let h = 0; h < 24; h++) {
      const sky = skyAt(Date.parse(`${date}T00:00:00Z`) + h * 3600000);
      assert.ok(sky.night >= 0 && sky.night <= 1 && sky.warm >= 0 && sky.warm <= 1);
    }
  }
  assert.equal(tinter(skyAt(Date.parse('2026-10-14T21:00:00Z')))('#fff4c8'), '#fff4c8', 'lamps stay luminous');
});

test('visible tiles fit the cache on phones, fullscreen displays and distant large villages', () => {
  for (const [w, h] of [[375, 400], [1920, 1080], [3840, 2160]])
    for (const scale of [0.02, 0.2, 1.5, 6, 30]) {
      const ls = 2 ** (tileLevel(scale, w, h) / 2);
      const maximumVisible = (Math.ceil(w * ls / scale / 256) + 1) * (Math.ceil(h * ls / scale / 256) + 1);
      assert.ok(maximumVisible <= 40, `${w}x${h} at ${scale} fits`);
    }
});
