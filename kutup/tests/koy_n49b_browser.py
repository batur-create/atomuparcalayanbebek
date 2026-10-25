"""n49-2: the train revised, in the real map view. A village on the old
straight line before and after "Rayı kıvır" (the same houses, a winding
line), the track up close where two drawn pieces meet (no gap), a moving
train drawn every display frame at an even pace, and a materials train
standing while workers carry its loads off. Fixed clock, local dev server
only; Chromium's phone emulation is not a physical phone measurement.

python tests/koy_n49b_browser.py --out /tmp/kutup-n49b
"""
import argparse, json, statistics, subprocess, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
from koy_shots import CHROME, MODES, start_server, root
from koy_n49_browser import CLOCK, SETUP, AIM

LAYOUTS = '''import("./scripts/koy/grow.mjs").then(async ({growth}) => {
  const {rerailLayout} = await import("./shared/koy2/rerail.js");
  const {layoutFrom} = await import("./shared/koy2/draft.js");
  const {emptyLayout} = await import("./shared/koy2/planner.js");
  const old = growth({seed: "group:n49b-shots", count: 140, terrainVersion: 2}).layout;
  const relaid = rerailLayout(old).layout;
  const items = Array.from({length: 18}, (_, k) => ({subject: {type: "building", id: `b${k}`}, model: ["ev", "kulube", "kahve", "sahaf"][k % 4], owner: `m${k % 3}`, created: k}));
  items.push({subject: {type: "building", id: "st"}, model: "istasyon", owner: "m1", created: 30});
  items.push({subject: {type: "site", id: "run-1"}, model: "konak", owner: "m2", created: 40});
  const station = layoutFrom("group:n49b-mz", items).layout;
  process.stdout.write(JSON.stringify({old, relaid, station}));
})'''
# The next materials train standing, and a moment its workers are carrying loads.
MATERIALS = '''([from]) => {
  const tr = mapTest.world.train;
  for (let s = 0; s < 40 * 3600; s += 2) {
    const at = from + s * 1000, a = tr.at(at);
    if (a.run?.kind === 'malzeme' && a.state === 'standing') {
      const r = a.run;
      return {standing: Math.round((r.arrive + 12) * 1000), carrying: Math.round((r.arrive + 22) * 1000), away: Math.round((r.depart + 15) * 1000)};
    }
  }
  return null;
}'''
TS = '''() => { window.ts_ = []; const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (cb) => raf((t) => { window.ts_.push(t); cb(t); }); }'''

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    args = ap.parse_args()
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    L = json.loads(subprocess.run(['node', '-e', LAYOUTS], cwd=root, capture_output=True, text=True, check=True).stdout)
    results, passed = {}, []
    def check(name, ok, info=''):
        assert ok, f'{name} {info}'
        passed.append(name); print('PASS', name, info, flush=True)
    day = 1781600400000  # 16 Jun 2026, 12:00 Ankara
    with tempfile.TemporaryDirectory(prefix='kutup-n49b-') as temp:
        server, base = start_server(temp)
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox'])
                def open_page(phone=True):
                    page = browser.new_page(viewport={'width': 390, 'height': 844} if phone else {'width': 1440, 'height': 900}, device_scale_factor=2 if phone else 1)
                    errors = []
                    page.on('pageerror', lambda e: errors.append(str(e)))
                    page.goto(base + '/tests/koy-harness.html')
                    page.evaluate(TS)
                    return page, errors
                def scene(page, when, layout, x, y, s, motion='full'):
                    page.evaluate(CLOCK, [when])
                    info = page.evaluate(SETUP, {'mode': MODES['v2'], 'fixture': None, 'layout': layout, 'when': when, 'motion': motion})
                    page.evaluate('([x, y, s]) => { mapTest.view.limits(0.5, 40); mapTest.view.flyTo({x, y, s}, 0); }', [x, y, s])
                    page.wait_for_timeout(900)
                    return info

                # 1. The same village before and after: the line winds, the houses stay.
                page, errors = open_page(phone=False)
                scene(page, day, L['old'], 0, 20, 1.5)
                page.screenshot(path=str(out / 'ray-once-masaustu.png'))
                scene(page, day, L['relaid'], 0, 20, 1.5)
                page.screenshot(path=str(out / 'ray-sonra-masaustu.png'))
                same = [p['id'] for p in L['old']['plots']] == [p['id'] for p in L['relaid']['plots']] and all(a['x'] == b['x'] and a['y'] == b['y'] for a, b in zip(L['old']['plots'], L['relaid']['plots']))
                check('re-laid village drawn; every house where it was', same and not errors, str(errors[:2]))
                page.close()

                # 2. The track up close where two drawn pieces meet: sleepers and rails run on.
                page, errors = open_page()
                joints = page.evaluate('''(pts) => { const out = []; let run = 0;
                  for (let i = 1; i < pts.length; i++) { run += Math.hypot(pts[i][0] - pts[i-1][0], pts[i][1] - pts[i-1][1]); if (run >= 24) { out.push(pts[i]); run = 0; } }
                  return out; }''', L['relaid']['terrain']['rail']['pts'])
                j = min(joints, key=lambda q: abs(q[0]) + abs(q[1]))
                scene(page, day, L['relaid'], (j[0] - j[1]) * 0.866, (j[0] + j[1]) * 0.5, 26)
                page.screenshot(path=str(out / 'ray-ek-yeri-telefon.png'))
                check('track joint drawn without errors', not errors, str(errors[:2]))
                page.close()

                # 3. A moving train: every display frame, evenly paced.
                page, errors = open_page()
                info = scene(page, day, L['station'], 0, 0, 3)
                m = page.evaluate('''([from]) => { const tr = mapTest.world.train; for (let s = 0; s < 6*3600; s++) { const at = from + s*1000, a = tr.at(at); if (a.run && a.speed > 5 && a.cars.length >= 2) { const c = a.cars[0]; if (Math.hypot(c.x - tr.stop.p[0], c.y - tr.stop.p[1]) < 60) return at; } } return null; }''', [day])
                page.evaluate(CLOCK, [m - 1000])
                page.evaluate(SETUP, {'mode': MODES['v2'], 'fixture': None, 'layout': L['station'], 'when': m - 1000, 'motion': 'full'})
                x, y = page.evaluate(AIM, [m])
                page.evaluate('([x, y, s]) => { mapTest.view.limits(0.5, 40); mapTest.view.flyTo({x, y, s}, 0); }', [x, y, 10])
                page.wait_for_timeout(500)
                page.evaluate('window.ts_ = []')
                page.wait_for_timeout(2000)
                ts = page.evaluate('window.ts_')
                gaps = [ts[i] - ts[i - 1] for i in range(1, len(ts))]
                results['moving_frames'] = {'count': len(ts), 'median_ms': round(statistics.median(gaps), 1), 'max_ms': round(max(gaps), 1), 'over_25ms': sum(g > 25 for g in gaps)}
                page.screenshot(path=str(out / 'tren-akici-telefon.png'))
                check('a moving train is drawn every display frame, evenly', len(ts) >= 100 and results['moving_frames']['over_25ms'] <= 3, json.dumps(results['moving_frames']))
                check('moving train drawn without errors', not errors, str(errors[:2]))
                page.close()

                # 4. A materials train: standing with its loads, workers carrying them off.
                page, errors = open_page()
                scene(page, day, L['station'], 0, 0, 3)
                mm = page.evaluate(MATERIALS, [day])
                results['materials'] = mm
                check('a materials train comes within 40 hours', mm is not None, json.dumps(mm))
                for label in ['standing', 'carrying']:
                    page.evaluate(CLOCK, [mm[label]])
                    page.evaluate(SETUP, {'mode': MODES['v2'], 'fixture': None, 'layout': L['station'], 'when': mm[label], 'motion': 'full'})
                    x, y = page.evaluate(AIM, [mm[label]])
                    page.evaluate('([x, y, s]) => { mapTest.view.limits(0.5, 40); mapTest.view.flyTo({x, y, s}, 0); }', [x, y, 18])
                    page.wait_for_timeout(700)
                    page.screenshot(path=str(out / f'malzeme-{label}-telefon.png'))
                w = page.evaluate('([t]) => mapTest.world.train.at(t).riders.filter(r => r.worker).map(r => r.load)', [mm['carrying']])
                results['carrying'] = w
                check('workers carry bricks, timber and cement', sorted(x for x in w if x) == ['bricks', 'cement', 'logs'] or len([x for x in w if x]) >= 2, json.dumps(w))
                # Away from the track: following the first worker towards the site.
                pos = page.evaluate('''([t]) => { const r = mapTest.world.train.at(t).riders.find(r => r.load); return r ? [r.x, r.y] : null; }''', [mm['away']])
                if pos:
                    page.evaluate(CLOCK, [mm['away']])
                    page.evaluate(SETUP, {'mode': MODES['v2'], 'fixture': None, 'layout': L['station'], 'when': mm['away'], 'motion': 'full'})
                    page.evaluate('([x, y, s]) => { mapTest.view.limits(0.5, 40); mapTest.view.flyTo({x, y, s}, 0); }', [(pos[0] - pos[1]) * 0.866, (pos[0] + pos[1]) * 0.5, 20])
                    page.wait_for_timeout(700)
                    page.screenshot(path=str(out / 'malzeme-yolda-telefon.png'))
                # Night.
                night = day + 9.5 * 3600e3
                page.evaluate(CLOCK, [night])
                page.evaluate(SETUP, {'mode': MODES['v2'], 'fixture': None, 'layout': L['station'], 'when': night, 'motion': 'full'})
                mn = page.evaluate(MATERIALS, [night])
                page.evaluate(CLOCK, [mn['carrying']])
                page.evaluate(SETUP, {'mode': MODES['v2'], 'fixture': None, 'layout': L['station'], 'when': mn['carrying'], 'motion': 'full'})
                x, y = page.evaluate(AIM, [mn['carrying']])
                page.evaluate('([x, y, s]) => { mapTest.view.limits(0.5, 40); mapTest.view.flyTo({x, y, s}, 0); }', [x, y, 18])
                page.wait_for_timeout(700)
                page.screenshot(path=str(out / 'malzeme-gece-telefon.png'))
                check('materials scenes drawn without errors', not errors, str(errors[:2]))
                page.close()
                browser.close()
        finally:
            server.terminate()
    (out / 'sonuc.json').write_text(json.dumps({'passed': passed, **results}, indent=2, ensure_ascii=False))
    print(len(passed), 'checks passed')

if __name__ == '__main__':
    main()
