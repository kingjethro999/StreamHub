import { query } from "../db.js"
import { route } from "../errors.js"

/**
 * GET /api/metrics
 *
 * Public platform metrics — no authentication required.
 * All data covers from February 2026 onwards (the platform's launch window).
 */
export default async function metricsRoutes(fastify) {
  fastify.get("/metrics", route(async (request, reply) => {
    // Helper to run a single-row query.
    const qOne = async (text, params) => {
      const rows = await query(text, params)
      return rows[0] ?? null
    }
    // Helper to run a scalar query.
    const qVal = async (text, params) => {
      const row = await qOne(text, params)
      return row ? Number(Object.values(row)[0]) : 0
    }

    // Total users and the first user to join.
    const firstUser = await qOne(
      `select id, email, created_at
         from users
        order by created_at asc
        limit 1`,
      []
    )

    // Total users count.
    const totalUsers = await qVal(
      `select count(*)::int from users`,
      []
    )

    // Total streams (posts).
    const totalStreams = await qVal(
      `select count(*)::int from streams`,
      []
    )

    // Total comments and likes.
    const totalComments = await qVal(
      `select count(*)::int from comments`,
      []
    )
    const totalLikes = await qVal(
      `select count(*)::int from likes`,
      []
    )

    // Total follows.
    const totalFollows = await qVal(
      `select count(*)::int from follows`,
      []
    )

    // User registration over time (daily counts), Feb 2026 onwards.
    const usersOverTime = await query(
      `select to_char(created_at::date, 'YYYY-MM-DD') as date,
              count(*)::int as count
         from users
        where created_at >= '2026-02-01'
        group by 1
        order by 1`,
      []
    )

    // Streams published over time (daily counts), Feb 2026 onwards.
    const streamsOverTime = await query(
      `select to_char(created_at::date, 'YYYY-MM-DD') as date,
              count(*)::int as count
         from streams
        where created_at >= '2026-02-01'
        group by 1
        order by 1`,
      []
    )

    // Top 5 hashtags from the hashtags column.
    const topHashtags = await query(`
      select lower(tag) as hashtag, count(*)::int as count
        from streams,
             unnest(coalesce(hashtags, '{}')) as tag
       where created_at >= '2026-02-01'
         and array_length(hashtags, 1) > 0
       group by 1
       order by 2 desc
       limit 5
    `, [])

    // Channels (creators) count.
    const totalChannels = await qVal(
      `select count(*)::int from channels`,
      []
    )

    return reply.send({
      first_user: firstUser || null,
      total_users: totalUsers || 0,
      total_channels: totalChannels || 0,
      total_streams: totalStreams || 0,
      total_comments: totalComments || 0,
      total_likes: totalLikes || 0,
      total_follows: totalFollows || 0,
      users_over_time: usersOverTime || [],
      streams_over_time: streamsOverTime || [],
      top_hashtags: topHashtags || [],
    })
  }))
}
