-- 015 — Harga pakan dihitung per jenis (starter / grower / finisher).
--
-- Sebelumnya semua nota pakan dirata-rata jadi satu harga. Padahal harga
-- starter dan finisher beda, sehingga batch yang masih makan starter dihitung
-- terlalu murah dan yang sudah finisher terlalu mahal.
-- Sekarang: harga tiap jenis = rata-rata tertimbang nota jenis itu sendiri,
-- dan pemakaian tiap kandang dinilai sesuai jenis pakan yang dikeluarkan.

CREATE OR REPLACE VIEW v_harga_pakan_jenis AS
SELECT f.type::text AS jenis,
       SUM(t.qty_kg * t.price_per_kg) / SUM(t.qty_kg) AS harga_kg,
       SUM(t.qty_kg) AS kg_dibeli
FROM feed_transaction t JOIN feed f ON f.id = t.feed_id
WHERE t.type = 'PURCHASE' AND t.status = 'APPROVED' AND t.deleted_at IS NULL
GROUP BY f.type
HAVING SUM(t.qty_kg) > 0;

-- Biaya batch: pemakaian x harga jenisnya. Kalau jenis itu belum pernah
-- dibeli (belum ada notanya), dipakai rata-rata semua nota — tetap dari nota
-- farm sendiri, bukan angka isian.
CREATE OR REPLACE VIEW v_cycle_cost AS
SELECT c.id AS cycle_id,
       COALESCE((SELECT SUM(amount) FROM expense e
                  WHERE e.cycle_id=c.id AND e.status='APPROVED' AND e.deleted_at IS NULL),0)
     + COALESCE((SELECT SUM(-t.qty_kg * COALESCE(hj.harga_kg, (SELECT harga_kg FROM v_harga_pakan_rata)))
                   FROM feed_transaction t
                   JOIN feed f ON f.id = t.feed_id
                   LEFT JOIN v_harga_pakan_jenis hj ON hj.jenis = f.type::text
                  WHERE t.cycle_id=c.id AND t.type='USAGE'
                    AND t.status IN ('RECORDED','APPROVED') AND t.deleted_at IS NULL),0)
       AS running_cost
FROM cycle c;
