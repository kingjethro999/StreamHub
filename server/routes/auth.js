import { queryOne, query } from "../db.js"
import { badRequest, unauthorized, route } from "../errors.js"
import { hashPassword, verifyPassword, isEmail, PUBLIC_USER_COLUMNS } from "../users.js"
import { config } from "../env.js"

const findUserByEmail = (email) =>
  queryOne(
    `select ${PUBLIC_USER_COLUMNS}, u.password_hash
       from users u
       left join profiles p on p.id = u.id
      where u.email = $1`,
    [email],
  )

const findUserById = (id) =>
  queryOne(
    `select ${PUBLIC_USER_COLUMNS}
       from users u
       left join profiles p on p.id = u.id
      where u.id = $1`,
    [id],
  )

function stripPassword(user) {
  if (!user) return null
  const { password_hash: _passwordHash, ...rest } = user
  return rest
}

export default async function authRoutes(fastify) {
  fastify.post("/auth/register", route(async (request, reply) => {
    const { email, password, username } = request.body ?? {}

    if (!isEmail(email)) throw badRequest("Please provide a valid email address")
    if (typeof password !== "string" || password.length < 6) {
      throw badRequest("Password must be at least 6 characters")
    }
    if (typeof username !== "string" || username.trim().length < 3) {
      throw badRequest("Username must be at least 3 characters")
    }

    const cleanUsername = username.trim().toLowerCase()
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      throw badRequest("Username may only contain letters, numbers and underscores")
    }

    const passwordHash = await hashPassword(password)

    const user = await queryOne(
      `with new_user as (
         insert into users (email, password_hash)
         values ($1, $2)
         returning id, email, created_at
       ),
       new_profile as (
         insert into profiles (id, username, display_name, is_creator)
         select id, $3, $3, true
           from new_user
         returning id, username, display_name, is_creator, followers_count
       )
       select nu.id, nu.email, nu.created_at,
              np.username, np.display_name,
              null::text as bio, null::text as avatar_url,
              np.is_creator, np.followers_count
         from new_user nu
         join new_profile np on np.id = nu.id`,
      [email.trim().toLowerCase(), passwordHash, cleanUsername],
    )

    const token = fastify.jwt.sign({ sub: user.id }, { expiresIn: config.jwtExpiresIn })
    request.log.info({ userId: user.id }, "user registered")
    return reply.code(201).send({ token, user })
  }))

  fastify.post("/auth/login", route(async (request, reply) => {
    const { email, password } = request.body ?? {}
    if (!isEmail(email) || typeof password !== "string" || !password) {
      throw badRequest("Email and password are required")
    }

    const user = await findUserByEmail(email.trim().toLowerCase())
    const ok = await verifyPassword(password, user?.password_hash)
    if (!ok) throw unauthorized("Invalid email or password", "INVALID_CREDENTIALS")

    const token = fastify.jwt.sign({ sub: user.id }, { expiresIn: config.jwtExpiresIn })
    return reply.send({ token, user: stripPassword(user) })
  }))

  fastify.get("/auth/me", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const user = await findUserById(request.user.id)
    if (!user) throw unauthorized("Account no longer exists", "UNAUTHENTICATED")
    return reply.send({ user })
  }))

  // Convenience for the sign-up form: returns the first unused handle based on `q`.
  fastify.get("/auth/suggest-username", route(async (request, reply) => {
    const base = String(request.query?.q ?? "user").toLowerCase().replace(/[^a-z0-9_]/g, "") || "user"
    const taken = await query(`select username from profiles where username like $1 || '%' limit 20`, [base])
    const used = new Set(taken.map((r) => r.username))
    let candidate = base
    let n = 1
    while (used.has(candidate)) candidate = `${base}${++n}`
    return reply.send({ username: candidate })
  }))
}
