-- Additive migration: preserves all existing payment and customer records.
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS admin_sessions_expiry ON admin_sessions(expires_at);
CREATE TABLE IF NOT EXISTS request_limits (
  key TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS app_records (
  kind TEXT NOT NULL,
  id TEXT NOT NULL,
  data_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  request_hash TEXT,
  PRIMARY KEY(kind, id)
);
CREATE INDEX IF NOT EXISTS app_records_listing ON app_records(kind, deleted_at, updated_at);

