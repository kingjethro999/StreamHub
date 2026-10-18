import pg from "pg"
import { config } from "./env.js"

const { Pool } = pg

let pool = null

export function getPool() {
  if (!pool) {
    if (!config.databaseUrl) {
      throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill in the values.")
    }
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
      // Managed Postgres providers (Neon, RDS, Supabase, …) require TLS.
      // Set DATABASE_SSL=true in .env when you switch to a production URL.
      ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
    })
    pool.on("error", (err) => {
      console.error("Unexpected idle client error:", err.message)
    })
  }
  return pool
}

/** Run a query and return all rows. */
export async function query(text, params) {
  const { rows } = await getPool().query(text, params)
  return rows
}

/** Run a query and return the first row, or null. */
export async function queryOne(text, params) {
  const rows = await query(text, params)
  return rows[0] ?? null
}

/** Run a query and return a single scalar (first column of the first row). */
export async function queryValue(text, params) {
  const row = await queryOne(text, params)
  if (!row) return null
  return Object.values(row)[0]
}

export async function closePool() {
  if (pool) {
    await pool.end()
    pool = null
  }
}
