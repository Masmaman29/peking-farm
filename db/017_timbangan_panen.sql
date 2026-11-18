-- 017 — Rincian timbangan panen.
-- Saat panen, bebek ditimbang per kelompok (10 atau 15 ekor). Tiap timbangan
-- disimpan supaya bisa ditampilkan di invoice. Berat keranjang tidak dihitung.
ALTER TABLE order_item ADD COLUMN IF NOT EXISTS timbangan jsonb;
