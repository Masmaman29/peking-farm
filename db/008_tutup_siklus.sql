-- ---------------------------------------------------------------------
-- PANEN & TUTUP SIKLUS
-- Tidak ada kolom saldo baru: semua angka tetap dihitung dari ledger.
-- Yang ditambah hanya penanda kapan siklus ditutup + view ringkasan.
-- ---------------------------------------------------------------------

ALTER TABLE cycle ADD COLUMN IF NOT EXISTS closed_at  timestamptz;
ALTER TABLE cycle ADD COLUMN IF NOT EXISTS closed_by  uuid REFERENCES app_user(id);
ALTER TABLE cycle ADD COLUMN IF NOT EXISTS close_note text;

-- Siklus yang sudah ditutup tidak bisa dibuka lagi atau diubah tanggalnya
CREATE OR REPLACE FUNCTION fn_cycle_closed_guard() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'CLOSED' AND NEW.status <> 'CLOSED' THEN
    RAISE EXCEPTION 'Siklus % sudah ditutup dan tidak bisa dibuka kembali.', OLD.code
      USING ERRCODE='integrity_constraint_violation';
  END IF;
  IF OLD.status = 'CLOSED' AND NEW.closed_at <> OLD.closed_at THEN
    RAISE EXCEPTION 'Tanggal penutupan siklus % tidak bisa diubah.', OLD.code
      USING ERRCODE='integrity_constraint_violation';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_cycle_closed ON cycle;
CREATE TRIGGER trg_cycle_closed BEFORE UPDATE ON cycle
  FOR EACH ROW EXECUTE FUNCTION fn_cycle_closed_guard();

-- Tidak boleh ada transaksi populasi baru pada siklus yang sudah ditutup
CREATE OR REPLACE FUNCTION fn_poptx_closed_guard() RETURNS trigger AS $$
DECLARE st cycle_status; cd text;
BEGIN
  SELECT status, code INTO st, cd FROM cycle WHERE id = NEW.cycle_id;
  IF st = 'CLOSED' THEN
    RAISE EXCEPTION 'Siklus % sudah ditutup. Catatan baru tidak bisa ditambahkan.', cd
      USING ERRCODE='integrity_constraint_violation';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_poptx_closed ON population_tx;
CREATE TRIGGER trg_poptx_closed BEFORE INSERT ON population_tx
  FOR EACH ROW EXECUTE FUNCTION fn_poptx_closed_guard();

-- Rincian populasi: tambah kolom panen (sebelumnya HARVEST tidak terhitung terpisah).
-- Kolom baru ditaruh di akhir supaya CREATE OR REPLACE tidak menolak (view lain bergantung).
CREATE OR REPLACE VIEW v_population_cycle AS
SELECT cycle_id, SUM(qty)::int AS population,
       SUM(qty)  FILTER (WHERE type='DOD_IN')::int        AS dod_in,
      -SUM(qty)  FILTER (WHERE type='DEATH')::int         AS deaths,
      -SUM(qty)  FILTER (WHERE type='SALE')::int          AS sold,
       SUM(qty)  FILTER (WHERE type='TRANSFER_IN')::int   AS transfer_in,
      -SUM(qty)  FILTER (WHERE type='TRANSFER_OUT')::int  AS transfer_out,
      -SUM(qty)  FILTER (WHERE type='HARVEST')::int       AS harvested
FROM population_tx GROUP BY cycle_id;

-- Hasil keluar per siklus (panen + penjualan biasa), dari order yang tidak dibatalkan
CREATE OR REPLACE VIEW v_cycle_out AS
SELECT oi.cycle_id,
       SUM(oi.qty) FILTER (WHERE o.source::text='PANEN')::int        AS harvest_qty,
       COALESCE(SUM(oi.weight_kg) FILTER (WHERE o.source::text='PANEN'),0) AS harvest_weight_kg,
       COALESCE(SUM(oi.weight_kg),0)                                 AS out_weight_kg,
       COALESCE(SUM(COALESCE(oi.weight_kg, oi.qty*pr.avg_weight_kg) * oi.price_per_kg),0) AS revenue
FROM order_item oi
JOIN "order" o  ON o.id = oi.order_id
JOIN product pr ON pr.id = oi.product_id
WHERE oi.cycle_id IS NOT NULL AND o.status <> 'CANCELLED'
GROUP BY oi.cycle_id;

-- Ringkasan satu siklus — semuanya turunan, tidak ada yang disimpan
CREATE OR REPLACE VIEW v_cycle_summary AS
SELECT c.id AS cycle_id, c.code, c.breed, c.dod_date, c.dod_qty, c.dod_price,
       c.status, c.stage, c.closed_at, c.close_note,
       (COALESCE(c.closed_at::date, CURRENT_DATE) - c.dod_date)      AS days,
       COALESCE(p.deaths,0)        AS deaths,
       COALESCE(p.sold,0)          AS sold,
       COALESCE(p.harvested,0)     AS harvested,
       COALESCE(p.transfer_out,0)  AS carried_out,
       COALESCE(p.population,0)    AS remaining,
       ROUND(COALESCE(p.deaths,0)::numeric * 100 / NULLIF(c.dod_qty,0), 2) AS mortality_pct,
       COALESCE(f.feed_kg,0)             AS feed_kg,
       COALESCE(o.harvest_qty,0)         AS harvest_qty,
       COALESCE(o.harvest_weight_kg,0)   AS harvest_weight_kg,
       CASE WHEN COALESCE(o.harvest_qty,0) > 0
            THEN ROUND(o.harvest_weight_kg / o.harvest_qty, 3) END    AS harvest_avg_kg,
       COALESCE(o.revenue,0)             AS revenue,
       (c.dod_qty * c.dod_price)         AS dod_cost,
       COALESCE(cc.running_cost,0)       AS operating_cost,
       (c.dod_qty * c.dod_price + COALESCE(cc.running_cost,0)) AS cost_total,
       COALESCE(o.revenue,0) - (c.dod_qty * c.dod_price + COALESCE(cc.running_cost,0)) AS profit,
       -- FCR akhir: pakan dipakai dibagi pertambahan bobot yang benar-benar keluar
       -- hanya dihitung kalau pakan memang tercatat; 0,000 akan menyesatkan
       CASE WHEN COALESCE(f.feed_kg,0) > 0
             AND (COALESCE(o.out_weight_kg,0) - c.dod_qty * c.dod_weight_kg) > 0
            THEN ROUND(f.feed_kg /
                 (COALESCE(o.out_weight_kg,0) - c.dod_qty * c.dod_weight_kg), 3) END AS fcr_final
FROM cycle c
LEFT JOIN v_population_cycle p ON p.cycle_id = c.id
LEFT JOIN v_cycle_out        o ON o.cycle_id = c.id
LEFT JOIN v_cycle_cost      cc ON cc.cycle_id = c.id
LEFT JOIN (SELECT cycle_id, -SUM(qty_kg) AS feed_kg FROM feed_transaction
           WHERE type='USAGE' AND deleted_at IS NULL AND status IN ('RECORDED','APPROVED')
           GROUP BY cycle_id) f ON f.cycle_id = c.id;
