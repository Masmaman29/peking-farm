/* ---------------- KONEKSI KE SERVER ---------------- */
const num_=v=>v===''||v==null?undefined:Number(v);
async function act(type,payload,file){
  if(state.busy)return null;state.busy=true;
  try{
    let res;
    if(file){const f=new FormData();f.append('payload',JSON.stringify(payload));f.append('photo',file);res=await api('/actions/'+type,{method:'POST',body:f});}
    else res=await api('/actions/'+type,{method:'POST',body:JSON.stringify(payload)});
    await loadDB();return res.result||{};
  }catch(e){toast(e.message||'Gagal menyimpan.','err');if(e.status===401){state.user=null;state.view='login';render();}return null;}
  finally{state.busy=false;}
}
const fileOf=form=>{const i=form.querySelector('input[type=file]');return i&&i.files&&i.files[0]?i.files[0]:null;};
const needPhoto=form=>{if(MASTER.fotoWajib&&!fileOf(form)){toast('Foto bukti wajib dilampirkan.','err');const u=form.querySelector('.upload');if(u)u.style.borderColor='var(--danger)';return false;}return true;};

async function login(phone,password){
  state.busy=true;render();
  try{const u=await api('/auth/login',{method:'POST',body:JSON.stringify({phone,password})});state.user=null;await loadDB();state.user=DB.users.find(x=>x.id===u.id)||{id:u.id,name:u.name,role:u.role,barn:null};state.page=u.role==='ANAK_KANDANG'?'ak-home':'dashboard';state.view='app';toast(`Selamat datang, ${u.name}`);}
  catch(e){toast(e.message,'err');}
  finally{state.busy=false;render();}
}
async function logout(){try{await api('/auth/logout',{method:'POST'});}catch{}state.user=null;DB=null;state.view='login';state.aiOpen=false;state.modal=null;state.aiMsgs=[];render();}
async function approve(kind,id){const r=await act('APPROVE',{kind,id});if(r){toast(kind==='CORRECTION'?'Koreksi disetujui — versi baru aktif, data asli tersimpan.':kind==='ORDER'?'Order disetujui, stok berkurang.':kind==='PURCHASE'?'Pembelian disetujui. Stok pakan bertambah.':'Biaya disetujui.');render();}}
async function reject(kind,id,reason){const r=await act('REJECT',{kind,id,reason});if(r){toast('Permintaan ditolak. Alasan dicatat di audit trail.','warn');closeModal();render();}}

/* ---------------- WEBSITE PUBLIK (tanpa login) ---------------- */
const calcOrig={productStock:calc.productStock,population:calc.population,avgWeight:calc.avgWeight,mortPct:calc.mortPct};
async function siteBoot(){
  const [prods,farm]=await Promise.all([api('/public/products'),api('/public/farm')]);
  const harvest=farm.harvestDate?new Date(farm.harvestDate):new Date();
  DB={farm:{name:'AR-FARM',location:'Sidoarjo, Jawa Timur'},cycle:{code:farm.cycle||'-',dodQty:500,targetDays:45,dodDate:new Date(harvest.getTime()-44*86400000)},products:prods.map(p=>({id:p.id,name:p.name,desc:p.desc,unit:'ekor',priceKg:'price',price:p.pricePerKg,minOrder:p.minOrder,stockFrom:p.type==='LIVE'?'population':'inv',avgW:p.avgWeightKg,stock:p.availableStock,pubStatus:p.status})),customers:[],orders:[],users:[]};
  MASTER={price:0};DEMO_TODAY=new Date();
  DB.products.forEach(p=>{MASTER['price_'+p.id]=p.price;p.priceKg='price_'+p.id;});
  calc.productStock=p=>p.stock;calc.population=()=>farm.population||0;calc.avgWeight=()=>farm.avgWeightKg||0;calc.mortPct=()=>farm.mortalityPct||0;
  calc.stockStatus=p=>({k:p.pubStatus==='HABIS'?'out':p.pubStatus==='PRE-ORDER'?'pre':p.pubStatus==='STOK TERBATAS'?'low':'ok',t:p.pubStatus==='PRE-ORDER'?'PRE-ORDER · PANEN '+fmtDate(harvest).toUpperCase():p.pubStatus});
  state.view='site';render();
}
function siteExit(){Object.assign(calc,calcOrig);delete calc.stockStatus;calc.stockStatus=STOCK_STATUS_ORIG;DB=state.user?DB:null;state.view=state.user?'app':'login';if(state.user)loadDB().then(render);else render();}
const STOCK_STATUS_ORIG=calc.stockStatus;

function cycleCalc(){const f=document.getElementById('c-form');if(!f)return;
 const tot=[...f.querySelectorAll('input[name^=barn_]')].reduce((a,i)=>a+(+i.value||0),0);
 const pr=+f.querySelector('[name=price]').value||0;
 const t=document.getElementById('c-total'),c=document.getElementById('c-cost');
 if(t)t.textContent=num(tot)+' ekor';if(c)c.textContent=rp(tot*pr);}
/* ---------------- EVENT: CLICK ---------------- */
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-act]');if(!el)return;const a=el.dataset.act;const d=el.dataset;
 if(a==='modal-close-bg'||a==='ai-close-bg'){if(e.target===el){if(a==='ai-close-bg')state.aiOpen=false;else state.modal=null;renderLayer();}return;}
 if(['search-input','audit-q','audit-user','audit-action','repbarn','repday','order-product','site-product','order-calc','site-calc','calc-avg','photo','order-customer','cycle-calc','prod-src'].includes(a))return;
 switch(a){
  case 'go':go(d.page);break;
  case 'side-open':state.sideOpen=true;render();break;
  case 'side-close':state.sideOpen=false;render();break;
  case 'notif':state.notif=!state.notif;render();break;
  case 'logout':logout();break;
  case 'site':siteBoot();break;
  case 'site-exit':siteExit();break;
  case 'tab':state.tab=d.v;render();break;
  case 'range':state.range=d.v;render();break;
  case 'barn':state.barn=d.v;render();break;
  case 'ofilter':state.filters.os=d.v;render();break;
  case 'rep':state.filters.rep=d.v;render();break;
  case 'modal':openModal(d.m,{type:d.type,id:d.id,product:d.product,kind:d.kind});break;
  case 'modal-close':closeModal();break;
  case 'ai-open':state.aiOpen=true;renderLayer();break;
  case 'ai-close':state.aiOpen=false;renderLayer();break;
  case 'ai-ask':aiAsk(d.q);break;
  case 'approve':approve(d.kind,d.id);break;
  case 'reject':openModal('reject',{id:d.id,kind:d.kind});break;
  case 'order-status':act('ORDER_STATUS',{id:d.id,status:d.s}).then(r=>{if(r){toast(`Order ${d.id} → ${d.s}${d.s==='CONFIRMED'?' · stok berkurang':''}`);render();}});break;
  case 'toggle-archived':state.showArchived=!state.showArchived;render();break;
  case 'barn-toggle':act('BARN_TOGGLE',{code:d.id}).then(r=>{if(r){toast(r.active?'Kandang diaktifkan.':'Kandang dinonaktifkan.');render();}});break;
  case 'user-toggle':act('USER_TOGGLE',{id:d.id}).then(r=>{if(r){toast(r.active?'Pengguna diaktifkan.':'Pengguna dinonaktifkan.');render();}});break;
  case 'export':toast(`${d.what} (${d.fmt||'PDF'}) — export akan tersedia di fase Laporan.`,'warn');break;
  case 'toast':toast(d.msg,d.k||'ok');if(d.close)closeModal();break;
  case 'ak-barn':state.filters.akBarn=d.v;render();break;
  case 'ak-step':{const i=document.getElementById('ak-qty');i.value=Math.max(0,(+i.value||0)+(+d.v));break;}
  case 'choice':{const g=el.dataset.group;document.querySelectorAll('.ch-'+g).forEach(b=>b.classList.toggle('active',b===el));el.closest('.f').querySelector('input[type=hidden]').value=d.v;break;}
  case 'copy':{navigator.clipboard.writeText(d.text).then(()=>toast('Pesan disalin.')).catch(()=>toast('Tidak bisa menyalin otomatis — pilih teks lalu salin manual.','warn'));break;}
 }
});
document.addEventListener('change',e=>{const el=e.target.closest('[data-act]');if(!el)return;const a=el.dataset.act;
 if(a==='photo'){const t=document.getElementById(el.dataset.target);const name=el.files&&el.files[0]?el.files[0].name:'';if(t&&name){t.classList.add('has');t.innerHTML=`${ic('check',20)}<div style="margin-top:6px;font-weight:700">${esc(name)}</div><small>Foto terlampir · ${fmtDT(new Date())}</small>`;}}
 if(a==='audit-user'){state.filters.au=el.value;render();}if(a==='audit-action'){state.filters.aa=el.value;render();}
 if(a==='repbarn'){state.filters.barn=el.value;render();}if(a==='repday'){state.filters.day=+el.value;render();}
 if(a==='order-product'){const p=DB.products.find(x=>x.id===el.value);document.getElementById('o-p').value=MASTER[p.priceKey]||0;orderCalc();}
 if(a==='order-customer'){document.getElementById('newcust').hidden=el.value!=='NEW';}
 if(a==='site-product'){openModal('siteorder',{product:el.value});}
 if(a==='prod-src'){const box=document.getElementById('p-inv');if(box)box.hidden=el.value!=='INVENTORY';}
 if(a==='cycle-calc')cycleCalc();
});
document.addEventListener('input',e=>{const el=e.target;const a=el.dataset.act;
 if(a==='audit-q'){state.filters.q=el.value;const c=document.getElementById('content');const y=c.scrollTop;render();document.getElementById('content').scrollTop=y;const i=document.querySelector('[data-act=audit-q]');i.focus();i.setSelectionRange(i.value.length,i.value.length);}
 if(a==='order-calc')orderCalc();
 if(a==='site-calc'){const f=el.form;const p=DB.products.find(x=>x.id===f.product.value);const q=+f.qty.value||0;document.getElementById('s-w').textContent=num(q*p.avgW,1)+' kg';document.getElementById('s-t').textContent=rp(q*p.avgW*MASTER[p.priceKg]);}
 if(a==='cycle-calc')cycleCalc();
 if(a==='calc-avg'){const n=+document.getElementById('ak-n').value,t=+document.getElementById('ak-total').value;document.getElementById('avg-val').textContent=n&&t?num(t/n,2)+' kg/ekor':'—';}
});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();const s=document.getElementById('global-search');if(s)s.focus();}if(e.key==='Escape'){state.modal=null;state.aiOpen=false;state.notif=false;renderLayer();}
 if(e.key==='Enter'&&e.target.id==='global-search'){e.preventDefault();const q=e.target.value.trim();if(!q)return;const map=[['pakan','pakan'],['populasi','populasi'],['mortal','populasi'],['bobot','pertumbuhan'],['fcr','pakan'],['keuangan','keuangan'],['laba','keuangan'],['order','penjualan'],['penjualan','penjualan'],['stok','stok'],['approval','persetujuan'],['persetujuan','persetujuan'],['audit','audit'],['anomali','anomali'],['laporan','laporan'],['user','pengguna']];const hit=map.find(([k])=>q.toLowerCase().includes(k));if(hit&&canPage(hit[1]))go(hit[1]);else{state.aiOpen=true;renderLayer();aiAsk(q);}}
});
function orderCalc(){const q=+document.getElementById('o-qty').value||0,w=+document.getElementById('o-w').value,p=+document.getElementById('o-p').value||0;const prod=DB.products.find(x=>x.id===document.querySelector('[name=product]').value);const est=w||q*prod.avgW;document.getElementById('o-sub').textContent=rp(est*p)+(w?'':' (estimasi)');const st=calc.productStock(prod)-q;document.getElementById('o-stock').textContent=num(st)+' ekor'+(st<0?' — STOK TIDAK CUKUP':'');}
function aiAsk(q){state.aiMsgs.push({r:'me',t:q});renderLayer();setTimeout(()=>{state.aiMsgs.push({r:'ai',t:aiAnswer(q)});renderLayer();const b=document.getElementById('ai-body');if(b)b.scrollTop=b.scrollHeight;},400);const b=document.getElementById('ai-body');if(b)b.scrollTop=b.scrollHeight;}

/* ---------------- EVENT: SUBMIT → SERVER ---------------- */
document.addEventListener('submit',async e=>{e.preventDefault();const f=e.target;const a=f.dataset.act;const v=fd(f);const u=state.user;const file=fileOf(f);
 const done=(text,again)=>{state.akSuccess={text,date:new Date(),photo:file?file.name:null,again};state.page='ak-success';render();};
 switch(a){
  case 'login':login(v.phone,v.password);break;
  case 'ai-submit':{const q=f.q.value.trim();if(!q)return;f.q.value='';aiAsk(q);break;}
  case 'ak-save-feed':{if(!needPhoto(f))return;const kg=+v.kg;if(!(kg>0)){toast('Isi jumlah kg.','err');return;}const r=await act('FEED_USAGE',{kg,barn:u.barn,feedType:v.jenis&&v.jenis.startsWith('Starter')?'STARTER':v.jenis&&v.jenis.startsWith('Finisher')?'FINISHER':'GROWER'},file);if(r)done(`Pakan ${kg} kg · ${barnName(u.barn)}`,'ak-pakan');break;}
  case 'ak-save-mort':{const q=+v.qty;if(q<=0){toast('Jumlah harus lebih dari 0. Jika tidak ada kematian, tidak perlu input.','warn');return;}if(!needPhoto(f))return;const r=await act('MORTALITY',{qty:q,barn:u.barn,cause:v.cause,note:v.note},file);if(r){state.filters.akQty=0;done(`Kematian ${q} ekor · ${v.cause}${r.warning?' · ⚠ WARNING: di atas batas normal, Manager diberi notifikasi':''}`,'ak-mati');}break;}
  case 'ak-save-weight':{if(!needPhoto(f))return;const n=+v.n,t=+v.total;if(!(n>0&&t>0)){toast('Isi jumlah sampel dan total berat.','err');return;}const r=await act('WEIGHT',{n,total:t,barn:u.barn},file);if(r)done(`${n} ekor · total ${t} kg · rata-rata ${num(r.avg,2)} kg`,'ak-timbang');break;}
  case 'ak-save-cond':{const r=await act('BARN_CONDITION',{barn:u.barn,temp:+v.temp,hum:+v.hum,litter:v.Sekam,water:v.Airminum,behavior:v.Perilakubebek,note:v.note},file);if(r)done(`${v.temp}°C · ${v.hum}% · sekam ${v.Sekam}`,'ak-kondisi');break;}
  case 'ak-save-health':{const r=await act('HEALTH',{barn:u.barn,type:v.type,item:v.item,dose:v.dose,note:v.note},file);if(r)done(`${v.type} · ${v.item}`,'ak-sehat');break;}
  case 'submit-correction':{const nv=+v.newVal;if(!(nv>=0)){toast('Isi data baru.','err');return;}const rec=f.dataset.type==='FEED'?DB.feedRecords.find(r=>r.id===f.dataset.id):null;const r=await act('CORRECTION_REQUEST',{type:f.dataset.type,recordId:f.dataset.id,newVal:nv,reason:v.reason+(v.note?' — '+v.note:'')},file);if(r){closeModal();toast('Koreksi diajukan. Status: Pending Approval.');render();}break;}
  case 'submit-order':{const r=await act('ORDER_CREATE',{customer:v.customer,customerName:v.customerName,customerPhone:v.customerPhone,product:v.product,qty:+v.qty,weight:num_(v.weight)||null,priceKg:+v.priceKg,pickup:v.pickup,pay:v.pay});if(r){closeModal();toast(r.pending?`Order ${r.code} dibuat — menunggu approval.`:`Order ${r.code} dibuat. Stok berkurang.`);state.filters.os='ALL';render();}break;}
  case 'submit-purchase':{if(!needPhoto(f))return;const r=await act('FEED_PURCHASE',{qty:+v.qty,price:+v.price,vendor:v.vendor,ref:v.ref},file);if(r){closeModal();toast(r.pending?'Pembelian dicatat, menunggu approval Owner.':'Pembelian dicatat. Stok pakan bertambah.');render();}break;}
  case 'submit-expense':{if(!needPhoto(f))return;const r=await act('EXPENSE',{cat:v.cat,amount:+v.amount,vendor:v.vendor,ref:v.ref},file);if(r){closeModal();toast(r.pending?'Biaya dicatat, menunggu approval.':'Biaya dicatat.');render();}break;}
  case 'submit-opname':{if(!needPhoto(f))return;const r=await act('OPNAME',{physical:+v.physical,note:v.note},file);if(r){closeModal();toast(Math.abs(r.diff)>=MASTER.batasSelisihKg?`Opname tersimpan. Selisih ${num(r.diff)} kg — PERLU VERIFIKASI.`:'Opname tersimpan, stok sesuai.',Math.abs(r.diff)>=MASTER.batasSelisihKg?'warn':'ok');render();}break;}
  case 'submit-adjust':{const r=await act('STOCK_ADJUST',{qty:+v.qty,reason:v.reason});if(r){closeModal();toast('Penyesuaian disetujui dan dicatat.');render();}break;}
  case 'submit-mort':{if(!needPhoto(f))return;const r=await act('MORTALITY',{qty:+v.qty,barn:v.barn,cause:v.cause},file);if(r){closeModal();toast('Kematian dicatat. Populasi diperbarui lewat transaksi.');render();}break;}
  case 'submit-weigh':{if(!needPhoto(f))return;const r=await act('WEIGHT',{n:+v.n,total:+v.total,barn:v.barn},file);if(r){closeModal();toast(`Timbang dicatat. Rata-rata ${num(r.avg,2)} kg.`);render();}break;}
  case 'submit-health':{const r=await act('HEALTH',{barn:v.barn,type:v.type,item:v.item,dose:v.dose,note:v.note});if(r){closeModal();toast('Tindakan kesehatan dicatat.');render();}break;}
  case 'submit-user':{const r=await act('USER_CREATE',{name:v.name,role:v.role,barn:v.barn||undefined,phone:v.phone,email:v.email||undefined,password:v.password});if(r){closeModal();toast(`Pengguna ${v.name} dibuat. Sampaikan password awalnya langsung ke yang bersangkutan.`);render();}break;}
  case 'submit-user-delete':{const r=await act('USER_DELETE',{id:f.dataset.id});if(r){closeModal();toast(r.removed?`${r.name} dihapus permanen.`:`${r.name} diarsipkan \u2014 riwayatnya tetap tersimpan.`);render();}break;}
  case 'submit-cycle':{const barns=Object.keys(v).filter(k=>k.startsWith('barn_')).map(k=>({code:k.slice(5),qty:+v[k]||0})).filter(x=>x.qty>0);
    if(!barns.length){toast('Isi jumlah DOD minimal di satu kandang.','err');return;}
    const r=await act('CYCLE_CREATE',{dodDate:v.date,dodPrice:+v.price,breed:v.breed,targetDays:+v.days,barns});
    if(r){closeModal();toast(`Siklus ${r.code} dimulai.`);render();}break;}
  case 'submit-product':{const r=await act('PRODUCT_SAVE',{id:f.dataset.id||undefined,name:v.name,type:v.type,description:v.description||undefined,pricePerKg:+v.pricePerKg,minOrder:+v.minOrder,avgWeightKg:+v.avgWeightKg,stockSource:v.stockSource,inventoryId:v.stockSource==='INVENTORY'?v.inventoryId:undefined,published:v.published==='true'});
    if(r){closeModal();toast('Produk disimpan.');render();}break;}
  case 'submit-invitem':{const r=await act('INVENTORY_SAVE',{id:f.dataset.id||undefined,name:v.name,category:v.category,unit:v.unit,minQty:+v.minQty||0});
    if(r){closeModal();toast('Item stok disimpan.');render();}break;}
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
  case 'save-master':{const p={};Object.keys(v).forEach(k=>p[k]=+v[k]);const r=await act('CONFIG_SAVE',p);if(r){toast(r.changed?'Master data disimpan. Semua angka turunan dihitung ulang.':'Tidak ada perubahan.',r.changed?'ok':'warn');render();}break;}
  case 'submit-siteorder':{state.busy=true;try{const r=await api('/public/orders',{method:'POST',body:JSON.stringify({name:v.name,phone:v.phone,product:v.product,qty:+v.qty,pickup:v.pickup,address:v.address,note:v.note})});openModal('sitedone',{order:{id:r.result.code,customerName:v.name,productName:r.result.productName,qty:r.result.qty,pickup:r.result.pickup}});}catch(err){toast(err.message,'err');}finally{state.busy=false;}break;}
 }
});

/* ---------------- BOOT ---------------- */
(async function boot(){
  if(location.hash==='#website'){return siteBoot();}
  try{const me=await api('/auth/me');await loadDB();state.user=DB.users.find(x=>x.id===me.id)||me;state.page=me.role==='ANAK_KANDANG'?'ak-home':'dashboard';state.view='app';}
  catch{
    state.user=null;state.view='login';
    try{const st=await api('/public/setup');if(st.needed)state.view='setup';}catch{}
    if(state.view!=='setup'){try{state.publicStats=await api('/public/farm');}catch{state.publicStats={};}}
  }
  render();
})();
