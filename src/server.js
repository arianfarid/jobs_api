import Fastify from "fastify"
import { query } from "./db.js"
import jobsRoutes from "./routes/jobs.js"
import fastifySwagger from "@fastify/swagger"
import fastifySwaggerUI from "@fastify/swagger-ui"

const server = Fastify({
  logger: true,
})

await server.register(fastifySwagger, {
  openapi: {
    info: {
      title: "IonQ Sample API",
      description: "A small API demonstrating jobs + idempotency keys",
      version: "1.0.0",
    },
  },
})

await server.register(fastifySwaggerUI, {
  routePrefix: "/docs", // Swagger UI at http://localhost:3000/docs
  staticCSP: true,
})

server.get("/", async function handler(req, reply) {
  return { test: true }
})

server.register(jobsRoutes)

const start = async () => {
  try {
    await server.listen({ port: 3000, host: "0.0.0.0" })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
