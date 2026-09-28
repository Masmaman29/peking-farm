#!/usr/bin/env bash
# Sambungkan container pf-app ke jaringan Docker milik Nginx Proxy Manager.
# Hanya menambah keanggotaan network pada pf-app. Tidak mengubah container/konfigurasi lain.
set -euo pipefail
NPM=$(docker ps --format '{{.Names}}' | grep -iE 'npm|nginx-proxy' | head -1)
[ -z "$NPM" ] && { echo "NPM tidak ditemukan"; exit 1; }
echo "NPM container : $NPM"
echo "NPM networks  : $(docker inspect "$NPM" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}')"
echo "pf-app now    : $(docker inspect pf-app --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}')"
for NET in $(docker inspect "$NPM" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'); do
  if docker network connect "$NET" pf-app 2>/dev/null; then echo "OK: pf-app -> $NET"; else echo "(sudah tersambung / lewati) $NET"; fi
done
echo "pf-app after  : $(docker inspect pf-app --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}')"
echo "== tes resolusi dari NPM =="
docker exec "$NPM" sh -c 'getent hosts pf-app || echo "pf-app belum resolve"'
docker exec "$NPM" sh -c 'wget -qO- -T 8 http://pf-app:3000/api/v1/health || echo "belum bisa"'
echo
