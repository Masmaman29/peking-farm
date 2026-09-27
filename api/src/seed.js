/**
 * Seed DEMO DATA — hanya jika database masih kosong (tidak ada farm).
 * Angka sama dengan prototype: 500 DOD, 13 mati, selisih opname 35 kg, koreksi 80→75 kg menunggu.
 * Tanggal relatif ke hari ini: DOD masuk = hari ini − 31 hari (hari ke-32).
 */
import argon2 from 'argon2';
import { pool } from './db.js';

const dayMs = 86400000;
export async function seedIfEmpty(log = console) {
  const c = await pool.connect();
  try {
    if ((await c.query('SELECT 1 FROM farm LIMIT 1')).rows.length) return;
    log.info('Seeding demo data…');
    await c.query('BEGIN');
    const today = new Date(); today.setHours(9, 30, 0, 0);
    const dod = new Date(today.getTime() - 31 * dayMs); dod.setHours(0, 0, 0, 0);
    const day = (n, h = 8, m = 0) => { const d = new Date(dod.getTime() + (n - 1) * dayMs); d.setHours(h, m, 0, 0); return d; };
    const hash = await argon2.hash('demo1234', { type: argon2.argon2id });

    const farm = (await c.query(`INSERT INTO farm(name,location,lat,lng) VALUES ('Peking Farm','Sidoarjo, Jawa Timur',-7.4478,112.7183) RETURNING id`)).rows[0].id;
    const barn = {};
    for (const [code, name, note] of [['A', 'Kandang A', null], ['B', 'Kandang B', null], ['C', 'Kandang C', 'Kosong — siap siklus berikutnya']])
      barn[code] = (await c.query(`INSERT INTO barn(farm_id,code,name,capacity,note) VALUES ($1,$2,$3,300,$4) RETURNING id`, [farm, code, name, note])).rows[0].id;
    const U = {};
    for (const [k, name, phone, role, b] of [['U1', 'Hendra Wijaya', '081211112201', 'OWNER', null], ['U2', 'Sari Handayani', '081211112202', 'MANAGER', null], ['U3', 'Dewi Lestari', '081211112203', 'ADMIN', null], ['U4', 'Budi Santoso', '085722223301', 'ANAK_KANDANG', 'A'], ['U5', 'Agus Prasetyo', '085722223302', 'ANAK_KANDANG', 'B'], ['U6', 'Rudi Hartono', '085722223303', 'ANAK_KANDANG', 'B']])
      U[k] = (await c.query(`INSERT INTO app_user(farm_id,name,phone,role,barn_id,password_hash,is_active,last_login_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, [farm, name, phone, role, b ? barn[b] : null, hash, k !== 'U6', day(32, 7)])).rows[0].id;

    const curve = (await c.query(`SELECT value FROM master_config WHERE key='kurva_target_bobot'`)).rows[0].value;
    const cy = (await c.query(`INSERT INTO cycle(farm_id,code,dod_date,dod_qty,dod_price,target_curve,status,stage,locked,created_by) VALUES ($1,'#001',$2,500,15000,$3,'ACTIVE','GROWING',true,$4) RETURNING id`, [farm, dod, JSON.stringify(curve), U.U3])).rows[0].id;
    await c.query(`INSERT INTO cycle(farm_id,code,dod_date,dod_qty,dod_price,target_curve,status,stage,locked,created_by) VALUES ($1,'#000',$2,450,14500,$3,'CLOSED','HARVEST',true,$4)`, [farm, new Date(dod.getTime() - 53 * dayMs), JSON.stringify(curve), U.U3]);
    for (const b of ['A', 'B']) await c.query(`INSERT INTO population_tx(cycle_id,barn_id,type,qty,ref_type,ref_id,occurred_at,created_by) VALUES ($1,$2,'DOD_IN',250,'cycle',$1,$3,$4)`, [cy, barn[b], day(1, 7, 30), U.U3]);
    const au = (actor, action, entity, detail, ref, at) => c.query(`INSERT INTO audit_log(actor_id,action,entity_type,entity_id,detail,occurred_at) VALUES ($1,$2,$3,$4,$5,$6)`, [actor, action, entity, ref, detail, at]);
    await au(U.U3, 'CREATE', 'cycle', 'Siklus #001 dibuat — 500 DOD Peking @ Rp15.000', cy, day(1, 7, 30));
    await au(U.U3, 'CREATE', 'population_tx', 'DOD masuk 250 ekor Kandang A, 250 ekor Kandang B (SJ-DOD-0901)', cy, day(1, 7, 31));

    // Mortalitas (13 ekor)
    const mort = [[2, 'A', 2, 'Lemah sejak DOD', 7, 40], [3, 'B', 3, 'Kedinginan (brooder)', 6, 50], [4, 'A', 1, 'Lemah sejak DOD', 7, 10], [5, 'B', 1, 'Belum diketahui', 8, 5], [9, 'A', 1, 'Terinjak', 7, 20], [13, 'B', 1, 'Belum diketahui', 7, 45], [17, 'A', 1, 'Kaki lumpuh', 8, 0], [22, 'B', 1, 'Sakit (isolasi)', 9, 30], [27, 'A', 1, 'Belum diketahui', 7, 35], [31, 'A', 1, 'Belum diketahui', 7, 25]];
    for (const [d, b, qty, cause, h, m] of mort) {
      const r = await c.query(`INSERT INTO mortality(cycle_id,barn_id,qty,cause,occurred_at,locked,created_by) VALUES ($1,$2,$3,$4,$5,true,$6) RETURNING id`, [cy, barn[b], qty, cause, day(d, h, m), b === 'A' ? U.U4 : U.U5]);
      await au(b === 'A' ? U.U4 : U.U5, 'CREATE', 'mortality', `Bebek mati ${qty} ekor — Kandang ${b} — ${cause}`, r.rows[0].id, day(d, h, m));
    }
    // Pakan
    const feed = {}; for (const r of (await c.query('SELECT id,type FROM feed')).rows) feed[r.type] = r.id;
    const purchases = [[1, 1000, 6800, 'INV-SPN-2201'], [15, 800, 6800, 'INV-SPN-2287'], [28, 700, 6800, 'INV-SPN-2340']];
    for (const [d, qty, price, ref] of purchases) {
      const r = await c.query(`INSERT INTO feed_transaction(cycle_id,feed_id,type,qty_kg,price_per_kg,vendor,ref_no,occurred_at,status,locked,created_by) VALUES ($1,$2,'PURCHASE',$3,$4,'PT Sinar Pakan Nusantara',$5,$6,'APPROVED',true,$7) RETURNING id`, [cy, d < 15 ? feed.STARTER : feed.GROWER, qty, price, ref, day(d, 9), U.U3]);
      await au(U.U3, 'CREATE', 'feed_transaction', `Pembelian pakan ${qty} kg — Rp ${(qty * price).toLocaleString('id-ID')}`, r.rows[0].id, day(d, 9));
      await au(U.U1, 'APPROVE', 'feed_transaction', `Pembelian ${ref} disetujui`, r.rows[0].id, day(d, 10));
    }
    const pendingP = await c.query(`INSERT INTO feed_transaction(cycle_id,feed_id,type,qty_kg,price_per_kg,vendor,ref_no,reason,occurred_at,status,created_by) VALUES ($1,$2,'PURCHASE',2000,5200,'PT Sinar Pakan Nusantara','INV-SPN-2371','Harga promo grower, stok untuk finishing',$3,'PENDING',$4) RETURNING id`, [cy, feed.GROWER, day(31, 15), U.U3]);
    await c.query(`INSERT INTO approval(entity_type,entity_id,required_role,requested_by,requested_at) VALUES ('feed_transaction',$1,'OWNER',$2,$3)`, [pendingP.rows[0].id, U.U3, day(31, 15)]);
    await au(U.U3, 'CREATE', 'feed_transaction', 'Pembelian pakan 2.000 kg — Rp 10.400.000 (menunggu approval)', pendingP.rows[0].id, day(31, 15));
    const daily = []; for (let d = 1; d <= 24; d++) daily.push(Math.round(5 + 55 * Math.pow((d - 1) / 23, 1.4))); daily.push(62, 64, 66, 68, 70, 72, 74, 94);
    let fd31A = null;
    for (let i = 0; i < daily.length; i++) {
      const d = i + 1; let a = Math.round(daily[i] * 0.51), b = daily[i] - a; if (d === 31) { a = 80; b = 36; }
      for (const [bc, kg, u, h, m] of [['A', a, U.U4, 6, 45], ['B', b, U.U5, 7, 0]]) {
        const r = await c.query(`INSERT INTO feed_transaction(cycle_id,barn_id,feed_id,type,qty_kg,occurred_at,locked,created_by) VALUES ($1,$2,$3,'USAGE',$4,$5,$6,$7) RETURNING id`, [cy, barn[bc], d < 15 ? feed.STARTER : feed.GROWER, -kg, day(d, h, m), d < 32, u]);
        if (d === 31 && bc === 'A') fd31A = r.rows[0].id;
        if (d >= 29) await au(u, 'CREATE', 'feed_transaction', `Input pakan ${kg} kg — Kandang ${bc} — Bukti foto`, r.rows[0].id, day(d, h, m));
      }
    }
    // Opname 1 hari lalu: teoritis saat itu = 2500 - pemakaian s/d H31
    const usedTo31 = daily.slice(0, 31).reduce((s, x) => s + x, 0);
    const theo = 2500 - usedTo31; // 1214 + 94 = 1308
    const op = await c.query(`INSERT INTO feed_stock_opname(feed_id,physical_kg,theoretical_kg,note,occurred_at,created_by) VALUES ($1,$2,$3,'Opname mingguan gudang pakan',$4,$5) RETURNING id`, [feed.GROWER, theo - 35, theo, day(31, 17, 30), U.U2]);
    await au(U.U2, 'STOCK_OPNAME', 'feed_stock', `Opname fisik pakan ${theo - 35} kg — selisih 35 kg`, op.rows[0].id, day(31, 17, 30));
    await c.query(`INSERT INTO anomaly(rule_code,severity,entity_type,entity_id,title,detail,dedupe_key,detected_at) VALUES ('FEED_DIFF','WARNING','feed_stock_opname',$1,'Selisih stok pakan 35 kg dengan catatan transaksi',$2,'AN-FEED-DIFF',$3)`, [op.rows[0].id, `Teoritis ${theo} kg, fisik ${theo - 35} kg.`, day(31, 17, 30)]);
    // Timbang
    for (const [d, a, b] of [[7, 0.21, 0.20], [14, 0.46, 0.45], [21, 0.76, 0.74], [28, 1.06, 1.04], [32, 1.26, 1.24]])
      for (const [bc, avg] of [['A', a], ['B', b]]) {
        const u = d === 32 ? U.U2 : bc === 'A' ? U.U4 : U.U5;
        const r = await c.query(`INSERT INTO weight_record(cycle_id,barn_id,sample_n,total_kg,occurred_at,locked,created_by) VALUES ($1,$2,20,$3,$4,true,$5) RETURNING id`, [cy, barn[bc], +(avg * 20).toFixed(1), day(d, 16, 30), u]);
        if (d >= 28) await au(u, 'CREATE', 'weight_record', `Timbang 20 ekor, total ${(avg * 20).toFixed(1)} kg, rata-rata ${avg.toFixed(2)} kg — Kandang ${bc}`, r.rows[0].id, day(d, 16, 30));
      }
    // Kesehatan & kondisi
    for (const [d, b, t, item, dose, u, note] of [[3, null, 'VACCINE', 'Vaksin AI H5N1', '0,5 ml/ekor', U.U2, 'Seluruh populasi'], [7, null, 'VITAMIN', 'Vitachick', '1 g/L air minum', U.U4, '3 hari berturut'], [14, null, 'VITAMIN', 'Vitachick', '1 g/L air minum', U.U5, null], [22, 'B', 'TREATMENT', 'Antibiotik (Ampicol)', '2 g/L, 3 hari', U.U2, '6 ekor lemas, nafsu makan turun — diisolasi'], [25, 'B', 'OBSERVATION', 'Isolasi selesai', '-', U.U5, '5 ekor pulih, 1 mati H22 (tercatat mortalitas)']])
      await c.query(`INSERT INTO health_record(cycle_id,barn_id,type,item,dose,note,occurred_at,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [cy, b ? barn[b] : null, t, item, dose, note, day(d, 9), u]);
    for (const [d, b, t, h, l, note, u, hh, mm] of [[32, 'A', 28, 74, 'Kering', 'Normal', U.U4, 7, 50], [32, 'B', 29, 78, 'Agak lembab', 'Sekam sudut timur perlu ditambah', U.U5, 8, 5], [31, 'A', 27, 72, 'Kering', null, U.U4, 7, 45], [31, 'B', 28, 75, 'Kering', null, U.U5, 22, 10]]) {
      const r = await c.query(`INSERT INTO barn_condition(cycle_id,barn_id,temp_c,humidity_pct,litter,water,behavior,note,occurred_at,created_by) VALUES ($1,$2,$3,$4,$5,'Lancar','Aktif',$6,$7,$8) RETURNING id`, [cy, barn[b], t, h, l, note, day(d, hh, mm), u]);
      if (hh >= 20) await au(u, 'CREATE', 'barn_condition', 'Input kondisi kandang B (di luar jam kerja)', r.rows[0].id, day(d, hh, mm));
    }
    // Biaya
    for (const [d, cat, amt, vendor, ref] of [[1, 'DOD', 7500000, 'CV Bibit Unggul Mojokerto', 'INV-BU-0901'], [2, 'SEKAM', 600000, 'UD Jaya Sekam', 'NOTA-0902'], [3, 'VITAMIN', 450000, 'Toko Poultry Sejahtera', 'NOTA-0903'], [5, 'GAS', 750000, 'Agen LPG Sidoarjo', 'NOTA-0905'], [22, 'OBAT', 320000, 'Toko Poultry Sejahtera', 'NOTA-0922'], [25, 'LISTRIK', 480000, 'PLN', 'PLN-SEP-26'], [30, 'TENAGA_KERJA', 2400000, 'Gaji bulanan (2 orang)', 'PAYROLL'], [28, 'TRANSPORT', 300000, 'Ongkir pakan', 'NOTA-0928']])
      await c.query(`INSERT INTO expense(cycle_id,category,amount,vendor,ref_no,occurred_at,status,locked,created_by) VALUES ($1,$2,$3,$4,$5,$6,'APPROVED',true,$7)`, [cy, cat, amt, vendor, ref, day(d), U.U3]);
    // Inventory & produk
    const inv = {};
    for (const [k, name, unit, cat, min, avgW] of [['VIT', 'Vitamin (Vitachick)', 'sachet', 'Vitamin', 4, null], ['OBT', 'Antibiotik (Ampicol)', 'sachet', 'Obat', 2, null], ['SKM', 'Sekam', 'karung', 'Sekam', 10, null], ['ALT', 'Tempat pakan gantung', 'unit', 'Peralatan', 20, null], ['KRK', 'Bebek Peking karkas (frozen, siklus #000)', 'ekor', 'Produk panen', 10, 1.35], ['PTG', 'Bebek Peking potong (fresh, siklus #000)', 'ekor', 'Produk panen', 10, 1.55]])
      inv[k] = (await c.query(`INSERT INTO inventory(farm_id,name,unit,category,min_qty,avg_weight_kg) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, [farm, name, unit, cat, min, avgW])).rows[0].id;
    const it = (k, type, qty, ref, d, u = U.U3) => c.query(`INSERT INTO inventory_tx(inventory_id,type,qty,ref_type,note,occurred_at,created_by) VALUES ($1,$2,$3,'seed',$4,$5,$6)`, [inv[k], type, qty, ref, day(d, 10), u]);
    await it('VIT', 'IN', 10, 'NOTA-0903', 3); await it('VIT', 'OUT', -4, 'Pemakaian', 14);
    await it('OBT', 'IN', 5, 'NOTA-0922', 22); await it('OBT', 'OUT', -2, 'Pengobatan kandang B', 22);
    await it('SKM', 'IN', 30, 'NOTA-0902', 2); await it('SKM', 'OUT', -22, 'Pemakaian kandang', 20, U.U2);
    await it('ALT', 'IN', 24, 'Inventaris awal', 1);
    await it('KRK', 'IN', 80, 'Panen #000', -5); await it('KRK', 'OUT', -40, 'Order ORD-0004', 12);
    await it('PTG', 'IN', 11, 'Panen #000', -5); await it('PTG', 'OUT', -5, 'Order ORD-0006', 29);
    const P = {};
    for (const [k, name, type, desc, price, min, avgW, src, ik] of [['HDP', 'Bebek Peking Hidup', 'LIVE', 'Bobot 1,5–1,8 kg, siap panen dari Siklus #001.', 45000, 10, 1.65, 'POPULATION', null], ['PTG', 'Bebek Peking Potong', 'CUT', 'Dipotong bersih, fresh, dikirim hari yang sama.', 52000, 2, 1.55, 'INVENTORY', 'PTG'], ['KRK', 'Bebek Peking Karkas', 'CARCASS', 'Karkas utuh, frozen vacuum, cocok untuk restoran.', 58000, 5, 1.35, 'INVENTORY', 'KRK']])
      P[k] = (await c.query(`INSERT INTO product(farm_id,name,type,description,price_per_kg,min_order,avg_weight_kg,stock_source,inventory_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`, [farm, name, type, desc, price, min, avgW, src, ik ? inv[ik] : null])).rows[0].id;
    const CU = {};
    for (const [k, name, phone, type] of [['CU1', 'Restoran Sari Rasa', '081344556677', 'Restoran'], ['CU2', 'Ibu Rina', '081299887766', 'Retail'], ['CU3', 'RM Bebek Goreng Pak Slamet', '085712345678', 'Rumah makan'], ['CU4', 'Bapak Yusuf', '081233445566', 'Retail']])
      CU[k] = (await c.query(`INSERT INTO customer(name,phone,type) VALUES ($1,$2,$3) RETURNING id`, [name, phone, type])).rows[0].id;
    const ord = async (code, cu, prod, qty, w, price, pay, ship, status, d, src = 'ADMIN', extra = {}) => {
      const o = (await c.query(`INSERT INTO "order"(code,customer_id,source,status,payment_status,shipping_status,pickup_date,address,note,total_est,total_final,stock_applied,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
        [code, CU[cu], src, status, pay, ship, extra.pickup || null, extra.address || null, extra.note || null, qty * 1.5 * price, w ? w * price : null, status === 'DELIVERED', src === 'ADMIN' ? U.U3 : null, day(d, 10)])).rows[0].id;
      await c.query(`INSERT INTO order_item(order_id,product_id,cycle_id,qty,weight_kg,price_per_kg) VALUES ($1,$2,$3,$4,$5,$6)`, [o, P[prod], prod === 'HDP' ? cy : null, qty, w, price]);
      return o;
    };
    await ord('ORD-0004', 'CU3', 'KRK', 40, 54, 58000, 'PAID', 'DELIVERED', 'DELIVERED', 12);
    await ord('ORD-0006', 'CU2', 'PTG', 5, 7.8, 52000, 'PAID', 'DELIVERED', 'DELIVERED', 29);
    const o7 = await ord('ORD-0007', 'CU1', 'KRK', 20, 27, 58000, 'UNPAID', 'PENDING', 'PENDING_APPROVAL', 31);
    await c.query(`INSERT INTO approval(entity_type,entity_id,required_role,requested_by,requested_at) VALUES ('order',$1,'MANAGER',$2,$3)`, [o7, U.U3, day(31, 14, 20)]);
    await au(U.U3, 'CREATE', 'order', 'Order ORD-0007 Restoran Sari Rasa — 20 ekor karkas (menunggu approval)', o7, day(31, 14, 20));
    const o8 = await ord('ORD-0008', 'CU4', 'HDP', 15, null, 45000, 'UNPAID', 'PENDING', 'NEW', 32, 'WEBSITE', { pickup: day(46), address: 'Perum Griya Permata Blok C-7, Sidoarjo', note: 'Ambil sendiri, pagi' });
    await au(null, 'CREATE', 'order', 'Order ORD-0008 masuk dari website — Bapak Yusuf, 15 ekor hidup', o8, day(32, 8, 52));
    // Koreksi menunggu: FD31A 80 → 75
    const ap = (await c.query(`INSERT INTO approval(entity_type,entity_id,required_role,requested_by,requested_at) VALUES ('correction_request',$1,'MANAGER',$2,$3) RETURNING id`, [fd31A, U.U4, day(32, 8, 20)])).rows[0].id;
    const cr = (await c.query(`INSERT INTO correction_request(entity_type,entity_id,field,old_value,new_value,reason,approval_id,created_by,created_at) VALUES ('feed_transaction',$1,'qty_kg','80','75','Salah input — angka timbangan 75 kg (lihat foto ulang)',$2,$3,$4) RETURNING id`, [fd31A, ap, U.U4, day(32, 8, 20)])).rows[0].id;
    await c.query('UPDATE approval SET entity_id=$1 WHERE id=$2', [cr, ap]);
    await au(U.U4, 'CORRECTION', 'feed_transaction', 'Ajukan koreksi pakan 1 Okt Kandang A: 80 kg → 75 kg — Salah input', cr, day(32, 8, 20));
    await au(U.U4, 'LOGIN', 'session', 'Login dari perangkat mobile', null, day(32, 6, 45));
    await c.query("SELECT setval('order_code_seq', 8)");
    await c.query('COMMIT');
    log.info('Demo seed selesai. Login: nomor HP / password demo1234');
  } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) { await seedIfEmpty(); await pool.end(); }
