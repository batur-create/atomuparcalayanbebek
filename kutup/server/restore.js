// Rebuilds a /batur JSON backup ("Tüm veriyi yedekle") into an EMPTY node:sqlite
// database at the current schema, then proves the copy matches the backup: row
// counts, foreign keys, integrity and every building's stored spot. It never
// touches the live database; see RECOVERY.md for moving a checked copy to D1.
import { randomBytes } from "node:crypto";
import { SCHEMA_VERSION, migrate, migrations } from "./schema.js";
import { sqliteAdapter } from "./sqlite.js";

// Parents before children, so foreign keys hold row by row.
export const BACKUP_TABLES = [
  "groups", "members", "districts", "buildings", "building_likes", "focus_log",
  "messages", "reactions", "plans", "attendees", "feedback", "feedback_events",
  "achievements",
];

export async function restoreBackup(backup, sqlite) {
  if (backup?.app !== "kutup" || typeof backup.tables !== "object")
    throw new Error("Bu dosya bir Kütüp yedeği değil.");
  if (!(backup.schema <= SCHEMA_VERSION))
    throw new Error(`Yedek daha yeni bir şemadan (${backup.schema}); önce kodu güncelle.`);
  sqlite.exec("PRAGMA foreign_keys = ON");
  await migrate(sqliteAdapter(sqlite));
  for (const table of BACKUP_TABLES)
    if (sqlite.prepare(`SELECT count(*) AS n FROM ${table}`).get().n)
      throw new Error(`Hedef veritabanı boş değil (${table}). Yeni, boş bir dosya kullan.`);

  sqlite.exec("BEGIN IMMEDIATE");
  try {
    for (const table of BACKUP_TABLES) {
      const known = new Set(sqlite.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name));
      for (const original of backup.tables[table] || []) {
        const row = { ...original };
        // The legacy member token no longer signs anyone in; it only has to be unique.
        if (table === "members" && row.token == null) row.token = randomBytes(24).toString("hex");
        const unknown = Object.keys(row).filter((k) => !known.has(k));
        if (unknown.length) throw new Error(`${table} tablosunda bilinmeyen sütun: ${unknown.join(", ")}`);
        const keys = Object.keys(row);
        sqlite
          .prepare(`INSERT INTO ${table} (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`)
          .run(...keys.map((k) => row[k] ?? null));
      }
    }
    const broken = sqlite.prepare("PRAGMA foreign_key_check").all();
    if (broken.length) throw new Error(`Yabancı anahtar hatası: ${broken.length} satır (${broken[0].table}).`);
    sqlite.exec("COMMIT");
  } catch (error) {
    sqlite.exec("ROLLBACK");
    throw error;
  }

  const counts = {};
  for (const table of BACKUP_TABLES) {
    const expected = (backup.tables[table] || []).length;
    const actual = sqlite.prepare(`SELECT count(*) AS n FROM ${table}`).get().n;
    if (actual !== expected) throw new Error(`${table}: yedekte ${expected}, kopyada ${actual} satır.`);
    counts[table] = actual;
  }
  const integrity = sqlite.prepare("PRAGMA integrity_check").get();
  if (Object.values(integrity)[0] !== "ok") throw new Error("SQLite bütünlük kontrolü geçmedi.");
  // Buildings never move: every stored spot must come back exactly.
  const spot = sqlite.prepare("SELECT pos_x, pos_y, facing, district_id FROM buildings WHERE id = ?");
  for (const b of backup.tables.buildings || []) {
    const copy = spot.get(b.id);
    for (const key of ["pos_x", "pos_y", "facing", "district_id"])
      if ((copy?.[key] ?? null) !== (b[key] ?? null)) throw new Error(`Bina ${b.id} konumu değişti (${key}).`);
  }
  return { schema: SCHEMA_VERSION, counts };
}

// A SQL file for an EMPTY D1 database: the full schema, then every restored row.
export function restoreSql(sqlite) {
  const literal = (v) =>
    v === null || v === undefined ? "NULL" : typeof v === "number" || typeof v === "bigint" ? String(v) : `'${String(v).split("'").join("''")}'`;
  const lines = migrations.flat().map((sql) => `${sql.trim()};`);
  lines.push(`INSERT INTO settings (key, value) VALUES ('schema', '${SCHEMA_VERSION}');`);
  for (const table of BACKUP_TABLES)
    for (const row of sqlite.prepare(`SELECT * FROM ${table}`).all()) {
      const keys = Object.keys(row);
      lines.push(`INSERT INTO ${table} (${keys.join(", ")}) VALUES (${keys.map((k) => literal(row[k])).join(", ")});`);
    }
  return `${lines.join("\n")}\n`;
}
