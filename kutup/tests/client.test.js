import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeState } from '../src/sync.js';
import postcss from 'postcss';
import { darkAt, mergeVillage, skyAt, tinter } from '../src/villageWorld.js';
import { tileLevel } from '../src/villageView.js';
import darkCss, { darkValue, parseColor } from '../scripts/dark-css.js';

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

test('auto mode turns dark at the Ankara sunset and light at sunrise; manual modes stay put', () => {
  // 15 Oct: the sun sets around 18:11 and rises around 07:25 local time (UTC+3).
  assert.equal(darkAt('auto', Date.parse('2026-10-15T09:00:00Z')), false, 'noon');
  assert.equal(darkAt('auto', Date.parse('2026-10-15T15:00:00Z')), false, '18:00, before sunset');
  assert.equal(darkAt('auto', Date.parse('2026-10-15T15:20:00Z')), true, '18:20, after sunset');
  assert.equal(darkAt('auto', Date.parse('2026-10-15T03:00:00Z')), true, '06:00, before sunrise');
  assert.equal(darkAt('auto', Date.parse('2026-06-21T16:30:00Z')), false, 'a June evening is still light at 19:30');
  assert.equal(darkAt('dark', Date.parse('2026-10-15T09:00:00Z')), true);
  assert.equal(darkAt('light', Date.parse('2026-10-15T21:00:00Z')), false);
});

test('dark twins: light surfaces go dark, dark ink goes light, vivid and night colors stay', () => {
  const lightness = (v) => Math.max(...parseColor(v).rgb) / 255;
  assert.ok(lightness(darkValue('background', '#fffefb')) < 0.25, 'paper turns dark');
  assert.ok(lightness(darkValue('border', '1px solid #e8e7df').split(' ').pop()) < 0.35, 'hairlines turn dark');
  assert.ok(lightness(darkValue('color', '#30312f')) > 0.85, 'ink turns light');
  assert.equal(darkValue('color', '#fff'), null, 'light text is already right');
  assert.equal(darkValue('background', '#262823'), null, 'night widgets stay');
  assert.equal(darkValue('background', '#d4a24c'), null, 'gold progress stays');
  assert.equal(darkValue('background', 'rgba(255, 255, 255, 0.06)'), null, 'faint tints stay');
  assert.equal(darkValue('mask', '#000'), null, 'masks are not colors');
  assert.match(darkValue('background', 'url(#fade), #fff'), /^url\(#fade\), #/, 'url() is never touched');
});

test('dark twins sit right after their rule with no extra specificity, and skip keyframes and dark scopes', async () => {
  const css = `.a{background:#fff;padding:2px}@keyframes k{from{background:#fff}}.night{background:#262823}.night p{border:1px solid #eee}.b{/* dark: keep */background:#fff}`;
  const out = (await postcss([darkCss()]).process(css, { from: undefined })).css;
  assert.match(out, /^\.a\{background:#fff;padding:2px\}:where\(html\[data-mode="dark"\]\) \.a\{background:#[0-9a-f]{6}\}/);
  assert.doesNotMatch(out, /padding:2px\}[^@]*padding/, 'only color declarations are copied');
  assert.match(out, /@keyframes k\{from\{background:#fff\}\}/);
  assert.doesNotMatch(out, /\.night p\{[^}]*\}:where/);
  assert.doesNotMatch(out, /\) \.b\{/);
});

test('visible tiles fit the cache on phones, fullscreen displays and distant large villages', () => {
  for (const [w, h] of [[375, 400], [1920, 1080], [3840, 2160]])
    for (const scale of [0.02, 0.2, 1.5, 6, 30]) {
      const ls = 2 ** (tileLevel(scale, w, h) / 2);
      const maximumVisible = (Math.ceil(w * ls / scale / 256) + 1) * (Math.ceil(h * ls / scale / 256) + 1);
      assert.ok(maximumVisible <= 40, `${w}x${h} at ${scale} fits`);
    }
});

test('every drawn avatar, with any accessories, renders clean markup and round-trips', async () => {
  const A = await import('../shared/avatars.js');
  assert.equal(A.CHARACTERS.length, 23);
  assert.ok(A.FOUNDER_CHARACTERS.length >= 1);
  const sets = [[], ...A.ACCESSORIES.map((a) => [a.id]), ['gozluk', 'kulaklik', 'bere', 'atki'], ['kep', 'atki', 'gozluk']];
  for (const ch of [...A.CHARACTERS, ...A.FOUNDER_CHARACTERS])
    for (const set of sets) {
      const value = A.composeAvatar(ch.id, set);
      const svg = A.avatarSvg(value);
      assert.doesNotMatch(svg, /NaN|undefined|null/, value);
      assert.equal(A.avatarAllowed(value, true), true, value);
      assert.equal(A.avatarAllowed(value, false), !ch.founder, value);
      assert.equal(A.avatarText(value), ch.emoji);
    }
  assert.equal(A.composeAvatar('sef', ['bere', 'kulaklik', 'gozluk']), 'k:sef+gozluk');
  assert.equal(A.composeAvatar('tekir', ['kep', 'bere']), 'k:tekir+bere');
  assert.equal(A.avatarArt('🦊'), null);
  assert.equal(A.avatarText('🦊'), '🦊');
});
