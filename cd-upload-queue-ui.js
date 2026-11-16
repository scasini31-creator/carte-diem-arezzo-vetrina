/* Pulsante e monitor coda. Visibile solo ad amministratori verificati. */
(function(){
'use strict';
const adminPage=!!document.getElementById('adminRoot');
let dialog,button;
const q=window.CDProductQueue;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mount(){
 if(button)return;
 const host=adminPage?document.getElementById('adminBar'):document.querySelector('body > header');
 if(!host)return;
 button=document.createElement('button');
 button.type='button';button.id='cd-queue-top-btn';button.hidden=true;button.title='Coda caricamento prodotti';
 button.setAttribute('aria-label','Coda caricamento prodotti');
 button.innerHTML='<span aria-hidden="true">☷</span> <span>Coda</span> <b id="cd-queue-count" hidden>0</b>';
 button.style.cssText='display:none;align-items:center;gap:5px;background:#131313;color:#f0c46f;border:1px solid #b79350;border-radius:8px;padding:8px 10px;cursor:pointer;font-size:13px;white-space:nowrap';
 if(adminPage){host.insertBefore(button,document.getElementById('adminLogout'))}
 else{const share=document.getElementById('cd-share-btn');share?.after(button);if(!share)host.append(button)}
 dialog=document.createElement('dialog');dialog.id='cd-queue-dialog';
 dialog.style.cssText='max-width:min(95vw,610px);width:100%;max-height:85vh;overflow:auto;background:#111;color:#fff;border:1px solid #c9a052;border-radius:12px;padding:20px;box-shadow:0 12px 45px #0009';
 dialog.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:16px"><h2 style="font-size:19px;color:#f0c46f;margin:0">Coda caricamento</h2><button type="button" id="cd-queue-close" style="font-size:23px;background:transparent;border:0;color:#fff">×</button></div><p style="font-size:12px;color:#aaa">I prodotti vengono conservati su questo dispositivo e caricati quando il pannello amministratore è aperto e connesso.</p><div id="cd-queue-list" aria-live="polite"></div>';
 document.body.append(dialog);
 dialog.querySelector('#cd-queue-close').onclick=()=>dialog.close();
 button.onclick=()=>{if(!adminPage){location.href='amministrazione.html?queue=1&return=index.html';return;}dialog.showModal();refresh()};
 if(adminPage&&new URLSearchParams(location.search).has('queue')){const obs=new MutationObserver(()=>{if(!document.getElementById('adminRoot').hidden){obs.disconnect();button.click()}});obs.observe(document.getElementById('adminRoot'),{attributes:true,attributeFilter:['hidden']});}
}
async function refresh(){
 if(!button||button.hidden)return;
 let rows=[];
 try{rows=await q.all()}catch(e){console.warn(e);return}
 const ongoing=rows.filter(x=>x.status!=='done').length;
 const counter=button.querySelector('#cd-queue-count');counter.hidden=!ongoing;counter.textContent=ongoing;
 if(!dialog)return;
 const list=dialog.querySelector('#cd-queue-list');
 list.replaceChildren();
 if(!rows.length){list.textContent='La coda è vuota.';return}
 for(const item of rows){
  const line=document.createElement('div');
  line.style.cssText='padding:12px 0;border-bottom:1px solid #5b4a31;display:grid;gap:7px';
  const title=document.createElement('strong');title.textContent=item.row?.name||'Articolo';line.append(title);
  const state=document.createElement('small');state.style.color='#d8bf8b';
  const labels={pending:'In attesa',uploading:'In caricamento',done:'Completato',error:'Errore'};
  state.textContent=(labels[item.status]||item.status)+' — '+(item.progress||0)+'%'+(item.error?' · '+item.error:'');
  line.append(state);
  const bar=document.createElement('progress');bar.max=100;bar.value=item.progress||0;bar.style.width='100%';line.append(bar);
  if(adminPage&&item.status==='error'){
   const retry=document.createElement('button');retry.textContent='Riprova';retry.type='button';retry.onclick=async()=>{await q.retry(item.id);refresh()};line.append(retry);
  }
  if(adminPage&&item.status!=='uploading'){
   const del=document.createElement('button');del.type='button';del.textContent=item.status==='done'?'Rimuovi dallo storico':'Elimina dalla coda';
   del.onclick=async()=>{if(!confirm('Rimuovere dalla coda "'+item.row.name+'"?'))return;await q.discard(item.id);refresh()};
   line.append(del);
  }
  list.append(line);
 }
}
function show(){
 mount();if(!button)return;
 button.hidden=false;button.style.display='inline-flex';refresh();
}
async function checkPublic(){
 if(adminPage)return;
 try{
  const {data:{user},error}=await sb.auth.getUser();
  if(error||!user)return;
  const {data,error:e}=await sb.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
  if(!e&&data)show();
 }catch(e){console.warn(e)}
}
window.CDQueueUI={show,refresh};
mount();q.onChange(refresh);
if(!adminPage){checkPublic();sb.auth.onAuthStateChange(()=>setTimeout(()=>{button.hidden=true;button.style.display='none';checkPublic()},0))}
else{const obs=new MutationObserver(()=>{if(!document.getElementById('adminRoot').hidden)show();else if(button){button.hidden=true;button.style.display='none'}});obs.observe(document.getElementById('adminRoot'),{attributes:true,attributeFilter:['hidden']})}
})();
