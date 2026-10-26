"""n46 D in the real app at phone size: a v2 team with two building sessions at
once, a site card, the same plot after completion, and move mode on planned plots.
Isolated local server and database only; never the live site.
Run: python tests/koy_d_browser.py --artifacts /tmp/kutup-koy-d
Chromium's phone emulation is not a physical phone check.
"""
import argparse, os, secrets, shutil, socket, sqlite3, subprocess, tempfile, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser()
parser.add_argument('--artifacts', default='/tmp/kutup-koy-d')
args = parser.parse_args()
artifacts = Path(args.artifacts); artifacts.mkdir(parents=True, exist_ok=True)
root = Path(__file__).resolve().parents[1]
passed = []
def check(name, ok):
    assert ok, name
    passed.append(name); print('PASS', name, flush=True)
FETCH = '''async ([path,body,headers])=>{const r=await fetch('/api'+path,{method:body===null?'GET':'POST',headers:{'Content-Type':'application/json','X-Kutup':'1',...headers},...(body===null?{}:{body:JSON.stringify(body)})});const d=await r.json();if(!r.ok)throw Error(path+': '+r.status+' '+(d.error||''));return d}'''
def api(page, path, body=None, headers=None):
    return page.evaluate(FETCH, [path, body, headers or {}])
V2 = {'X-Kutup-Village-Version': '3'}
def settle(page):
    # A gift arrives with its delivery sheet first; take it, then look at the village.
    page.wait_for_timeout(600)
    for _ in range(3):
        take = page.get_by_role('button', name='Teslim aldım', exact=False)
        if not take.count(): break
        take.first.click(); page.wait_for_timeout(400)

with tempfile.TemporaryDirectory(prefix='kutup-koy-d-') as temp:
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]
    base = f'http://127.0.0.1:{port}'
    key = secrets.token_urlsafe(32)
    with open(Path(temp) / 'server.log', 'w') as log:
        server = subprocess.Popen(['node', 'server/index.js', '--dev'], cwd=root, env={**os.environ, 'DATA_DIR': temp, 'ADMIN_KEY': key, 'PORT': str(port), 'HOST': '127.0.0.1', 'KUTUP_TEST_HOOKS': '1'}, stdout=log, stderr=log)
        try:
            for _ in range(150):
                try:
                    with urllib.request.urlopen(base + '/api/health', timeout=1) as r:
                        if r.status == 200: break
                except OSError: time.sleep(.1)
            else: raise RuntimeError('Local server did not start')
            db = lambda: sqlite3.connect(Path(temp) / 'kutup.sqlite')
            with sync_playwright() as p:
                browser = p.chromium.launch(executable_path=shutil.which('chromium') or '/opt/pw-browsers/chromium', args=['--no-sandbox'])
                phone = dict(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2, reduced_motion='reduce')
                ctx = browser.new_context(**phone)
                ctx.add_init_script("localStorage.setItem('kutup-tur','done');localStorage.setItem('kutup-mode','light');")
                page = ctx.new_page(); errors = []
                page.on('pageerror', lambda e: errors.append(str(e)))
                page.goto(base)
                page.locator('.entry-actions .btn.primary').click()
                page.get_by_label('Ekibinizin adı').fill('Köy D')
                page.locator('.sheet-page button[type=submit]').click()
                page.get_by_label('Sana ne diyelim?').fill('Ada')
                page.locator('.sheet-page button[type=submit]').click()
                page.get_by_label('Kullanıcı adı', exact=True).fill('koy_d_ada')
                page.get_by_label('Şifre', exact=True).fill('test-password-123')
                page.locator('.sheet-page button[type=submit]').click()
                expect(page.locator('.app-shell')).to_be_visible()
                invite = api(page, '/state')['group']['invite']
                # Two neighbours join from their own phones.
                mates = {}
                for name in ['Ege', 'Can']:
                    c = browser.new_context(**phone); pg = c.new_page(); pg.goto(base)
                    api(pg, '/join', {'invite': invite, 'name': name, 'username': f'koy_d_{name.lower()}', 'password': 'test-password-123'})
                    mates[name] = pg
                with db() as d:
                    ids = dict(d.execute('SELECT name, id FROM members').fetchall())
                    d.execute('UPDATE members SET bricks = 500')
                owner = {'X-Owner-Key': key}
                api(page, f"/owner/members/{ids['Ada']}/gift", {'model': 'kahve'}, owner)
                api(page, f"/owner/members/{ids['Ege']}/gift", {'model': 'sahaf'}, owner)
                api(page, '/__test/village-v2', {'name': 'Ada'})
                runs = {}
                for name, model in [('Ege', 'ev'), ('Can', 'konak')]:
                    runs[name] = api(mates[name], '/focus', {'action': 'start', 'strict': True, 'model': model, 'minutes': 50, 'requestKey': f'koy-d-browser-{name.lower()}-0001'}, V2)['run']
                # Ege is halfway, Can just started.
                with db() as d:
                    d.execute('UPDATE members SET focus_end = ? WHERE id = ?', (int(time.time() * 1000) + 25 * 60000, ids['Ege']))
                v = api(page, '/village', None, V2)
                plots = {s['focusRunId']: s['placement']['plotId'] for s in v['sites']}
                check('Two simultaneous sites hold two different plots', len(set(plots.values())) == 2)
                page.reload(); expect(page.locator('.app-shell')).to_be_visible(); settle(page)
                page.locator('.mobile-bottom').get_by_role('link', name='Köy', exact=True).click()
                canvas = page.locator('.village-map-wrap canvas').first
                expect(canvas).to_be_visible(); page.wait_for_timeout(900)
                check('The v2 village draws without a page error', not errors)
                check('Nothing overflows at 390 px', page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
                page.locator('.village-map-wrap').screenshot(path=str(artifacts / 'D-koy-iki-santiye.png'))
                # Ege's site: fly there from the people row, pick the centre.
                page.get_by_role('button', name='Ege mahallesi, şu an odakta').click(); page.wait_for_timeout(900)
                canvas.focus(); page.keyboard.press('Enter')
                card = page.get_by_role('dialog', name='Ev inşaatı')
                expect(card).to_be_visible()
                expect(card).to_contain_text('Yapan: Ege')
                check('A site is selectable and shows the server stage', '%5' in card.inner_text() or '%4' in card.inner_text())
                page.locator('.village-map-wrap').screenshot(path=str(artifacts / 'D-santiye-karti.png'))
                card.get_by_role('button', name='Kartı kapat').click()
                # Ege finishes: one building on the very plot the site held.
                with db() as d:
                    d.execute('UPDATE members SET focus_end = ?, focus_beat = ? WHERE id = ?', (int(time.time() * 1000) - 1000, int(time.time() * 1000) - 1000, ids['Ege']))
                api(mates['Ege'], '/state')
                v = api(page, '/village', None, V2)
                ev = [b for b in v['buildings'] if b['memberId'] == ids['Ege'] and b['model'] == 'ev']
                check('The finished building stands on its site\'s plot', len(ev) == 1 and ev[0]['placement']['plotId'] == plots[runs['Ege']])
                page.reload(); expect(page.locator('.app-shell')).to_be_visible(); settle(page)
                page.locator('.mobile-bottom').get_by_role('link', name='Köy', exact=True).click(); page.wait_for_timeout(900)
                page.get_by_role('button', name='Ege mahallesi').click(); page.wait_for_timeout(900)
                page.locator('.village-map-wrap').screenshot(path=str(artifacts / 'D-ayni-parselde-bina.png'))
                # Can's mansion has only just started: a fenced, staked site, no building yet.
                page.get_by_role('button', name='Can mahallesi, şu an odakta').click(); page.wait_for_timeout(900)
                page.locator('.village-map-wrap').screenshot(path=str(artifacts / 'D-yeni-santiye.png'))
                # Ada moves her café: planned plots glow, the café stays until one is picked.
                page.get_by_role('button', name='Benim mahallem').click(); page.wait_for_timeout(900)
                canvas.focus(); page.keyboard.press('Enter')
                mine = page.get_by_role('dialog', name='Kır Kahvesi bilgisi')
                expect(mine).to_be_visible()
                mine.get_by_role('button', name='Taşı', exact=False).click()
                expect(page.locator('.move-banner')).to_be_visible(); page.wait_for_timeout(700)
                page.locator('.village-map-wrap').screenshot(path=str(artifacts / 'D-tasima-arsalari.png'))
                check('Move mode offers planned plots', True)
                check('No page errors at the end', not errors)
                browser.close()
        finally:
            server.terminate(); server.wait(5)
print(f'{len(passed)} checks passed; images in {artifacts}')
