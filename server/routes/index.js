import authRoutes from "./auth.js"
import channelRoutes from "./channels.js"
import streamRoutes from "./streams.js"
import commentRoutes from "./comments.js"
import likeRoutes from "./likes.js"
import repostRoutes from "./reposts.js"
import followRoutes from "./follows.js"
import notifyRoutes from "./notify.js"
import notificationRoutes from "./notifications.js"
import aiRoutes from "./ai.js"
import discoveryRoutes from "./discovery.js"

export default async function registerRoutes(fastify) {
  fastify.get("/health", async () => ({ ok: true, uptime: process.uptime() }))

  await fastify.register(authRoutes)
  await fastify.register(channelRoutes)
  await fastify.register(streamRoutes)
  await fastify.register(commentRoutes)
  await fastify.register(likeRoutes)
  await fastify.register(repostRoutes)
  await fastify.register(followRoutes)
  await fastify.register(notifyRoutes)
  await fastify.register(notificationRoutes)
  await fastify.register(discoveryRoutes)
  await fastify.register(aiRoutes)
}
