(async () => {
  const track=document.getElementById('cd-mancolista-track');
  if(!track)return;
  function showMessage(text){const p=document.createElement('p');p.className='cd-featured-empty';p.textContent=text;track.replaceChildren(p);}
  try{
    const {data,error}=await sb.from('mancolista').select('id,nome,espansione,immagine_url,posizione').order('posizione',{ascending:true}).order('created_at',{ascending:true});
    if(error)throw error;
    if(!data?.length){showMessage('Presto troverai qui le carte che stiamo cercando!');return;}
    track.replaceChildren();
    for(const item of data){
      const card=document.createElement('div');card.className='cd-featured-card';
      if(item.immagine_url){const img=document.createElement('img');img.loading='lazy';img.alt=item.nome;img.src=item.immagine_url;img.style.cssText='width:100%;aspect-ratio:3/4;object-fit:contain;display:block';card.appendChild(img);}
      const details=document.createElement('div');details.style.padding='12px';
      const title=document.createElement('strong');title.textContent=item.nome;details.appendChild(title);
      if(item.espansione){const p=document.createElement('p');p.textContent=item.espansione;details.appendChild(p);}
      card.appendChild(details);track.appendChild(card);
    }
  }catch(err){console.error('Errore Mancolista:',err);showMessage('Mancolista temporaneamente non disponibile.');}
})();
