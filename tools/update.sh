#!/bin/sh
# Update AR-FARM dari GitHub lalu bangun ulang aplikasinya.
# Aman diulang. Tidak memakai karakter yang kacau di konsol VNC.
set -e
cd /opt/peking-farm
echo "== 1. ambil kode terbaru =="
git pull
echo
echo "== 2. bangun ulang aplikasi =="
docker compose up -d --build pf-app
echo
echo "== 3. tunggu aplikasi siap =="
i=0
while [ $i -lt 40 ]; do
  if curl -sf http://127.0.0.1:3080/api/v1/health >/dev/null 2>&1; then break; fi
  i=$((i+1)); sleep 2
done
echo
echo "== 4. hasil =="
curl -s http://127.0.0.1:3080/api/v1/health; echo
echo "migrasi database yang sudah jalan:"
docker compose logs --tail 40 pf-app | grep -i "migrasi DB" || echo "  (tidak ada migrasi baru)"
echo
echo "notifikasi WhatsApp:"
docker compose logs --tail 40 pf-app | grep -i "WhatsApp" | tail -1 || echo "  (tidak ada info)"
echo
echo "Selesai. Buka https://os.argrupfarmindonesia.my.id lalu muat ulang halaman (Ctrl+Shift+R)."
