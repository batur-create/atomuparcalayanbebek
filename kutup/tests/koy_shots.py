"""n46: fixed-scene village pictures (no production data, temp data dir).

python tests/koy_shots.py --out /tmp/koy --mode legacy
Draws each scene of tests/fixtures/koy with today's renderer (legacy), at
1440x900 and 390x844, fitted to the village and at a common world scale.
Later packages add their own modes to the same harness (see MODES).
"""
import argparse, json, os, secrets, shutil, socket, subprocess, tempfile, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
SCENES = ['baslangic', 'yapi32', 'baskin100', 'anitkabir']
CHROME = next((p for p in [os.environ.get('CHROMIUM'), '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', shutil.which('chromium'), shutil.which('chromium-browser')] if p and Path(p).exists()), None)

# Each mode: JS that turns window.fixture into window.mapTest = {view, world}.
MODES = {
    'legacy': '''async ({fixture, hour, scale}) => {
      const {buildWorld, skyAt, tinter} = await import('/src/villageWorld.js');
      const {createView} = await import('/src/villageView.js');
      const sky = skyAt(Date.UTC(2026, 9, 20, hour));
      const members = fixture.members.map(m => ({...m, status: 'away', focusEnd: 0, focusPausedAt: 0}));
      const buildings = fixture.buildings.map(b => ({...b, likes: 0, mine: false, patched: false, gift: null}));
      const world = buildWorld({groupKey: fixture.groupKey, village: {rev: 1, monument: 1, districts: fixture.districts, buildings, ruins: []}, members, me: 'm0', sky});
      return {world, sky, tint: tinter(sky), createView};
    }''',
    'v2': '''async ({fixture, hour, scale}) => {
      const {skyAt, tinter} = await import('/src/villageWorld.js');
      const {createView} = await import('/src/villageView.js');
      const {layoutFrom} = await import('/shared/koy2/draft.js');
      const {buildWorld2} = await import('/src/koy2/world2.js');
      const sky = skyAt(Date.UTC(2026, 9, 20, hour));
      const items = fixture.buildings.map(b => ({subject: {type: 'building', id: b.id}, model: b.model, owner: b.memberId, created: b.created}));
      for (const s of fixture.sessions) if (s.strict && !s.imece) items.push({subject: {type: 'site', id: `run-${s.memberId}`}, model: s.model, owner: s.memberId, created: s.end - s.minutes * 60000});
      if (fixture.imece) items.push({subject: {type: 'imece', id: fixture.imece.projectId}, model: 'anitkabir', owner: null, created: fixture.now - 1});
      const t0 = performance.now();
      const {layout, missing} = layoutFrom(fixture.groupKey, items);
      const planMs = performance.now() - t0;
      const things = new Map(fixture.buildings.map(b => [`building:${b.id}`, {kind: b.kind, seed: b.seed, model: b.model, memberId: b.memberId}]));
      for (const s of fixture.sessions) if (s.strict && !s.imece) things.set(`site:run-${s.memberId}`, {kind: s.kind, seed: s.seed, model: s.model, memberId: s.memberId, site: {shown: Math.min(.9, s.minutes / 50)}});
      if (fixture.imece) things.set(`imece:${fixture.imece.projectId}`, {kind: 'house', seed: 1923, model: 'anitkabir', site: {shown: fixture.imece.minutes / fixture.imece.goal}});
      const members = fixture.members.map(m => ({...m, status: 'away', focusEnd: 0, focusPausedAt: 0}));
      const t1 = performance.now();
      const world = buildWorld2({layout, things, members, me: 'm0', sky, monument: 1});
      window.koyLayout = layout;
      return {world, sky, tint: tinter(sky), createView, stats: {planMs, worldMs: performance.now() - t1, missing: missing.length, plots: layout.plots.length}};
    }''',
}

def start_server(temp):
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]
    log = open(Path(temp) / 'server.log', 'w')
    server = subprocess.Popen(['node', 'server/index.js', '--dev'], cwd=root, env={**os.environ, 'DATA_DIR': temp, 'ADMIN_KEY': secrets.token_hex(24), 'HOST': '127.0.0.1', 'PORT': str(port)}, stdout=log, stderr=log)
    base = f'http://127.0.0.1:{port}'
    for _ in range(200):
        try:
            urllib.request.urlopen(base + '/api/health', timeout=1); break
        except Exception:
            time.sleep(.15)
    return server, base

SETUP = '''async ({mode, fixture, hour, scale}) => {
  document.documentElement.dataset.motion = 'still';
  document.body.innerHTML = '<canvas id="map" style="width:100vw;height:100vh;display:block"></canvas>';
  document.body.style.cssText = 'margin:0;overflow:hidden;background:#a4c481';
  await document.fonts.ready;
  const make = eval(mode);
  const made = await make({fixture, hour, scale});
  const {world, sky, tint, createView} = made;
  const view = createView(document.querySelector('#map'), {interactive: true});
  view.resize(innerWidth, innerHeight);
  view.setWorld(world, sky, tint);
  window.mapTest = {view, world};
  return {count: world.count, area: world.area, stats: made.stats || null};
}'''

def shoot(page, out, label, mode, fixture, hour=9, scale=None):
    info = page.evaluate(SETUP, {'mode': MODES[mode], 'fixture': fixture, 'hour': hour, 'scale': scale})
    if scale:
        # A common world scale: the same metres per pixel in every scene and mode, centred on the square.
        page.evaluate('s => { mapTest.view.limits(0.5, 40); mapTest.view.flyTo({x: 0, y: -2, s}, 0); }', scale)
    else:
        page.evaluate('() => mapTest.view.fit(mapTest.world.area, 16, 0)')
    page.wait_for_timeout(400)
    t0 = time.time()
    page.screenshot(path=str(out / f'{label}.png'))
    return {**(info.get('stats') or {}), 'shotMs': round((time.time() - t0) * 1000)}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--mode', default='legacy', choices=list(MODES))
    ap.add_argument('--scenes', default=','.join(SCENES))
    ap.add_argument('--scale', type=float, default=None, help='same world scale (px per unit) for every shot')
    args = ap.parse_args()
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    results = {}
    with tempfile.TemporaryDirectory(prefix='kutup-koy-') as temp:
        server, base = start_server(temp)
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox'])
                for scene in args.scenes.split(','):
                    fixture = json.loads((root / 'tests/fixtures/koy' / f'{scene}.json').read_text())
                    for vw, vh, tag in [(1440, 900, 'masaustu'), (390, 844, 'telefon')]:
                        page = browser.new_page(viewport={'width': vw, 'height': vh}, device_scale_factor=1 if vw > 500 else 2)
                        errors = []
                        page.on('pageerror', lambda e: errors.append(str(e)))
                        page.goto(base + '/tests/koy-harness.html')
                        label = f'{args.mode}-{scene}-{tag}' + ('-olcek' if args.scale else '')
                        stats = shoot(page, out, label, args.mode, fixture, scale=args.scale)
                        results[f'{scene}-{tag}'] = {'errors': errors, **stats}
                        page.close()
                browser.close()
        finally:
            server.terminate(); server.wait(timeout=10)
    (out / f"{args.mode}{'-olcek' if args.scale else ''}-results.json").write_text(json.dumps(results, indent=1))
    bad = {k: v for k, v in results.items() if v['errors']}
    print(json.dumps({'shots': len(results), 'errors': bad}))
    if bad: raise SystemExit(1)

if __name__ == '__main__':
    main()
