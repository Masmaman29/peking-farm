-- 025 — Target kematian per kandang
--
-- KENAPA.
-- Sebelum ini target mortalitas hanya satu angka untuk seluruh farm. Padahal
-- tiap kandang beda: kandang lama beda dari kandang baru, kandang yang sering
-- dipakai brooding beda dari kandang pembesaran. Satu angka untuk semuanya
-- membuat kandang bagus terlihat biasa saja dan kandang bermasalah tidak
-- pernah kelihatan menonjol. Diminta Abdur 27 Nov 2026.
--
-- Boleh dikosongkan. Kandang yang tidak diisi memakai target farm, jadi tidak
-- ada yang berubah sampai Abdur sendiri mengisi angkanya.

ALTER TABLE barn ADD COLUMN IF NOT EXISTS target_mort_pct numeric(5,2);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'barn_target_mort_wajar') THEN
    ALTER TABLE barn ADD CONSTRAINT barn_target_mort_wajar
      CHECK (target_mort_pct IS NULL OR (target_mort_pct > 0 AND target_mort_pct <= 100));
  END IF;
END $$;

COMMENT ON COLUMN barn.target_mort_pct IS
  'Target mortalitas khusus kandang ini, dalam persen terhadap DOD masuk. NULL = ikut target farm. Hanya untuk yang mati sendiri; afkir tidak dihitung (lihat migrasi 024).';

/* Mortalitas tiap kandang pada batch yang sedang berjalan, lengkap dengan
   target yang berlaku untuk kandang itu dan dari mana target itu berasal.
   Urutan target: batch -> kandang -> farm. Yang paling khusus menang, dan
   kolom target_dari membuat layar bisa menyebut sumbernya, supaya Abdur tidak
   pernah bingung angka mana yang sedang dipakai menilai. */
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
  COALESCE(c.target_mort_pct, b.target_mort_pct,
           (SELECT (value #>> '{}')::numeric FROM master_config
             WHERE key = 'target_mortalitas_pct'))                  AS target_pct,
  CASE WHEN c.target_mort_pct IS NOT NULL THEN 'batch'
       WHEN b.target_mort_pct IS NOT NULL THEN 'kandang'
       ELSE 'farm' END                                              AS target_dari
FROM barn b
JOIN v_batch_aktif v ON v.barn_code = b.code
JOIN cycle c         ON c.id = v.cycle_id
LEFT JOIN (
  SELECT barn_id, SUM(qty)::int AS dod FROM population_tx
   WHERE type = 'DOD_IN' GROUP BY barn_id) d ON d.barn_id = b.id
LEFT JOIN (
  SELECT barn_id,
         SUM(qty) FILTER (WHERE kind = 'MATI')::int  AS mati,
         SUM(qty) FILTER (WHERE kind = 'AFKIR')::int AS afkir
    FROM mortality WHERE deleted_at IS NULL AND status <> 'SUPERSEDED'
   GROUP BY barn_id) m ON m.barn_id = b.id
WHERE b.is_active;

COMMENT ON VIEW v_target_mati_kandang IS
  'Mortalitas per kandang berjalan vs target yang berlaku. target_dari menyebut asal target: batch, kandang, atau farm.';

-- ---------------------------------------------------------------------------
-- Tambahan, ketahuan saat menguji: cycle.target_mort_pct NOT NULL dan diisi
-- OTOMATIS dari target farm saat batch dibuat (actions.js CYCLE_CREATE).
-- Artinya setiap batch selalu "punya target", padahal itu cuma salinan — bukan
-- pilihan sadar pemilik. Kalau target batch diperlakukan sebagai yang paling
-- khusus, target kandang tidak akan pernah terpakai sama sekali.
--
-- Kolom ini membedakan keduanya: true hanya kalau angkanya BENAR-BENAR diisi
-- orang, bukan disalin. Urutan jadi: target batch yang diisi sendiri ->
-- target kandang -> target farm. Batch lama semuanya false, karena tidak ada
-- cara mengetahui mana yang dulu diisi sengaja — dan menebaknya berarti
-- mengarang maksud pemilik.
ALTER TABLE cycle ADD COLUMN IF NOT EXISTS target_mort_manual boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN cycle.target_mort_manual IS
  'true = target_mort_pct diisi sendiri oleh pengguna untuk batch ini. false = disalin otomatis dari target farm saat batch dibuat.';

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
LEFT JOIN (
  SELECT barn_id, SUM(qty)::int AS dod FROM population_tx
   WHERE type = 'DOD_IN' GROUP BY barn_id) d ON d.barn_id = b.id
LEFT JOIN (
  SELECT barn_id,
         SUM(qty) FILTER (WHERE kind = 'MATI')::int  AS mati,
         SUM(qty) FILTER (WHERE kind = 'AFKIR')::int AS afkir
    FROM mortality WHERE deleted_at IS NULL AND status <> 'SUPERSEDED'
   GROUP BY barn_id) m ON m.barn_id = b.id
WHERE b.is_active;
