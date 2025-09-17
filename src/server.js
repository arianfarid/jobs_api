import Fastify from 'Fastify'

const server = Fastify({
    logger: true
})

server.get('/', async function handler(req, reply) {
    return { test: true }
})

try {
  await server.listen({ port: 3000 })
} catch (err) {
  server.log.error(err)
  process.exit(1)
}