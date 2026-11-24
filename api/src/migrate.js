import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { q, one, rows } from './db.js';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../db');

/* Menjalankan file db/*.sql yang belum pernah dijalankan.
   001 & 002 sudah dieksekusi postgres saat init pertama, jadi kalau tabel inti
   sudah ada keduanya ditandai "applied" tanpa dijalankan ulang. */
export async function migrate(log) {
  await q(`CREATE TABLE IF NOT EXISTS schema_migration(
             name text PRIMARY KEY,
             applied_at timestamptz NOT NULL DEFAULT now())`);

  const files = (await fs.readdir(DIR)).filter(f => f.endsWith('.sql')).sort();
  const done = new Set((await rows('SELECT name FROM schema_migration')).map(r => r.name));
  const baseline = !!(await one(`SELECT to_regclass('public.farm') t`)).t;
  const terpakai = [];

  for (const f of files) {
    if (done.has(f)) continue;
    if (baseline && /^00[12]_/.test(f)) {
      await q('INSERT INTO schema_migration(name) VALUES ($1) ON CONFLICT DO NOTHING', [f]);
      continue;
    }
    log.info(`migrasi DB: ${f}`);
    const sql = await fs.readFile(path.join(DIR, f), 'utf8');

    /* Isi berkas dan pencatatannya dikirim sebagai SATU perintah. Beberapa
       pernyataan dalam satu query() dijalankan PostgreSQL di dalam satu
       transaksi implisit, jadi berkas ini berlaku seluruhnya atau tidak sama
       sekali — dan penandaan "sudah diterapkan" tidak bisa tertinggal di
       belakang isinya. Tidak ada BEGIN eksplisit, supaya perilaku
       ALTER TYPE ... ADD VALUE di 004 dan 007 tidak berubah. */
    try {
      await q(`${sql}\n;INSERT INTO schema_migration(name) VALUES ('${f.replace(/'/g, "''")}') ON CONFLICT DO NOTHING;`);
    } catch (e) {
      /* Sebutkan berkasnya. Tanpa ini, pesan errornya hanya menyebut
         pernyataan SQL-nya dan tidak jelas migrasi mana yang gagal. */
      throw new Error(`migrasi ${f} gagal: ${e.message}`);
    }
    terpakai.push(f);
  }

  if (terpakai.length) log.info(`migrasi selesai: ${terpakai.join(', ')}`);
  else log.info('migrasi: tidak ada yang baru');
  return terpakai;
}
