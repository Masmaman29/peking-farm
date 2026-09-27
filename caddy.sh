#!/usr/bin/env bash
# Tambah Caddy (HTTPS otomatis) bila VPS tidak punya Nginx Proxy Manager. Butuh DOMAIN di .env (PF_PUBLIC_URL).
set -euo pipefail
cd /opt/peking-farm
DOMAIN=$(grep PF_PUBLIC_URL .env | sed 's#.*https://##')
[ -z "$DOMAIN" ] && { echo "PF_PUBLIC_URL belum diisi di .env"; exit 1; }
cat > docker-compose.override.yml <<YML
services:
  pf-app:
    ports: []
  caddy:
    image: caddy:2-alpine
    container_name: pf-caddy
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes: ["./Caddyfile:/etc/caddy/Caddyfile:ro", "caddy-data:/data"]
    networks: [pf-net]
volumes:
  caddy-data:
YML
echo "$DOMAIN { reverse_proxy pf-app:3000 }" > Caddyfile
docker compose up -d
echo "Caddy aktif untuk https://$DOMAIN"
