import { queryOne, query } from "../db.js"
import { badRequest, route } from "../errors.js"
import { createNotification } from "./notifications.js"

async function streamLikeCount(streamId) {
  const row = await queryOne(`select coalesce(likes_count, 0) as likes_count from streams where id = $1`, [streamId])
  return row?.likes_count ?? 0
}

export default async function likeRoutes(fastify) {
  fastify.get("/likes", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const streamId = request.query?.stream_id
    if (!streamId) throw badRequest("stream_id is required")

    const row = await queryOne(`select 1 as liked from likes where stream_id = $1 and user_id = $2`, [
      streamId,
      request.user.id,
    ])

    return reply.send({
      liked: Boolean(row),
      likes_count: await streamLikeCount(streamId),
    })
  }))

  // Idempotent: liking twice is not an error.
  fastify.put("/likes", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const streamId = request.body?.stream_id
    if (!streamId) throw badRequest("stream_id is required")

    const inserted = await queryOne(
      `insert into likes (stream_id, user_id) values ($1, $2)
       on conflict (stream_id, user_id) do nothing
       returning id`,
      [streamId, request.user.id],
    )

    // Notify the stream owner of the new like (only on actual insert)
    if (inserted) {
      const owner = await queryOne(
        `select c.creator_id from streams s join channels c on c.id = s.channel_id where s.id = $1`,
        [streamId],
      )
      if (owner && owner.creator_id !== request.user.id) {
        await createNotification({
          userId: owner.creator_id,
          actorId: request.user.id,
          type: "like",
          stream_id: streamId,
        }).catch((err) => {
          request.log.warn({ err }, "Failed to create like notification")
        })
      }
    }

    return reply.send({ liked: true, likes_count: await streamLikeCount(streamId) })
  }))

  fastify.delete("/likes", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const streamId = request.query?.stream_id
    if (!streamId) throw badRequest("stream_id is required")

    await query(`delete from likes where stream_id = $1 and user_id = $2`, [streamId, request.user.id])

    return reply.send({ liked: false, likes_count: await streamLikeCount(streamId) })
  }))
}
