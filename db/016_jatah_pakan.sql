-- 016 — Jatah pakan per kandang, pagi & sore, jadwal timbang.
--
-- Keputusan CEO (18 Nov 2026): kerjakan sesuai mockup. Kebutuhan pakan tiap
-- kandang dihitung dari umur dan jumlah bebek kandang itu sendiri, dibagi dua
-- (pagi & sore), dan bobot ditimbang tiap 3 hari.

-- Jatah gram/ekor/hari per rentang umur, milik tiap batch (kandang).
-- NULL = batch memakai pakem farm.
ALTER TABLE cycle ADD COLUMN IF NOT EXISTS feed_plan jsonb;

-- Sesi pemberian pakan.
ALTER TABLE feed_transaction ADD COLUMN IF NOT EXISTS sesi text;

-- Pakem farm: angka dari mockup yang disetujui dipakai sebagai titik awal.
-- updated_by NULL = belum disahkan pemilik; aplikasi menandainya BAWAAN.
INSERT INTO master_config(key, value, description) VALUES
 ('pakem_pakan', '[[1,7,25],[8,14,60],[15,21,105],[22,28,145],[29,999,185]]', 'Pakem jatah pakan: [umur dari, umur sampai, gram/ekor/hari]')
ON CONFLICT (key) DO NOTHING;

INSERT INTO master_config(key, value, description) VALUES
 ('jadwal_timbang_hari', '3', 'Timbang sampel bobot tiap berapa hari')
ON CONFLICT (key) DO NOTHING;
