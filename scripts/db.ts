import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";

const connectionString =
  process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  throw new Error(
    "No database connection string found. Set DATABASE_URL in your environment before running this script.",
  );
}

export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
export { schema };
