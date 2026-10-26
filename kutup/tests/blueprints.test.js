import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createApp} from '../server/app.js';
import {sqliteAdapter} from '../server/sqlite.js';
import {migrate,migrations} from '../server/schema.js';
import {restoreBackup} from '../server/restore.js';
import {advanceDiscovery,discoveryStatus,DISCOVERY_GUARANTEE,WEEKLY_LEGACY} from '../shared/blueprints.js';
import {BY_ID,blueprintPool,stateOf} from '../shared/catalog.js';
const pool=Array.from({length:100},(_,i)=>({id:String(i)}));
const seed={carry:0,dry:0,draws:0};

test('discovery: splitting identical credited work preserves every draw, reward and leftover minute',()=>{
  const roll=i=>[i%7===5?.01:.9,(i*.17)%1];
  for(const chunks of [[75],[25,25,25],[5,20,33,17],[600],[25,50,75,150,300]]){
    const whole=advanceDiscovery(seed,chunks.reduce((a,b)=>a+b,0),pool,roll);
    let current=seed,left=pool,awards=[];
    for(const minutes of chunks){const next=advanceDiscovery(current,minutes,left,roll);current=next.state;awards.push(...next.awards);left=left.filter(p=>!next.awards.some(a=>a.item.id===p.id));}
    assert.deepEqual(current,whole.state);assert.deepEqual(awards,whole.awards);
  }
  const short=advanceDiscovery(seed,24,pool,roll);assert.equal(short.state.draws,0);assert.equal(short.state.carry,24);
  assert.equal(advanceDiscovery(short.state,1,pool,roll).state.draws,1);
});

test('discovery: 500 minutes forces a missing plan, carries post-award work, never repeats or banks a completed pool',()=>{
  const noLuck=()=>[1,.3];
  let result=advanceDiscovery(seed,499,pool,noLuck);
  assert.equal(result.awards.length,0);assert.equal(discoveryStatus(result.state,pool,[]).remaining,1);
  result=advanceDiscovery(result.state,51,pool,noLuck);
  assert.equal(result.awards.length,1);assert.equal(result.awards[0].source,'guarantee');assert.equal(result.state.dry,50);
  assert.equal(result.state.carry,0);
  result=advanceDiscovery(seed,75,pool.slice(0,2),()=>[0,0]);
  assert.deepEqual(result.awards.map(a=>a.item.id),['0','1']);assert.equal(result.state.carry,0);
  assert.deepEqual(advanceDiscovery(result.state,500,[],noLuck).state,result.state);
  assert.equal(discoveryStatus(result.state,pool.slice(0,2),['0','1']).left,0);
});

async function fixture(t){
  const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');t.after(()=>sql.close());
  const app=createApp({db:sqliteAdapter(sql),config:{testHooks:true,adminKey:'blueprints-test-owner'}});
  const call=async(path,body,cookie,owner=false)=>{const r=await app.fetch(new Request('https://kutup.test/api'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json','X-Kutup':'1',...(cookie?{Cookie:cookie}:{}),...(owner?{'X-Owner-Key':'blueprints-test-owner'}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}));return{status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
  const person=await call('/groups',{name:'Keşif',username:'plan_kesif',password:'blueprints-pass'});assert.equal(person.status,201);
  const id=person.data.memberId,as=(path,body)=>call(path,body,person.cookie);
  const finish=async(minutes=25,options={})=>{
    const start=await as('/focus',{action:'start',minutes,...options});assert.equal(start.status,200,JSON.stringify(start.data));
    sql.prepare('UPDATE members SET focus_end=?,focus_beat=? WHERE id=?').run(Date.now()-1000,Date.now(),id);
    const result=await as('/focus',{action:'finish'});assert.equal(result.status,200);return result;
  };
  return{sql,app,id,as,call,finish,person};
}

test('discovery API: only completed credited sessions advance, durable guarantee settles exactly once across concurrent readers',async t=>{
  const {sql,id,as,call,finish}=await fixture(t);
  const initialDiscovery=(await as('/wallet')).data.discovery;
  assert.equal(initialDiscovery.remaining,500);
  await as('/focus',{action:'start',minutes:25});await as('/focus',{action:'cancel'});
  assert.equal(sql.prepare('SELECT count(*) n FROM blueprint_progress').get().n,0);
  await finish(25);let state=sql.prepare('SELECT * FROM blueprint_progress WHERE member_id=?').get(id);
  assert.equal(state.dry,25);assert.equal(state.draws,1);
  assert.equal((await as('/wallet')).data.discovery.remaining,475);
  assert.ok(!(JSON.stringify((await as('/wallet')).data).includes(state.seed)),'private draw seed never leaks');
  // A gift must neither reset nor consume the earned guarantee.
  assert.equal((await call(`/owner/members/${id}/unlock`,{model:"sera"},null,true)).status,201);
  assert.deepEqual(sql.prepare('SELECT * FROM blueprint_progress WHERE member_id=?').get(id),state);
  sql.prepare('UPDATE blueprint_progress SET dry=475 WHERE member_id=?').run(id);
  const start=await as('/focus',{action:'start',minutes:25});assert.equal(start.status,200);
  const end=Date.now()-1000;sql.prepare('UPDATE members SET focus_end=?,focus_beat=? WHERE id=?').run(end,Date.now(),id);
  await Promise.all([as('/state'),as('/focus',{action:'finish'}),as('/state')]);
  assert.equal(sql.prepare("SELECT count(*) n FROM unlocks WHERE member_id=? AND source='guarantee'").get(id).n,1);
  assert.equal(sql.prepare('SELECT count(*) n FROM focus_log WHERE member_id=? AND created=?').get(id,end).n,1);
  state=sql.prepare('SELECT * FROM blueprint_progress WHERE member_id=?').get(id);
  assert.equal(state.dry,0);assert.equal(state.carry,0);
  await as('/focus',{action:'finish'});assert.deepEqual(sql.prepare('SELECT * FROM blueprint_progress WHERE member_id=?').get(id),state);
  // Expired weekly plans also enter discovery; the live pool grows with the calendar.
  assert.equal((await as('/wallet')).data.discovery.left,initialDiscovery.left-2);
});

test('discovery API: first session on a 7-day streak grants a bonus without resetting effort; failure gives no progress',async t=>{
  const {sql,id,as,finish}=await fixture(t);
  const day=Math.floor((Date.now()+10800000)/86400000)*86400000-10800000;
  for(let i=1;i<=6;i++)sql.prepare('INSERT INTO focus_log(id,member_id,minutes,created,strict) VALUES(?,?,?,?,0)').run('old'+i,id,25,day-i*86400000+3600000);
  sql.prepare('INSERT INTO blueprint_progress(member_id,dry,seed) VALUES(?,100,?)').run(id,'fixed-private-seed');
  await finish(25);
  assert.equal(sql.prepare("SELECT count(*) n FROM unlocks WHERE source='streak'").get().n,1);
  assert.equal(sql.prepare('SELECT dry FROM blueprint_progress WHERE member_id=?').get(id).dry,125);
  await as('/focus',{action:'start',minutes:25,strict:true,model:'kulube',device:'phone'});
  sql.prepare('UPDATE members SET focus_end=?,focus_beat=0,focus_cracked_at=? WHERE id=?').run(Date.now()-1000000,Date.now()-2000000,id);
  await as('/focus',{action:'finish'});
  assert.equal(sql.prepare('SELECT dry FROM blueprint_progress WHERE member_id=?').get(id).dry,125);
});

test('weekly rights: migration and old-backup restore retain completed builds, exclude gifts and late builds',async t=>{
  const sql=new DatabaseSync(':memory:');t.after(()=>sql.close());const db=sqliteAdapter(sql);
  for(const [i,steps] of migrations.slice(0,30).entries())await db.batch([...steps.map(s=>[s,[]]),["INSERT INTO settings(key,value) VALUES('schema',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",[String(i+1)]]]);
  sql.exec("INSERT INTO groups(id,name,invite) VALUES('g','G','invite-rights-12345678'); INSERT INTO members(id,group_id,token,name,avatar,color,joined,updated) VALUES('m','g','t','Ada','🪐','mint',1,1),('gift','g','t2','Ece','🪐','mint',1,1),('late','g','t3','Deniz','🪐','mint',1,1)");
  const [model,since]=WEEKLY_LEGACY[0];
  for(const [id,at,gift] of [['m',since+1000000,null],['gift',since+1000000,'Batur'],['late',since+15*86400000,null]])sql.prepare('INSERT INTO buildings(id,member_id,group_id,kind,model,minutes,seed,created,touched,gift) VALUES(?,?,\'g\',\'cottage\',?,25,1,?,?,?)').run('b'+id,id,model,at,at,gift);
  const {BACKUP_TABLES}=await import('../shared/backup.js');const backup={app:'kutup',schema:30,tables:{}};
  for(const table of BACKUP_TABLES)if(!['blueprint_progress','imece_projects','imece_slots','imece_work'].includes(table)&&!/^(focus_runs|request_receipts|village_)/.test(table))backup.tables[table]=sql.prepare(`SELECT * FROM ${table}`).all();
  await migrate(db);
  assert.deepEqual(sql.prepare('SELECT member_id,model,source FROM unlocks').all().map(r=>({...r})),[{member_id:'m',model:'postane',source:'weekly'}]);
  const restored=new DatabaseSync(':memory:');t.after(()=>restored.close());
  assert.equal((await restoreBackup(backup,restored)).counts.unlocks,1);
  assert.equal(stateOf(BY_ID.postane,since+20*86400000,['postane']),'open');
  const v31={app:'kutup',schema:31,tables:{}};
  sql.prepare('INSERT INTO blueprint_progress(member_id,carry,dry,draws,seed) VALUES(?,17,425,19,?)').run('m','restore-private-seed');
  for(const table of BACKUP_TABLES)v31.tables[table]=sql.prepare(`SELECT * FROM ${table}`).all();
  const copy=new DatabaseSync(':memory:');t.after(()=>copy.close());await restoreBackup(v31,copy);
  assert.deepEqual(copy.prepare('SELECT * FROM blueprint_progress').all(),sql.prepare('SELECT * FROM blueprint_progress').all());
});

test('weekly rights: completing the weekly building writes a permanent plan without spending discovery progress',async t=>{
  const old=Date.now;Date.now=()=>WEEKLY_LEGACY[0][1]+8*86400000+12*3600000;t.after(()=>{Date.now=old;});
  const {sql,id,as,finish}=await fixture(t);sql.prepare('UPDATE members SET bricks=500 WHERE id=?').run(id);
  await finish(25,{strict:true,relaxed:true,model:'postane'});
  const wallet=(await as('/wallet')).data;assert.ok(wallet.unlocks.includes('postane'));assert.equal(wallet.discovery.worked,25);
  assert.ok(wallet.log.some(r=>r.reason==='blueprint'&&r.note.includes('kalıcı senin')));
  assert.equal(sql.prepare('SELECT source FROM unlocks WHERE model=\'postane\'').get().source,'weekly');
  Date.now=()=>WEEKLY_LEGACY[0][1]+20*86400000;
  assert.equal((await as('/focus',{action:'start',minutes:25,strict:true,relaxed:true,model:'postane'})).status,200);
});


test('plan reveal: account-scoped durable acknowledgements preserve later finds and all ownership',async t=>{
  const {sql,id,as,call}=await fixture(t),now=Date.now();
  sql.prepare('INSERT INTO unlocks(member_id,model,source,created) VALUES(?,?,?,?)').run(id,'fener','random',now-2*86400000);
  assert.deepEqual((await as('/blueprints/rewards')).data.items,[],"old collection is not replayed on first use");
  const add=sql.prepare('INSERT INTO unlocks(member_id,model,source,created) VALUES(?,?,?,?)');
  add.run(id,'mardinevi','random',now);
  assert.deepEqual((await as('/blueprints/rewards')).data.items.map(p=>p.model),['mardinevi']);
  assert.equal((await call('/blueprints/rewards')).status,401);
  assert.equal((await as('/blueprints/rewards/seen',{memberId:'other',models:['mardinevi']})).status,409);
  assert.equal((await as('/blueprints/rewards/seen',{memberId:id,models:['atakule']})).status,403);
  add.run(id,'atakule','guarantee',now+1);
  await Promise.all([as('/blueprints/rewards/seen',{memberId:id,models:['mardinevi']}),as('/blueprints/rewards/seen',{memberId:id,models:['mardinevi']})]);
  assert.deepEqual((await as('/blueprints/rewards')).data.items.map(p=>p.model),['atakule'],"a new find cannot be swallowed by an old reveal");
  assert.equal((await as('/wallet')).data.unlocks.length,3,"acknowledgement consumes no plan");
  assert.equal(sql.prepare('SELECT count(*) n FROM blueprint_progress WHERE member_id=?').get(id).n,0);
});
