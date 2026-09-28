#!/usr/bin/env bash
echo "== koneksi aktif ke port RustDesk =="
ss -tun 2>/dev/null | grep -E ':2111[5-9]' | grep -v LISTEN | awk '{print $1, $2, $5, $6}' || echo "(tidak ada)"
echo "== peer terdaftar (db) =="
docker run --rm -v /opt/rustdesk/data:/d alpine sh -c "apk add -q sqlite >/dev/null 2>&1; sqlite3 /d/db_v2.sqlite3 'select id, datetime(created_at,\"unixepoch\"), info from peer'" 2>/dev/null || echo "(db tidak terbaca)"
echo "== jam server =="; date
