// n47: one account open on many devices, one running session. The device that
// started it watches it; every other device only shows it and cannot end it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from '../server/app.js';
import { sqliteAdapter } from '../server/sqlite.js';

const call = (app, path, cookie, body) => app.fetch(new Request(`https://kutup.test/api${path}`, {
  method: body === undefined ? 'GET' : 'POST',
  headers: { 'X-Kutup': '1', 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
})).then(async (r) => ({ status: r.status, data: await r.json(), cookie: r.headers.get('set-cookie')?.split(';')[0] }));

const PHONE = 'telefon0000000001', TABLET = 'tablet00000000002', LAPTOP = 'laptop00000000003';

async function fixture(t) {
  const sql = new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys=ON');
  t.after(() => sql.close());
  const app = createApp({ db: sqliteAdapter(sql), config: { adminKey: 'devices-test-key' } });
  const joined = await call(app, '/groups', null, { name: 'Beş cihaz', username: 'devices_ada', password: 'test123' });
  assert.equal(joined.status, 201);
  const id = joined.data.memberId;
  sql.prepare('UPDATE members SET bricks=500 WHERE id=?').run(id);
  const request = (path, body) => call(app, path, joined.cookie, body);
  const me = () => sql.prepare('SELECT * FROM members WHERE id=?').get(id);
  const shown = async () => (await request('/state')).data.members.find((m) => m.id === id);
  return { sql, id, request, me, shown };
}

test('a strict phone build is watched only by the phone that started it', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.request('/focus', { action: 'start', strict: true, model: 'kulube', device: 'phone', deviceId: PHONE })).status, 200);
  const start = f.me();
  assert.equal((await f.shown()).focusWatch, PHONE);
  // A tablet locking, a laptop reopening after its lid was shut, and an old tab
  // without an id: none of them is the phone leaving.
  for (const deviceId of [TABLET, LAPTOP, undefined]) {
    assert.equal((await f.request('/focus', { action: 'away', deviceId })).data.ignored, true);
    await f.request('/focus', { action: 'crack', away: 280000, deviceId });
    const auto = await f.request('/focus', { action: 'wither', deviceId });
    assert.equal(auto.data.ignored, true);
  }
  assert.deepEqual([f.me().focus_end, f.me().focus_left_at, f.me().focus_cracked_at, f.me().focus_strict], [start.focus_end, 0, 0, 1]);
  // The phone itself leaving still counts, and only the phone coming back clears it.
  await f.request('/focus', { action: 'crack', away: 20000, deviceId: PHONE });
  assert.ok(f.me().focus_cracked_at > 0);
  f.sql.prepare('UPDATE members SET focus_cracked_at=0 WHERE id=?').run(f.id);
  assert.equal((await f.request('/focus', { action: 'beat', device: 'phone', deviceId: TABLET })).data.phoneAway, true);
  assert.ok(f.me().focus_left_at > 0);
  await f.request('/focus', { action: 'beat', device: 'phone', deviceId: PHONE });
  assert.equal(f.me().focus_left_at, 0);
  // Letting the site go on purpose works from any device (past the free first minutes).
  f.sql.prepare('UPDATE members SET focus_end=focus_end-300000 WHERE id=?').run(f.id);
  const chosen = await f.request('/focus', { action: 'wither', chosen: true, deviceId: LAPTOP });
  assert.equal(chosen.status, 200);
  assert.equal(chosen.data.withered, true);
  assert.equal(f.me().focus_end, 0);
});

test('a session from an older app keeps the old rules on every device', async (t) => {
  const f = await fixture(t);
  await f.request('/focus', { action: 'start', strict: true, model: 'kulube', device: 'phone' });
  assert.equal((await f.shown()).focusWatch, null);
  await f.request('/focus', { action: 'crack', away: 20000, deviceId: TABLET });
  assert.ok(f.me().focus_cracked_at > 0);
});

test('the screen-off switch follows the account and the running mode is the server\'s', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.shown()).buildMode, null);
  assert.equal((await f.request('/build-mode', { relaxed: 'yes' })).status, 400);
  assert.equal((await f.request('/build-mode', { relaxed: true })).data.state.members[0].buildMode, 'relaxed');
  assert.equal((await f.request('/build-mode', { relaxed: false })).status, 200);
  assert.equal((await f.shown()).buildMode, 'strict');
  // Starting a screen-off build on the phone sets it for every device.
  await f.request('/focus', { action: 'start', strict: true, relaxed: true, model: 'kulube', device: 'phone', deviceId: PHONE });
  const running = await f.shown();
  assert.deepEqual([running.buildMode, running.focusRelaxed, running.focusWatch], ['relaxed', 1, PHONE]);
  // A device that took it for a watched build cannot give it up by mistake.
  assert.equal((await f.request('/focus', { action: 'cancel', end: running.focusEnd, relaxed: false })).status, 409);
  assert.equal((await f.request('/focus', { action: 'cancel', end: running.focusEnd - 1000, relaxed: true })).status, 409);
  assert.ok(f.me().focus_end > 0);
  assert.equal((await f.request('/focus', { action: 'cancel', end: running.focusEnd, relaxed: true })).status, 200);
  assert.equal(f.me().focus_end, 0);
});
