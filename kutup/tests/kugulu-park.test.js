import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { BY_ID, RARE, minutesOf, stateOf } from '../shared/catalog.js';
import { GEOMETRY_VERSION, modelSpec } from '../shared/koy2/models.js';
import { spec, projector, useSVG, buildingSVG, mirrored } from '../src/iso.js';
import { sitePlan, siteSVG, workHeight } from '../src/construction.js';
import { phaseInfo } from '../src/stageInfo.js';
import { metraj } from '../src/metraj.js';
import { KUGULU_PARK, parkWaterState, parkWaterContains } from '../src/kuguluPark.js';
import { createPlanner, cellLayout, lineDistance, LANE } from '../shared/village.js';
import { createApp } from '../server/app.js';
import { sqliteAdapter } from '../server/sqlite.js';

test('Kuğulu Park: approved price, class and permanent plan; existing geometry versions stay readable', () => {
  const item=BY_ID.kugulupark;
  assert.equal(item.cost,180);assert.equal(minutesOf(item),75);assert.ok(RARE.includes(item));
  assert.equal(stateOf(item,Date.now()),'locked');assert.equal(stateOf(item,Date.now(),['kugulupark']),'open');
  const m=modelSpec(item.id);assert.equal(m.context,'dry');assert.equal(m.scale,1);
  assert.equal(GEOMETRY_VERSION,2);assert.deepEqual({...modelSpec(item.id,1),version:2},m);
  assert.ok(Math.abs(m.ground[2]-m.ground[0]-17.5)<.2);assert.ok(Math.abs(m.ground[3]-m.ground[1]-15)<.2);
  assert.deepEqual(m.entrances[0],{x:0,y:7.5,dir:[0,1],type:'main'});
});

test('Kuğulu Park: sixteen explained, continuous landscape operations; finite drawings, monotone payment, identical delivered architecture', () => {
  useSVG();const sp=spec('house',7,'kugulupark'),plan=sitePlan(sp),P=projector({cx:400,cy:320,s:22});
  assert.equal(plan.length,16);assert.equal(plan[0].a,0);assert.equal(plan.at(-1).b,1);
  let earned=0;
  for(const [i,p] of plan.entries()){
    if(i)assert.ok(Math.abs(plan[i-1].b-p.a)<1e-12);
    assert.ok(phaseInfo(sp,p)?.length>30,p.key);
    assert.ok(!['footPour','colPour','deckPour','roofTiles'].includes(p.key));
    for(const shown of [p.a+1e-7,(p.a+p.b)/2,p.b]){
      const q=metraj(sp,plan,shown);assert.ok(q.hakedis>=earned);earned=q.hakedis;
      for(const proj of [P,mirrored(P)]){
        const site=siteSVG(proj,sp,plan,shown);
        const out=site.yard+site.rest+site.front+KUGULU_PARK.scene(proj,sp,plan,shown,true)+KUGULU_PARK.motion(proj,sp,plan,shown,true,12);
        assert.doesNotMatch(out,/NaN|Infinity|undefined/);
      }
      assert.equal(workHeight(plan,sp,shown),0);
    }
  }
  assert.equal(earned,100);assert.equal(metraj(sp,plan,0).hakedis,0);
  for(const lit of [false,true]){
    const done=KUGULU_PARK.shadow(P,sp,1)+KUGULU_PARK.scene(P,sp,plan,1,lit)+KUGULU_PARK.motion(P,sp,plan,1,lit,0);
    // Only clip identifiers differ between the shared portrait and scene.
    const canonical=s=>s.replaceAll('park-scene','park-portrait');
    assert.equal(canonical(done),canonical(buildingSVG(P,sp,7,{lit})));
  }
});

test('Kuğulu Park: swimming stays in water, off islands; visual motion and night light have no game clock', () => {
  for(const seed of [0,7,101])for(let time=0;time<20000;time+=23){
    const a=parkWaterState(time,seed);assert.equal(a.birds.length,6);
    for(const b of a.birds)assert.ok(parkWaterContains(b.x,b.y),JSON.stringify(b));
  }
  assert.notDeepEqual(parkWaterState(0),parkWaterState(5));
  const sp=spec('house',7,'kugulupark'),P=projector({cx:300,cy:250,s:20}),plan=sitePlan(sp);
  const water=plan.find(p=>p.key==='water');
  assert.equal(KUGULU_PARK.motion(P,sp,plan,(water.a+water.b)/2,true,1),'','no birds or jets in unfinished water');
  assert.notEqual(buildingSVG(P,sp,7,{lit:false}),buildingSVG(P,sp,7,{lit:true}),'lamps, cafe and reflected light');
});

test('Kuğulu Park: legacy villages allocate full-size dedicated plots clear of the ring road', () => {
  for(const key of ['park-a','park-b','park-c']){
    const planner=createPlanner(key,[],[]);let n=0;
    const p=planner.place('m0','house',()=>`district-${++n}`,{model:'kugulupark'});
    assert.ok(p,key);const L=cellLayout(key,p.district.q,p.district.r,true);
    assert.ok(L.room>=9);assert.ok(Math.hypot(p.x-L.center[0],p.y-L.center[1])<.02);
    for(const lane of L.lanes)assert.ok(lineDistance([p.x,p.y],lane).d-LANE>8.75);
    assert.equal(spec('house',7,'kugulupark',{room:L.room}).k,1);
  }
});

test('Kuğulu Park API: locked plan, one charge, same reserved plot, one permanent result across retries',async t=>{
  const sql=new DatabaseSync(':memory:');sql.exec('PRAGMA foreign_keys=ON');t.after(()=>sql.close());
  const app=createApp({db:sqliteAdapter(sql),config:{adminKey:'local-park-test',testHooks:true}});
  let cookie;
  const call=async(path,body)=>{
    const r=await app.fetch(new Request('http://park.test/api'+path,{method:body?'POST':'GET',headers:{'X-Kutup':'1','X-Kutup-Village-Version':'3','Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})}),{ip:'park-test'});
    return{status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
  };
  const joined=await call('/groups',{name:'Park Test',username:'park_test',password:'park-test-only'});assert.equal(joined.status,201);cookie=joined.cookie;
  const id=joined.data.memberId;sql.prepare('UPDATE members SET bricks=1000 WHERE id=?').run(id);
  const body={action:'start',strict:true,relaxed:true,model:'kugulupark',minutes:75,requestKey:'park-build-request-0001'};
  const locked=await call('/focus',body);assert.equal(locked.status,400);assert.match(locked.data.error,/plan|kilit/i);
  sql.prepare("INSERT INTO unlocks(member_id,model,source,created) VALUES(?,?,'gift',?)").run(id,'kugulupark',Date.now());
  assert.equal((await call('/__test/village-v2',{name:'Park Test'})).status,200);
  const start=await call('/focus',body);assert.equal(start.status,200,JSON.stringify(start.data));
  assert.equal((await call('/focus',body)).status,200);
  assert.equal(sql.prepare('SELECT bricks FROM members WHERE id=?').get(id).bricks,820);
  const before=(await call('/village')).data.sites[0].placement;
  sql.prepare('UPDATE members SET focus_end=?,focus_beat=? WHERE id=?').run(Date.now()-1000,Date.now(),id);
  await Promise.all([call('/state'),call('/state')]);
  const village=(await call('/village')).data,built=village.buildings.filter(b=>b.model==='kugulupark');
  assert.equal(built.length,1);assert.equal(village.sites.length,0);
  for(const k of ['plotId','x','y','facing','scale'])assert.equal(built[0].placement[k],before[k],k);
  await call('/state');assert.equal(sql.prepare("SELECT count(*) n FROM buildings WHERE model='kugulupark'").get().n,1);
});
