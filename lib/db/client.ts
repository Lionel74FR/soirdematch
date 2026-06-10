import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// L'application utilise le driver neon-http : elle requiert une base Neon.
// En production (Vercel), la base est fournie via DATABASE_URL.
// En développement (Replit), DATABASE_URL pointe vers un Postgres « helium »
// incompatible avec neon-http ; on privilégie donc NEON_DATABASE_URL.
const connectionString =
  process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "NEON_DATABASE_URL or DATABASE_URL environment variable is not set",
  );
}

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
