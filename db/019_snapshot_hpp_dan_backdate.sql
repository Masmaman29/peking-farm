-- 019 — Snapshot HPP saat batch ditutup, koreksi terpisah, dan kendali backdate.
--
-- MASALAH YANG DIPERBAIKI.
-- Migrasi 018 membuat pakan dinilai menurut harga pada TANGGAL PEMAKAIAN, bukan
-- rata-rata sampai hari ini. Itu menghentikan pergeseran dari pembelian normal.
-- Tapi pengujian nota terlambat membuktikan biaya batch CLOSED MASIH bisa
-- berubah lewat dua jalur:
--   1. nota yang dicatat hari ini tapi diberi tanggal mundur
--   2. nota lama bertanggal mundur yang baru disetujui hari ini
-- Terukur: satu nota backdated menggeser biaya batch #R121 dari Rp 9.938.756
-- menjadi Rp 14.292.200 (+43,8%), dan backdate ke 1 Januari menggeser SELURUH
-- 130 batch CLOSED sebesar Rp 540.963.672.
--
-- SEKARANG, dua lapis:
--   B. Saat batch ditutup, HPP-nya dipotret dan potret itu TIDAK BISA DIUBAH.
--      Batch CLOSED membaca potretnya, bukan menghitung ulang. Nota apa pun
--      yang masuk setelah itu — bertanggal kapan pun — tidak menyentuhnya.
--      Salah hitung diperbaiki lewat baris KOREKSI terpisah yang menunjuk ke
--      potret aslinya, bukan dengan mengubah potretnya.
--   C. Pembelian yang tanggalnya mundur lebih dari 7 hari wajib lewat
--      persetujuan OWNER. Manager tidak bisa menyetujuinya.
--
-- Batch yang masih berjalan tetap dihitung berjalan. Panen sebagian BUKAN
-- penutupan: potret hanya dibuat saat status benar-benar menjadi CLOSED.

-- ===================================================================
-- B. POTRET HPP SAAT TUTUP
-- ===================================================================

CREATE TABLE IF NOT EXISTS cycle_hpp_snapshot (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id         uuid NOT NULL UNIQUE REFERENCES cycle(id),
  -- angka yang dibekukan
  dod_cost         numeric(16,2) NOT NULL,
  operating_cost   numeric(16,2) NOT NULL,
  total_cost       numeric(16,2) NOT NULL,
  revenue          numeric(16,2) NOT NULL,
  profit           numeric(16,2) NOT NULL,
  harvest_kg       numeric(14,3) NOT NULL,
  harvest_qty      integer       NOT NULL,
  hpp_per_kg       numeric(16,2),          -- null kalau tidak ada kg panen
  hpp_per_ekor     numeric(16,2),          -- null kalau tidak ada ekor panen
  feed_kg          numeric(14,3) NOT NULL DEFAULT 0,
  -- jejak
  closed_at        timestamptz NOT NULL,
  formula_version  text        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid REFERENCES app_user(id)
);
COMMENT ON TABLE cycle_hpp_snapshot IS
  'Potret HPP saat siklus ditutup. Tidak bisa diubah atau dihapus. Koreksi lewat cycle_hpp_correction.';

CREATE INDEX IF NOT EXISTS idx_hpp_snapshot_cycle ON cycle_hpp_snapshot(cycle_id);

-- Potret tidak bisa diubah atau dihapus. Sama sekali.
CREATE OR REPLACE FUNCTION fn_snapshot_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Potret HPP tidak bisa diubah atau dihapus. Pakai koreksi (cycle_hpp_correction) yang menunjuk ke potret ini.'
    USING ERRCODE = '23514';
END $$;

DROP TRIGGER IF EXISTS trg_snapshot_immutable ON cycle_hpp_snapshot;
CREATE TRIGGER trg_snapshot_immutable
  BEFORE UPDATE OR DELETE ON cycle_hpp_snapshot
  FOR EACH ROW EXECUTE FUNCTION fn_snapshot_immutable();

-- ===================================================================
-- KOREKSI — tidak mengubah potret, hanya menambah baris penjelas
-- ===================================================================

CREATE TABLE IF NOT EXISTS cycle_hpp_correction (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id   uuid NOT NULL REFERENCES cycle_hpp_snapshot(id),
  delta_cost    numeric(16,2) NOT NULL,     -- boleh negatif
  reason        text NOT NULL CHECK (length(btrim(reason)) >= 5),
  status        text NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  requested_by  uuid NOT NULL REFERENCES app_user(id),
  requested_at  timestamptz NOT NULL DEFAULT now(),
  approved_by   uuid REFERENCES app_user(id),
  approved_at   timestamptz,
  reject_reason text
);
COMMENT ON TABLE cycle_hpp_correction IS
  'Koreksi atas potret HPP. Hanya OWNER yang boleh menyetujui. Keputusan yang sudah dibuat tidak bisa diputar balik.';

CREATE INDEX IF NOT EXISTS idx_hpp_correction_snap ON cycle_hpp_correction(snapshot_id);

-- Hanya OWNER yang boleh menyetujui atau menolak koreksi keuangan.
-- Keputusan yang sudah dibuat tidak bisa diubah lagi.
CREATE OR REPLACE FUNCTION fn_correction_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v_role text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Koreksi HPP tidak bisa dihapus.' USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Koreksi yang sudah % tidak bisa diubah lagi.', OLD.status USING ERRCODE = '23514';
  END IF;

  IF NEW.status IN ('APPROVED','REJECTED') THEN
    IF NEW.approved_by IS NULL THEN
      RAISE EXCEPTION 'Koreksi HPP harus menyebutkan siapa yang memutuskan.' USING ERRCODE = '23514';
    END IF;
    SELECT role::text INTO v_role FROM app_user WHERE id = NEW.approved_by;
    IF v_role IS DISTINCT FROM 'OWNER' THEN
      RAISE EXCEPTION 'Hanya OWNER yang boleh memutuskan koreksi keuangan. Peran % tidak berhak.', COALESCE(v_role,'(tidak dikenal)')
        USING ERRCODE = '42501';
    END IF;
    IF NEW.approved_at IS NULL THEN NEW.approved_at := now(); END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_correction_guard ON cycle_hpp_correction;
CREATE TRIGGER trg_correction_guard
  BEFORE UPDATE OR DELETE ON cycle_hpp_correction
  FOR EACH ROW EXECUTE FUNCTION fn_correction_guard();

DROP TRIGGER IF EXISTS trg_correction_guard_ins ON cycle_hpp_correction;
CREATE TRIGGER trg_correction_guard_ins
  BEFORE INSERT ON cycle_hpp_correction
  FOR EACH ROW EXECUTE FUNCTION fn_correction_guard();

-- Angka final batch tertutup: potret + koreksi yang sudah disetujui.
CREATE OR REPLACE VIEW v_cycle_hpp_final AS
SELECT s.cycle_id,
       s.id                                        AS snapshot_id,
       s.dod_cost,
       s.operating_cost + COALESCE(k.delta, 0)     AS operating_cost,
       s.total_cost     + COALESCE(k.delta, 0)     AS total_cost,
       s.revenue,
       s.revenue - (s.total_cost + COALESCE(k.delta, 0)) AS profit,
       s.harvest_kg, s.harvest_qty, s.feed_kg,
       CASE WHEN s.harvest_kg  > 0 THEN round((s.total_cost + COALESCE(k.delta,0)) / s.harvest_kg,  2) END AS hpp_per_kg,
       CASE WHEN s.harvest_qty > 0 THEN round((s.total_cost + COALESCE(k.delta,0)) / s.harvest_qty, 2) END AS hpp_per_ekor,
       s.hpp_per_kg   AS hpp_per_kg_asli,
       s.hpp_per_ekor AS hpp_per_ekor_asli,
       s.total_cost   AS total_cost_asli,
       COALESCE(k.delta, 0)  AS koreksi_nilai,
       COALESCE(k.jumlah, 0) AS koreksi_jumlah,
       s.closed_at, s.formula_version, s.created_at, s.created_by
  FROM cycle_hpp_snapshot s
  LEFT JOIN (SELECT snapshot_id, SUM(delta_cost) AS delta, COUNT(*) AS jumlah
               FROM cycle_hpp_correction WHERE status='APPROVED' GROUP BY snapshot_id) k
         ON k.snapshot_id = s.id;

-- ===================================================================
-- v_cycle_summary — batch tertutup membaca POTRET, bukan menghitung ulang
-- ===================================================================
-- Daftar dan urutan kolom dipertahankan persis supaya tidak ada yang rusak.
CREATE OR REPLACE VIEW v_cycle_summary AS
 SELECT c.id AS cycle_id, c.code, c.breed, c.dod_date, c.dod_qty, c.dod_price,
    c.status, c.stage, c.closed_at, c.close_note,
    COALESCE(c.closed_at::date, CURRENT_DATE) - c.dod_date AS days,
    COALESCE(p.deaths, 0) AS deaths,
    COALESCE(p.sold, 0) AS sold,
    COALESCE(p.harvested, 0) AS harvested,
    COALESCE(p.transfer_out, 0) AS carried_out,
    COALESCE(p.population, 0) AS remaining,
    round(COALESCE(p.deaths, 0)::numeric * 100::numeric / NULLIF(c.dod_qty, 0)::numeric, 2) AS mortality_pct,
    COALESCE(hf.feed_kg, f.feed_kg, 0::numeric) AS feed_kg,
    COALESCE(hf.harvest_qty, o.harvest_qty, 0) AS harvest_qty,
    COALESCE(hf.harvest_kg, o.harvest_weight_kg, 0::numeric) AS harvest_weight_kg,
        CASE
            WHEN COALESCE(hf.harvest_qty, o.harvest_qty, 0) > 0
              THEN round(COALESCE(hf.harvest_kg, o.harvest_weight_kg) / COALESCE(hf.harvest_qty, o.harvest_qty)::numeric, 3)
            ELSE NULL::numeric
        END AS harvest_avg_kg,
    COALESCE(hf.revenue, o.revenue, 0::numeric) AS revenue,
    COALESCE(hf.dod_cost, c.dod_qty::numeric * c.dod_price) AS dod_cost,
    COALESCE(hf.operating_cost, cc.running_cost, 0::numeric) AS operating_cost,
    COALESCE(hf.total_cost, c.dod_qty::numeric * c.dod_price + COALESCE(cc.running_cost, 0::numeric)) AS cost_total,
    COALESCE(hf.profit, COALESCE(o.revenue, 0::numeric) - (c.dod_qty::numeric * c.dod_price + COALESCE(cc.running_cost, 0::numeric))) AS profit,
        CASE
            WHEN COALESCE(f.feed_kg, 0::numeric) > 0::numeric AND (COALESCE(o.out_weight_kg, 0::numeric) - c.dod_qty::numeric * c.dod_weight_kg) > 0::numeric THEN round(f.feed_kg / (COALESCE(o.out_weight_kg, 0::numeric) - c.dod_qty::numeric * c.dod_weight_kg), 3)
            ELSE NULL::numeric
        END AS fcr_final
   FROM cycle c
     LEFT JOIN v_population_cycle p ON p.cycle_id = c.id
     LEFT JOIN v_cycle_out o ON o.cycle_id = c.id
     LEFT JOIN v_cycle_cost cc ON cc.cycle_id = c.id
     LEFT JOIN v_cycle_hpp_final hf ON hf.cycle_id = c.id
     LEFT JOIN ( SELECT feed_transaction.cycle_id,
            - sum(feed_transaction.qty_kg) AS feed_kg
           FROM feed_transaction
          WHERE feed_transaction.type = 'USAGE'::feed_tx_type AND feed_transaction.deleted_at IS NULL AND (feed_transaction.status = ANY (ARRAY['RECORDED'::record_status, 'APPROVED'::record_status]))
          GROUP BY feed_transaction.cycle_id) f ON f.cycle_id = c.id;

-- ===================================================================
-- C. KENDALI TRANSAKSI BACKDATE
-- ===================================================================
-- occurred_at (tanggal kejadian) dan created_at (waktu input sebenarnya) sudah
-- ada sejak awal dan disimpan terpisah — tidak perlu kolom baru untuk itu.
-- Yang ditambahkan: alasan backdate, supaya tidak ada koreksi diam-diam.
ALTER TABLE feed_transaction ADD COLUMN IF NOT EXISTS backdate_reason text;
COMMENT ON COLUMN feed_transaction.backdate_reason IS
  'Wajib diisi kalau occurred_at mundur lebih dari BATAS_BACKDATE hari dari waktu input. Nota seperti itu butuh persetujuan OWNER.';

-- Batas backdate: 7 hari. Disimpan di master_config supaya bisa diubah pemilik
-- tanpa migrasi baru, dan supaya nilainya terlihat di layar Pengaturan.
INSERT INTO master_config(key, value)
SELECT 'batas_backdate_hari', '7'::jsonb
 WHERE NOT EXISTS (SELECT 1 FROM master_config WHERE key='batas_backdate_hari');

CREATE OR REPLACE FUNCTION fn_batas_backdate() RETURNS integer
LANGUAGE sql STABLE AS $$
  SELECT COALESCE((SELECT (value #>> '{}')::integer FROM master_config WHERE key='batas_backdate_hari'), 7);
$$;

-- Zona waktu farm. Dipakai untuk menghitung TANGGAL KALENDER, bukan selisih jam.
INSERT INTO master_config(key, value)
SELECT 'zona_waktu', '"Asia/Jakarta"'::jsonb
 WHERE NOT EXISTS (SELECT 1 FROM master_config WHERE key='zona_waktu');

CREATE OR REPLACE FUNCTION fn_zona_waktu() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT COALESCE((SELECT value #>> '{}' FROM master_config WHERE key='zona_waktu'), 'Asia/Jakarta');
$$;

/* Berapa HARI KALENDER sebuah nota mundur, menurut kalender Indonesia.
   SATU-SATUNYA rumus di seluruh sistem: trigger memakainya, dan aksi
   FEED_PURCHASE juga memanggilnya lewat SQL, bukan menghitung sendiri.

   Sebelumnya ada tiga rumus yang berbeda dan hasilnya bisa tidak sama:
     - layar   : selisih tanggal kalender menurut zona waktu BROWSER
     - backend : selisih milidetik dibagi 24 jam, dibulatkan ke bawah
     - trigger : selisih tanggal kalender menurut zona waktu SERVER (UTC)
   Terukur: untuk nota berumur 8 hari kalender yang dicatat pukul 06:30 WIB,
   layar menghitung 8 hari (wajib alasan + persetujuan Owner) sementara backend
   dan trigger menghitung 7 hari (lolos sebagai pembelian biasa). Antara pukul
   00:00 dan 07:00 WIB, UTC masih di tanggal kemarin, sehingga penjaga backdate
   menjadi lebih longgar justru pada jam kerja pagi di kandang. */
CREATE OR REPLACE FUNCTION fn_hari_mundur(p_saat timestamptz) RETURNS integer
LANGUAGE sql STABLE AS $$
  SELECT GREATEST(0,
    ((now() AT TIME ZONE fn_zona_waktu())::date - (p_saat AT TIME ZONE fn_zona_waktu())::date));
$$;

/* Penjaga pembelian backdate.
   Dipasang di database, bukan hanya di aplikasi, supaya aturan ini berlaku
   lewat jalur mana pun — termasuk skrip dan perbaikan manual.
   Aturannya:
     1. Mundur lebih dari batas DAN langsung APPROVED  -> ditolak.
        Harus masuk sebagai PENDING dulu, lalu disetujui OWNER.
     2. Mundur lebih dari batas tanpa alasan           -> ditolak.
     3. Menyetujui nota backdate                       -> hanya OWNER.
   Pemakaian pakan (USAGE) tidak dibatasi: anak kandang memang sering
   menyusulkan catatan pakan beberapa hari, dan itu bukan transaksi keuangan. */
CREATE OR REPLACE FUNCTION fn_backdate_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_batas  integer := fn_batas_backdate();
  v_mundur integer;
  v_role   text;
BEGIN
  IF NEW.type <> 'PURCHASE' THEN RETURN NEW; END IF;

  /* Pembatalan nota SELALU boleh. Membatalkan adalah cara yang benar untuk
     meralat, dan memblokirnya akan mengunci nota lama selamanya. Baris yang
     memang sudah dibatalkan juga dilewati. */
  IF TG_OP = 'UPDATE' THEN
    IF NEW.deleted_at IS NOT NULL THEN RETURN NEW; END IF;
    /* Perubahan yang tidak menyentuh nilai uang, tanggal, atau status —
       misalnya menempel foto nota — tidak perlu diperiksa ulang. */
    IF NEW.status      IS NOT DISTINCT FROM OLD.status
       AND NEW.occurred_at  IS NOT DISTINCT FROM OLD.occurred_at
       AND NEW.qty_kg       IS NOT DISTINCT FROM OLD.qty_kg
       AND NEW.price_per_kg IS NOT DISTINCT FROM OLD.price_per_kg
    THEN RETURN NEW; END IF;
  END IF;

  v_mundur := fn_hari_mundur(NEW.occurred_at);   -- hari kalender Indonesia, satu rumus
  IF v_mundur <= v_batas THEN RETURN NEW; END IF;

  IF NEW.backdate_reason IS NULL OR length(btrim(NEW.backdate_reason)) < 5 THEN
    RAISE EXCEPTION 'Nota pembelian bertanggal % (mundur % hari, batas % hari) harus menyertakan alasan koreksi.',
      NEW.occurred_at::date, v_mundur, v_batas USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'INSERT' AND NEW.status = 'APPROVED' THEN
    RAISE EXCEPTION 'Nota pembelian mundur % hari (batas % hari) tidak boleh langsung disetujui. Masukkan sebagai PENDING lalu minta persetujuan OWNER.',
      v_mundur, v_batas USING ERRCODE = '23514';
  END IF;

  IF NEW.status = 'APPROVED' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'APPROVED') THEN
    SELECT role::text INTO v_role FROM app_user WHERE id = COALESCE(NEW.updated_by, NEW.created_by);
    IF v_role IS DISTINCT FROM 'OWNER' THEN
      RAISE EXCEPTION 'Nota pembelian mundur % hari hanya boleh disetujui OWNER. Peran % tidak berhak.',
        v_mundur, COALESCE(v_role,'(tidak dikenal)') USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_backdate_guard ON feed_transaction;
CREATE TRIGGER trg_backdate_guard
  BEFORE INSERT OR UPDATE ON feed_transaction
  FOR EACH ROW EXECUTE FUNCTION fn_backdate_guard();

-- ===================================================================
-- ISI POTRET UNTUK BATCH YANG SUDAH TERLANJUR DITUTUP
-- ===================================================================
-- Tanpa ini, batch CLOSED yang sudah ada tetap dihitung berjalan dan masih
-- bisa digeser nota backdated. Dijalankan sekali; batch yang sudah punya
-- potret dilewati, jadi migrasi ini aman diulang.
--
-- Angka yang dibekukan adalah angka MENURUT RUMUS SEKARANG (migrasi 018,
-- harga pakan menurut tanggal pemakaian) — yaitu angka yang benar. Sesudah
-- ini, angka itu tidak berubah lagi apa pun yang terjadi.
INSERT INTO cycle_hpp_snapshot
  (cycle_id, dod_cost, operating_cost, total_cost, revenue, profit,
   harvest_kg, harvest_qty, hpp_per_kg, hpp_per_ekor, feed_kg,
   closed_at, formula_version, created_by)
SELECT s.cycle_id,
       s.dod_cost, s.operating_cost, s.cost_total, s.revenue, s.profit,
       s.harvest_weight_kg, s.harvest_qty,
       CASE WHEN s.harvest_weight_kg > 0 THEN round(s.cost_total / s.harvest_weight_kg, 2) END,
       CASE WHEN s.harvest_qty      > 0 THEN round(s.cost_total / s.harvest_qty,      2) END,
       s.feed_kg,
       COALESCE(c.closed_at, now()),
       '018-harga-pakan-saat-pakai',
       c.closed_by
  FROM v_cycle_summary s
  JOIN cycle c ON c.id = s.cycle_id
 WHERE c.status = 'CLOSED'
   AND NOT EXISTS (SELECT 1 FROM cycle_hpp_snapshot x WHERE x.cycle_id = c.id);
