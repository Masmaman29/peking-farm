-- 026 — PERBAIKAN v_target_mati_kandang: hitungannya harus PER BATCH.
--
-- CACAT yang diperbaiki (ketahuan 27 Nov 2026 saat menguji lingkup halaman
-- Populasi & Mortalitas):
--   Di versi 025 subquery DOD dan kematian dikelompokkan HANYA per barn_id,
--   tanpa cycle_id. Akibatnya DOD satu kandang dijumlahkan dari SELURUH siklus
--   yang pernah mengisi kandang itu, lalu dibandingkan dengan kematian batch
--   yang sedang jalan. Satu contoh nyata dari data uji:
--
--     Kandang S3, batch #186 — tabel menulis DOD 5.910 ekor,
--     padahal DOD batch itu 10 ekor. 5.910 itu jumlah seluruh
--     siklus yang pernah lewat kandang tersebut.
--
--   Persentase mortalitas di tabel "Tiap kandang vs targetnya" karena itu jauh
--   lebih kecil dari yang sebenarnya, dan kolom "Keadaan" bisa menulis AMAN
--   untuk kandang yang sesungguhnya di atas target. Di kandang yang baru sekali
--   dipakai angkanya kebetulan benar, jadi cacatnya tidak terlihat.
--
-- Perbaikannya: kedua subquery dikelompokkan per (barn_id, cycle_id) dan
-- disambungkan ke batch yang sedang jalan di kandang itu. Satu baris tabel =
-- satu kandang pada satu batch, dan angkanya milik batch itu saja.

CREATE OR REPLACE VIEW v_target_mati_kandang AS
SELECT
  b.farm_id,
  b.code                                        AS barn_code,
  b.name                                        AS barn_name,
  c.code                                        AS cycle_code,
  v.population,
  COALESCE(d.dod, 0)::int                       AS dod,
  COALESCE(m.mati, 0)::int                      AS mati,
  COALESCE(m.afkir, 0)::int                     AS afkir,
  CASE WHEN COALESCE(d.dod,0) > 0
       THEN ROUND(COALESCE(m.mati,0)::numeric / d.dod * 100, 2) END AS mati_pct,
  COALESCE(CASE WHEN c.target_mort_manual THEN c.target_mort_pct END,
           b.target_mort_pct,
           (SELECT (value #>> '{}')::numeric FROM master_config
             WHERE key = 'target_mortalitas_pct'))                  AS target_pct,
  CASE WHEN c.target_mort_manual            THEN 'batch'
       WHEN b.target_mort_pct IS NOT NULL   THEN 'kandang'
       ELSE 'farm' END                                              AS target_dari
FROM barn b
JOIN v_batch_aktif v ON v.barn_code = b.code
JOIN cycle c         ON c.id = v.cycle_id
-- DOD batch ini di kandang ini — bukan seluruh riwayat kandang
LEFT JOIN (
  SELECT barn_id, cycle_id, SUM(qty)::int AS dod
    FROM population_tx WHERE type = 'DOD_IN'
   GROUP BY barn_id, cycle_id) d
  ON d.barn_id = b.id AND d.cycle_id = c.id
-- kematian batch ini di kandang ini, mati dan afkir dipisah (migrasi 024)
LEFT JOIN (
  SELECT barn_id, cycle_id,
         SUM(qty) FILTER (WHERE kind = 'MATI')::int  AS mati,
         SUM(qty) FILTER (WHERE kind = 'AFKIR')::int AS afkir
    FROM mortality WHERE deleted_at IS NULL AND status <> 'SUPERSEDED'
   GROUP BY barn_id, cycle_id) m
  ON m.barn_id = b.id AND m.cycle_id = c.id
WHERE b.is_active;

COMMENT ON VIEW v_target_mati_kandang IS
  'Satu baris = satu kandang pada satu batch yang sedang jalan. DOD, mati, dan afkir hanya milik batch itu (diperbaiki 026; versi 025 menjumlahkan seluruh riwayat kandang).';
