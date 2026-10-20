import { query, queryOne } from "../db.js"
import { notFound, route } from "../errors.js"

const NOTIFICATION_SELECT = `
  select n.id, n.user_id, n.actor_id, n.type, n.stream_id, n.comment_id,
         n.read, n.created_at,
         json_build_object('username', a.username, 'avatar_url', a.avatar_url) as actor,
         json_build_object('id', s.id, 'title', s.title, 'video_url', s.video_url) as stream,
         json_build_object('id', c.id, 'content', c.content) as comment
    from notifications n
    left join profiles a on a.id = n.actor_id
    left join streams s on s.id = n.stream_id
    left join comments c on c.id = n.comment_id
`

export default async function notificationRoutes(fastify) {
  // GET /api/notifications?unread_only=true&limit=20
  fastify.get("/notifications", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const userId = request.user.id
    const unreadOnly = request.query?.unread_only === "true"
    const limit = Math.min(Math.max(Number.parseInt(request.query?.limit, 10) || 20, 1), 100)

    const params = [userId, limit]
    const where = unreadOnly
      ? `where n.user_id = $1 and n.read = false order by n.created_at desc limit $2`
      : `where n.user_id = $1 order by n.created_at desc limit $2`

    const notifications = await query(`${NOTIFICATION_SELECT} ${where}`, params)
    return reply.send(notifications)
  }))

  // GET /api/notifications/unread-count
  fastify.get("/notifications/unread-count", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const { count } = await queryOne(
      `select count(*)::int as count from notifications where user_id = $1 and read = false`,
      [request.user.id],
    )
    return reply.send({ count })
  }))

  // POST /api/notifications/:id/read
  fastify.post("/notifications/:id/read", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const updated = await queryOne(
      `update notifications set read = true
       where id = $1 and user_id = $2
       returning id`,
      [request.params.id, request.user.id],
    )
    if (!updated) throw notFound("Notification not found")
    return reply.send({ read: true, id: updated.id })
  }))

  // POST /api/notifications/read-all
  fastify.post("/notifications/read-all", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    await query(
      `update notifications set read = true where user_id = $1 and read = false`,
      [request.user.id],
    )
    return reply.send({ ok: true })
  }))
}

/**
 * Create a notification. Call this from other route handlers when
 * notification-worthy events occur (follow, like, comment, stream live).
 */
export async function createNotification({
  userId,
  actorId,
  type,
  streamId,
  commentId,
}) {
  await query(
    `insert into notifications (user_id, actor_id, type, stream_id, comment_id)
     values ($1, $2, $3, $4, $5)`,
    [userId, actorId ?? null, type, streamId ?? null, commentId ?? null],
  )
}
