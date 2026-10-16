"""Optional real-browser audit. Requires Python playwright (pip install playwright)
and a Chromium-based browser: Chromium on PATH, or Chrome/Edge in their usual places.
Run: npm run test:browser  (or: python tests/browser_smoke.py --chromium <path> --artifacts <dir>)
Always starts an isolated local server and database; never connects to the live site.
"""
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

def find_chromium():
    for name in ('chromium', 'chromium-browser', 'google-chrome', 'chrome'):
        if shutil.which(name): return shutil.which(name)
    for base in (os.environ.get('PROGRAMFILES', ''), os.environ.get('PROGRAMFILES(X86)', ''), os.environ.get('LOCALAPPDATA', '')):
        for tail in (('Google', 'Chrome', 'Application', 'chrome.exe'), ('Microsoft', 'Edge', 'Application', 'msedge.exe')):
            candidate = Path(base, *tail)
            if base and candidate.exists(): return str(candidate)
    return None

parser = argparse.ArgumentParser()
parser.add_argument('--chromium', default=find_chromium())
parser.add_argument('--artifacts', default=str(Path(tempfile.gettempdir()) / 'kutup-audit-artifacts'))
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
artifacts = Path(args.artifacts); artifacts.mkdir(parents=True, exist_ok=True)
results = []
def check(name, condition):
    assert condition, name
    results.append(name)
    print('PASS', name, flush=True)

def json_call(page, path, body=None):
    return page.evaluate('''async ([path, body]) => {
      const r = await fetch('/api' + path, {method: body === null ? 'GET' : 'POST',
        headers: {'X-Kutup':'1','Content-Type':'application/json'},
        ...(body === null ? {} : {body: JSON.stringify(body)})});
      if (!r.ok) throw new Error(path + ': ' + r.status);
      return r.json();
    }''', [path, body])

def signup(page, username, name):
    page.get_by_label('Sana ne diyelim?').fill(name)
    page.get_by_label('Kullanıcı adı', exact=True).fill(username)
    page.get_by_label('Şifre', exact=True).fill('audit-password-123')
    page.locator('[role=dialog] button[type=submit]').click()
    expect(page.get_by_role('dialog')).to_have_count(0)

with tempfile.TemporaryDirectory(prefix='kutup-browser-') as directory:
    key = secrets.token_urlsafe(32)
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]
    base = f'http://127.0.0.1:{port}'
    with open(Path(directory) / 'server.log', 'w') as log:
        server = subprocess.Popen(['node', 'server/index.js', '--dev'], cwd=root,
            env={**os.environ, 'DATA_DIR': directory, 'ADMIN_KEY': key, 'KUTUP_TEST_HOOKS':'1', 'HOST':'127.0.0.1', 'PORT':str(port)},
            stdout=log, stderr=log)
        try:
            for _ in range(150):
                try:
                    with urllib.request.urlopen(base + '/api/health', timeout=1) as r:
                        if r.status == 200: break
                except OSError: time.sleep(.1)
            else: raise RuntimeError('Isolated server did not start')
            with sync_playwright() as p:
                browser = p.chromium.launch(executable_path=args.chromium, args=['--no-sandbox'])
                context = browser.new_context(viewport={'width':375,'height':812}, device_scale_factor=2, reduced_motion='reduce')
                # "auto" turns the page dark after sunset in Ankara; colour checks below expect the light page.
                context.add_init_script("try{localStorage.getItem('kutup-mode')||localStorage.setItem('kutup-mode','light')}catch(e){}")
                page = context.new_page(); errors=[]
                page.on('pageerror', lambda e: errors.append(str(e)))
                page.goto(base)
                page.get_by_role('button', name='Yeni ekip kur').click()
                page.keyboard.press('Shift+Tab')
                check('Modal traps keyboard focus', page.get_by_role('dialog').evaluate('(d)=>d.contains(document.activeElement)'))
                page.keyboard.press('Escape')
                check('Modal restores focus and background', page.get_by_role('button', name='Yeni ekip kur').evaluate('(e)=>document.activeElement===e') and not page.locator('#root').evaluate('(e)=>e.inert'))
                page.get_by_role('button', name='Yeni ekip kur').click()
                page.get_by_label('Ekibinizin adı').fill('Denetim tayfası')
                signup(page, 'audit_ada', 'Ada')
                session = json_call(page, '/session')
                check('Mobile account creation', session['username']=='audit_ada')
                check('A new profile starts with a drawn character', page.locator('.member-card .avatar svg.av-art').count()>=1)
                # n17: four tabs, no hamburger, the home page leads with "Bugün geliyor musun?".
                tabs = [b.inner_text().strip() for b in page.locator('.mobile-bottom button').all()]
                check('Phone tab bar: Kütüp, Köy, Pano, Ben and no hamburger', tabs == ['Kütüp','Köy','Pano','Ben'] and page.locator('.mobile-menu').count()==0)
                check('Home leads with the living sky and one main action', page.locator('.home-sky').count()==1
                    and page.get_by_role('button', name='Geldim', exact=True).is_visible()
                    and page.evaluate("document.querySelector('.home-status').getBoundingClientRect().top < document.querySelector('.home-people').getBoundingClientRect().top"))
                page.locator('.mobile-bottom').get_by_role('button', name='Ben', exact=True).click()
                check('Ben gathers profile, look, invite, Batur and account', all(page.locator('.home-door', has_text=t).count()==1 for t in ['Profilim','Görünüm','İstatistiklerim','Arkadaşını ekibe ekle','Batur’a ilet','Hesap ve cihazlar','Ekipten ayrıl']))
                # Kara waits in the village until n06; her rig is exercised with reduced motion, touch/keyboard and persistent UI.
                page.locator('.mobile-bottom').get_by_role('button', name='Köy', exact=True).click()
                cat = page.get_by_role('button', name='Kara’ya selam ver')
                cat.scroll_into_view_if_needed()
                expect(cat.locator('svg')).to_have_count(1)
                check('Kara is a vector rig without bitmap assets', cat.locator('img,image').count()==0)
                page.get_by_role('button',name='Şekerleme',exact=True).click()
                expect(cat).to_have_attribute('data-pose','sleep')
                cat.click()
                expect(cat).to_have_attribute('data-pose','hello')
                check('Kara wakes on touch',True)
                page.get_by_role('button',name='Kitap',exact=True).click()
                expect(cat).to_have_attribute('data-pose','read')
                check('Kara opens her book',cat.locator('.cat-book').evaluate('(e)=>getComputedStyle(e).transform')!='none')
                cat.focus()
                page.keyboard.press('Enter')
                expect(cat).to_have_attribute('data-reaction','wave')
                cat.click(); cat.click()
                expect(cat).to_have_attribute('data-reaction','sass')
                check('Kara supports keyboard and repeated-touch reactions',True)
                box=cat.bounding_box()
                page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2)
                page.mouse.down();page.wait_for_timeout(650);page.mouse.up()
                expect(cat).to_have_attribute('data-reaction','purr')
                check('Holding Kara triggers purring',True)
                check('Reduced motion disables rig animations',cat.locator('.cat-tail').evaluate('(e)=>getComputedStyle(e).animationName')=='none')
                page.get_by_role('button',name='Kara kartını küçült').click()
                page.goto(base + '/?tab=focus')
                page.get_by_role('button',name='Kara burada.').click()
                expect(cat).to_be_visible()
                check('Kara can be collapsed, persisted and reopened',True)
                page.screenshot(path=str(artifacts/'kara-mobile.png'))
                page.emulate_media(reduced_motion='no-preference')
                page.get_by_role('button',name='Selam',exact=True).click()
                cat.scroll_into_view_if_needed()
                page.mouse.move(20,100)
                gaze=cat.evaluate('(e)=>e.style.getPropertyValue("--look-x")')
                page.mouse.move(350,500)
                check('Kara follows the pointer',gaze!=cat.evaluate('(e)=>e.style.getPropertyValue("--look-x")'))
                check('Kara animates when motion is enabled',cat.locator('.cat-tail').evaluate('(e)=>getComputedStyle(e).animationPlayState')=='running')
                page.get_by_role('button',name='Şekerleme',exact=True).click()
                page.get_by_role('button',name='Kitap',exact=True).click()
                expect(cat).to_have_attribute('data-waking','true')
                expect(cat).to_have_attribute('data-waking','false',timeout=2000)
                check('Kara wakes before opening the book',True)
                page.evaluate('document.documentElement.dataset.theme="mint"')
                check('Kara scarf follows theme',cat.locator('.cat-scarf>path').first.evaluate('(e)=>getComputedStyle(e).fill')=='rgb(77, 126, 99)')
                page.evaluate('delete document.documentElement.dataset.theme')
                page.locator('.page-heading').scroll_into_view_if_needed()
                expect(cat).to_have_attribute('data-paused','true')
                check('Kara pauses offscreen',True)
                page.emulate_media(reduced_motion='reduce')
                second = browser.new_context(viewport={'width':375,'height':812}, reduced_motion='reduce')
                friend = second.new_page(); friend.on('pageerror', lambda e: errors.append(str(e)))
                friend.goto(base + '/join/' + session['group']['invite'])
                friend.get_by_role('button', name='Tekir', exact=True).click()
                friend.get_by_role('button', name='Gözlük', exact=True).click()
                friend.get_by_role('button', name='Atkı', exact=True).click()
                check('Avatar picker: 44px touch targets, no overflow at 375px', friend.evaluate('''()=>{
                    const boxes=[...document.querySelectorAll('.avatar-options.chars button,.acc-options button,.avatar-tabs button')].map(b=>b.getBoundingClientRect());
                    return boxes.length>=30 && boxes.every(b=>b.height>=44 && b.width>=44 && b.right<=innerWidth) && document.documentElement.scrollWidth<=innerWidth}'''))
                signup(friend, 'audit_ece', 'Ece')
                check('Character with accessories is saved', any(m['avatar']=='k:tekir+gozluk+atki' for m in json_call(friend, '/state')['members']))
                page.locator('.mobile-bottom').get_by_role('button', name='Kütüp', exact=True).click()
                page.get_by_role('button', name='Geldim', exact=True).click()
                page.locator('[role=dialog] button[type=submit]').click()
                expect(page.get_by_role('dialog')).to_have_count(0)
                expect(friend.locator('.member-card').filter(has=friend.get_by_text('Ada',exact=True))).to_contain_text('Kütüpte')
                check('Presence reaches a second browser through SSE', True)
                for name in ['Kütüp','Köy','Pano','Ben']:
                    page.locator('.mobile-bottom').get_by_role('button',name=name,exact=True).click()
                    page.wait_for_timeout(100)
                    check(f'375px: {name} has no horizontal overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
                friend.evaluate("localStorage.setItem('kutup-mode','dark')"); friend.reload()
                expect(friend.locator('.member-card').first).to_be_visible()
                check('Dark mode keeps the drawn characters', friend.locator('.member-card .av-art').count()>=1)
                check('Dark mode darkens the page, the cards and the status bar', friend.evaluate('''()=>{
                    const rgb=(e)=>getComputedStyle(e).backgroundColor.match(/\\d+/g).slice(0,3).map(Number);
                    return document.documentElement.dataset.mode==='dark'
                        && Math.max(...rgb(document.documentElement))<40
                        && Math.max(...rgb(document.querySelector('.member-card')))<60
                        && document.querySelector('meta[name=theme-color]').content==='#181916';
                }'''))
                check('Top-bar look button: 44px to the finger, no overflow at 375px', friend.evaluate('''()=>{
                    const r=document.querySelector('.mode-button').getBoundingClientRect(), x=r.left+r.width/2, y=r.top+r.height/2;
                    return [[x-21,y],[x+21,y],[x,y-21],[x,y+21]].every(([px,py])=>document.elementFromPoint(px,py)?.closest('.mode-button'))
                        && document.documentElement.scrollWidth<=innerWidth}'''))
                friend.get_by_role('button', name='Görünüm: Koyu').click()
                menu = friend.get_by_role('menu', name='Gündüz mü, gece mi?')
                expect(menu).to_be_visible()
                check('Look menu: three choices, 44px rows, inside the screen, current one ticked', friend.evaluate('''()=>{
                    const items=[...document.querySelectorAll('.mode-menu [role=menuitemradio]')], boxes=items.map(b=>b.getBoundingClientRect());
                    return items.length===3 && boxes.every(b=>b.height>=44 && b.left>=0 && b.right<=innerWidth)
                        && document.querySelector('.mode-menu [aria-checked=true]').textContent.startsWith('Koyu')
                        && items.includes(document.activeElement)}'''))
                menu.locator('[role=menuitemradio]', has_text='Gece de gündüz de açık').click()
                expect(menu).to_have_count(0)
                check('Picking Açık turns the page light, remembers it and returns focus', friend.evaluate('''()=>
                    document.documentElement.dataset.mode==='light' && localStorage.getItem('kutup-mode')==='light'
                    && document.activeElement.matches('.mode-button[aria-label="Görünüm: Açık"]')
                    && document.querySelector('meta[name=theme-color]').content==='#f6f5f0'
                '''))
                friend.get_by_role('button', name='Görünüm: Açık').click()
                expect(menu).to_be_visible()
                friend.keyboard.press('Escape')
                expect(menu).to_have_count(0)
                friend.get_by_role('button', name='Görünüm: Açık').click()
                friend.mouse.click(8, 400)  # the page gutter, left of the menu
                expect(menu).to_have_count(0)
                check('Look menu closes with Escape and with a tap outside', True)
                page.locator('.home-door', has_text='Batur’a ilet').click()
                page.locator('.feedback-form textarea').fill('Denetim: Batur paneli ve özel geri bildirim akışı.')
                page.locator('.feedback-form button[type=submit]').click()
                expect(page.locator('.feedback-success')).to_be_visible()
                check('Feedback is sent and tracked', len(json_call(page, '/feedback')) == 1)
                failed = [False]
                def fail_once(route):
                    if not failed[0]: failed[0] = True; route.abort()
                    else: route.continue_()
                page.route('**/api/village**', fail_once)
                page.goto(base + '/?tab=focus')
                expect(page.get_by_role('button',name='Tekrar dene')).to_be_visible()
                page.get_by_role('button',name='Tekrar dene').click()
                expect(page.get_by_text('Köy güncellenemedi.',exact=False)).to_have_count(0)
                page.locator('.village-map-wrap').scroll_into_view_if_needed(); page.wait_for_timeout(300)
                check('Village recovers after a failed fetch', page.locator('.village-map-wrap canvas').count()==1)
                page.get_by_role('button',name='Temeli at 🏡',exact=True).click()
                expect(page.locator('.village-scene')).to_be_visible()
                json_call(page, '/__test/expire', {'name':'Ada'})
                # A reload also checks persistence and settlement after the tab was closed.
                page.goto(base + '/?tab=focus')
                expect(page.locator('.village-building-list')).to_be_visible(timeout=12000)
                page.get_by_text('Binalara göz at',exact=True).click()
                building = json_call(page, '/village')['buildings'][0][0]
                page.get_by_label('Bir eser seç').select_option(building)
                expect(page.get_by_role('dialog',name='Kulübe bilgisi')).to_be_visible()
                page.get_by_role('button',name='Kartı kapat').click()
                page.locator('.village-panel').screenshot(path=str(artifacts/'mobile-village.png'))
                check('Focus creates a building and keyboard list opens its card', True)
                owner = browser.new_page(viewport={'width':375,'height':812}, reduced_motion='reduce')
                owner.on('pageerror', lambda e: errors.append(str(e)))
                owner.goto(base + '/batur')
                owner.get_by_label('Yönetici anahtarı').fill(key)
                owner.get_by_role('button',name='Kutuyu aç',exact=True).click()
                owner.get_by_role('button',name='Ekipler',exact=False).click()
                owner.get_by_role('button',name='Ada için giriş kodu üret').click()
                code = owner.get_by_label('Giriş / şifre sıfırlama kodu').input_value()
                owner.screenshot(path=str(artifacts/'owner-recovery.png'), mask=[owner.locator('.recovery-code')])
                check('Owner recovery uses an accessible modal', owner.locator('#root').evaluate('(e)=>e.inert'))
                guest = browser.new_page(viewport={'width':375,'height':812}, reduced_motion='reduce')
                guest.goto(base); guest.get_by_role('button',name='Giriş yap',exact=True).click()
                guest.get_by_role('tab',name='Şifremi unuttum',exact=True).click()
                guest.get_by_label('Batur’un kodu',exact=True).fill(code)
                guest.get_by_label('Kullanıcı adı',exact=True).fill('audit_ada')
                guest.get_by_label('Yeni şifre',exact=True).fill('changed-password-123')
                guest.locator('[role=dialog] button[type=submit]').click()
                expect(guest.get_by_role('dialog')).to_have_count(0)
                check('Password recovery retains the existing profile', json_call(guest,'/session')['memberId']==session['memberId'])
                visual = browser.new_page(viewport={'width':1200,'height':1100}, reduced_motion='reduce')
                visual.on('pageerror', lambda e: errors.append(str(e)))
                visual.goto(base + '/tests/visual-harness.html')
                visual.wait_for_function('window.fixtureReady===true'); visual.wait_for_timeout(200)
                check('All twelve construction stages render', visual.locator('#scenes svg').count()==12)
                check('Reduced-motion collapse immediately shows rubble', visual.locator('article[data-stage="3"] .fx polygon').count()>0)
                visual.locator('#scenes').screenshot(path=str(artifacts/'construction-scenes.png'))
                visual.set_viewport_size({'width':1920,'height':1080})
                metrics = visual.evaluate('makeVillage(1000)')
                visual.locator('#map').scroll_into_view_if_needed(); visual.wait_for_timeout(1200)
                visual.locator('#map').screenshot(path=str(artifacts/'village-1000.png'))
                colors = visual.locator('#map').evaluate('''c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,s=new Set();for(let i=0;i<d.length;i+=64)s.add(`${d[i]},${d[i+1]},${d[i+2]}`);return s.size}''')
                check('A 1,000-building village paints in a real browser', colors>100 and metrics['buildings']==1000)
                if errors: print('Browser errors:', json.dumps(errors), flush=True)
                check('No browser JavaScript errors', not errors)
                (artifacts/'results.json').write_text(json.dumps({'passed':results,'metrics':metrics,'browser':browser.version},ensure_ascii=False,indent=2))
                print(json.dumps(metrics), flush=True)
                browser.close()
        finally:
            server.terminate()
            try: server.wait(timeout=5)
            except subprocess.TimeoutExpired: server.kill(); server.wait()
