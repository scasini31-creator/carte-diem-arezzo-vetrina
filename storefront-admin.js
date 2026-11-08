(function(){
  const panel=document.getElementById('cd-maintenance-admin');
  const status=document.getElementById('cd-maintenance-status');
  const button=document.getElementById('cd-maintenance-toggle');
  if(!panel)return;
  let active=false;
  async function refresh(){
    button.disabled=true;
    const {data,error}=await sb.from('storefront_mode').select('maintenance').eq('id',1).single();
    if(error||!data){status.textContent='Errore lettura impostazione: '+(error?.message||'nessun dato');button.textContent='Riprova';button.disabled=false;return;}
    active=data.maintenance===true;
    status.textContent=active?'Stato attuale: VETRINA IN ALLESTIMENTO':'Stato attuale: VETRINA PUBBLICA';
    button.textContent=active?'Disattiva modalità allestimento':'Attiva modalità allestimento';
    button.disabled=false;
  }
  button.addEventListener('click',async()=>{
    const {data:{user}}=await sb.auth.getUser();
    if(!user){status.textContent='Effettua l’accesso come amministratore.';return;}
    const {data:allowed,error:authError}=await sb.rpc('is_admin');
    if(authError||!allowed){status.textContent='Operazione riservata agli amministratori.';return;}
    const next=!active;
    if(!confirm(next?'Attivare la modalità allestimento? Tutti i prodotti saranno nascosti ai visitatori.':'Disattivare la modalità allestimento e rendere nuovamente visibili tutti i prodotti?'))return;
    button.disabled=true;status.textContent='Salvataggio in corso…';
    const {data,error}=await sb.from('storefront_mode').update({maintenance:next,updated_at:new Date().toISOString()}).eq('id',1).select('maintenance').single();
    if(error||!data){status.textContent='Salvataggio non riuscito: '+(error?.message||'nessuna modifica');button.disabled=false;return;}
    await refresh();
  });
  const observer=new MutationObserver(()=>{
    if(document.getElementById('adminContent')?.style.display!=='none')refresh();
  });
  observer.observe(document.getElementById('adminContent'),{attributes:true,attributeFilter:['style']});
  button.addEventListener('focus',()=>{if(!button.disabled)refresh()},{once:true});
})();
