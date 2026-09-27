# PEKING FARM — Modern Duck Farming

Sistem manajemen peternakan bebek Peking: ledger populasi & stok, approval, audit trail
(hash chain), deteksi anomali, dashboard per role, aplikasi mobile anak kandang, dan
website penjualan yang membaca stok langsung dari sistem.

## Struktur
```
db/       001 skema PostgreSQL (trigger append-only, view turunan, RLS) · 002 sesi & sequence
api/      Fastify (Node 20): auth, RBAC, aksi bisnis, audit, upload bukti, endpoint publik
web/      UI (index.html + core/pages/app-head/actions-web.js) — sama dengan prototype, data dari API
data/     uploads/ (foto bukti) · backups/ (pg_dump harian)
```

## Deploy di VPS (Docker, berdampingan dengan Nginx Proxy Manager)
```bash
git clone <repo> /opt/peking-farm && cd /opt/peking-farm
cp .env.example .env && nano .env        # isi password & PF_PUBLIC_URL
docker network ls                        # cari network NPM, isi NPM_NETWORK di .env
docker compose up -d --build
docker compose logs -f pf-app            # tunggu "Demo seed selesai"
```
Di Nginx Proxy Manager: **Add Proxy Host** → domain `farm.pekingfarm.id` → forward ke
`pf-app` port `3000` (karena satu network) → SSL Let's Encrypt → Websockets off, Block
common exploits on.

Website publik: `https://farm.pekingfarm.id/#website` (atau proxy host kedua `pekingfarm.id`
ke service yang sama; tampilan otomatis memilih website bila URL berakhiran `#website`).

## Akun demo (seed otomatis saat DB kosong; matikan dengan `PF_SEED_DEMO=false`)
| Role | Login (nomor HP) | Password |
|---|---|---|
| Owner | 081211112201 | demo1234 |
| Manager | 081211112202 | demo1234 |
| Admin | 081211112203 | demo1234 |
| Anak Kandang (Kandang A) | 085722223301 | demo1234 |

Untuk produksi: buat user asli lewat menu Pengguna, lalu nonaktifkan akun demo.

## Jalankan lokal tanpa Docker
```bash
createdb pekingfarm && psql pekingfarm -f db/001_peking_farm_schema.sql -f db/002_sessions.sql
cd api && npm install
DATABASE_URL=postgres://postgres@localhost/pekingfarm SESSION_SECRET=dev UPLOAD_DIR=../data/uploads npm start
```

## Prinsip integritas (diuji di DB & API)
- Populasi/stok = SUM transaksi; tidak ada kolom saldo yang bisa diedit.
- `audit_log`, `population_tx`, `inventory_tx`, `attachment`: UPDATE/DELETE ditolak trigger.
- Record terkunci hanya bisa diubah lewat *Ajukan Koreksi* → approval → versi baru; versi lama SUPERSEDED.
- Tidak boleh menyetujui permintaan sendiri (constraint DB).
- Hash chain audit: `GET /api/v1/audit/verify` → `{intact:true}`.
- Role & kandang divalidasi di server (RLS untuk anak kandang), bukan di UI.

## Backup & restore
Backup harian otomatis ke `data/backups/*.dump` (14 hari). Restore:
`docker exec -i pf-db pg_restore -U postgres -d pekingfarm -c < data/backups/pekingfarm-YYYY-MM-DD.dump`

## Belum termasuk (fase berikutnya)
Export PDF/Excel/CSV, notifikasi WhatsApp (tabel `notification` sudah terisi — tinggal
dihubungkan ke n8n/Fonnte), PWA offline queue, cron anomaly engine server-side
(saat ini dihitung saat tampil + FEED_DIFF/mortalitas saat input), ganti password mandiri.
