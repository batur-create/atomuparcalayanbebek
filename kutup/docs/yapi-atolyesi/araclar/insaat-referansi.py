import argparse, sys, tempfile, json
from pathlib import Path
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser();ap.add_argument('--repo',required=True);ap.add_argument('--out',required=True);args=ap.parse_args()
root=Path(args.repo).resolve();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(root/'tests'))
from koy_shots import start_server, CHROME
with tempfile.TemporaryDirectory(prefix='kutup-structure-ref-') as tmp:
 server,base=start_server(tmp)
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=CHROME,headless=True,args=['--no-sandbox'])
   page=browser.new_page(viewport={'width':1600,'height':1320},device_scale_factor=1)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(base+'/tests/koy-harness.html')
   result=page.evaluate('''async()=>{
    const React=(await import('/node_modules/.vite/deps/react.js')).default;
    const dom=await import('/node_modules/.vite/deps/react-dom_client.js');const createRoot=dom.createRoot||dom.default.createRoot;
    await import('/src/styles.css');await import('/src/motion.css');const {ConstructionScene}=await import('/src/Village.jsx');
    const {BY_ID}=await import('/shared/catalog.js');
    document.documentElement.dataset.motion='still';
    document.body.style.cssText='margin:0;background:#f6f5f0;color:#30312f;font:14px sans-serif';
    document.body.innerHTML='<div id="gallery" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:12px"></div>';
    const now=Date.UTC(2026,9,22,9);Date.now=()=>now;
    const cards=[];
    for(const value of [.22,.5,.82,1])for(const id of ['serender','mardinevi','atakule','keops']){
     const item=BY_ID[id],minutes=75;
     const props=value===1?{outcome:{type:'built',at:now-5000,kind:item.kind,model:id,seed:7}}:{run:{kind:item.kind,model:id,seed:7,minutes,endsAt:now+(1-value)*minutes*60000}};
     cards.push(React.createElement('article',{key:id+value,style:{background:'#fffefb',border:'1px solid #deded5',borderRadius:14,padding:6}},React.createElement('h3',{style:{margin:10,fontSize:14}},`${item.name} · ${value===1?'Tamamlandı':`Seans %${Math.round(value*100)}`}`),React.createElement(ConstructionScene,props)));
    }
    createRoot(document.getElementById('gallery')).render(cards);
    return {models:4,states:4};
   }''')
   page.wait_for_timeout(650)
   page.screenshot(path=str(out/'insaat-asamalari.png'),full_page=True)
   result.update(errors=errors,svgCount=page.locator('svg').count())
   (out/'insaat-sonuc.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
   print(json.dumps(result,ensure_ascii=False));browser.close()
 finally:
  server.terminate();server.wait(timeout=10)
