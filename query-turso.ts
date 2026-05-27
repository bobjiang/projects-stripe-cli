// Read-only inspector for the Turso database.
// Run with:  bun run query-turso.ts
import { connect } from "@tursodatabase/serverless";

const conn = connect({
  url: process.env.PRIMARY_DB_DATABASE_URL!,
  authToken: process.env.PRIMARY_DB_AUTH_TOKEN!,
});

// 1. List user tables (skip SQLite's internal ones).
const tables = await conn.all(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
);
console.log("Tables:", tables.map((t: any) => t.name).join(", ") || "(none)");

// 2. Dump every row in `visits`.
const rows = await conn.all("SELECT * FROM visits ORDER BY id");
console.log(`\nvisits (${rows.length} rows):`);
console.table(rows);

await conn.close();
