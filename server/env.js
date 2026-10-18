import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Load the repo-root .env file (if present) into process.env.
// Values already present in the real environment always win.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, "../.env")

if (existsSync(envPath)) {
  process.loadEnvFile(envPath)
}

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: process.env.DATABASE_SSL === "true",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || "StreamHub Alerts",
  },
  // NVIDIA hosted API (https://integrate.api.nvidia.com/v1).
  // The key stays on the server — never bundled to the browser. Optional: AI
  // features degrade gracefully when NVIDIA_API_KEY is not configured.
  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY,
    apiBase: process.env.NVIDIA_API_BASE || "https://integrate.api.nvidia.com/v1",
  },
}

export function assertRuntimeEnv() {
  const missing = []
  if (!config.databaseUrl) missing.push("DATABASE_URL")
  if (!config.jwtSecret) missing.push("JWT_SECRET")
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        `Copy .env.example to .env and fill in the values.`,
    )
  }
}
