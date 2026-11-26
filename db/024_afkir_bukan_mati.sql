-- 024 — Afkir dibedakan dari mati
--
-- KENAPA.
-- Di farm Abdur per 26 Nov 2026, 299 dari 301 "kematian" siklus #003 sebabnya
-- "Lemah / kerdil". Bebek lemah biasanya DISINGKIRKAN sendiri oleh peternak,
-- bukan mati sakit. Dicampur jadi satu angka, mortalitas 29,5% tidak bisa
-- dipakai menilai apa pun: kandang sehat yang banyak afkir terlihat sama
-- buruknya dengan kandang yang kena wabah, dan sebaliknya wabah betulan bisa
-- tersamar di balik angka afkir.
--
-- Keduanya tetap mengurangi populasi dan tetap jadi kerugian; yang dipisah
-- hanya ARTINYA, supaya persentase mortalitas bisa dibaca.
--
-- DATA LAMA TIDAK DIUBAH. Semua baris yang sudah ada tetap MATI. Menebak mana
-- yang sebenarnya afkir berarti mengarang data peternak. Kalau Abdur mau
-- membetulkan baris lama, jalurnya lewat pengajuan koreksi seperti biasa.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mortality_kind') THEN
    CREATE TYPE mortality_kind AS ENUM ('MATI', 'AFKIR');
  END IF;
END $$;

ALTER TABLE mortality ADD COLUMN IF NOT EXISTS kind mortality_kind NOT NULL DEFAULT 'MATI';

COMMENT ON COLUMN mortality.kind IS
  'MATI = mati sendiri. AFKIR = sengaja disingkirkan peternak. Keduanya mengurangi populasi; dipisah supaya persentase mortalitas bisa dibaca. Baris sebelum migrasi 024 semuanya MATI dan tidak diubah.';

/* Ringkasan populasi per siklus, dipecah mati vs afkir.
   Tidak menghitung ulang apa pun yang sudah ada — hanya memecah angka yang
   selama ini digabung, supaya layar bisa menampilkan keduanya terpisah. */
CREATE OR REPLACE VIEW v_mortalitas_pisah AS
SELECT
  c.id                                                               AS cycle_id,
  c.code,
  c.dod_qty,
  COALESCE(SUM(m.qty) FILTER (WHERE m.kind = 'MATI'),  0)::int        AS mati,
  COALESCE(SUM(m.qty) FILTER (WHERE m.kind = 'AFKIR'), 0)::int        AS afkir,
  COALESCE(SUM(m.qty), 0)::int                                        AS total,
  CASE WHEN c.dod_qty > 0
       THEN ROUND(COALESCE(SUM(m.qty) FILTER (WHERE m.kind = 'MATI'), 0)::numeric
                  / c.dod_qty * 100, 2) END                           AS mati_pct,
  CASE WHEN c.dod_qty > 0
       THEN ROUND(COALESCE(SUM(m.qty) FILTER (WHERE m.kind = 'AFKIR'), 0)::numeric
                  / c.dod_qty * 100, 2) END                           AS afkir_pct
FROM cycle c
LEFT JOIN mortality m ON m.cycle_id = c.id AND m.deleted_at IS NULL
GROUP BY c.id, c.code, c.dod_qty;

COMMENT ON VIEW v_mortalitas_pisah IS
  'Kematian per siklus dipecah mati vs afkir. Persentase dihitung terhadap jumlah DOD masuk.';
