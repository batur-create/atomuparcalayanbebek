import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createApp } from "../server/app.js";
import { sqliteAdapter } from "../server/sqlite.js";
import { restoreBackup } from "../server/restore.js";
import { IMECE_TASKS, IMECE_PHASES, imeceCapacity, imeceProgress } from "../shared/imece.js";
import { drawImece } from "../src/imeceArt.js";
import { useSVG } from "../src/iso.js";
import { imeceJobAt, imeceLiftAt, imeceReplay, imeceReplayAt, imeceTourAt, IMECE_TOUR_MS } from "../src/imeceMotion.js";
import { drawImeceLive } from "../src/imeceLive.js";

const key = "imece-test-owner-key";

test("imece film: replay covers every crossed job, stays within credited work and lands exactly",()=>{
  for(const [from,to] of [[0,25],[49,126],[400,1600],[0,2000],[1975,2000],[500,500]]){
    const plan=imeceReplay(from,to);
    assert.ok(plan.duration<=22000);
    let previous=from;
    for(let ms=0;ms<=plan.duration;ms+=137){
      const state=imeceReplayAt(plan,ms);
      assert.ok(state.minutes>=previous&&state.minutes<=to);
      previous=state.minutes;
    }
    assert.equal(imeceReplayAt(plan,plan.duration).minutes,to);
    assert.equal(imeceReplayAt(plan,plan.duration).done,true);
    if(from!==to){
      assert.equal(plan.segments[0].from,from);
      assert.equal(plan.segments.at(-1).to,to);
      for(let i=1;i<plan.segments.length;i++)assert.equal(plan.segments[i-1].to,plan.segments[i].from);
    }
  }
  assert.equal(imeceReplay(0,2000).segments.length,IMECE_TASKS.length);
  assert.deepEqual([0,3000,6000,9000,12000,IMECE_TOUR_MS].map(t=>imeceTourAt(t).zone),["road","court","hall","flag","all","all"]);
});

test("imece film: the crane rigs at stock, lifts clear, sets down and returns empty at every structural job",()=>{
  let minutes=0;
  for(const task of IMECE_TASKS){
    const job=imeceJobAt(minutes+.01);minutes+=task.minutes;
    if(job.kind!=="lift")continue;
    const pickup=imeceLiftAt(2.2,job.site),raised=imeceLiftAt(3.8,job.site),setdown=imeceLiftAt(7.6,job.site),empty=imeceLiftAt(8.5,job.site);
    assert.ok(pickup.loaded&&raised.loaded&&setdown.loaded&&!empty.loaded);
    assert.ok(raised.hook[2]>pickup.hook[2]);
    assert.ok(Math.abs(setdown.hook[2]-(job.site[2]+.18))<.0001);
    assert.deepEqual(setdown.hook.slice(0,2),job.site.slice(0,2));
    for(let t=0;t<20;t+=.05){
      const pose=imeceLiftAt(t,job.site);
      assert.ok(pose.hook.every(Number.isFinite));
      assert.ok(pose.hook[2]>=.19&&pose.hook[2]<=1.081,"load clears grade and the jib");
      assert.ok(pose.reach<1.50,"trolley stays on the jib");
    }
    assert.deepEqual(imeceLiftAt(0,job.site),imeceLiftAt(10,job.site),"the cycle closes without a jump");
  }
});

test("imece film: all 22 work crews paint finite, nonempty Canvas geometry, including motion extrema",()=>{
  const crew=Array.from({length:4},(_,slot)=>({slot}));
  let ops=0;
  const ctx=new Proxy({}, {get:()=> (...values)=>{
    assert.ok(values.every(v=>typeof v!=="number"||Number.isFinite(v)),"finite canvas arguments");ops++;
  }});
  const P=(x,y,z=0)=>{assert.ok([x,y,z].every(Number.isFinite));return[(x-y)*260,(x+y)*130-z*260];};
  let at=0;
  for(const task of IMECE_TASKS){
    const job=imeceJobAt(at+.1);at+=task.minutes;
    assert.ok(job.kind&&job.cue&&job.site.length===3);
    const before=ops;
    for(const t of [0,1.2,2.2,3.8,6.5,7.6,8.5,9.9])drawImeceLive(ctx,P,job,crew,t);
    assert.ok(ops>before+100,`${task.id} paints its tools and crew`);
  }
  const before=ops;
  drawImeceLive(ctx,P,imeceJobAt(400),[],0);
  assert.equal(ops,before,"an empty site invents no active workers");
});

async function fixture(t) {
  const sql = new DatabaseSync(":memory:"); sql.exec("PRAGMA foreign_keys=ON"); t.after(() => sql.close());
  const db = sqliteAdapter(sql), app = createApp({ db, config: { adminKey: key, testHooks: true } });
  const call = async (path, body, cookie, owner = false) => {
    const r = await app.fetch(new Request(`https://kutup.test/api${path}`, { method: body === undefined ? "GET" : "POST", headers: { "X-Kutup": "1", "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...(owner ? { "X-Owner-Key": key } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));
    return { status: r.status, data: await r.json(), cookie: r.headers.get("set-cookie")?.split(";")[0] };
  };
  const people = [];
  for (let i=0;i<4;i++) people.push(await call("/groups", { name: ["Batur","Ada","Deniz","Ece"][i], username:`imece_${i}`, password:"imece123" }));
  const ids = people.map((p) => p.data.memberId);
  const owner = (path, body) => call(path, body, null, true);
  const as = (i, path, body) => call(path, body, people[i].cookie);
  const launch = () => owner("/owner/imece", { members: ids });
  const finish = async (i) => {
    sql.prepare("UPDATE members SET focus_end=?, focus_beat=? WHERE id=?").run(Date.now()-1000,Date.now(),ids[i]);
    return as(i,"/focus",{action:"finish"});
  };
  return { sql, db, app, call, people, ids, owner, as, launch, finish };
}

test("imece: construction budgets, individual gates and shared capacity", () => {
  assert.deepEqual(IMECE_PHASES.map((_,i)=>IMECE_TASKS.filter(t=>t.phase===i).reduce((n,t)=>n+t.minutes,0)), [400,1200,400]);
  assert.ok(IMECE_TASKS.every(t=>t.minutes%25===0 && t.why && t.action));
  const p=imeceProgress([{slot:0,phase:0,minutes:400,personal:50}]);
  assert.equal(p.phases[0].complete,false,"one worker cannot sign for the other three");
  assert.equal(imeceCapacity(imeceProgress(),[],0).available,250);
  assert.equal(imeceCapacity(imeceProgress(),[{slot:0,phase:0,minutes:75,personal:50}],1).available,225);
});

test("imece: all construction boundaries render finite geometry, including concrete and finished detail",()=>{
  useSVG();
  let at=0;
  for(const task of IMECE_TASKS){
    for(const minutes of [at,at+task.minutes/2,at+task.minutes]){
      const svg=drawImece((x,y,z)=>{assert.ok([x,y,z].every(Number.isFinite),`${task.id}: invalid coordinate`);return [(x-y)*80,(x+y)*40-z*80];},minutes,{detail:2});
      assert.ok(svg.length>0);assert.doesNotMatch(svg,/NaN|Infinity|undefined/);
    }
    at+=task.minutes;
  }
});

test("imece: owner explicitly selects four people across villages; private state stays separate", async t => {
  const f=await fixture(t);
  assert.equal((await f.as(0,"/imece")).data,null);
  assert.equal((await f.call("/imece")).status,401);
  assert.equal((await f.as(0,"/owner/imece",{members:f.ids})).status,401);
  assert.equal((await f.owner("/owner/imece",{members:f.ids.slice(0,3)})).status,400);
  assert.equal((await f.owner("/owner/imece",{members:[...f.ids.slice(0,3),f.ids[0]]})).status,400);
  assert.equal((await f.launch()).status,201);
  assert.equal((await f.launch()).status,409);
  const p=(await f.as(2,"/imece")).data;
  assert.equal(p.slot,2); assert.equal(p.crew.length,4); assert.equal(p.goal,2000);
  assert.deepEqual(p.crew.map(x=>x.name),["Batur","Ada","Deniz","Ece"]);
  assert.ok(p.crew.every(x=>!('token' in x)&&!('note' in x)&&!('groupId' in x)));
  assert.equal((await f.as(2,"/state")).data.members.length,1);
});

test("imece: relaxed work survives restart and concurrent finish; no private building or duplicate reward", async t => {
  const f=await fixture(t); await f.launch();
  assert.equal((await f.as(0,"/focus",{action:"start",imece:true,strict:true,minutes:25})).status,400);
  assert.equal((await f.as(0,"/focus",{action:"start",imece:true,relaxed:true,minutes:25})).status,200);
  assert.equal((await f.as(0,"/focus",{action:"finish",credited:2000})).status,200);
  assert.equal((await f.as(0,"/imece")).data.minutes,0,"a client cannot fast-forward work");
  f.sql.prepare("UPDATE members SET focus_end=?,focus_beat=0 WHERE id=?").run(Date.now()-1000,f.ids[0]);
  const restarted=createApp({db:f.db,config:{adminKey:key}});
  await Promise.all(Array.from({length:4},()=>restarted.fetch(new Request("https://kutup.test/api/imece",{headers:{Cookie:f.people[0].cookie}}))));
  const p=(await f.as(1,"/imece")).data;
  assert.equal(p.minutes,25); assert.deepEqual(p.crew[0].personal,[25,0,0]);
  assert.equal(f.sql.prepare("SELECT count(*) AS n FROM imece_contributions").get().n,1);
  assert.equal(f.sql.prepare("SELECT count(*) AS n FROM focus_log").get().n,1);
  assert.equal(f.sql.prepare("SELECT count(*) AS n FROM buildings").get().n,0);
  assert.equal(f.sql.prepare("SELECT count(*) AS n FROM bricks_log WHERE reason='wage'").get().n,1);
  assert.equal((await f.as(0,"/build-deliveries")).data.length,0);
  assert.equal((await f.as(0,"/imece")).data.delivery.minutes,25);
  await f.as(1,"/imece/seen",{});
  assert.equal((await f.as(0,"/imece")).data.delivery.minutes,25,"another person cannot acknowledge my work");
  await f.as(0,"/imece/seen",{});
  assert.equal((await f.as(0,"/imece")).data.delivery,null);
  assert.equal((await f.as(0,"/imece")).data.minutes,25);
});

test("imece: only owner can correct an account; the slot's work and delivery survive without moving private rewards", async t => {
  const f=await fixture(t);await f.launch();
  const next=await f.call("/groups",{name:"Doğru Batur",username:"imece_correct",password:"imece123"});
  await f.as(0,"/focus",{action:"start",imece:true,relaxed:true,minutes:50});await f.finish(0);
  const before=(await f.owner("/owner/imece")).data;
  const rows=f.sql.prepare("SELECT * FROM imece_contributions").all();
  const old=f.sql.prepare("SELECT bricks FROM members WHERE id=?").get(f.ids[0]);
  const body={memberId:next.data.memberId,rev:before.rev};
  assert.equal((await f.as(0,"/owner/imece/crew/0",body)).status,401);
  assert.equal((await f.call("/owner/imece/crew/0",body)).status,401);
  const changed=await f.owner("/owner/imece/crew/0",body);
  assert.equal(changed.status,200,JSON.stringify(changed.data));
  assert.equal(changed.data.rev,before.rev+1);
  assert.equal(changed.data.minutes,50);
  assert.equal(changed.data.goal,2000);
  assert.equal(changed.data.crew.length,4);
  assert.deepEqual(changed.data.crew[0].personal,[50,0,0]);
  assert.equal(changed.data.crew[0].name,"Doğru Batur");
  assert.deepEqual(f.sql.prepare("SELECT * FROM imece_contributions").all(),rows);
  assert.deepEqual(f.sql.prepare("SELECT bricks FROM members WHERE id=?").get(f.ids[0]),old);
  assert.equal(f.sql.prepare("SELECT count(*) AS n FROM focus_log WHERE member_id=?").get(next.data.memberId).n,0);
  assert.equal((await f.as(0,"/imece")).data.slot,-1);
  assert.equal((await f.as(0,"/focus",{action:"start",imece:true,relaxed:true,minutes:25})).status,403);
  const mine=(await f.call("/imece",undefined,next.cookie)).data;
  assert.equal(mine.slot,0);
  assert.equal(mine.delivery.minutes,50,"the slot's unacknowledged delivery is preserved");
  assert.equal((await f.call("/focus",{action:"start",imece:true,relaxed:true,minutes:25},next.cookie)).status,200);
  f.sql.prepare("UPDATE members SET focus_end=? WHERE id=?").run(Date.now()-1000,next.data.memberId);
  assert.equal((await f.call("/focus",{action:"finish"},next.cookie)).status,200);
  assert.equal((await f.owner("/owner/imece")).data.minutes,75);
});

test("imece: account correction rejects invalid, duplicate, stale, finished and unsettled work; departed slots remain recoverable", async t => {
  const f=await fixture(t);await f.launch();
  const next=await f.call("/groups",{name:"Yeni hesap",username:"imece_next",password:"imece123"});
  const body={memberId:next.data.memberId,rev:(await f.owner("/owner/imece")).data.rev};
  assert.equal((await f.owner("/owner/imece/crew/4",body)).status,400);
  assert.equal((await f.owner("/owner/imece/crew/0",{...body,rev:body.rev-1})).status,409);
  assert.equal((await f.owner("/owner/imece/crew/0",{...body,memberId:f.ids[1]})).status,409);
  assert.equal((await f.owner("/owner/imece/crew/0",{...body,memberId:"missing"})).status,409);
  assert.equal((await f.owner("/owner/imece/crew/0",{...body,memberId:42})).status,400);
  await f.as(0,"/focus",{action:"start",imece:true,relaxed:true,minutes:25});
  body.rev=(await f.owner("/owner/imece")).data.rev;
  assert.equal((await f.owner("/owner/imece/crew/0",body)).status,409);
  f.sql.prepare("UPDATE members SET focus_end=? WHERE id=?").run(Date.now()-1000,f.ids[0]);
  assert.equal((await f.owner("/owner/imece/crew/0",body)).status,409,"an expired but unsettled session must retain its owner");
  await f.as(0,"/focus",{action:"finish"});
  f.sql.prepare("UPDATE imece_crew SET member_id=NULL WHERE slot=0").run();
  body.rev=(await f.owner("/owner/imece")).data.rev;
  const changed=await f.owner("/owner/imece/crew/0",body);
  assert.equal(changed.status,200);
  assert.equal(changed.data.crew[0].minutes,25);
  assert.equal(changed.data.crew[0].memberId,next.data.memberId);
  assert.equal((await f.owner("/owner/imece/crew/1",body)).status,409,"stale writes cannot overwrite the corrected roster");
  f.sql.prepare("UPDATE imece_project SET completed=1").run();
  assert.equal((await f.owner("/owner/imece/crew/1",{memberId:next.data.memberId,rev:changed.data.rev})).status,409);
});

test("imece: racing a mission start with account correction cannot orphan an active session", async t => {
  const f=await fixture(t);await f.launch();
  const next=await f.call("/groups",{name:"Yeni hesap",username:"imece_race",password:"imece123"});
  const rev=(await f.owner("/owner/imece")).data.rev;
  const [start,replace]=await Promise.all([
    f.as(0,"/focus",{action:"start",imece:true,relaxed:true,minutes:25}),
    f.owner("/owner/imece/crew/0",{memberId:next.data.memberId,rev}),
  ]);
  assert.ok(start.status===200||replace.status===200);
  assert.ok(start.status!==200||replace.status!==200);
  const orphan=f.sql.prepare("SELECT count(*) AS n FROM members m LEFT JOIN imece_crew c ON c.member_id=m.id WHERE m.focus_imece=1 AND m.focus_end>0 AND c.slot IS NULL").get();
  assert.equal(orphan.n,0);
});

test("imece: acknowledging the displayed delivery cannot swallow a later contribution",async t=>{
  const f=await fixture(t);await f.launch();
  await f.as(0,"/focus",{action:"start",imece:true,relaxed:true,minutes:25});await f.finish(0);
  const displayed=(await f.as(0,"/imece")).data.delivery;
  await f.as(0,"/focus",{action:"start",imece:true,relaxed:true,minutes:25});
  f.sql.prepare("UPDATE members SET focus_end=? WHERE id=?").run(Date.now()-1000,f.ids[0]);
  const cancelled=await f.as(0,"/focus",{action:"cancel"});
  assert.equal(cancelled.data.credited,25,"an already finished session is settled, even when stop races its deadline");
  await f.as(0,"/imece/seen",{through:displayed.through});
  assert.equal((await f.as(0,"/imece")).data.delivery.minutes,25);
  assert.equal((await f.as(0,"/imece")).data.minutes,50);
});

test("imece: a cancelled or interrupted watched session releases its job without damaging shared work", async t => {
  const f=await fixture(t); await f.launch();
  await f.as(0,"/focus",{action:"start",imece:true,relaxed:true,minutes:50}); await f.finish(0);
  await f.as(1,"/focus",{action:"start",imece:true,relaxed:true,minutes:75});
  await f.as(1,"/focus",{action:"cancel"});
  assert.equal((await f.as(1,"/imece")).data.minutes,50);
  assert.equal((await f.as(1,"/imece")).data.crew[1].working,null);
  await f.as(1,"/focus",{action:"start",imece:true,relaxed:false,minutes:25});
  f.sql.prepare("UPDATE members SET focus_end=?,focus_beat=0 WHERE id=?").run(Date.now()-1000,f.ids[1]);
  await f.as(1,"/state");
  assert.equal((await f.as(1,"/imece")).data.minutes,50);
  assert.equal(f.sql.prepare("SELECT ruin_until FROM members WHERE id=?").get(f.ids[1]).ruin_until,0);
});

test("imece: simultaneous reservations in different villages cannot consume another person's reserved work", async t => {
  const f=await fixture(t); await f.launch();
  const seed=f.sql.prepare("INSERT INTO imece_contributions(id,slot,phase,minutes,personal,session_end,created) VALUES (?,?,0,?,?,1,1)");
  for(let i=0;i<4;i++) seed.run(`personal-${i}`,i,50,50);
  seed.run("shared-a",0,75,0); seed.run("shared-b",1,75,0);
  const r=await Promise.all([0,1].map(i=>f.as(i,"/focus",{action:"start",imece:true,relaxed:true,minutes:50})));
  assert.deepEqual(r.map(x=>x.status).sort(),[200,409]);
  const working=r.findIndex(x=>x.status===200); await f.finish(working);
  const p=(await f.as(2,"/imece")).data;
  assert.equal(p.minutes,400); assert.equal(p.phase,1);
});

test("imece: all 2000 minutes, each person's three signatures and backup round-trip", async t => {
  const f=await fixture(t); await f.launch();
  for(let phase=0;phase<3;phase++) {
    for(let round=0;round<(phase===1?6:2);round++) for(let i=0;i<4;i++) {
      const r=await f.as(i,"/focus",{action:"start",imece:true,relaxed:true,minutes:50});
      assert.equal(r.status,200,JSON.stringify(r.data));
      assert.equal((await f.finish(i)).status,200);
    }
    assert.equal((await f.as(0,"/imece")).data.phases[phase].complete,true);
  }
  const p=(await f.as(3,"/imece")).data;
  assert.equal(p.minutes,2000); assert.equal(p.complete,true); assert.ok(p.completed>0);
  for(const person of p.crew) { assert.equal(person.minutes,500); assert.deepEqual(person.personal,[50,150,50]); }
  assert.equal((await f.as(0,"/focus",{action:"start",imece:true,relaxed:true,minutes:25})).status,409);
  const backup=(await f.owner("/owner/backup")).data, copy=new DatabaseSync(":memory:"); t.after(()=>copy.close());
  await restoreBackup(backup,copy);
  assert.equal(copy.prepare("SELECT sum(minutes) AS n FROM imece_contributions").get().n,2000);
  assert.equal(copy.prepare("SELECT count(*) AS n FROM imece_crew").get().n,4);
  assert.equal(copy.prepare("PRAGMA foreign_key_check").all().length,0);
});
