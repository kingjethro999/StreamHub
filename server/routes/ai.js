import { queryOne } from "../db.js"
import { notFound, badRequest, route } from "../errors.js"
import { nvidiaChatCompletions, nvidiaConfigured, nvidiaUnavailableReason } from "../lib/nvidia.js"

/**
 * AI video understanding routes.
 *
 * All NVIDIA API calls happen server-side. The NVIDIA_API_KEY is never exposed
 * to the browser. AI features degrade gracefully when the key is not configured
 * or the model cannot process the request.
 */
export default async function aiRoutes(fastify) {
  // POST /api/ai/video-summary
  // Summarise a video using a NVIDIA multimodal model, grounded in the actual
  // video content plus the stream's title/description as context.
  fastify.post(
    "/ai/video-summary",
    route(async (request, reply) => {
      const body = request.body ?? {}
      const streamId = body.stream_id

      if (typeof streamId !== "string" || !streamId) {
        throw badRequest("stream_id is required")
      }

      const stream = await queryOne(
        `select s.id, s.title, s.description, s.video_url,
                c.name as channel_name, c.handle as channel_handle
           from streams s
           left join channels c on c.id = s.channel_id
          where s.id = $1`,
        [streamId],
      )
      if (!stream) throw notFound("Stream not found")

      if (!stream.video_url) {
        throw badRequest("This stream has no video to analyse.")
      }

      if (!nvidiaConfigured()) {
        return reply.code(503).send({
          error: "AI features are not configured.",
          code: "AI_NOT_CONFIGURED",
          detail: nvidiaUnavailableReason(),
          fallback: {
            summary: null,
            topics: [],
            suggested_title: stream.title,
          },
        })
      }

      try {
        const data = await nvidiaChatCompletions({
          model: process.env.NVIDIA_VIDEO_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `You are a careful video-summarisation assistant. Watch the video at the URL below and
answer ONLY from what is visible/heard in the video. Do not invent events.

Context from the platform (may be imprecise — prefer the video):
- Title: ${stream.title}
- Description: ${stream.description ?? "(none)"}
- Channel: ${stream.channel_handle ?? stream.channel_name ?? "(unknown)"}

Please provide:
1. A one-sentence summary of what happens in the video.
2. 3-6 topic keywords relevant to the video.
3. A suggested, clearer title for the video (keep it short).

Return plain text, no markdown fences.`,
                },
                {
                  type: "image_url",
                  image_url: { url: stream.video_url },
                },
              ],
            },
          ],
          temperature: 0.3,
          topP: 1,
          maxTokens: 512,
          stream: false,
        })

        const choice = data.choices?.[0]
        const text = (choice?.message?.content || "").trim() || null

        return reply.send({
          stream_id: stream.id,
          summary: text,
          topics: [],
          suggested_title: stream.title,
          model: process.env.NVIDIA_VIDEO_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
        })
      } catch (err) {
        // Any failure (model doesn't accept video, network, rate limit, …) is
        // treated as a graceful degradation — the core platform keeps working.
        request.log.warn({ err }, "AI video summary failed")
        return reply.code(502).send({
          error: "AI video summary is temporarily unavailable.",
          code: "AI_UNAVAILABLE",
          detail: err.message,
          fallback: {
            summary: null,
            topics: [],
            suggested_title: stream.title,
          },
        })
      }
    }),
  )
}
