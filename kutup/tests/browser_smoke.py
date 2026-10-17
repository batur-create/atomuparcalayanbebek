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
# d25: headings whose last line is a single word or emoji (h1–h3 are balanced).
LONE_LAST = r'''(() => [...document.querySelectorAll("h1, h2, h3")].filter((h) => {
  const r = h.getBoundingClientRect(); if (r.width < 2) return false;
  const words = [], walk = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) for (const m of walk.currentNode.textContent.matchAll(/\S+/g)) {
    const range = document.createRange(); range.setStart(walk.currentNode, m.index); range.setEnd(walk.currentNode, m.index + m[0].length);
    const rects = range.getClientRects(), b = rects[rects.length - 1]; if (b) words.push([(b.top + b.bottom) / 2, b.height]);
  }
  // A word is on the last line when its middle sits inside that line's height.
  const [mid, height] = words.reduce((a, w) => (w[0] > a[0] ? w : a), [-1, 0]);
  const onLast = words.filter(([m]) => Math.abs(m - mid) < height / 2).length;
  return words.length > 2 && onLast < words.length && onLast === 1;
}).map((h) => h.innerText.trim().slice(0, 40)))()'''
results = []
def check(name, condition):
    assert condition, name
    results.append(name)
    print('PASS', name, flush=True)

# n27: elements that look tappable (pointer cursor, a :hover rule, an arrow, a
# button) but have no action: no button/link/field around them and no React
# click handler on them or an ancestor. Returns short labels of the offenders.
FAKE_TAPPABLES = r'''(() => {
  const ACT = "button, a[href], input, select, textarea, label, summary, [role=button], [role=tab], [role=menuitemradio]";
  const key = (el) => Object.keys(el).find((k) => k.startsWith("__reactProps$"));
  const acts = (el) => {
    for (let x = el; x && x !== document.body; x = x.parentElement) {
      if (x.matches(ACT)) return true;
      const k = key(x);
      if (k && ["onClick", "onPointerDown", "onPointerUp", "onMouseDown"].some((h) => typeof x[k][h] === "function")) return true;
    }
    return false;
  };
  const shown = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 3 && r.height > 3 && s.visibility !== "hidden" && s.display !== "none"; };
  const hovers = new Set();
  const walk = (rules) => { for (const r of rules) { if (r.cssRules && !r.selectorText) walk(r.cssRules); if (r.selectorText?.includes(":hover")) for (const p of r.selectorText.split(",")) if (p.includes(":hover")) hovers.add(p.replace(/:hover/g, "").replace(/::?(before|after)/g, "").trim()); } };
  for (const s of document.styleSheets) { try { walk(s.cssRules); } catch (e) {} }
  const out = new Set();
  const flag = (el, why) => shown(el) && !acts(el) && out.add(`${why}: ${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} «${(el.innerText || "").trim().slice(0, 30)}»`);
  for (const sel of hovers) { try { document.querySelectorAll(sel).forEach((el) => flag(el, "hover")); } catch (e) {} }
  document.querySelectorAll("body *").forEach((el) => {
    if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") return;
    if (getComputedStyle(el).cursor === "pointer") flag(el, "pointer");
    if (/lucide-(chevron-right|arrow-right|arrow-up-right|external-link)/.test(el.getAttribute("class") || "")) flag(el.parentElement, "arrow");
    if (/[›→↗]/.test([...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(""))) flag(el, "arrow");
  });
  document.querySelectorAll("button").forEach((b) => {
    const k = key(b), has = k && ["onClick", "onPointerDown", "onPointerUp", "onMouseDown"].some((h) => typeof b[k][h] === "function");
    if (!has && !(b.type === "submit" && b.form) && !b.disabled && shown(b)) out.add(`idle button: ${String(b.className).split(" ")[0]} «${b.innerText.trim().slice(0, 30)}»`);
  });
  return [...out];
})()'''

# d24: small controls that got an invisible 44px layer. Returns the ones whose
# tappable area, walked out from the centre, is under 40px across or down.
SHORT_REACH = r'''(() => {
  const SEL = ".icon-button, .text-button, .filter-chip, .toast > button, .rhythm-chips button, .sound-pill, .reaction, .reply-button, .send-button, .coffee-button, .status-route, .village-building-list summary";
  const out = [];
  document.querySelectorAll(SEL).forEach((el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || el.closest("[inert], .mobile-hidden")) return;
    el.scrollIntoView({ block: "center" });
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    if (r.width < 4 || document.elementFromPoint(x, y)?.closest(SEL) !== el) return;
    const reach = (dx, dy) => { let n = 0; while (n < 30 && document.elementFromPoint(x + dx * (n + 1), y + dy * (n + 1))?.closest(SEL) === el) n++; return n; };
    if (reach(-1, 0) + reach(1, 0) + 1 < 40 || reach(0, -1) + reach(0, 1) + 1 < 40) out.push(`${String(el.className).split(" ")[0] || el.tagName.toLowerCase()} «${(el.getAttribute("aria-label") || el.innerText || "").trim().slice(0, 24)}» ${Math.round(r.width)}x${Math.round(r.height)}`);
  });
  scrollTo(0, 0);
  return out;
})()'''

def json_call(page, path, body=None):
    return page.evaluate('''async ([path, body]) => {
      const r = await fetch('/api' + path, {method: body === null ? 'GET' : 'POST',
        headers: {'X-Kutup':'1','Content-Type':'application/json'},
        ...(body === null ? {} : {body: JSON.stringify(body)})});
      if (!r.ok) throw new Error(path + ': ' + r.status);
      return r.json();
    }''', [path, body])

# n27: joining and founding are short steps under the welcome's sky.
def steps_to_name(page, team=None):
    page.locator('.entry-actions .btn.primary').click()
    if team is not None:
        page.get_by_label('Ekibinizin adı').fill(team)
        page.locator('.sheet-page button[type=submit]').click()

def finish_steps(page, username, name):
    page.get_by_label('Sana ne diyelim?').fill(name)
    page.locator('.sheet-page button[type=submit]').click()
    page.get_by_label('Kullanıcı adı', exact=True).fill(username)
    page.get_by_label('Şifre', exact=True).fill('audit-password-123')
    page.locator('.sheet-page button[type=submit]').click()
    expect(page.locator('.app-shell')).to_be_visible()

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
                # n27: the welcome is the living sky with a paper sheet: two ways in, no sideways scroll.
                expect(page.locator('.entry-sheet')).to_be_visible()
                check('Welcome: the living sky with Kara and two ways in', page.locator('.entry-sky .sky-scene').count()==1
                    and page.locator('.entry-kara svg.kara').count()==1
                    and page.get_by_role('button', name='Yeni ekip kur').is_visible() and page.get_by_role('button', name='Giriş yap', exact=True).is_visible())
                widths = []
                for w in (375, 360):
                    page.set_viewport_size({'width': w, 'height': 740}); page.wait_for_timeout(150)
                    widths.append(page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
                page.set_viewport_size({'width': 375, 'height': 812})
                check('Welcome: no horizontal overflow at 375 and 360', all(widths))
                page.get_by_role('button', name='Giriş yap', exact=True).click()
                page.keyboard.press('Shift+Tab')
                check('Modal traps keyboard focus', page.get_by_role('dialog').evaluate('(d)=>d.contains(document.activeElement)'))
                page.keyboard.press('Escape')
                check('Modal restores focus and background', page.get_by_role('button', name='Giriş yap', exact=True).evaluate('(e)=>document.activeElement===e') and not page.locator('#root').evaluate('(e)=>e.inert'))
                steps_to_name(page, 'Denetim tayfası')
                check('Founding: the team sign goes up by the path', page.locator('.team-sign', has_text='Denetim tayfası').count()==1)
                finish_steps(page, 'audit_ada', 'Ada')
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
                page.locator('.me-page').wait_for()
                check('Ben gathers profile, look, invite, Batur and account', all(page.locator('.home-door', has_text=t).count()==1 for t in ['Profilim','Görünüm','İstatistiklerim','Arkadaşını ekibe ekle','Batur’a ilet','Hesap ve cihazlar','Ekipten ayrıl']))
                # d23: an account that has a password changes only with the current one.
                page.locator('.home-door', has_text='Hesap ve cihazlar').click()
                page.locator('.account-box').get_by_role('button', name='Değiştir', exact=True).click()
                page.get_by_label('Yeni şifre (isteğe bağlı)').fill('audit-password-123')
                page.get_by_label('Şu anki şifren').fill('not-the-password')
                page.locator('.account-form button[type=submit]').click()
                expect(page.locator('.toast', has_text='Şu anki şifren yanlış')).to_be_visible()
                page.get_by_label('Şu anki şifren').fill('audit-password-123')
                page.locator('.account-form button[type=submit]').click()
                expect(page.locator('.account-form')).to_have_count(0)
                check('Changing the account asks for the current password', page.locator('.account-box', has_text='@audit_ada').count()==1)
                page.keyboard.press('Escape')
                # Kara lives on the library roof (n06): asleep while nobody is at the library; a tap wakes it and it says something useful.
                page.locator('.mobile-bottom').get_by_role('button', name='Kütüp', exact=True).click()
                cat = page.locator('.kara-home .kara-button')
                cat.wait_for()
                rig = cat.locator('svg.kara')
                check('Kara is a vector rig without bitmap assets', rig.count()==1 and cat.locator('img,image').count()==0)
                check('Kara sleeps while nobody is at the library', rig.get_attribute('data-pose')=='sleep')
                cat.click()
                expect(page.locator('.kara-home .kara-say')).to_be_visible()
                expect(rig).to_have_attribute('data-pose','idle')
                check('A tap wakes Kara and it says something', True)
                box=cat.bounding_box()
                page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/3)
                page.mouse.down();page.wait_for_timeout(650);page.mouse.up()
                expect(rig).to_have_attribute('data-pose','purr')
                check('Holding Kara makes it purr',True)
                quiet = page.evaluate("new Promise((r) => { const k = document.querySelector('.kara-home svg.kara'); let n = 0; const mo = new MutationObserver(() => k.dataset.act && n++); mo.observe(k, { attributes: true }); setTimeout(() => { mo.disconnect(); r(n); }, 3500); })")
                check('Reduced motion keeps Kara still', quiet==0)
                page.evaluate('document.documentElement.dataset.theme="teal"')
                check('Kara\'s collar follows the theme',rig.locator('.k-collar>path').first.evaluate('(e)=>getComputedStyle(e).fill')=='rgb(2, 113, 122)')
                page.evaluate('delete document.documentElement.dataset.theme')
                page.locator('.mobile-bottom').get_by_role('button', name='Köy', exact=True).click()
                buddy = page.locator('.kara-buddy svg.kara')
                buddy.wait_for()
                check('Kara keeps you company beside the focus timer', buddy.get_attribute('data-pose')=='idle')
                page.emulate_media(reduced_motion='no-preference')
                page.locator('.mobile-bottom').get_by_role('button', name='Kütüp', exact=True).click()
                rig = page.locator('.kara-home svg.kara'); rig.wait_for()
                page.wait_for_function("document.querySelector('.kara-home svg.kara')?.dataset.act", timeout=10000)
                check('With motion on, Kara does small things on its own', rig.evaluate('(e)=>e.getAnimations({ subtree: true }).length')>0)
                page.mouse.move(20,100)
                gaze = rig.evaluate('(e)=>e.style.getPropertyValue("--px")')
                page.mouse.move(360,600)
                check('Kara\'s eyes follow the pointer', gaze != rig.evaluate('(e)=>e.style.getPropertyValue("--px")'))
                page.screenshot(path=str(artifacts/'kara-mobile.png'))
                page.emulate_media(reduced_motion='reduce')
                second = browser.new_context(viewport={'width':375,'height':812}, reduced_motion='reduce')
                friend = second.new_page(); friend.on('pageerror', lambda e: errors.append(str(e)))
                # n27 privacy: while Ada is at the library, the invite shows names and faces only.
                json_call(page, '/presence', {'status': 'here', 'location': 'Gizli salon'})
                friend.goto(base + '/join/' + session['group']['invite'])
                expect(friend.locator('.path-face:not(.you)')).to_have_count(1)
                invite_info = json_call(friend, '/invites/' + session['group']['invite'])
                check('Invite: names and faces, no presence (API and screen)', sorted(invite_info) == ['count', 'faces', 'name']
                    and all(sorted(f) == ['avatar', 'color', 'name'] for f in invite_info['faces'])
                    and 'Gizli salon' not in json.dumps(invite_info)
                    and 'kütüpte' not in friend.locator('.entry-copy').inner_text().lower().replace('kim kütüpte', '')
                    and friend.locator('.path-face.inside').count()==0)
                json_call(page, '/presence', {'status': 'away'})
                steps_to_name(friend)
                friend.get_by_role('button', name='Tekir', exact=True).click()
                friend.get_by_role('button', name='Gözlük', exact=True).click()
                friend.get_by_role('button', name='Atkı', exact=True).click()
                check('Avatar picker: 44px touch targets, no overflow at 375px', friend.evaluate('''()=>{
                    const boxes=[...document.querySelectorAll('.avatar-options.chars button,.acc-options button,.avatar-tabs button')].map(b=>b.getBoundingClientRect());
                    return boxes.length>=30 && boxes.every(b=>b.height>=44 && b.width>=44 && b.right<=innerWidth) && document.documentElement.scrollWidth<=innerWidth}'''))
                friend.get_by_label('Sana ne diyelim?').fill('Ece')
                friend.locator('.sheet-page button[type=submit]').click()
                friend.get_by_label('Kullanıcı adı', exact=True).fill('audit_ece')
                friend.get_by_label('Şifre', exact=True).fill('audit-password-123')
                friend.locator('.sheet-page button[type=submit]').click()
                expect(friend.locator('.app-shell')).to_be_visible()
                check('Character with accessories is saved', any(m['avatar']=='k:tekir+gozluk+atki' for m in json_call(friend, '/state')['members']))
                lone = []
                for name in ['Köy','Pano','Ben','Kütüp']:
                    page.locator('.mobile-bottom').get_by_role('button',name=name,exact=True).click()
                    page.wait_for_timeout(100)
                    lone += page.evaluate(LONE_LAST)
                if lone: print('Heading with a lone last word:', lone, flush=True)
                check('Headings on the four tabs never leave a word or emoji alone on the last line (d25)', not lone)
                page.get_by_role('button', name='Yoldayım', exact=True).click()
                expect(page.get_by_role('dialog')).to_be_visible()
                lone = page.evaluate(LONE_LAST)
                if lone: print('Heading with a lone last word:', lone, flush=True)
                check('A window title keeps its emoji next to a word: “Yolun kütübe mi düşüyor? 🛵” (d25)', not lone)
                page.keyboard.press('Escape')
                expect(page.get_by_role('dialog')).to_have_count(0)
                page.get_by_role('button', name='Geldim', exact=True).click()
                page.locator('[role=dialog] button[type=submit]').click()
                expect(page.get_by_role('dialog')).to_have_count(0)
                expect(friend.locator('.member-card').filter(has=friend.get_by_text('Ada',exact=True))).to_contain_text('Kütüpte')
                check('Presence reaches a second browser through SSE', True)
                fakes, short = [], []
                for name in ['Kütüp','Köy','Pano','Ben']:
                    page.locator('.mobile-bottom').get_by_role('button',name=name,exact=True).click()
                    page.wait_for_timeout(100)
                    # let the tab's slide-in (and a screen loaded on demand) settle before measuring
                    page.evaluate('''() => new Promise((done) => {
                      let last = '', still = 0;
                      const tick = () => {
                        const r = document.querySelector('.tab-stage')?.getBoundingClientRect();
                        const now = r ? `${r.left},${r.width},${document.body.scrollHeight}` : '';
                        still = now === last ? still + 1 : 0;
                        last = now;
                        still >= 10 ? done() : requestAnimationFrame(tick);
                      };
                      tick();
                    })''')
                    check(f'375px: {name} has no horizontal overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
                    fakes += page.evaluate(FAKE_TAPPABLES)
                    short += page.evaluate(SHORT_REACH)
                # n27: anything with a pointer, a hover, an arrow or a button's shape does something.
                if fakes: print('Looks tappable, does nothing:', fakes, flush=True)
                check('No fake tappables on the four tabs (pointer, hover, arrow, idle button)', not fakes)
                if short: print('Too small for a finger:', short, flush=True)
                check('Small controls on the four tabs: 40px+ to the finger, look unchanged (d24)', not short)
                page.locator('.page-title').click()
                expect(page.locator('.home-status')).to_be_visible()
                page.evaluate('scrollTo(0, 700)'); page.wait_for_timeout(150)
                page.locator('.page-title').click(); page.wait_for_function('scrollY < 5', timeout=4000)
                check('Top-left page name goes home, and back to the top', page.locator('.page-title', has_text='Kütüp').count()==1)
                page.locator('.sky-live').click()
                expect(page.locator('.filter-chip.selected', has_text='Kütüpte')).to_be_visible()
                check('The live line on the sky shows who it is about', True)
                page.locator('.mobile-bottom').get_by_role('button', name='Köy', exact=True).click()
                page.locator('.brick-chip').click()
                expect(page.get_by_role('dialog', name='Tuğla kasan')).to_be_visible()
                page.get_by_role('button', name='Kataloğa bak').click()
                short = page.locator('.catalog-item.blocked').first
                short.evaluate("e => e.scrollIntoView({block: 'center'})"); short.click(force=True)
                expect(page.locator('.catalog-hint')).to_be_visible()
                check('The brick chip opens the wallet; a card out of reach says why', True)
                page.keyboard.press('Escape')
                page.locator('.mobile-bottom').get_by_role('button', name='Pano', exact=True).click()
                page.locator('.board .scribble').click()
                check('The pencil on the board opens the note field', page.evaluate("!!document.activeElement?.matches('.message-form input')"))
                page.locator('.board .private-label').click()
                expect(page.get_by_role('dialog', name='Denetim tayfası')).to_be_visible()
                page.locator('.team-row', has_text='Ece').click()
                expect(page.get_by_role('dialog', name='Ece')).to_be_visible()
                check('“Sadece bizim ekip” opens the team; a person in it opens their card', True)
                page.keyboard.press('Escape')
                context.grant_permissions(['clipboard-read', 'clipboard-write'], origin=base)
                page.locator('.mobile-bottom').get_by_role('button', name='Ben', exact=True).click()
                page.locator('.home-door', has_text='Arkadaşını ekibe ekle').click()
                page.locator('.invite-illustration > button').click()
                expect(page.locator('.invite-illustration > button')).to_contain_text('Kopyalandı')
                check('The “+” in the invite drawing copies the link', True)
                page.keyboard.press('Escape')
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
                check('Home keeps its own look: team card, look button, filter pill, cards in a row line up', friend.evaluate('''()=>{
                    const cs=(s)=>getComputedStyle(document.querySelector(s)), rows={};
                    document.querySelectorAll('.member-slot > .member-card').forEach(c=>{
                        const b=c.getBoundingClientRect();
                        (rows[Math.round(b.top/8)]||=[]).push(c.querySelector('.member-name').getBoundingClientRect().top-b.top);
                    });
                    return cs('.group-switch').backgroundColor==='rgba(0, 0, 0, 0)' && cs('.topbar .mode-switch').display!=='grid'
                        && document.querySelector('.filter-pill').getBoundingClientRect().width>20
                        && Object.values(rows).every(r=>Math.max(...r)-Math.min(...r)<=3);
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
                # Ben → Görünüm: theme packages (n23) and the motion setting.
                friend.locator('.mobile-bottom').get_by_role('button', name='Ben', exact=True).click()
                friend.locator('.home-door', has_text='Görünüm').click()
                paint = '''()=>{const bg=(e)=>getComputedStyle(e).backgroundColor;
                    return [bg(document.documentElement), bg(document.querySelector('.modal')), getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()]}'''
                before = friend.evaluate(paint)
                friend.locator('.look-pick.navy').click()
                after = friend.evaluate(paint)
                check('A theme changes the page and the cards, not only the accent', all(a != b for a, b in zip(before, after))
                    and friend.locator('.look-pick').count()==6 and friend.locator('.look-pick[aria-checked=true]').count()==1
                    and friend.evaluate("document.querySelector('meta[name=theme-color]').content")=='#edf2f8')
                friend.locator('.motion-options button', has_text='Kıpırtısız').click()
                check('Look: Lacivert theme and Kıpırtısız motion are picked and remembered', friend.evaluate('''()=>
                    document.documentElement.dataset.theme==='navy' && document.documentElement.dataset.motion==='still'
                    && localStorage.getItem('kutup-motion')==='still' && localStorage.getItem('kutup-theme')==='navy' '''))
                friend.get_by_role('button', name='Tamam', exact=True).click()
                friend.locator('.home-door', has_text='Denetim tayfası').click()
                check('Team card shows the full team name and everyone', friend.get_by_role('dialog', name='Denetim tayfası').is_visible()
                    and friend.locator('.team-list li').count()==2)
                friend.keyboard.press('Escape')
                page.locator('.home-door', has_text='Batur’a ilet').click()
                expect(page.locator('.envelope-art')).to_be_visible()
                check('Batur’a ilet: the envelope sits beside the words, not on them (d24)', page.evaluate('''()=>{
                    const e=document.querySelector('.envelope-art').getBoundingClientRect(), range=document.createRange();
                    range.selectNodeContents(document.querySelector('.feedback-intro p'));
                    return [...range.getClientRects()].every(r=>r.right<=e.left||r.bottom<=e.top||r.top>=e.bottom)}'''))
                page.locator('.feedback-form textarea').fill('Denetim: Batur paneli ve özel geri bildirim akışı.')
                page.locator('.feedback-form button[type=submit]').click()
                expect(page.locator('.feedback-success')).to_be_visible()
                check('Feedback is sent and tracked', len(json_call(page, '/feedback')) == 1)
                # Any message can be answered; a double tap leaves a heart.
                json_call(friend, '/messages', {'text': 'Sessiz salonda yer var'})
                page.goto(base + '/?tab=board')
                theirs = page.locator('.board .message:not(.mine)', has_text='Sessiz salonda yer var')
                theirs.locator('.reply-button').click()
                page.locator('.message-form input').fill('Geliyorum')
                page.locator('.message-form button[type=submit]').click()
                expect(page.locator('.board .message.mine .reply-quote', has_text='Sessiz salonda')).to_be_visible()
                check('Replying quotes the message', True)
                theirs.locator('.bubble p').evaluate('''(b)=>{const up=()=>b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch'}));up();setTimeout(up,120)}''')
                expect(theirs.locator('.reaction.reacted')).to_be_visible()
                check('Double tap leaves a heart', True)
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
                check('Village recovers after a failed fetch', page.locator('.village-map-wrap canvas.interactive').count()==1)
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
                # The new building makes a lived-in district, so a villager strolls to the square
                # (and rests 2.5 s at each end); the whole village in view shows the stroll.
                for _ in range(4): page.get_by_role('button', name='Uzaklaştır').click()
                live = page.locator('.village-map-wrap canvas.village-live')
                snap = '''(c)=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=0;for(let i=0;i<d.length;i+=8)h=(h*31+d[i])|0;return h}'''
                picked = page.evaluate("document.documentElement.dataset.motion||''")
                def frames(motion, wait):
                    page.evaluate('(m)=>document.documentElement.dataset.motion=m', motion); page.wait_for_timeout(300)
                    first = live.evaluate(snap); page.wait_for_timeout(wait)
                    return first, live.evaluate(snap)
                a, b = frames('full', 3000)
                check('With motion on, the village map keeps moving', a != b)
                a, b = frames('still', 900)
                check('Kıpırtısız keeps the village map still', a == b)
                page.evaluate('(m)=>{if(m)document.documentElement.dataset.motion=m;else delete document.documentElement.dataset.motion}', picked)
                owner = browser.new_page(viewport={'width':375,'height':812}, reduced_motion='reduce')
                owner.on('pageerror', lambda e: errors.append(str(e)))
                owner.goto(base + '/batur')
                owner.get_by_label('Yönetici anahtarı').fill(key)
                owner.get_by_role('button',name='Kutuyu aç',exact=True).click()
                expect(owner.locator('.owner-request')).to_have_count(1)
                check('Owner desk on a phone: Yenile and the bell share one full row, stages on one sliding line (d24)', owner.evaluate('''()=>{
                    const box=(q)=>document.querySelector(q).getBoundingClientRect(), bar=box('.owner-toolbar');
                    const [again, bell]=[...document.querySelectorAll('.owner-toolbar > .btn')].map(b=>b.getBoundingClientRect());
                    const tops=[...document.querySelectorAll('.owner-filters .filter-chip')].map(c=>Math.round(c.getBoundingClientRect().top));
                    return again.left===bar.left && again.top===bell.top && Math.abs(bell.right-bar.right)<1
                        && new Set(tops).size===1 && document.documentElement.scrollWidth<=innerWidth}'''))
                owner.locator('.owner-filters .filter-chip', has_text='Bitti').click()
                owner.evaluate('scrollTo(0, document.documentElement.scrollHeight)')
                check('Owner desk: Kara delik never sits on the empty note (d24)', owner.evaluate('''()=>{
                    const h=document.querySelector('.owner-hole').getBoundingClientRect(), p=document.querySelector('.owner-page .empty p').getBoundingClientRect();
                    return p.bottom<=h.top||p.right<=h.left}'''))
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
                # n25: one phone, two teams. A second account is added without signing out; one tap switches.
                phone = browser.new_context(viewport={'width':375,'height':812}, device_scale_factor=2, reduced_motion='reduce')
                phone.add_init_script("try{localStorage.getItem('kutup-mode')||localStorage.setItem('kutup-mode','light')}catch(e){}")
                two = phone.new_page(); two.on('pageerror', lambda e: errors.append(str(e)))
                two.goto(base); two.get_by_role('button', name='Giriş yap', exact=True).click()
                two.get_by_label('Kullanıcı adı', exact=True).fill('audit_ece')
                two.get_by_label('Şifre', exact=True).fill('audit-password-123')
                two.locator('[role=dialog] button[type=submit]').click()
                expect(two.locator('.app-shell')).to_be_visible()
                first_id = json_call(two, '/session')['memberId']
                two.locator('.mobile-bottom').get_by_role('button', name='Ben', exact=True).click()
                two.locator('.home-door', has_text='Hesap ekle').click()
                expect(two.locator('.entry-sheet')).to_be_visible()
                back = two.get_by_role('button', name='Hesabıma dön')
                check('Hesabıma dön: 44px, inside the screen, over nothing else', two.evaluate('''()=>{
                    const b=document.querySelector('.adding-back'), r=b.getBoundingClientRect();
                    return r.height>=44 && r.left>=0 && r.right<=innerWidth && document.elementFromPoint(r.left+r.width/2, r.top+r.height/2)?.closest('.adding-back')===b
                        && document.documentElement.scrollWidth<=innerWidth}'''))
                two.wait_for_timeout(300); two.screenshot(path=str(artifacts/'n25-hesap-ekle-light.jpg'), type='jpeg', quality=82)
                back.click()
                expect(two.locator('.me-page')).to_be_visible()
                check('Hesap ekle opens the welcome over the open account; Hesabıma dön goes back', json_call(two, '/session')['memberId']==first_id)
                two.locator('.home-door', has_text='Hesap ekle').click()
                steps_to_name(two, 'İkinci ekip')
                finish_steps(two, 'audit_ece2', 'Ece 2')
                second_id = json_call(two, '/session')['memberId']
                check('A second account opens in its own team, nothing mixed', second_id != first_id
                    and json_call(two, '/session')['group']['name']=='İkinci ekip' and two.locator('.member-card').filter(has=two.get_by_text('Ada', exact=True)).count()==0)
                two.locator('.mobile-bottom').get_by_role('button', name='Ben', exact=True).click()
                rows = two.locator('.account-row')
                expect(rows).to_have_count(2)
                check('Hesaplarım lists both accounts with their teams, current first, 44px rows, no overflow at 375px', rows.nth(0).inner_text().startswith('Ece 2')
                    and 'İkinci ekip' in rows.nth(0).inner_text() and 'Denetim tayfası' in rows.nth(1).inner_text()
                    and two.evaluate('''()=>[...document.querySelectorAll('.account-list .home-door')].every(b=>b.getBoundingClientRect().height>=44)
                        && document.documentElement.scrollWidth<=innerWidth'''))
                fakes = two.evaluate(FAKE_TAPPABLES)
                if fakes: print('Looks tappable, does nothing:', fakes, flush=True)
                check('Hesaplarım: everything that looks tappable does something', not fakes)
                two.evaluate("document.querySelector('.toast button')?.click(); document.querySelector('.me-label').scrollIntoView({block: 'start'})"); two.wait_for_timeout(400)
                two.screenshot(path=str(artifacts/'n25-hesaplarim-light.jpg'), type='jpeg', quality=82)
                rows.nth(1).click()
                expect(two.locator('.me-card', has_text='Ece')).to_be_visible()
                two.locator('.mobile-bottom').get_by_role('button', name='Kütüp', exact=True).click()
                expect(two.locator('.member-card').filter(has=two.get_by_text('Ada', exact=True))).to_be_visible()
                check('One tap switches to the other account and shows its team (Ada in Denetim tayfası)', json_call(two, '/session')['memberId']==first_id
                    and json_call(two, '/state')['group']['name']=='Denetim tayfası')
                two.goto(base + '/?tab=board&as=' + second_id)
                expect(two.locator('section.board')).to_be_visible()
                check('A notification for the other account (?as=) opens that account', json_call(two, '/session')['memberId']==second_id and '?as=' not in two.url)
                two.set_viewport_size({'width':1200,'height':900})
                two.locator('.sidebar-profile').click()
                expect(two.get_by_role('dialog', name='Hesaplarım').locator('.account-row')).to_have_count(2)
                check('Desktop: the side bar profile row opens the same switcher', True)
                two.keyboard.press('Escape')
                two.set_viewport_size({'width':375,'height':812})
                two.evaluate("localStorage.setItem('kutup-mode','dark')"); two.goto(base + '/?tab=me')
                expect(two.locator('.account-row')).to_have_count(2)
                check('Hesaplarım in dark mode: dark cards, no overflow', two.evaluate('''()=>document.documentElement.dataset.mode==='dark'
                    && Math.max(...getComputedStyle(document.querySelector('.account-row')).backgroundColor.match(/\\d+/g).slice(0,3).map(Number))<70
                    && document.documentElement.scrollWidth<=innerWidth'''))
                two.evaluate("document.querySelector('.toast button')?.click(); document.querySelector('.me-label').scrollIntoView({block: 'start'})"); two.wait_for_timeout(400)
                two.screenshot(path=str(artifacts/'n25-hesaplarim-dark.jpg'), type='jpeg', quality=82)
                phone.close()
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
