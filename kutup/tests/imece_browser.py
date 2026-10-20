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
                    people.append(call(ctx,'/groups',{'name':['Batur','Bensu','Ece','Ada'][i],'username':f'imece_browser_{i}','password':'browser-test-123'}))
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
                expect(modal.locator('.imece-my-contribution')).to_contain_text('Senin toplam katkın')
                expect(modal.locator('canvas.imece-static')).to_be_visible()
                check('Batur' in modal.locator('.imece-kara').inner_text(),'Kara introduces a personal mission by name')
                page.screenshot(path=str(artifacts/'telefon-baslangic.png'))
                modal.get_by_role('button',name='Ben de bir taş koyayım',exact=False).click()
                expect(modal.get_by_text('Görevin sürüyor',exact=False)).to_be_visible()
                me=call(contexts[0],'/state')['members'][0]
                check(me['focusImece']==1 and me['focusRelaxed']==1 and me['focusStrict']==0,'Real mission begins in screen-off relaxed mode without a private building')
                # An active session animates a light overlay, never the detailed
                # monument or the server's already credited construction state.
                page.evaluate("document.documentElement.dataset.motion='full'")
                modal.get_by_role('button',name='İş başına yaklaş',exact=True).click()
                wrap=modal.locator('.imece-canvas-wrap');static=modal.locator('canvas.imece-static');live=modal.locator('canvas.imece-live')
                wrap.scroll_into_view_if_needed();expect(live).to_have_attribute('data-state','running')
                page.wait_for_timeout(250)
                frames=int(live.get_attribute('data-frames'));draws=static.get_attribute('data-draws')
                page.wait_for_timeout(700)
                check(int(live.get_attribute('data-frames'))>frames+3 and static.get_attribute('data-draws')==draws,'Workers move without repainting the monument')
                check(call(contexts[0],'/imece')['minutes']==0,'Animation cannot credit an unfinished session')
                check(modal.locator('.imece-opening').count()==0,'The opening tour is unavailable before the shared project is complete')
                modal.locator('.imece-scene').screenshot(path=str(artifacts/'is-basinda-telefon.png'))
                page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))")
                expect(live).to_have_attribute('data-state','offscreen')
                frames=live.get_attribute('data-frames');page.wait_for_timeout(350)
                check(live.get_attribute('data-frames')==frames,'Hidden document stops the live animation')
                page.evaluate("delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))")
                expect(live).to_have_attribute('data-state','running')
                modal.evaluate('(el)=>el.scrollTop=el.scrollHeight');expect(live).to_have_attribute('data-state','offscreen')
                frames=live.get_attribute('data-frames');page.wait_for_timeout(350)
                check(live.get_attribute('data-frames')==frames,'Scrolling the scene out of view stops the live animation')
                wrap.scroll_into_view_if_needed();expect(live).to_have_attribute('data-state','running')
                page.evaluate("document.documentElement.dataset.motion='still'")
                expect(live).to_have_attribute('data-state','resting')
                frames=live.get_attribute('data-frames');page.wait_for_timeout(350)
                check(live.get_attribute('data-frames')==frames,'Changing the movement preference stops ambient loops immediately')
                call(contexts[0],'/__test/expire',{'name':'Batur','away':True})
                call(contexts[0],'/imece')
                page.reload();expect(modal).to_be_visible()
                expect(modal.get_by_text('25 dakikalık yeni emeğin',exact=False)).to_be_visible()
                page.evaluate("document.documentElement.dataset.motion='full'")
                modal.get_by_role('button',name='Emeğimizin yükselişini izle',exact=True).click()
                meter=modal.get_by_role('progressbar',name='Gösterinin ilerlemesi')
                expect(meter).to_be_visible();page.wait_for_timeout(350)
                modal.get_by_role('button',name='Duraklat',exact=True).click()
                value=meter.get_attribute('aria-valuenow');page.wait_for_timeout(400)
                check(meter.get_attribute('aria-valuenow')==value,'Timelapse can be paused without losing its place')
                modal.get_by_role('button',name='Devam et',exact=True).click();wrap.scroll_into_view_if_needed();page.wait_for_timeout(300)
                page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))")
                page.wait_for_timeout(100);value=meter.get_attribute('aria-valuenow');page.wait_for_timeout(450)
                check(meter.get_attribute('aria-valuenow')==value,'Timelapse clock freezes while the screen is hidden')
                page.evaluate("delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))")
                wrap.scroll_into_view_if_needed();page.wait_for_timeout(200)
                modal.get_by_role('button',name='Gösteriyi atla',exact=True).click()
                expect(meter).to_have_attribute('aria-valuenow','100')
                check(call(contexts[0],'/imece')['minutes']==25,'Skipping the replay does not create additional progress')
                modal.get_by_role('button',name='Yapımı tekrar izle',exact=True).click()
                page.evaluate("document.documentElement.dataset.motion='still'")
                expect(meter).to_have_attribute('aria-valuenow','100')
                check('25 dakika' in static.get_attribute('aria-label'),'Reduced motion shows the exact delivery endpoint immediately')
                # A second device finishes new work while this film still shows
                # the old delivery. Accepting it must not swallow the new work.
                call(contexts[0],'/focus',{'action':'start','imece':True,'relaxed':True,'minutes':25})
                call(contexts[0],'/__test/expire',{'name':'Batur','away':True})
                call(contexts[0],'/focus',{'action':'finish'})
                page.evaluate("document.dispatchEvent(new Event('visibilitychange'))")
                expect(modal.get_by_text('50 dakikalık yeni emeğin',exact=False)).to_be_visible()
                modal.get_by_role('button',name='Emeğimi teslim aldım',exact=True).click()
                expect(modal.get_by_text('25 dakikalık yeni emeğin',exact=False)).to_be_visible()
                check(call(contexts[0],'/imece')['delivery']['minutes']==25,'Accepting a watched snapshot preserves newer work from a second device')
                modal.get_by_role('button',name='Atla ve teslim al',exact=True).click()
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
                    call(contexts[i],'/__test/expire',{'name':['Batur','Bensu','Ece','Ada'][i],'away':True})
                    call(contexts[i],'/focus',{'action':'finish'})
                # Reproduce Bensu's report with real contribution records: 150
                # minutes total, of which 50 also fulfil the foundation share.
                work(1,75);work(1,75)
                state=call(contexts[1],'/imece');person=next(c for c in state['crew'] if c['name']=='Bensu')
                check(person['minutes']==150 and person['personal']==[50,0,0],'150 real minutes retain all work while completing the 50-minute first-phase share')
                bensu=contexts[1].new_page();bensu.on('pageerror',lambda e:errors.append(str(e)))
                bensu.add_init_script("localStorage.setItem('kutup-mode','light');localStorage.setItem('kutup-motion','still');localStorage.setItem('kutup-tur','done');")
                bensu.goto(base+'/?tab=focus&imece=1');bm=bensu.get_by_role('dialog',name='Bir Taş da Senden',exact=True)
                expect(bm.locator('.imece-my-contribution')).to_contain_text('150 dk')
                card=bm.locator('.imece-crew article',has_text='Bensu')
                expect(card.locator('.imece-contribution-total b')).to_have_text('150 dk')
                expect(card.locator('[data-phase="0"]')).to_contain_text('50 / 50 dk')
                expect(card.locator('[data-phase="0"]')).to_contain_text('Tamamlandı')
                expect(card.locator('[data-phase="1"]')).to_contain_text('0 / 150 dk')
                expect(card.locator('[data-phase="1"]')).to_contain_text('Bölüm açılınca')
                expect(card.locator('[data-phase="2"]')).to_contain_text('0 / 50 dk')
                expect(card.locator('.imece-extra-work')).to_contain_text('100 dk')
                check(True,'Own summary and crew card distinguish 150 total, 50/50 complete, future phase shares and 100 extra work')
                bm.locator('.imece-count-help summary').click()
                expect(bm.locator('.imece-count-help')).to_contain_text('ortak hedefe 150 dk eklenir')
                expect(bm.locator('.imece-kara')).to_contain_text('Çalıştığın her dakika ortak hedefe eklenir')
                check(True,'Kara and the expandable explanation state that all work counts toward the shared target')
                for width,height in [(360,780),(375,812),(390,844),(844,390)]:
                    bensu.set_viewport_size({'width':width,'height':height})
                    check(bm.evaluate('(el)=>el.scrollWidth<=el.clientWidth+1') and card.evaluate('(el)=>el.scrollWidth<=el.clientWidth+1'),f'Contribution breakdown fits {width}x{height}')
                bensu.set_viewport_size({'width':390,'height':844});card.screenshot(path=str(artifacts/'150-dk-katki-telefon.png'))
                bm.locator('.imece-my-contribution').screenshot(path=str(artifacts/'150-dk-toplam-katkim.png'))
                bensu.set_viewport_size({'width':1200,'height':1000});bm.locator('.imece-log').screenshot(path=str(artifacts/'katki-defteri-masaustu.png'))
                bensu.evaluate("document.documentElement.dataset.mode='dark'");card.screenshot(path=str(artifacts/'150-dk-katki-koyu.png'))
                after=call(contexts[1],'/imece')
                check([(c['minutes'],c['personal']) for c in after['crew']]==[(c['minutes'],c['personal']) for c in state['crew']],'Viewing explanations and contributions changes no credited work or personal shares')
                bensu.close()
                # First 50 minutes by Batur and 150 by Bensu were completed above.
                work(2,50);work(3,50);work(0,50);work(2,50)
                check(call(contexts[0],'/imece')['minutes']==400,'Foundation reaches its exact 400 minute boundary')
                call(contexts[1],'/focus',{'action':'start','imece':True,'relaxed':True,'minutes':50})
                page.set_viewport_size({'width':1200,'height':1000});page.reload();expect(modal).to_be_visible()
                page.evaluate("document.documentElement.dataset.motion='full'")
                modal.get_by_role('button',name='İş başına yaklaş',exact=True).click();wrap.scroll_into_view_if_needed()
                expect(live).to_have_attribute('data-state','running');page.wait_for_timeout(1800)
                modal.locator('.imece-scene').screenshot(path=str(artifacts/'vinc-ve-iskele.png'))
                modal.get_by_role('button',name='Mozoleye yaklaş',exact=True).click();page.wait_for_timeout(150)
                modal.locator('.imece-scene').screenshot(path=str(artifacts/'vinc-genel.png'))
                call(contexts[1],'/focus',{'action':'cancel'})
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
                render_ms=static.get_attribute('data-render-ms')
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
                # The same real completed project opens the five-stop tour.
                page.evaluate("document.documentElement.dataset.motion='full'")
                modal.get_by_role('button',name='Açılış turunu izle',exact=False).click()
                expect(meter).to_be_visible();wrap.scroll_into_view_if_needed()
                seen=set();until=time.monotonic()+22
                while time.monotonic()<until:
                    seen.add(modal.locator('.imece-views button[aria-pressed=true]').inner_text())
                    if meter.get_attribute('aria-valuenow')=='100':break
                    page.wait_for_timeout(250)
                check(seen=={'Aslanlı Yol','Tören meydanı','Mozoleye yaklaş','Türk bayrağı','Bütün yerleşim'},'Opening tour visits all five architectural stops')
                expect(meter).to_have_attribute('aria-valuenow','100')
                credits=modal.locator('.imece-opening-credits');expect(credits).to_be_visible()
                check(credits.locator('article').count()==4 and all(name in credits.inner_text() for name in ['Batur','Bensu','Ece','Ada']),'Opening credits name all four contributors')
                credits.screenshot(path=str(artifacts/'dort-usta-acilis.png'))
                check(call(contexts[0],'/imece')['minutes']==2000,'Opening tour never modifies the finished project')
                modal.get_by_role('button',name='Açılışı yeniden izle',exact=True).click();wrap.scroll_into_view_if_needed()
                modal.get_by_role('button',name='Gösteriyi atla',exact=True).click()
                expect(credits).to_be_visible()
                check(modal.get_by_role('button',name='Anıta yaklaş',exact=True).is_enabled(),'Skipping the opening restores normal map interaction')
                expect(modal.get_by_role('button',name='Gezmeye devam et',exact=True)).to_be_focused()
                modal.get_by_role('button',name='Gezmeye devam et',exact=True).click()
                expect(modal.get_by_role('button',name='Mozoleye yaklaş',exact=True)).to_be_focused()
                check(True,'Keyboard focus moves from the film controls back to the map')
                # Native reduced-motion remains effective with no explicit app pick.
                page.evaluate('delete document.documentElement.dataset.motion')
                modal.get_by_role('button',name='Açılış defterini aç',exact=True).click()
                expect(meter).to_have_attribute('aria-valuenow','100')
                check(live.get_attribute('data-state')!='running','Native reduced motion replaces the tour with its static credits')
                page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(200)
                check(not modal.evaluate('(el)=>el.scrollWidth>el.clientWidth+1'),'Opening credits fit landscape orientation')
                check(not errors,'No uncaught browser errors throughout the campaign')
                (artifacts/'results.json').write_text(json.dumps({'passed':checks,'render_ms_desktop':render_ms,'browser':browser.version},ensure_ascii=False,indent=2))
                print(json.dumps({'passed':len(checks),'render_ms_desktop':render_ms,'artifacts':str(artifacts)},ensure_ascii=False))
                browser.close()
        finally:
            if 'errors' in locals() and errors: print(json.dumps({'browser_errors':errors},ensure_ascii=False),flush=True)
            server.terminate()
            try:server.wait(timeout=10)
            except subprocess.TimeoutExpired:server.kill();server.wait()
