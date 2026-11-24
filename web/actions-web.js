/* Berapa HARI KALENDER nota mundur, menurut zona waktu FARM — bukan zona waktu
   perangkat yang dipakai. Anak kandang bisa membuka aplikasi dari ponsel yang
   zonanya beda, dan dulu angka ini ikut berbeda.
   Angka ini hanya petunjuk di layar: server yang menentukan, lewat
   fn_hari_mundur() di database. Negatif = tanggal di masa depan. */
function hariKalenderFarm(d){
  const z = (MASTER && MASTER.zonaWaktu) || 'Asia/Jakarta';
  try { return new Intl.DateTimeFormat('en-CA',{timeZone:z,year:'numeric',month:'2-digit',day:'2-digit'}).format(d); }
  catch(_){ return new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10); }
}
function mundurHari(iso){
  if(!iso) return 0;
  const hariIni = hariKalenderFarm(new Date());
  return Math.round((Date.parse(hariIni+'T00:00:00Z') - Date.parse(iso+'T00:00:00Z'))/864e5);
}
const SITE_ONLY = !(location.hostname.startsWith('os.') || ['localhost','127.0.0.1',''].includes(location.hostname));

/* ---------------- KONEKSI KE SERVER ---------------- */
const num_=v=>v===''||v==null?undefined:Number(v);
async function act(type,payload,file){
  if(state.busy)return null;state.busy=true;
  try{
    let res;
    if(file){const f=new FormData();f.append('payload',JSON.stringify(payload));f.append('foto_source',file.pfSource||'galeri');f.append('photo',file);res=await api('/actions/'+type,{method:'POST',body:f});}
    else res=await api('/actions/'+type,{method:'POST',body:JSON.stringify(payload)});
    await loadDB();if(file)hapusFoto();return res.result||{};
  }catch(e){toast(e.message||'Gagal menyimpan.','err');if(e.status===401){state.user=null;state.view='login';render();}return null;}
  finally{state.busy=false;}
}
const fileOf=form=>{
 const w=form.querySelector('[data-foto]');
 if(w){const f=state.foto[w.dataset.foto];if(f&&f.file){f.file.pfSource=f.source;return f.file;}}
 const i=form.querySelector('input[type=file]');return i&&i.files&&i.files[0]?i.files[0]:null;};

/* ---------------- KAMERA DALAM APLIKASI ---------------- */
async function bukaKamera(id){
 if(!id)return;
 state.kamera={id,error:null};renderLayer();
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){state.kamera.error='Browser ini tidak mendukung kamera di dalam aplikasi. Pakai Chrome versi baru.';renderLayer();return;}
 try{
  const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:960}},audio:false});
  if(state.kamera&&state.kamera.id===id){window.__kamStream=s;renderLayer();}
  else s.getTracks().forEach(t=>t.stop());
 }catch(err){
  const nm=(err&&err.name)||'';
  if(!state.kamera)return;
  state.kamera.error=nm==='NotAllowedError'?'Izin kamera ditolak. Buka pengaturan browser, izinkan kamera untuk situs ini, lalu coba lagi.'
   :nm==='NotFoundError'?'Tidak ada kamera di perangkat ini.'
   :nm==='NotReadableError'?'Kamera sedang dipakai aplikasi lain. Tutup dulu aplikasi itu.'
   :'Kamera gagal dibuka ('+(nm||'tidak diketahui')+').';
  renderLayer();
 }}
function tutupKamera(){if(window.__kamStream){window.__kamStream.getTracks().forEach(t=>t.stop());window.__kamStream=null;}state.kamera=null;}
function simpanFoto(id,blob,source){
 if(state.foto[id]&&state.foto[id].url)URL.revokeObjectURL(state.foto[id].url);
 const file=blob instanceof File?blob:new File([blob],'kamera-'+Date.now()+'.jpg',{type:'image/jpeg'});
 state.foto[id]={file,url:URL.createObjectURL(blob),source,jam:new Date().toTimeString().slice(0,5)};}
function jepretFoto(){
 const v=document.getElementById('kam-video');const k=state.kamera;
 if(!v||!k)return;
 if(!v.videoWidth){toast('Kamera belum siap, tunggu sebentar.','warn');return;}
 const w=Math.min(v.videoWidth,1280);const h=Math.round(v.videoHeight*(w/v.videoWidth));
 const cv=document.createElement('canvas');cv.width=w;cv.height=h;
 cv.getContext('2d').drawImage(v,0,0,w,h);
 const id=k.id;
 cv.toBlob(b=>{
  if(!b){toast('Gagal menyimpan foto, coba lagi.','err');return;}
  simpanFoto(id,b,'kamera');tutupKamera();renderJagaIsian();
 },'image/jpeg',0.82);}
function hapusFoto(){Object.keys(state.foto||{}).forEach(k=>{const f=state.foto[k];if(f&&f.url)URL.revokeObjectURL(f.url);});state.foto={};}
const needPhoto=form=>{if(MASTER.fotoWajib&&!fileOf(form)){toast('Foto bukti wajib dilampirkan.','err');const u=form.querySelector('.upload');if(u)u.style.borderColor='var(--danger)';return false;}return true;};

async function login(phone,password){
  state.busy=true;render();
  try{const u=await api('/auth/login',{method:'POST',body:JSON.stringify({phone,password})});state.user=null;state.lastPhone=null;await loadDB();state.user=DB.users.find(x=>x.id===u.id)||{id:u.id,name:u.name,role:u.role,barn:null};state.page=u.role==='ANAK_KANDANG'?'ak-home':'dashboard';state.view='app';toast(`Selamat datang, ${u.name}`);}
  catch(e){state.lastPhone=phone;toast(e.message,'err');}
  finally{state.busy=false;render();}
}
async function logout(){try{await api('/auth/logout',{method:'POST'});}catch{}state.user=null;DB=null;state.view='login';state.aiOpen=false;state.modal=null;state.aiMsgs=[];render();}
async function approve(kind,id){const r=await act('APPROVE',{kind,id});if(r){toast(kind==='CORRECTION'?'Koreksi disetujui — versi baru aktif, data asli tersimpan.':kind==='ORDER'?'Order disetujui, stok berkurang.':kind==='PURCHASE'?'Pembelian disetujui. Stok pakan bertambah.':'Biaya disetujui.');render();}}
async function reject(kind,id,reason){const r=await act('REJECT',{kind,id,reason});if(r){toast('Permintaan ditolak. Alasan dicatat di audit trail.','warn');closeModal();render();}}

/* ---------------- WEBSITE PUBLIK (tanpa login) ---------------- */
const calcOrig={productStock:calc.productStock,population:calc.population,avgWeight:calc.avgWeight,mortPct:calc.mortPct};
async function resetBoot(token){
  state.view='reset';state.reset={status:'loading',token};render();
  try{const r=await api('/public/reset/'+encodeURIComponent(token));
    state.reset=r.valid?{status:'form',token,name:r.name}:{status:'invalid'};}
  catch{state.reset={status:'invalid'};}
  render();
}
async function siteBoot(){
  const [prods,farm]=await Promise.all([api('/public/products'),api('/public/farm')]);
  const harvest=farm.harvestDate?new Date(farm.harvestDate):new Date();
  // Semua dari data asli. Kalau belum ada siklus aktif, DB.cycle dibiarkan null
  // supaya website tidak mengarang jadwal panen.
  DB={farm:{name:farm.name||'AR-FARM',location:farm.location||'',whatsapp:farm.whatsapp||null,email:farm.email||null,jam:farm.jam||null},
      cycle:farm.cycle?{code:farm.cycle,dodQty:farm.dodQty,targetDays:farm.targetDays,dodDate:new Date(farm.dodDate)}:null,
      products:prods.map(p=>({id:p.id,name:p.name,desc:p.desc,unit:'ekor',priceKg:'price',price:p.pricePerKg,minOrder:p.minOrder,stockFrom:p.type==='LIVE'?'population':'inv',avgW:p.avgWeightKg,stock:p.availableStock,pubStatus:p.status})),customers:[],orders:[],users:[]};
  MASTER={price:0};DEMO_TODAY=new Date();
  DB.products.forEach(p=>{MASTER['price_'+p.id]=p.price;p.priceKg='price_'+p.id;});
  calc.productStock=p=>p.stock;calc.population=()=>farm.population||0;calc.avgWeight=()=>farm.avgWeightKg||0;calc.mortPct=()=>farm.mortalityPct||0;
  calc.stockStatus=p=>({k:p.pubStatus==='HABIS'?'out':p.pubStatus==='PRE-ORDER'?'pre':p.pubStatus==='STOK TERBATAS'?'low':'ok',t:p.pubStatus==='PRE-ORDER'?'PRE-ORDER · PANEN '+fmtDate(harvest).toUpperCase():p.pubStatus});
  state.view='site';render();
}
function siteExit(){
 if(SITE_ONLY){location.href='https://os.'+location.hostname.replace(/^www\./,'')+'/';return;}
 return siteExitApp();}
function siteExitApp(){Object.assign(calc,calcOrig);delete calc.stockStatus;calc.stockStatus=STOCK_STATUS_ORIG;DB=state.user?DB:null;state.view=state.user?'app':'login';if(state.user)loadDB().then(render);else render();}
const STOCK_STATUS_ORIG=calc.stockStatus;

function cycleCalc(){const f=document.getElementById('c-form');if(!f)return;
 const qty=+(f.qty?f.qty.value:0)||0, pr=+(f.price?f.price.value:0)||0, hari=+(f.days?f.days.value:45)||45;
 const c=document.getElementById('c-cost'); if(c)c.textContent=qty&&pr?rp(qty*pr):'\u2014';
 const pn=document.getElementById('c-panen');
 if(pn){const d=f.date&&f.date.value?new Date(f.date.value):null;
   pn.textContent=d?fmtLong(new Date(d.getTime()+(hari-1)*86400000)):'\u2014';}}
function moveCalc(){}
/* Pindah layar ke batch lain: muat ulang data khusus batch itu. */
async function gantiBatch(code){
  if(!code||code===state.batch)return;
  state.batch=code;state.loading=true;render();
  try{await loadDB(code);}catch(e){toast(e.message,'err');}
  state.loading=false;render();}
/* ---------------- EVENT: CLICK ---------------- */
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-act]');if(!el)return;const a=el.dataset.act;const d=el.dataset;
 if(a==='modal-close-bg'||a==='ai-close-bg'){if(e.target===el){if(a==='ai-close-bg')state.aiOpen=false;else state.modal=null;renderLayer();}return;}
 if(['search-input','audit-q','audit-user','audit-action','repbarn','repday','order-product','site-product','order-calc','site-calc','calc-avg','photo','order-customer','cycle-calc','prod-src','harvest-calc','harvest-cust','move-calc'].includes(a))return;
 switch(a){
  case 'go':go(d.page);break;
  case 'side-open':state.sideOpen=true;render();break;
  case 'side-close':state.sideOpen=false;render();break;
  case 'notif':state.notif=!state.notif;render();break;
  case 'logout':logout();break;
  case 'site':siteBoot();break;
  case 'site-exit':siteExit();break;
  case 'tab':state.tab=d.v;render();break;
  case 'pilih-batch':gantiBatch(d.v);break;
  case 'range':state.range=d.v;render();break;
  case 'barn':state.barn=d.v;render();break;
  case 'ofilter':state.filters.os=d.v;render();break;
  case 'rep':state.filters.rep=d.v;render();break;
  case 'modal':openModal(d.m,{type:d.type,id:d.id,product:d.product,kind:d.kind});break;
  case 'modal-close':closeModal();break;
  case 'kamera-buka':bukaKamera(d.id);break;
  case 'buka-kandang':(async()=>{state.loading=true;render();try{await loadDB(d.code);state.tab='aktif';}catch(e){toast(pesanGagal(e),'err');}finally{state.loading=false;render();}})();break;
  case 'tb-tambah':{const tb=document.getElementById('tb-body');if(tb){tb.insertAdjacentHTML('beforeend',barisTimbang());hitungPanen();const ins=tb.querySelectorAll('[name=tb_ekor]');ins[ins.length-1].focus();}break;}
  case 'tb-hapus':{const tr=el.closest('tr');const tb=document.getElementById('tb-body');if(tr&&tb&&tb.children.length>1){tr.remove();hitungPanen();}break;}
  case 'inv-unduh':unduhInvoice(d.id);break;
  case 'inv-cetak':cetakInvoice(d.id);break;
  case 'inv-bagi':bagikanInvoice(d.id);break;
  case 'kamera-tutup':tutupKamera();renderJagaIsian();break;
  case 'kamera-jepret':jepretFoto();break;
  case 'ai-open':state.aiOpen=true;renderLayer();break;
  case 'ai-close':state.aiOpen=false;renderLayer();break;
  case 'ai-ask':aiAsk(d.q);break;
  case 'approve':approve(d.kind,d.id);break;
  case 'reject':openModal('reject',{id:d.id,kind:d.kind});break;
  case 'order-status':act('ORDER_STATUS',{id:d.id,status:d.s}).then(r=>{if(r){toast(`Order ${d.id} → ${d.s}${d.s==='CONFIRMED'?' · stok berkurang':''}`);render();}});break;
  case 'reset-cancel':location.href=location.pathname;break;
  case 'muat-ulang':state.gagal={pesan:'Menghubungi server…',sibuk:true};render();boot();break;
  case 'toggle-archived':state.showArchived=!state.showArchived;render();break;
  case 'barn-toggle':act('BARN_TOGGLE',{code:d.id}).then(r=>{if(r){toast(r.active?'Kandang diaktifkan.':'Kandang dinonaktifkan.');render();}});break;
  case 'user-toggle':act('USER_TOGGLE',{id:d.id}).then(r=>{if(r){toast(r.active?'Pengguna diaktifkan.':'Pengguna dinonaktifkan.');render();}});break;
  case 'export':{if(d.fmt==='CETAK'){cetakLaporan(d.what);}else{unduhCSV(d.what);}break;}
  case 'toast':toast(d.msg,d.k||'ok');if(d.close)closeModal();break;
  case 'ak-barn':state.filters.akBarn=d.v;render();break;
  case 'ak-step':{const i=document.getElementById('ak-qty');i.value=Math.max(0,(+i.value||0)+(+d.v));break;}
  case 'choice':{const g=el.dataset.group;document.querySelectorAll('.ch-'+g).forEach(b=>b.classList.toggle('active',b===el));el.closest('.f').querySelector('input[type=hidden]').value=d.v;break;}
  case 'copy':{navigator.clipboard.writeText(d.text).then(()=>toast('Pesan disalin.')).catch(()=>toast('Tidak bisa menyalin otomatis — pilih teks lalu salin manual.','warn'));break;}
 }
});
document.addEventListener('change',e=>{const el=e.target.closest('[data-act]');if(!el)return;const a=el.dataset.act;
 if(a==='photo'){const fl=el.files&&el.files[0];const id=(el.id||'').replace(/^file-/,'');if(fl&&id){simpanFoto(id,fl,'galeri');tutupKamera();renderJagaIsian();}return;}
 if(a==='audit-user'){state.filters.au=el.value;render();}if(a==='audit-action'){state.filters.aa=el.value;render();}
 if(a==='repbarn'){state.filters.barn=el.value;render();}if(a==='repday'){state.filters.day=+el.value;render();}
 if(a==='order-product'){const p=DB.products.find(x=>x.id===el.value);document.getElementById('o-p').value=p.price||0;orderCalc();}
 if(a==='order-customer'){document.getElementById('newcust').hidden=el.value!=='NEW';}
 if(a==='site-product'){openModal('siteorder',{product:el.value});}
 if(a==='prod-src'){const box=document.getElementById('p-inv');if(box)box.hidden=el.value!=='INVENTORY';}
 /* Tanggal nota pembelian diubah: kalau mundur lebih dari batas, isian alasan
    dimunculkan dan diwajibkan. Batasnya ikut konfigurasi, bukan angka tetap. */
 if(a==='pur-tanggal'){const w=document.getElementById('pur-alasan-wrap');
  if(w){const m=mundurHari(el.value),batas=MASTER.batasBackdateHari||7,perlu=m>batas;
   w.hidden=!perlu;
   const inp=w.querySelector('[name=alasanMundur]');if(inp)inp.required=perlu;
   const info=document.getElementById('pur-alasan-info');
   if(info)info.textContent=perlu?`Nota ini mundur ${m} hari (batas ${batas}). Akan masuk sebagai koreksi dan menunggu persetujuan Owner.`:'';}}
 if(a==='cycle-calc')cycleCalc();
 if(a==='harvest-calc')harvestCalc();
 if(a==='harvest-cust'){const box=document.getElementById('pn-new');if(box)box.hidden=el.value!=='NEW';}
});
document.addEventListener('input',e=>{const el=e.target;const a=el.dataset.act;
 if(a==='audit-q'){state.filters.q=el.value;const c=document.getElementById('content');const y=c.scrollTop;render();document.getElementById('content').scrollTop=y;const i=document.querySelector('[data-act=audit-q]');i.focus();i.setSelectionRange(i.value.length,i.value.length);}
 /* Simulasi harga panen: hanya mengubah angka di layar. Tidak disimpan, tidak
    dikirim ke server. Posisi gulir dan fokus dijaga seperti pencarian audit. */
 if(a==='sim-harga'){const i=+el.dataset.i;
  const h=(state.simHarga&&state.simHarga.length===4?state.simHarga.slice():SIM_HARGA_AWAL.slice());
  h[i]=Math.max(0,+el.value||0);state.simHarga=h;
  const c=document.getElementById('content');const y=c?c.scrollTop:0;const pos=el.selectionStart;render();
  const c2=document.getElementById('content');if(c2)c2.scrollTop=y;
  const n=document.querySelector(`[data-act=sim-harga][data-i="${i}"]`);
  if(n){n.focus();try{n.setSelectionRange(pos,pos);}catch(_){}}}
 if(a==='order-calc')orderCalc();
 if(a==='site-calc'){const f=el.form;const p=DB.products.find(x=>x.id===f.product.value);const q=+f.qty.value||0;document.getElementById('s-w').textContent=num(q*p.avgW,1)+' kg';document.getElementById('s-t').textContent=rp(q*p.avgW*p.price);}
 if(a==='cycle-calc')cycleCalc();
 if(a==='harvest-calc')harvestCalc();
 if(a==='calc-avg'){const n=+document.getElementById('ak-n').value,t=+document.getElementById('ak-total').value;document.getElementById('avg-val').textContent=n&&t?num(t/n,2)+' kg/ekor':'—';}
});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();const s=document.getElementById('global-search');if(s)s.focus();}if(e.key==='Escape'){if(state.kamera){tutupKamera();render();return;}state.modal=null;state.aiOpen=false;state.notif=false;renderLayer();}
 if(e.key==='Enter'&&e.target.id==='global-search'){e.preventDefault();const q=e.target.value.trim();if(!q)return;const map=[['pakan','pakan'],['populasi','populasi'],['mortal','populasi'],['bobot','pertumbuhan'],['fcr','pakan'],['keuangan','keuangan'],['laba','keuangan'],['order','penjualan'],['penjualan','penjualan'],['stok','stok'],['approval','persetujuan'],['persetujuan','persetujuan'],['audit','audit'],['anomali','anomali'],['laporan','laporan'],['user','pengguna']];const hit=map.find(([k])=>q.toLowerCase().includes(k));if(hit&&canPage(hit[1]))go(hit[1]);else{state.aiOpen=true;renderLayer();aiAsk(q);}}
});
/* ---------- Unduh laporan ----------
   Isi file diambil dari tabel yang sedang tampil, supaya yang diunduh
   persis sama dengan yang dilihat di layar. Pemisah titik-koma dan koma
   desimal supaya langsung terbaca benar di Excel berbahasa Indonesia. */
function tabelLaporan(){return document.querySelector('#content table')||null;}
const csvSel=v=>'"'+String(v==null?'':v).replace(/\u00a0/g,' ').trim().replace(/"/g,'""')+'"';
/* Audit Trail tampil sebagai timeline, bukan tabel, jadi datanya diambil langsung */
function barisAudit(){
  const h=['Waktu','User','Aksi','Entitas','Keterangan','Referensi','Hash'];
  return [h.map(csvSel).join(';')].concat(DB.audit.slice().reverse().map(a=>
    [fmtDT(a.date),userName(a.user),a.action,a.entity,a.detail,a.ref,a.hash].map(csvSel).join(';')));
}
function unduhCSV(nama){
  let baris;
  if(nama==='Audit Log'){ baris=barisAudit(); }
  else{
    const t=tabelLaporan();
    if(!t){toast('Belum ada data untuk diunduh di laporan ini.','warn');return;}
    // textContent, bukan innerText, supaya huruf tidak ikut dibesarkan oleh gaya tampilan
    baris=[...t.querySelectorAll('tr')].map(r=>[...r.children].map(td=>csvSel(td.textContent)).join(';'));
  }
  if(baris.length<2){toast('Belum ada data untuk diunduh di laporan ini.','warn');return;}
  const judul=`"${nama}"`,
        kop=[judul,`"${(DB.farm&&DB.farm.name)||'AR-FARM'}"`,`"Diunduh ${new Date().toLocaleString('id-ID')} oleh ${state.user.name}"`,''];
  const isi='\ufeff'+kop.concat(baris).join('\r\n');
  const url=URL.createObjectURL(new Blob([isi],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');
  const tgl=new Date().toISOString().slice(0,10);
  a.href=url;a.download=`${nama.replace(/\s+/g,'-').toLowerCase()}-${tgl}.csv`;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
  toast(`${nama} diunduh. Bisa langsung dibuka di Excel.`);
}
function cetakLaporan(nama){
  if(!tabelLaporan()){toast('Belum ada data untuk dicetak di laporan ini.','warn');return;}
  document.body.dataset.cetak=nama+' \u2014 '+((DB.farm&&DB.farm.name)||'AR-FARM')+' \u2014 '+new Date().toLocaleString('id-ID');
  window.print();
}
function harvestCalc(){const f=document.getElementById('pn-form');if(!f)return;
 const q=+f.qty.value||0,w=+f.weightKg.value||0,p=+f.pricePerKg.value||0;
 const a=document.getElementById('pn-avg'),t=document.getElementById('pn-total');
 if(a)a.textContent=q&&w?num(w/q,2)+' kg/ekor':'\u2014';
 if(t)t.textContent=w&&p?rp(w*p):'\u2014';}
function orderCalc(){const q=+document.getElementById('o-qty').value||0,w=+document.getElementById('o-w').value,p=+document.getElementById('o-p').value||0;const prod=DB.products.find(x=>x.id===document.querySelector('[name=product]').value);const est=w||q*prod.avgW;document.getElementById('o-sub').textContent=rp(est*p)+(w?'':' (estimasi)');const st=calc.productStock(prod)-q;document.getElementById('o-stock').textContent=num(st)+' ekor'+(st<0?' — STOK TIDAK CUKUP':'');}
function aiAsk(q){state.aiMsgs.push({r:'me',t:q});renderLayer();setTimeout(()=>{state.aiMsgs.push({r:'ai',t:aiAnswer(q)});renderLayer();const b=document.getElementById('ai-body');if(b)b.scrollTop=b.scrollHeight;},400);const b=document.getElementById('ai-body');if(b)b.scrollTop=b.scrollHeight;}

/* ---------------- EVENT: SUBMIT → SERVER ---------------- */
document.addEventListener('submit',async e=>{e.preventDefault();const f=e.target;const a=f.dataset.act;const v=fd(f);const u=state.user;const file=fileOf(f);
 const done=(text,again)=>{state.akSuccess={text,date:new Date(),photo:file?file.name:null,again};state.page='ak-success';render();};
 switch(a){
  case 'login':login(v.phone,v.password);break;
  case 'ai-submit':{const q=f.q.value.trim();if(!q)return;f.q.value='';aiAsk(q);break;}
  case 'ak-save-feed':{if(!needPhoto(f))return;const kg=+v.kg;if(!(kg>0)){toast('Isi jumlah kg.','err');return;}const r=await act('FEED_USAGE',{kg,barn:u.barn,sesi:v.sesi||undefined,feedType:v.jenis&&v.jenis.startsWith('Starter')?'STARTER':v.jenis&&v.jenis.startsWith('Finisher')?'FINISHER':'GROWER'},file);if(r)done(`Pakan ${kg} kg · ${barnName(u.barn)}`,'ak-pakan');break;}
  case 'ak-save-mort':{const q=+v.qty;if(q<=0){toast('Jumlah harus lebih dari 0. Jika tidak ada kematian, tidak perlu input.','warn');return;}if(!needPhoto(f))return;const r=await act('MORTALITY',{qty:q,barn:u.barn,cause:v.cause,note:v.note},file);if(r){state.filters.akQty=0;done(`Kematian ${q} ekor · ${v.cause}${r.warning?' · ⚠ WARNING: di atas batas normal, Manager diberi notifikasi':''}`,'ak-mati');}break;}
  case 'ak-save-weight':{if(!needPhoto(f))return;const n=+v.n,t=+v.total;if(!(n>0&&t>0)){toast('Isi jumlah sampel dan total berat.','err');return;}const r=await act('WEIGHT',{n,total:t,barn:u.barn},file);if(r)done(`${n} ekor · total ${t} kg · rata-rata ${num(r.avg,2)} kg`,'ak-timbang');break;}
  case 'ak-save-cond':{const r=await act('BARN_CONDITION',{barn:u.barn,temp:+v.temp,hum:+v.hum,litter:v.Sekam,water:v.Airminum,behavior:v.Perilakubebek,note:v.note},file);if(r)done(`${v.temp}°C · ${v.hum}% · sekam ${v.Sekam}`,'ak-kondisi');break;}
  case 'ak-save-health':{const r=await act('HEALTH',{barn:u.barn,type:v.type,item:v.item,dose:v.dose,note:v.note},file);if(r)done(`${v.type} · ${v.item}`,'ak-sehat');break;}
  case 'submit-correction':{const nv=+v.newVal;if(!(nv>=0)){toast('Isi data baru.','err');return;}const rec=f.dataset.type==='FEED'?DB.feedRecords.find(r=>r.id===f.dataset.id):null;const r=await act('CORRECTION_REQUEST',{type:f.dataset.type,recordId:f.dataset.id,newVal:nv,reason:v.reason+(v.note?' — '+v.note:'')},file);if(r){closeModal();toast('Koreksi diajukan. Status: Pending Approval.');render();}break;}
  case 'submit-order':{const r=await act('ORDER_CREATE',{customer:v.customer,customerName:v.customerName,customerPhone:v.customerPhone,product:v.product,qty:+v.qty,weight:num_(v.weight)||null,priceKg:+v.priceKg,pickup:v.pickup,pay:v.pay});if(r){closeModal();toast(r.pending?`Order ${r.code} dibuat — menunggu approval.`:`Order ${r.code} dibuat. Stok berkurang.`);state.filters.os='ALL';render();}break;}
  case 'submit-purchase':{if(!needPhoto(f))return;if(!v.jenis){toast('Pilih jenis pakannya.','err');return;}
    const mundur=mundurHari(v.tanggal),batas=MASTER.batasBackdateHari||7;
    if(mundur<0){toast('Tanggal nota tidak boleh di masa depan.','err');return;}
    if(mundur>batas&&(!v.alasanMundur||v.alasanMundur.trim().length<5)){
      toast(`Nota mundur ${mundur} hari (batas ${batas}). Tulis alasannya dulu.`,'err');return;}
    const r=await act('FEED_PURCHASE',{qty:+v.qty,price:+v.price,vendor:v.vendor,ref:v.ref,feedType:v.jenis,
      tanggal:v.tanggal||undefined,alasanMundur:(v.alasanMundur||'').trim()||undefined},file);if(r){closeModal();toast(mundur>batas?`Nota mundur ${mundur} hari dicatat sebagai koreksi — menunggu persetujuan Owner.`:r.pending?'Pembelian dicatat, menunggu approval Owner.':'Pembelian dicatat. Stok pakan bertambah.');render();}break;}
  case 'submit-expense':{if(!needPhoto(f))return;const r=await act('EXPENSE',{cat:v.cat,amount:+v.amount,vendor:v.vendor,ref:v.ref},file);if(r){closeModal();toast(r.pending?'Biaya dicatat, menunggu approval.':'Biaya dicatat.');render();}break;}
  case 'submit-opname':{if(!needPhoto(f))return;const r=await act('OPNAME',{physical:+v.physical,note:v.note},file);if(r){closeModal();toast(Math.abs(r.diff)>=MASTER.batasSelisihKg?`Opname tersimpan. Selisih ${num(r.diff)} kg — PERLU VERIFIKASI.`:'Opname tersimpan, stok sesuai.',Math.abs(r.diff)>=MASTER.batasSelisihKg?'warn':'ok');render();}break;}
  case 'submit-adjust':{const r=await act('STOCK_ADJUST',{qty:+v.qty,reason:v.reason});if(r){closeModal();toast('Penyesuaian disetujui dan dicatat.');render();}break;}
  case 'submit-pakem':{const j=bacaJatah(v);if(!j){toast('Isi kelima jatah gramnya.','err');return;}const r=await act('CONFIG_SAVE',{pakemPakan:j});if(r){toast('Pakem jatah pakan disimpan. Kebutuhan tiap kandang dihitung ulang.');render();}break;}
  case 'submit-cycle-target':{const bobot=+v.bobot||0,hari=+v.days||0;if(!(bobot>0)||!(hari>0)){toast('Isi target bobot dan hari panen.','err');return;}
   const jt=bacaJatah(v);const lama=DB.cycle.jatah||MASTER.pakemPakan||[];
   const r=await act('CYCLE_TARGET',{code:DB.cycle.code,targetDays:hari,targetBobotMin:bobot,bobotDodKg:(+v.dodGram||0)/1000,...(jt&&jt.some((x,i)=>x!==lama[i])?{jatah:jt}:{})});
   if(r){closeModal();toast(`Target batch ${r.code} diubah: ${num(bobot,2)} kg di hari ke-${hari}.`);render();}break;}
  case 'submit-panen':{const tb=bacaTimbangan();if(!tb.length){toast('Isi minimal satu timbangan: jumlah ekor dan beratnya.','err');return;}
   if(tb.some(t=>!(t.ekor>0)||!(t.kg>0))){toast('Ada baris timbangan yang belum lengkap. Isi ekor dan berat, atau hapus barisnya.','err');return;}
   if(!(+v.harga>0)){toast('Isi harga per kg.','err');return;}if(!needPhoto(f))return;
   const r=await act('HARVEST',{barn:v.barn,timbangan:tb,pricePerKg:+v.harga,customer:'NEW',customerName:v.nama,customerPhone:v.hp||undefined,pay:v.pay},file);
   if(r){state.modal={m:'invoice',opts:{id:r.code}};toast(`Panen dicatat: ${rp(r.total)}. Invoice dibuat.`);render();}break;}
  case 'submit-biaya':{if(!v.cat){toast('Pilih jenis biayanya.','err');return;}if(!(+v.amount>0)){toast('Isi jumlah rupiahnya.','err');return;}
   const r=await act('BIAYA_KANDANG',{barn:v.barn,cat:v.cat,amount:+v.amount,ket:v.ket||undefined},file);
   if(r){closeModal();toast(r.pending?'Biaya dicatat, menunggu persetujuan Owner.':'Biaya dicatat. Laba batch dihitung ulang.');render();}break;}
  case 'submit-cond':{const r=await act('BARN_CONDITION',{barn:v.barn,temp:+v.temp,hum:+v.hum,litter:v.litter,water:v.water,behavior:v.behavior,note:v.note||undefined});if(r){closeModal();toast('Kondisi kandang dicatat.');render();}break;}
  case 'submit-feed-use':{if(!v.jenis){toast('Pilih jenis pakannya.','err');return;}if(!needPhoto(f))return;const r=await act('FEED_USAGE',{kg:+v.kg,barn:v.barn,feedType:v.jenis,sesi:v.sesi},file);if(r){closeModal();toast(`Pakan ${v.sesi==='PAGI'?'pagi':'sore'} ${num(+v.kg,1)} kg dicatat keluar ke ${barnName(v.barn)}.`);render();}break;}
  case 'submit-mort':{if(!needPhoto(f))return;const r=await act('MORTALITY',{qty:+v.qty,barn:v.barn,cause:v.cause},file);if(r){closeModal();toast('Kematian dicatat. Populasi diperbarui lewat transaksi.');render();}break;}
  case 'submit-weigh':{if(!needPhoto(f))return;const r=await act('WEIGHT',{n:+v.n,total:+v.total,barn:v.barn},file);if(r){closeModal();toast(`Timbang dicatat. Rata-rata ${num(r.avg,2)} kg.`);render();}break;}
  case 'submit-health':{const r=await act('HEALTH',{barn:v.barn,type:v.type,item:v.item,dose:v.dose,note:v.note});if(r){closeModal();toast('Tindakan kesehatan dicatat.');render();}break;}
  case 'submit-user':{const r=await act('USER_CREATE',{name:v.name,role:v.role,barn:v.barn||undefined,phone:v.phone,email:v.email||undefined,password:v.password});if(r){closeModal();toast(`Pengguna ${v.name} dibuat. Sampaikan password awalnya langsung ke yang bersangkutan.`);render();}break;}
  case 'submit-user-delete':{const r=await act('USER_DELETE',{id:f.dataset.id});if(r){closeModal();toast(r.removed?`${r.name} dihapus permanen.`:`${r.name} diarsipkan \u2014 riwayatnya tetap tersimpan.`);render();}break;}
  case 'submit-cycle':{const qty=+v.qty||0;
    if(!(qty>0)){toast('Isi jumlah DOD yang masuk.','err');return;}
    if(!v.barn){toast('Pilih kandangnya.','err');return;}
    const bobot=+v.bobot||0;const hari=+v.days||0;
    if(!(bobot>0)){toast('Isi target bobot panen (kg/ekor).','err');return;}
    if(!(hari>0)){toast('Isi target panen (berapa hari).','err');return;}
    const dodGram=+v.dodGram||0;
    const r=await act('CYCLE_CREATE',{dodDate:v.date,dodPrice:+v.price,breed:v.breed,targetDays:hari,targetBobotMin:bobot,barn:v.barn,qty,...(dodGram>0?{bobotDodKg:dodGram/1000}:{}),...(()=>{const j=bacaJatah(v);const pk=MASTER.pakemPakan||[];return j&&j.some((x,i)=>x!==pk[i])?{jatah:j}:{};})()});
    if(r){closeModal();state.batch=r.code;toast(`Batch ${r.code} dimulai — ${num(qty)} ekor di ${barnName(v.barn)}.`);await loadDB();render();}break;}
  case 'submit-batch-move':{
    const r=await act('BATCH_MOVE',{from:v.from,to:v.to,qty:v.qty?+v.qty:undefined,note:v.note||undefined});
    if(r){closeModal();toast(`Batch ${r.code}: ${num(r.qty)} ekor pindah dari ${r.dari} ke ${r.ke}.`);await loadDB();render();}break;}

  case 'submit-kontak':{
    const r=await act('CONFIG_SAVE',{kontakWhatsapp:v.kontakWhatsapp||'',kontakJam:v.kontakJam||'',kontakAlamat:v.kontakAlamat||'',kontakEmail:v.kontakEmail||''});
    if(r){toast(r.changed?'Kontak website disimpan.':'Tidak ada yang berubah.');render();}break;}
  case 'submit-harvest':{if(!needPhoto(f))return;
    const qty=+v.qty,w=+v.weightKg,pk=+v.pricePerKg;
    if(!(qty>0&&w>0&&pk>0)){toast('Jumlah ekor, total kilogram, dan harga per kg harus diisi.','err');return;}
    if(v.customer==='NEW'&&!(v.customerName||'').trim()){toast('Nama pembeli belum diisi.','err');return;}
    const r=await act('HARVEST',{barn:v.barn,qty,weightKg:w,pricePerKg:pk,
      customer:v.customer==='NEW'?undefined:v.customer,
      customerName:v.customer==='NEW'?v.customerName:undefined,
      customerPhone:v.customer==='NEW'?(v.customerPhone||undefined):undefined,
      pay:v.pay,note:v.note||undefined},file);
    if(r){closeModal();toast(`Panen ${r.code} dicatat \u2014 ${num(qty)} ekor, rata-rata ${num(r.avg,2)} kg. Sisa ${num(r.remaining)} ekor.`);render();}break;}
  case 'submit-cycle-close':{const left=calc.population();
    if(left>0&&!v.carryRemaining){toast(`Masih ada ${num(left)} ekor. Panen dulu, atau centang bahwa sisanya dicatat keluar.`,'err');return;}
    const r=await act('CYCLE_CLOSE',{note:v.note||undefined,carryRemaining:!!v.carryRemaining});
    if(r){closeModal();const s=r.summary||{};toast(`Siklus ${r.code} ditutup. ${s.days} hari, panen ${s.harvest_qty||0} ekor, FCR ${s.fcr_final||'\u2014'}.`);render();}break;}
  case 'submit-product':{const r=await act('PRODUCT_SAVE',{id:f.dataset.id||undefined,name:v.name,type:v.type,description:v.description||undefined,pricePerKg:+v.pricePerKg,minOrder:+v.minOrder,avgWeightKg:+v.avgWeightKg,stockSource:v.stockSource,inventoryId:v.stockSource==='INVENTORY'?v.inventoryId:undefined,published:v.published==='true'});
    if(r){closeModal();toast('Produk disimpan.');render();}break;}
  case 'submit-invitem':{const r=await act('INVENTORY_SAVE',{id:f.dataset.id||undefined,name:v.name,category:v.category,unit:v.unit,minQty:+v.minQty||0});
    if(r){closeModal();toast('Item stok disimpan.');render();}break;}
  case 'submit-reset':{if(v.password!==v.confirm){toast('Password dan ulangannya tidak sama.','err');return;}
    state.busy=true;render();
    try{await api('/public/reset/'+encodeURIComponent(state.reset.token),{method:'POST',body:JSON.stringify({password:v.password})});
      state.reset={status:'done'};}
    catch(err){toast(err.message||'Gagal mengganti password.','err');}
    finally{state.busy=false;render();}break;}
  case 'submit-setup':{if(v.password!==v.confirm){toast('Password dan ulangannya tidak sama.','err');return;}state.busy=true;render();
    try{await api('/public/setup',{method:'POST',body:JSON.stringify({farmName:v.farmName,location:v.location,name:v.name,phone:v.phone,email:v.email,password:v.password})});
      toast('Akun Owner dibuat. Silakan masuk.');state.view='login';}
    catch(err){toast(err.message||'Gagal membuat akun.','err');}
    finally{state.busy=false;render();}break;}
  case 'submit-barn':{const r=await act('BARN_CREATE',{code:(v.code||'').toUpperCase(),name:v.name,capacity:+v.capacity,note:v.note||undefined});if(r){closeModal();toast(`${v.name} ditambahkan.`);render();}break;}
  case 'submit-barn-edit':{const r=await act('BARN_UPDATE',{code:f.dataset.id,name:v.name,capacity:+v.capacity,note:v.note||''});if(r){closeModal();toast('Data kandang diperbarui.');render();}break;}
  case 'submit-user-edit':{const r=await act('USER_UPDATE',{id:f.dataset.id,name:v.name,role:v.role,barn:v.barn||undefined,phone:v.phone,email:v.email||''});if(r){closeModal();toast('Data pengguna diperbarui.');render();}break;}
  case 'submit-password':{if(v.password!==v.confirm){toast('Password baru dan ulangannya tidak sama.','err');return;}const r=await act('USER_PASSWORD',{id:f.dataset.id,current:v.current||undefined,password:v.password});if(r){closeModal();toast(r.self?'Password Anda diganti. Perangkat lain diminta login ulang.':'Password pengguna diatur ulang.');render();}break;}
  case 'submit-verify':{const r=await act('ANOMALY_VERIFY',{id:f.dataset.id,note:v.note});if(r){closeModal();toast('Anomali ditandai terverifikasi.');render();}break;}
  case 'submit-reject':reject(f.dataset.kind,f.dataset.id,v.reason);break;
  case 'submit-invin':{if(!needPhoto(f))return;const r=await act('INVENTORY_IN',{item:v.item,qty:+v.qty,ref:v.ref},file);if(r){closeModal();toast('Barang masuk dicatat.');render();}break;}
  case 'save-master':{const p={};Object.keys(v).forEach(k=>{if(String(v[k]).trim()!=='')p[k]=+v[k];});if(!Object.keys(p).length){toast('Tidak ada angka yang diisi.','warn');return;}const r=await act('CONFIG_SAVE',p);if(r){toast(r.changed?'Master data disimpan. Semua angka turunan dihitung ulang.':'Tidak ada perubahan.',r.changed?'ok':'warn');render();}break;}
  case 'submit-siteorder':{state.busy=true;try{const r=await api('/public/orders',{method:'POST',body:JSON.stringify({name:v.name,phone:v.phone,product:v.product,qty:+v.qty,pickup:v.pickup,address:v.address,note:v.note})});openModal('sitedone',{order:{id:r.result.code,customerName:v.name,productName:r.result.productName,qty:r.result.qty,pickup:r.result.pickup}});}catch(err){toast(err.message,'err');}finally{state.busy=false;}break;}
 }
});

/* ---------------- BOOT ---------------- */
async function boot(){
  const mReset=location.hash.match(/^#reset=([A-Za-z0-9-]{8,40})$/);
  if(mReset){return resetBoot(mReset[1]);}
  if(location.hash==='#website' || SITE_ONLY){return siteBoot();}
  state.gagal=null;
  let me=null;
  try{me=await api('/auth/me');}
  catch(e){
    // Hanya 401/403 yang berarti belum login. Koneksi putus atau server mati
    // bukan alasan menampilkan layar masuk — itu ditampilkan sebagai kegagalan.
    if(!(e&&(e.status===401||e.status===403))){state.user=null;state.gagal={pesan:pesanGagal(e)};return render();}
  }
  if(me){
    try{await loadDB();state.user=DB.users.find(x=>x.id===me.id)||me;state.page=me.role==='ANAK_KANDANG'?'ak-home':'dashboard';state.view='app';}
    catch(e){state.user=null;DB=null;state.gagal={pesan:pesanGagal(e)};return render();}
  }else{
    state.user=null;state.view='login';
    try{const st=await api('/public/setup');if(st.needed)state.view='setup';}catch{}
    if(state.view!=='setup'){try{state.publicStats=await api('/public/farm');}catch{state.publicStats={};}}
  }
  render();
}
boot();

/* ---------------- TARIK KE BAWAH UNTUK REFRESH ----------------
   Di posisi paling atas, tarik layar ke bawah: data diambil ulang tanpa
   keluar dari aplikasi. Kalau ada versi aplikasi baru, tampilannya ikut
   dimuat ulang. Dimatikan selama ada form terbuka / isian belum disimpan. */
(function(){
 const BATAS=72;let y0=null,dy=0,jalan=false;
 const ind=document.createElement('div');ind.id='ptr';ind.setAttribute('aria-hidden','true');
 ind.style.cssText='position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 8px);z-index:90;transform:translate(-50%,-70px);padding:8px 14px;border-radius:999px;background:#174A3A;border:1px solid rgba(168,208,141,.4);color:#F2F7F3;font:600 12.5px/1 var(--font);box-shadow:0 8px 24px rgba(0,0,0,.35);pointer-events:none;transition:transform .18s,opacity .18s;opacity:0;white-space:nowrap';
 document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(ind));if(document.body)document.body.appendChild(ind);
 const tampil=(px,teks)=>{ind.textContent=teks;ind.style.opacity=px>0?'1':'0';ind.style.transform=`translate(-50%,${Math.min(px,BATAS+18)-70}px)`;};
 const adaIsian=()=>{for(const el of document.querySelectorAll('#root form input,#root form textarea,#root form select')){
   if(el.type==='hidden'||el.type==='file'||el.disabled||el.id==='global-search')continue;
   if(el.tagName==='SELECT'){if([...el.options].some(o=>o.selected!==o.defaultSelected))return true;}
   else if(el.type==='checkbox'||el.type==='radio'){if(el.checked!==el.defaultChecked)return true;}
   else if(el.value!==el.defaultValue)return true;}return false;};
 const boleh=()=>!jalan&&state.user&&DB&&state.view!=='site'&&!state.modal&&!state.kamera&&!state.aiOpen&&!state.busy&&!state.sideOpen&&!Object.keys(state.foto||{}).length;
 const diAtas=t=>{for(let el=t;el&&el!==document.documentElement;el=el.parentElement){if(el.scrollTop>0)return false;}return (window.scrollY||0)<=0;};
 let versi=null;const ambilVersi=()=>fetch('/versi.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>j&&j.commit?j.commit:null).catch(()=>null);
 ambilVersi().then(v=>versi=v);
 async function segarkan(){jalan=true;tampil(BATAS,'Memuat data terbaru…');
  try{const v=await ambilVersi();
   if(v&&versi&&v!==versi){tampil(BATAS,'Ada versi baru, memuat ulang…');location.reload();return;}
   if(v&&!versi)versi=v;
   await loadDB();render();toast('Data diperbarui.');
  }catch(e){toast(e&&e.status===401?'Sesi habis, silakan login lagi.':'Gagal memuat. Periksa koneksi.','err');if(e&&e.status===401){state.user=null;state.view='login';render();}}
  finally{jalan=false;tampil(0,'');}}
 window.segarkanData=segarkan;
 document.addEventListener('touchstart',e=>{y0=null;dy=0;if(e.touches.length!==1||!boleh()||!diAtas(e.target)||adaIsian())return;y0=e.touches[0].clientY;},{passive:true});
 document.addEventListener('touchmove',e=>{if(y0===null)return;dy=e.touches[0].clientY-y0;if(dy<=0){tampil(0,'');return;}const px=dy*0.55;tampil(px,px>=BATAS?'Lepas untuk refresh':'Tarik untuk refresh');},{passive:true});
 const lepas=()=>{if(y0===null)return;const cukup=dy*0.55>=BATAS;y0=null;dy=0;if(cukup)segarkan();else tampil(0,'');};
 document.addEventListener('touchend',lepas,{passive:true});document.addEventListener('touchcancel',()=>{y0=null;dy=0;if(!jalan)tampil(0,'');},{passive:true});
})();


/* ---------------- ISIAN FORM BERTAHAN SAAT LAYAR DIGAMBAR ULANG ----------------
   Mengambil foto menggambar ulang layar. Tanpa ini, angka yang sudah diketik
   (termasuk baris timbangan panen) hilang setiap kali foto diambil. */
function simpanIsian(){const out=[];document.querySelectorAll('#root form,#layer form').forEach(f=>{const kunci=f.id||f.dataset.act;if(!kunci)return;const nilai={};
  f.querySelectorAll('input,select,textarea').forEach(el=>{if(!el.name||el.type==='file')return;(nilai[el.name]=nilai[el.name]||[]).push(el.type==='checkbox'||el.type==='radio'?el.checked:el.value);});
  out.push({kunci,nilai,baris:f.querySelectorAll('#tb-body tr').length});});return out;}
function pulihkanIsian(snap){(snap||[]).forEach(s=>{const f=document.getElementById(s.kunci)||document.querySelector(`form[data-act="${s.kunci}"]`);if(!f)return;
  const tb=f.querySelector('#tb-body');if(tb&&s.baris){while(tb.children.length<s.baris)tb.insertAdjacentHTML('beforeend',barisTimbang());}
  const hitung={};f.querySelectorAll('input,select,textarea').forEach(el=>{if(!el.name||el.type==='file'||!(el.name in s.nilai))return;const i=hitung[el.name]=(hitung[el.name]||0);hitung[el.name]++;const v=s.nilai[el.name][i];if(v===undefined)return;
   if(el.type==='checkbox'||el.type==='radio')el.checked=v;else el.value=v;});});
 if(document.getElementById('tb-body'))hitungPanen();}
function renderJagaIsian(){const snap=simpanIsian();render();pulihkanIsian(snap);}

/* ---------------- TIMBANGAN PANEN ---------------- */
function bacaTimbangan(){const tb=document.getElementById('tb-body');if(!tb)return [];return [...tb.querySelectorAll('tr')].map(tr=>({ekor:+(tr.querySelector('[name=tb_ekor]').value||0),kg:+(tr.querySelector('[name=tb_kg]').value||0)})).filter(t=>t.ekor||t.kg);}
function hitungPanen(){const tb=document.getElementById('tb-body');if(!tb)return;let ekor=0,kg=0;
 [...tb.querySelectorAll('tr')].forEach((tr,i)=>{tr.querySelector('.tb-no').textContent=i+1;const e=+(tr.querySelector('[name=tb_ekor]').value||0),k=+(tr.querySelector('[name=tb_kg]').value||0);tr.querySelector('.tb-rata').textContent=e>0&&k>0?num(k/e,2)+' kg/ekor':'—';ekor+=e;kg+=k;});
 const set=(id,t)=>{const el=document.getElementById(id);if(el)el.textContent=t;};
 set('tb-ekor',num(ekor)+' ekor');set('tb-kg',num(kg,1)+' kg');set('tb-avg',ekor>0&&kg>0?num(kg/ekor,2)+' kg':'—');
 const h=+((document.querySelector('#pn-form [name=harga]')||{}).value||0);set('tb-uang',h>0&&kg>0?rp(kg*h):'—');}
document.addEventListener('input',e=>{if(e.target.closest&&e.target.closest('#pn-form'))hitungPanen();});

/* ---------------- INVOICE PDF ----------------
   PDF dibuat di perangkat, tanpa pustaka tambahan: A4, huruf Helvetica bawaan PDF. */
const LEBAR_HV=[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
const LEBAR_HB=[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];
function buatPdfInvoice(x){const c=DB.cycle;
 const ascii=t=>String(t==null?'':t).replace(/[–—]/g,'-').replace(/×/g,'x').replace(/·/g,'-').replace(/[^\x20-\x7e]/g,'?');
 const lebar=(t,sz,b)=>{const w=b?LEBAR_HB:LEBAR_HV;let n=0;for(const ch of t){n+=w[ch.charCodeAt(0)-32]||556;}return n*sz/1000;};
 const hal=[[]];let y=56;const kiri=50,kanan=545,BAWAH=780;
 const op=s=>hal[hal.length-1].push(s);
 const teks=(xx,yy,t,sz=10,b=false,rgb='0.12 0.16 0.20')=>{t=ascii(t);op(`BT /${b?'F2':'F1'} ${sz} Tf ${rgb} rg ${xx.toFixed(2)} ${(842-yy).toFixed(2)} Td (${t.replace(/([\\()])/g,'\\$1')}) Tj ET`);};
 const teksKanan=(xr,yy,t,sz=10,b=false,rgb)=>{t=ascii(t);teks(xr-lebar(t,sz,b),yy,t,sz,b,rgb);};
 const garis=(yy,w=0.6,rgb='0.80 0.83 0.86')=>op(`${rgb} RG ${w} w ${kiri} ${(842-yy).toFixed(2)} m ${kanan} ${(842-yy).toFixed(2)} l S`);
 const abu='0.32 0.38 0.43',hijau='0.09 0.29 0.23';
 const kepalaTabel=()=>{teks(kiri,y,'Timbangan ke',9,true,abu);teksKanan(400,y,'Jumlah',9,true,abu);teksKanan(kanan,y,'Berat',9,true,abu);y+=6;garis(y,1,'0.12 0.16 0.20');y+=15;};
 teks(kiri,y,'AR-FARM',22,true,hijau);teksKanan(kanan,y-4,'INVOICE',16,true);y+=15;
 teks(kiri,y,'Modern Duck Farming',10,false,abu);teksKanan(kanan,y,'No. '+x.inv,10,false,abu);y+=14;
 teksKanan(kanan,y,fmtLong(toDate(x.date)),10,false,abu);y+=30;
 teks(kiri,y,'DITUJUKAN KEPADA',8,true,abu);teksKanan(kanan,y,'ASAL',8,true,abu);y+=16;
 teks(kiri,y,x.pembeli,13,true);teksKanan(kanan,y,barnName(x.barn)+' - Batch '+c.code,11,true);y+=14;
 teks(kiri,y,'Pengambil bebek'+(x.hp?' - '+x.hp:''),10,false,abu);teksKanan(kanan,y,c.breed+' hidup',10,false,abu);y+=30;
 kepalaTabel();
 const tb=x.timbangan&&x.timbangan.length?x.timbangan:[{ekor:x.qty,kg:x.kg}];
 tb.forEach((t,i)=>{if(y>BAWAH){hal.push([]);y=60;teks(kiri,y,'Invoice '+x.inv+' (lanjutan)',10,true,abu);y+=22;kepalaTabel();}
  teks(kiri,y,String(i+1),10);teksKanan(400,y,num(t.ekor)+' ekor',10);teksKanan(kanan,y,num(t.kg,1)+' kg',10);y+=6;garis(y);y+=14;});
 if(y>BAWAH-190){hal.push([]);y=60;}
 teks(kiri,y,'Total',11,true);teksKanan(400,y,num(x.qty)+' ekor',11,true);teksKanan(kanan,y,num(x.kg,1)+' kg',11,true);y+=26;
 teks(kiri,y,'Rata-rata per ekor',10,false,abu);teksKanan(kanan,y,num(x.kg/x.qty,2)+' kg',10);y+=6;garis(y);y+=16;
 teks(kiri,y,'Harga per kg',10,false,abu);teksKanan(kanan,y,rp(x.harga),10);y+=6;garis(y);y+=22;
 teks(kiri,y,'Jumlah yang harus dibayar',13,true);teksKanan(kanan,y,rp(x.total),17,true,hijau);y+=22;
 teks(kiri,y,'Status: '+(x.pay==='PAID'?'LUNAS':x.pay==='DP'?'DP':'BELUM DIBAYAR'),10,true,x.pay==='PAID'?hijau:'0.54 0.35 0.00');y+=60;
 teks(kiri+50,y,'Penjual',10,false,abu);teks(kanan-150,y,'Pengambil',10,false,abu);y+=52;
 op(`0.12 0.16 0.20 RG 0.6 w ${kiri} ${842-y} m ${kiri+180} ${842-y} l S`);op(`0.12 0.16 0.20 RG 0.6 w ${kanan-180} ${842-y} m ${kanan} ${842-y} l S`);y+=14;
 teks(kiri+62,y,'AR-FARM',10,true);teks(kanan-180+Math.max(0,(180-lebar(ascii(x.pembeli),10,true))/2),y,x.pembeli,10,true);y+=30;
 teks(kiri,y,'Dicatat oleh '+(x.oleh||'-')+' - '+fmtDT(toDate(x.date))+' - '+x.code+' - dibuat dari aplikasi AR-FARM',8,false,abu);
 /* susun berkas PDF */
 const obj=[];const n=hal.length;const idHal=i=>5+i*2,idIsi=i=>6+i*2;
 obj[1]='<< /Type /Catalog /Pages 2 0 R >>';
 obj[2]=`<< /Type /Pages /Kids [${hal.map((_,i)=>idHal(i)+' 0 R').join(' ')}] /Count ${n} >>`;
 obj[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
 obj[4]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
 hal.forEach((h,i)=>{const isi=h.join('\n');obj[idHal(i)]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${idIsi(i)} 0 R >>`;obj[idIsi(i)]=`<< /Length ${isi.length} >>\nstream\n${isi}\nendstream`;});
 let pdf='%PDF-1.4\n';const off=[];for(let i=1;i<obj.length;i++){off[i]=pdf.length;pdf+=`${i} 0 obj\n${obj[i]}\nendobj\n`;}
 const xref=pdf.length;pdf+=`xref\n0 ${obj.length}\n0000000000 65535 f \n`;for(let i=1;i<obj.length;i++)pdf+=String(off[i]).padStart(10,'0')+' 00000 n \n';
 pdf+=`trailer\n<< /Size ${obj.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
 const byte=new Uint8Array(pdf.length);for(let i=0;i<pdf.length;i++)byte[i]=pdf.charCodeAt(i)&255;
 return new Blob([byte],{type:'application/pdf'});}
function berkasInvoice(code){const x=(DB.panen||[]).find(y=>y.code===code);if(!x){toast('Invoice tidak ditemukan.','err');return null;}
 const nama=`Invoice-${x.inv}-${String(x.pembeli).replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'')||'pembeli'}.pdf`;const blob=buatPdfInvoice(x);
 return {x,nama,blob,file:new File([blob],nama,{type:'application/pdf'})};}
function unduhInvoice(code){const b=berkasInvoice(code);if(!b)return;const url=URL.createObjectURL(b.blob);const a=document.createElement('a');a.href=url;a.download=b.nama;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);toast('PDF invoice diunduh: '+b.nama);}
function cetakInvoice(code){const b=berkasInvoice(code);if(!b)return;const url=URL.createObjectURL(b.blob);const w=window.open(url,'_blank');if(!w){unduhInvoice(code);toast('Jendela cetak diblokir. PDF diunduh, cetak dari berkas itu.','warn');}setTimeout(()=>URL.revokeObjectURL(url),120000);}
async function bagikanInvoice(code){const b=berkasInvoice(code);if(!b)return;
 try{if(navigator.canShare&&navigator.canShare({files:[b.file]})){await navigator.share({files:[b.file],title:'Invoice '+b.x.inv,text:`Invoice ${b.x.inv} AR-FARM - ${rp(b.x.total)}`});return;}}
 catch(e){if(e&&e.name==='AbortError')return;}
 unduhInvoice(code);toast('Perangkat ini tidak bisa membagikan berkas langsung. PDF diunduh, kirim dari WhatsApp.','warn');}
