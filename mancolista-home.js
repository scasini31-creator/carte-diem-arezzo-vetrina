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
      const imageBox=document.createElement('div');imageBox.className='cd-mancolista-image-box';if(item.immagine_url){const img=document.createElement('img');img.loading='lazy';img.alt=item.nome;img.src=item.immagine_url;imageBox.appendChild(img);}card.appendChild(imageBox);
      const details=document.createElement('div');details.className='cd-mancolista-details';
      const title=document.createElement('strong');title.className='cd-mancolista-name';title.textContent=item.nome;title.title=item.nome;details.appendChild(title);
      if(item.espansione){const p=document.createElement('p');p.className='cd-mancolista-expansion';p.textContent=item.espansione;details.appendChild(p);}
      card.appendChild(details);track.appendChild(card);
    }
  }catch(err){console.error('Errore Mancolista:',err);showMessage('Mancolista temporaneamente non disponibile.');}
})();
