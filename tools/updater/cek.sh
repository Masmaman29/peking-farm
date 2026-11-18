#!/bin/sh
# Dijalankan tiap 2 menit oleh container pf-updater.
# Hanya menyentuh /opt/peking-farm dan container pf-app. Tidak menyentuh
# container, folder, atau jaringan milik tim lain.
REPO="${REPO:-/opt/peking-farm}"
cd "$REPO" || exit 0
LOG="$REPO/data/deploy.log"
catat() { echo "$(date '+%F %T') $*" >> "$LOG"; }
git config --global --add safe.directory "$REPO" 2>/dev/null

git fetch -q origin main 2>/dev/null || { catat "gagal menghubungi GitHub"; exit 0; }
LOKAL=$(git rev-parse HEAD)
BARU=$(git rev-parse origin/main)
TERPASANG=$(sed -n 's/.*"commit":"\([^"]*\)".*/\1/p' web/versi.json 2>/dev/null)

# Tidak ada kode baru dan versi ini sudah terpasang: selesai.
[ "$LOKAL" = "$BARU" ] && [ "$TERPASANG" = "$(git rev-parse --short HEAD)" ] && exit 0

if [ "$LOKAL" != "$BARU" ]; then
  if ! git merge -q --ff-only origin/main 2>>"$LOG"; then
    catat "GAGAL: kode di VPS berbeda dari GitHub, tidak bisa ditarik otomatis"
    exit 0
  fi
fi
SHA=$(git rev-parse --short HEAD)
catat "memasang $SHA"
printf '{"commit":"%s","dipasang":"%s"}\n' "$SHA" "$(date '+%F %T')" > web/versi.json

if ! docker compose up -d --build pf-app >>"$LOG" 2>&1; then
  rm -f web/versi.json
  catat "GAGAL membangun $SHA — aplikasi lama tetap jalan, dicoba lagi 2 menit lagi"
  exit 0
fi

i=0
while [ $i -lt 45 ]; do
  if wget -qO- "${HEALTH_URL:-http://pf-app:3000/api/v1/health}" 2>/dev/null | grep -q '"ok":true'; then
    catat "SELESAI $SHA terpasang dan sehat"
    exit 0
  fi
  i=$((i+1)); sleep 2
done
catat "PERINGATAN: $SHA terpasang tapi aplikasi belum menjawab sehat"
