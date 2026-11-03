import { Pool } from "pg";

const globalForDatabase = globalThis as typeof globalThis & {
  orbitalPool?: Pool;
};

export function getDatabase(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!globalForDatabase.orbitalPool) {
    globalForDatabase.orbitalPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
  }

  return globalForDatabase.orbitalPool;
}
