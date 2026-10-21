"""n46 B experiments on the v2 village prototype (temp data dir, no production data).

python tests/koy_b.py --out /tmp/koy-b [--only atlas,anit,depth]
  atlas  every model drawn at its pinned scale with its contract overlaid:
         ground (green), overhead (orange, dashed), plot with garden (grey,
         dotted), entrances (red arrows), height (blue)
  anit   the shared Anıtkabir at three fixed scales (A = contract, B = 1.25x,
         C = 1.5x) beside a house and people, overview and approach cameras
  depth  people walking behind and in front of a tall tower, a wide monument,
         a tree and a bridge: drawn on top (today's map) and with the
         occluding art redrawn over them, with the cost of that per frame
"""
import argparse, json
from pathlib import Path
from playwright.sync_api import sync_playwright
from koy_shots import CHROME, start_server
import tempfile

ATLAS = '''async () => {
  const {useCanvas, useSVG, buildingSVG, spec} = await import('/src/iso.js');
  const {BY_ID, CATALOG} = await import('/shared/catalog.js');
  const {modelSpec, shapeAt, doorsAt} = await import('/shared/koy2/models.js');
  const cols = 8, cw = 300, ch = 320, rows = Math.ceil(CATALOG.length / cols);
  const c = document.createElement('canvas');
  c.width = cols * cw; c.height = rows * ch;
  document.body.innerHTML = ''; document.body.appendChild(c);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#eef2e6'; ctx.fillRect(0, 0, c.width, c.height);
  CATALOG.forEach((item, i) => {
    const m = modelSpec(item.id);
    const span = Math.max(m.over[2] - m.over[0], m.over[3] - m.over[1], m.height * 1.1, 6);
    const s = Math.min(16, 200 / span);
    const ox = (i % cols) * cw + cw / 2, oy = Math.floor(i / cols) * ch + ch * 0.62;
    const P = (x, y, z) => [ox + (x - y) * 0.866 * s, oy + (x + y) * 0.5 * s - z * s];
    const sp = spec(item.kind, 7, item.id, item.look?.special ? {scale: m.scale} : {});
    useCanvas(ctx, (x) => x, Math.max(0.35, s / 15));
    try { buildingSVG(P, sp, 7, {detail: 2, shadowP: P}); } finally { useSVG(); }
    const rect = (r, color, dash, w = 1.5) => {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash(dash);
      ctx.beginPath(); [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]].forEach(([x, y], k) => { const p = P(x, y, 0.02); k ? ctx.lineTo(...p) : ctx.moveTo(...p); });
      ctx.closePath(); ctx.stroke(); ctx.restore();
    };
    const shape = shapeAt(m, 0, 0, 0);
    rect(shape.plot, '#8a8a8a', [2, 3], 1);
    rect(m.over, '#e08a2e', [6, 4]);
    rect(m.ground, '#2f9a4a', []);
    ctx.strokeStyle = '#d23c3c'; ctx.fillStyle = '#d23c3c'; ctx.lineWidth = 2.5;
    for (const d of doorsAt(m, 0, 0, 0)) {
      const a = P(d.point[0], d.point[1], 0.05), b = P(d.point[0] + d.dir[0] * 1.6, d.point[1] + d.dir[1] * 1.6, 0.05);
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
      ctx.beginPath(); ctx.arc(b[0], b[1], 3.5, 0, Math.PI * 2); ctx.fill();
    }
    const top = P(m.ground[2] + 0.6, m.ground[1] - 0.6, m.height), foot = P(m.ground[2] + 0.6, m.ground[1] - 0.6, 0);
    ctx.strokeStyle = '#3b6fd1'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(...foot); ctx.lineTo(...top); ctx.stroke();
    ctx.fillStyle = '#2b2b2b'; ctx.font = '600 14px sans-serif'; ctx.textAlign = 'center';
    const ox0 = (i % cols) * cw, oy0 = Math.floor(i / cols) * ch;
    ctx.fillText(`${item.id} · ${m.context}${m.landmark ? ' · eser' : ''}`, ox0 + cw / 2, oy0 + 20);
    ctx.font = '12px sans-serif'; ctx.fillStyle = '#555';
    const w = (m.ground[2] - m.ground[0]) * 1.6, d = (m.ground[3] - m.ground[1]) * 1.6;
    ctx.fillText(`ölçek ${m.scale} · zemin ${w.toFixed(1)}×${d.toFixed(1)} m · boy ${(m.height * 1.6).toFixed(1)} m`, ox0 + cw / 2, oy0 + 38);
    ctx.strokeStyle = '#cfd6c4'; ctx.strokeRect(ox0 + 0.5, oy0 + 0.5, cw - 1, ch - 1);
  });
  return {w: c.width, h: c.height, models: CATALOG.length};
}'''

# A hand-made strip of village: the square, a street, the monument at a given
# scale factor with its forecourt, a house beside it and people on the street.
SCENE = '''async ({factor, focus, people}) => {
  const {skyAt, tinter} = await import('/src/villageWorld.js');
  const {createView} = await import('/src/villageView.js');
  const {buildWorld2} = await import('/src/koy2/world2.js');
  const {modelSpec, shapeAt, doorsAt} = await import('/shared/koy2/models.js');
  const sky = skyAt(Date.UTC(2026, 9, 20, 9));
  const far = {river: {pts: [[900, 900], [901, 990]], w: 3.2}, lake: {poly: [[950, 950], [952, 950], [952, 952]], cx: 951, cy: 951}, rail: null};
  const plots = [];
  const place = (id, model, x, y, facing, k = 1, extra = {}) => {
    const m = modelSpec(model);
    const sh = shapeAt(m, 0, 0, facing);
    const sc = (r) => [x + r[0] * k, y + r[1] * k, x + r[2] * k, y + r[3] * k];
    plots.push({id, subject: {type: 'building', id}, owner: 'm0', model, gv: 1, scale: m.scale * k, height: m.height * k, x, y, z: 0, facing,
      ground: sc(sh.ground), over: sc(sh.over), plot: sc(sh.plot), door: null, road: null, ...extra});
    return plots.at(-1);
  };
  // The monument faces the street (door on +y); the street runs along x in front of its forecourt.
  const mk = modelSpec('anitkabir');
  const front = mk.ground[3] * factor + mk.front * factor + 2.2;
  const anit = place('anit', 'anitkabir', 0, -front, 0, factor);
  const house = place('ev', 'ev', mk.ground[2] * factor + 6, -3.9, 0);
  const road = {id: 'r0', a: 'n0', b: 'n1', pts: [[-40, 0], [40, 0]], w: 2.4, type: 'omurga', status: 'usable', focus: 'f0'};
  const approach = {id: 'r1', a: 'n2', b: 'n3', pts: [[0, 0], [0, -front + mk.ground[3] * factor + 0.4]], w: 2.4, type: 'yaklasim', status: 'usable', focus: 'f0'};
  const layout = {seed: 'n46-olcek', terrain: far, nodes: [], roads: [road, approach], foci: [], plots};
  const references = people.map(([x, y], i) => ({x, y, coat: ['#c98577', '#7f93b8', '#d0a54f'][i % 3]}));
  const world = buildWorld2({layout, things: new Map(), members: [], sky, references});
  document.body.innerHTML = '<canvas id="map" style="width:100vw;height:100vh;display:block"></canvas>';
  const view = createView(document.querySelector('#map'), {interactive: false});
  view.resize(innerWidth, innerHeight);
  view.setWorld(world, sky, tinter(sky));
  view.limits(0.5, 60);
  const [sx, sy] = [(focus[0] - focus[1]) * 0.866, (focus[0] + focus[1]) * 0.5 - focus[2]];
  view.flyTo({x: sx, y: sy, s: focus[3]}, 0);
  return {anit: {w: (anit.ground[2] - anit.ground[0]) * 1.6, d: (anit.ground[3] - anit.ground[1]) * 1.6, h: anit.height * 1.6}, house: {h: house.height * 1.6}};
}'''

# Depth: a figure path that passes behind and in front of each occluder.
DEPTH = '''async ({mask, frames}) => {
  const {skyAt, tinter} = await import('/src/villageWorld.js');
  const {buildWorld2} = await import('/src/koy2/world2.js');
  const {modelSpec, shapeAt} = await import('/shared/koy2/models.js');
  const {useCanvas, useSVG} = await import('/src/iso.js');
  const sky = skyAt(Date.UTC(2026, 9, 20, 9)), tint = tinter(sky);
  const far = {river: {pts: [[-30, 14], [30, 14]], w: 3.2}, lake: {poly: [[950, 950], [952, 950], [952, 952]], cx: 951, cy: 951}, rail: null};
  const plots = [];
  const place = (id, model, x, y, facing) => {
    const m = modelSpec(model), sh = shapeAt(m, x, y, facing);
    plots.push({id, subject: {type: 'building', id}, owner: 'm0', model, gv: 1, scale: m.scale, height: m.height, x, y, z: 0, facing, ground: sh.ground, over: sh.over, plot: sh.plot, door: null, road: null});
  };
  place('burj', 'burgu', -16, -2, 0);
  place('anit', 'kolezyum', 2, -8, 0);
  place('kemer', 'kemer', 16, 14, 1);
  const layout = {seed: 'n46-derinlik', terrain: far, nodes: [], roads: [{id: 'r0', a: 'n0', b: 'n1', pts: [[-34, 4], [34, 4]], w: 2.0, type: 'sokak', status: 'usable', focus: 'f0'}], foci: [], plots};
  const world = buildWorld2({layout, things: new Map(), members: [], sky, references: []});
  // Twelve walkers: half on a line behind the buildings, half in front, all crossing the tree and the bridge.
  const walkers = Array.from({length: 12}, (_, i) => ({behind: i % 2 === 0, phase: i / 12}));
  const W = innerWidth, H = innerHeight;
  document.body.innerHTML = '<canvas id="c"></canvas>';
  const c = document.querySelector('#c'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const s = 9, cam = {x: 0, y: -3};
  const at = (wx, wy) => (x, y, z) => [((wx + x - wy - y) * 0.866 - cam.x) * s + W / 2, ((wx + x + wy + y) * 0.5 - z - cam.y) * s + H / 2];
  const view = {s, ctx, at, tint, detail: 2};
  const paintWorld = () => {
    ctx.fillStyle = tint('#a4c481'); ctx.fillRect(0, 0, W, H);
    useCanvas(ctx, tint, Math.max(0.35, s / 15));
    try { for (const it of world.query(-1e4, -1e4, 1e4, 1e4)) it.draw(view); } finally { useSVG(); }
  };
  paintWorld();
  const base = ctx.getImageData(0, 0, W, H);
  const posOf = (w, t) => {
    // Behind: y = -14 (behind the tower and the monument); in front: y = 9 (over the bridge's line).
    const u = (t + w.phase) % 1, x = -32 + u * 64;
    return w.behind ? [x, -15 + Math.sin(u * 9) * 0.6] : [x, 13.5 + Math.sin(u * 7) * 0.4];
  };
  const figure = (x, y, coat) => {
    const [px, py] = at(x, y)(0, 0, 0), k = s / 9;
    ctx.fillStyle = 'rgba(40,50,30,.22)'; ctx.beginPath(); ctx.ellipse(px, py, 4.2 * k, 1.6 * k, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = coat; ctx.beginPath(); ctx.roundRect(px - 3.1 * k, py - 11.6 * k, 6.2 * k, 8 * k, 2.6 * k); ctx.fill();
    ctx.fillStyle = '#e2b48e'; ctx.beginPath(); ctx.arc(px, py - 13.7 * k, 2.5 * k, 0, Math.PI * 2); ctx.fill();
  };
  // The occluders of a figure: standing art in front of it whose box covers it,
  // redrawn on top, clipped to the figure's own box.
  const cover = (x, y) => {
    const [px, py] = at(x, y)(0, 0, 0), k = s / 9;
    const list = world.occludersAt(x, y, 0.5, 1.7);
    if (!list.length) return 0;
    ctx.save(); ctx.beginPath(); ctx.rect(px - 5 * k, py - 17 * k, 10 * k, 19 * k); ctx.clip();
    useCanvas(ctx, tint, Math.max(0.35, s / 15));
    try { for (const it of list) it.draw(view); } finally { useSVG(); ctx.restore(); }
    return list.length;
  };
  let redrawn = 0;
  const t0 = performance.now();
  for (let f = 0; f < frames; f++) {
    ctx.putImageData(base, 0, 0);
    const t = f / frames;
    for (const w of walkers) {
      const [x, y] = posOf(w, t);
      figure(x, y, w.behind ? '#7f93b8' : '#c98577');
      if (mask) redrawn += cover(x, y);
    }
  }
  const ms = (performance.now() - t0) / frames;
  ctx.putImageData(base, 0, 0);
  for (const w of walkers) { const [x, y] = posOf(w, 0.37); figure(x, y, w.behind ? '#7f93b8' : '#c98577'); if (mask) cover(x, y); }
  return {msPerFrame: Math.round(ms * 100) / 100, redrawnPerFrame: Math.round(redrawn / frames * 10) / 10, walkers: walkers.length};
}'''

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--only', default='atlas,anit,depth')
    args = ap.parse_args()
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    only = set(args.only.split(','))
    results = {}
    with tempfile.TemporaryDirectory(prefix='kutup-koy-b-') as temp:
        server, base = start_server(temp)
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(executable_path=CHROME, headless=True, args=['--no-sandbox'])
                def page_for(w, h, dpr=1):
                    page = browser.new_page(viewport={'width': w, 'height': h}, device_scale_factor=dpr)
                    errors = []
                    page.on('pageerror', lambda e: errors.append(str(e)))
                    page.goto(base + '/tests/koy-harness.html')
                    page.evaluate("document.documentElement.dataset.motion = 'still'")
                    return page, errors
                if 'atlas' in only:
                    page, errors = page_for(800, 600)
                    info = page.evaluate(ATLAS)
                    page.set_viewport_size({'width': info['w'], 'height': info['h']})
                    page.screenshot(path=str(out / 'atlas-48.png'), full_page=True)
                    results['atlas'] = {**info, 'errors': errors}
                    page.close()
                if 'anit' in only:
                    for tag, k in [('A', 1.0), ('B', 1.25), ('C', 1.5)]:
                        for cam, focus, size, dpr in [('genel', [4, -8, 2, 7], (1440, 900), 1), ('yaklasim', [0, -4, 3, 16], (1440, 900), 1), ('telefon', [2, -8, 3, 6], (390, 844), 2)]:
                            page, errors = page_for(*size, dpr)
                            people = [[-1.6, 1.2], [1.3, 0.9], [0.4, -2.6 - 2 * k]]
                            info = page.evaluate(SCENE, {'factor': k, 'focus': focus, 'people': people})
                            page.wait_for_timeout(300)
                            page.screenshot(path=str(out / f'anitkabir-{tag}-{cam}.png'))
                            results[f'anit-{tag}-{cam}'] = {**info, 'factor': k, 'errors': errors}
                            page.close()
                if 'depth' in only:
                    for mask in (False, True):
                        page, errors = page_for(1440, 900)
                        info = page.evaluate(DEPTH, {'mask': mask, 'frames': 120})
                        page.screenshot(path=str(out / f'derinlik-{"maskeli" if mask else "maskesiz"}.png'))
                        results[f'depth-{"mask" if mask else "plain"}'] = {**info, 'errors': errors}
                        page.close()
                browser.close()
        finally:
            server.terminate(); server.wait(timeout=10)
    (out / 'b-results.json').write_text(json.dumps(results, indent=1, ensure_ascii=False))
    bad = {k: v['errors'] for k, v in results.items() if v.get('errors')}
    print(json.dumps({'results': {k: {kk: vv for kk, vv in v.items() if kk != 'errors'} for k, v in results.items()}, 'errors': bad}, ensure_ascii=False))
    if bad: raise SystemExit(1)

if __name__ == '__main__':
    main()
