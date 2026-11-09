/**
 * Pengiriman notifikasi penting ke WhatsApp.
 *
 * Tidak aktif sampai env diisi. Kalau belum diatur, aplikasi tetap jalan normal
 * dan notifikasi tetap tersimpan di dalam aplikasi — tidak ada yang rusak.
 *
 * Env:
 *   WA_PROVIDER = fonnte | waha        (kosong = fitur mati)
 *   WA_TOKEN    = token Fonnte, atau API key WAHA (kalau WAHA pakai key)
 *   WA_URL      = alamat WAHA, mis. http://waha:3000   (hanya untuk waha)
 *   WA_SESSION  = nama sesi WAHA (default 'default')
 *   WA_TYPES    = jenis notifikasi yang dikirim, dipisah koma
 *                 (default: approval_pending,mortality_abnormal,anomaly,harvest,cycle_closed,stock_low)
 */
import { rows, q } from './db.js';

const PROVIDER = (process.env.WA_PROVIDER || '').toLowerCase().trim();
const TOKEN = process.env.WA_TOKEN || '';
const URL_WAHA = (process.env.WA_URL || '').replace(/\/+$/, '');
const SESSION = process.env.WA_SESSION || 'default';
const JENIS = (process.env.WA_TYPES ||
  'approval_pending,mortality_abnormal,anomaly,harvest,cycle_closed,stock_low')
  .split(',').map(s => s.trim()).filter(Boolean);

const MAKS_COBA = 3;
const JEDA_MS = 60_000;      // periksa tiap menit
const MAKS_SEKALI = 10;      // paling banyak 10 pesan per putaran, biar tidak dianggap spam

export const waAktif = () => PROVIDER === 'fonnte' ? !!TOKEN : PROVIDER === 'waha' ? !!URL_WAHA : false;

/** 08xx / +62xx / 62xx -> 62xx (format yang diterima Fonnte & WAHA) */
export function normalNomor(no) {
  const d = String(no || '').replace(/[^0-9]/g, '');
  if (!d) return null;
  if (d.startsWith('62')) return d;
  if (d.startsWith('0')) return '62' + d.slice(1);
  if (d.startsWith('8')) return '62' + d;
  return d;
}

async function kirimFonnte(nomor, teks) {
  const r = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { Authorization: TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: nomor, message: teks, countryCode: '62' }),
    signal: AbortSignal.timeout(20_000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.status === false) throw new Error(j.reason || j.detail || `Fonnte menolak (HTTP ${r.status})`);
}

async function kirimWaha(nomor, teks) {
  const r = await fetch(`${URL_WAHA}/api/sendText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(TOKEN ? { 'X-Api-Key': TOKEN } : {}) },
    body: JSON.stringify({ session: SESSION, chatId: `${nomor}@c.us`, text: teks }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!r.ok) throw new Error(`WAHA menolak (HTTP ${r.status}): ${(await r.text().catch(() => '')).slice(0, 120)}`);
}

const kirim = (nomor, teks) => PROVIDER === 'fonnte' ? kirimFonnte(nomor, teks) : kirimWaha(nomor, teks);

function susunPesan(n, namaFarm) {
  const dasar = (process.env.PUBLIC_URL || '').replace(/\/+$/, '');
  const tautan = dasar && n.link ? `\n\n${dasar}/#${String(n.link).replace(/^\//, '')}` : '';
  return `*${namaFarm}*\n${n.title}${n.body ? `\n${n.body}` : ''}${tautan}`;
}

/** Satu putaran: ambil notifikasi yang belum terkirim, kirim, catat hasilnya. */
export async function putaranWA(log) {
  if (!waAktif()) return { terkirim: 0, gagal: 0, mati: true };
  const daftar = await rows(`
    SELECT n.id, n.type, n.title, n.body, n.link, n.wa_tries, u.phone, u.name,
           (SELECT name FROM farm ORDER BY created_at LIMIT 1) AS farm_name
      FROM notification n JOIN app_user u ON u.id = n.user_id
     WHERE n.sent_wa_at IS NULL
       AND n.wa_tries < $1
       AND n.type = ANY($2::text[])
       AND u.is_active AND u.archived_at IS NULL AND COALESCE(u.phone,'') <> ''
       AND n.created_at > now() - interval '2 days'
       AND (n.wa_last_try IS NULL OR n.wa_last_try < now() - interval '5 minutes')
     ORDER BY n.created_at
     LIMIT $3`, [MAKS_COBA, JENIS, MAKS_SEKALI]);

  let terkirim = 0, gagal = 0;
  for (const n of daftar) {
    const nomor = normalNomor(n.phone);
    if (!nomor) {
      await q(`UPDATE notification SET wa_tries=$1, wa_last_try=now(), wa_error=$2 WHERE id=$3`,
        [MAKS_COBA, 'Nomor HP tidak bisa dibaca', n.id]);
      gagal++; continue;
    }
    try {
      await kirim(nomor, susunPesan(n, n.farm_name || 'AR-FARM'));
      await q(`UPDATE notification SET sent_wa_at=now(), wa_tries=wa_tries+1, wa_last_try=now(), wa_error=NULL WHERE id=$1`, [n.id]);
      terkirim++;
    } catch (e) {
      await q(`UPDATE notification SET wa_tries=wa_tries+1, wa_last_try=now(), wa_error=$1 WHERE id=$2`,
        [String(e.message).slice(0, 300), n.id]);
      gagal++;
      log?.warn?.({ notif: n.id, ke: n.name }, `WhatsApp gagal: ${e.message}`);
    }
  }
  if (terkirim || gagal) log?.info?.(`WhatsApp: ${terkirim} terkirim, ${gagal} gagal`);
  return { terkirim, gagal, mati: false };
}

/** Dijalankan sekali saat server start. Aman kalau fitur mati. */
export function mulaiPengirimWA(log) {
  if (!waAktif()) {
    log?.info?.('Notifikasi WhatsApp tidak aktif (WA_PROVIDER belum diisi) — notifikasi tetap tampil di dalam aplikasi.');
    return null;
  }
  log?.info?.(`Notifikasi WhatsApp aktif lewat ${PROVIDER}. Jenis yang dikirim: ${JENIS.join(', ')}`);
  const t = setInterval(() => { putaranWA(log).catch(e => log?.error?.(`Putaran WhatsApp gagal: ${e.message}`)); }, JEDA_MS);
  t.unref?.();
  return t;
}
