#!/usr/bin/env bash
# RustDesk server (hbbs + hbbr) di Docker — untuk remote desktop mandiri
set -euo pipefail
DIR=/opt/rustdesk; mkdir -p $DIR/data; cd $DIR
cat > docker-compose.yml <<'YML'
services:
  hbbs:
    image: rustdesk/rustdesk-server:latest
    container_name: rustdesk-hbbs
    command: hbbs
    network_mode: host
    volumes: ["./data:/root"]
    restart: unless-stopped
  hbbr:
    image: rustdesk/rustdesk-server:latest
    container_name: rustdesk-hbbr
    command: hbbr
    network_mode: host
    volumes: ["./data:/root"]
    restart: unless-stopped
YML
docker compose up -d
if command -v ufw >/dev/null && ufw status | grep -q active; then
  ufw allow 21115:21117/tcp >/dev/null; ufw allow 21116/udp >/dev/null; ufw allow 21118:21119/tcp >/dev/null
fi
sleep 6
echo "== RustDesk server aktif =="
docker ps --format '{{.Names}} {{.Status}}' | grep rustdesk
IP=$(curl -s -4 ifconfig.me || hostname -I | awk '{print $1}')
echo "ID server  : $IP"
echo "Relay      : $IP"
echo "Key        : $(cat data/id_ed25519.pub)"
