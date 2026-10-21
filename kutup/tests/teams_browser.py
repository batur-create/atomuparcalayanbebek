"""Komuta merkezi → Ekipler (n45) in a real browser; isolated local database only.

Run: python tests/teams_browser.py [--chromium <path>] [--artifacts <dir>]
"""
import argparse, json, os, secrets, shutil, socket, subprocess, tempfile, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--chromium', default=shutil.which('chromium') or shutil.which('google-chrome'))
parser.add_argument('--artifacts', default=None)
args = parser.parse_args()
out = Path(args.artifacts) if args.artifacts else None
if out: out.mkdir(parents=True, exist_ok=True)
checks = []
def check(ok, label):
    assert ok, label
    checks.append(label)
    print('ok', label)
def shot(target, name):
    if out: target.screenshot(path=str(out / name))

with tempfile.TemporaryDirectory(prefix='kutup-teams-') as temp:
    with socket.socket() as sock: sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]
    base = f'http://127.0.0.1:{port}'
    key = secrets.token_hex(24)
    with open(Path(temp) / 'server.log', 'w') as log:
        server = subprocess.Popen(['node', 'server/index.js', '--dev'], cwd=root,
            env={**os.environ, 'DATA_DIR': temp, 'ADMIN_KEY': key, 'PORT': str(port), 'HOST': '127.0.0.1', 'KUTUP_TEST_HOOKS': '1'},
            stdout=log, stderr=log)
        try:
            for _ in range(200):
                try: urllib.request.urlopen(base + '/api/health', timeout=1); break
                except Exception: time.sleep(.15)
            with sync_playwright() as p:
                browser = p.chromium.launch(executable_path=args.chromium, headless=True, args=['--no-sandbox'])
                # Batur's own phone: a member session and the owner panel in the same browser.
                ctx = browser.new_context(viewport={'width': 390, 'height': 844}, reduced_motion='reduce', is_mobile=True, has_touch=True)
                ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=base)
                ctx.add_init_script("localStorage.setItem('kutup-tur','done');localStorage.setItem('kutup-motion','still');localStorage.setItem('kutup-mode','light');")
                def api(path, body=None):
                    r = ctx.request.fetch(base + '/api' + path, method='POST' if body is not None else 'GET', headers={'X-Kutup': '1'}, data=body)
                    assert r.ok, f'{path}: {r.status} {r.text()}'
                    return r.json()
                ada = api('/groups', {'name': 'Ada', 'groupName': 'Kütüp', 'username': 'teams_ada', 'password': 'teams-test-123'})
                friends = browser.new_context()
                for name in ('Bora', 'Cem'):
                    friends.request.fetch(base + '/api/join', method='POST', headers={'X-Kutup': '1'},
                        data={'invite': ada['group']['invite'], 'name': name, 'username': f'teams_{name.lower()}', 'password': 'teams-test-123'})
                member_cookies = lambda: sorted((c['name'], c['value']) for c in ctx.cookies() if c['name'].startswith('kutup_') and c['name'] != 'kutup_owner')
                before_cookies = member_cookies()

                page = ctx.new_page(); errors = []
                page.on('pageerror', lambda e: errors.append(str(e)))
                page.on('dialog', lambda d: d.accept())
                page.goto(base + '/batur')
                page.get_by_label('Yönetici anahtarı').fill(key)
                page.get_by_role('button', name='Kutuyu aç', exact=True).click()
                page.locator('.owner-toolbar').get_by_role('button', name='Ekipler', exact=False).click()
                bar = page.locator('.owner-new-team'); expect(bar).to_be_visible()
                check(page.locator('.owner-group').count() == 1, 'Ekipler starts with the one team from the app')
                first_invite = page.locator('.owner-group').first.locator('.owner-invite-url')
                check(first_invite.input_value() == f"{base}/join/{ada['group']['invite']}", 'Every team shows its invite link')

                bar.get_by_role('button', name='Yeni ekip kur', exact=True).click()
                modal = page.get_by_role('dialog', name='Yeni ekip kur', exact=True); expect(modal).to_be_visible()
                modal.get_by_label('Ekip adı').fill('Hukuk tayfası')
                # A double submit, as from a double tap, before the first answer arrives.
                modal.locator('form').evaluate('f => { f.requestSubmit(); f.requestSubmit(); }')
                expect(modal.locator('.owner-sent')).to_contain_text('Hukuk tayfası kuruldu')
                url = modal.locator('.owner-invite-url').input_value()
                check('/join/' in url, 'The new team comes with its invite link')
                check(modal.get_by_role('button', name='davetini yenile', exact=False).count() == 0, 'The success view only copies; renewing stays on the team card')
                modal.get_by_role('button', name='davet bağlantısını kopyala', exact=False).click()
                expect(modal.locator('.owner-invite-note')).to_contain_text('Kopyalandı')
                check(page.evaluate('navigator.clipboard.readText()') == url, 'Copy puts the exact invite link on the clipboard')
                shot(modal, 'yeni-ekip-kuruldu.png')
                modal.get_by_role('button', name='Tamam', exact=True).click(); expect(modal).not_to_be_visible()
                expect(page.locator('.owner-group')).to_have_count(2)
                check(len(api('/owner/groups')) == 2, 'A double submit makes one team')
                card = page.locator('.owner-group').first
                expect(card.locator('h2')).to_have_text('Hukuk tayfası')
                expect(card.locator('.owner-group-empty')).to_be_visible()
                check(card.get_by_role('button', name='Duyuru yaz', exact=False).is_disabled(), 'Duyuru waits until someone is in the team')
                check(card.locator('.owner-invite-url').input_value() == url, 'The card shows the same invite')
                check(member_cookies() == before_cookies, 'Creating a team leaves the member session cookies exactly as they were')
                session = api('/session')
                check(session['group']['id'] == ada['group']['id'] and session['memberId'] == ada['memberId'], 'The member session still opens the same account and team')

                card.get_by_role('button', name='ekip adını düzenle', exact=False).click()
                rename = page.get_by_role('dialog', name='Ekip adını düzenle', exact=True); expect(rename).to_be_visible()
                rename.get_by_label('Ekip adı').fill('Hukuk ve Siyaset')
                rename.get_by_role('button', name='Adı kaydet', exact=True).click(); expect(rename).not_to_be_visible()
                expect(card.locator('h2')).to_have_text('Hukuk ve Siyaset')
                check(api('/owner/groups')[0]['name'] == 'Hukuk ve Siyaset', 'Renaming is saved on the server')

                card.get_by_role('button', name='davetini yenile', exact=False).click()
                expect(card.locator('.owner-invite-note')).to_contain_text('Yeni davet hazır')
                renewed = card.locator('.owner-invite-url').input_value()
                check(renewed != url and '/join/' in renewed, 'Renewing gives a new link with the panel permission')
                old = ctx.request.fetch(base + '/api/invites/' + url.rsplit('/', 1)[1])
                check(old.status == 404, 'The old link stops opening')

                for width in (390, 360):
                    page.set_viewport_size({'width': width, 'height': 844})
                    check(page.evaluate(f'document.documentElement.scrollWidth <= {width}'), f'Ekipler fits a {width}px phone')
                    check(all(b.bounding_box()['height'] >= 44 for b in card.locator('.owner-invite-row .btn').all()), f'Invite buttons are 44px tall at {width}px')
                page.set_viewport_size({'width': 390, 'height': 844})
                shot(page, 'ekipler-telefon-acik.png')
                page.evaluate("document.documentElement.dataset.mode='dark'")
                shot(page, 'ekipler-telefon-koyu.png')
                page.evaluate("document.documentElement.dataset.mode='light'")

                page.locator('.owner-toolbar').get_by_role('button', name='Ortak Anıtkabir', exact=False).click()
                picker = page.locator('#imece-team'); expect(picker).to_be_visible()
                options = picker.locator('option').all_inner_texts()
                check(any(o.startswith('Hukuk ve Siyaset · henüz kimse yok') for o in options), 'The new team is in the Anıtkabir team picker')
                check(picker.evaluate('s => s.options[s.selectedIndex].text').startswith('Kütüp'), 'The picker still opens on the team with people')
                picker.select_option(label=next(o for o in options if o.startswith('Hukuk')))
                expect(page.locator('.imece-owner-short')).to_contain_text('henüz kimse yok')
                check(page.get_by_role('button', name='Dört ustayı göreve çağır', exact=False).is_disabled(), 'No project starts for the empty team')
                check(api('/owner/imece?group=' + session['group']['id']) is None, 'No project was opened anywhere')
                shot(page.locator('.imece-owner'), 'anitkabir-secici.png')

                app = ctx.new_page(); app.on('pageerror', lambda e: errors.append(str(e)))
                app.goto(base + '/')
                expect(app.locator('.mobile-bottom')).to_be_visible()
                check(api('/state')['group']['name'] == 'Kütüp', 'The member app opens as before')
                check(not errors, 'No browser errors')
                browser.close()
        finally:
            server.terminate(); server.wait(timeout=10)
if out: (out / 'teams-results.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2))
print(json.dumps({'passed': len(checks)}))
