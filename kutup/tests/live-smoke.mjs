// Live smoke test after a deploy. Creates a throw-away team, exercises
// accounts, sync, recovery, revocation and push binding, then deletes the team.
// Never prints the owner key, cookies, codes or passwords.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { SCHEMA_VERSION } from "../server/schema.js";

// Run from kutup/: node tests/live-smoke.mjs (needs wrangler login and data/batur-key-canli.txt).
const dir = process.argv[2] || process.cwd();
const base = "https://kutup.ahmetbaturkaplanoglu.workers.dev";
const key = readFileSync(`${dir}/data/batur-key-canli.txt`, "utf8").trim();
const tag = Math.random().toString(36).slice(2, 7);
const pass = `duman-${crypto.randomUUID().slice(0, 12)}`;
const newPass = `yeni-${crypto.randomUUID().slice(0, 12)}`;
let failures = 0;

function check(label, ok, extra = "") {
  console.log(`${ok ? "OK  " : "FAIL"} ${label}${extra ? ` (${extra})` : ""}`);
  if (!ok) failures++;
}
async function call(path, { cookie, body, owner, method } = {}) {
  const headers = { "x-kutup": "1" };
  if (body) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = `kutup_session=${cookie}`;
  if (owner) headers["x-owner-key"] = key;
  const res = await fetch(`${base}/api${path}`, {
    method: method || (body ? "POST" : "GET"),
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.get("set-cookie") || "";
  const token = /kutup_session=([^;]*)/.exec(set)?.[1];
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data, token };
}
function d1(sql) {
  const out = execSync(`npx wrangler d1 execute kutup --remote --json --command "${sql}"`, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  return JSON.parse(out)[0].results;
}
async function fakeSubscription() {
  const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const b64 = (u) => Buffer.from(u).toString("base64url");
  return {
    endpoint: `https://fcm.googleapis.com/fcm/send/kutup-smoke-${tag}-${crypto.randomUUID()}`,
    keys: { p256dh: b64(raw), auth: b64(crypto.getRandomValues(new Uint8Array(16))) },
  };
}

// 0. Before: the real team is untouched.
const before = await call("/owner/groups", { owner: true });
check("owner panel reachable with key", before.status === 200);
const realTeams = (before.data || []).map((g) => ({ id: g.id, members: g.members.length }));
console.log("     teams before:", JSON.stringify(realTeams.map((t) => t.members)));
// Right after a deploy the old version can still answer for a few seconds; the
// new one migrates on its first request, so wake it and give it a moment.
let schema;
for (let attempt = 0; attempt < 6; attempt++) {
  await call("/health");
  schema = d1("SELECT value FROM settings WHERE key = 'schema'")[0]?.value;
  if (schema === String(SCHEMA_VERSION)) break;
  await new Promise((r) => setTimeout(r, 4000));
}
check(`live D1 schema is ${SCHEMA_VERSION}`, schema === String(SCHEMA_VERSION), `schema ${schema}`);

// Dark mode: the page loads mode.js before its first paint, and the stylesheet carries the dark twins.
const page = await fetch(base, { cache: "no-store" }).then((r) => r.text());
const mode = await fetch(`${base}/mode.js`, { cache: "no-store" });
const sheet = /href="(\/assets\/[^"]+\.css)"/.exec(page)?.[1];
const css = sheet ? await fetch(base + sheet).then((r) => r.text()) : "";
check("dark mode ships (mode.js before paint, dark twins in CSS)", page.includes('src="/mode.js"') && mode.ok && (await mode.text()).includes("kutup-mode") && /:where\(html\[data-mode="?dark"?\]\)/.test(css));

// 1. New team requires an account; with one it works.
const noAccount = await call("/groups", { body: { name: "Duman A", groupName: `Duman ${tag}` } });
check("new team without account is rejected", noAccount.status === 400, `status ${noAccount.status}`);
const userA = `duman_a_${tag}`, userB = `duman_b_${tag}`;
const created = await call("/groups", { body: { name: "Duman A", username: userA, password: pass, groupName: `Duman ${tag}` } });
check("create team", created.status === 201 && !!created.token, `status ${created.status}`);
const A1 = created.token, idA = created.data?.memberId, groupId = created.data?.group?.id, invite = created.data?.group?.invite;
const joined = await call("/join", { body: { invite, name: "Duman B", username: userB, password: pass } });
check("join with invite", joined.status === 201 && !!joined.token, `status ${joined.status}`);
let B1 = joined.token; const idB = joined.data?.memberId;

try {
  // 2. Push subscription is bound to B's device session.
  const sub = await fakeSubscription();
  const pushed = await call("/push", { cookie: B1, body: { subscription: sub } });
  check("push subscribe", pushed.status === 200, `status ${pushed.status}`);
  const bound = d1(`SELECT count(*) AS n FROM subscriptions WHERE member_id = '${idB}' AND session_token IS NOT NULL`)[0].n;
  check("subscription bound to session", bound === 1, `bound ${bound}`);

  // 3. Sync: A arrives, B sees it; polling with the current rev is unchanged.
  const here = await call("/presence", { cookie: A1, body: { status: "here", location: "Duman salonu", desk: "7" } });
  check("A status → here", here.status === 200 && here.data?.state?.members?.find((m) => m.id === idA)?.status === "here", `status ${here.status}`);
  const seen = await call("/state", { cookie: B1 });
  const rev = seen.data?.group?.rev;
  check("B sees A in the library", seen.data?.members?.find((m) => m.id === idA)?.status === "here");
  const again = await call(`/state?rev=${rev}`, { cookie: B1 });
  check("poll with same rev is unchanged", again.data?.unchanged === true);
  const brk = await call("/presence", { cookie: A1, body: { status: "break" } });
  const back = await call("/presence", { cookie: A1, body: { status: "here", location: "Duman salonu" } });
  check("here → break → here works", brk.status === 200 && back.status === 200);
  const cool = d1(`SELECT pushed_here_at > 0 AS h, pushed_break_at > 0 AS b FROM members WHERE id = '${idA}'`)[0];
  check("separate arrival/break cooldowns recorded", cool.h === 1 && cool.b === 1, JSON.stringify(cool));
  const msg = await call("/messages", { cookie: B1, body: { text: "duman testi, birazdan silinecek" } });
  check("board message", msg.status === 201, `status ${msg.status}`);
  const village = await call("/village", { cookie: A1 });
  check("village endpoint", village.status === 200, `status ${village.status}`);
  // Tuğla: a newcomer starts at 0, a free cottage starts and is given up for free.
  const wallet = await call("/wallet", { cookie: A1 });
  check("wallet", wallet.status === 200 && wallet.data?.bricks === 0, `status ${wallet.status} bricks ${wallet.data?.bricks}`);
  const pricey = await call("/focus", { cookie: A1, body: { action: "start", model: "kule", strict: true } });
  check("materials must be paid", pricey.status === 400 && /tuğla eksik/.test(pricey.data?.error || ""), `status ${pricey.status}`);
  const free = await call("/focus", { cookie: A1, body: { action: "start", model: "kulube", strict: true } });
  const quit = await call("/focus", { cookie: A1, body: { action: "cancel" } });
  check("free cottage, free change of mind", free.status === 200 && quit.status === 200 && quit.data?.withered === false, `status ${free.status}/${quit.status}`);

  // 4. Login on a second device keeps the first one.
  const wrong = await call("/login", { body: { username: userA, password: "yanlis-sifre" } });
  check("wrong password rejected", wrong.status === 401, `status ${wrong.status}`);
  const login = await call("/login", { body: { username: userA.toUpperCase(), password: pass } });
  check("login (case-insensitive username)", login.status === 200 && !!login.token, `status ${login.status}`);
  const A2 = login.token;
  check("first device still signed in", (await call("/session", { cookie: A1 })).status === 200);

  // 5. Device transfer code: single use, keeps the first device.
  const code = await call("/transfer", { cookie: A1, body: {} });
  const claim = await call("/transfer/claim", { body: { code: code.data?.code } });
  check("transfer code claim", claim.status === 200 && !!claim.token, `status ${claim.status}`);
  const A3 = claim.token;
  check("transfer code is single use", (await call("/transfer/claim", { body: { code: code.data?.code } })).status === 404);
  check("first device kept after transfer", (await call("/session", { cookie: A1 })).status === 200);

  // 6. Recovery through Batur's code signs every old device out.
  const reset = await call(`/owner/members/${idA}/reset`, { owner: true, body: {} });
  check("owner reset code", reset.status === 200 && !!reset.data?.code, `status ${reset.status}`);
  const recovered = await call("/reset", { body: { code: reset.data?.code, username: userA, password: newPass } });
  check("reset with new password", recovered.status === 200 && !!recovered.token, `status ${recovered.status}`);
  const old = await Promise.all([A1, A2, A3].map((c) => call("/session", { cookie: c })));
  check("old devices signed out after recovery", old.every((r) => r.status === 401), old.map((r) => r.status).join(","));
  check("old password no longer works", (await call("/login", { body: { username: userA, password: pass } })).status === 401);
  const A5 = (await call("/login", { body: { username: userA, password: newPass } })).token;
  check("new password works", !!A5 && (await call("/session", { cookie: A5 })).status === 200);

  // 7. Owner "sign out everywhere" revokes sessions and push.
  const out = await call(`/owner/members/${idB}/signout`, { owner: true, body: {} });
  check("owner signout", out.status === 200 && out.data?.closed >= 1, `closed ${out.data?.closed}`);
  check("signed-out device rejected", (await call("/session", { cookie: B1 })).status === 401);
  const subsLeft = d1(`SELECT count(*) AS n FROM subscriptions WHERE member_id = '${idB}'`)[0].n;
  check("signed-out member has no push subscriptions", subsLeft === 0, `left ${subsLeft}`);
  B1 = (await call("/login", { body: { username: userB, password: pass } })).token;
  check("signed-out member can log in again", !!B1);

  // 8. Cleanup.
  const leftB = await call("/leave", { cookie: B1, body: {} });
  const leftA = await call("/leave", { cookie: A5, body: {} });
  check("both test members left", leftA.status === 200 && leftB.status === 200, `${leftA.status},${leftB.status}`);
} finally {
  const after = await call("/owner/groups", { owner: true });
  const still = (after.data || []).some((g) => g.id === groupId);
  if (still) console.log("WARN test team still exists, id", groupId);
  check("test team deleted", !still);
  const realAfter = (after.data || []).map((g) => ({ id: g.id, members: g.members.length }));
  check("real teams unchanged", JSON.stringify(realAfter) === JSON.stringify(realTeams), JSON.stringify(realAfter.map((t) => t.members)));
  const leftovers = d1(`SELECT count(*) AS n FROM members WHERE username LIKE 'duman_%_${tag}'`)[0].n;
  check("no leftover test members", leftovers === 0, `left ${leftovers}`);
  const subs = d1("SELECT count(*) AS total, count(session_token) AS bound FROM subscriptions")[0];
  const owner = d1("SELECT count(*) AS total, count(key_hash) AS bound FROM owner_subscriptions")[0];
  console.log(`     push: members ${subs.bound}/${subs.total} bound, owner ${owner.bound}/${owner.total} bound`);
  console.log(failures ? `${failures} FAILED` : "ALL PASSED");
}
