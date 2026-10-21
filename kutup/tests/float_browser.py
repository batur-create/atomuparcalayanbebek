"""Native Document Picture-in-Picture regression checks; isolated local data only.

Run: python tests/float_browser.py --artifacts /tmp/kutup-float-browser
Requires desktop Chromium with Document Picture-in-Picture support.
"""
import argparse
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.request

from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser()
parser.add_argument('--artifacts', default='/tmp/kutup-float-browser')
args = parser.parse_args()
out = Path(args.artifacts)
out.mkdir(parents=True, exist_ok=True)
root = Path(__file__).resolve().parents[1]
checks = []


def check(label, condition):
    assert condition, label
    checks.append(label)
    print('PASS', label, flush=True)


with tempfile.TemporaryDirectory(prefix='kutup-float-browser-') as temp:
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    base = f'http://127.0.0.1:{port}'
    owner_key = secrets.token_hex(24)
    with open(Path(temp) / 'server.log', 'w') as log:
        server = subprocess.Popen(
            ['node', 'server/index.js', '--dev'], cwd=root,
            env={**os.environ, 'DATA_DIR': temp, 'ADMIN_KEY': owner_key,
                 'PORT': str(port), 'HOST': '127.0.0.1', 'KUTUP_TEST_HOOKS': '1'},
            stdout=log, stderr=log,
        )
        try:
            for _ in range(150):
                try:
                    urllib.request.urlopen(base + '/api/health', timeout=1)
                    break
                except OSError:
                    time.sleep(.1)
            else:
                raise RuntimeError('Local server did not start')

            with sync_playwright() as p:
                browser = p.chromium.launch(
                    executable_path=shutil.which('chromium') or shutil.which('google-chrome'),
                    headless=True, args=['--no-sandbox'],
                )
                ctx = browser.new_context(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce')
                ctx.add_init_script("localStorage.setItem('kutup-tur','done');localStorage.setItem('kutup-motion','still');localStorage.setItem('kutup-mode','light');")

                def api(context, path, body=None, owner=False):
                    headers = {'X-Kutup': '1'}
                    if owner:
                        headers['X-Owner-Key'] = owner_key
                    r = context.request.fetch(base + '/api' + path,
                        method='POST' if body is not None else 'GET', headers=headers, data=body)
                    assert r.ok, f'{path}: {r.status} {r.text()}'
                    return r.json()

                joined = api(ctx, '/groups', {'name': 'Ada', 'groupName': 'Yüzen pencere',
                    'username': 'float_ada', 'password': 'float-test-123'})
                member_id = joined['memberId']
                api(ctx, f'/owner/members/{member_id}/bricks', {'delta': 1000, 'note': 'Local test'}, owner=True)
                page = ctx.new_page()
                errors = []
                page.on('pageerror', lambda e: errors.append(str(e)))
                page.on('dialog', lambda dialog: dialog.accept())

                def load_session(body):
                    api(ctx, '/focus', {'action': 'start', 'device': 'desk', **body})
                    page.goto(base + '/?tab=focus')
                    expect(page.locator('.focus-card.running')).to_be_visible()

                def open_panel(label):
                    with ctx.expect_page() as opened:
                        page.get_by_role('button', name='Yüzen pencere', exact=True).click()
                    pip = opened.value
                    pip.set_viewport_size({'width': 240, 'height': 170})
                    pip.on('pageerror', lambda e: errors.append(str(e)))
                    try:
                        expect(pip.locator('.float .clock')).to_have_text(re.compile(r'^\d{2}:\d{2}$'))
                    except Exception:
                        pip.screenshot(path=str(out / f'{label}-failure.png'))
                        raise
                    check(f'{label}: native floating window contains a visible clock', pip.locator('.clock').is_visible())
                    return pip

                def cancel(pip):
                    page.locator('.focus-card .focus-start').click()
                    page.wait_for_function('!window.documentPictureInPicture.window')
                    check('Ending the session closes its floating window', pip.is_closed())

                # Regression: this mode has no presence watcher, but still exposes
                # the floating-window button. It used to open an empty dark body.
                load_session({'minutes': 25, 'strict': True, 'relaxed': True, 'model': 'kulube'})
                check('Browser supports real Document Picture-in-Picture', page.evaluate("'documentPictureInPicture' in window"))
                pip = open_panel('screen-off')
                expect(pip.locator('.top')).to_contain_text('Kulübe')
                expect(pip.locator('p')).to_contain_text('Ekran kapalıyken de sürer')
                check('Screen-off mode explains its own rules without an idle alarm', pip.locator('.float.alarm').count() == 0)
                before = pip.locator('.clock').inner_text()
                background = ctx.new_page()
                background.goto('about:blank')
                background.bring_to_front()
                expect(pip.locator('.clock')).not_to_have_text(before, timeout=6000)
                check('Clock keeps ticking with another tab in front', True)
                background.close()
                pip.screenshot(path=str(out / 'screen-off.png'))
                pip.close()
                expect(page.get_by_role('button', name='Yüzen pencere', exact=True)).to_be_visible()
                pip = open_panel('reopened')
                check('Closing and reopening keeps a single panel', pip.locator('.float').count() == 1)
                cancel(pip)

                # Existing watched construction, including its tea break.
                load_session({'minutes': 50, 'strict': True, 'model': 'ev'})
                pip = open_panel('watched-build')
                expect(pip.locator('.top')).to_contain_text('Ev')
                page.locator('.tea-button').click()
                expect(pip.locator('p')).to_contain_text('Çay molası')
                paused = pip.locator('.clock').inner_text()
                page.wait_for_timeout(1200)
                check('Tea break freezes the floating countdown', pip.locator('.clock').inner_text() == paused)
                page.locator('.tea-note').get_by_role('button', name='Devam et', exact=True).click()
                expect(pip.locator('p')).not_to_contain_text('Çay molası')
                check('Resuming updates the existing floating window', not pip.is_closed())
                cancel(pip)

                # Focus without a building still has the original idle rules.
                load_session({'minutes': 25, 'strict': False, 'honest': True})
                pip = open_panel('focus-only')
                expect(pip.locator('.top')).to_contain_text('Yalnız odak')
                expect(pip.locator('p')).to_contain_text('Uzakta geçen dakika sayılmaz')
                check('Focus-only labels stay accurate', True)
                cancel(pip)

                # A shared project must get a timer, not a blank window or an
                # unrelated private building label. No production project is used.
                members = [member_id]
                for name in ['Bora', 'Cem', 'Deniz']:
                    friend = browser.new_context()
                    result = api(friend, '/join', {'invite': joined['group']['invite'], 'name': name,
                        'username': 'float_' + name.lower(), 'password': 'float-test-123'})
                    members.append(result['memberId'])
                    friend.close()
                project = api(ctx, '/owner/imece', {'members': members, 'groupId': joined['group']['id']}, owner=True)
                page.evaluate("([member, started]) => localStorage.setItem(`kutup-imece-intro:${member}:${started}`, '1')", [member_id, project['started']])
                for relaxed in [True, False]:
                    load_session({'minutes': 25, 'imece': True, 'relaxed': relaxed})
                    pip = open_panel('shared-screen-off' if relaxed else 'shared-watched')
                    expect(pip.locator('.top')).to_contain_text('Ortak Anıtkabir')
                    check('Shared project keeps its own identity', 'Yalnız odak' not in pip.locator('.top').inner_text())
                    cancel(pip)

                # Start opens PiP before its network response. Hold that request
                # to check the window isn't a blank body in the interim, then
                # release the real request without mocking the PiP browser API.
                page.get_by_role('button', name='Bu seansı binasız yap', exact=True).click()
                pending = []

                def hold_start(route):
                    if route.request.post_data_json.get('action') == 'start':
                        pending.append(route)
                    else:
                        route.continue_()

                page.route('**/api/focus', hold_start)
                with ctx.expect_page() as opened:
                    page.locator('.focus-card .focus-start').click()
                pip = opened.value
                pip.set_viewport_size({'width': 240, 'height': 170})
                expect(pip.locator('.float p')).to_contain_text('Seansını Kütüp')
                check('A slow start shows content before a session exists', len(pending) == 1)
                pending.pop().continue_()
                page.unroute('**/api/focus', hold_start)
                expect(pip.locator('.clock')).to_have_text(re.compile(r'^\d{2}:\d{2}$'))
                check('The existing window becomes the live timer after start succeeds', len(ctx.pages) == 2)
                cancel(pip)

                check('No JavaScript errors in the app or native floating windows', not errors)
                (out / 'results.json').write_text(json.dumps({
                    'passed': len(checks), 'checks': checks, 'browser': browser.version,
                    'nativeDocumentPictureInPicture': True,
                }, ensure_ascii=False, indent=2))
                browser.close()
        finally:
            server.terminate()
            try:
                server.wait(timeout=10)
            except subprocess.TimeoutExpired:
                server.kill()

print(json.dumps({'passed': len(checks)}))
