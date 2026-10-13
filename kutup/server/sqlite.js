// Async adapter over node:sqlite with the same shape as the D1 adapter in worker/.
export function sqliteAdapter(sqlite) {
  const statements = new Map();
  const prepared = (sql) => {
    if (!statements.has(sql)) statements.set(sql, sqlite.prepare(sql));
    return statements.get(sql);
  };
  const args = (params = []) => params.map((p) => (p === undefined ? null : p));
  return {
    async all(sql, params) {
      return prepared(sql).all(...args(params));
    },
    async get(sql, params) {
      return prepared(sql).get(...args(params)) ?? null;
    },
    async run(sql, params) {
      return { changes: Number(prepared(sql).run(...args(params)).changes) };
    },
    async read(list) {
      return list.map(([sql, params]) => prepared(sql).all(...args(params)));
    },
    async batch(list) {
      sqlite.exec("BEGIN IMMEDIATE");
      try {
        for (const [sql, params] of list) prepared(sql).run(...args(params));
        sqlite.exec("COMMIT");
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
}
