/* Carte Diem: coda persistente di caricamento prodotti (solo amministratori). */
(function(){
'use strict';
const DB='cd-product-upload-queue-v1', STORE='items';
const listeners=new Set();
let busy=false, enabled=false, api=null, preparing=null;
const openDB=()=>new Promise((resolve,reject)=>{
 const r=indexedDB.open(DB,1);
 r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'});};
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
async function transact(mode,action){
 const db=await openDB();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,mode),os=tx.objectStore(STORE);
  let value,err;
  try{const req=action(os);if(req){req.onsuccess=()=>{value=req.result};req.onerror=()=>{err=req.error};}}catch(e){err=e;tx.abort();}
  tx.oncomplete=()=>{db.close();err?reject(err):resolve(value)};
  tx.onerror=()=>{db.close();reject(tx.error||err)};
  tx.onabort=()=>{db.close();reject(err||tx.error)};
 });
}
const all=async()=>{const rows=await transact('readonly',os=>os.getAll());return rows.sort((a,b)=>a.created-b.created)};
const get=id=>transact('readonly',os=>os.get(id));
const put=item=>transact('readwrite',os=>os.put(item));
const remove=id=>transact('readwrite',os=>os.delete(id));
function changed(){listeners.forEach(fn=>{try{fn()}catch(e){console.warn(e)}});try{new BroadcastChannel('cd-upload-queue').postMessage('changed')}catch(e){}}
function onChange(fn){listeners.add(fn);return ()=>listeners.delete(fn)}
try{const channel=new BroadcastChannel('cd-upload-queue');channel.onmessage=()=>listeners.forEach(fn=>{try{fn()}catch(e){}})}catch(e){}
async function enqueue(row,files){
 if(!enabled)throw new Error('Accesso amministratore richiesto.');
 const id=crypto.randomUUID();
 await put({id,created:Date.now(),status:'pending',progress:0,attempts:0,error:'',row:{...row,id},files});
 changed();run();
 return id;
}
async function retry(id){
 if(!enabled)throw new Error('Accesso amministratore richiesto.');
 const item=await get(id);
 if(!item||!['error','pending'].includes(item.status))return;
 item.status='pending';item.error='';item.progress=0;await put(item);changed();run();
}
async function discard(id){
 if(!enabled)throw new Error('Accesso amministratore richiesto.');
 const item=await get(id);
 if(!item||item.status==='uploading')throw new Error('Impossibile eliminare un articolo durante il caricamento.');
 await remove(id);changed();
}
async function progress(item,pct){
 item.progress=pct;await put(item);changed();
}
async function compress(file){
 const bmp=await createImageBitmap(file,{imageOrientation:'from-image'});
 try{
  const ratio=Math.min(1,2200/Math.max(bmp.width,bmp.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.round(bmp.width*ratio);canvas.height=Math.round(bmp.height*ratio);
  const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bmp,0,0,canvas.width,canvas.height);
  const blob=await new Promise((res,rej)=>canvas.toBlob(b=>b?res(b):rej(Error('Compressione non riuscita')),'image/webp',.82));
  canvas.width=canvas.height=0;return blob;
 }finally{bmp.close?.()}
}
async function uploadOne(item,i){
 const photo=item.files[i];
 if(photo.path)return {path:photo.path,preview:photo.thumbPath||null};
 if(!photo.file)throw new Error('Fotografia '+(i+1)+' mancante.');
 const blob=await compress(photo.file);
 const path='admin/queued/'+item.id+'/'+i+'.webp';
 const {error}=await api.storage.from('product-images').upload(path,blob,{contentType:'image/webp',cacheControl:'31536000',upsert:true});
 if(error)throw error;
 return {path,preview:null};
}
async function work(item){
 item.status='uploading';item.attempts=(item.attempts||0)+1;await progress(item,2);
 const n=item.files.length, paths=[],previews=[];
 for(let i=0;i<n;i++){
  const result=await uploadOne(item,i);
  paths.push(result.path);previews.push(result.preview);
  await progress(item,Math.floor(5+85*(i+1)/Math.max(1,n)));
 }
 const row={...item.row,image_paths:paths,details:{...(item.row.details||{}),preview_paths:previews}};
 // Compatibilita con articoli gia salvati in coda usando il valore UI SEALED.
 if(row.category==='singole'&&String(row.condition_or_grade||'').trim().toUpperCase()==='SEALED')row.condition_or_grade='Sigillata';
 const {error}=await api.from('products').insert(row);
 if(error&&error.code!=='23505')throw error;
 item.files=[];item.status='done';item.progress=100;item.error='';
 await put(item);changed();
 window.dispatchEvent(new CustomEvent('cd-product-uploaded',{detail:{id:item.id}}));
}
async function run(){
 if(busy||!enabled||!api)return;
 busy=true;
 try{
  const {data:{user},error}=await api.auth.getUser();
  if(error||!user)return;
  const {data,error:authError}=await api.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
  if(authError||!data)return;
  const rows=await all();
  for(const item of rows){
   if(!enabled)break;
   if(!['pending','uploading'].includes(item.status))continue;
   try{await work(item);}
   catch(e){item.status='error';item.error=String(e.message||e);await put(item);changed();}
  }
 }catch(e){console.warn('Coda di caricamento:',e)}
 finally{busy=false;}
}
function start(client){api=client;enabled=true;run()}
function stop(){enabled=false}
window.CDProductQueue={all,enqueue,retry,discard,onChange,start,stop,run};
})();
