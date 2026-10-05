/**
 * Semua mutasi lewat satu pintu: act(type, payload, user, file).
 * Setiap aksi: cek role → validasi zod → tulis tabel → audit_log, dalam SATU transaksi DB.
 * UI tidak pernah dipercaya; hidden button bukan security.
 */
import { z } from 'zod';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import argon2 from 'argon2';
import { tx, audit, config } from './db.js';

class ActionError extends Error { constructor(msg, code = 400) { super(msg); this.status = code; } }
const deny = (msg = 'Role Anda tidak memiliki izin untuk aksi ini.') => { throw new ActionError(msg, 403); };
const need = (user, roles) => { if (!roles.includes(user.role)) deny(); };
const uuid = z.string().uuid();
const rp = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');

async function barnId(c, code, user) {
  const r = await c.query('SELECT id FROM barn WHERE code=$1', [code]);
  if (!r.rows.length) throw new ActionError('Kandang tidak dikenal.');
  if (user.role === 'ANAK_KANDANG' && r.rows[0].id !== user.barn_id) deny('Anda hanya boleh input untuk kandang Anda sendiri.');
  return r.rows[0].id;
}
async function activeCycle(c) {
  const r = await c.query(`SELECT * FROM cycle WHERE status='ACTIVE' ORDER BY dod_date DESC LIMIT 1`);
  if (!r.rows.length) throw new ActionError('Tidak ada siklus aktif.');
  return r.rows[0];
}
async function saveAttachment(c, file, entity_type, entity_id, kind, user) {
  if (!file) return null;
  const buf = await file.toBuffer();
  const sha = crypto.createHash('sha256').update(buf).digest('hex');
  const ext = (path.extname(file.filename) || '.jpg').toLowerCase().slice(0, 6);
  const name = `${crypto.randomUUID()}${ext}`;
  const dir = process.env.UPLOAD_DIR || './data/uploads';
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buf);
  const url = `/uploads/${name}`;
  await c.query(`INSERT INTO attachment(entity_type,entity_id,kind,file_url,sha256,mime,size_bytes,uploaded_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [entity_type, entity_id, kind, url, sha, file.mimetype, buf.length, user.id]);
  await audit(c, user.id, 'UPLOAD', 'attachment', `Upload ${kind} ${name} (sha256 ${sha.slice(0, 12)}…)`, entity_id);
  return url;
}
const requirePhoto = async (c, file) => { const cfg = await config(c); if (cfg.foto_wajib && !file) throw new ActionError('Foto bukti wajib dilampirkan.'); };
async function approvalRow(c, entity_type, entity_id, user, role = 'MANAGER') {
  const r = await c.query(`INSERT INTO approval(entity_type,entity_id,required_role,requested_by) VALUES ($1,$2,$3,$4) RETURNING id`, [entity_type, entity_id, role, user.id]);
  return r.rows[0].id;
}
async function notify(c, roles, type, title, body, link) {
  await c.query(`INSERT INTO notification(user_id,type,title,body,link) SELECT id,$2,$3,$4,$5 FROM app_user WHERE role = ANY($1::role_code[]) AND is_active`, [roles, type, title, body, link]);
}

export const ACTIONS = {
  /* ---------------- INPUT OPERASIONAL ---------------- */
  async FEED_USAGE(c, p, user, file) {
    need(user, ['OWNER', 'MANAGER', 'ANAK_KANDANG']);
    const v = z.object({ kg: z.number().positive().max(2000), barn: z.string(), feedType: z.string().optional() }).parse(p);
    await requirePhoto(c, file);
    const cy = await activeCycle(c); const b = await barnId(c, v.barn, user);
    const feed = (await c.query(`SELECT id FROM feed WHERE type=$1 LIMIT 1`, [v.feedType || 'GROWER'])).rows[0] || (await c.query('SELECT id FROM feed LIMIT 1')).rows[0];
    const r = await c.query(`INSERT INTO feed_transaction(cycle_id,barn_id,feed_id,type,qty_kg,occurred_at,created_by) VALUES ($1,$2,$3,'USAGE',$4,now(),$5) RETURNING id`, [cy.id, b, feed.id, -v.kg, user.id]);
    const photo = await saveAttachment(c, file, 'feed_transaction', r.rows[0].id, 'pakan', user);
    await audit(c, user.id, 'CREATE', 'feed_transaction', `Input pakan ${v.kg} kg — Kandang ${v.barn}${photo ? ' — Bukti ' + photo : ''}`, r.rows[0].id);
    return { id: r.rows[0].id, photo };
  },
  async MORTALITY(c, p, user, file) {
    need(user, ['OWNER', 'MANAGER', 'ANAK_KANDANG']);
    const v = z.object({ qty: z.number().int().positive().max(500), barn: z.string(), cause: z.string().min(1), note: z.string().optional() }).parse(p);
    await requirePhoto(c, file);
    const cy = await activeCycle(c); const b = await barnId(c, v.barn, user);
    const pop = (await c.query('SELECT population FROM v_population WHERE cycle_id=$1 AND barn_id=$2', [cy.id, b])).rows[0]?.population || 0;
    if (v.qty > pop) throw new ActionError(`Jumlah mati (${v.qty}) melebihi populasi kandang (${pop}).`);
    const r = await c.query(`INSERT INTO mortality(cycle_id,barn_id,qty,cause,note,occurred_at,created_by) VALUES ($1,$2,$3,$4,$5,now(),$6) RETURNING id`, [cy.id, b, v.qty, v.cause, v.note || null, user.id]);
    const photo = await saveAttachment(c, file, 'mortality', r.rows[0].id, 'kematian', user);
    const cfg = await config(c); const warn = v.qty >= +cfg.batas_mortalitas_harian;
    await audit(c, user.id, 'CREATE', 'mortality', `Bebek mati ${v.qty} ekor — Kandang ${v.barn} — ${v.cause}${warn ? ' (WARNING)' : ''}`, r.rows[0].id);
    if (warn) await notify(c, ['OWNER', 'MANAGER'], 'mortality_abnormal', `Kematian ${v.qty} ekor di Kandang ${v.barn}`, 'Di atas batas harian — perlu verifikasi', '/populasi');
    return { id: r.rows[0].id, photo, warning: warn };
  },
  async WEIGHT(c, p, user, file) {
    need(user, ['OWNER', 'MANAGER', 'ANAK_KANDANG']);
    const v = z.object({ n: z.number().int().min(1).max(200), total: z.number().positive().max(1000), barn: z.string() }).parse(p);
    await requirePhoto(c, file);
    const cy = await activeCycle(c); const b = await barnId(c, v.barn, user);
    const r = await c.query(`INSERT INTO weight_record(cycle_id,barn_id,sample_n,total_kg,occurred_at,created_by) VALUES ($1,$2,$3,$4,now(),$5) RETURNING id, avg_kg`, [cy.id, b, v.n, v.total, user.id]);
    const photo = await saveAttachment(c, file, 'weight_record', r.rows[0].id, 'timbangan', user);
    await audit(c, user.id, 'CREATE', 'weight_record', `Timbang ${v.n} ekor, total ${v.total} kg, rata-rata ${(+r.rows[0].avg_kg).toFixed(2)} kg — Kandang ${v.barn}`, r.rows[0].id);
    return { id: r.rows[0].id, avg: +r.rows[0].avg_kg, photo };
  },
  async BARN_CONDITION(c, p, user, file) {
    need(user, ['OWNER', 'MANAGER', 'ANAK_KANDANG']);
    const v = z.object({ barn: z.string(), temp: z.number(), hum: z.number(), litter: z.enum(['Kering', 'Agak lembab', 'Basah']), water: z.enum(['Lancar', 'Tersendat', 'Kosong']), behavior: z.enum(['Aktif', 'Lesu', 'Menggerombol']).optional(), note: z.string().optional() }).parse(p);
    const cy = await activeCycle(c); const b = await barnId(c, v.barn, user);
    const r = await c.query(`INSERT INTO barn_condition(cycle_id,barn_id,temp_c,humidity_pct,litter,water,behavior,note,occurred_at,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(),$9) RETURNING id`, [cy.id, b, v.temp, v.hum, v.litter, v.water, v.behavior || 'Aktif', v.note || null, user.id]);
    await saveAttachment(c, file, 'barn_condition', r.rows[0].id, 'kandang', user);
    await audit(c, user.id, 'CREATE', 'barn_condition', `Kondisi kandang ${v.barn}: ${v.temp}°C, ${v.hum}%, sekam ${v.litter}, air ${v.water}`, r.rows[0].id);
    return { id: r.rows[0].id };
  },
  async HEALTH(c, p, user, file) {
    need(user, ['OWNER', 'MANAGER', 'ANAK_KANDANG']);
    const v = z.object({ barn: z.string(), type: z.enum(['Vaksinasi', 'Vitamin', 'Pengobatan', 'Observasi']), item: z.string().min(1), dose: z.string().optional(), note: z.string().optional() }).parse(p);
    const cy = await activeCycle(c); const b = v.barn === 'ALL' ? null : await barnId(c, v.barn, user);
    if (v.barn === 'ALL' && user.role === 'ANAK_KANDANG') deny();
    const t = { Vaksinasi: 'VACCINE', Vitamin: 'VITAMIN', Pengobatan: 'TREATMENT', Observasi: 'OBSERVATION' }[v.type];
    const r = await c.query(`INSERT INTO health_record(cycle_id,barn_id,type,item,dose,note,occurred_at,created_by) VALUES ($1,$2,$3,$4,$5,$6,now(),$7) RETURNING id`, [cy.id, b, t, v.item, v.dose || null, v.note || null, user.id]);
    await saveAttachment(c, file, 'health_record', r.rows[0].id, 'kesehatan', user);
    await audit(c, user.id, 'CREATE', 'health_record', `${v.type}: ${v.item} — ${v.barn === 'ALL' ? 'Semua kandang' : 'Kandang ' + v.barn}`, r.rows[0].id);
    return { id: r.rows[0].id };
  },

  /* ---------------- KOREKSI & APPROVAL ---------------- */
  async CORRECTION_REQUEST(c, p, user, file) {
    const v = z.object({ type: z.enum(['FEED', 'MORT', 'WEIGHT']), recordId: uuid, newVal: z.number().nonnegative(), reason: z.string().min(3) }).parse(p);
    const table = { FEED: 'feed_transaction', MORT: 'mortality', WEIGHT: 'weight_record' }[v.type];
    const rec = (await c.query(`SELECT * FROM ${table} WHERE id=$1`, [v.recordId])).rows[0];
    if (!rec) throw new ActionError('Record tidak ditemukan.');
    if (user.role === 'ANAK_KANDANG' && rec.created_by !== user.id) deny('Anda hanya boleh mengajukan koreksi untuk input Anda sendiri.');
    if (rec.status === 'SUPERSEDED') throw new ActionError('Record ini sudah digantikan versi baru.');
    const pending = await c.query(`SELECT 1 FROM correction_request cr JOIN approval a ON a.id=cr.approval_id WHERE cr.entity_id=$1 AND a.status='PENDING'`, [v.recordId]);
    if (pending.rows.length) throw new ActionError('Sudah ada koreksi yang menunggu untuk record ini.');
    const oldVal = v.type === 'FEED' ? -Number(rec.qty_kg) : v.type === 'MORT' ? rec.qty : Number(rec.total_kg);
    const field = v.type === 'FEED' ? 'qty_kg' : v.type === 'MORT' ? 'qty' : 'total_kg';
    // approval dulu (FK), lalu correction; entity_id approval diisi setelah correction ada
    const apId = await approvalRow(c, 'correction_request', crypto.randomUUID(), user, 'MANAGER');
    const cr2 = await c.query(`INSERT INTO correction_request(entity_type,entity_id,field,old_value,new_value,reason,approval_id,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [table, v.recordId, field, JSON.stringify(oldVal), JSON.stringify(v.newVal), v.reason, apId, user.id]);
    await c.query('UPDATE approval SET entity_id=$1 WHERE id=$2', [cr2.rows[0].id, apId]);
    await saveAttachment(c, file, 'correction_request', cr2.rows[0].id, 'koreksi', user);
    await audit(c, user.id, 'CORRECTION', table, `Ajukan koreksi ${v.recordId.slice(0, 8)}: ${oldVal} → ${v.newVal} — ${v.reason}`, cr2.rows[0].id);
    await notify(c, ['OWNER', 'MANAGER'], 'correction_request', 'Permintaan koreksi baru', v.reason, '/persetujuan');
    return { id: cr2.rows[0].id };
  },
  async APPROVE(c, p, user) {
    need(user, ['OWNER', 'MANAGER']);
    const v = z.object({ kind: z.enum(['CORRECTION', 'ORDER', 'PURCHASE', 'EXPENSE']), id: z.string() }).parse(p);
    const cfg = await config(c); const big = +cfg.ambang_approval_rp;
    if (v.kind === 'CORRECTION') {
      const cr = (await c.query(`SELECT cr.*, a.status a_status, a.requested_by FROM correction_request cr JOIN approval a ON a.id=cr.approval_id WHERE cr.id=$1`, [v.id])).rows[0];
      if (!cr || cr.a_status !== 'PENDING') throw new ActionError('Permintaan tidak ditemukan atau sudah diputuskan.');
      if (cr.requested_by === user.id) deny('Tidak boleh menyetujui permintaan sendiri.');
      const rec = (await c.query(`SELECT * FROM ${cr.entity_type} WHERE id=$1`, [cr.entity_id])).rows[0];
      const nv = Number(cr.new_value); let newId;
      if (cr.entity_type === 'feed_transaction') {
        newId = (await c.query(`INSERT INTO feed_transaction(cycle_id,barn_id,feed_id,type,qty_kg,occurred_at,reason,supersedes_id,status,locked,created_by,updated_by) VALUES ($1,$2,$3,'USAGE',$4,$5,$6,$7,'APPROVED',true,$8,$9) RETURNING id`,
          [rec.cycle_id, rec.barn_id, rec.feed_id, -nv, rec.occurred_at, cr.reason, rec.id, rec.created_by, user.id])).rows[0].id;
      } else if (cr.entity_type === 'mortality') {
        newId = (await c.query(`INSERT INTO mortality(cycle_id,barn_id,qty,cause,note,occurred_at,supersedes_id,status,locked,created_by,updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,'APPROVED',true,$8,$9) RETURNING id`,
          [rec.cycle_id, rec.barn_id, nv, rec.cause, rec.note, rec.occurred_at, rec.id, rec.created_by, user.id])).rows[0].id;
        // batalkan ledger DEATH lama dengan transaksi CORRECTION (+qty lama)
        await c.query(`INSERT INTO population_tx(cycle_id,barn_id,type,qty,ref_type,ref_id,occurred_at,created_by) VALUES ($1,$2,'CORRECTION',$3,'correction_request',$4,now(),$5)`, [rec.cycle_id, rec.barn_id, rec.qty, cr.id, user.id]);
      } else {
        newId = (await c.query(`INSERT INTO weight_record(cycle_id,barn_id,sample_n,total_kg,occurred_at,supersedes_id,status,locked,created_by,updated_by) VALUES ($1,$2,$3,$4,$5,$6,'APPROVED',true,$7,$8) RETURNING id`,
          [rec.cycle_id, rec.barn_id, rec.sample_n, nv, rec.occurred_at, rec.id, rec.created_by, user.id])).rows[0].id;
      }
      await c.query(`UPDATE ${cr.entity_type} SET status='SUPERSEDED', updated_by=$2 WHERE id=$1`, [rec.id, user.id]);
      await c.query(`UPDATE correction_request SET new_entity_id=$1 WHERE id=$2`, [newId, cr.id]);
      await c.query(`UPDATE approval SET status='APPROVED', decided_by=$1, decided_at=now() WHERE id=$2`, [user.id, cr.approval_id]);
      await audit(c, user.id, 'APPROVE', 'correction_request', `Koreksi ${cr.entity_type} disetujui: ${cr.old_value} → ${cr.new_value}. Versi lama tetap tersimpan (SUPERSEDED).`, cr.id, { value: cr.old_value }, { value: cr.new_value });
      return { newId };
    }
    if (v.kind === 'ORDER') {
      const o = (await c.query(`SELECT * FROM "order" WHERE code=$1 OR id::text=$1`, [v.id])).rows[0];
      if (!o || o.status !== 'PENDING_APPROVAL') throw new ActionError('Order tidak dalam status menunggu approval.');
      await c.query(`UPDATE "order" SET status='CONFIRMED', decided_by=$1, decided_at=now() WHERE id=$2`, [user.id, o.id]);
      await c.query('SELECT fn_order_apply_stock($1,$2)', [o.id, user.id]);
      await c.query(`UPDATE approval SET status='APPROVED', decided_by=$1, decided_at=now() WHERE entity_type='order' AND entity_id=$2 AND status='PENDING'`, [user.id, o.id]);
      await audit(c, user.id, 'APPROVE', 'order', `Order ${o.code} disetujui — stok berkurang`, o.id);
      return {};
    }
    if (v.kind === 'PURCHASE') {
      const pch = (await c.query(`SELECT * FROM feed_transaction WHERE id=$1 AND type='PURCHASE'`, [v.id])).rows[0];
      if (!pch || pch.status !== 'PENDING') throw new ActionError('Pembelian tidak dalam status menunggu.');
      if (Number(pch.qty_kg) * Number(pch.price_per_kg) > big && user.role !== 'OWNER') deny('Pembelian di atas ambang hanya bisa disetujui OWNER.');
      await c.query(`UPDATE feed_transaction SET status='APPROVED', locked=true, locked_at=now(), updated_by=$1 WHERE id=$2`, [user.id, pch.id]);
      await c.query(`UPDATE approval SET status='APPROVED', decided_by=$1, decided_at=now() WHERE entity_type='feed_transaction' AND entity_id=$2 AND status='PENDING'`, [user.id, pch.id]);
      await audit(c, user.id, 'APPROVE', 'feed_transaction', `Pembelian pakan ${pch.qty_kg} kg disetujui — ${rp(pch.qty_kg * pch.price_per_kg)}`, pch.id);
      return {};
    }
    const e = (await c.query(`SELECT * FROM expense WHERE id=$1`, [v.id])).rows[0];
    if (!e || e.status !== 'PENDING') throw new ActionError('Biaya tidak dalam status menunggu.');
    if (Number(e.amount) > big && user.role !== 'OWNER') deny('Biaya di atas ambang hanya bisa disetujui OWNER.');
    await c.query(`UPDATE expense SET status='APPROVED', locked=true, locked_at=now(), updated_by=$1 WHERE id=$2`, [user.id, e.id]);
    await c.query(`UPDATE approval SET status='APPROVED', decided_by=$1, decided_at=now() WHERE entity_type='expense' AND entity_id=$2 AND status='PENDING'`, [user.id, e.id]);
    await audit(c, user.id, 'APPROVE', 'expense', `Biaya ${e.category} ${rp(e.amount)} disetujui`, e.id);
    return {};
  },
  async REJECT(c, p, user) {
    need(user, ['OWNER', 'MANAGER']);
    const v = z.object({ kind: z.enum(['CORRECTION', 'ORDER', 'PURCHASE', 'EXPENSE']), id: z.string(), reason: z.string().min(3) }).parse(p);
    const map = { CORRECTION: ['correction_request', 'correction_request'], ORDER: ['order', '"order"'], PURCHASE: ['feed_transaction', 'feed_transaction'], EXPENSE: ['expense', 'expense'] };
    const [etype, table] = map[v.kind];
    let id = v.id;
    if (v.kind === 'ORDER') { const o = (await c.query(`SELECT id FROM "order" WHERE code=$1 OR id::text=$1`, [v.id])).rows[0]; if (!o) throw new ActionError('Order tidak ditemukan.'); id = o.id; await c.query(`UPDATE "order" SET status='CANCELLED', decided_by=$1, decided_at=now() WHERE id=$2`, [user.id, id]); }
    else if (v.kind !== 'CORRECTION') await c.query(`UPDATE ${table} SET status='REJECTED', updated_by=$1 WHERE id=$2 AND status='PENDING'`, [user.id, id]);
    const ap = await c.query(`UPDATE approval SET status='REJECTED', decided_by=$1, decided_at=now(), reject_reason=$2 WHERE entity_type=$3 AND entity_id=$4 AND status='PENDING' RETURNING id`, [user.id, v.reason, etype, id]);
    if (!ap.rows.length && v.kind === 'CORRECTION') throw new ActionError('Permintaan tidak ditemukan atau sudah diputuskan.');
    await audit(c, user.id, 'REJECT', etype, `${v.kind} ${String(id).slice(0, 8)} ditolak: ${v.reason}`, id);
    return {};
  },

  /* ---------------- ADMIN / KOMERSIAL ---------------- */
  async FEED_PURCHASE(c, p, user, file) {
    need(user, ['OWNER', 'ADMIN']);
    const v = z.object({ qty: z.number().positive(), price: z.number().positive(), vendor: z.string().min(1), ref: z.string().min(1), feedType: z.string().optional() }).parse(p);
    await requirePhoto(c, file);
    const cfg = await config(c); const cy = await activeCycle(c);
    const feed = (await c.query(`SELECT id FROM feed WHERE type=$1 LIMIT 1`, [v.feedType || 'GROWER'])).rows[0] || (await c.query('SELECT id FROM feed LIMIT 1')).rows[0];
    const big = v.qty * v.price > +cfg.ambang_approval_rp;
    const r = await c.query(`INSERT INTO feed_transaction(cycle_id,feed_id,type,qty_kg,price_per_kg,vendor,ref_no,occurred_at,status,locked,created_by) VALUES ($1,$2,'PURCHASE',$3,$4,$5,$6,now(),$7,$8,$9) RETURNING id`,
      [cy.id, feed.id, v.qty, v.price, v.vendor, v.ref, big ? 'PENDING' : 'APPROVED', !big, user.id]);
    if (big) { await approvalRow(c, 'feed_transaction', r.rows[0].id, user, 'OWNER'); await notify(c, ['OWNER'], 'approval_pending', 'Pembelian pakan menunggu approval', `${v.qty} kg — ${rp(v.qty * v.price)}`, '/persetujuan'); }
    await saveAttachment(c, file, 'feed_transaction', r.rows[0].id, 'nota', user);
    await audit(c, user.id, 'CREATE', 'feed_transaction', `Pembelian pakan ${v.qty} kg — ${rp(v.qty * v.price)}${big ? ' (menunggu approval)' : ''}`, r.rows[0].id);
    return { id: r.rows[0].id, pending: big };
  },
  async EXPENSE(c, p, user, file) {
    need(user, ['OWNER', 'ADMIN']);
    const catMap = { Vitamin: 'VITAMIN', Obat: 'OBAT', Listrik: 'LISTRIK', Gas: 'GAS', Sekam: 'SEKAM', 'Tenaga kerja': 'TENAGA_KERJA', Transport: 'TRANSPORT', Peralatan: 'PERALATAN', Maintenance: 'MAINTENANCE', 'Biaya lain': 'LAIN', DOD: 'DOD', Pakan: 'PAKAN' };
    const v = z.object({ cat: z.string(), amount: z.number().positive(), vendor: z.string().min(1), ref: z.string().min(1) }).parse(p);
    if (!catMap[v.cat]) throw new ActionError('Kategori tidak dikenal.');
    await requirePhoto(c, file);
    const cfg = await config(c); const cy = await activeCycle(c); const big = v.amount > +cfg.ambang_approval_rp;
    const r = await c.query(`INSERT INTO expense(cycle_id,category,amount,vendor,ref_no,occurred_at,status,created_by) VALUES ($1,$2,$3,$4,$5,CURRENT_DATE,$6,$7) RETURNING id`, [cy.id, catMap[v.cat], v.amount, v.vendor, v.ref, big ? 'PENDING' : 'APPROVED', user.id]);
    if (big) await approvalRow(c, 'expense', r.rows[0].id, user, 'OWNER');
    await saveAttachment(c, file, 'expense', r.rows[0].id, 'nota', user);
    await audit(c, user.id, 'CREATE', 'expense', `Biaya ${v.cat} ${rp(v.amount)} — ${v.vendor}${big ? ' (menunggu approval)' : ''}`, r.rows[0].id);
    return { id: r.rows[0].id, pending: big };
  },
  async OPNAME(c, p, user, file) {
    need(user, ['OWNER', 'MANAGER', 'ADMIN']);
    const v = z.object({ physical: z.number().nonnegative(), note: z.string().optional() }).parse(p);
    await requirePhoto(c, file);
    const feed = (await c.query('SELECT feed_id, theoretical_kg FROM v_feed_stock ORDER BY theoretical_kg DESC NULLS LAST LIMIT 1')).rows[0] || { feed_id: (await c.query('SELECT id FROM feed LIMIT 1')).rows[0].id, theoretical_kg: 0 };
    const theo = Number((await c.query('SELECT COALESCE(SUM(theoretical_kg),0) t FROM v_feed_stock')).rows[0].t);
    const r = await c.query(`INSERT INTO feed_stock_opname(feed_id,physical_kg,theoretical_kg,note,occurred_at,created_by) VALUES ($1,$2,$3,$4,now(),$5) RETURNING id, diff_kg`, [feed.feed_id, v.physical, theo, v.note || null, user.id]);
    await saveAttachment(c, file, 'feed_stock_opname', r.rows[0].id, 'stok', user);
    const diff = Number(r.rows[0].diff_kg); const cfg = await config(c);
    await audit(c, user.id, 'STOCK_OPNAME', 'feed_stock', `Opname fisik ${v.physical} kg — teoritis ${theo} kg — selisih ${diff} kg`, r.rows[0].id);
    if (Math.abs(diff) >= +cfg.batas_selisih_opname_kg) {
      await c.query(`INSERT INTO anomaly(rule_code,severity,entity_type,entity_id,title,detail,dedupe_key) VALUES ('FEED_DIFF','WARNING','feed_stock_opname',$1,$2,$3,$4) ON CONFLICT (dedupe_key) DO UPDATE SET status='OPEN', detail=EXCLUDED.detail, detected_at=now()`,
        [r.rows[0].id, `Selisih stok pakan ${Math.abs(diff)} kg dengan catatan transaksi`, `Teoritis ${theo} kg, fisik ${v.physical} kg.`, 'AN-FEED-DIFF']);
      await notify(c, ['OWNER', 'MANAGER'], 'anomaly', `Selisih stok pakan ${Math.abs(diff)} kg`, 'Perlu verifikasi', '/stok');
    }
    return { id: r.rows[0].id, diff };
  },
  async STOCK_ADJUST(c, p, user) {
    need(user, ['OWNER', 'MANAGER']);
    const v = z.object({ qty: z.number(), reason: z.string().min(3) }).parse(p);
    const cy = await activeCycle(c); const feed = (await c.query('SELECT id FROM feed LIMIT 1')).rows[0];
    const r = await c.query(`INSERT INTO feed_transaction(cycle_id,feed_id,type,qty_kg,reason,occurred_at,status,locked,created_by) VALUES ($1,$2,'ADJUSTMENT',$3,$4,now(),'APPROVED',true,$5) RETURNING id`, [cy.id, feed.id, v.qty, v.reason, user.id]);
    await c.query(`UPDATE anomaly SET status='VERIFIED', verified_by=$1, verified_at=now(), verify_note=$2 WHERE dedupe_key='AN-FEED-DIFF' AND status='OPEN'`, [user.id, v.reason]);
    await audit(c, user.id, 'STOCK_ADJUSTMENT', 'feed_stock', `Penyesuaian stok pakan ${v.qty} kg — ${v.reason}`, r.rows[0].id);
    return { id: r.rows[0].id };
  },
  async INVENTORY_IN(c, p, user, file) {
    need(user, ['OWNER', 'ADMIN']);
    const v = z.object({ item: uuid, qty: z.number().positive(), ref: z.string().min(1) }).parse(p);
    const r = await c.query(`INSERT INTO inventory_tx(inventory_id,type,qty,ref_type,note,occurred_at,created_by) VALUES ($1,'IN',$2,'purchase',$3,now(),$4) RETURNING id`, [v.item, v.qty, v.ref, user.id]);
    await saveAttachment(c, file, 'inventory_tx', r.rows[0].id, 'nota', user);
    await audit(c, user.id, 'CREATE', 'inventory_tx', `Barang masuk +${v.qty} — ${v.ref}`, r.rows[0].id);
    return { id: r.rows[0].id };
  },
  async ORDER_CREATE(c, p, user) {
    need(user, ['OWNER', 'ADMIN', 'MANAGER']);
    const v = z.object({ customer: z.string(), customerName: z.string().optional(), customerPhone: z.string().optional(), product: uuid, qty: z.number().int().positive(), weight: z.number().positive().nullable().optional(), priceKg: z.number().positive(), pickup: z.string().optional(), pay: z.string().optional(), barn: z.string().optional() }).parse(p);
    const prod = (await c.query('SELECT * FROM product WHERE id=$1', [v.product])).rows[0]; if (!prod) throw new ActionError('Produk tidak ditemukan.');
    let cust = v.customer;
    if (cust === 'NEW') cust = (await c.query(`INSERT INTO customer(name,phone,type) VALUES ($1,$2,'Retail') RETURNING id`, [v.customerName || 'Customer Baru', v.customerPhone || '-'])).rows[0].id;
    const cfg = await config(c); const est = (v.weight || v.qty * Number(prod.avg_weight_kg)) * v.priceKg; const big = est > +cfg.ambang_approval_rp;
    const stock = prod.stock_source === 'POPULATION' ? Number((await c.query(`SELECT COALESCE(SUM(population),0) s FROM v_population_cycle vp JOIN cycle cy ON cy.id=vp.cycle_id WHERE cy.status='ACTIVE'`)).rows[0].s) : Number((await c.query('SELECT qty FROM v_inventory_stock WHERE inventory_id=$1', [prod.inventory_id])).rows[0]?.qty || 0);
    if (stock < v.qty) throw new ActionError(`Stok ${prod.name} tidak cukup (${stock} ekor).`);
    const code = 'ORD-' + String((await c.query("SELECT nextval('order_code_seq') n")).rows[0].n).padStart(4, '0');
    const cy = prod.stock_source === 'POPULATION' ? await activeCycle(c) : null;
    const barn = cy ? (await c.query(`SELECT barn_id FROM v_population WHERE cycle_id=$1 ORDER BY population DESC LIMIT 1`, [cy.id])).rows[0].barn_id : null;
    const o = await c.query(`INSERT INTO "order"(code,customer_id,source,status,payment_status,pickup_date,total_est,created_by) VALUES ($1,$2,'ADMIN',$3,$4,$5,$6,$7) RETURNING id`,
      [code, cust, big ? 'PENDING_APPROVAL' : 'CONFIRMED', v.pay === 'PAID' ? 'PAID' : v.pay === 'DP' ? 'DP' : 'UNPAID', v.pickup || null, est, user.id]);
    await c.query(`INSERT INTO order_item(order_id,product_id,cycle_id,barn_id,qty,weight_kg,price_per_kg) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [o.rows[0].id, prod.id, cy?.id || null, barn, v.qty, v.weight || null, v.priceKg]);
    if (big) { await approvalRow(c, 'order', o.rows[0].id, user, 'MANAGER'); await notify(c, ['OWNER', 'MANAGER'], 'approval_pending', `Order ${code} menunggu approval`, rp(est), '/persetujuan'); }
    else await c.query('SELECT fn_order_apply_stock($1,$2)', [o.rows[0].id, user.id]);
    await audit(c, user.id, 'CREATE', 'order', `Order ${code} — ${v.qty} ekor ${prod.name} — ${rp(est)}${big ? ' (menunggu approval)' : ' — stok berkurang ' + v.qty + ' ekor'}`, o.rows[0].id);
    return { code, pending: big };
  },
  async ORDER_STATUS(c, p, user) {
    need(user, ['OWNER', 'ADMIN', 'MANAGER']);
    const v = z.object({ id: z.string(), status: z.enum(['CONFIRMED', 'PAID', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']), weight: z.number().positive().optional() }).parse(p);
    const o = (await c.query(`SELECT * FROM "order" WHERE code=$1 OR id::text=$1`, [v.id])).rows[0]; if (!o) throw new ActionError('Order tidak ditemukan.');
    const sets = [`status='${v.status}'`];
    if (v.status === 'PAID') sets.push(`payment_status='PAID'`);
    if (v.status === 'DELIVERED') sets.push(`shipping_status='DELIVERED'`);
    if (v.status === 'CONFIRMED') sets.push(`decided_by='${user.id}'`, `decided_at=now()`);
    await c.query(`UPDATE "order" SET ${sets.join(',')} WHERE id=$1`, [o.id]);
    if (v.weight) { await c.query('UPDATE order_item SET weight_kg=$1 WHERE order_id=$2', [v.weight, o.id]); await c.query('UPDATE "order" SET total_final=(SELECT SUM(weight_kg*price_per_kg) FROM order_item WHERE order_id=$1) WHERE id=$1', [o.id]); }
    if (v.status === 'CONFIRMED') await c.query('SELECT fn_order_apply_stock($1,$2)', [o.id, user.id]);
    if (v.status === 'PAID') await c.query(`INSERT INTO sale(order_id,amount,method,paid_at,created_by) VALUES ($1,$2,'transfer',now(),$3)`, [o.id, o.total_final || o.total_est, user.id]);
    await audit(c, user.id, 'UPDATE', 'order', `Order ${o.code}: ${o.status} → ${v.status}`, o.id, { status: o.status }, { status: v.status });
    return {};
  },

  /* ---------------- SIKLUS ---------------- */
  async CYCLE_CREATE(c, p, user) {
    need(user, ['OWNER', 'MANAGER']);
    const v = z.object({
      dodDate: z.string().min(8),
      dodPrice: z.number().nonnegative(),
      breed: z.string().trim().min(2).optional(),
      targetDays: z.number().int().positive().max(200).optional(),
      barns: z.array(z.object({ code: z.string().min(1), qty: z.number().int().positive() })).min(1, 'Minimal satu kandang diisi.')
    }).parse(p);

    const farm = (await c.query('SELECT id FROM farm LIMIT 1')).rows[0];
    if (!farm) throw new ActionError('Data farm belum ada.');

    // satu siklus aktif pada satu waktu per kandang
    const busy = (await c.query(`
      SELECT b.name FROM barn b
      JOIN v_population v ON v.barn_id=b.id
      JOIN cycle cy ON cy.id=v.cycle_id AND cy.status='ACTIVE'
      WHERE b.code = ANY($1) GROUP BY b.name HAVING SUM(v.population) > 0`, [v.barns.map(x => x.code.toUpperCase())])).rows;
    if (busy.length) throw new ActionError(`Masih ada ternak di ${busy.map(r => r.name).join(', ')}. Kosongkan dulu sebelum memulai siklus baru.`);

    const n = +(await c.query('SELECT count(*) n FROM cycle WHERE farm_id=$1', [farm.id])).rows[0].n;
    const code = '#' + String(n + 1).padStart(3, '0');
    const curve = (await c.query(`SELECT value FROM master_config WHERE key='kurva_target_bobot'`)).rows[0]?.value || [];
    const qty = v.barns.reduce((a, x) => a + x.qty, 0);

    const cy = (await c.query(`INSERT INTO cycle(farm_id,code,breed,dod_date,dod_qty,dod_price,target_curve,target_days,status,stage,locked,created_by)
      VALUES ($1,$2,COALESCE($3,'Bebek Peking'),$4,$5,$6,$7,COALESCE($8,45),'ACTIVE','DOD_IN',true,$9) RETURNING id`,
      [farm.id, code, v.breed || null, v.dodDate, qty, v.dodPrice, JSON.stringify(curve), v.targetDays || null, user.id])).rows[0].id;

    for (const b of v.barns) {
      const bar = (await c.query('SELECT id,name,capacity FROM barn WHERE code=$1 AND is_active', [b.code.toUpperCase()])).rows[0];
      if (!bar) throw new ActionError(`Kandang ${b.code} tidak ditemukan atau nonaktif.`);
      if (b.qty > bar.capacity) throw new ActionError(`${bar.name} hanya muat ${bar.capacity} ekor, diisi ${b.qty}.`);
      await c.query(`INSERT INTO population_tx(cycle_id,barn_id,type,qty,ref_type,ref_id,occurred_at,created_by)
        VALUES ($1,$2,'DOD_IN',$3,'cycle',$1,$4,$5)`, [cy, bar.id, b.qty, v.dodDate, user.id]);
    }
    await audit(c, user.id, 'CREATE', 'cycle', `Siklus ${code} dimulai \u2014 ${qty} ekor DOD @ ${v.dodPrice}, ${v.barns.length} kandang`, cy, null, { code, qty, dodPrice: v.dodPrice });
    return { id: cy, code };
  },

  /* ---------------- MASTER PRODUK & STOK ---------------- */
  async PRODUCT_SAVE(c, p, user) {
    need(user, ['OWNER', 'ADMIN']);
    const v = z.object({
      id: uuid.optional(),
      name: z.string().trim().min(2),
      type: z.enum(['LIVE', 'CUT', 'CARCASS']),
      description: z.string().trim().optional(),
      pricePerKg: z.number().nonnegative(),
      minOrder: z.number().int().positive(),
      avgWeightKg: z.number().positive(),
      stockSource: z.enum(['POPULATION', 'INVENTORY']),
      inventoryId: uuid.optional(),
      published: z.boolean().optional()
    }).parse(p);
    if (v.stockSource === 'INVENTORY' && !v.inventoryId) throw new ActionError('Produk dari gudang harus memilih item stok.');
    const farm = (await c.query('SELECT id FROM farm LIMIT 1')).rows[0];
    if (v.id) {
      await c.query(`UPDATE product SET name=$1,type=$2,description=NULLIF($3,''),price_per_kg=$4,min_order=$5,avg_weight_kg=$6,stock_source=$7,inventory_id=$8,is_published=COALESCE($9,is_published),updated_at=now() WHERE id=$10`,
        [v.name, v.type, v.description || '', v.pricePerKg, v.minOrder, v.avgWeightKg, v.stockSource, v.stockSource === 'INVENTORY' ? v.inventoryId : null, v.published ?? null, v.id]);
      await audit(c, user.id, 'UPDATE', 'product', `Produk ${v.name} diperbarui \u2014 ${v.pricePerKg}/kg`, v.id);
      return { id: v.id };
    }
    const r = await c.query(`INSERT INTO product(farm_id,name,type,description,price_per_kg,min_order,avg_weight_kg,stock_source,inventory_id,is_published)
      VALUES ($1,$2,$3,NULLIF($4,''),$5,$6,$7,$8,$9,COALESCE($10,true)) RETURNING id`,
      [farm.id, v.name, v.type, v.description || '', v.pricePerKg, v.minOrder, v.avgWeightKg, v.stockSource, v.stockSource === 'INVENTORY' ? v.inventoryId : null, v.published ?? null]);
    await audit(c, user.id, 'CREATE', 'product', `Produk ${v.name} dibuat \u2014 ${v.pricePerKg}/kg`, r.rows[0].id);
    return { id: r.rows[0].id };
  },
  async INVENTORY_SAVE(c, p, user) {
    need(user, ['OWNER', 'ADMIN']);
    const v = z.object({
      id: uuid.optional(),
      name: z.string().trim().min(2),
      category: z.string().trim().min(2),
      unit: z.string().trim().min(1),
      minQty: z.number().nonnegative().optional(),
      avgWeightKg: z.number().positive().optional()
    }).parse(p);
    const farm = (await c.query('SELECT id FROM farm LIMIT 1')).rows[0];
    if (v.id) {
      await c.query('UPDATE inventory SET name=$1,category=$2,unit=$3,min_qty=COALESCE($4,min_qty),avg_weight_kg=$5 WHERE id=$6',
        [v.name, v.category, v.unit, v.minQty ?? null, v.avgWeightKg ?? null, v.id]);
      await audit(c, user.id, 'UPDATE', 'inventory', `Item stok ${v.name} diperbarui`, v.id);
      return { id: v.id };
    }
    const r = await c.query('INSERT INTO inventory(farm_id,name,category,unit,min_qty,avg_weight_kg) VALUES ($1,$2,$3,$4,COALESCE($5,0),$6) RETURNING id',
      [farm.id, v.name, v.category, v.unit, v.minQty ?? null, v.avgWeightKg ?? null]);
    await audit(c, user.id, 'CREATE', 'inventory', `Item stok ${v.name} (${v.category}) dibuat`, r.rows[0].id);
    return { id: r.rows[0].id };
  },

  /* ---------------- KANDANG ---------------- */
  async BARN_CREATE(c, p, user) {
    need(user, ['OWNER']);
    const v = z.object({ code: z.string().trim().min(1).max(4), name: z.string().trim().min(2), capacity: z.number().int().positive('Kapasitas harus lebih dari 0.'), note: z.string().trim().optional() }).parse(p);
    const code = v.code.toUpperCase();
    if (!/^[A-Z0-9]+$/.test(code)) throw new ActionError('Kode kandang hanya huruf/angka, contoh: D atau K4.');
    const farm = (await c.query('SELECT id FROM farm LIMIT 1')).rows[0];
    const dup = (await c.query('SELECT id FROM barn WHERE farm_id=$1 AND code=$2', [farm.id, code])).rows[0];
    if (dup) throw new ActionError(`Kode kandang "${code}" sudah dipakai.`);
    const r = await c.query(`INSERT INTO barn(farm_id,code,name,capacity,note) VALUES ($1,$2,$3,$4,NULLIF($5,'')) RETURNING id`, [farm.id, code, v.name, v.capacity, v.note || '']);
    await audit(c, user.id, 'CREATE', 'barn', `Kandang ${v.name} (${code}) dibuat \u2014 kapasitas ${v.capacity} ekor`, r.rows[0].id, null, { code, name: v.name, capacity: v.capacity });
    return { id: r.rows[0].id };
  },
  async BARN_UPDATE(c, p, user) {
    need(user, ['OWNER']);
    const v = z.object({ code: z.string().trim().min(1), name: z.string().trim().min(2), capacity: z.number().int().positive('Kapasitas harus lebih dari 0.'), note: z.string().trim().optional() }).parse(p);
    const b = (await c.query('SELECT id,code,name,capacity,note FROM barn WHERE code=$1', [v.code.toUpperCase()])).rows[0];
    if (!b) throw new ActionError('Kandang tidak ditemukan.');
    const pop = +(await c.query('SELECT COALESCE(SUM(population),0) n FROM v_population WHERE barn_id=$1', [b.id])).rows[0].n;
    if (v.capacity < pop) throw new ActionError(`Kapasitas tidak boleh di bawah populasi saat ini (${pop} ekor).`);
    await c.query(`UPDATE barn SET name=$1, capacity=$2, note=NULLIF($3,''), updated_at=now() WHERE id=$4`, [v.name, v.capacity, v.note || '', b.id]);
    const diff = [];
    if (b.name !== v.name) diff.push(`nama ${b.name} \u2192 ${v.name}`);
    if (b.capacity !== v.capacity) diff.push(`kapasitas ${b.capacity} \u2192 ${v.capacity}`);
    if ((b.note || '') !== (v.note || '')) diff.push('catatan diubah');
    await audit(c, user.id, 'UPDATE', 'barn', `Kandang ${v.name}${diff.length ? ' \u2014 ' + diff.join('; ') : ''}`, b.id, { name: b.name, capacity: b.capacity, note: b.note }, { name: v.name, capacity: v.capacity, note: v.note || null });
    return {};
  },
  async BARN_TOGGLE(c, p, user) {
    need(user, ['OWNER']);
    const v = z.object({ code: z.string().trim().min(1) }).parse(p);
    const b = (await c.query('SELECT id,name,is_active FROM barn WHERE code=$1', [v.code.toUpperCase()])).rows[0];
    if (!b) throw new ActionError('Kandang tidak ditemukan.');
    if (b.is_active) {
      const pop = +(await c.query('SELECT COALESCE(SUM(population),0) n FROM v_population WHERE barn_id=$1', [b.id])).rows[0].n;
      if (pop > 0) throw new ActionError(`Kandang masih berisi ${pop} ekor. Kosongkan dulu sebelum dinonaktifkan.`);
      const staff = +(await c.query('SELECT count(*) n FROM app_user WHERE barn_id=$1 AND is_active', [b.id])).rows[0].n;
      if (staff > 0) throw new ActionError(`Masih ada ${staff} anak kandang yang ditugaskan di sini. Pindahkan dulu.`);
    }
    await c.query('UPDATE barn SET is_active = NOT is_active, updated_at=now() WHERE id=$1', [b.id]);
    await audit(c, user.id, 'UPDATE', 'barn', `Kandang ${b.name} ${b.is_active ? 'dinonaktifkan' : 'diaktifkan'}`, b.id);
    return { active: !b.is_active };
  },

  /* ---------------- PENGGUNA & KONFIGURASI ---------------- */
  async USER_CREATE(c, p, user) {
    need(user, ['OWNER', 'ADMIN']);
    const v = z.object({ name: z.string().min(2), role: z.enum(['OWNER', 'MANAGER', 'ADMIN', 'ANAK_KANDANG']), barn: z.string().optional(), phone: z.string().min(6), email: z.string().email().optional().or(z.literal('')), password: z.string().min(8, 'Password minimal 8 karakter.') }).parse(p);
    if (v.role === 'OWNER' && user.role !== 'OWNER') deny('Hanya OWNER yang dapat membuat akun OWNER.');
    const farm = (await c.query('SELECT id FROM farm LIMIT 1')).rows[0];
    const b = v.barn ? (await c.query('SELECT id FROM barn WHERE code=$1', [v.barn])).rows[0]?.id : null;
    const hash = await argon2.hash(v.password, { type: argon2.argon2id });
    const r = await c.query(`INSERT INTO app_user(farm_id,name,phone,email,role,barn_id,password_hash,password_changed_at) VALUES ($1,$2,$3,NULLIF($4,''),$5,$6,$7,now()) RETURNING id`, [farm.id, v.name, v.phone, v.email || '', v.role, b, hash]);
    await audit(c, user.id, 'CREATE', 'app_user', `Pengguna ${v.name} (${v.role}) dibuat`, r.rows[0].id);
    return { id: r.rows[0].id };
  },
  async USER_UPDATE(c, p, user) {
    need(user, ['OWNER', 'ADMIN']);
    const v = z.object({ id: uuid, name: z.string().min(2), phone: z.string().min(6), email: z.string().email('Format email tidak valid.').optional().or(z.literal('')), role: z.enum(['OWNER', 'MANAGER', 'ADMIN', 'ANAK_KANDANG']), barn: z.string().optional() }).parse(p);
    const t = (await c.query('SELECT id,name,phone,email,role,barn_id FROM app_user WHERE id=$1', [v.id])).rows[0];
    if (!t) throw new ActionError('Pengguna tidak ditemukan.');
    if ((t.role === 'OWNER' || v.role === 'OWNER') && user.role !== 'OWNER') deny('Hanya OWNER yang dapat mengubah akun OWNER.');
    if (t.role === 'OWNER' && v.role !== 'OWNER') {
      const n = +(await c.query(`SELECT count(*) n FROM app_user WHERE role='OWNER' AND is_active AND id<>$1`, [v.id])).rows[0].n;
      if (!n) deny('Harus tersisa minimal satu OWNER aktif.');
    }
    const b = v.role === 'ANAK_KANDANG' ? (await c.query('SELECT id FROM barn WHERE code=$1', [v.barn || ''])).rows[0]?.id : null;
    if (v.role === 'ANAK_KANDANG' && !b) throw new ActionError('Anak kandang wajib punya kandang.');
    await c.query(`UPDATE app_user SET name=$1, phone=$2, email=NULLIF($3,''), role=$4, barn_id=$5, updated_at=now() WHERE id=$6`, [v.name, v.phone, v.email || '', v.role, b, v.id]);
    const diff = [];
    if (t.name !== v.name) diff.push(`nama ${t.name} \u2192 ${v.name}`);
    if (t.phone !== v.phone) diff.push(`HP ${t.phone} \u2192 ${v.phone}`);
    if ((t.email || '') !== (v.email || '')) diff.push(`email ${t.email || '-'} \u2192 ${v.email || '-'}`);
    if (t.role !== v.role) diff.push(`role ${t.role} \u2192 ${v.role}`);
    await audit(c, user.id, 'UPDATE', 'app_user', `Data ${v.name} diubah${diff.length ? ' \u2014 ' + diff.join('; ') : ''}`, v.id, { name: t.name, phone: t.phone, email: t.email, role: t.role }, { name: v.name, phone: v.phone, email: v.email || null, role: v.role });
    return {};
  },
  async USER_DELETE(c, p, user) {
    need(user, ['OWNER']);
    const v = z.object({ id: uuid }).parse(p);
    if (v.id === user.id) throw new ActionError('Tidak bisa menghapus akun sendiri.');
    const t = (await c.query('SELECT id,name,role,archived_at FROM app_user WHERE id=$1', [v.id])).rows[0];
    if (!t) throw new ActionError('Pengguna tidak ditemukan.');
    if (t.archived_at) throw new ActionError(`${t.name} sudah diarsipkan.`);
    if (t.role === 'OWNER') {
      const n = +(await c.query(`SELECT count(*) n FROM app_user WHERE role='OWNER' AND is_active AND archived_at IS NULL AND id<>$1`, [v.id])).rows[0].n;
      if (!n) deny('Harus tersisa minimal satu OWNER aktif.');
    }
    await c.query('DELETE FROM session WHERE user_id=$1', [v.id]);

    // Coba hapus betulan. Kalau baris ini masih dirujuk riwayat mana pun
    // (transaksi, lampiran, approval, atau audit log), PostgreSQL menolak —
    // dan itu memang yang kita mau: riwayat tidak boleh jadi yatim.
    let removed = false;
    await c.query('SAVEPOINT try_delete');
    try {
      await c.query('DELETE FROM app_user WHERE id=$1', [v.id]);
      await c.query('RELEASE SAVEPOINT try_delete');
      removed = true;
    } catch (e) {
      await c.query('ROLLBACK TO SAVEPOINT try_delete');
      if (e.code !== '23503') throw e;
      await c.query('UPDATE app_user SET archived_at=now(), is_active=false, password_hash=NULL, updated_at=now() WHERE id=$1', [v.id]);
    }
    await audit(c, user.id, removed ? 'DELETE' : 'UPDATE', 'app_user',
      removed ? `Pengguna ${t.name} (${t.role}) dihapus permanen \u2014 belum punya riwayat apa pun`
              : `Pengguna ${t.name} (${t.role}) diarsipkan \u2014 masih terpakai di riwayat, baris tidak dihapus`,
      v.id, { name: t.name, role: t.role }, null);
    return { removed, name: t.name };
  },
  async USER_PASSWORD(c, p, user, _file, req) {
    const v = z.object({ id: uuid, current: z.string().optional(), password: z.string().min(8, 'Password minimal 8 karakter.') }).parse(p);
    const t = (await c.query('SELECT id,name,role,password_hash FROM app_user WHERE id=$1', [v.id])).rows[0];
    if (!t) throw new ActionError('Pengguna tidak ditemukan.');
    const self = v.id === user.id;
    if (self) {
      if (!v.current || !t.password_hash || !(await argon2.verify(t.password_hash, v.current))) throw new ActionError('Password lama salah.');
    } else {
      need(user, ['OWNER', 'ADMIN']);
      if (t.role === 'OWNER' && user.role !== 'OWNER') deny('Hanya OWNER yang dapat mengatur password OWNER.');
    }
    const hash = await argon2.hash(v.password, { type: argon2.argon2id });
    await c.query('UPDATE app_user SET password_hash=$1, password_changed_at=now(), failed_logins=0, locked_until=NULL, updated_at=now() WHERE id=$2', [hash, v.id]);
    // paksa login ulang di semua perangkat lain, sesi yang sedang dipakai tetap hidup
    await c.query('DELETE FROM session WHERE user_id=$1 AND id <> $2', [v.id, req?.cookies?.pf_session || '00000000-0000-0000-0000-000000000000']);
    await audit(c, user.id, 'UPDATE', 'app_user', self ? 'Mengganti password sendiri' : `Password ${t.name} diatur ulang oleh ${user.role}`, v.id);
    return { self };
  },
  async USER_TOGGLE(c, p, user) {
    need(user, ['OWNER', 'ADMIN']);
    const v = z.object({ id: uuid }).parse(p);
    if (v.id === user.id) throw new ActionError('Tidak bisa menonaktifkan akun sendiri.');
    const r = await c.query(`UPDATE app_user SET is_active = NOT is_active WHERE id=$1 RETURNING name,is_active`, [v.id]);
    await c.query('DELETE FROM session WHERE user_id=$1', [v.id]);
    await audit(c, user.id, 'UPDATE', 'app_user', `${r.rows[0].name} ${r.rows[0].is_active ? 'diaktifkan' : 'dinonaktifkan'}`, v.id);
    return { active: r.rows[0].is_active };
  },
  async CONFIG_SAVE(c, p, user) {
    need(user, ['OWNER']);
    const map = { hargaDOD: 'harga_dod', hargaPakanKg: 'harga_pakan_kg', hargaJualHidupKg: 'harga_jual_hidup_kg', hargaJualPotongKg: 'harga_jual_potong_kg', hargaJualKarkasKg: 'harga_jual_karkas_kg', targetPanenHari: 'target_panen_hari', targetMortalitasPct: 'target_mortalitas_pct', minStokPakanHari: 'min_stok_pakan_hari' };
    const changes = [];
    for (const [k, key] of Object.entries(map)) if (p[k] !== undefined) {
      const val = z.number().nonnegative().parse(+p[k]);
      const old = (await c.query('SELECT value FROM master_config WHERE key=$1', [key])).rows[0]?.value;
      if (Number(old) !== val) { await c.query(`UPDATE master_config SET value=$1::jsonb, updated_by=$2, updated_at=now() WHERE key=$3`, [JSON.stringify(val), user.id, key]); changes.push(`${key}: ${old} → ${val}`); }
    }
    if (p.targetBobotMin !== undefined || p.targetBobotMax !== undefined) {
      const old = (await c.query(`SELECT value FROM master_config WHERE key='target_bobot'`)).rows[0].value;
      const nv = { min: +(p.targetBobotMin ?? old.min), max: +(p.targetBobotMax ?? old.max) };
      if (nv.min !== +old.min || nv.max !== +old.max) { await c.query(`UPDATE master_config SET value=$1::jsonb, updated_by=$2 WHERE key='target_bobot'`, [JSON.stringify(nv), user.id]); changes.push(`target_bobot: ${old.min}-${old.max} → ${nv.min}-${nv.max}`); }
    }
    if (changes.length) await audit(c, user.id, 'CONFIG', 'master_config', `Master data diubah — ${changes.join('; ')}`, 'MASTER');
    return { changed: changes.length };
  },
  async ANOMALY_VERIFY(c, p, user) {
    need(user, ['OWNER', 'MANAGER']);
    const v = z.object({ id: z.string(), note: z.string().min(3), title: z.string().optional(), severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional() }).parse(p);
    await c.query(`INSERT INTO anomaly(rule_code,severity,title,detail,dedupe_key,status,verified_by,verified_at,verify_note) VALUES ($1,$2,$3,$4,$5,'VERIFIED',$6,now(),$7)
      ON CONFLICT (dedupe_key) DO UPDATE SET status='VERIFIED', verified_by=EXCLUDED.verified_by, verified_at=now(), verify_note=EXCLUDED.verify_note`,
      [v.id.replace(/^AN-/, '').split('-')[0], v.severity || 'WARNING', v.title || v.id, v.note, v.id, user.id, v.note]);
    await audit(c, user.id, 'UPDATE', 'anomaly', `Anomali ${v.id} diverifikasi: ${v.note}`, v.id);
    return {};
  },
};

/** Order dari website publik (tanpa login). */
export async function publicOrder(p, req) {
  const v = z.object({ name: z.string().min(2).max(80), phone: z.string().min(8).max(20), product: uuid, qty: z.number().int().positive().max(1000), pickup: z.string(), address: z.string().max(300).optional(), note: z.string().max(300).optional() }).parse(p);
  return tx(null, async c => {
    const prod = (await c.query('SELECT p.*, v.available_stock FROM product p JOIN v_product_public v ON v.id=p.id WHERE p.id=$1', [v.product])).rows[0];
    if (!prod) throw new ActionError('Produk tidak tersedia.');
    if (v.qty < prod.min_order) throw new ActionError(`Minimum order ${prod.min_order} ekor.`);
    if (Number(prod.available_stock) <= 0) throw new ActionError('Stok habis.');
    const cust = (await c.query(`INSERT INTO customer(name,phone,type,address) VALUES ($1,$2,'Website',$3) RETURNING id`, [v.name, v.phone, v.address || null])).rows[0].id;
    const code = 'ORD-' + String((await c.query("SELECT nextval('order_code_seq') n")).rows[0].n).padStart(4, '0');
    const est = v.qty * Number(prod.avg_weight_kg) * Number(prod.price_per_kg);
    const cy = prod.stock_source === 'POPULATION' ? (await c.query(`SELECT id FROM cycle WHERE status='ACTIVE' LIMIT 1`)).rows[0] : null;
    const o = await c.query(`INSERT INTO "order"(code,customer_id,source,status,pickup_date,address,note,total_est) VALUES ($1,$2,'WEBSITE','NEW',$3,$4,$5,$6) RETURNING id`, [code, cust, v.pickup, v.address || null, v.note || null, est]);
    await c.query(`INSERT INTO order_item(order_id,product_id,cycle_id,qty,price_per_kg) VALUES ($1,$2,$3,$4,$5)`, [o.rows[0].id, prod.id, cy?.id || null, v.qty, prod.price_per_kg]);
    await audit(c, null, 'CREATE', 'order', `Order ${code} masuk dari website — ${v.name}, ${v.qty} ekor ${prod.name}`, o.rows[0].id, null, null, req);
    await notify(c, ['OWNER', 'ADMIN'], 'new_order', `Order baru ${code} dari website`, `${v.name} — ${v.qty} ekor ${prod.name}`, '/penjualan');
    return { code, productName: prod.name, qty: v.qty, pickup: v.pickup, estTotal: est };
  });
}

export async function runAction(type, payload, user, file, req) {
  const fn = ACTIONS[type];
  if (!fn) throw new ActionError('Aksi tidak dikenal: ' + type, 404);
  return tx(user, c => fn(c, payload, user, file, req));
}
export { ActionError };
