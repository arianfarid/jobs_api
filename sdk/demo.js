import { JobsClient } from "../sdk/index.js";

const client = new JobsClient("http://localhost:3000");

async function run() {
  try {
    // Create a job (with auto-generated idempotency key)
    const job = await client.createJob({ task: "demo" });
    console.log("Created:", job);

    // Fetch it back
    const fetched = await client.getJob(job.id);
    console.log("Fetched:", fetched);

    // List all jobs
    const list = await client.listJobs();
    console.log("List:", list);
  } catch (err) {
    console.error("Error:", err.status, err.problem);
  }
}

run();