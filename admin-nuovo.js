(function(){
'use strict';
const $=id=>document.getElementById(id);
const view=$('adminView'),modal=$('adminModal'),form=$('adminForm');
const gate=$('authGate'),root=$('adminRoot'),status=$('saveMessage');
let products=[],featured=[],wishlist=[],orders={},activeUser=null;
let formMode='',editing=null,photos=[],currentDoc=null,listenObserver=null;
const groups={pokemon:'TCG Pokémon',tcg:'Altri TCG',videogiochi:'Consoles e Videogames',accessori:'Accessori',collezione:'Oggetti da Collezione'};
const choices={pokemon:[['singole','Carte raw'],['gradate','Carte gradate'],['sealed','Prodotti sigillati']],tcg:[['singole','Carte raw'],['gradate','Carte gradate'],['sealed','Prodotti sigillati']],videogiochi:[['console','Consoles'],['videogiochi','Videogames']],accessori:[['accessori','Accessori']],collezione:[['collezione','Oggetti da Collezione']]};
const platforms=['Game Boy','Game Boy Color','Game Boy Advance','Nintendo DS','Nintendo 3DS','Wii','Wii U','Switch','Switch 2','PS1','PS2','PS3','PS4','PS5','PSP','PS Vita','Xbox','Xbox 360','Xbox One','Xbox Series X/S','Mega Drive','Saturn','Dreamcast','Altro','Non specificata'];
const sealed=['Box','ETB','Bundle','Tin','Collezioni','Bustine','UPC','Altro'];
const accessories=['Binder','Sleeve e bustine protettive','Toploader e protezioni rigide','Espositori','Box portacarte','Altro'];
const collectibles=['Funko Pop','Figure e Statue','Gadget','Altro'];
const graders=['PSA','BGS','CGC','GRAAD','TAG','ACE','Altre','Non specificata'];
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));}
function notify(t,error=false){status.textContent=t;status.classList.toggle('admin-toast-error',error);$('adminModalMessage').textContent=t;}
function ensure(ok,message){if(!ok)throw new Error(message);}
async function checkLogin(){
 try{
  const {data:{user},error}=await sb.auth.getUser();
  if(error||!user){showLogin();return;}
  const {data,error:e}=await sb.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
  if(e||!data){showLogin('Questo account non dispone dei permessi amministrativi.');return;}
  activeUser=user;gate.hidden=true;root.hidden=false;
  if(view.src==='about:blank')view.src='index.html';
  await refreshLists();
 }catch(e){showLogin(e.message);}
}
function showLogin(message=''){root.hidden=true;gate.hidden=false;$('authMessage').textContent=message;}
$('loginForm').addEventListener('submit',async e=>{
 e.preventDefault();$('authMessage').textContent='Accesso in corso…';
 const {error}=await sb.auth.signInWithPassword({email:$('loginEmail').value.trim(),password:$('loginPassword').value});
 if(error){showLogin(error.message);return;}
 await checkLogin();
});
$('recoverPassword').onclick=async()=>{
 const email=$('loginEmail').value.trim();
 if(!email){showLogin('Inserisci prima la tua email.');return;}
 const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.href});
 showLogin(error?error.message:'Email di recupero inviata, se l’indirizzo è registrato.');
};
$('adminLogout').onclick=async()=>{await sb.auth.signOut();activeUser=null;view.src='about:blank';showLogin();location.href='index.html';};
async function refreshLists(){
 const [pr,fr,wr]=await Promise.all([
   loadProducts(),loadFeaturedProducts(),
   sb.from('mancolista').select('id,nome,espansione,immagine_url,posizione').order('posizione',{ascending:true}).order('created_at',{ascending:true})
 ]);
 products=pr;featured=fr;ensure(!wr.error,wr.error?.message||'Mancolista non disponibile');wishlist=wr.data||[];
}
function adminStyle(doc){
 const style=doc.createElement('style');style.id='cd-admin-overlay';
 style.textContent='.cd-admin-title-btn{display:inline-grid;place-items:center;vertical-align:middle;margin-left:8px;width:36px;height:36px;border:1px solid #d5b36a;border-radius:8px;color:#d5b36a;background:#11131be8;font-size:22px;cursor:pointer}.cd-admin-title-btn[aria-pressed="true"]{color:#101010;background:#f5c968}.cd-admin-new{cursor:pointer;border:1px dashed #d5b36a!important}.cd-admin-new .photo{display:grid!important;place-items:center!important;color:#d5b36a;font-size:58px;background:#101115!important}.cd-admin-new h3{text-align:center!important}.cd-admin-new .quick-add{font-size:21px!important}.cd-admin-edit{display:block;width:100%;margin-top:6px;border:1px solid #d5b36a;background:#1b1921;color:#efd096;border-radius:5px;min-height:34px;cursor:pointer;font-size:11px;font-weight:700}.cd-admin-star{position:absolute;right:6px;bottom:6px;z-index:4;display:grid;place-items:center;border:1px solid #d8b56e;background:#131418e8;color:#d2cbbd;border-radius:50%;width:34px;height:34px;font-size:24px;cursor:pointer;line-height:1}.cd-admin-star.is-featured{color:#ffc845}.cd-admin-wish-edit{position:absolute;right:6px;bottom:6px;z-index:5;border:1px solid #d5b36a;color:#ffd885;background:#131418e9;border-radius:7px;width:34px;height:34px;cursor:pointer}.cd-admin-grab{touch-action:none!important;user-select:none!important;-webkit-user-select:none!important;cursor:grab!important}.cd-admin-grab.cd-dragging{opacity:.56;outline:2px dashed #ffdb8a}.cd-admin-active{outline:1px dashed #dfbb75;outline-offset:3px}.cd-admin-title-btn:focus-visible,.cd-admin-star:focus-visible,.cd-admin-edit:focus-visible{outline:2px solid white;outline-offset:2px}';
 style.textContent += '#catalogGrid .cd-admin-new .photo{display:grid!important;place-items:center!important}';
 doc.head.appendChild(style);
}
function iconButton(doc,title,icon,fn){
 const b=doc.createElement('button');b.type='button';b.className='cd-admin-title-btn';
 b.title=title;b.setAttribute('aria-label',title);b.textContent=icon;
 b.onclick=e=>{e.preventDefault();e.stopPropagation();fn(b)};
 return b;
}
function getGroup(doc){
 const p=new URLSearchParams(doc.location.search);return p.get('catalogo')||'';
}
function getSubcategory(doc){
 const p=new URLSearchParams(doc.location.search);return p.get('sottocategoria')||'';
}
function pickId(url,key){
 try{return new URL(url,location.href).searchParams.get(key)||'';}catch{return '';}
}
function itemCardId(el){return pickId(el.getAttribute('href')||'','catalogo');}
function subCardId(el){return pickId(el.getAttribute('href')||'','sottocategoria');}
function highlight(btn,on){btn.setAttribute('aria-pressed',String(on));}
function wireSort(doc,button,container,selector,idOf,saveFn){
 let enabled=false;
 button.onclick=e=>{
  e.preventDefault();e.stopPropagation();
  enabled=!enabled;highlight(button,enabled);
  for(const card of container.querySelectorAll(selector)){card.classList.toggle('cd-admin-grab',enabled);card.classList.toggle('cd-admin-active',enabled);}
 };
 let held=null,timer=null,dragging=false,startX=0,startY=0;
 const clear=()=>{clearTimeout(timer);timer=null;};
 container.addEventListener('pointerdown',e=>{
  if(!enabled||e.button>0||e.target.closest('button'))return;
  const card=e.target.closest(selector);
  if(!card||!container.contains(card))return;
  held=card;startX=e.clientX;startY=e.clientY;dragging=false;
  clear();
  timer=setTimeout(()=>{
   if(!held)return;dragging=true;held.classList.add('cd-dragging');
   try{held.setPointerCapture(e.pointerId)}catch{}
  },360);
 },true);
 container.addEventListener('pointermove',e=>{
  if(!held)return;
  if(!dragging){
   if(Math.hypot(e.clientX-startX,e.clientY-startY)>11){clear();held=null;}
   return;
  }
  e.preventDefault();
  const under=doc.elementFromPoint(e.clientX,e.clientY)?.closest(selector);
  if(!under||under===held||!container.contains(under))return;
  const rect=under.getBoundingClientRect();
  const before=e.clientX<rect.left+rect.width/2;
  container.insertBefore(held,before?under:under.nextSibling);
 },{passive:false,capture:true});
 const end=async(e)=>{
  clear();if(!held)return;
  const moved=dragging;
  held.classList.remove('cd-dragging');held=null;dragging=false;
  if(!moved)return;
  e.preventDefault();e.stopPropagation();
  try{await saveFn([...container.querySelectorAll(selector)].map(idOf));notify('Nuovo ordine salvato.');}
  catch(err){notify('Riordino non salvato: '+err.message,true);}
 };
 container.addEventListener('pointerup',end,true);
 container.addEventListener('pointercancel',()=>{clear();held?.classList.remove('cd-dragging');held=null;dragging=false;},true);
 container.addEventListener('click',e=>{if(enabled&&e.target.closest(selector)){e.preventDefault();e.stopPropagation();}},true);
 return ()=>enabled;
}
async function saveOrder(key,items){
 ensure(items.every(Boolean),'Ordine incompleto');
 const {error}=await sb.from('catalog_ui_orders').upsert({id:key,items},{onConflict:'id'});
 if(error)throw error;
 orders[key]=items;
}
async function saveNumberOrder(table,keyField,list){
 for(let i=0;i<list.length;i++){
  const field=table==='featured_products'?'display_order':'posizione';
  const {error}=await sb.from(table).update({[field]:i+1}).eq(keyField,list[i]);
  if(error)throw error;
 }
 await refreshLists();
}
function homeTools(doc){
 const categorySection=doc.querySelector('#categorie'),catTitle=categorySection?.querySelector('h2');
 const catGrid=categorySection?.querySelector('.grid');
 if(catTitle&&catGrid&&!catTitle.querySelector('.cd-admin-title-btn')){
  const btn=iconButton(doc,'Riordina categorie','⇅',()=>{});catTitle.append(btn);
  wireSort(doc,btn,catGrid,'a.category',itemCardId,ids=>saveOrder('main',ids));
 }
 const featuredTitle=doc.getElementById('cd-featured-title'),featuredTrack=doc.getElementById('cd-featured-track');
 if(featuredTitle&&featuredTrack&&!featuredTitle.querySelector('.cd-admin-title-btn')){
  const btn=iconButton(doc,'Riordina prodotti in evidenza','⇅',()=>{});featuredTitle.append(btn);
  wireSort(doc,btn,featuredTrack,'a.cd-featured-card',el=>pickId(el.href,'prodotto'),ids=>saveNumberOrder('featured_products','product_id',ids));
 }
 const wishTitle=doc.getElementById('cd-mancolista-title'),wishTrack=doc.getElementById('cd-mancolista-track');
 if(wishTitle&&wishTrack&&!wishTitle.querySelector('.cd-admin-title-btn')){
  wishTitle.append(iconButton(doc,'Aggiungi alla mancolista','+',()=>openWish(null)));
  const btn=iconButton(doc,'Riordina mancolista','⇅',()=>{});wishTitle.append(btn);
  wireSort(doc,btn,wishTrack,'.cd-featured-card',el=>el.dataset.wishlistId,ids=>saveNumberOrder('mancolista','id',ids));
 }
 if(wishTrack){
  [...wishTrack.querySelectorAll('.cd-featured-card')].forEach((card,i)=>{
   const record=wishlist[i];if(!record)return;
   card.dataset.wishlistId=record.id;
   if(card.querySelector('.cd-admin-wish-edit'))return;
   card.style.position='relative';
   const btn=doc.createElement('button');btn.className='cd-admin-wish-edit';btn.type='button';
   btn.textContent='✎';btn.title='Modifica mancolista';btn.setAttribute('aria-label','Modifica '+record.nome);
   btn.onclick=e=>{e.stopPropagation();openWish(record)};
   card.append(btn);
  });
 }
}
function catalogTools(doc){
 const group=getGroup(doc),sub=getSubcategory(doc);
 const general=!group;
 const intro=doc.querySelector('#catalogIntro .section-title');
 const grid=doc.getElementById('catalogSections');
 if(general&&intro&&grid&&!intro.querySelector('.cd-admin-title-btn')){
  const btn=iconButton(doc,'Riordina categorie','⇅',()=>{});intro.append(btn);
  wireSort(doc,btn,grid,'a.catalog-home-card',itemCardId,ids=>saveOrder('main',ids));
 }
 const contentTitle=doc.getElementById('catalogTitle'),subGrid=doc.getElementById('subcatalogSections');
 if(group&&contentTitle&&subGrid&&!sub&&subGrid.querySelector('a.catalog-home-card')&&!contentTitle.querySelector('.cd-admin-title-btn')){
  const btn=iconButton(doc,'Riordina sottocategorie','⇅',()=>{});contentTitle.append(btn);
  wireSort(doc,btn,subGrid,'a.catalog-home-card',subCardId,ids=>saveOrder('sub:'+group,ids));
 }
 const productGrid=doc.getElementById('catalogGrid');
 if(!group||(!sub&&['pokemon','tcg','videogiochi'].includes(group))||!productGrid||doc.getElementById('catalogContent')?.hidden)return;
 const existing=productGrid.querySelectorAll('article.product:not(.cd-admin-new)');
 for(const card of existing){
  const index=Number(card.dataset.id);
  const product=card.dataset.productId?products.find(p=>String(p.id)===String(card.dataset.productId)):products[index];
  if(!product|| (product.catalog_group||'pokemon')!==group)continue;
  const photo=card.querySelector('.photo');
  if(photo&&!photo.querySelector('.cd-admin-star')){
   const star=doc.createElement('button');star.type='button';star.className='cd-admin-star';
   star.setAttribute('aria-label','Aggiungi o rimuovi dai prodotti in evidenza');star.title='Prodotto in evidenza';
   const setState=()=>{const on=featured.some(x=>String(x.product_id)===String(product.id));star.classList.toggle('is-featured',on);star.textContent=on?'★':'☆'};
   setState();
   star.onclick=async e=>{
    e.preventDefault();e.stopPropagation();
    star.disabled=true;
    try{
     const record=featured.find(x=>String(x.product_id)===String(product.id));
     if(record){const {error}=await sb.from('featured_products').delete().eq('product_id',product.id);if(error)throw error;}
     else{const next=Math.max(0,...featured.map(x=>x.display_order||0))+1;const {error}=await sb.from('featured_products').insert({product_id:product.id,display_order:next});if(error)throw error;}
     featured=await loadFeaturedProducts();setState();notify('Prodotti in evidenza aggiornati.');
    }catch(err){notify(err.message,true);}finally{star.disabled=false;}
   };
   photo.append(star);
  }
  const info=card.querySelector('.product-info');
  if(info&&!info.querySelector('.cd-admin-edit')){
   const edit=doc.createElement('button');edit.type='button';edit.className='cd-admin-edit';edit.textContent='✎ Modifica prodotto';
   edit.onclick=e=>{e.stopPropagation();e.preventDefault();openProduct(product,group,sub)};
   info.append(edit);
  }
 }
 if(!productGrid.querySelector('.cd-admin-new')){
  const card=doc.createElement('article');card.className='product cd-admin-new';card.tabIndex=0;card.setAttribute('role','button');
  card.setAttribute('aria-label','Nuovo articolo');
  card.innerHTML='<div class="photo"><span aria-hidden="true">+</span></div><div class="product-info"><h3>Nuovo articolo</h3><div class="price">&nbsp;</div><button class="quick-add" type="button" aria-label="Nuovo articolo">+</button></div>';
  card.onclick=e=>{e.preventDefault();e.stopPropagation();openProduct(null,group,sub||(choices[group]||[])[0]?.[0]);};
  card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();openProduct(null,group,sub||(choices[group]||[])[0]?.[0]);}};
  productGrid.prepend(card);
 }
}
function attach(doc){
 if(!activeUser||doc.location.origin!==location.origin)return;
 currentDoc=doc;
 if(!doc.getElementById('cd-admin-overlay'))adminStyle(doc);
 if(listenObserver)listenObserver.disconnect();
 let queued=false;
 const render=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{
   queued=false;
   if(!activeUser||view.contentDocument!==doc)return;
   if(doc.location.pathname.endsWith('/index.html')||doc.location.pathname.endsWith('/'))homeTools(doc);
   else if(doc.location.pathname.endsWith('/catalogo.html'))catalogTools(doc);
 });};
 listenObserver=new MutationObserver(render);
 listenObserver.observe(doc.body,{childList:true,subtree:true});
 doc.addEventListener('click',e=>{
  const a=e.target.closest('a');
  if(!a)return;
  const url=new URL(a.href,location.href);
  if(url.origin!==location.origin||url.pathname.endsWith('/amministrazione.html')){
   if(url.pathname.endsWith('/amministrazione.html')){e.preventDefault();e.stopPropagation();}
   return;
  }
 },true);
 render();
}
view.addEventListener('load',async()=>{
 if(!activeUser)return;
 try{await refreshLists();attach(view.contentDocument);}
 catch(err){notify('Caricamento dati: '+err.message,true);}
});
function field(id,label,type,value,options,hidden){
 const opts=options?'<select id="f_'+id+'">'+options.map(o=>'<option value="'+esc(Array.isArray(o)?o[0]:o)+'"'+(String(Array.isArray(o)?o[0]:o)===String(value)?' selected':'')+'>'+esc(Array.isArray(o)?o[1]:o)+'</option>').join('')+'</select>':
 type==='textarea'?'<textarea id="f_'+id+'">'+esc(value)+'</textarea>':
 '<input id="f_'+id+'" type="'+type+'" value="'+esc(value)+'"'+(type==='number'?' min="0" step="any"':'')+'>';
 return '<label data-field="'+id+'"'+(hidden?' hidden':'')+'>'+esc(label)+opts+'</label>';
}
function f(id){return $('f_'+id)}
function showDialog(title,html){
 $('adminModalTitle').textContent=title;$('adminFields').innerHTML=html;
 $('adminModalMessage').textContent='';$('adminDelete').hidden=true;
 modal.showModal();
}
function closeDialog(){modal.close();formMode='';editing=null;photos=[];}
$('adminModalClose').onclick=closeDialog;$('adminCancel').onclick=closeDialog;
function productFields(p,group,category){
 const d=p?.details||{};
 let html=field('name','Nome prodotto','text',p?.[0]||'');
 html+=field('group','Catalogo','select',group,Object.entries(groups));
 html+=field('category','Tipologia','select',category,choices[group]);
 html+=field('sigla','Sigla carta','text',p?.[1]||'');
 html+=field('language','Lingua','select',p?.[10]||'ITA',['ITA','ENG','JPN','CHN','KOR']);
 html+=field('condition','Condizione','select',category==='singole'?p?.[5]||'Near Mint':'Near Mint',['Near Mint','Excellent','Good','Light Played','Played','Poor']);
 html+=field('grader','Casa di gradazione','select',d.grader||'PSA',graders);
 html+=field('grade','Voto','select',category==='gradate'?((p?.[5]||'').match(/\b(10|[1-9](?:[.,]5)?|Black Label)\b/i)||[])[0]||'10':'10',Array.from({length:19},(_,i)=>String((i+2)/2)).concat('Black Label'));
 html+=field('sealedType','Tipologia sigillati','select',d.sealedType||'ETB',sealed);
 html+=field('platform','Piattaforma','select',d.platform||'Switch',platforms);
 html+=field('gameCondition','Condizione console/videogame','select',d.gameCondition||'CIB',['CIB','Boxed','Loose']);
 html+=field('accessoryType','Tipo accessorio','select',d.accessoryType||'Binder',accessories);
 html+=field('collectibleType','Tipo collezionabile','select',d.collectibleType||'Funko Pop',collectibles);
 html+=field('price','Prezzo in euro (vuoto = su richiesta)','number',p?.[3]??'');
 html+=field('quantity','Quantità','number',p?.[8]??1);
 html+=field('description','Descrizione','textarea',p?.[9]||'');
 html+='<label>Fotografie (max 6)<input type="file" id="f_photos" accept="image/*" multiple></label><div id="photoItems" class="admin-photos"></div><p class="admin-help">Trascina le fotografie per riordinarle. La prima sarà quella principale.</p>';
 return html;
}
function syncProductFields(){
 const group=f('group').value;
 const cats=choices[group]||[];
 const curr=f('category').value;
 f('category').innerHTML=cats.map(([key,title])=>'<option value="'+key+'">'+esc(title)+'</option>').join('');
 if(cats.some(([key])=>key===curr))f('category').value=curr;
 const cat=f('category').value;
 const shown={sigla:['singole','gradate'].includes(cat),language:['singole','gradate','sealed'].includes(cat),
 condition:cat==='singole',grader:cat==='gradate',grade:cat==='gradate',sealedType:cat==='sealed',
 platform:['console','videogiochi'].includes(cat),gameCondition:['console','videogiochi'].includes(cat),
 accessoryType:cat==='accessori',collectibleType:cat==='collezione'};
 for(const [name,visible] of Object.entries(shown))document.querySelector('[data-field="'+name+'"]').hidden=!visible;
}
function redrawPhotos(){
 const box=$('photoItems');box.replaceChildren();
 photos.forEach((o,i)=>{
  const wrap=document.createElement('div');wrap.className='admin-photo';wrap.dataset.index=i;
  const img=document.createElement('img');img.src=o.url;img.alt='Fotografia '+(i+1);
  const actions=document.createElement('div');actions.className='admin-photo-actions';
  for(const [label,move] of [['←',-1],['→',1]]){
   const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=i+move<0||i+move>=photos.length;
   b.onclick=()=>{[photos[i],photos[i+move]]=[photos[i+move],photos[i]];redrawPhotos();};actions.append(b);
  }
  const del=document.createElement('button');del.type='button';del.textContent='Rimuovi';del.onclick=()=>{photos.splice(i,1);redrawPhotos();};
  wrap.append(img,actions,del);box.append(wrap);
 });
}
function openProduct(p,group,category){
 formMode='product';editing=p||null;
 const cat=category||p?.[2]||choices[group][0][0];
 const g=p?.catalog_group||group||'pokemon';
 photos=(p?.paths||[]).map((path,i)=>({path,url:p?.[7]?.[i]||imageUrl(path)}));
 showDialog(p?'Modifica prodotto':'Nuovo articolo',productFields(p,g,cat));
 f('group').onchange=syncProductFields;f('category').onchange=syncProductFields;
 syncProductFields();f('category').value=cat;syncProductFields();
 f('photos').onchange=e=>{
  for(const file of e.target.files){
   if(photos.length>=6)break;
   photos.push({file,url:URL.createObjectURL(file)});
  }
  redrawPhotos();e.target.value='';
 };
 redrawPhotos();
 if(p)$('adminDelete').hidden=false;
}
function openWish(p){
 formMode='wish';editing=p||null;
 showDialog(p?'Modifica mancolista':'Nuovo articolo mancolista',
  field('wishName','Nome articolo','text',p?.nome||'')+
  field('wishExpansion','Espansione','text',p?.espansione||'')+
  field('wishImage','Indirizzo immagine (facoltativo)','url',p?.immagine_url||'')+
  '<label>Oppure carica una fotografia<input id="f_wishFile" type="file" accept="image/*"></label>');
 if(p)$('adminDelete').hidden=false;
}
async function uploadImage(file,bucket='product-images'){
 ensure(file.type.startsWith('image/'),'Il file selezionato non è un’immagine.');
 ensure(file.size<12*1024*1024,'Ogni immagine deve essere inferiore a 12 MB.');
 const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
 const path='admin/'+crypto.randomUUID()+'.'+ext;
 const {error}=await sb.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});
 if(error)throw error;
 return path;
}
async function saveProduct(){
 const group=f('group').value,category=f('category').value,name=f('name').value.trim();
 ensure(name,'Inserisci il nome del prodotto.');
 ensure((choices[group]||[]).some(([id])=>id===category),'Catalogo e tipologia non compatibili.');
 ensure(photos.length<=6,'Puoi caricare al massimo 6 fotografie.');
 const paths=[];
 for(const ph of photos)paths.push(ph.path||await uploadImage(ph.file));
 const details={
  grader:category==='gradate'?f('grader').value:null,
  sealedType:category==='sealed'?f('sealedType').value:null,
  platform:['console','videogiochi'].includes(category)?f('platform').value:null,
  gameCondition:['console','videogiochi'].includes(category)?f('gameCondition').value:null,
  accessoryType:category==='accessori'?f('accessoryType').value:null,
  collectibleType:category==='collezione'?f('collectibleType').value:null
 };
 const priceText=f('price').value.trim();
 const raw={
  name,sigla:['singole','gradate'].includes(category)?f('sigla').value.trim()||null:null,
  catalog_group:group,category,language:f('language').value,price:priceText===''?null:Number(priceText),
  condition_or_grade:category==='singole'?f('condition').value:category==='gradate'?f('grader').value+' '+f('grade').value:null,
  quantity:Math.max(0,Math.floor(Number(f('quantity').value)||0)),description:f('description').value,
  image_paths:paths,details
 };
 ensure(raw.price===null||Number.isFinite(raw.price)&&raw.price>=0,'Prezzo non valido.');
 const query=editing?sb.from('products').update(raw).eq('id',editing.id):sb.from('products').insert(raw);
 const {error}=await query;if(error)throw error;
 await refreshLists();notify('Prodotto salvato correttamente.');
 closeDialog();view.contentWindow.location.reload();
}
async function saveWish(){
 const name=f('wishName').value.trim();ensure(name,'Inserisci il nome dell’articolo.');
 let url=f('wishImage').value.trim();
 const file=f('wishFile').files[0];
 if(file){const path=await uploadImage(file,'mancolista');url=sb.storage.from('mancolista').getPublicUrl(path).data.publicUrl;}
 const data={nome:name,espansione:f('wishExpansion').value.trim()||null,immagine_url:url||null};
 if(!editing)data.posizione=Math.max(0,...wishlist.map(x=>x.posizione||0))+1;
 const {error}=await(editing?sb.from('mancolista').update(data).eq('id',editing.id):sb.from('mancolista').insert(data));
 if(error)throw error;
 await refreshLists();notify('Mancolista aggiornata.');closeDialog();view.contentWindow.location.reload();
}
form.addEventListener('submit',async e=>{
 e.preventDefault();
 const btn=$('adminSave');btn.disabled=true;
 try{if(formMode==='product')await saveProduct();else if(formMode==='wish')await saveWish();}
 catch(err){notify('Salvataggio non riuscito: '+err.message,true);}finally{btn.disabled=false;}
});
$('adminDelete').onclick=async()=>{
 if(!editing)return;
 const name=formMode==='product'?editing[0]:editing.nome;
 const typed=prompt('Per eliminare definitivamente "'+name+'", digita il nome esatto dell’articolo:');
 if(typed!==name)return;
 try{
  const {error}=formMode==='product'
   ?await sb.from('products').delete().eq('id',editing.id)
   :await sb.from('mancolista').delete().eq('id',editing.id);
  if(error)throw error;
  await refreshLists();closeDialog();notify('Articolo eliminato.');view.contentWindow.location.reload();
 }catch(err){notify('Eliminazione non riuscita: '+err.message,true);}
};
checkLogin();
})();