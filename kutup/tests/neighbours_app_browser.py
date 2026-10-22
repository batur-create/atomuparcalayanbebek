"""Pictures from the actual React application, authenticated against a local
synthetic DB made by scripts/koy/seed-neighbours-app.mjs. No page route or map
component is replaced. Never use a live database or live sessions here.
"""
import argparse,json,os,shutil,socket,subprocess,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

root=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--data',required=True);ap.add_argument('--out',required=True)
args=ap.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
assert Path(args.data).resolve().is_relative_to('/tmp')
with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
base=f'http://127.0.0.1:{port}'
log=open(out/'server.log','w')
server=subprocess.Popen(['node','server/index.js','--dev'],cwd=root,env={**os.environ,'DATA_DIR':args.data,'PORT':str(port),'HOST':'127.0.0.1','ADMIN_KEY':'local-visual-test-only'},stdout=log,stderr=log)
try:
 for _ in range(180):
  try:urllib.request.urlopen(base+'/api/health',timeout=1);break
  except OSError:time.sleep(.1)
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'])
  results=[]
  for session in json.loads((Path(args.data)/'browser-sessions.json').read_text()):
   ctx=browser.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce')
   name,value=session['cookie'].split('=',1)
   ctx.add_cookies([{'name':name,'value':value,'domain':'127.0.0.1','path':'/api'}])
   ctx.add_init_script("localStorage.setItem('kutup-tur','done');localStorage.setItem('kutup-mode','light');")
   # Only the UI sky clock is fixed; the server and DB keep their real clock.
   ctx.add_init_script("const RealDate=Date;const hour=localStorage.getItem('kutup-visual-night')==='1'?21:9;window.Date=class extends RealDate{constructor(...a){super(...(a.length?a:[RealDate.UTC(2026,9,22,hour)]));}static now(){return RealDate.UTC(2026,9,22,hour)}}")
   page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(base);expect(page.locator('.app-shell')).to_be_visible(timeout=20000)
   page.locator('.sidebar').get_by_role('button',name='Köy',exact=True).click()
   wrap=page.locator('.village-map-wrap');expect(wrap.locator('canvas').first).to_be_visible(timeout=20000)
   wrap.get_by_role('button',name='Tam ekran',exact=True).click();page.wait_for_timeout(1200)
   expect(wrap).to_have_class('village-map-wrap village-full')
   page.screenshot(path=str(out/f"app-{session['label']}-genel.png"))
   wrap.get_by_role('button',name='Mahalleme git',exact=True).click();page.wait_for_timeout(900)
   page.screenshot(path=str(out/f"app-{session['label']}-yakin.png"))
   # Test real map zoom and dragging, without rebuilding the scene.
   canvas=wrap.locator('canvas').first;box=canvas.bounding_box()
   page.mouse.move(box['x']+box['width']*.5,box['y']+box['height']*.5)
   page.mouse.down();page.mouse.move(box['x']+box['width']*.5+80,box['y']+box['height']*.5+30,steps=12);page.mouse.up()
   wrap.get_by_role('button',name='Yakınlaştır',exact=True).click();page.wait_for_timeout(250)
   # Neighbour chips must remain usable, with a stable centre to fly to.
   chips=wrap.locator('.map-people button');assert chips.count()==4
   chips.nth(1).click();page.wait_for_timeout(900)
   page.screenshot(path=str(out/f"app-{session['label']}-komsu.png"))
   if session['label']=='47':
    page.evaluate("() => localStorage.setItem('kutup-visual-night','1')")
    # A reload creates the night scene through the application's normal hook.
    page.reload();expect(page.locator('.app-shell')).to_be_visible()
    page.locator('.sidebar').get_by_role('button',name='Köy',exact=True).click()
    wrap.get_by_role('button',name='Tam ekran',exact=True).click();page.wait_for_timeout(900)
    wrap.get_by_role('button',name='Mahalleme git',exact=True).click();page.wait_for_timeout(900)
    page.screenshot(path=str(out/'app-47-gece.png'))
   results.append({'scene':session['label'],'expectedBuildings':session['count'],'missing':session['missing'],'errors':errors,'neighbourButtons':chips.count()})
   assert not errors,errors
   ctx.close()
  browser.close();(out/'results.json').write_text(json.dumps(results,indent=2));print(json.dumps(results))
finally:
 server.terminate();server.wait(timeout=10);log.close()
