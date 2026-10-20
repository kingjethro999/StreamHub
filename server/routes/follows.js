import { query, queryOne } from "../db.js"
import { badRequest, route } from "../errors.js"
import { createNotification } from "./notifications.js"

export default async function followRoutes(fastify) {
  // Used by the Activity feed: every channel the signed-in user follows.
  fastify.get("/follows/me", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const follows = await query(
      `select f.id, f.follower_id, f.channel_id, f.created_at,
              to_jsonb(c) as channel
         from follows f
         left join channels c on c.id = f.channel_id
        where f.follower_id = $1
        order by f.created_at desc`,
      [request.user.id],
    )
    return reply.send(follows)
  }))

  fastify.get("/follows/check", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const channelId = request.query?.channel_id
    if (!channelId) throw badRequest("channel_id is required")

    const row = await queryOne(
      `select 1 as following from follows where follower_id = $1 and channel_id = $2`,
      [request.user.id, channelId],
    )
    return reply.send({ following: Boolean(row) })
  }))

  fastify.post("/follows", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const channelId = request.body?.channel_id
    if (!channelId) throw badRequest("channel_id is required")

    const inserted = await queryOne(
      `insert into follows (follower_id, channel_id)
       values ($1, $2)
       on conflict (follower_id, channel_id) do nothing
       returning id`,
      [request.user.id, channelId],
    )

    // Notify the channel owner of the new follower (only on actual insert)
    if (inserted) {
      const owner = await queryOne(
        `select creator_id from channels where id = $1`,
        [channelId],
      )
      if (owner && owner.creator_id !== request.user.id) {
        await createNotification({
          userId: owner.creator_id,
          actorId: request.user.id,
          type: "follow",
          stream_id: null,
        }).catch((err) => {
          request.log.warn({ err }, "Failed to create follow notification")
        })
      }
    }

    return reply.code(inserted ? 201 : 200).send({ following: true })
  }))

  fastify.delete("/follows", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const channelId = request.query?.channel_id
    if (!channelId) throw badRequest("channel_id is required")

    await query(`delete from follows where follower_id = $1 and channel_id = $2`, [
      request.user.id,
      channelId,
    ])
    return reply.send({ following: false })
  }))
}
