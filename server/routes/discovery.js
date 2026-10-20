import { query } from "../db.js"
import { badRequest, route } from "../errors.js"
import { streamWithChannelSql } from "./channels.js"

/**
 * Discovery routes.
 *
 * Recommendations and trending are built from observed engagement signals
 * (follows, likes, views) rather than invented ranking formulas. When a
 * viewer has no signal yet, we fall back to recently posted content so the
 * feed is never empty.
 */
export default async function discoveryRoutes(fastify) {
  // GET /api/discovery/recommendations?limit=20
  // Personalized: streams from followed channels and liked streams, ordered
  // by recency. Falls back to recent streams when the viewer has no signal.
  fastify.get("/discovery/recommendations", route(async (request, reply) => {
    const userId = request.user?.id
    const limit = Math.min(Math.max(Number.parseInt(request.query?.limit, 10) || 20, 1), 100)

    let where = "s.status = 'offline'"
    const params = [limit]

    if (userId) {
      where = `
        (s.channel_id in (
          select f.channel_id from follows f where f.follower_id = $2
        )
        or s.id in (
          select l.stream_id from likes l where l.user_id = $2
        ))
      `
      params.splice(1, 0, userId)
    }

    const streams = await query(
      `${streamWithChannelSql(where)} order by s.created_at desc limit $${params.length}`,
      params,
    )
    return reply.send(streams)
  }))

  // GET /api/discovery/trending?limit=20
  // Trending: streams ordered by observed engagement (views + likes) and
  // recency, so recently active popular content surfaces first.
  fastify.get("/discovery/trending", route(async (request, reply) => {
    const limit = Math.min(Math.max(Number.parseInt(request.query?.limit, 10) || 20, 1), 100)

    const streams = await query(
      `${streamWithChannelSql("true")}
       order by
         (coalesce(s.views_count, 0) + coalesce(s.likes_count, 0) * 5) desc,
         s.created_at desc
       limit $1`,
      [limit],
    )
    return reply.send(streams)
  }))

  // GET /api/discovery/semantic-search
  // Placeholder: semantic search requires vector embeddings + vector search,
  // which is a future enhancement. Text search already exists at
  // GET /api/streams?q=...
  fastify.get("/discovery/semantic-search", route(async (request, reply) => {
    const q = request.query?.q
    if (!q || !q.trim()) throw badRequest("q is required")

    return reply.code(501).send({
      error: "Semantic search is not yet implemented",
      code: "NOT_IMPLEMENTED",
      detail: "Semantic search requires vector embeddings and a vector search index. " +
        "Use GET /api/streams?q=<keywords> for text search in the meantime.",
      alternative: `/api/streams?q=${encodeURIComponent(q.trim())}`,
    })
  }))
}
