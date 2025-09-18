

# IonQ Sample API

A small Fastify + Postgres API demonstrating job creation with idempotency keys.  
Built as a code sample.

## Getting Started
(TODO!)

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development outside Docker)

### Run with Docker

```bash
docker compose up --build
```

## Example API Requests

### Create a job (no idempotency key)
```bash
curl -i -X POST localhost:3000/jobs \
  -H 'Content-Type: application/json' \
  -d '{"payload":{"task":"demo"}}'
```

### Create a job (with idempotency key)
```bash
curl -i -X POST localhost:3000/jobs \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: demo-123' \
  -d '{"payload":{"task":"demo"}}'
```


## Future Notes
Idempotency request hash: Store a hash of the request body with the idempotency key. Mismatched payload request hashes should return `409 Conflict` to prevent accidental misuse.
Additional endpoints (TODO!): Add GET /jobs and GET /jobs/:id for retrieval.
SDK support (TODO!): Provide a small client library that automatically generates idempotency keys and handles retries.
