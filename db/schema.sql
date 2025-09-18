CREATE TABLE IF NOT EXISTS job_statuses (
    id SMALLINT PRIMARY KEY,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO job_statuses (id, status) VALUES
  (1,'queued'), (2,'running'), (3,'succeeded'), (4,'failed'), (5,'canceled')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_status_id INT NOT NULL REFERENCES job_statuses(id),
    payload JSONB NOT NULL,
    result JSONB NOT NULL,
    error JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_created_at ON jobs (job_status_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs (created_at DESC);

