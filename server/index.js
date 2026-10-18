import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import Fastify from "fastify"
import cors from "@fastify/cors"
import jwt from "@fastify/jwt"
import fastifyStatic from "@fastify/static"

import { config, assertRuntimeEnv } from "./env.js"
import { HttpError } from "./errors.js"
import registerRoutes from "./routes/index.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, "../dist")

export async function buildApp() {
  assertRuntimeEnv()

  const fastify = Fastify({
    logger: {
      level: config.nodeEnv === "production" ? "info" : "debug",
    },
    bodyLimit: 1_048_576, // 1 MB
  })

  const origins = config.corsOrigin === "*" ? true : config.corsOrigin.split(",").map((o) => o.trim())
  await fastify.register(cors, { origin: origins, credentials: false })

  await fastify.register(jwt, {
    secret: config.jwtSecret,
    sign: { expiresIn: config.jwtExpiresIn },
  })

  // Routes call `request.user.id`; the token stores it as `sub`.
  fastify.decorate("authenticate", async (request, reply) => {
    try {
      await request.jwtVerify()
      request.user = { ...request.user, id: request.user.sub }
    } catch {
      await reply.code(401).send({ error: "Authentication required", code: "UNAUTHENTICATED" })
    }
  })

  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({ error: error.message, code: error.code })
    }

    if (error.validation) {
      return reply.code(400).send({ error: error.message, code: "BAD_REQUEST" })
    }

    const statusCode = Number(error.statusCode) || 500
    if (statusCode >= 500) request.log.error(error)
    else request.log.warn(error.message)

    return reply.code(statusCode).send({
      error: statusCode >= 500 ? "Internal server error" : error.message,
      code: error.code || "ERROR",
    })
  })

  await fastify.register(registerRoutes, { prefix: "/api" })

  // Serve the built SPA in production.
  if (existsSync(distDir)) {
    await fastify.register(fastifyStatic, {
      root: distDir,
      prefix: "/",
      index: ["index.html"],
    })

    fastify.setNotFoundHandler((request, reply) => {
      if (request.raw.url?.startsWith("/api")) {
        return reply.code(404).send({ error: "Not found", code: "NOT_FOUND" })
      }
      return reply.sendFile("index.html")
    })
  } else {
    fastify.setNotFoundHandler((request, reply) =>
      reply.code(404).send({ error: "Not found", code: "NOT_FOUND" }),
    )
  }

  return fastify
}

const isDirectRun =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url

if (isDirectRun) {
  const app = await buildApp()
  try {
    await app.listen({ port: config.port, host: "0.0.0.0" })
    if (!existsSync(distDir)) {
      app.log.warn("dist/ not found — run `pnpm build` before `pnpm start` to serve the frontend")
    }
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}
