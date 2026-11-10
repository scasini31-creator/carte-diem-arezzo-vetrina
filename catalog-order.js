/* Ordine condiviso categorie Home/Catalogo e sottocategorie, solo lettura pubblica. */
(function(){
'use strict';
const cache={};
async function load(){
 try{
  const {data,error}=await sb.from('catalog_ui_orders').select('id,items');
  if(error)throw error;
  for(const row of data||[])if(Array.isArray(row.items))cache[row.id]=row.items;
  install();
 }catch(err){console.warn('Ordine categorie: impostazioni non disponibili',err);}
}
function groupOf(el){try{return new URL(el.href,location.href).searchParams.get('catalogo')||''}catch{return ''}}
function subOf(el){try{return new URL(el.href,location.href).searchParams.get('sottocategoria')||''}catch{return ''}}
function sort(container,selector,items,getId){
 if(!container||!Array.isArray(items)||items.length===0)return;
 const cards=[...container.querySelectorAll(selector)];
 if(cards.length<2)return;
 const index=new Map(items.map((key,i)=>[key,i]));
 const sorted=cards.slice().sort((a,b)=>(index.has(getId(a))?index.get(getId(a)):100+cards.indexOf(a))-(index.has(getId(b))?index.get(getId(b)):100+cards.indexOf(b)));
 if(sorted.every((card,i)=>cards[i]===card))return;
 for(const card of sorted)container.appendChild(card);
}
function apply(){
 sort(document.querySelector('#categorie .grid'),'a.category',cache.main,groupOf);
 sort(document.getElementById('catalogSections'),'a.catalog-home-card',cache.main,groupOf);
 const params=new URLSearchParams(location.search),group=params.get('catalogo');
 if(group)sort(document.getElementById('subcatalogSections'),'a.catalog-home-card',cache['sub:'+group],subOf);
}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});}
function install(){
 apply();
 for(const id of ['catalogSections','subcatalogSections']){
  const el=document.getElementById(id);
  if(el)new MutationObserver(schedule).observe(el,{childList:true});
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});
else load();
})();