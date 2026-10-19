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
    if (sys === 'mosque') {
      // The main dome waits for the piers, the arches and both semi-domes.
      assert.deepEqual(keys, ['mobilize', 'layout', 'found', 'walls', 'walls', 'piers', 'semi', 'aisles', 'dome', 'minarets', 'lead', 'court', 'interior', 'handover']);
      continue;
    }
    if (sys === 'genoese') {
      assert.deepEqual(keys, ['mobilize', 'layout', 'found', 'body', 'body', 'body', 'gallery', 'top', 'roof', 'storm', 'restore', 'lights', 'handover']);
      continue;
    }
    if (sys === 'monument') {
      assert.deepEqual(keys, ['mobilize', 'layout', 'level', 'raftRebar', 'raft', 'podium', 'frame', 'columns', 'roof', 'lahit', 'square', 'lions', 'towers', 'flag', 'handover']);
      continue;
    }
    if (sys === 'wroughtiron') {
      // No tower crane: the creeper cranes climb the legs themselves.
      assert.deepEqual(keys, ['mobilize', 'layout', 'found', 'legs', 'legs', 'platform1', 'floor2', 'shaft', 'shaft', 'crown', 'paint', 'lights', 'handover']);
      assert.ok(!plan.some((p) => p.lift));
      continue;
    }
    if (sys === 'shells') {
      assert.deepEqual(keys, ['mobilize', 'layout', 'piles', 'podium', 'precast', 'shells', 'shells', 'shells', 'tiles', 'glass', 'stairs', 'handover']);
      continue;
    }
    if (sys === 'supertall') {
      assert.deepEqual(keys, ['mobilize', 'layout', 'piles', 'raftRebar', 'raft', 'core', 'core', 'core', 'core', 'spire', 'cladding', 'lights', 'handover']);
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
  assert.deepEqual(['konak', 'firin', 'saat', 'kutuphane', 'bostan', 'sahaf', 'cay', 'sera', 'kubbe', 'kemer', 'serender', 'kerpic', 'pazar', 'amfi', 'konsol', 'kapsul', 'burgu', 'sukulesi', 'keops', 'kolezyum', 'pisa', 'suleymaniye', 'galata', 'anitkabir', 'eyfel', 'sidney', 'burj'].map(sys), ['rc', 'masonry', 'masonry', 'masonry', 'timber', 'timber', 'timber', 'steel', 'geodesic', 'arch', 'log', 'corbel', 'shell', 'tensile', 'cantilever', 'capsule', 'twist', 'watertower', 'pyramid', 'amphitheatre', 'leaning', 'mosque', 'genoese', 'monument', 'wroughtiron', 'shells', 'supertall']);
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
  for (const id of ['konak', 'firin', 'bostan', 'sera', 'degirmen', 'kubbe', 'kemer', 'serender', 'kerpic', 'pazar', 'amfi', 'konsol', 'kapsul', 'burgu', 'sukulesi', 'keops', 'kolezyum', 'pisa', 'suleymaniye', 'galata', 'anitkabir', 'eyfel', 'sidney', 'burj']) {
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

test('Süleymaniye, Galata and Anıtkabir: the dome checked, the cap lost and restored, the lions and towers counted', async () => {
  const { checkAt } = await import('../src/quality.js');
  const { metraj } = await import('../src/metraj.js');
  const mid = (p, t) => p.a + (p.b - p.a) * t;
  const mosque = spec('house', 2, 'suleymaniye'),
    mp = sitePlan(mosque);
  assert.match(checkAt(mp, mid(mp.find((p) => p.key === 'dome'), 0.9))?.label, /32 pencere/);
  assert.deepEqual(metraj(mosque, mp, 1).items, ['Kubbe tepesi 53 m', 'Şerefe 10/10']);
  const galata = spec('tower', 2, 'galata'),
    gp = sitePlan(galata);
  assert.match(metraj(galata, gp, gp.find((p) => p.key === 'storm').b).items[0], /^Yükseklik 49,9 m$/);
  assert.deepEqual(metraj(galata, gp, 1).items, ['Yükseklik 66,9 m', 'Kat 9/9']);
  const anit = spec('house', 2, 'anitkabir'),
    ap = sitePlan(anit);
  assert.equal(checkAt(ap, mid(ap.find((p) => p.key === 'raft'), 0.1))?.kind, 'slump');
  assert.match(checkAt(ap, mid(ap.find((p) => p.key === 'raftRebar'), 0.9))?.label, /radye/);
  assert.deepEqual(metraj(anit, ap, 1).items, ['Aslan 24/24', 'Kule 10/10']);
  for (const [kind, id] of [['house', 'suleymaniye'], ['tower', 'galata'], ['house', 'anitkabir']]) {
    const sp = spec(kind, 4, id);
    for (const detail of [0, 1, 2]) assert.ok(!/NaN|undefined|Infinity/.test(buildingSVG(P, sp, 4, { detail })), `${id} at detail ${detail}`);
  }
});

test('Eiffel, Sydney and Burj Khalifa: the legs meet, every rib from one sphere, the spire jacked to 828 m', async () => {
  const { checkAt } = await import('../src/quality.js');
  const { metraj } = await import('../src/metraj.js');
  const mid = (p, t) => p.a + (p.b - p.a) * t;
  const eiffel = spec('tower', 2, 'eyfel'),
    ep = sitePlan(eiffel);
  assert.match(checkAt(ep, mid(ep.find((p) => p.key === 'platform1'), 0.9))?.label, /buluştu/);
  assert.deepEqual(metraj(eiffel, ep, 1).items, ['Perçin 2,50 milyon', 'Demir 7.300 t']);
  const sydney = spec('house', 2, 'sidney'),
    sp = sitePlan(sydney);
  assert.match(checkAt(sp, mid(sp.find((p) => p.key === 'precast'), 0.9))?.label, /75 m/);
  assert.ok(sp.filter((p) => p.key === 'shells').every((p) => p.lift && p.liftAs === 'rib'));
  assert.deepEqual(metraj(sydney, sp, 1).items, ['Nervür 2.194/2.194', 'Karo 1,06 milyon']);
  const burj = spec('tower', 2, 'burj'),
    bp = sitePlan(burj);
  assert.match(checkAt(bp, mid(bp.find((p) => p.key === 'spire'), 0.9))?.label, /828 m/);
  for (const p of bp.filter((q) => q.key === 'core')) assert.equal(checkAt(bp, mid(p, 0.1))?.kind, 'slump');
  assert.deepEqual(metraj(burj, bp, 1).items, ['Yükseklik 828 m', 'Beton 330 bin m³']);
  for (const [kind, id] of [['tower', 'eyfel'], ['house', 'sidney'], ['tower', 'burj']]) {
    const s = spec(kind, 4, id);
    for (const detail of [0, 1, 2]) assert.ok(!/NaN|undefined|Infinity/.test(buildingSVG(P, s, 4, { detail })), `${id} at detail ${detail}`);
  }
});

test('every construction stage of every building has a plain explanation behind its (i)', async () => {
  const { phaseInfo, stageInfo } = await import('../src/stageInfo.js');
  const { checkAt } = await import('../src/quality.js');
  for (const [kind, model] of [...models, ['cottage', null], ['house', null], ['tower', null]])
    for (const seed of [1, 2, 3, 7]) {
      const sp = spec(kind, seed, model);
      for (const p of sitePlan(sp)) {
        const text = phaseInfo(sp, p);
        assert.ok(text && text.length > 30, `${model || kind}: ${p.key} (${p.label}) has no explanation`);
        assert.ok(text.length < 420, `${model || kind}: ${p.key} explanation is too long to read on a phone`);
      }
    }
  // Checks on site explain themselves, whatever the phase.
  const sp = spec('house', 2, null),
    plan = sitePlan(sp);
  const kinds = new Set();
  for (const s of steps) {
    const c = checkAt(plan, s);
    if (c) kinds.add(c.kind) && assert.ok(stageInfo(sp, null, c, c.label)?.text, c.label);
  }
  assert.deepEqual([...kinds].sort(), ['inspect', 'slump']);
});

// n44 ölçek: famous buildings at their real size, compressed so the village still fits.
test('the scale table: real heights in order, Burj at most five houses, claims capped, small ones as drawn', async () => {
  const { REAL, heightUnits, claimOf, targetHeightOf } = await import('../shared/olcek.js');
  const { BY_ID } = await import('../shared/catalog.js');
  const ids = Object.keys(REAL);
  for (const id of ids) assert.ok(BY_ID[id]?.look?.special, `${id} is a building of its own`);
  for (const item of CATALOG) if (item.look?.special) assert.ok(REAL[item.id], `${item.id} has a real size`);
  const byReal = [...ids].sort((a, b) => REAL[a].boy - REAL[b].boy);
  byReal.slice(1).forEach((id, i) => assert.ok(targetHeightOf(id) >= targetHeightOf(byReal[i]), `${id} is not drawn lower than ${byReal[i]}`));
  assert.equal(heightUnits(10), 10 / 1.6, 'up to a house, 1 unit = 1.6 m');
  const house = 6.25;
  assert.ok(targetHeightOf('burj') <= 5 * house && targetHeightOf('burj') > 4 * house, 'Burj: tallest, at most five houses');
  for (const id of ids) assert.ok(claimOf(id) > 0 && claimOf(id) <= 6, `${id} claims at most a third of a district`);
});

test('a building of its own is enlarged by one k: never below its drawing, within its claim, capped by the room around it', async () => {
  const { drawnSize, ridgeOf, screenBox } = await import('../src/iso.js');
  const { claimOf, REAL } = await import('../shared/olcek.js');
  const house = spec('house', 7, 'ev');
  const rows = {};
  for (const item of CATALOG) {
    if (!item.look?.special) continue;
    const local = spec(item.kind, 7, item.id, { scale: 1 }),
      sp = spec(item.kind, 7, item.id),
      size = drawnSize(item.id);
    assert.ok(!(local.k > 1), `${item.id}: the site draws it as drawn`);
    assert.ok(sp.k >= 1, `${item.id}: k ≥ 1`);
    // Its drawing really is k times bigger: height and reach.
    const b = screenBox(sp);
    assert.ok(Math.abs(b.ridge - size.ridge * sp.k) < 0.02, `${item.id}: drawn height follows k`);
    assert.ok(b.reach <= Math.max(size.reach, claimOf(item.id)) + 0.02, `${item.id}: stays inside its claim`);
    assert.ok(Math.abs(ridgeOf(sp) - ridgeOf(local) * sp.k) < 1e-6, `${item.id}: ridge scales with k`);
    // No room: as drawn today; half the room: half way.
    assert.equal(spec(item.kind, 7, item.id, { room: 0.5 }).k, 1, `${item.id}: never below today`);
    if (sp.k > 1.2) assert.ok(spec(item.kind, 7, item.id, { room: size.reach * 1.1 }).k <= 1.1 + 1e-9, `${item.id}: capped by room`);
    rows[item.id] = { ridge: b.ridge, k: sp.k, real: REAL[item.id].boy };
  }
  // Slim towers and tall buildings keep the real order; Burj stands tallest, under five houses.
  const tall = ['sukulesi', 'kapsul', 'pisa', 'galata', 'burgu', 'eyfel', 'burj'];
  tall.slice(1).forEach((id, i) => assert.ok(rows[id].ridge > rows[tall[i]].ridge, `${id} taller than ${tall[i]}`));
  assert.ok(rows.burj.ridge <= 5 * ridgeOf(house) * 1.1);
  // Landmarks are bigger than before, the little vernacular ones stay as they were.
  for (const id of ['keops', 'anitkabir', 'kolezyum', 'sidney', 'suleymaniye', 'galata', 'pisa', 'eyfel', 'burj']) assert.ok(rows[id].k >= 2, `${id} grows`);
  for (const id of ['serender', 'kerpic']) assert.equal(rows[id].k, 1, `${id} stays`);
  // The enlarged drawing's methods answer in world units.
  const burj = spec('tower', 7, 'burj');
  const plan = sitePlan(burj);
  assert.ok(workHeight(plan, burj, 0.6) > workHeight(plan, spec('tower', 7, 'burj', { scale: 1 }), 0.6) * 2);
});

test('the planner gives a landmark the space of its real size, squeezes it in when it must, and never overlaps', async () => {
  const { FOOTPRINT, createPlanner, footprintOf, cellLayout, placeIn } = await import('../shared/village.js');
  const { buildWorld, skyAt } = await import('../src/villageWorld.js');
  assert.equal(footprintOf('house', 'ev'), FOOTPRINT.house);
  assert.equal(footprintOf('cottage', 'serender'), FOOTPRINT.cottage);
  assert.ok(footprintOf('house', 'keops') > 5 && footprintOf('tower', 'burj') > 5);
  // An empty district takes a big claim most of the time; a full one never fails for want of a smaller spot.
  let roomy = 0;
  for (let i = 0; i < 40; i++) if (placeIn(cellLayout(`olcek${i}`, 1, 0), [], 'house', 'keops', { fallback: false })) roomy++;
  assert.ok(roomy >= 12, `big claims fit often enough (${roomy}/40)`);
  const kinds = { ev: 'house', kulube: 'cottage', kule: 'tower', keops: 'house', burj: 'tower', anitkabir: 'house', galata: 'tower', kolezyum: 'house' };
  for (let g = 0; g < 12; g++) {
    const planner = createPlanner(`olcek-${g}`, [], []);
    let n = 0;
    const placed = [];
    const order = ['ev', 'kulube', 'kule', 'ev', 'keops', 'kulube', 'burj', 'ev', 'anitkabir', 'kule', 'galata', 'kolezyum', 'ev', 'kulube'];
    for (const [i, model] of order.entries()) {
      const kind = kinds[model],
        memberId = `m${(i + g) % 2}`,
        spot = planner.place(memberId, kind, () => `d${++n}`, { model });
      assert.ok(spot, `${model} found a spot`);
      placed.push({ id: `b${i}`, memberId, kind, model, seed: i, ...spot });
    }
    for (const a of placed)
      for (const b of placed)
        if (a !== b) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= FOOTPRINT[a.kind] + FOOTPRINT[b.kind] + 0.25 - 1e-9);
    // Drawn, nothing reaches into a neighbour's footprint.
    const village = { buildings: placed.map(({ district, changes, ...b }) => b), districts: planner.districts, ruins: [] };
    const world = buildWorld({ groupKey: `olcek-${g}`, village, members: [{ id: 'm0', name: 'A', status: 'away' }, { id: 'm1', name: 'B', status: 'away' }], me: 'm0', sky: skyAt(Date.now()) });
    const drawn = world.items.filter((i) => i.type === 'building');
    const reachOf = (i) => i.sp.reach || FOOTPRINT[i.building.kind];
    for (const a of drawn)
      for (const b of drawn)
        if (a !== b && (a.sp.k > 1 || b.sp.k > 1)) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= reachOf(a) + reachOf(b) + 0.2, `${a.building.model} and ${b.building.model} do not overlap`);
  }
});

test('buildings placed before n44 grow only into the room around them', async () => {
  const { FOOTPRINT, cellLayout } = await import('../shared/village.js');
  const { buildWorld, skyAt } = await import('../src/villageWorld.js');
  const L = cellLayout('eski', 1, 0);
  const [cx, cy] = L.center;
  // A pyramid and a house as close as the old box footprints allowed.
  const d = FOOTPRINT.house * 2 + 0.3;
  const buildings = [
    { id: 'p', memberId: 'm0', kind: 'house', model: 'keops', seed: 1, x: cx, y: cy, facing: 0 },
    { id: 'h', memberId: 'm0', kind: 'house', model: 'ev', seed: 2, x: cx + d, y: cy, facing: 0 },
  ];
  const world = buildWorld({ groupKey: 'eski', village: { buildings, districts: [{ id: 'd1', memberId: 'm0', q: 1, r: 0 }], ruins: [] }, members: [{ id: 'm0', name: 'A', status: 'away' }], me: 'm0', sky: skyAt(Date.now()) });
  const pyramid = world.items.find((i) => i.id === 'p');
  assert.ok(pyramid.sp.k >= 1);
  assert.ok(pyramid.sp.reach <= Math.max(spec('house', 1, 'keops', { scale: 1 }).reach, d - FOOTPRINT.house - 0.25) + 1e-9, 'the pyramid stops short of the house');
});
