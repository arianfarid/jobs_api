import Fastify from 'fastify'

const server = Fastify({
    logger: true
})

server.get('/', async function handler(req, reply) {
    return { test: true }
})

try {
  await server.listen({ port: 3000, host: '0.0.0.0' })
} catch (err) {
  server.log.error(err)
  process.exit(1)
}