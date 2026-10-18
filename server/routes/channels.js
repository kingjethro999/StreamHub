import { queryOne, query } from "../db.js"
import { notFound, badRequest, route } from "../errors.js"

const CHANNEL_COLUMNS = `
  id, creator_id, name, description, category, avatar_url, banner_url,
  handle, links, contact_email, followers_count, created_at
`

export function streamWithChannelSql(where = "true") {
  return `
    select s.*,
           to_jsonb(c) as channel,
           (select count(*) from comments cm where cm.stream_id = s.id)::int as comments_count
      from streams s
      left join channels c on c.id = s.channel_id
     where ${where}
  `
}

export default async function channelRoutes(fastify) {
  fastify.get("/channels/me", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const channel = await queryOne(
      `select ${CHANNEL_COLUMNS} from channels where creator_id = $1`,
      [request.user.id],
    )
    return reply.send({ channel })
  }))

  // Upsert: creates the channel on first publish, updates it afterwards.
  fastify.put("/channels/me", { preHandler: fastify.authenticate }, route(async (request, reply) => {
    const body = request.body ?? {}
    const userId = request.user.id

    const name = typeof body.name === "string" ? body.name.trim() : ""
    const handle = typeof body.handle === "string" ? body.handle.trim() : ""
    const links = Array.isArray(body.links) ? body.links.filter((l) => l && l.url) : []

    if (handle && !/^@[a-z0-9_.-]{1,30}$/i.test(handle)) {
      throw badRequest("Handle must start with @ and contain only letters, numbers, dots, dashes or underscores")
    }

    const channel = await queryOne(
      `insert into channels (creator_id, name, handle, description, avatar_url, banner_url, contact_email, links)
       values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       on conflict (creator_id) do update
          set name = excluded.name,
              handle = excluded.handle,
              description = excluded.description,
              avatar_url = excluded.avatar_url,
              banner_url = excluded.banner_url,
              contact_email = excluded.contact_email,
              links = excluded.links
       returning ${CHANNEL_COLUMNS}`,
      [
        userId,
        name || "My Channel",
        handle || null,
        body.description ?? null,
        body.avatar_url ?? null,
        body.banner_url ?? null,
        body.contact_email ?? null,
        JSON.stringify(links),
      ],
    )

    return reply.send({ channel })
  }))

  fastify.get("/channels/:id", route(async (request, reply) => {
    const channel = await queryOne(
      `select ${CHANNEL_COLUMNS} from channels where id = $1`,
      [request.params.id],
    )
    if (!channel) throw notFound("Channel not found")
    return reply.send({ channel })
  }))

  fastify.get("/channels/:id/streams", route(async (request, reply) => {
    const streams = await query(
      `${streamWithChannelSql("s.channel_id = $1")} order by s.created_at desc`,
      [request.params.id],
    )
    return reply.send(streams)
  }))
}
