# AR-FARM — Catatan Deployment Produksi

**Status: LIVE** · 28 September 2026

## Akses
| Hal | Nilai |
|---|---|
| Aplikasi | https://os.argrupfarmindonesia.my.id |
| Website publik | https://os.argrupfarmindonesia.my.id/#website |
| Server | VPS ARGRUP, 38.147.122.150 (Jagoan Hosting, Ubuntu 24.04) |
| Lokasi kode | `/opt/peking-farm` |
| Repo | https://github.com/Masmaman29/peking-farm |
| SSL | Let's Encrypt via Nginx Proxy Manager, Force SSL + HTTP/2 |

## Akun demo (ganti sebelum dipakai produksi)
| Role | Login | Password |
|---|---|---|
| Owner | 081211112201 | demo1234 |
| Manager | 081211112202 | demo1234 |
| Admin | 081211112203 | demo1234 |
| Anak Kandang (Kandang A) | 085722223301 | demo1234 |

## Arsitektur di server
- `pf-db` — PostgreSQL 16, volume `peking-farm_pf-db-data`
- `pf-app` — Fastify API + UI, port internal 3000
- `pf-backup` — `pg_dump` harian ke `/opt/peking-farm/data/backups`, retensi 14 hari
- Jaringan: `argrup-net` (bersama Nginx Proxy Manager) + `peking-farm_pf-net`
- Proxy host NPM: `os.argrupfarmindonesia.my.id` → `pf-app:3000`

## Catatan penting
- `NPM_NETWORK=argrup-net` di `/opt/peking-farm/.env` — **jangan diubah**, ini yang
  membuat NPM bisa menjangkau aplikasi setelah restart.
- `PF_PUBLIC_URL=https://os.argrupfarmindonesia.my.id` → cookie sesi hanya lewat HTTPS.
- Domain `argrupindonesia.my.id` (tanpa "farm") dipakai CRM/n8n — domain terpisah, jangan tertukar.

## Perintah operasional
```bash
cd /opt/peking-farm
docker compose ps                  # status
docker compose logs -f pf-app      # log aplikasi
git pull && docker compose up -d --build   # update dari GitHub
bash tools/fixnet.sh               # kalau 502 setelah restart
```

## Sisa pekerjaan
1. Buat user asli di menu Pengguna, lalu nonaktifkan 4 akun demo.
2. Matikan seed demo: set `PF_SEED_DEMO=false` di `.env` (data demo tetap ada sampai dihapus manual).
3. Belum ada: export PDF/Excel, notifikasi WhatsApp (tabel `notification` sudah terisi,
   tinggal disambung ke n8n/Fonnte), PWA offline, ganti password mandiri.
