import { queryOne, query } from "../db.js"
import { badRequest, route } from "../errors.js"

export default async function repostRoutes(fastify) {
  fastify.get("/reposts", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const reposts = await query(
      `select r.*, to_jsonb(s) as stream
         from reposts r
         left join streams s on s.id = r.stream_id
        where r.user_id = $1
        order by r.created_at desc`,
      [request.user.id],
    )
    return reply.send(reposts)
  }))

  fastify.post("/reposts", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const { stream_id: streamId, caption } = request.body ?? {}
    if (!streamId) throw badRequest("stream_id is required")

    const repost = await queryOne(
      `insert into reposts (stream_id, user_id, caption)
       values ($1, $2, $3)
       returning id, stream_id, user_id, caption, created_at`,
      [streamId, request.user.id, typeof caption === "string" ? caption : null],
    )

    return reply.code(201).send(repost)
  }))
}
