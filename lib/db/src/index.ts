import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
console.log("DATABASE_URL =", process.env.DATABASE_URL)
const { Pool } = pg;

export let pool: pg.Pool;
export let db: any;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL is not set. Running in Demo/Mock Mode. Database queries will fail.");
  // Provide a dummy pool to prevent immediate startup crashes
  pool = new Pool();
  db = drizzle(pool, { schema });
} else {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
}

export * from "./schema";
