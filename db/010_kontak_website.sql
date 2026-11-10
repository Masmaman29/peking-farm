-- Kontak yang tampil di website penjualan. Sebelumnya ditulis mati di kode dan
-- memakai nomor akun demo yang sudah dihapus, jadi pesan pelanggan tidak sampai
-- ke siapa pun. Sekarang diisi sendiri lewat Pengaturan.
INSERT INTO master_config(key, value, description) VALUES
  ('kontak_whatsapp', '""'::jsonb, 'Nomor WhatsApp yang tampil di website penjualan'),
  ('kontak_email',    '""'::jsonb, 'Email yang tampil di website penjualan (boleh kosong)'),
  ('kontak_alamat',   '""'::jsonb, 'Alamat/lokasi yang tampil di website penjualan'),
  ('kontak_jam',      '"08.00-17.00"'::jsonb, 'Jam layanan yang tampil di website penjualan')
ON CONFLICT (key) DO NOTHING;
