#!/usr/bin/env bash
# Set PF_PUBLIC_URL pada .env Peking Farm lalu restart container aplikasinya saja.
set -euo pipefail
cd /opt/peking-farm
DOMAIN=${DOMAIN:-os.argrupfarmindonesia.my.id}
sed -i "s#^PF_PUBLIC_URL=.*#PF_PUBLIC_URL=https://$DOMAIN#" .env
grep PF_PUBLIC_URL .env
docker compose up -d pf-app
sleep 8
docker compose ps --format 'table {{.Name}}\t{{.Status}}'
curl -s -m 10 http://127.0.0.1:3080/api/v1/health; echo
