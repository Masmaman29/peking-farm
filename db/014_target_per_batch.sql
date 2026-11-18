-- 014 — Target milik batch, bukan milik Pengaturan.
--
-- Koreksi dari CEO: bobot, pakan, dan harga bibit DOD selalu berubah tiap
-- batch. Kalau ditaruh di Pengaturan, pemilik harus bolak-balik menggantinya
-- setiap kali masuk DOD baru. Jadi semuanya diisi di form Batch Baru,
-- per kandang, kosong, diketik sendiri.
--
-- Tabel cycle memang sudah punya kolomnya sejak awal (dod_weight_kg,
-- target_days, target_weight_min/max, target_mort_pct). Yang salah adalah
-- nilai bawaannya dan frontend yang membaca Pengaturan.

-- 1. Buang nilai bawaan di tingkat kolom. Tidak boleh ada batch yang
--    diam-diam dapat 45 hari / 1,5-1,8 kg / DOD 0,055 kg.
ALTER TABLE cycle ALTER COLUMN dod_weight_kg     DROP DEFAULT;
ALTER TABLE cycle ALTER COLUMN target_days       DROP DEFAULT;
ALTER TABLE cycle ALTER COLUMN target_weight_min DROP DEFAULT;
ALTER TABLE cycle ALTER COLUMN target_weight_max DROP DEFAULT;
ALTER TABLE cycle ALTER COLUMN target_mort_pct   DROP DEFAULT;

-- 2. Bobot DOD boleh kosong: tidak semua peternak menimbang DOD saat datang.
--    Kalau kosong, garis target ditarik dari timbangan sampel pertama.
ALTER TABLE cycle ALTER COLUMN dod_weight_kg DROP NOT NULL;

-- 3. Angka-angka ini tidak lagi tinggal di Pengaturan, supaya tidak ada dua
--    sumber yang bisa berbeda. Yang berlaku adalah angka di batch.
DELETE FROM master_config WHERE key IN (
  'target_panen_hari',
  'target_bobot',
  'bobot_dod_kg',
  'target_fcr',
  'kurva_target_bobot'
);

-- 4. Yang TETAP di Pengaturan hanya aturan peringatan tingkat farm —
--    jarang berubah, dan tidak terikat satu batch.
UPDATE master_config SET description = 'Target mortalitas maksimum farm (%)'                   WHERE key = 'target_mortalitas_pct';
UPDATE master_config SET description = 'Minimum stok pakan yang harus tersedia (hari)'         WHERE key = 'min_stok_pakan_hari';
