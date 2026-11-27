
/* ---------------- ICONS ---------------- */
const IC={
 home:'<path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z"/>',
 cycle:'<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
 duck:'<path d="M4 15c0 3 3 5 8 5s8-2 8-5c0-2-1.5-3-3-3H9V9a3 3 0 1 1 6 0"/><circle cx="14" cy="8" r="1"/>',
 feed:'<path d="M4 8h16l-1.5 11a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
 growth:'<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
 heart:'<path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.4-9.5 9-9.5 9z"/>',
 money:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/>',
 cart:'<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
 box:'<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v9"/>',
 report:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
 check:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
 users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
 alert:'<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
 ai:'<path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z"/><path d="M19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9z"/>',
 bell:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
 search:'<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
 menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
 x:'<path d="M18 6L6 18M6 6l12 12"/>',
 camera:'<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
 skull:'<circle cx="12" cy="10" r="7"/><path d="M9 17v4h6v-4M9.5 11h.01M14.5 11h.01"/>',
 scale:'<path d="M12 3v18M3 7h18M5 7l-3 7a4 4 0 0 0 6 0L5 7M19 7l-3 7a4 4 0 0 0 6 0l-3-7"/>',
 barn:'<path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-8h6v8M3 21h18"/>',
 clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
 out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
 arrow:'<path d="M5 12h14M12 5l7 7-7 7"/>',
 dl:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
 history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
 wa:'<path d="M20.5 3.5A11 11 0 0 0 3.2 16.8L2 22l5.3-1.2A11 11 0 1 0 20.5 3.5z"/><path d="M8.5 9.5c.5 3 3 5.5 6 6l1.5-1.5-2-1-1 1a5 5 0 0 1-2.5-2.5l1-1-1-2z"/>',
 star:'<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
 leaf:'<path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 13-9 0 9-4 13-6 16z"/><path d="M4 21c3-4 6-7 9-9"/>',
 truck:'<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
 pen:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
};
const ic=(n,s=18)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${IC[n]||''}</svg>`;
const DUCK_ART=(op=1)=>`<svg viewBox="0 0 320 240" fill="none" style="opacity:${op}"><defs><linearGradient id="dg" x1="0" x2="1"><stop offset="0" stop-color="#F7F8F5"/><stop offset="1" stop-color="#C9D6CB"/></linearGradient></defs>
<ellipse cx="160" cy="215" rx="140" ry="14" fill="rgba(0,0,0,.25)"/>
<path d="M60 160c0-40 40-70 95-70 45 0 80 20 100 48l40-18-5 30-30 12c-6 38-48 58-105 58-60 0-95-24-95-60z" fill="url(#dg)"/>
<path d="M150 92c-30-6-40-30-30-52 12-26 52-26 66 0 8 16 4 32-8 44" fill="url(#dg)"/>
<circle cx="182" cy="46" r="5" fill="#1F2933"/><path d="M196 52l38 10-36 12z" fill="#D99A2B"/>
<path d="M80 160c20 10 60 12 100 4" stroke="#A9B8AF" stroke-width="3" stroke-linecap="round"/></svg>`;

/* ---------------- UI HELPERS ---------------- */
const badge=(k,t)=>`<span class="badge b-${k}">${t}</span>`;
const stBadge=s=>({APPROVED:badge('approved','DISETUJUI'),PENDING:badge('pending','MENUNGGU'),PENDING_APPROVAL:badge('pending','MENUNGGU APPROVAL'),REJECTED:badge('rejected','DITOLAK'),RECORDED:badge('info','TERCATAT'),LOCKED:badge('neutral','TERKUNCI'),NEW:badge('gold','BARU'),CONFIRMED:badge('info','DIKONFIRMASI'),PAID:badge('ok','DIBAYAR'),UNPAID:badge('warn','BELUM BAYAR'),PREPARING:badge('info','DISIAPKAN'),READY:badge('ok','SIAP'),DELIVERED:badge('ok','TERKIRIM'),CANCELLED:badge('danger','DIBATALKAN'),AKTIF:badge('ok','AKTIF'),SELESAI:badge('neutral','SELESAI'),OPEN:badge('warn','PERLU VERIFIKASI'),VERIFIED:badge('ok','TERVERIFIKASI'),NORMAL:badge('ok','NORMAL'),WARNING:badge('warn','WARNING'),CRITICAL:badge('danger','CRITICAL')}[s]||badge('neutral',s));
/* Kartu angka. Parameter terakhir `ke` membuat kartunya bisa diklik untuk
   membuka halaman sidebar yang memiliki angka itu — permintaan Abdur 24 Nov:
   dari dashboard langsung masuk ke halamannya masing-masing.
   Dicek dengan canPage() supaya peran yang tidak berhak tidak diberi tombol
   menuju halaman yang akan menolaknya. */
const kpi=(lbl,val,unit,foot,footCls='',icon='growth',cls='',ke='')=>{
  const isi=`<div class="ic">${ic(icon,18)}</div><div class="lbl">${lbl}</div><div class="val num">${val}${unit?`<small>${unit}</small>`:''}</div><div class="foot ${footCls}">${foot||''}</div>`;
  if(!ke||!canPage(ke)) return `<div class="kpi ${cls}">${isi}</div>`;
  return `<button type="button" class="kpi ${cls} klik" data-act="go" data-page="${ke}" aria-label="${lbl} — buka halaman">${isi}<span class="kpi-ke">${ic('arrow',13)}</span></button>`;
};
/* Tautan "lihat" di kepala kartu, menuju halaman yang memiliki data itu. */
const lihatDi=(ke,teks='Lihat')=>canPage(ke)?`<button class="btn ghost sm" data-act="go" data-page="${ke}">${teks} ${ic('arrow',12)}</button>`:'';
/* Penanda lingkup — permintaan Abdur 26 Nov 2026.
   Dashboard memuat dua lingkup berbeda dalam satu layar: tabel pakan menghitung
   SELURUH FARM (semua kandang yang berisi), sedangkan kartu KPI hanya SIKLUS yang
   sedang dibuka. Keduanya benar, tapi tanpa penanda angkanya terlihat bertentangan.
   Fungsi ini hanya menambah keterangan; tidak ada satu pun hitungan yang diubah. */
const lingkup=(jenis,judul,ket='',catatan='',kanan='')=>
 `<div class="lingkup"><span class="tag ${jenis==='farm'?'farm':'siklus'}">${jenis==='farm'?'SELURUH FARM':'SATU SIKLUS'}</span><h3>${judul}</h3>${ket?`<span class="ket">${ket}</span>`:''}${kanan?`<span style="margin-left:auto">${kanan}</span>`:''}</div>${catatan?`<p class="lingkup-note">${catatan}</p>`:''}`;
const emptyState=(t,d,act='')=>`<div class="empty">${ic('box',30)}<b>${t}</b><span>${d}</span>${act}</div>`;
const seg=(opts,cur,act)=>`<div class="seg">${opts.map(([v,l])=>`<button class="${cur===v?'active':''}" data-act="${act}" data-v="${v}">${l}</button>`).join('')}</div>`;
const rangeSeg=()=>seg([['7','7 hari'],['14','14 hari'],['30','30 hari'],['siklus','1 siklus']],state.range,'range');
const rangeDays=()=>state.range==='siklus'?calc.day():Math.min(calc.day(),+state.range);
const lastN=(a,n)=>a.slice(Math.max(0,a.length-n));
const dayLabels=n=>{const d=calc.day();const out=[];for(let i=d-n+1;i<=d;i++)out.push('H'+i);return out;};
const toast=(msg,k='ok')=>{const w=document.getElementById('toasts');const t=document.createElement('div');t.className='toast '+k;t.innerHTML=`${ic(k==='ok'?'check':k==='err'?'alert':'alert',18)}<span>${msg}</span>`;w.appendChild(t);setTimeout(()=>t.remove(),3200);};
const fotoAsal=(src,p)=>p&&src&&src!=='kamera'?' '+badge('warn','GALERI'):'',
 photoChip=p=>p?(String(p).startsWith('/uploads/')?`<a class="thumb" href="${p}" target="_blank" rel="noopener" title="Lihat bukti">${ic('camera',14)}</a>`:`<span class="thumb" title="${p}">${ic('camera',14)}</span>`):'<span class="badge b-neutral">—</span>';

/* ---------------- CHARTS ---------------- */
let charts=[];
const CHART_DEF={color:'#A9B8AF',grid:'rgba(255,255,255,.07)'};
function mkChart(id,cfg){const el=document.getElementById(id);if(!el)return;const c=new Chart(el,cfg);charts.push(c);}
function baseOpts(extra={}){return Object.assign({responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{labels:{color:CHART_DEF.color,boxWidth:10,usePointStyle:true,font:{family:'Plus Jakarta Sans',size:11}}},tooltip:{backgroundColor:'#0B241C',borderColor:'rgba(255,255,255,.15)',borderWidth:1,titleColor:'#fff',bodyColor:'#EDF2EE'}},scales:{x:{ticks:{color:CHART_DEF.color,font:{size:10},maxTicksLimit:10},grid:{color:CHART_DEF.grid}},y:{ticks:{color:CHART_DEF.color,font:{size:10}},grid:{color:CHART_DEF.grid},beginAtZero:true}}},extra);}
function lineDs(label,data,color,fill=false,dash=null){return{label,data,borderColor:color,backgroundColor:fill?color.replace(')',',.18)').replace('rgb','rgba'):color,fill,tension:.35,borderWidth:2,pointRadius:data.filter(x=>x!=null).length>20?0:3,pointHoverRadius:5,borderDash:dash||[],spanGaps:true};}
const C_GREEN='rgb(168,208,141)',C_GOLD='rgb(198,161,91)',C_RED='rgb(217,83,79)',C_SAGE='rgb(127,166,140)',C_WARN='rgb(217,154,43)',C_WHITE='rgb(237,242,238)';
/* `ke` menambahkan tautan ke halaman yang memiliki data grafik ini, supaya
   dari dashboard bisa langsung masuk ke halamannya. */
function chartCard(title,id,extra='',h='',sub='',ke='')
{return `<div class="card"><div class="card-h"><div><h3>${title}</h3>${sub?`<div class="sub">${sub}</div>`:''}</div>${extra||(ke?lihatDi(ke):'')}</div><div class="chart-box ${h}"><canvas id="${id}"></canvas></div></div>`;}
function drawCharts(){
  charts.forEach(c=>c.destroy());charts=[];
  const n=rangeDays(),labels=dayLabels(n),days=[...Array(calc.day()).keys()].map(i=>i+1);
  /* Grafik bobot ikut filter kandang HANYA saat berada di halaman Pertumbuhan.
     Dibatasi ke halaman itu supaya filter yang tertinggal dari halaman lain
     tidak diam-diam mengubah grafik di Dashboard. */
  const ws=calc.weightSeries(state.page==='pertumbuhan'&&state.barn!=='ALL'?state.barn:null);
  // Weight actual vs target (full cycle)
  const tLabels=[...Array(DB.cycle.targetDays).keys()].map(i=>'H'+(i+1));
  const target=tLabels.map((_,i)=>calc.target(i+1));const actual=tLabels.map((_,i)=>{const p=ws.find(w=>w.day===i+1);return p?+p.avg.toFixed(3):null;});
  const wOpts=baseOpts();wOpts.scales.y.title={display:true,text:'kg',color:CHART_DEF.color};
  mkChart('ch-weight',{type:'line',data:{labels:tLabels,datasets:[lineDs('Aktual',actual,C_GREEN,true),lineDs('Target',target,C_WHITE,false,[5,5])]},options:wOpts});
  // Feed
  const fb=calc.feedByDay();const avg=fb.map((_,i)=>{const s=fb.slice(Math.max(0,i-6),i+1);return +(s.reduce((a,b)=>a+b,0)/s.length).toFixed(1);});
  mkChart('ch-feed',{type:'bar',data:{labels,datasets:[{label:'Pakan (kg)',data:lastN(fb,n),backgroundColor:'rgba(168,208,141,.75)',borderRadius:6},lineDs('Rata-rata 7 hari',lastN(avg,n),C_GOLD,false,[4,4])]},options:baseOpts()});
  // FCR
  const fs=calc.fcrSeries();mkChart('ch-fcr',{type:'line',data:{labels:fs.map(x=>'H'+x.day),datasets:[lineDs('FCR',fs.map(x=>x.fcr?+x.fcr.toFixed(2):null),C_GOLD,true)]},options:baseOpts()});
  /* Mortalitas & Populasi.
     Di halaman Populasi & Mortalitas dengan lingkup "Seluruh farm", sumbunya
     TANGGAL dan bukan umur hari. Umur hari hanya berlaku di dalam satu siklus:
     hari ke-20 batch yang satu dan hari ke-20 batch yang lain jatuh pada
     tanggal yang berbeda,
     jadi menumpuknya di satu sumbu akan menjumlahkan dua hari yang tidak pernah
     bersamaan. Dibatasi ke halaman itu — persis seperti filter kandang pada
     grafik bobot di atas — supaya lingkup yang tertinggal tidak diam-diam
     mengubah grafik di Dashboard. */
  const farmGraf=state.page==='populasi'&&state.lingkup==='farm'&&DB.farmPopTx;
  const seriT=farmGraf?calc.seriTanggal(Math.max(7,Math.min(30,n)),'farm'):null;
  const labelsPM=seriT?seriT.map(x=>x.label):labels;
  const mb=seriT?seriT.map(x=>x.mati):lastN(calc.mortByDay(),n);
  mkChart('ch-mort',{type:'bar',data:{labels:labelsPM,datasets:[{label:'Mati (ekor)',data:mb,backgroundColor:'rgba(217,83,79,.8)',borderRadius:6}]},options:baseOpts()});
  const pop=seriT?seriT.map(x=>x.pop):lastN(days.map(d=>calc.population(null,new Date(dateOfDay(d).getTime()+86399000))),n);
  const pOpts=baseOpts();pOpts.scales.y.beginAtZero=false;pOpts.scales.y.min=Math.floor(Math.min(...pop)/50)*50-50;
  mkChart('ch-pop',{type:'line',data:{labels:labelsPM,datasets:[lineDs('Populasi',pop,C_SAGE,true)]},options:pOpts});
  // Finance: cost by category doughnut + cumulative cost/revenue/profit line
  const cbc=calc.costByCat();const cats=Object.keys(cbc);
  mkChart('ch-cost',{type:'doughnut',data:{labels:cats,datasets:[{data:cats.map(c=>cbc[c]),backgroundColor:['#A8D08D','#7FA68C','#C6A15B','#2E8B57','#D99A2B','#5B8C6E','#8FB29B','#E5C98A','#3F7A5C','#B7C9BD','#6C8E7A','#D9D6CC'],borderColor:'#0B241C',borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'right',labels:{color:CHART_DEF.color,boxWidth:10,usePointStyle:true,font:{size:10}}},tooltip:{callbacks:{label:c=>' '+rp(c.parsed)}}}}});
  const cum=[];let acc=0;days.forEach(d=>{const end=new Date(dateOfDay(d).getTime()+86399000);let c=DB.expenses.filter(e=>e.status==='APPROVED'&&e.date<=end).reduce((s,e)=>s+e.amount,0)+DB.feedPurchases.filter(p=>p.status==='APPROVED'&&p.date<=end).reduce((s,p)=>s+p.qty*p.price,0);cum.push(c);});
  const rev=days.map(d=>{const end=new Date(dateOfDay(d).getTime()+86399000);return DB.orders.filter(o=>o.pay==='PAID'&&o.date<=end).reduce((s,o)=>s+calc.orderTotal(o),0);});
  const est=calc.estRevenue();const proj=days.map(d=>Math.round(est*d/DB.cycle.targetDays));
  const fOpts=baseOpts();fOpts.scales.y.ticks.callback=v=>'Rp'+(v/1e6).toFixed(0)+'jt';
  mkChart('ch-fin',{type:'line',data:{labels,datasets:[lineDs('Biaya kumulatif',lastN(cum,n),C_RED,true),lineDs('Omzet realisasi',lastN(rev,n),C_GREEN,true),lineDs('Proyeksi omzet (linear)',lastN(proj,n),C_GOLD,false,[4,4])]},options:fOpts});
  const profit=days.map((d,i)=>rev[i]+proj[i]-cum[i]);
  const prOpts=baseOpts();prOpts.scales.y.beginAtZero=false;prOpts.scales.y.ticks.callback=v=>'Rp'+(v/1e6).toFixed(0)+'jt';
  mkChart('ch-profit',{type:'bar',data:{labels,datasets:[{label:'Proyeksi laba berjalan',data:lastN(profit,n),backgroundColor:lastN(profit,n).map(v=>v>=0?'rgba(168,208,141,.75)':'rgba(217,83,79,.75)'),borderRadius:6}]},options:prOpts});
  // small sparkline for mobile owner? (reuse)
  // barn compare
  const bl=barnsWorking();const bw=bl.map(b=>calc.avgWeight(b.id)||0);const pal=['rgba(168,208,141,.8)','rgba(127,166,140,.8)','rgba(147,183,159,.8)','rgba(107,146,120,.8)'];
  mkChart('ch-barn',{type:'bar',data:{labels:bl.map(b=>b.name),datasets:[{label:'Bobot rata-rata (kg)',data:bw,backgroundColor:bl.map((_,i)=>pal[i%pal.length]),borderRadius:8}]},options:baseOpts({indexAxis:'y'})});
}

/* ---------------- SHELL ---------------- */
const NAV=[['dashboard','Dashboard','home'],['siklus','Siklus Ternak','cycle'],['populasi','Populasi & Mortalitas','duck'],['pakan','Pakan','feed'],['pertumbuhan','Pertumbuhan','growth'],['kesehatan','Kesehatan','heart'],['keuangan','Keuangan','money'],['penjualan','Penjualan','cart'],['stok','Stok & Gudang','box'],['laporan','Laporan','report'],['persetujuan','Persetujuan','check'],['pengguna','Pengguna','users'],['pengaturan','Pengaturan','gear']];
const NAV2=[['anomali','Anomali','alert'],['audit','Audit Trail','shield']];
function renderShell(content){
  const u=state.user;const pend=calc.pendingApprovals().length;const notifs=calc.notifications();
  const navBtn=([p,l,i])=>canPage(p)?`<button class="${state.page===p?'active':''}" data-act="go" data-page="${p}">${ic(i)}<span>${l}</span>${p==='persetujuan'&&pend?`<span class="cnt">${pend}</span>`:''}${p==='anomali'&&calc.anomalies().filter(a=>a.state.status==='OPEN').length?`<span class="cnt" style="background:var(--warn);color:#0B241C">${calc.anomalies().filter(a=>a.state.status==='OPEN').length}</span>`:''}</button>`:'';
  return `<div class="app">
  ${state.sideOpen?'<div class="overlay" data-act="side-close"></div>':''}
  <aside class="sidebar ${state.sideOpen?'open':''}">
    <div class="brand"><img class="logo" src="/img/logo-mark.png" alt="" style="width:42px;height:auto;background:none"><div><b>AR-FARM</b><small>Modern Duck Farming</small></div></div>
    <nav class="nav">${NAV.map(navBtn).join('')}<div class="nav-sec">Integritas Data</div>${NAV2.map(navBtn).join('')}<div class="nav-sec">Publik</div><button data-act="site">${ic('globe')}<span>Website Penjualan</span></button></nav>
    <div class="ai-card"><b>${ic('ai',16)} Tanya Farm AI</b><p>Tanya apa saja tentang populasi, pakan, FCR, stok, atau keuangan siklus ini.</p><button class="btn primary sm" data-act="ai-open">Mulai Chat ${ic('arrow',14)}</button></div>
  </aside>
  <div class="main">
    <div class="demo-band">${DB.farm.name}${DB.cycle?` · Siklus ${DB.cycle.code} · ${fmtLong(DEMO_TODAY)} · hari ke-${calc.day()}`:` · ${fmtLong(new Date())} · belum ada siklus aktif`} · semua angka dihitung dari transaksi</div>
    <header class="topbar">
      <button class="iconbtn hamb" data-act="side-open">${ic('menu')}</button>
      <div class="search">${ic('search',16)}<input id="global-search" placeholder="Cari data, laporan, atau tanya AI…" data-act="search-input"><kbd>⌘K</kbd></div>
      <div style="margin-left:auto;position:relative"><button class="iconbtn" data-act="notif">${ic('bell')}${notifs.length?`<span class="dot">${notifs.length}</span>`:''}</button>
        ${state.notif?`<div class="notif-pop">${notifs.slice(0,7).map(n=>`<div class="it" data-act="go" data-page="${n.page}" style="cursor:pointer"><span style="color:${n.t==='anomaly'?'var(--warn)':n.t==='order'?'var(--gold)':'#F29390'}">${ic(n.t==='anomaly'?'alert':n.t==='order'?'cart':'check',16)}</span><div><b>${n.title}</b><small>${n.sub} · ${fmtDT(n.date)}</small></div></div>`).join('')||'<div class="it">Tidak ada notifikasi.</div>'}</div>`:''}
      </div>
      <div class="cycle-pill">${ic('cycle',16)}<div>${DB.cycle?`<b>Siklus ${DB.cycle.code}</b><small>${fmtDate(DB.cycle.dodDate)} – ${fmtDate(dateOfDay(DB.cycle.targetDays))}</small>`:`<b>Belum ada siklus</b><small>Mulai siklus pertama</small>`}</div></div>
      <div class="user-pill"><span class="avatar">${u.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</span><span><b style="display:block;font-size:13px;line-height:1.1">${u.name}</b><small style="color:var(--muted)">${ROLES[u.role].label}</small></span><button class="btn ghost sm" data-act="logout" title="Keluar">${ic('out',16)}</button></div>
    </header>
    <div class="content" id="content">${content}</div>
  </div></div>`;
}
function pageHead(t,d,r=''){return `<div class="page-head"><div><h1>${t}</h1><div class="desc">${d}</div></div><div class="row">${r}</div></div>`;}
function denied(){return `<div class="denied"><div class="lock">${ic('lock',30)}</div><h2>Akses ditolak</h2><p style="color:var(--muted);max-width:44ch">Role <b>${ROLES[state.user.role].label}</b> tidak memiliki izin untuk halaman ini. Hak akses divalidasi di server, bukan hanya disembunyikan di tampilan.</p><button class="btn" data-act="go" data-page="${state.user.role==='ANAK_KANDANG'?'ak-home':'dashboard'}">Kembali</button></div>`;}
function skeleton(){return `<div class="grid g-kpi">${'<div class="skel" style="height:118px"></div>'.repeat(4)}</div><div class="grid g-2" style="margin-top:14px">${'<div class="skel" style="height:260px"></div>'.repeat(2)}</div>`;}

/* ---------------- ATTENTION LIST (Owner control center) ---------------- */
function attentionItems(){
  const items=[];const pend=calc.pendingApprovals().length;const an=calc.anomalies().filter(a=>a.state.status==='OPEN');
  if(pend)items.push(['red',`${pend} persetujuan menunggu`,'persetujuan']);
  const fd=calc.feedDiff();if(fd&&Math.abs(fd.diff)>=10)items.push(['yel',`Selisih stok pakan ${num(Math.abs(fd.diff))} kg — perlu verifikasi`,'stok']);
  (DB.harian||[]).filter(perluTimbang).forEach(x=>items.push(['yel',`Waktunya timbang ${x.barnName}${x.hariSejakTimbang!=null?' \u2014 terakhir '+x.hariSejakTimbang+' hari lalu':''}`,'pertumbuhan']));
  const gap=calc.weightGap();if(gap==null){/* belum ada pembanding: jangan bilang aman */}else if(gap<-3)items.push(['yel',`Bobot tertinggal ${num(Math.abs(gap))}% dari target`,'pertumbuhan']);else items.push(['grn','Bobot sesuai target batch','pertumbuhan']);
  const dev=(calc.feedToday()-calc.feedAvg7())/calc.feedAvg7()*100;if(Math.abs(dev)>MASTER.batasPakanPct)items.push(['yel',`Konsumsi pakan hari ini ${num(Math.abs(dev))}% ${dev>0?'lebih tinggi':'lebih rendah'} dari rata-rata`,'pakan']);
  const newO=DB.orders.filter(o=>o.status==='NEW').length;if(newO)items.push(['yel',`${newO} order baru dari website belum dikonfirmasi`,'penjualan']);
  DB.inventory.filter(i=>i.qty<i.min).forEach(i=>items.push(['yel',`Stok ${i.name.split(' (')[0]} di bawah minimum`,'stok']));
  items.push([calc.mortPct()<MASTER.targetMortalitasPct?'grn':'red',`Mortalitas ${pct(calc.mortPct())} — ${calc.mortPct()<MASTER.targetMortalitasPct?'normal':'di atas target'}`,'populasi']);
  items.push([calc.feedDaysLeft()>=MASTER.minStokPakanHari?'grn':'red',`Stok pakan cukup untuk ${num(calc.feedDaysLeft(),0)} hari`,'stok']);
  return items;
}
const attentionCard=()=>`<div class="card"><div class="card-h"><h3>Apa yang perlu perhatian saya?</h3><span class="sub">${fmtDT(DEMO_TODAY)}</span>${lihatDi('anomali','Semua temuan')}</div><div class="attn">${attentionItems().map(([c,t,p])=>`<button data-act="go" data-page="${p}"><span class="dotc d-${c}"></span><span>${t}</span><span class="arr">${ic('arrow',14)}</span></button>`).join('')}</div></div>`;
function healthCard(){const h=calc.healthScore();if(h.score==null)return `<div class="card"><div class="card-h"><h3>Farm Health Score</h3>${badge('neutral','BELUM CUKUP DATA')}${lihatDi('kesehatan')}</div><div class="alert info">${ic('clock',16)}<div><b>Skor belum dihitung</b>Skor baru muncul setelah minimal 3 hal punya data: ${h.lewat.join(', ')||'data harian'}. Tanpa data, aplikasi tidak memberi nilai.</div></div></div>`;const col=h.status==='NORMAL'?'#A8D08D':h.status==='WARNING'?'#D99A2B':'#D9534F';const r=50,c=2*Math.PI*r;return `<div class="card"><div class="card-h"><h3>Farm Health Score</h3>${stBadge(h.status)}</div><div class="score"><div class="ring"><svg width="118" height="118" viewBox="0 0 118 118"><circle cx="59" cy="59" r="${r}" stroke="rgba(255,255,255,.1)" stroke-width="10" fill="none"/><circle cx="59" cy="59" r="${r}" stroke="${col}" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-h.score/100)}"/></svg><div class="c"><div><b class="num">${h.score}</b><small>/ 100</small></div></div></div><div class="brk">${h.items.map(([l,v])=>`<div><span>${l}</span><b class="num">${num(v,0)}%</b><div class="bar ${v<70?'w':''}"><i style="width:${v}%"></i></div></div>`).join('')}</div></div><div class="alert ${h.status==='NORMAL'?'ok':h.status==='WARNING'?'warn':'danger'}" style="margin-top:14px">${ic(h.status==='NORMAL'?'check':'alert',18)}<div><b>KONDISI ${h.status}</b>${h.status==='NORMAL'?'Semua parameter dalam batas optimal.':'Ada parameter yang perlu ditindaklanjuti — lihat daftar anomali.'}</div></div></div>`;}

/* ---------------- PAGES ---------------- */
const KPIROW=()=>{const f=calc.fcr();const gap=calc.weightGap();return `<div class="grid g-kpi">
 ${kpi('Populasi Aktif',num(calc.population()),'ekor',`${ic('check',13)} ${pct(calc.population()/DB.cycle.dodQty*100)} dari ${num(DB.cycle.dodQty)} DOD`,'up','duck','','populasi')}
 ${kpi('Bobot Rata-rata',num(calc.avgWeight(),2),'kg',`<div style="flex:1"><div class="bar ${gap<-3?'w':''}"><i style="width:${Math.min(100,calc.avgWeight()/(calc.targetBobotMax()||1)*100)}%"></i></div></div><span>${gap==null?'target belum diatur':`${gap>=0?'+':''}${num(gap,1)}% vs target`}</span>`,gap!=null&&gap<-3?'warn':'up','scale','','pertumbuhan')}
 ${kpi('Pakan Terpakai',num(calc.feedTotal()),'kg',`Hari ini ${num(calc.feedToday())} kg · ${num(calc.feedTotal()/calc.population(),2)} kg/ekor`,'','feed','','pakan')}
 ${kpi('Mortalitas',num(calc.mortTotal()),'ekor',`${pct(calc.mortPct())} · ${calc.mortPct()<MASTER.targetMortalitasPct?'Normal (target <'+MASTER.targetMortalitasPct+'%)':'Di atas target'}`,calc.mortPct()<MASTER.targetMortalitasPct?'up':'down','skull','red','populasi')}
 ${kpi('FCR',f?num(f.fcr,2):'—','',f?`${num(f.feed)} kg ÷ ${num(f.bio,0)} kg biomassa`:'Data belum cukup',f&&calc.fcrBatchLalu()>0&&f.fcr>calc.fcrBatchLalu()?'warn':'','growth','','pertumbuhan')}
 ${can('finance')?kpi('Modal Berjalan',rp(calc.modal()),'',`${rp(calc.modal()/DB.cycle.dodQty)}/ekor DOD`,'','money','gold','keuangan'):''}
 ${can('finance')?kpi('Estimasi Omzet',rp(calc.estRevenue()),'',`${num(calc.projectedPop())} ekor × ~${num(calc.targetBobot(),2)} kg × ${rp(calc.livePrice())}`,'','cart','gold','penjualan'):''}
 ${can('finance')?kpi('Estimasi Laba',rpAtau(calc.estProfit()),'',`ROI ${pctAtau(calc.roi())} · ${calc.estProfit()==null?'isi harga jual produk dulu':'setelah proyeksi biaya sisa '+rpAtau(calc.projectedRemainingCost())}`,calc.estProfit()==null?'':calc.estProfit()>0?'up':'down','growth','gold','keuangan'):''}
</div>`;};
const heroCard=()=>`<div class="hero"><img class="art" src="/img/logo-mark.png" alt="" style="opacity:.16;width:300px">${DB.farm.location?`<div class="weather">${ic('home',18)} <small>${DB.farm.location}</small></div>`:''}
 <div class="row">${stBadge(DB.cycle.status)}<span style="color:var(--muted);font-weight:700">Siklus ${DB.cycle.code}</span></div>
 <h1>${DB.cycle.breed}</h1>
 <div class="meta"><span><b class="num">${num(DB.cycle.dodQty)}</b> DOD</span><span><b class="num">Hari ke-${calc.day()}</b> dari ${DB.cycle.targetDays}</span><span>Fase <b>${DB.cycle.stage}</b></span><span>Estimasi panen <b>${fmtDate(dateOfDay(DB.cycle.targetDays))}</b></span></div>
 <div class="bar" style="max-width:420px;margin-top:6px"><i style="width:${calc.day()/DB.cycle.targetDays*100}%"></i></div></div>`;
const recentActivity=(n=6)=>`<div class="card"><div class="card-h"><h3>Aktivitas Terbaru</h3><button class="btn ghost sm" data-act="go" data-page="audit">Lihat audit trail ${ic('arrow',12)}</button></div><div class="tbl-wrap"><table><thead><tr><th>Waktu</th><th>Aktivitas</th><th>User</th><th>Bukti</th></tr></thead><tbody>${DB.audit.filter(a=>['CREATE','CORRECTION','STOCK_OPNAME'].includes(a.action)).slice(0,n).map(a=>`<tr><td class="num">${fmtDT(a.date)}</td><td style="white-space:normal">${a.detail}</td><td>${userName(a.user)}<br><small style="color:var(--dim)">${userRole(a.user)}</small></td><td>${a.detail.includes('Bukti')||a.entity==='Mortality'||a.entity==='WeightRecord'?photoChip('x'):'—'}</td></tr>`).join('')}</tbody></table></div></div>`;
const anomalyCard=(n=4)=>{const list=calc.anomalies().filter(a=>a.state.status==='OPEN').slice(0,n);return `<div class="card"><div class="card-h"><h3>Peringatan & Anomali</h3><button class="btn ghost sm" data-act="go" data-page="anomali">Lihat semua ${ic('arrow',12)}</button></div><div style="display:flex;flex-direction:column;gap:8px">${list.length?list.map(a=>`<div class="alert ${a.sev==='info'?'info':a.sev}">${ic('alert',16)}<div style="flex:1"><b>${a.title}</b><small style="color:var(--muted)">${fmtDT(a.date)} · ${stBadge('OPEN')}</small></div><button class="btn sm" data-act="go" data-page="${a.page}">Cek</button></div>`).join(''):emptyState('Tidak ada anomali','Semua parameter dalam batas normal.')}</div></div>`;};
const approvalCard=(n=3)=>{const list=calc.pendingApprovals().slice(0,n);return `<div class="card"><div class="card-h"><h3>Persetujuan Menunggu ${list.length?`<span class="badge b-danger">${calc.pendingApprovals().length}</span>`:''}</h3><button class="btn ghost sm" data-act="go" data-page="persetujuan">Lihat semua ${ic('arrow',12)}</button></div><div style="display:flex;flex-direction:column;gap:8px">${list.length?list.map(p=>`<div class="alert info" style="align-items:center">${ic(p.kind==='CORRECTION'?'pen':p.kind==='ORDER'?'cart':'feed',16)}<div style="flex:1;min-width:0"><b>${p.title}</b><small style="color:var(--muted)">${p.sub} · ${userName(p.by)}</small></div>${can('approve')?`<button class="btn danger sm" data-act="reject" data-id="${p.id}" data-kind="${p.kind}">Tolak</button><button class="btn ok sm" data-act="approve" data-id="${p.id}" data-kind="${p.kind}">Setujui</button>`:stBadge('PENDING')}</div>`).join(''):emptyState('Tidak ada yang menunggu','Semua transaksi sudah diproses.')}</div></div>`;};

/* ---------- Laporan kematian: semua kandang, per umur, per penyebab ---------- */
function batang(n,maks,warna){const w=maks>0?Math.max(2,Math.round(n/maks*100)):0;return `<div style="flex:1;min-width:60px;height:8px;border-radius:6px;background:rgba(255,255,255,.08);overflow:hidden"><i style="display:block;height:100%;width:${w}%;background:${warna||'var(--soft)'}"></i></div>`;}
/* Kartu mortalitas — permintaan Abdur 26 Nov 2026.
   Menggantikan satu kalimat yang dulu menumpang di kotak hijau "Balance OK".
   Isinya tiga hal yang sebelumnya tidak ada di mana pun:
     - mortalitas MURNI (afkir tidak ikut) dengan warna sesuai target
     - berapa hari berturut-turut kematian di atas batas
     - kerugian dalam rupiah, bukan cuma jumlah ekor */
function kartuMortalitas(barn,L){
  const p=calc.matiPisah(barn,L);
  if(!p.total)return `<div class="card" style="margin-bottom:14px"><div class="card-h"><h3>Mortalitas</h3></div>
   <div class="alert ok">${ic('check',16)}<div><b>Belum ada kematian tercatat</b>Semua bebek yang masuk masih hidup menurut catatan.</div></div></div>`;
  /* Target yang berlaku untuk lingkup ini: batch -> kandang -> farm.
     Lihat calc.targetMati(). Asalnya ikut disebut di layar. */
  const T=calc.targetMati(barn);
  const tgt=T.pct, mp=calc.mortPctMurni(barn,L), ap=calc.afkirPct(barn,L);
  const lewat=!T.bawaan&&tgt>0&&mp!=null&&mp>tgt;
  const asal=T.dari==='batch'?'target batch ini':T.dari==='kandang'?'target kandang ini':'target farm';
  const beruntun=calc.matiBeruntun(barn,L);
  /* Perkiraan kerugian rupiah HANYA untuk lingkup siklus. Hitungannya memakai
     umur bebek saat mati (dayOf), dan umur itu dihitung dari tanggal DOD
     siklus yang sedang dibuka. Di lingkup seluruh farm umur batch lain akan
     salah, jadi angkanya tidak ditampilkan daripada menampilkan angka keliru. */
  const rugi=L?null:calc.rugiMati(barn);
  const angka=(l,v,u,k,warna)=>`<div style="border-left:3px solid ${warna||'var(--line)'};padding-left:14px">
    <div style="font-size:12px;color:var(--muted);margin-bottom:5px">${l}</div>
    <div><b class="num" style="font-size:24px${warna?`;color:${warna}`:''}">${v}</b>${u?` <small style="font-size:12px;color:var(--muted)">${u}</small>`:''}</div>
    <div style="font-size:11.5px;color:var(--dim);margin-top:4px">${k}</div></div>`;
  return `<div class="card" style="margin-bottom:14px">
   <div class="card-h"><h3>Mortalitas${barn?' · '+barnName(barn):''}</h3><span class="sub">${L?'seluruh farm · ':''}afkir dihitung terpisah</span></div>
   <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:20px">
    ${angka('Mati sendiri',num(p.mati),'ekor',mp==null?'&mdash;':`${pct(mp)} dari DOD masuk`,lewat?'#F2C46B':'var(--soft)')}
    ${angka('Afkir (disingkirkan)',num(p.afkir),'ekor',ap==null?'&mdash;':`${pct(ap)} dari DOD masuk`,'')}
    ${angka('Berkurang seluruhnya',num(p.total),'ekor','mati + afkir','')}
    ${tgt>0&&!T.bawaan?angka('Target yang berlaku','&lt; '+num(tgt,1),'%',`${asal} \u00b7 hanya untuk yang mati sendiri`,''):''}
   </div>
   ${(()=>{
     /* Tiga keadaan, bukan dua. Ketahuan di produksi 26 Nov 2026: target
        mortalitas di sana masih angka BAWAAN yang belum Abdur sahkan, jadi
        `lewat` bernilai false dan layar menulis "29,5% masih di bawah target
        5,0%" — padahal 29,5% jelas di atas 5%. Kalau targetnya belum disahkan
        pemilik, aplikasi tidak boleh memberi vonis sama sekali; cukup
        tampilkan angkanya dan katakan targetnya belum diatur. */
     if(mp==null)return '';
     const belumDiatur=!(tgt>0)||T.bawaan;
     const ekorAfkir=`Afkir ${num(p.afkir)} ekor tidak ikut dihitung di angka ini.`;
     if(belumDiatur)return `<div class="alert info" style="margin-top:14px">${ic('alert',16)}<div><b>Mortalitas ${pct(mp)} — belum bisa dinilai</b>Target mortalitas belum Bapak sahkan, jadi aplikasi tidak menyimpulkan ini bagus atau jelek. Isi di Pengaturan → Master Data. ${ekorAfkir}</div></div>`;
     if(lewat)return `<div class="alert warn" style="margin-top:14px">${ic('alert',16)}<div><b>Mortalitas ${pct(mp)} — di atas ${asal} ${num(tgt,1)}%</b>Ini angka mati sendiri saja; ${num(p.afkir)} ekor afkir tidak ikut dihitung. Periksa penyebab terbanyak di tab Laporan Kematian.</div></div>`;
     return `<div class="alert ok" style="margin-top:14px">${ic('check',16)}<div><b>Mortalitas ${pct(mp)} — masih di bawah ${asal} ${num(tgt,1)}%</b>${ekorAfkir}</div></div>`;})()}
   ${beruntun?`<div class="alert warn" style="margin-top:10px">${ic('clock',16)}<div><b>${beruntun.hari} hari berturut-turut kematian di atas batas ${beruntun.batas} ekor/hari</b>Sejak ${fmtDate(beruntun.sejak)}, total ${num(beruntun.ekor)} ekor. Bocor pelan seperti ini sering lolos dari grafik karena tidak terlihat sebagai lonjakan.</div></div>`:''}
   ${rugi?kerugianMati(rugi):''}
   ${L?`<p style="margin:14px 0 0;font-size:12px;color:var(--dim)">Perkiraan kerugian dalam rupiah tidak ditampilkan di lingkup seluruh farm, karena hitungannya memakai umur bebek saat mati dan umur itu beda-beda antar batch. Pilih "Siklus ini" untuk melihatnya.</p>`:''}
   ${barn?'':tabelTargetKandang(L)}
  </div>`;}

/* Perbandingan tiap kandang terhadap targetnya masing-masing — diminta Abdur
   27 Nov 2026. Satu angka target untuk seluruh farm membuat kandang bagus
   terlihat biasa saja dan kandang bermasalah tidak pernah menonjol. Tabel ini
   menampilkan tiap kandang berjalan beserta target yang berlaku untuknya dan
   dari mana target itu berasal, supaya tidak ada kebingungan angka siapa. */
function tabelTargetKandang(L){
  /* LINGKUPNYA DISAMAKAN dengan kartu di atasnya (27 Nov 2026). Sebelum ini
     tabel ini selalu farm-wide sementara kartu di atasnya hanya siklus yang
     dibuka — satu kartu memuat dua lingkup berbeda, persis cacat yang sudah
     pernah diperbaiki di kartu kerugian. */
  let r=(DB.targetMatiKandang||[]).filter(x=>x.dod>0);
  if(L!=='farm'&&DB.cycle)r=r.filter(x=>x.batch===DB.cycle.code);
  if(r.length<2)return '';
  /* Dibatasi 15 baris supaya tetap terbaca di farm dengan banyak petak.
     Yang dipotong justru yang mortalitasnya paling rendah, karena urutannya
     dari yang paling tinggi — yang perlu perhatian selalu ikut tampil. */
  const semua=r.slice().sort((a,b)=>(b.matiPct??-1)-(a.matiPct??-1));
  const BATAS=15;
  const baris=semua.slice(0,BATAS);
  const sisa=semua.length-baris.length;
  const asalKata=d=>d==='batch'?'batch':d==='kandang'?'kandang':'farm';
  return `<div style="margin-top:18px">
   <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:4px">
     <b style="font-size:14px">Tiap kandang vs targetnya</b>
     <span class="sub">urut dari yang paling tinggi</span></div>
   <p style="margin:0 0 12px;font-size:12px;color:var(--dim)">Target diambil dari yang paling khusus: target batch, lalu target kandang, lalu target farm. Atur target kandang di Pengaturan → Kandang.</p>
   <div class="tbl-wrap"><table><thead><tr><th>Kandang</th><th>Batch</th><th class="r">DOD masuk</th><th class="r">Mati</th><th class="r">Mortalitas</th><th class="r">Target</th><th>Keadaan</th></tr></thead><tbody>
   ${baris.map(x=>{
     const adaTgt=x.target!=null&&x.target>0&&!(x.dari==='farm'&&calc.bawaan('targetMortalitasPct'));
     const lwt=adaTgt&&x.matiPct!=null&&x.matiPct>x.target;
     return `<tr>
      <td><b>${esc(x.nama)}</b></td>
      <td class="sub">${x.batch}</td>
      <td class="r num">${num(x.dod)}</td>
      <td class="r num">${num(x.mati)}${x.afkir?`<br><small style="color:var(--dim)">+${num(x.afkir)} afkir</small>`:''}</td>
      <td class="r num"${lwt?' style="color:#F2C46B"':''}><b>${x.matiPct==null?'—':pct(x.matiPct)}</b></td>
      <td class="r num">${adaTgt?`${num(x.target,1)}%<br><small style="color:var(--dim)">dari ${asalKata(x.dari)}</small>`:'<small style="color:var(--dim)">belum diatur</small>'}</td>
      <td>${!adaTgt?'<small style="color:var(--dim)">belum bisa dinilai</small>':lwt?badge('warn','DI ATAS TARGET'):badge('ok','AMAN')}</td></tr>`;}).join('')}
   </tbody></table></div>
   ${sisa>0?`<p style="margin:10px 0 0;font-size:12px;color:var(--dim)">+${sisa} kandang lain dengan mortalitas lebih rendah tidak ditampilkan. Pilih kandangnya di atas untuk melihat satu per satu.</p>`:''}</div>`;}

/* Kerugian kematian dalam rupiah. Selalu menyebutkan dasar hitungannya, dan
   menolak menampilkan angka kalau dasarnya belum lengkap. */
function kerugianMati(r){
  if(r.kosong)return '';
  if(r.kurang)return `<div class="alert info" style="margin-top:10px">${ic('money',16)}<div><b>Kerugian belum bisa dihitung dalam rupiah</b>${r.kurang==='harga DOD belum ada'?'Harga DOD batch ini belum terisi.':'Belum ada nota pembelian pakan, jadi nilai pakan yang sudah dimakan belum bisa dihitung.'} Jumlah ekornya tetap benar di atas.</div></div>`;
  const sel=(l,v,k)=>`<div><div style="font-size:12px;color:var(--muted)">${l}</div><div class="num" style="font-size:19px;font-weight:700;margin-top:3px">${v}</div><div style="font-size:11.5px;color:var(--dim);margin-top:3px">${k}</div></div>`;
  return `<div style="margin-top:14px;background:rgba(242,147,144,.07);border:1px solid rgba(242,147,144,.25);border-radius:12px;padding:16px 18px">
   <div style="font-size:14px;font-weight:700;color:#F0B9AC;margin-bottom:12px">Perkiraan kerugian ${num(r.ekor)} ekor yang mati</div>
   <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:18px">
    ${sel('Harga bibit hangus',rp(r.dod),`${num(r.ekor)} ekor × ${rp(r.hargaDod)}`)}
    ${sel('Pakan yang sudah dimakan',rp(r.pakan),`${num(r.pakanKg,1)} kg × ${rp(r.hargaPakan)}/kg`)}
    ${sel('Total','<b style="color:#F29390">'+rp(r.total)+'</b>','bibit + pakan terbuang')}
   </div>
   <small style="display:block;margin-top:12px;color:var(--dim)">Perkiraan, bukan angka pasti. Pakan dihitung dari pakem jatah per umur yang Bapak atur sendiri dikali harga nota pakan terbaru — bebek yang mati hari ke-22 sudah makan 22 hari pakan, yang mati hari ke-2 belum.${r.tanpaPakem?` ${num(r.tanpaPakem)} ekor tidak ikut dihitung pakannya karena pakem jatah untuk umur itu belum diisi.`:''}${r.ekorAfkir?` Afkir ${num(r.ekorAfkir)} ekor tidak dihitung di sini.`:''}</small>
  </div>`;}

function laporanMati(){
 const h=(DB.harian||[]).map(x=>({...x,persen:x.masuk>0?x.mati/x.masuk*100:0})).sort((a,b)=>b.persen-a.persen||b.mati-a.mati);
 const mu=DB.mortUmur||[];const total=mu.reduce((s,x)=>s+x.n,0);
 const kel=[[1,7],[8,14],[15,21],[22,28],[29,35],[36,999]].map(([a,b])=>{
   const isi=mu.filter(x=>x.umur>=a&&x.umur<=b);
   return {label:b===999?'Umur 36 hari ke atas':`Umur ${a}\u2013${b} hari`,
     n:isi.reduce((s,x)=>s+x.n,0),
     mati:isi.reduce((s,x)=>s+(+x.mati||0),0),
     afkir:isi.reduce((s,x)=>s+(+x.afkir||0),0)};});
 const maksKel=Math.max(0,...kel.map(k=>k.n));
 const sb=DB.mortSebab||[];const maksSb=Math.max(0,...sb.map(x=>x.n));
 const kosong='<div class="alert info">Belum ada kematian yang tercatat.</div>';
 return `<div class="card" style="margin-bottom:14px"><div class="card-h"><h3>Semua Kandang</h3><span class="sub">diurutkan dari kematian tertinggi</span></div>
  ${h.length?`<div class="tbl-wrap"><table><thead><tr><th>Kandang</th><th>Batch</th><th class="r">Umur</th><th class="r">Masuk</th><th class="r">Mati</th><th class="r">Hari ini</th><th class="r">%</th><th></th></tr></thead><tbody>${h.map(x=>`<tr><td><b>${x.barnName}</b></td><td>${x.code}</td><td class="r num">${x.umur} hari</td><td class="r num">${num(x.masuk)}</td><td class="r num"><b>${num(x.mati)}</b></td><td class="r num">${x.matiHariIni||'\u2014'}</td><td class="r num">${pct(x.persen)}${!calc.bawaan('targetMortalitasPct')&&MASTER.targetMortalitasPct>0&&x.persen>MASTER.targetMortalitasPct?' '+badge('warn','DI ATAS TARGET'):''}</td><td style="min-width:90px"><div style="display:flex">${batang(x.persen,Math.max(...h.map(y=>y.persen)),'#F29390')}</div></td></tr>`).join('')}</tbody></table></div>`:'<div class="alert info">Belum ada kandang yang berisi ternak.</div>'}</div>
 <div class="grid g-2"><div class="card"><div class="card-h"><h3>Kematian per Umur</h3><span class="sub">semua batch · ${num(total)} ekor</span></div>
  ${total?`<div style="display:flex;flex-direction:column;gap:10px">${kel.map(k=>`<div style="display:flex;align-items:center;gap:10px"><span style="width:150px;flex:none;font-size:13px">${k.label}</span>${batang(k.n,maksKel,'#F29390')}<b class="num" style="width:124px;text-align:right;flex:none">${num(k.n)} · ${pct(k.n/total*100,0)}${k.afkir?`<br><small style="font-weight:400;color:var(--dim)">${num(k.afkir)} afkir</small>`:''}</b></div>`).join('')}</div><small style="display:block;margin-top:12px;color:var(--dim)">Kalau kematian menumpuk di satu rentang umur, di situlah yang perlu diperiksa. Angka besar sudah termasuk afkir; yang afkir disebut terpisah di bawahnya.</small>`:kosong}</div>
 <div class="card"><div class="card-h"><h3>Penyebab Terbanyak</h3><span class="sub">semua batch</span></div>
  ${sb.length?`<div style="display:flex;flex-direction:column;gap:10px">${sb.map(x=>`<div style="display:flex;align-items:center;gap:10px"><span style="width:150px;flex:none;font-size:13px">${esc(x.sebab)}${x.kind==='AFKIR'?' '+badge('neutral','AFKIR'):''}</span>${batang(x.n,maksSb)}<b class="num" style="width:92px;text-align:right;flex:none">${num(x.n)} · ${pct(x.n/total*100,0)}</b></div>`).join('')}</div>`:kosong}</div></div>`;}

/* ---------- Pakan hari ini per kandang — dari catatan farm sendiri, tanpa angka standar ---------- */
const LABEL_UMUR=['Umur 1–7 hari','Umur 8–14 hari','Umur 15–21 hari','Umur 22–28 hari','Umur 29 hari – panen'];
/* Penyebab kematian — SATU daftar untuk semua form.
   Sebelum 26 Nov 2026 form anak kandang dan form Owner punya daftar sendiri
   yang tidak sama ("Sakit" vs "Sakit (diare)" dan "Sakit (pernapasan)").
   Akibatnya penyakit yang sama terpecah jadi beberapa baris di laporan
   "Penyebab Terbanyak" dan tidak pernah terlihat sebagai yang terbanyak.
   Kalau menambah sebab baru, tambahkan DI SINI saja. */
const SEBAB_MATI=['Belum diketahui','Lemah / kerdil','Terinjak','Sakit (diare)','Sakit (pernapasan)','Sakit (lainnya)','Kaki lumpuh','Predator','Lainnya'];
const opsiSebab=(pilih)=>SEBAB_MATI.map(s=>`<option${s===pilih?' selected':''}>${s}</option>`).join('');
function jatahInputs(vals,ro){return `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">${LABEL_UMUR.map((l,i)=>`<div class="f"><label>${l}</label><input name="jatah_${i}" type="number" step="1" min="0" max="1000" value="${vals&&vals[i]!=null?vals[i]:''}" placeholder="gram/ekor/hari" ${ro?'disabled class="ro"':''}></div>`).join('')}</div>`;}
function bacaJatah(v){const g=[0,1,2,3,4].map(i=>v['jatah_'+i]);return g.every(x=>x!==undefined&&String(x).trim()!=='')?g.map(Number):null;}
function perluTimbang(x){const j=+MASTER.jadwalTimbangHari||0;if(!j)return false;return x.hariSejakTimbang==null?x.umur>=j:x.hariSejakTimbang>=j;}
/* Pakan hari ini PER KANDANG: jatah sesuai umur x bebek hidup kandang itu, dibagi pagi & sore. */
function kartuPakanHarian(){const h=DB.harian||[];if(!h.length)return '';
 const boleh=['OWNER','MANAGER'].includes(state.user.role);
 const butuh=h.reduce((s,x)=>s+(x.jatahKg||0),0),tercatat=h.reduce((s,x)=>s+x.pakanHariIni,0);
 const sesiBeres=h.reduce((s,x)=>s+(x.pakanPagi>0?1:0)+(x.pakanSore>0?1:0),0);
 const stok=calc.feedStockTheory();const cukup=butuh>0?stok/butuh:null;
 const sel=(x,sesi)=>{const kg=sesi==='PAGI'?x.pakanPagi:x.pakanSore;
  if(kg>0)return `<b>${num(kg,1)} kg</b> ${badge('ok','✓')}`;
  return boleh?`<button class="btn sm primary" data-act="modal" data-m="feed-use" data-id="${x.barn}" data-kind="${sesi}">${x.jatahSesiKg!=null?num(x.jatahSesiKg,1)+' kg':'Catat'}</button>`:(x.jatahSesiKg!=null?num(x.jatahSesiKg,1)+' kg ':'')+badge('warn','BELUM');};
 const popFarm=h.reduce((s,x)=>s+(+x.pop||0),0);
 return `<div class="card" style="margin-bottom:14px">
  ${lingkup('farm','Pakan hari ini per kandang',`${h.length} kandang aktif · ${num(popFarm)} ekor`,`Semua kandang yang sedang berisi, bukan hanya siklus yang dibuka di atas. ${sesiBeres} dari ${h.length*2} pemberian (pagi &amp; sore) sudah dicatat.`)}
  ${calc.bawaan('pakemPakan')&&h.some(x=>!x.jatahKhusus)?`<div class="alert warn" style="margin-bottom:12px">${ic('alert',16)}<div><b>Jatah masih angka awal</b>Jatah gram per umur memakai angka awal dari mockup dan belum Bapak sahkan. Periksa dan simpan di Pengaturan → Master Data → Pakem Jatah Pakan, atau isi jatah khusus per batch.</div></div>`:''}
  <div class="kv" style="row-gap:8px;margin-bottom:14px"><span>Kebutuhan hari ini</span><b class="num">${butuh>0?num(butuh,1)+' kg':'—'}</b><span>Sudah dicatat</span><b class="num">${num(tercatat,1)} kg</b><span>Stok gudang</span><b class="num">${num(stok,1)} kg${cukup!=null?` · cukup ±${num(cukup,0)} hari`:''}</b></div>
  <div class="tbl-wrap"><table><thead><tr><th>Kandang</th><th class="r">Umur</th><th class="r">Ekor</th><th class="r">Jatah</th><th class="r">Kebutuhan</th><th class="r">Pagi</th><th class="r">Sore</th><th class="r">FCR</th><th>Bobot</th></tr></thead><tbody>
  ${h.map(x=>`<tr><td><b>${x.barnName}</b> <small style="color:var(--dim)">${x.code}</small></td><td class="r num">${x.umur} hari</td><td class="r num">${num(x.pop)}</td><td class="r num">${x.jatahGram!=null?num(x.jatahGram,0)+' g':'—'}</td><td class="r num"><b>${x.jatahKg!=null?num(x.jatahKg,1)+' kg':'—'}</b></td><td class="r num">${sel(x,'PAGI')}</td><td class="r num">${sel(x,'SORE')}</td><td class="r num">${x.fcr!=null?num(x.fcr,2):'—'}</td><td>${x.bobot!=null?`<span class="num">${num(x.bobot,2)} kg</span> <small style="color:var(--dim)">${x.hariSejakTimbang===0?'hari ini':x.hariSejakTimbang+' hari lalu'}</small>`:'<small style="color:var(--dim)">belum ditimbang</small>'}${perluTimbang(x)?' '+(boleh?`<button class="btn sm" data-act="modal" data-m="weigh" data-id="${x.barn}">Timbang</button>`:badge('warn','TIMBANG')):''}</td></tr>`).join('')}
  </tbody><tfoot class="total"><tr><td><b>Total farm</b></td><td class="r num">—</td><td class="r num">${num(popFarm)}</td><td class="r num">—</td><td class="r num">${butuh>0?num(butuh,1)+' kg':'—'}</td><td class="r num">—</td><td class="r num">—</td><td class="r num">—</td><td>—</td></tr></tfoot></table></div><small style="display:block;margin-top:10px;color:var(--dim)">Baris <b>Total farm</b> adalah jumlah seluruh kandang di tabel ini, bukan angka siklus yang dibuka di kartu bawah. Kebutuhan = jatah gram sesuai umur × bebek hidup di kandang itu, dibagi dua untuk pagi dan sore. Tombol di kolom Pagi/Sore membuka form dengan angka itu sudah terisi; ubah kalau yang diberikan beda. FCR = pakan terpakai ÷ pertambahan bobot hidup kandang itu, muncul setelah ada timbangan.</small></div>`;}
/* Ringkasan SELURUH FARM. Dibuat supaya lingkup farm punya tempatnya sendiri dan
   tidak lagi menumpang di bagian siklus. Semua angkanya dari data yang sama yang
   sudah dipakai tabel pakan di atas — tidak ada hitungan baru. */
function kartuRingkasanFarm(){
 const h=DB.harian||[];if(!h.length)return '';
 const popFarm=h.reduce((s,x)=>s+(+x.pop||0),0);
 const butuh=h.reduce((s,x)=>s+(x.jatahKg||0),0);
 const siklus=[...new Set(h.map(x=>x.code))];
 const stok=calc.feedStockTheory();
 /* Berapa hari stok cukup. calc.feedDaysLeft() memakai rata-rata pemakaian 7 hari
    dan sengaja mengembalikan null kalau belum ada pakan yang dicatat — jangan
    diterjemahkan jadi "perlu pembelian", karena stoknya bisa saja penuh.
    Kalau begitu, pakai dasar yang sama dengan tabel pakan di atas: stok dibagi
    kebutuhan hari ini. Kalau dua-duanya belum ada dasarnya, katakan apa adanya. */
 const hariPakai=calc.feedDaysLeft();
 const hariButuh=butuh>0?stok/butuh:null;
 const ketStok=hariPakai!=null?`cukup ±${num(hariPakai,0)} hari (dari pemakaian 7 hari)`
   :hariButuh!=null?`cukup ±${num(hariButuh,0)} hari (dari kebutuhan hari ini)`
   :'belum bisa dihitung — kebutuhan harian belum ada';
 const sel=(l,v,u,k)=>`<div style="border-left:3px solid var(--line);padding-left:14px"><div style="font-size:12px;color:var(--muted);margin-bottom:5px">${l}</div><div><b class="num" style="font-size:24px">${v}</b>${u?` <small style="font-size:12px;color:var(--muted)">${u}</small>`:''}</div><div style="font-size:11.5px;color:var(--dim);margin-top:4px">${k}</div></div>`;
 return `<div class="card lingkup-blok">
  ${lingkup('farm','Ringkasan seluruh kandang')}
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:20px">
   ${sel('Populasi seluruh farm',num(popFarm),'ekor',`${h.length} kandang aktif`)}
   ${sel('Kebutuhan pakan',butuh>0?num(butuh,1):'—','kg','hari ini, semua kandang')}
   ${sel('Siklus berjalan',siklus.length,'siklus',siklus.length<=4?siklus.join(', '):`${siklus.slice(0,4).join(', ')} dan ${siklus.length-4} lainnya`)}
   ${sel('Stok pakan gudang',num(stok,1),'kg',ketStok)}
  </div></div>`;}
/* Kepala bagian untuk kartu KPI: menegaskan bahwa angka di bawahnya HANYA siklus
   yang sedang dibuka, bukan seluruh farm. */
function kepalaSiklus(){
 if(!DB.cycle)return '';
 const h=(DB.harian||[]).find(x=>x.code===DB.cycle.code);
 const nama=h?`Siklus ${DB.cycle.code} — ${h.barnName}`:`Siklus ${DB.cycle.code}`;
 /* Kandang lain disebut namanya hanya kalau sedikit; kalau banyak cukup
    jumlahnya, supaya kalimatnya tidak membengkak di farm dengan banyak kandang. */
 const lain=[...new Set((DB.harian||[]).filter(x=>x.code!==DB.cycle.code).map(x=>x.barnName))];
 const sebut=!lain.length?''
   :lain.length<=2?` ${lain.join(' dan ')} tidak dihitung di sini.`
   :` ${lain.length} kandang lain tidak dihitung di sini.`;
 return `<div class="lingkup-blok">${lingkup('siklus',nama,`${num(calc.population())} ekor · hari ke-${calc.day()}`,
   `Angka di bawah ini hanya siklus ini.${sebut}`)}</div>`;}
function kartuPakem(){const own=state.user.role==='OWNER';
 return `<div class="card" style="margin-top:14px"><div class="card-h"><h3>Pakem Jatah Pakan${tandaBawaan('pakemPakan')}</h3>${badge('gold','OWNER ONLY')}</div>
 <div class="alert ${calc.bawaan('pakemPakan')?'warn':'info'}" style="margin-bottom:14px">${ic(calc.bawaan('pakemPakan')?'alert':'feed',16)}<div><b>${calc.bawaan('pakemPakan')?'Angka awal dari mockup, belum disahkan':'Dipakai menghitung kebutuhan pakan tiap kandang'}</b>Gram per ekor per hari. Berlaku untuk kandang yang tidak punya jatah khusus. Jatah khusus per batch diisi di form Batch Baru atau Ubah Target.</div></div>
 <form class="form" data-act="submit-pakem">${jatahInputs(MASTER.pakemPakan,!own)}${own?'<button class="btn primary" type="submit" style="margin-top:12px">Simpan pakem</button>':''}</form></div>`;}


/* =====================================================================
   HALAMAN KANDANG — satu kandang, satu halaman. Dipakai Owner, Manager,
   dan anak kandang (anak kandang hanya untuk kandang yang dia pegang).
   ===================================================================== */
function teksTarget(){const a=calc.targetBobot(),b=calc.targetBobotMax();if(!a)return '—';return a===b||!b?num(a,2).replace(/,?0+$/,'')||num(a,1):num(a,1)+'–'+num(b,1);}
const NAMA_JENIS={STARTER:'starter',GROWER:'grower',FINISHER:'finisher'};
const NAMA_BIAYA={OBAT:'Obat',VITAMIN:'Vitamin',SEKAM:'Sekam',LISTRIK:'Listrik',GAS:'Gas',TENAGA_KERJA:'Tenaga kerja',TRANSPORT:'Transport',PERALATAN:'Peralatan',MAINTENANCE:'Perbaikan',LAIN:'Lainnya',DOD:'DOD',PAKAN:'Pakan'};
function barisKerja(judul,ket,kanan,tegas){return `<div class="hist" style="align-items:center;${tegas?'border-color:rgba(168,208,141,.45)':''}"><div style="flex:1;min-width:0"><b>${judul}</b><small style="display:block">${ket}</small></div><div style="flex:none;text-align:right">${kanan}</div></div>`;}
/* Kartu HPP & BEP.
   Dua angka berdampingan dan sengaja TIDAK dicampur:
     AKTUAL   — biaya yang sudah terjadi dibagi panen yang sudah ada. Nol estimasi.
     PROYEKSI — biaya nyata + sisa biaya, dibagi seluruh hasil sampai panen.
   Yang dipakai untuk menentukan harga adalah yang proyeksi selama batch berjalan,
   dan yang aktual begitu batch habis dipanen. Kalau datanya belum cukup, kartunya
   menulis PERLU DATA beserta apa yang kurang — bukan angka yang terlihat jadi. */
const LABEL_HPP = {
  final:    ['ok',   'ANGKA FINAL',    'Batch sudah habis dipanen. Angka ini dari timbangan panen yang tercatat, bukan perkiraan.'],
  sebagian: ['gold', 'PANEN SEBAGIAN', 'Sebagian bebek sudah dipanen, sebagian masih di kandang. Yang dipakai untuk menentukan harga adalah kolom PROYEKSI.'],
  estimasi: ['warn', 'ESTIMASI',       'Belum ada panen. Seluruh angka di kartu ini masih perkiraan.'],
};
function kolomHpp(judul, tanda, perKg, perEkor, dasarKg, dasarEkor, ket){
  return `<div style="flex:1;min-width:190px;padding:12px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)">
   <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><b style="font-size:12px;letter-spacing:.06em;color:var(--muted)">${judul}</b>${tanda}</div>
   <b class="num" style="font-size:21px;display:block">${perKg!=null?rp(perKg):'—'}</b>
   <small style="display:block;color:var(--muted);margin-bottom:8px">per kg bobot hidup</small>
   <b class="num" style="font-size:15px;display:block">${perEkor!=null?rp(perEkor):'—'}</b>
   <small style="display:block;color:var(--muted)">per ekor</small>
   <small style="display:block;margin-top:9px;color:var(--dim)">Penyebut: ${dasarKg!=null?num(dasarKg,1)+' kg':'—'}${dasarEkor!=null?' · '+num(dasarEkor)+' ekor':''}</small>
   ${ket?`<small style="display:block;margin-top:5px;color:var(--dim)">${ket}</small>`:''}</div>`;
}
function kartuHppBep(){
  const ak = calc.hppAktual(), pr = calc.hppProyeksi(), mg = calc.marginKg();
  const kurang = calc.kurangDataProyeksi();
  const judul = `<p class="nav-sec" style="padding:18px 2px 8px">HPP & titik impas</p>`;

  // Tidak ada panen DAN proyeksi tidak bisa dihitung: tidak ada angka apa pun.
  if(!ak && !pr){
    return `${judul}<div class="card"><div class="card-h"><h3>Biaya pokok batch ${DB.cycle.code}</h3>${badge('neutral','PERLU DATA')}</div>
     <div class="alert warn">${ic('alert',16)}<div><b>Belum bisa dihitung</b>
     ${kurang.length?'Yang masih kurang: '+kurang.join(', ')+'.':'Belum ada panen dan belum ada dasar perhitungan.'}
     Angkanya muncul sendiri begitu datanya ada. Tidak ada angka perkiraan yang ditampilkan sebelum itu.</div></div></div>`;
  }

  const jenis = ak && ak.jenis==='final' ? 'final' : (ak ? 'sebagian' : 'estimasi');
  const [w,label,ket] = LABEL_HPP[jenis];
  const brl = calc.hppBerlaku();
  const hp = calc.hargaPakanTerbaru(), kb = calc.kebutuhanPakanSisa();

  const kolomAktual = ak
    ? kolomHpp('BIAYA YANG SUDAH TERJADI', badge('ok','AKTUAL'), ak.perKg, ak.perEkor, ak.kg, ak.ekor,
        ak.jenis==='sebagian' ? `Biaya seluruh batch dibagi panen pertama saja, karena ${num(ak.sisaEkor)} ekor belum dipanen. Jangan dipakai menentukan harga.` : 'Modal penuh dibagi seluruh hasil panen.')
    : kolomHpp('BIAYA YANG SUDAH TERJADI', badge('neutral','PERLU DATA'), null, null, null, null,
        'Belum ada panen, jadi belum ada pembagi. Angka ini muncul setelah panen pertama tercatat.');

  const kolomProyeksi = pr
    ? kolomHpp('PERKIRAAN SAMPAI PANEN', badge('warn','ESTIMASI'), pr.perKg, pr.perEkor, pr.kg, pr.ekor,
        `${rp(pr.modalNyata)} biaya nyata + ${rp(pr.sisaBiaya)} perkiraan sisa. Penyebut: ${pr.kgPanen>0?num(pr.kgPanen,1)+' kg sudah dipanen + ':''}${num(pr.sisaEkor)} ekor x ${num(calc.targetBobot(),2)} kg target.`)
    : kolomHpp('PERKIRAAN SAMPAI PANEN', badge('neutral','PERLU DATA'), null, null, null, null,
        kurang.length ? 'Yang masih kurang: '+kurang.join(', ')+'.' : 'Batch sudah selesai, tidak ada lagi yang diproyeksikan.');

  return `${judul}
  <div class="card"><div class="card-h"><h3>Biaya pokok batch ${DB.cycle.code}</h3>${badge(w,label)}</div>
   <div style="display:flex;flex-wrap:wrap;gap:12px">${kolomAktual}${kolomProyeksi}</div>

   ${brl?`<div style="margin-top:14px;padding:13px;border-radius:12px;background:rgba(198,161,91,.1);border:1px solid rgba(198,161,91,.3)">
     <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end">
      <div style="flex:1;min-width:150px"><b class="num" style="font-size:22px;color:var(--gold)">${rp(brl.perKg)}</b>
       <small style="display:block;color:var(--muted)">BEP harga jual per kg — dari HPP ${brl.jenis==='final'?'final':'proyeksi'}</small></div>
      ${mg?`<div style="flex:1;min-width:150px;text-align:right"><b class="num" style="font-size:16px;color:${mg.selisih>0?'var(--sage)':'#E8836F'}">${mg.selisih>0?'+':''}${rp(mg.selisih)}/kg</b>
       <small style="display:block;color:var(--muted)">terhadap harga produk ${rp(mg.harga)}/kg</small></div>`:''}
     </div></div>`:''}

   ${mg?`<div class="alert ${mg.selisih>0?'ok':'warn'}" style="margin-top:12px">${ic(mg.selisih>0?'growth':'alert',16)}<div>
     <b>${mg.selisih>0?`Masih untung ${rp(mg.selisih)} per kg`:mg.selisih<0?`Rugi ${rp(Math.abs(mg.selisih))} per kg`:'Pas di titik impas'}</b>
     Harga produk sekarang ${rp(mg.harga)}/kg, titik impas ${rp(mg.bep)}/kg. Di bawah ${rp(mg.bep)}/kg batch ini tidak menutup modal. Harga produk diubah di Penjualan → Produk.</div></div>`
    :`<div class="alert info" style="margin-top:12px">${ic('money',16)}<div><b>Harga jual produk belum diisi</b> Isi harga produk Bebek Peking Hidup di Penjualan → Produk supaya selisih terhadap titik impas bisa ditampilkan.</div></div>`}

   <div class="kv" style="margin-top:14px;grid-template-columns:1fr auto;row-gap:8px;font-size:13px">
    <span>Modal nyata sampai hari ini</span><b class="num">${rp(calc.modal())}</b>
    ${pr?`<span>Perkiraan sisa biaya pakan</span><b class="num">${rp(pr.sisaBiaya)}</b>`:''}
    ${kb&&kb.kg>0?`<span>Kebutuhan pakan ${kb.hari} hari sisa</span><b class="num">${num(kb.kg,1)} kg</b>`:''}
    ${hp?`<span>Harga pakan dipakai (nota terbaru)</span><b class="num">${rp(hp.harga)}/kg</b>
     <span style="color:var(--dim)">— nota ${fmtDate(toDate(hp.tanggal))}${hp.jenis?', '+hp.jenis:''}${hp.cocokJenis?'':' (jenis lain, batch ini pakai '+(hp.jenisBatch||'belum tercatat')+')'}</span><span></span>`:''}
    <span>Jatah pakan dipakai</span><b>${calc.jatahKhususBatch()?'jatah khusus batch ini':'pakem farm'}</b>
   </div>

   <small style="display:block;margin-top:11px;color:var(--dim)">${ket}
   Modal = biaya DOD + pakan terpakai (harga nota per jenis) + biaya lain yang disetujui, batch ini saja.
   Perkiraan sisa biaya hanya menghitung PAKAN: biaya sekali bayar seperti sekam dan obat tidak diproyeksikan berulang, jadi perkiraan ini sedikit lebih rendah dari kenyataan.
   Belum termasuk biaya umum farm seperti listrik, gaji, dan sewa yang tidak ditempelkan ke batch.</small>
  </div>
  ${kartuSimulasiHarga()}`;
}
/* Simulasi harga panen. Harga bisa diedit pengguna; angkanya tidak disimpan dan
   tidak dikirim ke server — ini alat hitung what-if, bukan data farm. */
const SIM_HARGA_AWAL = [22000, 24000, 26000, 28000];
function kartuSimulasiHarga(){
  const d = calc.simulasiDasar();
  if(!d) return '';
  const harga = (state.simHarga && state.simHarga.length===4) ? state.simHarga : SIM_HARGA_AWAL;
  const baris = calc.simulasiHarga(harga) || [];
  return `<p class="nav-sec" style="padding:18px 2px 8px">Simulasi harga panen</p>
  <div class="card"><div class="card-h"><h3>Laba rugi pada beberapa harga jual</h3>${badge(d.jenis==='final'?'ok':'warn',d.jenis==='final'?'DARI PANEN NYATA':'DARI PROYEKSI')}</div>
   <div class="alert info" style="margin-bottom:12px">${ic('money',16)}<div><b>Harga boleh diubah</b>
    Dihitung atas ${num(d.kg,1)} kg (${num(d.ekor)} ekor) dengan biaya ${rp(d.modal)} dan HPP ${rp(d.hppKg)}/kg.
    Angka simulasi tidak disimpan dan tidak mengubah data apa pun.</div></div>
   <div class="tbl-wrap"><table><thead><tr>
     <th>Harga jual /kg</th><th class="r">Omzet</th><th class="r">Laba / rugi</th><th class="r">Margin /kg</th><th>Status</th>
   </tr></thead><tbody>
   ${baris.map((b,i)=>`<tr>
     <td><input name="sim_${i}" data-act="sim-harga" data-i="${i}" type="number" step="500" min="0" max="200000" value="${harga[i]}" style="width:120px"></td>
     <td class="r num">${rp(b.omzet)}</td>
     <td class="r num"><b style="color:${b.laba>0?'var(--sage)':b.laba<0?'#E8836F':'var(--muted)'}">${b.laba>0?'+':''}${rp(b.laba)}</b></td>
     <td class="r num">${b.marginKg>0?'+':''}${rp(b.marginKg)}</td>
     <td>${b.status==='untung'?badge('ok','UNTUNG'):b.status==='rugi'?badge('danger','RUGI'):badge('gold','PAS DI BEP')}</td>
   </tr>`).join('')}
   </tbody></table></div>
   <small style="display:block;margin-top:10px;color:var(--dim)">Laba = omzet − ${d.jenis==='final'?'biaya nyata':'(biaya nyata + perkiraan sisa biaya)'}. Belum termasuk biaya umum farm.</small>
  </div>`;
}
/* Riwayat harga pembelian pakan, per jenis, dengan selisih terhadap nota
   sebelumnya. Nota lama tidak pernah berubah: harga tersimpan di baris notanya
   sendiri dan tabel feed_transaction append-only. */
function kartuRiwayatHargaPakan(){
  const r = calc.riwayatHargaPakan();
  if(!r.length) return `<p class="nav-sec" style="padding:18px 2px 8px">Riwayat harga pakan</p>
   <div class="card"><div class="alert info">${ic('feed',16)}<div><b>Belum ada nota pembelian pakan</b>
   Riwayat harga muncul sendiri setelah pembelian pakan pertama dicatat beserta harganya.</div></div></div>`;
  const panah = a => a==='naik'?'<span style="color:#E8836F">▲ naik</span>'
    : a==='turun'?'<span style="color:var(--sage)">▼ turun</span>'
    : a==='tetap'?'<span style="color:var(--muted)">= tetap</span>'
    : '<span style="color:var(--dim)">nota pertama</span>';
  return `<p class="nav-sec" style="padding:18px 2px 8px">Riwayat harga pakan</p>
  <div class="card"><div class="card-h"><h3>Perubahan harga pembelian</h3>${badge('info',r.length+' jenis')}</div>
   <div class="alert info" style="margin-bottom:12px">${ic('feed',16)}<div><b>Isi nota tidak pernah diubah</b>
    Tiap nota menyimpan harganya sendiri dan tidak bisa ditimpa: tabel pembelian pakan bersifat tambah-saja,
    pembatalan pun dicatat sebagai pembatalan. Tidak ada harga master yang bisa diketik — semua harga berasal dari nota.</div></div>
   <div class="alert ok" style="margin-bottom:12px">${ic('growth',16)}<div><b>Pembelian baru tidak mengubah biaya batch lama</b>
    Pakan yang sudah dimakan dinilai dengan harga yang berlaku <em>pada tanggal pemakaiannya</em>, bukan rata-rata sampai hari ini.
    Jadi nota yang Bapak catat hari ini dengan tanggal hari ini tidak menyentuh biaya dan laba batch mana pun yang sudah lewat.</div></div>
   <div class="alert warn" style="margin-bottom:12px">${ic('alert',16)}<div><b>Kecuali nota yang tanggalnya dimundurkan</b>
    Yang menentukan penilaian adalah <em>tanggal nota</em>, bukan kapan nota itu dimasukkan. Nota yang dicatat hari ini tapi
    diberi tanggal bulan lalu — atau nota lama yang baru disetujui sekarang — <em>tetap mengubah biaya batch yang sudah lewat,
    termasuk batch yang sudah ditutup</em>. Jadi angka batch lama belum bisa disebut permanen. Catat nota pakan pada tanggal
    kejadiannya dan setujui secepatnya supaya angka batch tidak bergerak lagi.</div></div>
   ${r.map(j=>`<div style="margin-bottom:16px">
    <div style="display:flex;align-items:center;gap:9px;margin-bottom:7px"><b>${esc(j.jenis)}</b>${badge('gold','terbaru '+rp(j.terbaru)+'/kg')}<small style="color:var(--dim)">${j.jmlNota} nota</small></div>
    <div class="tbl-wrap"><table><thead><tr><th>Tanggal</th><th>Vendor</th><th class="r">Jumlah</th><th class="r">Harga /kg</th><th class="r">Selisih</th><th>Arah</th></tr></thead><tbody>
    ${j.nota.map(n=>`<tr>
      <td class="num">${fmtDate(toDate(n.tanggal))}</td>
      <td>${esc(n.vendor||'—')}</td>
      <td class="r num">${num(n.qty,0)} kg</td>
      <td class="r num"><b>${rp(n.harga)}</b></td>
      <td class="r num">${n.selisih==null?'—':(n.selisih>0?'+':'')+rp(n.selisih)+(n.pct!=null?` (${n.pct>0?'+':''}${num(n.pct,1)}%)`:'')}</td>
      <td>${panah(n.arah)}</td>
    </tr>`).join('')}
    </tbody></table></div></div>`).join('')}
  </div>`;
}
function halamanKandang(){const c=DB.cycle;if(!c)return '';
 const role=state.user.role;const ak=role==='ANAK_KANDANG';const kelola=['OWNER','MANAGER'].includes(role);
 const rows=(DB.harian||[]).filter(x=>x.code===c.code);const h=ak?(rows.find(x=>x.barn===state.user.barn)||rows[0]):rows[0];
 const hidup=rows.reduce((s,x)=>s+x.pop,0);const mati=rows.reduce((s,x)=>s+x.mati,0);
 const d=calc.day();const u=DB.uang||{};const panen=DB.panen||[];const seri=DB.fcrSeri||[];
 const pEkor=panen.reduce((s,x)=>s+x.qty,0),pKg=panen.reduce((s,x)=>s+x.kg,0);
 const ck=badge('ok','✓');
 const tmb=(m,teks,barn,kind,primer)=>ak?`<button class="btn ${primer?'primary':''} sm" data-act="go" data-page="${m}">${teks}</button>`:(kelola?`<button class="btn ${primer?'primary':''} sm" data-act="modal" data-m="${m}" data-id="${barn}"${kind?` data-kind="${kind}"`:''}>${teks}</button>`:'');
 const pagi=new Date().getHours()<12;
 const kerja=h?(()=>{const kond=(DB.barnCond||[]).filter(k=>k.barn===h.barn&&dayOf(k.date)===d);const jt=perluTimbang(h);
  const pakan=(sesi)=>{const kg=sesi==='PAGI'?h.pakanPagi:h.pakanSore;const nm=sesi==='PAGI'?'Pakan pagi':'Pakan sore';const jatah=h.jatahSesiKg!=null?`Jatah ${num(h.jatahSesiKg,1)} kg · ${num(h.jatahGram,0)} g × ${num(h.pop)} ekor ÷ 2`:'Jatah belum diatur';
   if(kg>0)return barisKerja(nm,jatah,`<b class="num">${num(kg,1)} kg</b> ${ck}`);
   const sekarang=(sesi==='PAGI')===pagi;
   return barisKerja(nm,jatah+' · belum dicatat',ak?(sekarang?tmb('ak-pakan','Catat'+(h.jatahSesiKg!=null?' '+num(h.jatahSesiKg,1)+' kg':''),h.barn,sesi,true):badge('neutral',sesi==='PAGI'?'TERLEWAT':'NANTI SORE')):tmb('feed-use','Catat'+(h.jatahSesiKg!=null?' '+num(h.jatahSesiKg,1)+' kg':''),h.barn,sesi,sekarang),sekarang);};
  return `<p class="nav-sec" style="padding:18px 2px 8px">Kerjaan hari ini</p><div style="display:flex;flex-direction:column;gap:8px">
   ${pakan('PAGI')}${pakan('SORE')}
   ${barisKerja('Kematian',h.matiHariIni>0?`Hari ini ${h.matiHariIni} ekor tercatat`:'Hari ini belum ada catatan',tmb(ak?'ak-mati':'mort','Catat kematian',h.barn))}
   ${barisKerja('Timbang sampel',h.bobot!=null?`Terakhir ${num(h.bobot,2)} kg · ${h.hariSejakTimbang===0?'hari ini':h.hariSejakTimbang+' hari lalu'}`:'Belum pernah ditimbang',jt?tmb(ak?'ak-timbang':'weigh','Timbang sekarang',h.barn,'',true):(h.hariSejakTimbang===0?ck:badge('neutral','BELUM WAKTUNYA')),jt)}
   ${barisKerja('Kondisi kandang',kond.length?`Sudah diisi · ${num(kond[0].temp,0)}°C, sekam ${String(kond[0].litter).toLowerCase()}`:'Suhu, sekam, air minum · belum diisi',kond.length?ck:tmb(ak?'ak-kondisi':'cond','Isi kondisi',h.barn))}
  </div>`;})():'';
 const riwayat=[...DB.feedRecords.map(r=>({t:r.date,k:`Pakan ${r.sesi==='PAGI'?'pagi':r.sesi==='SORE'?'sore':''}${r.jenis?' · '+(NAMA_JENIS[r.jenis]||r.jenis):''}`.replace(/\s+/g,' '),j:num(calc.feedVal?calc.feedVal(r):r.kg,1)+' kg',o:r.user})),
  ...DB.mortality.map(m=>({t:m.date,k:'Kematian · '+m.cause,j:m.qty+' ekor',o:m.user})),
  ...DB.weights.map(w=>({t:w.date,k:'Timbang sampel · '+w.n+' ekor',j:num(w.avg,2)+' kg/ekor',o:w.user})),
  ...panen.map(x=>({t:toDate(x.date),k:'Panen · '+x.pembeli,j:x.qty+' ekor · '+num(x.kg,1)+' kg',o:null,on:x.oleh})),
  ...DB.popTx.filter(t=>t.type==='DOD_IN').map(t=>({t:t.date,k:'DOD masuk',j:t.qty+' ekor',o:t.user}))].sort((a,b)=>b.t-a.t).slice(0,40);
 const fcrAkhir=pKg>0&&DB.pakanKg>0?DB.pakanKg/pKg:null;
 return `<div class="hero" style="min-height:0;padding:20px 22px"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start"><div><h2 style="font-size:22px">${h?h.barnName:'Batch '+c.code} ${stBadge(c.stage==='HARVEST'?'PANEN':'AKTIF')}</h2><div class="meta" style="font-weight:500;gap:6px">Batch ${c.code} · ${c.breed} · DOD masuk ${fmtDate(c.dodDate)}</div></div>${kelola?`<button class="btn sm" data-act="modal" data-m="cycle-target">Ubah Target</button>`:''}</div>
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-top:14px"><div><b style="font-size:20px">Hari ke-${d}</b><small style="display:block;color:var(--muted)">dari ${c.targetDays} hari</small></div><div><b class="num" style="font-size:20px">${num(hidup)}</b><small style="display:block;color:var(--muted)">ekor hidup</small></div><div><b class="num" style="font-size:20px">${teksTarget()} kg</b><small style="display:block;color:var(--muted)">target bobot panen</small></div><div><b style="font-size:20px">${fmtDate(dateOfDay(c.targetDays))}</b><small style="display:block;color:var(--muted)">perkiraan panen</small></div></div></div>
 ${kerja}
 <p class="nav-sec" style="padding:18px 2px 8px">Angka batch ini</p>
 <div class="grid g-kpi"><div class="card flat"><b class="num" style="font-size:20px">${num(DB.pakanKg||0,1)} kg</b><small style="display:block;color:var(--muted)">pakan terpakai</small></div><div class="card flat"><b class="num" style="font-size:20px">${h&&h.fcr!=null?num(h.fcr,2):(fcrAkhir!=null?num(fcrAkhir,2):'—')}</b><small style="display:block;color:var(--muted)">FCR ${h&&h.fcr!=null?'terbaru':fcrAkhir!=null?'akhir':'(setelah timbang)'}</small></div><div class="card flat"><b class="num" style="font-size:20px">${num(mati)} ekor</b><small style="display:block;color:var(--muted)">mati · ${pct(c.dodQty?mati/c.dodQty*100:0)}</small></div><div class="card flat"><b class="num" style="font-size:20px">${h&&h.bobot!=null?num(h.bobot,2)+' kg':'—'}</b><small style="display:block;color:var(--muted)">bobot terakhir</small></div></div>

 <p class="nav-sec" style="padding:18px 2px 8px">Perkembangan FCR (ter-update tiap timbang)</p>
 <div class="card">${seri.length?`<div class="tbl-wrap"><table><thead><tr><th>Tanggal timbang</th><th class="r">Umur</th><th class="r">Ekor hidup</th><th class="r">Bobot rata-rata</th><th class="r">Pakan terpakai</th><th class="r">FCR</th></tr></thead><tbody>${seri.map(x=>`<tr><td>${fmtDate(toDate(x.date))}</td><td class="r num">${x.umur} hari</td><td class="r num">${num(x.pop)}</td><td class="r num">${num(x.bobot,2)} kg</td><td class="r num">${num(x.pakan,1)} kg</td><td class="r num"><b>${x.fcr!=null?num(x.fcr,2):'—'}</b></td></tr>`).join('')}</tbody></table></div><small style="display:block;margin-top:8px;color:var(--dim)">FCR = pakan terpakai ÷ pertambahan bobot hidup kandang${c.dodWeight>0?'':' (bobot DOD tidak diisi, jadi tidak dikurangkan)'}.</small>`:'<div class="alert info">Belum ada timbangan. FCR muncul di sini setiap kali sampel ditimbang.</div>'}</div>

 <p class="nav-sec" style="padding:18px 2px 8px">Hasil panen</p>
 <div class="card"><div class="card-h"><h3>${panen.length?`${num(pEkor)} ekor · ${num(pKg,1)} kg`:'Belum ada panen'}</h3>${kelola&&hidup>0?`<button class="btn primary sm" data-act="modal" data-m="harvest" data-id="${h?h.barn:''}">${ic('plus',14)} Catat Panen</button>`:''}</div>
 ${panen.length?`<div class="tbl-wrap"><table><thead><tr><th>Tanggal</th><th>Pengambil</th><th class="r">Ekor</th><th class="r">Total kg</th><th class="r">Rata-rata</th><th class="r">Harga/kg</th><th class="r">Uang masuk</th><th>Bayar</th><th></th></tr></thead><tbody>${panen.map(x=>`<tr><td>${fmtDate(toDate(x.date))}</td><td>${esc(x.pembeli)}</td><td class="r num">${num(x.qty)}</td><td class="r num">${num(x.kg,1)} kg</td><td class="r num">${num(x.kg/x.qty,2)} kg</td><td class="r num">${rp(x.harga)}</td><td class="r num"><b>${rp(x.total)}</b></td><td>${badge(x.pay==='PAID'?'ok':x.pay==='DP'?'gold':'warn',x.pay==='PAID'?'LUNAS':x.pay==='DP'?'DP':'BELUM')}</td><td><button class="btn sm" data-act="modal" data-m="invoice" data-id="${x.code}">Invoice</button></td></tr>`).join('')}<tr><td><b>Total</b></td><td></td><td class="r num"><b>${num(pEkor)}</b></td><td class="r num"><b>${num(pKg,1)} kg</b></td><td class="r num"><b>${num(pKg/pEkor,2)} kg</b></td><td></td><td class="r num"><b>${rp(u.panen||0)}</b></td><td></td><td></td></tr></tbody></table></div>`:'<div class="alert info">Hasil panen muncul di sini: tanggal, pengambil, timbangan, harga, dan invoice-nya.</div>'}</div>

 ${can('finance')?`<p class="nav-sec" style="padding:18px 2px 8px">Uang batch ini</p>
 <div class="card"><div class="kv" style="grid-template-columns:1fr auto;row-gap:10px"><span>Uang masuk dari panen</span><b class="num">${rp(u.panen||0)}</b><span>Modal DOD · ${num(c.dodQty)} × ${rp(c.dodPrice)}</span><b class="num">− ${rp(u.dod||0)}</b><span>Biaya pakan · ${num(DB.pakanKg||0,1)} kg, harga dari nota per jenis</span><b class="num">− ${rp(u.pakan||0)}</b><span>Biaya lain yang dicatat untuk batch ini</span><b class="num">− ${rp(u.lain||0)}</b>${(u.overhead||0)>0?`<span>Gaji, listrik, sewa <small style="color:var(--muted)">· bagian batch ini</small></span><b class="num">− ${rp(u.overhead||0)}</b>`:''}<span><b style="font-size:15px;color:var(--text)">${(u.laba||0)>=0?'Laba':'Rugi'} batch${panen.length?'':' (belum ada panen)'}</b></span><b class="num" style="font-size:20px;color:${(u.laba||0)>=0?'var(--soft)':'#F29390'}">${rp(Math.abs(u.laba||0))}</b></div>
 ${panen.length?`<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-top:14px"><div><b class="num" style="font-size:17px">${rp((u.laba||0)/pEkor)}</b><small style="display:block;color:var(--muted)">${(u.laba||0)>=0?'laba':'rugi'} per ekor dipanen</small></div><div><b class="num" style="font-size:17px">${rp(((u.dod||0)+(u.pakan||0)+(u.lain||0))/pKg)}</b><small style="display:block;color:var(--muted)">biaya per kg bobot hidup</small></div><div><b class="num" style="font-size:17px">${fcrAkhir!=null?num(fcrAkhir,2):'—'}</b><small style="display:block;color:var(--muted)">FCR dari panen</small></div><div><b class="num" style="font-size:17px">${pct(c.dodQty?mati/c.dodQty*100:0)}</b><small style="display:block;color:var(--muted)">mortalitas</small></div></div>`:''}</div>`:''}

 ${can('finance')?kartuHppBep():''}

 <p class="nav-sec" style="padding:18px 2px 8px">Biaya tambahan (opsional)</p>
 <div class="card"><div class="card-h"><h3>${(DB.biaya||[]).length?rp((DB.biaya||[]).filter(e=>e.status==='APPROVED').reduce((t,e)=>t+e.jumlah,0)):'Belum ada biaya tambahan'}</h3>${h&&(kelola||ak||role==='ADMIN')?`<button class="btn sm" data-act="modal" data-m="biaya" data-id="${h.barn}">${ic('plus',14)} Catat biaya</button>`:''}</div>
 ${(DB.biaya||[]).length?`<div class="tbl-wrap"><table><thead><tr><th>Tanggal</th><th>Jenis</th><th>Keterangan</th><th class="r">Jumlah</th><th>Nota</th><th>Oleh</th></tr></thead><tbody>${DB.biaya.map(e=>`<tr><td>${fmtDate(toDate(e.date))}</td><td>${NAMA_BIAYA[e.kat]||e.kat}</td><td>${esc(e.ket||'\u2014')}</td><td class="r num"><b>${rp(e.jumlah)}</b>${e.status==='PENDING'?' '+badge('warn','MENUNGGU PERSETUJUAN'):e.status==='REJECTED'?' '+badge('danger','DITOLAK'):''}</td><td>${e.nota?badge('ok','ADA'):badge('neutral','TANPA NOTA')}</td><td>${esc(e.oleh||'\u2014')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="alert info">Untuk pengeluaran di luar DOD dan pakan, misalnya obat, vitamin, sekam, atau gas. Kalau tidak ada, tidak perlu diisi.</div>'}</div>

 <p class="nav-sec" style="padding:18px 2px 8px">Riwayat batch ini</p>
 <div class="card">${riwayat.length?`<div class="tbl-wrap"><table><thead><tr><th>Waktu</th><th>Catatan</th><th class="r">Jumlah</th><th>Oleh</th></tr></thead><tbody>${riwayat.map(x=>`<tr><td class="num">${fmtDT(x.t)}</td><td>${esc(x.k)}</td><td class="r num">${x.j}</td><td>${x.o?userName(x.o):esc(x.on||'—')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="alert info">Belum ada catatan.</div>'}</div>
 ${kelola?`<div class="row" style="margin-top:16px">${hidup>0?`<button class="btn" data-act="modal" data-m="batch-move">Pindah Kandang</button>`:''}${role==='OWNER'?`<button class="btn" data-act="modal" data-m="cycle-close">Tutup Batch</button>`:''}</div>`:''}`;}

/* Semua kandang dengan status hari ini. Tekan satu kandang untuk masuk ke halamannya. */
function semuaKandang(){const h=DB.harian||[];const kosong=calc.kandangKosong();
 const kartu=x=>`<button class="card" data-act="buka-kandang" data-code="${x.code}" style="text-align:left;color:inherit;font:inherit;cursor:pointer;width:100%"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><b style="font-size:15.5px">${x.barnName}</b> <small style="color:var(--dim)">${x.code}</small><div style="color:var(--muted);font-size:12.5px">Umur ${x.umur} hari · ${num(x.pop)} ekor</div></div><b style="color:var(--soft);flex:none">Buka ›</b></div>${(()=>{
   /* Mortalitas kumulatif kandang ini terhadap targetnya. Ditambahkan 27 Nov
      2026: setelah target per kandang bisa diisi, Abdur perlu melihatnya di
      layar yang memang dia buka tiap hari, bukan hanya di halaman Populasi. */
   const t=(DB.targetMatiKandang||[]).find(y=>y.barn===x.barn);
   if(!t||t.matiPct==null)return '';
   const adaTgt=t.target!=null&&t.target>0&&!(t.dari==='farm'&&calc.bawaan('targetMortalitasPct'));
   const lwt=adaTgt&&t.matiPct>t.target;
   return `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-top:9px;padding-top:9px;border-top:1px solid var(--line);font-size:12.5px">
     <span style="color:var(--muted)">Mortalitas</span>
     <span><b class="num"${lwt?' style="color:#F2C46B"':''}>${pct(t.matiPct)}</b> <small style="color:var(--dim)">${adaTgt?`target ${num(t.target,1)}% · ${t.dari}`:'target belum diatur'}</small></span></div>`;})()}<div class="row" style="margin-top:10px">${badge(x.pakanPagi>0?'ok':'warn',x.pakanPagi>0?`PAGI ✓ ${num(x.pakanPagi,1)} kg`:'PAGI BELUM')}${badge(x.pakanSore>0?'ok':'warn',x.pakanSore>0?`SORE ✓ ${num(x.pakanSore,1)} kg`:'SORE BELUM')}${badge(x.matiHariIni>0?'danger':'neutral','MATI '+x.matiHariIni)}${perluTimbang(x)?badge('warn','WAKTUNYA TIMBANG'):''}${x.fcr!=null?badge('neutral','FCR '+num(x.fcr,2)):''}</div></button>`;
 return `<div class="grid g-3">${h.map(kartu).join('')}${kosong.map(b=>`<div class="card" style="opacity:.75"><b style="font-size:15.5px">${b.name}</b><div style="color:var(--muted);font-size:12.5px">Kosong · muat ${num(b.cap)} ekor</div>${can('masterData')?`<div class="row" style="margin-top:10px"><button class="btn sm" data-act="modal" data-m="cycle">${ic('plus',14)} Isi DOD</button></div>`:''}</div>`).join('')}${(DB.batchHabis||[]).map(b=>`<button class="card" data-act="buka-kandang" data-code="${b.code}" style="text-align:left;color:inherit;font:inherit;cursor:pointer;width:100%"><div style="display:flex;justify-content:space-between;gap:10px"><div><b style="font-size:15.5px">Batch ${b.code}</b><div style="color:var(--muted);font-size:12.5px">Sudah habis dipanen · belum ditutup</div></div><b style="color:var(--soft);flex:none">Buka ›</b></div></button>`).join('')}</div>${!h.length&&!kosong.length?'<div class="alert info">Belum ada kandang. Buat kandang di Pengaturan → Kandang.</div>':''}
 ${kartuJadwalPanen()}${tabelBatch()}${kosongBlok(kosong)}`;}

/* Catat harian langsung dari Dashboard, tanpa pindah halaman. */
function catatCepat(){if(!DB.cycle||!['OWNER','MANAGER'].includes(state.user.role))return '';
 return `<div class="row" style="margin-top:14px"><button class="btn primary" data-act="modal" data-m="feed-use">${ic('feed',14)} Catat Pakan Keluar</button><button class="btn" data-act="modal" data-m="mort">${ic('skull',14)} Catat Kematian</button><button class="btn" data-act="modal" data-m="weigh">${ic('scale',14)} Input Timbang</button></div>`;}
function kartuHargaJenis(){const h=MASTER.hargaPakanJenis||[];const st=DB.stokPakanJenis||[];const nama={STARTER:'Starter',GROWER:'Grower',FINISHER:'Finisher'};
 const ada=h.length||st.length;
 return `<div class="card" style="margin-bottom:14px"><div class="card-h"><h3>Stok & Harga Pakan per Jenis</h3><span class="sub">seluruh farm · harga dari nota</span></div>${ada?`<div class="tbl-wrap"><table><thead><tr><th>Jenis</th><th class="r">Dibeli</th><th class="r">Terpakai</th><th class="r">Stok gudang</th><th class="r">Harga rata-rata nota</th></tr></thead><tbody>${['STARTER','GROWER','FINISHER'].map(j=>{const x=h.find(y=>y.jenis===j);const s=st.find(y=>y.jenis===j);return `<tr><td><b>${nama[j]}</b></td><td class="r num">${s?num(s.beli,1)+' kg':'—'}</td><td class="r num">${s?num(s.pakai,1)+' kg':'—'}</td><td class="r num"><b style="${s&&s.stok<0?'color:#F29390':''}">${s?num(s.stok,1)+' kg':'—'}</b>${s&&s.stok<0?' '+badge('warn','MINUS'):''}</td><td class="r num">${x?(x.harga!=null?rp(x.harga)+'/kg':'—'):'belum ada nota'}</td></tr>`;}).join('')}<tr><td><b>Total</b></td><td></td><td></td><td class="r num"><b>${num(calc.feedStockTheory(),1)} kg</b></td><td></td></tr></tbody></table></div>${st.some(x=>x.stok<0)?`<div class="alert warn" style="margin-top:12px">${ic('alert',16)}<div><b>Ada jenis yang stoknya minus</b>Artinya pakan jenis itu dicatat keluar lebih banyak daripada yang dicatat dibeli. Biasanya salah pilih jenis waktu input, atau nota pembeliannya belum dicatat.</div></div>`:''}`:'<div class="alert info">Belum ada pembelian pakan. Stok dan harga tiap jenis muncul di sini setelah nota pertama dicatat.</div>'}<small style="display:block;margin-top:10px;color:var(--dim)">Stok berkurang otomatis setiap ada input pakan keluar dari kandang mana pun. Biaya pakan tiap kandang dihitung dari jenis pakan yang dikeluarkan ke kandang itu.</small></div>`;}
function pgDashboard(){
  const role=state.user.role;
  if(role==='MANAGER')return pgDashboardManager();
  if(role==='ADMIN')return pgDashboardAdmin();
  return `${heroCard()}${catatCepat()}<div style="height:14px"></div>${kartuPakanHarian()}${kepalaSiklus()}${KPIROW()}${kartuRingkasanFarm()}
  <div class="grid g-3" style="margin-top:14px">${attentionCard()}${healthCard()}
   <div class="card"><div class="card-h"><h3>Aliran Populasi</h3><span class="sub">Prinsip balance</span></div>${popFlow()}<div class="chart-box sm" style="margin-top:10px"><canvas id="ch-pop"></canvas></div></div></div>
  <div class="grid g-2" style="margin-top:14px">${chartCard('Pertumbuhan Bobot','ch-weight','','','Aktual vs kurva target · kg','pertumbuhan')}${chartCard('Konsumsi Pakan','ch-feed',rangeSeg(),'','kg per hari')}</div>
  <div class="grid g-3" style="margin-top:14px">${chartCard('FCR','ch-fcr','','sm','Pakan ÷ pertambahan biomassa','pertumbuhan')}${chartCard('Mortalitas','ch-mort','','sm','ekor per hari','populasi')}${feedStockCard()}</div>
  <div class="grid g-2" style="margin-top:14px">${chartCard('Biaya vs Omzet','ch-fin','','','kumulatif · Rp','keuangan')}${financeCycleCard()}</div>
  <div class="grid g-3" style="margin-top:14px">${recentActivity()}${anomalyCard()}${approvalCard()}</div>`;
}
function pgDashboardManager(){return `${heroCard()}<div style="height:14px"></div>${kepalaSiklus()}${KPIROW()}${kartuRingkasanFarm()}
 <div class="grid g-3" style="margin-top:14px">${approvalCard(4)}${anomalyCard(4)}${healthCard()}</div>
 <div class="grid g-2" style="margin-top:14px">${chartCard('Konsumsi Pakan','ch-feed',rangeSeg(),'','kg per hari')}${chartCard('Mortalitas','ch-mort',rangeSeg(),'','ekor per hari')}</div>
 <div class="grid g-3" style="margin-top:14px">${barnPerfCard()}${feedStockCard()}${chartCard('Pertumbuhan Bobot','ch-weight','','sm','','pertumbuhan')}</div>
 <div class="grid g-2" style="margin-top:14px">${barnCondCard()}${recentActivity(5)}</div>
 `;}
function pgDashboardAdmin(){const newO=DB.orders.filter(o=>o.status==='NEW');return `${heroCard()}<div style="height:14px"></div><div class="grid g-kpi">
 ${kpi('Order Baru (Website)',newO.length,'order',newO.length?'Perlu dikonfirmasi':'Tidak ada','warn','cart','gold')}
 ${kpi('Penjualan Bulan Ini',rp(DB.orders.filter(o=>o.pay==='PAID'&&o.date.getMonth()===DEMO_TODAY.getMonth()&&o.date.getFullYear()===DEMO_TODAY.getFullYear()).reduce((s,o)=>s+calc.orderTotal(o),0)),'',DEMO_TODAY.toLocaleDateString('id-ID',{month:'long',year:'numeric'}),'','money','gold','penjualan')}
 ${kpi('Stok Pakan',num(calc.feedStockTheory()),'kg',`Cukup ${num(calc.feedDaysLeft(),0)} hari`,'','feed')}
 ${kpi('Item di Bawah Minimum',DB.inventory.filter(i=>i.qty<i.min).length,'item','Perlu pembelian','warn','box')}
 ${kpi('Pengeluaran Siklus',rp(calc.modal()),'','Disetujui','','money','gold')}
 ${kpi('Menunggu Approval Owner',calc.pendingApprovals().length,'transaksi','Pembelian & penjualan','','check')}</div>
 <div class="grid g-2" style="margin-top:14px"><div class="card"><div class="card-h"><h3>Order Terbaru</h3><button class="btn primary sm" data-act="modal" data-m="order">${ic('plus',14)} Buat Order</button></div>${ordersTable(DB.orders.slice().sort((a,b)=>b.date-a.date).slice(0,5))}</div>${inventoryCard()}</div>
 <div class="grid g-2" style="margin-top:14px">${chartCard('Biaya per Kategori','ch-cost','','','','keuangan')}${recentActivity(5)}</div>
 `;}

function popFlow(){const b=calc.popBalance();return `<div class="flow"><div class="n"><b class="num">${num(b.dod)}</b><small>DOD masuk</small></div><span class="op">−</span><div class="n neg"><b class="num">${num(b.mati)}</b><small>Mati</small></div><span class="op">−</span><div class="n neg"><b class="num">${num(b.jual)}</b><small>Terjual</small></div><span class="op">=</span><div class="n res"><b class="num">${num(b.akhir)}</b><small>Ekor tersisa</small></div></div>`;}
function feedStockCard(){const fd=calc.feedDiff();const days=calc.feedDaysLeft();const lastP=DB.feedPurchases.filter(p=>p.status==='APPROVED').slice(-1)[0];return `<div class="card"><div class="card-h"><h3>Stok Pakan</h3><button class="btn ghost sm" data-act="go" data-page="stok">Detail ${ic('arrow',12)}</button></div>
 <div class="row" style="align-items:flex-end;gap:14px"><div><div class="val num" style="font-size:30px;font-weight:800">${num(calc.feedStockTheory())} <small style="font-size:13px;color:var(--muted)">kg</small></div><small style="color:var(--muted)">Stok teoritis (transaksi)</small></div>${fd?`<div>${stBadge(Math.abs(fd.diff)>=10?'OPEN':'VERIFIED')}<div style="font-size:12px;color:var(--muted);margin-top:4px">Opname ${num(fd.op.physical)} kg · selisih <b class="num" style="color:${Math.abs(fd.diff)>=10?'#F2C46B':'inherit'}">${num(fd.diff)} kg</b></div></div>`:''}</div>
 <div class="bar ${days<MASTER.minStokPakanHari?'r':''}" style="margin:12px 0 6px"><i style="width:${Math.min(100,days/20*100)}%"></i></div><div style="font-size:12.5px;color:var(--muted)">Cukup untuk <b style="color:var(--text)">${num(days,0)} hari</b> pada rata-rata ${num(calc.feedAvg7(),0)} kg/hari</div>
 ${lastP?`<div class="alert info" style="margin-top:12px;align-items:center">${ic('truck',16)}<div style="flex:1"><b>Pembelian terakhir</b><small style="color:var(--muted)">${num(lastP.qty)} kg · ${fmtDate(lastP.date)} · ${rp(lastP.qty*lastP.price)}</small></div></div>`:''}</div>`;}
function financeCycleCard(){const c=calc.costByCat();const top=Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,4);return `<div class="card"><div class="card-h"><h3>Keuangan Siklus ${DB.cycle.code}</h3><button class="btn ghost sm" data-act="go" data-page="keuangan">Detail ${ic('arrow',12)}</button></div>
 <div class="grid" style="grid-template-columns:1fr 1fr;gap:10px"><div><small style="color:var(--muted)">Total biaya</small><div class="num" style="font-size:22px;font-weight:800;color:#F29390">${rp(calc.modal())}</div></div><div><small style="color:var(--muted)">Estimasi omzet</small><div class="num" style="font-size:22px;font-weight:800;color:var(--soft)">${rp(calc.estRevenue())}</div></div></div>
 <div style="margin:14px 0;padding:14px;border-radius:12px;background:rgba(198,161,91,.1);border:1px solid rgba(198,161,91,.3)"><small style="color:var(--muted)">Estimasi laba</small><div class="row" style="justify-content:space-between"><b class="num" style="font-size:26px;color:var(--gold)">${rpAtau(calc.estProfit())}</b><span class="badge b-gold">ROI ${pctAtau(calc.roi())}</span></div><small style="color:var(--muted)">Omzet − modal berjalan − proyeksi biaya sisa siklus (${rp(calc.projectedRemainingCost())})</small></div>
 <div style="display:flex;flex-direction:column;gap:8px">${top.map(([k,v])=>`<div><div class="row" style="justify-content:space-between;font-size:12.5px"><span>${k}</span><b class="num">${rp(v)}</b></div><div class="bar g"><i style="width:${v/calc.modal()*100}%"></i></div></div>`).join('')}</div></div>`;}
function barnPerfCard(){return `<div class="card"><div class="card-h"><h3>Kinerja per Kandang</h3>${lihatDi('siklus')}</div><div class="grid" style="grid-template-columns:1fr 1fr;gap:10px">${['A','B'].map(b=>{const w=calc.avgWeight(b);const m=calc.mortTotal(b);const cond=DB.barnCond.filter(c=>c.barn===b)[0];return `<div class="barn-card"><div class="hd"><b>${barnName(b)}</b>${cond&&cond.litter!=='Kering'?badge('warn','CEK SEKAM'):badge('ok','NORMAL')}</div><div class="kv"><span>Populasi</span><b class="num">${num(calc.population(b))} ekor</b><span>Bobot</span><b class="num">${num(w,2)} kg</b><span>Mati</span><b class="num">${m} ekor</b><span>Pakan hari ini</span><b class="num">${num(DB.feedRecords.filter(r=>r.barn===b&&dayOf(r.date)===calc.day()).reduce((s,r)=>s+calc.feedVal(r),0))} kg</b><span>PIC</span><b>${DB.users.filter(u=>u.barn===b&&u.active).map(u=>u.name.split(' ')[0]).join(', ')}</b></div></div>`;}).join('')}</div><div class="chart-box sm" style="margin-top:12px"><canvas id="ch-barn"></canvas></div></div>`;}
function barnCondCard(){const today=DB.barnCond.filter(c=>dayOf(c.date)===calc.day());return `<div class="card"><div class="card-h"><h3>Kondisi Kandang Hari Ini</h3><span class="sub">Input anak kandang</span>${lihatDi('kesehatan')}</div>${today.length?`<div class="tbl-wrap"><table><thead><tr><th>Kandang</th><th>Suhu</th><th>Kelembapan</th><th>Sekam</th><th>Air</th><th>Catatan</th><th>User</th></tr></thead><tbody>${today.map(c=>`<tr><td><b>${barnName(c.barn)}</b></td><td class="num">${c.temp}°C</td><td class="num">${c.hum}%</td><td>${c.litter==='Kering'?badge('ok',c.litter):badge('warn',c.litter)}</td><td>${badge('ok',c.water)}</td><td style="white-space:normal">${c.note||'—'}</td><td>${userName(c.user).split(' ')[0]}</td></tr>`).join('')}</tbody></table></div>`:emptyState('Belum ada input hari ini','Anak kandang belum mengisi kondisi kandang.')}</div>`;}

/* Jadwal panen & isi ulang — permintaan Abdur 26 Nov 2026.
   Masalah yang dijawab: layar lama hanya menyebut "panen berikutnya". Dengan
   beberapa kandang bergilir, dua hal mahal tidak terlihat sama sekali — bulan
   di mana beberapa batch panen berbarengan (pembeli tidak sanggup menyerap,
   harga jatuh), dan bulan tanpa panen sama sekali (kas kosong padahal pakan,
   gaji, dan listrik tetap jalan). Keduanya baru kelihatan kalau digambar. */
const WARNA_BATCH=['#A9D6A0','#89C8CE','#D8C278','#C9A0C8','#E0A87A','#9FB8E0'];
function kartuJadwalPanen(){
  const j=calc.jadwalPanen();
  if(!j)return '';
  const bln=d=>d.toLocaleDateString('id-ID',{month:'long',year:'numeric'});
  const blnPendek=d=>d.toLocaleDateString('id-ID',{month:'short'});
  /* Garis waktu dibatasi 12 batang. Di farm dengan banyak kandang, menggambar
     semuanya membuat layar panjang sekali dan justru tidak terbaca. Yang
     dipotong hanya gambarnya — ringkasan bulanan tetap menghitung semua batch. */
  const BATAS=12;
  const tampil=j.baris.slice(0,BATAS);
  const sisa=j.baris.length-tampil.length;
  return `<div class="card" style="margin-bottom:14px">
  <div class="card-h"><h3>Jadwal Panen &amp; Isi Ulang</h3><span class="sub">seluruh farm · ${j.bulanan.length} bulan ke depan</span></div>
  <p style="margin:0 0 14px;font-size:12.5px;color:var(--dim)">Tiap batang satu batch, dari DOD masuk sampai perkiraan panen. Tanggal panen = tanggal DOD + target hari batch itu.</p>

  <div class="jp-bulan">${j.bulanan.map(b=>`<div>${bln(b.dari).toUpperCase()}</div>`).join('')}</div>
  <div class="jp-lajur">
    ${j.jeda&&j.jeda.hari>=21?`<div class="jp-jeda" style="left:${(j.jeda.dari-j.mulai)/(j.habis-j.mulai)*100}%"><div class="jp-jeda-t"><b>${j.jeda.hari} hari tanpa panen</b><span>${fmtDate(j.jeda.dari)} – ${fmtDate(new Date(j.habis-86400000))}</span><span>pakan, gaji, listrik tetap jalan</span></div></div>`:''}
    ${tampil.map((x,i)=>{
      const w=Math.max(x.kanan-x.kiri,6);
      const teks=`${x.barnName} · ${x.code} · ${num(x.dodQty)} DOD → panen ${fmtDate(x.p).replace(/ \d{4}$/,'')}`;
      /* Batang yang sempit tidak muat teks — labelnya ditaruh di sebelah kanan
         batang, bukan dipotong di dalamnya. */
      return w>=26
        ? `<div class="jp-baris"><div class="jp-bar" style="left:${x.kiri}%;width:${w}%;background:${WARNA_BATCH[i%WARNA_BATCH.length]}" title="${teks}">${teks}</div></div>`
        : `<div class="jp-baris"><div class="jp-bar" style="left:${x.kiri}%;width:${w}%;background:${WARNA_BATCH[i%WARNA_BATCH.length]}" title="${teks}"></div><span class="jp-lbl" style="left:calc(${x.kiri + w}% + 9px)">${teks}</span></div>`;}).join('')}
  </div>
  ${sisa>0?`<p style="margin:2px 0 0;font-size:12.5px;color:var(--dim)">+${sisa} batch lain tidak digambar supaya layarnya tetap terbaca. Semuanya tetap ikut dihitung di ringkasan bulanan di bawah.</p>`:''}

  <div class="jp-ring">${j.bulanan.map(b=>`<div><div class="sub">Panen ${blnPendek(b.dari)}</div>
    <div class="num" style="font-size:22px;font-weight:800;${b.batch.length?'':'color:var(--dim)'}">${b.batch.length?`${b.batch.length} batch`:'0'}</div>
    <div class="sub" style="margin-top:3px">${b.batch.length?`±${num(b.ekor)} ekor · ${(()=>{const n=[...new Set(b.batch.map(x=>x.barnName))];
      return n.length<=3?n.join(', '):`${n.slice(0,3).join(', ')} dan ${n.length-3} kandang lain`;})()}`:'tidak ada pemasukan'}</div></div>`).join('')}</div>

  ${j.tumpuk?`<div class="alert warn" style="margin-top:14px">${ic('alert',16)}<div><b>${j.tumpuk.n} batch panen berdesakan dalam ${j.tumpuk.hari} hari</b>Pembeli harus menyerap ±${num(j.tumpuk.ekor)} ekor sekaligus, dan harga biasanya jatuh kalau barang menumpuk. Kalau mau diratakan, isi ulang kandang yang panen duluan tanpa menunggu kandang lain kosong.</div></div>`:''}
  ${j.jeda&&j.jeda.hari>=21?`<div class="alert info" style="margin-top:${j.tumpuk?'10':'14'}px">${ic('clock',16)}<div><b>Setelah ${fmtDate(new Date(j.jeda.dari-86400000))} tidak ada panen terjadwal selama ${j.jeda.hari} hari</b>Biaya tetap jalan tanpa pemasukan. Batch yang dimulai sekarang baru panen sekitar ${fmtDate(new Date(Date.now()+ (j.baris[0]&&j.baris[0].targetDays?j.baris[0].targetDays:35)*86400000))}.</div></div>`:''}
  <small style="display:block;margin-top:12px;color:var(--dim)">Jumlah ekor memakai populasi hari ini, jadi masih bisa turun kalau ada kematian. Tanggal panen ikut target hari tiap batch — ubah lewat "Ubah Target".</small></div>`;}

/* Tab Rotasi: semua batch yang sedang berjalan dalam satu layar.
   Ini layar harian untuk pola panen bergilir — kandang mana panen hari ini,
   kandang mana sudah waktunya diisi lagi. */
/* Tabel batch yang sedang berjalan.
   CATATAN 26 Nov 2026: fungsi ini dulu bernama tabRotasi() dan TIDAK PERNAH
   dipanggil — kode mati. Tab "Semua Kandang" merender semuaKandang() (kartu per
   kandang), sehingga tabel ini, tombol "Buka" di dalamnya, dan peringatan siap
   panen tidak pernah sampai ke layar siapa pun. Sekarang dipanggil dari
   semuaKandang(). Blok kandang kosong dipindah ke pemanggil supaya tidak dobel. */
function tabelBatch(){
  const b=calc.batches();
  if(!b.length)return '';
  const kosong=calc.kandangKosong();
  const siapPanen=b.filter(x=>x.sisaHari<=0);
  const segera=b.filter(x=>x.sisaHari>0&&x.sisaHari<=3);
  const kpiRow=`<div class="grid g-3" style="margin-bottom:14px">
    ${kpi('Batch berjalan',num(b.length),'batch',`${num(calc.populasiFarm())} ekor total`,'','duck')}
    ${kpi('Panen berikutnya',siapPanen.length?num(siapPanen.length):(calc.batchBerikutnya()?calc.batchBerikutnya().sisaHari:'—'),siapPanen.length?'batch siap':'hari lagi',
        siapPanen.length?siapPanen.map(x=>x.barnName).join(', '):(calc.batchBerikutnya()?`${calc.batchBerikutnya().code} di ${calc.batchBerikutnya().barnName}`:'—'),
        siapPanen.length?'warn':'','scale')}
    ${(()=>{const lm=kosong.map(x=>calc.kandangKosongHari(x.id)).filter(n=>n!=null);const mx=lm.length?Math.max(...lm):null;
      return kpi('Kandang kosong',num(kosong.length),'kandang',
        !kosong.length?'semua terisi':(mx!=null?`terlama ${num(mx)} hari · ${kosong.map(x=>x.name).join(', ').slice(0,36)}`:kosong.map(x=>x.name).join(', ').slice(0,42)),
        mx!=null&&mx>=14?'warn':'','box');})()}</div>`;

  /* Kolom bobot, FCR, dan nilai diambil dari DB.harian — baris per kandang yang
     sudah dihitung server. Kalau belum ada timbangan atau harga jual, kolomnya
     menyebut alasannya, bukan diisi angka tebakan. */
  const baris=x=>{
    const aktif=DB.cycle&&DB.cycle.code===x.code;
    const st=x.sisaHari<=0?badge('danger','SIAP PANEN'):x.sisaHari<=3?badge('gold',`${x.sisaHari} HARI LAGI`):badge('neutral',`${x.sisaHari} hari lagi`);
    const mati=x.dodQty-x.population;
    const h=(DB.harian||[]).find(y=>y.code===x.code)||{};
    const tgt=aktif&&DB.cycle&&calc.adaKurva()?calc.target(x.umur):null;
    const sel=h.bobot!=null&&tgt?(h.bobot-tgt)/tgt*100:null;
    const nl=calc.nilaiBatch(x.code);
    const kosongKol=t=>`<td class="r"><small style="color:var(--dim)">${t}</small></td>`;
    return `<tr${aktif?' style="background:rgba(168,208,141,.07)"':''}>
      <td><b>${x.code}</b>${aktif?` ${badge('ok','DIBUKA')}`:''}</td>
      <td>${x.barnNames||x.barnName}</td>
      <td class="r num">${num(x.umur)}</td>
      <td class="r num">${num(x.population)}</td>
      <td class="r num">${num(x.dodQty)}</td>
      <td class="r num">${mati>0?num(mati)+` (${num(mati/x.dodQty*100,1)}%)`:'—'}</td>
      ${h.bobot==null?kosongKol('belum ditimbang')
        :`<td class="r num"><b>${num(h.bobot,2)} kg</b>${sel!=null?`<br><small style="color:${sel<-3?'#F2C46B':'var(--soft)'}">${sel>=0?'+':''}${num(sel,1)}% vs target</small>`:''}</td>`}
      ${h.fcr==null?kosongKol(h.bobot==null?'perlu timbangan':'belum cukup data')
        :`<td class="r num"><b>${num(h.fcr,2)}</b>${h.fcrTanpaDod?'<br><small style="color:var(--dim)">tanpa bobot DOD</small>':''}</td>`}
      ${nl.nilai==null?kosongKol(nl.sebab):`<td class="r num"><b>${rp(nl.nilai)}</b></td>`}
      <td>${fmtDate(x.panen)}</td>
      <td>${st}</td>
      <td><button class="btn ghost sm" data-act="pilih-batch" data-v="${x.code}"${aktif?' disabled':''}>${aktif?'Dibuka':'Buka'}</button></td></tr>`;};

  return `<div style="height:14px"></div>`+kpiRow+
  (siapPanen.length?`<div class="alert warn" style="margin-bottom:14px">${ic('alert',16)}<div><b>${siapPanen.length} batch sudah sampai umur panen</b>${siapPanen.map(x=>`${x.code} di ${x.barnName} (${num(x.population)} ekor, umur ${x.umur} hari)`).join(' · ')}. Tiap hari tertunda, pakan tetap jalan dan bobotnya lewat.</div></div>`:'')+
  (segera.length?`<div class="alert info" style="margin-bottom:14px">${ic('clock',16)}<div><b>Panen dalam 3 hari</b>${segera.map(x=>`${x.code} di ${x.barnName} — ${fmtDate(x.panen)}`).join(' · ')}. Siapkan pembelinya.</div></div>`:'')+
  `<div class="card"><div class="card-h"><h3>Batch yang sedang berjalan</h3><span class="sub">Urut dari yang paling tua. Klik "Buka" untuk melihat detail pakan, bobot, dan kematian batch itu.</span></div>
   <div class="tbl-wrap"><table><thead><tr><th>Batch</th><th>Kandang</th><th class="r">Umur</th><th class="r">Populasi</th><th class="r">DOD awal</th><th class="r">Mati</th><th class="r">Bobot</th><th class="r">FCR</th><th class="r">Nilai di kandang</th><th>Perkiraan panen</th><th>Status</th><th></th></tr></thead>
   <tbody>${b.map(baris).join('')}</tbody></table></div>
   <small style="display:block;margin-top:10px;color:var(--dim)">Nilai di kandang = populasi × bobot timbang terakhir × harga jual hidup. Memakai bobot yang benar-benar ditimbang, bukan target — jadi kosong selama belum ada timbangan.</small></div>`;
}

/* Kandang kosong, lengkap dengan sudah berapa lama menganggur.
   Kandang nganggur tetap menanggung sewa, gaji, dan listrik, dan sejak T-8
   biaya itu dibagi ke batch lain lewat ekor-hari — jadi makin lama kosong,
   makin mahal batch yang sedang jalan menanggungnya. Angka harinya membuat
   itu terasa; sebelumnya kandang kosong hanya disebut namanya. */
function kosongBlok(kosong){
  if(!kosong.length)return '';
  const baris=kosong.map(b=>{
    const n=calc.kandangKosongHari(b.id);
    return {b,n};
  }).sort((x,y)=>(y.n==null?-1:y.n)-(x.n==null?-1:x.n));
  const lama=baris.filter(x=>x.n!=null&&x.n>=14);
  return `<div class="alert ${lama.length?'warn':'info'}" style="margin-top:14px">${ic('box',16)}<div style="flex:1">
   <b>${kosong.length} kandang kosong siap diisi</b>
   <div style="display:flex;flex-direction:column;gap:7px;margin-top:4px">
    ${baris.map(({b,n})=>`<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline">
      <span>${b.name} <small style="color:var(--dim)">muat ${num(b.cap)} ekor</small></span>
      <b class="num" style="flex:none;${n!=null&&n>=14?'color:#F2C46B':''}">${n==null?'<small style="color:var(--dim);font-weight:400">belum pernah diisi</small>':`${num(n)} hari kosong`}</b></div>`).join('')}
   </div>
   <small style="display:block;margin-top:8px;color:var(--dim)">Dihitung dari pergerakan populasi terakhir di kandang itu. Kandang yang menganggur tetap menanggung sewa, gaji, dan listrik, dan biaya itu dibagi ke batch yang sedang jalan.</small>
  </div></div>`;}

/* Tren antar siklus — permintaan Abdur 26 Nov 2026.
   Tab Riwayat dulu hanya tabel angka, jadi pertanyaan paling dasar pemilik —
   "farm saya makin bagus atau makin jelek?" — harus dijawab dengan
   membandingkan baris sendiri. Tiga grafik ini menjawabnya sekali lihat.
   Hanya siklus yang SUDAH DITUTUP yang ikut: FCR dan laba siklus berjalan
   belum final, dan membandingkannya akan menyesatkan. */
function kartuTrenSiklus(){
  const semua=calc.trenSiklus();
  /* Hanya siklus terbaru yang digambar. Dengan puluhan siklus, batangnya jadi
     garis tipis dan labelnya saling tindih — grafiknya justru tidak terbaca.
     Selisih "vs siklus sebelumnya" tetap dihitung dari rantai penuh, jadi
     batang pertama yang tampil tetap punya pembanding yang benar. */
  const BATAS=10;
  const t=semua.slice(-BATAS);
  const dipotong=semua.length-t.length;
  if(!semua.length)return `<div class="card" style="margin-bottom:14px"><div class="card-h"><h3>Tren Antar Siklus</h3></div>
   ${emptyState('Belum ada siklus yang ditutup','Grafik FCR, mortalitas, dan laba per ekor muncul di sini begitu siklus pertama ditutup. Angkanya diambil dari hasil panen, bukan perkiraan.')}</div>`;
  /* Batang digambar relatif terhadap nilai terbesar, jadi perbandingan antar
     siklus jujur. Batang nol tinggi minimum 3% supaya tetap terlihat ada. */
  const lebar=t.length<=6;
  const graf=(judul,ket,ambil,fmt,baik,garis)=>{
    const v=t.map(ambil);
    const ada=v.filter(x=>x!=null&&Number.isFinite(x));
    if(!ada.length)return `<div><div style="font-size:13.5px;font-weight:600">${judul}</div><div class="sub" style="margin-bottom:12px">${ket}</div>
      ${emptyState('Belum ada angkanya','Muncul setelah siklus ditutup dengan data panen lengkap.')}</div>`;
    /* Nilai negatif (siklus rugi) digambar ke BAWAH garis nol, tidak ke atas.
       Kalau rugi digambar sebagai batang tinggi seperti untung, grafiknya
       berbohong — rugi besar jadi terlihat sama meyakinkannya dengan untung
       besar. Skala atas dan bawah memakai pembagi yang sama supaya tingginya
       sebanding. */
    const atas=Math.max(0,...ada), bawah=Math.min(0,...ada);
    const rent=(atas-bawah)||1;
    const bagianAtas=atas/rent*100, bagianBawah=-bawah/rent*100;
    const warna=x=>{if(x==null)return 'rgba(255,255,255,.10)';
      if(x<0)return '#C4705F';
      const span=Math.max(Math.abs(atas),Math.abs(bawah))||1;
      const r=baik==='kecil'?x/span:1-x/span;             // 0 = bagus, 1 = jelek
      return r<.4?'#8FC9A8':r<.7?'#C9C47A':'#C4705F';};
    const tinggi=x=>x==null?0:Math.max(2.5,Math.abs(x)/rent*100);
    return `<div><div style="font-size:13.5px;font-weight:600">${judul}</div><div class="sub" style="margin-bottom:12px">${ket}</div>
     <div class="tr-bars">
      ${garis!=null&&garis>0&&atas>0?`<div style="position:absolute;left:0;right:0;bottom:${(bagianBawah+Math.min(garis,atas)/rent*100).toFixed(2)}%;border-top:1.5px dashed #C4705F;z-index:3"></div>`:''}
      ${bawah<0?`<div style="position:absolute;left:0;right:0;bottom:${bagianBawah.toFixed(2)}%;border-top:1px solid rgba(255,255,255,.22);z-index:2"></div>`:''}
      ${t.map((c,i)=>{const x=v[i];const neg=x!=null&&x<0;
        /* Angka di atas batang hanya ditulis kalau batangnya cukup lebar.
           Lebih dari enam siklus, label saling tindih dan tidak terbaca —
           angka persisnya tetap ada di tabel di bawah grafik. */
        const lbl=!lebar?'':x==null?'<b style="color:var(--dim);font-weight:400">—</b>':`<b${neg?' style="color:#E8A07A"':''}>${fmt(x)}</b>`;
        return `<div class="tr-col">
          <div class="tr-pos" style="height:${bagianAtas.toFixed(2)}%">${neg?'':lbl}${neg||x==null?'':`<i style="height:${tinggi(x)/(bagianAtas||1)*100}%;background:${warna(x)}"></i>`}</div>
          ${bawah<0?`<div class="tr-neg" style="height:${bagianBawah.toFixed(2)}%">${neg?`<i style="height:${tinggi(x)/(bagianBawah||1)*100}%;background:${warna(x)}"></i>${lbl}`:''}</div>`:''}
        </div>`;}).join('')}
     </div><div class="tr-x">${t.map(c=>`<span title="${c.code}">${c.code}</span>`).join('')}</div>
     ${lebar?'':'<div class="sub" style="margin-top:6px">Angka persisnya ada di tabel di bawah.</div>'}</div>`;};
  const akhir=t[t.length-1];
  const arah=(v,baik)=>v==null?'':`<div style="margin-top:10px;font-size:12.5px;font-weight:600;color:${(baik==='turun'?v<0:v>0)?'var(--soft)':'#F2C46B'}">${v>0?'↑':'↓'} ${num(Math.abs(v),1)}% dibanding siklus sebelumnya</div>`;
  return `<div class="card" style="margin-bottom:14px">
   <div class="card-h"><h3>Tren Antar Siklus</h3><span class="sub">${semua.length} siklus ditutup${dipotong>0?` · ${t.length} terbaru ditampilkan`:' · urut dari yang paling lama'}</span></div>
   <p style="margin:0 0 16px;font-size:12.5px;color:var(--dim)">Hanya siklus yang sudah ditutup. Siklus yang masih berjalan tidak ikut, karena FCR dan labanya belum final.${dipotong>0?` ${dipotong} siklus lama tidak digambar supaya grafiknya tetap terbaca; semuanya tetap ada di tabel Riwayat di bawah.`:''}</p>
   <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:26px">
    <div>${graf('FCR per siklus','makin kecil makin irit pakan',c=>c.fcr,x=>num(x,2),'kecil')}${arah(akhir.lalu&&akhir.lalu.fcr,'turun')}</div>
    <div>${graf('Mortalitas per siklus',`garis putus-putus = target ${num(MASTER.targetMortalitasPct,1)}%`,c=>c.mortPct,x=>num(x,1)+'%','kecil',MASTER.targetMortalitasPct)}${akhir.lalu&&akhir.lalu.mortPoin!=null?`<div style="margin-top:10px;font-size:12.5px;font-weight:600;color:${akhir.lalu.mortPoin<=0?'var(--soft)':'#F2C46B'}">${akhir.lalu.mortPoin>0?'↑':'↓'} ${num(Math.abs(akhir.lalu.mortPoin),1)} poin dibanding siklus sebelumnya</div>`:''}</div>
    ${can('finance')?`<div>${graf('Laba bersih per ekor','sesudah pakan, DOD, dan overhead',c=>c.labaEkor,x=>rp(x),'besar')}${arah(akhir.lalu&&akhir.lalu.laba,'naik')}</div>`:''}
   </div>
   <div class="tbl-wrap" style="margin-top:22px"><table><thead><tr><th>Siklus</th><th class="r">FCR</th><th class="r">Mortalitas</th>${can('finance')?'<th class="r">Laba / ekor</th>':''}<th>Dibanding siklus sebelumnya</th></tr></thead><tbody>
   ${t.slice().reverse().map(c=>{const l=c.lalu;
     const pot=(v,baik,teks)=>v==null?'':`<span style="color:${(baik==='turun'?v<0:v>0)?'var(--soft)':'#F2C46B'}">${teks}</span>`;
     const bagian=!l?'<small style="color:var(--dim)">siklus pertama — tidak ada pembanding</small>':[
       pot(l.fcr,'turun',`FCR ${l.fcr>0?'+':'−'}${num(Math.abs(l.fcr),0)}%`),
       l.mortPoin==null?'':pot(l.mortPoin,'turun',`mati ${l.mortPoin>0?'+':'−'}${num(Math.abs(l.mortPoin),1)} poin`),
       can('finance')?pot(l.laba,'naik',l.laba==null?'':`laba ${l.laba>0?'+':'−'}${num(Math.abs(l.laba),0)}%`):'' ].filter(Boolean).join(' · ')||'<small style="color:var(--dim)">data belum cukup</small>';
     return `<tr><td><b>${c.code}</b></td><td class="r num">${c.fcr!=null?num(c.fcr,2):'—'}</td><td class="r num">${c.mortPct!=null?num(c.mortPct,1)+'%':'—'}</td>${can('finance')?`<td class="r num"><b>${c.labaEkor!=null?rp(c.labaEkor):'—'}</b></td>`:''}<td style="font-size:12.5px">${bagian}</td></tr>`;}).join('')}
   </tbody></table></div>
   </div>`;}

/* Rekap hasil per penjual DOD — permintaan Abdur 26 Nov 2026.
   Mortalitas antar batch bisa timpang jauh; tanpa mencatat asal DOD, pola itu
   tidak bisa ditelusuri ke penjualnya. Hanya batch yang asal DOD-nya diisi
   yang dikelompokkan — batch tanpa asal tidak boleh ikut mempengaruhi
   rata-rata penjual mana pun. */
function kartuAsalDod(){
  const a=DB.asalDod||[];
  const isi=(DB.prevCycles||[]).filter(x=>x.asalDod).length+((DB.cycle&&DB.cycle.asalDod)?1:0);
  const semua=(DB.prevCycles||[]).length+(DB.cycle?1:0);
  return `<div class="card" style="margin-bottom:14px">
   <div class="card-h"><h3>Hasil per Penjual DOD</h3><span class="sub">${isi} dari ${semua} batch sudah dicatat asalnya</span></div>
   ${a.length?`<div class="tbl-wrap"><table><thead><tr><th>Penjual</th><th class="r">Batch</th><th class="r">DOD total</th><th class="r">Mortalitas</th><th class="r">FCR rata-rata</th><th>Terakhir</th></tr></thead><tbody>
    ${a.slice().sort((x,y)=>(x.mortPct==null?99:x.mortPct)-(y.mortPct==null?99:y.mortPct)).map(x=>`<tr>
      <td><b>${x.penjual}</b></td><td class="r num">${num(x.batch)}</td><td class="r num">${num(x.dod)}</td>
      <td class="r num"${x.mortPct!=null&&x.mortPct>MASTER.targetMortalitasPct?' style="color:#F2C46B"':''}><b>${x.mortPct!=null?num(x.mortPct,1)+'%':'—'}</b></td>
      <td class="r num">${x.fcr!=null?num(x.fcr,2):'—'}</td><td>${fmtDate(x.terakhir)}</td></tr>`).join('')}
   </tbody></table></div>
   <small style="display:block;margin-top:10px;color:var(--dim)">Mortalitas ditimbang jumlah DOD, jadi batch besar tidak sebobot batch kecil. Hanya batch yang asal DOD-nya diisi yang masuk hitungan.</small>`
   :emptyState('Belum ada batch yang dicatat asal DOD-nya','Isi kolom "Asal DOD" waktu membuat batch baru. Setelah 3–4 batch, tabel ini menunjukkan penjual mana yang mortalitasnya tinggi — jadi keputusan ganti penjual punya dasar, bukan perasaan.')}</div>`;}

function pgSiklus(){const c=DB.cycle;const d=calc.day();const s=calc.sum();const pop=calc.population();
 const role=state.user.role;
 // Tanpa siklus aktif halaman ini tetap dibuka, supaya hasil siklus yang sudah ditutup bisa dibaca
 const banyak=calc.batchAktif()>1;
 const active=state.tab||(banyak?'rotasi':(c?'aktif':'riwayat'));
 const tgt=c?c.targetDays:45;
 const stages=[['DOD masuk',1,1],['Brooding',1,14],['Growing',15,Math.max(16,tgt-10)],['Finishing',Math.max(17,tgt-9),tgt-1],['Panen',tgt,tgt]];
 const mortIn=(a,b)=>DB.mortality.filter(m=>{const x=dayOf(m.date);return x>=a&&x<=b;}).reduce((t,m)=>t+m.qty,0);
 const harvests=DB.orders.filter(o=>o.source==='PANEN');
 const btns=[
   (c&&['OWNER','MANAGER'].includes(role)&&pop>0)?`<button class="btn primary" data-act="modal" data-m="harvest">${ic('plus',14)} Catat Panen</button>`:'',
   (['OWNER','MANAGER'].includes(role)&&calc.populasiFarm()>0)?`<button class="btn" data-act="modal" data-m="batch-move">Pindah Kandang</button>`:'',
   (c&&['OWNER','MANAGER'].includes(role))?`<button class="btn" data-act="modal" data-m="cycle-target">Ubah Target</button>`:'',
   (c&&role==='OWNER')?`<button class="btn" data-act="modal" data-m="cycle-close">Tutup Batch</button>`:'',
   can('masterData')?`<button class="btn ${c?'ghost':'primary'}" data-act="modal" data-m="cycle">${ic('plus',14)} Batch Baru</button>`:'',
 ].filter(Boolean).join('');
 const sumRow=(k,v)=>`<span>${k}</span><b class="num">${v}</b>`;

 return pageHead('Siklus Ternak','Setiap siklus adalah unit akuntansi tersendiri: DOD, biaya, populasi, dan hasil panen terikat ke siklus.',btns)+
 `<div class="tabs">${calc.batchAktif()?`<button class="${active==='rotasi'?'active':''}" data-act="tab" data-v="rotasi">Semua Kandang${calc.batchAktif()>1?` (${calc.batchAktif()})`:''}</button>`:''}${c?`<button class="${active==='aktif'?'active':''}" data-act="tab" data-v="aktif">${(()=>{const h=(DB.harian||[]).find(x=>x.code===c.code);return h?h.barnName+' \u00b7 ':'';})()}Batch ${c.code}</button>`:''}<button class="${active==='riwayat'?'active':''}" data-act="tab" data-v="riwayat">Riwayat</button></div>`+
 (active==='rotasi'?semuaKandang():active==='aktif'&&c?halamanKandang():'')+
 (!c?`<div class="alert info" style="margin-bottom:14px">${ic('duck',16)}<div><b>Tidak ada siklus yang sedang berjalan</b>${DB.prevCycles.length?'Hasil siklus yang sudah ditutup ada di tabel di bawah. ':''}${can('masterData')?'Mulai siklus baru lewat tombol di kanan atas.':'Hubungi Owner untuk memulai siklus baru.'}</div></div>`:'')+
 (active==='rotasi'||(active==='aktif'&&c)?'': active==='riwayat'?kartuTrenSiklus()+kartuAsalDod()+`<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Siklus</th><th>DOD</th><th>Asal DOD</th><th>Tanggal DOD</th><th class="r">Hari</th><th class="r">Panen</th><th class="r">Bobot</th><th class="r">Rata-rata</th><th class="r">FCR</th><th class="r">Mortalitas</th>${can('finance')?'<th class="r">Omzet</th><th class="r">Laba</th>':''}<th>Status</th></tr></thead><tbody>
  ${!c?'':`<tr><td><b>${c.code}</b><br><small style="color:var(--dim)">${c.breed}</small></td><td class="num">${num(c.dodQty)}</td><td>${c.asalDod||'<small style="color:var(--dim)">—</small>'}</td><td>${fmtDate(c.dodDate)}</td><td class="r num">${d}</td><td class="r num">${s?num(s.harvestQty):0}</td><td class="r num">${s&&s.harvestKg?num(s.harvestKg,1)+' kg':'—'}</td><td class="r num">${s&&s.harvestAvgKg?num(s.harvestAvgKg,2)+' kg':'—'}</td><td class="r num">${s&&s.fcr!=null?num(s.fcr,3):'—'}</td><td class="r num">${s&&s.mortPct!=null?num(s.mortPct,2)+'%':'—'}</td>${can('finance')?`<td class="r num">${s?rp(s.revenue):'—'}</td><td class="r num">${s?rp(s.profit):'—'}</td>`:''}<td>${stBadge(c.stage==='HARVEST'?'PANEN':'AKTIF')}</td></tr>`}
  ${DB.prevCycles.map(p=>`<tr><td><b>${p.code}</b><br><small style="color:var(--dim)">${p.breed||'—'}</small></td><td class="num">${num(p.dodQty)}</td><td>${p.asalDod||'<small style="color:var(--dim)">—</small>'}</td><td>${fmtDate(p.dodDate)}</td><td class="r num">${p.days??'—'}</td><td class="r num">${num(p.harvestQty||0)}</td><td class="r num">${p.harvestKg?num(p.harvestKg,1)+' kg':'—'}</td><td class="r num">${p.harvestAvgKg?num(p.harvestAvgKg,2)+' kg':'—'}</td><td class="r num">${p.fcr!=null?num(p.fcr,3):'—'}</td><td class="r num">${p.mortPct!=null?num(p.mortPct,2)+'%':'—'}</td>${can('finance')?`<td class="r num">${p.revenue!=null?rp(p.revenue):'—'}</td><td class="r num">${p.profit!=null?rp(p.profit):'—'}</td>`:''}<td>${stBadge(p.status)}${p.carriedOut?`<br><small style="color:var(--dim)">${num(p.carriedOut)} ekor dibawa keluar</small>`:''}</td></tr>`).join('')}
  ${!DB.prevCycles.length?`<tr><td colspan="${can('finance')?13:11}" style="color:var(--dim);text-align:center;padding:18px">Belum ada siklus yang ditutup. Riwayat akan muncul di sini setelah siklus pertama selesai.</td></tr>`:''}</tbody></table></div></div>`:

 `<div class="grid g-2"><div class="card"><div class="card-h"><h3>Siklus ${c.code} · ${c.breed}</h3>${stBadge(c.stage==='HARVEST'?'PANEN':'AKTIF')}</div><div class="kv" style="grid-template-columns:auto 1fr;row-gap:10px"><span>Tanggal DOD</span><b>${fmtLong(c.dodDate)}</b><span>Jumlah DOD</span><b class="num">${num(c.dodQty)} ekor</b>${can('finance')?`<span>Harga DOD</span><b class="num">${rp(c.dodPrice)}/ekor</b><span>Modal DOD</span><b class="num">${rp(c.dodQty*c.dodPrice)}</b>`:''}<span>Target panen</span><b>${tgt} hari · ${fmtLong(dateOfDay(tgt))}</b><span>Target bobot</span><b class="num">${num(c.targetWeight[0],1)}–${num(c.targetWeight[1],1)} kg</b><span>Target mortalitas</span><b>&lt; ${c.targetMort}%</b><span>Kandang</span><b>${barnsWorking().map(b=>`${b.name} (${num(calc.population(b.id))} ekor)`).join(', ')||'—'}</b><span>Dibuat oleh</span><b>${userName(c.createdBy)} · ${fmtDT(c.createdAt||c.dodDate)} ${badge('neutral','TERKUNCI')}</b></div>
  <div class="alert info" style="margin-top:14px">${ic('lock',16)}<div><b>Jumlah & harga DOD terkunci</b>Perubahan hanya lewat "Ajukan Koreksi" dengan bukti surat jalan dan persetujuan Owner.</div></div></div>
  <div class="card"><div class="card-h"><h3>Timeline Siklus</h3><span class="sub">Hari ke-${d} dari ${tgt}</span></div><div class="stage">${stages.map(([n,a,b])=>`<div class="${d>b?'done':d>=a?'now':''}">${n}<small>H${a}${b>a?'–'+b:''}</small></div>`).join('')}</div>
  <div class="timeline" style="margin-top:18px">${[
    ['DOD masuk','done',fmtDT(c.dodDate),`${num(c.dodQty)} ekor DOD — ${userName(c.createdBy)}`],
    ['Brooding',d>14?'done':d>=1?'now':'todo',`H1–H14 · ${fmtDate(dateOfDay(14))}`,d>=1?`Mortalitas brooding ${mortIn(1,14)} ekor (${num(mortIn(1,14)/c.dodQty*100,2)}%)`:'Belum mulai'],
    ['Growing',d>stages[2][2]?'done':d>=15?'now':'todo',`H15–H${stages[2][2]}`,calc.avgWeight()!=null?`Bobot ${num(calc.avgWeight(),2)} kg · target H${d} ${num(calc.target(d),2)} kg`:'Belum ada timbangan'],
    ['Finishing',d>=stages[3][1]?(d>stages[3][2]?'done':'now'):'todo',`H${stages[3][1]}–H${stages[3][2]}`,'Pakan finisher, seleksi bobot untuk pre-order'],
    ['Panen',harvests.length?(pop===0?'done':'now'):'todo',harvests.length?fmtDate(harvests[harvests.length-1].date):fmtDate(dateOfDay(tgt)),harvests.length?`${num(s?s.harvestQty:0)} ekor terpanen${s&&s.harvestKg?` · ${num(s.harvestKg,1)} kg`:''}${pop>0?` · sisa ${num(pop)} ekor`:' · kandang kosong'}`:`Estimasi ${num(calc.projectedPop())} ekor`],
  ].map(([b,k,t,dd])=>`<div class="tl ${k}"><div class="t">${t}</div><div class="b">${b}</div><div class="d">${dd}</div></div>`).join('')}</div></div></div>`+
  (harvests.length?`<div class="card" style="margin-top:14px"><div class="card-h"><h3>Hasil Panen Siklus ${c.code}</h3><span class="sub">${harvests.length} kali panen${pop>0?` · sisa ${num(pop)} ekor di kandang`:' · kandang sudah kosong'}</span></div>
   <div class="tbl-wrap"><table><thead><tr><th>Tanggal</th><th>Kandang</th><th>Pembeli</th><th class="r">Ekor</th><th class="r">Berat</th><th class="r">Rata-rata</th>${can('finance')?'<th class="r">Harga/kg</th><th class="r">Nilai</th>':''}<th>Bayar</th></tr></thead><tbody>
   ${harvests.slice().reverse().map(o=>`<tr><td class="num">${fmtDT(o.date)}</td><td>${o.barn?barnName(o.barn):'—'}</td><td>${(DB.customers.find(x=>x.id===o.customer)||{}).name||'—'}</td><td class="r num">${num(o.qty)}</td><td class="r num">${o.weight?num(o.weight,1)+' kg':'—'}</td><td class="r num">${o.weight?num(o.weight/o.qty,2)+' kg':'—'}</td>${can('finance')?`<td class="r num">${o.priceKg?rp(o.priceKg):'—'}</td><td class="r num">${o.weight&&o.priceKg?rp(o.weight*o.priceKg):'—'}</td>`:''}<td>${stBadge(o.pay)}</td></tr>`).join('')}
   ${s?`<tr style="border-top:2px solid rgba(255,255,255,.12)"><td colspan="3"><b>Total</b></td><td class="r num"><b>${num(s.harvestQty)}</b></td><td class="r num"><b>${num(s.harvestKg,1)} kg</b></td><td class="r num"><b>${s.harvestAvgKg?num(s.harvestAvgKg,2)+' kg':'—'}</b></td>${can('finance')?`<td></td><td class="r num"><b>${rp(s.revenue)}</b></td>`:''}<td></td></tr>`:''}</tbody></table></div>
   ${can('finance')&&s?`<div class="kv" style="margin-top:14px;row-gap:9px">${sumRow('Pendapatan',rp(s.revenue))}${sumRow('Modal DOD',rp(s.dodCost))}${sumRow('Biaya operasional',rp(s.cost-s.dodCost))}<span>Laba sampai sekarang</span><b class="num" style="color:${s.profit>=0?'var(--sage)':'#E8836F'}">${rp(s.profit)}</b>${sumRow('FCR akhir',s.fcr!=null?num(s.fcr,3):'—')}</div>`:''}</div>`:'')+
  `<div class="grid g-3" style="margin-top:14px">${kpi('Populasi',num(pop),'ekor',`${calc.mortTotal()} mati · ${calc.popBalance().panen} dipanen`,'','duck')}${kpi('Bobot rata-rata',calc.avgWeight()!=null?num(calc.avgWeight(),2):'—','kg',`Target H${d}: ${num(calc.target(d),2)} kg`,'','scale')}${kpi('Pakan kumulatif',num(calc.feedTotal()),'kg',`FCR ${s&&s.fcr!=null?num(s.fcr,3):(calc.fcr()?num(calc.fcr().fcr,2):'—')}`,'','feed')}</div>`);}
/* ---------- POPULASI & MORTALITAS ----------
   LINGKUP. Halaman ini punya dua lingkup, diminta Abdur 27 Nov 2026:
     "Siklus ini"   — hanya siklus yang sedang dibuka (seperti sebelumnya).
     "Seluruh farm" — semua batch yang SEDANG JALAN.
   Siklus yang sudah ditutup tidak ikut di dua-duanya; itu tetap di Riwayat.
   Sebelum ini tombol "Semua" di halaman ini sebenarnya cuma berarti "semua
   kandang di siklus yang dibuka". Di farm Bapak siklus yang dibuka hanya mengisi
   satu kandang, jadi tombolnya cuma menawarkan "Semua" dan kandang itu, dan
   dua-duanya memberi angka yang sama persis — tombol yang tidak melakukan apa
   pun. Datanya sendiri sekarang dikirim server sebagai DB.farmPopTx dan
   DB.farmMortality.
   Tombol lingkupnya HANYA muncul kalau memang ada lebih dari satu batch yang
   sedang jalan; kalau cuma satu, dua pilihan itu akan memberi angka yang sama
   dan hanya menambah tombol yang tidak berguna. */
function pgPopulasi(){
 const batchJalan=[...new Set((DB.farmPopTx||[]).map(t=>t.batch).filter(Boolean))];
 const adaPilihan=batchJalan.length>1;
 const L=adaPilihan&&state.lingkup==='farm'?'farm':null;
 const bf=state.barn==='ALL'?null:state.barn;
 const b=calc.popBalance(bf,L);const tab=state.tab||'ledger';
 const kandang=calc.barnsBerisi(L);
 const judulL=L?`Seluruh farm · ${batchJalan.length} batch jalan`:DB.cycle?`Siklus ${DB.cycle.code}`:'Siklus ini';
 const tombolL=adaPilihan?seg([['siklus','Siklus ini'],['farm','Seluruh farm']],L?'farm':'siklus','lingkup'):'';
 /* Kode batch disebut namanya hanya kalau sedikit; kalau banyak cukup
    jumlahnya, supaya kalimatnya tidak membengkak jadi dinding teks di farm
    dengan banyak batch berjalan. Sama seperti kepalaSiklus() di atas. */
 const sebutBatch=batchJalan.length<=6?batchJalan.join(', ')
   :`${batchJalan.slice(0,6).join(', ')} dan ${batchJalan.length-6} lainnya`;
 const ket=L
   ? `Angka di halaman ini mencakup ${batchJalan.length} batch yang sedang jalan: ${sebutBatch}. Siklus yang sudah ditutup tidak ikut — itu ada di Riwayat.`
   : DB.cycle?`Angka di halaman ini hanya siklus ${DB.cycle.code}.${adaPilihan?' Pilih "Seluruh farm" untuk melihat semua batch yang sedang jalan.':''}`:'';
 return pageHead('Populasi & Mortalitas','Populasi tidak pernah diubah langsung. Setiap angka berasal dari transaksi: DOD masuk, transfer, kematian, panen, penjualan.',
   `${tombolL}${seg([['ALL','Semua'],...kandang.map(x=>[x.id,x.name])],state.barn,'barn')}`)+
 (ket?`<div class="lingkup-blok" style="margin-bottom:14px">${lingkup(L?'farm':'siklus',judulL,`${num(b.akhir)} ekor`,ket)}</div>`:'')+
 `<div class="card" style="margin-bottom:14px"><div class="card-h"><h3>Balance Populasi ${state.barn==='ALL'?'':'· '+barnName(state.barn)}</h3><span class="sub">${L?'seluruh farm':'siklus ini'}</span></div>
  <div class="flow"><div class="n"><b class="num">${num(b.dod)}</b><small>Populasi awal (DOD)</small></div><span class="op">+</span><div class="n"><b class="num">${num(b.tIn)}</b><small>Transfer masuk</small></div><span class="op">−</span><div class="n neg"><b class="num">${num(b.mati)}</b><small>Kematian</small></div><span class="op">−</span><div class="n neg"><b class="num">${num(b.panen)}</b><small>Panen</small></div><span class="op">−</span><div class="n neg"><b class="num">${num(b.jual)}</b><small>Penjualan</small></div><span class="op">−</span><div class="n neg"><b class="num">${num(b.tOut)}</b><small>Transfer keluar</small></div><span class="op">=</span><div class="n res"><b class="num">${num(b.akhir)}</b><small>Populasi akhir</small></div></div>
  ${(()=>{
    /* DIPERBAIKI 26 Nov 2026 — dua cacat sekaligus.
       1) Kotak hijau "Balance OK" dulu dicetak TANPA SYARAT, jadi kalau
          balance tidak cocok layar menampilkan peringatan merah DAN kotak
          hijau bersamaan — dua jawaban bertentangan di layar yang sama.
       2) Verdict mortalitas menumpang di kotak hijau itu, sehingga
          mortalitas 29,5% terhadap target 5% diumumkan dengan tanda centang
          hijau. Sekarang dipisah: balance soal hitungan cocok atau tidak,
          mortalitas soal bagus atau jelek — masing-masing dengan warnanya. */
    const h=b.dod+b.tIn-b.mati-b.panen-b.jual-b.tOut;
    return h!==b.akhir
      ? `<div class="alert warn" style="margin-top:14px">${ic('alert',16)}<div><b>Balance tidak cocok</b>Hasil hitung ${num(h)} ekor, populasi akhir ${num(b.akhir)} ekor — selisih ${num(Math.abs(h-b.akhir))} ekor. Laporkan dulu, jangan dipakai sebagai dasar keputusan.</div></div>`
      : `<div class="alert ok" style="margin-top:14px">${ic('check',16)}<div><b>Balance cocok</b>Jumlah seluruh transaksi sama dengan populasi akhir, jadi angka di halaman ini bisa dipakai.</div></div>`;})()}</div>
 ${kartuMortalitas(bf,L)}
 <div class="grid g-2" style="margin-bottom:14px">${chartCard('Populasi Harian','ch-pop',L?'':rangeSeg(),'',L?'per tanggal · seluruh farm':'')}${chartCard('Mortalitas Harian','ch-mort','','', 'Batas normal '+MASTER.batasMortalitasHarian+' ekor/hari'+(L?' · per tanggal, seluruh farm':''))}</div>
 <div class="tabs"><button class="${tab==='ledger'?'active':''}" data-act="tab" data-v="ledger">Ledger Transaksi</button><button class="${tab==='mort'?'active':''}" data-act="tab" data-v="mort">Catatan Kematian</button><button class="${tab==='lap'?'active':''}" data-act="tab" data-v="lap">Laporan Kematian</button></div>
 ${tab==='lap'?laporanMati():tab==='ledger'?`<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Waktu</th><th>Jenis</th>${L?'<th>Batch</th>':''}<th>Kandang</th><th class="r">Jumlah</th>${L?'':'<th class="r">Saldo</th>'}<th>Referensi</th><th>User</th><th>Status</th></tr></thead><tbody>${(()=>{
   /* Kolom Saldo hanya ada di lingkup siklus. Saldo berjalan lintas batch
      tidak punya arti: menjumlahkan transaksi tiga batch berurutan waktu
      menghasilkan angka yang bukan populasi batch mana pun. */
   let run=0;return calc.sumberPop(L).filter(t=>state.barn==='ALL'||t.barn===state.barn).slice().sort((a,b)=>a.date-b.date).map(t=>{run+=t.qty;return `<tr><td class="num">${fmtDT(t.date)}</td><td>${badge(t.qty>0?'ok':'danger',t.type.replace('_',' '))}</td>${L?`<td class="sub">${t.batch||'—'}</td>`:''}<td>${barnName(t.barn)}</td><td class="r num" style="color:${t.qty>0?'var(--soft)':'#F29390'}">${t.qty>0?'+':''}${t.qty}</td>${L?'':`<td class="r num"><b>${run}</b></td>`}<td><code style="font-size:11px">${t.ref}</code></td><td>${userName(t.user)}</td><td>${t.locked?badge('neutral','TERKUNCI'):stBadge('RECORDED')}</td></tr>`;}).reverse().join('');})()}</tbody></table></div></div>`:
 `<div class="card"><div class="card-h"><h3>Catatan Kematian</h3>${state.user.role!=='ANAK_KANDANG'?`<button class="btn sm" data-act="modal" data-m="mort">${ic('plus',14)} Catat kematian</button>`:''}</div><div class="tbl-wrap"><table><thead><tr><th>Tanggal</th>${L?'<th>Batch</th>':''}<th>Kandang</th><th class="r">Jumlah</th><th>Jenis</th><th>Penyebab</th><th>Bukti</th><th>User</th><th>Status</th><th></th></tr></thead><tbody>${calc.sumberMati(L).filter(m=>state.barn==='ALL'||m.barn===state.barn).slice().reverse().map(m=>`<tr><td class="num">${fmtDT(m.date)}</td>${L?`<td class="sub">${m.batch||'—'}</td>`:''}<td>${barnName(m.barn)}</td><td class="r num"><b>${m.qty}</b>${(m.kind||'MATI')==='MATI'&&m.qty>=MASTER.batasMortalitasHarian?' '+badge('warn','WARNING'):''}</td><td>${(m.kind||'MATI')==='AFKIR'?badge('neutral','AFKIR'):badge('danger','MATI')}</td><td>${m.cause}</td><td>${photoChip(m.photo)}${fotoAsal(m.photoSource,m.photo)}</td><td>${userName(m.user)}</td><td>${m.locked?badge('neutral','TERKUNCI'):stBadge(m.status)}</td><td>${!L||(DB.cycle&&m.batch===DB.cycle.code)?`<button class="btn ghost sm" data-act="modal" data-m="correction" data-type="MORT" data-id="${m.id}">Ajukan koreksi</button>`:'<small style="color:var(--dim)">batch lain</small>'}</td></tr>`).join('')}</tbody></table></div></div>`}
 `;}

function feedVersions(r){if(!r.versions.length)return '';return `<div style="margin-top:6px">${r.versions.map((v,i)=>`<div class="ver ${i===r.versions.length-1?'active':''}"><s>${i===0?r.kg:r.versions[i-1].kg} kg</s> → <b>${v.kg} kg</b> · ${v.reason} · disetujui ${userName(v.approvedBy)} ${fmtDT(v.date)}</div>`).join('')}</div>`;}
function pgPakan(){const fd=calc.feedDiff();const tab=state.tab||'riwayat';const purchased=calc.feedPurchased();
 return pageHead('Pakan','Stok pakan dihitung dari transaksi: pembelian − pemakaian ± penyesuaian. Selisih dengan opname fisik selalu ditampilkan.',`${state.user.role!=='ANAK_KANDANG'?`<button class="btn" data-act="modal" data-m="opname">${ic('scale',14)} Stock Opname</button>`:''}${['OWNER','MANAGER'].includes(state.user.role)&&DB.cycle?`<button class="btn" data-act="modal" data-m="feed-use">${ic('feed',14)} Catat Pakan Keluar</button>`:''}${can('inputPurchase')||can('masterData')?`<button class="btn primary" data-act="modal" data-m="purchase">${ic('plus',14)} Pembelian Pakan</button>`:''}`)+kartuPakanHarian()+kartuHargaJenis()+
 `<div class="grid g-kpi" style="margin-bottom:14px">${(()=>{const sa=calc.stokAwalSiklus();return kpi('Stok Awal Siklus',sa==null?'\u2014':num(sa),sa==null?'':'kg',sa==null?'belum ada siklus aktif':(sa>0?'sisa gudang sebelum DOD '+fmtDate(DB.cycle.dodDate):'tidak ada sisa gudang sebelum DOD'),'','box','','stok');})()}${kpi('Pembelian',num(purchased),'kg',`${DB.feedPurchases.filter(p=>p.status==='APPROVED').length} transaksi disetujui`,'','truck')}${kpi('Pemakaian',num(calc.feedTotal()),'kg',`Rata-rata ${num(calc.feedAvg7(),0)} kg/hari (7 hari)`,'','feed')}${kpi('Penyesuaian',num(calc.feedAdjusted()),'kg',DB.feedAdjust.length?'Disetujui':'Belum ada','','pen')}${kpi('Stok Teoritis',num(calc.feedStockTheory()),'kg',`Cukup ${num(calc.feedDaysLeft(),0)} hari`,calc.stokKritis()?'down':'up','box','gold')}${fd?kpi('Stok Fisik (Opname)',num(fd.op.physical),'kg',`Selisih ${num(fd.diff)} kg · ${fmtDate(fd.op.date)}`,Math.abs(fd.diff)>=10?'warn':'up','scale',Math.abs(fd.diff)>=10?'red':''):''}</div>
 ${(()=>{const c=calc.feedCatatan7();return c.dari>0&&!c.lengkap?`<div class="alert warn" style="margin-bottom:14px">${ic('alert',18)}<div><b>Pencatatan pakan belum lengkap \u2014 baru ${c.dicatat} dari ${c.dari} hari terakhir</b>
  Rata-rata 7 hari di bawah dihitung dari ${c.dicatat} hari yang ada catatannya saja, bukan dibagi ${c.dari}. ${c.kosong} hari tanpa catatan TIDAK dihitung sebagai nol \u2014 kalau dihitung nol, angkanya akan terlihat lebih bagus dari kenyataan.
  Lengkapi catatan pakan supaya rata-rata, FCR, dan perkiraan stok bisa dipercaya.</div></div>`:''})()}
 ${fd&&Math.abs(fd.diff)>=10?`<div class="alert warn" style="margin-bottom:14px">${ic('alert',18)}<div style="flex:1"><b>Selisih stok pakan ${num(Math.abs(fd.diff))} kg — PERLU VERIFIKASI</b>Stok teoritis per ${fmtDT(fd.op.date)} adalah ${num(fd.theory)} kg, opname fisik ${num(fd.op.physical)} kg. Selisih ini bukan tuduhan; bisa berasal dari tumpahan, karung tidak penuh, atau input yang belum tercatat. Verifikasi lalu ajukan penyesuaian stok dengan bukti.</div>${can('approve')?`<button class="btn sm" data-act="modal" data-m="adjust">Ajukan penyesuaian</button>`:''}</div>`:''}
 <div class="grid g-2" style="margin-bottom:14px">${chartCard('Konsumsi Pakan Harian','ch-feed',rangeSeg(),'','Hari ini '+num(calc.feedToday())+' kg vs rata-rata 7 hari '+num(calc.feedAvg7(),1)+' kg')}<div class="card"><div class="card-h"><h3>FCR Transparan</h3></div>${(()=>{const f=calc.fcr();return f?`<div class="kv" style="row-gap:10px"><span>Total pakan</span><b class="num">${num(f.feed)} kg</b><span>Biomassa sekarang</span><b class="num">${num(calc.population())} ekor × ${num(calc.avgWeight(),2)} kg = ${num(calc.population()*calc.avgWeight(),1)} kg</b><span>Biomassa awal (DOD)</span><b class="num">${DB.cycle.dodQty} × ${num(calc.bobotDod(),3)} kg = ${num(DB.cycle.dodQty*calc.bobotDod(),1)} kg</b><span>Pertambahan biomassa</span><b class="num">${num(f.bio,1)} kg</b><span>FCR</span><b class="num" style="font-size:22px;color:var(--gold)">${num(f.feed)} ÷ ${num(f.bio,1)} = ${num(f.fcr,2)}</b></div><div class="chart-box sm" style="margin-top:10px"><canvas id="ch-fcr"></canvas></div>`:(calc.bobotDod()==null?`<div class="alert warn">${ic('alert',16)}<div><b>Bobot DOD belum diatur</b>FCR tidak bisa dihitung tanpa bobot DOD saat masuk. Isi di Pengaturan \u2192 Master Data, ditimbang sendiri atau diambil dari nota.</div></div>`:'<div class="alert info">Data belum cukup untuk menghitung FCR.</div>');})()}</div></div>
 <div class="tabs"><button class="${tab==='riwayat'?'active':''}" data-act="tab" data-v="riwayat">Riwayat Pemakaian</button><button class="${tab==='beli'?'active':''}" data-act="tab" data-v="beli">Pembelian</button><button class="${tab==='opname'?'active':''}" data-act="tab" data-v="opname">Opname & Penyesuaian</button></div>
 ${tab==='riwayat'?`<div class="card"><div class="card-h"><h3>Riwayat Input Pakan</h3>${seg([['ALL','Semua'],...barnsWorking().map(b=>[b.id,b.name])],state.barn,'barn')}</div><div class="tbl-wrap"><table><thead><tr><th>Waktu</th><th>Kandang</th><th class="r">Jumlah</th><th>Bukti</th><th>User</th><th>Status</th><th></th></tr></thead><tbody>${DB.feedRecords.filter(r=>state.barn==='ALL'||r.barn===state.barn).slice(-16).reverse().map(r=>`<tr><td class="num">${fmtDT(r.date)}</td><td>${barnName(r.barn)}</td><td class="r num"><b>${calc.feedVal(r)} kg</b>${r.versions.length?' '+badge('info','V'+(r.versions.length+1)):''}${feedVersions(r)}</td><td>${photoChip(r.photo)}</td><td>${userName(r.user)}</td><td>${DB.corrections.find(c=>c.recordId===r.id&&c.status==='PENDING')?badge('pending','KOREKSI MENUNGGU'):r.locked?badge('neutral','TERKUNCI'):stBadge(r.status)}</td><td><button class="btn ghost sm" data-act="modal" data-m="correction" data-type="FEED" data-id="${r.id}">Ajukan koreksi</button></td></tr>`).join('')}</tbody></table></div></div>`:
 tab==='beli'?`<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Tanggal</th><th class="r">Jumlah</th><th class="r">Harga/kg</th><th class="r">Total</th><th>Vendor</th><th>No. Bukti</th><th>Nota</th><th>User</th><th>Status</th></tr></thead><tbody>${DB.feedPurchases.slice().reverse().map(p=>`<tr><td>${fmtDate(p.date)}</td><td class="r num">${num(p.qty)} kg</td><td class="r num">${p.price?rp(p.price):'—'}</td><td class="r num"><b>${p.price?rp(p.qty*p.price):'—'}</b></td><td>${p.vendor}</td><td><code style="font-size:11px">${p.ref}</code></td><td>${photoChip('nota')}</td><td>${userName(p.user)}</td><td>${stBadge(p.status)}</td></tr>`).join('')}</tbody></table></div></div>`:
 `<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Tanggal</th><th>Jenis</th><th class="r">Teoritis</th><th class="r">Fisik / Qty</th><th class="r">Selisih</th><th>Catatan</th><th>User</th><th>Status</th></tr></thead><tbody>${DB.feedOpname.map(o=>{const t=calc.feedStockAtDate(o.date);return `<tr><td class="num">${fmtDT(o.date)}</td><td>${badge('info','OPNAME')}</td><td class="r num">${num(t)} kg</td><td class="r num">${num(o.physical)} kg</td><td class="r num" style="color:${Math.abs(t-o.physical)>=10?'#F2C46B':'var(--soft)'}"><b>${num(t-o.physical)} kg</b></td><td>${o.note}</td><td>${userName(o.user)}</td><td>${Math.abs(t-o.physical)>=10?stBadge('OPEN'):stBadge('VERIFIED')}</td></tr>`;}).join('')}${DB.feedAdjust.map(a=>`<tr><td class="num">${fmtDT(a.date)}</td><td>${badge('gold','PENYESUAIAN')}</td><td class="r">—</td><td class="r num">${a.qty>0?'+':''}${num(a.qty)} kg</td><td class="r">—</td><td>${a.reason}</td><td>${userName(a.user)}</td><td>${stBadge('APPROVED')}</td></tr>`).join('')}</tbody></table></div></div>`}
 `;}

function pgPertumbuhan(){
 /* Filter kandang ditambahkan 27 Nov 2026. Sebelumnya halaman ini satu-satunya
    layar per-kandang yang TIDAK punya pilihan kandang, padahal Populasi dan
    Kesehatan punya. Akibatnya kalau satu siklus mengisi beberapa petak, semua
    angka di sini mencampur petak-petak itu dan tidak bisa dipisah. */
 const bf=state.barn==='ALL'?null:state.barn;
 const bobot=calc.avgWeight(bf);const d=calc.day();const adaKurva=calc.adaKurva();
 const tgt=adaKurva?calc.target(d):null;
 const gap=(bobot!=null&&tgt)?(bobot-tgt)/tgt*100:null;
 const a=calc.adg(bf);
 return pageHead('Pertumbuhan',adaKurva?'Bobot rata-rata dihitung dari sampel timbang (total berat \u00f7 jumlah sampel), dibandingkan dengan kurva target yang Bapak atur sendiri.':'Bobot rata-rata dihitung dari sampel timbang (total berat \u00f7 jumlah sampel).',`${seg([['ALL','Semua'],...barnsWorking().map(b=>[b.id,b.name])],state.barn,'barn')}${state.user.role!=='ANAK_KANDANG'?`<button class="btn primary" data-act="modal" data-m="weigh">${ic('scale',14)} Input Timbang</button>`:''}`)+
 `${adaKurva?'':`<div class="alert warn" style="margin-bottom:14px">${ic('alert',16)}<div><b>Kurva target bobot belum diatur</b>Tanpa kurva, aplikasi tidak bisa bilang bobot bebek Bapak sesuai target atau tidak \u2014 dan tidak akan menebak. Isi di Pengaturan \u2192 Master Data \u2192 Kurva Target Bobot.</div></div>`}<div class="grid g-kpi" style="margin-bottom:14px">${kpi('Bobot Rata-rata',bobot!=null?num(bobot,2):'\u2014','kg',(()=>{const w=DB.weights.filter(x=>!bf||x.barn===bf);return w.length?`Sampel terakhir ${fmtDate(w[w.length-1].date)}`:'Belum ada timbangan';})(),'','scale')}${adaKurva?kpi('Target Hari ke-'+d,num(tgt,2),'kg',gap==null?'Timbang dulu untuk membandingkan':`${gap>=0?'+':''}${num(gap,1)}% vs target`,gap!=null&&gap<-3?'warn':'up','growth'):kpi('Target Hari ke-'+d,'\u2014','','Kurva belum diatur','warn','growth')}${kpi('Target Panen',teksTarget(),'kg',`H${DB.cycle.targetDays} \u00b7 ${fmtDate(dateOfDay(DB.cycle.targetDays))}`,'','duck')}${(()=>{
  /* Judul kartu mengikuti rentang yang BENAR-BENAR dipakai, bukan selalu
     "7 hari". Kalau dua timbangan terakhir berjarak 14 hari, kartunya
     menulis 14 hari. Lihat calc.adg(). */
  const judul=a?`ADG ${a.hari} hari terakhir`:'ADG 7 hari terakhir';
  const kaki=!a?'Perlu minimal 2 timbangan'
    :a.dalamJendela?`H${a.dariHari} \u2192 H${a.sampaiHari} \u00b7 pertambahan bobot harian`
    :`H${a.dariHari} \u2192 H${a.sampaiHari} \u00b7 tidak ada timbangan dalam 7 hari terakhir`;
  return kpi(judul,a?num(a.g,0):'\u2014','g/hari',kaki,a&&!a.dalamJendela?'warn':'','growth');})()}${kpi('FCR',calc.fcr()?num(calc.fcr().fcr,2):'\u2014','','Transparan \u00b7 lihat halaman Pakan','','feed')}</div>


 ${gap<-3?`<div class="alert warn" style="margin-bottom:14px">${ic('alert',18)}<div><b>Bobot tertinggal ${num(Math.abs(gap))}% dari kurva target</b>Periksa kualitas pakan, kepadatan kandang, dan suhu. Rekomendasi: timbang ulang sampel 30 ekor per kandang besok pagi.</div></div>`:''}
 <div class="grid ${bf?'':'g-2'}" style="margin-bottom:14px">${chartCard('Aktual vs Target','ch-weight','','',`kg · seluruh siklus${bf?' · '+barnName(bf):''}`)}${bf?'':chartCard('Perbandingan Kandang','ch-barn','','','bobot rata-rata terakhir')}</div>
 <div class="card"><div class="card-h"><h3>Riwayat Timbang</h3></div><div class="tbl-wrap"><table><thead><tr><th>Tanggal</th><th>Hari</th><th>Kandang</th><th class="r">Sampel</th><th class="r">Total berat</th><th class="r">Rata-rata</th><th class="r">Target</th><th>Foto timbangan</th><th>User</th><th>Status</th><th></th></tr></thead><tbody>${DB.weights.filter(w=>!bf||w.barn===bf).slice().reverse().map(w=>{const dd=dayOf(w.date);const t=calc.target(dd);return `<tr><td>${fmtDate(w.date)}</td><td class="num">H${dd}</td><td>${barnName(w.barn)}</td><td class="r num">${w.n} ekor</td><td class="r num">${num(w.total,1)} kg</td><td class="r num"><b>${num(w.avg,2)} kg</b></td><td class="r num" style="color:${w.avg<t*0.97?'#F2C46B':'var(--soft)'}">${num(t,2)} kg</td><td>${photoChip(w.photo)}</td><td>${userName(w.user)}</td><td>${w.locked?badge('neutral','TERKUNCI'):stBadge('RECORDED')}</td><td><button class="btn ghost sm" data-act="modal" data-m="correction" data-type="WEIGHT" data-id="${w.id}">Ajukan koreksi</button></td></tr>`;}).join('')}</tbody></table></div></div>
 `;}

function pgKesehatan(){const list=DB.health.filter(h=>state.barn==='ALL'||h.barn===state.barn||h.barn==='ALL');
 return pageHead('Kesehatan','Vaksinasi, vitamin, pengobatan, dan observasi. Setiap tindakan tercatat dengan dosis, user, dan waktu.',`${seg([['ALL','Semua'],...barnsWorking().map(b=>[b.id,b.name])],state.barn,'barn')}${state.user.role!=='ANAK_KANDANG'?`<button class="btn primary" data-act="modal" data-m="health">${ic('plus',14)} Catat Tindakan</button>`:''}`)+
 /* Dihitung dari DB.health. Sebelumnya empat kartu ini ditulis tangan
    ("NORMAL", "Vaksinasi 1", "Vitamin 2 · jadwal H21 terlewat",
    "Pengobatan 1 · Kandang B") — angka prototipe yang bisa bertentangan
    dengan daftar tindakan di bawahnya, dan "NORMAL" bisa menutupi masalah
    nyata. Sekarang semuanya dari catatan yang benar-benar ada. */
 (()=>{
   const per=t=>list.filter(h=>h.type===t);
   const vak=per('Vaksinasi'), vit=per('Vitamin'), obt=per('Pengobatan'), obs=per('Observasi');
   const akhir=a=>a.length?a.slice().sort((x,y)=>y.date-x.date)[0]:null;
   const kapan=a=>{const t=akhir(a);return t?`terakhir ${fmtDate(t.date)} · ${t.item}`:'belum ada catatan';};
   /* Status kesehatan dibaca dari ada-tidaknya pengobatan yang masih jalan,
      bukan dipukul rata. Kalau tidak ada catatan apa pun, dikatakan apa
      adanya: belum ada data — bukan "NORMAL". */
   const adaObat=obt.length>0;
   const st = !list.length ? ['BELUM ADA DATA','','belum ada catatan kesehatan','']
            : adaObat ? ['PERLU PERHATIAN','',`${obt.length} pengobatan tercatat · ${kapan(obt)}`,'warn']
                      : ['NORMAL','','tidak ada pengobatan tercatat','up'];
   return `<div class="grid g-kpi" style="margin-bottom:14px">`
     + kpi('Status Kesehatan',st[0],st[1],st[2],st[3],'heart')
     + kpi('Vaksinasi',vak.length,'program',kapan(vak),'','shield')
     + kpi('Vitamin',vit.length,'pemberian',kapan(vit),'','leaf')
     + kpi('Pengobatan',obt.length,'kasus',kapan(obt),obt.length?'warn':'','heart')
     + (obs.length?kpi('Observasi',obs.length,'catatan',kapan(obs),'','note'):'')
     + `</div>`;
 })()
 + `${state.barn==='C'?emptyState('Belum ada catatan kesehatan','Kandang C kosong. Catatan akan muncul saat kandang terisi.'):`<div class="grid g-2"><div class="card"><div class="card-h"><h3>Riwayat Tindakan</h3></div><div class="timeline">${list.slice().reverse().map(h=>`<div class="tl ${h.type==='Pengobatan'?'now':'done'}"><div class="t">${fmtDT(h.date)} · ${barnName(h.barn)}</div><div class="b">${badge(h.type==='Pengobatan'?'warn':h.type==='Vaksinasi'?'ok':'info',h.type.toUpperCase())} ${h.item}</div><div class="d">Dosis: ${h.dose}${h.note?' · '+h.note:''} · oleh ${userName(h.user)}</div></div>`).join('')}</div></div>
 <div style="display:flex;flex-direction:column;gap:14px"><div class="card"><div class="card-h"><h3>Tindakan Tercatat per Hari</h3><span class="sub">dari catatan, bukan jadwal</span></div>${list.length?`<div class="tbl-wrap"><table><thead><tr><th>Hari</th><th>Tanggal</th><th>Tindakan</th><th>Kandang</th></tr></thead><tbody>${list.slice().sort((a,b)=>a.date-b.date).map(h=>`<tr><td class="num">H${dayOf(h.date)}</td><td>${fmtDate(h.date)}</td><td>${badge(h.type==='Pengobatan'?'warn':h.type==='Vaksinasi'?'ok':'info',h.type.toUpperCase())} ${h.item}</td><td>${barnName(h.barn)}</td></tr>`).join('')}</tbody></table></div>`:emptyState('Belum ada tindakan kesehatan','Catat vaksinasi, vitamin, pengobatan, atau observasi lewat tombol Catat Tindakan. Jadwal program belum bisa ditampilkan karena belum ada data jadwal di sistem.')}</div>${barnCondCard()}</div></div>`}`;}

function pgKeuangan(){if(!can('finance'))return denied();const c=calc.costByCat();const tab=state.tab||'biaya';
 return pageHead('Keuangan','Semua biaya terikat ke siklus dengan vendor, nomor bukti, foto nota, dan status approval.',`<button class="btn" data-act="export" data-what="Laporan Keuangan" data-fmt="CSV">${ic('dl',14)} Unduh CSV</button><button class="btn" data-act="export" data-what="Laporan Keuangan" data-fmt="CETAK">${ic('dl',14)} Cetak / PDF</button>`)+
 `<div class="grid g-kpi" style="margin-bottom:14px">${kpi('Modal Berjalan',rp(calc.modal()),'',(DB.cycle?'Biaya disetujui siklus '+DB.cycle.code:'Biaya disetujui'),'','money','gold')}${kpi('Omzet Realisasi',rp(DB.orders.filter(o=>o.pay==='PAID').reduce((s,o)=>s+calc.orderTotal(o),0)),'','Penjualan yang sudah dibayar','','cart','gold')}${kpi('Estimasi Omzet Panen',rp(calc.estRevenue()),'',`${num(calc.projectedPop())} ekor × ~${num(calc.targetBobot(),2)} kg × ${rp(calc.livePrice())}/kg`,'','growth','gold')}${kpi('Estimasi Laba',rpAtau(calc.estProfit()),'',`ROI ${pctAtau(calc.roi())}`,calc.estProfit()==null?'':calc.estProfit()>0?'up':'down','money','gold')}
 ${(()=>{const hk=calc.hppKg(),he=calc.hppEkor();const j=(hk||he||{}).jenis;
   const tag=j==='final'?'final':j==='sebagian'?'proyeksi, panen sebagian':'proyeksi';
   const kurang=calc.kurangDataProyeksi();
   return kpi('HPP per kg',rpAtau(hk&&hk.nilai),'',hk?`${tag} · per ekor ${rpAtau(he&&he.nilai)}`:(kurang.length?'PERLU DATA: '+kurang[0]:'butuh panen atau target bobot'),'','money','gold')
        + kpi('BEP harga jual',rpAtau(hk&&hk.nilai),'',hk?`${tag} · di bawah ini rugi`:(kurang.length?'PERLU DATA: '+kurang[0]:'butuh panen atau target bobot'),'','growth','gold');})()}</div>
 <div class="grid g-2" style="margin-bottom:14px">${chartCard('Biaya per Kategori','ch-cost','','','','keuangan')}${chartCard('Biaya, Omzet & Proyeksi Laba','ch-fin',rangeSeg(),'','kumulatif')}</div>
 <div class="tabs"><button class="${tab==='biaya'?'active':''}" data-act="tab" data-v="biaya">Daftar Biaya</button><button class="${tab==='laba'?'active':''}" data-act="tab" data-v="laba">Proyeksi Laba Rugi</button></div>
 ${tab==='biaya'?`<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Tanggal</th><th>Kategori</th><th class="r">Nominal</th><th>Vendor</th><th>No. Bukti</th><th>Nota</th><th>User</th><th>Status</th></tr></thead><tbody>${DB.expenses.map(e=>({...e,kind:'E'})).sort((a,b)=>b.date-a.date).map(e=>`<tr><td>${fmtDate(e.date)}</td><td>${badge(e.cat==='DOD'?'gold':e.cat==='Pakan'?'ok':'info',e.cat.toUpperCase())}</td><td class="r num"><b>${rp(e.amount)}</b></td><td>${e.vendor}</td><td><code style="font-size:11px">${e.ref}</code></td><td>${photoChip('nota')}</td><td>${userName(e.user)}</td><td>${stBadge(e.status)}</td></tr>`).join('')}</tbody></table></div>
  <div class="alert info" style="margin:14px">${ic('money',16)}<div><b>Biaya DOD dan pakan tidak muncul sebagai baris di sini</b>Keduanya tidak dicatat sebagai "biaya", melainkan dihitung sendiri: DOD dari jumlah x harga bibit batch ini, pakan dari yang benar-benar dimakan batch ini dikali harga nota per jenis. Rinciannya ada di tab Proyeksi Laba Rugi.</div></div></div>
  <div class="card" style="margin-top:14px"><div class="card-h"><h3>Pembelian pakan farm</h3><span class="sub">stok gudang, bukan biaya satu batch</span></div>
   <div class="alert info" style="margin-bottom:14px">${ic('duck',16)}<div><b>Kenapa dipisah</b>Pakan dibeli untuk stok farm, lalu dipakai oleh banyak batch. Kalau pembelian dibebankan ke batch yang sedang dibuka, batch itu menanggung pakan batch lain. Yang dibebankan ke batch adalah pakan yang benar-benar dimakannya.</div></div>
   ${DB.feedPurchases.length?`<div class="tbl-wrap"><table><thead><tr><th>Tanggal</th><th class="r">Jumlah</th><th class="r">Harga/kg</th><th class="r">Nilai</th><th>Vendor</th><th>No. Nota</th><th>Status</th></tr></thead><tbody>${DB.feedPurchases.slice().sort((a,b)=>b.date-a.date).map(p=>`<tr><td>${fmtDate(p.date)}</td><td class="r num">${num(p.qty,1)} kg</td><td class="r num">${p.price?rp(p.price):'—'}</td><td class="r num"><b>${p.price?rp(p.qty*p.price):'—'}</b></td><td>${esc(p.vendor||'—')}</td><td><code style="font-size:11px">${esc(p.ref||'—')}</code></td><td>${stBadge(p.status)}</td></tr>`).join('')}<tr style="background:rgba(255,255,255,.04)"><td><b>Total dibeli</b></td><td class="r num"><b>${num(calc.feedPurchased(),1)} kg</b></td><td></td><td class="r num"><b>${rp(calc.pembelianPakanFarm())}</b></td><td colspan="3"></td></tr></tbody></table></div>`:emptyState('Belum ada pembelian pakan','Pembelian dicatat di halaman Stok & Gudang.')}
  </div>
  ${kartuRiwayatHargaPakan()}`:
 `<div class="card"><div class="card-h"><h3>Proyeksi Laba Rugi Siklus ${DB.cycle.code}</h3></div><div class="tbl-wrap"><table><tbody>${Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<tr><td>Biaya ${k}</td><td class="r num">${rp(v)}</td><td class="r num" style="color:var(--dim)">${pct(v/calc.modal()*100)}</td></tr>`).join('')}<tr style="background:rgba(255,255,255,.04)"><td><b>Total modal berjalan</b></td><td class="r num"><b>${rp(calc.modal())}</b></td><td></td></tr><tr><td>Proyeksi biaya sisa siklus (${DB.cycle.targetDays-calc.day()} hari)</td><td class="r num">${rp(calc.projectedRemainingCost())}</td><td></td></tr><tr><td>Estimasi omzet panen</td><td class="r num" style="color:var(--soft)">${rp(calc.estRevenue())}</td><td></td></tr><tr style="background:rgba(198,161,91,.1)"><td><b>Estimasi laba</b></td><td class="r num"><b style="color:var(--gold);font-size:16px">${rpAtau(calc.estProfit())}</b></td><td class="r num">ROI ${pctAtau(calc.roi())}</td></tr></tbody></table></div><p style="color:var(--muted);font-size:12px;margin-top:10px">Asumsi: harga jual hidup ${rp(calc.livePrice())}/kg (dari harga produk di Penjualan), bobot panen ~${num(calc.targetBobot(),2)} kg dan target ${DB.cycle.targetDays} hari (diisi di Batch Baru), mortalitas berlanjut pada laju saat ini. Modal berjalan dibaca dari ringkasan siklus di server, bukan dihitung ulang di layar.</p></div>`}
 `;}

function ordersTable(list){return list.length?`<div class="tbl-wrap"><table><thead><tr><th>No. Order</th><th>Tanggal</th><th>Customer</th><th>Produk</th><th class="r">Jumlah</th><th class="r">Berat</th>${can('finance')?'<th class="r">Total</th>':''}<th>Bayar</th><th>Kirim</th><th>Status</th><th>Sumber</th><th></th></tr></thead><tbody>${list.map(o=>{const p=DB.products.find(x=>x.id===o.product);const cu=DB.customers.find(x=>x.id===o.customer);return `<tr><td><b>${o.id}</b></td><td class="num">${fmtDT(o.date)}</td><td>${cu.name}<br><small style="color:var(--dim)">${cu.phone}</small></td><td>${p.name.replace('Bebek Peking ','')}</td><td class="r num">${o.qty} ekor</td><td class="r num">${o.weight?num(o.weight,1)+' kg':'<span style="color:var(--dim)">est. '+num(o.qty*p.avgW,1)+' kg</span>'}</td>${can('finance')?`<td class="r num"><b>${rp(calc.orderTotal(o))}</b></td>`:''}<td>${stBadge(o.pay)}</td><td>${stBadge(o.ship)}</td><td>${stBadge(o.status)}</td><td>${badge(o.source==='WEBSITE'?'gold':'neutral',o.source)}</td><td>${o.status==='NEW'&&(can('inputSales')||can('approve'))?`<button class="btn primary sm" data-act="order-status" data-id="${o.id}" data-s="CONFIRMED">Konfirmasi</button>`:o.status==='CONFIRMED'&&(can('inputSales')||can('approve'))?`<button class="btn sm" data-act="order-status" data-id="${o.id}" data-s="PAID">Tandai dibayar</button>`:o.status==='PAID'&&(can('inputSales')||can('approve'))?`<button class="btn sm" data-act="order-status" data-id="${o.id}" data-s="DELIVERED">Tandai terkirim</button>`:''}</td></tr>`;}).join('')}</tbody></table></div>`:emptyState('Belum ada order','Order dari admin atau website akan tampil di sini.');}
function pgPenjualan(){const tab=state.tab||'order';const paid=DB.orders.filter(o=>o.pay==='PAID');
 return pageHead('Penjualan','Order mengurangi stok secara otomatis saat dikonfirmasi. Order dari website masuk dengan status BARU.',`${can('masterData')?`<button class="btn" data-act="modal" data-m="product">${ic('plus',14)} Tambah Produk</button>`:''}${can('inputSales')||can('approve')?`<button class="btn primary" data-act="modal" data-m="order">${ic('plus',14)} Buat Order</button>`:''}`)+
 `<div class="grid g-kpi" style="margin-bottom:14px">${kpi('Order Bulan Ini',DB.orders.filter(o=>o.date>=D(9,1)).length,'order',`${DB.orders.filter(o=>o.status==='NEW').length} baru dari website`,'','cart')}${can('finance')?kpi('Omzet Dibayar',rp(paid.reduce((s,o)=>s+calc.orderTotal(o),0)),'',`${paid.length} order lunas`,'','money','gold'):''}${kpi('Menunggu Approval',DB.orders.filter(o=>o.status==='PENDING_APPROVAL').length,'order','Owner/Manager','','check')}${(()=>{const t=k=>DB.products.find(p=>p.type===k);const kartu=[['CARCASS','Stok Karkas'],['CUT','Stok Potong'],['LIVE','Stok Hidup']]
 .map(([k,label])=>{const p=t(k);if(!p)return '';const st=calc.productStock(p);
  return kpi(label,num(st),p.unit||'ekor',st<=0?'Habis':st<=p.minOrder*2?'Stok terbatas':'Tersedia',st<=0?'warn':st<=p.minOrder*2?'warn':'','box');}).filter(Boolean);
 return kartu.length?kartu.join(''):kpi('Produk',DB.products.length,'item',DB.products.length?'Lihat tab Produk':'Belum ada produk — tambahkan di tab Produk','warn','box');})()}</div>
 <div class="tabs"><button class="${tab==='order'?'active':''}" data-act="tab" data-v="order">Order</button><button class="${tab==='produk'?'active':''}" data-act="tab" data-v="produk">Produk & Harga</button><button class="${tab==='customer'?'active':''}" data-act="tab" data-v="customer">Customer</button></div>
 ${tab==='order'?`<div class="card"><div class="card-h"><h3>Daftar Order</h3>${seg([['ALL','Semua'],['NEW','Baru'],['PENDING_APPROVAL','Approval'],['DELIVERED','Selesai']],state.filters.os||'ALL','ofilter')}</div>${ordersTable(DB.orders.filter(o=>!state.filters.os||state.filters.os==='ALL'||o.status===state.filters.os).slice().sort((a,b)=>b.date-a.date))}</div>`:
 tab==='produk'?`<div class="grid g-3">${DB.products.map(p=>{const st=calc.stockStatus(p);return `<div class="card"><div class="card-h"><h3>${p.name}</h3>${badge(st.k==='ok'?'ok':st.k==='low'?'warn':st.k==='out'?'danger':'gold',st.t)}</div><p style="color:var(--muted);font-size:13px">${p.desc}</p><div class="kv" style="margin-top:12px">${can('finance')||can('inputSales')?`<span>Harga</span><b class="num">${rp(p.price)}/kg</b>`:''}<span>Bobot rata-rata</span><b class="num">${num(p.avgW,2)} kg</b><span>Stok tersedia</span><b class="num">${num(calc.productStock(p))} ${p.unit}</b><span>Minimum order</span><b class="num">${p.minOrder} ${p.unit}</b><span>Sumber stok</span><b>${p.stockFrom==='population'?(DB.cycle?'Populasi aktif siklus '+DB.cycle.code:'Populasi aktif'):'Inventory '+p.stockFrom}</b></div></div>`;}).join('')}</div>`:
 `<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Customer</th><th>Tipe</th><th>WhatsApp</th><th class="r">Order</th>${can('finance')?'<th class="r">Total belanja</th>':''}</tr></thead><tbody>${DB.customers.map(c=>{const os=DB.orders.filter(o=>o.customer===c.id);return `<tr><td><b>${c.name}</b></td><td>${badge('info',c.type)}</td><td class="num">${c.phone}</td><td class="r num">${os.length}</td>${can('finance')?`<td class="r num">${rp(os.filter(o=>o.pay==='PAID').reduce((s,o)=>s+calc.orderTotal(o),0))}</td>`:''}</tr>`;}).join('')}</tbody></table></div></div>`}`;}

function inventoryCard(){return `<div class="card"><div class="card-h"><h3>Stok Gudang</h3><button class="btn ghost sm" data-act="go" data-page="stok">Detail ${ic('arrow',12)}</button></div><div class="tbl-wrap"><table><thead><tr><th>Item</th><th class="r">Stok</th><th class="r">Min</th><th>Status</th></tr></thead><tbody><tr><td>Pakan</td><td class="r num"><b>${num(calc.feedStockTheory())} kg</b></td><td class="r num">${num(calc.pakaiFarmRata()*MASTER.minStokPakanHari,0)} kg</td><td>${calc.stokKritis()?badge('danger','KRITIS'):badge('ok','AMAN')}</td></tr>${DB.inventory.map(i=>`<tr><td>${i.name}</td><td class="r num"><b>${num(i.qty)} ${i.unit}</b></td><td class="r num">${num(i.min)}</td><td>${i.qty<i.min?badge('warn','DI BAWAH MIN'):badge('ok','AMAN')}</td></tr>`).join('')}</tbody></table></div></div>`;}
function pgStok(){const fd=calc.feedDiff();const tab=state.tab||'stok';
 return pageHead('Stok & Gudang','Pakan, vitamin, obat, sekam, peralatan, dan produk panen. Setiap pergerakan stok tercatat sebagai transaksi.',`<button class="btn" data-act="modal" data-m="opname">${ic('scale',14)} Stock Opname</button>${can('masterData')?`<button class="btn" data-act="modal" data-m="invitem">${ic('plus',14)} Tambah Item</button><button class="btn primary" data-act="modal" data-m="invin">${ic('plus',14)} Barang Masuk</button>`:''}`)+
 `${calc.stokKritis()?`<div class="alert danger" style="margin-bottom:14px">${ic('alert',18)}<div><b>Stok pakan tersisa ${num(calc.feedDaysLeft(),0)} hari</b>Segera ajukan pembelian.</div></div>`:''}
 ${DB.inventory.filter(i=>i.qty<i.min).map(i=>`<div class="alert warn" style="margin-bottom:14px">${ic('alert',18)}<div><b>Stok ${i.name} di bawah minimum</b>${num(i.qty)} ${i.unit} tersisa, minimum ${num(i.min)} ${i.unit}.</div></div>`).join('')}
 <div class="tabs"><button class="${tab==='stok'?'active':''}" data-act="tab" data-v="stok">Stok</button><button class="${tab==='mov'?'active':''}" data-act="tab" data-v="mov">Stock Movement</button><button class="${tab==='opname'?'active':''}" data-act="tab" data-v="opname">Opname & Selisih</button></div>
 ${tab==='stok'?`<div class="grid g-3">${[{name:'Pakan',unit:'kg',cat:'Pakan',qty:calc.feedStockTheory(),min:Math.round(calc.feedAvg7()*MASTER.minStokPakanHari),feed:true},...DB.inventory].map(i=>`<div class="card"><div class="card-h"><div><span class="badge b-neutral">${i.cat.toUpperCase()}</span><h3 style="margin-top:6px">${i.name}</h3></div>${i.qty<i.min?badge('warn','DI BAWAH MIN'):badge('ok','AMAN')}</div><div class="val num" style="font-size:30px;font-weight:800">${num(i.qty)} <small style="font-size:13px;color:var(--muted)">${i.unit}</small></div><div class="bar ${i.qty<i.min?'w':''}" style="margin:10px 0 6px"><i style="width:${Math.min(100,i.qty/(i.min*2.5)*100)}%"></i></div><small style="color:var(--muted)">Minimum ${num(i.min)} ${i.unit}${i.feed?` · cukup ${num(calc.feedDaysLeft(),0)} hari`:''}${fd&&i.feed?` · opname ${num(fd.op.physical)} kg (selisih ${num(fd.diff)} kg)`:''}</small></div>`).join('')}</div>`:
 tab==='mov'?`<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Waktu</th><th>Item</th><th>Jenis</th><th class="r">Qty</th><th>Referensi</th><th>User</th></tr></thead><tbody>${[...DB.invTx.map(t=>({date:t.date,item:DB.inventory.find(i=>i.id===t.item).name,type:t.type,qty:t.qty,ref:t.ref,user:t.user,unit:DB.inventory.find(i=>i.id===t.item).unit})),...DB.feedPurchases.filter(p=>p.status==='APPROVED').map(p=>({date:p.date,item:'Pakan',type:'IN',qty:p.qty,ref:p.ref,user:p.user,unit:'kg'})),...DB.feedRecords.slice(-6).map(r=>({date:r.date,item:'Pakan',type:'OUT',qty:calc.feedVal(r),ref:'Pemakaian '+barnName(r.barn),user:r.user,unit:'kg'}))].sort((a,b)=>b.date-a.date).map(t=>`<tr><td class="num">${fmtDT(t.date)}</td><td>${t.item}</td><td>${badge(t.type==='IN'?'ok':'danger',t.type==='IN'?'MASUK':'KELUAR')}</td><td class="r num" style="color:${t.type==='IN'?'var(--soft)':'#F29390'}">${t.type==='IN'?'+':'−'}${num(t.qty)} ${t.unit}</td><td>${t.ref}</td><td>${userName(t.user)}</td></tr>`).join('')}</tbody></table></div></div>`:
 `<div class="card"><div class="card-h"><h3>Hasil Opname</h3><span class="sub">Selisih ≥ 10 kg otomatis ditandai Perlu Verifikasi</span></div><div class="tbl-wrap"><table><thead><tr><th>Tanggal</th><th>Item</th><th class="r">Teoritis</th><th class="r">Fisik</th><th class="r">Selisih</th><th>User</th><th>Status</th><th></th></tr></thead><tbody>${DB.feedOpname.map(o=>{const t=calc.feedStockAtDate(o.date);const dif=t-o.physical;return `<tr><td class="num">${fmtDT(o.date)}</td><td>Pakan</td><td class="r num">${num(t)} kg</td><td class="r num">${num(o.physical)} kg</td><td class="r num"><b style="color:${Math.abs(dif)>=10?'#F2C46B':'var(--soft)'}">${num(dif)} kg</b></td><td>${userName(o.user)}</td><td>${Math.abs(dif)>=10?stBadge('OPEN'):stBadge('VERIFIED')}</td><td>${Math.abs(dif)>=10&&can('approve')?`<button class="btn sm" data-act="modal" data-m="adjust">Ajukan penyesuaian</button>`:''}</td></tr>`;}).join('')}</tbody></table></div></div>`}`;}

function pgLaporan(){const f=state.filters;const kinds=['Laporan Harian','Laporan Mingguan','Laporan Siklus','Laporan Keuangan','Laporan Pakan','Laporan Mortalitas','Laporan Pertumbuhan','Laporan Penjualan'].filter(k=>can('finance')||!k.includes('Keuangan'));const sel=f.rep||'Laporan Harian';
 const rows=(()=>{if(sel==='Laporan Harian'){const d=f.day||calc.day();const end=new Date(dateOfDay(d).getTime()+86399000);return{cols:['Metrik','Nilai'],rows:[['Tanggal',fmtLong(dateOfDay(d))+' (H'+d+')'],['Populasi akhir hari',num(calc.population(null,end))+' ekor'],['Kematian',calc.mortByDay()[d-1]+' ekor'],['Pakan',calc.feedByDay()[d-1]+' kg'],['Bobot (sampel terakhir)',(calc.weightSeries().filter(w=>w.day<=d).slice(-1)[0]||{avg:0}).avg.toFixed(2)+' kg'],['Stok pakan',num(calc.feedStockAtDate(end))+' kg'],['Input oleh',[...new Set(DB.feedRecords.filter(r=>dayOf(r.date)===d).map(r=>userName(r.user)))].join(', ')||'—']]};}
  if(sel==='Laporan Mortalitas'){const list=DB.mortality.filter(m=>(!f.barn||f.barn==='ALL'||m.barn===f.barn));return{cols:['Tanggal','Kandang','Jumlah','Penyebab','User'],rows:list.map(m=>[fmtDate(m.date),barnName(m.barn),m.qty,m.cause,userName(m.user)])};}
  if(sel==='Laporan Pakan'){const bl=barnsWorking();
   return{cols:['Hari','Tanggal',...bl.map(b=>b.name),'Total','Rata-rata 7 hari'],
    rows:[...Array(calc.day()).keys()].map(i=>i+1).slice(-14).map(d=>{
     const per=bl.map(b=>DB.feedRecords.filter(r=>dayOf(r.date)===d&&r.barn===b.id).reduce((t,r)=>t+calc.feedVal(r),0));
     const tot=per.reduce((x,y)=>x+y,0);const fb=calc.feedByDay();const w=fb.slice(Math.max(0,d-7),d);
     return['H'+d,fmtDate(dateOfDay(d)),...per.map(x=>num(x,1)+' kg'),num(tot,1)+' kg',w.length?num(w.reduce((x,y)=>x+y,0)/w.length,1)+' kg':'—'];})};}
  if(sel==='Laporan Pertumbuhan'){return{cols:['Hari','Tanggal','Kandang','Sampel','Rata-rata','Target','Gap'],rows:DB.weights.filter(w=>!f.barn||f.barn==='ALL'||w.barn===f.barn).map(w=>{const d=dayOf(w.date);const t=calc.target(d);return['H'+d,fmtDate(w.date),barnName(w.barn),w.n,num(w.avg,2)+' kg',num(t,2)+' kg',((w.avg-t)/t*100).toFixed(1)+'%'];})};}
  if(sel==='Laporan Penjualan'){return{cols:['Order','Tanggal','Customer','Produk','Qty','Total','Status'],rows:DB.orders.map(o=>[o.id,fmtDate(o.date),DB.customers.find(c=>c.id===o.customer).name,DB.products.find(p=>p.id===o.product).name,o.qty,can('finance')?rp(calc.orderTotal(o)):'—',o.status])};}
  if(sel==='Laporan Keuangan'){const c=calc.costByCat();return{cols:['Kategori','Nominal','%'],rows:[...Object.entries(c).map(([k,v])=>[k,rp(v),pct(v/calc.modal()*100)]),['TOTAL',rp(calc.modal()),'100%'],['Estimasi omzet',rp(calc.estRevenue()),''],['Estimasi laba',rpAtau(calc.estProfit()),'ROI '+pctAtau(calc.roi())]]};}
  if(sel==='Laporan Mingguan'){return{cols:['Minggu','Populasi akhir','Mati','Pakan','Bobot','FCR'],rows:[1,2,3,4,5].map(w=>{const d=Math.min(calc.day(),w*7);const end=new Date(dateOfDay(d).getTime()+86399000);const mb=calc.mortByDay().slice((w-1)*7,w*7).reduce((a,b)=>a+b,0);const fb=calc.feedByDay().slice((w-1)*7,w*7).reduce((a,b)=>a+b,0);const ws=calc.weightSeries().find(x=>x.day===w*7)||(w===5?calc.weightSeries().slice(-1)[0]:null);const fs=calc.fcrSeries().find(x=>x.day===(ws?ws.day:0));return['Mgg '+w,num(calc.population(null,end)),mb,fb+' kg',ws?num(ws.avg,2)+' kg':'—',fs&&fs.fcr?num(fs.fcr,2):'—'];})};}
  return{cols:['Ringkasan','Nilai'],rows:[['Siklus',DB.cycle.code],['DOD',DB.cycle.dodQty],['Hari berjalan',calc.day()],['Populasi',num(calc.population())],['Mortalitas',pct(calc.mortPct())],['Pakan kumulatif',num(calc.feedTotal())+' kg'],['Bobot rata-rata',num(calc.avgWeight(),2)+' kg'],['FCR',calc.fcr()?num(calc.fcr().fcr,2):'—'],...(can('finance')?[['Modal berjalan',rp(calc.modal())],['Estimasi laba',rpAtau(calc.estProfit())]]:[])]};})();
 return pageHead('Laporan','Laporan dihasilkan dari data transaksi yang sama dengan dashboard. Unduh CSV untuk dibuka di Excel, atau cetak jadi PDF.',`<button class="btn primary" data-act="export" data-what="${sel}" data-fmt="CSV">${ic('dl',14)} Unduh CSV</button><button class="btn" data-act="export" data-what="${sel}" data-fmt="CETAK">${ic('dl',14)} Cetak / PDF</button>`)+
 `<div class="grid" style="grid-template-columns:240px 1fr"><div class="card flat"><div class="nav">${kinds.map(k=>`<button class="${sel===k?'active':''}" data-act="rep" data-v="${k}">${ic('report')}<span>${k}</span></button>`).join('')}</div></div>
 <div class="card"><div class="card-h"><h3>${sel}</h3><div class="row"><div class="f" style="flex-direction:row;align-items:center;gap:6px"><label>Kandang</label><select data-act="repbarn" style="padding:6px 10px">${barnOptions(f.barn||'ALL',true)}</select></div>${sel==='Laporan Harian'?`<div class="f" style="flex-direction:row;align-items:center;gap:6px"><label>Hari</label><select data-act="repday" style="padding:6px 10px">${[...Array(calc.day()).keys()].map(i=>i+1).reverse().map(d=>`<option value="${d}" ${(f.day||calc.day())===d?'selected':''}>H${d} · ${fmtDate(dateOfDay(d))}</option>`).join('')}</select></div>`:''}<div class="f" style="flex-direction:row;align-items:center;gap:6px"><label>Siklus</label><select style="padding:6px 10px"><option>#001</option><option>#000</option></select></div></div></div>
 ${rows.rows.length?`<div class="tbl-wrap"><table><thead><tr>${rows.cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.rows.map(r=>`<tr>${r.map(c=>`<td class="num" style="white-space:normal">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:emptyState('Tidak ada data untuk filter ini','Ubah filter kandang atau tanggal.')}<p style="color:var(--dim);font-size:11px;margin-top:10px">Dibuat ${fmtDT(DEMO_TODAY)} oleh ${state.user.name} · DEMO DATA</p></div></div>`;}

function pgPersetujuan(){if(!can('approve')&&state.user.role!=='ADMIN')return denied();const list=calc.pendingApprovals();const tab=state.tab||'pending';const done=DB.corrections.filter(c=>c.status!=='PENDING');
 return pageHead('Persetujuan','Koreksi data, pembelian, dan penjualan tertentu membutuhkan persetujuan. Data lama tidak pernah dihapus.',`<span class="badge b-danger">${list.length} menunggu</span>`)+
 `<div class="tabs"><button class="${tab==='pending'?'active':''}" data-act="tab" data-v="pending">Menunggu (${list.length})</button><button class="${tab==='riwayat'?'active':''}" data-act="tab" data-v="riwayat">Riwayat Keputusan</button></div>
 ${tab==='pending'?(list.length?`<div class="grid g-2">${list.map(p=>`<div class="card"><div class="card-h"><div class="row">${badge(p.kind==='CORRECTION'?'gold':'info',p.kind==='CORRECTION'?'KOREKSI DATA':p.kind==='ORDER'?'PENJUALAN':p.kind==='PURCHASE'?'PEMBELIAN':'BIAYA')}${stBadge('PENDING')}</div><span class="sub">${fmtDT(p.date)}</span></div><h3 style="font-size:16px">${p.title}</h3><p style="color:var(--muted);margin:4px 0 12px">${p.sub}</p>
  ${p.kind==='CORRECTION'?`<div class="grid" style="grid-template-columns:1fr 1fr;gap:10px"><div class="barn-card"><small style="color:var(--muted)">Data lama</small><div class="num" style="font-size:22px;font-weight:800"><s style="color:var(--dim)">${p.ref.oldVal} kg</s></div><small style="color:var(--dim)">Record ${p.ref.recordId}</small></div><div class="barn-card" style="border-color:rgba(168,208,141,.4)"><small style="color:var(--muted)">Data baru</small><div class="num" style="font-size:22px;font-weight:800;color:var(--soft)">${p.ref.newVal} kg</div><small style="color:var(--dim)">Bukti ${p.ref.photo} ${photoChip(p.ref.photo)}</small></div></div>`:p.kind==='PURCHASE'?`<div class="kv"><span>Vendor</span><b>${p.ref.vendor}</b><span>Harga</span><b class="num">${rp(p.ref.price)}/kg</b><span>No. bukti</span><b>${p.ref.ref}</b><span>Catatan</span><b>${p.ref.note||'—'}</b><span>Nota</span><b>${photoChip('nota')}</b></div>`:p.kind==='ORDER'?`<div class="kv"><span>Produk</span><b>${DB.products.find(x=>x.id===p.ref.product).name}</b><span>Berat</span><b class="num">${num(p.ref.weight,1)} kg</b><span>Harga</span><b class="num">${rp(p.ref.priceKg)}/kg</b><span>Stok saat ini</span><b class="num">${num(calc.productStock(DB.products.find(x=>x.id===p.ref.product)))} ekor</b></div>`:''}
  <div class="row" style="margin-top:14px;justify-content:space-between"><small style="color:var(--muted)">Diajukan oleh <b>${userName(p.by)}</b> (${userRole(p.by)})</small>${can('approve')?`<div class="row"><button class="btn danger" data-act="reject" data-id="${p.id}" data-kind="${p.kind}">${ic('x',14)} Tolak</button><button class="btn ok" data-act="approve" data-id="${p.id}" data-kind="${p.kind}">${ic('check',14)} Setujui</button></div>`:'<span class="badge b-neutral">Hanya Owner/Manager</span>'}</div></div>`).join('')}</div>`:`<div class="card">${emptyState('Semua sudah diproses','Tidak ada permintaan yang menunggu persetujuan.')}</div>`):
 `<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Waktu</th><th>Jenis</th><th>Detail</th><th>Diajukan</th><th>Diputuskan</th><th>Status</th></tr></thead><tbody>${[...done.map(c=>`<tr><td class="num">${fmtDT(c.decidedAt||c.requestedAt)}</td><td>${badge('gold','KOREKSI')}</td><td>${c.recordId}: ${c.oldVal} kg → ${c.newVal} kg · ${c.reason}${c.rejectReason?' · Alasan tolak: '+c.rejectReason:''}</td><td>${userName(c.requestedBy)}</td><td>${userName(c.decidedBy)}</td><td>${stBadge(c.status)}</td></tr>`),...DB.feedPurchases.filter(p=>p.status!=='PENDING').map(p=>`<tr><td class="num">${fmtDT(p.date)}</td><td>${badge('info','PEMBELIAN')}</td><td>Pakan ${num(p.qty)} kg · ${rp(p.qty*p.price)}</td><td>${userName(p.user)}</td><td>${userName('U1')}</td><td>${stBadge(p.status)}</td></tr>`),...DB.orders.filter(o=>o.decidedBy).map(o=>`<tr><td class="num">${fmtDT(o.decidedAt)}</td><td>${badge('info','PENJUALAN')}</td><td>${o.id} · ${o.qty} ekor</td><td>${userName(o.user)}</td><td>${userName(o.decidedBy)}</td><td>${stBadge(o.status==='CANCELLED'?'REJECTED':'APPROVED')}</td></tr>`)].join('')||'<tr><td colspan="6">'+emptyState('Belum ada riwayat','')+'</td></tr>'}</tbody></table></div></div>`}`;}

function pgPengguna(){if(!can('manageUsers'))return denied();
 return pageHead('Pengguna','Kelola akun, role, dan kandang. Password disimpan ter-hash (argon2id) dan tidak pernah bisa ditampilkan kembali.',`${DB.users.some(u=>u.archived)?`<button class="btn ghost" data-act="toggle-archived">${state.showArchived?'Sembunyikan arsip':`Tampilkan arsip (${DB.users.filter(u=>u.archived).length})`}</button>`:''}<button class="btn primary" data-act="modal" data-m="user">${ic('plus',14)} Tambah Pengguna</button>`)+
 `<div class="card"><div class="tbl-wrap"><table><thead><tr><th>Nama</th><th>Role</th><th>Kandang</th><th>Kontak</th><th>Login terakhir</th><th>Status</th><th>Password</th><th></th></tr></thead><tbody>${DB.users.filter(u=>!u.archived||state.showArchived).map(u=>`<tr${u.archived?' style="opacity:.55"':''}><td><div class="row" style="gap:8px"><span class="avatar">${u.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</span><b>${u.name}</b></div></td><td>${badge(u.role==='OWNER'?'gold':u.role==='MANAGER'?'ok':u.role==='ADMIN'?'info':'neutral',ROLES[u.role].label.toUpperCase())}</td><td>${u.barn?barnName(u.barn):'Semua'}</td><td class="num">${u.phone}${u.email?`<div style="color:var(--dim);font-size:11.5px;font-family:var(--font)">${u.email}</div>`:''}</td><td class="num">${u.lastLogin?fmtDT(u.lastLogin):'<span style="color:var(--dim)">belum pernah login</span>'}</td><td>${u.active?badge('ok','AKTIF'):badge('danger','NONAKTIF')}</td><td><span style="color:var(--dim)">••••••••</span> <button class="btn ghost sm" data-act="modal" data-m="password" data-id="${u.id}">${u.id===state.user.id?'Ganti':'Atur'}</button></td><td><div class="row" style="gap:6px;justify-content:flex-end">${u.archived?'<span class="badge b-neutral">DIARSIPKAN</span>':`<button class="btn ghost sm" data-act="modal" data-m="user-edit" data-id="${u.id}">Ubah</button>${u.id!==state.user.id?`<button class="btn sm ${u.active?'danger':'ok'}" data-act="user-toggle" data-id="${u.id}">${u.active?'Nonaktifkan':'Aktifkan'}</button><button class="btn ghost sm" data-act="modal" data-m="user-delete" data-id="${u.id}">Hapus</button>`:'<span class="badge b-neutral">Anda</span>'}`}</div></td></tr>`).join('')}</tbody></table></div></div>
 <div class="card" style="margin-top:14px"><div class="card-h"><h3>Matriks Hak Akses</h3><span class="sub">Divalidasi di backend pada setiap request</span></div><div class="tbl-wrap"><table><thead><tr><th>Kemampuan</th><th>Owner</th><th>Manager</th><th>Admin</th><th>Anak Kandang</th></tr></thead><tbody>${[['Lihat keuangan & laba','✓','—','✓','—'],['Approve koreksi & transaksi','✓','✓ (operasional)','—','—'],['Input pakan / kematian / timbang','✓','✓','—','✓ (kandang sendiri)'],['Input pembelian & penjualan','✓','—','✓','—'],['Master data & konfigurasi','✓','—','✓ (terbatas)','—'],['Kelola pengguna','✓','—','✓','—'],['Lihat audit trail','✓','✓','✓','—'],['Hapus data operasional','— (soft delete + approval)','—','—','—'],['Ubah transaksi terkunci','— (via koreksi)','— (via koreksi)','— (via koreksi)','— (via koreksi)']].map(r=>`<tr>${r.map((c,i)=>`<td ${i?'style="color:'+(c==='—'?'var(--dim)':'var(--soft)')+'"':''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;}

/* ---------- Angka bawaan vs angka milik farm ----------
   Aturan: tidak ada angka dari pihak lain. Yang belum pernah disetel pemilik
   ditandai BAWAAN, dan angka turunannya tidak dihitung. */
const LABEL_ANGKA={pakemPakan:'Pakem jatah pakan',targetMortalitasPct:'Target mortalitas',minStokPakanHari:'Minimum stok pakan',batasMortalitasHarian:'Batas kematian harian',batasPakanPct:'Batas selisih pakan',batasSelisihKg:'Batas selisih opname',ambangApprovalRp:'Nominal butuh persetujuan',jamKerja:'Jam kerja'};
function tandaBawaan(k){return (MASTER.bawaan||[]).includes(k)?' '+badge('gold','BAWAAN'):'';}
function belumDiatur(){const b=(MASTER.bawaan||[]).filter(k=>LABEL_ANGKA[k]);if(!b.length)return `<div class="alert ok" style="margin-bottom:14px">${ic('check',16)}<div><b>Semua angka milik farm ini</b>Tidak ada angka bawaan yang tersisa.</div></div>`;
 return `<div class="alert warn" style="margin-bottom:14px">${ic('alert',16)}<div><b>${b.length} angka masih bawaan sistem</b>${b.map(k=>LABEL_ANGKA[k]).join(', ')}. Angka ini bukan dari data farm Pak \u2014 isi dengan angka sendiri. Selama kurva target bobot belum diisi, aplikasi tidak membandingkan bobot ke target apa pun, supaya tidak menyesatkan.</div></div>`;}

function pgPengaturan(){if(!can('masterData'))return denied();const tab=state.tab||'master';
 return pageHead('Pengaturan','Master data menentukan semua angka turunan di sistem. Perubahan tercatat di audit trail.')+
 `<div class="tabs">${[['master','Master Data'],['anomali','Aturan Anomali'],['kandang','Kandang'],['arch','Arsitektur Data']].map(([k,l])=>`<button class="${tab===k?'active':''}" data-act="tab" data-v="${k}">${l}</button>`).join('')}</div>
 ${tab==='master'?`<div class="grid g-2"><div class="card"><div class="card-h"><h3>Biaya & Target</h3>${badge('gold','OWNER ONLY')}</div><div class="alert info" style="margin-bottom:14px">${ic('duck',16)}<div><b>Target bobot dan hari panen tidak diatur di sini</b>Keduanya diisi per batch, waktu Bapak bikin Batch Baru \u2014 bareng jumlah DOD dan harga dari nota. Bibit, pakan, dan bobot berubah tiap kali masuk DOD, jadi angkanya ikut batch masing-masing, bukan satu angka untuk semua. Yang di bawah ini hanya aturan peringatan tingkat farm yang jarang berubah.</div></div>
  <div class="alert info" style="margin-bottom:14px">${ic('money',16)}<div><b>Harga jual tidak diatur di sini</b>Harga jual melekat pada tiap produk, diatur di Penjualan \u2192 Tambah/Ubah Produk. Satu angka, satu tempat \u2014 website dan form order membaca sumber yang sama. Harga DOD dan harga pakan tidak disetel di sini: keduanya diketik dari nota setiap kali beli DOD atau beli pakan, karena harganya berubah tiap pembelian. Biaya pakan tiap batch dihitung dari harga rata-rata nota yang benar-benar dibayar.</div></div>${belumDiatur()}<form class="form" data-act="save-master">${[['targetMortalitasPct','Target mortalitas maksimum (%)','targetMortalitasPct'],['minStokPakanHari','Minimum stok pakan (hari)','minStokPakanHari'],['jadwalTimbangHari','Timbang sampel tiap berapa hari',''],['batasMortalitasHarian','Batas kematian per hari (ekor)','batasMortalitasHarian'],['batasPakanPct','Batas selisih pakan vs rata-rata 7 hari (%)','batasPakanPct'],['batasSelisihKg','Batas selisih opname pakan (kg)','batasSelisihKg'],['ambangApprovalRp','Nominal butuh persetujuan Owner (Rp)','ambangApprovalRp']].map(([k,l,bk])=>`<div class="f"><label>${l}${tandaBawaan(bk)}</label><input name="${k}" type="number" step="any" min="0" value="${MASTER[k]??''}" ${state.user.role!=='OWNER'?'disabled class="ro"':''}></div>`).join('')}
  <div class="f-row"><div class="f"><label>Jam kerja mulai${tandaBawaan('jamKerja')}</label><input name="jamMulai" type="number" min="0" max="23" value="${(MASTER.jamKerja||[])[0]??''}" ${state.user.role!=='OWNER'?'disabled class="ro"':''}></div><div class="f"><label>Jam kerja selesai</label><input name="jamSelesai" type="number" min="0" max="23" value="${(MASTER.jamKerja||[])[1]??''}" ${state.user.role!=='OWNER'?'disabled class="ro"':''}></div></div>
  ${state.user.role==='OWNER'?'<button class="btn primary" type="submit">Simpan perubahan</button>':'<div class="alert info">Hanya Owner yang dapat mengubah target dan batas.</div>'}</form>
  ${kartuPakem()}</div>
 <div style="display:flex;flex-direction:column;gap:14px"><div class="card"><div class="card-h"><h3>Kontak Website Penjualan</h3>${badge('gold','OWNER ONLY')}</div>
  <div class="alert ${MASTER.kontakWhatsapp?'info':'warn'}" style="margin-bottom:14px">${ic(MASTER.kontakWhatsapp?'wa':'alert',16)}<div><b>${MASTER.kontakWhatsapp?'Dipakai di website penjualan':'Belum diisi'}</b>${MASTER.kontakWhatsapp?'Tombol "Pesan Sekarang" di website mengarah ke nomor ini.':'Selama kosong, website tidak menampilkan nomor apa pun dan tombol WhatsApp tidak muncul \u2014 lebih baik daripada mengarahkan pelanggan ke nomor yang salah.'}</div></div>
  <form class="form" data-act="submit-kontak">
   <div class="f-row"><div class="f"><label>Nomor WhatsApp pemesanan</label><input name="kontakWhatsapp" value="${MASTER.kontakWhatsapp||''}" placeholder="08xxxxxxxxxx"></div><div class="f"><label>Jam layanan</label><input name="kontakJam" value="${MASTER.kontakJam||''}" placeholder="08.00-17.00"></div></div>
   <div class="f"><label>Alamat / lokasi yang ditampilkan</label><input name="kontakAlamat" value="${MASTER.kontakAlamat||''}" placeholder="Sidoarjo, Jawa Timur"></div>
   <div class="f"><label>Email <span style="color:var(--dim);font-weight:400">(kosongkan kalau belum ada)</span></label><input name="kontakEmail" value="${MASTER.kontakEmail||''}" placeholder="halo@contoh.com"></div>
   <button class="btn primary" type="submit">Simpan Kontak</button>
  </form></div>
  <div class="card"><div class="card-h"><h3>Kebijakan Bukti & Keamanan</h3></div><div class="form">${[['Foto bukti wajib untuk input pakan, kematian, timbang',MASTER.fotoWajib],['Lokasi GPS dicatat pada input mobile',true],['Kunci transaksi otomatis setelah 24 jam',true],['Koreksi memerlukan approval Owner/Manager',true],['Rate limit login 5x / 15 menit',true],['Sesi berakhir setelah 12 jam tidak aktif',true]].map(([l,v])=>`<div class="row" style="justify-content:space-between"><span style="font-size:13px">${l}</span>${badge(v?'ok':'neutral',v?'AKTIF':'NONAKTIF')}</div>`).join('')}</div></div>
 <div class="card"><div class="card-h"><h3>Riwayat Perubahan Master Data</h3></div>${DB.audit.filter(a=>a.entity==='MasterData').length?`<div class="timeline">${DB.audit.filter(a=>a.entity==='MasterData').map(a=>`<div class="tl done"><div class="t">${fmtDT(a.date)}</div><div class="b">${a.detail}</div><div class="d">${userName(a.user)}</div></div>`).join('')}</div>`:emptyState('Belum ada perubahan','Perubahan master data akan tercatat di sini dan di audit trail.')}</div></div></div>`:
 tab==='anomali'?`<div class="card"><div class="card-h"><h3>Aturan Deteksi Anomali</h3><span class="sub">Bahasa netral: "Perlu Verifikasi", bukan tuduhan</span></div><div class="tbl-wrap"><table><thead><tr><th>Aturan</th><th>Ambang</th><th>Tingkat</th><th>Status</th></tr></thead><tbody>${[['Konsumsi pakan menyimpang dari rata-rata 7 hari','± '+MASTER.batasPakanPct+'%','WARNING'],['Selisih stok opname vs teoritis','≥ 10 kg','WARNING'],['Kematian harian','≥ '+MASTER.batasMortalitasHarian+' ekor','CRITICAL'],['Bobot tertinggal dari kurva target','< −3%','WARNING'],['FCR naik antar pengukuran','> 5%','WARNING'],['Input berulang per kandang/hari','> 1 input','WARNING'],['Transaksi di luar jam kerja',MASTER.jamKerja[0]+':00–'+MASTER.jamKerja[1]+':00','INFO'],['Perubahan data terlalu sering','> 3 koreksi / user / minggu','WARNING'],['Populasi tidak balance','≠ 0','CRITICAL'],['Stok pakan tersisa','< '+MASTER.minStokPakanHari+' hari','CRITICAL']].map(([r,t,s])=>`<tr><td style="white-space:normal">${r}</td><td class="num">${t}</td><td>${stBadge(s)}</td><td>${badge('ok','AKTIF')}</td></tr>`).join('')}</tbody></table></div></div>`:
 tab==='kandang'?`${state.user.role==='OWNER'?`<div class="row" style="justify-content:flex-end;margin-bottom:14px"><button class="btn primary" data-act="modal" data-m="barn">${ic('plus',14)} Tambah Kandang</button></div>`:''}<div class="grid g-3">${DB.barns.map(b=>{const pop=calc.population(b.id);const off=b.active===false;return `<div class="card"${off?' style="opacity:.6"':''}><div class="card-h"><h3>${b.name}</h3>${off?badge('danger','NONAKTIF'):pop?badge('ok','TERISI'):badge('neutral','KOSONG')}</div><div class="kv"><span>Kode</span><b>${b.id}</b><span>Kapasitas</span><b class="num">${num(b.cap)} ekor</b><span>Populasi</span><b class="num">${num(pop)} ekor</b><span>Target kematian</span><b>${b.targetMati!=null?`${num(b.targetMati,1)}%`:'<span style="color:var(--dim);font-weight:400">ikut target farm</span>'}</b><span>PIC</span><b>${DB.users.filter(u=>u.barn===b.id&&u.active).map(u=>u.name).join(', ')||'—'}</b>${b.note?`<span>Catatan</span><b>${b.note}</b>`:''}</div>${state.user.role==='OWNER'?`<div class="row" style="gap:8px;margin-top:14px"><button class="btn ghost sm" data-act="modal" data-m="barn-edit" data-id="${b.id}">Ubah</button><button class="btn sm ${off?'ok':'danger'}" data-act="barn-toggle" data-id="${b.id}">${off?'Aktifkan':'Nonaktifkan'}</button></div>`:''}</div>`}).join('')}</div>`:
 pgArch()}`;}
function pgArch(){return `<div class="grid g-2"><div class="card"><div class="card-h"><h3>Entity Relationship</h3><span class="sub">Rancangan minimal</span></div><div style="overflow-x:auto;background:var(--warm);border-radius:12px;padding:10px"><pre class="mermaid">erDiagram
  USER ||--o{ AUDIT_LOG : performs
  USER }o--|| ROLE : has
  USER }o--o| BARN : assigned
  FARM ||--o{ BARN : contains
  FARM ||--o{ CYCLE : runs
  CYCLE ||--o{ ANIMAL_POPULATION_TX : ledger
  CYCLE ||--o{ MORTALITY : records
  CYCLE ||--o{ FEED_TRANSACTION : uses
  CYCLE ||--o{ WEIGHT_RECORD : samples
  CYCLE ||--o{ HEALTH_RECORD : treats
  CYCLE ||--o{ EXPENSE : costs
  BARN ||--o{ MORTALITY : in
  BARN ||--o{ FEED_TRANSACTION : in
  BARN ||--o{ WEIGHT_RECORD : in
  FEED ||--o{ FEED_TRANSACTION : item
  FEED ||--|| FEED_STOCK : derived
  PURCHASE ||--o{ FEED_TRANSACTION : IN
  PURCHASE ||--o{ INVENTORY_TRANSACTION : IN
  INVENTORY ||--o{ INVENTORY_TRANSACTION : ledger
  PRODUCT ||--o{ ORDER_ITEM : sold
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ ORDER_ITEM : contains
  ORDER ||--o| SALE : settles
  ORDER_ITEM ||--o{ INVENTORY_TRANSACTION : OUT
  ORDER_ITEM ||--o{ ANIMAL_POPULATION_TX : PENJUALAN
  CORRECTION_REQUEST ||--|| APPROVAL : needs
  PURCHASE ||--o| APPROVAL : needs
  EXPENSE ||--o| APPROVAL : needs
  ATTACHMENT }o--|| USER : uploaded_by
  ANOMALY }o--|| CYCLE : detected_in
  ANOMALY ||--o{ NOTIFICATION : triggers
  APPROVAL ||--o{ NOTIFICATION : triggers</pre></div></div>
 <div style="display:flex;flex-direction:column;gap:14px"><div class="card"><div class="card-h"><h3>Prinsip Integritas Data</h3></div><div class="timeline">${[['Ledger, bukan saldo','Populasi dan stok tidak disimpan sebagai angka yang bisa diedit. Keduanya dihitung dari tabel transaksi (append-only).'],['Immutable event log','AuditLog hanya INSERT. Tidak ada UPDATE/DELETE di level database (revoke privilege).'],['Versi, bukan overwrite','Koreksi membuat versi baru pada record; versi lama tetap ada dengan status SUPERSEDED.'],['Approval sebagai state machine','PENDING → APPROVED/REJECTED. Transisi hanya oleh role yang berhak, dicatat siapa & kapan.'],['Soft delete','Field deleted_at + deleted_by + reason. Data tidak pernah hilang secara fisik.'],['Bukti terkunci','Attachment mendapat hash SHA-256 saat upload; penggantian membuat attachment baru berversi.'],['Validasi server','Semua permission, validasi input, rate limiting dan sesi diperiksa di backend. UI hanya cerminan.']].map(([b,d])=>`<div class="tl done"><div class="b">${b}</div><div class="d">${d}</div></div>`).join('')}</div></div>
 <div class="card"><div class="card-h"><h3>Aksi Audit</h3></div><div class="chips">${['CREATE','UPDATE','DELETE_REQUEST','APPROVE','REJECT','LOGIN','LOGOUT','UPLOAD','CORRECTION','STOCK_ADJUSTMENT','STOCK_OPNAME','APPROVAL'].map(a=>`<span class="chip">${a}</span>`).join('')}</div></div></div></div>`;}

function pgAudit(){const f=state.filters;const list=DB.audit.filter(a=>(!f.au||f.au==='ALL'||a.user===f.au)&&(!f.aa||f.aa==='ALL'||a.action===f.aa)&&(!f.q||a.detail.toLowerCase().includes(f.q.toLowerCase())));
 return pageHead('Audit Trail','Log immutable. Setiap aksi tercatat: siapa, kapan, apa, dan buktinya. Tidak ada tombol hapus.',`<span class="badge b-neutral">${ic('lock',12)} APPEND-ONLY</span><button class="btn" data-act="export" data-what="Audit Log" data-fmt="CSV">${ic('dl',14)} Export CSV</button>`)+
 `<div class="card"><div class="card-h"><div class="row"><select data-act="audit-user" style="padding:6px 10px;background:rgba(255,255,255,.06);border:1px solid var(--line2);border-radius:8px;color:var(--text)"><option value="ALL">Semua user</option>${DB.users.map(u=>`<option value="${u.id}" ${f.au===u.id?'selected':''}>${u.name}</option>`).join('')}<option value="SYSTEM" ${f.au==='SYSTEM'?'selected':''}>Sistem</option></select><select data-act="audit-action" style="padding:6px 10px;background:rgba(255,255,255,.06);border:1px solid var(--line2);border-radius:8px;color:var(--text)"><option value="ALL">Semua aksi</option>${['CREATE','CORRECTION','APPROVE','REJECT','LOGIN','LOGOUT','STOCK_OPNAME','STOCK_ADJUSTMENT','UPDATE','UPLOAD'].map(a=>`<option ${f.aa===a?'selected':''}>${a}</option>`).join('')}</select><div class="search" style="padding:5px 10px"><input placeholder="Cari detail…" value="${esc(f.q||'')}" data-act="audit-q"></div></div><span class="sub">${list.length} entri</span></div>
 ${list.length?`<div class="timeline">${list.slice(0,40).map(a=>`<div class="tl ${a.action==='APPROVE'?'done':a.action==='CORRECTION'||a.action==='REJECT'?'now':'done'}"><div class="t">${fmtDT(a.date)} · ${badge(a.action==='APPROVE'?'ok':a.action==='REJECT'?'danger':a.action==='CORRECTION'?'gold':a.action==='LOGIN'||a.action==='LOGOUT'?'neutral':'info',a.action)} <span class="badge b-neutral">${a.entity}</span></div><div class="b">${a.detail}</div><div class="d">${userName(a.user)}${userRole(a.user)?' · '+ROLES[userRole(a.user)].label:''} · ref <code style="font-size:11px">${a.ref}</code> · hash <code style="font-size:11px;color:var(--dim)">${a.hash||'—'}</code></div></div>`).join('')}</div>`:emptyState('Tidak ada entri','Ubah filter user, aksi, atau kata kunci.')}</div>`;}

function pgAnomali(){const list=calc.anomalies();const open=list.filter(a=>a.state.status==='OPEN');
 return pageHead('Deteksi Anomali','Engine membandingkan setiap input dengan pola historis. Temuan berstatus "Perlu Verifikasi" — bukan tuduhan.',`<span class="badge b-warn">${open.length} perlu verifikasi</span>`)+
 `<div class="grid g-kpi" style="margin-bottom:14px">${kpi('Perlu Verifikasi',open.length,'temuan','Hari ini','warn','alert')}${kpi('Terverifikasi',list.length-open.length,'temuan','Siklus ini','up','check')}${kpi('Aturan Aktif',calc.aturanAnomali().length,'aturan','Semua aturan dijalankan tiap pemuatan','','shield')}${(()=>{const f=calc.catatanBerfoto();return f?kpi('Catatan Pakan Berfoto',pct(f.pct),'',`${num(f.ada)} dari ${num(f.total)} catatan ada foto bukti`,f.pct>=95?'up':'warn','shield','','pakan'):kpi('Catatan Pakan Berfoto','\u2014','','belum ada catatan pakan','','shield');})()}</div>
 ${list.length?`<div class="grid g-2">${list.map(a=>`<div class="card" style="border-color:${a.state.status==='OPEN'?(a.sev==='danger'?'rgba(217,83,79,.4)':a.sev==='warn'?'rgba(217,154,43,.4)':'var(--line)'):'var(--line)'}"><div class="card-h"><div class="row">${stBadge(a.sev==='danger'?'CRITICAL':a.sev==='warn'?'WARNING':'NORMAL')}${stBadge(a.state.status)}</div><span class="sub">${fmtDT(a.date)}</span></div><h3 style="font-size:15px">${a.title}</h3><p style="color:var(--muted);margin:6px 0 10px;font-size:13px">${a.detail}</p><small style="color:var(--dim)">Aturan: ${a.rule}</small>${a.state.note?`<div class="alert ok" style="margin-top:10px">${ic('check',14)}<div><b>Catatan verifikasi</b>${a.state.note} — ${userName(a.state.by)}</div></div>`:''}<div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn sm" data-act="go" data-page="${a.page}">Lihat data</button>${a.state.status==='OPEN'&&can('approve')?`<button class="btn ok sm" data-act="modal" data-m="verify" data-id="${a.id}">Tandai terverifikasi</button>`:''}</div></div>`).join('')}</div>`:`<div class="card">${emptyState('Tidak ada anomali','Semua parameter dalam batas normal.')}</div>`}`;}
