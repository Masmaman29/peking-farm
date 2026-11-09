-- 006: jalur pemulihan password.
-- Sebelumnya tidak ada cara masuk kembali kalau Owner lupa password: tidak ada
-- reset lewat email, dan setup awal hanya hidup saat belum ada pengguna sama
-- sekali. Token dibuat dari konsol server (yang hanya bisa diakses pemilik VPS),
-- disimpan ter-hash, sekali pakai, dan kedaluwarsa.

CREATE TABLE IF NOT EXISTS password_reset (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES app_user(id),
  token_hash  text NOT NULL,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_hash_idx ON password_reset (token_hash);
