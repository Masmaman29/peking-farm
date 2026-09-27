import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

/** Jalankan fn di dalam satu transaksi DB dengan konteks user untuk RLS. */
export async function tx(ctx, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (ctx) {
      await client.query(`SELECT set_config('app.user_id',$1,true), set_config('app.role',$2,true), set_config('app.barn_id',$3,true)`,
        [ctx.id || '', ctx.role || '', ctx.barn_id || '']);
    }
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export const q = (text, params) => pool.query(text, params);
export const one = async (text, params) => (await pool.query(text, params)).rows[0];
export const rows = async (text, params) => (await pool.query(text, params)).rows;

/** Tulis audit log (append-only, hash chain dihitung trigger DB). */
export async function audit(client, actor, action, entity_type, detail, entity_id = null, before = null, after = null, req = null) {
  await client.query(
    `INSERT INTO audit_log(actor_id,action,entity_type,entity_id,detail,before,after,ip,user_agent) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [actor, action, entity_type, entity_id, detail, before, after, req?.ip || null, req?.headers?.['user-agent'] || null]);
}

export async function config(client = null) {
  const r = await (client || pool).query('SELECT key,value FROM master_config');
  const m = {};
  r.rows.forEach(x => (m[x.key] = x.value));
  return m;
}

export async function ensureAppRole() {
  const pw = process.env.APP_DB_ROLE_PASSWORD;
  if (pw) await pool.query(`ALTER ROLE pf_app WITH PASSWORD '${pw.replace(/'/g, "''")}'`);
}
