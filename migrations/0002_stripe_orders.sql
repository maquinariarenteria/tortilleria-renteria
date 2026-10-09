-- Isolated payment ledger; does not depend on legacy sales table column names.
CREATE TABLE IF NOT EXISTS stripe_orders (
  id TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  order_json TEXT NOT NULL,
  currency TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  amount_due INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  session_id TEXT UNIQUE,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  paid_at TEXT
);
CREATE INDEX IF NOT EXISTS stripe_orders_status ON stripe_orders(payment_status, created_at);
