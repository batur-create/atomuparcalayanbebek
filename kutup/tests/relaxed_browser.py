"""Rahat mode, delivery and iPhone-sized rotation checks; isolated local data only.
Run: python tests/relaxed_browser.py --artifacts /tmp/kutup-relaxed-browser
Chromium's iPhone emulation is not a physical iPhone/Safari verification.
"""
import argparse, json, os, secrets, shutil, socket, sqlite3, subprocess, tempfile, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

parser=argparse.ArgumentParser()
parser.add_argument('--artifacts',default='/tmp/kutup-relaxed-browser')
args=parser.parse_args()
artifacts=Path(args.artifacts);artifacts.mkdir(parents=True,exist_ok=True)
root=Path(__file__).resolve().parents[1]
passed=[]
def check(name,ok):
    assert ok,name
    passed.append(name); print('PASS',name,flush=True)
def api(page,path,body=None):
    return page.evaluate('''async ([path,body])=>{const r=await fetch('/api'+path,{method:body===null?'GET':'POST',headers:{'Content-Type':'application/json','X-Kutup':'1'},...(body===null?{}:{body:JSON.stringify(body)})});if(!r.ok)throw Error(path+': '+r.status);return r.json()}''',[path,body])

with tempfile.TemporaryDirectory(prefix='kutup-relaxed-browser-') as temp:
    with socket.socket() as sock:
        sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
    base=f'http://127.0.0.1:{port}'
    with open(Path(temp)/'server.log','w') as log:
        server=subprocess.Popen(['node','server/index.js','--dev'],cwd=root,env={**os.environ,'DATA_DIR':temp,'ADMIN_KEY':secrets.token_urlsafe(32),'PORT':str(port),'HOST':'127.0.0.1','KUTUP_TEST_HOOKS':'1'},stdout=log,stderr=log)
        try:
            for _ in range(150):
                try:
                    with urllib.request.urlopen(base+'/api/health',timeout=1) as r:
                        if r.status==200:break
                except OSError:time.sleep(.1)
            else:raise RuntimeError('Local server did not start')
            with sync_playwright() as p:
                browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'])
                context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2,reduced_motion='reduce',user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1')
                context.add_init_script('''localStorage.setItem('kutup-tur','done');localStorage.setItem('kutup-mode','light');window.__wakeRequests=0;Object.defineProperty(navigator,'wakeLock',{value:{request:async()=>{window.__wakeRequests++;return{released:false,release:async()=>{}}}}});Element.prototype.requestFullscreen=undefined;''')
                page=context.new_page();errors=[];focus_actions=[]
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.on('request',lambda r: focus_actions.append(json.loads(r.post_data or '{}').get('action')) if r.url.endswith('/api/focus') and r.method=='POST' else None)
                page.goto(base)
                page.locator('.entry-actions .btn.primary').click()
                page.get_by_label('Ekibinizin adı').fill('Rahat tarayıcı')
                page.locator('.sheet-page button[type=submit]').click()
                page.get_by_label('Sana ne diyelim?').fill('Rahat Ada')
                page.locator('.sheet-page button[type=submit]').click()
                page.get_by_label('Kullanıcı adı',exact=True).fill('relaxed_browser')
                page.get_by_label('Şifre',exact=True).fill('test-password-123')
                page.locator('.sheet-page button[type=submit]').click()
                expect(page.locator('.app-shell')).to_be_visible()
                page.locator('.mobile-bottom').get_by_role('button',name='Köy',exact=True).click()
                mode=page.get_by_role('group',name='İnşaat şekli',exact=True)
                expect(mode.get_by_role('button',name='✳ Sıkı',exact=False)).to_have_attribute('aria-pressed','true')
                check('Sıkı remains the default',True)
                mode.get_by_role('button',name='☾ Rahat',exact=False).click()
                page.locator('.focus-start').click()
                expect(page.locator('.focus-card')).to_contain_text('ekranı kilitleyebilirsin')
                check('Rahat starts without the strict lock guide or wake lock',page.locator('.lock-sheet').count()==0 and page.evaluate('window.__wakeRequests')==0)
                check('Mode cannot change during a session',mode.count()==0)
                page.evaluate("Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'))")
                page.wait_for_timeout(300)
                page.evaluate("delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'))")
                check('Rahat has no away/beat/crack/wither watcher',not any(a in ['away','beat','crack','wither'] for a in focus_actions))
                # Exercise a six-digit 75-minute countdown without changing production data.
                with sqlite3.connect(Path(temp)/'kutup.sqlite') as db:
                    db.execute('UPDATE members SET focus_end=?,focus_minutes=75 WHERE name=?',(int(time.time()*1000)+75*60000,'Rahat Ada'))
                api(page,'/state');page.reload()
                page.locator('.mobile-bottom').get_by_role('button',name='Köy',exact=True).click()
                page.get_by_role('button',name='Odak ekranı',exact=True).click()
                screen=page.get_by_role('dialog',name='Odak ekranı',exact=True)
                expect(screen).to_be_visible()
                for width,height in [(390,844),(844,390),(667,375),(375,667)]:
                    page.set_viewport_size({'width':width,'height':height})
                    page.wait_for_timeout(350)
                    ok=screen.evaluate('''e=>{const a=e.getBoundingClientRect(),c=e.querySelector('.fs-clock').getBoundingClientRect(),z=e.querySelector('.fs-zoom')?.getBoundingClientRect();return a.width<=innerWidth+1&&a.height<=innerHeight+1&&c.left>=a.left-1&&c.right<=a.right+1&&c.top>=a.top-1&&c.bottom<=a.bottom+1&&(!z||(z.left>=a.left-1&&z.right<=a.right+1&&z.top>=a.top-1&&z.bottom<=a.bottom+1))}''')
                    check(f'iPhone-size focus fits {width}x{height}',ok)
                screen.click(position={'x':8,'y':100})
                screen.get_by_role('button',name='Yakınlaştır',exact=True).click()
                page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(350)
                check('Rotating resets scene zoom',screen.locator('.fs-zoom').evaluate('e=>e.style.transform.includes("scale(1)")'))
                screen.click(position={'x':8,'y':100})
                screen.get_by_role('button',name='Sadece inşaat',exact=True).click()
                page.wait_for_timeout(350)
                check('Full scene remains inside landscape viewport',screen.locator('.fs-zoom').evaluate('e=>{const r=e.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1}'))
                check('Full-scene caption clears the focus toolbar',screen.evaluate("e=>e.querySelector('.fs-zoom').getBoundingClientRect().top>=e.querySelector('.fs-bar').getBoundingClientRect().bottom"))
                page.screenshot(path=str(artifacts/'iphone-landscape.png'))
                check('Opening focus still does not hold the screen awake in Rahat',page.evaluate('window.__wakeRequests')==0)
                screen.click(position={'x':8,'y':100})
                screen.get_by_role('button',name='Odak ekranını kapat',exact=True).click()
                page.set_viewport_size({'width':390,'height':844})
                api(page,'/__test/expire',{'name':'Rahat Ada','away':True});page.reload()
                delivery=page.locator('.build-delivery')
                expect(delivery).to_be_visible()
                check('Reduced motion shows the finished building directly',delivery.get_by_role('button',name='Teslim aldım',exact=False).is_visible() and delivery.get_by_role('button',name='Atla ve teslim al').count()==0)
                before=api(page,'/wallet')
                delivery.get_by_role('button',name='Teslim aldım',exact=False).click()
                expect(delivery).to_have_count(0)
                check('Acceptance does not duplicate rewards',api(page,'/wallet')==before)
                page.reload();expect(page.locator('.app-shell')).to_be_visible()
                check('Accepted delivery does not return on reload',page.locator('.build-delivery').count()==0)
                page.locator('.mobile-bottom').get_by_role('button',name='Köy',exact=True).click()
                page.emulate_media(reduced_motion='no-preference')
                page.locator('.focus-start').click()
                api(page,'/__test/expire',{'name':'Rahat Ada','away':True});page.reload()
                expect(delivery).to_be_visible()
                expect(delivery.get_by_role('button',name='Atla ve teslim al',exact=True)).to_be_visible()
                caption=delivery.locator('.caption')
                first=caption.text_content();page.wait_for_timeout(2500)
                check('Timelapse advances the actual construction scene',caption.text_content()!=first)
                page.screenshot(path=str(artifacts/'delivery-timelapse.png'))
                delivery.get_by_role('button',name='Atla ve teslim al',exact=True).click()
                expect(delivery).to_have_count(0)
                check('Timelapse can be skipped safely',not api(page,'/build-deliveries'))
                check('No browser errors',not errors)
                (artifacts/'results.json').write_text(json.dumps({'passed':passed,'browser':browser.version,'note':'Chromium iPhone emulation; physical Safari PWA not verified'},ensure_ascii=False,indent=2))
                browser.close()
        finally:
            server.terminate()
            try:server.wait(timeout=10)
            except subprocess.TimeoutExpired:server.kill()
