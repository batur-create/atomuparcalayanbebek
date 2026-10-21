// Rebuilds a /batur JSON backup ("Tüm veriyi yedekle") into an EMPTY node:sqlite
// database at the current schema, then proves the copy matches the backup: row
// counts, foreign keys, integrity and every building's stored spot. It never
// touches the live database; see RECOVERY.md for moving a checked copy to D1.
import { randomBytes } from "node:crypto";
import { SCHEMA_VERSION, migrate, migrations } from "./schema.js";
import { sqliteAdapter } from "./sqlite.js";
import {WEEKLY_BACKFILL,WEEKLY_LEGACY} from "../shared/blueprints.js";
import {IMECE_TEAM_IMPORT} from "../shared/imeceMigration.js";
import {PLAN_LEGACY_IMPORT} from "../shared/plans.js";
import {VILLAGE_LEGACY_SNAPSHOT} from "../shared/koy2/legacySnapshot.js";

import { BACKUP_TABLES } from "../shared/backup.js";
export { BACKUP_TABLES };

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
    // A pre-30 backup is imported into today's schema after migrations ran on
    // an empty DB. Normalize legacy yes/no rows just as migration 30 does.
    if(backup.schema<30){
      sqlite.exec("UPDATE attendees SET arrival=(SELECT starts FROM plans WHERE id=attendees.plan_id) WHERE arrival IS NULL");
      sqlite.exec(PLAN_LEGACY_IMPORT);
    }
    if(backup.schema<31) for(const sql of WEEKLY_BACKFILL) sqlite.exec(sql);
    if(backup.schema<32) for(const sql of IMECE_TEAM_IMPORT) sqlite.exec(sql);
    // n46 C: an older backup gets today's village frozen as its legacy baseline.
    if(backup.schema<34) for(const sql of VILLAGE_LEGACY_SNAPSHOT) sqlite.exec(sql);
    const broken = sqlite.prepare("PRAGMA foreign_key_check").all();
    if (broken.length) throw new Error(`Yabancı anahtar hatası: ${broken.length} satır (${broken[0].table}).`);
    sqlite.exec("COMMIT");
  } catch (error) {
    sqlite.exec("ROLLBACK");
    throw error;
  }

  const counts = {};
  const weeklyRights = backup.schema<31 ? (backup.tables.buildings||[]).filter(b=>b.gift==null&&WEEKLY_LEGACY.some(([id,since])=>b.model===id&&b.created>=since&&b.created<since+14*86400000)).map(b=>({member_id:b.member_id,model:b.model})) : [];
  for (const table of BACKUP_TABLES) {
    const legacyImece={imece_projects:"imece_project",imece_slots:"imece_crew",imece_work:"imece_contributions"};
    const n46 = backup.schema<34 && {
      village_layouts: (backup.tables.groups||[]).length,
      focus_runs: (backup.tables.members||[]).filter((m)=>m.focus_end>0).length,
    }[table];
    const expected = n46 !== undefined && n46 !== false ? n46 : backup.schema<32&&legacyImece[table] ? (backup.tables[legacyImece[table]]||[]).length : table==="unlocks"&&backup.schema<31
      ?new Set([...(backup.tables.unlocks||[]),...weeklyRights].map(r=>JSON.stringify([r.member_id,r.model]))).size
      :table==="attendees"&&backup.schema<30
      ?new Set([...(backup.tables.attendees||[]),...(backup.tables.plan_skips||[])].map(r=>JSON.stringify([r.plan_id,r.member_id]))).size
      :(backup.tables[table] || []).length;
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
