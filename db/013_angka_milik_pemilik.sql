-- 013 — Semua angka harus milik pemilik farm, bukan angka bawaan.
--
-- Aturan dari CEO: tidak ada angka dari pihak lain. Situasi tiap kandang beda.
-- Cara menandainya: master_config.updated_by.
--   NULL  = belum pernah disetel orang  -> angka BAWAAN, tidak boleh dipercaya
--   terisi = disetel pemilik             -> angka milik farm
-- Kolomnya sudah ada sejak awal, jadi tidak perlu tabel baru.

-- 1. Dua angka yang sudah mati. Sejak harga DOD dan pakan diketik dari nota,
--    kedua config ini tidak dipakai menghitung apa pun. Dibuang supaya tidak
--    ada yang menyangka masih berlaku.
DELETE FROM master_config WHERE key IN ('harga_dod', 'harga_pakan_kg');

-- 2. Harga bawaan per jenis pakan juga tidak pernah dibaca kode.
--    Harga pakan yang benar diambil dari rata-rata tertimbang nota pembelian.
ALTER TABLE feed DROP COLUMN IF EXISTS default_price;

-- 3. Bobot DOD saat masuk dipisah jadi angka sendiri.
--    Sebelumnya diambil dari titik pertama kurva target, jadi tersembunyi —
--    padahal angka ini ikut menentukan FCR.
INSERT INTO master_config(key, value, description) VALUES
 ('bobot_dod_kg', '0', 'Bobot rata-rata DOD saat masuk kandang (kg/ekor) — ditimbang sendiri atau dari nota')
ON CONFLICT (key) DO NOTHING;

-- 3b. Target FCR juga dulu dipaku di dalam kode (2,0) tanpa bisa diubah.
INSERT INTO master_config(key, value, description) VALUES
 ('target_fcr', '0', 'Target FCR farm — dipakai menilai skor kesehatan batch')
ON CONFLICT (key) DO NOTHING;

-- 4. Kurva target bobot: kosongkan angka bawaan.
--    Kurva lama ([35 hari = 1,40 kg]) tidak cocok dengan target 1,8–2,0 kg,
--    jadi aplikasi akan bilang "sesuai target" padahal jauh di bawah.
--    Lebih baik kosong dan aplikasi diam, daripada terisi dan menyesatkan.
UPDATE master_config SET value = '[]'::jsonb, updated_by = NULL, updated_at = now()
 WHERE key = 'kurva_target_bobot' AND updated_by IS NULL;

-- 5. Catatan untuk kolom yang sudah ada, supaya jelas di Pengaturan.
UPDATE master_config SET description = 'Kematian per hari yang memicu peringatan (ekor)'        WHERE key = 'batas_mortalitas_harian';
UPDATE master_config SET description = 'Deviasi konsumsi pakan vs rata-rata 7 hari (%)'         WHERE key = 'batas_deviasi_pakan_pct';
UPDATE master_config SET description = 'Selisih opname stok pakan yang memicu verifikasi (kg)'  WHERE key = 'batas_selisih_opname_kg';
UPDATE master_config SET description = 'Jam kerja kandang — input di luar jam ini ditandai'     WHERE key = 'jam_kerja';
UPDATE master_config SET description = 'Nominal yang butuh persetujuan OWNER (Rp)'              WHERE key = 'ambang_approval_rp';
UPDATE master_config SET description = 'Kurva target bobot per umur — diisi pemilik farm'       WHERE key = 'kurva_target_bobot';
