/**
 * Sensor nominal rupiah untuk peran non-keuangan.
 *
 * Dipakai di dua tempat yang sama-sama mengirim teks bebas ke layar:
 *   - audit_log.detail  (bootstrap.js)
 *   - notification.body (server.js)
 *
 * Keduanya ditulis dengan nominal untuk hampir semua aksi uang, dan itulah
 * jalur yang lolos dari penjagaan field-per-field: nominalnya ada di dalam
 * KALIMAT, bukan di field angka tersendiri.
 *
 * Yang disensor hanya yang jelas uang. Jumlah ekor, kilogram, hari, persen,
 * FCR, dan kode nota dibiarkan utuh supaya keterangan operasionalnya tetap
 * berguna bagi manager dan anak kandang.
 */

const POLA = [
  [/\bRp\s?[\d][\d.,]*/gi, 'Rp •••'],        // Rp 400.000 / Rp4.590.000
  [/@\s?\d{3,}(?![\d.,]*\s*(kg|ekor))/gi, '@ •••'], // DOD @ 10000
  [/\b\d{3,}(?:[.,]\d+)?\s*\/\s*kg/gi, '•••/kg'],   // 25500/kg
];

/** Ganti nominal rupiah dalam satu kalimat dengan "•••". */
export function sensorRupiah(teks) {
  if (teks == null) return teks;
  let s = String(teks);
  for (const [pola, ganti] of POLA) s = s.replace(pola, ganti);
  return s;
}

/** true kalau kalimatnya masih memuat sesuatu yang terbaca sebagai nominal. */
export function adaNominal(teks) {
  if (teks == null) return false;
  return POLA.some(([pola]) => { pola.lastIndex = 0; return pola.test(String(teks)); });
}
