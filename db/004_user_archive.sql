-- 004: arsip pengguna. Baris yang masih dipakai riwayat tidak boleh hilang,
-- jadi disembunyikan dari daftar, bukan dihapus. Aman dijalankan berulang.

ALTER TABLE app_user ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Penghapusan permanen hanya mungkin untuk akun yang belum punya riwayat apa pun.
-- Sebelumnya enum audit sengaja tidak punya DELETE karena memang tidak ada yang
-- boleh dihapus; sekarang kasus itu ada, jadi aksinya ikut dicatat apa adanya.
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'DELETE';
