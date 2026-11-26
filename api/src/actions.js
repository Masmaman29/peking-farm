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

/* Versi rumus yang dipakai saat memotret HPP penutupan batch. Disimpan di tiap
   potret supaya angka lama tetap bisa dijelaskan kalau rumusnya berubah nanti.
   018 = biaya pakan dinilai menurut harga pada tanggal pemakaian. */
const FORMULA_HPP = '018-harga-pakan-saat-pakai';

/* Jatah pakan: 5 angka gram/ekor/hari untuk rentang umur tetap. */
const RENTANG_UMUR = [[1, 7], [8, 14], [15, 21], [22, 28], [29, 999]];
const skemaJatah = z.array(z.number().nonnegative().max(1000)).length(5, 'Jatah pakan harus 5 angka (satu per rentang umur).');
const jadiPlan = g => RENTANG_UMUR.map(([a, b], i) => [a, b, g[i]]);

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

/* Batch yang sedang mengisi SATU kandang.
 * Ini inti dukungan banyak batch: input harian mengikuti kandangnya, bukan
 * siklus yang paling baru dibuat. Tanpa ini, pakan untuk batch umur 20 hari
 * akan tercatat di batch yang baru masuk kemarin. */
async function cycleOfBarn(c, barnUuid, barnLabel) {
  const r = await c.query(
    `SELECT cy.* FROM cycle cy
       JOIN v_population v ON v.cycle_id = cy.id AND v.barn_id = $1
      WHERE cy.status='ACTIVE' AND v.population > 0
      ORDER BY cy.dod_date LIMIT 1`, [barnUuid]);
  if (!r.rows.length) {
    const nm = barnLabel || (await c.query('SELECT name FROM barn WHERE id=$1', [barnUuid])).rows[0]?.name || 'itu';
    throw new ActionError(`Tidak ada ternak di ${nm}. Mulai batch baru dulu di kandang itu, atau pilih kandang lain.`);
  }
  return r.rows[0];
}

/* Dipakai aksi tingkat farm (pembelian pakan, opname, penyesuaian stok):
 * tidak terikat batch mana pun. */
async function anyActiveCycle(c) {
  const r = await c.query(`SELECT * FROM cycle WHERE status='ACTIVE' ORDER BY dod_date LIMIT 1`);
  return r.rows[0] || null;
}
const jamJkt = d => new Date(d).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Foto yang sha256-nya sudah pernah masuk ditolak — tidak bisa pakai foto lama. */
async function tolakFotoDaurUlang(c, sha) {
  const cfg = await config(c);
  if (!cfg.foto_unik) return;
  const r = await c.query(
    `SELECT a.kind, a.uploaded_at, u.name
       FROM attachment a JOIN app_user u ON u.id = a.uploaded_by
      WHERE a.sha256 = $1
      ORDER BY a.uploaded_at LIMIT 1`, [sha]);
  if (!r.rows.length) return;
  const d = r.rows[0];
  throw new ActionError(
    `Foto ini sudah pernah dipakai (bukti ${d.kind}, ${jamJkt(d.uploaded_at)}, oleh ${d.name}). Ambil foto baru sekarang.`);
}

async function saveAttachment(c, file, entity_type, entity_id, kind, user) {
  if (!file) return null;
  const buf = await file.toBuffer();
  const sha = crypto.createHash('sha256').update(buf).digest('hex');
  await tolakFotoDaurUlang(c, sha);
  const ext = (path.extname(file.filename) || '.jpg').toLowerCase().slice(0, 6);
  const name = `${crypto.randomUUID()}${ext}`;
  const dir = process.env.UPLOAD_DIR || './data/uploads';
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buf);
  const url = `/uploads/${name}`;
  const src = file.source === 'kamera' ? 'kamera' : 'galeri';
  await c.query(`INSERT INTO attachment(entity_type,entity_id,kind,file_url,sha256,mime,size_bytes,uploaded_by,source) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [entity_type, entity_id, kind, url, sha, file.mimetype, buf.length, user.id, src]);
  await audit(c, user.id, 'UPLOAD', 'attachment', `Upload ${kind} ${name} dari ${src} (sha256 ${sha.slice(0, 12)}…)`, entity_id);
  if (src !== 'kamera') {
    await notify(c, ['OWNER', 'MANAGER'], 'foto_galeri', `Bukti ${kind} diambil dari galeri`, `${user.name} mengunggah bukti bukan dari kamera langsung — perlu dicek.`, '/audit');
  }
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
    const v = z.object({ kg: z.number().positive().max(2000), barn: z.string(), feedType: z.string().optional(), sesi: z.enum(['PAGI', 'SORE']).optional() }).parse(p);
    await requirePhoto(c, file);
    const b = await barnId(c, v.barn, user); const cy = await cycleOfBarn(c, b, v.barn);
    const feed = (await c.query(`SELECT id FROM feed WHERE type=$1 LIMIT 1`, [v.feedType || 'GROWER'])).rows[0] || (await c.query('SELECT id FROM feed LIMIT 1')).rows[0];
    // Sesi tidak dipilih: ditentukan dari jam input (sebelum 12.00 WIB = pagi).
    const sesi = v.sesi || (+new Date().toLocaleString('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', hour12: false }) < 12 ? 'PAGI' : 'SORE');
    const r = await c.query(`INSERT INTO feed_transaction(cycle_id,barn_id,feed_id,type,qty_kg,occurred_at,created_by,sesi) VALUES ($1,$2,$3,'USAGE',$4,now(),$5,$6) RETURNING id`, [cy.id, b, feed.id, -v.kg, user.id, sesi]);
    const photo = await saveAttachment(c, file, 'feed_transaction', r.rows[0].id, 'pakan', user);
    await audit(c, user.id, 'CREATE', 'feed_transaction', `Input pakan ${v.kg} kg — Kandang ${v.barn}${photo ? ' — Bukti ' + photo : ''}`, r.rows[0].id);
    return { id: r.rows[0].id, photo, sesi };
  },
  async MORTALITY(c, p, user, file) {
    need(user, ['OWNER', 'MANAGER', 'ANAK_KANDANG']);
    /* kind: MATI (mati sendiri) atau AFKIR (sengaja disingkirkan). Lihat
       migrasi 024 — dicampur, persentase mortalitas tidak bisa dibaca.
       Default MATI supaya pemanggil lama tetap jalan apa adanya. */
    const v = z.object({ qty: z.number().int().positive().max(500), barn: z.string(), cause: z.string().min(1),
      kind: z.enum(['MATI', 'AFKIR']).optional(), note: z.string().optional() }).parse(p);
    await requirePhoto(c, file);
    const kind = v.kind || 'MATI';
    const b = await barnId(c, v.barn, user); const cy = await cycleOfBarn(c, b, v.barn);
    const pop = (await c.query('SELECT population FROM v_population WHERE cycle_id=$1 AND barn_id=$2', [cy.id, b])).rows[0]?.population || 0;
    const kata = kind === 'AFKIR' ? 'Afkir' : 'Mati';
    if (v.qty > pop) throw new ActionError(`Jumlah ${kata.toLowerCase()} (${v.qty}) melebihi populasi kandang (${pop}).`);
    const r = await c.query(`INSERT INTO mortality(cycle_id,barn_id,qty,cause,kind,note,occurred_at,created_by) VALUES ($1,$2,$3,$4,$5,$6,now(),$7) RETURNING id`, [cy.id, b, v.qty, v.cause, kind, v.note || null, user.id]);
    const photo = await saveAttachment(c, file, 'mortality', r.rows[0].id, 'kematian', user);
    /* Batas harian hanya berlaku untuk MATI. Afkir itu keputusan peternak,
       bukan gejala — memperingatkannya hanya membuat peringatan jadi bising
       dan lama-lama diabaikan. */
    const cfg = await config(c); const warn = kind === 'MATI' && v.qty >= +cfg.batas_mortalitas_harian;
    await audit(c, user.id, 'CREATE', 'mortality', `Bebek ${kata.toLowerCase()} ${v.qty} ekor — Kandang ${v.barn} — ${v.cause}${warn ? ' (WARNING)' : ''}`, r.rows[0].id);
    if (warn) await notify(c, ['OWNER', 'MANAGER'], 'mortality_abnormal', `Kematian ${v.qty} ekor di Kandang ${v.barn}`, 'Di atas batas harian — perlu verifikasi', '/populasi');
    return { id: r.rows[0].id, photo, warning: warn };
  },
  async WEIGHT(c, p, user, file) {
    need(user, ['OWNER', 'MANAGER', 'ANAK_KANDANG']);
    const v = z.object({ n: z.number().int().min(1).max(200), total: z.number().positive().max(1000), barn: z.string() }).parse(p);
    await requirePhoto(c, file);
    const b = await barnId(c, v.barn, user); const cy = await cycleOfBarn(c, b, v.barn);
    const r = await c.query(`INSERT INTO weight_record(cycle_id,barn_id,sample_n,total_kg,occurred_at,created_by) VALUES ($1,$2,$3,$4,now(),$5) RETURNING id, avg_kg`, [cy.id, b, v.n, v.total, user.id]);
    const photo = await saveAttachment(c, file, 'weight_record', r.rows[0].id, 'timbangan', user);
    await audit(c, user.id, 'CREATE', 'weight_record', `Timbang ${v.n} ekor, total ${v.total} kg, rata-rata ${(+r.rows[0].avg_kg).toFixed(2)} kg — Kandang ${v.barn}`, r.rows[0].id);
    return { id: r.rows[0].id, avg: +r.rows[0].avg_kg, photo };
  },
  async BARN_CONDITION(c, p, user, file) {
    need(user, ['OWNER', 'MANAGER', 'ANAK_KANDANG']);
    const v = z.object({ barn: z.string(), temp: z.number(), hum: z.number(), litter: z.enum(['Kering', 'Agak lembab', 'Basah']), water: z.enum(['Lancar', 'Tersendat', 'Kosong']), behavior: z.enum(['Aktif', 'Lesu', 'Menggerombol']).optional(), note: z.string().optional() }).parse(p);
    const b = await barnId(c, v.barn, user); const cy = await cycleOfBarn(c, b, v.barn);
    const r = await c.query(`INSERT INTO barn_condition(cycle_id,barn_id,temp_c,humidity_pct,litter,water,behavior,note,occurred_at,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(),$9) RETURNING id`, [cy.id, b, v.temp, v.hum, v.litter, v.water, v.behavior || 'Aktif', v.note || null, user.id]);
    await saveAttachment(c, file, 'barn_condition', r.rows[0].id, 'kandang', user);
    await audit(c, user.id, 'CREATE', 'barn_condition', `Kondisi kandang ${v.barn}: ${v.temp}°C, ${v.hum}%, sekam ${v.litter}, air ${v.water}`, r.rows[0].id);
    return { id: r.rows[0].id };
  },
  async HEALTH(c, p, user, file) {
    need(user, ['OWNER', 'MANAGER', 'ANAK_KANDANG']);
    const v = z.object({ barn: z.string(), type: z.enum(['Vaksinasi', 'Vitamin', 'Pengobatan', 'Observasi']), item: z.string().min(1), dose: z.string().optional(), note: z.string().optional() }).parse(p);
    if (v.barn === 'ALL') throw new ActionError('Pilih kandangnya. Tindakan kesehatan dicatat per kandang karena tiap kandang beda umur dan beda batch.');
    const b = await barnId(c, v.barn, user); const cy = await cycleOfBarn(c, b, v.barn);
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
    need(user, ['OWNER', 'ADMIN', 'MANAGER']);
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
      // Order sampai ke PENDING_APPROVAL hanya karena nilainya melewati ambang,
      // jadi menyetujuinya adalah keputusan keuangan: OWNER/ADMIN saja.
      if (!['OWNER', 'ADMIN'].includes(user.role)) deny('Order di atas ambang hanya bisa disetujui Owner atau Admin.');
      /* Aturan empat mata (constraint approval_check2 di database): yang mengajukan
         tidak boleh menyetujui pengajuannya sendiri. Dicegat di sini supaya
         pesannya bisa dibaca, bukan pesan constraint mentah. */
      {
        const ap = (await c.query(`SELECT requested_by FROM approval WHERE entity_type='order' AND entity_id=$1 AND status='PENDING' LIMIT 1`, [o.id])).rows[0];
        if (ap && ap.requested_by === user.id) {
          throw new ActionError('Order ini Anda sendiri yang mengajukan, jadi tidak bisa Anda setujui sendiri. Minta Owner atau Admin lain yang memutuskan.');
        }
      }
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
    const v = z.object({ qty: z.number().positive(), price: z.number().positive(), vendor: z.string().min(1), ref: z.string().min(1), feedType: z.string().optional(),
      tanggal: z.string().trim().optional(), alasanMundur: z.string().trim().max(300).optional() }).parse(p);
    await requirePhoto(c, file);
    const cfg = await config(c);
    /* Tanggal nota boleh dimundurkan — nota memang kadang baru ketemu belakangan.
       Tapi lewat batas (bawaan 7 hari) nota itu jadi KOREKSI: wajib beralasan,
       masuk sebagai PENDING, dan hanya OWNER yang boleh menyetujui.
       Tanggal kejadian (occurred_at) dan waktu input sebenarnya (created_at)
       disimpan terpisah, jadi keterlambatannya selalu bisa dilihat.
       Aturan yang sama juga dijaga trigger fn_backdate_guard di database,
       supaya tetap berlaku lewat jalur mana pun. */
    /* Hari mundur dihitung DI DATABASE lewat fn_hari_mundur(), bukan di sini.
       Dengan begitu backend, trigger, dan layar memakai satu rumus yang sama:
       selisih tanggal kalender menurut zona waktu farm (Asia/Jakarta), bukan
       selisih jam. Server yang menentukan — angka dari layar hanya petunjuk. */
    const batas = +(await c.query('SELECT fn_batas_backdate() AS n')).rows[0].n;
    let occurred = null, mundur = 0;
    if (v.tanggal) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v.tanggal)) throw new ActionError('Tanggal nota tidak terbaca.');
      const h = await c.query(
        `SELECT ($1::date + TIME '07:00') AT TIME ZONE fn_zona_waktu() AS saat,
                fn_hari_mundur(($1::date + TIME '07:00') AT TIME ZONE fn_zona_waktu()) AS mundur`, [v.tanggal]);
      if (!h.rows[0]) throw new ActionError('Tanggal nota tidak terbaca.');
      occurred = h.rows[0].saat;
      mundur = +h.rows[0].mundur;
      const depan = (await c.query(
        `SELECT ($1::date > (now() AT TIME ZONE fn_zona_waktu())::date) AS y`, [v.tanggal])).rows[0].y;
      if (depan) throw new ActionError('Tanggal nota tidak boleh di masa depan.');
    }
    const koreksi = mundur > batas;
    if (koreksi && (!v.alasanMundur || v.alasanMundur.length < 5)) {
      throw new ActionError(`Nota ini mundur ${mundur} hari (batas ${batas} hari), jadi masuk sebagai koreksi. Tulis alasannya, dan nanti harus disetujui Owner.`);
    }
    const cy = { id: null };   // pembelian pakan masuk stok farm, bukan batch tertentu
    const feed = (await c.query(`SELECT id FROM feed WHERE type=$1 LIMIT 1`, [v.feedType || 'GROWER'])).rows[0] || (await c.query('SELECT id FROM feed LIMIT 1')).rows[0];
    // Nota koreksi SELALU menunggu persetujuan, berapa pun nilainya.
    const big = koreksi || v.qty * v.price > +cfg.ambang_approval_rp;
    const r = await c.query(`INSERT INTO feed_transaction(cycle_id,feed_id,type,qty_kg,price_per_kg,vendor,ref_no,occurred_at,status,locked,created_by,backdate_reason) VALUES ($1,$2,'PURCHASE',$3,$4,$5,$6,COALESCE($10,now()),$7,$8,$9,$11) RETURNING id`,
      [cy.id, feed.id, v.qty, v.price, v.vendor, v.ref, big ? 'PENDING' : 'APPROVED', !big, user.id,
       occurred, koreksi ? v.alasanMundur : null]);
    if (big) {
      await approvalRow(c, 'feed_transaction', r.rows[0].id, user, 'OWNER');
      await notify(c, ['OWNER'], 'approval_pending',
        koreksi ? `Koreksi nota pakan mundur ${mundur} hari` : 'Pembelian pakan menunggu approval',
        `${v.qty} kg — ${rp(v.qty * v.price)}${koreksi ? ` — tanggal nota ${v.tanggal}, alasan: ${v.alasanMundur}` : ''}`, '/persetujuan');
    }
    await saveAttachment(c, file, 'feed_transaction', r.rows[0].id, 'nota', user);
    await audit(c, user.id, 'CREATE', 'feed_transaction', `Pembelian pakan ${v.qty} kg — ${rp(v.qty * v.price)}${big ? ' (menunggu approval)' : ''}`, r.rows[0].id);
    return { id: r.rows[0].id, pending: big };
  },
  /* Biaya tambahan satu kandang (obat, sekam, gas, dll). Opsional, boleh tanpa nota,
     boleh dicatat anak kandang. DOD dan pakan tidak lewat sini: keduanya sudah dihitung sendiri. */
  async BIAYA_KANDANG(c, p, user, file) {
    need(user, ['OWNER', 'MANAGER', 'ADMIN', 'ANAK_KANDANG']);
    const catMap = { Obat: 'OBAT', Vitamin: 'VITAMIN', Sekam: 'SEKAM', Listrik: 'LISTRIK', Gas: 'GAS', 'Tenaga kerja': 'TENAGA_KERJA', Transport: 'TRANSPORT', Peralatan: 'PERALATAN', Perbaikan: 'MAINTENANCE', Lainnya: 'LAIN' };
    const v = z.object({ barn: z.string().min(1), cat: z.string(), amount: z.number().positive().max(1e10), ket: z.string().trim().max(200).optional() }).parse(p);
    if (!catMap[v.cat]) throw new ActionError('Jenis biaya tidak dikenal.');
    const bb = await barnId(c, v.barn, user); const cy = await cycleOfBarn(c, bb, v.barn);
    const cfg = await config(c); const big = v.amount > +cfg.ambang_approval_rp;
    const r = await c.query(`INSERT INTO expense(cycle_id,category,amount,vendor,ref_no,occurred_at,status,created_by) VALUES ($1,$2,$3,$4,$5,CURRENT_DATE,$6,$7) RETURNING id`,
      [cy.id, catMap[v.cat], v.amount, v.ket || '-', file ? 'NOTA' : 'TANPA-NOTA', big ? 'PENDING' : 'APPROVED', user.id]);
    if (big) { await approvalRow(c, 'expense', r.rows[0].id, user, 'OWNER'); await notify(c, ['OWNER'], 'approval_pending', 'Biaya kandang menunggu approval', `${v.cat} ${rp(v.amount)} — Kandang ${v.barn}`, '/persetujuan'); }
    if (file) await saveAttachment(c, file, 'expense', r.rows[0].id, 'nota', user);
    await audit(c, user.id, 'CREATE', 'expense', `Biaya ${v.cat} ${rp(v.amount)} — Kandang ${v.barn}, batch ${cy.code}${file ? '' : ' (tanpa nota)'}${big ? ' (menunggu approval)' : ''}`, r.rows[0].id);
    return { id: r.rows[0].id, pending: big };
  },
  async EXPENSE(c, p, user, file) {
    need(user, ['OWNER', 'ADMIN']);
    /* T-6: kategori DOD dan Pakan SENGAJA tidak ada di sini.
       Biaya DOD sudah dihitung dari cycle.dod_qty x cycle.dod_price, dan biaya
       pakan dari feed_transaction USAGE x harga nota. Mencatatnya lagi sebagai
       expense membuat v_cycle_cost menjumlahkannya dua kali — terukur Rp 999.000
       pada pengujian. Formulir memang tidak menawarkannya, tapi dulu aksi ini
       masih menerimanya lewat permintaan langsung. */
    const catMap = { Vitamin: 'VITAMIN', Obat: 'OBAT', Listrik: 'LISTRIK', Gas: 'GAS', Sekam: 'SEKAM', 'Tenaga kerja': 'TENAGA_KERJA', Transport: 'TRANSPORT', Peralatan: 'PERALATAN', Maintenance: 'MAINTENANCE', Sewa: 'SEWA', 'Biaya lain': 'LAIN' };
    if (/^(dod|pakan)$/i.test(String(p && p.cat || '').trim())) {
      throw new ActionError('Biaya DOD dan pakan tidak dicatat di sini — keduanya sudah dihitung otomatis dari data bibit dan pemakaian pakan. Mencatatnya lagi akan menghitung dua kali.');
    }
    const v = z.object({ cat: z.string(), amount: z.number().positive(), vendor: z.string().min(1), ref: z.string().min(1), barn: z.string().optional(),
      periodeDari: z.string().trim().optional(), periodeSampai: z.string().trim().optional() }).parse(p);
    if (!catMap[v.cat]) throw new ActionError('Kategori tidak dikenal.');
    await requirePhoto(c, file);
    const cfg = await config(c); const big = v.amount > +cfg.ambang_approval_rp;
    // Biaya boleh ditempelkan ke satu batch (lewat kandangnya). Tanpa itu jadi
    // biaya umum farm - listrik, gaji, sewa - yang memang bukan milik satu batch.
    let cy = { id: null };
    if (v.barn) { const bb = await barnId(c, v.barn, user); cy = await cycleOfBarn(c, bb, v.barn); }

    /* T-8: biaya tingkat farm (gaji, listrik, sewa) dibagi ke tiap batch
       menurut ekor-hari, jadi sistem harus tahu PERIODE mana yang dibebani.
       Tagihan listrik bulan November dibagi ke hari-hari bulan November,
       bukan ke tanggal tagihannya dibayar. Tanpa periode, biayanya menggantung
       dan tidak pernah masuk HPP mana pun. Penjaga database juga menolaknya;
       pemeriksaan di sini hanya supaya pesannya enak dibaca. */
    let pDari = null, pSampai = null;
    if (!cy.id) {
      const iso = /^\d{4}-\d{2}-\d{2}$/;
      if (!v.periodeDari || !v.periodeSampai) {
        /* Tanpa periode yang disebut, dipakai bulan berjalan menurut kalender
           farm — itu keadaan paling umum: biaya bulan ini, dicatat bulan ini. */
        const b = (await c.query(
          `SELECT date_trunc('month', (now() AT TIME ZONE fn_zona_waktu())::date)::date AS d,
                  (date_trunc('month', (now() AT TIME ZONE fn_zona_waktu())::date)
                     + interval '1 month - 1 day')::date AS s`)).rows[0];
        pDari = b.d; pSampai = b.s;
      } else {
        if (!iso.test(v.periodeDari) || !iso.test(v.periodeSampai))
          throw new ActionError('Tanggal periode tidak terbaca. Pakai bentuk tahun-bulan-tanggal.');
        if (v.periodeSampai < v.periodeDari)
          throw new ActionError('Periode terbalik: tanggal akhir lebih awal dari tanggal mulai.');
        pDari = v.periodeDari; pSampai = v.periodeSampai;
      }
    } else if (v.periodeDari || v.periodeSampai) {
      throw new ActionError('Periode hanya untuk biaya tingkat farm. Biaya yang menempel pada satu kandang memakai tanggal kejadian.');
    }

    const r = await c.query(`INSERT INTO expense(cycle_id,category,amount,vendor,ref_no,occurred_at,status,periode_dari,periode_sampai,created_by) VALUES ($1,$2,$3,$4,$5,CURRENT_DATE,$6,$7,$8,$9) RETURNING id`, [cy.id, catMap[v.cat], v.amount, v.vendor, v.ref, big ? 'PENDING' : 'APPROVED', pDari, pSampai, user.id]);
    if (big) await approvalRow(c, 'expense', r.rows[0].id, user, 'OWNER');
    await saveAttachment(c, file, 'expense', r.rows[0].id, 'nota', user);
    await audit(c, user.id, 'CREATE', 'expense', `Biaya ${v.cat} ${rp(v.amount)} — ${v.vendor}${cy.id ? '' : ` · biaya farm periode ${pDari} s/d ${pSampai}, dibagi ke batch menurut ekor-hari`}${big ? ' (menunggu approval)' : ''}`, r.rows[0].id);
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
    const cy = { id: null };   // stok pakan dihitung tingkat farm
    const feed = (await c.query('SELECT id FROM feed LIMIT 1')).rows[0];
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
    // Jual dari populasi: ambil batch tertua yang masih berisi (paling dekat panen)
    const cy = prod.stock_source === 'POPULATION' ? await anyActiveCycle(c) : null;
    if (prod.stock_source === 'POPULATION' && !cy) throw new ActionError('Belum ada batch berjalan, jadi belum ada ternak untuk dijual.');
    const barn = cy ? (await c.query(`SELECT barn_id FROM v_population WHERE cycle_id=$1 ORDER BY population DESC LIMIT 1`, [cy.id])).rows[0].barn_id : null;
    const o = await c.query(`INSERT INTO "order"(code,customer_id,source,status,payment_status,pickup_date,total_est,created_by) VALUES ($1,$2,'ADMIN',$3,$4,$5,$6,$7) RETURNING id`,
      [code, cust, big ? 'PENDING_APPROVAL' : 'CONFIRMED', v.pay === 'PAID' ? 'PAID' : v.pay === 'DP' ? 'DP' : 'UNPAID', v.pickup || null, est, user.id]);
    await c.query(`INSERT INTO order_item(order_id,product_id,cycle_id,barn_id,qty,weight_kg,price_per_kg) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [o.rows[0].id, prod.id, cy?.id || null, barn, v.qty, v.weight || null, v.priceKg]);
    // Manager tetap diberi tahu ada order menunggu persetujuannya, tapi tanpa
    // nominalnya. Nominal hanya ke peran keuangan.
    if (big) {
      await approvalRow(c, 'order', o.rows[0].id, user, 'OWNER');
      await notify(c, ['OWNER', 'ADMIN'], 'approval_pending', `Order ${code} menunggu approval`, rp(est), '/persetujuan');
      await notify(c, ['MANAGER'], 'approval_pending', `Order ${code} menunggu approval`, `${v.qty} ekor ${prod.name}`, '/persetujuan');
    }
    else await c.query('SELECT fn_order_apply_stock($1,$2)', [o.rows[0].id, user.id]);
    await audit(c, user.id, 'CREATE', 'order', `Order ${code} — ${v.qty} ekor ${prod.name} — ${rp(est)}${big ? ' (menunggu approval)' : ' — stok berkurang ' + v.qty + ' ekor'}`, o.rows[0].id);
    return { code, pending: big };
  },
  async ORDER_STATUS(c, p, user) {
    need(user, ['OWNER', 'ADMIN', 'MANAGER']);
    const v = z.object({ id: z.string(), status: z.enum(['CONFIRMED', 'PAID', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']), weight: z.number().positive().optional() }).parse(p);
    const o = (await c.query(`SELECT * FROM "order" WHERE code=$1 OR id::text=$1`, [v.id])).rows[0]; if (!o) throw new ActionError('Order tidak ditemukan.');
    /* Jalur alternatif ditutup: tanpa ini, order yang sedang menunggu approval
       bisa langsung di-CONFIRMED lewat sini oleh siapa pun yang boleh mengubah
       status order — termasuk Manager — sehingga persetujuan keuangannya
       terlewat sama sekali. Membatalkan order tetap boleh. */
    if (o.status === 'PENDING_APPROVAL' && v.status !== 'CANCELLED' && !['OWNER', 'ADMIN'].includes(user.role)) {
      deny('Order ini menunggu persetujuan Owner atau Admin. Statusnya belum boleh diubah.');
    }
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
      // Target milik batch ini, diketik pemilik. Tidak ada angka bawaan.
      targetDays: z.number({ invalid_type_error: 'Isi target panen (hari).' }).int().positive().max(200),
      targetBobotMin: z.number({ invalid_type_error: 'Isi target bobot panen (kg).' }).positive().max(20),
      targetBobotMax: z.number().positive().max(20).optional(),
      // Bobot DOD saat datang. Boleh kosong kalau tidak ditimbang.
      bobotDodKg: z.number().nonnegative().max(5).optional(),
      targetMortPct: z.number().nonnegative().max(100).optional(),
      jatah: skemaJatah.optional(),
      /* Asal DOD — nama penetasan/penjual. Boleh dikosongkan; yang dikosongkan
         disimpan NULL, bukan string kosong, supaya tidak muncul sebagai
         "penjual tanpa nama" di rekap v_asal_dod. */
      asalDod: z.string().trim().max(120).optional(),
      // Bentuk sederhana untuk pola batch bergilir: satu batch, satu kandang.
      barn: z.string().min(1).optional(),
      qty: z.number().int().positive().optional(),
      // Bentuk lama: satu siklus dibagi ke beberapa kandang. Tetap didukung.
      barns: z.array(z.object({ code: z.string().min(1), qty: z.number().int().positive() })).optional()
    }).parse(p);
    if (v.barn && v.qty) v.barns = [{ code: v.barn, qty: v.qty }];
    if (!v.barns || !v.barns.length) throw new ActionError('Isi jumlah DOD dan pilih kandangnya.');

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
    // Kurva target batch ini dibangun dari angka yang pemilik ketik sendiri:
    // titik awal bobot DOD (kalau ditimbang), titik akhir target panen.
    const bobotDod = v.bobotDodKg && v.bobotDodKg > 0 ? v.bobotDodKg : null;
    const bobotMax = v.targetBobotMax && v.targetBobotMax > 0 ? v.targetBobotMax : v.targetBobotMin;
    if (bobotMax < v.targetBobotMin) throw new ActionError('Target bobot maksimum tidak boleh lebih kecil dari minimum.');
    if (bobotDod != null && bobotDod >= v.targetBobotMin) throw new ActionError('Bobot DOD harus lebih kecil dari target bobot panen.');
    const curve = bobotDod != null ? [[1, bobotDod], [v.targetDays, v.targetBobotMin]] : [[v.targetDays, v.targetBobotMin]];
    // Target mortalitas memang tingkat farm (jarang berubah), jadi kalau tidak
    // diketik di form, dipakai angka farm dari Pengaturan.
    const mortFarm = +((await c.query(`SELECT value FROM master_config WHERE key='target_mortalitas_pct'`)).rows[0]?.value || 0);
    const targetMort = v.targetMortPct ?? (mortFarm || null);
    if (targetMort == null) throw new ActionError('Target mortalitas belum diatur. Isi di Pengaturan \u2192 Master Data.');
    const qty = v.barns.reduce((a, x) => a + x.qty, 0);

    const asalDod = v.asalDod && v.asalDod.length ? v.asalDod : null;

    const cy = (await c.query(`INSERT INTO cycle(farm_id,code,breed,dod_date,dod_qty,dod_price,target_curve,target_days,status,stage,locked,created_by,dod_weight_kg,target_weight_min,target_weight_max,target_mort_pct,dod_source)
      VALUES ($1,$2,COALESCE($3,'Bebek Peking'),$4,$5,$6,$7,$8,'ACTIVE','DOD_IN',true,$9,$10,$11,$12,$13,$14) RETURNING id`,
      [farm.id, code, v.breed || null, v.dodDate, qty, v.dodPrice, JSON.stringify(curve), v.targetDays, user.id, bobotDod, v.targetBobotMin, bobotMax, targetMort, asalDod])).rows[0].id;
    if (v.jatah) await c.query('UPDATE cycle SET feed_plan=$1 WHERE id=$2', [JSON.stringify(jadiPlan(v.jatah)), cy]);

    for (const b of v.barns) {
      const bar = (await c.query('SELECT id,name,capacity FROM barn WHERE code=$1 AND is_active', [b.code.toUpperCase()])).rows[0];
      if (!bar) throw new ActionError(`Kandang ${b.code} tidak ditemukan atau nonaktif.`);
      if (b.qty > bar.capacity) throw new ActionError(`${bar.name} hanya muat ${bar.capacity} ekor, diisi ${b.qty}.`);
      await c.query(`INSERT INTO population_tx(cycle_id,barn_id,type,qty,ref_type,ref_id,occurred_at,created_by)
        VALUES ($1,$2,'DOD_IN',$3,'cycle',$1,$4,$5)`, [cy, bar.id, b.qty, v.dodDate, user.id]);
    }
    await audit(c, user.id, 'CREATE', 'cycle', `Siklus ${code} dimulai \u2014 ${qty} ekor DOD @ ${v.dodPrice}, ${v.barns.length} kandang${asalDod ? `, asal DOD ${asalDod}` : ''}`, cy, null, { code, qty, dodPrice: v.dodPrice, asalDod });
    return { id: cy, code };
  },

  /* Pindah batch antar kandang — brooding (hari 1-10) ke pembesaran (hari 11+).
   * Populasi tidak berubah, hanya tempatnya. Batch-nya tetap sama, jadi umur,
   * pakan, dan riwayatnya ikut pindah tanpa terputus. */
  async BATCH_MOVE(c, p, user) {
    need(user, ['OWNER', 'MANAGER']);
    const v = z.object({
      from: z.string().min(1),
      to: z.string().min(1),
      qty: z.number().int().positive().optional(),
      note: z.string().trim().optional()
    }).parse(p);
    if (v.from.toUpperCase() === v.to.toUpperCase()) throw new ActionError('Kandang asal dan tujuan sama.');

    const from = await barnId(c, v.from, user);
    const to = await barnId(c, v.to, user);
    const cy = await cycleOfBarn(c, from, v.from);

    const ada = (await c.query('SELECT population FROM v_population WHERE cycle_id=$1 AND barn_id=$2', [cy.id, from])).rows[0]?.population || 0;
    const qty = v.qty || Number(ada);
    if (qty > ada) throw new ActionError(`Hanya ada ${ada} ekor di kandang asal, tidak bisa memindahkan ${qty}.`);

    const bt = (await c.query('SELECT name, capacity FROM barn WHERE id=$1', [to])).rows[0];
    const isiTujuan = (await c.query(`SELECT COALESCE(SUM(v.population),0) n FROM v_population v
      JOIN cycle cy ON cy.id=v.cycle_id AND cy.status='ACTIVE' WHERE v.barn_id=$1`, [to])).rows[0].n;
    const lain = (await c.query(`SELECT cy.code FROM v_population v
      JOIN cycle cy ON cy.id=v.cycle_id AND cy.status='ACTIVE'
      WHERE v.barn_id=$1 AND v.population > 0 AND cy.id <> $2 LIMIT 1`, [to, cy.id])).rows[0];
    if (lain) throw new ActionError(`${bt.name} sedang dipakai batch ${lain.code}. Satu kandang hanya untuk satu batch — umur yang tercampur bikin penyakit menular dari yang tua ke yang muda.`);
    if (Number(isiTujuan) + qty > bt.capacity) throw new ActionError(`${bt.name} hanya muat ${bt.capacity} ekor, sudah ada ${isiTujuan}, mau ditambah ${qty}.`);

    await c.query(`INSERT INTO population_tx(cycle_id,barn_id,type,qty,ref_type,ref_id,occurred_at,created_by)
      VALUES ($1,$2,'TRANSFER_OUT',$3,'transfer',$1,now(),$4)`, [cy.id, from, -qty, user.id]);
    await c.query(`INSERT INTO population_tx(cycle_id,barn_id,type,qty,ref_type,ref_id,occurred_at,created_by)
      VALUES ($1,$2,'TRANSFER_IN',$3,'transfer',$1,now(),$4)`, [cy.id, to, qty, user.id]);

    const bf = (await c.query('SELECT name FROM barn WHERE id=$1', [from])).rows[0];
    const sisa = (await c.query('SELECT COALESCE(population,0) n FROM v_population WHERE cycle_id=$1 AND barn_id=$2', [cy.id, from])).rows[0]?.n || 0;
    await audit(c, user.id, 'UPDATE', 'cycle',
      `Batch ${cy.code} dipindah ${qty} ekor dari ${bf.name} ke ${bt.name}${Number(sisa) > 0 ? ` — sisa ${sisa} ekor di ${bf.name}` : ''}${v.note ? ` — ${v.note}` : ''}`, cy.id);
    return { code: cy.code, qty, dari: bf.name, ke: bt.name, sisa: Number(sisa) };
  },

  /* ---------------- PANEN & TUTUP SIKLUS ---------------- */
  async HARVEST(c, p, user, file) {
    need(user, ['OWNER', 'MANAGER']);
    const v = z.object({
      barn: z.string(),
      qty: z.number().int().positive().max(100000).optional(),
      weightKg: z.number().positive().max(200000).optional(),
      // Rincian tiap timbangan (per 10/15 ekor). Kalau diisi, total dihitung dari sini.
      timbangan: z.array(z.object({ ekor: z.number().int().positive().max(1000), kg: z.number().positive().max(5000) })).min(1).max(300).optional(),
      pricePerKg: z.number().positive(),
      customer: z.string().optional(),
      customerName: z.string().trim().optional(),
      customerPhone: z.string().trim().optional(),
      pay: z.enum(['UNPAID', 'DP', 'PAID']).optional(),
      note: z.string().trim().optional()
    }).parse(p);
    if (v.timbangan) {
      v.qty = v.timbangan.reduce((a, t) => a + t.ekor, 0);
      v.weightKg = Math.round(v.timbangan.reduce((a, t) => a + t.kg, 0) * 1000) / 1000;
    }
    if (!v.qty || !v.weightKg) throw new ActionError('Isi timbangan panen: jumlah ekor dan beratnya.');
    await requirePhoto(c, file);

    const b = await barnId(c, v.barn, user);
    const cy = await cycleOfBarn(c, b, v.barn);
    const pop = (await c.query('SELECT population FROM v_population WHERE cycle_id=$1 AND barn_id=$2', [cy.id, b])).rows[0]?.population || 0;
    if (v.qty > pop) throw new ActionError(`Jumlah panen (${v.qty} ekor) melebihi populasi kandang ${v.barn} (${pop} ekor).`);

    // Rata-rata di bawah 0,5 kg/ekor hampir pasti salah ketik (kg vs gram)
    const avg = v.weightKg / v.qty;
    if (avg < 0.5 || avg > 8) throw new ActionError(`Rata-rata ${avg.toFixed(2)} kg/ekor tidak wajar. Periksa jumlah ekor dan total kilogram.`);

    const farm = (await c.query('SELECT id FROM farm LIMIT 1')).rows[0];
    // Panen butuh satu produk LIVE sebagai acuan; kalau belum ada, dibuat sekali (belum tayang di web)
    let prod = (await c.query(`SELECT id FROM product WHERE type='LIVE' ORDER BY is_published DESC, name LIMIT 1`)).rows[0];
    if (!prod) {
      prod = (await c.query(`INSERT INTO product(farm_id,name,type,price_per_kg,min_order,avg_weight_kg,stock_source,is_published)
        VALUES ($1,'Bebek Peking Hidup','LIVE',$2,1,$3,'POPULATION',false) RETURNING id`,
        [farm.id, v.pricePerKg, avg.toFixed(3)])).rows[0];
      await audit(c, user.id, 'CREATE', 'product', `Produk "Bebek Peking Hidup" dibuat otomatis untuk mencatat panen (belum tayang di website)`, prod.id);
    }

    let cust = v.customer;
    if (!cust || cust === 'NEW') {
      cust = (await c.query(`INSERT INTO customer(name,phone,type) VALUES ($1,$2,'Pengepul') RETURNING id`,
        [v.customerName || 'Pengepul', v.customerPhone || '-'])).rows[0].id;
    }

    const total = v.weightKg * v.pricePerKg;
    const paid = v.pay === 'PAID';
    const code = 'PNN-' + String((await c.query("SELECT nextval('order_code_seq') n")).rows[0].n).padStart(4, '0');

    // stock_applied=true: ledger ditulis di bawah sebagai HARVEST, bukan lewat fn_order_apply_stock
    const o = (await c.query(`INSERT INTO "order"(code,customer_id,source,status,payment_status,note,total_est,total_final,stock_applied,created_by,decided_by,decided_at)
      VALUES ($1,$2,'PANEN',$3,$4,$5,$6,$6,true,$7,$7,now()) RETURNING id`,
      [code, cust, paid ? 'PAID' : 'CONFIRMED', paid ? 'PAID' : v.pay === 'DP' ? 'DP' : 'UNPAID', v.note || null, total, user.id])).rows[0];

    const it = (await c.query(`INSERT INTO order_item(order_id,product_id,cycle_id,barn_id,qty,weight_kg,price_per_kg,timbangan)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, [o.id, prod.id, cy.id, b, v.qty, v.weightKg, v.pricePerKg, v.timbangan ? JSON.stringify(v.timbangan) : null])).rows[0];

    await c.query(`INSERT INTO population_tx(cycle_id,barn_id,type,qty,ref_type,ref_id,occurred_at,created_by)
      VALUES ($1,$2,'HARVEST',$3,'order_item',$4,now(),$5)`, [cy.id, b, -v.qty, it.id, user.id]);

    if (paid) await c.query(`INSERT INTO sale(order_id,amount,method,paid_at,created_by) VALUES ($1,$2,'panen',now(),$3)`, [o.id, total, user.id]);
    if (cy.stage !== 'HARVEST') await c.query(`UPDATE cycle SET stage='HARVEST', updated_by=$1, updated_at=now() WHERE id=$2`, [user.id, cy.id]);

    const photo = await saveAttachment(c, file, 'order', o.id, 'panen', user);
    const left = (await c.query('SELECT COALESCE(population,0) n FROM v_population_cycle WHERE cycle_id=$1', [cy.id])).rows[0]?.n || 0;
    await audit(c, user.id, 'CREATE', 'order',
      `Panen ${code} — ${v.qty} ekor, ${v.weightKg} kg (rata-rata ${avg.toFixed(2)} kg/ekor) @ ${rp(v.pricePerKg)}/kg = ${rp(total)} — Kandang ${v.barn}, sisa ${left} ekor`, o.id);
    await notify(c, ['OWNER'], 'harvest', `Panen ${v.qty} ekor dari Kandang ${v.barn}`, `${v.weightKg} kg — ${rp(total)}, sisa ${left} ekor`, '/penjualan');
    return { code, total, avg: +avg.toFixed(3), remaining: left, photo, batch: cy.code };
  },

  /* Ubah target batch yang sedang berjalan. Jumlah/harga/tanggal DOD tetap terkunci. */
  async CYCLE_TARGET(c, p, user) {
    need(user, ['OWNER', 'MANAGER']);
    const v = z.object({ code: z.string().min(1), targetDays: z.number().int().positive().max(200), targetBobotMin: z.number().positive().max(20), bobotDodKg: z.number().nonnegative().max(5).optional(), jatah: skemaJatah.optional() }).parse(p);
    const cy = (await c.query(`SELECT * FROM cycle WHERE code=$1 AND status='ACTIVE'`, [v.code])).rows[0];
    if (!cy) throw new ActionError('Batch tidak ditemukan atau sudah ditutup.');
    const dodLama = cy.dod_weight_kg != null && +cy.dod_weight_kg > 0 ? +cy.dod_weight_kg : null;
    const dod = v.bobotDodKg === undefined ? dodLama : (v.bobotDodKg > 0 ? v.bobotDodKg : null);
    if (dod != null && dod >= v.targetBobotMin) throw new ActionError('Bobot DOD harus lebih kecil dari target bobot panen.');
    const curve = dod != null ? [[1, dod], [v.targetDays, v.targetBobotMin]] : [[v.targetDays, v.targetBobotMin]];
    await c.query(`UPDATE cycle SET target_days=$1, target_weight_min=$2, target_weight_max=$2, dod_weight_kg=$3, target_curve=$4, updated_by=$5, updated_at=now() WHERE id=$6`,
      [v.targetDays, v.targetBobotMin, dod, JSON.stringify(curve), user.id, cy.id]);
    await audit(c, user.id, 'UPDATE', 'cycle', `Target batch ${cy.code} diubah — panen ${cy.target_days} → ${v.targetDays} hari; bobot ${+cy.target_weight_min} → ${v.targetBobotMin} kg; bobot DOD ${dodLama ?? 'kosong'} → ${dod ?? 'kosong'} kg`, cy.id);
    if (v.jatah) {
      await c.query('UPDATE cycle SET feed_plan=$1, updated_by=$2, updated_at=now() WHERE id=$3', [JSON.stringify(jadiPlan(v.jatah)), user.id, cy.id]);
      await audit(c, user.id, 'UPDATE', 'cycle', `Jatah pakan batch ${cy.code} diubah — ${v.jatah.join(' / ')} g/ekor/hari`, cy.id);
    }
    return { code: cy.code };
  },
  async CYCLE_CLOSE(c, p, user) {
    need(user, ['OWNER']);
    const v = z.object({ code: z.string().trim().optional(), barn: z.string().trim().optional(), note: z.string().trim().optional(), carryRemaining: z.boolean().optional() }).parse(p);
    // Dengan banyak batch jalan bersamaan, harus jelas batch MANA yang ditutup
    let cy;
    if (v.code) {
      cy = (await c.query(`SELECT * FROM cycle WHERE code=$1 AND status='ACTIVE'`, [v.code])).rows[0];
      if (!cy) throw new ActionError(`Batch ${v.code} tidak ditemukan atau sudah ditutup.`);
    } else if (v.barn) {
      const bb = await barnId(c, v.barn, user); cy = await cycleOfBarn(c, bb, v.barn);
    } else {
      const all = (await c.query(`SELECT code FROM cycle WHERE status='ACTIVE' ORDER BY dod_date`)).rows;
      if (all.length > 1) throw new ActionError(`Ada ${all.length} batch berjalan (${all.map(x => x.code).join(', ')}). Sebutkan batch mana yang ditutup.`);
      cy = await activeCycle(c);
    }

    const left = (await c.query(`SELECT barn_id, population FROM v_population WHERE cycle_id=$1 AND population > 0`, [cy.id])).rows;
    const total = left.reduce((a, r) => a + Number(r.population), 0);
    if (total > 0 && !v.carryRemaining) {
      throw new ActionError(`Masih ada ${total} ekor tercatat di kandang. Panen atau jual dulu, atau tandai sisanya dibawa keluar dari siklus ini.`);
    }
    for (const r of left) {
      await c.query(`INSERT INTO population_tx(cycle_id,barn_id,type,qty,ref_type,ref_id,occurred_at,created_by)
        VALUES ($1,$2,'TRANSFER_OUT',$3,'cycle',$1,now(),$4)`, [cy.id, r.barn_id, -Number(r.population), user.id]);
    }

    const s = (await c.query('SELECT * FROM v_cycle_summary WHERE cycle_id=$1', [cy.id])).rows[0];
    await c.query(`UPDATE cycle SET status='CLOSED', stage='HARVEST', closed_at=now(), closed_by=$1, close_note=$2, updated_by=$1, updated_at=now() WHERE id=$3`,
      [user.id, v.note || null, cy.id]);

    /* POTRET HPP — dibuat di transaksi yang sama dengan penutupan, jadi tidak
       mungkin ada siklus CLOSED tanpa potret, atau potret setengah jadi.
       Dibaca sekali di sini selagi belum ada potretnya (v_cycle_summary masih
       menghitung berjalan), lalu dibekukan. Setelah baris ini, angka batch
       tidak berubah lagi oleh nota apa pun — termasuk nota bertanggal mundur. */
    const live = (await c.query('SELECT * FROM v_cycle_summary WHERE cycle_id=$1', [cy.id])).rows[0];
    await c.query(`INSERT INTO cycle_hpp_snapshot
      (cycle_id,dod_cost,operating_cost,total_cost,revenue,profit,harvest_kg,harvest_qty,
       hpp_per_kg,hpp_per_ekor,feed_kg,closed_at,formula_version,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,
        CASE WHEN $7::numeric > 0 THEN round($4::numeric/$7::numeric,2) END,
        CASE WHEN $8::integer > 0 THEN round($4::numeric/$8::integer,2) END,
        $9,now(),$10,$11)`,
      [cy.id, live.dod_cost, live.operating_cost, live.cost_total, live.revenue, live.profit,
       live.harvest_weight_kg, live.harvest_qty, live.feed_kg, FORMULA_HPP, user.id]);

    const out = (await c.query('SELECT * FROM v_cycle_summary WHERE cycle_id=$1', [cy.id])).rows[0];
    await audit(c, user.id, 'UPDATE', 'cycle',
      `Siklus ${cy.code} ditutup — ${out.days} hari, panen ${out.harvested} ekor / ${out.harvest_weight_kg} kg, mati ${out.deaths} ekor (${out.mortality_pct || 0}%), FCR ${out.fcr_final || '-'}, pendapatan ${rp(out.revenue)}, modal ${rp(out.cost_total)}, laba ${rp(out.profit)}` +
      (total > 0 ? ` — ${total} ekor sisa dibawa keluar` : ''),
      cy.id, { status: 'ACTIVE' }, { status: 'CLOSED' });
    // Angka keuangan hanya ke peran keuangan. Manager tetap diberi tahu siklusnya
    // ditutup beserta angka operasional yang memang bagian pekerjaannya.
    await notify(c, ['OWNER', 'ADMIN'], 'cycle_closed', `Siklus ${cy.code} ditutup`,
      `Laba ${rp(out.profit)} — FCR ${out.fcr_final || '-'}, mortalitas ${out.mortality_pct || 0}%`, '/laporan');
    await notify(c, ['MANAGER'], 'cycle_closed', `Siklus ${cy.code} ditutup`,
      `${out.days} hari — panen ${out.harvested} ekor, FCR ${out.fcr_final || '-'}, mortalitas ${out.mortality_pct || 0}%`, '/laporan');
    return { code: cy.code, summary: out, carried: total };
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
    // Hanya aturan tingkat farm. Target bobot, hari panen, dan bobot DOD
    // diisi per batch di form Batch Baru, bukan di sini.
    const map = {
      targetMortalitasPct: 'target_mortalitas_pct', minStokPakanHari: 'min_stok_pakan_hari',
      batasMortalitasHarian: 'batas_mortalitas_harian', batasPakanPct: 'batas_deviasi_pakan_pct',
      batasSelisihKg: 'batas_selisih_opname_kg', ambangApprovalRp: 'ambang_approval_rp', jadwalTimbangHari: 'jadwal_timbang_hari'
    };
    const changes = [];
    for (const [k, key] of Object.entries(map)) if (p[k] !== undefined) {
      const val = z.number().nonnegative().parse(+p[k]);
      const row = (await c.query('SELECT value, updated_by FROM master_config WHERE key=$1', [key])).rows[0];
      const old = row?.value;
      // Angka bawaan harus tetap ditulis walau nilainya sama, supaya tercatat
      // sebagai milik pemilik farm dan label BAWAAN hilang.
      if (Number(old) !== val || !row?.updated_by) {
        await c.query(`UPDATE master_config SET value=$1::jsonb, updated_by=$2, updated_at=now() WHERE key=$3`, [JSON.stringify(val), user.id, key]);
        changes.push(`${key}: ${old} → ${val}`);
      }
    }

    /* Pakem jatah pakan farm */
    if (p.pakemPakan !== undefined) {
      const g = skemaJatah.parse(Array.isArray(p.pakemPakan) ? p.pakemPakan.map(Number) : []);
      await c.query(`UPDATE master_config SET value=$1::jsonb, updated_by=$2, updated_at=now() WHERE key='pakem_pakan'`, [JSON.stringify(jadiPlan(g)), user.id]);
      changes.push(`pakem_pakan: ${g.join(' / ')} g/ekor/hari`);
    }

    /* Jam kerja kandang */
    if (p.jamMulai !== undefined || p.jamSelesai !== undefined) {
      const row = (await c.query(`SELECT value, updated_by FROM master_config WHERE key='jam_kerja'`)).rows[0];
      const old = row.value;
      const jam = z.number().int().min(0).max(23);
      const nv = { mulai: jam.parse(+(p.jamMulai ?? old.mulai)), selesai: jam.parse(+(p.jamSelesai ?? old.selesai)) };
      if (nv.selesai <= nv.mulai) throw new ActionError('Jam selesai harus lebih besar dari jam mulai.');
      if (nv.mulai !== +old.mulai || nv.selesai !== +old.selesai || !row.updated_by) {
        await c.query(`UPDATE master_config SET value=$1::jsonb, updated_by=$2, updated_at=now() WHERE key='jam_kerja'`, [JSON.stringify(nv), user.id]);
        changes.push(`jam_kerja: ${old.mulai}-${old.selesai} → ${nv.mulai}-${nv.selesai}`);
      }
    }
    // Kontak website: teks, bukan angka
    const teks = { kontakWhatsapp: 'kontak_whatsapp', kontakEmail: 'kontak_email', kontakAlamat: 'kontak_alamat', kontakJam: 'kontak_jam' };
    for (const [k, key] of Object.entries(teks)) if (p[k] !== undefined) {
      const val = z.string().trim().max(120).parse(String(p[k]));
      const old = (await c.query('SELECT value FROM master_config WHERE key=$1', [key])).rows[0]?.value;
      if (String(old ?? '') !== val) {
        await c.query(`UPDATE master_config SET value=$1::jsonb, updated_by=$2, updated_at=now() WHERE key=$3`, [JSON.stringify(val), user.id, key]);
        changes.push(`${key}: "${old ?? ''}" → "${val}"`);
      }
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
