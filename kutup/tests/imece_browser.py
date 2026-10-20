"""Real UI + local API, isolated temporary database. Never uses kutup/data."""
import argparse
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.request
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--artifacts', default='/tmp/kutup-imece-browser')
args = parser.parse_args()
artifacts = Path(args.artifacts); artifacts.mkdir(parents=True, exist_ok=True)
checks = []

def check(condition, label):
    assert condition, label
    checks.append(label)

with tempfile.TemporaryDirectory(prefix='kutup-imece-browser-') as directory:
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]
    base = f'http://127.0.0.1:{port}'
    key = secrets.token_hex(24)
    with open(Path(directory)/'server.log', 'w') as log:
        server = subprocess.Popen(['node', 'server/index.js', '--dev'], cwd=root,
            env={**os.environ, 'DATA_DIR':directory, 'ADMIN_KEY':key, 'KUTUP_TEST_HOOKS':'1', 'HOST':'127.0.0.1', 'PORT':str(port)}, stdout=log, stderr=log)
        try:
            for _ in range(150):
                try:
                    urllib.request.urlopen(base+'/api/health', timeout=1); break
                except Exception: time.sleep(.15)
            else: raise RuntimeError('Local server did not start')
            with sync_playwright() as p:
                chrome = shutil.which('chromium') or shutil.which('google-chrome') or shutil.which('microsoft-edge')
                browser = p.chromium.launch(executable_path=chrome, headless=True, args=['--no-sandbox'])
                owner = browser.new_context()
                contexts = [browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,reduced_motion='reduce') for _ in range(4)]
                def call(ctx,path,body=None, method=None):
                    r=ctx.request.fetch(base+'/api'+path,method=method or ('GET' if body is None else 'POST'),headers={'X-Kutup':'1'},data=body)
                    assert r.ok, f'{path}: {r.status} {r.text()}'
                    return r.json()
                people=[]
                for i,ctx in enumerate(contexts):
                    people.append(call(ctx,'/groups',{'name':['Batur','Deniz','Ece','Ada'][i],'username':f'imece_browser_{i}','password':'browser-test-123'}))
                call(owner,'/owner/login',{'key':key})
                admin=owner.new_page(); admin.goto(base+'/batur')
                admin.get_by_role('button',name='Ortak Anıtkabir',exact=False).click()
                expect(admin.get_by_text('Dört ustayı göreve çağır',exact=False)).to_be_visible()
                check(admin.locator('.imece-owner-roster input').count()==4,'Owner can choose the four real profiles')
                for box in admin.locator('.imece-owner-roster input').all(): box.check()
                admin.on('dialog',lambda d:d.accept())
                admin.get_by_role('button',name='Dört ustayı göreve çağır',exact=False).click()
                expect(admin.get_by_text('Proje sürüyor:',exact=False)).to_be_visible()
                check(call(contexts[2],'/imece')['slot']>=0,'The same project is visible across separate villages')
                page=contexts[0].new_page(); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                page.add_init_script("localStorage.setItem('kutup-mode','light');localStorage.setItem('kutup-motion','still');localStorage.setItem('kutup-tur','done');")
                page.goto(base+'/?tab=focus&imece=1')
                modal=page.get_by_role('dialog',name='Bir Taş da Senden',exact=True)
                expect(modal).to_be_visible()
                expect(modal.get_by_role('progressbar',name='Kişisel zorunlu görev')).to_be_visible()
                expect(modal.locator('canvas')).to_be_visible()
                check('Batur' in modal.locator('.imece-kara').inner_text(),'Kara introduces a personal mission by name')
                page.screenshot(path=str(artifacts/'telefon-baslangic.png'))
                modal.get_by_role('button',name='Ben de bir taş koyayım',exact=False).click()
                expect(modal.get_by_text('Görevin sürüyor',exact=False)).to_be_visible()
                me=call(contexts[0],'/state')['members'][0]
                check(me['focusImece']==1 and me['focusRelaxed']==1 and me['focusStrict']==0,'Real mission begins in screen-off relaxed mode without a private building')
                call(contexts[0],'/__test/expire',{'name':'Batur','away':True})
                call(contexts[0],'/imece')
                page.reload();expect(modal).to_be_visible()
                expect(modal.get_by_text('25 dakikalık yeni emeğin',exact=False)).to_be_visible()
                modal.get_by_role('button',name='Atla ve teslim al').click()
                expect(modal.locator('.imece-delivery')).to_have_count(0)
                before=call(contexts[0],'/imece')['minutes']
                call(contexts[0],'/imece/seen',{})
                check(call(contexts[0],'/imece')['minutes']==before,'Delivery acknowledgement does not award work twice')
                for width,height in [(360,780),(375,812),(390,844),(844,390)]:
                    page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(180)
                    overflow=modal.evaluate('(el)=>el.scrollWidth>el.clientWidth+1')
                    check(not overflow,f'No modal horizontal overflow at {width}x{height}')
                    tools=modal.locator('.imece-map-tools button').evaluate_all('(els)=>els.every(e=>e.getBoundingClientRect().width>=44 && e.getBoundingClientRect().height>=44)')
                    check(tools,f'Map controls retain 44px touch targets at {width}x{height}')
                def work(i,minutes):
                    call(contexts[i],'/focus',{'action':'start','imece':True,'relaxed':True,'minutes':minutes})
                    call(contexts[i],'/__test/expire',{'name':['Batur','Deniz','Ece','Ada'][i],'away':True})
                    call(contexts[i],'/focus',{'action':'finish'})
                # First 25 min was completed through the real UI. Finish the 400 min foundation.
                work(0,25); work(0,50)
                for i in range(1,4): work(i,50);work(i,50)
                check(call(contexts[0],'/imece')['minutes']==400,'Foundation reaches its exact 400 minute boundary')
                for _ in range(6):
                    for i in range(4):work(i,50)
                page.set_viewport_size({'width':1200,'height':1000}); page.reload();expect(modal).to_be_visible()
                modal.locator('.imece-scene').scroll_into_view_if_needed();page.wait_for_timeout(300)
                modal.locator('.imece-scene').screenshot(path=str(artifacts/'santiye-1600.png'))
                for _ in range(2):
                    for i in range(4):work(i,50)
                state=call(contexts[3],'/imece')
                check(state['minutes']==2000 and state['complete'],'Four people complete the real 2000 minute event')
                check(all(x['personal']==[50,150,50] for x in state['crew']),'Every worker supplies all three personal signatures')
                page.reload();expect(modal).to_be_visible()
                modal.locator('.imece-scene').scroll_into_view_if_needed();page.wait_for_timeout(300)
                modal.locator('.imece-scene').screenshot(path=str(artifacts/'anitkabir-mozole.png'))
                render_ms=modal.locator('canvas').get_attribute('data-render-ms')
                modal.get_by_role('button',name='Tören meydanı',exact=True).click();page.wait_for_timeout(250)
                modal.locator('.imece-scene').screenshot(path=str(artifacts/'anitkabir-meydan.png'))
                modal.get_by_role('button',name='Bütün yerleşim',exact=True).click();page.wait_for_timeout(250)
                modal.locator('.imece-scene').screenshot(path=str(artifacts/'anitkabir-tam-alan.png'))
                modal.get_by_role('button',name='Türk bayrağı',exact=True).click();page.wait_for_timeout(200)
                modal.locator('.imece-scene').screenshot(path=str(artifacts/'bayrak.png'))
                page.set_viewport_size({'width':390,'height':844});modal.get_by_role('button',name='Mozoleye yaklaş',exact=True).click()
                modal.locator('.imece-scene').scroll_into_view_if_needed();page.wait_for_timeout(200)
                page.screenshot(path=str(artifacts/'telefon-anit.png'))
                page.evaluate("document.documentElement.dataset.mode='dark'");page.wait_for_timeout(100)
                page.screenshot(path=str(artifacts/'telefon-koyu.png'))
                check(not errors,'No uncaught browser errors throughout the campaign')
                (artifacts/'results.json').write_text(json.dumps({'passed':checks,'render_ms_desktop':render_ms,'browser':browser.version},ensure_ascii=False,indent=2))
                print(json.dumps({'passed':len(checks),'render_ms_desktop':render_ms,'artifacts':str(artifacts)},ensure_ascii=False))
                browser.close()
        finally:
            if 'errors' in locals() and errors: print(json.dumps({'browser_errors':errors},ensure_ascii=False),flush=True)
            server.terminate()
            try:server.wait(timeout=10)
            except subprocess.TimeoutExpired:server.kill();server.wait()
