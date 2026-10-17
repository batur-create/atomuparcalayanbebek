import { test } from 'node:test';
import assert from 'node:assert/strict';
import { beamsOf, sitePlan, siteSVG, systemOf, workHeight } from '../src/construction.js';
import { crewSVG } from '../src/crew.js';
import { craneSVG, liftRuns, mobileCraneSVG } from '../src/crane.js';
import { projector, spec } from '../src/iso.js';
import { CATALOG } from '../shared/catalog.js';

const P = projector({ cx: 350, cy: 268, s: 28 });
const models = CATALOG.map((item) => [item.kind, item.id]);
const steps = Array.from({ length: 101 }, (_, i) => i / 100);

test('the site plan covers the whole session in order, with beams, waterproofing and the facade layers', () => {
  for (const [kind, model] of models) {
    const sp = spec(kind, 7, model);
    const plan = sitePlan(sp);
    assert.equal(plan[0].a, 0);
    assert.equal(plan.at(-1).b, 1);
    plan.slice(1).forEach((p, i) => assert.ok(Math.abs(p.a - plan[i].b) < 1e-9, `${model}: ${p.key} starts where ${plan[i].key} ends`));
    const keys = plan.map((p) => p.key);
    assert.ok(keys.indexOf('footWater') > keys.indexOf('lean') && keys.indexOf('footWater') < keys.indexOf('footRebar'));
    assert.deepEqual(keys.filter((k) => k.startsWith('roof')), ['roofFrame', 'roofDeck', 'roofTiles']);
    const count = (key) => keys.filter((k) => k === key).length;
    const sys = systemOf(sp);
    if (sys === 'rc') {
      assert.equal(count('deckPour'), sp.floors);
      assert.ok(plan.some((p) => /kiriş ve döşeme betonu/.test(p.label)));
      assert.deepEqual(keys.filter((k) => ['eps', 'render', 'paint'].includes(k)), ['eps', 'render', 'paint']);
    } else assert.ok(!keys.includes('walls') && !keys.includes('eps'), `${model}: no infill or render on a ${sys} building`);
    if (sys === 'masonry') {
      for (const key of ['wallLay', 'tieCol', 'deckPour']) assert.equal(count(key), sp.floors, `${model}: ${key} every storey`);
      assert.ok(plan.some((p) => /hatıl ve döşeme betonu/.test(p.label)));
    }
    if (sys === 'timber') assert.ok(count('studs') === sp.floors && count('joists') === sp.floors && keys.indexOf('sheath') > keys.lastIndexOf('joists'));
    if (sys === 'steel') {
      assert.ok(['steelCol', 'steelBeam', 'brace'].every((key) => count(key) === sp.floors));
      // Glass goes on before the door is hung.
      assert.ok(keys.indexOf('finish') < keys.indexOf('openings'));
    }
    assert.ok(!keys.some((k) => ['colRebar', 'colForm', 'colPour'].includes(k)) === (sys !== 'rc'));
  }
});

test('each building is built the way its walls say', () => {
  const sys = (id) => systemOf(spec(CATALOG.find((c) => c.id === id).kind, 1, id));
  assert.deepEqual(['konak', 'firin', 'saat', 'kutuphane', 'bostan', 'sahaf', 'cay', 'sera'].map(sys), ['rc', 'masonry', 'masonry', 'masonry', 'timber', 'timber', 'timber', 'steel']);
});

test('a wider plan gets beams across the middle too', () => {
  assert.equal(beamsOf(spec('cottage', 1)).length, 4);
  assert.equal(beamsOf(spec('house', 1)).length, 6);
});

test('the mobile crane leaves for every pump pour and is there for the lifting', () => {
  const sp = spec('house', 3, 'konak');
  const plan = sitePlan(sp);
  const runs = liftRuns(plan);
  for (const p of plan.filter((p) => p.key === 'footPour' || p.key === 'deckPour'))
    assert.ok(!runs.some(([a, b]) => a < p.b && b > p.a), `crane gone during ${p.label}`);
  const mid = (key) => { const p = plan.find((q) => q.key === key); return (p.a + p.b) / 2; };
  assert.equal(mobileCraneSVG(P, sp, plan, 3, mid('deckPour'), 2), '');
  assert.ok(mobileCraneSVG(P, sp, plan, 3, mid('colPour'), 2).length > 1000);
});

test('every drawing stays finite through the whole build', () => {
  for (const [kind, model] of models) {
    const sp = spec(kind, 11, model);
    const plan = sitePlan(sp);
    for (const shown of steps) {
      const site = siteSVG(P, sp, plan, shown);
      const crew = crewSVG(P, sp, plan, shown, shown * 600);
      const z = workHeight(plan, sp, shown);
      const crane = kind === 'tower' ? craneSVG(P, sp, plan, shown * 600, shown, 1, z) : { head: mobileCraneSVG(P, sp, plan, shown * 600, shown, z), mast: '' };
      const all = site.yard + site.rest + site.front + crew.behind.join('') + crew.front.join('') + crane.mast + crane.head;
      assert.ok(!/NaN|undefined|Infinity/.test(all), `${model} at ${shown}`);
    }
  }
});
