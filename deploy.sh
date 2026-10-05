#!/usr/bin/env bash
# PEKING FARM — pemasang otomatis di VPS (Ubuntu + Docker)
# Pakai:  bash deploy.sh            -> pasang/update, tanpa domain (akses via IP:3080)
#         DOMAIN=farm.contoh.com bash deploy.sh   -> pasang + hubungkan ke Nginx Proxy Manager jika ada
set -euo pipefail
DIR=/opt/peking-farm
REPO=https://github.com/Masmaman29/peking-farm
log(){ printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }

log "1/6 Cek Docker"
if ! command -v docker >/dev/null; then curl -fsSL https://get.docker.com | sh; fi
docker compose version >/dev/null 2>&1 || apt-get install -y docker-compose-plugin
command -v git >/dev/null || apt-get install -y git

log "2/6 Ambil kode"
if [ -d $DIR/.git ]; then git -C $DIR pull -q; else git clone -q $REPO $DIR; fi
cd $DIR
mkdir -p data/uploads data/backups

log "3/6 Konfigurasi .env"
rnd(){ tr -dc 'A-Za-z0-9' </dev/urandom | head -c "$1"; }
if [ ! -f .env ]; then
  NPM_NET=$(docker network ls --format '{{.Name}}' | grep -iE 'npm|proxy|pusatsnack' | head -1 || true)
  [ -z "$NPM_NET" ] && NPM_NET=pf-external
  docker network inspect "$NPM_NET" >/dev/null 2>&1 || docker network create "$NPM_NET" >/dev/null
  cat > .env <<EOF
PF_DB_PASSWORD=$(rnd 24)
PF_APP_DB_PASSWORD=$(rnd 24)
PF_SESSION_SECRET=$(rnd 64)
PF_PUBLIC_URL=${DOMAIN:+https://$DOMAIN}
PF_SEED_DEMO=false
NPM_NETWORK=$NPM_NET
EOF
  echo ".env dibuat (network proxy: $NPM_NET)"
else
  echo ".env sudah ada, dipakai apa adanya"
  [ -n "${DOMAIN:-}" ] && sed -i "s#^PF_PUBLIC_URL=.*#PF_PUBLIC_URL=https://$DOMAIN#" .env
fi

log "4/6 Build & jalankan"
docker compose up -d --build
sleep 8
docker compose ps --format 'table {{.Name}}\t{{.Status}}'

log "5/6 Cek aplikasi"
for i in 1 2 3 4 5 6; do
  if curl -fs http://127.0.0.1:3080/api/v1/health >/dev/null; then echo "API OK"; break; fi; sleep 5
done
curl -s http://127.0.0.1:3080/api/v1/health; echo

log "6/6 Selesai"
IP=$(curl -s -4 ifconfig.me || hostname -I | awk '{print $1}')
echo "Aplikasi:  http://$IP:3080   (login Owner 081211112201 / demo1234)"
echo "Website :  http://$IP:3080/#website"
if docker ps --format '{{.Names}}' | grep -qi 'npm\|nginx-proxy'; then
  echo "Nginx Proxy Manager terdeteksi: tambah Proxy Host -> forward pf-app:3000 (network $(grep NPM_NETWORK .env | cut -d= -f2))"
else
  echo "Untuk HTTPS + domain: jalankan  DOMAIN=farm.domainanda.com bash $DIR/deploy.sh  setelah DNS diarahkan, lalu:  bash $DIR/caddy.sh"
fi
