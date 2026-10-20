import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createApp} from '../server/app.js';
import {sqliteAdapter} from '../server/sqlite.js';
import {migrations,migrate} from '../server/schema.js';
import {restoreBackup} from '../server/restore.js';
import {planStamp,planDay,planWhen,PLAN_DAY} from '../shared/plans.js';
import {planText,planCalendar} from '../src/planShare.js';
async function fixture(t){
  const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');t.after(()=>sql.close());
  const app=createApp({db:sqliteAdapter(sql),config:{testHooks:true,adminKey:'plans-test-owner-key'}});
  const call=async(path,body,cookie,method)=>{
    const r=await app.fetch(new Request('https://kutup.test/api'+path,{method:method||(body===undefined?'GET':'POST'),headers:{'X-Kutup':'1','Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}));
    return{status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
  };
  const first=await call('/groups',{name:'Batur',username:'plans_batur',password:'plans-test-pass'});assert.equal(first.status,201);
  const people=[first];
  for(const [i,name]of ['Deniz','Ece','Ada'].entries())people.push(await call('/join',{name,username:'plans_person_'+i,password:'plans-test-pass',invite:first.data.group.invite}));
  const other=await call('/groups',{name:'Baska grup',username:'plans_other',password:'plans-test-pass'});
  const as=(i,path,body,method)=>call(path,body,people[i].cookie,method);
  const start=planDay(Date.now())+PLAN_DAY+14*3600000;
  return{sql,app,call,as,people,other,start};
}

test('meeting: different personal arrival joins one meeting, including simultaneous creators and request retries',async t=>{
  const f=await fixture(t),key='same-browser-request';
  const first=await f.as(0,'/plans',{starts:f.start,note:'Ortak masa',requestKey:key});assert.equal(first.status,201);
  const again=await f.as(0,'/plans',{starts:f.start,note:'Ortak masa',requestKey:key});assert.equal(again.data.id,first.data.id);
  const later=await f.as(1,'/plans',{starts:f.start+2*3600000});assert.equal(later.status,200);assert.equal(later.data.id,first.data.id);
  const p=(await f.as(1,'/plans/'+first.data.id)).data;
  assert.equal(p.starts,f.start);assert.equal(p.responses.find(r=>r.memberId===f.people[1].data.memberId).arrival,f.start+2*3600000);
  assert.equal(p.attendees.length,2);assert.equal(f.sql.prepare('SELECT count(*) AS n FROM plans').get().n,1);
  const day2=f.start+PLAN_DAY;
  const concurrent=await Promise.all([2,3].map((i)=>f.as(i,'/plans',{starts:day2+(i-2)*3600000})));
  assert.ok(concurrent.every(r=>r.status<300));assert.equal(concurrent[0].data.id,concurrent[1].data.id);
  assert.equal(f.sql.prepare('SELECT count(*) AS n FROM plans').get().n,2);
});

test('meeting: explicit answers are idempotent, maybe/clear are distinct and invalid data cannot become a decline',async t=>{
  const f=await fixture(t),id=(await f.as(0,'/plans',{starts:f.start,ends:f.start+4*3600000})).data.id;
  assert.equal((await f.as(1,`/plans/${id}/answer`,{})).status,400);
  for(const value of [null,'yes',1])assert.equal((await f.as(1,`/plans/${id}/answer`,{going:value})).status,400);
  for(let i=0;i<2;i++)assert.equal((await f.as(1,`/plans/${id}/answer`,{answer:'yes',schedule:1,arrival:f.start+2*3600000,remind:true})).status,200);
  assert.equal((await f.as(1,`/plans/${id}`)).data.attendees.length,2);
  assert.equal((await f.as(1,`/plans/${id}/answer`,{answer:'yes',schedule:1,arrival:f.start+5*3600000})).status,400);
  await f.as(1,`/plans/${id}/answer`,{answer:'maybe',schedule:1,note:'Dersin bitişi belirsiz'});
  let p=(await f.as(1,`/plans/${id}`)).data;assert.equal(p.maybes.length,1);assert.equal(p.attendees.length,1);
  await f.as(1,`/plans/${id}/answer`,{answer:'clear',schedule:1});
  p=(await f.as(1,`/plans/${id}`)).data;assert.equal(p.responses.length,1);
  assert.equal((await f.call(`/plans/${id}/answer`,{answer:'yes'},f.other.cookie)).status,404);
});

test('meeting: stable links bypass list pages; cancellation is visible and cannot be answered or edited by others',async t=>{
  const f=await fixture(t);
  for(let i=0;i<35;i++){
    const owner=f.people[i%4].data.memberId;
    f.sql.prepare('INSERT INTO plans(id,group_id,member_id,starts,note) VALUES(?,?,?,?,?)').run('page-'+i,f.people[0].data.group.id,owner,f.start+i*60000,'Plan '+i);
  }
  const state=(await f.as(0,'/state')).data;assert.equal(state.plans.length,30);assert.equal(state.plansTotal,35);
  assert.equal((await f.as(0,'/plans/page-34')).data.note,'Plan 34');
  assert.equal((await f.as(0,'/plans?offset=30')).data.plans.length,5);
  assert.equal((await f.call('/plans/page-34',undefined,f.other.cookie)).status,404);
  const id=(await f.as(0,'/plans',{starts:f.start+PLAN_DAY,ends:f.start+PLAN_DAY+5*3600000})).data.id;
  assert.equal((await f.as(1,`/plans/${id}`,{rev:1},'DELETE')).status,404);
  assert.equal((await f.as(0,`/plans/${id}`,{rev:1},'DELETE')).status,200);
  assert.equal((await f.as(0,`/plans/${id}`,{rev:1},'DELETE')).status,200);
  assert.ok((await f.as(1,`/plans/${id}`)).data.cancelled>0);
  assert.equal((await f.as(1,`/plans/${id}/answer`,{answer:'yes',schedule:1})).status,409);
});

test('meeting: retiming requires reconfirmation and rejects stale devices; note changes retain attendance',async t=>{
  const f=await fixture(t),id=(await f.as(0,'/plans',{starts:f.start})).data.id;
  await f.as(1,`/plans/${id}/answer`,{answer:'yes',arrival:f.start+2*3600000,schedule:1,remind:true});
  let r=await f.as(0,`/plans/${id}`,{rev:1,note:'Sessiz çalışma'},'PATCH');assert.equal(r.status,200);
  let p=(await f.as(1,`/plans/${id}`)).data;assert.equal(p.schedule,1);assert.equal(p.attendees.length,2);
  assert.equal((await f.as(0,`/plans/${id}`,{rev:1,starts:f.start+3600000},'PATCH')).status,409);
  await f.as(0,`/plans/${id}/answer`,{answer:'no',schedule:1});
  r=await f.as(0,`/plans/${id}`,{rev:2,starts:f.start+3600000},'PATCH');assert.equal(r.status,200);
  p=(await f.as(1,`/plans/${id}`)).data;assert.equal(p.schedule,2);assert.equal(p.attendees.length,0);
  assert.equal(p.responses.find(x=>x.memberId===f.people[1].data.memberId).answer,'pending');
  assert.equal(p.responses.find(x=>x.memberId===f.people[0].data.memberId).answer,'no','organizer can remain absent without cancelling the meeting');
  assert.equal((await f.as(1,`/plans/${id}/answer`,{answer:'yes',schedule:1})).status,409);
  assert.equal((await f.as(1,`/plans/${id}/answer`,{answer:'yes',schedule:2,arrival:f.start+2*3600000})).status,200);
});

test('meeting: late arrival remains visible after the old two-hour cutoff',async t=>{
  const f=await fixture(t);
  // Use a fixed same-day midday clock so the fixture also covers UTC midnight.
  const at=planDay(Date.now())+16*3600000,realNow=Date.now;Date.now=()=>at;
  try{
    f.sql.prepare('INSERT INTO plans(id,group_id,member_id,starts,note) VALUES(?,?,?,?,?)').run('late',f.people[0].data.group.id,f.people[0].data.memberId,at-2*3600000,'14:00 buluşması');
    const p=(await f.as(1,'/plans/late/answer',{answer:'yes',schedule:1,arrival:at}));assert.equal(p.status,200);
    assert.ok((await f.as(1,'/state')).data.plans.some(x=>x.id==='late'));
  }finally{Date.now=realNow;}
});

test('meeting: legacy yes/no rows migrate and older backups restore without losing replies',async()=>{
  const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');
  const db=sqliteAdapter(sql);for(const m of migrations.slice(0,29))await db.batch(m.map(s=>[s,[]]));
  sql.exec("INSERT INTO settings(key,value) VALUES('schema','29'); INSERT INTO groups(id,name,invite) VALUES('g','Eski ekip','legacy-invite'); INSERT INTO members(id,group_id,token,name,avatar,color,joined,updated) VALUES('a','g','old-a','A','🪐','mint',1,1),('b','g','old-b','B','🪐','mint',1,1); INSERT INTO plans VALUES('p','g','a',2000000000000,'Eski plan'); INSERT INTO attendees VALUES('p','a'); INSERT INTO plan_skips VALUES('p','b');");
  const tables={};for(const name of ['groups','members','plans','attendees','plan_skips'])tables[name]=sql.prepare('SELECT * FROM '+name).all();
  await migrate(db);assert.deepEqual(sql.prepare('SELECT answer FROM attendees ORDER BY member_id').all().map(r=>r.answer),['yes','no']);
  const copy=new DatabaseSync(':memory:');try{await restoreBackup({app:'kutup',schema:29,tables},copy);assert.equal(copy.prepare("SELECT answer FROM attendees WHERE member_id='b'").get().answer,'no');assert.equal(copy.prepare('SELECT arrival FROM attendees LIMIT 1').get().arrival,2000000000000);}finally{copy.close();sql.close();}
});

test('meeting: strict calendar parsing, absolute sharing and personal calendar export',()=>{
  assert.ok(Number.isNaN(planStamp('2026-02-30','14:00')));assert.ok(Number.isNaN(planStamp('2026-10-20','25:00')));
  assert.equal(planStamp('2026-10-20','14:00'),Date.UTC(2026,9,20,11));
  globalThis.location={origin:'https://kutup.test'};
  const plan={id:'safe',starts:planStamp('2026-10-21','14:00'),ends:planStamp('2026-10-21','19:00'),note:'Ders, çalışma; kitap\nEND:VEVENT'};
  const text=planText(plan,{name:'Batur'});assert.match(text,/21 Ekim 2026/);assert.doesNotMatch(text,/Yarın/);
  const calendar=planCalendar(plan,{name:'Batur'},planStamp('2026-10-21','16:00'));
  assert.match(calendar,/DTSTART:20261021T130000Z/);assert.match(calendar,/DTEND:20261021T160000Z/);
  assert.equal(calendar.split('\r\n').filter(l=>l==='END:VEVENT').length,1,'notes cannot inject calendar events');
  assert.ok(calendar.split('\r\n').every(l=>new TextEncoder().encode(l).length<=75));
  delete globalThis.location;
});
