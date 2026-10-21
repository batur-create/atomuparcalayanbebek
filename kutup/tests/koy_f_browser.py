"""n46 F: the v2 village's landscape and shared life in the real map view, at
phone size (390x844, DPR 2) and desktop: fixed clock and seed, day / evening /
night / rain / winter snow, motion settings, a hidden tab and frame cost.
Local dev server and synthetic scenes only. Chromium's phone emulation is not
a physical phone measurement.

python tests/koy_f_browser.py --out /tmp/kutup-koy-f
"""
import argparse, json, statistics
from pathlib import Path
from playwright.sync_api import sync_playwright
import tempfile
from koy_shots import CHROME, MODES, start_server, root

# Fixes the clock (the life follows Date.now) and counts / times animation frames.
CLOCK = '''([fixed]) => {
  const p0 = performance.now();
  Date.now = () => fixed + (performance.now() - p0);
  if (window.frames_) return;
  window.frames_ = [];
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((t) => { const a = performance.now(); cb(t); window.frames_.push(performance.now() - a); });
}'''
SETUP = '''async ({mode, fixture, when, motion}) => {
  window.mapTest?.view.destroy();
  document.documentElement.dataset.motion = motion;
  document.body.innerHTML = '<canvas id="map" style="width:100vw;height:100vh;display:block"></canvas>';
  document.body.style.cssText = 'margin:0;overflow:hidden;background:#a4c481';
  await document.fonts.ready;
  const make = eval(mode);
  const made = await make({fixture, hour: new Date(when).getUTCHours(), scale: null});
  const {skyAt, tinter} = await import('/src/villageWorld.js');
  const {buildWorld2} = await import('/src/koy2/world2.js');
  const sky = skyAt(when);
  // Rebuild with this moment's sky (season and daylight).
  const things = new Map(fixture.buildings.map(b => [`building:${b.id}`, {kind: b.kind, seed: b.seed, model: b.model, memberId: b.memberId}]));
  const world = buildWorld2({layout: window.koyLayout, things, members: [], me: 'm0', sky, monument: 1});
  const view = made.createView(document.querySelector('#map'), {interactive: true});
  view.resize(innerWidth, innerHeight);
  view.setWorld(world, sky, tinter(sky));
  window.mapTest = {view, world, sky};
  return {season: sky.season, night: sky.night, venues: world.life.venues.length, wild: world.life.wild.length};
}'''
# Finds the next shower after a moment, from the same shared weather the view draws.
NEXT_RAIN = '''async ([from, season]) => {
  const seed = window.koyLayout.seed + ':life';
  const {weatherAt} = await import('/src/koy2/life.js');
  for (let s = 0; s < 7 * 86400; s += 20) { const w = weatherAt(seed, from + s * 1000, season); if (w.kind) return from + s * 1000 + 40000; }
  return null;
}'''
# The busiest moment of the next two hours (most people in view at neighbourhood level).
BUSY = '''([from, rect]) => {
  const life = mapTest.world.life; let best = [from, -1];
  for (let s = 0; s < 7200; s += 15) { const n = life.at(from + s * 1000, rect, {lod: 1, sky: mapTest.sky}).people.length; if (n > best[1]) best = [from + s * 1000, n]; }
  return best;
}'''

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    args = ap.parse_args()
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    fixture = json.loads((root / 'tests/fixtures/koy/baskin100.json').read_text())
    results, passed = {}, []
    def check(name, ok, info=''):
        assert ok, f'{name} {info}'
        passed.append(name); print('PASS', name, info, flush=True)
    with tempfile.TemporaryDirectory(prefix='kutup-koy-f-') as temp:
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
                def scene(page, when, motion='full', s=9, at=(0, -2)):
                    page.evaluate(CLOCK, [when])
                    info = page.evaluate(SETUP, {'mode': MODES['v2'], 'fixture': fixture, 'when': when, 'motion': motion})
                    page.evaluate('([x, y, s]) => { mapTest.view.limits(0.5, 40); mapTest.view.flyTo({x, y, s}, 0); }', [at[0], at[1], s])
                    page.wait_for_timeout(700)
                    return info
                summer = 1781600400000  # 16 Jun 2026, 12:00 Ankara
                # 1. Day, evening and night in summer; a busy moment for people.
                page, errors = open_page()
                scene(page, summer)
                rect = [-60, -60, 60, 60]
                busy, n = page.evaluate(BUSY, [summer, rect])
                for label, when in [('gunduz', busy), ('aksam', busy + 8.4 * 3600e3), ('gece', busy + 10 * 3600e3)]:
                    info = scene(page, when)
                    page.screenshot(path=str(out / f'f-{label}-telefon.png'))
                    results[label] = info
                check('summer day, evening and night drawn without errors', not errors, str(errors[:2]))
                check('the busy moment has neighbours out', n >= 3, str(n))
                # 2. Frame cost while life moves (phone emulation, DPR 2).
                scene(page, busy)
                page.evaluate('window.frames_ = []')
                page.wait_for_timeout(3000)
                frames = page.evaluate('window.frames_')
                results['frames'] = {'count': len(frames), 'median_ms': round(statistics.median(frames), 2) if frames else None, 'p95_ms': round(sorted(frames)[int(len(frames) * .95)], 2) if frames else None}
                check('life animates at about 24 fps, not every display frame', 30 <= len(frames) <= 110, json.dumps(results['frames']))
                # 3. Hidden tab: no frames at all.
                page.evaluate('''() => { Object.defineProperty(document, 'visibilityState', {configurable: true, get: () => 'hidden'}); document.dispatchEvent(new Event('visibilitychange')); window.frames_ = []; }''')
                page.wait_for_timeout(2500)
                hidden = page.evaluate('window.frames_.length')
                results['hidden_frames'] = hidden
                check('hidden tab draws nothing', hidden == 0, str(hidden))
                page.close()
                # 4. Rain in spring, snow in winter (the shared weather's next shower).
                for label, start, season in [('yagmur', 1776243600000, 'spring'), ('kar', 1768381200000, 'winter')]:
                    page, errors = open_page()
                    scene(page, start)
                    when = page.evaluate(NEXT_RAIN, [start, season])
                    info = scene(page, when, s=7)
                    page.screenshot(path=str(out / f'f-{label}-telefon.png'))
                    results[label] = {**info, 'when': when}
                    check(f'{label} drawn', not errors and info['season'] == season, str(errors[:2]))
                    page.close()
                # 5. Still (Kıpırtısız): the loop sleeps; the village is drawn once.
                page, errors = open_page()
                scene(page, busy, motion='still')
                page.evaluate('window.frames_ = []')
                page.wait_for_timeout(2500)
                still = page.evaluate('window.frames_.length')
                page.screenshot(path=str(out / 'f-kipirtisiz-telefon.png'))
                results['still_frames'] = still
                check('still motion draws no animation frames', still == 0, str(still))
                page.close()
                # 6. Whole village on desktop (LOD 0: no decorative people) and a close-up.
                page, errors = open_page(phone=False)
                scene(page, busy, s=2.5)
                page.screenshot(path=str(out / 'f-koy-butunu-masaustu.png'))
                scene(page, busy, s=16)
                page.screenshot(path=str(out / 'f-yakin-masaustu.png'))
                check('desktop whole village and close-up drawn', not errors, str(errors[:2]))
                page.close()
                browser.close()
        finally:
            server.terminate(); server.wait(timeout=10)
    (out / 'f-results.json').write_text(json.dumps(results, indent=1))
    print(json.dumps({'passed': len(passed), 'results': results}))

if __name__ == '__main__':
    main()
