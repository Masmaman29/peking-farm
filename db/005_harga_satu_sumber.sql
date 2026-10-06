-- 005: harga jual hanya hidup di tabel product.
-- Sebelumnya ada dua sumber: product.price_per_kg (dipakai website) dan
-- master_config harga_jual_* (dipakai form order di aplikasi), sehingga keduanya
-- bisa berbeda tanpa ketahuan. Baris master_config-nya dibuang supaya tidak ada
-- angka menganggur yang terlihat seperti kebenaran.

DELETE FROM master_config
 WHERE key IN ('harga_jual_hidup_kg','harga_jual_potong_kg','harga_jual_karkas_kg');
