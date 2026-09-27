#!/usr/bin/env bash
# Cek & buka port RustDesk (21115-21119 TCP, 21116 UDP)
echo "== listening =="; ss -ltnup 2>/dev/null | grep -E '2111[5-9]' || echo "hbbs/hbbr tidak listening!"
echo "== ufw =="; ufw status 2>/dev/null | head -3 || echo "ufw tidak ada"
echo "== iptables INPUT policy =="; iptables -S INPUT 2>/dev/null | head -1; iptables -L INPUT -n 2>/dev/null | grep -cE 'DROP|REJECT' | sed 's/^/rules drop-reject: /'
# buka lewat ufw jika aktif
if ufw status 2>/dev/null | grep -q 'Status: active'; then
  ufw allow 21115:21119/tcp; ufw allow 21116/udp; echo "ufw: port dibuka"
fi
# buka lewat iptables (idempotent) jika ada policy DROP
if iptables -S INPUT 2>/dev/null | grep -q 'INPUT DROP' || iptables -L INPUT -n 2>/dev/null | grep -qE 'DROP|REJECT'; then
  for p in 21115 21116 21117 21118 21119; do iptables -C INPUT -p tcp --dport $p -j ACCEPT 2>/dev/null || iptables -I INPUT -p tcp --dport $p -j ACCEPT; done
  iptables -C INPUT -p udp --dport 21116 -j ACCEPT 2>/dev/null || iptables -I INPUT -p udp --dport 21116 -j ACCEPT
  echo "iptables: port dibuka"
fi
echo "== log hbbs (10 baris) =="; docker logs --tail 10 rustdesk-hbbs 2>&1 | cut -c1-110
echo "== log hbbr (5 baris) =="; docker logs --tail 5 rustdesk-hbbr 2>&1 | cut -c1-110
echo "== tes dari luar =="; curl -s -m 8 "https://portchecker.io/api/query" -H 'Content-Type: application/json' -d '{"host":"38.147.122.150","ports":[21116,21117]}' 2>/dev/null | cut -c1-200; echo
