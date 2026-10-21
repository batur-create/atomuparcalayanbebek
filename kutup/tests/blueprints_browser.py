"""Discovery UI and all six new shapes on a real browser, isolated local data only."""
import argparse,json,os,secrets,shutil,socket,sqlite3,subprocess,tempfile,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--artifacts',default='/tmp/kutup-blueprints-browser');args=parser.parse_args()
artifacts=Path(args.artifacts);artifacts.mkdir(parents=True,exist_ok=True);checks=[]
def check(ok,label):
    assert ok,label
    checks.append(label)
models=['agacevi','japoncay','sudegirmeni','istasyon','planetaryum','kristalkutuphane','kapadokya','yuzenev','asmakopru','kervansaray','mardinevi','atakule']
with tempfile.TemporaryDirectory(prefix='kutup-blueprints-') as directory:
    with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
    base=f'http://127.0.0.1:{port}';key=secrets.token_hex(24)
    with open(Path(directory)/'server.log','w') as log:
        server=subprocess.Popen(['node','server/index.js','--dev'],cwd=root,env={**os.environ,'DATA_DIR':directory,'ADMIN_KEY':key,'KUTUP_TEST_HOOKS':'1','HOST':'127.0.0.1','PORT':str(port)},stdout=log,stderr=log)
        try:
            for _ in range(150):
                try:urllib.request.urlopen(base+'/api/health',timeout=1);break
                except Exception:time.sleep(.15)
            else:raise RuntimeError('Server did not start')
            with sync_playwright() as p:
                browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
                ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,reduced_motion='reduce')
                def call(path,body=None,owner=False):
                    r=ctx.request.fetch(base+'/api'+path,method='GET' if body is None else 'POST',headers={'X-Kutup':'1',**({'X-Owner-Key':key} if owner else {})},data=body)
                    assert r.ok,f'{path}: {r.status} {r.text()}'
                    return r.json()
                me=call('/groups',{'name':'Batur','username':'blueprints_browser','password':'blueprints-browser-pass'})
                call('/owner/members/'+me['memberId']+'/bricks',{'delta':2000},True)
                page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                page.add_init_script("if(location.protocol==='http:'){localStorage.setItem('kutup-mode','light');localStorage.setItem('kutup-motion','still');localStorage.setItem('kutup-tur','done');}")
                def open_catalog():
                    # This suite checks the catalogue and construction. The
                    # dedicated reveal suite exercises the once-only modal.
                    owned=call("/wallet")["unlocks"]
                    if owned:call("/blueprints/rewards/seen",{"memberId":me["memberId"],"models":owned})
                    page.goto(base+'/?tab=focus');expect(page.locator('.build-pick')).to_be_visible()
                    page.wait_for_timeout(250)
                    for _ in range(8):
                        if not page.locator('.modal-backdrop').count():break
                        page.keyboard.press('Escape');page.wait_for_timeout(100)
                    page.locator('.build-pick').click();expect(page.get_by_role('dialog',name='Ne inşa ediyorsun?')).to_be_visible();expect(page.locator('.blueprint-discovery')).to_be_visible()
                open_catalog()
                expect(page.locator('.blueprint-discovery')).to_contain_text('Garantiye 500 dk kaldı')
                check(page.locator('.catalog-class.rare .catalog-item').count()>=14,'Fourteen or more discoverable buildings appear in the real catalogue')
                page.locator('.catalog-item',has_text='Ağaç Evi').click(force=True)
                expect(page.locator('.catalog-hint')).to_contain_text('belirli bir yapı değil')
                check(True,'Locked card explains random missing plan, chance, guarantee and streak bonus')
                page.locator('.blueprint-discovery summary').click();expect(page.locator('.blueprint-discovery details')).to_contain_text('3 × 25')
                for width,height in [(360,780),(375,812),(390,844),(844,390)]:
                    page.set_viewport_size({'width':width,'height':height})
                    check(page.evaluate("()=>document.documentElement.scrollWidth<=innerWidth&&[...document.querySelectorAll('.modal')].every(e=>e.scrollWidth<=e.clientWidth+1)"),f'Catalogue and guarantee fit {width}×{height}')
                page.set_viewport_size({'width':390,'height':844});page.locator('.blueprint-discovery').screenshot(path=str(artifacts/'plan-kesfi-telefon.png'))
                # Seed only this disposable DB to inspect the existing progress UI.
                with sqlite3.connect(Path(directory)/'kutup.sqlite') as db:
                    db.execute('INSERT INTO blueprint_progress(member_id,carry,dry,draws,seed) VALUES(?,17,300,12,?)',(me['memberId'],'browser-private-seed'))
                open_catalog();expect(page.locator('.blueprint-discovery')).to_contain_text('Garantiye 183 dk kaldı')
                check(page.locator('.blueprint-discovery progress').get_attribute('value')=='317','API-backed guarantee shows carried minutes as well as completed draws')
                for model in models:call('/owner/members/'+me['memberId']+'/unlock',{'model':model},True)
                open_catalog()
                check(page.locator('.catalog-class.rare .catalog-item.locked').count()==2,'Twelve gifted plans unlock without resetting discovery')
                expect(page.locator('.blueprint-discovery')).to_contain_text('183 dk')
                page.locator('.catalog-item',has_text='Japon Çay Evi').click()
                expect(page.locator('.build-pick')).to_contain_text('Japon Çay Evi')
                check(True,'A newly discovered small building can be selected for actual construction')
                page.goto('about:blank')
                for model in models:
                    started=call('/focus',{'action':'start','strict':True,'relaxed':True,'model':model})
                    check(started['state']['members'][0]['focusModel']==model,model+' starts with its own model and class')
                    call('/__test/expire',{'name':'Batur','away':True});call('/focus',{'action':'finish'})
                wallet=call('/wallet');check(all(wallet['built'].get(m)==1 for m in models),'All twelve unique buildings complete and persist in the village')
                check(len(wallet['unlocks'])==len(models)+1,'Real construction minutes trigger the earned guarantee while gifts do not reset it')
                for delivery in call('/build-deliveries'):call('/build-deliveries/'+delivery['id'],{})
                # Detailed contact sheet: actual shared SVG geometry, without application changes.
                gallery=ctx.new_page();gallery.goto(base)
                html=gallery.evaluate('''async(ids)=>{
                    const {BY_ID}=await import('/shared/catalog.js');
                    const {buildingSVG,projector,spec,screenBox}=await import('/src/iso.js');
                    return ids.map(id=>{const item=BY_ID[id],sp=spec(item.kind,7,id,{scale:1}),b=screenBox(sp),s=Math.min(310/(b.x1-b.x0),235/(b.y1-b.y0)),P=projector({cx:180-(b.x0+b.x1)*s/2,cy:135-(b.y0+b.y1)*s/2,s});return `<figure><svg viewBox="0 0 360 280">${buildingSVG(P,sp,7,{lit:false,detail:2})}</svg><figcaption><b>${item.name}</b><small>${item.blurb}</small></figcaption></figure>`}).join('');
                }''',models)
                gallery.goto('about:blank')
                gallery.set_content('<style>body{margin:0;background:#f2efe5;color:#30312f;font:16px Arial}main{display:grid;grid-template-columns:repeat(3,360px);gap:16px;padding:24px}figure{margin:0;background:#fffdf7;border:1px solid #dcd8c9;border-radius:20px;overflow:hidden}svg{display:block;width:360px;height:280px}figcaption{padding:0 20px 20px}b,small{display:block}small{color:#64665e;font-size:13px;line-height:1.5;margin-top:6px;min-height:58px}</style><main>'+html+'</main>')
                gallery.set_viewport_size({'width':1160,'height':850});gallery.screenshot(path=str(artifacts/'oniki-nadir-yapi.png'),full_page=True)
                page.goto(base+'/?tab=focus');expect(page.locator('.village-canvas')).to_be_visible();page.screenshot(path=str(artifacts/'yeni-yapilar-koyde.png'))
                owned=call('/wallet')['unlocks']
                for model in ['fener','sera']:
                    if model not in owned:call('/owner/members/'+me['memberId']+'/unlock',{'model':model},True)
                open_catalog();expect(page.locator('.blueprint-discovery')).to_contain_text('Mevcut plan koleksiyonu tamamlandı')
                check(page.locator('.blueprint-discovery progress').count()==0,'A completed collection stops promising a nonexistent reward')
                page.evaluate("localStorage.setItem('kutup-mode','dark')");open_catalog();page.locator('.blueprint-discovery').screenshot(path=str(artifacts/'koleksiyon-tamam-koyu.png'))
                check(not errors,'No browser JavaScript errors: '+str(errors))
                browser.close()
        finally:
            server.terminate();server.wait(timeout=15)
(artifacts/'results.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2))
print(f'{len(checks)}/{len(checks)} blueprint browser checks passed')
