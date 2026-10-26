"""Kuğulu Park: actual app/delivery/map plus isolated production stage/motion
evidence. All accounts, owner key, data and sessions are temporary and synthetic.
"""
import argparse, hashlib, json, os, shutil, socket, subprocess, tempfile, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

root=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--artifacts',required=True);args=ap.parse_args()
out=Path(args.artifacts).resolve();out.mkdir(parents=True,exist_ok=True)
results={};errors=[]
with tempfile.TemporaryDirectory(prefix='kutup-park-') as data:
    with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
    base=f'http://127.0.0.1:{port}'
    log=open(out/'server.log','w')
    server=subprocess.Popen(['node','server/index.js','--dev'],cwd=root,env={**os.environ,'DATA_DIR':data,'ADMIN_KEY':'local-park-browser-only','KUTUP_TEST_HOOKS':'1','HOST':'127.0.0.1','PORT':str(port)},stdout=log,stderr=log)
    try:
        for _ in range(200):
            try:urllib.request.urlopen(base+'/api/health',timeout=1);break
            except OSError:time.sleep(.1)
        with sync_playwright() as p:
            browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
            ctx=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce')
            async_headers={'X-Kutup':'1','Content-Type':'application/json'}
            def post(path,body,owner=False):
                r=ctx.request.post(base+'/api'+path,data=json.dumps(body),headers={**async_headers,**({'X-Owner-Key':'local-park-browser-only'} if owner else {})})
                assert r.ok,(path,r.status,r.text()[:200]);return r.json()
            joined=post('/groups',{'name':'Atölye','username':'park_browser','password':'local-park-pass'})
            mid=joined['memberId']
            post(f'/owner/members/{mid}/gift',{'model':'kugulupark','note':'Yerel görsel denemesi'},True)
            post(f'/owner/members/{mid}/gift',{'model':'ev','note':'Ölçek karşılaştırması'},True)
            post(f'/owner/members/{mid}/unlock',{'model':'kugulupark'},True)
            post('/__test/village-v2',{'name':'Atölye'})
            deliveries=ctx.request.get(base+'/api/build-deliveries').json()
            for item in deliveries:
                if item['model']!='kugulupark':post('/build-deliveries/'+item['id'],{})
            post('/blueprints/rewards/seen',{'memberId':mid,'models':['kugulupark']})
            ctx.add_init_script("localStorage.setItem('kutup-tur','done');localStorage.setItem('kutup-motion','still');localStorage.setItem('kutup-mode','light');const RD=Date;window.Date=class extends RD{constructor(...a){super(...(a.length?a:[RD.UTC(2026,9,22,localStorage.getItem('park-night')==='1'?21:9)]))}static now(){return RD.UTC(2026,9,22,localStorage.getItem('park-night')==='1'?21:9)}}")
            page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(base);expect(page.locator('.app-shell')).to_be_visible(timeout=30000)
            expect(page.locator('.build-delivery')).to_be_visible(timeout=15000)
            page.wait_for_timeout(800);page.locator('.build-delivery').screenshot(path=str(out/'uygulama-yakin.png'))
            page.get_by_role('button',name='Köyde gör',exact=True).click()
            page.wait_for_timeout(600)
            wrap=page.locator('.village-map-wrap');expect(wrap).to_be_visible()
            wrap.get_by_role('button',name='Tam ekran',exact=True).click();page.wait_for_timeout(700)
            wrap.get_by_role('button',name='Mahalleme git',exact=True).click();page.wait_for_timeout(500)
            page.screenshot(path=str(out/'uygulama-koy.png'))
            page.evaluate("localStorage.setItem('park-night','1');localStorage.setItem('kutup-mode','dark')")
            page.reload();expect(page.locator('.app-shell')).to_be_visible(timeout=30000)
            # The map now has a durable URL; reloading restores fullscreen directly.
            expect(wrap.get_by_role('button',name='Tam ekrandan çık',exact=True)).to_be_visible()
            assert page.url.split('?')[0].endswith('/koy/harita')
            results['fullscreenReload']=True
            page.wait_for_timeout(500)
            wrap.get_by_role('button',name='Mahalleme git',exact=True).click();page.wait_for_timeout(500)
            page.screenshot(path=str(out/'uygulama-gece.png'))
            results['actualApp']={'delivery':True,'village':True,'night':True,'syntheticBuildings':2}
            # Mobile overflow on the actual application, in both colour modes.
            for mode in ['light','dark']:
                page.set_viewport_size({'width':375,'height':812})
                page.evaluate('(mode)=>{localStorage.setItem("kutup-mode",mode);document.documentElement.dataset.mode=mode}',mode)
                page.screenshot(path=str(out/f'uygulama-telefon-{mode}.png'))
                overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
                assert not overflow
            results['mobile']={'width':375,'modes':['light','dark'],'overflow':False}
            # Stage gallery uses the unmodified production ConstructionScene.
            gallery=browser.new_page(viewport={'width':1200,'height':1420},reduced_motion='reduce')
            gallery.on('pageerror',lambda e:errors.append(str(e)))
            gallery.goto(base+'/tests/koy-harness.html')
            gallery.evaluate('''async()=>{
              const React=(await import('/node_modules/.vite/deps/react.js')).default;
              const dom=await import('/node_modules/.vite/deps/react-dom_client.js');
              const createRoot=dom.createRoot||dom.default.createRoot;
              await import('/src/styles.css');await import('/src/motion.css');
              const {ConstructionScene}=await import('/src/Village.jsx');
              document.documentElement.dataset.motion='still';document.body.style.cssText='margin:0;background:#f6f5f0';
              document.body.innerHTML='<div id="cards" style="padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px"></div>';
              const now=Date.now(),values=[.09,.24,.48,.76,.94,1];
              createRoot(document.getElementById('cards')).render(values.map(v=>React.createElement('article',{key:v,style:{background:'#fffefb',padding:12,borderRadius:12}},React.createElement('b',{},v===1?'Kuğulu Park · tamamlandı':`Kuğulu Park · seans %${Math.round(v*100)}`),React.createElement(ConstructionScene,v===1?{outcome:{type:'built',at:now-5000,kind:'house',model:'kugulupark',seed:7}}:{run:{kind:'house',model:'kugulupark',seed:7,minutes:75,endsAt:now+(1-v)*75*60000}}))));
            }''')
            gallery.wait_for_timeout(800);gallery.screenshot(path=str(out/'insaat-asamalari.png'),full_page=True)
            results['stages']=6
            # The actual live water layer must change; static park must not.
            motion=browser.new_page(viewport={'width':1000,'height':780})
            motion.on('pageerror',lambda e:errors.append(str(e)))
            motion.goto(base+'/tests/koy-harness.html')
            motion.evaluate('''async()=>{
              const React=(await import('/node_modules/.vite/deps/react.js')).default;
              const dom=await import('/node_modules/.vite/deps/react-dom_client.js');
              await import('/src/styles.css');await import('/src/motion.css');
              const {ConstructionScene}=await import('/src/Village.jsx');
              document.documentElement.dataset.motion='full';document.body.innerHTML='<div id="one" style="max-width:950px;margin:auto"></div>';
              (dom.createRoot||dom.default.createRoot)(document.getElementById('one')).render(React.createElement(ConstructionScene,{outcome:{type:'built',at:Date.now()-5000,kind:'house',model:'kugulupark',seed:7}}));
            }''')
            motion.wait_for_timeout(700)
            before=motion.locator('.village-scene').inner_html();motion.locator('.village-scene').screenshot(path=str(out/'hareket-1.png'))
            motion.wait_for_timeout(1200)
            after=motion.locator('.village-scene').inner_html();motion.locator('.village-scene').screenshot(path=str(out/'hareket-2.png'))
            assert before!=after
            motion.evaluate("document.documentElement.dataset.motion='calm'");motion.wait_for_timeout(200)
            calm=motion.locator('.village-scene').inner_html();motion.wait_for_timeout(400)
            assert calm==motion.locator('.village-scene').inner_html(),'calm must stop water motion'
            # Small layer rendering budget on this desktop, not a phone claim.
            perf=motion.evaluate('''async()=>{const {drawParkMotion}=await import('/src/kuguluPark.js');const {useCanvas,useSVG,projector}=await import('/src/iso.js');const c=document.createElement('canvas'),ctx=c.getContext('2d'),P=projector({cx:500,cy:350,s:25});const samples=[];for(let i=0;i<30;i++){const start=performance.now();useCanvas(ctx,c=>c,1);drawParkMotion(P,{time:i,detail:2,lit:true,ctx});useSVG();samples.push(performance.now()-start)}samples.sort((a,b)=>a-b);return {median:samples[15],p95:samples[28]}}''')
            results['animation']={'changed':True,'calmStable':True,'beforeHash':hashlib.sha256(before.encode()).hexdigest(),'afterHash':hashlib.sha256(after.encode()).hexdigest(),'layerMsDesktop':perf}
            assert not errors,errors
            results['pageErrors']=errors
            browser.close()
    finally:
        server.terminate();server.wait(timeout=15);log.close()
(out/'sonuc.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(results,ensure_ascii=False))
