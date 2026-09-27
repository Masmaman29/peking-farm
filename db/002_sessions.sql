-- Sesi login (server-side), dipakai API
CREATE TABLE IF NOT EXISTS session (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES app_user(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen  timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  ip inet, user_agent text
);
CREATE INDEX IF NOT EXISTS ix_session_user ON session(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON session TO pf_app;

-- Nomor order berurutan, aman dari bentrok
CREATE SEQUENCE IF NOT EXISTS order_code_seq START 1;
GRANT USAGE, SELECT ON SEQUENCE order_code_seq TO pf_app;
