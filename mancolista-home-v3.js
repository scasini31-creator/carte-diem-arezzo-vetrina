(async () => {
  'use strict';
  const track = document.getElementById('cd-mancolista-track');
  if (!track) return;

  function showMessage(message) {
    const p = document.createElement('p');
    p.className = 'cd-featured-empty';
    p.textContent = message;
    track.replaceChildren(p);
  }

  // Le schede vivono esclusivamente nella tabella "mancolista".
  // Non vengono create copie nel catalogo prodotti.
  const style = document.createElement('style');
  style.id = 'cd-mancolista-details-style';
  style.textContent = `
    #cd-mancolista-track .cd-featured-card.cd-wish-clickable{cursor:pointer}
    /* I badge sono sovrapposti alla fotografia, non elementi del layout della card. */
    #cd-mancolista-track .cd-featured-card > .cd-mancolista-image-box{
      position:relative!important;isolation:isolate;overflow:hidden!important;
    }
    #cd-mancolista-track .cd-featured-card > .cd-mancolista-image-box > img{
      position:relative;z-index:0;
    }
    #cd-mancolista-track .cd-featured-card > .cd-mancolista-image-box > .cd-wish-language{
      position:absolute!important;left:5px!important;bottom:5px!important;
      right:auto!important;top:auto!important;z-index:20!important;
      display:inline-flex!important;align-items:center;justify-content:center;
      box-sizing:border-box;min-height:22px;padding:2px 4px;
      border:1px solid #ffffff60;border-radius:5px;background:#070a12e8;
      color:#fff;font:700 11px/1.2 Arial,sans-serif;pointer-events:none;
      box-shadow:0 1px 6px #000c;
    }
    #cd-mancolista-track .cd-wish-language .cd-wish-flag{
      display:block;font:normal 17px/1 "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif;
    }
    #cd-mancolista-track .cd-featured-card > .cd-mancolista-image-box > .cd-wish-conditions{
      position:absolute!important;right:5px!important;bottom:5px!important;
      left:auto!important;top:auto!important;z-index:20!important;
      display:flex!important;flex-direction:column!important;align-items:flex-end!important;
      justify-content:flex-end!important;gap:3px;max-width:calc(100% - 48px);pointer-events:none;
    }
    #cd-mancolista-track .cd-wish-conditions > .cd-wish-condition{
      display:inline-flex!important;align-items:center;justify-content:center;
      box-sizing:border-box;max-width:100%;min-height:22px;padding:3px 5px;
      border:1px solid #ffffff60;border-radius:5px;background:#070a12e8;
      color:#fff;font:700 10px/1.2 Arial,sans-serif;text-shadow:0 1px 2px #000;
      white-space:normal;overflow-wrap:anywhere;text-align:right;box-shadow:0 1px 6px #000c;
    }
    #cd-mancolista-detail .cd-wish-condition-lines{display:flex;flex-direction:column;align-items:flex-start;gap:3px;white-space:pre-wrap}

    #cd-mancolista-track .cd-featured-card.cd-wish-clickable:focus-visible{outline:3px solid #ffd05e;outline-offset:3px}
    #cd-mancolista-detail{max-width:min(92vw,680px);max-height:88dvh;width:100%;padding:0;border:1px solid #b9935a;border-radius:16px;background:#10131b;color:#f8f5ed;box-shadow:0 18px 70px #000b;overflow:auto}
    #cd-mancolista-detail::backdrop{background:#000b}
    #cd-mancolista-detail .cd-wish-body{padding:22px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start;gap:22px}
    #cd-mancolista-detail .cd-wish-photo{width:100%;aspect-ratio:5/7;object-fit:contain;background:#000;border-radius:8px}
    #cd-mancolista-detail .cd-wish-text{text-align:left;min-width:0}
    #cd-mancolista-detail .cd-wish-text h2{font:700 24px/1.25 Georgia,serif;color:#f7d484;margin:6px 0 18px;overflow-wrap:anywhere}
    #cd-mancolista-detail .cd-wish-row{margin:0 0 14px;overflow-wrap:anywhere;line-height:1.5;white-space:pre-wrap}
    #cd-mancolista-detail .cd-wish-label{display:block;color:#e6c782;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.05em}
    #cd-mancolista-detail .cd-wish-top{display:flex;justify-content:flex-end;padding:10px 12px 0}
    #cd-mancolista-detail .cd-wish-close{background:#26232b;color:#fff;border:1px solid #b9935a;border-radius:9px;font-size:23px;line-height:1;min-height:40px;min-width:40px;cursor:pointer}
    @media(max-width:560px){#cd-mancolista-detail .cd-wish-body{grid-template-columns:1fr;padding:12px 18px 22px;gap:12px}#cd-mancolista-detail .cd-wish-photo{max-height:36dvh}#cd-mancolista-detail .cd-wish-text h2{font-size:21px;margin-bottom:12px}}
  `;
  document.head.appendChild(style);

  const dialog = document.createElement('dialog');
  dialog.id = 'cd-mancolista-detail';
  dialog.setAttribute('aria-label', 'Scheda articolo della Mancolista');
  dialog.innerHTML = '<div class="cd-wish-top"><button type="button" class="cd-wish-close" aria-label="Chiudi scheda">×</button></div><div class="cd-wish-body"><div class="cd-wish-media"></div><div class="cd-wish-text"></div></div>';
  document.body.appendChild(dialog);
  dialog.querySelector('.cd-wish-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

  function addRow(parent, label, value) {
    const row = document.createElement('p');
    row.className = 'cd-wish-row';
    const heading = document.createElement('span');
    heading.className = 'cd-wish-label';
    heading.textContent = label;
    const text = document.createElement('span');
    text.textContent = value || 'Non specificata';
    row.append(heading, text);
    parent.appendChild(row);
  }

  function splitConditions(value) {
    return String(value || '').split(';').map(v => v.trim()).filter(Boolean);
  }

  function appendConditions(parent, values) {
    const row = document.createElement('div');
    row.className = 'cd-wish-row';
    const label = document.createElement('span');
    label.className = 'cd-wish-label';
    label.textContent = 'Condizioni';
    const lines = document.createElement('div');
    lines.className = 'cd-wish-condition-lines';
    for (const value of values.length ? values : ['Non specificate']) {
      const line = document.createElement('span');
      line.textContent = value;
      lines.appendChild(line);
    }
    row.append(label, lines);
    parent.appendChild(row);
  }

  function addPreviewBadges(imageBox, item) {
    // Stesse classi visuali degli articoli in evidenza.
    // Posizionamento applicato anche direttamente ai nodi per evitare
    // conflitti con i CSS delle card e con le versioni installate della PWA.
    imageBox.style.setProperty('position', 'relative', 'important');
    const language = String(item.lingua || '').trim().toUpperCase();
    const languages = {ITA:['🇮🇹','Italiano'],ENG:['🇬🇧','Inglese'],JPN:['🇯🇵','Giapponese'],CHN:['🇨🇳','Cinese'],KOR:['🇰🇷','Coreano']};
    if (language) {
      const badge = document.createElement('span');
      badge.className = 'cd-product-language-badge cd-wish-language';
      badge.setAttribute('aria-label', 'Lingua: ' + (languages[language]?.[1] || language));
      badge.title = 'Lingua: ' + (languages[language]?.[1] || language);
      badge.style.setProperty('position','absolute','important');
      badge.style.setProperty('left','6px','important');
      badge.style.setProperty('bottom','6px','important');
      badge.style.setProperty('right','auto','important');
      badge.style.setProperty('top','auto','important');
      badge.style.setProperty('z-index','30','important');
      badge.style.setProperty('display','inline-flex','important');
      if (languages[language]) {
        const flag = document.createElement('span');
        flag.className = 'cd-language-flag cd-wish-flag';
        flag.textContent = languages[language][0];
        badge.appendChild(flag);
      } else {
        badge.textContent = language;
      }
      imageBox.appendChild(badge);
    }
    const conditions = splitConditions(item.condizioni);
    if (conditions.length) {
      const list = document.createElement('div');
      list.className = 'cd-wish-conditions';
      list.setAttribute('aria-label', 'Condizioni: ' + conditions.join(', '));
      list.style.setProperty('position','absolute','important');
      list.style.setProperty('right','6px','important');
      list.style.setProperty('bottom','6px','important');
      list.style.setProperty('left','auto','important');
      list.style.setProperty('top','auto','important');
      list.style.setProperty('z-index','30','important');
      list.style.setProperty('display','flex','important');
      list.style.setProperty('flex-direction','column','important');
      list.style.setProperty('align-items','flex-end','important');
      list.style.setProperty('gap','3px','important');
      list.style.setProperty('pointer-events','none','important');
      for (const condition of conditions) {
        const badge = document.createElement('span');
        badge.className = 'cd-product-condition-badge cd-wish-condition';
        badge.style.setProperty('position','relative','important');
        badge.style.setProperty('right','auto','important');
        badge.style.setProperty('bottom','auto','important');
        badge.style.setProperty('display','inline-flex','important');
        badge.textContent = condition;
        list.appendChild(badge);
      }
      imageBox.appendChild(list);
    }
  }

  function openDetail(item) {
    const media = dialog.querySelector('.cd-wish-media');
    const content = dialog.querySelector('.cd-wish-text');
    media.replaceChildren();
    content.replaceChildren();
    if (item.immagine_url) {
      const photo = document.createElement('img');
      photo.className = 'cd-wish-photo';
      photo.src = item.immagine_url;
      photo.alt = item.nome || 'Articolo Mancolista';
      media.appendChild(photo);
    } else {
      media.hidden = true;
    }
    media.hidden = !item.immagine_url;
    const title = document.createElement('h2');
    title.textContent = item.nome || 'Articolo';
    content.appendChild(title);
    addRow(content, 'Espansione', item.espansione);
    addRow(content, 'Lingua', item.lingua);
    appendConditions(content, splitConditions(item.condizioni));
    if (item.descrizione?.trim()) addRow(content, 'Descrizione', item.descrizione);
    if (!dialog.open) dialog.showModal();
  }

  try {
    const { data, error } = await sb.from('mancolista')
      .select('id,nome,espansione,immagine_url,posizione,lingua,condizioni,descrizione')
      .order('posizione', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    if (!data?.length) {
      showMessage('Presto troverai qui le carte che stiamo cercando!');
      return;
    }
    track.replaceChildren();
    for (const item of data) {
      const card = document.createElement('a');
      card.className = 'cd-featured-card cd-wish-clickable';
      card.href = 'mancolista-scheda.html?id=' + encodeURIComponent(String(item.id));
      card.style.textDecoration = 'none';
      card.style.color = 'inherit';
      card.dataset.wishlistId = item.id;
      card.setAttribute('aria-label', 'Apri scheda: ' + item.nome);

      const imageBox = document.createElement('div');
      imageBox.className = 'cd-mancolista-image-box';
      if (item.immagine_url) {
        const img = document.createElement('img');
        img.loading = 'lazy';
        img.alt = item.nome;
        img.src = item.immagine_url;
        imageBox.appendChild(img);
      }
      addPreviewBadges(imageBox, item);
      card.appendChild(imageBox);

      const details = document.createElement('div');
      details.className = 'cd-mancolista-details';
      const title = document.createElement('strong');
      title.className = 'cd-mancolista-name';
      title.textContent = item.nome;
      title.title = item.nome;
      details.appendChild(title);
      if (item.espansione) {
        const p = document.createElement('p');
        p.className = 'cd-mancolista-expansion';
        p.textContent = item.espansione;
        details.appendChild(p);
      }
      card.appendChild(details);
      card.addEventListener('click', event => {
        // Il collegamento resta come alternativa, ma il tocco normale
        // apre la scheda in sovrimpressione senza uscire dalla Home.
        if (event.target.closest('.cd-admin-wish-edit')) return;
        if (event.defaultPrevented || event.button !== 0 ||
            event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        openDetail(item);
      });
      track.appendChild(card);
    }
  } catch (error) {
    console.error('Errore Mancolista:', error);
    showMessage('Mancolista temporaneamente non disponibile.');
  }
})();
