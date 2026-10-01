import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Reuse one pool across hot reloads in development, otherwise every file
// save opens a new pool and MySQL eventually runs out of connections.
const globalForDb = globalThis as unknown as { pool?: mysql.Pool };

const pool =
  globalForDb.pool ??
  mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: 10,
    timezone: "Z",
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** True when a MySQL unique index rejected the write. */
export function isDuplicateKeyError(error: unknown): boolean {
  let e: unknown = error;
  while (e && typeof e === "object") {
    if ((e as { code?: string }).code === "ER_DUP_ENTRY") return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}
