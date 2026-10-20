import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from '../server/app.js';
import { sqliteAdapter } from '../server/sqlite.js';
import { createPushOutbox } from '../server/outbox.js';
import { createRelaxedNotices } from '../server/relaxed.js';
import { migrate, migrations } from '../server/schema.js';
import { restoreBackup } from '../server/restore.js';
import { BY_ID, refundNow, wageFor } from '../shared/catalog.js';

const call = (app, path, cookie, body) => app.fetch(new Request(`https://kutup.test/api${path}`, {
  method: body === undefined ? 'GET' : 'POST',
  headers: { 'X-Kutup': '1', 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
})).then(async (r) => ({ status: r.status, data: await r.json(), cookie: r.headers.get('set-cookie')?.split(';')[0] }));

async function fixture(t) {
  const sql = new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys=ON');
  t.after(() => sql.close());
  const db = sqliteAdapter(sql), app = createApp({ db, config: { adminKey: 'relaxed-backup-test-key' } });
  const joined = await call(app, '/groups', null, { name: 'Rahat ekip', username: 'relaxed_ada', password: 'test123' });
  assert.equal(joined.status, 201);
  const cookie = joined.cookie, id = joined.data.memberId;
  const request = (path, body) => call(app, path, cookie, body);
  const me = () => sql.prepare('SELECT * FROM members WHERE id=?').get(id);
  return { sql, db, app, cookie, id, request, me };
}

test('migration 26 preserves an existing strict session and wallet across repeat startup', async (t) => {
  const sql = new DatabaseSync(':memory:');
  t.after(() => sql.close());
  sql.exec('PRAGMA foreign_keys=ON');
  for (const migration of migrations.slice(0, 25)) for (const statement of migration) sql.exec(statement);
  sql.prepare("INSERT INTO settings (key,value) VALUES ('schema','25')").run();
  sql.prepare("INSERT INTO groups (id,name,invite) VALUES ('g','Eski ekip','old-invite')").run();
  sql.prepare("INSERT INTO members (id,group_id,token,name,avatar,color,joined,updated,focus_strict,focus_end,focus_minutes,focus_beat,focus_seed,focus_model,focus_cost,bricks) VALUES ('m','g','token','Ada','📚','lilac',1,2,1,9000000,50,8900000,4321,'ev',40,123)").run();
  const before = sql.prepare("SELECT * FROM members WHERE id='m'").get();
  const db = sqliteAdapter(sql);
  await migrate(db); await migrate(db);
  const { focus_relaxed, focus_imece, focus_imece_phase, focus_imece_personal, focus_imece_ref, ...after } = sql.prepare("SELECT * FROM members WHERE id='m'").get();
  assert.equal(focus_relaxed, 0);
  assert.deepEqual([focus_imece,focus_imece_phase,focus_imece_personal,focus_imece_ref],[0,0,0,null]);
  assert.deepEqual(after, { ...before });
  assert.equal(sql.prepare('SELECT count(*) AS n FROM build_deliveries').get().n, 0);
});

test('relaxed builds survive absence and restart, credit once, and acknowledge only their own delivery', async (t) => {
  const f = await fixture(t);
  const begun = await f.request('/focus', { action: 'start', strict: true, relaxed: true, model: 'kulube' });
  assert.equal(begun.status, 200);
  assert.equal(begun.data.state.members[0].focusRelaxed, 1);
  const original = f.me();
  for (const action of ['away', 'crack', 'beat', 'wither']) assert.equal((await f.request('/focus', { action, away: 120000 })).status, 200);
  assert.equal(f.me().focus_cracked_at, 0);
  assert.equal(f.me().focus_left_at, 0);
  assert.equal(f.me().focus_end, original.focus_end);
  assert.equal((await f.request('/focus', { action: 'rescue' })).status, 400);
  assert.equal((await f.request('/focus', { action: 'pause' })).status, 400);
  assert.equal((await f.request('/focus', { action: 'start', strict: true, model: 'kulube' })).status, 400);
  f.sql.prepare('UPDATE members SET focus_end=?, focus_beat=0 WHERE id=?').run(Date.now()-1000, f.id);
  const restarted = createApp({ db: f.db });
  const finished = await Promise.all([
    call(restarted, '/state', f.cookie),
    call(restarted, '/focus', f.cookie, { action: 'finish' }),
    call(restarted, '/build-deliveries', f.cookie),
  ]);
  assert.ok(finished.every((r) => r.status === 200));
  assert.equal(f.sql.prepare('SELECT count(*) AS n FROM buildings WHERE member_id=?').get(f.id).n, 1);
  assert.equal(f.sql.prepare('SELECT count(*) AS n FROM focus_log WHERE member_id=?').get(f.id).n, 1);
  const receipts = (await f.request('/build-deliveries')).data;
  assert.equal(receipts.length, 1);
  assert.equal(receipts[0].seed, original.focus_seed);
  assert.equal(receipts[0].model, 'kulube');
  assert.equal(receipts[0].minutes, 25);
  // Unwatched, so half the wage (n40 düzeltme); the day's first-session bonus stays.
  const wage = f.sql.prepare("SELECT delta FROM bricks_log WHERE member_id=? AND reason='wage'").get(f.id).delta;
  assert.equal(wage, wageFor(25, false));
  const backupResponse = await f.app.fetch(new Request('https://kutup.test/api/owner/backup', { headers: { 'X-Owner-Key': 'relaxed-backup-test-key' } }));
  assert.equal(backupResponse.status, 200);
  const backup = await backupResponse.json(), copy = new DatabaseSync(':memory:');
  t.after(() => copy.close());
  await restoreBackup(backup, copy);
  assert.equal(copy.prepare('SELECT count(*) AS n FROM build_deliveries WHERE accepted_at=0').get().n, 1);
  assert.equal(copy.prepare('SELECT count(*) AS n FROM build_push_events').get().n, backup.tables.build_push_events.length);
  assert.equal(copy.prepare('SELECT focus_relaxed FROM members WHERE id=?').get(f.id).focus_relaxed, 0);
  const message = f.sql.prepare("SELECT text FROM messages WHERE text LIKE '%rahat inşaatla%'").get();
  assert.ok(message);
  assert.doesNotMatch(message.text, /telefona dokunmadan/);
  const balance = f.me().bricks;
  const tag = `relaxed-${f.id}-${receipts[0].ends}`;
  await f.db.run("INSERT INTO push_outbox (id,endpoint,subscription_table,payload,subject,ttl,next_at,created,member_id) VALUES (?,?,?,?,?,?,?,?,?)", ['queued-build','https://fcm.googleapis.com/test','subscriptions',JSON.stringify({tag}),'https://kutup.test',900,Date.now(),Date.now(),f.id]);
  const other = await call(f.app, '/groups', null, { name: 'Başka ekip', username: 'other_relaxed', password: 'test123' });
  assert.equal((await call(f.app, `/build-deliveries/${receipts[0].id}`, other.cookie, {})).status, 404);
  assert.equal((await call(f.app, '/build-deliveries')).status, 401);
  for (let n=0;n<2;n++) assert.equal((await f.request(`/build-deliveries/${receipts[0].id}`, {})).status, 200);
  assert.deepEqual((await f.request('/build-deliveries')).data, []);
  assert.equal(f.sql.prepare('SELECT count(*) AS n FROM push_outbox WHERE id=?').get('queued-build').n, 0);
  assert.equal(f.me().bricks, balance, 'viewing or acknowledging is never another payment');
  assert.equal(f.sql.prepare('SELECT count(*) AS n FROM buildings WHERE member_id=?').get(f.id).n, 1);
});

test('strict defaults stay strict and missing foreground proof still collapses them', async (t) => {
  const f = await fixture(t);
  const r = await f.request('/focus', { action: 'start', strict: true, model: 'kulube' });
  assert.equal(r.status, 200);
  assert.equal(f.me().focus_relaxed, 0);
  f.sql.prepare('UPDATE members SET focus_end=?,focus_beat=0 WHERE id=?').run(Date.now()-1000,f.id);
  await f.request('/state');
  assert.equal(f.sql.prepare('SELECT count(*) AS n FROM buildings').get().n, 0);
  assert.deepEqual((await f.request('/build-deliveries')).data, []);
  assert.ok(f.me().ruin_until > Date.now());
});

test('relaxed mode validates its start and cancellation preserves material refund rules', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.request('/focus', { action: 'start', minutes: 25, relaxed: true })).status, 400);
  assert.equal((await f.request('/focus', { action: 'start', strict: true, relaxed: 'yes', minutes: 25 })).status, 400);
  f.sql.prepare('UPDATE members SET bricks=200 WHERE id=?').run(f.id);
  assert.equal((await f.request('/focus', { action: 'start', strict: true, relaxed: true, model: 'ev' })).status, 200);
  f.sql.prepare('UPDATE members SET focus_end=? WHERE id=?').run(Date.now()+10*60000, f.id);
  const ended = await f.request('/focus', { action: 'cancel' });
  assert.equal(ended.status, 200);
  assert.equal(ended.data.refunded, refundNow(BY_ID.ev.cost));
  assert.equal(f.me().bricks, 200-BY_ID.ev.cost+refundNow(BY_ID.ev.cost));
  assert.equal(f.me().focus_relaxed, 0);
  assert.deepEqual((await f.request('/build-deliveries')).data, []);
});

test('milestones persist atomically, catch up without bursts, and do not requeue after delivery', async (t) => {
  const f = await fixture(t);
  await f.request('/focus', { action: 'start', strict: true, relaxed: true, model: 'kulube' });
  // The initial no-subscriber announcement was already recorded, never replayed later.
  const ends=f.me().focus_end, start=ends-25*60000;
  let clock=start+13*60000;
  const endpoint='https://fcm.googleapis.com/relaxed-test';
  const token=f.sql.prepare('SELECT token FROM sessions WHERE member_id=?').get(f.id).token;
  await f.db.run('INSERT INTO subscriptions (endpoint,member_id,subscription,session_token) VALUES (?,?,?,?)',[endpoint,f.id,JSON.stringify({endpoint,keys:{}}),token]);
  const sent=[];
  const queue=createPushOutbox({db:f.db,now:()=>clock,allowed:()=>true,ownerHash:async()=>null,sessionAge:365*86400000,ownerAge:86400000,send:async(_,payload)=>{sent.push(JSON.parse(payload));return 201;}});
  const announce=createRelaxedNotices({db:f.db,now:()=>clock,notifyMember:async(ctx,id,message,options)=>{
    const subs=await f.db.all('SELECT * FROM subscriptions WHERE member_id=?',[id]);
    await queue.enqueue(subs,message,'subscriptions',{subject:'https://kutup.test',...options});
  }});
  await Promise.all([announce({}),announce({})]);
  assert.equal(f.sql.prepare('SELECT count(*) AS n FROM push_outbox').get().n,1);
  assert.equal(f.sql.prepare('SELECT count(*) AS n FROM build_push_events WHERE stage=50').get().n,1);
  assert.equal(f.sql.prepare('SELECT count(*) AS n FROM build_push_events WHERE stage=25').get().n,0,'missed milestones are not replayed in a burst');
  await queue.drain();
  assert.equal(sent[0].buildProgress,50);
  assert.equal(sent[0].quiet,true);
  assert.match(sent[0].body,/Bitiş:/);
  await announce({}); await queue.drain();
  assert.equal(sent.length,1,'successful queue rows can disappear without losing dedupe');
  clock=start+20*60000;
  await announce({}); await queue.drain();
  assert.equal(sent.at(-1).buildProgress,75);
  assert.equal(sent[0].tag,sent[1].tag);
  clock=ends+1;
  await announce({}); await queue.drain();
  assert.equal(sent.at(-1).buildProgress,100);
  assert.equal(sent.at(-1).quiet,false);
  assert.equal(new Set(sent.map((m)=>m.tag)).size,1);
  assert.equal(sent.length,3);
});
