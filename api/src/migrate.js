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

  for (const f of files) {
    if (done.has(f)) continue;
    if (baseline && /^00[12]_/.test(f)) {
      await q('INSERT INTO schema_migration(name) VALUES ($1) ON CONFLICT DO NOTHING', [f]);
      continue;
    }
    log.info(`migrasi DB: ${f}`);
    await q(await fs.readFile(path.join(DIR, f), 'utf8'));
    await q('INSERT INTO schema_migration(name) VALUES ($1) ON CONFLICT DO NOTHING', [f]);
  }
}
