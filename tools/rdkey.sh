#!/usr/bin/env bash
# Cetak key RustDesk dengan pembeda huruf O / angka 0 / huruf l / angka 1
K=$(cat /opt/rustdesk/data/id_ed25519.pub)
echo "KEY ASLI  : $K"
echo "HURUF O   : $(echo "$K" | sed 's/O/[O]/g; s/0/{0}/g')   ([O]=huruf O, {0}=angka nol)"
echo "HURUF l/1 : $(echo "$K" | sed 's/l/[l]/g; s/1/{1}/g; s/I/<I>/g')   ([l]=L kecil, {1}=angka satu, <I>=i besar)"
echo "PANJANG   : ${#K} karakter"
