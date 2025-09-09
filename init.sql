CREATE TABLE IF NOT EXISTS ping_results (
    id SERIAL PRIMARY KEY,
    ip VARCHAR(15) NOT NULL,
    name VARCHAR(100),
    reachable VARCHAR(100),
    rtt_ms REAL,
    ttl INTEGER,
    timestamp TIMESTAMP NOT NULL,
    error TEXT
);
