-- 021 — Rantai audit tidak lagi putus karena dua penulisan bersamaan.
--
-- ===================================================================
-- MASALAHNYA
-- ===================================================================
-- fn_audit_hash (migrasi 001) mengambil pendahulu rantai begini:
--
--     SELECT hash INTO last_hash FROM audit_log ORDER BY id DESC LIMIT 1 FOR UPDATE;
--
-- FOR UPDATE mengunci barisnya, tetapi BARIS MANA yang dikunci sudah dipilih
-- dari snapshot pernyataan. Lebih jauh: seluruh pernyataan INSERT — termasuk
-- isi trigger ini — berjalan di bawah SATU snapshot yang diambil saat
-- pernyataan dimulai. Jadi transaksi kedua tidak bisa melihat baris yang
-- di-commit transaksi pertama sesudah snapshot itu diambil, dan keduanya
-- menyimpan prev_hash yang sama. Rantai putus di satu mata, padahal tidak ada
-- isi baris yang diubah.
--
-- TERUKUR DI PRODUKSI (24 Nov 2026):
--   id 91  LOGOUT  2026-11-23 17:20:58.181079+07  mata rantai cocok
--   id 92  LOGOUT  2026-11-23 17:20:58.18164+07   mata rantai TIDAK COCOK
-- Berjarak 561 mikrodetik — dua logout serentak. fn_audit_verify_chain()
-- mengembalikan 92. Tetapi penghitungan ulang sha256 atas seluruh 102 baris
-- menunjukkan isi_diubah = 0: tidak ada satu baris pun yang isinya berubah.
--
-- TERUKUR DI PENGUJIAN: 50 penulisan audit bersamaan memutus 19 mata rantai.
--
-- CATATAN PENTING TENTANG PERCOBAAN PERBAIKAN PERTAMA.
-- pg_advisory_xact_lock SAJA TIDAK CUKUP, dan ini sudah diuji: dengan kunci
-- itu saja, 50 penulisan bersamaan masih memutus 19 mata rantai. Kuncinya
-- memang mengantrekan transaksi, tetapi TIDAK menyegarkan snapshot — sesudah
-- menunggu, pembacaan tetap memakai snapshot lama dan tetap tidak melihat
-- baris yang baru di-commit. Siapa pun yang membaca berkas ini di kemudian
-- hari: jangan menyederhanakannya kembali menjadi advisory lock saja.
--
-- ===================================================================
-- PERBAIKANNYA
-- ===================================================================
-- Ujung rantai disimpan di satu baris tabel sendiri, lalu dibaca dengan
-- SELECT ... FOR UPDATE pada baris yang SUDAH PASTI (WHERE id = 1).
--
-- Bedanya menentukan: kalau baris yang dikunci sudah pasti, PostgreSQL
-- menunggu kuncinya lalu MEMBACA ULANG versi terbaru baris itu (EvalPlanQual).
-- Jadi nilainya pasti nilai terakhir yang sudah di-commit, bukan nilai dari
-- snapshot. Itulah yang tidak bisa dilakukan oleh ORDER BY ... LIMIT 1
-- FOR UPDATE, karena di sana baris targetnya dipilih lebih dulu dari snapshot.
--
-- Nomor id juga diambil DI DALAM bagian yang terkunci. Tanpa itu, nomor id
-- (dari DEFAULT nextval) sudah ditetapkan sebelum trigger berjalan, sehingga
-- urutan id bisa berbeda dari urutan rantai — dan fn_audit_verify_chain(),
-- yang memeriksa menurut ORDER BY id, akan melaporkan putus lagi. Akibatnya
-- ada nomor id yang terlewat; itu wajar dan tidak berarti ada baris terhapus.
--
-- ===================================================================
-- YANG TIDAK DIUBAH
-- ===================================================================
--   - Rumus hash: PERSIS SAMA. Kalau rumusnya berubah, seluruh baris audit
--     yang sudah ada akan gagal verifikasi.
--   - Baris audit yang sudah ada, termasuk id 92 di produksi: TIDAK disentuh.
--     Tabelnya append-only dan isinya memang asli. Menambalnya berarti
--     menulis ulang histori — justru yang tidak boleh pada jejak audit.
--     fn_audit_verify_chain() akan tetap mengembalikan 92, dan itu BENAR:
--     catatannya memang apa adanya. Yang membedakan bekas balapan dari
--     pemalsuan adalah fn_audit_periksa() di bawah.
--   - Tabel audit_log, peran, autentikasi, dan routing: tidak diubah.

-- -------------------------------------------------------------------
-- 1. Ujung rantai
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_chain_head (
  id    smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  hash  char(64)
);

-- Diisi dari ujung rantai yang sekarang. Dijalankan sekali; kalau barisnya
-- sudah ada, dibiarkan — jadi migrasi ini aman diulang.
INSERT INTO audit_chain_head (id, hash)
SELECT 1, (SELECT hash FROM audit_log ORDER BY id DESC LIMIT 1)
 WHERE NOT EXISTS (SELECT 1 FROM audit_chain_head WHERE id = 1);

-- Ujung rantai ikut aturan append-only: boleh diperbarui trigger, tidak boleh
-- dihapus. Tanpa barisnya, penulisan audit berikutnya akan memulai rantai baru.
CREATE OR REPLACE FUNCTION fn_chain_head_nodel() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_chain_head tidak boleh dihapus: barisnya adalah ujung rantai jejak audit.'
    USING ERRCODE = 'integrity_constraint_violation';
END $$;

DROP TRIGGER IF EXISTS trg_chain_head_nodel ON audit_chain_head;
CREATE TRIGGER trg_chain_head_nodel
  BEFORE DELETE ON audit_chain_head
  FOR EACH ROW EXECUTE FUNCTION fn_chain_head_nodel();

-- -------------------------------------------------------------------
-- 2. Trigger rantai
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_audit_hash() RETURNS trigger AS $$
DECLARE last_hash char(64);
BEGIN
  /* Baris id=1 sudah pasti, jadi FOR UPDATE menunggu kuncinya lalu MEMBACA
     ULANG versi terbaru yang sudah di-commit. Ini yang membuat penulisan
     bersamaan berbaris dengan benar. */
  SELECT hash INTO last_hash FROM audit_chain_head WHERE id = 1 FOR UPDATE;

  IF NOT FOUND THEN
    /* Rantai belum punya ujung — database baru, atau barisnya belum terisi. */
    INSERT INTO audit_chain_head (id, hash) VALUES (1, NULL)
      ON CONFLICT (id) DO NOTHING;
    SELECT hash INTO last_hash FROM audit_chain_head WHERE id = 1 FOR UPDATE;
  END IF;

  /* Nomor id diambil di dalam bagian terkunci, supaya urutan id sama dengan
     urutan rantai. DEFAULT nextval sudah menetapkan satu nomor sebelum
     trigger berjalan; nomor itu ditinggalkan, jadi ada id yang terlewat. */
  NEW.id := nextval('audit_log_id_seq');

  NEW.prev_hash := last_hash;
  NEW.hash := encode(digest(
      coalesce(last_hash,'') || coalesce(NEW.actor_id::text,'SYSTEM') || NEW.action::text || NEW.entity_type ||
      coalesce(NEW.entity_id,'') || NEW.detail || coalesce(NEW.before::text,'') || coalesce(NEW.after::text,'') ||
      NEW.occurred_at::text, 'sha256'),'hex');

  UPDATE audit_chain_head SET hash = NEW.hash WHERE id = 1;

  RETURN NEW;
END $$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------
-- 3. Pemeriksa yang membedakan bekas balapan dari pemalsuan
-- -------------------------------------------------------------------
/* fn_audit_verify_chain() hanya mengembalikan id pertama yang bermasalah,
   tanpa membedakan DUA HAL yang sangat berbeda:

     - mata rantai putus tapi isi baris asli  -> bekas balapan tulis sebelum
                                                 migrasi 021. Tidak berbahaya.
     - isi baris tidak cocok dengan hash-nya  -> isi benar-benar diubah.
                                                 INI yang berbahaya.

   Satu bekas balapan membuat seluruh rantai terlihat rusak oleh fungsi lama.
   Fungsi ini melengkapi, bukan menggantikannya. Pemeriksaannya tidak
   bergantung pada urutan id: sebuah rantai yang benar memakai setiap hash
   TEPAT SEKALI sebagai prev_hash, jadi prev_hash yang dipakai dua kali
   berarti rantainya bercabang — itu tanda balapan. */
-- DROP dulu: kalau versi lama dengan kolom keluaran berbeda sudah pernah ada,
-- CREATE OR REPLACE ditolak PostgreSQL ("cannot change return type").
DROP FUNCTION IF EXISTS fn_audit_periksa();

CREATE OR REPLACE FUNCTION fn_audit_periksa()
RETURNS TABLE (total_baris bigint, isi_diubah bigint,
               mata_rantai_tidak_cocok bigint, bekas_balapan bigint,
               prev_hash_tidak_dikenal bigint, jumlah_akar bigint)
LANGUAGE sql STABLE AS $$
  WITH u AS (
    SELECT id, prev_hash, hash,
           lag(hash)      OVER (ORDER BY id) AS h_sebelumnya,
           lag(prev_hash) OVER (ORDER BY id) AS prev_sebelumnya,
           encode(digest(coalesce(prev_hash,'') || coalesce(actor_id::text,'SYSTEM') || action::text || entity_type ||
                  coalesce(entity_id,'') || detail || coalesce(before::text,'') || coalesce(after::text,'') ||
                  occurred_at::text, 'sha256'),'hex') AS hash_dari_isi_sendiri
    FROM audit_log),
  cabang AS (
    SELECT prev_hash FROM audit_log WHERE prev_hash IS NOT NULL
    GROUP BY prev_hash HAVING count(*) > 1)
  SELECT count(*),
         count(*) FILTER (WHERE hash <> hash_dari_isi_sendiri),
         count(*) FILTER (WHERE prev_hash IS NOT NULL AND prev_hash IS DISTINCT FROM h_sebelumnya),
         (SELECT count(*) FROM audit_log a
           WHERE a.prev_hash IN (SELECT prev_hash FROM cabang)),
         count(*) FILTER (WHERE prev_hash IS NOT NULL
                            AND NOT EXISTS (SELECT 1 FROM audit_log b WHERE b.hash = u.prev_hash)),
         count(*) FILTER (WHERE prev_hash IS NULL)
  FROM u;
$$;

COMMENT ON FUNCTION fn_audit_periksa() IS
  'Periksa jejak audit. isi_diubah > 0 = ada baris yang isinya diubah, INI yang berbahaya. prev_hash_tidak_dikenal > 0 = ada pendahulu yang hilang. mata_rantai_tidak_cocok yang seluruhnya tercakup bekas_balapan berasal dari penulisan bersamaan sebelum migrasi 021 dan tidak berbahaya. jumlah_akar harus 1.';
