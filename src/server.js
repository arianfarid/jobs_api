import Fastify from 'fastify'
import { query } from './db.js'

const server = Fastify({
    logger: true
})

server.get('/', async function handler(req, reply) {
    return { test: true }
})

server.get('/db_test', async function handler(req, reply) {
    return query("SELECT NOW()")
})

const start = async () => {
    try {
        await server.listen({ port: 3000, host: '0.0.0.0' })
    } catch (err) {
        server.log.error(err)
        process.exit(1)
    }
}

start()