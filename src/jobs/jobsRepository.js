export const jobsRepository = (client) => {
  const findById = async (jobId) => {
    return await client.query(
      `SELECT jobs.*, job_statuses.status FROM jobs
            JOIN job_statuses on job_statuses.id = jobs.job_status_id
                WHERE jobs.id = $1`,
      [jobId]
    )
  }

  const findByKey = async (key) => {
    return await client.query(
      `SELECT jobs.*, job_statuses.status FROM jobs
            JOIN job_statuses on job_statuses.id = jobs.job_status_id
                WHERE idempotency_key = $1`,
      [key]
    )
  }

  const insertJob = async (key, jobStatusId, payload) => {
    return await client.query(
      `INSERT INTO jobs (idempotency_key, job_status_id, payload)
            VALUES ($1, $2, $3)
            ON CONFLICT (idempotency_key) 
            DO NOTHING
            RETURNING id;`,
      [key, jobStatusId, payload]
    )
  }
  const insertJobNoKey = async (jobStatusId, payload) => {
    return await client.query(
      `INSERT INTO jobs (job_status_id, payload)
            VALUES ($1, $2)
            RETURNING id
            `,
      [jobStatusId, payload]
    )
  }

  return {
    findById,
    findByKey,
    insertJob,
    insertJobNoKey,
  }
}
