-- 023 — Asal DOD per batch
--
-- KENAPA.
-- Mortalitas antar batch bisa timpang jauh (di farm Abdur per 26 Nov 2026:
-- #003 29,5%, #001 18,0%, #002 0%). Pertanyaan pertama yang masuk akal adalah
-- "DOD-nya dari penetasan mana?" — dan sampai sekarang aplikasi tidak bisa
-- menjawabnya, karena asal DOD tidak pernah disimpan.
--
-- Kolom ini membuat pertanyaan itu bisa dijawab setelah beberapa batch, tanpa
-- memaksa apa pun sekarang: boleh dikosongkan, dan batch lama tetap NULL.
-- Disetujui Abdur 26 Nov 2026.

ALTER TABLE cycle ADD COLUMN IF NOT EXISTS dod_source text;

-- Bersihkan spasi di ujung dan tolak teks yang kepanjangan, supaya satu penjual
-- yang sama tidak terpecah jadi beberapa baris di rekap hanya karena beda spasi.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cycle_dod_source_wajar') THEN
    ALTER TABLE cycle ADD CONSTRAINT cycle_dod_source_wajar
      CHECK (dod_source IS NULL OR (length(dod_source) BETWEEN 1 AND 120
             AND dod_source = btrim(dod_source)));
  END IF;
END $$;

COMMENT ON COLUMN cycle.dod_source IS
  'Nama penetasan/penjual DOD batch ini. Boleh NULL. Dipakai untuk mengelompokkan mortalitas dan FCR per penjual.';

/* Rekap hasil per penjual DOD.
   Hanya menghitung batch yang asal DOD-nya diisi; batch tanpa asal tidak
   dikelompokkan dan tidak boleh ikut mempengaruhi rata-rata penjual mana pun.
   Mortalitas dan FCR diambil apa adanya dari v_cycle_summary — view ini tidak
   menghitung ulang apa pun, hanya mengelompokkan. */
CREATE OR REPLACE VIEW v_asal_dod AS
SELECT
  c.farm_id,
  c.dod_source                                   AS penjual,
  COUNT(*)::int                                  AS jumlah_batch,
  SUM(c.dod_qty)::int                            AS dod_total,
  -- rata-rata mortalitas ditimbang jumlah DOD, bukan rata-rata sederhana:
  -- batch 1.000 ekor tidak boleh sebobot batch 100 ekor
  CASE WHEN SUM(c.dod_qty) > 0
       THEN ROUND(SUM(COALESCE(s.deaths, 0))::numeric / SUM(c.dod_qty) * 100, 2)
  END                                            AS mortalitas_pct,
  ROUND(AVG(s.fcr_final) FILTER (WHERE s.fcr_final IS NOT NULL), 3) AS fcr_rata,
  MIN(c.dod_date)                                AS dod_pertama,
  MAX(c.dod_date)                                AS dod_terakhir
FROM cycle c
LEFT JOIN v_cycle_summary s ON s.cycle_id = c.id
WHERE c.dod_source IS NOT NULL
GROUP BY c.farm_id, c.dod_source;

COMMENT ON VIEW v_asal_dod IS
  'Hasil per penjual DOD. Hanya batch yang asal DOD-nya diisi. Mortalitas ditimbang jumlah DOD.';
