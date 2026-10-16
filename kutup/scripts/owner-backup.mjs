// Usage (in kutup/): node scripts/owner-backup.mjs [etiket]
// Saves the live owner backup to data/backup-before-<etiket>-<time>.json before a
// migration deploy. Reads the key from data/batur-key-canli.txt and never prints it.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "data");
const label = process.argv[2] || "migration";
const base = "https://kutup.ahmetbaturkaplanoglu.workers.dev";
const key = readFileSync(resolve(dir, "batur-key-canli.txt"), "utf8").trim();
const res = await fetch(`${base}/api/owner/backup`, { headers: { "x-owner-key": key, "x-kutup": "1" } });
const text = await res.text();
if (!res.ok) {
  console.error("Yedek alınamadı:", res.status, text.slice(0, 200));
  process.exit(1);
}
const data = JSON.parse(text);
const file = resolve(dir, `backup-before-${label}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
writeFileSync(file, text, { mode: 0o600 });
const count = (name) => {
  const table = data.tables?.[name];
  return Array.isArray(table) ? table.length : table?.rows?.length ?? "?";
};
console.log("Kaydedildi:", file.split(/[\\/]/).pop(), "· şema", data.schema, "· üye", count("members"));
