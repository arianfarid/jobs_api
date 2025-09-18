import { randomUUID } from "crypto"

/**
 * @typedef {Object} Job
 * @property {string} id - UUID of the job.
 * @property {"queued"|"running"|"succeeded"|"failed"|"canceled"} status - Current status.
 * @property {Object} payload - Original payload submitted by the client.
 * @property {Object|null} result - Result data if the job succeeded.
 * @property {Object|null} error - Error details if the job failed.
 * @property {string} created_at - ISO timestamp when the job was created.
 * @property {string|null} updated_at - ISO timestamp of last update.
 * @property {string|null} finished_at - ISO timestamp when the job finished.
 */


/**
 * Jobs Client.
 * Minimal SDK for interacting with Jobs API.
 */
export class JobsClient {
  /**
   * @param {string} baseUrl Base URL of the Jobs API. Default: "http://localhost:3000"
   */
    constructor(baseUrl = "http://localhost:3000") {
    this.baseUrl = baseUrl
  }

  /**
   * Helper function to generate uuids.
   * 
   * @returns {string} UUID v4. Used for generating a unique idempotency key.
   */
  generateKey() {
    return randomUUID()
  }

  /**
   * Helper function to process Fetch API responses.
   * 
   * @param {Response} res Fetch API response object. 
   * @returns {Promise<any>} Parsed response body.
   * @throws {Error & {status:number, problem:object}} On non 2xx responses.
   */
  async handleResponse(res) {
    const data = await res.json()
    if (!res.ok) {
      const err = new Error(data.detail || "API Error")
      err.status = res.status
      err.problem = data
      throw err
    }
    return data
  }

  /**
   * Create a new Job.
   * 
   * @param {object} payload Job payload.
   * @param {object} [opts] Optional parameters
   * @param {string} [opts.idempotencyKey] Optional idempotency key. If not supplied, one is automatically generated. 
   * @returns {Promise<Job>} The created Job object.
   */
  async createJob(payload, { idempotencyKey } = {}) {
    const headers = { "Content-Type": "application/json" }
    if (idempotencyKey || (idempotencyKey = this.generateKey())) {
      headers["Idempotency-Key"] = idempotencyKey
    }
    const res = await fetch(`${this.baseUrl}/jobs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ payload }),
    })
    return await this.handleResponse(res)
  }

  /**
   * Fetch a job by ID.
   *
   * @param {string} id - Job UUID.
   * @returns {Promise<Job>} Job object if found.
   * @throws {Error & {status:number, problem:object}} 404 if not found.
   */
  async getJob(id) {
    const res = await fetch(`${this.baseUrl}/jobs/${id}`)
    return await this.handleResponse(res)
  }

  /**
   * List all jobs.
   *
   * @returns {Promise<Job[]>} Array of Job objects.
   */
  async listJobs() {
    const res = await fetch(`${this.baseUrl}/jobs`)
    return await this.handleResponse(res)
  }
}
