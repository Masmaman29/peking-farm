-- 018 — Pakan yang sudah dimakan dinilai dengan harga YANG BERLAKU SAAT ITU.
--
-- MASALAH YANG DIPERBAIKI (T-11).
-- Sampai migrasi 015, biaya pakan sebuah batch dihitung dengan v_harga_pakan_jenis:
-- satu harga rata-rata tertimbang dari SELURUH nota jenis pakan itu, tanpa
-- memandang tanggal. Akibatnya nota yang dibuat SETELAH pakannya dimakan tetap
-- ikut menilai ulang pakan yang sudah habis, sehingga biaya dan laba batch lama
-- bergeser setiap ada pembelian baru — termasuk batch yang sudah DITUTUP.
--
-- Terukur pada data uji: satu nota GROWER 1.500 kg @ Rp 6.800 menggeser biaya
-- batch #R032 dari Rp 11.799.040 menjadi Rp 12.686.080 (+7,5%) dan serentak
-- mengubah 131 batch. Batch berstatus CLOSED pun ikut berubah Rp 763.560 (7%).
--
-- SEKARANG: tiap baris pemakaian dinilai dengan rata-rata tertimbang nota yang
-- SUDAH ADA sampai tanggal pemakaian itu. Nota yang dibuat belakangan tidak
-- bisa lagi menyentuh biaya yang sudah terjadi.
--
-- Tidak ada tabel atau kolom yang diubah. Tidak ada satu pun baris transaksi
-- yang diubah. Hanya cara menghitungnya.
--
-- CATATAN KECEPATAN. Versi pertama perbaikan ini memakai fungsi yang dipanggil
-- sekali per baris pemakaian. Benar hasilnya, tapi memuat riwayat batch jadi
-- 26 detik karena tiap panggilan menghitung ulang seluruh riwayat nota.
-- Versi ini menghitung harga berlaku SEKALI untuk semua, lalu menyambungkannya
-- ke baris pemakaian lewat rentang tanggal.

-- Harga pakan PER JENIS yang berlaku pada rentang tanggal tertentu.
-- Satu baris per (jenis, tanggal nota): harga rata-rata tertimbang semua nota
-- jenis itu dari awal sampai tanggal tersebut, berlaku sampai nota berikutnya.
CREATE OR REPLACE VIEW v_harga_pakan_berlaku AS
WITH nota AS (
  SELECT f.type::text AS jenis, t.occurred_at,
         SUM(t.qty_kg * t.price_per_kg) AS nilai,
         SUM(t.qty_kg)                  AS kg
    FROM feed_transaction t
    JOIN feed f ON f.id = t.feed_id
   WHERE t.type = 'PURCHASE' AND t.status = 'APPROVED' AND t.deleted_at IS NULL
   GROUP BY f.type, t.occurred_at),
kum AS (
  SELECT jenis, occurred_at,
         SUM(nilai) OVER (PARTITION BY jenis ORDER BY occurred_at)
           / NULLIF(SUM(kg) OVER (PARTITION BY jenis ORDER BY occurred_at), 0) AS harga_kg
    FROM nota)
SELECT jenis,
       occurred_at AS dari,
       COALESCE(LEAD(occurred_at) OVER (PARTITION BY jenis ORDER BY occurred_at),
                'infinity'::timestamptz) AS sampai,
       harga_kg
  FROM kum;

-- Sama, tapi semua jenis digabung. Dipakai sebagai cadangan kalau jenis pakan
-- yang dikeluarkan belum pernah dibeli sampai tanggal pemakaian itu.
CREATE OR REPLACE VIEW v_harga_pakan_berlaku_semua AS
WITH nota AS (
  SELECT t.occurred_at,
         SUM(t.qty_kg * t.price_per_kg) AS nilai,
         SUM(t.qty_kg)                  AS kg
    FROM feed_transaction t
   WHERE t.type = 'PURCHASE' AND t.status = 'APPROVED' AND t.deleted_at IS NULL
   GROUP BY t.occurred_at),
kum AS (
  SELECT occurred_at,
         SUM(nilai) OVER (ORDER BY occurred_at)
           / NULLIF(SUM(kg) OVER (ORDER BY occurred_at), 0) AS harga_kg
    FROM nota)
SELECT occurred_at AS dari,
       COALESCE(LEAD(occurred_at) OVER (ORDER BY occurred_at),
                'infinity'::timestamptz) AS sampai,
       harga_kg
  FROM kum;

-- Biaya pakan per batch — SATU SUMBER.
-- Sebelumnya rumus ini ditulis dua kali: di v_cycle_cost dan di query "uang"
-- pada api/src/bootstrap.js. Keduanya sempat berbeda, sehingga rincian biaya
-- di layar tidak berjumlah sama dengan totalnya. Sekarang keduanya membaca
-- view ini.
--
-- Urutan cadangan harga, dari yang paling tepat:
--   1. harga jenis itu yang berlaku pada tanggal pakai
--   2. harga semua jenis yang berlaku pada tanggal pakai
--      (jenis itu belum pernah dibeli saat pakan dikeluarkan)
--   3. nota paling awal yang pernah ada
--      (pakan dipakai sebelum ada nota sama sekali; tanpa ini biayanya nol
--       dan batch terlihat lebih murah dari kenyataan)
CREATE OR REPLACE VIEW v_cycle_pakan AS
SELECT t.cycle_id,
       SUM(-t.qty_kg * COALESCE(hj.harga_kg, hs.harga_kg, aw.harga, 0)) AS biaya,
       SUM(-t.qty_kg)                                                   AS kg
  FROM feed_transaction t
  JOIN feed f ON f.id = t.feed_id
  LEFT JOIN v_harga_pakan_berlaku hj
         ON hj.jenis = f.type::text
        AND t.occurred_at >= hj.dari AND t.occurred_at < hj.sampai
  LEFT JOIN v_harga_pakan_berlaku_semua hs
         ON t.occurred_at >= hs.dari AND t.occurred_at < hs.sampai
  LEFT JOIN LATERAL (
        SELECT x.price_per_kg AS harga
          FROM feed_transaction x
         WHERE x.type = 'PURCHASE' AND x.status = 'APPROVED' AND x.deleted_at IS NULL
         ORDER BY x.occurred_at LIMIT 1) aw ON true
 WHERE t.type = 'USAGE'
   AND t.status IN ('RECORDED', 'APPROVED')
   AND t.deleted_at IS NULL
   AND t.cycle_id IS NOT NULL
 GROUP BY t.cycle_id;

-- Biaya batch = biaya disetujui + biaya pakan menurut harga saat dipakai.
CREATE OR REPLACE VIEW v_cycle_cost AS
SELECT c.id AS cycle_id,
       COALESCE(b.total, 0) + COALESCE(p.biaya, 0) AS running_cost
  FROM cycle c
  LEFT JOIN (
    SELECT cycle_id, SUM(amount) AS total
      FROM expense
     WHERE status = 'APPROVED' AND deleted_at IS NULL AND cycle_id IS NOT NULL
     GROUP BY cycle_id) b ON b.cycle_id = c.id
  LEFT JOIN v_cycle_pakan p ON p.cycle_id = c.id;

-- v_harga_pakan_jenis TIDAK dihapus: masih dipakai layar untuk menampilkan
-- harga rata-rata tiap jenis sampai hari ini, yang memang harus ikut nota
-- terbaru. Yang tidak boleh ikut berubah hanyalah biaya yang sudah terjadi.
