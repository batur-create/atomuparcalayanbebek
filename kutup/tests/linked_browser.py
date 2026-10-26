"""Linked accounts (n50): one phone, three accounts in three teams; isolated local data only.
Run: python tests/linked_browser.py --artifacts /tmp/kutup-linked
With Batur's panel key on the phone, the Köy card offers the other accounts;
one tap starts all of them, one panel follows them, the account on screen can
change, and giving up ends all of them.
"""
import argparse, json, os, secrets, shutil, socket, sqlite3, subprocess, tempfile, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

parser=argparse.ArgumentParser()
parser.add_argument('--artifacts',default='/tmp/kutup-linked')
parser.add_argument('--chromium',default=shutil.which('chromium') or '/opt/pw-browsers/chromium')
args=parser.parse_args()
artifacts=Path(args.artifacts);artifacts.mkdir(parents=True,exist_ok=True)
root=Path(__file__).resolve().parents[1]
passed=[]
def check(name,ok):
    assert ok,name
    passed.append(name); print('PASS',name,flush=True)
def api(page,path,body=None):
    return page.evaluate('''async ([path,body])=>{const r=await fetch('/api'+path,{method:body===null?'GET':'POST',headers:{'Content-Type':'application/json','X-Kutup':'1'},...(body===null?{}:{body:JSON.stringify(body)})});const d=await r.json();if(!r.ok)throw Error(path+': '+r.status+' '+d.error);return d}''',[path,body])
PHONE=dict(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2,user_agent='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36')
INIT='''localStorage.setItem('kutup-tur','done');localStorage.setItem('kutup-mode','light');Object.defineProperty(navigator,'wakeLock',{value:{request:async()=>({released:false,release:async()=>{}})}});'''
KEY=secrets.token_urlsafe(32)

with tempfile.TemporaryDirectory(prefix='kutup-linked-') as temp:
    with socket.socket() as sock:
        sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
    base=f'http://127.0.0.1:{port}'
    with open(Path(temp)/'server.log','w') as log:
        server=subprocess.Popen(['node','server/index.js','--dev'],cwd=root,env={**os.environ,'DATA_DIR':temp,'ADMIN_KEY':KEY,'PORT':str(port),'HOST':'127.0.0.1','KUTUP_TEST_HOOKS':'1'},stdout=log,stderr=log)
        try:
            for _ in range(150):
                try:
                    with urllib.request.urlopen(base+'/api/health',timeout=1) as r:
                        if r.status==200:break
                except OSError:time.sleep(.1)
            else:raise RuntimeError('Local server did not start')
            db=lambda q,a=():sqlite3.connect(Path(temp)/'kutup.sqlite').execute(q,a).fetchall()
            with sync_playwright() as p:
                browser=p.chromium.launch(executable_path=args.chromium,args=['--no-sandbox'])
                errors=[]
                context=browser.new_context(**PHONE,reduced_motion='reduce')
                context.grant_permissions(['notifications'],origin=base)
                context.add_init_script(INIT)
                page=context.new_page()
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.on('dialog',lambda d:d.accept())
                page.goto(base)
                ids={}
                for name,team in [('Batur C','Üçüncü tayfa'),('Batur B','İkinci tayfa'),('Batur A','Birinci tayfa')]:
                    ids[name]=api(page,'/groups',{'name':name,'groupName':team,'username':name.lower().replace(' ','_')+'_n50','password':'test-pass-123'})['memberId']
                db("SELECT 1")
                con=sqlite3.connect(Path(temp)/'kutup.sqlite');con.execute("UPDATE members SET bricks=300");con.commit();con.close()
                page.reload();expect(page.locator('.app-shell')).to_be_visible()
                page.locator('.mobile-bottom').get_by_role('link',name='Köy',exact=True).click()
                expect(page.locator('.focus-card')).to_be_visible()
                page.wait_for_timeout(800)
                check('Without the panel key there is no picker',page.locator('.linked-picker').count()==0)
                api(page,'/owner/login',{'key':KEY})
                page.reload();expect(page.locator('.app-shell')).to_be_visible()
                page.locator('.mobile-bottom').get_by_role('link',name='Köy',exact=True).click()
                picker=page.locator('.linked-picker')
                expect(picker).to_be_visible()
                check('The picker lists the two other accounts',picker.locator('.linked-row').count()==2)
                rows=picker.locator('.linked-row')
                # B builds a 20-brick Asma Çardak, C keeps the default (the free Kulübe), then C goes building-less.
                rows.nth(0).locator('select').select_option('cardak')
                rows.nth(1).locator('select').select_option('')
                picker.scroll_into_view_if_needed()
                page.screenshot(path=str(artifacts/'1-secici.png'))
                page.locator('.focus-start').click()
                page.get_by_role('button',name='Kilitledim, başlat').or_(page.get_by_role('button',name='Bildirimlere izin ver ve başlat')).first.click()
                sites=page.locator('.linked-sites')
                expect(sites).to_be_visible(timeout=15000)
                expect(sites.locator('.linked-site')).to_have_count(3)
                rows_db={r[0]:r[1:] for r in db("SELECT name,focus_end,focus_strict,focus_model,focus_link,focus_honest FROM members")}
                A,B,C=rows_db['Batur A'],rows_db['Batur B'],rows_db['Batur C']
                check('All three end at the same moment',A[0]==B[0]==C[0]>0)
                check('Each has its own choice',(A[1],A[2],B[1],B[2],C[1],C[4])==(1,'kulube',1,'cardak',0,1))
                check('All three are one link',A[3]==B[3]==C[3]==ids['Batur A'])
                check('B paid for its own building',db("SELECT bricks FROM members WHERE name='Batur B'")[0][0]==280)
                sites.scroll_into_view_if_needed()
                page.screenshot(path=str(artifacts/'2-panel.png'))
                # The open account changes: the link follows, the panel still shows all three.
                api(page,'/accounts/switch',{'memberId':ids['Batur B']})
                page.reload();expect(page.locator('.app-shell')).to_be_visible()
                page.locator('.mobile-bottom').get_by_role('link',name='Köy',exact=True).click()
                expect(page.locator('.linked-sites .linked-site')).to_have_count(3,timeout=15000)
                expect(page.locator('.focus-card h2')).to_contain_text('Asma Çardak')
                con=sqlite3.connect(Path(temp)/'kutup.sqlite');con.execute("UPDATE members SET focus_beat=focus_beat-60000");con.commit();con.close()
                before=int(time.time()*1000)-2000
                page.wait_for_timeout(21000)
                beats=[r[0] for r in db("SELECT focus_beat FROM members WHERE focus_end>0")]
                check('A beat from B keeps all three seen',len(beats)==3 and all(b>=before for b in beats))
                page.screenshot(path=str(artifacts/'3-hesap-degisti.png'))
                # Giving up (first two minutes: free) ends all three.
                page.locator('.focus-start').click()
                page.wait_for_timeout(2500)
                check('Giving up ends every account',db("SELECT count(*) FROM members WHERE focus_end>0")[0][0]==0)
                check('B got its bricks back',db("SELECT bricks FROM members WHERE name='Batur B'")[0][0]==300)
                check('No page errors',not errors)
                browser.close()
        finally:
            server.terminate();server.wait()
print(json.dumps({'passed':len(passed)}))
