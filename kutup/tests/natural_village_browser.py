"""Deterministic before/after map, with fixed saved positions; no production data."""
import argparse,json,os,secrets,shutil,socket,subprocess,tempfile,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--label',default='after');args=parser.parse_args()
out=Path('/workspace/artifacts/dogal-koy');out.mkdir(parents=True,exist_ok=True)
fixture=out/'saved-village.json'
if not fixture.exists():
    result=subprocess.run(['node','--input-type=module','-e','''import{createPlanner}from'./shared/village.js';const groupKey='natural-village-fixed';const planner=createPlanner(groupKey,[],[]);let seq=0;const id=()=>`d${seq++}`,members=[],buildings=[];for(let i=0;i<12;i++){const memberId=`m${i}`;members.push({id:memberId,name:['Batur','Bensu','Sıla','Zeynep','Ada'][i]||`Yeni ${i}`,avatar:'📚',color:['lilac','mint','blue','peach','pink'][i%5],status:'away',focusEnd:0});planner.ensure(memberId,id);if(i<5)for(let j=0;j<6;j++){const kind=j%3===0?'house':'cottage',model=kind==='house'?'ev':['kulube','bostan','cicekci','kahve'][j%4];const p=planner.place(memberId,kind,id,{model});buildings.push({id:`b${i}-${j}`,memberId,districtId:p.district.id,kind,model,x:p.x,y:p.y,facing:p.facing,seed:i*71+j*23+7,minutes:kind==='house'?50:25,created:1,likes:0,mine:false});}}console.log(JSON.stringify({groupKey,members,me:'m0',village:{rev:1,monument:1,districts:planner.districts,buildings,ruins:[]}}));'''],cwd=root,capture_output=True,text=True,check=True)
    fixture.write_text(result.stdout)
data=json.loads(fixture.read_text())
with tempfile.TemporaryDirectory(prefix='kutup-natural-') as temp:
    with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
    base=f'http://127.0.0.1:{port}'
    with open(Path(temp)/'server.log','w') as log:
        server=subprocess.Popen(['node','server/index.js','--dev'],cwd=root,env={**os.environ,'DATA_DIR':temp,'ADMIN_KEY':secrets.token_hex(24),'HOST':'127.0.0.1','PORT':str(port)},stdout=log,stderr=log)
        try:
            for _ in range(150):
                try:urllib.request.urlopen(base+'/api/health',timeout=1);break
                except Exception:time.sleep(.15)
            with sync_playwright() as p:
                browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
                page=browser.new_page(viewport={'width':1280,'height':900});page.goto(base)
                results=page.evaluate('''async data=>{const{buildWorld,skyAt,tinter}=await import('/src/villageWorld.js');const{createView}=await import('/src/villageView.js');document.documentElement.dataset.motion='still';document.body.innerHTML='<canvas id="map" style="width:100vw;height:100vh;display:block"></canvas>';document.body.style.cssText='margin:0;overflow:hidden';await document.fonts.ready;const sky=skyAt(Date.UTC(2026,9,20,9));const before=JSON.stringify(data.village);window.savedNaturalData=data;const world=buildWorld({...data,sky});const canvas=document.querySelector('#map');const view=createView(canvas,{interactive:true});view.resize(innerWidth,innerHeight);view.setWorld(world,sky,tinter(sky));view.fit(world.area,25,0);window.mapTest={view,world};return{unchanged:JSON.stringify(data.village)===before,buildings:world.count,districts:world.districts.length,area:world.area,finite:world.items.every(i=>i.bbox.every(Number.isFinite))}}''',data)
                assert results['unchanged'] and results['buildings']==30 and results['finite']
                page.wait_for_timeout(350);page.screenshot(path=str(out/f'{args.label}-masaustu.png'))
                page.set_viewport_size({'width':390,'height':844});page.evaluate('mapTest.view.resize(innerWidth,innerHeight);mapTest.view.fit(mapTest.world.area,16,0)');page.wait_for_timeout(250);page.screenshot(path=str(out/f'{args.label}-telefon.png'))
                page.evaluate("async()=>{const{buildWorld,skyAt,tinter}=await import('/src/villageWorld.js');const sky=skyAt(Date.UTC(2026,9,20,20));const world=buildWorld({...window.savedNaturalData,sky});mapTest.view.setWorld(world,sky,tinter(sky));mapTest.view.fit(world.area,16,0)}")
                page.wait_for_timeout(250);page.screenshot(path=str(out/f'{args.label}-gece-telefon.png'))
                browser.close()
        finally:server.terminate();server.wait(timeout=10)
(out/f'{args.label}-results.json').write_text(json.dumps(results,indent=2));print(json.dumps(results))
