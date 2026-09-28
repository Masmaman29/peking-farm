/**
 * Menyusun snapshot data untuk frontend dalam bentuk yang sama dengan prototype (DB object).
 * Semua angka turunan (populasi, stok, FCR, laba) dihitung dari ledger — di sini hanya
 * mengirim transaksi mentah; view SQL (v_population dsb.) dipakai untuk endpoint publik & laporan.
 * Data keuangan disaring sesuai role di sini (bukan hanya di UI).
 */
import { rows, one, config } from './db.js';

const finRoles = new Set(['OWNER', 'ADMIN']);

export async function buildBootstrap(user) {
  const fin = finRoles.has(user.role);
  const ak = user.role === 'ANAK_KANDANG';
  const cfg = await config();
  const farm = await one('SELECT * FROM farm ORDER BY created_at LIMIT 1');
  const barns = await rows('SELECT id,code,name,capacity,note FROM barn WHERE farm_id=$1 ORDER BY code', [farm.id]);
  const bcode = Object.fromEntries(barns.map(b => [b.id, b.code]));
  const cycle = await one(`SELECT * FROM cycle WHERE farm_id=$1 AND status='ACTIVE' ORDER BY dod_date DESC LIMIT 1`, [farm.id]);
  const prevCycles = await rows(`SELECT * FROM cycle WHERE farm_id=$1 AND status<>'ACTIVE' ORDER BY dod_date DESC`, [farm.id]);
  const users = await rows(`SELECT id,name,role,barn_id,is_active,phone,email,last_login_at FROM app_user WHERE farm_id=$1 ORDER BY role,name`, [farm.id]);

  const popTx = cycle ? await rows(`SELECT id,occurred_at,type,barn_id,qty,created_by,ref_type,ref_id FROM population_tx WHERE cycle_id=$1 ORDER BY occurred_at`, [cycle.id]) : [];
  const mortality = cycle ? await rows(`SELECT m.*, (SELECT file_url FROM attachment a WHERE a.entity_type='mortality' AND a.entity_id=m.id ORDER BY version DESC LIMIT 1) photo
     FROM mortality m WHERE cycle_id=$1 AND deleted_at IS NULL AND status<>'SUPERSEDED' ORDER BY occurred_at`, [cycle.id]) : [];
  const feedAll = cycle ? await rows(`SELECT f.*, (SELECT file_url FROM attachment a WHERE a.entity_type='feed_transaction' AND a.entity_id=f.id ORDER BY version DESC LIMIT 1) photo
     FROM feed_transaction f WHERE (cycle_id=$1 OR cycle_id IS NULL) AND deleted_at IS NULL ORDER BY occurred_at`, [cycle.id]) : [];
  const opname = await rows('SELECT * FROM feed_stock_opname ORDER BY occurred_at');
  const weights = cycle ? await rows(`SELECT w.*, (SELECT file_url FROM attachment a WHERE a.entity_type='weight_record' AND a.entity_id=w.id ORDER BY version DESC LIMIT 1) photo
     FROM weight_record w WHERE cycle_id=$1 AND deleted_at IS NULL AND status<>'SUPERSEDED' ORDER BY occurred_at`, [cycle.id]) : [];
  const health = cycle ? await rows('SELECT * FROM health_record WHERE cycle_id=$1 AND deleted_at IS NULL ORDER BY occurred_at', [cycle.id]) : [];
  const barnCond = cycle ? await rows('SELECT * FROM barn_condition WHERE cycle_id=$1 ORDER BY occurred_at DESC LIMIT 200', [cycle.id]) : [];
  const expenses = fin && cycle ? await rows('SELECT * FROM expense WHERE cycle_id=$1 AND deleted_at IS NULL ORDER BY occurred_at', [cycle.id]) : [];
  const inventory = await rows('SELECT i.id,i.name,i.unit,i.category cat,i.min_qty min,i.avg_weight_kg "avgW", s.qty FROM inventory i JOIN v_inventory_stock s ON s.inventory_id=i.id WHERE i.is_active ORDER BY i.category,i.name');
  const invTx = await rows('SELECT * FROM inventory_tx ORDER BY occurred_at DESC LIMIT 300');
  const products = await rows('SELECT * FROM product WHERE farm_id=$1 ORDER BY type', [farm.id]);
  const customers = await rows('SELECT * FROM customer ORDER BY created_at');
  const orders = await rows(`SELECT o.*, oi.product_id, oi.qty, oi.weight_kg, oi.price_per_kg, oi.barn_id
     FROM "order" o JOIN order_item oi ON oi.order_id=o.id ORDER BY o.created_at DESC`);
  const corrections = await rows(`SELECT c.*, a.status, a.requested_by, a.requested_at, a.decided_by, a.decided_at, a.reject_reason,
     (SELECT file_url FROM attachment at WHERE at.entity_type='correction_request' AND at.entity_id=c.id LIMIT 1) photo
     FROM correction_request c JOIN approval a ON a.id=c.approval_id ORDER BY c.created_at DESC`);
  const audit = ak
    ? await rows('SELECT id,actor_id,action,entity_type,entity_id,detail,occurred_at FROM audit_log WHERE actor_id=$1 ORDER BY id DESC LIMIT 100', [user.id])
    : await rows('SELECT id,actor_id,action,entity_type,entity_id,detail,occurred_at,hash FROM audit_log ORDER BY id DESC LIMIT 500');
  const anomalies = await rows('SELECT dedupe_key,status,verified_by,verify_note FROM anomaly');

  // --- pemetaan ke bentuk prototype ---
  const feedRecords = [];
  const bySuper = {};
  feedAll.filter(f => f.type === 'USAGE').forEach(f => { if (f.supersedes_id) bySuper[f.supersedes_id] = f; });
  feedAll.filter(f => f.type === 'USAGE' && f.status !== 'SUPERSEDED').forEach(f => {
    // telusuri rantai versi ke belakang
    const chain = []; let cur = f;
    while (cur.supersedes_id) { const p = feedAll.find(x => x.id === cur.supersedes_id); if (!p) break; chain.unshift(cur); cur = p; }
    const root = cur;
    feedRecords.push({ id: f.id, rootId: root.id, date: f.occurred_at, barn: bcode[f.barn_id], kg: -Number(root.qty_kg), user: root.created_by, photo: f.photo || root.photo, status: f.status, locked: f.locked,
      versions: chain.map(v => ({ id: v.id, kg: -Number(v.qty_kg), reason: v.reason || 'Koreksi', approvedBy: v.updated_by || v.created_by, date: v.created_at })) });
  });
  const feedPurchases = feedAll.filter(f => f.type === 'PURCHASE').map(p => ({ id: p.id, date: p.occurred_at, qty: Number(p.qty_kg), price: fin ? Number(p.price_per_kg) : null, vendor: p.vendor, ref: p.ref_no, user: p.created_by, status: p.status, locked: p.locked, note: p.reason }));
  const feedAdjust = feedAll.filter(f => f.type === 'ADJUSTMENT' && f.status === 'APPROVED').map(a => ({ id: a.id, date: a.occurred_at, qty: Number(a.qty_kg), reason: a.reason, user: a.created_by }));

  const anomalyState = {};
  anomalies.forEach(a => { anomalyState[a.dedupe_key] = { status: a.status, note: a.verify_note, by: a.verified_by }; });

  return {
    now: new Date().toISOString(),
    master: {
      hargaDOD: +cfg.harga_dod, hargaPakanKg: +cfg.harga_pakan_kg,
      hargaJualHidupKg: fin ? +cfg.harga_jual_hidup_kg : null, hargaJualPotongKg: fin ? +cfg.harga_jual_potong_kg : null, hargaJualKarkasKg: fin ? +cfg.harga_jual_karkas_kg : null,
      targetPanenHari: +cfg.target_panen_hari, targetBobotMin: +cfg.target_bobot.min, targetBobotMax: +cfg.target_bobot.max, targetMortalitasPct: +cfg.target_mortalitas_pct,
      minStokPakanHari: +cfg.min_stok_pakan_hari, fotoWajib: !!cfg.foto_wajib, jamKerja: [cfg.jam_kerja.mulai, cfg.jam_kerja.selesai],
      batasMortalitasHarian: +cfg.batas_mortalitas_harian, batasPakanPct: +cfg.batas_deviasi_pakan_pct, batasSelisihKg: +cfg.batas_selisih_opname_kg,
      ambangApprovalRp: +cfg.ambang_approval_rp, targetCurve: cfg.kurva_target_bobot,
    },
    farm: { id: farm.id, name: farm.name, location: farm.location },
    users: users.map(u => ({ id: u.id, name: u.name, role: u.role, barn: bcode[u.barn_id] || null, active: u.is_active, phone: u.phone, email: u.email, lastLogin: u.last_login_at })),
    barns: barns.map(b => ({ id: b.code, uuid: b.id, name: b.name, cap: b.capacity, note: b.note })),
    cycle: cycle ? { id: cycle.id, code: cycle.code, breed: cycle.breed, status: 'AKTIF', dodDate: cycle.dod_date, dodQty: cycle.dod_qty, dodPrice: +cycle.dod_price, dodWeight: +cycle.dod_weight_kg, targetDays: cycle.target_days, targetWeight: [+cycle.target_weight_min, +cycle.target_weight_max], targetMort: +cycle.target_mort_pct, stage: cycle.stage, createdBy: cycle.created_by, createdAt: cycle.created_at } : null,
    prevCycles: prevCycles.map(c => ({ id: c.id, code: c.code, breed: c.breed, status: 'SELESAI', dodDate: c.dod_date, dodQty: c.dod_qty })),
    popTx: popTx.map(t => ({ id: t.id, date: t.occurred_at, type: t.type === 'DOD_IN' ? 'DOD_MASUK' : t.type === 'DEATH' ? 'KEMATIAN' : t.type === 'SALE' ? 'PENJUALAN' : t.type === 'TRANSFER_IN' ? 'TRANSFER_MASUK' : t.type === 'TRANSFER_OUT' ? 'TRANSFER_KELUAR' : t.type, barn: bcode[t.barn_id], qty: t.qty, user: t.created_by, ref: t.ref_id, locked: true })),
    mortality: mortality.map(m => ({ id: m.id, date: m.occurred_at, barn: bcode[m.barn_id], qty: m.qty, cause: m.cause, note: m.note, photo: m.photo, user: m.created_by, status: m.status, locked: m.locked })),
    feedRecords, feedPurchases, feedAdjust,
    feedOpname: opname.map(o => ({ id: o.id, date: o.occurred_at, physical: +o.physical_kg, theoretical: +o.theoretical_kg, user: o.created_by, note: o.note })),
    weights: weights.map(w => ({ id: w.id, date: w.occurred_at, barn: bcode[w.barn_id], n: w.sample_n, total: +w.total_kg, avg: +w.avg_kg, user: w.created_by, photo: w.photo, locked: w.locked })),
    health: health.map(h => ({ id: h.id, date: h.occurred_at, barn: h.barn_id ? bcode[h.barn_id] : 'ALL', type: { VACCINE: 'Vaksinasi', VITAMIN: 'Vitamin', TREATMENT: 'Pengobatan', OBSERVATION: 'Observasi' }[h.type], item: h.item, dose: h.dose || '-', user: h.created_by, note: h.note || '' })),
    barnCond: barnCond.map(c => ({ id: c.id, date: c.occurred_at, barn: bcode[c.barn_id], temp: +c.temp_c, hum: +c.humidity_pct, litter: c.litter, water: c.water, behavior: c.behavior, user: c.created_by, note: c.note || '' })),
    expenses: expenses.map(e => ({ id: e.id, date: e.occurred_at, cat: { DOD: 'DOD', PAKAN: 'Pakan', VITAMIN: 'Vitamin', OBAT: 'Obat', LISTRIK: 'Listrik', GAS: 'Gas', SEKAM: 'Sekam', TENAGA_KERJA: 'Tenaga kerja', TRANSPORT: 'Transport', PERALATAN: 'Peralatan', MAINTENANCE: 'Maintenance', LAIN: 'Biaya lain' }[e.category], amount: +e.amount, vendor: e.vendor, ref: e.ref_no, user: e.created_by, status: e.status, locked: e.locked })),
    inventory: inventory.map(i => ({ ...i, qty: +i.qty, min: +i.min, avgW: i.avgW ? +i.avgW : undefined })),
    invTx: invTx.map(t => ({ id: t.id, date: t.occurred_at, item: t.inventory_id, type: t.type, qty: Math.abs(+t.qty), ref: t.ref_type === 'order_item' ? 'Order' : (t.note || t.ref_type), user: t.created_by })),
    products: products.map(p => ({ id: p.id, name: p.name, desc: p.description, unit: 'ekor', priceKey: p.type === 'LIVE' ? 'hargaJualHidupKg' : p.type === 'CUT' ? 'hargaJualPotongKg' : 'hargaJualKarkasKg', minOrder: p.min_order, stockFrom: p.stock_source === 'POPULATION' ? 'population' : p.inventory_id, avgW: +p.avg_weight_kg })),
    customers: customers.map(c => ({ id: c.id, name: c.name, phone: c.phone, type: c.type })),
    orders: orders.map(o => ({ id: o.code, uuid: o.id, date: o.created_at, customer: o.customer_id, product: o.product_id, qty: o.qty, weight: o.weight_kg ? +o.weight_kg : null, priceKg: fin ? +o.price_per_kg : null, pay: o.payment_status, ship: o.shipping_status, status: o.status, user: o.created_by, source: o.source, pickup: o.pickup_date, address: o.address, note: o.note, decidedBy: o.decided_by, decidedAt: o.decided_at, barn: bcode[o.barn_id] })),
    corrections: corrections.map(c => ({ id: c.id, type: { feed_transaction: 'FEED', mortality: 'MORT', weight_record: 'WEIGHT' }[c.entity_type], recordId: c.entity_id, field: c.field, oldVal: c.old_value, newVal: c.new_value, reason: c.reason, photo: c.photo, requestedBy: c.requested_by, requestedAt: c.requested_at, status: c.status, decidedBy: c.decided_by, decidedAt: c.decided_at, rejectReason: c.reject_reason })),
    audit: audit.map(a => ({ id: a.id, date: a.occurred_at, user: a.actor_id || 'SYSTEM', action: a.action, entity: a.entity_type, detail: a.detail, ref: a.entity_id || '-', hash: a.hash ? a.hash.slice(0, 8) : '' })),
    anomalyState,
  };
}
