/* Una visita per sessione di navigazione nella stessa scheda; niente dati personali. */
(function(){
  if(window.self!==window.top)return; // Non contare le pagine nell'Editor Visuale.
  const key='cd-visit-recorded-v1';
  try{
    if(sessionStorage.getItem(key))return;
    sessionStorage.setItem(key,'pending');
  }catch(_){}
  async function record(){
    try{
      if(typeof sb==='undefined')throw new Error('Supabase non disponibile');
      const {error}=await sb.rpc('record_site_visit');
      if(error)throw error;
      try{sessionStorage.setItem(key,'yes')}catch(_){}
    }catch(e){
      try{sessionStorage.removeItem(key)}catch(_){}
      console.warn('Conteggio visite non disponibile:',e);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',record,{once:true});
  else record();
})();
