-- 022 — T-8: biaya gaji, listrik, sewa masuk HPP.
--
-- ===================================================================
-- KEPUTUSAN ABDUR, 26 November 2026
-- ===================================================================
-- Biaya tingkat farm (gaji anak kandang, listrik, sewa kandang) dicatat
-- SEKALI per periode di tingkat farm, lalu dibagi sendiri oleh sistem ke
-- tiap batch. Cara pembagian yang dipilih: **ekor-hari** — jumlah bebek
-- dikali berapa hari bebek itu dipelihara di dalam periode tersebut.
--
-- Mengapa ekor-hari, bukan sekadar jumlah ekor: rencana Abdur adalah panen
-- bergilir 200 ekor tiap 3 hari, jadi batch akan terus tumpang tindih. Dengan
-- pembagian per ekor saja, batch yang baru masuk tanggal 25 kena beban
-- sebulan penuh dan HPP-nya terlihat jelek padahal bukan karena batchnya.
--
-- ===================================================================
-- MASALAH YANG DIPERBAIKI
-- ===================================================================
-- v_cycle_cost hanya menjumlahkan expense yang MENEMPEL pada satu batch
-- (cycle_id IS NOT NULL). Biaya yang dicatat di tingkat farm diabaikan
-- seluruhnya — tidak masuk HPP batch mana pun. Akibatnya HPP terlihat lebih
-- murah daripada kenyataan, dan kalau harga jual ditetapkan dari angka itu,
-- marginnya lebih tipis dari yang terlihat.
--
-- ===================================================================
-- YANG TIDAK DIUBAH
-- ===================================================================
--   - Potret HPP batch yang sudah tutup. v_cycle_summary mendahulukan potret
--     lewat COALESCE, jadi menambahkan overhead ke hitungan berjalan TIDAK
--     menggeser satu pun angka batch yang sudah dibekukan. Itu sengaja:
--     angka yang sudah ditutup tidak boleh berubah karena biaya yang dicatat
--     kemudian.
--   - Biaya DOD dan pakan. Keduanya tetap dihitung dari sumbernya sendiri,
--     dan penjaga 020 tetap menolak keduanya dicatat sebagai expense.
--   - Tabel, peran, autentikasi, routing.
--
-- CATATAN PENTING tentang batch yang sudah dibekukan.
-- Batch yang sudah tutup TETAP ikut dihitung dalam pembagian, karena batch
-- itu memang memakai listrik dan tenaga kerja selama periode itu —
-- mengeluarkannya dari pembagian akan membebankan 100% overhead ke batch
-- yang masih jalan, dan itu membuat HPP batch berjalan terlalu mahal.
-- Tetapi karena angka batch yang sudah dibekukan tidak boleh berubah,
-- bagian yang jatuh ke batch itu tidak akan terlihat di HPP-nya.
-- Supaya tidak ada rupiah yang hilang tanpa penjelasan, v_overhead_ringkas
-- di bawah menampilkan berapa yang jatuh ke batch beku, berapa ke batch
-- berjalan, dan berapa yang belum terbagi sama sekali.

-- -------------------------------------------------------------------
-- 1. Kategori SEWA
-- -------------------------------------------------------------------
-- LISTRIK dan TENAGA_KERJA sudah ada. SEWA belum, dan Abdur menyebutnya.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
     WHERE t.typname = 'expense_category' AND e.enumlabel = 'SEWA')
  THEN
    ALTER TYPE expense_category ADD VALUE 'SEWA';
  END IF;
END $$;

-- -------------------------------------------------------------------
-- 2. Periode untuk biaya tingkat farm
-- -------------------------------------------------------------------
-- Biaya tingkat farm perlu PERIODE, bukan satu tanggal: tagihan listrik
-- bulan November harus dibagi ke hari-hari bulan November, bukan ke tanggal
-- tagihannya dibayar. Dibiarkan NULL untuk biaya yang menempel pada batch.
ALTER TABLE expense ADD COLUMN IF NOT EXISTS periode_dari   date;
ALTER TABLE expense ADD COLUMN IF NOT EXISTS periode_sampai date;

COMMENT ON COLUMN expense.periode_dari IS
  'Awal periode biaya tingkat farm (cycle_id NULL). NULL untuk biaya yang menempel pada satu batch.';
COMMENT ON COLUMN expense.periode_sampai IS
  'Akhir periode biaya tingkat farm, inklusif.';

-- Penjaga: biaya tingkat farm yang disetujui WAJIB punya periode yang masuk
-- akal. Tanpa periode, sistem tidak tahu hari-hari mana yang harus dibebani,
-- dan biayanya akan menggantung tanpa pernah masuk HPP mana pun.
CREATE OR REPLACE FUNCTION fn_overhead_periode_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL THEN RETURN NEW; END IF;          -- pembatalan selalu boleh
  IF NEW.cycle_id IS NOT NULL THEN                                 -- biaya milik satu batch
    IF NEW.periode_dari IS NOT NULL OR NEW.periode_sampai IS NOT NULL THEN
      RAISE EXCEPTION 'Periode hanya untuk biaya tingkat farm. Biaya yang menempel pada batch memakai tanggal kejadian, bukan periode.'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  -- di sini: biaya tingkat farm
  IF NEW.status <> 'APPROVED' THEN RETURN NEW; END IF;             -- draf belum dibagi
  IF NEW.periode_dari IS NULL OR NEW.periode_sampai IS NULL THEN
    RAISE EXCEPTION 'Biaya tingkat farm wajib menyebutkan periode (dari tanggal sampai tanggal), supaya sistem tahu hari-hari mana yang dibebani.'
      USING ERRCODE = '23514';
  END IF;
  IF NEW.periode_sampai < NEW.periode_dari THEN
    RAISE EXCEPTION 'Periode biaya terbalik: tanggal akhir (%) lebih awal dari tanggal mulai (%).',
      NEW.periode_sampai, NEW.periode_dari USING ERRCODE = '23514';
  END IF;
  IF (NEW.periode_sampai - NEW.periode_dari) > 400 THEN
    RAISE EXCEPTION 'Periode biaya lebih dari 400 hari. Periksa tanggalnya — biaya tingkat farm biasanya per bulan.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_overhead_periode_guard ON expense;
CREATE TRIGGER trg_overhead_periode_guard
  BEFORE INSERT OR UPDATE ON expense
  FOR EACH ROW EXECUTE FUNCTION fn_overhead_periode_guard();

-- -------------------------------------------------------------------
-- 3. Ekor-hari tiap batch di dalam tiap periode biaya
-- -------------------------------------------------------------------
/* Populasi batch pada hari d = jumlah seluruh population_tx batch itu yang
   terjadi sampai hari d. Maka ekor-hari sepanjang [s,e] adalah

       SUM over d in [s,e] of populasi(d)

   yang kalau dibalik urutannya menjadi satu lintasan saja atas ledger:

       SUM over tx of  qty * (jumlah hari di [s,e] yang >= tanggal tx)
     = SUM over tx of  qty * (e - GREATEST(s, tanggal_tx) + 1)

   untuk tx yang tanggalnya <= e. Hasilnya sama persis, tanpa perlu membuat
   satu baris per hari. Transaksi bertanda negatif (kematian, panen,
   perpindahan keluar) mengurangi dengan sendirinya, dan di luar masa hidup
   batch hasilnya 0 karena tidak ada transaksi.

   Tanggal dibaca dalam zona waktu farm (fn_zona_waktu), bukan UTC — sama
   dengan aturan tanggal di seluruh aplikasi sejak migrasi 019. */
CREATE OR REPLACE VIEW v_overhead_ekorhari AS
SELECT e.id   AS expense_id,
       c.id   AS cycle_id,
       GREATEST(0, COALESCE(SUM(
         tx.qty * ((e.periode_sampai
                    - GREATEST(e.periode_dari,
                               (tx.occurred_at AT TIME ZONE fn_zona_waktu())::date)) + 1)
       ), 0))::numeric AS ekor_hari
FROM expense e
JOIN cycle c ON TRUE
LEFT JOIN population_tx tx
       ON tx.cycle_id = c.id
      AND (tx.occurred_at AT TIME ZONE fn_zona_waktu())::date <= e.periode_sampai
WHERE e.cycle_id IS NULL
  AND e.status = 'APPROVED'
  AND e.deleted_at IS NULL
  AND e.periode_dari IS NOT NULL
  AND e.periode_sampai IS NOT NULL
GROUP BY e.id, c.id;

-- -------------------------------------------------------------------
-- 4. Pembagian tiap biaya farm ke tiap batch
-- -------------------------------------------------------------------
CREATE OR REPLACE VIEW v_overhead_alokasi AS
WITH total AS (
  SELECT expense_id, SUM(ekor_hari) AS ekor_hari_total
  FROM v_overhead_ekorhari GROUP BY expense_id
)
SELECT k.expense_id,
       k.cycle_id,
       k.ekor_hari,
       t.ekor_hari_total,
       /* Kalau tidak ada bebek sama sekali sepanjang periode itu, biayanya
          TIDAK dibagi — dibiarkan menggantung dan dilaporkan di
          v_overhead_ringkas. Membaginya rata ke batch yang tidak punya bebek
          hanya akan mengarang beban. */
       CASE WHEN COALESCE(t.ekor_hari_total,0) > 0
            THEN e.amount * k.ekor_hari / t.ekor_hari_total
            ELSE 0 END AS nilai
FROM v_overhead_ekorhari k
JOIN total t ON t.expense_id = k.expense_id
JOIN expense e ON e.id = k.expense_id
WHERE k.ekor_hari > 0;

-- Total overhead yang jatuh ke tiap batch.
CREATE OR REPLACE VIEW v_cycle_overhead AS
SELECT cycle_id, SUM(nilai) AS overhead
FROM v_overhead_alokasi GROUP BY cycle_id;

-- -------------------------------------------------------------------
-- 5. Overhead masuk biaya berjalan
-- -------------------------------------------------------------------
/* SATU tempat saja. Dulu rumus biaya pakan ditulis ulang di dua tempat dan
   sempat berbeda Rp 1.351, sehingga rincian biaya di layar tidak berjumlah
   sama dengan totalnya. Jangan diulangi: siapa pun yang butuh overhead per
   batch membaca v_cycle_overhead, tidak menghitung ulang. */
CREATE OR REPLACE VIEW v_cycle_cost AS
SELECT c.id AS cycle_id,
       COALESCE(b.total, 0::numeric)
     + COALESCE(p.biaya, 0::numeric)
     + COALESCE(o.overhead, 0::numeric) AS running_cost
FROM cycle c
LEFT JOIN (
  SELECT expense.cycle_id, SUM(expense.amount) AS total
  FROM expense
  WHERE expense.status = 'APPROVED'::record_status
    AND expense.deleted_at IS NULL
    AND expense.cycle_id IS NOT NULL
  GROUP BY expense.cycle_id) b ON b.cycle_id = c.id
LEFT JOIN v_cycle_pakan p    ON p.cycle_id = c.id
LEFT JOIN v_cycle_overhead o ON o.cycle_id = c.id;

-- -------------------------------------------------------------------
-- 6. Ke mana saja tiap biaya farm jatuh
-- -------------------------------------------------------------------
/* Supaya tidak ada rupiah yang hilang tanpa penjelasan. Bagian yang jatuh ke
   batch yang sudah dibekukan memang tidak akan terlihat di HPP batch itu,
   karena angkanya sudah ditutup — tapi harus tetap kelihatan di sini. */
CREATE OR REPLACE VIEW v_overhead_ringkas AS
SELECT e.id                         AS expense_id,
       e.category::text             AS kategori,
       e.amount                     AS nilai_biaya,
       e.periode_dari,
       e.periode_sampai,
       e.vendor,
       e.ref_no,
       COALESCE(SUM(a.nilai), 0)    AS terbagi,
       COALESCE(SUM(a.nilai) FILTER (
         WHERE EXISTS (SELECT 1 FROM cycle_hpp_snapshot s WHERE s.cycle_id = a.cycle_id)), 0)
                                    AS ke_batch_beku,
       COALESCE(SUM(a.nilai) FILTER (
         WHERE NOT EXISTS (SELECT 1 FROM cycle_hpp_snapshot s WHERE s.cycle_id = a.cycle_id)), 0)
                                    AS ke_batch_berjalan,
       e.amount - COALESCE(SUM(a.nilai), 0) AS belum_terbagi,
       count(a.cycle_id)            AS jumlah_batch
FROM expense e
LEFT JOIN v_overhead_alokasi a ON a.expense_id = e.id
WHERE e.cycle_id IS NULL
  AND e.status = 'APPROVED'
  AND e.deleted_at IS NULL
GROUP BY e.id, e.category, e.amount, e.periode_dari, e.periode_sampai, e.vendor, e.ref_no;

COMMENT ON VIEW v_overhead_ringkas IS
  'Ke mana tiap biaya tingkat farm jatuh. belum_terbagi > 0 berarti tidak ada bebek sepanjang periode itu, jadi biayanya belum masuk HPP mana pun. ke_batch_beku tidak terlihat di HPP batch tersebut karena angkanya sudah dibekukan.';
