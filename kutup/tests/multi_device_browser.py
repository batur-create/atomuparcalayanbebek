"""One account, five devices, one running session (n47); isolated local data only.
Run: python tests/multi_device_browser.py --artifacts /tmp/kutup-multi-device
A screen-off build started on the phone must look and behave the same on every
other device that opens the same account, and none of them may end it.
"""
import argparse, json, os, secrets, shutil, socket, sqlite3, subprocess, tempfile, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

parser=argparse.ArgumentParser()
parser.add_argument('--artifacts',default='/tmp/kutup-multi-device')
parser.add_argument('--chromium',default=shutil.which('chromium') or '/opt/pw-browsers/chromium')
args=parser.parse_args()
artifacts=Path(args.artifacts);artifacts.mkdir(parents=True,exist_ok=True)
root=Path(__file__).resolve().parents[1]
passed=[]
def check(name,ok):
    assert ok,name
    passed.append(name); print('PASS',name,flush=True)
def api(page,path,body=None):
    return page.evaluate('''async ([path,body])=>{const r=await fetch('/api'+path,{method:body===null?'GET':'POST',headers:{'Content-Type':'application/json','X-Kutup':'1'},...(body===null?{}:{body:JSON.stringify(body)})});if(!r.ok)throw Error(path+': '+r.status);return r.json()}''',[path,body])
PHONE=dict(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2,user_agent='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36')
DESK=dict(viewport={'width':1366,'height':860})
INIT='''localStorage.setItem('kutup-tur','done');localStorage.setItem('kutup-mode','light');window.__wakeRequests=0;Object.defineProperty(navigator,'wakeLock',{value:{request:async()=>{window.__wakeRequests++;return{released:false,release:async()=>{}}}}});'''
# Hiding and showing the page the way a locked phone or a covered laptop does.
HIDE="Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pagehide'))"
SHOW="delete document.visibilityState;delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'))"

with tempfile.TemporaryDirectory(prefix='kutup-multi-device-') as temp:
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
            db=lambda q,a=():sqlite3.connect(Path(temp)/'kutup.sqlite').execute(q,a).fetchone()
            with sync_playwright() as p:
                browser=p.chromium.launch(executable_path=args.chromium,args=['--no-sandbox'])
                errors=[];actions={}
                def device(name,kind,state=None):
                    context=browser.new_context(**kind,reduced_motion='reduce',**({'storage_state':state} if state else {}))
                    context.add_init_script(INIT)
                    page=context.new_page();actions[name]=[]
                    page.on('pageerror',lambda e:errors.append(f'{name}: {e}'))
                    page.on('request',lambda r: actions[name].append(json.loads(r.post_data or '{}').get('action')) if r.url.endswith('/api/focus') and r.method=='POST' else None)
                    return context,page
                phone_ctx,phone=device('telefon',PHONE)
                phone.goto(base)
                phone.locator('.entry-actions .btn.primary').click()
                phone.get_by_label('Ekibinizin adı').fill('Beş cihaz')
                phone.locator('.sheet-page button[type=submit]').click()
                phone.get_by_label('Sana ne diyelim?').fill('Cihaz Ada')
                phone.locator('.sheet-page button[type=submit]').click()
                phone.get_by_label('Kullanıcı adı',exact=True).fill('multi_device')
                phone.get_by_label('Şifre',exact=True).fill('test-password-123')
                phone.locator('.sheet-page button[type=submit]').click()
                expect(phone.locator('.app-shell')).to_be_visible()
                # Only the sign-in travels to the other devices; their own saved
                # choices start empty, like a laptop that never chose Rahat.
                cookies={'cookies':phone_ctx.storage_state()['cookies'],'origins':[]}
                others=[device(n,k,cookies) for n,k in [('laptop',DESK),('tablet',PHONE),('ikinci-laptop',DESK),('eski-telefon',PHONE)]]
                # The laptop already has its own saved choice: "screen on".
                laptop=others[0][1];laptop.goto(base);laptop.evaluate("localStorage.setItem('kutup-build-mode','strict')")
                phone.locator('.mobile-bottom').get_by_role('link',name='Köy',exact=True).click()
                mode=phone.get_by_role('switch',name='Ekranı kapatarak çalış',exact=True)
                mode.check();expect(mode).to_be_checked()
                # The switch follows the account: the laptop's own "screen on" gives way.
                laptop.reload();expect(laptop.locator('.app-shell')).to_be_visible()
                laptop.get_by_role('button',name='Köy',exact=True).first.click()
                expect(laptop.get_by_role('switch',name='Ekranı kapatarak çalış',exact=True)).to_be_checked()
                check('The laptop shows the switch the phone chose',True)
                phone.locator('.focus-start').click()
                expect(phone.locator('.focus-card')).to_contain_text('ekranı kilitleyebilirsin')
                check('Phone started a screen-off build',db("SELECT focus_relaxed,focus_strict FROM members WHERE name='Cihaz Ada'")==(1,1))
                phone.evaluate(HIDE)
                for name,(ctx,page) in zip(['laptop','tablet','ikinci-laptop','eski-telefon'],others):
                    page.goto(base);expect(page.locator('.app-shell')).to_be_visible()
                    if name in ('tablet','eski-telefon'):page.locator('.mobile-bottom').get_by_role('link',name='Köy',exact=True).click()
                    else:page.get_by_role('button',name='Köy',exact=True).first.click()
                    card=page.locator('.focus-card')
                    expect(card).to_contain_text('ekranı kilitleyebilirsin')
                    check(f'{name} shows the running session as screen-off',card.get_by_role('switch').count()==0)
                laptop.locator('.focus-card').screenshot(path=str(artifacts/'laptop-rahat.png'))
                # Every device is covered, hidden, brought back and reloaded.
                for _ in range(2):
                    for ctx,page in others:page.evaluate(HIDE)
                    phone.wait_for_timeout(1500)
                    for ctx,page in others:page.evaluate(SHOW)
                    phone.wait_for_timeout(500)
                for ctx,page in others:page.reload();expect(page.locator('.app-shell')).to_be_visible()
                phone.wait_for_timeout(2000)
                bad={n:[a for a in acts if a in ('away','beat','crack','wither','cancel')] for n,acts in actions.items()}
                check('No device sends a leave, crack, collapse or stop for a screen-off build',not any(bad.values()))
                check('Server still holds one running screen-off build',db("SELECT focus_relaxed,focus_strict,focus_cracked_at,focus_left_at FROM members WHERE name='Cihaz Ada'")==(1,1,0,0))
                api(phone,'/__test/expire',{'name':'Cihaz Ada','away':True})
                phone.evaluate(SHOW);phone.reload()
                expect(phone.locator('.build-delivery')).to_be_visible()
                check('The building is delivered, not collapsed',db("SELECT count(*) FROM buildings b JOIN members m ON m.id=b.member_id WHERE m.name='Cihaz Ada'")==(1,) and db("SELECT count(*) FROM activity a JOIN members m ON m.id=a.member_id WHERE m.name='Cihaz Ada' AND a.kind='collapse'")==(0,))
                # A watched (screen-on) build started on the phone: the tablet and the
                # old phone lock, the laptop comes back from a long sleep. Only the
                # phone that started it may report leaving.
                for d in phone.locator('.build-delivery').all():d.get_by_role('button',name='Teslim aldım',exact=False).click()
                for row in api(phone,'/build-deliveries'):api(phone,f"/build-deliveries/{row['id']}",{})
                mine=phone.evaluate("localStorage.getItem('kutup-device')")
                api(phone,'/focus',{'action':'start','strict':True,'model':'kulube','device':'phone','deviceId':mine})
                for name in actions:actions[name].clear()
                for ctx,page in others:
                    end=db("SELECT focus_end FROM members WHERE name='Cihaz Ada'")[0]
                    page.evaluate("e=>localStorage.setItem('kutup-fidan',JSON.stringify({end:e,at:Date.now()-10*60000}))",end)
                    page.reload();expect(page.locator('.app-shell')).to_be_visible()
                for _ in range(2):
                    for ctx,page in others:page.evaluate(HIDE)
                    phone.wait_for_timeout(1500)
                    for ctx,page in others:page.evaluate(SHOW)
                phone.wait_for_timeout(6500)
                bad={n:[a for a in acts if a in ('away','crack','wither','cancel')] for n,acts in actions.items()}
                check('Other devices never report leaving or crack a watched build',not any(bad.values()))
                check('Each browser has its own device id',len({mine,*[pg.evaluate("localStorage.getItem('kutup-device')") for c,pg in others]})==5)
                check('The watched build is untouched',db("SELECT focus_strict,focus_relaxed,focus_cracked_at,focus_left_at FROM members WHERE name='Cihaz Ada'")==(1,0,0,0))
                phone.reload();expect(phone.locator('.app-shell')).to_be_visible();phone.wait_for_timeout(500)
                phone.evaluate(HIDE);phone.wait_for_timeout(800)
                check('The phone that started it still reports leaving',actions['telefon'].count('away')>=1)
                phone.evaluate(SHOW)
                check('No browser errors',not errors)
                (artifacts/'results.json').write_text(json.dumps({'passed':passed,'actions':actions,'browser':browser.version},ensure_ascii=False,indent=2))
                browser.close()
        finally:
            server.terminate()
            try:server.wait(timeout=10)
            except subprocess.TimeoutExpired:server.kill()
