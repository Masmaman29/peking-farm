-- 027 — BERAT PER EKOR, supaya keseragaman bisa dihitung.
-- Diminta Abdur 28 Nov 2026.
--
-- MASALAHNYA. weight_record hanya menyimpan sample_n dan total_kg, jadi yang
-- bisa dihitung cuma rata-rata. Rata-rata 1,3 kg bisa berarti semua bebek
-- 1,3 kg, bisa juga separuh 0,9 kg dan separuh 1,7 kg — dua keadaan yang
-- harganya jauh berbeda, karena pembeli membayar mahal untuk ukuran seragam
-- dan yang kekecilan jatuh jadi afkir. Rata-ratanya sama persis di dua
-- keadaan itu, jadi tidak ada cara menebaknya dari data yang ada sekarang.
--
-- BUKAN mengubah yang lama. Baris timbang yang sudah ada tetap sah dan tetap
-- dipakai apa adanya; keseragamannya saja yang tidak diketahui, dan layar
-- menyebutkan itu alih-alih mengarang angka. Pencatatan "total saja" juga
-- tetap boleh untuk seterusnya — menimbang satu per satu menambah kerja anak
-- kandang, jadi itu pilihan Abdur per timbangan, bukan paksaan.
--
-- IKUT ATURAN YANG SUDAH ADA: sama seperti weight_record, baris sampel tidak
-- boleh diubah atau dihapus. Kalau salah, jalurnya koreksi, bukan sunting.

CREATE TABLE IF NOT EXISTS weight_sample (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id  uuid NOT NULL REFERENCES weight_record(id) ON DELETE RESTRICT,
  urut       int  NOT NULL CHECK (urut > 0),
  kg         numeric(8,3) NOT NULL CHECK (kg > 0 AND kg <= 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (record_id, urut)
);

CREATE INDEX IF NOT EXISTS ix_weight_sample_record ON weight_sample(record_id);

COMMENT ON TABLE weight_sample IS
  'Berat tiap ekor dalam satu timbangan. Kosong = timbangan itu dicatat sebagai total saja, keseragamannya tidak diketahui (bukan nol).';

-- Append-only, mengikuti weight_record
CREATE OR REPLACE FUNCTION trg_ws_nodel() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Sampel berat tidak boleh dihapus. Ajukan koreksi pada timbangannya.';
END $$;

CREATE OR REPLACE FUNCTION trg_ws_noupd() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Sampel berat tidak boleh diubah. Ajukan koreksi pada timbangannya.';
END $$;

DROP TRIGGER IF EXISTS ws_nodel ON weight_sample;
CREATE TRIGGER ws_nodel BEFORE DELETE ON weight_sample
  FOR EACH ROW EXECUTE FUNCTION trg_ws_nodel();

DROP TRIGGER IF EXISTS ws_noupd ON weight_sample;
CREATE TRIGGER ws_noupd BEFORE UPDATE ON weight_sample
  FOR EACH ROW EXECUTE FUNCTION trg_ws_noupd();

-- Ringkasan keseragaman per timbangan.
--   ragam_pct = simpangan baku / rata-rata x 100. Makin kecil makin seragam.
--   Hanya muncul untuk timbangan yang punya berat per ekor; yang dicatat
--   sebagai total saja tidak ikut di view ini sama sekali, supaya tidak ada
--   yang mengira keseragamannya nol.
CREATE OR REPLACE VIEW v_keseragaman AS
SELECT w.id                                   AS record_id,
       w.cycle_id, w.barn_id, w.occurred_at,
       count(s.id)::int                       AS n,
       ROUND(avg(s.kg), 3)                    AS rata,
       MIN(s.kg)                              AS paling_ringan,
       MAX(s.kg)                              AS paling_berat,
       CASE WHEN avg(s.kg) > 0
            THEN ROUND(stddev_samp(s.kg) / avg(s.kg) * 100, 2) END AS ragam_pct
  FROM weight_record w
  JOIN weight_sample s ON s.record_id = w.id
 WHERE w.deleted_at IS NULL AND w.status <> 'SUPERSEDED'
 GROUP BY w.id, w.cycle_id, w.barn_id, w.occurred_at
HAVING count(s.id) >= 2;

COMMENT ON VIEW v_keseragaman IS
  'Keseragaman tiap timbangan yang dicatat per ekor. Timbangan yang dicatat sebagai total saja tidak muncul di sini — keseragamannya tidak diketahui, bukan nol.';
