import { query, queryOne } from "../db.js"
import { notFound, badRequest, unauthorized, route } from "../errors.js"
import { streamWithChannelSql } from "./channels.js"
import { createNotification } from "./notifications.js"

const ORDERABLE = {
  created_at: "s.created_at",
  viewers_count: "s.viewers_count",
  views_count: "s.views_count",
  likes_count: "s.likes_count",
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`)
}

export default async function streamRoutes(fastify) {
  // GET /api/streams?status=live&category=Gaming&q=lagos&channel_id=&order=created_at&dir=desc&limit=50
  fastify.get("/streams", route(async (request, reply) => {
    const { status, category, q, channel_id: channelId } = request.query ?? {}
    const orderCol = ORDERABLE[request.query?.order] ?? ORDERABLE.created_at
    const dir = request.query?.dir === "asc" ? "asc" : "desc"
    const limit = Math.min(Math.max(Number.parseInt(request.query?.limit, 10) || 50, 1), 200)

    const conditions = []
    const params = []
    const add = (value) => {
      params.push(value)
      return `$${params.length}`
    }

    if (status) conditions.push(`s.status = ${add(status)}`)
    if (channelId) conditions.push(`s.channel_id = ${add(channelId)}`)
    if (category) conditions.push(`c.category = ${add(category)}`)
    if (q && q.trim()) conditions.push(`s.title ilike ${add(`%${escapeLike(q.trim())}%`)}`)

    params.push(limit)
    const limitParam = `$${params.length}`

    const where = conditions.length ? conditions.join(" and ") : "true"
    const streams = await query(
      `${streamWithChannelSql(where)} order by ${orderCol} ${dir} nulls last, s.created_at desc limit ${limitParam}`,
      params,
    )
    return reply.send(streams)
  }))

  fastify.get("/streams/:id", route(async (request, reply) => {
    const stream = await queryOne(
      `${streamWithChannelSql("s.id = $1")}`,
      [request.params.id],
    )
    if (!stream) throw notFound("Stream not found")
    return reply.send(stream)
  }))

  fastify.post("/streams", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const body = request.body ?? {}
    if (typeof body.title !== "string" || !body.title.trim()) {
      throw badRequest("A title is required")
    }

    const channel = await queryOne(
      `select id from channels where creator_id = $1`,
      [request.user.id],
    )
    if (!channel) {
      throw badRequest("You must create a channel before uploading. Go to Settings to set up your profile.", "NO_CHANNEL")
    }

    const stream = await queryOne(
      `insert into streams (channel_id, title, description, thumbnail_url, video_url, status, viewers_count, views_count)
       values ($1, $2, $3, $4, $5, $6, 0, 0)
       returning *`,
      [
        channel.id,
        body.title.trim(),
        body.description ?? null,
        body.thumbnail_url ?? null,
        body.video_url ?? null,
        body.status === "offline" ? "offline" : "live",
      ],
    )

    // Notify followers when a stream goes live (fire-and-forget, non-blocking)
    if (stream.status === "live") {
      ;(async () => {
        try {
          const followers = await query(
            `select follower_id from follows where channel_id = $1`,
            [channel.id],
          )
          await Promise.all(followers.map((f) =>
            createNotification({
              userId: f.follower_id,
              actorId: request.user.id,
              type: "live",
              stream_id: stream.id,
            }).catch((_) => {
              /* individual notification failures are non-fatal */
            }),
          ))
        } catch (_) {
          request.log.warn({ err: _ }, "Failed to create live notifications")
        }
      })()
    }

    return reply.code(201).send(stream)
  }))

  // Edit stream metadata (title / description). Owner-only.
  fastify.patch("/streams/:id", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const body = request.body ?? {}
    const updates = []
    const params = [request.params.id, request.user.id]

    if (typeof body.title === "string" && body.title.trim()) {
      updates.push(`title = $${params.push(body.title.trim())}`)
    }
    if (typeof body.description === "string") {
      updates.push(`description = $${params.push(body.description)}`)
    }

    if (updates.length === 0) {
      throw badRequest("Nothing to update")
    }

    const stream = await queryOne(
      `update streams s
         set ${updates.join(", ")}
       from channels c
       where s.channel_id = c.id
         and s.id = $1
         and c.creator_id = $2
       returning s.*`,
      params,
    )
    if (!stream) throw unauthorized("You can only edit your own streams", "NOT_OWNER")
    return reply.send(stream)
  }))

  // Best-effort view counter used by the stream player.
  fastify.post("/streams/:id/view", route(async (request, reply) => {
    const updated = await queryOne(
      `update streams
          set views_count = coalesce(views_count, 0) + 1
        where id = $1
        returning id, views_count`,
      [request.params.id],
    )
    if (!updated) throw notFound("Stream not found")
    return reply.send(updated)
  }))

  fastify.delete("/streams/:id", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const stream = await queryOne(
      `delete from streams s
        using channels c
        where s.channel_id = c.id
          and s.id = $1
          and c.creator_id = $2
        returning s.id`,
      [request.params.id, request.user.id],
    )
    if (!stream) throw unauthorized("You can only delete your own streams", "NOT_OWNER")
    return reply.send({ deleted: true, id: stream.id })
  }))
}
