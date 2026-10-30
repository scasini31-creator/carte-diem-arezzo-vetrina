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
  for(const [key,change] of Object.entries(payload.elements||{})){
   if(!key.startsWith(page+'|')||!change||typeof change!=='object')continue;
   const el=locate(key.slice(page.length+1));if(!el)continue;
   if(typeof change.text==='string')el.textContent=change.text;
   if(typeof change.color==='string'&&change.color)el.style.color=change.color;
   if(typeof change.background==='string'&&change.background)el.style.backgroundColor=change.background;
   if(typeof change.fontSize==='string'&&change.fontSize)el.style.fontSize=change.fontSize;
   if(typeof change.padding==='string'&&change.padding)el.style.padding=change.padding;
   if(typeof change.width==='string'&&change.width)el.style.width=change.width;
   if(typeof change.align==='string'&&change.align)el.style.textAlign=change.align;
   if(typeof change.hidden==='boolean')el.hidden=change.hidden;
   if(typeof change.url==='string'&&change.url){
    if(el.tagName==='IMG')el.src=change.url;
    else if(el.tagName==='A')el.href=change.url;
   }
  }
  for(const [selector,value] of Object.entries(payload.texts||{})){
   const el=locate(selector);if(el&&typeof value==='string')el.textContent=value;
  }
  for(const [selector,value] of Object.entries(payload.images||{})){
   const el=locate(selector);if(el&&el.tagName==='IMG'&&typeof value==='string')el.src=value;
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>run().catch(()=>{}));
 else run().catch(()=>{});
})();