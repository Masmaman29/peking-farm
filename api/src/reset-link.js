#!/usr/bin/env node
/* Membuat tautan sekali pakai untuk mengatur ulang password.
 *
 * Hanya bisa dijalankan dari dalam server (konsol VPS), jadi yang bisa memakainya
 * adalah pihak yang sudah memegang server itu sendiri. Password tidak pernah
 * diketik di sini: perintah ini hanya mencetak tautan, dan pemiliknya yang
 * mengisi password baru lewat browser.
 *
 * Pakai:
 *   node src/reset-link.js              -> tampilkan daftar pengguna
 *   node src/reset-link.js 082142168364 -> buat tautan untuk nomor itu
 */
import crypto from 'node:crypto';
import { pool, one, rows, q } from './db.js';

const MENIT = 30;
// huruf/angka tanpa yang mirip (tanpa 0 O 1 I L) supaya tidak salah baca di layar konsol
const ABJAD = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

const kode = () => Array.from(crypto.randomBytes(12))
  .map(b => ABJAD[b % ABJAD.length]).join('')
  .replace(/(.{4})(.{4})(.{4})/, '$1-$2-$3');

const hash = t => crypto.createHash('sha256').update(t).digest('hex');

async function main() {
  const arg = (process.argv[2] || '').trim();

  const daftar = await rows(
    `SELECT name, role, phone FROM app_user
      WHERE is_active AND archived_at IS NULL ORDER BY role, name`);
  if (!daftar.length) { console.log('Belum ada pengguna sama sekali. Buka aplikasinya — layar Setup Awal akan muncul.'); return; }

  if (!arg) {
    console.log('\nPengguna aktif:\n');
    for (const u of daftar) console.log(`  ${u.phone}   ${u.name}  (${u.role})`);
    console.log('\nJalankan lagi dengan nomornya, contoh:\n  node src/reset-link.js ' + daftar[0].phone + '\n');
    return;
  }

  const u = await one('SELECT id,name,role FROM app_user WHERE phone=$1 AND is_active AND archived_at IS NULL', [arg]);
  if (!u) { console.log(`\nNomor "${arg}" tidak ditemukan di antara pengguna aktif.\n`); process.exitCode = 1; return; }

  const t = kode();
  // tautan lama untuk orang yang sama dibatalkan, supaya hanya satu yang berlaku
  await q('UPDATE password_reset SET used_at=now() WHERE user_id=$1 AND used_at IS NULL', [u.id]);
  await q(`INSERT INTO password_reset(user_id,token_hash,expires_at)
           VALUES ($1,$2, now() + ($3 || ' minutes')::interval)`, [u.id, hash(t), String(MENIT)]);

  const asal = (process.env.PUBLIC_URL || '').replace(/\/+$/, '') || 'https://os.argrupfarmindonesia.my.id';
  console.log(`\n  Untuk : ${u.name} (${u.role})`);
  console.log(`  Berlaku: ${MENIT} menit, sekali pakai\n`);
  console.log(`  Buka di browser HP atau laptop:\n`);
  console.log(`  ${asal}/#reset=${t}\n`);
  console.log(`  Kodenya: ${t}\n`);
}

main().catch(e => { console.error('Gagal:', e.message); process.exitCode = 1; })
      .finally(() => pool.end());
