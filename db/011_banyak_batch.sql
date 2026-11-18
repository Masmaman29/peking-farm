-- ---------------------------------------------------------------------
-- BANYAK BATCH AKTIF SEKALIGUS
-- Sebelumnya aplikasi menganggap hanya ada satu siklus aktif, jadi semua
-- input harian masuk ke siklus terbaru. Dengan pola panen bergilir (12 batch
-- jalan bersamaan), input harus mengikuti KANDANG-nya, bukan siklus terakhir.
--
-- Skema tidak berubah bentuk: population_tx sudah punya cycle_id DAN barn_id.
-- Yang ditambah di sini hanya indeks pencarian dan biaya tingkat farm.
-- ---------------------------------------------------------------------

-- Biaya umum farm (listrik, gaji, sewa) bukan milik satu batch.
-- NULL = biaya farm, bukan biaya batch tertentu.
ALTER TABLE expense ALTER COLUMN cycle_id DROP NOT NULL;

-- Pencarian "batch mana yang sedang mengisi kandang ini" dipakai di tiap input
CREATE INDEX IF NOT EXISTS ix_poptx_barn_cycle ON population_tx(barn_id, cycle_id);
CREATE INDEX IF NOT EXISTS ix_cycle_active ON cycle(status, dod_date) WHERE status='ACTIVE';

-- Satu baris per batch yang sedang berjalan, lengkap dengan kandang dan umurnya
CREATE OR REPLACE VIEW v_batch_aktif AS
SELECT c.id AS cycle_id, c.code, c.dod_date, c.dod_qty, c.dod_price, c.target_days, c.stage,
       v.barn_id, b.code AS barn_code, b.name AS barn_name,
       v.population,
       (CURRENT_DATE - c.dod_date) + 1 AS umur_hari,
       c.dod_date + c.target_days AS perkiraan_panen,
       (c.dod_date + c.target_days) - CURRENT_DATE AS sisa_hari
FROM cycle c
JOIN v_population v ON v.cycle_id = c.id
JOIN barn b ON b.id = v.barn_id
WHERE c.status = 'ACTIVE' AND v.population > 0;

-- ---------------------------------------------------------------------
-- BIAYA PAKAN PER BATCH
-- Pembelian pakan sekarang masuk stok farm (cycle_id NULL), jadi biayanya
-- tidak lagi otomatis menempel ke satu batch. Kalau dibiarkan, laba tiap
-- batch terlihat lebih besar dari aslinya.
--
-- Perbaikannya: biaya pakan dibebankan saat pakan DIPAKAI, bukan saat dibeli,
-- dinilai dengan harga rata-rata tertimbang dari seluruh pembelian. Ini cara
-- pembukuan persediaan yang lazim, dan membuat tiap batch menanggung pakan
-- yang benar-benar dimakannya.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_harga_pakan_rata AS
SELECT CASE WHEN SUM(qty_kg) > 0 THEN SUM(qty_kg * price_per_kg) / SUM(qty_kg) ELSE 0 END AS harga_kg
FROM feed_transaction
WHERE type='PURCHASE' AND status='APPROVED' AND deleted_at IS NULL;

CREATE OR REPLACE VIEW v_cycle_cost AS
SELECT c.id AS cycle_id,
       -- biaya yang memang ditempelkan ke batch ini
       COALESCE((SELECT SUM(amount) FROM expense e
                  WHERE e.cycle_id=c.id AND e.status='APPROVED' AND e.deleted_at IS NULL),0)
       -- pakan yang benar-benar dipakai batch ini, dinilai harga rata-rata
     + COALESCE((SELECT -SUM(t.qty_kg) FROM feed_transaction t
                  WHERE t.cycle_id=c.id AND t.type='USAGE'
                    AND t.status IN ('RECORDED','APPROVED') AND t.deleted_at IS NULL),0)
       * (SELECT harga_kg FROM v_harga_pakan_rata)
       AS running_cost
FROM cycle c;
