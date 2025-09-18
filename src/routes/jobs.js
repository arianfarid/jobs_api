import { pool } from "../db.js"
import { jobsRepository } from "../jobs/jobsRepository.js"

export const JOB_STATUS = {
  QUEUED: { ID: 1, STATUS: "queued" },
  RUNNING: { ID: 2, STATUS: "running" },
  SUCCEEDED: { ID: 3, STATUS: "succeeded" },
  FAILED: { ID: 4, STATUS: "failed" },
  CANCELED: { ID: 5, STATUS: "canceled" },
}

export default async function jobsRoutes(fastify, opts) {
    fastify.get("/jobs/:id", async (request, reply) => {
    try {
      const client = await pool.connect()
      const repo = jobsRepository(client)
      const { id } = request.params;
      const data = await repo.findById(id)
      const out = data.rows.map((row) => normalizeJob(row))
      return reply.code(200).send(out)
    } catch (err) {
      request.log.error({ err }, "failed to fetch jobs")
      return reply.code(500).type("application/problem+json").send({
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch jobs",
      })
    } finally {
      client.release()
    }
  })
  fastify.get("/jobs", async (request, reply) => {
    try {
      const client = await pool.connect()
      const repo = jobsRepository(client)
      const data = await repo.getAll()
      const out = data.rows.map((row) => normalizeJob(row))
      return reply.code(200).send(out)
    } catch (err) {
      request.log.error({ err }, "failed to fetch jobs")
      return reply.code(500).type("application/problem+json").send({
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to fetch jobs",
      })
    } finally {
      client.release()
    }
  })
  fastify.post("/jobs", async (request, reply) => {
    const idempotencyKey = request.headers["idempotency-key"]
    const payload = request.body?.payload

    // Validate contents
    if (!payload || typeof payload !== "object") {
      return reply.code(422).type("application/problem+json").send({
        title: "Invalid Payload",
        status: 422,
        detail: "Payload must be a JSON object",
      })
    }

    if (idempotencyKey && idempotencyKey.length > 200) {
      return reply.code(422).type("application/problem+json").send({
        title: "Invalid Idempotency-Key",
        status: 422,
        detail: "Idempotency-Key must be ≤ 200 characters",
      })
    }

    const client = await pool.connect()
    const repo = jobsRepository(client)
    try {
      await client.query("BEGIN")
      let row, statusCode

      if (idempotencyKey) {
        const insertJobResults = await repo.insertJob(
          idempotencyKey,
          JOB_STATUS.QUEUED.ID,
          payload
        )
        row = insertJobResults.rows[0]
        if (!row) {
          // Conflicting, grab by the idempotency_key
          const findByKeyResults = await repo.findByKey(idempotencyKey)
          row = findByKeyResults.rows[0]
          statusCode = 200
        } else {
          const findByIdResults = await repo.findById(row.id)
          row = findByIdResults.rows[0]
          statusCode = 201
        }
      } else {
        const insert = await repo.insertJobNoKey(JOB_STATUS.QUEUED.ID, payload)

        row = insert.rows[0]
        const findByIdResults = await repo.findById(row.id)
        row = findByIdResults.rows[0]
        statusCode = 201
      }
      await client.query("COMMIT")
      if (statusCode === 201) reply.header("Location", `/jobs/${row.id}`)
      return reply.code(statusCode).send(normalizeJob(row))
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {})
      request.log.error({ err }, "failed to create job")
      return reply.code(500).type("application/problem+json").send({
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to create job",
      })
    } finally {
      client.release()
    }
  })
}

/**
 * Normalizes the payload return.
 * @param {Object} r
 * @returns Object
 */
function normalizeJob(r) {
  return {
    id: r.id,
    status: r.status,
    payload: r.payload,
    result: r.result ?? null,
    error: r.error ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at ?? null,
    finished_at: r.finished_at ?? null,
  }
}

