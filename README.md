

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
## Future Notes
Idempotency request hash: Store a hash of the request body with the idempotency key. Mismatched payload request hashes should return `409 Conflict` to prevent accidental misuse.
Additional endpoints (TODO!): Add GET /jobs and GET /jobs/:id for retrieval.
SDK support (TODO!): Provide a small client library that automatically generates idempotency keys and handles retries.
