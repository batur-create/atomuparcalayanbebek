"""n46 G: Komuta merkezi → Ekipler → Köy düzeni in a real browser, at phone
size: a draft planned in the page, its preview, falling behind and catching
up, the switch members then see, and going back to the old village with
every building in place. Isolated local database only; Chromium's phone
emulation is not a physical phone.

python tests/koy_g_browser.py --out /tmp/kutup-koy-g
"""
import argparse, json, os, secrets, shutil, socket, sqlite3, subprocess, tempfile, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[1]
ap = argparse.ArgumentParser()
ap.add_argument('--out', required=True)
args = ap.parse_args()
out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
passed = []
def check(name, ok, info=''):
    assert ok, f'{name} {info}'
    passed.append(name); print('PASS', name, info, flush=True)
FETCH = '''async ([path,body,headers])=>{const r=await fetch('/api'+path,{method:body===null?'GET':'POST',headers:{'Content-Type':'application/json','X-Kutup':'1',...headers},...(body===null?{}:{body:JSON.stringify(body)})});const d=await r.json();if(!r.ok)throw Error(path+': '+r.status+' '+(d.error||''));return d}'''
def api(page, path, body=None, headers=None):
    return page.evaluate(FETCH, [path, body, headers or {}])
V2 = {'X-Kutup-Village-Version': '3'}
MODELS = ['ev', 'kulube', 'kahve', 'sahaf', 'bostan', 'konak', 'kule', 'cicekci', 'pazar']

with tempfile.TemporaryDirectory(prefix='kutup-koy-g-') as temp:
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
                # A building session on a phone starts behind the lock guide, which asks for notifications.
                ctx.grant_permissions(['notifications'], origin=base)
                ctx.add_init_script("localStorage.setItem('kutup-tur','done');localStorage.setItem('kutup-mode','light');")
                page = ctx.new_page(); errors = []
                page.on('pageerror', lambda e: errors.append(str(e)))
                page.goto(base)
                ada = api(page, '/groups', {'name': 'Ada', 'groupName': 'Köy G', 'username': 'koy_g_ada', 'password': 'test-password-123'})
                mate = browser.new_context(**phone).new_page(); mate.goto(base)
                api(mate, '/join', {'invite': ada['group']['invite'], 'name': 'Ege', 'username': 'koy_g_ege', 'password': 'test-password-123'})
                with db() as d:
                    ids = dict(d.execute('SELECT name, id FROM members').fetchall())
                    d.execute('UPDATE members SET bricks = 2000')
                # Batur opens Komuta merkezi on the same phone.
                own = ctx.new_page(); own_errors = []
                own.on('pageerror', lambda e: own_errors.append(str(e)))
                own.on('dialog', lambda d: d.accept())
                own.goto(base + '/batur')
                own.get_by_label('Yönetici anahtarı').fill(key)
                own.get_by_role('button', name='Kutuyu aç', exact=True).click()
                expect(own.locator('.owner-toolbar')).to_be_visible()
                for i in range(24):
                    api(own, f"/owner/members/{ids['Ada' if i % 2 else 'Ege']}/gift", {'model': MODELS[i % len(MODELS)]})
                # Ege is building right now: the site needs its place in the draft too.
                api(mate, '/focus', {'action': 'start', 'strict': True, 'model': 'konak', 'minutes': 50, 'requestKey': 'koy-g-browser-ege-0001'})

                def panel():
                    own.locator('.owner-toolbar').get_by_role('button', name='Ekipler', exact=False).click()
                    own.locator('.owner-group').filter(has_text='Köy G').get_by_role('button', name='Köy düzeni', exact=True).click()
                    dialog = own.get_by_role('dialog', name='Köy G · köy düzeni', exact=False)
                    expect(dialog).to_be_visible()
                    expect(dialog.locator('.owner-village-now')).to_be_visible()
                    return dialog
                dialog = panel()
                check('the panel opens on the old village with the right counts', 'eski köy' in dialog.locator('.owner-village-now').inner_text() and '24 bina · 1 şantiye' in dialog.inner_text())
                dialog.screenshot(path=str(out / 'g-panel-eski-koy.png'))

                # 1. A draft, planned in this page.
                t0 = time.time()
                dialog.get_by_role('button', name='Yeni köy taslağı hazırla', exact=True).click()
                expect(dialog.locator('.owner-village-note')).to_contain_text('Taslak hazır', timeout=60000)
                check('a draft is planned in the browser and stored', True, f'{time.time() - t0:.1f}s')
                canvas = dialog.locator('.owner-village-preview')
                expect(canvas).to_be_visible(); own.wait_for_timeout(800)
                check('the draft has a preview', canvas.bounding_box()['height'] > 200)
                dialog.screenshot(path=str(out / 'g-taslak-onizleme.png'))
                check('members still see the old village', 'contractVersion' not in api(page, '/village', None, V2))

                # 2. Someone builds meanwhile: the draft is behind until it is caught up.
                api(own, f"/owner/members/{ids['Ada']}/gift", {'model': 'kahve'})
                dialog.get_by_role('button', name='Kapat', exact=False).first.click()
                dialog = panel()
                expect(dialog).to_contain_text('değişiklik geride')
                check('a behind draft cannot be switched to', dialog.get_by_role('button', name='Yeni köyü aç', exact=True).is_disabled())
                dialog.screenshot(path=str(out / 'g-taslak-geride.png'))
                dialog.get_by_role('button', name='Eşitle', exact=True).click()
                expect(dialog.locator('.owner-village-note')).to_contain_text('Eşitlendi', timeout=60000)
                check('catching up makes it switchable', dialog.get_by_role('button', name='Yeni köyü aç', exact=True).is_enabled())

                # 3. The switch (the confirm is accepted): members get the new village.
                dialog.get_by_role('button', name='Yeni köyü aç', exact=True).click()
                expect(dialog.locator('.owner-village-note')).to_contain_text('Yeni köy açıldı')
                expect(dialog).to_contain_text('14 gün kaldı')
                dialog.screenshot(path=str(out / 'g-yeni-koy-acildi.png'))
                v = api(page, '/village', None, V2)
                check('members see the new village with every building placed', v.get('contractVersion') == 2 and len(v['buildings']) == 25 and all(b['placement'] for b in v['buildings']) and len(v['sites']) == 1, str(len(v.get('buildings', []))))
                page.reload(); expect(page.locator('.app-shell')).to_be_visible(); page.wait_for_timeout(600)
                # Ada's twelve gifts arrive with their delivery sheets first; take them all.
                for _ in range(30):
                    take = page.get_by_role('button', name='Teslim aldım', exact=False)
                    if not take.count(): break
                    take.first.click(); page.wait_for_timeout(300)
                page.locator('.mobile-bottom').get_by_role('link', name='Köy', exact=True).click()
                expect(page.locator('.village-map-wrap canvas').first).to_be_visible(); page.wait_for_timeout(900)
                page.locator('.village-map-wrap').screenshot(path=str(out / 'g-uye-yeni-koy.png'))
                check('a member draws the new village without an error', not errors, str(errors[:2]))

                # 4. A building session started from the app: its plot is found in this browser
                # (a real module worker) and the server writes exactly that plot.
                sent = []
                page.on('request', lambda r: sent.append(r.post_data_json) if r.url.endswith('/api/focus') and r.method == 'POST' else None)
                page.locator('.mobile-bottom [data-tab]').first.click()
                # The card's timer keeps re-rendering the button; a plain tap event is what a finger sends.
                start = page.locator('.focus-start'); expect(start).to_be_visible(); page.wait_for_timeout(500); start.dispatch_event('click')
                lock = page.locator('.lock-sheet')
                try:
                    lock.wait_for(timeout=3000); lock.locator('.btn.primary').dispatch_event('click')
                except Exception:
                    pass
                for _ in range(100):
                    if any((b or {}).get('action') == 'start' for b in sent): break
                    page.wait_for_timeout(100)
                body = next(b for b in sent if (b or {}).get('action') == 'start')
                check('the app sends a plan made in the browser', bool(body.get('village') and body['village']['plan']['plot']['id']), json.dumps(body)[:200])
                page.wait_for_timeout(800)
                with db() as d:
                    plot = d.execute("SELECT p.plot_id FROM village_placements p JOIN members m ON p.subject_id = m.focus_run_id WHERE p.subject_type = 'site' AND m.name = 'Ada'").fetchone()
                check('the server wrote the very plot the browser chose', plot and plot[0] == body['village']['plan']['plot']['id'], str(plot))
                page.locator('.mobile-bottom').get_by_role('link', name='Köy', exact=True).click(); page.wait_for_timeout(900)
                # The focus studio is animated while the session starts. Capture
                # the viewport without scrolling the moving map into position.
                page.screenshot(path=str(out / 'g-uye-santiye-tarayici-plani.png'))

                # 5. A gift from Komuta merkezi, its plot planned in the owner's browser.
                gift = own.evaluate('''async ([member, group]) => {
                  const { ownerPlaceIn } = await import('/src/koy2/browserPlan.js');
                  const { get, api } = await import('/src/api.js');
                  const village = await ownerPlaceIn(get, group, { subject: { type: 'building', id: 'new' }, model: 'sahaf', owner: member, created: Date.now() });
                  const r = await api(`/owner/members/${member}/gift`, { model: 'sahaf', village });
                  return { id: r.id, plot: village && village.plan.plot.id };
                }''', [ids['Ege'], ada['group']['id']])
                with db() as d:
                    plot = d.execute("SELECT plot_id FROM village_placements WHERE subject_type = 'building' AND subject_id = ?", (gift['id'],)).fetchone()
                check("a gift planned in the owner's browser lands on that plot", gift['plot'] and plot and plot[0] == gift['plot'], json.dumps(gift))
                v = api(page, '/village', None, V2)
                check('every building still has its place', len(v['buildings']) == 26 and all(b['placement'] for b in v['buildings']))

                # 6. Back to the old village: every building there, the new one waits as a draft.
                dialog.get_by_role('button', name='Kapat', exact=False).first.click()
                dialog = panel()
                dialog.get_by_role('button', name='Eski köye dön', exact=True).click()
                expect(dialog.locator('.owner-village-note')).to_contain_text('Eski köye dönüldü')
                expect(dialog.locator('.owner-village-now')).to_contain_text('eski köy')
                dialog.screenshot(path=str(out / 'g-eski-koye-donus.png'))
                old = api(page, '/village')
                check('the old village has every building, including those made in the new one', 'contractVersion' not in old and len(old['buildings']) == 26)
                with db() as d:
                    check('nothing earned was touched', d.execute("SELECT count(*) FROM buildings").fetchone()[0] == 26 and d.execute("SELECT count(*) FROM buildings WHERE pos_x IS NULL").fetchone()[0] == 0)
                check('the owner panel had no page error', not own_errors, str(own_errors[:2]))
                browser.close()
        finally:
            server.terminate(); server.wait(timeout=10)
(out / 'g-results.json').write_text(json.dumps({'passed': passed}, ensure_ascii=False, indent=1))
print(json.dumps({'passed': len(passed)}))
