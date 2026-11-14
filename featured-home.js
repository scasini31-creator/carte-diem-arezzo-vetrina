
(async function () {
  function featuredConditionBadge(p){
 if(!p)return '';
 const category=p[2];
 const rawConditions={
  'NEAR MINT':['NM','Near Mint'],'NM':['NM','Near Mint'],
  'EXCELLENT':['EX','Excellent'],'EX':['EX','Excellent'],
  'GOOD':['GD','Good'],'GD':['GD','Good'],
  'LIGHT PLAYED':['LP','Light Played'],'LP':['LP','Light Played'],
  'PLAYED':['PL','Played'],'PL':['PL','Played'],
  'POOR':['PR','Poor'],'PR':['PR','Poor'],
  'SIGILLATA':['SIG','Sigillata'],'SEALED':['SIG','Sigillata'],'SIG':['SIG','Sigillata']
 };
 if(['console','videogiochi'].includes(category) && p.catalog_group==='videogiochi'){
  const condition=String(p.details?.gameCondition||'').trim();
  const value=['SEALED','CIB','BOXED','LOOSE'].find(v=>v.toLowerCase()===condition.toLowerCase());
  return value?'<span class="cd-product-condition-badge" title="Condizione: '+value+'" aria-label="Condizione: '+value+'">'+value+'</span>':'';
 }
 if(category==='singole'){
  const item=rawConditions[String(p[5]||'').trim().toUpperCase()];
  return item?'<span class="cd-product-condition-badge" title="Condizione: '+item[1]+'" aria-label="Condizione: '+item[1]+'">'+item[0]+'</span>':'';
 }
 if(category!=='gradate')return '';
 let grader=String(p.details?.grader||'').trim().toUpperCase();
 let grade=String(p[5]||'').trim().toUpperCase().replace(',', '.');
 // Compatibilità con vecchi articoli che potrebbero avere casa e voto insieme.
 if(!grader){
  const old=grade.match(/^(PSA|BGS|CGC|GRAAD|TAG|ACE)\s+(.+)$/);
  if(old){grader=old[1];grade=old[2];}
 }
 if(grade==='BLACK LABEL')grade='BL';
 if(grader==='NON SPECIFICATA')grader='';
 if(!grader&&!grade)return '';
 const value=[grader,grade].filter(Boolean).join(' ');
 const safe=value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'" :'&#39;'}[c]));
 return '<span class="cd-product-condition-badge cd-product-grade-badge" title="Gradazione: '+safe+'" aria-label="Gradazione: '+safe+'">'+safe+'</span>';
}
  function featuredLanguageBadge(value){
    const code=String(value||'ITA').trim().toUpperCase();
    const flags={ITA:['🇮🇹','Italiano'],ENG:['🇬🇧','Inglese'],JPN:['🇯🇵','Giapponese'],CHN:['🇨🇳','Cinese'],KOR:['🇰🇷','Coreano']};
    const item=flags[code];
    if(item)return '<span class="cd-product-language-badge" role="img" aria-label="Lingua: '+item[1]+'" title="'+item[1]+'"><span class="cd-language-flag" aria-hidden="true">'+item[0]+'</span></span>';
    const safe=code.replace(/[^A-Z0-9]/g,'').slice(0,5);
    return safe?'<span class="cd-product-language-badge" title="Lingua: '+safe+'">'+safe+'</span>':'';
  }
  const track = document.getElementById('cd-featured-track');
  if (!track) return;

  function mostraMessaggio(testo) {
    const p = document.createElement('p');
    p.className = 'cd-featured-empty';
    p.textContent = testo;
    track.replaceChildren(p);
  }

  try {
    // Evita di scaricare l'intero catalogo quando non ci sono articoli in evidenza.
    const evidenza = await loadFeaturedProducts();
    if (!evidenza.length) {
      mostraMessaggio('Presto troverai qui i nostri articoli in evidenza.');
      return;
    }

    const prodotti = await loadProducts();
    const mappa = new Map(prodotti.map(p => [String(p.id), p]));
    const selezionati = evidenza
      .map(r => mappa.get(String(r.product_id)))
      .filter(Boolean);

    if (!selezionati.length) {
      mostraMessaggio('Presto troverai qui i nostri articoli in evidenza.');
      return;
    }

    track.replaceChildren();

    for (const p of selezionati) {
      const link = document.createElement('a');
      link.className = 'cd-featured-card';

      const gruppo = p.catalog_group || 'pokemon';
      link.href = 'catalogo.html?catalogo=' +
        encodeURIComponent(gruppo) + '&prodotto=' + encodeURIComponent(String(p.id));

      const imageBox = document.createElement('div');
      imageBox.className = 'cd-mancolista-image-box';
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = p[0] || 'Articolo Carte Diem';
      img.src = (p.preview_urls && p.preview_urls[0]) || (p[7] && p[7][0]) || 'logo-ottimizzato.webp';
      imageBox.appendChild(img);
      imageBox.insertAdjacentHTML('beforeend', featuredLanguageBadge(p[10])+featuredConditionBadge(p));

      const nome = document.createElement('strong');
      nome.className = 'cd-mancolista-name';
      nome.textContent = p[0] || 'Articolo';
      nome.title = nome.textContent;

      const dettagli = document.createElement('div');
      dettagli.className = 'cd-mancolista-details';
      dettagli.appendChild(nome);

      link.append(imageBox, dettagli);
      track.appendChild(link);
    }

  } catch (errore) {
    console.error('Articoli in evidenza:', errore);
    mostraMessaggio('Articoli temporaneamente non disponibili.');
  }
})();
