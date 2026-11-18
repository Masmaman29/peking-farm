-- 012 — Anti foto daur ulang.
-- Foto bukti sudah lama disimpan beserta sha256-nya, tapi belum pernah dicek.
-- Mulai sekarang: foto yang sha256-nya sudah pernah masuk ditolak.

INSERT INTO master_config(key, value, description) VALUES
 ('foto_unik', 'true', 'Tolak foto bukti yang sha256-nya sudah pernah diupload (anti foto daur ulang)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO master_config(key, value, description) VALUES
 ('foto_dari_kamera', 'true', 'Foto bukti harus diambil dari kamera saat itu, galeri tidak boleh')
ON CONFLICT (key) DO NOTHING;

-- Pencarian duplikat harus cepat; tanpa index ini setiap upload memindai seluruh tabel.
CREATE INDEX IF NOT EXISTS ix_att_sha ON attachment(sha256);

-- Dicatat dari mana foto datang, supaya kecurangan bisa dilacak belakangan.
ALTER TABLE attachment ADD COLUMN IF NOT EXISTS source text;
