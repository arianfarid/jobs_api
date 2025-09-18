

# Jobs API

A small Fastify + Postgres API demonstrating job creation with idempotency keys.  


## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development outside Docker)

### Run With Docker
First, copy the local .env file
```bash
cp .env.example .env
```

```bash
docker compose up --build
```
Once running, the API is available at http://localhost:3000/
## Docs

Once running, the API docs are available at http://localhost:3000/docs

## Demo

A small script is provided that will:

- Create a job with an auto-generated idempotency key
- Fetch it back by ID
- List all jobs

To run the demo:

```bash
yarn demo
```

## Example Api Requests

### Create A Job (No Idempotency Key)
```bash
curl -i -X POST localhost:3000/jobs \
  -H 'Content-Type: application/json' \
  -d '{"payload":{"task":"demo"}}'
```

### Create A Job (With Idempotency Key)
```bash
curl -i -X POST localhost:3000/jobs \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: demo-123' \
  -d '{"payload":{"task":"demo"}}'
```

### Fetch All Jobs
```bash
curl -i localhost:3000/jobs
```

### Fetch A Job By Id
```bash
curl -i localhost:3000/jobs/<uuid>
```

## Sdk Usage

The included SDK provides a simple wrapper around the Jobs API.

### Create Job

```javascript
const client = new JobsClient();
const result = await client.createJob({ task: "demo" })
```

### Fetch Job

```javascript
const client = new JobsClient();
const result = await client.getJob('example_id')
```

### Fetch All Jobs

```javascript
const client = new JobsClient();
const results = await client.listJobs()
```
