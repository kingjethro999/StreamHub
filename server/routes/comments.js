import { query, queryOne } from "../db.js"
import { badRequest, route } from "../errors.js"

// Comments are returned with a `profiles` object so the existing UI keeps working:
//   comment.profiles.username / comment.profiles.avatar_url
const COMMENT_SELECT = `
  select c.id, c.stream_id, c.user_id, c.content, c.created_at,
         json_build_object('username', p.username, 'avatar_url', p.avatar_url) as profiles
    from comments c
    left join profiles p on p.id = c.user_id
`

export default async function commentRoutes(fastify) {
  fastify.get("/comments", route(async (request, reply) => {
    const streamId = request.query?.stream_id
    if (!streamId) throw badRequest("stream_id is required")

    const comments = await query(
      `${COMMENT_SELECT} where c.stream_id = $1 order by c.created_at desc`,
      [streamId],
    )
    return reply.send(comments)
  }))

  fastify.post("/comments", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const { stream_id: streamId, content } = request.body ?? {}
    if (!streamId) throw badRequest("stream_id is required")
    if (typeof content !== "string" || !content.trim()) throw badRequest("Comment content is required")

    const created = await queryOne(
      `insert into comments (stream_id, user_id, content)
       values ($1, $2, $3)
       returning id`,
      [streamId, request.user.id, content.trim()],
    )

    const comment = await queryOne(`${COMMENT_SELECT} where c.id = $1`, [created.id])
    return reply.code(201).send(comment)
  }))
}
