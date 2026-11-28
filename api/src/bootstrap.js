/**
 * Menyusun snapshot data untuk frontend dalam bentuk yang sama dengan prototype (DB object).
 * Semua angka turunan (populasi, stok, FCR, laba) dihitung dari ledger — di sini hanya
 * mengirim transaksi mentah; view SQL (v_population dsb.) dipakai untuk endpoint publik & laporan.
 * Data keuangan disaring sesuai role di sini (bukan hanya di UI).
 */
import { rows, one, config } from './db.js';
import { sensorRupiah } from './sensor.js';

const finRoles = new Set(['OWNER', 'ADMIN']);

export async function buildBootstrap(user, batchCode) {
  const fin = finRoles.has(user.role);
  const ak = user.role === 'ANAK_KANDANG';
  /* Angka yang belum pernah disetel orang = angka BAWAAN, bukan milik farm ini.
     Aplikasi menandainya, dan angka turunan dari kurva bawaan tidak dihitung. */
  const bawaanKey = { target_mortalitas_pct: 'targetMortalitasPct', min_stok_pakan_hari: 'minStokPakanHari',
    batas_mortalitas_harian: 'batasMortalitasHarian', batas_deviasi_pakan_pct: 'batasPakanPct',
    batas_selisih_opname_kg: 'batasSelisihKg', ambang_approval_rp: 'ambangApprovalRp', jam_kerja: 'jamKerja', pakem_pakan: 'pakemPakan' };
  /* Potongan SQL yang dipakai beberapa query di bawah. */
  const HARI = `(now() AT TIME ZONE 'Asia/Jakarta')::date`;
  const TGL = `(t.occurred_at AT TIME ZONE 'Asia/Jakarta')::date`;
  const PAKAI = `t.cycle_id=v.cycle_id AND t.barn_id=v.barn_id AND t.type='USAGE' AND t.status IN ('RECORDED','APPROVED') AND t.deleted_at IS NULL`;
  const MATI = `m.cycle_id=v.cycle_id AND m.barn_id=v.barn_id AND m.deleted_at IS NULL AND m.status<>'SUPERSEDED'`;
  const SAH = `t.deleted_at IS NULL AND ((t.type='PURCHASE' AND t.status='APPROVED') OR (t.type='USAGE' AND t.status IN ('RECORDED','APPROVED')) OR (t.type='ADJUSTMENT' AND t.status='APPROVED'))`;

  /* ---- Gelombang 1 ----
     Semua yang tidak bergantung pada hasil query lain diminta sekaligus, bukan
     satu per satu. Di sinyal dan jaringan lambat ini yang paling terasa. */
  const [cfg, bawaanRows, farm, batches, hargaPakanRata, hargaJenis, barnPopRows, barnGerakRows, opname,
    inventory, invTx, customers, orders, corrections, anomalies, harian, mortUmur,
    mortSebab, stokFarm, stokJenis, pakaiFarm, auditRows, punya] = await Promise.all([
    config(),
    rows('SELECT key FROM master_config WHERE updated_by IS NULL'),
    one('SELECT * FROM farm ORDER BY created_at LIMIT 1'),
    // Semua batch yang sedang berjalan. Satu baris per batch, dengan kandang
    // yang sedang ditempatinya (bisa dua kandang kalau sedang pindah).
    rows(`
    SELECT cycle_id, code, dod_date, dod_qty, target_days, stage,
           SUM(population)::int           AS population,
           MIN(umur_hari)::int            AS umur_hari,
           MIN(perkiraan_panen)           AS perkiraan_panen,
           MIN(sisa_hari)::int            AS sisa_hari,
           string_agg(barn_name, ' + ' ORDER BY population DESC) AS barn_names,
           (array_agg(barn_code ORDER BY population DESC))[1]    AS barn_code,
           (array_agg(barn_name ORDER BY population DESC))[1]    AS barn_name
      FROM v_batch_aktif
     GROUP BY cycle_id, code, dod_date, dod_qty, target_days, stage
     ORDER BY dod_date`),
    one('SELECT harga_kg FROM v_harga_pakan_rata'),
    rows('SELECT jenis, harga_kg, kg_dibeli FROM v_harga_pakan_jenis'),
    // Populasi tiap kandang dari SELURUH batch, bukan hanya batch yang sedang
    // dibuka. Dipakai layar untuk tahu kandang mana yang benar-benar kosong.
    rows(`SELECT barn_code, SUM(population)::int n FROM v_batch_aktif GROUP BY barn_code`),
    /* Kapan tiap kandang terakhir kali ada pergerakan populasi. Untuk kandang
       yang sekarang kosong, tanggal itulah saat ekor terakhir keluar — dipakai
       layar untuk menghitung sudah berapa hari kandang menganggur. Kandang yang
       belum pernah dipakai sama sekali tidak muncul di sini, dan memang tidak
       boleh dihitung "menganggur" karena tidak pernah ada isinya. */
    rows(`SELECT b.code barn_code, MAX(t.occurred_at) terakhir
            FROM population_tx t JOIN barn b ON b.id = t.barn_id
           GROUP BY b.code`),
    rows('SELECT * FROM feed_stock_opname ORDER BY occurred_at'),
    rows('SELECT i.id,i.name,i.unit,i.category cat,i.min_qty min,i.avg_weight_kg "avgW", COALESCE(s.qty,0) qty FROM inventory i LEFT JOIN v_inventory_stock s ON s.inventory_id=i.id WHERE i.is_active ORDER BY i.category,i.name'),
    rows('SELECT * FROM inventory_tx ORDER BY occurred_at DESC LIMIT 300'),
    rows('SELECT * FROM customer ORDER BY created_at'),
    rows(`SELECT o.*, oi.product_id, oi.qty, oi.weight_kg, oi.price_per_kg, oi.barn_id
     FROM "order" o JOIN order_item oi ON oi.order_id=o.id ORDER BY o.created_at DESC`),
    rows(`SELECT c.*, a.status, a.requested_by, a.requested_at, a.decided_by, a.decided_at, a.reject_reason,
     (SELECT file_url FROM attachment at WHERE at.entity_type='correction_request' AND at.entity_id=c.id LIMIT 1) photo
     FROM correction_request c JOIN approval a ON a.id=c.approval_id ORDER BY c.created_at DESC`),
    rows('SELECT dedupe_key,status,verified_by,verify_note FROM anomaly'),
    /* Ringkasan harian SEMUA kandang yang berisi ternak — pakan & kematian. */
    rows(`
    SELECT v.code, v.barn_code, v.barn_name, v.population, v.umur_hari, c.feed_plan, c.dod_weight_kg,
      COALESCE((SELECT -SUM(t.qty_kg) FROM feed_transaction t WHERE ${PAKAI} AND ${TGL} = ${HARI} AND t.sesi='PAGI'),0) AS pakan_pagi,
      COALESCE((SELECT -SUM(t.qty_kg) FROM feed_transaction t WHERE ${PAKAI} AND ${TGL} = ${HARI} AND COALESCE(t.sesi,'SORE')='SORE'),0) AS pakan_sore,
      COALESCE((SELECT -SUM(t.qty_kg) FROM feed_transaction t WHERE ${PAKAI}),0) AS pakan_total,
      (SELECT w.avg_kg FROM weight_record w WHERE w.cycle_id=v.cycle_id AND w.barn_id=v.barn_id AND w.deleted_at IS NULL AND w.status<>'SUPERSEDED' ORDER BY w.occurred_at DESC LIMIT 1) AS bobot_akhir,
      (SELECT ${HARI} - (w.occurred_at AT TIME ZONE 'Asia/Jakarta')::date FROM weight_record w WHERE w.cycle_id=v.cycle_id AND w.barn_id=v.barn_id AND w.deleted_at IS NULL AND w.status<>'SUPERSEDED' ORDER BY w.occurred_at DESC LIMIT 1) AS hari_sejak_timbang,
      COALESCE((SELECT SUM(x.qty) FROM population_tx x WHERE x.cycle_id=v.cycle_id AND x.barn_id=v.barn_id AND x.qty>0),0)::int AS masuk,
      COALESCE((SELECT -SUM(t.qty_kg) FROM feed_transaction t WHERE ${PAKAI} AND ${TGL} = ${HARI}),0) AS pakan_hari_ini,
      COALESCE((SELECT -SUM(t.qty_kg) FROM feed_transaction t WHERE ${PAKAI} AND ${TGL} = ${HARI} - 1),0) AS pakan_kemarin,
      COALESCE((SELECT -SUM(t.qty_kg) FROM feed_transaction t WHERE ${PAKAI} AND ${TGL} BETWEEN ${HARI} - 3 AND ${HARI} - 1),0) AS pakan_3hari,
      COALESCE((SELECT COUNT(DISTINCT ${TGL}) FROM feed_transaction t WHERE ${PAKAI} AND ${TGL} BETWEEN ${HARI} - 3 AND ${HARI} - 1),0)::int AS hari_tercatat,
      COALESCE((SELECT SUM(m.qty) FROM mortality m WHERE ${MATI}),0)::int AS mati,
      COALESCE((SELECT SUM(m.qty) FROM mortality m WHERE ${MATI} AND (m.occurred_at AT TIME ZONE 'Asia/Jakarta')::date = ${HARI}),0)::int AS mati_hari_ini
    FROM v_batch_aktif v JOIN cycle c ON c.id = v.cycle_id ORDER BY v.dod_date, v.barn_code`),
    rows(`
    /* Kematian per umur, dipecah mati vs afkir (migrasi 024). Umur penting
       untuk biaya: bebek yang mati hari ke-22 sudah makan 22 hari pakan. */
    SELECT ((m.occurred_at AT TIME ZONE 'Asia/Jakarta')::date - c.dod_date) + 1 AS umur,
           SUM(m.qty)::int AS n,
           COALESCE(SUM(m.qty) FILTER (WHERE m.kind='MATI'),0)::int  AS mati,
           COALESCE(SUM(m.qty) FILTER (WHERE m.kind='AFKIR'),0)::int AS afkir
      FROM mortality m JOIN cycle c ON c.id = m.cycle_id
     WHERE m.deleted_at IS NULL AND m.status<>'SUPERSEDED' GROUP BY 1 ORDER BY 1`),
    rows(`SELECT cause, kind::text AS kind, SUM(qty)::int AS n FROM mortality
           WHERE deleted_at IS NULL AND status<>'SUPERSEDED' GROUP BY cause, kind ORDER BY 3 DESC`),
    one(`SELECT COALESCE(SUM(qty_kg),0) AS kg FROM feed_transaction WHERE deleted_at IS NULL AND ((type='PURCHASE' AND status='APPROVED') OR (type='USAGE' AND status IN ('RECORDED','APPROVED')) OR (type='ADJUSTMENT' AND status='APPROVED'))`),
    /* Stok gudang seluruh farm, dipecah per jenis pakan. */
    rows(`
    SELECT f.type::text AS jenis,
           COALESCE(SUM(t.qty_kg) FILTER (WHERE t.type='PURCHASE'),0) AS beli,
           COALESCE(-SUM(t.qty_kg) FILTER (WHERE t.type='USAGE'),0) AS pakai,
           COALESCE(SUM(t.qty_kg),0) AS stok
      FROM feed_transaction t JOIN feed f ON f.id = t.feed_id
     WHERE ${SAH} GROUP BY f.type`),
    /* Rata-rata pemakaian per hari seluruh farm, 7 hari terakhir yang ada catatannya (tanpa hari ini). */
    one(`
    SELECT COALESCE(-SUM(t.qty_kg),0) AS kg, COUNT(DISTINCT (t.occurred_at AT TIME ZONE 'Asia/Jakarta')::date)::int AS hari
      FROM feed_transaction t
     WHERE t.type='USAGE' AND t.status IN ('RECORDED','APPROVED') AND t.deleted_at IS NULL
       AND (t.occurred_at AT TIME ZONE 'Asia/Jakarta')::date BETWEEN ${HARI} - 7 AND ${HARI} - 1`),
    ak
      ? rows('SELECT id,actor_id,action,entity_type,entity_id,detail,occurred_at FROM audit_log WHERE actor_id=$1 ORDER BY id DESC LIMIT 100', [user.id])
      : rows('SELECT id,actor_id,action,entity_type,entity_id,detail,occurred_at,hash FROM audit_log ORDER BY id DESC LIMIT 500'),
    ak && user.barn_id ? one('SELECT cycle_id FROM v_batch_aktif WHERE barn_id=$1 ORDER BY dod_date LIMIT 1', [user.barn_id]) : Promise.resolve(null),
  ]);
  const bawaan = bawaanRows.map(r => bawaanKey[r.key]).filter(Boolean);
  const barnPop = Object.fromEntries(barnPopRows.map(r => [r.barn_code, r.n]));
  const barnGerakTerakhir = Object.fromEntries(barnGerakRows.map(r => [r.barn_code, r.terakhir]));
  const audit = auditRows;

  // Batch yang sedang dibuka di layar: yang diminta, atau yang paling tua
  // (paling dekat panen) supaya yang terpenting muncul duluan.
  let pilih = batchCode && batches.find(b => b.code === batchCode);
  if (ak && user.barn_id) pilih = punya ? batches.find(b => b.cycle_id === punya.cycle_id) : pilih;

  /* ---- Gelombang 2: yang butuh id farm, sekaligus menentukan batch yang dibuka. ---- */
  const [barns, users, products, prevCycles, batchHabisRows, cycle, asalDodRows, targetMatiRows, farmPopRows, farmMortRows] = await Promise.all([
    /* target_mort_pct WAJIB ikut. Tanpa itu barns[].targetMati selalu null,
       dan jalur cadangan di calc.targetMati() — yang dipakai kalau kandangnya
       belum/tidak ada di v_target_mati_kandang, misalnya kandang yang sedang
       kosong — tidak pernah bekerja: layar memakai target farm padahal kandang
       itu punya targetnya sendiri. Isian target di form kandang juga tampil
       kosong walau targetnya tersimpan, seolah-olah tidak jadi disimpan.
       Ketahuan uji 28 Nov 2026. */
    rows('SELECT id,code,name,capacity,note,is_active,target_mort_pct FROM barn WHERE farm_id=$1 ORDER BY code', [farm.id]),
    rows(`SELECT id,name,role,barn_id,is_active,phone,email,last_login_at,archived_at FROM app_user WHERE farm_id=$1 ORDER BY role,name`, [farm.id]),
    rows('SELECT * FROM product WHERE farm_id=$1 ORDER BY type', [farm.id]),
    rows(`SELECT s.*, c.dod_source FROM v_cycle_summary s JOIN cycle c ON c.id=s.cycle_id
     WHERE c.farm_id=$1 AND c.status<>'ACTIVE' ORDER BY s.dod_date DESC`, [farm.id]),
    rows(`SELECT c.code FROM cycle c WHERE c.farm_id=$1 AND c.status='ACTIVE' AND NOT EXISTS (SELECT 1 FROM v_batch_aktif v WHERE v.cycle_id=c.id) ORDER BY c.dod_date`, [farm.id]),
    (async () => {
      // Batch aktif yang sudah habis dipanen (populasi 0) tetap bisa dibuka lewat kodenya,
      // supaya hasil panen dan invoice-nya masih bisa dilihat sebelum batch ditutup.
      const habis = !pilih && batchCode && !ak ? await one(`SELECT * FROM cycle WHERE farm_id=$1 AND code=$2 AND status='ACTIVE'`, [farm.id, batchCode]) : null;
      if (habis) return habis;
      return (pilih || batches[0])
        ? one('SELECT * FROM cycle WHERE id=$1', [(pilih || batches[0]).cycle_id])
        : one(`SELECT * FROM cycle WHERE farm_id=$1 AND status='ACTIVE' ORDER BY dod_date LIMIT 1`, [farm.id]);
    })(),
    rows('SELECT * FROM v_asal_dod WHERE farm_id=$1 ORDER BY penjual', [farm.id]),
    rows('SELECT * FROM v_target_mati_kandang WHERE farm_id=$1 ORDER BY barn_code', [farm.id]),
    /* Lingkup SELURUH FARM untuk halaman Populasi & Mortalitas — diminta Abdur
       27 Nov 2026. Sebelumnya halaman itu hanya pernah melihat siklus yang
       dibuka, sehingga tombol "Semua" di sana sebenarnya berarti "semua kandang
       di siklus ini" — di farm Abdur itu cuma satu kandang, jadi tombolnya
       tidak melakukan apa-apa.
       Hanya batch yang SEDANG JALAN yang ikut; siklus yang sudah ditutup tetap
       di Riwayat (pilihan Abdur sendiri). */
    rows(`SELECT t.id, t.occurred_at, t.type, t.barn_id, t.qty, t.created_by, t.ref_id, c.code AS cycle_code
            FROM population_tx t JOIN cycle c ON c.id = t.cycle_id
           WHERE c.farm_id = $1 AND c.status = 'ACTIVE' ORDER BY t.occurred_at`, [farm.id]),
    rows(`SELECT m.id, m.occurred_at, m.barn_id, m.qty, m.cause, m.kind, m.note, m.status, m.locked,
                 m.created_by, c.code AS cycle_code,
                 (SELECT file_url FROM attachment a WHERE a.entity_type='mortality' AND a.entity_id=m.id ORDER BY version DESC LIMIT 1) photo,
                 (SELECT a.source FROM attachment a WHERE a.entity_type='mortality' AND a.entity_id=m.id ORDER BY version DESC LIMIT 1) photo_source
            FROM mortality m JOIN cycle c ON c.id = m.cycle_id
           WHERE c.farm_id = $1 AND c.status = 'ACTIVE' AND m.deleted_at IS NULL AND m.status <> 'SUPERSEDED'
           ORDER BY m.occurred_at`, [farm.id]),
  ]);
  const bcode = Object.fromEntries(barns.map(b => [b.id, b.code]));

  /* ---- Gelombang 3: isi batch yang sedang dibuka. ---- */
  const [popTx, mortality, feedAll, weights, health, barnCond, expenses, cycleSummary, fcrSeri, panen, uangRow, biaya] = cycle ? await Promise.all([
    rows(`SELECT id,occurred_at,type,barn_id,qty,created_by,ref_type,ref_id FROM population_tx WHERE cycle_id=$1 ORDER BY occurred_at`, [cycle.id]),
    rows(`SELECT m.*, (SELECT file_url FROM attachment a WHERE a.entity_type='mortality' AND a.entity_id=m.id ORDER BY version DESC LIMIT 1) photo,
            (SELECT a.source FROM attachment a WHERE a.entity_type='mortality' AND a.entity_id=m.id ORDER BY version DESC LIMIT 1) photo_source
     FROM mortality m WHERE cycle_id=$1 AND deleted_at IS NULL AND status<>'SUPERSEDED' ORDER BY occurred_at`, [cycle.id]),
    rows(`SELECT f.*, (SELECT file_url FROM attachment a WHERE a.entity_type='feed_transaction' AND a.entity_id=f.id ORDER BY version DESC LIMIT 1) photo,
            (SELECT a.source FROM attachment a WHERE a.entity_type='feed_transaction' AND a.entity_id=f.id ORDER BY version DESC LIMIT 1) photo_source,
            (SELECT x.type::text FROM feed x WHERE x.id=f.feed_id) jenis
     /* Urut tanggal, lalu waktu pencatatan, lalu id. occurred_at saja TIDAK
        cukup: nota pembelian disimpan bertanggal (tanpa jam), jadi dua nota di
        hari yang sama urutannya jadi acak menurut PostgreSQL. Akibatnya kartu
        "harga pakan terbaru" bisa menampilkan nota yang salah di hari Bapak
        beli pakan dua kali. Ketahuan 26 Nov 2026. */
     FROM feed_transaction f WHERE (cycle_id=$1 OR cycle_id IS NULL) AND deleted_at IS NULL
     ORDER BY occurred_at, created_at, id`, [cycle.id]),
    rows(`SELECT w.*, (SELECT file_url FROM attachment a WHERE a.entity_type='weight_record' AND a.entity_id=w.id ORDER BY version DESC LIMIT 1) photo,
            (SELECT a.source FROM attachment a WHERE a.entity_type='weight_record' AND a.entity_id=w.id ORDER BY version DESC LIMIT 1) photo_source
     FROM weight_record w WHERE cycle_id=$1 AND deleted_at IS NULL AND status<>'SUPERSEDED'
     ORDER BY occurred_at, created_at, id`, [cycle.id]),
    rows('SELECT * FROM health_record WHERE cycle_id=$1 AND deleted_at IS NULL ORDER BY occurred_at', [cycle.id]),
    rows('SELECT * FROM barn_condition WHERE cycle_id=$1 ORDER BY occurred_at DESC LIMIT 200', [cycle.id]),
    fin ? rows('SELECT * FROM expense WHERE cycle_id=$1 AND deleted_at IS NULL ORDER BY occurred_at', [cycle.id]) : Promise.resolve([]),
    one('SELECT * FROM v_cycle_summary WHERE cycle_id=$1', [cycle.id]),
    /* Perkembangan FCR: satu baris tiap kali sampel ditimbang. */
    rows(`
    SELECT w.occurred_at, w.barn_id, w.avg_kg, w.sample_n,
      ((w.occurred_at AT TIME ZONE 'Asia/Jakarta')::date - c.dod_date) + 1 AS umur,
      COALESCE((SELECT SUM(x.qty) FROM population_tx x WHERE x.cycle_id=w.cycle_id AND x.barn_id=w.barn_id AND x.occurred_at<=w.occurred_at),0)::int AS pop,
      COALESCE((SELECT SUM(x.qty) FROM population_tx x WHERE x.cycle_id=w.cycle_id AND x.barn_id=w.barn_id AND x.qty>0 AND x.occurred_at<=w.occurred_at),0)::int AS masuk,
      COALESCE((SELECT -SUM(t.qty_kg) FROM feed_transaction t WHERE t.cycle_id=w.cycle_id AND t.barn_id=w.barn_id AND t.type='USAGE' AND t.status IN ('RECORDED','APPROVED') AND t.deleted_at IS NULL AND t.occurred_at<=w.occurred_at),0) AS pakan,
      c.dod_weight_kg
    FROM weight_record w JOIN cycle c ON c.id=w.cycle_id
    WHERE w.cycle_id=$1 AND w.deleted_at IS NULL AND w.status<>'SUPERSEDED' ORDER BY w.occurred_at`, [cycle.id]),
    rows(`
    SELECT o.code, o.created_at, o.payment_status, o.note, cu.name AS pembeli, cu.phone AS hp, oi.barn_id, oi.qty, oi.weight_kg, oi.price_per_kg, oi.timbangan,
           (SELECT name FROM app_user u WHERE u.id=o.created_by) AS oleh
      FROM order_item oi JOIN "order" o ON o.id=oi.order_id LEFT JOIN customer cu ON cu.id=o.customer_id
     WHERE oi.cycle_id=$1 AND o.source::text='PANEN' AND o.status<>'CANCELLED' ORDER BY o.created_at`, [cycle.id]),
    one(`
    SELECT (c.dod_qty * c.dod_price) AS dod,
      COALESCE((SELECT SUM(oi.weight_kg * oi.price_per_kg) FROM order_item oi JOIN "order" o ON o.id=oi.order_id WHERE oi.cycle_id=c.id AND o.source::text='PANEN' AND o.status<>'CANCELLED'),0) AS panen,
      -- Biaya pakan dibaca dari v_cycle_pakan, sumber yang sama dengan
      -- v_cycle_cost. Dulu rumusnya ditulis ulang di sini dan sempat berbeda,
      -- sehingga rincian biaya di layar tidak berjumlah sama dengan totalnya.
      COALESCE((SELECT biaya FROM v_cycle_pakan vp WHERE vp.cycle_id=c.id),0) AS pakan,
      COALESCE((SELECT kg FROM v_cycle_pakan vp WHERE vp.cycle_id=c.id),0) AS pakan_kg,
      COALESCE((SELECT SUM(e.amount) FROM expense e WHERE e.cycle_id=c.id AND e.status='APPROVED' AND e.deleted_at IS NULL),0) AS lain,
      -- T-8: bagian biaya tingkat farm (gaji, listrik, sewa) yang jatuh ke batch
      -- ini. Dibaca dari v_cycle_overhead, sumber yang SAMA dengan v_cycle_cost.
      -- Jangan dihitung ulang di sini: rumus pakan pernah ditulis dua kali dan
      -- sempat berbeda Rp 1.351, sehingga rincian biaya tidak berjumlah sama
      -- dengan totalnya.
      COALESCE((SELECT overhead FROM v_cycle_overhead vo WHERE vo.cycle_id=c.id),0) AS overhead
    FROM cycle c WHERE c.id=$1`, [cycle.id]),
    rows(`
    SELECT e.id, e.created_at, e.category::text AS kat, e.amount, e.vendor, e.ref_no, e.status::text AS status,
           (SELECT name FROM app_user u WHERE u.id=e.created_by) AS oleh,
           EXISTS (SELECT 1 FROM attachment a WHERE a.entity_type='expense' AND a.entity_id=e.id) AS ada_nota
      FROM expense e WHERE e.cycle_id=$1 AND e.deleted_at IS NULL ORDER BY e.created_at DESC`, [cycle.id]),
  ]) : [[], [], [], [], [], [], [], null, [], [], null, []];

  // --- pemetaan ke bentuk prototype ---
  const feedRecords = [];
  const bySuper = {};
  feedAll.filter(f => f.type === 'USAGE').forEach(f => { if (f.supersedes_id) bySuper[f.supersedes_id] = f; });
  feedAll.filter(f => f.type === 'USAGE' && f.status !== 'SUPERSEDED').forEach(f => {
    // telusuri rantai versi ke belakang
    const chain = []; let cur = f;
    while (cur.supersedes_id) { const p = feedAll.find(x => x.id === cur.supersedes_id); if (!p) break; chain.unshift(cur); cur = p; }
    const root = cur;
    feedRecords.push({ id: f.id, rootId: root.id, date: f.occurred_at, barn: bcode[f.barn_id], jenis: f.jenis, sesi: f.sesi, kg: -Number(root.qty_kg), user: root.created_by, photo: f.photo || root.photo, photoSource: f.photo_source || root.photo_source, status: f.status, locked: f.locked,
      versions: chain.map(v => ({ id: v.id, kg: -Number(v.qty_kg), reason: v.reason || 'Koreksi', approvedBy: v.updated_by || v.created_by, date: v.created_at })) });
  });
  // `jenis` ikut dikirim supaya layar bisa menampilkan riwayat harga per jenis pakan
  // dan memakai harga nota TERBARU untuk proyeksi. Kolomnya sudah diambil query di
  // atas; tidak ada query, tabel, atau view baru.
  const feedPurchases = feedAll.filter(f => f.type === 'PURCHASE').map(p => ({ id: p.id, date: p.occurred_at, qty: Number(p.qty_kg), price: fin ? Number(p.price_per_kg) : null, jenis: p.jenis, vendor: p.vendor, ref: p.ref_no, user: p.created_by, status: p.status, locked: p.locked, note: p.reason }));
  const feedAdjust = feedAll.filter(f => f.type === 'ADJUSTMENT' && f.status === 'APPROVED').map(a => ({ id: a.id, date: a.occurred_at, qty: Number(a.qty_kg), reason: a.reason, user: a.created_by }));

  const anomalyState = {};
  anomalies.forEach(a => { anomalyState[a.dedupe_key] = { status: a.status, note: a.verify_note, by: a.verified_by }; });

  /* Jatah gram per umur: pakem farm, kecuali batch punya jatah khusus. */
  const pakem = cfg.pakem_pakan || [];
  const jatahUmur = (plan, umur) => { const r = (plan || pakem).find(x => umur >= +x[0] && umur <= +x[1]); return r ? +r[2] : null; };

  return {
    now: new Date().toISOString(),
    master: {
      // Harga pakan yang BENAR-BENAR dibayar, rata-rata tertimbang dari nota pembelian.
      // Tidak ada harga isian: harga DOD dan pakan diketik dari nota tiap pembelian.
      // Harga: hanya peran keuangan. Non-keuangan dapat 0 sehingga proyeksi
      // biaya dan HPP tidak bisa dihitung di layar mereka.
      hargaPakanRata: fin ? +(hargaPakanRata?.harga_kg || 0) : 0,
      hargaPakanJenis: hargaJenis.map(h => ({ jenis: h.jenis, harga: fin ? +h.harga_kg : null, kg: +h.kg_dibeli })),

      targetMortalitasPct: +cfg.target_mortalitas_pct,
      minStokPakanHari: +cfg.min_stok_pakan_hari, fotoWajib: !!cfg.foto_wajib, jamKerja: [cfg.jam_kerja.mulai, cfg.jam_kerja.selesai],
      kontakWhatsapp: cfg.kontak_whatsapp || '', kontakEmail: cfg.kontak_email || '',
      kontakAlamat: cfg.kontak_alamat || '', kontakJam: cfg.kontak_jam || '',
      batasMortalitasHarian: +cfg.batas_mortalitas_harian, batasPakanPct: +cfg.batas_deviasi_pakan_pct, batasSelisihKg: +cfg.batas_selisih_opname_kg,
      ambangApprovalRp: +cfg.ambang_approval_rp,
      // Batas hari nota boleh dimundurkan sebelum jadi koreksi (butuh alasan + persetujuan Owner).
      batasBackdateHari: +(cfg.batas_backdate_hari ?? 7),
      // Zona waktu farm: layar menghitung tanggal kalender dengan ini, bukan zona perangkat.
      zonaWaktu: cfg.zona_waktu || 'Asia/Jakarta',
      pakemPakan: (cfg.pakem_pakan || []).map(r => +r[2]), jadwalTimbangHari: +(cfg.jadwal_timbang_hari || 0),
      bawaan,
    },
    farm: { id: farm.id, name: farm.name, location: farm.location },
    users: users.map(u => ({ id: u.id, name: u.name, role: u.role, barn: bcode[u.barn_id] || null, active: u.is_active, phone: u.phone, email: u.email, lastLogin: u.last_login_at, archived: !!u.archived_at })),
    barns: barns.map(b => ({ id: b.code, uuid: b.id, name: b.name, cap: b.capacity, note: b.note, active: b.is_active,
      /* Target mortalitas khusus kandang ini (migrasi 025). null = ikut target farm. */
      targetMati: b.target_mort_pct == null ? null : +b.target_mort_pct })),
    /* Mortalitas tiap kandang berjalan vs target yang berlaku, lengkap dengan
       asal targetnya (batch / kandang / farm) supaya layar bisa menyebutkannya. */
    /* Bentuknya DISAMAKAN PERSIS dengan popTx dan mortality di atas, supaya
       layar bisa menukar sumber datanya tanpa menulis ulang perhitungannya. */
    farmPopTx: farmPopRows.map(t => ({ id: t.id, date: t.occurred_at,
      type: t.type === 'DOD_IN' ? 'DOD_MASUK' : t.type === 'DEATH' ? 'KEMATIAN' : t.type === 'SALE' ? 'PENJUALAN'
          : t.type === 'TRANSFER_IN' ? 'TRANSFER_MASUK' : t.type === 'TRANSFER_OUT' ? 'TRANSFER_KELUAR'
          : t.type === 'HARVEST' ? 'PANEN' : t.type,
      barn: bcode[t.barn_id], qty: t.qty, user: t.created_by, ref: t.ref_id, batch: t.cycle_code, locked: true })),
    farmMortality: farmMortRows.map(m => ({ id: m.id, date: m.occurred_at, barn: bcode[m.barn_id], qty: m.qty,
      cause: m.cause, kind: m.kind || 'MATI', note: m.note, photo: m.photo, photoSource: m.photo_source,
      user: m.created_by, status: m.status, locked: m.locked, batch: m.cycle_code })),
    targetMatiKandang: targetMatiRows.map(r => ({
      barn: r.barn_code, nama: r.barn_name, batch: r.cycle_code,
      pop: r.population, dod: r.dod, mati: r.mati, afkir: r.afkir,
      matiPct: r.mati_pct == null ? null : +r.mati_pct,
      target: r.target_pct == null ? null : +r.target_pct, dari: r.target_dari })),
    barnPop,
    barnGerakTerakhir,
    batches: batches.map(b => ({
      id: b.cycle_id, code: b.code, barn: b.barn_code, barnName: b.barn_name, barnNames: b.barn_names,
      dodDate: b.dod_date, dodQty: b.dod_qty, targetDays: b.target_days, stage: b.stage,
      population: b.population, umur: b.umur_hari, panen: b.perkiraan_panen, sisaHari: b.sisa_hari,
    })),
    cycle: cycle ? { id: cycle.id, code: cycle.code, breed: cycle.breed, status: 'AKTIF', dodDate: cycle.dod_date, dodQty: cycle.dod_qty, dodPrice: fin ? +cycle.dod_price : null, dodWeight: +cycle.dod_weight_kg, targetDays: cycle.target_days, targetWeight: [+cycle.target_weight_min, +cycle.target_weight_max], targetCurve: cycle.target_curve || [], jatah: cycle.feed_plan ? cycle.feed_plan.map(r => +r[2]) : null, targetMort: +cycle.target_mort_pct, targetMortManual: !!cycle.target_mort_manual, stage: cycle.stage, asalDod: cycle.dod_source || null, createdBy: cycle.created_by, createdAt: cycle.created_at } : null,
    prevCycles: prevCycles.map(c => ({
      id: c.cycle_id, code: c.code, breed: c.breed, status: c.status === 'CLOSED' ? 'DITUTUP' : 'SELESAI',
      dodDate: c.dod_date, dodQty: c.dod_qty, closedAt: c.closed_at, closeNote: c.close_note,
      days: c.days, deaths: c.deaths, harvested: c.harvested, sold: c.sold, carriedOut: c.carried_out,
      mortPct: c.mortality_pct == null ? null : +c.mortality_pct, feedKg: +c.feed_kg,
      harvestQty: c.harvest_qty, harvestKg: +c.harvest_weight_kg, harvestAvgKg: c.harvest_avg_kg == null ? null : +c.harvest_avg_kg,
      fcr: c.fcr_final == null ? null : +c.fcr_final,
      revenue: fin ? +c.revenue : null, cost: fin ? +c.cost_total : null, profit: fin ? +c.profit : null,
      asalDod: c.dod_source || null,
    })),
    /* Rekap hasil per penjual DOD. Hanya batch yang asal DOD-nya diisi; lihat
       v_asal_dod di migrasi 023. Kosong selama belum ada yang mengisi. */
    asalDod: asalDodRows.map(r => ({
      penjual: r.penjual, batch: r.jumlah_batch, dod: r.dod_total,
      mortPct: r.mortalitas_pct == null ? null : +r.mortalitas_pct,
      fcr: r.fcr_rata == null ? null : +r.fcr_rata,
      pertama: r.dod_pertama, terakhir: r.dod_terakhir,
    })),
    cycleSummary: cycleSummary ? {
      days: cycleSummary.days, deaths: cycleSummary.deaths, harvested: cycleSummary.harvested,
      sold: cycleSummary.sold, remaining: cycleSummary.remaining,
      mortPct: cycleSummary.mortality_pct == null ? null : +cycleSummary.mortality_pct,
      feedKg: +cycleSummary.feed_kg, harvestQty: cycleSummary.harvest_qty, harvestKg: +cycleSummary.harvest_weight_kg,
      harvestAvgKg: cycleSummary.harvest_avg_kg == null ? null : +cycleSummary.harvest_avg_kg,
      fcr: cycleSummary.fcr_final == null ? null : +cycleSummary.fcr_final,
      revenue: fin ? +cycleSummary.revenue : null, cost: fin ? +cycleSummary.cost_total : null,
      profit: fin ? +cycleSummary.profit : null, dodCost: fin ? +cycleSummary.dod_cost : null,
    } : null,
    popTx: popTx.map(t => ({ id: t.id, date: t.occurred_at, type: t.type === 'DOD_IN' ? 'DOD_MASUK' : t.type === 'DEATH' ? 'KEMATIAN' : t.type === 'SALE' ? 'PENJUALAN' : t.type === 'TRANSFER_IN' ? 'TRANSFER_MASUK' : t.type === 'TRANSFER_OUT' ? 'TRANSFER_KELUAR' : t.type === 'HARVEST' ? 'PANEN' : t.type, barn: bcode[t.barn_id], qty: t.qty, user: t.created_by, ref: t.ref_id, locked: true })),
    mortality: mortality.map(m => ({ id: m.id, date: m.occurred_at, barn: bcode[m.barn_id], qty: m.qty, cause: m.cause, kind: m.kind || 'MATI', note: m.note, photo: m.photo, photoSource: m.photo_source, user: m.created_by, status: m.status, locked: m.locked })),
    feedRecords, feedPurchases, feedAdjust,
    feedOpname: opname.map(o => ({ id: o.id, date: o.occurred_at, physical: +o.physical_kg, theoretical: +o.theoretical_kg, user: o.created_by, note: o.note })),
    weights: weights.map(w => ({ id: w.id, date: w.occurred_at, barn: bcode[w.barn_id], n: w.sample_n, total: +w.total_kg, avg: +w.avg_kg, user: w.created_by, photo: w.photo, photoSource: w.photo_source, locked: w.locked })),
    health: health.map(h => ({ id: h.id, date: h.occurred_at, barn: h.barn_id ? bcode[h.barn_id] : 'ALL', type: { VACCINE: 'Vaksinasi', VITAMIN: 'Vitamin', TREATMENT: 'Pengobatan', OBSERVATION: 'Observasi' }[h.type], item: h.item, dose: h.dose || '-', user: h.created_by, note: h.note || '' })),
    barnCond: barnCond.map(c => ({ id: c.id, date: c.occurred_at, barn: bcode[c.barn_id], temp: +c.temp_c, hum: +c.humidity_pct, litter: c.litter, water: c.water, behavior: c.behavior, user: c.created_by, note: c.note || '' })),
    expenses: expenses.map(e => ({ id: e.id, date: e.occurred_at, cat: { DOD: 'DOD', PAKAN: 'Pakan', VITAMIN: 'Vitamin', OBAT: 'Obat', LISTRIK: 'Listrik', GAS: 'Gas', SEKAM: 'Sekam', TENAGA_KERJA: 'Tenaga kerja', TRANSPORT: 'Transport', PERALATAN: 'Peralatan', MAINTENANCE: 'Maintenance', LAIN: 'Biaya lain' }[e.category], amount: +e.amount, vendor: e.vendor, ref: e.ref_no, user: e.created_by, status: e.status, locked: e.locked })),
    inventory: inventory.map(i => ({ ...i, qty: +i.qty, min: +i.min, avgW: i.avgW ? +i.avgW : undefined })),
    invTx: invTx.map(t => ({ id: t.id, date: t.occurred_at, item: t.inventory_id, type: t.type, qty: Math.abs(+t.qty), ref: t.ref_type === 'order_item' ? 'Order' : (t.note || t.ref_type), user: t.created_by })),
    // Harga produk juga nominal, jadi ikut ditutup untuk peran non-keuangan.
    // CATATAN: harga yang sama tetap terbuka tanpa login di /api/v1/public/products
    // karena dipakai website penjualan. Penutupan di sini membuat layar peran
    // non-keuangan bersih, bukan membuat harganya rahasia.
    products: products.map(p => ({ id: p.id, name: p.name, desc: p.description, unit: 'ekor', price: fin ? +p.price_per_kg : null, minOrder: p.min_order, stockFrom: p.stock_source === 'POPULATION' ? 'population' : p.inventory_id, avgW: +p.avg_weight_kg, type: p.type, pricePerKg: fin ? +p.price_per_kg : null, avgWeightKg: +p.avg_weight_kg, stockSource: p.stock_source, inventoryId: p.inventory_id, published: p.is_published })),
    customers: customers.map(c => ({ id: c.id, name: c.name, phone: c.phone, type: c.type })),
    orders: orders.map(o => ({ id: o.code, uuid: o.id, date: o.created_at, customer: o.customer_id, product: o.product_id, qty: o.qty, weight: o.weight_kg ? +o.weight_kg : null, priceKg: fin ? +o.price_per_kg : null, pay: o.payment_status, ship: o.shipping_status, status: o.status, user: o.created_by, source: o.source, pickup: o.pickup_date, address: o.address, note: o.note, decidedBy: o.decided_by, decidedAt: o.decided_at, barn: bcode[o.barn_id] })),
    // Permintaan koreksi bisa menyangkut field harga (price_per_kg, amount).
    // Nilai lama/barunya nominal keuangan, jadi untuk peran non-keuangan
    // nilainya tidak dikirim dan alasannya disensor. Jenis koreksi, siapa yang
    // minta, dan statusnya tetap terlihat supaya alur persetujuan tetap jalan.
    corrections: corrections.map(c => { const uang = /price|harga|amount|biaya|nilai/i.test(c.field || '');
      return { id: c.id, type: { feed_transaction: 'FEED', mortality: 'MORT', weight_record: 'WEIGHT' }[c.entity_type], recordId: c.entity_id, field: c.field, oldVal: (fin || !uang) ? c.old_value : null, newVal: (fin || !uang) ? c.new_value : null, reason: fin ? c.reason : sensorRupiah(c.reason), photo: c.photo, requestedBy: c.requested_by, requestedAt: c.requested_at, status: c.status, decidedBy: c.decided_by, decidedAt: c.decided_at, rejectReason: fin ? c.reject_reason : sensorRupiah(c.reject_reason) }; }),
    // Jejak audit tetap utuh untuk peran keuangan. Untuk peran lain, nominal
    // rupiah di dalam `detail` disensor di SERVER — bukan disembunyikan di
    // layar — karena detail ditulis dengan nominal untuk hampir semua aksi uang
    // ("Biaya OBAT Rp 400.000 disetujui", "Pembelian pakan 500 kg — Rp 2.775.000").
    // Siapa, kapan, aksi apa, dan keterangan operasionalnya tetap terbaca.
    audit: audit.map(a => ({ id: a.id, date: a.occurred_at, user: a.actor_id || 'SYSTEM', action: a.action, entity: a.entity_type, detail: fin ? a.detail : sensorRupiah(a.detail), ref: a.entity_id || '-', hash: a.hash ? a.hash.slice(0, 8) : '' })),
    anomalyState,
    harian: harian.map(h => ({ code: h.code, barn: h.barn_code, barnName: h.barn_name, pop: h.population, umur: h.umur_hari, masuk: h.masuk,
      pakanHariIni: +h.pakan_hari_ini, pakanKemarin: +h.pakan_kemarin, pakanRata3: h.hari_tercatat ? +h.pakan_3hari / h.hari_tercatat : null,
      mati: h.mati, matiHariIni: h.mati_hari_ini,
      pakanPagi: +h.pakan_pagi, pakanSore: +h.pakan_sore, pakanTotal: +h.pakan_total,
      // Jatah kandang ini: gram sesuai umurnya x bebek hidup di kandang ini, dibagi dua (pagi & sore).
      ...(() => { const g = jatahUmur(h.feed_plan, h.umur_hari); const kg = g != null ? g * h.population / 1000 : null; return { jatahGram: g, jatahKg: kg, jatahSesiKg: kg != null ? kg / 2 : null, jatahKhusus: !!h.feed_plan }; })(),
      bobot: h.bobot_akhir == null ? null : +h.bobot_akhir, hariSejakTimbang: h.hari_sejak_timbang == null ? null : +h.hari_sejak_timbang,
      // FCR kandang = pakan terpakai / pertambahan bobot hidup. Bobot DOD dikurangkan kalau ditimbang.
      ...(() => { if (h.bobot_akhir == null) return { fcr: null }; const hidup = h.population * +h.bobot_akhir; const awal = h.dod_weight_kg > 0 ? h.masuk * +h.dod_weight_kg : 0; const tambah = hidup - awal; return { fcr: tambah > 0 && +h.pakan_total > 0 ? +h.pakan_total / tambah : null, fcrTanpaDod: !(h.dod_weight_kg > 0) }; })() })),
    mortUmur: mortUmur.map(m => ({ umur: +m.umur, n: m.n, mati: m.mati, afkir: m.afkir })),
    mortSebab: mortSebab.map(m => ({ sebab: m.cause, kind: m.kind, n: m.n })),
    stokPakanFarm: +stokFarm.kg,
    batchHabis: batchHabisRows.map(r => ({ code: r.code })),
    fcrSeri: fcrSeri.map(w => { const hidup = w.pop * +w.avg_kg; const awal = w.dod_weight_kg > 0 ? w.masuk * +w.dod_weight_kg : 0; const tambah = hidup - awal;
      return { date: w.occurred_at, barn: bcode[w.barn_id], umur: +w.umur, pop: w.pop, bobot: +w.avg_kg, pakan: +w.pakan, fcr: tambah > 0 && +w.pakan > 0 ? +w.pakan / tambah : null }; }),
    panen: panen.map((x, i) => ({ code: x.code, inv: `INV-${String(cycle.code).replace(/\D/g, '')}-${String(i + 1).padStart(2, '0')}`, date: x.created_at, pembeli: x.pembeli || 'Pengepul', hp: x.hp && x.hp !== '-' ? x.hp : '',
      barn: bcode[x.barn_id], qty: x.qty, kg: +x.weight_kg, harga: fin ? +x.price_per_kg : null, total: fin ? Math.round(+x.weight_kg * +x.price_per_kg) : null, pay: x.payment_status, note: x.note, timbangan: x.timbangan || null, oleh: x.oleh })),
    // Nominal biaya hanya untuk peran keuangan. Kategori, status, dan bukti nota
    // tetap dikirim supaya anak kandang dan manager masih bisa melihat APA yang
    // sudah dicatat dan apakah notanya ada — tanpa melihat berapa rupiahnya.
    biaya: biaya.map(e => ({ id: e.id, date: e.created_at, kat: e.kat, jumlah: fin ? Math.round(+e.amount) : null, ket: e.vendor && e.vendor !== '-' ? e.vendor : '', status: e.status, oleh: e.oleh, nota: e.ada_nota })),
    /* Uang batch ini: modal, biaya, dan laba. HANYA peran keuangan.
       Dulu dikirim ke semua peran, sehingga penjagaan pada cycleSummary.cost
       tidak ada artinya — angka yang sama bisa disusun ulang dari sini, dan
       memang itulah yang dilakukan cadangan di calc.modal(). */
    uang: fin && uangRow ? { panen: Math.round(+uangRow.panen), dod: Math.round(+uangRow.dod), pakan: Math.round(+uangRow.pakan), pakanKg: +uangRow.pakan_kg, lain: Math.round(+uangRow.lain), overhead: Math.round(+uangRow.overhead),
      laba: Math.round(+uangRow.panen - +uangRow.dod - +uangRow.pakan - +uangRow.lain) } : null,
    // Berapa kg pakan terpakai bukan angka keuangan — tetap dikirim untuk FCR
    // dan laporan pakan, terpisah dari nilai rupiahnya.
    pakanKg: uangRow ? +uangRow.pakan_kg : 0,
    stokPakanJenis: stokJenis.map(x => ({ jenis: x.jenis, beli: +x.beli, pakai: +x.pakai, stok: +x.stok })),
    pakaiFarmRata: pakaiFarm.hari ? +pakaiFarm.kg / pakaiFarm.hari : 0,
  };
}
