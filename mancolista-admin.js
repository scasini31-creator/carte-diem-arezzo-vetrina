(() => {
  const el = id => document.getElementById(id);
  const panel = el('adminContent');
  if (!panel) return;
  const section = document.createElement('section');
  section.id = 'cd-mancolista-admin';
  section.className = 'panel';
  section.innerHTML = `<h2>Gestione Mancolista</h2><p>Inserisci gli articoli che desideri acquistare, anche se non sono nel catalogo.</p>
  <form id="ml-form" style="display:grid;gap:10px;max-width:600px">
    <label>Nome articolo *<input id="ml-name" required maxlength="200" style="width:100%"></label>
    <label>Espansione <input id="ml-expansion" maxlength="200" style="width:100%"></label>
    <label>Immagine <input id="ml-image" type="file" accept="image/*" style="width:100%"></label>
    <div id="ml-image-preview"></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="submit" id="ml-save">Aggiungi articolo</button><button type="button" id="ml-cancel" hidden>Annulla modifica</button></div>
  </form><div id="ml-status" role="status" style="margin:12px 0"></div><div id="ml-list"></div>`;
  panel.appendChild(section);
  const form = el('ml-form'), name = el('ml-name'), expansion = el('ml-expansion'), file = el('ml-image');
  const preview = el('ml-image-preview'), save = el('ml-save'), cancel = el('ml-cancel'), list = el('ml-list'), status = el('ml-status');
  let items = [], editing = null, existingImage = null;
  const message = text => { status.textContent = text; };
  const reset = () => { editing = null; existingImage = null; form.reset(); preview.replaceChildren(); save.textContent = 'Aggiungi articolo'; cancel.hidden = true; };
  cancel.onclick = reset;
  function showImage(url) { preview.replaceChildren(); if (!url) return; const img = document.createElement('img'); img.src = url; img.alt = 'Anteprima immagine'; img.style.cssText = 'max-width:140px;max-height:180px;object-fit:contain'; preview.appendChild(img); }
  file.onchange = () => { if (file.files[0]) showImage(URL.createObjectURL(file.files[0])); else showImage(existingImage); };
  async function uploadImage(f) {
    if (!f.type.startsWith('image/')) throw new Error('Seleziona un file immagine.');
    if (f.size > 8 * 1024 * 1024) throw new Error('Immagine troppo grande (massimo 8 MB).');
    const ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = 'mancolista/' + crypto.randomUUID() + '.' + ext;
    const { error } = await sb.storage.from('product-images').upload(path, f, { contentType: f.type, upsert: false });
    if (error) throw error;
    return sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  }
  async function refresh() {
    try {
      const { data, error } = await sb.from('mancolista').select('id,nome,espansione,immagine_url,posizione,created_at').order('posizione', {ascending:true}).order('created_at', {ascending:true});
      if (error) throw error;
      items = data || []; list.replaceChildren();
      if (!items.length) { list.textContent = 'Nessun articolo inserito.'; message(''); return; }
      for (const [index,item] of items.entries()) {
        const row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 0;border-bottom:1px solid #7775';
        if (item.immagine_url) { const img=document.createElement('img'); img.src=item.immagine_url; img.alt=''; img.style.cssText='width:64px;height:80px;object-fit:contain'; row.appendChild(img); }
        const label=document.createElement('span'); label.style.cssText='flex:1;min-width:130px'; label.textContent=item.nome+(item.espansione?' — '+item.espansione:''); row.appendChild(label);
        const edit=document.createElement('button'); edit.textContent='Modifica'; edit.onclick=()=>{editing=item.id;existingImage=item.immagine_url;name.value=item.nome;expansion.value=item.espansione||'';file.value='';showImage(existingImage);save.textContent='Salva modifiche';cancel.hidden=false;form.scrollIntoView({behavior:'smooth',block:'center'});}; row.appendChild(edit);
        for (const [symbol,offset] of [['↑',-1],['↓',1]]) { const btn=document.createElement('button');btn.textContent=symbol;btn.disabled=index+offset<0||index+offset>=items.length;btn.onclick=async()=>{try{btn.disabled=true;const other=items[index+offset];const a=await sb.from('mancolista').update({posizione:other.posizione}).eq('id',item.id);if(a.error)throw a.error;const b=await sb.from('mancolista').update({posizione:item.posizione}).eq('id',other.id);if(b.error)throw b.error;await refresh();message('Ordine aggiornato.');}catch(e){message('Errore riordinamento: '+e.message);btn.disabled=false;}};row.appendChild(btn); }
        const remove=document.createElement('button');remove.textContent='Rimuovi';remove.onclick=async()=>{if(!confirm('Rimuovere questo articolo dalla Mancolista?'))return;try{const {error}=await sb.from('mancolista').delete().eq('id',item.id);if(error)throw error;if(editing===item.id)reset();await refresh();message('Articolo rimosso.');}catch(e){message('Errore: '+e.message);}};row.appendChild(remove);list.appendChild(row);
      }
      message('');
    } catch(e) { message('Errore caricamento: '+e.message); }
  }
  form.onsubmit=async e=>{e.preventDefault();if(!name.value.trim())return;save.disabled=true;try{let image=existingImage;if(file.files[0])image=await uploadImage(file.files[0]);const payload={nome:name.value.trim(),espansione:expansion.value.trim()||null,immagine_url:image||null};let result;if(editing!==null){result=await sb.from('mancolista').update(payload).eq('id',editing);}else{payload.posizione=items.length?Math.max(...items.map(x=>Number(x.posizione)||0))+1:0;result=await sb.from('mancolista').insert(payload);}if(result.error)throw result.error;reset();await refresh();message('Articolo salvato correttamente.');}catch(err){message('Errore: '+err.message);}finally{save.disabled=false;}};
  const observer=new MutationObserver(()=>{if(getComputedStyle(panel).display!=='none'){observer.disconnect();refresh();}});
  observer.observe(panel,{attributes:true,attributeFilter:['style']});
  if(getComputedStyle(panel).display!=='none'){observer.disconnect();refresh();}
})();
