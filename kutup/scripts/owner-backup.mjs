// Usage (in kutup/): node scripts/owner-backup.mjs [etiket]
// Saves the live owner backup to data/backup-before-<etiket>-<time>.json before a
// migration deploy. Reads the key from data/batur-key-canli.txt and never prints it.
// The backup comes in small parts (?part=…), so no single Worker request has to
// carry the whole database. If the live Worker cannot give it (an older Worker
// without parts, or a database error), the same data is exported straight from
// D1 with wrangler instead (data/backup-before-<etiket>-<time>.sql); that uses
// no Worker CPU. Only when both fail does the script stop the release.
import { spawnSync } from "node:child_process";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = resolve(root, "data");
const label = process.argv[2] || "migration";
const base = "https://kutup.ahmetbaturkaplanoglu.workers.dev";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = (ext) => resolve(dir, `backup-before-${label}-${stamp}.${ext}`);
const short = (path) => path.split(/[\\/]/).pop();

async function partsBackup() {
  const key = readFileSync(resolve(dir, "batur-key-canli.txt"), "utf8").trim();
  let backup = null;
  let part = "0:0";
  for (let parts = 0; part; parts++) {
    if (parts > 500) throw new Error("yedek bitmedi (500 parça)");
    let res;
    for (let attempt = 0; ; attempt++) {
      res = await fetch(`${base}/api/owner/backup?part=${part}`, { headers: { "x-owner-key": key, "x-kutup": "1" } });
      // The owner key allows 20 tries a minute; wait the minute out instead of failing.
      if (res.status !== 429 || attempt === 2) break;
      await new Promise((r) => setTimeout(r, 61000));
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 400)}`);
    const data = JSON.parse(text);
    if (!backup) backup = { app: data.app, created: data.created, schema: data.schema, tables: {} };
    for (const [t, rows] of Object.entries(data.tables || {})) backup.tables[t] = (backup.tables[t] || []).concat(rows);
    // A Worker from before parts answers with the whole backup and no `next`.
    part = data.next ?? null;
  }
  const out = file("json");
  writeFileSync(out, JSON.stringify(backup), { mode: 0o600 });
  const members = backup.tables.members?.length ?? "?";
  console.log("Kaydedildi:", short(out), "· şema", backup.schema, "· üye", members);
}

function d1Export() {
  const out = file("sql");
  // wrangler speaks to the terminal itself (it may ask "Ok to proceed?").
  const res = spawnSync(`npx wrangler d1 export kutup --remote --output="${out}"`, { cwd: root, shell: true, stdio: "inherit" });
  let size = 0;
  try {
    size = statSync(out).size;
  } catch {}
  if (res.status !== 0 || size === 0) return false;
  console.log("Kaydedildi (D1 dışa aktarımı):", short(out), "·", Math.round(size / 1024), "KB");
  return true;
}

try {
  await partsBackup();
} catch (error) {
  console.error("Worker yedeği alınamadı:", error.message);
  console.log("D1'den doğrudan dışa aktarılıyor (wrangler d1 export)…");
  if (!d1Export()) {
    console.error("Yedek alınamadı: Worker yedeği de D1 dışa aktarımı da çalışmadı (ayrıntı yukarıda).");
    process.exit(1);
  }
}
