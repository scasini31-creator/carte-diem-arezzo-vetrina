
(async function () {
  const track = document.getElementById('cd-featured-track');
  if (!track) return;

  function mostraMessaggio(testo) {
    const p = document.createElement('p');
    p.className = 'cd-featured-empty';
    p.textContent = testo;
    track.replaceChildren(p);
  }

  try {
    const [prodotti, evidenza] = await Promise.all([
      loadProducts(),
      loadFeaturedProducts()
    ]);

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

      const gruppi = {
        singole: 'pokemon',
        singole_pokemon: 'pokemon',
        gradate: 'pokemon',
        sealed: 'pokemon',
        accessori: 'accessori'
      };

      const gruppo = p.catalog_group || 'pokemon';
      link.href = 'catalogo.html?catalogo=' +
        encodeURIComponent(gruppo);

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = p[0] || 'Articolo Carte Diem';
      img.src = (p[7] && p[7][0]) || 'logo-ottimizzato.webp';
      img.style.cssText =
        'width:100%;aspect-ratio:3/4;object-fit:contain;display:block';

      const nome = document.createElement('strong');
      nome.textContent = p[0] || 'Articolo';

      const dettagli = document.createElement('div');
      dettagli.style.padding = '12px';

      dettagli.appendChild(nome);

      if (p[1]) {
        const sigla = document.createElement('p');
        sigla.textContent = p[1];
        dettagli.appendChild(sigla);
      }

      if (p[3] !== null && p[3] !== undefined && p[3] !== '') {
        const prezzo = document.createElement('p');
        prezzo.style.cssText =
          'color:#f1c777;font-weight:700;margin-top:8px';
        prezzo.textContent = Number(p[3]).toLocaleString(
          'it-IT', {
            style: 'currency',
            currency: 'EUR'
          }
        );
        dettagli.appendChild(prezzo);
      }

      link.append(img, dettagli);
      track.appendChild(link);
    }

  } catch (errore) {
    console.error('Articoli in evidenza:', errore);
    mostraMessaggio('Articoli temporaneamente non disponibili.');
  }
})();
