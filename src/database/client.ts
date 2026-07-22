import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

export const turso = createClient({
  url: env.DATABASE_URL,
  authToken: env.DATABASE_AUTH_TOKEN || undefined
});

export const db = drizzle(turso, { schema });

