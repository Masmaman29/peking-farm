-- =====================================================================
-- PEKING FARM — Skema PostgreSQL v1.0  (migrasi 001)
-- Prinsip: ledger bukan saldo · append-only · versi bukan overwrite
--          soft delete · approval state machine · audit hash-chain
-- Uji: psql -f 001_peking_farm_schema.sql  (PostgreSQL ≥ 14)
-- =====================================================================
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid, digest()

-- ---------------------------------------------------------------------
-- 0. ROLE DATABASE (aplikasi hanya lewat role ini)
-- ---------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='pf_app') THEN
    CREATE ROLE pf_app LOGIN PASSWORD 'CHANGE_ME';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 1. ENUM
-- ---------------------------------------------------------------------
CREATE TYPE role_code        AS ENUM ('OWNER','MANAGER','ADMIN','ANAK_KANDANG');
CREATE TYPE cycle_status     AS ENUM ('PLANNED','ACTIVE','HARVESTED','CLOSED');
CREATE TYPE cycle_stage      AS ENUM ('DOD_IN','BROODING','GROWING','FINISHING','HARVEST');
CREATE TYPE pop_tx_type      AS ENUM ('DOD_IN','TRANSFER_IN','DEATH','SALE','TRANSFER_OUT','HARVEST','CORRECTION');
CREATE TYPE record_status    AS ENUM ('RECORDED','PENDING','APPROVED','REJECTED','SUPERSEDED');
CREATE TYPE feed_tx_type     AS ENUM ('PURCHASE','USAGE','ADJUSTMENT','TRANSFER_IN','TRANSFER_OUT');
CREATE TYPE feed_type        AS ENUM ('STARTER','GROWER','FINISHER');
CREATE TYPE health_type      AS ENUM ('VACCINE','VITAMIN','TREATMENT','OBSERVATION');
CREATE TYPE expense_category AS ENUM ('DOD','PAKAN','VITAMIN','OBAT','LISTRIK','GAS','SEKAM','TENAGA_KERJA','TRANSPORT','PERALATAN','MAINTENANCE','LAIN');
CREATE TYPE inv_tx_type      AS ENUM ('IN','OUT','ADJUSTMENT');
CREATE TYPE product_type     AS ENUM ('LIVE','CUT','CARCASS');
CREATE TYPE order_source     AS ENUM ('ADMIN','WEBSITE');
CREATE TYPE order_status     AS ENUM ('NEW','PENDING_APPROVAL','CONFIRMED','PAID','PREPARING','READY','DELIVERED','CANCELLED');
CREATE TYPE payment_status   AS ENUM ('UNPAID','DP','PAID','REFUNDED');
CREATE TYPE shipping_status  AS ENUM ('PENDING','PREPARING','READY','DELIVERED');
CREATE TYPE approval_status  AS ENUM ('PENDING','APPROVED','REJECTED');
CREATE TYPE anomaly_severity AS ENUM ('INFO','WARNING','CRITICAL');
CREATE TYPE anomaly_status   AS ENUM ('OPEN','VERIFIED','DISMISSED');
CREATE TYPE audit_action     AS ENUM ('CREATE','UPDATE','DELETE_REQUEST','APPROVE','REJECT','LOGIN','LOGOUT','UPLOAD','CORRECTION','STOCK_ADJUSTMENT','STOCK_OPNAME','APPROVAL','CONFIG');

-- ---------------------------------------------------------------------
-- 2. FUNGSI UMUM: updated_at, soft-delete guard, append-only guard
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$ LANGUAGE plpgsql;

-- Menolak UPDATE/DELETE fisik pada tabel ledger & audit
CREATE OR REPLACE FUNCTION fn_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Tabel % bersifat append-only (%). Gunakan transaksi koreksi.', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'integrity_constraint_violation';
END $$ LANGUAGE plpgsql;

-- Menolak DELETE fisik; hanya soft delete via kolom deleted_at
CREATE OR REPLACE FUNCTION fn_no_hard_delete() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Hapus fisik tidak diizinkan pada %. Gunakan soft delete dengan approval.', TG_TABLE_NAME
    USING ERRCODE = 'integrity_constraint_violation';
END $$ LANGUAGE plpgsql;

-- Menolak UPDATE pada record yang sudah locked (kecuali kolom status/lock/soft-delete oleh proses koreksi)
CREATE OR REPLACE FUNCTION fn_lock_guard() RETURNS trigger AS $$
BEGIN
  IF OLD.locked AND NEW.locked AND
     to_jsonb(NEW) - 'status' - 'updated_at' - 'updated_by' - 'deleted_at' - 'deleted_by' - 'delete_reason' - 'locked_at'
     <> to_jsonb(OLD) - 'status' - 'updated_at' - 'updated_by' - 'deleted_at' - 'deleted_by' - 'delete_reason' - 'locked_at'
  THEN
    RAISE EXCEPTION 'Record % terkunci. Ajukan koreksi (correction_request).', OLD.id
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 3. MASTER
-- ---------------------------------------------------------------------
CREATE TABLE farm (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  location    text,
  lat         numeric(9,6), lng numeric(9,6),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE barn (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id     uuid NOT NULL REFERENCES farm(id),
  code        text NOT NULL,
  name        text NOT NULL,
  capacity    int  NOT NULL CHECK (capacity > 0),
  is_active   boolean NOT NULL DEFAULT true,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (farm_id, code)
);

CREATE TABLE app_user (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id        uuid NOT NULL REFERENCES farm(id),
  name           text NOT NULL,
  phone          text NOT NULL UNIQUE,
  role           role_code NOT NULL,
  barn_id        uuid REFERENCES barn(id),           -- wajib untuk ANAK_KANDANG
  password_hash  text,                                -- argon2id; NULL sampai aktivasi
  is_active      boolean NOT NULL DEFAULT true,
  last_login_at  timestamptz,
  failed_logins  int NOT NULL DEFAULT 0,
  locked_until   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (role <> 'ANAK_KANDANG' OR barn_id IS NOT NULL)
);

CREATE TABLE master_config (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  description text,
  updated_by  uuid REFERENCES app_user(id),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE feed (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  type          feed_type NOT NULL,
  unit          text NOT NULL DEFAULT 'kg',
  default_price numeric(14,2) NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true
);

CREATE TABLE inventory (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id   uuid NOT NULL REFERENCES farm(id),
  name      text NOT NULL,
  category  text NOT NULL,                 -- Vitamin/Obat/Sekam/Peralatan/Produk panen
  unit      text NOT NULL,
  min_qty   numeric(14,3) NOT NULL DEFAULT 0,
  avg_weight_kg numeric(6,3),              -- untuk produk panen
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE product (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id        uuid NOT NULL REFERENCES farm(id),
  name           text NOT NULL,
  type           product_type NOT NULL,
  description    text,
  price_per_kg   numeric(14,2) NOT NULL,
  min_order      int NOT NULL DEFAULT 1,
  avg_weight_kg  numeric(6,3) NOT NULL,
  stock_source   text NOT NULL CHECK (stock_source IN ('POPULATION','INVENTORY')),
  inventory_id   uuid REFERENCES inventory(id),
  is_published   boolean NOT NULL DEFAULT true,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (stock_source <> 'INVENTORY' OR inventory_id IS NOT NULL)
);

CREATE TABLE customer (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  phone      text NOT NULL,
  type       text NOT NULL DEFAULT 'Retail',
  address    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 4. SIKLUS
-- ---------------------------------------------------------------------
CREATE TABLE cycle (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id           uuid NOT NULL REFERENCES farm(id),
  code              text NOT NULL,                          -- '#001'
  breed             text NOT NULL DEFAULT 'Bebek Peking',
  dod_date          date NOT NULL,
  dod_qty           int  NOT NULL CHECK (dod_qty > 0),
  dod_price         numeric(14,2) NOT NULL CHECK (dod_price >= 0),
  dod_weight_kg     numeric(6,3) NOT NULL DEFAULT 0.055,
  target_days       int  NOT NULL DEFAULT 45,
  target_weight_min numeric(6,3) NOT NULL DEFAULT 1.5,
  target_weight_max numeric(6,3) NOT NULL DEFAULT 1.8,
  target_mort_pct   numeric(5,2) NOT NULL DEFAULT 5,
  target_curve      jsonb NOT NULL,                          -- [[hari,kg],...]
  status            cycle_status NOT NULL DEFAULT 'PLANNED',
  stage             cycle_stage  NOT NULL DEFAULT 'DOD_IN',
  locked            boolean NOT NULL DEFAULT false,          -- true setelah DOD_IN
  created_by        uuid NOT NULL REFERENCES app_user(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_by        uuid REFERENCES app_user(id),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (farm_id, code)
);

-- Kunci dod_qty/dod_price setelah DOD masuk
CREATE OR REPLACE FUNCTION fn_cycle_lock_guard() RETURNS trigger AS $$
BEGIN
  IF OLD.locked AND (NEW.dod_qty <> OLD.dod_qty OR NEW.dod_price <> OLD.dod_price OR NEW.dod_date <> OLD.dod_date) THEN
    RAISE EXCEPTION 'Jumlah/harga/tanggal DOD siklus % terkunci. Ajukan koreksi ke OWNER.', OLD.code
      USING ERRCODE='integrity_constraint_violation';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_cycle_lock BEFORE UPDATE ON cycle FOR EACH ROW EXECUTE FUNCTION fn_cycle_lock_guard();
CREATE TRIGGER trg_cycle_upd  BEFORE UPDATE ON cycle FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ---------------------------------------------------------------------
-- 5. LEDGER POPULASI (append-only)  — populasi = SUM(qty)
-- ---------------------------------------------------------------------
CREATE TABLE population_tx (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id    uuid NOT NULL REFERENCES cycle(id),
  barn_id     uuid NOT NULL REFERENCES barn(id),
  type        pop_tx_type NOT NULL,
  qty         int NOT NULL CHECK (qty <> 0),
  ref_type    text NOT NULL,             -- 'mortality' | 'order_item' | 'cycle' | 'correction_request' | 'transfer'
  ref_id      uuid NOT NULL,
  occurred_at timestamptz NOT NULL,
  created_by  uuid NOT NULL REFERENCES app_user(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK ((type IN ('DOD_IN','TRANSFER_IN') AND qty > 0) OR (type IN ('DEATH','SALE','TRANSFER_OUT','HARVEST') AND qty < 0) OR type = 'CORRECTION')
);
CREATE INDEX ix_poptx_cycle ON population_tx(cycle_id, occurred_at);
CREATE INDEX ix_poptx_barn  ON population_tx(barn_id, occurred_at);
CREATE TRIGGER trg_poptx_ro BEFORE UPDATE OR DELETE ON population_tx FOR EACH ROW EXECUTE FUNCTION fn_append_only();

-- ---------------------------------------------------------------------
-- 6. RECORD OPERASIONAL (locked + versi + soft delete)
-- ---------------------------------------------------------------------
-- Pola kolom umum: status, locked, locked_at, supersedes_id, deleted_*
CREATE TABLE mortality (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id      uuid NOT NULL REFERENCES cycle(id),
  barn_id       uuid NOT NULL REFERENCES barn(id),
  qty           int  NOT NULL CHECK (qty > 0),
  cause         text NOT NULL DEFAULT 'Belum diketahui',
  note          text,
  occurred_at   timestamptz NOT NULL,
  gps_lat       numeric(9,6), gps_lng numeric(9,6),
  status        record_status NOT NULL DEFAULT 'RECORDED',
  locked        boolean NOT NULL DEFAULT false,
  locked_at     timestamptz,
  supersedes_id uuid REFERENCES mortality(id),
  deleted_at    timestamptz, deleted_by uuid REFERENCES app_user(id), delete_reason text,
  created_by    uuid NOT NULL REFERENCES app_user(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    uuid REFERENCES app_user(id),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_mort_cycle ON mortality(cycle_id, occurred_at) WHERE deleted_at IS NULL AND status <> 'SUPERSEDED';
CREATE TRIGGER trg_mort_lock BEFORE UPDATE ON mortality FOR EACH ROW EXECUTE FUNCTION fn_lock_guard();
CREATE TRIGGER trg_mort_nodel BEFORE DELETE ON mortality FOR EACH ROW EXECUTE FUNCTION fn_no_hard_delete();
CREATE TRIGGER trg_mort_upd  BEFORE UPDATE ON mortality FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Setiap kematian otomatis membuat baris ledger DEATH (satu transaksi DB)
CREATE OR REPLACE FUNCTION fn_mortality_to_ledger() RETURNS trigger AS $$
BEGIN
  INSERT INTO population_tx(cycle_id, barn_id, type, qty, ref_type, ref_id, occurred_at, created_by)
  VALUES (NEW.cycle_id, NEW.barn_id, 'DEATH', -NEW.qty, 'mortality', NEW.id, NEW.occurred_at, NEW.created_by);
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_mort_ledger AFTER INSERT ON mortality FOR EACH ROW EXECUTE FUNCTION fn_mortality_to_ledger();

CREATE TABLE feed_transaction (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id      uuid REFERENCES cycle(id),            -- NULL untuk pembelian lintas siklus
  barn_id       uuid REFERENCES barn(id),             -- wajib untuk USAGE
  feed_id       uuid NOT NULL REFERENCES feed(id),
  type          feed_tx_type NOT NULL,
  qty_kg        numeric(12,3) NOT NULL CHECK (qty_kg <> 0),
  price_per_kg  numeric(14,2),                         -- PURCHASE
  vendor        text, ref_no text,                     -- PURCHASE
  reason        text,                                  -- ADJUSTMENT
  occurred_at   timestamptz NOT NULL,
  status        record_status NOT NULL DEFAULT 'RECORDED',   -- PURCHASE besar: PENDING → APPROVED
  locked        boolean NOT NULL DEFAULT false, locked_at timestamptz,
  supersedes_id uuid REFERENCES feed_transaction(id),
  deleted_at timestamptz, deleted_by uuid REFERENCES app_user(id), delete_reason text,
  created_by    uuid NOT NULL REFERENCES app_user(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    uuid REFERENCES app_user(id),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CHECK ((type='PURCHASE' AND qty_kg>0 AND price_per_kg IS NOT NULL) OR (type='USAGE' AND qty_kg<0 AND barn_id IS NOT NULL) OR type IN ('ADJUSTMENT','TRANSFER_IN','TRANSFER_OUT'))
);
CREATE INDEX ix_feedtx_cycle ON feed_transaction(cycle_id, occurred_at) WHERE deleted_at IS NULL AND status IN ('RECORDED','APPROVED');
CREATE TRIGGER trg_feed_lock  BEFORE UPDATE ON feed_transaction FOR EACH ROW EXECUTE FUNCTION fn_lock_guard();
CREATE TRIGGER trg_feed_nodel BEFORE DELETE ON feed_transaction FOR EACH ROW EXECUTE FUNCTION fn_no_hard_delete();
CREATE TRIGGER trg_feed_upd   BEFORE UPDATE ON feed_transaction FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE feed_stock_opname (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id        uuid NOT NULL REFERENCES feed(id),
  physical_kg    numeric(12,3) NOT NULL CHECK (physical_kg >= 0),
  theoretical_kg numeric(12,3) NOT NULL,        -- snapshot saat opname (diisi aplikasi dari view)
  diff_kg        numeric(12,3) GENERATED ALWAYS AS (theoretical_kg - physical_kg) STORED,
  note           text,
  occurred_at    timestamptz NOT NULL,
  created_by     uuid NOT NULL REFERENCES app_user(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_opname_ro BEFORE UPDATE OR DELETE ON feed_stock_opname FOR EACH ROW EXECUTE FUNCTION fn_append_only();

CREATE TABLE weight_record (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id      uuid NOT NULL REFERENCES cycle(id),
  barn_id       uuid NOT NULL REFERENCES barn(id),
  sample_n      int NOT NULL CHECK (sample_n > 0),
  total_kg      numeric(10,3) NOT NULL CHECK (total_kg > 0),
  avg_kg        numeric(8,4) GENERATED ALWAYS AS (total_kg / sample_n) STORED,   -- tidak bisa diinput manual
  occurred_at   timestamptz NOT NULL,
  status        record_status NOT NULL DEFAULT 'RECORDED',
  locked        boolean NOT NULL DEFAULT false, locked_at timestamptz,
  supersedes_id uuid REFERENCES weight_record(id),
  deleted_at timestamptz, deleted_by uuid REFERENCES app_user(id), delete_reason text,
  created_by    uuid NOT NULL REFERENCES app_user(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    uuid REFERENCES app_user(id),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_weight_cycle ON weight_record(cycle_id, occurred_at) WHERE deleted_at IS NULL AND status <> 'SUPERSEDED';
CREATE TRIGGER trg_w_lock  BEFORE UPDATE ON weight_record FOR EACH ROW EXECUTE FUNCTION fn_lock_guard();
CREATE TRIGGER trg_w_nodel BEFORE DELETE ON weight_record FOR EACH ROW EXECUTE FUNCTION fn_no_hard_delete();
CREATE TRIGGER trg_w_upd   BEFORE UPDATE ON weight_record FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE health_record (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id     uuid NOT NULL REFERENCES cycle(id),
  barn_id      uuid REFERENCES barn(id),               -- NULL = semua kandang
  type         health_type NOT NULL,
  item         text NOT NULL,
  dose         text,
  withdrawal_until date,                               -- masa henti obat sebelum panen
  note         text,
  occurred_at  timestamptz NOT NULL,
  locked       boolean NOT NULL DEFAULT false, locked_at timestamptz,
  deleted_at timestamptz, deleted_by uuid REFERENCES app_user(id), delete_reason text,
  created_by   uuid NOT NULL REFERENCES app_user(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_h_nodel BEFORE DELETE ON health_record FOR EACH ROW EXECUTE FUNCTION fn_no_hard_delete();

CREATE TABLE barn_condition (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id    uuid NOT NULL REFERENCES cycle(id),
  barn_id     uuid NOT NULL REFERENCES barn(id),
  temp_c      numeric(4,1), humidity_pct numeric(4,1),
  litter      text CHECK (litter IN ('Kering','Agak lembab','Basah')),
  water       text CHECK (water  IN ('Lancar','Tersendat','Kosong')),
  behavior    text CHECK (behavior IN ('Aktif','Lesu','Menggerombol')),
  note        text,
  occurred_at timestamptz NOT NULL,
  created_by  uuid NOT NULL REFERENCES app_user(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_bc_ro BEFORE UPDATE OR DELETE ON barn_condition FOR EACH ROW EXECUTE FUNCTION fn_append_only();

-- ---------------------------------------------------------------------
-- 7. KEUANGAN, INVENTORY, PENJUALAN
-- ---------------------------------------------------------------------
CREATE TABLE expense (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id     uuid NOT NULL REFERENCES cycle(id),
  category     expense_category NOT NULL,
  amount       numeric(14,2) NOT NULL CHECK (amount > 0),
  vendor       text NOT NULL,
  ref_no       text NOT NULL,
  note         text,
  occurred_at  date NOT NULL,
  status       record_status NOT NULL DEFAULT 'RECORDED',
  locked       boolean NOT NULL DEFAULT false, locked_at timestamptz,
  deleted_at timestamptz, deleted_by uuid REFERENCES app_user(id), delete_reason text,
  created_by   uuid NOT NULL REFERENCES app_user(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   uuid REFERENCES app_user(id),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_exp_lock  BEFORE UPDATE ON expense FOR EACH ROW EXECUTE FUNCTION fn_lock_guard();
CREATE TRIGGER trg_exp_nodel BEFORE DELETE ON expense FOR EACH ROW EXECUTE FUNCTION fn_no_hard_delete();
CREATE TRIGGER trg_exp_upd   BEFORE UPDATE ON expense FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TABLE inventory_tx (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL REFERENCES inventory(id),
  type         inv_tx_type NOT NULL,
  qty          numeric(14,3) NOT NULL CHECK (qty <> 0),
  ref_type     text NOT NULL, ref_id uuid,
  note         text,
  occurred_at  timestamptz NOT NULL,
  created_by   uuid NOT NULL REFERENCES app_user(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  CHECK ((type='IN' AND qty>0) OR (type='OUT' AND qty<0) OR type='ADJUSTMENT')
);
CREATE INDEX ix_invtx_item ON inventory_tx(inventory_id, occurred_at);
CREATE TRIGGER trg_invtx_ro BEFORE UPDATE OR DELETE ON inventory_tx FOR EACH ROW EXECUTE FUNCTION fn_append_only();

CREATE TABLE "order" (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL UNIQUE,                       -- ORD-0008
  customer_id     uuid NOT NULL REFERENCES customer(id),
  source          order_source NOT NULL,
  status          order_status NOT NULL DEFAULT 'NEW',
  payment_status  payment_status NOT NULL DEFAULT 'UNPAID',
  shipping_status shipping_status NOT NULL DEFAULT 'PENDING',
  pickup_date     date,
  address         text, note text,
  total_est       numeric(14,2) NOT NULL DEFAULT 0,
  total_final     numeric(14,2),
  stock_applied   boolean NOT NULL DEFAULT false,             -- true setelah ledger OUT dibuat
  decided_by      uuid REFERENCES app_user(id), decided_at timestamptz,
  created_by      uuid REFERENCES app_user(id),               -- NULL = website
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_order_upd BEFORE UPDATE ON "order" FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- State machine status order
CREATE OR REPLACE FUNCTION fn_order_status_guard() RETURNS trigger AS $$
DECLARE ok boolean := false;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  ok := CASE OLD.status
    WHEN 'NEW'              THEN NEW.status IN ('CONFIRMED','PENDING_APPROVAL','CANCELLED')
    WHEN 'PENDING_APPROVAL' THEN NEW.status IN ('CONFIRMED','CANCELLED')
    WHEN 'CONFIRMED'        THEN NEW.status IN ('PAID','PREPARING','CANCELLED')
    WHEN 'PAID'             THEN NEW.status IN ('PREPARING','READY','DELIVERED','CANCELLED')
    WHEN 'PREPARING'        THEN NEW.status IN ('READY','DELIVERED','CANCELLED')
    WHEN 'READY'            THEN NEW.status IN ('DELIVERED','CANCELLED')
    ELSE false END;
  IF NOT ok THEN
    RAISE EXCEPTION 'Transisi status order % → % tidak diizinkan', OLD.status, NEW.status USING ERRCODE='check_violation';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_order_status BEFORE UPDATE ON "order" FOR EACH ROW EXECUTE FUNCTION fn_order_status_guard();

CREATE TABLE order_item (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES "order"(id),
  product_id   uuid NOT NULL REFERENCES product(id),
  cycle_id     uuid REFERENCES cycle(id),            -- untuk produk LIVE
  barn_id      uuid REFERENCES barn(id),
  qty          int NOT NULL CHECK (qty > 0),
  weight_kg    numeric(10,3),                        -- diisi saat timbang serah terima
  price_per_kg numeric(14,2) NOT NULL
);

CREATE TABLE sale (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES "order"(id),
  amount      numeric(14,2) NOT NULL CHECK (amount > 0),
  method      text NOT NULL,
  paid_at     timestamptz NOT NULL,
  ref_no      text,
  created_by  uuid NOT NULL REFERENCES app_user(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_sale_ro BEFORE UPDATE OR DELETE ON sale FOR EACH ROW EXECUTE FUNCTION fn_append_only();

-- ---------------------------------------------------------------------
-- 8. APPROVAL, KOREKSI, BUKTI
-- ---------------------------------------------------------------------
CREATE TABLE approval (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   text NOT NULL,     -- 'correction_request' | 'feed_transaction' | 'expense' | 'order' | 'delete_request'
  entity_id     uuid NOT NULL,
  required_role role_code NOT NULL DEFAULT 'MANAGER',
  status        approval_status NOT NULL DEFAULT 'PENDING',
  requested_by  uuid NOT NULL REFERENCES app_user(id),
  requested_at  timestamptz NOT NULL DEFAULT now(),
  decided_by    uuid REFERENCES app_user(id),
  decided_at    timestamptz,
  reject_reason text,
  CHECK (status='PENDING' OR (decided_by IS NOT NULL AND decided_at IS NOT NULL)),
  CHECK (status<>'REJECTED' OR reject_reason IS NOT NULL),
  CHECK (decided_by IS NULL OR decided_by <> requested_by)     -- tidak boleh approve sendiri
);
CREATE INDEX ix_approval_pending ON approval(status) WHERE status='PENDING';

-- Keputusan approval tidak bisa diubah lagi
CREATE OR REPLACE FUNCTION fn_approval_final() RETURNS trigger AS $$
BEGIN
  IF OLD.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Approval % sudah diputuskan (%)', OLD.id, OLD.status USING ERRCODE='integrity_constraint_violation';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_approval_final BEFORE UPDATE ON approval FOR EACH ROW EXECUTE FUNCTION fn_approval_final();
CREATE TRIGGER trg_approval_nodel BEFORE DELETE ON approval FOR EACH ROW EXECUTE FUNCTION fn_no_hard_delete();

CREATE TABLE correction_request (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  text NOT NULL,      -- 'mortality' | 'feed_transaction' | 'weight_record' | 'expense' | 'cycle'
  entity_id    uuid NOT NULL,
  field        text NOT NULL,
  old_value    jsonb NOT NULL,
  new_value    jsonb NOT NULL,
  reason       text NOT NULL,
  approval_id  uuid NOT NULL REFERENCES approval(id),
  new_entity_id uuid,              -- diisi saat disetujui: id versi baru
  created_by   uuid NOT NULL REFERENCES app_user(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_corr_nodel BEFORE DELETE ON correction_request FOR EACH ROW EXECUTE FUNCTION fn_no_hard_delete();

CREATE TABLE attachment (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   text NOT NULL,
  entity_id     uuid NOT NULL,
  kind          text NOT NULL,     -- 'nota' | 'timbangan' | 'stok' | 'kandang' | 'kematian' | 'koreksi'
  file_url      text NOT NULL,
  sha256        char(64) NOT NULL,
  mime          text NOT NULL,
  size_bytes    bigint NOT NULL,
  taken_at      timestamptz,       -- dari EXIF
  gps_lat       numeric(9,6), gps_lng numeric(9,6),
  version       int NOT NULL DEFAULT 1,
  supersedes_id uuid REFERENCES attachment(id),
  uploaded_by   uuid NOT NULL REFERENCES app_user(id),
  uploaded_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_att_entity ON attachment(entity_type, entity_id);
CREATE TRIGGER trg_att_ro BEFORE UPDATE OR DELETE ON attachment FOR EACH ROW EXECUTE FUNCTION fn_append_only();

-- ---------------------------------------------------------------------
-- 9. AUDIT LOG (append-only + hash chain)
-- ---------------------------------------------------------------------
CREATE TABLE audit_log (
  id          bigserial PRIMARY KEY,
  actor_id    uuid REFERENCES app_user(id),      -- NULL = SYSTEM
  action      audit_action NOT NULL,
  entity_type text NOT NULL,
  entity_id   text,
  detail      text NOT NULL,
  before      jsonb, after jsonb,
  ip          inet, user_agent text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  prev_hash   char(64),
  hash        char(64) NOT NULL
);
CREATE INDEX ix_audit_time   ON audit_log(occurred_at DESC);
CREATE INDEX ix_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX ix_audit_actor  ON audit_log(actor_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION fn_audit_hash() RETURNS trigger AS $$
DECLARE last_hash char(64);
BEGIN
  SELECT hash INTO last_hash FROM audit_log ORDER BY id DESC LIMIT 1 FOR UPDATE;
  NEW.prev_hash := last_hash;
  NEW.hash := encode(digest(
      coalesce(last_hash,'') || coalesce(NEW.actor_id::text,'SYSTEM') || NEW.action::text || NEW.entity_type ||
      coalesce(NEW.entity_id,'') || NEW.detail || coalesce(NEW.before::text,'') || coalesce(NEW.after::text,'') ||
      NEW.occurred_at::text, 'sha256'),'hex');
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_audit_hash BEFORE INSERT ON audit_log FOR EACH ROW EXECUTE FUNCTION fn_audit_hash();
CREATE TRIGGER trg_audit_ro   BEFORE UPDATE OR DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION fn_append_only();

-- Verifikasi rantai (dijalankan cron harian): mengembalikan id pertama yang rusak, atau NULL
CREATE OR REPLACE FUNCTION fn_audit_verify_chain() RETURNS bigint AS $$
DECLARE r record; prev char(64) := NULL; calc char(64);
BEGIN
  FOR r IN SELECT * FROM audit_log ORDER BY id LOOP
    calc := encode(digest(coalesce(prev,'')||coalesce(r.actor_id::text,'SYSTEM')||r.action::text||r.entity_type||
              coalesce(r.entity_id,'')||r.detail||coalesce(r.before::text,'')||coalesce(r.after::text,'')||r.occurred_at::text,'sha256'),'hex');
    IF calc <> r.hash OR coalesce(r.prev_hash,'') <> coalesce(prev,'') THEN RETURN r.id; END IF;
    prev := r.hash;
  END LOOP;
  RETURN NULL;
END $$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 10. ANOMALI & NOTIFIKASI
-- ---------------------------------------------------------------------
CREATE TABLE anomaly (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id     uuid REFERENCES cycle(id),
  rule_code    text NOT NULL,                       -- FEED_DEV, FEED_DIFF, MORT_DAILY, ...
  severity     anomaly_severity NOT NULL,
  entity_type  text, entity_id uuid,
  title        text NOT NULL,
  detail       text NOT NULL,
  status       anomaly_status NOT NULL DEFAULT 'OPEN',
  verified_by  uuid REFERENCES app_user(id), verified_at timestamptz, verify_note text,
  detected_at  timestamptz NOT NULL DEFAULT now(),
  dedupe_key   text NOT NULL UNIQUE                 -- rule_code|entity|tanggal → cegah duplikat
);
CREATE INDEX ix_anomaly_open ON anomaly(status, severity) WHERE status='OPEN';

CREATE TABLE notification (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES app_user(id),
  type       text NOT NULL,        -- approval_pending, anomaly, stock_low, mortality_abnormal, weight_below_target, feed_abnormal, new_order, payment, correction_request
  title      text NOT NULL, body text, link text,
  read_at    timestamptz, sent_wa_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_notif_user ON notification(user_id, read_at) ;

-- ---------------------------------------------------------------------
-- 11. VIEW TURUNAN (single source of truth)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_population AS
SELECT cycle_id, barn_id, SUM(qty)::int AS population
FROM population_tx GROUP BY cycle_id, barn_id;

CREATE OR REPLACE VIEW v_population_cycle AS
SELECT cycle_id, SUM(qty)::int AS population,
       SUM(qty) FILTER (WHERE type='DOD_IN')::int       AS dod_in,
       -SUM(qty) FILTER (WHERE type='DEATH')::int       AS deaths,
       -SUM(qty) FILTER (WHERE type='SALE')::int        AS sold,
       SUM(qty) FILTER (WHERE type='TRANSFER_IN')::int  AS transfer_in,
       -SUM(qty) FILTER (WHERE type='TRANSFER_OUT')::int AS transfer_out
FROM population_tx GROUP BY cycle_id;

CREATE OR REPLACE VIEW v_feed_stock AS
SELECT feed_id,
       SUM(qty_kg) FILTER (WHERE type='PURCHASE' AND status='APPROVED')          AS purchased_kg,
       -SUM(qty_kg) FILTER (WHERE type='USAGE'    AND status IN ('RECORDED','APPROVED')) AS used_kg,
       SUM(qty_kg) FILTER (WHERE type='ADJUSTMENT' AND status='APPROVED')        AS adjusted_kg,
       SUM(qty_kg) FILTER (WHERE status IN ('RECORDED','APPROVED') AND (type<>'PURCHASE' OR status='APPROVED')) AS theoretical_kg
FROM feed_transaction WHERE deleted_at IS NULL GROUP BY feed_id;

CREATE OR REPLACE VIEW v_feed_daily AS
SELECT cycle_id, barn_id, (occurred_at AT TIME ZONE 'Asia/Jakarta')::date AS day, -SUM(qty_kg) AS kg
FROM feed_transaction WHERE type='USAGE' AND deleted_at IS NULL AND status IN ('RECORDED','APPROVED')
GROUP BY 1,2,3;

CREATE OR REPLACE VIEW v_inventory_stock AS
SELECT i.id AS inventory_id, i.name, i.unit, i.min_qty,
       COALESCE(SUM(t.qty),0) AS qty,
       COALESCE(SUM(t.qty),0) < i.min_qty AS below_min
FROM inventory i LEFT JOIN inventory_tx t ON t.inventory_id=i.id
GROUP BY i.id;

-- Bobot rata-rata terakhir per siklus (dari sampel pada tanggal timbang terakhir)
CREATE OR REPLACE VIEW v_weight_latest AS
WITH last AS (
  SELECT cycle_id, MAX((occurred_at AT TIME ZONE 'Asia/Jakarta')::date) AS day
  FROM weight_record WHERE deleted_at IS NULL AND status<>'SUPERSEDED' GROUP BY cycle_id)
SELECT w.cycle_id, l.day, SUM(w.sample_n) AS sample_n, SUM(w.total_kg) AS total_kg,
       SUM(w.total_kg)/SUM(w.sample_n) AS avg_kg
FROM weight_record w JOIN last l ON l.cycle_id=w.cycle_id AND (w.occurred_at AT TIME ZONE 'Asia/Jakarta')::date=l.day
WHERE w.deleted_at IS NULL AND w.status<>'SUPERSEDED' GROUP BY w.cycle_id, l.day;

-- FCR transparan
CREATE OR REPLACE VIEW v_fcr AS
SELECT c.id AS cycle_id,
       f.feed_kg,
       p.population, w.avg_kg,
       (p.population*w.avg_kg - c.dod_qty*c.dod_weight_kg) AS biomass_gain_kg,
       CASE WHEN (p.population*w.avg_kg - c.dod_qty*c.dod_weight_kg) > 0
            AND (CURRENT_DATE - c.dod_date) >= 7
            THEN f.feed_kg / (p.population*w.avg_kg - c.dod_qty*c.dod_weight_kg) END AS fcr
FROM cycle c
JOIN v_population_cycle p ON p.cycle_id=c.id
LEFT JOIN v_weight_latest w ON w.cycle_id=c.id
LEFT JOIN (SELECT cycle_id, -SUM(qty_kg) AS feed_kg FROM feed_transaction
           WHERE type='USAGE' AND deleted_at IS NULL AND status IN ('RECORDED','APPROVED') GROUP BY cycle_id) f ON f.cycle_id=c.id;

-- Modal berjalan per siklus
CREATE OR REPLACE VIEW v_cycle_cost AS
SELECT c.id AS cycle_id,
       COALESCE((SELECT SUM(amount) FROM expense e WHERE e.cycle_id=c.id AND e.status='APPROVED' AND e.deleted_at IS NULL),0)
     + COALESCE((SELECT SUM(qty_kg*price_per_kg) FROM feed_transaction t WHERE t.cycle_id=c.id AND t.type='PURCHASE' AND t.status='APPROVED' AND t.deleted_at IS NULL),0)
       AS running_cost
FROM cycle c;

-- Stok produk untuk website
CREATE OR REPLACE VIEW v_product_public AS
SELECT pr.id, pr.name, pr.type, pr.description, pr.price_per_kg, pr.min_order, pr.avg_weight_kg,
       CASE WHEN pr.stock_source='POPULATION'
            THEN (SELECT COALESCE(SUM(population),0) FROM v_population_cycle vp JOIN cycle c ON c.id=vp.cycle_id WHERE c.status='ACTIVE' AND c.farm_id=pr.farm_id)
            ELSE (SELECT qty FROM v_inventory_stock WHERE inventory_id=pr.inventory_id) END AS available_stock,
       CASE WHEN pr.stock_source='POPULATION' THEN (SELECT MIN(dod_date + target_days) FROM cycle WHERE status='ACTIVE' AND farm_id=pr.farm_id) END AS harvest_date
FROM product pr WHERE pr.is_published;

-- ---------------------------------------------------------------------
-- 12. FUNGSI BISNIS: konfirmasi order → stok berkurang (atomik)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_order_apply_stock(p_order uuid, p_actor uuid) RETURNS void AS $$
DECLARE it record; pr record; avail numeric;
BEGIN
  IF (SELECT stock_applied FROM "order" WHERE id=p_order) THEN RETURN; END IF;
  FOR it IN SELECT * FROM order_item WHERE order_id=p_order LOOP
    SELECT * INTO pr FROM product WHERE id=it.product_id;
    IF pr.stock_source='POPULATION' THEN
      SELECT population INTO avail FROM v_population WHERE cycle_id=it.cycle_id AND barn_id=it.barn_id;
      IF COALESCE(avail,0) < it.qty THEN RAISE EXCEPTION 'Stok populasi tidak cukup (% < %)', COALESCE(avail,0), it.qty; END IF;
      INSERT INTO population_tx(cycle_id,barn_id,type,qty,ref_type,ref_id,occurred_at,created_by)
      VALUES (it.cycle_id,it.barn_id,'SALE',-it.qty,'order_item',it.id,now(),p_actor);
    ELSE
      SELECT qty INTO avail FROM v_inventory_stock WHERE inventory_id=pr.inventory_id;
      IF COALESCE(avail,0) < it.qty THEN RAISE EXCEPTION 'Stok % tidak cukup (% < %)', pr.name, COALESCE(avail,0), it.qty; END IF;
      INSERT INTO inventory_tx(inventory_id,type,qty,ref_type,ref_id,occurred_at,created_by)
      VALUES (pr.inventory_id,'OUT',-it.qty,'order_item',it.id,now(),p_actor);
    END IF;
  END LOOP;
  UPDATE "order" SET stock_applied=true WHERE id=p_order;
END $$ LANGUAGE plpgsql;

-- Kunci otomatis record > 24 jam (dipanggil cron tiap jam)
CREATE OR REPLACE FUNCTION fn_auto_lock() RETURNS int AS $$
DECLARE n int := 0; k int;
BEGIN
  UPDATE mortality        SET locked=true, locked_at=now() WHERE NOT locked AND created_at < now()-interval '24 hours'; GET DIAGNOSTICS k=ROW_COUNT; n:=n+k;
  UPDATE feed_transaction SET locked=true, locked_at=now() WHERE NOT locked AND created_at < now()-interval '24 hours' AND status<>'PENDING'; GET DIAGNOSTICS k=ROW_COUNT; n:=n+k;
  UPDATE weight_record    SET locked=true, locked_at=now() WHERE NOT locked AND created_at < now()-interval '24 hours'; GET DIAGNOSTICS k=ROW_COUNT; n:=n+k;
  UPDATE expense          SET locked=true, locked_at=now() WHERE NOT locked AND created_at < now()-interval '24 hours' AND status<>'PENDING'; GET DIAGNOSTICS k=ROW_COUNT; n:=n+k;
  RETURN n;
END $$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 13. ROW-LEVEL SECURITY untuk ANAK_KANDANG (aplikasi SET LOCAL app.user_id / app.role / app.barn_id)
-- ---------------------------------------------------------------------
ALTER TABLE mortality        ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_record    ENABLE ROW LEVEL SECURITY;
ALTER TABLE barn_condition   ENABLE ROW LEVEL SECURITY;

CREATE POLICY p_mort_ak ON mortality FOR ALL TO pf_app
  USING (current_setting('app.role',true) <> 'ANAK_KANDANG' OR barn_id = current_setting('app.barn_id',true)::uuid)
  WITH CHECK (current_setting('app.role',true) <> 'ANAK_KANDANG' OR barn_id = current_setting('app.barn_id',true)::uuid);
CREATE POLICY p_feed_ak ON feed_transaction FOR ALL TO pf_app
  USING (current_setting('app.role',true) <> 'ANAK_KANDANG' OR barn_id = current_setting('app.barn_id',true)::uuid)
  WITH CHECK (current_setting('app.role',true) <> 'ANAK_KANDANG' OR (type='USAGE' AND barn_id = current_setting('app.barn_id',true)::uuid));
CREATE POLICY p_weight_ak ON weight_record FOR ALL TO pf_app
  USING (current_setting('app.role',true) <> 'ANAK_KANDANG' OR barn_id = current_setting('app.barn_id',true)::uuid)
  WITH CHECK (current_setting('app.role',true) <> 'ANAK_KANDANG' OR barn_id = current_setting('app.barn_id',true)::uuid);
CREATE POLICY p_cond_ak ON barn_condition FOR ALL TO pf_app
  USING (current_setting('app.role',true) <> 'ANAK_KANDANG' OR barn_id = current_setting('app.barn_id',true)::uuid)
  WITH CHECK (current_setting('app.role',true) <> 'ANAK_KANDANG' OR barn_id = current_setting('app.barn_id',true)::uuid);

-- ---------------------------------------------------------------------
-- 14. GRANT: aplikasi tidak pernah dapat DELETE; ledger hanya INSERT/SELECT
-- ---------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO pf_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO pf_app;
REVOKE UPDATE ON population_tx, inventory_tx, audit_log, attachment, feed_stock_opname, barn_condition, sale FROM pf_app;
REVOKE DELETE ON ALL TABLES IN SCHEMA public FROM pf_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pf_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO pf_app;
-- Keuangan: kolom price/amount sebaiknya diproteksi di lapisan API untuk MANAGER/ANAK_KANDANG (RLS kolom tidak tersedia).

-- ---------------------------------------------------------------------
-- 15. SEED MINIMAL (master config; angka contoh, bisa diubah OWNER)
-- ---------------------------------------------------------------------
INSERT INTO master_config(key,value,description) VALUES
 ('harga_dod',            '15000', 'Harga DOD (Rp/ekor)'),
 ('harga_pakan_kg',       '6800',  'Harga pakan default (Rp/kg)'),
 ('harga_jual_hidup_kg',  '45000', 'Harga jual hidup (Rp/kg)'),
 ('harga_jual_potong_kg', '52000', 'Harga jual potong (Rp/kg)'),
 ('harga_jual_karkas_kg', '58000', 'Harga jual karkas (Rp/kg)'),
 ('target_panen_hari',    '45',    'Target panen (hari)'),
 ('target_bobot',         '{"min":1.5,"max":1.8}', 'Target bobot panen (kg)'),
 ('target_mortalitas_pct','5',     'Target mortalitas maksimum (%)'),
 ('min_stok_pakan_hari',  '7',     'Stok pakan minimum (hari)'),
 ('foto_wajib',           'true',  'Foto bukti wajib untuk input operasional'),
 ('gps_dicatat',          'true',  'Catat GPS pada input mobile'),
 ('jam_kerja',            '{"mulai":5,"selesai":20}', 'Jam kerja untuk deteksi input di luar jam'),
 ('ambang_approval_rp',   '5000000','Nominal pembelian/penjualan/biaya yang butuh approval OWNER'),
 ('batas_mortalitas_harian','3',   'Kematian per hari yang memicu CRITICAL'),
 ('batas_deviasi_pakan_pct','20',  'Deviasi konsumsi pakan vs rata-rata 7 hari'),
 ('batas_selisih_opname_kg','10',  'Selisih opname yang memicu Perlu Verifikasi'),
 ('kurva_target_bobot',   '[[1,0.055],[7,0.25],[14,0.55],[21,0.90],[28,1.15],[35,1.40],[42,1.60],[45,1.65]]', 'Kurva target bobot Peking (hari, kg)');

INSERT INTO feed(name,type,default_price) VALUES ('Starter Peking','STARTER',7200),('Grower Peking','GROWER',6800),('Finisher Peking','FINISHER',6500);

COMMIT;

-- =====================================================================
-- UJI CEPAT integritas (jalankan manual setelah migrasi):
--   UPDATE audit_log SET detail='x' WHERE id=1;        -- harus ERROR append-only
--   DELETE FROM mortality WHERE true;                  -- harus ERROR no hard delete
--   SELECT fn_audit_verify_chain();                    -- NULL = rantai utuh
-- =====================================================================
