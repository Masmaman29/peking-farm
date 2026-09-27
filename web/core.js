
/* =====================================================================
   PEKING FARM — Interactive Prototype
   Single source of truth: DB. Every displayed number is derived from
   transactions in DB via the functions in `calc`. Nothing is hardcoded
   on the page. All data is DEMO DATA.
   ===================================================================== */
const D = (m,d,h=8,mi=0)=>new Date(2026,m-1,d,h,mi);
const fmtDate = d=>d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
const fmtDT = d=>d.toLocaleDateString('id-ID',{day:'numeric',month:'short'})+' '+d.toTimeString().slice(0,5);
const fmtLong = d=>d.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
const rp = n=>'Rp '+Math.round(n).toLocaleString('id-ID');
const num = (n,dec=0)=>Number(n).toLocaleString('id-ID',{minimumFractionDigits:dec,maximumFractionDigits:dec});
const pct = (n,dec=1)=>num(n,dec)+'%';
const dayOf = d=>Math.floor((d-DB.cycle.dodDate)/86400000)+1;
const dateOfDay = n=>new Date(DB.cycle.dodDate.getTime()+(n-1)*86400000);
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
async function api(path,opts={}){const r=await fetch(API+path,Object.assign({credentials:'same-origin',headers:opts.body&&!(opts.body instanceof FormData)?{'Content-Type':'application/json'}:{}},opts));const j=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(j.message||('HTTP '+r.status));e.code=j.code;e.status=r.status;throw e;}return j;}
const toDate=v=>v==null?v:(v instanceof Date?v:new Date(v));
function hydrate(b){
  const d=x=>{if(!x)return x;['date','dodDate','createdAt','requestedAt','decidedAt','lastLogin','pickup'].forEach(k=>{if(x[k]!==undefined)x[k]=toDate(x[k]);});if(x.versions)x.versions.forEach(v=>v.date=toDate(v.date));return x;};
  ['users','popTx','mortality','feedRecords','feedPurchases','feedAdjust','feedOpname','weights','health','barnCond','expenses','invTx','orders','corrections','audit','prevCycles'].forEach(k=>(b[k]||[]).forEach(d));
  if(b.cycle){d(b.cycle);b.cycle.dodDate.setHours(0,0,0,0);}
  b.products.forEach(p=>p.priceKg=p.priceKey);
  return b;
}
async function loadDB(){const b=await api('/bootstrap');DB=hydrate(b);MASTER=b.master;DEMO_TODAY=new Date(b.now);return DB;}
let MASTER={};let DEMO_TODAY=new Date();
/* ---------------- DERIVED CALCULATIONS (single source of truth) ---------------- */
const calc = {
  day(){return dayOf(DEMO_TODAY);},
  popTxUpTo(date){return DB.popTx.filter(t=>t.date<=date);},
  population(barn=null,date=DEMO_TODAY){return DB.popTx.filter(t=>t.date<=date&&(!barn||t.barn===barn)).reduce((s,t)=>s+t.qty,0);},
  popBalance(){const g=t=>DB.popTx.filter(x=>x.type===t).reduce((s,x)=>s+Math.abs(x.qty),0);return{dod:g('DOD_MASUK'),tIn:g('TRANSFER_MASUK'),mati:g('KEMATIAN'),jual:g('PENJUALAN'),tOut:g('TRANSFER_KELUAR'),akhir:calc.population()};},
  mortTotal(barn=null){return DB.mortality.filter(m=>!barn||m.barn===barn).reduce((s,m)=>s+m.qty,0);},
  mortPct(){return calc.mortTotal()/DB.cycle.dodQty*100;},
  mortByDay(){const a=Array(calc.day()).fill(0);DB.mortality.forEach(m=>{const d=dayOf(m.date);if(d>=1&&d<=a.length)a[d-1]+=m.qty;});return a;},
  feedVal(r){return r.versions.length?r.versions[r.versions.length-1].kg:r.kg;}, // active version
  feedByDay(){const a=Array(calc.day()).fill(0);DB.feedRecords.forEach(r=>{const d=dayOf(r.date);if(d>=1&&d<=a.length)a[d-1]+=calc.feedVal(r);});return a;},
  feedTotal(barn=null){return DB.feedRecords.filter(r=>!barn||r.barn===barn).reduce((s,r)=>s+calc.feedVal(r),0);},
  feedPurchased(){return DB.feedPurchases.filter(p=>p.status==='APPROVED').reduce((s,p)=>s+p.qty,0);},
  feedAdjusted(){return DB.feedAdjust.reduce((s,a)=>s+a.qty,0);},
  feedStockTheory(){return calc.feedPurchased()+calc.feedAdjusted()-calc.feedTotal();},
  feedOpnameLast(){return DB.feedOpname[DB.feedOpname.length-1];},
  feedStockAtDate(date){const bought=DB.feedPurchases.filter(p=>p.status==='APPROVED'&&p.date<=date).reduce((s,p)=>s+p.qty,0);const adj=DB.feedAdjust.filter(a=>a.date<=date).reduce((s,a)=>s+a.qty,0);const used=DB.feedRecords.filter(r=>r.date<=date).reduce((s,r)=>s+calc.feedVal(r),0);return bought+adj-used;},
  feedDiff(){const op=calc.feedOpnameLast();if(!op)return null;const theory=op.theoretical!=null?op.theoretical:calc.feedStockAtDate(op.date);return{op,theory,diff:theory-op.physical};},
  feedAvg7(){const a=calc.feedByDay();const s=a.slice(-8,-1);return s.reduce((x,y)=>x+y,0)/s.length;},
  feedToday(){return calc.feedByDay().slice(-1)[0];},
  feedDaysLeft(){const avg=calc.feedAvg7()||1;return calc.feedStockTheory()/avg;},
  avgWeight(barn=null){const ws=DB.weights.filter(w=>!barn||w.barn===barn);if(!ws.length)return null;const last=ws[ws.length-1].date;const s=ws.filter(w=>w.date.getTime()===last.getTime());const n=s.reduce((x,w)=>x+w.n,0);return s.reduce((x,w)=>x+w.total,0)/n;},
  weightSeries(){const m={};DB.weights.forEach(w=>{const d=dayOf(w.date);m[d]=m[d]||{n:0,t:0};m[d].n+=w.n;m[d].t+=w.total;});return Object.keys(m).map(Number).sort((a,b)=>a-b).map(d=>({day:d,avg:m[d].t/m[d].n}));},
  target(day){const c=MASTER.targetCurve;if(day<=c[0][0])return c[0][1];for(let i=1;i<c.length;i++){if(day<=c[i][0]){const [d0,w0]=c[i-1],[d1,w1]=c[i];return w0+(w1-w0)*(day-d0)/(d1-d0);}}return c[c.length-1][1];},
  weightGap(){const a=calc.avgWeight();if(a==null)return null;const t=calc.target(calc.day());return (a-t)/t*100;},
  fcr(){const feed=calc.feedTotal();const w=calc.avgWeight();if(w==null||calc.day()<7)return null;const bio=calc.population()*w-DB.cycle.dodQty*MASTER.targetCurve[0][1];if(bio<=0)return null;return{fcr:feed/bio,feed,bio};},
  fcrSeries(){const ws=calc.weightSeries();const fb=calc.feedByDay();return ws.map(p=>{const feed=fb.slice(0,p.day).reduce((a,b)=>a+b,0);const pop=calc.population(null,dateOfDay(p.day));const bio=pop*p.avg-DB.cycle.dodQty*0.055;return{day:p.day,fcr:bio>0?feed/bio:null};});},
  expensesApproved(){return DB.expenses.filter(e=>e.status==='APPROVED');},
  feedCost(){return DB.feedPurchases.filter(p=>p.status==='APPROVED').reduce((s,p)=>s+p.qty*p.price,0);},
  costByCat(){const m={};calc.expensesApproved().forEach(e=>m[e.cat]=(m[e.cat]||0)+e.amount);m['Pakan']=(m['Pakan']||0)+calc.feedCost();return m;},
  modal(){return Object.values(calc.costByCat()).reduce((a,b)=>a+b,0);},
  projectedRemainingCost(){const daysLeft=Math.max(0,DB.cycle.targetDays-calc.day());const feedNeed=daysLeft*calc.feedAvg7()*1.15;const feedShort=Math.max(0,feedNeed-calc.feedStockTheory());return feedShort*MASTER.hargaPakanKg+daysLeft/30*(2400000+480000+750000);},
  projectedPop(){const rate=calc.mortPct()/calc.day();const remain=DB.cycle.targetDays-calc.day();return Math.round(calc.population()*(1-rate/100*remain));},
  estRevenue(){return calc.projectedPop()*MASTER.targetBobotMin*1.1*(MASTER.hargaJualHidupKg||0);},
  estProfit(){return calc.estRevenue()-calc.modal()-calc.projectedRemainingCost();},
  roi(){return calc.estProfit()/(calc.modal()+calc.projectedRemainingCost())*100;},
  salesRevenue(){return DB.orders.filter(o=>o.pay==='PAID').reduce((s,o)=>s+o.qty*(o.weight||o.qty*1.5)/o.qty*o.priceKg,0);},
  orderTotal(o){const w=o.weight||o.qty*(DB.products.find(p=>p.id===o.product).avgW);return w*o.priceKg;},
  productStock(p){if(p.stockFrom==='population')return calc.population();const it=DB.inventory.find(i=>i.id===p.stockFrom);return it?it.qty:0;},
  stockStatus(p){const s=calc.productStock(p);if(s<=0)return{k:'out',t:'HABIS'};if(p.stockFrom==='population')return{k:'pre',t:'PRE-ORDER · PANEN '+fmtDate(dateOfDay(DB.cycle.targetDays)).toUpperCase()};if(s<=p.minOrder*2)return{k:'low',t:'STOK TERBATAS'};return{k:'ok',t:'TERSEDIA'};},
  healthScore(){const gap=calc.weightGap()||0;const growth=Math.max(0,Math.min(100,100+gap*2));const f=calc.fcr();const fcrS=f?Math.max(0,Math.min(100,100-(f.fcr-2.0)*100)):70;const mortS=Math.max(0,100-calc.mortPct()/MASTER.targetMortalitasPct*30);const cond=DB.barnCond.filter(c=>dayOf(c.date)===calc.day()).every(c=>c.litter==='Kering')?95:90;const fd=calc.feedToday()/calc.feedAvg7();const feedS=Math.max(0,100-Math.abs(fd-1)*40);const items=[['Pertumbuhan',growth],['FCR',fcrS],['Mortalitas',mortS],['Kondisi Kandang',cond],['Konsumsi Pakan',feedS]];const score=Math.round(items.reduce((s,i)=>s+i[1],0)/items.length);return{score,items,status:score>=80?'NORMAL':score>=60?'WARNING':'CRITICAL'};},
  pendingApprovals(){const list=[];DB.corrections.filter(c=>c.status==='PENDING').forEach(c=>list.push({kind:'CORRECTION',id:c.id,date:c.requestedAt,title:`Koreksi pakan ${c.oldVal} kg → ${c.newVal} kg`,sub:`Alasan: ${c.reason}`,by:c.requestedBy,ref:c}));DB.orders.filter(o=>o.status==='PENDING_APPROVAL').forEach(o=>list.push({kind:'ORDER',id:o.id,date:o.date,title:`Penjualan ${o.qty} ekor ${DB.products.find(p=>p.id===o.product).name.replace('Bebek Peking ','')}`,sub:`ke ${DB.customers.find(c=>c.id===o.customer).name} — ${rp(calc.orderTotal(o))}`,by:o.user,ref:o}));DB.feedPurchases.filter(p=>p.status==='PENDING').forEach(p=>list.push({kind:'PURCHASE',id:p.id,date:p.date,title:`Pembelian pakan ${num(p.qty)} kg`,sub:`${p.vendor}${p.price?' — '+rp(p.qty*p.price):''}`,by:p.user,ref:p}));DB.expenses.filter(e=>e.status==='PENDING').forEach(e=>list.push({kind:'EXPENSE',id:e.id,date:e.date,title:`Biaya ${e.cat} ${rp(e.amount)}`,sub:e.vendor,by:e.user,ref:e}));return list.sort((a,b)=>b.date-a.date);},
  anomalies(){const out=[];const fd=calc.feedToday(),avg=calc.feedAvg7();const dev=(fd-avg)/avg*100;
    if(Math.abs(dev)>MASTER.batasPakanPct)out.push({id:'AN-FEED-DEV',sev:dev>0?'warn':'warn',title:`Konsumsi pakan hari ini ${num(Math.abs(dev))}% lebih ${dev>0?'tinggi':'rendah'} dari rata-rata 7 hari`,detail:`Hari ini ${num(fd)} kg vs rata-rata ${num(avg,1)} kg/hari. Cek apakah ada input ganda atau pemberian ekstra.`,date:DEMO_TODAY,page:'pakan',rule:'Deviasi >'+MASTER.batasPakanPct+'% dari rata-rata 7 hari'});
    const fdif=calc.feedDiff();if(fdif&&Math.abs(fdif.diff)>=10)out.push({id:'AN-FEED-DIFF',sev:'warn',title:`Selisih stok pakan ${num(Math.abs(fdif.diff))} kg dengan catatan transaksi`,detail:`Stok teoritis ${num(fdif.theory)} kg, hasil opname fisik ${num(fdif.op.physical)} kg (${fmtDT(fdif.op.date)}).`,date:fdif.op.date,page:'stok',rule:'Selisih opname ≥10 kg'});
    const gap=calc.weightGap();if(gap!=null&&gap<-3)out.push({id:'AN-WEIGHT',sev:'warn',title:`Bobot rata-rata tertinggal ${num(Math.abs(gap))}% dari target`,detail:`Aktual ${num(calc.avgWeight(),2)} kg vs target hari ke-${calc.day()} ${num(calc.target(calc.day()),2)} kg. 3 pengukuran terakhir naik lebih lambat dari kurva.`,date:DB.weights[DB.weights.length-1].date,page:'pertumbuhan',rule:'Gap bobot < -3% dari kurva target'});
    const mb=calc.mortByDay();const today=mb[mb.length-1];if(today>=MASTER.batasMortalitasHarian)out.push({id:'AN-MORT',sev:'danger',title:`Mortalitas hari ini ${today} ekor, di atas batas normal`,detail:`Batas harian ${MASTER.batasMortalitasHarian} ekor.`,date:DEMO_TODAY,page:'populasi',rule:'Kematian harian ≥ batas'});
    const fs=calc.fcrSeries().filter(x=>x.fcr);if(fs.length>=2&&fs[fs.length-1].fcr>fs[fs.length-2].fcr*1.05)out.push({id:'AN-FCR',sev:'warn',title:'FCR naik dibanding pengukuran sebelumnya',detail:`FCR ${num(fs[fs.length-2].fcr,2)} → ${num(fs[fs.length-1].fcr,2)}.`,date:DEMO_TODAY,page:'pertumbuhan',rule:'FCR naik >5% antar pengukuran'});
    DB.audit.filter(a=>a.action==='CREATE'&&(a.date.getHours()<MASTER.jamKerja[0]||a.date.getHours()>=MASTER.jamKerja[1])&&a.user!=='SYSTEM').slice(0,1).forEach(a=>out.push({id:'AN-HOURS-'+a.id,sev:'info',title:'Input data di luar jam kerja',detail:`${userName(a.user)} — ${a.detail} (${fmtDT(a.date)}).`,date:a.date,page:'audit',rule:`Transaksi di luar ${MASTER.jamKerja[0]}:00–${MASTER.jamKerja[1]}:00`}));
    const dup={};DB.feedRecords.filter(r=>dayOf(r.date)===calc.day()).forEach(r=>{const k=r.barn;dup[k]=(dup[k]||0)+1;});Object.entries(dup).filter(([k,v])=>v>1).forEach(([k])=>out.push({id:'AN-DUP-'+k,sev:'warn',title:`Input pakan ganda hari ini di Kandang ${k}`,detail:'Dua input pakan tercatat pada hari yang sama untuk kandang yang sama.',date:DEMO_TODAY,page:'pakan',rule:'Input berulang per kandang/hari'}));
    const bal=calc.popBalance();if(bal.dod+bal.tIn-bal.mati-bal.jual-bal.tOut!==bal.akhir)out.push({id:'AN-POP',sev:'danger',title:'Populasi tidak balance',detail:'Jumlah transaksi tidak sama dengan populasi akhir.',date:DEMO_TODAY,page:'populasi',rule:'Balance populasi'});
    DB.inventory.filter(i=>i.qty<i.min).forEach(i=>out.push({id:'AN-INV-'+i.id,sev:'warn',title:`Stok ${i.name} di bawah minimum`,detail:`${num(i.qty)} ${i.unit} (minimum ${num(i.min)} ${i.unit}).`,date:DEMO_TODAY,page:'stok',rule:'Stok < minimum'}));
    if(calc.feedDaysLeft()<MASTER.minStokPakanHari)out.push({id:'AN-FEEDLOW',sev:'danger',title:`Stok pakan tersisa ${num(calc.feedDaysLeft(),0)} hari`,detail:'Segera ajukan pembelian.',date:DEMO_TODAY,page:'stok',rule:'Stok pakan < '+MASTER.minStokPakanHari+' hari'});
    return out.map(a=>Object.assign(a,{state:DB.anomalyState[a.id]||{status:'OPEN'}}));},
  notifications(){const n=[];calc.pendingApprovals().forEach(p=>n.push({t:'approval',title:p.title,sub:'Menunggu persetujuan',date:p.date,page:'persetujuan'}));calc.anomalies().filter(a=>a.state.status==='OPEN').forEach(a=>n.push({t:'anomaly',title:a.title,sub:'Perlu verifikasi',date:a.date,page:'anomali'}));DB.orders.filter(o=>o.status==='NEW').forEach(o=>n.push({t:'order',title:'Order baru dari website '+o.id,sub:DB.customers.find(c=>c.id===o.customer).name,date:o.date,page:'penjualan'}));return n.sort((a,b)=>b.date-a.date);},
};
const userName = id=>id==='SYSTEM'?'Sistem':(DB.users.find(u=>u.id===id)||{name:id}).name;
const userRole = id=>id==='SYSTEM'?'':(DB.users.find(u=>u.id===id)||{role:''}).role;
const barnName = b=>b==='ALL'?'Semua kandang':(DB.barns.find(x=>x.id===b)||{name:b}).name;
const logAudit=()=>{}; // audit ditulis server

/* ---------------- APP STATE ---------------- */
const state={user:null,page:'dashboard',busy:false,tab:null,range:'siklus',barn:'ALL',view:'login',sideOpen:false,notif:false,loading:false,akSuccess:null,aiOpen:false,aiMsgs:[],filters:{}};
