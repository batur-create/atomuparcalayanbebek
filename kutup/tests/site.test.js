import { test } from 'node:test';
import assert from 'node:assert/strict';
import { beamsOf, sitePlan, siteSVG, systemOf, workHeight } from '../src/construction.js';
import { crewSVG } from '../src/crew.js';
import { craneSVG, liftRuns, mobileCraneSVG } from '../src/crane.js';
import { buildingSVG, projector, spec } from '../src/iso.js';
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
    const count = (key) => keys.filter((k) => k === key).length;
    const sys = systemOf(sp);
    // The old ways start on bare ground: no raft, no waterproofing.
    if (sys === 'arch') {
      assert.deepEqual(keys, ['mobilize', 'layout', 'divert', 'abutDig', 'abutFoot', 'abutWall', 'centering', 'voussoir', 'keystone', 'spandrel', 'fill', 'strike', 'paving', 'parapet', 'water', 'handover']);
      continue;
    }
    if (sys === 'log') {
      assert.deepEqual(keys, ['mobilize', 'layout', 'footing', 'posts', 'discs', 'sill', 'frame', 'boards', 'roofFrame', 'roofTiles', 'openings', 'ladder', 'handover']);
      continue;
    }
    if (sys === 'corbel') {
      assert.deepEqual(keys, ['mobilize', 'layout', 'mudbrick', 'stoneFoot', 'cellWalls', 'corbel', 'corbel', 'corbel', 'plaster', 'openings', 'court', 'handover']);
      assert.ok(!plan.some((p) => p.lift), 'Harran domes go up without a crane');
      continue;
    }
    if (sys === 'tensile') {
      assert.deepEqual(keys, ['mobilize', 'layout', 'excavate', 'tiers', 'anchors', 'masts', 'cables', 'membrane', 'tension', 'seats', 'stage', 'lights', 'handover']);
      continue;
    }
    if (sys === 'cantilever') {
      // The props stay until the deck is cast; the deflection is read as they come down.
      assert.deepEqual(keys, ['mobilize', 'layout', 'pit', 'raftRebar', 'raft', 'coreWall', 'corePour', 'props', 'truss', 'deck', 'release', 'glazing', 'cladding', 'openings', 'swing', 'handover']);
      continue;
    }
    // The famous ones are built the way they really were: no raft, no tower crane.
    if (sys === 'pyramid') {
      assert.deepEqual(keys, ['mobilize', 'layout', 'level', 'orient', 'courses', 'courses', 'chamber', 'courses', 'courses', 'capstone', 'casing', 'entrance', 'handover']);
      assert.ok(!plan.some((p) => p.lift));
      continue;
    }
    if (sys === 'amphitheatre') {
      assert.deepEqual(keys, ['mobilize', 'layout', 'drain', 'foundation', 'piers', 'radial', 'tiers', 'tiers', 'tiers', 'attic', 'cavea', 'arena', 'velarium', 'statues', 'handover']);
      continue;
    }
    if (sys === 'leaning') {
      // The 94-year pause comes between the third and fourth floors.
      assert.deepEqual(keys, ['mobilize', 'layout', 'found', 'floors0', 'pause', 'floors1', 'bellChamber', 'bells', 'creep', 'stabilize', 'handover']);
      continue;
    }
    assert.ok(keys.indexOf('footWater') > keys.indexOf('lean') && keys.indexOf('footWater') < keys.indexOf('footRebar'));
    const after = keys.slice(keys.indexOf('footPour') + 1);
    if (sys === 'capsule') {
      // The core is finished and the bolt templates checked before the first capsule goes up.
      assert.deepEqual(after, ['core', 'core', 'core', 'plates', 'capsules', 'capsules', 'capsules', 'torque', 'lobby', 'services', 'roof', 'handover']);
      continue;
    }
    if (sys === 'twist') {
      assert.deepEqual(after, ['core', 'core', 'floors', 'floors', 'floors', 'floors', 'glazing', 'crown', 'openings', 'handover']);
      continue;
    }
    if (sys === 'watertower') {
      // The tank is cast in one go and only takes water once the test holds.
      assert.deepEqual(after, ['shaft', 'shaft', 'shaft', 'tankForm', 'tankPour', 'dome', 'waterTest', 'stair', 'paint', 'openings', 'handover']);
      continue;
    }
    if (sys === 'shell') {
      // One form, moved umbrella to umbrella: formed, checked, poured, struck.
      assert.deepEqual(keys.slice(keys.indexOf('footPour') + 1), ['columns', 'shellForm', 'shellPour', 'shellForm', 'shellPour', 'shellForm', 'shellPour', 'shellForm', 'shellPour', 'floorFinish', 'stalls', 'openings', 'handover']);
      continue;
    }
    if (sys === 'geodesic') {
      // Ring beam, shoring tower, four rings of struts, bolts checked before the tower comes down, then the skin.
      assert.deepEqual(keys.slice(keys.indexOf('footPour') + 1), ['ringForm', 'ringPour', 'shore', 'strut', 'strut', 'strut', 'strut', 'bolts', 'unshore', 'panels', 'glazing', 'seal', 'openings', 'handover']);
      assert.deepEqual(plan.filter((p) => p.key === 'strut').map((p) => p.floor), [0, 1, 2, 3]);
      continue;
    }
    assert.deepEqual(keys.filter((k) => k.startsWith('roof')), ['roofFrame', 'roofDeck', 'roofTiles']);
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
  assert.deepEqual(['konak', 'firin', 'saat', 'kutuphane', 'bostan', 'sahaf', 'cay', 'sera', 'kubbe', 'kemer', 'serender', 'kerpic', 'pazar', 'amfi', 'konsol', 'kapsul', 'burgu', 'sukulesi', 'keops', 'kolezyum', 'pisa'].map(sys), ['rc', 'masonry', 'masonry', 'masonry', 'timber', 'timber', 'timber', 'steel', 'geodesic', 'arch', 'log', 'corbel', 'shell', 'tensile', 'cantilever', 'capsule', 'twist', 'watertower', 'pyramid', 'amphitheatre', 'leaning']);
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

test('the inspector checks the rebar before every pour, and every pour starts with a slump test', async () => {
  const { checkAt } = await import('../src/quality.js');
  const sp = spec('house', 3, 'konak');
  const plan = sitePlan(sp);
  for (const p of plan.filter((q) => q.key === 'footRebar' || q.key === 'deckRebar')) {
    assert.equal(checkAt(plan, p.a + (p.b - p.a) * 0.9)?.kind, 'inspect', p.label);
    assert.match(checkAt(plan, p.a + (p.b - p.a) * 0.99).label, /Denetim onayı ✓ beton dökülebilir/);
  }
  for (const p of plan.filter((q) => /Pour$/.test(q.key))) assert.equal(checkAt(plan, p.a + (p.b - p.a) * 0.1)?.kind, 'slump', p.label);
  assert.equal(checkAt(plan, 0.95), null);
});

test('the progress payment weighs work by cost and the quantities only grow', async () => {
  const { metraj } = await import('../src/metraj.js');
  for (const id of ['konak', 'firin', 'bostan', 'sera', 'degirmen', 'kubbe', 'kemer', 'serender', 'kerpic', 'pazar', 'amfi', 'konsol', 'kapsul', 'burgu', 'sukulesi', 'keops', 'kolezyum', 'pisa']) {
    const item = CATALOG.find((c) => c.id === id);
    const sp = spec(item.kind, 5, id);
    const plan = sitePlan(sp);
    let last = -1;
    for (const shown of steps) {
      const m = metraj(sp, plan, shown);
      assert.ok(m.hakedis >= last, `${id} at ${shown}`);
      assert.equal(m.items.length, 2);
      assert.ok(!/NaN|undefined|Infinity/.test(m.items.join()));
      last = m.hakedis;
    }
    assert.equal(metraj(sp, plan, 0).hakedis, 0);
    assert.equal(metraj(sp, plan, 1).hakedis, 100);
    assert.ok(parseFloat(metraj(sp, plan, 1).items[0].replace(/[^\d,]/g, '').replace(',', '.')) > 1, id);
  }
});

test('a concrete tower gets two shear walls; houses only columns', async () => {
  const { rcColumnsOf } = await import('../src/construction.js');
  const walls = (sp) => rcColumnsOf(sp).filter(([, , hx, hy]) => Math.max(hx, hy) > 0.3).length;
  assert.equal(walls(spec('tower', 1, 'degirmen')), 2);
  assert.equal(walls(spec('house', 1, 'konak')), 0);
});

test('the geodesic dome: a closed hemisphere, struts ring by ring, checked before the tower comes down', async () => {
  const { geometry, geodesicSVG } = await import('../src/geodesic.js');
  const { checkAt } = await import('../src/quality.js');
  const g = geometry();
  // 4V icosahedral hemisphere: 160 triangles, 250 struts, 20 base hubs; Euler holds for the open disc.
  assert.equal(g.faces.length, 160);
  assert.equal(g.edges.length, 250);
  assert.equal(g.base.length, 20);
  assert.equal(g.hubCount - g.edges.length + g.faces.length, 1);
  assert.equal(g.faces.filter((f) => f.glass).length, 30);
  // Every strut is on the sphere and no longer than 1.3 times the shortest.
  const lens = g.edges.map((e) => Math.hypot(...g.verts[e.a].map((v, i) => v - g.verts[e.b][i])));
  assert.ok(Math.max(...lens) / Math.min(...lens) < 1.3);
  const sp = spec('house', 4, 'kubbe');
  const plan = sitePlan(sp);
  const at = (key, t) => { const p = plan.find((q) => q.key === key); return p.a + (p.b - p.a) * t; };
  assert.equal(checkAt(plan, at('bolts', 0.9))?.kind, 'inspect');
  assert.match(checkAt(plan, at('bolts', 0.99)).label, /iskele sökülebilir/);
  assert.equal(checkAt(plan, at('ringPour', 0.1))?.kind, 'slump');
  assert.equal(checkAt(plan, at('ringForm', 0.9))?.kind, 'inspect');
  for (const detail of [0, 1, 2]) assert.ok(!/NaN|undefined|Infinity/.test(geodesicSVG(P, sp, 4, { detail })));
});

test('the old ways: the keystone goes in last, mouse stones are checked, the domes close without formwork', async () => {
  const { checkAt } = await import('../src/quality.js');
  const { metraj } = await import('../src/metraj.js');
  const end = (plan, key) => { const p = plan.findLast((q) => q.key === key); return p.a + (p.b - p.a) * 0.9; };
  const bridge = sitePlan(spec('house', 2, 'kemer'));
  assert.equal(checkAt(bridge, end(bridge, 'keystone'))?.kind, 'inspect');
  assert.equal(checkAt(bridge, (bridge[4].a + bridge[4].b) / 2 - (bridge[4].b - bridge[4].a) * 0.4)?.kind, 'slump', 'the abutment footings are poured');
  const serender = sitePlan(spec('cottage', 2, 'serender'));
  assert.equal(checkAt(serender, end(serender, 'discs'))?.kind, 'inspect');
  const kerpic = spec('house', 2, 'kerpic');
  const domes = sitePlan(kerpic);
  assert.equal(checkAt(domes, end(domes, 'corbel'))?.kind, 'inspect');
  const bricks = parseInt(metraj(kerpic, domes, 1).items[0].replace(/\D/g, ''));
  assert.ok(bricks > 2000 && bricks < 8000, `${bricks} bricks`);
  for (const id of ['kemer', 'serender', 'kerpic']) {
    const item = CATALOG.find((c) => c.id === id);
    const sp = spec(item.kind, 4, id);
    for (const detail of [0, 1, 2]) assert.ok(!/NaN|undefined|Infinity/.test(buildingSVG(P, sp, 4, { detail })), `${id} at detail ${detail}`);
  }
});

test('modern structures: every shell checked before its pour, anchors pulled, the tip of the cantilever measured', async () => {
  const { checkAt } = await import('../src/quality.js');
  const { metraj } = await import('../src/metraj.js');
  const { TIP } = await import('../src/modern.js');
  const mid = (p, t) => p.a + (p.b - p.a) * t;
  const market = sitePlan(spec('house', 2, 'pazar'));
  for (const p of market.filter((q) => q.key === 'shellForm')) assert.match(checkAt(market, mid(p, 0.9))?.label, new RegExp(`${p.floor + 1}\\. şemsiyenin kabuk donatısı`));
  for (const p of market.filter((q) => q.key === 'shellPour')) assert.equal(checkAt(market, mid(p, 0.1))?.kind, 'slump');
  const shell = parseInt(metraj(spec('house', 2, 'pazar'), market, 1).items[1].match(/(\d+) m²/)[1]);
  assert.ok(shell > 30 && shell < 80, `${shell} m² of shell`);
  const amfi = sitePlan(spec('house', 2, 'amfi'));
  assert.match(checkAt(amfi, mid(amfi.find((p) => p.key === 'anchors'), 0.9))?.label, /çekme testi/);
  assert.match(metraj(spec('house', 2, 'amfi'), amfi, 1).items[1], /^Membran \d+ m²$/);
  const house = sitePlan(spec('house', 2, 'konsol'));
  assert.match(checkAt(house, mid(house.find((p) => p.key === 'release'), 0.9))?.label, new RegExp(`hesap ${TIP.calc} mm`));
  assert.ok(TIP.measured <= TIP.calc);
  for (const id of ['pazar', 'amfi', 'konsol']) {
    const item = CATALOG.find((c) => c.id === id);
    const sp = spec(item.kind, 4, id);
    for (const detail of [0, 1, 2]) assert.ok(!/NaN|undefined|Infinity/.test(buildingSVG(P, sp, 4, { detail })), `${id} at detail ${detail}`);
  }
});

test('the towers: every capsule bolted and torqued, each floor turned 9°, the tank holds its water', async () => {
  const { checkAt } = await import('../src/quality.js');
  const { metraj } = await import('../src/metraj.js');
  const { TANK_M3 } = await import('../src/towers.js');
  const mid = (p, t) => p.a + (p.b - p.a) * t;
  const capsules = spec('tower', 2, 'kapsul'),
    cp = sitePlan(capsules);
  assert.match(checkAt(cp, mid(cp.find((p) => p.key === 'torque'), 0.9))?.label, /tork/);
  assert.equal(metraj(capsules, cp, 1).items[1], 'Kapsül 30/30');
  const twist = spec('tower', 2, 'burgu'),
    tp = sitePlan(twist);
  assert.match(checkAt(tp, mid(tp.find((p) => p.key === 'floors'), 0.9))?.label, /9°/);
  for (const p of tp.filter((q) => q.key === 'floors')) assert.equal(checkAt(tp, mid(p, 0.1))?.kind, 'slump');
  assert.equal(metraj(twist, tp, 1).items[1], 'Dönüş 99°');
  const water = spec('tower', 2, 'sukulesi'),
    wp = sitePlan(water);
  assert.match(checkAt(wp, mid(wp.find((p) => p.key === 'waterTest'), 0.9))?.label, /sızıntı yok/);
  assert.equal(metraj(water, wp, 1).items[1], `Su ${TANK_M3} m³`);
  assert.ok(TANK_M3 > 15 && TANK_M3 < 60);
  for (const id of ['kapsul', 'burgu', 'sukulesi']) {
    const sp = spec('tower', 4, id);
    for (const detail of [0, 1, 2]) assert.ok(!/NaN|undefined|Infinity/.test(buildingSVG(P, sp, 4, { detail })), `${id} at detail ${detail}`);
  }
});

test('the famous ones: the pyramid squared to the north, the Colosseum clamped, Pisa back to 3.97°', async () => {
  const { checkAt } = await import('../src/quality.js');
  const { metraj } = await import('../src/metraj.js');
  const mid = (p, t) => p.a + (p.b - p.a) * t;
  const keops = spec('house', 2, 'keops'),
    kp = sitePlan(keops);
  assert.match(checkAt(kp, mid(kp.find((p) => p.key === 'orient'), 0.9))?.label, /kuzey/);
  assert.deepEqual(metraj(keops, kp, 1).items, ['Blok 2,30 milyon', 'Yükseklik 146,6 m']);
  const colosseum = spec('house', 2, 'kolezyum'),
    cp = sitePlan(colosseum);
  assert.match(checkAt(cp, mid(cp.filter((p) => p.key === 'tiers').at(-1), 0.9))?.label, /kenet/);
  assert.deepEqual(metraj(colosseum, cp, 1).items, ['Traverten 100 bin m³', 'Demir kenet 300 t']);
  const pisa = spec('tower', 2, 'pisa'),
    pp = sitePlan(pisa);
  assert.match(checkAt(pp, mid(pp.find((p) => p.key === 'stabilize'), 0.9))?.label, /3,97°/);
  assert.match(metraj(pisa, pp, 1).items[0], /^Eğim 3,97°$/);
  assert.match(metraj(pisa, pp, pp.find((p) => p.key === 'creep').b).items[0], /^Eğim 5,45°$/);
  for (const [kind, id] of [['house', 'keops'], ['house', 'kolezyum'], ['tower', 'pisa']]) {
    const sp = spec(kind, 4, id);
    for (const detail of [0, 1, 2]) assert.ok(!/NaN|undefined|Infinity/.test(buildingSVG(P, sp, 4, { detail })), `${id} at detail ${detail}`);
  }
});
