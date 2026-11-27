
/* =====================================================================
   AR-FARM — Interactive Prototype
   Single source of truth: DB. Every displayed number is derived from
   transactions in DB via the functions in `calc`. Nothing is hardcoded
   on the page. All data is DEMO DATA.
   ===================================================================== */
const D = (m,d,h=8,mi=0)=>new Date(2026,m-1,d,h,mi);
const fmtDate = d=>{d=d==null?d:(d instanceof Date?d:new Date(d));return tglSah(d)?d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}):'\u2014';};
const tglSah = d=>d instanceof Date&&!isNaN(d);
const fmtDT = d=>{d=d==null?d:(d instanceof Date?d:new Date(d));return tglSah(d)?d.toLocaleDateString('id-ID',{day:'numeric',month:'short'})+' '+d.toTimeString().slice(0,5):'\u2014';};
const fmtLong = d=>{d=d==null?d:(d instanceof Date?d:new Date(d));return tglSah(d)?d.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}):'\u2014';};
const rp = n=>'Rp '+Math.round(n).toLocaleString('id-ID');
const num = (n,dec=0)=>(n===null||n===undefined||n===''||Number.isNaN(Number(n)))?'\u2014':Number(n).toLocaleString('id-ID',{minimumFractionDigits:dec,maximumFractionDigits:dec});
const pct = (n,dec=1)=>num(n,dec)+'%';
const rpAtau = n=>(n==null||!Number.isFinite(+n))?'\u2014':rp(n);
const pctAtau = n=>(n==null||!Number.isFinite(+n))?'\u2014':pct(n);
const dayOf = d=>DB.cycle?Math.floor((d-DB.cycle.dodDate)/86400000)+1:0;
const dateOfDay = n=>DB.cycle?new Date(DB.cycle.dodDate.getTime()+(n-1)*86400000):new Date();
const esc = s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let _id = 1000; const nid = p=>p+'-'+(++_id);

/* ---------------- MASTER DATA (editable in Pengaturan) ---------------- */

/* ---------------- ROLES & PERMISSIONS ---------------- */
const ROLES = {
  OWNER:{label:'Owner',pages:['dashboard','siklus','populasi','pakan','pertumbuhan','kesehatan','keuangan','penjualan','stok','laporan','persetujuan','pengguna','pengaturan','audit','anomali'],approve:true,finance:true,manageUsers:true,masterData:true},
  MANAGER:{label:'Manager',pages:['dashboard','siklus','populasi','pakan','pertumbuhan','kesehatan','penjualan','stok','laporan','persetujuan','audit','anomali'],approve:true,finance:false,manageUsers:false,masterData:false},
  ADMIN:{label:'Admin',pages:['dashboard','siklus','populasi','pakan','pertumbuhan','kesehatan','keuangan','penjualan','stok','laporan','pengguna','pengaturan','audit'],approve:false,finance:true,manageUsers:true,masterData:true,inputSales:true,inputPurchase:true},
  ANAK_KANDANG:{label:'Anak Kandang',pages:['ak-home','ak-input','ak-kandang','ak-riwayat'],approve:false,finance:false},
};
const can = (perm)=> !!(state.user && ROLES[state.user.role][perm]);
const canPage = (p)=> !!(state.user && ROLES[state.user.role].pages.includes(p));

/* ---------------- DATA DARI SERVER ---------------- */
let DB=null;            // snapshot dari GET /api/v1/bootstrap (bentuk sama dengan prototype)
const API='/api/v1';
/* Permintaan ke server tidak boleh menunggu selamanya: di sinyal kandang yang
   putus-putus, layar bisa diam terus tanpa pesan. Lewat batas waktu, permintaan
   dibatalkan dan errornya dimunculkan supaya ada tombol "Coba lagi". */
const BATAS_TUNGGU=15000, BATAS_UNGGAH=60000;
async function api(path,opts={}){
  const batas=opts.body instanceof FormData?BATAS_UNGGAH:BATAS_TUNGGU;
  const ac=typeof AbortController!=='undefined'?new AbortController():null;
  const jam=ac?setTimeout(()=>ac.abort(),batas):null;
  let r;
  try{
    r=await fetch(API+path,Object.assign({credentials:'same-origin',signal:ac?ac.signal:undefined,headers:opts.body&&!(opts.body instanceof FormData)?{'Content-Type':'application/json'}:{}},opts));
  }catch(err){
    const lewat=!!(ac&&ac.signal.aborted);
    const e=new Error(lewat?`Server tidak menjawab dalam ${Math.round(batas/1000)} detik.`:'Tidak bisa menghubungi server. Periksa koneksi internet.');
    e.timeout=lewat;e.jaringan=true;throw e;
  }finally{if(jam)clearTimeout(jam);}
  const j=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error(j.message||('HTTP '+r.status));e.code=j.code;e.status=r.status;throw e;}
  return j;
}
const pesanGagal=e=>e&&e.status===401?'Sesi sudah habis. Silakan masuk lagi.':(e&&e.message)||'Tidak bisa menghubungi server.';
const toDate=v=>v==null?v:(v instanceof Date?v:new Date(v));
function hydrate(b){
  const d=x=>{if(!x)return x;['date','dodDate','createdAt','requestedAt','decidedAt','lastLogin','pickup'].forEach(k=>{if(x[k]!==undefined)x[k]=toDate(x[k]);});if(x.versions)x.versions.forEach(v=>v.date=toDate(v.date));return x;};
  ['users','popTx','mortality','feedRecords','feedPurchases','feedAdjust','feedOpname','weights','health','barnCond','expenses','invTx','orders','corrections','audit','prevCycles'].forEach(k=>(b[k]||[]).forEach(d));
  if(b.cycle){d(b.cycle);b.cycle.dodDate.setHours(0,0,0,0);}
  (b.batches||[]).forEach(x=>{x.dodDate=toDate(x.dodDate);x.panen=toDate(x.panen);});
  b.products.forEach(p=>p.priceKg=p.price);
  return b;
}
async function loadDB(batch){
  const q = batch||state.batch ? '?batch='+encodeURIComponent(batch||state.batch) : '';
  const b=await api('/bootstrap'+q);
  DB=hydrate(b);MASTER=b.master;DEMO_TODAY=new Date(b.now);
  // batch yang benar-benar dibuka server (bisa beda kalau yang diminta sudah ditutup)
  state.batch = DB.cycle ? DB.cycle.code : null;
  return DB;}
let MASTER={};let DEMO_TODAY=new Date();
/* ---------------- DERIVED CALCULATIONS (single source of truth) ---------------- */
const calc = {
  day(){return DB.cycle?dayOf(DEMO_TODAY):0;},
  popTxUpTo(date){return DB.popTx.filter(t=>t.date<=date);},
  population(barn=null,date=DEMO_TODAY){return DB.popTx.filter(t=>t.date<=date&&(!barn||t.barn===barn)).reduce((s,t)=>s+t.qty,0);},
  popBalance(barn=null){const g=t=>DB.popTx.filter(x=>x.type===t&&(!barn||x.barn===barn)).reduce((s,x)=>s+Math.abs(x.qty),0);return{dod:g('DOD_MASUK'),tIn:g('TRANSFER_MASUK'),mati:g('KEMATIAN'),jual:g('PENJUALAN'),panen:g('PANEN'),tOut:g('TRANSFER_KELUAR'),akhir:calc.population(barn)};},
  mortTotal(barn=null){return DB.mortality.filter(m=>!barn||m.barn===barn).reduce((s,m)=>s+m.qty,0);},
  mortPct(){return DB.cycle&&DB.cycle.dodQty?calc.mortTotal()/DB.cycle.dodQty*100:0;},
  mortByDay(){const a=Array(calc.day()).fill(0);DB.mortality.forEach(m=>{const d=dayOf(m.date);if(d>=1&&d<=a.length)a[d-1]+=m.qty;});return a;},
  feedVal(r){return r.versions.length?r.versions[r.versions.length-1].kg:r.kg;}, // active version
  feedByDay(){const a=Array(calc.day()).fill(0);DB.feedRecords.forEach(r=>{const d=dayOf(r.date);if(d>=1&&d<=a.length)a[d-1]+=calc.feedVal(r);});return a;},
  feedTotal(barn=null){return DB.feedRecords.filter(r=>!barn||r.barn===barn).reduce((s,r)=>s+calc.feedVal(r),0);},
  feedPurchased(){return DB.feedPurchases.filter(p=>p.status==='APPROVED').reduce((s,p)=>s+p.qty,0);},
  feedAdjusted(){return DB.feedAdjust.reduce((s,a)=>s+a.qty,0);},
  // Stok gudang SELURUH farm (semua kandang, semua batch) — dihitung server.
  feedStockTheory(){return DB&&DB.stokPakanFarm!=null?+DB.stokPakanFarm:calc.feedPurchased()+calc.feedAdjusted()-calc.feedTotal();},
  pakaiFarmRata(){return DB&&+DB.pakaiFarmRata>0?+DB.pakaiFarmRata:0;},
  stokKritis(){const d=calc.feedDaysLeft();return d!=null&&MASTER.minStokPakanHari>0&&d<MASTER.minStokPakanHari;},
  feedOpnameLast(){return DB.feedOpname[DB.feedOpname.length-1];},
  feedStockAtDate(date){const bought=DB.feedPurchases.filter(p=>p.status==='APPROVED'&&p.date<=date).reduce((s,p)=>s+p.qty,0);const adj=DB.feedAdjust.filter(a=>a.date<=date).reduce((s,a)=>s+a.qty,0);const used=DB.feedRecords.filter(r=>r.date<=date).reduce((s,r)=>s+calc.feedVal(r),0);return bought+adj-used;},
  feedDiff(){const op=calc.feedOpnameLast();if(!op)return null;const theory=op.theoretical!=null?op.theoretical:calc.feedStockAtDate(op.date);return{op,theory,diff:theory-op.physical};},
  /* Hari mana saja yang PUNYA catatan pakan. Dibedakan dari hari yang
     tercatat 0 kg — yang pertama berarti belum dicatat, yang kedua berarti
     memang tidak diberi pakan. */
  feedHariAda(){const a=Array(calc.day()).fill(false);
    (DB.feedRecords||[]).forEach(r=>{const d=dayOf(r.date);if(d>=1&&d<=a.length)a[d-1]=true;});
    return a;},
  /* Rata-rata pemakaian 7 hari terakhir (tidak termasuk hari ini).
     DIPERBAIKI (T-5): dulu membagi dengan 7 hari penuh, sehingga hari yang
     BELUM DICATAT ikut jadi 0 kg dan menyeret rata-rata turun. Akibatnya
     pencatatan yang bolong membuat angka terlihat lebih bagus — arah yang
     paling berbahaya untuk sebuah sistem kontrol. Sekarang pembaginya hanya
     hari yang benar-benar ada catatannya. */
  feedAvg7(){const a=calc.feedByDay(), ada=calc.feedHariAda();
    const s=a.slice(-8,-1), t=ada.slice(-8,-1);
    let jml=0,n=0;
    for(let i=0;i<s.length;i++) if(t[i]){jml+=s[i];n++;}
    return n?jml/n:0;},
  /* Seberapa lengkap pencatatan 7 hari terakhir. Dipakai layar untuk memberi
     peringatan: rata-rata dari 3 hari tidak sekuat rata-rata dari 7 hari. */
  feedCatatan7(){const t=calc.feedHariAda().slice(-8,-1);
    const dicatat=t.filter(Boolean).length;
    return {dicatat,dari:t.length,lengkap:t.length>0&&dicatat===t.length,
            kosong:t.length-dicatat};},
  feedToday(){return calc.feedByDay().slice(-1)[0];},
  // Belum ada catatan pemakaian = belum bisa bilang cukup berapa hari.
  feedDaysLeft(){const r=calc.pakaiFarmRata();return r>0?calc.feedStockTheory()/r:null;},
  avgWeight(barn=null){const ws=DB.weights.filter(w=>!barn||w.barn===barn);if(!ws.length)return null;const last=ws[ws.length-1].date;const s=ws.filter(w=>w.date.getTime()===last.getTime());const n=s.reduce((x,w)=>x+w.n,0);return s.reduce((x,w)=>x+w.total,0)/n;},
  /* Rata-rata bobot per HARI. Beberapa catatan di hari yang sama digabung
     dengan pembobotan jumlah sampel, bukan dirata-rata mentah — menimbang 50
     ekor tidak boleh sebobot menimbang 5 ekor.
     barn=null berarti seluruh kandang pada siklus ini. */
  weightSeries(barn=null){const m={};DB.weights.filter(w=>!barn||w.barn===barn).forEach(w=>{const d=dayOf(w.date);m[d]=m[d]||{n:0,t:0};m[d].n+=w.n;m[d].t+=w.total;});return Object.keys(m).map(Number).sort((a,b)=>a-b).map(d=>({day:d,avg:m[d].t/m[d].n}));},
  /* Pertambahan bobot harian (ADG), gram per ekor per hari.
     DIPERBAIKI 27 Nov 2026. Versi lama dihitung langsung di halaman dengan
     mengambil baris timbangan ke-terakhir dan ke-3-dari-belakang, lalu
     diberi label "7 hari terakhir". Dua masalah:
       1. rentangnya bukan 7 hari, melainkan "tiga timbangan terakhir" —
          kalau menimbang seminggu sekali, itu 14 hari tapi tetap ditulis 7;
       2. baris mentah bisa berasal dari KANDANG BERBEDA, jadi bobot Kandang A
          dikurangi bobot Kandang C — hasilnya tidak berarti apa-apa.
     Sekarang memakai seri per hari yang sudah digabung per kandang, dan
     mengembalikan rentang yang SEBENARNYA dipakai supaya layar menulis
     angka hari yang jujur, bukan angka yang diasumsikan. */
  adg(barn=null,jendela=7){
    const s=calc.weightSeries(barn);
    if(s.length<2)return null;
    const akhir=s[s.length-1];
    // titik awal: timbangan paling lama yang masih di dalam jendela
    let awal=s.slice(0,-1).find(p=>akhir.day-p.day<=jendela);
    // tidak ada yang masuk jendela -> pakai timbangan sebelumnya, dan sebut rentang aslinya
    if(!awal)awal=s[s.length-2];
    const hari=akhir.day-awal.day;
    if(!(hari>0))return null;
    return {g:(akhir.avg-awal.avg)/hari*1000,hari,dariHari:awal.day,sampaiHari:akhir.day,
            dalamJendela:hari<=jendela};},
  // Angka yang belum pernah disetel pemilik farm tidak dipakai menghitung apa pun.
  bawaan(k){return (MASTER.bawaan||[]).includes(k);},
  // Target milik BATCH, diketik pemilik saat batch dibuat. Bukan dari Pengaturan.
  targetBobot(){const t=DB.cycle&&DB.cycle.targetWeight;return t&&t[0]>0?t[0]:null;},
  targetBobotMax(){const t=DB.cycle&&DB.cycle.targetWeight;return t&&t[1]>0?t[1]:calc.targetBobot();},
  bobotDod(){const w=DB.cycle?+DB.cycle.dodWeight||0:0;return w>0?w:null;},
  /* Pembanding FCR: rata-rata batch yang sudah selesai. Kalau belum ada
     batch selesai, FCR tetap ditampilkan tapi tidak dinilai bagus/jelek. */
  fcrBatchLalu(){const v=(DB.prevCycles||[]).map(c=>c.fcr).filter(x=>x>0);return v.length?v.reduce((a,b)=>a+b,0)/v.length:0;},
  /* Garis target batch ini: dari titik awal ke target panen.
     Titik awal = bobot DOD kalau ditimbang, kalau tidak dari timbangan sampel
     pertama — tetap data Abdur sendiri, bukan angka karangan. */
  kurva(){if(!DB.cycle)return [];const tb=calc.targetBobot();const hp=DB.cycle.targetDays;
   if(!tb||!hp)return [];
   const dod=calc.bobotDod();
   if(dod!=null)return [[1,dod],[hp,tb]];
   const w=(DB.weights||[]).slice().sort((a,b)=>a.date-b.date)[0];
   if(w){const d=dayOf(w.date);if(d<hp&&+w.avg<tb)return [[d,+w.avg],[hp,tb]];}
   return [];},
  adaKurva(){return calc.kurva().length>=2;},
  target(day){const c=calc.kurva();if(c.length<2)return null;if(day<=c[0][0])return c[0][1];for(let i=1;i<c.length;i++){if(day<=c[i][0]){const [d0,w0]=c[i-1],[d1,w1]=c[i];return w0+(w1-w0)*(day-d0)/(d1-d0);}}return c[c.length-1][1];},
  weightGap(){const a=calc.avgWeight();if(a==null)return null;const t=calc.target(calc.day());if(!t)return null;return (a-t)/t*100;},
  fcr(){const w0=calc.bobotDod();if(w0==null)return null;const feed=calc.feedTotal();const w=calc.avgWeight();if(w==null||calc.day()<7)return null;const bio=calc.population()*w-DB.cycle.dodQty*w0;if(bio<=0)return null;return{fcr:feed/bio,feed,bio};},
  fcrSeries(){const w0=calc.bobotDod();if(w0==null)return [];const ws=calc.weightSeries();const fb=calc.feedByDay();return ws.map(p=>{const feed=fb.slice(0,p.day).reduce((a,b)=>a+b,0);const pop=calc.population(null,dateOfDay(p.day));const bio=pop*p.avg-DB.cycle.dodQty*w0;return{day:p.day,fcr:bio>0?feed/bio:null};});},
  expensesApproved(){return DB.expenses.filter(e=>e.status==='APPROVED');},
  /* Biaya pakan BATCH INI = pakan yang benar-benar dimakan batch ini, dinilai dengan
     harga nota per jenis pakan. Dihitung server (v_cycle_cost / DB.uang.pakan).
     Dulu di sini dijumlahkan SELURUH pembelian pakan farm — padahal pembelian masuk
     stok farm (cycle_id NULL), sehingga setiap batch menanggung pembelian batch lain. */
  feedCost(){return DB.uang?+DB.uang.pakan||0:0;},
  /* Biaya DOD tersimpan di tabel cycle (dod_qty x dod_price), bukan di tabel expense,
     jadi dulu tidak pernah ikut terhitung sama sekali. */
  dodCost(){return DB.uang?+DB.uang.dod||0:(DB.cycleSummary&&DB.cycleSummary.dodCost!=null?+DB.cycleSummary.dodCost:0);},
  costByCat(){const m={};
    const d=calc.dodCost(); if(d>0)m['DOD']=d;
    const p=calc.feedCost(); if(p>0)m['Pakan']=p;
    // Biaya lain per kategori, hanya yang sudah disetujui — sama dengan yang
    // dijumlahkan v_cycle_cost, jadi rinciannya cocok dengan totalnya.
    calc.expensesApproved().filter(e=>e.cat!=='DOD'&&e.cat!=='Pakan')
      .forEach(e=>m[e.cat]=(m[e.cat]||0)+e.amount);
    /* T-8: bagian biaya tingkat farm (gaji, listrik, sewa) yang jatuh ke batch
       ini. Tanpa baris ini, rincian biaya tidak berjumlah sama dengan totalnya,
       karena v_cycle_cost sudah memasukkannya ke cost_total. */
    const oh=calc.overheadFarm(); if(oh>0)m['Gaji/listrik/sewa']=oh;
    return m;},
  /* Bagian biaya tingkat farm yang dibebankan ke batch ini, dibagi menurut
     ekor-hari. Dihitung server di v_cycle_overhead; layar hanya membacanya. */
  overheadFarm(){const u=DB.uang; return u&&u.overhead!=null?+u.overhead:0;},
  /* Modal berjalan batch ini. Server sudah menghitungnya di v_cycle_summary.cost_total
     (= biaya DOD + pakan terpakai + biaya disetujui). Layar membacanya, tidak menghitung
     ulang, supaya tidak ada dua angka untuk hal yang sama. */
  /* Apakah payload membawa data keuangan sama sekali. Untuk peran non-keuangan
     server memang tidak mengirimkannya (cycleSummary.cost, uang, expenses, dan
     harga semuanya null). Tanpa penjaga ini seluruh rantai cadangan di bawah
     berakhir di Rp 0 — angka yang terlihat sah padahal sebenarnya "tidak boleh
     dilihat". Lebih baik null, supaya layar menulis "—" dan bukan nol palsu. */
  adaDataKeuangan(){const s=DB.cycleSummary;
    return !!(DB.uang||(s&&s.cost!=null)||(DB.expenses&&DB.expenses.length));},
  modal(){if(!calc.adaDataKeuangan())return null;
    const s=DB.cycleSummary;
    if(s&&s.cost!=null&&Number.isFinite(+s.cost))return +s.cost;
    const u=DB.uang; if(u)return (+u.dod||0)+(+u.pakan||0)+(+u.lain||0)+(+u.overhead||0);
    return Object.values(calc.costByCat()).reduce((a,b)=>a+b,0);},
  /* Pembelian pakan tingkat FARM — bukan biaya batch mana pun. Dipisahkan supaya
     tidak lagi tercampur ke modal batch. */
  pembelianPakanFarm(){return (DB.feedPurchases||[]).filter(p=>p.status==='APPROVED')
    .reduce((s,p)=>s+p.qty*(p.price||0),0);},
  /* ---------------- Jatah pakan per umur ----------------
     Gram per ekor per hari: jatah khusus batch kalau ada, kalau tidak pakem farm.
     Bracket umurnya sama dengan LABEL_UMUR di layar Pengaturan:
     1-7, 8-14, 15-21, 22-28, dan 29 hari sampai panen. */
  jatahGram(umur){
    const j=(DB.cycle&&DB.cycle.jatah&&DB.cycle.jatah.length?DB.cycle.jatah:MASTER.pakemPakan)||[];
    if(j.length<5)return null;
    const g=+j[umur<=7?0:umur<=14?1:umur<=21?2:umur<=28?3:4];
    return Number.isFinite(g)&&g>0?g:null;},
  jatahKhususBatch(){return !!(DB.cycle&&DB.cycle.jatah&&DB.cycle.jatah.length);},
  /* Kebutuhan pakan dari besok sampai hari target, dihitung hari per hari:
     perkiraan bebek yang masih hidup x jatah gram menurut umurnya hari itu.
     DIPERBAIKI: dulu memakai calc.feedAvg7(), rata-rata pemakaian 7 hari.
     Rumus itu menghitung hari tanpa catatan sebagai 0 kg, sehingga pencatatan
     yang bolong membuat proyeksi — dan HPP — turun sendiri padahal pakannya
     tetap habis. Pakem adalah angka yang pemilik tetapkan sendiri dan tidak
     bisa dirusak kelalaian pencatatan.
     null = pakem belum lengkap, jadi kebutuhannya belum bisa dihitung. */
  kebutuhanPakanSisa(){
    if(!DB.cycle)return null;
    const hari=calc.day(), target=+DB.cycle.targetDays||0, pop=calc.population();
    if(!(pop>0)||!(target>hari))return {kg:0,hari:0};
    const l=hari>0?calc.mortPct()/hari:0;                       // % mati per hari
    const laju=Number.isFinite(l)&&l>0?l:0;
    let kg=0,n=0;
    for(let d=hari+1;d<=target;d++){
      const g=calc.jatahGram(d);
      if(g==null)return null;
      kg+=Math.max(0,Math.round(pop*(1-laju/100*(d-hari))))*g/1000; n++;
    }
    return {kg,hari:n};},
  /* Jenis pakan yang sedang dipakai batch ini, dari catatan pemakaian terakhir. */
  jenisPakanBatch(){const r=(DB.feedRecords||[]).filter(x=>x.jenis);
    return r.length?r[r.length-1].jenis:null;},
  /* Harga pakan TERBARU dari nota pembelian — bukan rata-rata tertimbang.
     Urutannya: nota terakhir untuk jenis yang dipakai batch ini, lalu nota
     terakhir apa pun, lalu null. Tidak ada harga isian di sistem ini: setiap
     harga berasal dari nota, jadi tidak ada angka karangan. */
  hargaPakanTerbaru(){
    const beli=(DB.feedPurchases||[]).filter(p=>p.status==='APPROVED'&&p.price>0)
      .slice().sort((a,b)=>toDate(a.date)-toDate(b.date));
    if(!beli.length)return null;
    const jns=calc.jenisPakanBatch();
    const sama=jns?beli.filter(p=>p.jenis===jns):[];
    const p=sama.length?sama[sama.length-1]:beli[beli.length-1];
    return {harga:+p.price,jenis:p.jenis||null,tanggal:p.date,vendor:p.vendor,
            cocokJenis:!!sama.length,jenisBatch:jns};},
  /* Apa yang belum cukup untuk memproyeksikan biaya sampai panen. Layar memakai
     daftar ini untuk menulis PERLU DATA beserta sebabnya — bukan menampilkan
     angka yang terlihat akurat padahal dasarnya belum ada. */
  kurangDataProyeksi(){
    if(!DB.cycle)return ['batch aktif'];
    if(!calc.adaDataKeuangan())return ['data keuangan (tidak tersedia untuk peran ini)'];
    const k=[];
    if(!(+DB.cycle.targetDays>0))k.push('target hari panen');
    if(!calc.targetBobot())k.push('target bobot panen batch ini');
    if(!(calc.population()>0))k.push('bebek yang masih hidup');
    if(!calc.hargaPakanTerbaru())k.push('harga pakan dari nota pembelian');
    if(calc.kebutuhanPakanSisa()===null)k.push('pakem jatah pakan yang lengkap');
    else if(!calc.jatahKhususBatch()&&calc.bawaan('pakemPakan'))k.push('pakem jatah pakan farm (sekarang masih angka awal, belum diisi pemilik)');
    return k;},
  /* Sisa biaya batch ini sampai panen — HANYA PAKAN.
     DIPERBAIKI dua kali:
     1. Dulu dikurangi stok pakan gudang. Itu salah: stok milik farm, bukan milik
        batch ini, dan kalau catatan pakai melebihi catatan beli stok jadi minus
        sehingga SELURUH kekurangan gudang dibebankan ke satu batch — pada data
        uji menghasilkan Rp 903 juta untuk batch yang sisa harinya nol.
     2. Dulu biaya non-pakan dibagi umur lalu dikalikan sisa hari, sehingga sekali
        beli sekam Rp 350.000 di hari ke-16 menjadi perkiraan Rp 415.000 lagi
        sampai panen. Biaya sekali bayar sekarang TIDAK diproyeksikan sama sekali.
        Akibatnya proyeksi ini sedikit terlalu rendah, dan layar menulis begitu. */
  projectedRemainingCost(){
    if(!DB.cycle)return 0;
    const n=calc.kebutuhanPakanSisa(), h=calc.hargaPakanTerbaru();
    if(!n||!h||!(n.kg>0))return 0;
    const v=n.kg*h.harga;
    return Number.isFinite(v)&&v>0?v:0;},
  hargaPakanDipakai(){const h=calc.hargaPakanTerbaru();return h?h.harga:0;},
  projectedCostIsEstimate(){return calc.kurangDataProyeksi().length>0;},
  /* Perkiraan jumlah ekor saat panen.
     Tiga hal yang dulu salah dan sudah dibetulkan:
       1. sisa hari tidak dibatasi -> lewat target, rumusnya MENAMBAH bebek
       2. calc.day() bisa 0 -> pembagian nol -> NaN merambat ke laba, ROI, dan HPP
       3. hasilnya bisa melebihi populasi sekarang, padahal bebek tidak bertambah */
  projectedPop(){
    const pop=calc.population();
    if(!DB.cycle||!(pop>0))return pop>0?pop:0;
    const hari=calc.day();
    if(!(hari>0))return pop;                                   // hari ke-0: belum ada laju
    const sisa=Math.max(0,(DB.cycle.targetDays||0)-hari);      // lewat target: sisa 0
    if(sisa===0)return pop;
    const laju=calc.mortPct()/hari;                            // % per hari
    if(!Number.isFinite(laju)||laju<=0)return pop;
    const sisaHidup=Math.round(pop*(1-laju/100*sisa));
    return Math.max(0,Math.min(pop,sisaHidup));},              // tidak pernah melebihi populasi
  sum(){return DB.cycleSummary||null;},

  /* ---------------- HPP: AKTUAL vs PROYEKSI ----------------
     Dua angka yang sengaja TIDAK dicampur.

     HPP AKTUAL = biaya yang benar-benar terjadi dibagi hasil panen yang benar-benar
       ada. Tidak ada satu pun estimasi di dalamnya.
         - populasi sudah habis  -> FINAL, ini angka penutup batch
         - panen baru sebagian   -> SEBAGIAN; penyebutnya baru panen pertama
                                    sedangkan pembilangnya biaya seluruh batch,
                                    jadi angkanya tinggi. Benar sebagai fakta,
                                    tapi BUKAN angka untuk menentukan harga.
         - belum ada panen       -> null, layar menulis PERLU DATA

     HPP PROYEKSI = (biaya nyata + sisa biaya sampai panen)
                    / (kg sudah dipanen + perkiraan kg bebek yang masih hidup)
       Inilah angka untuk keputusan harga selama batch masih berjalan. Kalau ada
       data yang belum cukup, hasilnya null — tidak ada angka setengah jadi.

     DIPERBAIKI (T-1): dulu hanya ada SATU angka. Pada panen sebagian ia membagi
     biaya seluruh batch dengan kg panen pertama saja. Pada data uji #S2 (panen
     100 dari 300 ekor) itu menghasilkan Rp 26.722/kg — di atas harga jual
     Rp 25.500 — sehingga layar menyatakan batch yang sehat sedang rugi.
     Hitungan yang benar untuk keputusan harga: Rp 11.059/kg. */
  hppAktual(){
    const s=DB.cycleSummary; if(!s)return null;
    const kg=+s.harvestKg>0?+s.harvestKg:0, ekor=+s.harvestQty>0?+s.harvestQty:0;
    if(!(kg>0)&&!(ekor>0))return null;                      // belum ada panen
    const m=calc.modal(); if(!Number.isFinite(m))return null;
    const sisaEkor=calc.population();
    return {jenis:sisaEkor>0?'sebagian':'final',modal:m,kg,ekor,sisaEkor,
            perKg:kg>0?m/kg:null,perEkor:ekor>0?m/ekor:null};},
  hppProyeksi(){
    if(!DB.cycle)return null;
    if(calc.kurangDataProyeksi().length)return null;
    const s=DB.cycleSummary;
    const kgPanen=s&&+s.harvestKg>0?+s.harvestKg:0;
    const ekorPanen=s&&+s.harvestQty>0?+s.harvestQty:0;
    const tb=calc.targetBobot(), sisaEkor=calc.projectedPop();
    const kg=kgPanen+sisaEkor*tb, ekor=ekorPanen+sisaEkor;
    if(!(kg>0)||!(ekor>0))return null;
    const nyata=calc.modal(); if(!Number.isFinite(nyata))return null;
    const sisa=calc.projectedRemainingCost(), m=nyata+sisa;
    if(!Number.isFinite(m))return null;
    return {jenis:kgPanen>0?'sebagian':'estimasi',modal:m,modalNyata:nyata,sisaBiaya:sisa,
            kg,ekor,kgPanen,ekorPanen,sisaEkor,perKg:m/kg,perEkor:m/ekor};},
  /* HPP yang dipakai untuk BEP dan simulasi: kalau batch sudah habis dipanen pakai
     yang aktual (sudah pasti); selama masih berjalan pakai yang proyeksi, karena
     yang itulah yang menanggung seluruh bebek, bukan cuma panen pertama. */
  hppBerlaku(){
    const a=calc.hppAktual();
    if(a&&a.jenis==='final')return {perKg:a.perKg,perEkor:a.perEkor,jenis:'final',
      kg:a.kg,ekor:a.ekor,modal:a.modal};
    const p=calc.hppProyeksi();
    if(p)return {perKg:p.perKg,perEkor:p.perEkor,jenis:p.jenis,kg:p.kg,ekor:p.ekor,modal:p.modal};
    return null;},
  // Nama lama, masih dipakai KPI halaman Keuangan. Mengembalikan HPP yang berlaku.
  hppKg(){const b=calc.hppBerlaku();return b&&b.perKg>0?{nilai:b.perKg,jenis:b.jenis,kg:b.kg}:null;},
  hppEkor(){const b=calc.hppBerlaku();return b&&b.perEkor>0?{nilai:b.perEkor,jenis:b.jenis,ekor:b.ekor}:null;},
  /* BEP harga jual per kg: di harga ini batch tidak untung tidak rugi. Selalu
     turunan dari HPP yang berlaku — tidak ada harga jual tetap di dalam kode. */
  bepKg(){return calc.hppKg();},
  /* Selisih harga jual produk sekarang terhadap BEP. Positif = masih untung.
     Harganya dari master Produk (calc.livePrice()), bisa diubah pemilik. */
  marginKg(){const b=calc.bepKg(), h=calc.livePrice();
    return b&&h>0?{bep:b.nilai,harga:h,selisih:h-b.nilai,jenis:b.jenis}:null;},
  /* ---------------- Simulasi harga panen ----------------
     Laba/rugi pada beberapa harga jual. Alat hitung what-if: harganya dari isian
     pengguna, tidak disimpan dan tidak dikirim ke server. */
  simulasiDasar(){const b=calc.hppBerlaku();
    return b&&b.perKg>0&&b.kg>0?{kg:b.kg,ekor:b.ekor,hppKg:b.perKg,jenis:b.jenis,modal:b.modal}:null;},
  simulasiHarga(daftar){
    const d=calc.simulasiDasar(); if(!d)return null;
    return (daftar||[]).map(x=>{const harga=+x||0, omzet=d.kg*harga;
      return {harga,omzet,laba:omzet-d.modal,marginKg:harga-d.hppKg,
              status:harga>d.hppKg?'untung':harga<d.hppKg?'rugi':'bep'};});},
  /* ---------------- Riwayat harga pakan ----------------
     Dari nota pembelian, per jenis pakan, berurutan tanggal, dengan selisih
     terhadap nota sebelumnya. Harga tiap nota tersimpan di barisnya sendiri
     (feed_transaction.price_per_kg) dan tabelnya append-only, jadi nota baru
     tidak pernah mengubah biaya batch yang sudah lalu. */
  /* ---- Mati vs afkir (migrasi 024) ----
     Dua-duanya mengurangi populasi dan dua-duanya rugi, tapi artinya beda:
     mati itu gejala, afkir itu keputusan peternak. Dicampur, persentase
     mortalitas tidak bisa dipakai menilai apa pun. */
  matiPisah(barn){
    const m=(DB.mortality||[]).filter(x=>!barn||x.barn===barn);
    const j=k=>m.filter(x=>(x.kind||'MATI')===k).reduce((s,x)=>s+(+x.qty||0),0);
    return {mati:j('MATI'),afkir:j('AFKIR'),total:j('MATI')+j('AFKIR')};},
  /* Target kematian yang BERLAKU, beserta asalnya.
     Urutan: batch -> kandang -> farm. Yang paling khusus menang, dan asalnya
     ikut dikembalikan supaya layar bisa menyebutkan angka mana yang sedang
     dipakai menilai — Abdur tidak boleh sampai bingung target siapa ini.
     bawaan=true berarti angkanya belum pernah disahkan pemilik, jadi layar
     tidak boleh memberi vonis bagus/jelek dari angka itu. */
  targetMati(barn){
    const farmPct=+MASTER.targetMortalitasPct;
    const farm={pct:farmPct>0?farmPct:null,dari:'farm',bawaan:calc.bawaan('targetMortalitasPct')};
    if(!barn)return farm;
    /* Sumbernya v_target_mati_kandang, yang sudah menerapkan urutan
       batch(manual) -> kandang -> farm di database. Layar tidak menghitung
       ulang urutannya sendiri supaya tidak ada dua versi aturan. */
    const row=(DB.targetMatiKandang||[]).find(x=>x.barn===barn);
    if(row&&row.target!=null&&row.dari!=='farm')return {pct:row.target,dari:row.dari,bawaan:false};
    const b=(DB.barns||[]).find(x=>x.id===barn);
    if(b&&b.targetMati!=null)return {pct:b.targetMati,dari:'kandang',bawaan:false};
    return farm;},
  /* Persentase mortalitas MURNI — afkir tidak ikut. Pembaginya DOD masuk. */
  mortPctMurni(barn){
    const dod=calc.popBalance(barn).dod;
    if(!(dod>0))return null;
    return calc.matiPisah(barn).mati/dod*100;},
  afkirPct(barn){
    const dod=calc.popBalance(barn).dod;
    if(!(dod>0))return null;
    return calc.matiPisah(barn).afkir/dod*100;},
  /* ---- Berapa hari berturut-turut kematian di atas batas ----
     Bocor pelan 4 ekor/hari selama dua minggu lebih merugikan daripada satu
     lonjakan 50 ekor, tapi yang terlihat di grafik cuma lonjakannya. Hitung
     mundur dari hari terakhir yang ada catatannya. Afkir tidak dihitung —
     itu keputusan, bukan gejala. */
  matiBeruntun(barn){
    const batas=+MASTER.batasMortalitasHarian;
    if(!(batas>0)||!DB.cycle)return null;
    const z=MASTER.zonaWaktu||DB.zonaWaktu||'Asia/Jakarta';
    const hari=d=>{try{return new Intl.DateTimeFormat('en-CA',{timeZone:z,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);}catch(e){return new Date(d).toISOString().slice(0,10);}};
    const perHari={};
    (DB.mortality||[]).filter(x=>(!barn||x.barn===barn)&&(x.kind||'MATI')==='MATI')
      .forEach(x=>{const k=hari(toDate(x.date));perHari[k]=(perHari[k]||0)+(+x.qty||0);});
    const tgl=Object.keys(perHari).sort();
    if(!tgl.length)return null;
    // telusuri mundur dari hari terakhir yang ada catatannya, hari demi hari
    let n=0,total=0;
    const akhir=new Date(tgl[tgl.length-1]+'T00:00:00Z');
    for(let i=0;;i++){
      const d=new Date(akhir.getTime()-i*86400000).toISOString().slice(0,10);
      const q=perHari[d];
      if(q==null||q<=batas)break;
      n++;total+=q;
      if(i>400)break;
    }
    return n>=2?{hari:n,ekor:total,batas,sejak:new Date(akhir.getTime()-(n-1)*86400000)}:null;},
  /* ---- Kerugian kematian dalam rupiah ----
     Bebek yang mati hari ke-2 cuma rugi harga DOD. Yang mati hari ke-22 sudah
     makan 22 hari pakan — ruginya berkali lipat. Angka ini PERKIRAAN dan
     dasarnya disebutkan di layar: harga DOD dari nota, pakan dari pakem jatah
     Bapak sendiri dikali harga pakan terbaru. Null kalau dasarnya belum ada,
     bukan diisi tebakan. */
  rugiMati(barn){
    if(!DB.cycle)return null;
    const hargaDod=+DB.cycle.dodPrice;
    const hargaPakan=calc.hargaPakanDipakai();
    if(!(hargaDod>0))return {kurang:'harga DOD belum ada'};
    /* LINGKUP: siklus yang sedang dibuka saja, sama dengan kartu di atasnya.
       JANGAN memakai DB.mortUmur — itu seluruh farem lintas siklus, dan
       memakainya di sini membuat satu kartu memuat dua lingkup berbeda
       (pernah terjadi 26 Nov 2026: kartu siklus 10 ekor, kerugian 2.254 ekor).
       DB.mortality sudah terbatas pada siklus yang dibuka, dan umurnya
       dihitung dari tanggal DOD siklus itu lewat dayOf(). */
    const catatan=(DB.mortality||[]).filter(x=>!barn||x.barn===barn)
      .map(x=>({umur:dayOf(toDate(x.date)),n:+x.qty||0,kind:x.kind||'MATI'}))
      .filter(x=>x.umur>0&&x.n>0&&x.kind==='MATI');
    if(!catatan.length)return {kosong:true};
    // pakan kumulatif yang sudah dimakan seekor bebek sampai umur tertentu
    const kum={};let jalan=0;
    const maks=Math.max(...catatan.map(x=>x.umur));
    for(let d=1;d<=maks;d++){const g=calc.jatahGram(d);if(g==null){kum[d]=null;continue;}jalan+=g/1000;kum[d]=jalan;}
    let dod=0,pakanKg=0,tanpaPakem=0,ekor=0;
    const ekorAfkir=calc.matiPisah(barn).afkir;
    catatan.forEach(x=>{
      ekor+=x.n;
      dod+=x.n*hargaDod;
      const k=kum[x.umur];
      if(k==null)tanpaPakem+=x.n;else pakanKg+=x.n*k;
    });
    const pakan=hargaPakan>0?pakanKg*hargaPakan:null;
    return {ekor,ekorAfkir,dod,pakanKg,pakan,
      total:pakan==null?null:dod+pakan,
      hargaDod,hargaPakan,tanpaPakem,
      kurang:pakan==null?'harga pakan belum ada nota':null};},
  riwayatHargaPakan(){
    /* Urutan dari server sudah kronologis (tanggal, lalu waktu catat, lalu id).
       Sort di sini HANYA pada tanggal, dan Array.sort stabil sejak ES2019, jadi
       nota di hari yang sama tetap memakai urutan server — bukan urutan acak.
       Jangan diganti jadi pembanding yang tidak stabil. */
    const beli=(DB.feedPurchases||[]).filter(p=>p.status==='APPROVED'&&p.price>0)
      .slice().sort((a,b)=>toDate(a.date)-toDate(b.date));
    const per={};
    beli.forEach(p=>{const j=p.jenis||'TANPA JENIS';(per[j]=per[j]||[]).push(p);});
    return Object.keys(per).sort().map(j=>{const n=per[j];
      return {jenis:j,jmlNota:n.length,terbaru:+n[n.length-1].price,
        nota:n.map((p,i)=>{const lalu=i>0?+n[i-1].price:null;
          const d=lalu!=null?+p.price-lalu:null;
          return {tanggal:p.date,harga:+p.price,qty:p.qty,vendor:p.vendor,ref:p.ref,
                  selisih:d,pct:lalu?d/lalu*100:null,
                  arah:d==null?'awal':d>0?'naik':d<0?'turun':'tetap'};}).reverse()};});},
  batches(){return DB.batches||[];},
  // Isi kandang menurut SEMUA batch (calc.population hanya batch yang dibuka)
  isiKandang(code){return (DB.barnPop||{})[code]||0;},
  kandangKosong(){return barnsActive().filter(b=>calc.isiKandang(b.id)===0);},
  /* Sudah berapa hari kandang ini kosong. Dihitung dari pergerakan populasi
     TERAKHIR di kandang itu — saat ekor terakhir keluar. null kalau kandang
     belum pernah dipakai sama sekali: kandang yang belum pernah diisi bukan
     "menganggur", dan tidak boleh ditampilkan seolah-olah begitu. */
  kandangKosongHari(barnId){
    const t=(DB.barnGerakTerakhir||{})[barnId];
    if(!t)return null;
    const d=t instanceof Date?t:new Date(t);
    if(!tglSah(d))return null;
    const z=MASTER.zonaWaktu||DB.zonaWaktu||'Asia/Jakarta';
    const hari=x=>{try{return new Intl.DateTimeFormat('en-CA',{timeZone:z,year:'numeric',month:'2-digit',day:'2-digit'}).format(x);}catch(e){return x.toISOString().slice(0,10);}};
    const a=Date.parse(hari(d)+'T00:00:00Z'), b=Date.parse(hari(new Date())+'T00:00:00Z');
    const n=Math.round((b-a)/86400000);
    return Number.isFinite(n)&&n>=0?n:null;},
  /* Nilai ternak yang sedang berdiri di satu batch, menurut harga jual hidup.
     Sengaja TIDAK memakai target bobot: yang dinilai adalah bobot yang benar-
     benar ditimbang. Belum ditimbang atau harga jual belum diisi -> null,
     beserta alasannya, bukan angka tebakan. */
  nilaiBatch(code){
    const h=(DB.harian||[]).find(x=>x.code===code);
    if(!h)return {nilai:null,sebab:'batch tidak ada di layar harian'};
    if(h.bobot==null)return {nilai:null,sebab:'belum ditimbang'};
    const hrg=calc.livePrice();
    if(!(hrg>0))return {nilai:null,sebab:'harga jual hidup belum diisi'};
    return {nilai:h.pop*h.bobot*hrg,sebab:null};},
  /* Jadwal panen seluruh farm beberapa bulan ke depan, dari DOD sampai
     perkiraan panen tiap batch. Semuanya memakai tanggal yang sudah ada di
     calc.batches(); tidak ada tanggal yang dikarang. */
  jadwalPanen(bulan=4){
    const b=calc.batches().filter(x=>tglSah(x.dodDate instanceof Date?x.dodDate:new Date(x.dodDate)));
    if(!b.length)return null;
    const tgl=x=>x instanceof Date?x:new Date(x);
    const now=new Date();
    const mulai=new Date(now.getFullYear(),now.getMonth(),1);
    const habis=new Date(now.getFullYear(),now.getMonth()+bulan,1);
    const span=habis-mulai;
    const baris=b.map(x=>{
      const d=tgl(x.dodDate), p=tgl(x.panen);
      return {...x, d, p,
        kiri:Math.max(0,(d-mulai)/span*100),
        kanan:Math.min(100,(p-mulai)/span*100)};
    }).sort((x,y)=>x.p-y.p);
    // ringkasan per bulan: berapa batch panen, berapa ekor (populasi hari ini)
    const bulanan=[];
    for(let i=0;i<bulan;i++){
      const a=new Date(now.getFullYear(),now.getMonth()+i,1);
      const z=new Date(now.getFullYear(),now.getMonth()+i+1,1);
      const isi=baris.filter(x=>x.p>=a&&x.p<z);
      bulanan.push({dari:a,batch:isi,ekor:isi.reduce((s,x)=>s+(+x.population||0),0)});
    }
    // jendela terpanjang tanpa panen, dihitung dari panen terakhir sampai akhir rentang
    const terakhir=baris.length?baris[baris.length-1].p:null;
    const jeda=terakhir&&terakhir<habis?{dari:new Date(terakhir.getTime()+86400000),sampai:habis,
      hari:Math.round((habis-terakhir)/86400000)}:null;
    // panen yang menumpuk: >1 batch dalam 20 hari
    const tumpuk=baris.length>1&&(baris[baris.length-1].p-baris[0].p)/86400000<=20
      ? {n:baris.length,hari:Math.round((baris[baris.length-1].p-baris[0].p)/86400000)+1,
         ekor:baris.reduce((s,x)=>s+(+x.population||0),0)} : null;
    return {baris,bulanan,jeda,tumpuk,mulai,habis};},
  /* Tren antar siklus — hanya dari siklus yang SUDAH DITUTUP, urut dari lama ke
     baru, dengan selisih terhadap siklus sebelumnya. Siklus berjalan tidak ikut,
     karena FCR dan labanya belum final dan akan menyesatkan kalau dibandingkan. */
  trenSiklus(){
    const p=(DB.prevCycles||[]).slice()
      .filter(x=>x.dodDate)
      .sort((a,b)=>new Date(a.dodDate)-new Date(b.dodDate));
    if(!p.length)return [];
    return p.map((x,i)=>{
      const lalu=i>0?p[i-1]:null;
      const labaEkor=x.profit!=null&&x.dodQty>0?x.profit/x.dodQty:null;
      const labaLalu=lalu&&lalu.profit!=null&&lalu.dodQty>0?lalu.profit/lalu.dodQty:null;
      const pct=(a,b)=>a!=null&&b!=null&&b!==0?(a-b)/Math.abs(b)*100:null;
      return {...x, labaEkor, lalu:!lalu?null:{
        fcr:pct(x.fcr,lalu.fcr),
        mortPoin:x.mortPct!=null&&lalu.mortPct!=null?x.mortPct-lalu.mortPct:null,
        laba:pct(labaEkor,labaLalu)}};
    });},
  kandangTerisi(){return barnsActive().filter(b=>calc.isiKandang(b.id)>0);},
  batchAktif(){return (DB.batches||[]).length;},
  populasiFarm(){return (DB.batches||[]).reduce((t,b)=>t+b.population,0);},
  // batch yang panennya paling dekat (termasuk yang sudah lewat targetnya)
  batchBerikutnya(){const b=(DB.batches||[]).slice().sort((x,y)=>x.sisaHari-y.sisaHari);return b[0]||null;},
  harvestedTotal(){return calc.popBalance().panen;},
  livePrice(){const p=DB.products.find(x=>x.type==='LIVE')||DB.products[0];return p?+p.price||0:0;},
  estRevenue(){const tb=calc.targetBobot();return tb?calc.projectedPop()*tb*calc.livePrice():0;},
  // Laba baru bisa diperkirakan kalau target bobot batch DAN harga jual produk sudah ada.
  estProfit(){if(!calc.targetBobot()||!calc.livePrice())return null;const v=calc.estRevenue()-calc.modal()-calc.projectedRemainingCost();return Number.isFinite(v)?v:null;},
  roi(){const l=calc.estProfit();const d=calc.modal()+calc.projectedRemainingCost();return l==null||!(d>0)?null:l/d*100;},
  salesRevenue(){return DB.orders.filter(o=>o.pay==='PAID').reduce((s,o)=>s+o.qty*(o.weight||o.qty*1.5)/o.qty*o.priceKg,0);},
  orderTotal(o){const w=o.weight||o.qty*(DB.products.find(p=>p.id===o.product).avgW);return w*o.priceKg;},
  productStock(p){if(p.stockFrom==='population')return calc.population();const it=DB.inventory.find(i=>i.id===p.stockFrom);return it?it.qty:0;},
  stockStatus(p){const s=calc.productStock(p);if(s<=0)return{k:'out',t:'HABIS'};if(p.stockFrom==='population')return{k:'pre',t:DB.cycle?'PRE-ORDER · PANEN '+fmtDate(dateOfDay(DB.cycle.targetDays)).toUpperCase():'PRE-ORDER'};if(s<=p.minOrder*2)return{k:'low',t:'STOK TERBATAS'};return{k:'ok',t:'TERSEDIA'};},
  healthScore(){const items=[];const lewat=[];
    const gap=calc.weightGap();
    if(gap==null)lewat.push('Pertumbuhan');else items.push(['Pertumbuhan',Math.max(0,Math.min(100,100+gap*2))]);
    const f=calc.fcr();const tf=calc.fcrBatchLalu();
    if(!f||!tf)lewat.push('FCR');else items.push(['FCR',Math.max(0,Math.min(100,100-(f.fcr-tf)*100))]);
    const tm=+MASTER.targetMortalitasPct||0;
    if(calc.bawaan('targetMortalitasPct')||!tm)lewat.push('Mortalitas');else items.push(['Mortalitas',Math.max(0,100-calc.mortPct()/tm*30)]);
    const kond=DB.barnCond.filter(c=>dayOf(c.date)===calc.day());
    if(!kond.length)lewat.push('Kondisi Kandang');else items.push(['Kondisi Kandang',kond.every(c=>c.litter==='Kering')?95:90]);
    const avg7=calc.feedAvg7();const fd=avg7?calc.feedToday()/avg7:null;
    if(fd==null||!isFinite(fd))lewat.push('Konsumsi Pakan');else items.push(['Konsumsi Pakan',Math.max(0,100-Math.abs(fd-1)*40)]);
    // Skor dari satu-dua komponen saja menyesatkan: tunggu minimal 3 komponen berdata.
    if(items.length<3)return{score:null,items,lewat,status:'BELUM CUKUP DATA'};
    const score=Math.round(items.reduce((s,i)=>s+i[1],0)/items.length);
    return{score,items,lewat,status:score>=80?'NORMAL':score>=60?'WARNING':'CRITICAL'};},
  pendingApprovals(){const list=[];DB.corrections.filter(c=>c.status==='PENDING').forEach(c=>list.push({kind:'CORRECTION',id:c.id,date:c.requestedAt,title:`Koreksi pakan ${c.oldVal} kg → ${c.newVal} kg`,sub:`Alasan: ${c.reason}`,by:c.requestedBy,ref:c}));DB.orders.filter(o=>o.status==='PENDING_APPROVAL').forEach(o=>list.push({kind:'ORDER',id:o.id,date:o.date,title:`Penjualan ${o.qty} ekor ${DB.products.find(p=>p.id===o.product).name.replace('Bebek Peking ','')}`,sub:`ke ${DB.customers.find(c=>c.id===o.customer).name} — ${rp(calc.orderTotal(o))}`,by:o.user,ref:o}));DB.feedPurchases.filter(p=>p.status==='PENDING').forEach(p=>list.push({kind:'PURCHASE',id:p.id,date:p.date,title:`Pembelian pakan ${num(p.qty)} kg`,sub:`${p.vendor}${p.price?' — '+rp(p.qty*p.price):''}`,by:p.user,ref:p}));DB.expenses.filter(e=>e.status==='PENDING').forEach(e=>list.push({kind:'EXPENSE',id:e.id,date:e.date,title:`Biaya ${e.cat} ${rp(e.amount)}`,sub:e.vendor,by:e.user,ref:e}));return list.sort((a,b)=>b.date-a.date);},
  /* Stok pakan di gudang saat siklus ini mulai: pembelian yang disetujui
     SEBELUM tanggal DOD, dikurangi pemakaian sebelum tanggal itu. Dihitung
     dari transaksi, bukan ditulis tangan — dulu kartunya selalu '0 kg'
     dengan keterangan "Siklus #000 habis terpakai", batch yang tidak ada di
     produksi. Kalau belum ada transaksi sebelum DOD, hasilnya memang 0. */
  stokAwalSiklus(){
    if(!DB.cycle||!DB.cycle.dodDate)return null;
    const t0=+toDate(DB.cycle.dodDate);
    const beli=(DB.feedPurchases||[]).filter(p=>p.status==='APPROVED'&&+toDate(p.date)<t0)
      .reduce((a,p)=>a+Number(p.qty||0),0);
    const pakai=(DB.feedRecords||[]).filter(r=>+toDate(r.date)<t0)
      .reduce((a,r)=>a+calc.feedVal(r),0);
    return Math.max(0, beli-pakai);
  },
  /* Katalog aturan anomali. Ini SATU sumber: jumlahnya dipakai halaman
     Anomali, dan daftarnya bisa ditampilkan. Sebelumnya layar menulis
     "Aturan Aktif 10" padahal mesinnya punya 11 aturan — angka itu ditulis
     tangan dan sudah salah. Kalau menambah aturan di anomalies(), tambahkan
     juga di sini supaya keduanya tidak berpisah lagi. */
  aturanAnomali(){return [
    ['AN-FEED-DEV','Konsumsi pakan menyimpang dari rata-rata 7 hari'],
    ['AN-FEED-DIFF','Selisih stok pakan dengan catatan transaksi'],
    ['AN-WEIGHT','Bobot menyimpang dari kurva target'],
    ['AN-MORT','Kematian harian di atas ambang'],
    ['AN-FCR','FCR memburuk dibanding batch sebelumnya'],
    ['AN-HOURS','Input di luar jam kerja'],
    ['AN-DUP','Input ganda pada sesi yang sama'],
    ['AN-POP','Populasi tidak balance'],
    ['AN-INV','Stok barang di bawah minimum'],
    ['AN-FEEDLOW','Stok pakan tidak cukup sampai panen'],
    ['AN-FOTO','Catatan tanpa foto bukti'],
  ];},
  /* Persen catatan pakan yang punya foto bukti. Terukur, bukan skor karangan.
     Menggantikan "Skor Integritas Input 96/100" yang dulu ditulis tangan
     dengan caption seolah hasil pengukuran. */
  catatanBerfoto(){
    const r=(DB.feedRecords||[]);
    if(!r.length)return null;
    const ada=r.filter(x=>!!x.photo).length;
    return {ada, total:r.length, pct:ada/r.length*100};
  },
  anomalies(){if(!DB.cycle)return [];const out=[];const fd=calc.feedToday(),avg=calc.feedAvg7();const dev=(fd-avg)/avg*100;
    if(Math.abs(dev)>MASTER.batasPakanPct)out.push({id:'AN-FEED-DEV',sev:dev>0?'warn':'warn',title:`Konsumsi pakan hari ini ${num(Math.abs(dev))}% lebih ${dev>0?'tinggi':'rendah'} dari rata-rata 7 hari`,detail:`Hari ini ${num(fd)} kg vs rata-rata ${num(avg,1)} kg/hari. Cek apakah ada input ganda atau pemberian ekstra.`,date:DEMO_TODAY,page:'pakan',rule:'Deviasi >'+MASTER.batasPakanPct+'% dari rata-rata 7 hari'});
    const fdif=calc.feedDiff();if(fdif&&Math.abs(fdif.diff)>=10)out.push({id:'AN-FEED-DIFF',sev:'warn',title:`Selisih stok pakan ${num(Math.abs(fdif.diff))} kg dengan catatan transaksi`,detail:`Stok teoritis ${num(fdif.theory)} kg, hasil opname fisik ${num(fdif.op.physical)} kg (${fmtDT(fdif.op.date)}).`,date:fdif.op.date,page:'stok',rule:'Selisih opname ≥10 kg'});
    const gap=calc.weightGap();if(gap!=null&&gap<-3)out.push({id:'AN-WEIGHT',sev:'warn',title:`Bobot rata-rata tertinggal ${num(Math.abs(gap))}% dari target`,detail:`Aktual ${num(calc.avgWeight(),2)} kg vs target hari ke-${calc.day()} ${num(calc.target(calc.day()),2)} kg. 3 pengukuran terakhir naik lebih lambat dari kurva.`,date:DB.weights[DB.weights.length-1].date,page:'pertumbuhan',rule:'Gap bobot < -3% dari kurva target'});
    const mb=calc.mortByDay();const today=mb[mb.length-1];if(today>=MASTER.batasMortalitasHarian)out.push({id:'AN-MORT',sev:'danger',title:`Mortalitas hari ini ${today} ekor, di atas batas normal`,detail:`Batas harian ${MASTER.batasMortalitasHarian} ekor.`,date:DEMO_TODAY,page:'populasi',rule:'Kematian harian ≥ batas'});
    const fs=calc.fcrSeries().filter(x=>x.fcr);if(fs.length>=2&&fs[fs.length-1].fcr>fs[fs.length-2].fcr*1.05)out.push({id:'AN-FCR',sev:'warn',title:'FCR naik dibanding pengukuran sebelumnya',detail:`FCR ${num(fs[fs.length-2].fcr,2)} → ${num(fs[fs.length-1].fcr,2)}.`,date:DEMO_TODAY,page:'pertumbuhan',rule:'FCR naik >5% antar pengukuran'});
    DB.audit.filter(a=>a.action==='CREATE'&&(a.date.getHours()<MASTER.jamKerja[0]||a.date.getHours()>=MASTER.jamKerja[1])&&a.user!=='SYSTEM').slice(0,1).forEach(a=>out.push({id:'AN-HOURS-'+a.id,sev:'info',title:'Input data di luar jam kerja',detail:`${userName(a.user)} — ${a.detail} (${fmtDT(a.date)}).`,date:a.date,page:'audit',rule:`Transaksi di luar ${MASTER.jamKerja[0]}:00–${MASTER.jamKerja[1]}:00`}));
    const dup={};DB.feedRecords.filter(r=>dayOf(r.date)===calc.day()).forEach(r=>{const k=r.barn;dup[k]=(dup[k]||0)+1;});Object.entries(dup).filter(([k,v])=>v>1).forEach(([k])=>out.push({id:'AN-DUP-'+k,sev:'warn',title:`Input pakan ganda hari ini di Kandang ${k}`,detail:'Dua input pakan tercatat pada hari yang sama untuk kandang yang sama.',date:DEMO_TODAY,page:'pakan',rule:'Input berulang per kandang/hari'}));
    const bal=calc.popBalance();if(bal.dod+bal.tIn-bal.mati-bal.jual-bal.tOut!==bal.akhir)out.push({id:'AN-POP',sev:'danger',title:'Populasi tidak balance',detail:'Jumlah transaksi tidak sama dengan populasi akhir.',date:DEMO_TODAY,page:'populasi',rule:'Balance populasi'});
    DB.inventory.filter(i=>i.qty<i.min).forEach(i=>out.push({id:'AN-INV-'+i.id,sev:'warn',title:`Stok ${i.name} di bawah minimum`,detail:`${num(i.qty)} ${i.unit} (minimum ${num(i.min)} ${i.unit}).`,date:DEMO_TODAY,page:'stok',rule:'Stok < minimum'}));
    if(calc.stokKritis())out.push({id:'AN-FEEDLOW',sev:'danger',title:`Stok pakan tersisa ${num(calc.feedDaysLeft(),0)} hari`,detail:'Segera ajukan pembelian.',date:DEMO_TODAY,page:'stok',rule:'Stok pakan < '+MASTER.minStokPakanHari+' hari'});
    [...(DB.mortality||[]).map(r=>({r,jenis:'kematian',page:'populasi'})),...(DB.feedRecords||[]).map(r=>({r,jenis:'pakan',page:'pakan'})),...(DB.weights||[]).map(r=>({r,jenis:'timbangan',page:'pertumbuhan'}))]
      .filter(x=>x.r.photoSource&&x.r.photoSource!=='kamera')
      .forEach(x=>out.push({id:'AN-FOTO-'+x.r.id,sev:'warn',title:`Bukti ${x.jenis} diambil dari galeri, bukan kamera`,detail:`${barnName(x.r.barn)} — ${fmtDT(x.r.date)} oleh ${userName(x.r.user)}. Foto tidak diambil saat kejadian, jadi belum tentu kejadian hari itu.`,date:x.r.date,page:x.page,rule:'Foto bukti harus diambil dari kamera langsung'}));
    return out.map(a=>Object.assign(a,{state:DB.anomalyState[a.id]||{status:'OPEN'}}));},
  notifications(){if(!DB.cycle)return [];const n=[];calc.pendingApprovals().forEach(p=>n.push({t:'approval',title:p.title,sub:'Menunggu persetujuan',date:p.date,page:'persetujuan'}));calc.anomalies().filter(a=>a.state.status==='OPEN').forEach(a=>n.push({t:'anomaly',title:a.title,sub:'Perlu verifikasi',date:a.date,page:'anomali'}));DB.orders.filter(o=>o.status==='NEW').forEach(o=>n.push({t:'order',title:'Order baru dari website '+o.id,sub:DB.customers.find(c=>c.id===o.customer).name,date:o.date,page:'penjualan'}));return n.sort((a,b)=>b.date-a.date);},
};
const userName = id=>id==='SYSTEM'?'Sistem':(DB.users.find(u=>u.id===id)||{name:id}).name;
const userRole = id=>id==='SYSTEM'?'':(DB.users.find(u=>u.id===id)||{role:''}).role;
// kandang aktif (untuk dropdown operasional); yang sedang terisi didahulukan
const barnsActive = ()=>DB.barns.filter(b=>b.active!==false);
const barnsWorking = ()=>{const a=barnsActive().filter(b=>calc.population(b.id)>0);return a.length?a:barnsActive();};
const barnOptions = (sel,all)=>(all?`<option value="ALL"${sel==='ALL'?' selected':''}>Semua</option>`:'')+barnsWorking().map(b=>`<option value="${b.id}"${sel===b.id?' selected':''}>${b.name}</option>`).join('');
const barnName = b=>b==='ALL'?'Semua kandang':(DB.barns.find(x=>x.id===b)||{name:b}).name;
const logAudit=()=>{}; // audit ditulis server

/* ---------------- APP STATE ---------------- */
const state={user:null,batch:null,lastPhone:null,page:'dashboard',busy:false,tab:null,range:'siklus',barn:'ALL',view:'login',sideOpen:false,notif:false,loading:false,akSuccess:null,aiOpen:false,aiMsgs:[],filters:{},foto:{},kamera:null,gagal:null};
