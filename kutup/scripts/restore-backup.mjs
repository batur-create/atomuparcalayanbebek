// Usage (in kutup/): node scripts/restore-backup.mjs <yedek.json> <yeni.sqlite> [--sql <d1-icin.sql>]
// Builds a checked copy of a /batur JSON backup in a NEW local SQLite file. With
// --sql it also writes a file to load into an EMPTY D1 database. Never touches live data.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { restoreBackup, restoreSql } from "../server/restore.js";

const [source, target, flag, sqlOut] = process.argv.slice(2);
if (!source || !target || (flag && (flag !== "--sql" || !sqlOut))) {
  console.error("Kullanım: node scripts/restore-backup.mjs <yedek.json> <yeni.sqlite> [--sql <d1-icin.sql>]");
  process.exit(1);
}
for (const file of [target, sqlOut].filter(Boolean))
  if (existsSync(file)) {
    console.error(`${file} zaten var. Var olan bir dosyanın üstüne yazmıyorum.`);
    process.exit(1);
  }
const sqlite = new DatabaseSync(target);
try {
  const { schema, counts } = await restoreBackup(JSON.parse(readFileSync(source, "utf8")), sqlite);
  console.log(`Tamam: şema ${schema}, satırlar ${JSON.stringify(counts)}`);
  if (sqlOut) {
    writeFileSync(sqlOut, restoreSql(sqlite), { mode: 0o600 });
    console.log(`D1 için SQL yazıldı: ${sqlOut}`);
  }
} catch (error) {
  console.error(`Geri yükleme durdu: ${error.message}`);
  process.exitCode = 1;
} finally {
  sqlite.close();
}
