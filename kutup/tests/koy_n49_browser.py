"""n49: the v2 village's little train, its halt, level crossings and the new
village life (ducks, a rowing boat, fireflies) in the real map view, at phone
size (390x844, DPR 2) and desktop. Fixed clock and synthetic scenes; local dev
server only. Chromium's phone emulation is not a physical phone measurement.

python tests/koy_n49_browser.py --out /tmp/kutup-n49
"""
import argparse, json, statistics, subprocess, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
from koy_shots import CHROME, MODES, start_server, root

CLOCK = '''([fixed]) => {
  const p0 = performance.now();
  Date.now = () => fixed + (performance.now() - p0);
  if (window.frames_) return;
  window.frames_ = [];
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((t) => { const a = performance.now(); cb(t); window.frames_.push(performance.now() - a); });
}'''
# Builds the scene's layout (from a fixture, or a stored layout) and its world at a moment.
SETUP = '''async ({mode, fixture, layout, when, motion}) => {
  window.mapTest?.view.destroy();
  document.documentElement.dataset.motion = motion;
  document.body.innerHTML = '<canvas id="map" style="width:100vw;height:100vh;display:block"></canvas>';
  document.body.style.cssText = 'margin:0;overflow:hidden;background:#a4c481';
  await document.fonts.ready;
  const {skyAt, tinter} = await import('/src/villageWorld.js');
  const {buildWorld2} = await import('/src/koy2/world2.js');
  const {createView} = await import('/src/villageView.js');
  let things = new Map();
  if (layout) window.koyLayout = layout;
  else {
    const make = eval(mode);
    await make({fixture, hour: 12, scale: null});
    things = new Map(fixture.buildings.map(b => [`building:${b.id}`, {kind: b.kind, seed: b.seed, model: b.model, memberId: b.memberId}]));
  }
  const sky = skyAt(when);
  const world = buildWorld2({layout: window.koyLayout, things, members: [], me: 'm0', sky, monument: 1});
  const view = createView(document.querySelector('#map'), {interactive: true});
  view.resize(innerWidth, innerHeight);
  view.setWorld(world, sky, tinter(sky));
  window.mapTest = {view, world, sky};
  const t = world.train;
  return {season: sky.season, night: sky.night, stop: t?.stop ? {kind: t.stop.kind, p: t.stop.p} : null, crossings: t ? t.crossings.length : 0};
}'''
# Moments of the next few hours: a train standing, braking in, pulling out, and a crossing closed.
MOMENTS = '''([from]) => {
  const tr = mapTest.world.train; const found = {};
  for (let s = 0; s < 6 * 3600; s += 1) {
    const at = from + s * 1000, a = tr.at(at);
    if (!a.run) continue;
    if (!found.standing && a.state === 'standing' && at / 1000 > a.run.arrive + 6) found.standing = at;
    if (!found.braking && a.state === 'braking' && a.speed < 3.5) found.braking = at;
    if (!found.leaving && a.run.stops && at / 1000 > a.run.depart + 2 && at / 1000 < a.run.depart + 3) found.leaving = at;
    if (!found.passing && a.state === 'passing' && a.speed < 3.3 && a.cars.length >= 3) found.passing = at;
    if (!found.crossing && a.crossings.some(c => c.close === 1) && a.cars.length >= 2) found.crossing = at;
  }
  return found;
}'''
# Where to look: the middle of the train (or the stop) on screen, in iso units.
AIM = '''([when]) => {
  const tr = mapTest.world.train, a = tr.at(when);
  const cars = a.cars.length ? a.cars : null;
  const p = cars ? [cars.reduce((s, c) => s + c.x, 0) / cars.length, cars.reduce((s, c) => s + c.y, 0) / cars.length] : tr.stop.p;
  return [(p[0] - p[1]) * 0.866, (p[0] + p[1]) * 0.5];
}'''
AIM_CROSSING = '''([when]) => {
  const a = mapTest.world.train.at(when); const c = a.crossings.find(c => c.close === 1);
  return [(c.x - c.y) * 0.866, (c.x + c.y) * 0.5 - 1];
}'''

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    args = ap.parse_args()
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    station_fx = json.loads((root / 'tests/fixtures/koy/yapi32.json').read_text())
    halt_fx = json.loads((root / 'tests/fixtures/koy/baskin100.json').read_text())
    # A big village whose streets reach the railway (level crossings): the growth helper's 300.
    grown = json.loads(subprocess.run(['node', '-e', 'import("./scripts/koy/grow.mjs").then(({growth}) => process.stdout.write(JSON.stringify(growth({seed: "n49-a", count: 300}).layout)))'], cwd=root, capture_output=True, text=True, check=True).stdout)
    results, passed = {}, []
    def check(name, ok, info=''):
        assert ok, f'{name} {info}'
        passed.append(name); print('PASS', name, info, flush=True)
    day = 1781600400000  # 16 Jun 2026, 12:00 Ankara
    with tempfile.TemporaryDirectory(prefix='kutup-n49-') as temp:
        server, base = start_server(temp)
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox'])
                def open_page(phone=True):
                    page = browser.new_page(viewport={'width': 390, 'height': 844} if phone else {'width': 1440, 'height': 900}, device_scale_factor=2 if phone else 1)
                    errors = []
                    page.on('pageerror', lambda e: errors.append(str(e)))
                    page.goto(base + '/tests/koy-harness.html')
                    return page, errors
                def scene(page, when, fixture=None, layout=None, motion='full', s=12, aim=AIM):
                    page.evaluate(CLOCK, [when])
                    info = page.evaluate(SETUP, {'mode': MODES['v2'], 'fixture': fixture, 'layout': layout, 'when': when, 'motion': motion})
                    x, y = page.evaluate(aim, [when])
                    page.evaluate('([x, y, s]) => { mapTest.view.limits(0.5, 40); mapTest.view.flyTo({x, y, s}, 0); }', [x, y, s])
                    page.wait_for_timeout(700)
                    return info
                def frames(page, ms=3000):
                    page.evaluate('window.frames_ = []')
                    page.wait_for_timeout(ms)
                    return page.evaluate('window.frames_')

                # 1. A village with a station: the train stands at the platform, comes in, pulls out.
                page, errors = open_page()
                info = scene(page, day, fixture=station_fx)
                check('the station is where passenger trains stop', info['stop'] and info['stop']['kind'] == 'station', json.dumps(info))
                m = page.evaluate(MOMENTS, [day])
                results['station_moments'] = m
                check('a passenger train stops and leaves within six hours', all(k in m for k in ['standing', 'braking', 'leaving']), json.dumps(m))
                for label in ['standing', 'braking', 'leaving']:
                    scene(page, m[label], fixture=station_fx)
                    page.screenshot(path=str(out / f'tren-istasyon-{label}-telefon.png'))
                # The whole small village and its winding line.
                scene(page, m['braking'], fixture=station_fx, s=3.2, aim='() => [0, 14]')
                page.screenshot(path=str(out / 'kivrimli-hat-koy-telefon.png'))
                page.close()
                # Night: lamps, lit windows and the headlamp (next train standing after 21:00).
                page, errors2 = open_page()
                night = day + 9.5 * 3600e3
                scene(page, night, fixture=station_fx)
                mn = page.evaluate(MOMENTS, [night])
                scene(page, mn['standing'], fixture=station_fx)
                page.screenshot(path=str(out / 'tren-istasyon-gece-telefon.png'))
                scene(page, mn['braking'], fixture=station_fx)
                page.screenshot(path=str(out / 'tren-istasyon-gece-geliyor-telefon.png'))
                check('station scenes drawn without errors', not errors and not errors2, str((errors + errors2)[:2]))
                # Frame cost while the train moves on screen.
                scene(page, m['braking'] - 6000, fixture=station_fx, s=9)
                f = frames(page)
                results['frames_moving'] = {'count': len(f), 'median_ms': round(statistics.median(f), 2) if f else None, 'p95_ms': round(sorted(f)[int(len(f) * .95)], 2) if f else None}
                check('a moving train animates at about 24 fps, not every display frame', 30 <= len(f) <= 110, json.dumps(results['frames_moving']))
                # Hidden tab: nothing.
                page.evaluate('''() => { Object.defineProperty(document, 'visibilityState', {configurable: true, get: () => 'hidden'}); document.dispatchEvent(new Event('visibilitychange')); window.frames_ = []; }''')
                page.wait_for_timeout(2500)
                hidden = page.evaluate('window.frames_.length')
                results['hidden_frames'] = hidden
                check('hidden tab draws nothing', hidden == 0, str(hidden))
                page.close()

                # 2. Motion off: a standing train is a still picture; a moving one is not shown.
                for motion in ['still', 'calm']:
                    page, errors = open_page()
                    scene(page, m['standing'], fixture=station_fx, motion=motion)
                    f = frames(page, 2500)
                    shown = page.evaluate('([w, mo]) => mapTest.world.train.at(w, {motion: mo}).cars.length', [m['standing'], motion])
                    moving = page.evaluate('([w, mo]) => mapTest.world.train.at(w, {motion: mo}).cars.length', [m['braking'], motion])
                    page.screenshot(path=str(out / f'tren-{motion}-telefon.png'))
                    results[f'{motion}_frames'] = len(f)
                    check(f'{motion}: no animation frames, the standing train stays as a picture, a moving one is not drawn', len(f) == 0 and shown > 0 and moving == 0 and not errors, f'{len(f)} {shown} {moving} {errors[:1]}')
                    page.close()

                # 3. No station: the halt beside the track; a goods train passing.
                page, errors = open_page()
                info = scene(page, day, fixture=halt_fx)
                check('with no station there is a halt', info['stop'] and info['stop']['kind'] == 'halt', json.dumps(info))
                mh = page.evaluate(MOMENTS, [day])
                results['halt_moments'] = mh
                scene(page, mh['standing'], fixture=halt_fx)
                page.screenshot(path=str(out / 'tren-durak-telefon.png'))
                if 'passing' in mh:
                    scene(page, mh['passing'], fixture=halt_fx)
                    page.screenshot(path=str(out / 'tren-yuk-gecerken-telefon.png'))
                check('halt scenes drawn without errors', not errors, str(errors[:2]))
                page.close()

                # 4. Village life: ducks paddling a lap of the pond, a rowing boat, fireflies on a summer night.
                page, errors = open_page()
                scene(page, day, fixture=halt_fx)
                life = page.evaluate('''([from]) => {
                  const life = mapTest.world.life, sky = mapTest.sky, big = [-400, -400, 400, 400], found = {};
                  for (let s = 0; s < 4 * 3600 && !(found.ducks && found.boat); s += 2) {
                    const o = life.at(from + s * 1000, big, {lod: 2, sky});
                    if (!found.ducks && o.ducks?.moving && o.ducks.u > 20) found.ducks = [from + s * 1000, o.ducks.brood[0].x, o.ducks.brood[0].y];
                    if (!found.boat && o.boat && o.boat.u > 40) found.boat = [from + s * 1000, o.boat.x, o.boat.y];
                  }
                  const night = from + 10 * 3600e3, nsky = {...sky, night: 1};
                  for (let s = 0; s < 4 * 3600 && !found.fireflies; s += 2) {
                    const o = life.at(night + s * 1000, big, {lod: 2, sky: nsky});
                    if (o.nature?.kind === 'fireflies' && o.nature.u > 8 && o.nature.u < o.nature.stay - 20) found.fireflies = [night + s * 1000, o.nature.x, o.nature.y];
                  }
                  return found;
                }''', [day])
                results['life_moments'] = life
                check('ducks, a boat and fireflies all come within four hours', all(k in life for k in ['ducks', 'boat', 'fireflies']), json.dumps(life))
                AT = '([when, x, y]) => [(x - y) * 0.866, (x + y) * 0.5]'
                for label in ['ducks', 'boat', 'fireflies']:
                    when, x, y = life[label]
                    page.evaluate(CLOCK, [when])
                    page.evaluate(SETUP, {'mode': MODES['v2'], 'fixture': halt_fx, 'layout': None, 'when': when, 'motion': 'full'})
                    page.evaluate('([x, y, s]) => { mapTest.view.limits(0.5, 40); mapTest.view.flyTo({x, y, s}, 0); }', [(x - y) * 0.866, (x + y) * 0.5, 16])
                    page.wait_for_timeout(700)
                    page.screenshot(path=str(out / f'hayat-{label}-telefon.png'))
                check('village life drawn without errors', not errors, str(errors[:2]))
                page.close()

                # 5. A big village: the winding line from afar, and a level crossing closed.
                page, errors = open_page(phone=False)
                info = scene(page, day, layout=grown, s=3)
                check('the grown village has level crossings', info['crossings'] > 0, json.dumps(info))
                mg = page.evaluate(MOMENTS, [day])
                results['grown_moments'] = mg
                scene(page, mg['standing'] if 'standing' in mg else day, layout=grown, s=2.2)
                page.screenshot(path=str(out / 'kivrimli-hat-masaustu.png'))
                if 'crossing' in mg:
                    scene(page, mg['crossing'], layout=grown, s=14, aim=AIM_CROSSING)
                    page.screenshot(path=str(out / 'hemzemin-gecit-masaustu.png'))
                check('crossing scenes drawn without errors', 'crossing' in mg and not errors, str(errors[:2]) + json.dumps(mg))
                page.close()
                browser.close()
        finally:
            server.terminate()
    (out / 'sonuc.json').write_text(json.dumps({'passed': passed, **results}, indent=2, ensure_ascii=False))
    print(len(passed), 'checks passed')

if __name__ == '__main__':
    main()
