// Proves the Stripe Projects-managed Turso credentials work end to end.
// Run with:  bun run test-turso.ts
// Bun auto-loads .env, so TURSO_DATABASE_URL / TURSO_AUTH_TOKEN come from there.
import { connect } from "@tursodatabase/serverless";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN — did .env load?");
  process.exit(1);
}

const conn = connect({ url, authToken });

// Connection helpers (run/get/all) each execute in a single round trip.
// 1. Create a table (idempotent).
await conn.run(
  "CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY AUTOINCREMENT, note TEXT, at TEXT DEFAULT CURRENT_TIMESTAMP)",
);

// 2. Write a row (? placeholder — never string-concatenate SQL).
await conn.run("INSERT INTO visits (note) VALUES (?)", "hello from the stripe projects cli");

// 3. Read it back.
const total = await conn.get("SELECT COUNT(*) AS n FROM visits");
const recent = await conn.all("SELECT id, note, at FROM visits ORDER BY id DESC LIMIT 5");

console.log(`Total rows in "visits": ${total.n}`);
console.log("Most recent:");
console.table(recent);

await conn.close();
