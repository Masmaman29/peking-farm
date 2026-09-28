#!/usr/bin/env bash
# Jadikan keanggotaan network NPM permanen di .env, lalu recreate pf-app.
set -euo pipefail
cd /opt/peking-farm
NPM=$(docker ps --format '{{.Names}}' | grep -iE 'npm|nginx-proxy' | head -1)
NET=$(docker inspect "$NPM" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' | awk '{print $1}')
echo "NPM ($NPM) network: $NET"
if grep -q '^NPM_NETWORK=' .env; then sed -i "s#^NPM_NETWORK=.*#NPM_NETWORK=$NET#" .env; else echo "NPM_NETWORK=$NET" >> .env; fi
grep NPM_NETWORK .env
docker compose up -d pf-app
sleep 8
echo "pf-app networks: $(docker inspect pf-app --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}')"
docker exec "$NPM" sh -c 'getent hosts pf-app || echo "TIDAK RESOLVE"'
curl -s -m 10 http://127.0.0.1:3080/api/v1/health; echo
