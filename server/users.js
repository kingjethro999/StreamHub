import bcrypt from "bcryptjs"

const SALT_ROUNDS = 10

export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false
  return bcrypt.compare(plain, hash)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isEmail(value) {
  return typeof value === "string" && value.length <= 254 && EMAIL_RE.test(value)
}

export const PUBLIC_USER_COLUMNS = `
  u.id,
  u.email,
  p.username,
  p.display_name,
  p.bio,
  p.avatar_url,
  p.is_creator,
  p.followers_count,
  u.created_at
`
