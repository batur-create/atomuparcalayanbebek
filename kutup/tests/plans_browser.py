"""Meeting lifecycle through actual UI/API. Only an isolated temporary database."""
import argparse
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import sqlite3
import subprocess
import tempfile
import time
import urllib.request
from datetime import datetime, timedelta, timezone
from playwright.sync_api import sync_playwright, expect

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--artifacts',default='/tmp/kutup-plans-browser');args=parser.parse_args()
artifacts=Path(args.artifacts);artifacts.mkdir(parents=True,exist_ok=True)
checks=[]
def check(ok,label):
    assert ok,label
    checks.append(label)

with tempfile.TemporaryDirectory(prefix='kutup-plans-browser-') as directory:
    with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
    base=f'http://127.0.0.1:{port}'
    with open(Path(directory)/'server.log','w') as log:
        server=subprocess.Popen(['node','server/index.js','--dev'],cwd=root,env={**os.environ,'DATA_DIR':directory,'ADMIN_KEY':secrets.token_hex(24),'KUTUP_TEST_HOOKS':'1','HOST':'127.0.0.1','PORT':str(port)},stdout=log,stderr=log)
        try:
            for _ in range(150):
                try:urllib.request.urlopen(base+'/api/health',timeout=1);break
                except Exception:time.sleep(.15)
            else:raise RuntimeError('Isolated server did not start')
            with sync_playwright() as p:
                browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
                contexts=[browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,reduced_motion='reduce',accept_downloads=True) for _ in range(4)]
                def call(ctx,path,body=None,method=None):
                    r=ctx.request.fetch(base+'/api'+path,method=method or ('GET' if body is None else 'POST'),headers={'X-Kutup':'1'},data=body)
                    assert r.ok,f'{path}: {r.status} {r.text()}'
                    return r.json()
                host=call(contexts[0],'/groups',{'name':'Batur','username':'plans_browser_0','password':'browser-plans-pass'})
                people=[host]
                for i,name in enumerate(['Deniz','Ece','Ada'],1):people.append(call(contexts[i],'/join',{'name':name,'username':f'plans_browser_{i}','password':'browser-plans-pass','invite':host['group']['invite']}))
                errors=[];pages=[]
                for ctx in contexts:
                    page=ctx.new_page();page.add_init_script("localStorage.setItem('kutup-mode','light');localStorage.setItem('kutup-motion','still');localStorage.setItem('kutup-tur','done');")
                    page.on('pageerror',lambda e:errors.append(str(e)));pages.append(page)
                a,b,c,_=pages
                tomorrow=(datetime.now(timezone(timedelta(hours=3)))+timedelta(days=1)).strftime('%Y-%m-%d')
                a.goto(base);a.get_by_role('button',name='Buluşma planla',exact=True).click()
                form=a.get_by_role('dialog',name='Kütüp’te buluşalım',exact=True)
                form.get_by_label('Gün',exact=True).fill(tomorrow)
                form.get_by_label('Başlangıç saati',exact=True).fill('14:00')
                form.get_by_label('Buluşmanın adı',exact=False).fill('Dersten sonra aynı masa')
                form.get_by_label('Bitiş saati belli',exact=True).check()
                form.get_by_label('Bitiş saati',exact=True).fill('19:00')
                form.get_by_role('button',name='Buluşmayı oluştur',exact=True).click()
                am=a.get_by_role('dialog');expect(am.get_by_role('heading',name='Kim, kaçta geliyor?',exact=True)).to_be_visible()
                state=call(contexts[0],'/state');meeting=state['plans'][0];mid=meeting['id']
                check(len(state['plans'])==1 and meeting['attendees']==[host['memberId']],'Creating one meeting records its organizer once')
                b.goto(base+'/?plan='+mid);bm=b.get_by_role('dialog',name='Kütüp buluşması',exact=True)
                expect(bm.get_by_role('heading',name='Kim, kaçta geliyor?',exact=True)).to_be_visible()
                bm.get_by_label('Geliş saatin',exact=True).fill('16:00')
                bm.get_by_placeholder('Örn. Dersten çıkınca geleceğim').fill('Dersim bitince geleceğim')
                bm.get_by_label('Gelişimden 30 dakika önce bir kez hatırlat',exact=True).check()
                bm.get_by_role('button',name='Varım · 16:00',exact=False).click()
                expect(bm.get_by_text('Kaydedilen gelişin: 16:00',exact=True)).to_be_visible()
                detail=call(contexts[1],'/plans/'+mid);own=next(r for r in detail['responses'] if r['memberId']==people[1]['memberId'])
                check(own['arrival']-detail['starts']==2*3600000 and own['remind'] and len(call(contexts[1],'/state')['plans'])==1,'16:00 arrival joins the 14:00 meeting without creating a copy')
                check(call(contexts[1],'/state')['members'][1]['status']=='away','Planning an arrival never checks the person into the library')
                bm.get_by_role('button',name='Varım · 16:00',exact=False).click()
                check(len(call(contexts[1],'/plans/'+mid)['attendees'])==2,'Repeated confirmation cannot withdraw or duplicate attendance')
                bm.locator('.meetup-roster').scroll_into_view_if_needed();b.screenshot(path=str(artifacts/'kisisel-gelis-telefon.png'))
                c.goto(base);c.get_by_role('button',name='Buluşma planla',exact=True).click();cm=c.get_by_role('dialog',name='Kütüp’te buluşalım',exact=True)
                cm.get_by_label('Gün',exact=True).fill(tomorrow)
                expect(cm.get_by_text('O gün zaten buluşuyoruz.',exact=True)).to_be_visible()
                cm.get_by_label('Sen kaçta geleceksin?',exact=True).fill('16:00')
                cm.screenshot(path=str(artifacts/'ayni-bulusmaya-katil.png'))
                cm.get_by_role('button',name='16:00’da katıl',exact=True).click()
                expect(c.get_by_role('heading',name='Kim, kaçta geliyor?',exact=True)).to_be_visible()
                check(len(call(contexts[2],'/state')['plans'])==1 and len(call(contexts[2],'/plans/'+mid)['attendees'])==3,'The creation form offers joining the existing meeting at a personal time')
                cm=c.get_by_role('dialog');cm.get_by_role('button',name='Kararsızım',exact=True).click();cm.get_by_role('button',name='Kararsızım olarak kaydet',exact=True).click()
                expect(cm.get_by_text('Kaydedilen cevabın: Kararsızım',exact=True)).to_be_visible()
                check(len(call(contexts[2],'/plans/'+mid)['maybes'])==1,'Undecided is distinct from decline and no response')
                bm.get_by_role('button',name='Takvime ekle',exact=True).click(trial=True)
                with b.expect_download() as d:bm.get_by_role('button',name='Takvime ekle',exact=True).click()
                d.value.save_as(artifacts/'kisisel-bulusma.ics')
                ics=(artifacts/'kisisel-bulusma.ics').read_text()
                check('T130000Z' in ics and 'T110000Z' not in ics,'Calendar export uses the participant’s 16:00 arrival in Türkiye time')
                for width,height in [(360,780),(375,812),(390,844),(844,390)]:
                    b.set_viewport_size({'width':width,'height':height});b.wait_for_timeout(100)
                    check(not bm.evaluate('(e)=>e.scrollWidth>e.clientWidth+1'),f'Meeting card has no horizontal overflow at {width}x{height}')
                    check(bm.locator('.meetup-choices button').evaluate_all('(els)=>els.every(e=>e.getBoundingClientRect().height>=44)'),f'Answer choices retain 44px targets at {width}x{height}')
                b.set_viewport_size({'width':390,'height':844})
                am.get_by_role('button',name='Buluşmayı düzenle',exact=True).click();edit=a.get_by_role('dialog',name='Buluşmayı düzenle',exact=True)
                edit.get_by_label('Buluşmanın adı',exact=False).fill('Aynı masa, yeni not')
                edit.get_by_role('button',name='Değişiklikleri kaydet',exact=True).click()
                expect(am.get_by_role('heading',name='Aynı masa, yeni not',exact=True)).to_be_visible()
                check(next(r for r in call(contexts[1],'/plans/'+mid)['responses'] if r['memberId']==people[1]['memberId'])['answer']=='yes','A note edit retains attendance and the same shared link')
                am.get_by_role('button',name='Buluşmayı düzenle',exact=True).click();edit=a.get_by_role('dialog',name='Buluşmayı düzenle',exact=True)
                edit.get_by_label('Başlangıç saati',exact=True).fill('15:00');edit.get_by_role('button',name='Değişiklikleri kaydet',exact=True).click()
                expect(bm.get_by_text('Buluşmanın saati değişti. Önceki cevabını yeniden onayla.',exact=True)).to_be_visible()
                check(len(call(contexts[1],'/plans/'+mid)['attendees'])==1,'Changing the common time requires participants to reconfirm')
                bm.screenshot(path=str(artifacts/'saat-degisti-onay.png'))
                bm.get_by_role('button',name='Varım · 16:00',exact=False).click();expect(bm.get_by_text('Kaydedilen gelişin: 16:00',exact=True)).to_be_visible()
                check(len(call(contexts[1],'/plans/'+mid)['attendees'])==2,'A participant can keep their personal time after reconfirming')
                a.on('dialog',lambda d:d.accept());am.get_by_role('button',name='Buluşmayı iptal et',exact=True).click()
                expect(a.get_by_role('dialog',name='Buluşma iptal edildi',exact=True)).to_be_visible()
                expect(b.get_by_role('dialog',name='Buluşma iptal edildi',exact=True)).to_be_visible()
                b.goto(base+'/?plan='+mid);expect(b.get_by_role('dialog',name='Buluşma iptal edildi',exact=True)).to_be_visible()
                check(b.locator('.meetup-answer').count()==0,'Cancelled links keep their explanation and cannot receive new attendance')
                b.get_by_role('dialog').screenshot(path=str(artifacts/'iptal-baglantisi.png'))
                # Seed valid legacy-style meetings only in this temporary test DB:
                # four people with <=9 future meetings each. No real data is used.
                connection=sqlite3.connect(Path(directory)/'kutup.sqlite')
                start=meeting['starts']
                for i in range(35):
                    owner=people[i%4]['memberId'];sid=f'browser-page-{i}'
                    connection.execute('INSERT INTO plans(id,group_id,member_id,starts,note) VALUES(?,?,?,?,?)',(sid,host['group']['id'],owner,start+i*60000,'Sayfa testi '+str(i)))
                    connection.execute('INSERT INTO attendees(plan_id,member_id,arrival) VALUES(?,?,?)',(sid,owner,start+i*60000))
                connection.execute('UPDATE groups SET rev=rev+1 WHERE id=?',(host['group']['id'],));connection.commit();connection.close()
                b.goto(base+'/?plan=browser-page-34');bm=b.get_by_role('dialog',name='Kütüp buluşması',exact=True)
                expect(bm.get_by_role('heading',name='Sayfa testi 34',exact=True)).to_be_visible()
                check(True,'A shared link outside the first 30 meetings opens its exact card')
                bm.get_by_role('button',name='Kapat',exact=True).click()
                b.get_by_role('button',name='Tüm buluşmalar (35)',exact=True).click();expect(b.locator('.home-plan')).to_have_count(30)
                b.get_by_role('button',name='Daha fazla buluşma göster',exact=True).click();expect(b.locator('.home-plan')).to_have_count(35)
                check(True,'The meeting list loads additional pages without duplicate cards')
                check(not errors,'No uncaught browser errors through creation, answers, edits, cancellation and pagination')
                (artifacts/'results.json').write_text(json.dumps({'passed':checks,'browser':browser.version},ensure_ascii=False,indent=2))
                print(json.dumps({'passed':len(checks),'artifacts':str(artifacts)},ensure_ascii=False));browser.close()
        finally:
            if 'errors' in locals() and errors:print(json.dumps({'browser_errors':errors},ensure_ascii=False))
            server.terminate()
            try:server.wait(timeout=10)
            except subprocess.TimeoutExpired:server.kill();server.wait()
