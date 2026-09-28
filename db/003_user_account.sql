-- 003: kontak email untuk pengguna + catatan perubahan password.
-- Aman dijalankan berulang (IF NOT EXISTS).

ALTER TABLE app_user ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS app_user_email_uniq
  ON app_user (lower(email)) WHERE email IS NOT NULL;
