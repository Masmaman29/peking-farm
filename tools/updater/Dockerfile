# Pemasang otomatis AR-FARM: menarik kode dari GitHub lalu membangun ulang pf-app.
FROM docker:27-cli
RUN apk add --no-cache git
CMD ["sh","-c","while true; do sh /opt/peking-farm/tools/updater/cek.sh; sleep 120; done"]
