import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getPool, closePool } from "../db.js"
import "../env.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function migrate() {
  const sql = readFileSync(path.join(__dirname, "schema.sql"), "utf8")
  const pool = getPool()
  console.log("Applying schema.sql ...")
  await pool.query(sql)
  console.log("✔ Schema applied")
}

migrate()
  .catch((err) => {
    console.error("✖ Migration failed:", err.message)
    if (err.code === "ECONNREFUSED") {
      console.error("  Is PostgreSQL running? Start it with:  pnpm db:up")
    }
    process.exitCode = 1
  })
  .finally(closePool)
