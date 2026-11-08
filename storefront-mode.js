/* Stato pubblico condiviso: nessun prodotto viene caricato prima del controllo. */
window.cdStorefrontMaintenance = true;
window.cdStorefrontReady = (async () => {
  try {
    const {data,error}=await sb.from('storefront_mode').select('maintenance').eq('id',1).single();
    if(error || !data) throw error || Error('Impostazione non disponibile');
    window.cdStorefrontMaintenance = data.maintenance === true;
  } catch(e) {
    console.error('Impossibile verificare lo stato della vetrina:',e);
    window.cdStorefrontMaintenance = true; // Non esporre prodotti in caso di errore.
  }
  if(window.cdStorefrontMaintenance) {
    for(const id of ['cd-featured-track','cd-mancolista-track']){
      const node=document.getElementById(id);
      if(node){const p=document.createElement('p');p.className='cd-maintenance-message';p.textContent='VETRINA IN ALLESTIMENTO';node.replaceChildren(p);}
    }
    const action=document.querySelector('#cd-mancolista .cd-mancolista-action');
    if(action)action.hidden=true;
  }
  return window.cdStorefrontMaintenance;
})();
