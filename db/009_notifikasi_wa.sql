-- Catatan percobaan kirim WhatsApp, supaya kegagalan kelihatan dan tidak dicoba terus-menerus
ALTER TABLE notification ADD COLUMN IF NOT EXISTS wa_tries int NOT NULL DEFAULT 0;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS wa_error text;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS wa_last_try timestamptz;
CREATE INDEX IF NOT EXISTS ix_notif_wa_pending
  ON notification(created_at) WHERE sent_wa_at IS NULL;
