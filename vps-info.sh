#!/usr/bin/env bash
# Info ringkas VPS untuk pemasangan proxy
echo "== containers =="; docker ps --format '{{.Names}} | {{.Ports}}'
echo "== networks pf-app =="; docker inspect pf-app --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
echo "== npm =="; docker ps --format '{{.Names}} {{.Image}} {{.Ports}}' | grep -i 'proxy\|npm' || echo "NPM tidak ditemukan"
echo "== dns =="; getent hosts os.argrupfarmindonesia.my.id || echo "DNS belum resolve"
echo "== app =="; curl -s -m 5 http://127.0.0.1:3080/api/v1/health
echo; echo "== mem/disk =="; free -m | sed -n 2p; df -h / | tail -1
