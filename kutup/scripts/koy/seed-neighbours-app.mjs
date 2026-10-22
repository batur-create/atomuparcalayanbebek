// Local visual-test database ONLY. No production credentials or data.
import { DatabaseSync } from "node:sqlite";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createApp } from "../../server/app.js";
import { sqliteAdapter } from "../../server/sqlite.js";
import { layoutStatements } from "../../server/villageStore.js";
import { BY_ID } from "../../shared/catalog.js";
import { layoutFrom } from "../../shared/koy2/draft.js";
import { emptyLayout } from "../../shared/koy2/planner.js";

const [out, scenes] = process.argv.slice(2);
if (!out || !scenes || !resolve(out).startsWith("/tmp/")) throw Error("Temporary /tmp output and saved acceptance scenes required");
mkdirSync(out, { recursive: true });
const sql = new DatabaseSync(resolve(out, "kutup.sqlite")); sql.exec("PRAGMA foreign_keys=ON");
const db = sqliteAdapter(sql), app = createApp({ db, config: { adminKey: "local-visual-test-only", testHooks: false } });
let requestNo = 0;
async function call(path, body) {
  const r = await app.fetch(new Request(`http://local.test/api${path}`, { method: "POST", headers: { "Content-Type": "application/json", "X-Kutup": "1" }, body: JSON.stringify(body) }), { ip: `local-visual-${requestNo++}` });
  const data = await r.json(); if (!r.ok) throw Error(`${r.status}: ${JSON.stringify(data)}`);
  return { data, cookie: r.headers.get("set-cookie").split(";")[0] };
}
const output = [];
for (const label of ["before-47", "47", "200", "500"]) {
  const count = label === "before-47" ? 47 : Number(label);
  const scene = JSON.parse(readFileSync(resolve(scenes, `komsu-1-${count}.json`)));
  const usernamePrefix = `visual_${label.replaceAll("-", "_")}`;
  const first = await call("/groups", { name: "Batur", groupName: `Komşu köyler ${label}`, username: `${usernamePrefix}_0`, password: "local-test-pass-123" });
  const group = first.data.group.id, ids = [first.data.memberId];
  for (let i = 1; i < 4; i++) ids.push((await call("/join", { invite: first.data.group.invite, name: scene.members[i].name, username: `${usernamePrefix}_${i}`, password: "local-test-pass-123" })).data.memberId);
  let layout = scene.layout;
  if (label === "before-47") layout = layoutFrom(scene.layout.seed, scene.items, emptyLayout(scene.layout.seed, 2)).layout;
  const mapId = (id) => id ? ids[Number(id.slice(1))] : null;
  const idOf = (id) => `${label}-${id}`;
  layout = { ...layout, foci: layout.foci.map((f) => ({ ...f, ...(f.personal ? { personal: mapId(f.personal) } : {}) })), plots: layout.plots.map((p) => ({ ...p, owner: mapId(p.owner), subject: { ...p.subject, id: idOf(p.subject.id) } })) };
  const statements = [];
  for (const [i, item] of scene.items.entries()) statements.push([
    "INSERT INTO buildings (id, member_id, group_id, kind, model, minutes, seed, created, touched, pos_x, pos_y, facing) VALUES (?, ?, ?, ?, ?, 50, ?, ?, ?, ?, ?, ?)",
    [idOf(item.subject.id), mapId(item.owner), group, BY_ID[item.model].kind, item.model, i * 117 + 15, Date.now() - (500 - i) * 60000, Date.now(), i * 8, 0, 0],
  ]);
  const lid = `visual-${label}`;
  statements.push(...layoutStatements(lid, group, layout, { status: "active" }));
  statements.push(["UPDATE groups SET active_layout_id = ?, village_rev = village_rev + 1 WHERE id = ?", [lid, group]]);
  await db.batch(statements);
  output.push({ label, group, cookie: first.cookie, owner: ids[0], count, missing: scene.items.length - layout.plots.length });
}
writeFileSync(resolve(out, "browser-sessions.json"), JSON.stringify(output), { mode: 0o600 });
sql.close();
console.log(JSON.stringify(output.map(({ cookie, ...x }) => x)));
