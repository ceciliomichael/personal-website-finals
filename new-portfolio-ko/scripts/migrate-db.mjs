import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is required. Configure new-portfolio-ko/.env.local.",
  );
  process.exitCode = 1;
} else {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    for (const migration of [
      "001_visitors.sql",
      "002_feedback_lobby.sql",
      "003_presence.sql",
    ]) {
      const file = new URL(`../db/${migration}`, import.meta.url);
      const sql = await readFile(fileURLToPath(file), "utf8");
      await pool.query(sql);
      console.log(`Applied ${migration}.`);
    }
    console.log("PostgreSQL schema is ready.");
  } catch (error) {
    console.error("PostgreSQL migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
