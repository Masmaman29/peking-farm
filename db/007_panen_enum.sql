-- Panen dicatat sebagai order dengan sumber 'PANEN', supaya uang tetap satu jalur
-- dengan penjualan biasa (order → sale) dan laporan keuangan tidak perlu dua sumber.
ALTER TYPE order_source ADD VALUE IF NOT EXISTS 'PANEN';
