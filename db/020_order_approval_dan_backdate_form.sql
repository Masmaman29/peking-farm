-- 020 — Persetujuan order hanya OWNER/ADMIN, dijaga sampai ke database.
--
-- MASALAH YANG DIPERBAIKI.
-- Order yang nilainya melewati ambang masuk status PENDING_APPROVAL. Sebelum
-- migrasi ini ada DUA jalur yang membuat Manager bisa melewati persetujuan
-- keuangan:
--   1. aksi APPROVE cabang ORDER sama sekali tidak memeriksa peran — tidak
--      seperti cabang PURCHASE dan EXPENSE yang membatasi OWNER di atas ambang;
--   2. aksi ORDER_STATUS membiarkan siapa pun yang boleh mengubah status order
--      men-set PENDING_APPROVAL langsung menjadi CONFIRMED.
--
-- Keduanya sudah ditutup di api/src/actions.js. Penjaga di bawah ini lapis
-- terakhir: berlaku lewat jalur mana pun, termasuk skrip dan perbaikan manual.
--
-- Tidak ada tabel, kolom, atau struktur role yang diubah.

CREATE OR REPLACE FUNCTION fn_order_approval_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v_role text;
BEGIN
  -- hanya saat order KELUAR dari status menunggu persetujuan
  IF OLD.status IS DISTINCT FROM 'PENDING_APPROVAL' THEN RETURN NEW; END IF;
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  -- membatalkan order selalu boleh
  IF NEW.status = 'CANCELLED' THEN RETURN NEW; END IF;

  SELECT role::text INTO v_role FROM app_user WHERE id = NEW.decided_by;
  IF v_role IS NULL OR v_role NOT IN ('OWNER', 'ADMIN') THEN
    RAISE EXCEPTION 'Order yang menunggu persetujuan hanya boleh diputuskan Owner atau Admin. Peran % tidak berhak.',
      COALESCE(v_role, '(tidak disebutkan)') USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_order_approval_guard ON "order";
CREATE TRIGGER trg_order_approval_guard
  BEFORE UPDATE ON "order"
  FOR EACH ROW EXECUTE FUNCTION fn_order_approval_guard();

-- Baris approval untuk order yang masih menunggu diarahkan ke OWNER, supaya
-- antrean persetujuan di layar tidak lagi menampilkannya kepada Manager.
-- Hanya yang masih PENDING; keputusan yang sudah dibuat tidak diutak-atik.
UPDATE approval SET required_role = 'OWNER'
 WHERE entity_type = 'order' AND status = 'PENDING' AND required_role = 'MANAGER';

-- ===================================================================
-- T-6 — biaya DOD dan pakan tidak boleh dicatat ulang sebagai expense
-- ===================================================================
-- Biaya DOD sudah dihitung dari cycle.dod_qty x cycle.dod_price, dan biaya
-- pakan dari feed_transaction USAGE x harga nota pada tanggal pemakaian.
-- v_cycle_cost menjumlahkan SELURUH expense APPROVED tanpa memandang kategori,
-- jadi satu baris expense berkategori DOD atau PAKAN membuat biayanya dihitung
-- dua kali. Terukur Rp 999.000 pada pengujian.
--
-- Aksi EXPENSE di aplikasi sudah menolaknya. Penjaga ini lapis terakhir.
-- Baris lama yang sudah terlanjur APPROVED TIDAK diubah — mengubah histori
-- bukan wewenang migrasi. Yang dicegah hanya baris baru dan perubahan status
-- menjadi APPROVED.
CREATE OR REPLACE FUNCTION fn_expense_kategori_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.category::text NOT IN ('DOD', 'PAKAN') THEN RETURN NEW; END IF;
  IF NEW.deleted_at IS NOT NULL THEN RETURN NEW; END IF;          -- pembatalan selalu boleh
  IF TG_OP = 'UPDATE' AND OLD.status = 'APPROVED' THEN RETURN NEW; END IF;  -- baris lama tidak diusik
  IF NEW.status <> 'APPROVED' THEN RETURN NEW; END IF;            -- draf/pending tidak masuk biaya

  RAISE EXCEPTION 'Biaya berkategori % tidak boleh disetujui: biaya DOD sudah dihitung dari data bibit siklus, dan biaya pakan dari pemakaian pakan. Mencatatnya lagi menghitung dua kali.',
    NEW.category USING ERRCODE = '23514';
END $$;

DROP TRIGGER IF EXISTS trg_expense_kategori_guard ON expense;
CREATE TRIGGER trg_expense_kategori_guard
  BEFORE INSERT OR UPDATE ON expense
  FOR EACH ROW EXECUTE FUNCTION fn_expense_kategori_guard();
