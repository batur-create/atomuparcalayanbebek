"""Real village renderer on reproducible saved growth scenes, never generated art.
This is desktop Chromium; phone viewport/CPU throttle is NOT a physical phone.
Usage: python tests/neighbours_browser.py --scenes /tmp/scenes --out /tmp/shots
"""
import argparse, json, shutil, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
from koy_shots import start_server

ap = argparse.ArgumentParser()
ap.add_argument('--scenes', required=True)
ap.add_argument('--seed', default='komsu-1')
ap.add_argument('--out', required=True)
args = ap.parse_args()
out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
SETUP = '''async ({scene, night, close}) => {
  const {buildWorld2} = await import('/src/koy2/world2.js');
  const {createView} = await import('/src/villageView.js');
  const {skyAt,tinter} = await import('/src/villageWorld.js');
  const {BY_ID} = await import('/shared/catalog.js');
  window.mapTest?.view.destroy();
  document.body.innerHTML = '<canvas id="map" style="width:100vw;height:100vh;display:block"></canvas>';
  document.documentElement.dataset.motion='still';
  const sky=skyAt(Date.UTC(2026,9,21,night?21:9));
  const things = new Map(scene.items.map((i,n)=>[`${i.subject.type}:${i.subject.id}`, {kind: BY_ID[i.model].kind, model:i.model, seed:n*117+15, memberId:i.owner}]));
  const start = performance.now();
  const world=buildWorld2({layout:scene.layout,things,members:scene.members,me:'m0',sky,monument:2});
  const worldMs=performance.now()-start;
  const view=createView(document.querySelector('#map'),{interactive:true});
  view.resize(innerWidth,innerHeight); view.setWorld(world,sky,tinter(sky));
  view.limits(.25,30);
  if(close) {
    const f=scene.layout.foci.find(f=>f.personal==='m0');
    const {screenOf}=await import('/shared/koy2/geom.js');
    const [x,y]=screenOf(f.x,f.y); view.flyTo({x,y,s:12},0);
  } else view.fit(world.area,35,0);
  window.mapTest={world,view,scene};
  return {worldMs, plots:world.count, centres:world.districts.length, missing:scene.missing.length};
}'''

with tempfile.TemporaryDirectory(prefix='kutup-neighbours-browser-') as temp:
    server, base = start_server(temp)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=shutil.which('chromium'), args=['--no-sandbox'])
            page = browser.new_page(viewport={'width':1440,'height':900}, reduced_motion='reduce')
            errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))
            page.goto(base+'/tests/koy-harness.html')
            results=[]
            for count in [47,200,500]:
                scene=json.loads((Path(args.scenes)/f'{args.seed}-{count}.json').read_text())
                for suffix, night, close in [('genel',False,False),('yakin',False,True),('gece',True,True)]:
                    info=page.evaluate(SETUP,{'scene':scene,'night':night,'close':close})
                    page.wait_for_timeout(250)
                    page.screenshot(path=str(out/f'{count}-{suffix}.png'))
                    results.append({'count':count,'view':suffix,**info})
            page.set_viewport_size({'width':390,'height':844})
            page.evaluate(SETUP,{'scene':scene,'night':False,'close':True})
            page.wait_for_timeout(250); page.screenshot(path=str(out/'500-telefon.png'))
            perf=page.evaluate('''async()=>{
              const start=performance.now(); const gaps=[]; let last=start;
              for(let i=0;i<45;i++) {mapTest.view.flyTo({...mapTest.view.cam,x:mapTest.view.cam.x+.5},0);await new Promise(requestAnimationFrame);let now=performance.now();gaps.push(now-last);last=now;}
              gaps.sort((a,b)=>a-b);return {frames:gaps.length,medianFrameMs:gaps[22],p95FrameMs:gaps[42],elapsedMs:performance.now()-start};
            }''')
            browser.close()
            result={'screens':results,'desktopChromiumPhoneViewport':perf,'errors':errors}
            (out/'results.json').write_text(json.dumps(result,indent=2))
            print(json.dumps(result))
            assert not errors
    finally:
        server.terminate(); server.wait(timeout=10)
