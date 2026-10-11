-- Durable notification outbox. A payment and its notification are committed together.
CREATE TABLE IF NOT EXISTS order_email_notifications (
  order_id TEXT PRIMARY KEY REFERENCES stripe_orders(id),
  order_snapshot_json TEXT NOT NULL,
  is_test INTEGER NOT NULL CHECK (is_test IN (0, 1)),
  payment_intent_id TEXT,
  payload_json TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'blocked')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  lock_token TEXT,
  first_attempt_at INTEGER,
  created_at TEXT NOT NULL,
  sent_at TEXT,
  last_error TEXT
);
CREATE INDEX IF NOT EXISTS order_email_notifications_due
  ON order_email_notifications(status, next_attempt_at, locked_until);
