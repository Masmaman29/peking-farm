import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fstatic from '@fastify/static';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import argon2 from 'argon2';
import { pool, one, q, rows, tx, audit, ensureAppRole } from './db.js';
import { buildBootstrap } from './bootstrap.js';
import { runAction, publicOrder, ActionError } from './actions.js';
import { seedIfEmpty } from './seed.js';
import { migrate } from './migrate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = Fastify({ logger: { level: process.env.LOG_LEVEL || 'info' }, trustProxy: true, bodyLimit: 15 * 1024 * 1024 });
const SESSION_DAYS = 0.5; // 12 jam
const secure = (process.env.PUBLIC_URL || '').startsWith('https');

await app.register(cookie, { secret: process.env.SESSION_SECRET || 'dev-secret' });
await app.register(multipart, { limits: { fileSize: 12 * 1024 * 1024, files: 1 } });
await app.register(rateLimit, { global: false });
await app.register(fstatic, { root: process.env.UPLOAD_DIR || path.join(__dirname, '../../data/uploads'), prefix: '/uploads/', decorateReply: false });
await app.register(fstatic, { root: path.join(__dirname, '../../web'), prefix: '/', decorateReply: true });

/* ---------- auth ---------- */
async function currentUser(req) {
  const sid = req.cookies.pf_session;
  if (!sid) return null;
  const s = await one(`SELECT u.id,u.name,u.role,u.barn_id,u.is_active FROM session s JOIN app_user u ON u.id=s.user_id WHERE s.id=$1 AND s.expires_at>now()`, [sid]).catch(() => null);
  if (!s || !s.is_active) return null;
  q('UPDATE session SET last_seen=now() WHERE id=$1', [sid]).catch(() => {});
  return s;
}
app.decorateRequest('user', null);
app.addHook('preHandler', async (req, reply) => {
  if (!req.url.startsWith('/api/')) return;
  if (req.url.startsWith('/api/v1/public') || req.url.startsWith('/api/v1/auth/login') || req.url.startsWith('/api/v1/health')) return;
  req.user = await currentUser(req);
  if (!req.user) return reply.code(401).send({ code: 'UNAUTHENTICATED', message: 'Silakan login.' });
});
app.setErrorHandler((err, req, reply) => {
  if (err instanceof ActionError) return reply.code(err.status).send({ code: err.status === 403 ? 'FORBIDDEN' : 'BAD_REQUEST', message: err.message });
  if (err.name === 'ZodError') return reply.code(400).send({ code: 'VALIDATION', message: err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') });
  if (err.code && /^(23|P0|42)/.test(err.code)) return reply.code(400).send({ code: 'DB_RULE', message: err.message.replace(/^.*?:\s*/, '') });
  req.log.error(err);
  return reply.code(err.statusCode || 500).send({ code: 'INTERNAL', message: err.statusCode ? err.message : 'Terjadi kesalahan pada server.' });
});

app.get('/api/v1/health', async () => ({ ok: true, db: !!(await one('SELECT 1 x')) }));

app.post('/api/v1/auth/login', { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, async (req, reply) => {
  const { phone, password } = req.body || {};
  const u = await one('SELECT * FROM app_user WHERE (phone=$1 OR lower(name)=lower($1)) AND is_active', [String(phone || '').trim()]);
  const ok = u && u.password_hash && await argon2.verify(u.password_hash, String(password || ''));
  if (!ok) {
    await tx(null, c => audit(c, u?.id || null, 'LOGIN', 'session', `Login gagal untuk "${phone}"`, null, null, null, req));
    return reply.code(401).send({ code: 'BAD_CREDENTIALS', message: 'Nomor/nama atau password salah.' });
  }
  const s = await one(`INSERT INTO session(user_id,expires_at,ip,user_agent) VALUES ($1, now() + interval '${SESSION_DAYS} day', $2, $3) RETURNING id`, [u.id, req.ip, req.headers['user-agent'] || null]);
  await q('UPDATE app_user SET last_login_at=now(), failed_logins=0 WHERE id=$1', [u.id]);
  await tx(null, c => audit(c, u.id, 'LOGIN', 'session', `Login sebagai ${u.role}`, s.id, null, null, req));
  reply.setCookie('pf_session', s.id, { path: '/', httpOnly: true, sameSite: 'lax', secure, maxAge: SESSION_DAYS * 86400 });
  return { id: u.id, name: u.name, role: u.role };
});
app.post('/api/v1/auth/logout', async (req, reply) => {
  await q('DELETE FROM session WHERE id=$1', [req.cookies.pf_session]);
  await tx(null, c => audit(c, req.user.id, 'LOGOUT', 'session', 'Logout', null, null, null, req));
  reply.clearCookie('pf_session', { path: '/' });
  return { ok: true };
});
app.get('/api/v1/auth/me', async req => req.user);

/* ---------- data ---------- */
app.get('/api/v1/bootstrap', async req => buildBootstrap(req.user));
app.get('/api/v1/notifications', async req => rows('SELECT * FROM notification WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50', [req.user.id]));
app.post('/api/v1/notifications/read', async req => { await q('UPDATE notification SET read_at=now() WHERE user_id=$1 AND read_at IS NULL', [req.user.id]); return { ok: true }; });
app.get('/api/v1/audit/verify', async (req, reply) => {
  if (!['OWNER', 'MANAGER'].includes(req.user.role)) return reply.code(403).send({ code: 'FORBIDDEN', message: 'Hanya Owner/Manager.' });
  const r = await one('SELECT fn_audit_verify_chain() b');
  return { intact: r.b === null, firstBrokenId: r.b };
});

/* ---------- aksi (JSON atau multipart dengan field payload + photo) ---------- */
app.post('/api/v1/actions/:type', { config: { rateLimit: { max: 120, timeWindow: '1 minute' } } }, async (req, reply) => {
  let payload = {}, file = null;
  if (req.isMultipart()) {
    for await (const part of req.parts()) {
      if (part.type === 'file') { if (part.filename) { const buf = await part.toBuffer(); file = { filename: part.filename, mimetype: part.mimetype, toBuffer: async () => buf }; } }
      else if (part.fieldname === 'payload') payload = JSON.parse(part.value);
      else payload[part.fieldname] = part.value;
    }
  } else payload = req.body || {};
  const result = await runAction(req.params.type, payload, req.user, file, req);
  return { ok: true, result };
});

/* ---------- publik (website) ---------- */
app.get('/api/v1/public/products', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async () => {
  const list = await rows('SELECT * FROM v_product_public ORDER BY type');
  return list.map(p => { const s = Number(p.available_stock || 0); return { id: p.id, name: p.name, type: p.type, desc: p.description, pricePerKg: +p.price_per_kg, minOrder: p.min_order, avgWeightKg: +p.avg_weight_kg, availableStock: s, harvestDate: p.harvest_date, status: s <= 0 ? 'HABIS' : p.type === 'LIVE' ? 'PRE-ORDER' : s <= p.min_order * 2 ? 'STOK TERBATAS' : 'TERSEDIA' }; });
});
app.get('/api/v1/public/farm', async () => {
  const c = await one(`SELECT c.code, c.dod_date + c.target_days AS harvest, p.population, w.avg_kg, p.deaths::float/c.dod_qty*100 mort FROM cycle c JOIN v_population_cycle p ON p.cycle_id=c.id LEFT JOIN v_weight_latest w ON w.cycle_id=c.id WHERE c.status='ACTIVE' LIMIT 1`);
  return c ? { cycle: c.code, harvestDate: c.harvest, population: c.population, avgWeightKg: c.avg_kg ? +c.avg_kg : null, mortalityPct: +(+c.mort).toFixed(1) } : {};
});
app.post('/api/v1/public/orders', { config: { rateLimit: { max: 5, timeWindow: '10 minutes' } } }, async req => ({ ok: true, result: await publicOrder(req.body || {}, req) }));

/* ---------- SPA fallback ---------- */
app.setNotFoundHandler((req, reply) => { if (req.url.startsWith('/api/')) return reply.code(404).send({ code: 'NOT_FOUND', message: 'Endpoint tidak ada.' }); return reply.sendFile('index.html'); });

/* ---------- cron ringan: auto-lock tiap jam, bersih sesi ---------- */
setInterval(() => { q('SELECT fn_auto_lock()').catch(() => {}); q('DELETE FROM session WHERE expires_at < now()').catch(() => {}); }, 3600 * 1000);

await migrate(app.log).catch(e => app.log.error('migrate: ' + e.message));
await ensureAppRole().catch(e => app.log.warn('ensureAppRole: ' + e.message));
if (process.env.SEED_DEMO === 'true') await seedIfEmpty(app.log);
app.listen({ port: +(process.env.PORT || 3000), host: '0.0.0.0' });
