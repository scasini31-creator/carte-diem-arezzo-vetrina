/* Applica solo le modifiche grafiche pubblicate, senza alterare i dati del catalogo. */
(function(){
 const page=location.pathname.split('/').pop()||'index.html';
 if(!['index.html','catalogo.html','richieste.html'].includes(page))return;
 async function run(){
  if(typeof sb==='undefined')return;
  const {data,error}=await sb.from('visual_editor_published').select('payload').eq('page',page).maybeSingle();
  if(error||!data?.payload)return;
  const payload=data.payload;
  function locate(selector){try{return document.querySelector(selector)}catch(e){return null}}
 // Le URL pubblicate sono dati non affidabili, anche se provengono dal database.
 function safePublishedUrl(value, image){
  if(typeof value!=='string'||value.length>2048||/[\u0000-\u001f\u007f]/.test(value))return null;
  try{
   const url=new URL(value,location.href);
   if(url.protocol!=='https:' && !(url.protocol==='http:'&&url.origin===location.origin))return null;
   if(url.username||url.password)return null;
   // Nessun data:, javascript:, blob:, file: o protocollo custom.
   if(image && !['https:','http:'].includes(url.protocol))return null;
   return url.href;
  }catch{return null}
 }
 function safeCss(value){return typeof value==='string' && value.length<=64 && !/[;{}\\]/.test(value) ? value : null;}

  for(const [key,change] of Object.entries(payload.elements||{})){
   if(!key.startsWith(page+'|')||!change||typeof change!=='object')continue;
   const el=locate(key.slice(page.length+1));if(!el)continue;
   // Preserve the original branded hero heading and its nested EM/SMALL styling.
   if(page==='index.html'&&el.matches('h1.cd-title'))continue;
   if(typeof change.text==='string')el.textContent=change.text;
   if(typeof change.color==='string'&&change.color)el.style.color=safeCss(change.color)||'';
   if(typeof change.background==='string'&&change.background)el.style.backgroundColor=safeCss(change.background)||'';
   if(typeof change.fontSize==='string'&&change.fontSize)el.style.fontSize=safeCss(change.fontSize)||'';
   if(typeof change.padding==='string'&&change.padding)el.style.padding=safeCss(change.padding)||'';
   if(typeof change.width==='string'&&change.width)el.style.width=safeCss(change.width)||'';
   if(typeof change.align==='string'&&change.align)el.style.textAlign=['left','right','center','justify'].includes(change.align)?change.align:'';
   if(typeof change.hidden==='boolean')el.hidden=change.hidden;
   if(typeof change.url==='string'&&change.url){
    if(el.tagName==='IMG'){const u=safePublishedUrl(change.url,true);if(u)el.src=u;}
    else if(el.tagName==='A'){const u=safePublishedUrl(change.url,false);if(u){el.href=u;if(el.target==='_blank')el.rel='noopener noreferrer';}}
   }
  }
  for(const [selector,value] of Object.entries(payload.texts||{})){
   const el=locate(selector);if(page==='index.html'&&el?.matches('h1.cd-title'))continue;if(el&&typeof value==='string')el.textContent=value;
  }
  for(const [selector,value] of Object.entries(payload.images||{})){
   const el=locate(selector);if(el&&el.tagName==='IMG'&&typeof value==='string'){const u=safePublishedUrl(value,true);if(u)el.src=u;}
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>run().catch(()=>{}));
 else run().catch(()=>{});
})();