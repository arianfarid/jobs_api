import { pool } from "../db.js"
import { jobsRepository } from "../jobs/jobsRepository.js"

/**
 * @typedef {Object} Job
 * @property {string} id UUID of the job.
 * @property {"queued"|"running"|"succeeded"|"failed"|"canceled"} status Current status.
 * @property {Object} payload Original payload submitted by the client.
 * @property {Object|null} result Result data if the job succeeded.
 * @property {Object|null} error Error details if the job failed.
 * @property {string} created_at ISO timestamp when the job was created.
 * @property {string|null} updated_at ISO timestamp of last update.
 * @property {string|null} finished_at ISO timestamp when the job finished.
 */

/**
 * @typedef {Object} ProblemDetail
 * @property {string} title Short summary of the problem.
 * @property {number} status HTTP status code.
 * @property {string} detail Explanation specific to the occurrence.
 */

export const JOB_STATUS = {
  QUEUED: { ID: 1, STATUS: "queued" },
  RUNNING: { ID: 2, STATUS: "running" },
  SUCCEEDED: { ID: 3, STATUS: "succeeded" },
  FAILED: { ID: 4, STATUS: "failed" },
  CANCELED: { ID: 5, STATUS: "canceled" },
}

export default async function jobsRoutes(fastify, opts) {
  fastify.addSchema({
    $id: "Job",
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      status: {
        type: "string",
        enum: Object.values(JOB_STATUS).map((status) => status.STATUS),
      },
      payload: { type: "object" },
      result: { type: "object", nullable: true },
      error: { type: "object", nullable: true },
      created_at: { type: "string", format: "date-time" },
      updated_at: { type: "string", format: "date-time", nullable: true },
      finished_at: { type: "string", format: "date-time", nullable: true },
    },
    required: ["id", "status", "payload", "created_at"],
  })

  fastify.addSchema({
    $id: "JobList",
    type: "array",
    items: { $ref: "Job#" },
  })

  fastify.addSchema({
    $id: "ProblemDetail",
    type: "object",
    properties: {
      title: { type: "string" },
      status: { type: "integer" },
      detail: { type: "string" },
    },
    required: ["title", "status", "detail"],
  })

  /**
   * GET /jobs/:id
   * @returns {Promise<Job|ProblemDetail>}
   */
  fastify.get(
    "/jobs/:id",
    {
      schema: {
        description: "Fetch a job by ID",
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
        response: {
          200: { $ref: "Job#" },
          404: { $ref: "ProblemDetail#" },
          500: { $ref: "ProblemDetail#" },
        },
      },
    },
    async (request, reply) => {
      try {
        const client = await pool.connect()
        const repo = jobsRepository(client)
        const { id } = request.params
        const data = await repo.findById(id)
        if (data.rows.length === 0) {
          return reply
            .code(404)
            .type("application/problem+json")
            .send({
              title: "Not Found",
              status: 404,
              detail: `Job ${id} not found`,
            })
        }
        return reply.code(200).send(normalizeJob(data.rows[0]))
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
    }
  )

  /**
   * GET /jobs
   * @returns {Promise<Job[]|ProblemDetail>}
   */
  fastify.get(
    "/jobs",
    {
      schema: {
        description: "List all jobs",
        response: {
          200: { $ref: "JobList#" },
          500: { $ref: "ProblemDetail#" },
        },
      },
    },
    async (request, reply) => {
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
    }
  )

  /**
   * POST /jobs
   * @returns {Promise<Job|ProblemDetail>}
   */
  fastify.post(
    "/jobs",
    {
      schema: {
        description: "Create a new job",
        body: {
          type: "object",
          required: ["payload"],
          properties: {
            payload: { type: "object" },
          },
        },
        headers: {
          type: "object",
          properties: {
            "idempotency-key": { type: "string" },
          },
        },
        response: {
          201: { $ref: "Job#" },
          200: { $ref: "Job#" },
          422: { $ref: "ProblemDetail#" },
          500: { $ref: "ProblemDetail#" },
        },
      },
    },
    async (request, reply) => {
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
          const insert = await repo.insertJobNoKey(
            JOB_STATUS.QUEUED.ID,
            payload
          )

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
    }
  )
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
