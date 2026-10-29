(() => {
  const el = id => document.getElementById(id);
  const section = document.createElement('section');
  section.id = 'cd-mancolista-admin';
  section.className = 'panel';
  section.innerHTML = `
    <h2>Gestione Mancolista</h2>
    <p>Seleziona le carte da mostrare nella Mancolista.</p>
    <select id="ml-select">
      <option value="">Caricamento prodotti...</option>
    </select>
    <button id="ml-add" type="button">Aggiungi alla Mancolista</button>
    <div id="ml-status" role="status"></div>
    <div id="ml-list"></div>
  `;

  const panel = el('adminContent');
  if (!panel) return;
  panel.appendChild(section);

  const select = el('ml-select');
  const list = el('ml-list');
  const status = el('ml-status');
  const add = el('ml-add');

  let products = [];
  let items = [];

  const message = text => status.textContent = text;

  async function refresh() {
    try {
      [products, items] = await Promise.all([
        loadProducts(),
        loadMancolista()
      ]);

      const selected = new Set(items.map(x => x.product_id));
      select.replaceChildren(new Option('Seleziona una carta', ''));

      for (const p of products) {
        if (!p.id || selected.has(p.id)) continue;
        select.add(new Option(
          [p[0], p[1]].filter(Boolean).join(' - '),
          p.id
        ));
      }

      list.replaceChildren();

      for (const [index, item] of items.entries()) {
        const product = products.find(p => p.id === item.product_id);
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;margin:12px 0;flex-wrap:wrap';

        const name = document.createElement('span');
        name.textContent = product?.[0] || item.product_id;
        name.style.flex = '1';

        row.appendChild(name);

        for (const [label, direction] of [['↑', -1], ['↓', 1]]) {
          const btn = document.createElement('button');
          btn.textContent = label;
          btn.disabled = index + direction < 0 || index + direction >= items.length;
          btn.onclick = async () => {
            btn.disabled = true;
            try {
              const reordered = [...items];
              const target = index + direction;

              [reordered[index], reordered[target]] =
                [reordered[target], reordered[index]];

              const updates = reordered.map((item, position) => ({
                product_id: item.product_id,
                display_order: position
              }));

              const { error } = await sb
                .from('mancolista')
                .upsert(updates, { onConflict: 'product_id' });

              if (error) throw error;

              await refresh();
              message('Ordine aggiornato.');
            } catch (e) {
              message('Errore riordinamento: ' + e.message);
            } finally {
              btn.disabled = false;
            }
          };
          row.appendChild(btn);
        }

        const remove = document.createElement('button');
        remove.textContent = 'Rimuovi';
        remove.onclick = async () => {
          try {
            const { error } = await sb.from('mancolista')
              .delete().eq('product_id', item.product_id);
            if (error) throw error;
            await refresh();
          } catch (e) {
            message('Errore: ' + e.message);
          }
        };
        row.appendChild(remove);
        list.appendChild(row);
      }
      message('');
    } catch (e) {
      message('Errore caricamento: ' + e.message);
    }
  }

  async function loadMancolista() {
    const { data, error } = await sb.from('mancolista')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  add.onclick = async () => {
    if (!select.value) return;
    add.disabled = true;
    try {
      const order = items.length
        ? Math.max(...items.map(x => x.display_order)) + 1
        : 0;
      const { error } = await sb.from('mancolista').insert({
        product_id: select.value,
        display_order: order
      });
      if (error) throw error;
      await refresh();
    } catch (e) {
      message('Errore: ' + e.message);
    } finally {
      add.disabled = false;
    }
  };

  document.addEventListener('DOMContentLoaded', () => {});
  const observer = new MutationObserver(() => {
    if (getComputedStyle(panel).display !== 'none') {
      observer.disconnect();
      refresh();
    }
  });
  observer.observe(panel, { attributes: true, attributeFilter: ['style'] });
  if (getComputedStyle(panel).display !== 'none') {
    observer.disconnect();
    refresh();
  }
})();
