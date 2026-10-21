"""A real one-time reveal, saved across devices; only isolated local data."""
import json,os,secrets,shutil,socket,subprocess,tempfile,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
root=Path(__file__).resolve().parents[1];out=Path('/workspace/artifacts/yeni-planlar');out.mkdir(parents=True,exist_ok=True);checks=[]
def check(ok,label):
    assert ok,label
    checks.append(label)
with tempfile.TemporaryDirectory(prefix='kutup-plan-reveal-') as temp:
    with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
    base=f'http://127.0.0.1:{port}';key=secrets.token_hex(24)
    with open(Path(temp)/'server.log','w') as log:
        server=subprocess.Popen(['node','server/index.js','--dev'],cwd=root,env={**os.environ,'DATA_DIR':temp,'ADMIN_KEY':key,'HOST':'127.0.0.1','PORT':str(port),'KUTUP_TEST_HOOKS':'1'},stdout=log,stderr=log)
        try:
            for _ in range(150):
                try:urllib.request.urlopen(base+'/api/health',timeout=1);break
                except Exception:time.sleep(.15)
            with sync_playwright() as p:
                browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
                ctx=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce');ctx.add_init_script("localStorage.setItem('kutup-tur','done');localStorage.setItem('kutup-motion','still');localStorage.setItem('kutup-mode','light');")
                def api(path,body=None,owner=False):
                    r=ctx.request.fetch(base+'/api'+path,method='POST' if body is not None else 'GET',headers={'X-Kutup':'1',**({'X-Owner-Key':key} if owner else {})},data=body)
                    assert r.ok,f'{path}: {r.status} {r.text()}'
                    return r.json()
                me=api('/groups',{'name':'Batur','username':'reveal_batur','password':'reveal-test-123'})
                page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto(base+'/?tab=home');expect(page.locator('.app-shell')).to_be_visible()
                api('/blueprints/rewards')
                api('/owner/members/'+me['memberId']+'/unlock',{'model':'mardinevi'},True)
                page.evaluate("window.dispatchEvent(new Event('online'))")
                modal=page.get_by_role('dialog',name='Batur’dan plan sürprizi!',exact=True);expect(modal).to_be_visible(timeout=10000)
                expect(modal).to_contain_text('Mardin Evi');expect(modal).to_contain_text('Plan kalıcı açıldı')
                check(modal.locator('.plan-reveal-art svg').count()==1,'The reveal includes the real coded building')
                check(modal.locator('.plan-reveal-art').evaluate("e=>getComputedStyle(e).animationName")=='none','Reduced motion keeps the reveal still')
                check(page.evaluate('document.documentElement.scrollWidth<=390'),'Reveal fits a phone width')
                modal.screenshot(path=str(out/'mardin-plani-surpriz.png'))
                # Hold a real GET with the old notice until its acknowledgement
                # finishes. A late response must not resurrect a dismissed reveal.
                held=[]
                def hold_reward(route):held.append((route,route.fetch()))
                page.route('**/api/blueprints/rewards',hold_reward)
                page.evaluate("window.dispatchEvent(new Event('online'))")
                for _ in range(40):
                    if held:break
                    page.wait_for_timeout(50)
                assert held,'A reward refresh was intercepted'
                modal.get_by_role('button',name='Koleksiyonuma kaldır',exact=True).click();expect(modal).not_to_be_visible()
                for _ in range(40):
                    if not api('/blueprints/rewards')['items']:break
                    page.wait_for_timeout(50)
                assert not api('/blueprints/rewards')['items']
                for route,response in held:route.fulfill(response=response)
                page.unroute('**/api/blueprints/rewards',hold_reward)
                page.wait_for_timeout(600)
                check(modal.count()==0,'A delayed GET cannot replay an already acknowledged plan')
                page.reload();expect(page.locator('.app-shell')).to_be_visible();page.wait_for_timeout(600)
                check(modal.count()==0,'Reload does not replay the same find')
                other=browser.new_context(storage_state={'cookies':ctx.storage_state()['cookies']})
                r=other.request.get(base+'/api/blueprints/rewards')
                check(r.ok and r.json()['items']==[],'A second device shares the server acknowledgement without local storage')
                api('/owner/members/'+me['memberId']+'/unlock',{'model':'atakule'},True)
                page.evaluate("window.dispatchEvent(new Event('online'))");expect(modal).to_be_visible();expect(modal).to_contain_text('Atakule')
                page.evaluate("document.documentElement.dataset.mode='dark'");modal.screenshot(path=str(out/'atakule-plani-koyu.png'))
                modal.get_by_role('button',name='Planlarıma bak',exact=True).click()
                expect(page.get_by_role('dialog',name='Ne inşa ediyorsun?',exact=True)).to_be_visible()
                check(True,'The reveal opens the real catalogue even when coming from home')
                check(not errors,'No browser JavaScript errors')
                browser.close()
        finally:server.terminate();server.wait(timeout=10)
(out/'reveal-results.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2));print(json.dumps({'passed':len(checks)}))
