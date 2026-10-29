(() => {
  const el = id => document.getElementById(id);
  const select = el('cd-featured-select');
  const add = el('cd-featured-add');
  const list = el('cd-featured-admin-list');
  const status = el('cd-featured-admin-status');

  if (!select || !add || !list || !status) return;

  let catalogo = [];
  let featured = [];

  const message = text => { status.textContent = text; };

  async function refreshFeatured() {
    try {
      [catalogo, featured] = await Promise.all([
        loadProducts(),
        loadFeaturedProducts()
      ]);

      const selected = new Set(featured.map(x => x.product_id));

      select.replaceChildren(new Option('Seleziona un prodotto', ''));

      for (const p of catalogo) {
        if (!p.id || selected.has(p.id)) continue;
        const name = [p[0], p[1]].filter(Boolean).join(' - ');
        select.add(new Option(name, p.id));
      }

      list.replaceChildren();

      async function moveFeatured(index, direction) {
        const other = index + direction;
        if (other < 0 || other >= featured.length) return;

        const a = featured[index];
        const b = featured[other];

        try {
          message('Aggiornamento ordine...');
          const {error} = await sb
            .from('featured_products')
            .upsert([
              {product_id: a.product_id, display_order: b.display_order},
              {product_id: b.product_id, display_order: a.display_order}
            ], {onConflict: 'product_id'});

          if (error) throw error;

          await refreshFeatured();
          message('Ordine aggiornato.');
        } catch (e) {
          message('Errore riordinamento: ' + e.message);
        }
      }

      if (!featured.length) {
        list.textContent = 'Nessun articolo selezionato.';
      }

      for (const [index, item] of featured.entries()) {
        const p = catalogo.find(x => x.id === item.product_id);
        const row = document.createElement('div');
        row.style.cssText =
          'display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #555';

        const name = document.createElement('span');
        name.textContent = p
          ? [p[0], p[1]].filter(Boolean).join(' - ')
          : 'Prodotto non trovato';

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = 'Rimuovi';
        remove.onclick = async () => {
          if (!confirm('Rimuovere dagli articoli in evidenza?')) return;
          remove.disabled = true;
          try {
            await removeFeaturedProduct(item.product_id);
            await refreshFeatured();
            message('Articolo rimosso.');
          } catch (e) {
            message('Errore: ' + e.message);
            remove.disabled = false;
          }
        };

        const controls = document.createElement('span');
        controls.style.cssText = 'display:flex;gap:6px';

        for (const [symbol, direction] of [['←', -1], ['→', 1]]) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = symbol;
          btn.disabled = index + direction < 0 ||
                         index + direction >= featured.length;
          btn.onclick = () => moveFeatured(index, direction);
          controls.append(btn);
        }

        controls.append(remove);
        row.append(name, controls);
        list.append(row);
      }

      message('');
    } catch (e) {
      message('Errore caricamento: ' + e.message);
    }
  }

  add.onclick = async () => {
    if (!select.value) {
      message('Seleziona prima un prodotto.');
      return;
    }

    add.disabled = true;
    try {
      const order = featured.length
        ? Math.max(...featured.map(x => x.display_order)) + 1
        : 0;

      await addFeaturedProduct(select.value, order);
      await refreshFeatured();
      message('Articolo aggiunto correttamente.');
    } catch (e) {
      message('Errore: ' + e.message);
    } finally {
      add.disabled = false;
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const panel = el('adminContent');
    if (!panel) return;

    const observer = new MutationObserver(() => {
      if (getComputedStyle(panel).display !== 'none') {
        observer.disconnect();
        refreshFeatured();
      }
    });

    observer.observe(panel, {
      attributes: true,
      attributeFilter: ['style']
    });

    if (getComputedStyle(panel).display !== 'none') {
      observer.disconnect();
      refreshFeatured();
    }
  });
})();
