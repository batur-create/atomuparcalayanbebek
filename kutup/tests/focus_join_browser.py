"""Join confirmation and persistent village; isolated local database only."""
import json,os,secrets,shutil,socket,subprocess,tempfile,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
root=Path(__file__).resolve().parents[1]
out=Path('/workspace/artifacts/odakta-koy');out.mkdir(parents=True,exist_ok=True)
checks=[]
def check(ok,label):
    assert ok,label
    checks.append(label)
with tempfile.TemporaryDirectory(prefix='kutup-join-') as temp:
    with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
    base=f'http://127.0.0.1:{port}'
    with open(Path(temp)/'server.log','w') as log:
        server=subprocess.Popen(['node','server/index.js','--dev'],cwd=root,env={**os.environ,'DATA_DIR':temp,'ADMIN_KEY':secrets.token_hex(24),'PORT':str(port),'HOST':'127.0.0.1','KUTUP_TEST_HOOKS':'1'},stdout=log,stderr=log)
        try:
            for _ in range(150):
                try:urllib.request.urlopen(base+'/api/health',timeout=1);break
                except Exception:time.sleep(.15)
            with sync_playwright() as p:
                browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
                a=browser.new_context();b=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce',is_mobile=True,has_touch=True)
                def api(ctx,path,body=None):
                    r=ctx.request.fetch(base+'/api'+path,method='POST' if body is not None else 'GET',headers={'X-Kutup':'1'},data=body)
                    assert r.ok,f'{path}: {r.status} {r.text()}'
                    return r.json()
                first=api(a,'/groups',{'name':'Ada','username':'join_ada','password':'join-test-123'})
                second=api(b,'/join',{'invite':first['group']['invite'],'name':'Bora','username':'join_bora','password':'join-test-123'})
                b.add_init_script("localStorage.setItem('kutup-tur','done');localStorage.setItem('kutup-motion','still');localStorage.setItem('kutup-mode','light');localStorage.setItem('kutup-build-mode','relaxed');")
                api(a,'/focus',{'action':'start','minutes':75})
                page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto(base+'/?tab=focus')
                village=page.locator('.village-panel');expect(village.locator('canvas').first).to_be_visible()
                page.evaluate('window.savedVillageCanvas=document.querySelector(".village-map-wrap canvas")')
                page.locator('.focus-card').get_by_role('button',name='Katılımı seç',exact=True).click()
                modal=page.get_by_role('dialog',name='Birlikte odaklan',exact=True);expect(modal).to_be_visible()
                expect(modal.locator('.join-summary')).to_contain_text('Arkadaşının binası kopyalanmaz')
                check(next(m['focusEnd'] for m in api(b,'/state')['members'] if m['id']==second['memberId'])==0,'Opening the choice does not start a session')
                check(page.evaluate('document.documentElement.scrollWidth<=390'),'Join choice fits a 390px phone')
                modal.screenshot(path=str(out/'katilim-secimi.png'))
                modal.get_by_role('button',name='tuğla öde ve katıl',exact=False).click()
                expect(modal).not_to_be_visible()
                expect(page.locator('.focus-card')).to_contain_text('ekranı kilitleyebilirsin')
                check(page.evaluate('window.savedVillageCanvas===document.querySelector(".village-map-wrap canvas")'),'Starting construction preserves the exact village canvas')
                expect(village.locator('.scene-zoom-wrap')).to_be_visible();expect(village.locator('.village-map-wrap canvas').first).to_be_visible()
                expect(village.get_by_role('list',name='Kim ne inşa ediyor')).to_contain_text('Bora')
                village.screenshot(path=str(out/'santiye-ve-koy.png'))
                end=next(m['focusEnd'] for m in api(b,'/state')['members'] if m['id']==second['memberId'])
                page.get_by_role('button',name='Odak ekranı',exact=True).click()
                screen=page.get_by_role('dialog',name='Odak ekranı',exact=True);expect(screen).to_be_visible()
                screen.get_by_role('button',name='Köye bak · seans sürsün',exact=True).click();expect(screen).not_to_be_visible()
                check(next(m['focusEnd'] for m in api(b,'/state')['members'] if m['id']==second['memberId'])==end,'Returning to the village does not stop or restart focus')
                check(not errors,'No browser errors')
                browser.close()
        finally:server.terminate();server.wait(timeout=10)
(out/'join-results.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2))
print(json.dumps({'passed':len(checks)}))
