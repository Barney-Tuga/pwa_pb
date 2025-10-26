// Modernized JS: mantém funcionalidades (abrir janelas, redimensionar, minimizar, taskbar, guardar ferramentas)
// Registo service worker (se existir)
console.log('app.js (pwa_02) loaded — guarded listeners enabled');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(()=>{ /* ignore */ });
}

// --- Procura (search) window for Clientes ---
function openProcuraClientesWindow(){
  const content = `
    <div style="display:flex;flex-direction:column;height:100%;">
      <div class="procura-toolbar" style="display:flex;gap:8px;align-items:center;padding:8px;border-bottom:1px solid #e6eef7;">
        <button class="procura-btn">Filtro</button>
        <button class="procura-btn">Atualizar</button>
        <div style="flex:1"></div>
        <button class="procura-btn" id="procura-client-close">Fechar</button>
      </div>

      <div style="padding:12px">
        <div class="procura-card" style="display:flex;gap:12px;align-items:center">
          <div style="flex:1">
            <label style="display:block;font-size:12px;color:#374151;margin-bottom:6px">Nome</label>
            <div class="procura-search-wrapper">
              <input id="procura-client-name" class="procura-input" type="text" placeholder="Pesquisar por nome..." />
              <span class="procura-search-icon">🔎</span>
            </div>
          </div>
          <div style="width:240px">
            <label style="display:block;font-size:12px;color:#374151;margin-bottom:6px">Nº Cliente</label>
            <input id="procura-client-id" class="procura-input" type="text" placeholder="Ex: 1001" />
          </div>
          <div style="display:flex;align-items:end">
            <button id="procura-client-search-btn" class="procura-btn btn-accent">Pesquisar</button>
          </div>
        </div>
      </div>

      <div style="padding:12px;flex:1;overflow:auto">
        <div class="procura-table-card">
          <table id="procura-clients-table" style="width:100%;border-collapse:collapse">
            <thead>
              <tr><th>Nº Cliente</th><th>Nome</th><th>NIF</th><th>Telefone</th><th>Localidade</th></tr>
            </thead>
            <tbody>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const id = openWindow({ title: '🔎 Procura de Cliente', content, width: 700, height: 520, left: 140, top: 90 });
  const winEl = windows[id];
  if(!winEl) return id;

  // populate from localStorage 'clientes' (and store a runtime copy for quick lookup)
  try{
    const table = winEl.querySelector('#procura-clients-table');
    if(table){
      const tbody = table.querySelector('tbody') || table.appendChild(document.createElement('tbody'));
      let clients = [];
      try{ clients = JSON.parse(localStorage.getItem('clientes') || '[]'); }catch(_){ clients = []; }
      window.clientesData = Array.isArray(clients) ? clients : [];
      tbody.innerHTML = (window.clientesData || []).map(c => `<tr><td>${(c.id||'')}</td><td>${(c.name||'')}</td><td>${(c.nif||'')}</td><td>${(c.phone||'')}</td><td>${(c.city||'')}</td></tr>`).join('');
    }
  }catch(_){ }

  // wire dblclick handlers for selecting a client row
  try{ wireProcuraClientesRowHandlers(winEl); }catch(_){ }

  // close toolbar button
  const closeBtn = winEl.querySelector('#procura-client-close'); if(closeBtn) closeBtn.addEventListener('click', ()=> winEl.remove());

  // filtering
  const inputName = winEl.querySelector('#procura-client-name');
  const inputId = winEl.querySelector('#procura-client-id');
  const searchBtn = winEl.querySelector('#procura-client-search-btn');
  function filterProcura(){
    const qn = (inputName && inputName.value || '').trim().toLowerCase();
    const qi = (inputId && inputId.value || '').trim().toLowerCase();
    const rows = Array.from(winEl.querySelectorAll('#procura-clients-table tbody tr'));
    rows.forEach(r => {
      const id = (r.children[0].textContent||'').toLowerCase();
      const name = (r.children[1].textContent||'').toLowerCase();
      let ok = true;
      if(qn) ok = ok && name.indexOf(qn) !== -1;
      if(qi) ok = ok && id.indexOf(qi) !== -1;
      r.style.display = ok ? '' : 'none';
    });
  }
  if(inputName) inputName.addEventListener('input', filterProcura);
  if(inputId) inputId.addEventListener('input', filterProcura);
  if(searchBtn) searchBtn.addEventListener('click', filterProcura);

  setTimeout(()=>{ try{ if(inputName){ inputName.focus(); inputName.select(); } }catch(_){ } }, 80);
  setTimeout(enableResizableColumns, 160);

  return id;
}

function wireProcuraClientesRowHandlers(winEl){
  if(!winEl) return;
  const table = winEl.querySelector('#procura-clients-table');
  if(!table) return;
  const tbody = table.querySelector('tbody');
  if(!tbody) return;
  Array.from(tbody.querySelectorAll('tr')).forEach(row => {
    row.ondblclick = null;
    row.addEventListener('dblclick', function onDbl(){
      try{
        const clientId = (row.children[0] && row.children[0].textContent || '').trim();
        let client = null;
        try{ client = (window.clientesData || []).find(c => (c.id||'').toString() === clientId.toString()); }catch(_){ }
        if(!client){
          try{ const all = JSON.parse(localStorage.getItem('clientes')||'[]'); client = (all||[]).find(c => (c.id||'').toString() === clientId.toString()); }catch(_){ }
        }
        // open client window and populate fields
        try{
          openClientWindow();
          setTimeout(()=>{
            const lastId = 'win-' + winCounter;
            const clientWin = windows[lastId];
            if(!clientWin) return;
            if(!client) return;
            try{ clientWin.querySelector('#client-id').value = client.id || ''; }catch(_){}
            try{ clientWin.querySelector('#client-name').value = client.name || ''; }catch(_){}
            try{ clientWin.querySelector('#client-abrev').value = client.abrev || ''; }catch(_){}
            try{ clientWin.querySelector('#client-nif').value = client.nif || ''; }catch(_){}
            try{ clientWin.querySelector('#client-bi').value = client.bi || ''; }catch(_){}
            try{ clientWin.querySelector('#client-phone').value = client.phone || ''; }catch(_){}
            try{ clientWin.querySelector('#client-mobile').value = client.mobile || ''; }catch(_){}
            try{ clientWin.querySelector('#client-fax').value = client.fax || ''; }catch(_){}
            try{ clientWin.querySelector('#client-contact').value = client.contact || ''; }catch(_){}
            try{ clientWin.querySelector('#client-address1').value = client.address1 || ''; }catch(_){}
            try{ clientWin.querySelector('#client-address2').value = client.address2 || ''; }catch(_){}
            try{ clientWin.querySelector('#client-city').value = client.city || ''; }catch(_){}
            try{ clientWin.querySelector('#client-postal').value = client.postal || ''; }catch(_){}
            try{ clientWin.querySelector('#client-country').value = client.country || ''; }catch(_){}
            try{ clientWin.querySelector('#client-cae').value = client.cae || ''; }catch(_){}
          }, 60);
        }catch(e){ console.error('Erro ao abrir cliente via procura dblclick', e); }

        // close procura window
        try{ winEl.remove(); }catch(_){ }
      }catch(e){ console.error('Erro no dblclick handler procura clientes', e); }
    });
  });
}

// Refresh function: update any open Procura Clientes windows when client list changes
window.refreshProcuraClients = function(){
  try{
    const all = JSON.parse(localStorage.getItem('clientes') || '[]');
    window.clientesData = Array.isArray(all) ? all : [];
    document.querySelectorAll('.window').forEach(win => {
      const table = win.querySelector && win.querySelector('#procura-clients-table');
      if(!table) return;
      const tbody = table.querySelector('tbody') || table.appendChild(document.createElement('tbody'));
      tbody.innerHTML = (window.clientesData || []).map(c => `<tr><td>${(c.id||'')}</td><td>${(c.name||'')}</td><td>${(c.nif||'')}</td><td>${(c.phone||'')}</td><td>${(c.city||'')}</td></tr>`).join('');
      try{ wireProcuraClientesRowHandlers(win); }catch(_){ }
    });
  }catch(e){ /* ignore */ }
};

// POS System Integration
class POSSystem {
    constructor() {
        this.cart = [];
        this.products = [];
        this.currentPaymentMethod = 'cash';
        this.taxRate = 0.23;
        this.settings = {};
        this.loadSettings();
        this.initProducts();
    }

    loadSettings() {
        try {
            const savedSettings = JSON.parse(localStorage.getItem('posSettings')) || {};
            this.settings = {
                storeName: 'PlastiBorracha',
                storeAddress: '',
                showTax: true,
                taxRate: 23,
                autoPrint: false,
                showBarcode: true,
                soundEnabled: true,
                theme: 'light',
                ...savedSettings
            };
            
            // Apply tax rate
            this.taxRate = this.settings.taxRate / 100;
        } catch (e) {
            console.error('Erro ao carregar configurações POS:', e);
        }
    }

    initProducts() {
        this.products = [
            // Automóvel
            { id: 1, name: 'Vedante Porta BMW E46', code: 'BMW-VPE46', price: 25.50, stock: 15, category: 'automovel' },
            { id: 2, name: 'Perfil Vidro Mercedes W203', code: 'MB-PVW203', price: 18.75, stock: 8, category: 'automovel' },
            { id: 3, name: 'Apoio Motor Audi A4', code: 'AUDI-AMA4', price: 45.00, stock: 12, category: 'automovel' },
            { id: 4, name: 'Vedante Capô VW Golf', code: 'VW-VCGOLF', price: 22.30, stock: 20, category: 'automovel' },
            { id: 5, name: 'Perfil Borracha Ford Focus', code: 'FORD-PBFOC', price: 15.90, stock: 25, category: 'automovel' },
            
            // Indústria
            { id: 6, name: 'Base Elevador 200kg', code: 'IND-BE200', price: 85.00, stock: 6, category: 'industria' },
            { id: 7, name: 'Batente de Cais Pneumático', code: 'IND-BCP01', price: 125.50, stock: 4, category: 'industria' },
            { id: 8, name: 'Lamela Cortina de Ar', code: 'IND-LCA50', price: 35.75, stock: 30, category: 'industria' },
            { id: 9, name: 'Estrado Plástico 80x120', code: 'IND-EP8012', price: 65.00, stock: 10, category: 'industria' },
            
            // Vedantes
            { id: 10, name: 'Vedante Banheira 2m', code: 'VED-B2M', price: 12.50, stock: 50, category: 'vedantes' },
            { id: 11, name: 'Vedante Janela PVC', code: 'VED-JPVC', price: 8.90, stock: 75, category: 'vedantes' },
            { id: 12, name: 'Vedante Porta Correr', code: 'VED-PC01', price: 16.25, stock: 40, category: 'vedantes' },
            
            // Perfis
            { id: 13, name: 'Perfil U 10mm Preto', code: 'PER-U10P', price: 5.75, stock: 100, category: 'perfis' },
            { id: 14, name: 'Perfil H 15mm Cinza', code: 'PER-H15C', price: 7.20, stock: 80, category: 'perfis' },
            { id: 15, name: 'Perfil Canto 20mm', code: 'PER-C20', price: 9.50, stock: 60, category: 'perfis' },
            
            // Apoios
            { id: 16, name: 'Apoio Redondo Ø30mm', code: 'APO-R30', price: 3.25, stock: 200, category: 'apoios' },
            { id: 17, name: 'Apoio Quadrado 25x25', code: 'APO-Q25', price: 4.50, stock: 150, category: 'apoios' },
            { id: 18, name: 'Apoio Cone Regulável', code: 'APO-CR01', price: 12.75, stock: 35, category: 'apoios' }
        ];
    }

    renderProducts(category = 'all', searchTerm = '') {
        console.log('renderProducts called with category:', category, 'searchTerm:', searchTerm);
        console.log('Total products:', this.products.length);
        
        let filteredProducts = this.products;
        
        if (category !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.category === category);
        }
        
        if (searchTerm) {
            filteredProducts = filteredProducts.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.code.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        console.log('Filtered products:', filteredProducts.length);

        const grid = document.getElementById('pos-products-grid');
        console.log('Grid element found:', !!grid);
        if (!grid) return;

        const html = filteredProducts.map(product => `
            <div class="pos-product-card" onclick="posSystem.addToCart(${product.id})">
                <div class="pos-product-name">${product.name}</div>
                <div class="pos-product-code">REF: ${product.code}</div>
                <div class="pos-product-price">€${product.price.toFixed(2)}</div>
                <div class="pos-product-stock">Stock: ${product.stock} unid.</div>
            </div>
        `).join('');
        
        console.log('Generated HTML length:', html.length);
        grid.innerHTML = html;
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product || product.stock <= 0) return;

        const existingItem = this.cart.find(item => item.id === productId);
        
        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                existingItem.quantity++;
            } else {
                alert('Stock insuficiente!');
                return;
            }
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }
        
        this.renderCart();
        this.updateCheckoutButton();
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.renderCart();
        this.updateCheckoutButton();
    }

    updateQuantity(productId, change) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return;

        const product = this.products.find(p => p.id === productId);
        const newQuantity = item.quantity + change;

        if (newQuantity <= 0) {
            this.removeFromCart(productId);
        } else if (newQuantity <= product.stock) {
            item.quantity = newQuantity;
            this.renderCart();
            this.updateCheckoutButton();
        } else {
            alert('Stock insuficiente!');
        }
    }

    renderCart() {
        const container = document.getElementById('pos-cart-items');
        const summary = document.getElementById('pos-cart-summary');
        const countEl = document.getElementById('pos-cart-count');

        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        if (countEl) {
            countEl.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`;
        }

        if (this.cart.length === 0) {
            container.innerHTML = `
                <div class="pos-empty-cart">
                    <p>Carrinho vazio</p>
                </div>
      `;
      // ensure summary is reset for empty cart
      try{ if(summary) summary.textContent = '0,00 €'; }catch(_){ }
      // end renderCart method
      return;
    }
  }
}

let posSystem;

// Global marcas data (persisted to localStorage). If present in localStorage, load it; otherwise use defaults.
window.marcasData = (function(){
  try{
    const raw = localStorage.getItem('marcasData');
    if(raw) return JSON.parse(raw);
  }catch(_){ }
  return [
    { id: 'toyota', name: 'Toyota', models: [ {name:'Corolla', description:'Sedan compacto', image:''}, {name:'Yaris', description:'Hatch pequeno', image:''} ], image: '' },
    { id: 'ford', name: 'Ford', models: [ {name:'Focus', description:'Familiar', image:''}, {name:'Fiesta', description:'Citadino', image:''} ], image: '' },
    { id: 'vw', name: 'Volkswagen', models: [ {name:'Golf', description:'Compacto', image:''}, {name:'Polo', description:'Hatch', image:''} ], image: '' },
    { id: 'renault', name: 'Renault', models: [ {name:'Clio', description:'Citadino', image:''}, {name:'Megane', description:'Família', image:''} ], image: '' }
  ];
})();

// Global artigos data (persisted to localStorage). articles are simple objects { ref, name, createdAt }
window.artigosData = (function(){
  try{
    const raw = localStorage.getItem('artigos');
    if(raw) return JSON.parse(raw);
  }catch(_){ }
  return [];
})();

// Add article and persist, then notify UI
window.addArticle = function(article){
  try{
    // prevent duplicates by reference
    const ref = (article && (article.ref||'')+'').trim();
    if(!ref) return false;
    const exists = (window.artigosData || []).some(a => (a.ref||'') === ref);
    if(exists) return false;
    article.createdAt = article.createdAt || new Date().toISOString();
    window.artigosData.push(article);
    localStorage.setItem('artigos', JSON.stringify(window.artigosData));
  }catch(e){ console.error('Erro ao guardar artigo', e); return false; }
  // notify open windows
  try{ if(typeof window.refreshProcuraArticles === 'function') window.refreshProcuraArticles(); }catch(_){ }
  try{ if(typeof window.refreshArtigosTables === 'function') window.refreshArtigosTables(); }catch(_){ }
  return true;
};

// Refresh any open Procura de Artigo windows (rebuild their table body)
window.refreshProcuraArticles = function(){
  try{
    document.querySelectorAll('.window').forEach(winEl => {
      const table = winEl.querySelector('#procura-articles-table');
      if(table){
        const tbody = table.querySelector('tbody') || table.appendChild(document.createElement('tbody'));
        tbody.innerHTML = window.artigosData.map(a => {
          const price = (typeof a.precoVenda1 === 'number') ? a.precoVenda1.toFixed(2) : (a.precoVenda1 ? String(a.precoVenda1) : '');
          const marcas = (a.marcas||[]).map(id => (window.marcasData||[]).find(m=>m.id===id)?.name || id).filter(Boolean).join(', ');
          const fornecedor = a.fornecedorNome || '';
          return `<tr><td>${(a.ref||'')}</td><td>${(a.name||'')}</td><td>${price}</td><td>${marcas}</td><td>${fornecedor}</td></tr>`;
        }).join('');
        // wire dblclick handlers for each row so double-click opens the artigo and closes this procura window
        try{ wireProcuraRowHandlers(winEl); }catch(_){ }
      }
    });
  }catch(e){ console.error('Erro ao refreshProcuraArticles', e); }
};

// Refresh any general artigos table(s) if present
window.refreshArtigosTables = function(){
  try{
    // look for table with id 'artigos-table' or class 'artigos-table'
    const tables = Array.from(document.querySelectorAll('#artigos-table, table.artigos-table'));
    tables.forEach(table => {
      const tbody = table.querySelector('tbody') || table.appendChild(document.createElement('tbody'));
      tbody.innerHTML = window.artigosData.map(a => {
        const price = (typeof a.precoVenda1 === 'number') ? a.precoVenda1.toFixed(2) : (a.precoVenda1 ? String(a.precoVenda1) : '');
        const marcas = (a.marcas||[]).map(id => (window.marcasData||[]).find(m=>m.id===id)?.name || id).filter(Boolean).join(', ');
        return `<tr><td>${(a.ref||'')}</td><td>${(a.name||'')}</td><td>${price}</td><td>${marcas}</td></tr>`;
      }).join('');
    });
  }catch(e){ console.error('Erro ao refreshArtigosTables', e); }
};

// Open a focused Artigo window (Ficha de Artigo) filled with article data
function openArtigoWindow(article){
  try{
    const a = article || {};
    const content = `
      <div style="height:100%;display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #eef2ff;background:#fff;">
          <div style="display:flex;gap:12px;align-items:center;">
            <div style="font-weight:700;font-size:14px">Artigo</div>
            <div style="color:#6b7280;font-size:13px">${(a.ref||'')}</div>
          </div>
          <div><button class="artigo-btn" id="artigo-open-close">Fechar</button></div>
        </div>
        <div style="padding:12px;flex:1;overflow:auto;background:#f8fafc;">
          <div style="background:#fff;border:1px solid #e6eef7;border-radius:8px;padding:12px;max-width:820px;">
            <div style="display:grid;grid-template-columns:120px 1fr;gap:10px 12px;align-items:center;margin-bottom:8px;">
              <label style="font-size:12px;color:#374151">Referência</label>
              <div style="font-weight:700">${(a.ref||'')}</div>
              <label style="font-size:12px;color:#374151">Nome / Descrição</label>
              <div>${(a.name||'')}</div>
              <label style="font-size:12px;color:#374151">Criado em</label>
              <div>${(a.createdAt? (new Date(a.createdAt)).toLocaleString() : '')}</div>
            </div>
            <hr style="border:none;border-top:1px solid #eef2ff;margin:10px 0;" />
            <div style="font-size:13px;color:#0f172a;font-weight:600;margin-bottom:6px">Detalhes</div>
            <div style="color:#64748b;font-size:13px;">Sem mais campos (demo). Pode editar esta ficha para mostrar Marca/Modelo/Preços/Stock conforme necessário.</div>
          </div>
        </div>
      </div>
    `;

    const winId = openWindow({ title: `📝 Artigo ${a.ref||''}`, content, width: 760, height: 420, left: 120, top: 80 });
    const winEl = windows[winId];
    if(!winEl) return winId;
    // wire close
    try{ const closeBtn = winEl.querySelector('#artigo-open-close'); if(closeBtn) closeBtn.addEventListener('click', ()=> winEl.remove()); }catch(_){ }
    return winId;
  }catch(e){ console.error('Erro ao abrir ficha artigo', e); }
}

// Wire double-click handlers inside a Procura window so dblclick opens artigo
function wireProcuraRowHandlers(winEl){
  if(!winEl) return;
  const table = winEl.querySelector('#procura-articles-table');
  if(!table) return;
  const tbody = table.querySelector('tbody');
  if(!tbody) return;
  Array.from(tbody.querySelectorAll('tr')).forEach(row => {
    // remove existing dblclick to avoid double-binding
    row.ondblclick = null;
    row.addEventListener('dblclick', function onDbl(){
      try{
        const sku = (row.children[0] && row.children[0].textContent || '').trim();
        const nome = (row.children[1] && row.children[1].textContent || '').trim();
        let artigo = null;
        try{ artigo = (window.artigosData || []).find(a=> (a.ref||'') === sku); }catch(_){ }
        if(!artigo) artigo = { ref: sku, name: nome };
        // open the full Artigos editor window populated with this article and close procura
        try{ openArtigosEditorWindow(artigo); }catch(e){ console.error('Erro abrindo artigo via dblclick', e); }
        // close procura window
        try{ winEl.remove(); }catch(_){ }
      }catch(e){ console.error('Erro no dblclick handler procura', e); }
    });
  });
}

// Open the full Artigos editor window and populate fields from an article object
function openArtigosEditorWindow(article){
  try{
    // If there's already an open Artigos editor window (same DOM with #artigo-cod), fill it instead of opening a new one
    try{
      const existing = Array.from(document.querySelectorAll('.window')).find(w => w.querySelector && w.querySelector('#artigo-cod'));
      if(existing){
        // bring to front
        try{ existing.style.zIndex = ++zIndexCounter; }catch(_){ }
        try{
          // populate full form using helper so marcas/modelos, imagens, preços and observações are filled
          // activate Dados Artigo tab if available, then populate marcas/models, then fill the form
          try{ const defBtn = existing.querySelector('.artigo-menu-btn[onclick*="dados"]') || existing.querySelector('.artigo-menu-btn'); if(defBtn) changeArtigoContent(defBtn, 'dados'); }catch(_){ }
          try{ if(typeof window.updateDadosArtigoBrandLists === 'function') window.updateDadosArtigoBrandLists(); }catch(_){ }
          try{ if(typeof window.populateArticleForm === 'function') window.populateArticleForm(existing, article); else {
            const codEl = existing.querySelector('#artigo-cod'); if(codEl) codEl.value = (article && article.ref) ? article.ref : '';
            const nomeEl = existing.querySelector('#artigo-nome'); if(nomeEl) nomeEl.value = (article && article.name) ? article.name : '';
            try{ if(article && article.ref) existing.dataset.currentArticleRef = article.ref; }catch(_){ }
          } }catch(_){ }
        }catch(e){ console.error('Erro a popular janela Artigos existente', e); }
        return;
      }

    }catch(e){ console.error('Erro ao procurar janela Artigos existente', e); }

    // Try to reuse existing Artigos button if present so we keep wiring consistent
    const fileBtn = document.querySelector('.file-btn[data-name="Artigos"]');
    if(fileBtn){
      // trigger the same code path that opens the Artigos window
      fileBtn.click();
      // after window is created, populate fields
      setTimeout(()=>{
        const lastId = 'win-' + winCounter;
        const winEl = windows[lastId];
        if(!winEl) return;
        try{
          // open Dados Artigo tab, refresh marcas/models, then populate the full form
          try{ const defBtn = winEl.querySelector('.artigo-menu-btn[onclick*="dados"]') || winEl.querySelector('.artigo-menu-btn'); if(defBtn) changeArtigoContent(defBtn, 'dados'); }catch(_){ }
          try{ if(typeof window.updateDadosArtigoBrandLists === 'function') window.updateDadosArtigoBrandLists(); }catch(_){ }
          try{ if(typeof window.populateArticleForm === 'function') window.populateArticleForm(winEl, article); else { const codEl = winEl.querySelector('#artigo-cod'); if(codEl) codEl.value = article.ref || ''; const nomeEl = winEl.querySelector('#artigo-nome'); if(nomeEl) nomeEl.value = article.name || ''; try{ if(article && article.ref) winEl.dataset.currentArticleRef = article.ref; }catch(_){ } } }catch(_){ }
        }catch(e){ console.error('Erro a popular janela Artigos', e); }
      }, 80);
      return;
    }

    // Fallback: if no file button exists, open a simple Artigos window and populate
    const artigo = article || {};
    const artigosContent = `
      <div style="height: 100%; display: flex; flex-direction: column;">
        <div class="artigos-toolbar">
          <button class="artigo-btn" title="Criar Novo Artigo">
            <span class="icon">➕</span>
            <span class="label">Criar</span>
          </button>
          <button class="artigo-btn" title="Procurar Artigo">
            <span class="icon">🔍</span>
            <span class="label">Procurar</span>
          </button>
          <button class="artigo-btn" title="Alterar Artigo">
            <span class="icon">✏️</span>
            <span class="label">Alterar</span>
          </button>
          <div style="flex:1"></div>
        </div>
        <div class="artigo-info">
              <div class="artigo-ref">
                <label>CÓD. ARTIGO</label>
                <input id="artigo-cod" type="text" placeholder="Ex: A100" />
              </div>
              <div class="artigo-nome">
                <label>NOME/DESCRIÇÃO</label>
                <input id="artigo-nome" type="text" placeholder="Descrição do artigo" />
              </div>
        </div>
        <div class="artigo-content-area" style="flex: 1; background: #f8fafc; padding: 20px;">
          <p style="color: #64748b; text-align: center; margin-top: 50px;">Dados Artigo</p>
        </div>
      </div>
    `;
    const id = openWindow({ title: `📝 Artigo ${artigo.ref||''}`, content: artigosContent, width: 800, height: 600 });
    const winEl = windows[id];
    if(!winEl) return id;
    setTimeout(()=>{
      try{
        try{ if(typeof window.populateArticleForm === 'function') window.populateArticleForm(winEl, artigo); else {
          const codEl = winEl.querySelector('#artigo-cod'); const nomeEl = winEl.querySelector('#artigo-nome'); if(codEl) codEl.value = artigo.ref || ''; if(nomeEl) nomeEl.value = artigo.name || '';
          try{ if(artigo && artigo.ref) winEl.dataset.currentArticleRef = artigo.ref; }catch(_){ }
        } }catch(_){ }
        // wire procurar button
        const procurarBtn = winEl.querySelector('.artigos-toolbar .artigo-btn[title="Procurar Artigo"]');
        if(procurarBtn) procurarBtn.addEventListener('click', () => { try{ openProcuraArtigoWindow(); }catch(e){ console.error(e); } });
        // wire alterar button for this minimal window
        try{
          const alterarBtn = winEl.querySelector('.artigos-toolbar .artigo-btn[title="Alterar Artigo"]');
                if(alterarBtn){
            alterarBtn.addEventListener('click', () => {
              try{
                const cod = (winEl.querySelector('#artigo-cod')?.value||'').trim();
                if(!cod){ showToast('Insira o CÓD. ARTIGO antes de alterar', 'error'); return; }
                const originalRef = winEl.dataset.currentArticleRef || '';
                let idx = -1;
                if(originalRef) idx = (window.artigosData || []).findIndex(a=> (a.ref||'') === originalRef);
                if(idx === -1) idx = (window.artigosData || []).findIndex(a=> (a.ref||'') === cod);
                if(idx === -1){ showToast('Artigo não encontrado para alterar', 'error'); return; }
                const art = window.artigosData[idx];
                // read full form and merge
                const newData = (typeof window.readArticleForm === 'function') ? window.readArticleForm(winEl) : { ref: cod, name: (winEl.querySelector('#artigo-nome')?.value||'').trim() };
                if(newData){ const created = art.createdAt; Object.assign(art, newData); if(created) art.createdAt = created; }
                localStorage.setItem('artigos', JSON.stringify(window.artigosData));
                winEl.dataset.currentArticleRef = art.ref || cod;
                try{ if(typeof window.refreshProcuraArticles === 'function') window.refreshProcuraArticles(); }catch(_){ }
                try{ if(typeof window.refreshArtigosTables === 'function') window.refreshArtigosTables(); }catch(_){ }
                try{ const flash = document.createElement('div'); flash.textContent = 'Artigo alterado'; flash.style.position='fixed'; flash.style.right='20px'; flash.style.top='20px'; flash.style.background='#059669'; flash.style.color='#fff'; flash.style.padding='8px 12px'; flash.style.borderRadius='6px'; flash.style.zIndex=99999; document.body.appendChild(flash); setTimeout(()=>flash.remove(),1200); }catch(_){ }
              }catch(e){ console.error('Erro alterar (minimal)', e); }
            });
          }
        }catch(_){ }
        // wire eliminar button for this minimal window
        try{
          const eliminarBtn = winEl.querySelector('.artigos-toolbar .artigo-btn[title="Eliminar Artigo"]');
          if(eliminarBtn){
            eliminarBtn.addEventListener('click', ()=>{
              try{
                const cod = (winEl.querySelector('#artigo-cod')?.value||'').trim();
                const originalRef = winEl.dataset.currentArticleRef || '';
                let idx = -1;
                if(originalRef) idx = (window.artigosData || []).findIndex(a=> (a.ref||'') === originalRef);
                if(idx === -1 && cod) idx = (window.artigosData || []).findIndex(a=> (a.ref||'') === cod);
                if(idx === -1){ showToast('Referência não encontrada: não existe artigo para eliminar', 'error'); return; }
                window.artigosData.splice(idx,1);
                try{ localStorage.setItem('artigos', JSON.stringify(window.artigosData)); }catch(_){ }
                try{ winEl.dataset.currentArticleRef = ''; winEl.querySelector('#artigo-cod').value = ''; winEl.querySelector('#artigo-nome').value = ''; }catch(_){ }
                try{ if(typeof window.refreshProcuraArticles === 'function') window.refreshProcuraArticles(); }catch(_){ }
                try{ if(typeof window.refreshArtigosTables === 'function') window.refreshArtigosTables(); }catch(_){ }
                try{ const flash = document.createElement('div'); flash.textContent = 'Artigo eliminado'; flash.style.position='fixed'; flash.style.right='20px'; flash.style.top='20px'; flash.style.background='#dc2626'; flash.style.color='#fff'; flash.style.padding='8px 12px'; flash.style.borderRadius='6px'; flash.style.zIndex=99999; document.body.appendChild(flash); setTimeout(()=>flash.remove(),1400); }catch(_){ }
              }catch(e){ console.error('Erro eliminar minimal', e); }
            });
          }
        }catch(_){ }
      }catch(e){ console.error('Erro eventual a popular janela Artigos', e); }
    }, 60);
    return id;
  }catch(e){ console.error('Erro em openArtigosEditorWindow', e); }
}

/* Elementos principais */
// removed #workspace from markup; use the global window container (falls back to document.body)
const windowContainer = document.getElementById('window-container') || document.body;
const toolsListEl = document.getElementById('tools-list');
const toolsInput = document.getElementById('tools-input');
const settingsModal = document.getElementById('settings-modal');
const taskbar = document.getElementById('taskbar');
const progressFill = document.getElementById('progress-fill');

let zIndexCounter = 10;
let winCounter = 0;
const windows = {};

// Simple toast helper used across the app to replace native alert()
function showToast(message, type = 'info', timeout = 1400){
  try{
    const id = '__app_toast_container';
    let container = document.getElementById(id);
    if(!container){
      container = document.createElement('div');
      container.id = id;
      container.style.position = 'fixed';
      container.style.right = '20px';
      container.style.top = '20px';
      container.style.zIndex = 99999;
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'flex-end';
      container.style.gap = '8px';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.color = '#fff';
    toast.style.padding = '8px 12px';
    toast.style.borderRadius = '6px';
    toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
    toast.style.maxWidth = '360px';
    toast.style.wordBreak = 'break-word';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-6px)';
    toast.style.transition = 'opacity 160ms ease, transform 200ms ease';
    switch((type||'').toLowerCase()){
      case 'success': toast.style.background = '#16a34a'; break;
      case 'error': toast.style.background = '#dc2626'; break;
      case 'warn': toast.style.background = '#f59e0b'; break;
      case 'info': default: toast.style.background = '#0ea5e9'; break;
    }
    container.appendChild(toast);
    // animate in
    setTimeout(()=>{ toast.style.opacity='1'; toast.style.transform='translateY(0)'; }, 10);
    // remove after timeout
    setTimeout(()=>{ try{ toast.style.opacity='0'; toast.style.transform='translateY(-6px)'; setTimeout(()=>toast.remove(),200); }catch(_){ try{ toast.remove(); }catch(__){} } }, timeout);
    return toast;
  }catch(e){ try{ console.error('showToast error', e); }catch(_){ } }
}

// Read article form fields from an Artigos window element and return an article object
window.readArticleForm = function(winEl){
  try{
    const article = {};
    // core
    article.ref = (winEl.querySelector('#referencia')?.value || winEl.querySelector('#artigo-cod')?.value || '').trim();
    article.name = (winEl.querySelector('#artigo-nome')?.value || '').trim();
    // meta
    article.tipo = winEl.querySelector('#tipo-artigo')?.value || '';
    article.activo = winEl.querySelector('#activo')?.value || '';
    article.dataActivo = winEl.querySelector('#data-activo')?.value || '';
    // marcas
    const marcaPanel = winEl.querySelector('#marca-ms-panel');
    if(marcaPanel) article.marcas = Array.from(marcaPanel.querySelectorAll('input[type=checkbox]:checked')).map(c=> c.dataset.id || c.value || '');
    else article.marcas = [];
    // modelos
    const modeloPanel = winEl.querySelector('#modelo-ms-panel');
    if(modeloPanel) article.modelos = Array.from(modeloPanel.querySelectorAll('input[type=checkbox]:checked')).map(c=> ({ name: c.dataset.name || c.value || '', brand: c.dataset.brand || '' }));
    else article.modelos = [];
    // fornecedor
    article.fornecedorNum = winEl.querySelector('#num-fornecedor')?.value || '';
    article.fornecedorNome = winEl.querySelector('#fornecedor-nome')?.value || '';
    article.codArtFornec = winEl.querySelector('#cod-art-fornec')?.value || '';
    // images (fallback: store any uploaded images tracked on the window element)
    article.images = Array.isArray(winEl.__uploadedImages) ? winEl.__uploadedImages.slice() : [];
    // preços e stocks
    article.precoVenda1 = parseFloat(winEl.querySelector('#preco-venda-1')?.value || 0) || 0;
    article.stockDisponivel = parseFloat(winEl.querySelector('#stock-disponivel')?.value || 0) || 0;
    article.qtdEncCli = parseFloat(winEl.querySelector('#qtd-enc-cli')?.value || 0) || 0;
    article.qtdEncForn = parseFloat(winEl.querySelector('#qtd-enc-forn')?.value || 0) || 0;
    article.stockPrevisto = parseFloat(winEl.querySelector('#stock-previsto')?.value || 0) || 0;
    // observações
    article.observacoes = winEl.querySelector('#observacoes-texto')?.value || '';
    article.observacoesMostrarVenda = !!winEl.querySelector('#observacoes-mostrar-venda')?.checked;
    article.observacoesNote = winEl.querySelector('#observacoes-note')?.value || '';
    return article;
  }catch(e){ console.error('readArticleForm', e); return null; }
};

// Populate an Artigos window form with an article object
window.populateArticleForm = function(winEl, article){
  try{
    if(!winEl || !article) return;
    try{ const codEl = winEl.querySelector('#artigo-cod'); if(codEl) codEl.value = article.ref || ''; }catch(_){ }
    try{ const nomeEl = winEl.querySelector('#artigo-nome'); if(nomeEl) nomeEl.value = article.name || ''; }catch(_){ }
    try{ const refEl = winEl.querySelector('#referencia'); if(refEl) refEl.value = article.ref || ''; }catch(_){ }
    try{ const tipoEl = winEl.querySelector('#tipo-artigo'); if(tipoEl) tipoEl.value = article.tipo || tipoEl.value || ''; }catch(_){ }
    try{ const activoEl = winEl.querySelector('#activo'); if(activoEl) activoEl.value = article.activo || activoEl.value || ''; }catch(_){ }
    try{ const dataAct = winEl.querySelector('#data-activo'); if(dataAct) dataAct.value = article.dataActivo || dataAct.value || ''; }catch(_){ }
    // marcas
    try{
      const marcaPanel = winEl.querySelector('#marca-ms-panel');
      if(marcaPanel && Array.isArray(article.marcas)){
        marcaPanel.querySelectorAll('input[type=checkbox]').forEach(cb=> cb.checked = false);
        article.marcas.forEach(id => { const cb = marcaPanel.querySelector('input[data-id="'+id+'"]'); if(cb) cb.checked = true; });
        // update toggle text if present
        const marcaToggle = winEl.querySelector('#marca-ms-toggle'); if(marcaToggle){ const checked = Array.from(marcaPanel.querySelectorAll('input[type=checkbox]:checked')).map(x=> x.dataset.id); if(checked.length===0) marcaToggle.textContent='Selecionar marcas ▾'; else marcaToggle.textContent = checked.map(id=> (window.marcasData||[]).find(x=>x.id===id)?.name||id).join(', ') + ' ▾'; }
      }
    }catch(_){ }
    // modelos
    try{
      const modeloPanel = winEl.querySelector('#modelo-ms-panel');
      if(modeloPanel){
        modeloPanel.querySelectorAll('input[type=checkbox]').forEach(cb=> cb.checked = false);
        if(Array.isArray(article.modelos)){
          article.modelos.forEach(m=>{
            if(!m) return;
            const selector = m.brand ? ('input[data-name="'+(m.name||'')+'"][data-brand="'+m.brand+'"]') : ('input[data-name="'+(m.name||'')+'"]');
            const cb = modeloPanel.querySelector(selector);
            if(cb) cb.checked = true;
          });
          const modeloToggle = winEl.querySelector('#modelo-ms-toggle');
          if(modeloToggle){
            const checked = Array.from(modeloPanel.querySelectorAll('input[type=checkbox]:checked')).map(x=> x.dataset.name);
            modeloToggle.textContent = checked.length ? checked.join(', ') + ' ▾' : modeloToggle.textContent;
          }
        }
      }
    }catch(_){ }
    // fornecedor
    try{ const numF = winEl.querySelector('#num-fornecedor'); if(numF) numF.value = article.fornecedorNum || ''; }catch(_){ }
    try{ const forn = winEl.querySelector('#fornecedor-nome'); if(forn) forn.value = article.fornecedorNome || ''; }catch(_){ }
    try{ const codF = winEl.querySelector('#cod-art-fornec'); if(codF) codF.value = article.codArtFornec || ''; }catch(_){ }
    // imagens
    try{ winEl.__uploadedImages = Array.isArray(article.images) ? article.images.slice() : []; }catch(_){ }
    // preços/stocks
    try{ const p1 = winEl.querySelector('#preco-venda-1'); if(p1) p1.value = article.precoVenda1 || 0; }catch(_){ }
    try{ const sd = winEl.querySelector('#stock-disponivel'); if(sd) sd.value = article.stockDisponivel || 0; }catch(_){ }
    try{ const qec = winEl.querySelector('#qtd-enc-cli'); if(qec) qec.value = article.qtdEncCli || 0; }catch(_){ }
    try{ const qef = winEl.querySelector('#qtd-enc-forn'); if(qef) qef.value = article.qtdEncForn || 0; }catch(_){ }
    try{ const sp = winEl.querySelector('#stock-previsto'); if(sp) sp.value = article.stockPrevisto || 0; }catch(_){ }
    // observações
    try{ const obs = winEl.querySelector('#observacoes-texto'); if(obs) obs.value = article.observacoes || ''; }catch(_){ }
    try{ const obsShow = winEl.querySelector('#observacoes-mostrar-venda'); if(obsShow) obsShow.checked = !!article.observacoesMostrarVenda; }catch(_){ }
    try{ const obsNote = winEl.querySelector('#observacoes-note'); if(obsNote) obsNote.value = article.observacoesNote || ''; }catch(_){ }
    // mark the window dataset currentArticleRef
    try{ if(article.ref) winEl.dataset.currentArticleRef = article.ref; }catch(_){ }
  }catch(e){ console.error('populateArticleForm', e); }
};

// Carregar ferramentas (localStorage)
const defaultTools = ['Facturação','Compras','Clientes','Fornecedores','Artigos','Stocks'];
function loadTools(){
  // defensive: only operate if both elements exist
  if(!toolsListEl || !toolsInput) return;
  const raw = localStorage.getItem('modern_tools');
  const list = raw ? raw.split(',').map(s=>s.trim()).filter(Boolean) : defaultTools;
  toolsListEl.innerHTML = '';
  for(const t of list){
    const li = document.createElement('li');
    li.textContent = t;
    toolsListEl.appendChild(li);
  }
  toolsInput.value = list.join(',');
}
if(toolsListEl && toolsInput) loadTools();

// Abertura/fecho do painel esquerdo (só se existir o botão)
const toggleLeftBtn = document.getElementById('toggle-left');
if(toggleLeftBtn){
  toggleLeftBtn.addEventListener('click', () => {
    document.getElementById('left-column').classList.toggle('hidden');
  });
}

const rawCloseSettings = document.getElementById('close-settings');
if(rawCloseSettings){ rawCloseSettings.addEventListener('click', () => settingsModal.classList.add('hidden')); }
const rawCancelSettings = document.getElementById('cancel-settings');
if(rawCancelSettings){ rawCancelSettings.addEventListener('click', () => settingsModal.classList.add('hidden')); }
// Modal definições (listeners wired later with guards)
// Settings modal controls: open as a non-draggable overlay window
function openSettingsWindow(){
  // show modal overlay (settings modal in DOM)
  settingsModal.classList.remove('hidden');
  // Make sure settings modal cannot be dragged by preventing pointer events on window container
  // and ensure it sits above windows
  const wm = document.getElementById('window-container');
  if(wm) wm.style.pointerEvents = 'none';
}
function closeSettingsWindow(){
  settingsModal.classList.add('hidden');
  const wm = document.getElementById('window-container');
  if(wm) wm.style.pointerEvents = '';
}

const menuConfigBtn = document.getElementById('menu-config');
if(menuConfigBtn){
  menuConfigBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    // open a floating settings window as well as the modal
    openSettingsFloating();
  });
}

// profile / account button
const profileBtn = document.getElementById('menu-profile');
if(profileBtn){
  profileBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openAccountWindow();
  });
}

// close button inside settings
const closeSettingsBtn = document.getElementById('close-settings');
if(closeSettingsBtn){
  closeSettingsBtn.addEventListener('click', () => closeSettingsWindow());
}

// if there are save/cancel buttons (not always present in new modal), wire them defensively
const saveSettingsBtn = document.getElementById('save-settings');
if(saveSettingsBtn){
  saveSettingsBtn.addEventListener('click', () => {
    if(toolsInput) localStorage.setItem('modern_tools', toolsInput.value);
    loadTools();
    closeSettingsWindow();
  });
}
const cancelSettingsBtn = document.getElementById('cancel-settings');
if(cancelSettingsBtn){
  cancelSettingsBtn.addEventListener('click', () => closeSettingsWindow());
}

// Theme / Appearance handlers (swatches + dark mode)
(function setupAppearanceControls(){
  try{
    const colorMap = {
      blue: '#2563eb',
      green: '#16a34a',
      red: '#ef4444',
      yellow: '#f59e0b',
      orange: '#f97316',
      purple: '#7c3aed',
      pink: '#ec4899'
    };

    function shadeColor(hex, percent) {
      // simple shade function: darken or lighten by percent (-100..100)
      try{
        const c = hex.replace('#',''); const num = parseInt(c,16);
        let r = (num >> 16) + Math.round(255 * (percent/100));
        let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent/100));
        let b = (num & 0x0000FF) + Math.round(255 * (percent/100));
        r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
        return '#' + ( (1<<24) + (r<<16) + (g<<8) + b ).toString(16).slice(1);
      }catch(e){ return hex; }
    }

    function applyThemeColor(name){
      try{
        const hex = colorMap[name] || colorMap.blue;
        document.documentElement.style.setProperty('--accent', hex);
        document.documentElement.style.setProperty('--accent-2', shadeColor(hex, -18));
        // mark active swatch for any swatches currently in DOM
        document.querySelectorAll('.theme-swatch').forEach(s => s.classList.toggle('active', s.dataset.color === name));
      }catch(_){ }
    }

    function setDarkToggleState(on){
      try{
        if(on) document.body.classList.add('theme-dark'); else document.body.classList.remove('theme-dark');
        // sync any toggle inputs in the DOM
        document.querySelectorAll('#app-dark-mode-toggle').forEach(i=>{ try{ i.checked = !!on; }catch(_){} });
        try{ localStorage.setItem('appDark', on ? '1' : '0'); }catch(_){ }
      }catch(_){ }
    }

    // delegated click handler for future .theme-swatch elements
    document.addEventListener('click', (e) => {
      const s = e.target.closest('.theme-swatch');
      if(!s) return;
      const name = s.dataset.color;
      if(!name) return;
      try{ localStorage.setItem('appTheme', name); }catch(_){ }
      applyThemeColor(name);
    });

    // delegated change handler for dark-mode checkbox(s)
    document.addEventListener('change', (e) => {
      const t = e.target;
      if(t && t.id === 'app-dark-mode-toggle'){
        setDarkToggleState(!!t.checked);
      }
    });

    // apply persisted settings on load (affects both static and future dynamic elements)
    try{
      const saved = localStorage.getItem('appTheme');
      if(saved && colorMap[saved]) applyThemeColor(saved); else applyThemeColor('blue');
      const darkSaved = localStorage.getItem('appDark');
      setDarkToggleState(darkSaved === '1');
    }catch(_){ }
  }catch(e){ console.error('Erro ao configurar Appearance controls', e); }

})();

// Tabs direitas
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.data-panel').forEach(p=>p.classList.add('hidden'));
    const target = document.getElementById(tab.dataset.target);
    if(target) target.classList.remove('hidden');
    
    // Special handling for POS tab
    if(tab.dataset.target === 'panel-pos'){
      console.log('POS tab clicked via tab system');
      // Initialize POS if not already done
      if (!posSystem) {
        console.log('Initializing POS system from tab');
        posSystem = new POSSystem();
      }
      console.log('Rendering POS products from tab');
      posSystem.renderProducts();
    }
    
    // update toolbar visibility depending on active panel
    try{ updateToolbarVisibility(); }catch(_){}
  });
});

// Show/hide the tables toolbar when dashboard is active
function updateToolbarVisibility(){
  const toolbar = document.querySelector('.tables-toolbar');
  if(!toolbar) return;
  const activeTab = document.querySelector('.tab.active');
  if(activeTab && activeTab.dataset.target === 'panel-dashboard'){
    toolbar.classList.add('hidden');
  } else {
    toolbar.classList.remove('hidden');
  }
}

// File buttons abrem janelas / trocam tabelas
document.querySelectorAll('.file-btn').forEach(btn=>{
  btn.addEventListener('click', () => {
    const name = btn.dataset.name;
    const icon = btn.dataset.icon || '';
    if(name){
      // Special handling for POS - show overlay
      if(name === 'POS'){
        console.log('POS button clicked - showing overlay');
        
        // Show POS overlay
        const posOverlay = document.getElementById('pos-overlay');
        console.log('POS overlay found:', posOverlay);
        
        if(!posOverlay) {
          console.error('POS overlay not found in DOM!');
          return;
        }
        
        posOverlay.classList.remove('hidden');
        console.log('POS overlay made visible');
        
        // Initialize POS if not already done
        if (!posSystem) {
          console.log('Initializing POS system');
          posSystem = new POSSystem();
        }
        console.log('Rendering POS products');
        posSystem.renderProducts();
        return;
      }
      
      // Special handling for Artigos - show custom design
      if(name === 'Artigos'){
        const artigosContent = `
          <div style="height: 100%; display: flex; flex-direction: column;">
            <div class="artigos-toolbar">
              <button class="artigo-btn" title="Criar Novo Artigo">
                <span class="icon">➕</span>
                <span class="label">Criar</span>
              </button>
              <button class="artigo-btn" title="Procurar Artigo">
                <span class="icon">🔍</span>
                <span class="label">Procurar</span>
              </button>
              <button class="artigo-btn" title="Alterar Artigo">
                <span class="icon">✏️</span>
                <span class="label">Alterar</span>
              </button>
              <button class="artigo-btn" title="Eliminar Artigo">
                <span class="icon">🗑️</span>
                <span class="label">Eliminar</span>
              </button>
              <button class="artigo-btn" title="Imprimir Lista">
                <span class="icon">🖨️</span>
                <span class="label">Imprimir</span>
              </button>
              <button class="artigo-btn" title="Exportar/Importar Dados">
                <span class="icon">📤</span>
                <span class="label">Exportar/Importar</span>
              </button>
              <button class="artigo-btn" title="Atualizar Lista">
                <span class="icon">🔄</span>
                <span class="label">Atualizar</span>
              </button>
            </div>
            <div class="artigo-info">
                  <div class="artigo-ref">
                    <label>CÓD. ARTIGO</label>
                    <input id="artigo-cod" type="text" placeholder="Ex: A100" />
                  </div>
                  <div class="artigo-nome">
                    <label>NOME/DESCRIÇÃO</label>
                    <input id="artigo-nome" type="text" placeholder="Descrição do artigo" />
                  </div>
            </div>
            <div class="artigos-menu-tabs">
              <button class="artigo-menu-btn active" onclick="changeArtigoContent(this, 'dados')">
                <span class="icon">📋</span>
                <span class="label">Dados Artigo</span>
              </button>
              <button class="artigo-menu-btn" onclick="changeArtigoContent(this, 'clientes')">
                <span class="icon">👥</span>
                <span class="label">Clientes/Fornecedores</span>
              </button>
              <button class="artigo-menu-btn" onclick="changeArtigoContent(this, 'precos')">
                <span class="icon">💰</span>
                <span class="label">Preços</span>
              </button>
              <button class="artigo-menu-btn" onclick="changeArtigoContent(this, 'lotes')">
                <span class="icon">📦</span>
                <span class="label">Lotes</span>
              </button>
              <button class="artigo-menu-btn" onclick="changeArtigoContent(this, 'graficos')">
                <span class="icon">📊</span>
                <span class="label">Gráficos</span>
              </button>
              <button class="artigo-menu-btn" onclick="changeArtigoContent(this, 'historico')">
                <span class="icon">📈</span>
                <span class="label">Histórico</span>
              </button>
              <button class="artigo-menu-btn" onclick="changeArtigoContent(this, 'stock')">
                <span class="icon">📋</span>
                <span class="label">Stock</span>
              </button>
            </div>
            <div class="artigo-content-area" style="flex: 1; background: #f8fafc; padding: 20px;">
              <p style="color: #64748b; text-align: center; margin-top: 50px;">Selecione um menu acima para ver o conteúdo</p>
            </div>
          </div>
        `;
        
        openWindow({
          title: `${icon} ${name}`, 
          content: artigosContent,
          width: 800,
          height: 600
        });
        // After the window is created, auto-open the Dados Artigo tab using the existing changeArtigoContent handler
        try{
          const lastId = 'win-' + winCounter; // openWindow increments winCounter
          const winEl = windows[lastId];
          if(winEl){
            setTimeout(()=>{
              const defaultBtn = winEl.querySelector('.artigo-menu-btn.active') || winEl.querySelector('.artigo-menu-btn[onclick*="dados"]');
              if(defaultBtn){
                try{ window.changeArtigoContent(defaultBtn, 'dados'); }catch(e){ try{ defaultBtn.click(); }catch(_){} }
              }
            }, 40);
          }
        }catch(_){ }
            // wire the procurar, criar and alterar buttons inside the artigos window
        try{
          const lastId = 'win-' + winCounter; // openWindow increments winCounter
          const winEl = windows[lastId];
          if(winEl){
            const procurarBtn = winEl.querySelector('.artigos-toolbar .artigo-btn[title="Procurar Artigo"]');
            if(procurarBtn){
              procurarBtn.addEventListener('click', () => { try{ openProcuraArtigoWindow(); }catch(e){ console.error(e); } });
            }

            // wire the Criar button to add a new article using the header inputs
            try{
              const criarBtn = winEl.querySelector('.artigos-toolbar .artigo-btn[title="Criar Novo Artigo"]');
              if(criarBtn){
                criarBtn.addEventListener('click', () => {
                  try{
                    const codEl = winEl.querySelector('#artigo-cod');
                    const nomeEl = winEl.querySelector('#artigo-nome');
                    const cod = (codEl && (codEl.value||'').trim()) || '';
                    const nome = (nomeEl && (nomeEl.value||'').trim()) || '';
                    if(!cod){ showToast('Insira o CÓD. ARTIGO antes de criar', 'error'); if(codEl) codEl.focus(); return; }
                    // ensure Dados Artigo panel is mounted and marcas/modelos rendered, then read full article fields
                    try{ const defBtn = winEl.querySelector('.artigo-menu-btn[onclick*="dados"]') || winEl.querySelector('.artigo-menu-btn'); if(defBtn && typeof window.changeArtigoContent === 'function'){ try{ window.changeArtigoContent(defBtn, 'dados'); }catch(_){ } } }catch(_){ }
                    try{ if(typeof window.updateDadosArtigoBrandLists === 'function') window.updateDadosArtigoBrandLists(); }catch(_){ }
                    // read full article fields from the form (Dados Artigo) if available
                    let article = null;
                    try{ article = (typeof window.readArticleForm === 'function') ? window.readArticleForm(winEl) : { ref: cod, name: nome }; }catch(e){ console.error('Erro a ler formulário do artigo', e); article = { ref: cod, name: nome }; }
                    if(!article || !article.ref || !String(article.ref).trim()){ showToast('Insira o CÓD. ARTIGO antes de criar', 'error'); if(codEl) codEl.focus(); return; }
                    try{
                      const ok = (typeof window.addArticle === 'function') ? window.addArticle(article) : (function(){ window.artigosData = window.artigosData || []; const exists = window.artigosData.some(a=> (a.ref||'')===article.ref); if(exists) return false; window.artigosData.push(article); localStorage.setItem('artigos', JSON.stringify(window.artigosData)); return true; })();
                      if(!ok){ showToast('Já existe uma referência com esse código.', 'error'); if(codEl) codEl.focus(); return; }
                    }catch(e){ console.error('Erro ao adicionar artigo', e); }
                    // clear inputs and give focus back to code input
                    if(nomeEl) nomeEl.value = '';
                    if(codEl) { codEl.value = ''; codEl.focus(); }
                    // optional: visually notify user
                    try{ const flash = document.createElement('div'); flash.textContent = 'Artigo criado'; flash.style.position='fixed'; flash.style.right='20px'; flash.style.top='20px'; flash.style.background='#16a34a'; flash.style.color='#fff'; flash.style.padding='8px 12px'; flash.style.borderRadius='6px'; flash.style.zIndex=99999; document.body.appendChild(flash); setTimeout(()=>flash.remove(),1200); }catch(_){ }
                  }catch(e){ console.error('Erro no handler Criar', e); }
                });
              }
            }catch(_){ }

            // wire the Alterar button to update the currently loaded article
            try{
              const alterarBtn = winEl.querySelector('.artigos-toolbar .artigo-btn[title="Alterar Artigo"]');
              if(alterarBtn){
                alterarBtn.addEventListener('click', () => {
                  try{
                    const codEl = winEl.querySelector('#artigo-cod');
                    const nomeEl = winEl.querySelector('#artigo-nome');
                    const cod = (codEl && (codEl.value||'').trim()) || '';
                    const nome = (nomeEl && (nomeEl.value||'').trim()) || '';
                    if(!cod){ showToast('Insira o CÓD. ARTIGO antes de alterar', 'error'); if(codEl) codEl.focus(); return; }
                    // determine which article to update: prefer stored current ref on the window
                    const originalRef = winEl.dataset.currentArticleRef || '';
                    let idx = -1;
                    if(originalRef){ idx = (window.artigosData || []).findIndex(a=> (a.ref||'') === originalRef); }
                    if(idx === -1){ // fallback: try to find by current code
                      idx = (window.artigosData || []).findIndex(a=> (a.ref||'') === cod);
                    }
                    if(idx === -1){ showToast('Artigo não encontrado para alterar', 'error'); return; }
                    // update fields (read full form and merge)
                    try{
                      const art = window.artigosData[idx];
                      const newData = (typeof window.readArticleForm === 'function') ? window.readArticleForm(winEl) : { ref: cod, name: nome };
                      if(newData){ const created = art.createdAt; Object.assign(art, newData); if(created) art.createdAt = created; }
                      // persist
                      localStorage.setItem('artigos', JSON.stringify(window.artigosData));
                      // update marker on window
                      winEl.dataset.currentArticleRef = art.ref || cod;
                      // notify open windows
                      try{ if(typeof window.refreshProcuraArticles === 'function') window.refreshProcuraArticles(); }catch(_){ }
                      try{ if(typeof window.refreshArtigosTables === 'function') window.refreshArtigosTables(); }catch(_){ }
                      // feedback
                      try{ const flash = document.createElement('div'); flash.textContent = 'Artigo alterado'; flash.style.position='fixed'; flash.style.right='20px'; flash.style.top='20px'; flash.style.background='#059669'; flash.style.color='#fff'; flash.style.padding='8px 12px'; flash.style.borderRadius='6px'; flash.style.zIndex=99999; document.body.appendChild(flash); setTimeout(()=>flash.remove(),1200); }catch(_){ }
                    }catch(e){ console.error('Erro ao atualizar artigo', e); showToast('Erro ao actualizar artigo', 'error'); }
                  }catch(e){ console.error('Erro no handler Alterar', e); }
                });
              }
            }catch(_){ }
            // wire the Eliminar button to remove the currently loaded article
            try{
              const eliminarBtn = winEl.querySelector('.artigos-toolbar .artigo-btn[title="Eliminar Artigo"]');
              if(eliminarBtn){
                eliminarBtn.addEventListener('click', () => {
                  try{
                    const cod = (winEl.querySelector('#artigo-cod')?.value||'').trim();
                    const originalRef = winEl.dataset.currentArticleRef || '';
                    let idx = -1;
                    if(originalRef) idx = (window.artigosData || []).findIndex(a=> (a.ref||'') === originalRef);
                    if(idx === -1 && cod) idx = (window.artigosData || []).findIndex(a=> (a.ref||'') === cod);
                    if(idx === -1){ showToast('Referência não encontrada: não existe artigo para eliminar', 'error'); return; }
                    const removed = window.artigosData.splice(idx,1);
                    try{ localStorage.setItem('artigos', JSON.stringify(window.artigosData)); }catch(_){ }
                    // clear window reference and inputs
                    try{ winEl.dataset.currentArticleRef = ''; winEl.querySelector('#artigo-cod').value = ''; winEl.querySelector('#artigo-nome').value = ''; }catch(_){ }
                    // refresh open lists
                    try{ if(typeof window.refreshProcuraArticles === 'function') window.refreshProcuraArticles(); }catch(_){ }
                    try{ if(typeof window.refreshArtigosTables === 'function') window.refreshArtigosTables(); }catch(_){ }
                    // feedback
                    try{ const flash = document.createElement('div'); flash.textContent = 'Artigo eliminado'; flash.style.position='fixed'; flash.style.right='20px'; flash.style.top='20px'; flash.style.background='#dc2626'; flash.style.color='#fff'; flash.style.padding='8px 12px'; flash.style.borderRadius='6px'; flash.style.zIndex=99999; document.body.appendChild(flash); setTimeout(()=>flash.remove(),1400); }catch(_){ }
                  }catch(e){ console.error('Erro no handler Eliminar', e); }
                });
              }
            }catch(_){ }
          }
        }catch(_){ }
        return;
      }

      // Special handling for Clientes - open client form window
      if(name === 'Clientes'){
        try{
          openClientWindow();
        }catch(e){
          console.error('Erro ao abrir janela de Clientes', e);
          openWindow({title: `${icon} ${name}`, content: '<p>Clientes (erro ao montar janela)</p>'});
        }
        return;
      }

      // Special handling for Vendas - open vendas form window
      if(name === 'Vendas'){
        try{
          if(typeof openVendasWindow === 'function') openVendasWindow();
          else openWindow({title:`${icon} ${name}`, content:'<p>Vendas (em desenvolvimento)</p>'});
        }catch(e){
          console.error('Erro ao abrir janela de Vendas', e);
          openWindow({title: `${icon} ${name}`, content: '<p>Vendas (erro ao montar janela)</p>'});
        }
        return;
      }

      // Special handling for Fornecedores - open supplier form window
      if(name === 'Fornecedores'){
        try{
          openFornecedorWindow();
        }catch(e){
          console.error('Erro ao abrir janela de Fornecedores', e);
          openWindow({title: `${icon} ${name}`, content: '<p>Fornecedores (erro ao montar janela)</p>'});
        }
        return;
      }

      // Special handling for Orçamentos - open orçamento form window
      if(name === 'Orçamentos'){
        try{
          openOrcamentoWindow();
        }catch(e){
          console.error('Erro ao abrir janela de Orçamentos', e);
          openWindow({title: `${icon} ${name}`, content: '<p>Orçamentos (erro ao montar janela)</p>'});
        }
        return;
      }
      
      // abrir uma janela com o nome e o ícone do botão
      const content = `<p style="font-size:16px;padding:6px;">${name}</p>`;
      openWindow({title: `${icon} ${name}`, content});
    }
  });
});

// Função para criar janelas (arrastar + redimensionar + minimizar)
function openWindow({title='Janela', content='', width=520, height=360, left=60, top=60} = {}){
  const id = 'win-' + (++winCounter);
  const el = document.createElement('div');
  el.className = 'window';
  el.dataset.id = id;
  el.style.width = width + 'px';
  el.style.height = height + 'px';
  // position using fixed coordinates (viewport)
  el.style.left = (left + winCounter*12) + 'px';
  el.style.top = (top + winCounter*10) + 'px';
  el.style.zIndex = ++zIndexCounter;

  el.innerHTML = `
    <div class="titlebar">
      <div class="title">${title}</div>
      <div class="controls">
        <button class="win-btn btn-min" title="Minimizar">—</button>
        <button class="win-btn btn-close" title="Fechar">✕</button>
      </div>
    </div>
    <div class="content">${content}</div>
    <div class="resizer corner" title="Redimensionar"></div>
  `;

  // append to the global window container (fixed to viewport) so windows can move across the whole screen
  windowContainer.appendChild(el);
  windows[id] = el;

  // focus on mousedown
  el.addEventListener('mousedown', () => el.style.zIndex = ++zIndexCounter);

  // close
  el.querySelector('.btn-close').addEventListener('click', () => {
    if(taskbar){
      const icon = taskbar.querySelector(`.min-icon[data-win="${id}"]`);
      if(icon) icon.remove();
    }
    el.remove();
    delete windows[id];
  });

  // minimize
  el.querySelector('.btn-min').addEventListener('click', () => minimizeWindow(id));

  // drag
  const titlebar = el.querySelector('.titlebar');
  titlebar.addEventListener('mousedown', startDrag);

  // prevent dblclick maximize (no maximize)
  titlebar.addEventListener('dblclick', e => { e.preventDefault(); e.stopPropagation(); });

  // resizer
  const res = el.querySelector('.resizer.corner');
  res.addEventListener('mousedown', e => startResize(e, id));

  return id;
}

// Função global para trocar conteúdo dos artigos
window.changeArtigoContent = function(btn, section) {
  console.log('changeArtigoContent chamado:', section);
  
  const windowEl = btn.closest('.window');
  const allBtns = windowEl.querySelectorAll('.artigo-menu-btn');
  allBtns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  const contentArea = windowEl.querySelector('.artigo-content-area');
  
  if (section === 'lotes') {
    contentArea.innerHTML = `
      <div id="lotes-container" style="display: flex; height: 100%; position: relative;">
        <div id="left-panel" style="width: 60%; border: 1px solid #cbd5e1; background: white; margin-right: 5px;">
          <div style="background: #f1f5f9; padding: 8px; border-bottom: 1px solid #cbd5e1; font-weight: 600; font-size: 12px;">
            Histórico de Lotes
          </div>
          <div style="overflow-y: auto; max-height: 300px;">
            <table id="lotes-table" style="width: 100%; font-size: 11px; border-collapse: collapse; table-layout: fixed;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left; width: 40px; position: relative; cursor: pointer;" onclick="sortTable(0)" data-sort="none">
                    Status
                    <div class="resize-handle" style="position: absolute; right: 0; top: 0; width: 5px; height: 100%; cursor: col-resize;"></div>
                  </th>
                  <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left; width: 150px; position: relative; cursor: pointer;" onclick="sortTable(1)" data-sort="none">
                    Lote
                    <div class="resize-handle" style="position: absolute; right: 0; top: 0; width: 5px; height: 100%; cursor: col-resize;"></div>
                  </th>
                  <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left; width: 60px; position: relative; cursor: pointer;" onclick="sortTable(2)" data-sort="none">
                    Quant.
                    <div class="resize-handle" style="position: absolute; right: 0; top: 0; width: 5px; height: 100%; cursor: col-resize;"></div>
                  </th>
                  <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left; width: 80px; position: relative; cursor: pointer;" onclick="sortTable(3)" data-sort="none">
                    Criado em
                  </th>
                </tr>
              </thead>
              <tbody id="lotes-tbody">
                <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">🟢</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">ROLOS 400m</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">5200</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">31-07-2020</td>
                </tr>
                <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">🟢</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">BRANCO - rolos 400m</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">1500</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">13-11-2020</td>
                </tr>
                <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">🟡</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">RETALHO 1</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">120</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">31-07-2020</td>
                </tr>
                <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">🟡</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">RETALHO 22.01</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">0</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">20-06-2022</td>
                </tr>
                <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">🟢</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">ROLOS 300m</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">0</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">11-07-2023</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Divisória redimensionável -->
        <div id="vertical-resizer" style="width: 3px; background: #e2e8f0; cursor: col-resize; position: relative; z-index: 10; margin: 0 1px; transition: background-color 0.2s;"></div>
        
        <div id="right-panel" style="width: 40%; border: 1px solid #cbd5e1; background: white; margin-left: 5px;">
          <div style="background: #f1f5f9; padding: 8px; border-bottom: 1px solid #cbd5e1; font-weight: 600; font-size: 12px;">
            Entradas/saídas/produções do Lote
          </div>
          <div style="overflow-y: auto; max-height: 300px;">
            <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left;">Lote</th>
                  <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left;">Qtd.</th>
                  <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left;">Cli/For.</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style="padding: 4px; border: 1px solid #e2e8f0;">RETALHO 1</td><td style="padding: 4px; border: 1px solid #e2e8f0; color: red;">-100</td><td style="padding: 4px; border: 1px solid #e2e8f0;">CLIENTE</td></tr>
                <tr><td style="padding: 4px; border: 1px solid #e2e8f0;">RETALHO 1</td><td style="padding: 4px; border: 1px solid #e2e8f0; color: red;">-5</td><td style="padding: 4px; border: 1px solid #e2e8f0;">CLIENTE</td></tr>
                <tr><td style="padding: 4px; border: 1px solid #e2e8f0;">ROLOS 400m</td><td style="padding: 4px; border: 1px solid #e2e8f0; color: red;">-400</td><td style="padding: 4px; border: 1px solid #e2e8f0;">CLIENTE</td></tr>
                <tr><td style="padding: 4px; border: 1px solid #e2e8f0;">RETALHO 1</td><td style="padding: 4px; border: 1px solid #e2e8f0; color: red;">-10</td><td style="padding: 4px; border: 1px solid #e2e8f0;">CLIENTE</td></tr>
                <tr><td style="padding: 4px; border: 1px solid #e2e8f0;">RETALHO 1</td><td style="padding: 4px; border: 1px solid #e2e8f0; color: red;">-50</td><td style="padding: 4px; border: 1px solid #e2e8f0;">CLIENTE</td></tr>
                <tr><td style="padding: 4px; border: 1px solid #e2e8f0;">ROLOS 400m</td><td style="padding: 4px; border: 1px solid #e2e8f0; color: green;">+3200</td><td style="padding: 4px; border: 1px solid #e2e8f0;">FORNECEDOR</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    // Adicionar funcionalidade de redimensionamento de colunas e painéis
    setTimeout(() => {
      setupColumnResize();
      setupPanelResize();
      // update status icons based on quantity
      try{ if(typeof updateLotesIcons === 'function') updateLotesIcons(); }catch(_){ }
    }, 100);
  } else if (section === 'precos') {
    contentArea.innerHTML = `
      <div class="precos-container">
        <div class="precos-left">
          <div class="precos-grupo">
            <label for="preco-fornecedor">Preço do Fornecedor</label>
            <input type="number" id="preco-fornecedor" placeholder="0,00" step="0.01" min="0" />
          </div>
          
          <div class="precos-grupo">
            <label for="desconto">Desconto (%)</label>
            <input type="number" id="desconto" placeholder="%" step="0.01" min="0" />
          </div>
          
          <div class="precos-grupo">
            <label for="transporte">Transporte</label>
            <input type="number" id="transporte" placeholder="0,00" step="0.01" min="0" />
          </div>
          
          <div class="precos-grupo">
            <label for="preco-custo">Preço Custo</label>
            <input type="number" id="preco-custo" placeholder="0,00" step="0.01" min="0" readonly />
          </div>
        </div>
        
        <div class="precos-right">
          <div class="preco-venda-linha">
            <label>Preço 1</label>
            <input type="number" class="margem-input" placeholder="%" step="0.01" min="0" data-preco="1" />
            <input type="number" class="preco-final-input" placeholder="0,00" step="0.01" min="0" readonly />
          </div>
          
          <div class="preco-venda-linha">
            <label>Preço 2</label>
            <input type="number" class="margem-input" placeholder="%" step="0.01" min="0" data-preco="2" />
            <input type="number" class="preco-final-input" placeholder="0,00" step="0.01" min="0" readonly />
          </div>
          
          <div class="preco-venda-linha">
            <label>Preço 3</label>
            <input type="number" class="margem-input" placeholder="%" step="0.01" min="0" data-preco="3" />
            <input type="number" class="preco-final-input" placeholder="0,00" step="0.01" min="0" readonly />
          </div>
          
          <div class="preco-venda-linha">
            <label>Preço 4</label>
            <input type="number" class="margem-input" placeholder="%" step="0.01" min="0" data-preco="4" />
            <input type="number" class="preco-final-input" placeholder="0,00" step="0.01" min="0" readonly />
          </div>
          
          <div class="preco-venda-linha">
            <label>Preço 5</label>
            <input type="number" class="margem-input" placeholder="%" step="0.01" min="0" data-preco="5" />
            <input type="number" class="preco-final-input" placeholder="0,00" step="0.01" min="0" readonly />
          </div>
        </div>
      </div>
    `;
    
    // Adicionar funcionalidade de cálculo de preços
    setTimeout(() => {
      setupPrecosCalculations();
    }, 100);
  } else if (section === 'graficos') {
    // render the gráficos panel (chart + period selector)
    // use a small timeout to ensure the active class and layout are settled
    setTimeout(() => {
      try { setupGraficosPanel(windowEl); } catch (e) { console.error('Erro ao montar graficos:', e); }
    }, 50);
  } else {
    const sectionNames = {
      'dados': 'Dados Artigo',
      'clientes': 'Clientes/Fornecedores', 
      'precos': 'Preços',
      'graficos': 'Gráficos',
      'historico': 'Histórico',
      'stock': 'Stock'
    };
    // special case: clientes/fornecedores interactive sheet
    if(section === 'clientes'){
      contentArea.innerHTML = `
        <div class="cf-sheet">
          <div class="cf-buttons">
            <button id="cf-clients" class="cf-btn active">Clientes</button>
            <button id="cf-suppliers" class="cf-btn">Fornecedores</button>
          </div>

          <div class="cf-tables">
            <div id="cf-clients-table" class="cf-table">
              <table>
                <thead><tr><th>Nome</th><th>ID Fatura</th><th>Qtd.</th><th>Preço</th><th>Data</th></tr></thead>
                <tbody>
                  <tr><td>João Silva</td><td>F-3001</td><td>3</td><td>120,00</td><td>2025-10-02</td></tr>
                  <tr><td>Loja X</td><td>F-3010</td><td>12</td><td>512,00</td><td>2025-10-09</td></tr>
                </tbody>
              </table>
            </div>
            <div id="cf-suppliers-table" class="cf-table hidden">
              <table>
                <thead><tr><th>Fornecedor</th><th>ID Fatura</th><th>Qtd.</th><th>Preço</th><th>Data</th></tr></thead>
                <tbody>
                  <tr><td>João & Filhos</td><td>P-2001</td><td>1</td><td>291,07</td><td>2025-10-07</td></tr>
                  <tr><td>DPD Portugal</td><td>P-1999</td><td>2</td><td>56,83</td><td>2025-10-03</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      // wire buttons and enable resizers
      setTimeout(()=>{
        const btnC = contentArea.querySelector('#cf-clients');
        const btnS = contentArea.querySelector('#cf-suppliers');
        const tC = contentArea.querySelector('#cf-clients-table');
        const tS = contentArea.querySelector('#cf-suppliers-table');
        if(btnC && btnS && tC && tS){
          btnC.addEventListener('click', ()=>{ btnC.classList.add('active'); btnS.classList.remove('active'); tC.classList.remove('hidden'); tS.classList.add('hidden'); enableResizableColumns(); });
          btnS.addEventListener('click', ()=>{ btnS.classList.add('active'); btnC.classList.remove('active'); tS.classList.remove('hidden'); tC.classList.add('hidden'); enableResizableColumns(); });
        }
        enableResizableColumns();
      },60);

    } else {
      // special case: dados artigo with sub-tabs
      if(section === 'dados'){
        contentArea.innerHTML = `
          <div class="dados-artigo-container" style="font-size: 11px;">
            <div class="cf-sheet">
              <!-- Button-style sub-tabs (same look as Clientes/Fornecedores) -->
              <div class="cf-buttons" style="margin-bottom:12px;">
                <button class="cf-btn dados-subtab-btn active" data-subtab="dados-artigo">Dados Artigo</button>
                <button class="cf-btn dados-subtab-btn" data-subtab="configuracoes">Configurações</button>
                <button class="cf-btn dados-subtab-btn" data-subtab="observacoes">Observações</button>
              </div>

              <!-- Dados Artigo content split into 5 divs as requested -->
              <div class="dados-subtab-content" id="dados-artigo-content" style="font-size:11px;box-sizing:border-box;">
              <!-- Use auto width so layout adapts to window -->
              <div style="width:auto;max-width:none;overflow:visible;padding:4px;box-sizing:border-box;display:grid;grid-template-columns:1fr 200px;gap:8px;align-items:start;min-width:0;">

                <!-- LEFT COLUMN: description + fields + fornecedor -->
                <div style="grid-column:1;min-width:0;display:flex;flex-direction:column;gap:6px;">
                  <div>
            
                  
                  </div>

                  <div style="display:grid;grid-template-columns:90px 1fr 80px 110px;gap:6px 8px;align-items:center;font-size:11px;justify-items:start;">
                    <label style="text-align:left;">Tipo Artigo:</label>
                    <select id="tipo-artigo" style="padding:4px;border:1px solid #e6eef6;border-radius:6px;font-size:11px;">
                      <option>MERCADORIAS</option>
                    </select>

                    <label style="text-align:left;">Activo:</label>
                    <select id="activo" style="width:90px;padding:4px;border:1px solid #e6eef6;border-radius:6px;font-size:11px;">
                      <option>SIM</option><option>NÃO</option>
                    </select>

                    <label style="text-align:left;">Marca(s):</label>
                    <div id="marca-ms" class="ms" style="position:relative;min-width:160px;max-width:240px;">
                      <button type="button" id="marca-ms-toggle" class="ms-toggle" style="width:100%;text-align:left;padding:6px;border:1px solid #e6eef6;border-radius:6px;background:white;">Selecionar marcas ▾</button>
                      <div id="marca-ms-panel" class="ms-panel hidden" style="position:absolute;left:0;right:0;z-index:60;margin-top:6px;padding:6px;border:1px solid #e6eef6;border-radius:6px;background:white;max-height:160px;overflow:auto;box-shadow:0 6px 18px rgba(15,23,42,0.06);">
                        <!-- marcas checkboxes inserted here -->
                      </div>
                    </div>
                    <label style="text-align:left;">Data Activo:</label>
                    <input id="data-activo" type="date" value="2025-10-23" style="width:110px;padding:4px;border:1px solid #e6eef6;border-radius:6px;font-size:11px;" />

                    <label style="text-align:left;">Modelo(s):</label>
                    <div id="modelo-ms" class="ms" style="position:relative;min-width:160px;max-width:260px;">
                      <button type="button" id="modelo-ms-toggle" class="ms-toggle" disabled style="width:100%;text-align:left;padding:6px;border:1px solid #e6eef6;border-radius:6px;background:#f8fafc;color:#94a3b8;">Selecione uma marca</button>
                      <div id="modelo-ms-panel" class="ms-panel hidden" style="position:absolute;left:0;right:0;z-index:60;margin-top:6px;padding:6px;border:1px solid #e6eef6;border-radius:6px;background:white;max-height:160px;overflow:auto;box-shadow:0 6px 18px rgba(15,23,42,0.06);">
                        <!-- modelos checkboxes inserted here -->
                      </div>
                    </div>
                    <label style="text-align:left;">&nbsp;</label>

                    <label style="text-align:left; grid-column:1;">Referência:</label>
                    <input id="referencia" type="text" style="grid-column:2 / span 3; padding:4px;border:1px solid #e6eef6;border-radius:6px;font-size:11px;" />
                    <div></div>
                  </div>

                  <div style="display:grid;grid-template-columns:100px 1fr;gap:6px 8px;align-items:center;font-size:11px;margin-top:6px;">
                    <label style="text-align:left;">Nº Fornecedor:</label>
                    <div style="display:flex;gap:8px;align-items:center;">
                      <input id="num-fornecedor" type="text" style="flex:1;padding:6px;border:1px solid #e6eef6;border-radius:6px;font-size:11px;" />
                      <button id="fornecedor-lookup" class="artigo-btn" style="width:34px;height:28px;padding:0;border-radius:6px;">🔎</button>
                    </div>

                    <label style="text-align:left;">Fornecedor:</label>
                    <input id="fornecedor-nome" type="text" style="padding:6px;border:1px solid #e6eef6;border-radius:6px;font-size:11px;" />

                    <label style="text-align:left;">Cód. Art. Fornec.:</label>
                    <input id="cod-art-fornec" type="text" style="padding:6px;border:1px solid #e6eef6;border-radius:6px;font-size:11px;" />
                  </div>
                </div>

                <!-- RIGHT COLUMN: image area and below it Informação Geral -->
                <div style="grid-column:2;display:flex;flex-direction:column;gap:6px;align-items:stretch;min-width:0;">
                  <div style="width:100%;height:48px;border:1px solid #e6eef6;border-radius:6px;background:#fbfdff;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:12px;box-sizing:border-box;">(imagens)</div>
                  <div style="display:flex;gap:6px;justify-content:flex-end;">
                    <button id="img-add" class="artigo-btn" style="width:28px;height:24px;padding:0;border-radius:6px;font-size:12px;">+</button>
                    <button id="img-block" class="artigo-btn" style="width:28px;height:24px;padding:0;border-radius:6px;font-size:12px;">⛔</button>
                  </div>

                  <div style="border:1px solid #e6eef6;border-radius:6px;padding:6px;background:#fff;font-size:11px;">
                    <div style="font-weight:700;margin-bottom:8px;color:#0f172a;font-size:12px;">Informação Geral</div>
                    <div style="display:grid;grid-template-columns:1fr 80px;gap:8px 8px;align-items:center;">
                      <div>Preço Venda 1:</div><div><input id="preco-venda-1" type="number" value="0" style="width:100%;padding:4px;border:1px solid #e6eef6;border-radius:6px;font-size:11px;text-align:right;" /></div>
                      <div>Stock disponível:</div><div><input id="stock-disponivel" type="number" value="0" style="width:100%;padding:4px;border:1px solid #e6eef6;border-radius:6px;font-size:11px;text-align:right;" /></div>
                      <div>Qtd. Enc. Cli.:</div><div><input id="qtd-enc-cli" type="number" value="0" style="width:100%;padding:4px;border:1px solid #e6eef6;border-radius:6px;font-size:11px;text-align:right;" /></div>
                      <div>Qtd. Enc. Forn.:</div><div><input id="qtd-enc-forn" type="number" value="0" style="width:100%;padding:4px;border:1px solid #e6eef6;border-radius:6px;font-size:11px;text-align:right;" /></div>
                      <div>Stock Previsto:</div><div><input id="stock-previsto" type="number" value="0" style="width:100%;padding:4px;border:1px solid #e6eef6;border-radius:6px;font-size:11px;text-align:right;" /></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- Observações content -->
            <div class="dados-subtab-content hidden" id="observacoes-content">
              <div style="display:flex;flex-direction:column;gap:8px;box-sizing:border-box;padding:6px;">
                <div style="display:grid;grid-template-columns:1fr 360px;gap:12px;align-items:start;">
                  <!-- Left top: fields 1..10 -->
                  <div style="display:flex;flex-direction:column;gap:6px;min-width:0;">
                    <div style="display:grid;grid-template-columns:80px 1fr;gap:6px;align-items:center;"><label style="font-size:11px;text-align:right;">CAMPO1:</label><input type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:4px;font-size:11px;"/></div>
                    <div style="display:grid;grid-template-columns:80px 1fr;gap:6px;align-items:center;"><label style="font-size:11px;text-align:right;">CAMPO2:</label><input type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:4px;font-size:11px;"/></div>
                    <div style="display:grid;grid-template-columns:80px 1fr;gap:6px;align-items:center;"><label style="font-size:11px;text-align:right;">CAMPO3:</label><input type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:4px;font-size:11px;"/></div>
                    <div style="display:grid;grid-template-columns:80px 1fr;gap:6px;align-items:center;"><label style="font-size:11px;text-align:right;">CAMPO4:</label><input type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:4px;font-size:11px;"/></div>
                    <div style="display:grid;grid-template-columns:80px 1fr;gap:6px;align-items:center;"><label style="font-size:11px;text-align:right;">CAMPO5:</label><input type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:4px;font-size:11px;"/></div>
                    <div style="display:grid;grid-template-columns:80px 1fr;gap:6px;align-items:center;margin-top:6px;"><label style="font-size:11px;text-align:right;">CAMPO6:</label><input type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:4px;font-size:11px;"/></div>
                    <div style="display:grid;grid-template-columns:80px 1fr;gap:6px;align-items:center;"><label style="font-size:11px;text-align:right;">CAMPO7:</label><input type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:4px;font-size:11px;"/></div>
                    <div style="display:grid;grid-template-columns:80px 1fr;gap:6px;align-items:center;"><label style="font-size:11px;text-align:right;">CAMPO8:</label><input type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:4px;font-size:11px;"/></div>
                    <div style="display:grid;grid-template-columns:80px 1fr;gap:6px;align-items:center;"><label style="font-size:11px;text-align:right;">CAMPO9:</label><input type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:4px;font-size:11px;"/></div>
                    <div style="display:grid;grid-template-columns:80px 1fr;gap:6px;align-items:center;"><label style="font-size:11px;text-align:right;">CAMPO10:</label><input type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:4px;font-size:11px;"/></div>
                  </div>

                  <!-- Right top: big Observações field -->
                  <div style="min-width:0;">
                    <div style="font-weight:700;margin-bottom:6px;color:#0f172a;font-size:12px;">Observações</div>
                    <textarea id="observacoes-texto" style="width:100%;height:220px;padding:6px;border:1px solid #e6eef6;border-radius:6px;font-size:11px;box-sizing:border-box;background:#fff;color:#0f172a;"></textarea>
                  </div>
                </div>

                <!-- Bottom full-width: checkbox and textbox -->
                <div style="margin-top:8px;border-top:1px solid #e6eef7;padding-top:10px;display:flex;gap:12px;align-items:flex-start;">
                  <label style="display:flex;align-items:center;gap:8px;font-size:11px;">
                    <input id="observacoes-mostrar-venda" type="checkbox" style="margin:0;" />
                    Mostrar na venda
                  </label>
                  <textarea id="observacoes-note" style="flex:1;height:80px;padding:6px;border:1px solid #d1d5db;border-radius:6px;font-size:11px;box-sizing:border-box;"></textarea>
                </div>
              </div>
            </div>

            <!-- Configurações content -->
            <div class="dados-subtab-content hidden" id="configuracoes-content">
              <div style="display: grid; grid-template-columns: 100px 1fr 100px 1fr; gap: 8px; align-items: center;">
                <label style="font-size: 11px; text-align: right;">Garantia:</label>
                <select style="padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 11px;">
                  <option>NÃO</option>
                  <option>SIM</option>
                </select>
                <label style="font-size: 11px; text-align: right;">Num.:</label>
                <input type="number" value="0" style="padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 11px; text-align: right;" />

                <label style="font-size: 11px; text-align: right;">Semana(s):</label>
                <select style="padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 11px;">
                  <option>0</option>
                  <option>1</option>
                  <option>2</option>
                  <option>4</option>
                </select>
                <div></div>
                <div></div>

                <label style="font-size: 11px; text-align: right;">Peso Bruto:</label>
                <input type="number" value="0" style="padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 11px; text-align: right;" />
                <label style="font-size: 11px; text-align: right;">Peso Líquido:</label>
                <input type="number" value="0" style="padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 11px; text-align: right;" />

                <label style="font-size: 11px; text-align: right;">Capacidade:</label>
                <input type="number" value="0" style="padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 11px; text-align: right;" />
                <label style="font-size: 11px; text-align: right;">Volume:</label>
                <input type="number" value="0" style="padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 11px; text-align: right;" />

                <label style="font-size: 11px; text-align: right;">Altura Desc.:</label>
                <select style="padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 11px;">
                  <option>NÃO</option>
                  <option>SIM</option>
                </select>
                <label style="font-size: 11px; text-align: right;">Parcial:</label>
                <select style="padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 11px;">
                  <option>NÃO</option>
                  <option>SIM</option>
                </select>

                <label style="font-size: 11px; text-align: right;">Usa Balança:</label>
                <select style="padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 11px;">
                  <option>NÃO</option>
                  <option>SIM</option>
                </select>
                <label style="font-size: 11px; text-align: right;">Registra Produto CNL:</label>
                <select style="padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 11px;">
                  <option>NÃO</option>
                  <option>SIM</option>
                </select>

                <label style="font-size: 11px; text-align: right;">Desconto P1:</label>
                <select style="padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 11px;">
                  <option>NÃO</option>
                  <option>SIM</option>
                </select>
                <label style="font-size: 11px; text-align: right;">Obriga Referência 1:</label>
                <select style="padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 11px;">
                  <option>NÃO</option>
                  <option>SIM</option>
                </select>
              </div>
            </div>
          </div>
        `;

        // Wire sub-tab switching
        setTimeout(() => {
          const subtabBtns = contentArea.querySelectorAll('.dados-subtab-btn');
          const subtabContents = contentArea.querySelectorAll('.dados-subtab-content');

          subtabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
              const targetTab = btn.dataset.subtab;

              // Update button states using CSS class only
              subtabBtns.forEach(b => b.classList.remove('active'));
              btn.classList.add('active');

              // Update content visibility
              subtabContents.forEach(content => content.classList.add('hidden'));
              const targetContent = contentArea.querySelector('#' + targetTab + '-content');
              if (targetContent) targetContent.classList.remove('hidden');
            });
          });
        }, 50);

        // populate Marca/Modelo checkbox-panels inside this Dados Artigo window
        setTimeout(() => {
          try{
            const marcaMs = contentArea.querySelector('#marca-ms');
            const marcaPanel = contentArea.querySelector('#marca-ms-panel');
            const marcaToggle = contentArea.querySelector('#marca-ms-toggle');
            const modeloMs = contentArea.querySelector('#modelo-ms');
            const modeloPanel = contentArea.querySelector('#modelo-ms-panel');
            const modeloToggle = contentArea.querySelector('#modelo-ms-toggle');
            if(!marcaMs || !marcaPanel || !marcaToggle) return;

            function renderMarcaCheckboxes(){
              marcaPanel.innerHTML = '';
              (window.marcasData || []).forEach(m => {
                const id = m.id;
                const lab = document.createElement('label'); lab.style.display='flex'; lab.style.alignItems='center'; lab.style.gap='8px'; lab.style.padding='4px'; lab.style.cursor='pointer';
                const cb = document.createElement('input'); cb.type='checkbox'; cb.dataset.id = id; cb.style.margin='0';
                const span = document.createElement('span'); span.textContent = m.name; span.style.whiteSpace='nowrap'; span.style.overflow='hidden'; span.style.textOverflow='ellipsis';
                lab.appendChild(cb); lab.appendChild(span);
                marcaPanel.appendChild(lab);
                cb.addEventListener('change', ()=>{ updateMarcaToggle(); updateModelosForSelected(); });
              });
            }

            function updateMarcaToggle(){
              const checked = Array.from(marcaPanel.querySelectorAll('input[type=checkbox]:checked')).map(x=>x.dataset.id);
              if(checked.length === 0){ marcaToggle.textContent = 'Selecionar marcas ▾'; }
              else { marcaToggle.textContent = checked.map(id => (window.marcasData||[]).find(x=>x.id===id)?.name || id).join(', ') + ' ▾'; }
            }

            function updateModelosForSelected(){
              if(!modeloPanel || !modeloToggle) return;
              const selectedIds = Array.from(marcaPanel.querySelectorAll('input[type=checkbox]:checked')).map(x=>x.dataset.id);
              modeloPanel.innerHTML = '';
              if(selectedIds.length === 0){
                modeloToggle.disabled = true; modeloToggle.style.color = '#94a3b8'; modeloToggle.textContent = 'Selecione uma marca'; return;
              }
              modeloToggle.disabled = false; modeloToggle.style.color = ''; modeloToggle.textContent = 'Selecionar modelos ▾';
              // If more than one brand selected, group modelos under each brand with a divider
              if(selectedIds.length > 1){
                selectedIds.forEach(id => {
                  const brand = (window.marcasData || []).find(x => x.id === id);
                  if(!brand) return;
                  // brand header / divider
                  const hdr = document.createElement('div');
                  hdr.textContent = brand.name;
                  hdr.style.fontWeight = '700'; hdr.style.fontSize = '12px'; hdr.style.padding = '6px 4px 2px 4px'; hdr.style.borderTop = '1px solid #eef2ff'; hdr.style.marginTop = '6px'; hdr.style.color = '#0f172a';
                  modeloPanel.appendChild(hdr);
                  (brand.models || []).forEach(mm => {
                    if(!mm || !mm.name) return;
                    const lab = document.createElement('label'); lab.style.display='flex'; lab.style.alignItems='center'; lab.style.gap='8px'; lab.style.padding='4px'; lab.style.cursor='pointer';
                    const cb = document.createElement('input'); cb.type='checkbox'; cb.dataset.name = mm.name; cb.dataset.brand = brand.id; cb.style.margin='0';
                    const span = document.createElement('span'); span.textContent = mm.name; span.style.whiteSpace='nowrap'; span.style.overflow='hidden'; span.style.textOverflow='ellipsis';
                    lab.appendChild(cb); lab.appendChild(span); modeloPanel.appendChild(lab);
                  });
                });
              } else {
                // single brand selected: merge unique model names as before
                const modelsMap = {};
                (window.marcasData || []).forEach(m => {
                  if(selectedIds.indexOf(m.id) === -1) return;
                  (m.models || []).forEach(mm => { if(mm && mm.name) modelsMap[mm.name] = mm; });
                });
                Object.keys(modelsMap).forEach(name => {
                  const lab = document.createElement('label'); lab.style.display='flex'; lab.style.alignItems='center'; lab.style.gap='8px'; lab.style.padding='4px'; lab.style.cursor='pointer';
                  const cb = document.createElement('input'); cb.type='checkbox'; cb.dataset.name = name; cb.style.margin='0';
                  const span = document.createElement('span'); span.textContent = name; span.style.whiteSpace='nowrap'; span.style.overflow='hidden'; span.style.textOverflow='ellipsis';
                  lab.appendChild(cb); lab.appendChild(span); modeloPanel.appendChild(lab);
                });
              }
            }

            // toggle panel buttons
            marcaToggle.addEventListener('click', (e)=>{ e.stopPropagation(); marcaPanel.classList.toggle('hidden'); });
            if(modeloToggle) modeloToggle.addEventListener('click', (e)=>{ e.stopPropagation(); if(!modeloToggle.disabled) modeloPanel.classList.toggle('hidden'); });

            // click outside to close panels (scoped)
            document.addEventListener('click', function onDocClick(ev){
              if(!marcaMs.contains(ev.target)) marcaPanel.classList.add('hidden');
              if(modeloMs && !modeloMs.contains(ev.target)) modeloPanel.classList.add('hidden');
            });

            // initial render
            renderMarcaCheckboxes();
            updateMarcaToggle();
            updateModelosForSelected();
          }catch(e){ console.error('Erro ao popular marcas/modelos no Dados Artigo', e); }
        }, 80);

      } else {
        contentArea.innerHTML = '<p style="color: #64748b; text-align: center; margin-top: 50px;">Conteúdo para ' + (sectionNames[section] || section) + ' em desenvolvimento</p>';
      }
    }
  }
};

// Função para ordenar tabela
window.sortTable = function(columnIndex) {
  const table = document.getElementById('lotes-table');
  const tbody = document.getElementById('lotes-tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const header = table.querySelectorAll('th')[columnIndex];
  
  let sortOrder = header.getAttribute('data-sort');
  if (sortOrder === 'none' || sortOrder === 'desc') {
    sortOrder = 'asc';
  } else {
    sortOrder = 'desc';
  }
  
  // Reset all headers
  table.querySelectorAll('th').forEach(th => {
    th.setAttribute('data-sort', 'none');
    const span = th.querySelector('span');
    if (span) span.textContent = '▲▼';
  });
  
  // Set current header
  header.setAttribute('data-sort', sortOrder);
  const span = header.querySelector('span');
  if (span) {
    span.textContent = sortOrder === 'asc' ? '▲' : '▼';
  }
  
  // Sort rows
  rows.sort((a, b) => {
    let aText = a.children[columnIndex].textContent.trim();
    let bText = b.children[columnIndex].textContent.trim();
    
    // Handle numeric columns
    if (columnIndex === 2) { // Quantidade (after removing Validade column)
      aText = parseInt(aText) || 0;
      bText = parseInt(bText) || 0;
      return sortOrder === 'asc' ? aText - bText : bText - aText;
    }
    
    // Handle date columns
    if (columnIndex === 3) { // Criado em (after removing Validade column)
      const aDate = new Date(aText.split('-').reverse().join('-'));
      const bDate = new Date(bText.split('-').reverse().join('-'));
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    }
    
    // Handle text columns
    return sortOrder === 'asc' ? aText.localeCompare(bText) : bText.localeCompare(aText);
  });
  
  // Reorder DOM
  rows.forEach(row => tbody.appendChild(row));
};

// Update any open Dados Artigo windows to reflect current marcas/models
window.updateDadosArtigoBrandLists = function(){
  try{
    document.querySelectorAll('.artigo-content-area').forEach(contentArea => {
  const marcaMs = contentArea.querySelector('#marca-ms');
  const marcaPanel = contentArea.querySelector('#marca-ms-panel');
  const marcaToggle = contentArea.querySelector('#marca-ms-toggle');
  const modeloMs = contentArea.querySelector('#modelo-ms');
  const modeloPanel = contentArea.querySelector('#modelo-ms-panel');
  const modeloToggle = contentArea.querySelector('#modelo-ms-toggle');
  if(!marcaMs || !marcaPanel || !marcaToggle) return;

  // rebuild marca checkboxes
  marcaPanel.innerHTML = '';
  (window.marcasData || []).forEach(m => {
    const id = m.id;
    const lab = document.createElement('label'); lab.style.display='flex'; lab.style.alignItems='center'; lab.style.gap='8px'; lab.style.padding='4px'; lab.style.cursor='pointer';
    const cb = document.createElement('input'); cb.type='checkbox'; cb.dataset.id = id; cb.style.margin='0';
    const span = document.createElement('span'); span.textContent = m.name; span.style.whiteSpace='nowrap'; span.style.overflow='hidden'; span.style.textOverflow='ellipsis';
    lab.appendChild(cb); lab.appendChild(span); marcaPanel.appendChild(lab);
    cb.addEventListener('change', ()=>{
      // update toggle text
      const checked = Array.from(marcaPanel.querySelectorAll('input[type=checkbox]:checked')).map(x=>x.dataset.id);
      if(checked.length === 0){ marcaToggle.textContent = 'Selecionar marcas ▾'; }
      else { marcaToggle.textContent = checked.map(id=> (window.marcasData||[]).find(x=>x.id===id)?.name || id).join(', ') + ' ▾'; }
      // regenerate modelos
      if(modeloPanel && modeloToggle){
        modeloPanel.innerHTML = '';
        const selectedIds = checked;
        if(selectedIds.length === 0){
          modeloToggle.disabled = true; modeloToggle.style.color='#94a3b8'; modeloToggle.textContent='Selecione uma marca';
        } else {
          modeloToggle.disabled = false; modeloToggle.style.color=''; modeloToggle.textContent='Selecionar modelos ▾';
          // If multiple brands selected, group modelos by brand with a header divider
          if(selectedIds.length > 1){
            selectedIds.forEach(id => {
              const brand = (window.marcasData || []).find(x => x.id === id);
              if(!brand) return;
              const hdr = document.createElement('div'); hdr.textContent = brand.name;
              hdr.style.fontWeight = '700'; hdr.style.fontSize = '12px'; hdr.style.padding = '6px 4px 2px 4px'; hdr.style.borderTop = '1px solid #eef2ff'; hdr.style.marginTop = '6px'; hdr.style.color = '#0f172a';
              modeloPanel.appendChild(hdr);
              (brand.models || []).forEach(mm => {
                if(!mm || !mm.name) return;
                const lab2 = document.createElement('label'); lab2.style.display='flex'; lab2.style.alignItems='center'; lab2.style.gap='8px'; lab2.style.padding='4px'; lab2.style.cursor='pointer';
                const cb2 = document.createElement('input'); cb2.type='checkbox'; cb2.dataset.name = mm.name; cb2.dataset.brand = brand.id; cb2.style.margin='0';
                const span2 = document.createElement('span'); span2.textContent = mm.name;
                lab2.appendChild(cb2); lab2.appendChild(span2); modeloPanel.appendChild(lab2);
              });
            });
          } else {
            // single brand selected: merge models unique by name
            const modelsMap = {};
            (window.marcasData || []).forEach(mm => { if(selectedIds.indexOf(mm.id)===-1) return; (mm.models||[]).forEach(z=>{ if(z && z.name) modelsMap[z.name] = z; }); });
            Object.keys(modelsMap).forEach(name=>{ const lab2=document.createElement('label'); lab2.style.display='flex'; lab2.style.alignItems='center'; lab2.style.gap='8px'; lab2.style.padding='4px'; lab2.style.cursor='pointer'; const cb2=document.createElement('input'); cb2.type='checkbox'; cb2.dataset.name=name; cb2.style.margin='0'; const span2=document.createElement('span'); span2.textContent=name; lab2.appendChild(cb2); lab2.appendChild(span2); modeloPanel.appendChild(lab2); });
          }
        }
      }
    });
  });
  // hide modelo until a marca is selected
  if(modeloPanel && modeloToggle){ modeloPanel.innerHTML=''; modeloToggle.disabled = true; modeloToggle.style.color='#94a3b8'; modeloToggle.textContent='Selecione uma marca'; }
    });
  }catch(e){ /* ignore */ }
};

// Função para configurar os cálculos da página de preços
window.setupPrecosCalculations = function() {
  const precoFornecedor = document.getElementById('preco-fornecedor');
  const desconto = document.getElementById('desconto');
  const transporte = document.getElementById('transporte');
  const precoCusto = document.getElementById('preco-custo');
  const margemInputs = document.querySelectorAll('.margem-input');
  const precoFinalInputs = document.querySelectorAll('.preco-final-input');
  
  if (!precoFornecedor || !desconto || !transporte || !precoCusto) return;
  
  // Função para calcular o preço custo
  function calcularPrecoCusto() {
    const fornecedor = parseFloat(precoFornecedor.value) || 0;
    const descPercentagem = parseFloat(desconto.value) || 0;
    const transp = parseFloat(transporte.value) || 0;
    
    // Desconto é em percentagem, então calculamos: fornecedor - (fornecedor * desconto%)
    const valorDesconto = fornecedor * (descPercentagem / 100);
    const custoFinal = fornecedor - valorDesconto + transp;
    precoCusto.value = custoFinal.toFixed(2);
    
    // Recalcular todos os preços de venda
    calcularPrecosVenda();
  }
  
  // Função para calcular preços de venda baseados na margem
  function calcularPrecosVenda() {
    const custo = parseFloat(precoCusto.value) || 0;
    
    margemInputs.forEach((margemInput, index) => {
      const margem = parseFloat(margemInput.value) || 0;
      const precoFinal = custo * (1 + margem / 100);
      
      if (precoFinalInputs[index]) {
        precoFinalInputs[index].value = precoFinal.toFixed(2);
      }
    });
  }
  
  // Event listeners para cálculo automático do preço custo
  precoFornecedor.addEventListener('input', calcularPrecoCusto);
  desconto.addEventListener('input', calcularPrecoCusto);
  transporte.addEventListener('input', calcularPrecoCusto);
  
  // Event listeners para cálculo automático dos preços de venda
  margemInputs.forEach(input => {
    input.addEventListener('input', calcularPrecosVenda);
  });
  
  // Inicializar cálculos
  calcularPrecoCusto();
};

// Função para configurar redimensionamento de colunas
window.setupColumnResize = function() {
  const table = document.getElementById('lotes-table');
  if (!table) return;
  
  const resizeHandles = table.querySelectorAll('.resize-handle');
  let isResizing = false;
  let currentHandle = null;
  let startX = 0;
  let startWidth = 0;
  
  resizeHandles.forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      isResizing = true;
      currentHandle = handle;
      startX = e.clientX;
      
      const th = handle.closest('th');
      startWidth = th.offsetWidth;
      
      // Desabilitar ordenação temporariamente
      const allHeaders = table.querySelectorAll('th[onclick]');
      allHeaders.forEach(header => {
        header.style.pointerEvents = 'none';
      });
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Visual feedback
      handle.style.background = '#2563eb';
      document.body.style.cursor = 'col-resize';
    });
  });
  
  function handleMouseMove(e) {
    if (!isResizing || !currentHandle) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(30, startWidth + diff); // Minimum width 30px
    
    const th = currentHandle.closest('th');
    th.style.width = newWidth + 'px';
  }
  
  function handleMouseUp() {
    if (!isResizing) return;
    
    isResizing = false;
    if (currentHandle) {
      currentHandle.style.background = '';
      
      // Reabilitar ordenação
      const allHeaders = table.querySelectorAll('th[onclick]');
      allHeaders.forEach(header => {
        header.style.pointerEvents = 'auto';
      });
    }
    currentHandle = null;
    document.body.style.cursor = '';
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
};

// Função para configurar redimensionamento dos painéis esquerdo/direito
window.setupPanelResize = function() {
  console.log('setupPanelResize chamada');
  const resizer = document.getElementById('vertical-resizer');
  const leftPanel = document.getElementById('left-panel');
  const rightPanel = document.getElementById('right-panel');
  const container = document.getElementById('lotes-container');
  
  console.log('Elementos encontrados:', {resizer, leftPanel, rightPanel, container});
  
  if (!resizer || !leftPanel || !rightPanel || !container) {
    console.log('Alguns elementos não encontrados');
    return;
  }
  
  console.log('Todos os elementos encontrados, configurando eventos');
  
  // Adicionar efeitos hover
  resizer.addEventListener('mouseenter', () => {
    resizer.style.background = '#cbd5e1';
  });
  
  resizer.addEventListener('mouseleave', () => {
    if (!isResizing) {
      resizer.style.background = '#e2e8f0';
    }
  });
  
  let isResizing = false;
  let startX = 0;
  let startLeftWidth = 0;
  
  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    isResizing = true;
    startX = e.clientX;
    startLeftWidth = leftPanel.getBoundingClientRect().width;
    
    document.addEventListener('mousemove', handlePanelResize);
    document.addEventListener('mouseup', stopPanelResize);
    
    // Visual feedback
    resizer.style.background = '#2563eb';
    document.body.style.cursor = 'col-resize';
  });
  
  function handlePanelResize(e) {
    if (!isResizing) return;
    
    const containerWidth = container.getBoundingClientRect().width;
    const diff = e.clientX - startX;
    const newLeftWidth = startLeftWidth + diff;
    
    // Limites mínimos e máximos (20% - 80%)
    const minWidth = containerWidth * 0.2;
    const maxWidth = containerWidth * 0.8;
    
    if (newLeftWidth >= minWidth && newLeftWidth <= maxWidth) {
      const leftPercentage = (newLeftWidth / containerWidth) * 100;
      const rightPercentage = 100 - leftPercentage;
      
      leftPanel.style.width = leftPercentage + '%';
      rightPanel.style.width = rightPercentage + '%';
    }
  }
  
  function stopPanelResize() {
    isResizing = false;
    resizer.style.background = 'transparent';
    document.body.style.cursor = '';
    
    document.removeEventListener('mousemove', handlePanelResize);
    document.removeEventListener('mouseup', stopPanelResize);
  }
};

// Função para configurar os menus dos artigos
function setupArtigosMenus(windowEl) {
  console.log('Setup artigos menus chamado');
  const menuBtns = windowEl.querySelectorAll('.artigo-menu-btn');
  const contentArea = windowEl.querySelector('.artigo-content-area');
  
  console.log('Botões encontrados:', menuBtns.length);
  console.log('Content area encontrada:', contentArea);
  
  menuBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('Botão clicado:', btn);
      // Remove active de todos os botões
      menuBtns.forEach(b => b.classList.remove('active'));
      // Adiciona active ao botão clicado
      btn.classList.add('active');
      
      // Determina o conteúdo baseado no menu selecionado
      const sectionLabel = btn.querySelector('.label')?.textContent || btn.textContent.trim();
      console.log('Section label:', sectionLabel);
      let content = '';
      
      if (sectionLabel === 'Lotes') {
        content = `
          <div id="lotes-container" style="display: flex; height: 100%; position: relative;">
            <!-- Lado Esquerdo: Lista de Lotes -->
            <div id="left-panel" style="width: 60%; border: 1px solid #cbd5e1; background: white; margin-right: 5px;">
              <div style="background: #f1f5f9; padding: 8px; border-bottom: 1px solid #cbd5e1; font-weight: 600; font-size: 12px;">
                Histórico de Lotes
              </div>
              <div style="overflow-y: auto; max-height: 300px;">
                <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f8fafc;">
                      <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left;">🟢</th>
                      <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left;">Lote</th>
                      <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left;">Quant.</th>
                      <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left;">Criado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">🟢</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">ROLOS 400m</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">5200</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">31-07-2020</td>
                    </tr>
                    <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">🟢</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">BRANCO - rolos 400m</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">1500</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">13-11-2020</td>
                    </tr>
                    <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">🟡</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">RETALHO 1</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">120</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">31-07-2020</td>
                    </tr>
                    <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">🟡</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">RETALHO 22.01</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">0</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">20-06-2022</td>
                    </tr>
                    <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">🟢</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">ROLOS 300m</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">0</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">11-07-2023</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- Divisória redimensionável -->
            <div id="vertical-resizer" style="width: 3px; background: #e2e8f0; cursor: col-resize; position: relative; z-index: 10; margin: 0 1px; transition: background-color 0.2s;"></div>
            
            <!-- Lado Direito: Entradas/Saídas -->
            <div id="right-panel" style="width: 40%; border: 1px solid #cbd5e1; background: white; margin-left: 5px;">
              <div style="background: #f1f5f9; padding: 8px; border-bottom: 1px solid #cbd5e1; font-weight: 600; font-size: 12px;">
                Entradas/saídas/produções do Lote
              </div>
              <div style="overflow-y: auto; max-height: 300px;">
                <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f8fafc;">
                      <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left;">Lote</th>
                      <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left;">Qtd.</th>
                      <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left;">Cli/For.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">RETALHO 1</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0; color: red;">-100</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">CLIENTE</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">RETALHO 1</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0; color: red;">-5</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">CLIENTE</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">ROLOS 400m</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0; color: red;">-400</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">CLIENTE</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">RETALHO 1</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0; color: red;">-10</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">CLIENTE</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">RETALHO 1</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0; color: red;">-50</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">CLIENTE</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">ROLOS 400m</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0; color: green;">+3200</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">FORNECEDOR</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      } else {
        content = `<p style="color: #64748b; text-align: center; margin-top: 50px;">Conteúdo para ${sectionLabel} em desenvolvimento</p>`;
      }
      
      contentArea.innerHTML = content;
      // After injecting content ensure lotes icons update
      try{ if(typeof updateLotesIcons === 'function') updateLotesIcons(); }catch(_){ }
    });
  });
}

// Update the status icon (colored ball) for lotes tables based on quantity
window.updateLotesIcons = function(root){
  const base = root && root.querySelector ? root : document;
  // target any lotes table body present
  const tbodies = base.querySelectorAll('#lotes-tbody');
  tbodies.forEach(tbody => {
    Array.from(tbody.querySelectorAll('tr')).forEach(row => {
  const qtyCell = row.children[2]; // Quant. column expected (after removing Validade)
      const statusCell = row.children[0];
      if(!qtyCell || !statusCell) return;
      // extract numeric value (allow negatives and decimals)
      const raw = qtyCell.textContent || '';
      const num = parseFloat((raw || '').replace(/[^0-9\-\.]/g, '')) || 0;
      let emoji = '🟡';
      if(num > 0) emoji = '🟢';
      else if(num < 0) emoji = '🔴';
      else emoji = '🟡';
      statusCell.textContent = emoji;
      statusCell.setAttribute('title', (num>0? 'Disponível: ':'') + raw.trim());
    });
  });
};

// --- Gráficos: chart rendering and time-range selector ---
window.setupGraficosPanel = function(windowEl){
  const content = windowEl.querySelector('.artigo-content-area');
  if(!content) return;

  content.innerHTML = `
    <div class="graficos-header">
      <div style="font-weight:600">Gráficos de Stock</div>
      <div class="graficos-actions">
        <button id="open-range-btn" class="btn">Período</button>
      </div>
    </div>
    <div class="graficos-chart-card">
      <canvas id="stock-chart" width="800" height="320"></canvas>
    </div>
    <div id="time-range-modal" class="time-range-modal" role="dialog" aria-hidden="true">
      <div style="font-weight:600;margin-bottom:8px">Escolher Período</div>
      <div class="ranges">
        <button data-range="1d">1dia</button>
        <button data-range="1w">1semana</button>
        <button data-range="1m">1mes</button>
        <button data-range="1y">1ano</button>
        <button data-range="custom">customizado</button>
      </div>
      <div class="custom-range" style="margin-top:10px; display:none;">
        <label style="font-size:12px;">Início</label>
        <input type="datetime-local" id="custom-start" />
        <label style="font-size:12px;margin-left:8px">Fim</label>
        <input type="datetime-local" id="custom-end" />
        <div style="margin-top:8px;text-align:right">
          <button id="apply-custom" class="btn btn-accent">Aplicar</button>
        </div>
      </div>
      <div style="margin-top:8px;text-align:right"><button id="close-range" class="btn">Fechar</button></div>
    </div>
  `;

  // Attach handlers
  const openBtn = content.querySelector('#open-range-btn');
  const modal = document.getElementById('time-range-modal') || content.querySelector('#time-range-modal');
  const closeBtn = content.querySelector('#close-range');

  if(openBtn && modal){
    openBtn.addEventListener('click', ()=>{ modal.style.display = 'block'; modal.setAttribute('aria-hidden','false'); });
  }
  if(closeBtn && modal){ closeBtn.addEventListener('click', ()=>{ modal.style.display = 'none'; modal.setAttribute('aria-hidden','true'); }); }

  // Chart data generation (demo). Build time series for stock geral and per lote if present.
  function generateTimeSeries(range){
    // create array of dates based on range
    const now = new Date();
    let points = [];
    if(range === '1d'){
      for(let i=0;i<24;i++){ const d = new Date(now.getTime() - ((23-i)*60*60*1000)); points.push(d); }
    } else if(range === '1w'){
      for(let i=0;i<7;i++){ const d = new Date(now.getTime() - ((6-i)*24*60*60*1000)); points.push(d); }
    } else if(range === '1m'){
      for(let i=0;i<30;i++){ const d = new Date(now.getTime() - ((29-i)*24*60*60*1000)); points.push(d); }
    } else if(range === '1y'){
      for(let i=0;i<12;i++){ const d = new Date(now.getFullYear(), now.getMonth() - (11-i), 1); points.push(d); }
    } else {
      // default 1m
      for(let i=0;i<30;i++){ const d = new Date(now.getTime() - ((29-i)*24*60*60*1000)); points.push(d); }
    }
    return points;
  }

  function synthesizeSeries(dates){
    // Stock geral random walk and two example lots if present (demo)
    const geral = [];
    const loteA = [];
    const loteB = [];
    let val = 200;
    for(const d of dates){
      val = Math.max(0, val + (Math.random()-0.4)*10);
      geral.push(Math.round(val));
      loteA.push(Math.max(0, Math.round(val * (0.4 + Math.random()*0.2))));
      loteB.push(Math.max(0, Math.round(val * (0.2 + Math.random()*0.15))));
    }
    return {geral, lotes: { 'Lote A': loteA, 'Lote B': loteB }};
  }

  // initial render
  let currentRange = '1m';
  const ctx = content.querySelector('#stock-chart').getContext('2d');
  let stockChart = null;

  function renderChart(range){
    const dates = generateTimeSeries(range);
    const data = synthesizeSeries(dates);
    const labels = dates.map(d => {
      if(range === '1d') return d.getHours() + ':00';
      if(range === '1w') return d.toLocaleDateString();
      if(range === '1m') return d.toLocaleDateString();
      if(range === '1y') return d.toLocaleString('default', {month:'short', year:'numeric'});
      return d.toLocaleDateString();
    });

    const datasets = [];
    datasets.push({ label: 'Stock Geral', data: data.geral, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.08)', tension: 0.2, fill:false });
    Object.keys(data.lotes).forEach((k, idx) => {
      const colors = ['#059669','#f59e0b','#ef4444','#8b5cf6'];
      datasets.push({ label: k, data: data.lotes[k], borderColor: colors[idx%colors.length], backgroundColor: 'transparent', tension:0.2 });
    });

    if(stockChart) stockChart.destroy();
    stockChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: { responsive:true, maintainAspectRatio:false, scales:{ x:{ display:true, type:'category' }, y:{ display:true } } }
    });
  }

  renderChart(currentRange);

  // range buttons
  const buttons = content.querySelectorAll('[data-range]');
  buttons.forEach(b => b.addEventListener('click', (e)=>{
    const r = b.dataset.range;
    currentRange = r;
    renderChart(r);
    // toggle active
    buttons.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    if(modal){ modal.style.display='none'; modal.setAttribute('aria-hidden','true'); }
  }));

  // customizado behaviour: show datetime inputs when selecting custom
  const customBlock = content.querySelector('.custom-range');
  const customBtn = Array.from(buttons).find(x=>x.dataset.range === 'custom');
  const applyCustom = content.querySelector('#apply-custom');
  const inputStart = content.querySelector('#custom-start');
  const inputEnd = content.querySelector('#custom-end');

  if(customBtn && customBlock){
    customBtn.addEventListener('click', ()=>{
      // show custom inputs inside modal
      buttons.forEach(x=>x.classList.remove('active'));
      customBtn.classList.add('active');
      if(modal){ modal.style.display = 'block'; modal.setAttribute('aria-hidden','false'); }
      customBlock.style.display = 'block';
      // prefill with reasonable defaults: last 7 days
      const now = new Date();
      const prev = new Date(now.getTime() - (7*24*60*60*1000));
      // to input value format
      function toLocal(dt){ const pad=(n)=>String(n).padStart(2,'0'); const y=dt.getFullYear(); const m=pad(dt.getMonth()+1); const d=pad(dt.getDate()); const hh=pad(dt.getHours()); const mm=pad(dt.getMinutes()); return `${y}-${m}-${d}T${hh}:${mm}`; }
      if(inputStart && inputEnd){ inputStart.value = toLocal(prev); inputEnd.value = toLocal(now); }
    });
  }

  if(applyCustom && inputStart && inputEnd){
    applyCustom.addEventListener('click', ()=>{
      const s = inputStart.value;
      const e = inputEnd.value;
      if(!s || !e){ alert('Preencha início e fim'); return; }
      const ds = new Date(s);
      const de = new Date(e);
      if(isNaN(ds.getTime()) || isNaN(de.getTime()) || ds >= de){ alert('Intervalo inválido. Certifique-se que início < fim.'); return; }

      // decide resolution: hourly if span <48h else daily
      const spanMs = de - ds;
      const step = spanMs <= (48*60*60*1000) ? 'hour' : 'day';

      // generate labels between ds and de
      function generateCustomSeries(sDate, eDate, resolution){
        const pts = [];
        const cur = new Date(sDate.getTime());
        if(resolution === 'hour'){
          while(cur <= eDate){ pts.push(new Date(cur.getTime())); cur.setHours(cur.getHours()+1); }
        } else {
          // day resolution
          while(cur <= eDate){ pts.push(new Date(cur.getFullYear(), cur.getMonth(), cur.getDate())); cur.setDate(cur.getDate()+1); }
        }
        return pts;
      }

      // synthesize and render using existing renderChart logic but with custom dates
      const dates = generateCustomSeries(ds, de, step);
      const data = synthesizeSeries(dates);
      const labels = dates.map(d=>{
        if(step === 'hour') return d.getHours()+':00 ' + d.toLocaleDateString();
        return d.toLocaleDateString();
      });

      const datasets = [];
      datasets.push({ label: 'Stock Geral', data: data.geral, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.08)', tension: 0.2, fill:false });
      Object.keys(data.lotes).forEach((k, idx) => {
        const colors = ['#059669','#f59e0b','#ef4444','#8b5cf6'];
        datasets.push({ label: k, data: data.lotes[k], borderColor: colors[idx%colors.length], backgroundColor: 'transparent', tension:0.2 });
      });

      if(stockChart) stockChart.destroy();
      stockChart = new Chart(ctx, { type: 'line', data: { labels, datasets }, options: { responsive:true, maintainAspectRatio:false, scales:{ x:{ display:true, type:'category' }, y:{ display:true } } } });

      if(modal){ modal.style.display='none'; modal.setAttribute('aria-hidden','true'); }
      customBlock.style.display = 'none';
    });
  }
};

// Floating Settings window: uses the same tools input and saves to localStorage
function openSettingsFloating(){
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.tabIndex = -1;

  // modal container
  const modal = document.createElement('div');
  modal.className = 'modal-window';
  modal.innerHTML = `
    <div class="modal-inner">
      <aside class="modal-menu">
        <h3>Definições</h3>
        <ul>
          <li class="active" data-section="general">Geral</li>
          <li data-section="tools">Ferramentas</li>
          <li data-section="appearance">Aparência</li>
          <li data-section="marcas">Marcas</li>
          <li data-section="about">Sobre</li>
        </ul>
      </aside>
      <section class="modal-body">
        <div class="modal-section" id="section-general">
          <h4>Geral</h4>
          <p>Opções gerais da aplicação.</p>
        </div>
        <div class="modal-section hidden" id="section-tools">
          <h4>Ferramentas</h4>
          <label>Ferramentas (vírgula separado)</label>
          <input id="modal-tools-input" type="text" />
        </div>
        <div class="modal-section hidden" id="section-appearance">
          <h4>Aparência</h4>
          <p>Escolha tema, cores e modo.</p>
          <div style="margin-top:8px;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
              <button class="theme-swatch" data-color="blue" title="Azul" style="width:28px;height:28px;border-radius:6px;border:1px solid #e6eef6;background:#2563eb;"></button>
              <button class="theme-swatch" data-color="green" title="Verde" style="width:28px;height:28px;border-radius:6px;border:1px solid #e6eef6;background:#16a34a;"></button>
              <button class="theme-swatch" data-color="red" title="Vermelho" style="width:28px;height:28px;border-radius:6px;border:1px solid #e6eef6;background:#ef4444;"></button>
              <button class="theme-swatch" data-color="yellow" title="Amarelo" style="width:28px;height:28px;border-radius:6px;border:1px solid #e6eef6;background:#f59e0b;"></button>
              <button class="theme-swatch" data-color="orange" title="Laranja" style="width:28px;height:28px;border-radius:6px;border:1px solid #e6eef6;background:#f97316;"></button>
              <button class="theme-swatch" data-color="purple" title="Roxo" style="width:28px;height:28px;border-radius:6px;border:1px solid #e6eef6;background:#7c3aed;"></button>
              <button class="theme-swatch" data-color="pink" title="Rosa" style="width:28px;height:28px;border-radius:6px;border:1px solid #e6eef6;background:#ec4899;"></button>
            </div>
            <div style="margin-top:10px;display:flex;align-items:center;gap:8px;">
              <label style="display:flex;align-items:center;gap:8px;">
                <input id="app-dark-mode-toggle" type="checkbox" /> Modo escuro
              </label>
            </div>
          </div>
        </div>
        <div class="modal-section hidden" id="section-marcas">
          <h4>Marcas e Modelos</h4>
          <div style="display:flex;gap:12px;height:100%;">
              <div id="marcas-list" style="width:200px;border-right:1px solid #eef2ff;padding-right:12px;overflow:auto;">
              <!-- marcas will be rendered here -->
            </div>
            <div id="marca-detail" style="flex:1;padding-left:12px;overflow:auto;">
              <div id="marca-placeholder" style="color:#64748b">Selecione uma marca à esquerda para ver/editar detalhes.</div>
            </div>
          </div>
        </div>
        <div class="modal-section hidden" id="section-about">
          <h4>Sobre</h4>
          <p>Versão da aplicação e informação.</p>
        </div>
        <div class="modal-actions">
          <button id="modal-save" class="btn-accent">Guardar</button>
          <button id="modal-close" class="btn">Fechar</button>
        </div>
      </section>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  // block focus outside
  overlay.focus();

  // wire menu clicks
  modal.querySelectorAll('.modal-menu ul li').forEach(li => {
    li.addEventListener('click', () => {
      modal.querySelectorAll('.modal-menu ul li').forEach(x=>x.classList.remove('active'));
      li.classList.add('active');
      const section = li.dataset.section;
      modal.querySelectorAll('.modal-section').forEach(s=>s.classList.add('hidden'));
      const el = modal.querySelector('#section-' + section);
      if(el) el.classList.remove('hidden');
    });
  });

  // --- Marcas & Modelos feature wiring ---
  (function setupMarcas(){
    const marcasSection = modal.querySelector('#section-marcas');
    if(!marcasSection) return;

    // use global marcasData (may be persisted in localStorage)
    const marcasData = window.marcasData || [];

    const listEl = marcasSection.querySelector('#marcas-list');
    const detailEl = marcasSection.querySelector('#marca-detail');

    function escapeHtml(str){
      if(!str) return '';
      return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }

    function renderList(){
      // header with add-brand button
      listEl.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div style="font-weight:700">Marcas</div>
          <button id="open-add-marca" class="btn" style="font-size:12px;padding:4px 8px;">＋ Adicionar</button>
        </div>
        <div id="add-marca-form" style="display:none;margin-bottom:8px;">
          <input id="nova-marca-nome" type="text" placeholder="Nome da marca" style="width:100%;padding:6px;border:1px solid #e6eef6;border-radius:6px;margin-bottom:6px;" />
          <input id="nova-marca-file" type="file" accept="image/*" style="margin-bottom:6px;" />
          <div style="display:flex;gap:8px;justify-content:flex-end;"><button id="cancel-add-marca" class="btn">Cancelar</button><button id="confirm-add-marca" class="btn btn-accent">Adicionar Marca</button></div>
        </div>
        <div id="marcas-items">
          ${marcasData.map(m => `\
            <div class="marca-item" data-id="${m.id}" style="padding:8px;border-radius:6px;cursor:pointer;border:1px solid transparent;margin-bottom:6px;">\
              ${m.name}\
            </div>`).join('')}
        </div>
      `;

      // attach click for marca items
      const items = listEl.querySelectorAll('.marca-item');
      items.forEach(el=>{
        el.addEventListener('click', () => {
          const id = el.dataset.id;
          const marca = marcasData.find(x=>x.id===id);
          showMarca(marca);
          // highlight
          listEl.querySelectorAll('.marca-item').forEach(x=>x.style.borderColor='transparent');
          el.style.borderColor = '#e2e8f0';
        });
      });

      // wire add-brand toggles
      const openAddBtn = listEl.querySelector('#open-add-marca');
      const addForm = listEl.querySelector('#add-marca-form');
      const cancelAdd = listEl.querySelector('#cancel-add-marca');
      const confirmAdd = listEl.querySelector('#confirm-add-marca');
      const novaNome = listEl.querySelector('#nova-marca-nome');
      const novaFile = listEl.querySelector('#nova-marca-file');

      if(openAddBtn && addForm){
        openAddBtn.addEventListener('click', ()=>{ addForm.style.display = addForm.style.display === 'none' ? 'block' : 'none'; });
      }
      if(cancelAdd){ cancelAdd.addEventListener('click', ()=>{ addForm.style.display='none'; novaNome.value=''; if(novaFile) novaFile.value=''; }); }

      if(confirmAdd){
        confirmAdd.addEventListener('click', ()=>{
          const name = (novaNome.value||'').trim();
          if(!name) return alert('Insira o nome da marca');
          const file = novaFile && novaFile.files && novaFile.files[0];
          const makeId = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g,'-') + '-' + Date.now();
          const newMarca = { id: makeId(name), name, models: [], image: '' };
            if(file){
            const reader = new FileReader();
            reader.onload = function(e){ newMarca.image = e.target.result; window.marcasData.push(newMarca); try{ localStorage.setItem('marcasData', JSON.stringify(window.marcasData)); }catch(_){ } try{ if(typeof window.updateDadosArtigoBrandLists === 'function') window.updateDadosArtigoBrandLists(); }catch(_){ } renderList(); };
            reader.readAsDataURL(file);
          } else {
            window.marcasData.push(newMarca);
            try{ localStorage.setItem('marcasData', JSON.stringify(window.marcasData)); }catch(_){ }
            try{ if(typeof window.updateDadosArtigoBrandLists === 'function') window.updateDadosArtigoBrandLists(); }catch(_){ }
            try{ if(typeof window.updateDadosArtigoBrandLists === 'function') window.updateDadosArtigoBrandLists(); }catch(_){ }
            renderList();
          }
        });
      }
    }

    function showMarca(marca){
      detailEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div>
            <div style="font-weight:700;font-size:16px">${marca.name}</div>
            <div style="color:#6b7280;font-size:13px;margin-top:4px">Editar marca e modelos</div>
          </div>
        </div>
        <div style="display:flex;gap:12px;align-items:flex-start;"> 
          <div style="width:240px;">
            <div style="font-weight:600;margin-bottom:6px">Foto da Marca</div>
            <div style="border:1px dashed #e6eef6;padding:8px;border-radius:6px;background:#fbfdff;min-height:120px;display:flex;align-items:center;justify-content:center;">
              <div id="marca-img-preview">${marca.image? `<img src="${marca.image}" style="max-width:100%;max-height:100%;" />` : '<div style="color:#94a3b8">Sem imagem</div>'}</div>
            </div>
            <input type="file" id="marca-img-file" style="margin-top:8px;" accept="image/*" />
          </div>
          <div style="flex:1;">
            <div style="font-weight:600;margin-bottom:6px">Modelos</div>
            <div id="modelos-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px;">
              ${marca.models.map((mo, idx)=>`<div class="modelo-item" data-index="${idx}" style="padding:8px;border:1px solid #eef2ff;border-radius:6px;display:flex;gap:8px;align-items:center;">\
                  <div style=\"width:48px;height:48px;border:1px solid #eef2ff;display:flex;align-items:center;justify-content:center;border-radius:4px;overflow:hidden;\">\
                    ${mo.image? `<img src=\"${mo.image}\" style=\"width:100%;height:100%;object-fit:cover;\" />` : '<div style="color:#94a3b8;font-size:12px">Sem imagem</div>'} \
                  </div>\
                  <div style=\"flex:1;min-width:0;\">\
                    <div style=\"font-weight:600;\">${mo.name}</div>\
                    <div style=\"color:#6b7280;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;\">${mo.description || ''}</div>\
                  </div>\
                </div>`).join('')}
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <button id="open-add-model-modal" class="btn btn-accent">Adicionar Modelo</button>
            </div>
          </div>
        </div>
      `;

      // wire file input
      const fileInput = detailEl.querySelector('#marca-img-file');
      const preview = detailEl.querySelector('#marca-img-preview');
      if(fileInput){
        fileInput.addEventListener('change', (ev)=>{
          const f = ev.target.files && ev.target.files[0];
          if(!f) return;
          const reader = new FileReader();
            reader.onload = function(e){
            marca.image = e.target.result;
            preview.innerHTML = `<img src="${marca.image}" style="max-width:100%;max-height:100%;" />`;
            try{ localStorage.setItem('marcasData', JSON.stringify(window.marcasData)); }catch(_){ }
            try{ if(typeof window.updateDadosArtigoBrandLists === 'function') window.updateDadosArtigoBrandLists(); }catch(_){ }
          };
          reader.readAsDataURL(f);
        });
      }

      // model list rendering and modal-based add/edit
      const modelosList = detailEl.querySelector('#modelos-list');

      function refreshModelosList(){
        modelosList.innerHTML = '';
        marca.models.forEach((mo, idx) => {
          const div = document.createElement('div');
          div.className = 'modelo-item';
          div.dataset.index = idx;
          div.style.padding = '8px'; div.style.border = '1px solid #eef2ff'; div.style.borderRadius = '6px'; div.style.display = 'flex'; div.style.gap = '8px'; div.style.alignItems = 'center';

          const thumb = document.createElement('div');
          thumb.style.width = '48px'; thumb.style.height = '48px'; thumb.style.border = '1px solid #eef2ff'; thumb.style.borderRadius = '4px'; thumb.style.overflow = 'hidden'; thumb.style.display = 'flex'; thumb.style.alignItems = 'center'; thumb.style.justifyContent = 'center';
          if(mo.image){ const img = document.createElement('img'); img.src = mo.image; img.style.width='100%'; img.style.height='100%'; img.style.objectFit='cover'; thumb.appendChild(img); }
          else { const no = document.createElement('div'); no.style.color = '#94a3b8'; no.style.fontSize = '12px'; no.textContent = 'Sem imagem'; thumb.appendChild(no); }

          const info = document.createElement('div'); info.style.flex='1'; info.style.minWidth='0';
          const title = document.createElement('div'); title.style.fontWeight='600'; title.textContent = mo.name;
          const d = document.createElement('div'); d.style.color='#6b7280'; d.style.fontSize='12px'; d.style.whiteSpace='nowrap'; d.style.overflow='hidden'; d.style.textOverflow='ellipsis'; d.textContent = mo.description || '';
          info.appendChild(title); info.appendChild(d);

          const editBtn = document.createElement('button'); editBtn.className='edit-model-btn'; editBtn.title='Editar modelo'; editBtn.style.border='none'; editBtn.style.background='transparent'; editBtn.style.cursor='pointer'; editBtn.style.fontSize='16px'; editBtn.style.padding='6px'; editBtn.innerHTML = '✏️';
          editBtn.addEventListener('click', (e)=>{ e.stopPropagation(); openModelModal(idx); });

          div.appendChild(thumb); div.appendChild(info); div.appendChild(editBtn);
          modelosList.appendChild(div);
        });
      }

      // modal for add/edit model
      function openModelModal(editIndex){
        const isEdit = typeof editIndex === 'number';
        const modelData = isEdit ? {...marca.models[editIndex]} : { name:'', description:'', image:'' };

        // modal overlay inside detailEl
        const overlay = document.createElement('div'); overlay.style.position='fixed'; overlay.style.left='0'; overlay.style.top='0'; overlay.style.right='0'; overlay.style.bottom='0'; overlay.style.background='rgba(0,0,0,0.3)'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center'; overlay.style.zIndex='9999';
        const box = document.createElement('div'); box.style.width='420px'; box.style.maxWidth='92%'; box.style.background='#fff'; box.style.borderRadius='8px'; box.style.padding='12px'; box.style.boxShadow='0 8px 24px rgba(15,23,42,0.12)';

        box.innerHTML = `
          <div style="font-weight:700;margin-bottom:8px">${isEdit? 'Editar Modelo':'Adicionar Modelo'}</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <input id="mdl-name" type="text" placeholder="Nome do modelo" value="${escapeHtml(modelData.name||'')}" style="padding:8px;border:1px solid #e6eef6;border-radius:6px;" />
            <textarea id="mdl-desc" placeholder="Descrição curta" style="padding:8px;border:1px solid #e6eef6;border-radius:6px;height:80px;">${escapeHtml(modelData.description||'')}</textarea>
            <div style="display:flex;gap:8px;align-items:center;"><input id="mdl-file" type="file" accept="image/*" /><div id="mdl-preview" style="width:64px;height:48px;border:1px solid #eef2ff;border-radius:4px;overflow:hidden;display:flex;align-items:center;justify-content:center;">${modelData.image? `<img src="${modelData.image}" style="width:100%;height:100%;object-fit:cover;" />` : '<div style="color:#94a3b8;font-size:12px">Sem imagem</div>'}</div></div>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:6px;"><button id="mdl-cancel" class="btn">Cancelar</button><button id="mdl-save" class="btn btn-accent">Guardar</button></div>
          </div>
        `;

        overlay.appendChild(box);
        detailEl.appendChild(overlay);

        const inpName = box.querySelector('#mdl-name');
        const inpDesc = box.querySelector('#mdl-desc');
        const inpFile = box.querySelector('#mdl-file');
        const preview = box.querySelector('#mdl-preview');
        const btnCancel = box.querySelector('#mdl-cancel');
        const btnSave = box.querySelector('#mdl-save');

        if(inpFile){
          inpFile.addEventListener('change', (ev)=>{
            const f = ev.target.files && ev.target.files[0];
            if(!f) return;
            const r = new FileReader();
            r.onload = function(e){ preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;" />`; modelData.image = e.target.result; };
            r.readAsDataURL(f);
          });
        }

        btnCancel.addEventListener('click', ()=>{ overlay.remove(); });

        btnSave.addEventListener('click', ()=>{
          const name = (inpName.value||'').trim();
          const desc = (inpDesc.value||'').trim();
          if(!name){ alert('Nome do modelo é obrigatório'); return; }

          const file = inpFile && inpFile.files && inpFile.files[0];
          function finalize(imageData){
            if(isEdit){
              marca.models[editIndex] = { name, description: desc, image: imageData || modelData.image || '' };
            } else {
              marca.models.push({ name, description: desc, image: imageData || modelData.image || '' });
            }
            try{ localStorage.setItem('marcasData', JSON.stringify(window.marcasData)); }catch(_){ }
            overlay.remove();
            refreshModelosList();
          }

          if(file){
            const r = new FileReader(); r.onload = function(e){ finalize(e.target.result); }; r.readAsDataURL(file);
          } else {
            finalize();
          }
        });
      }

      // open add-model modal button
      const openAddBtn = detailEl.querySelector('#open-add-model-modal');
      if(openAddBtn){ openAddBtn.addEventListener('click', ()=> openModelModal()); }

      // initial populate modelos
      refreshModelosList();
    }

    renderList();

    // if the marcas menu is opened programmatically, make sure the list is visible
    const menuMarcas = modal.querySelector('.modal-menu ul li[data-section="marcas"]');
    if(menuMarcas){
      menuMarcas.addEventListener('click', ()=>{
        // ensure list renders (in case recreated)
        setTimeout(()=> renderList(), 50);
      });
    }
  })();

  // prefill tools input
  const toolsInputEl = modal.querySelector('#modal-tools-input');
  if(toolsInputEl){
    const raw = localStorage.getItem('modern_tools');
    if(raw) toolsInputEl.value = raw;
    else if(toolsInput) toolsInputEl.value = toolsInput.value || '';
  }

  const closeBtn = modal.querySelector('#modal-close');
  const saveBtn = modal.querySelector('#modal-save');
  function destroy(){ if(modal) modal.remove(); if(overlay) overlay.remove(); }
  if(closeBtn) closeBtn.addEventListener('click', destroy);
  overlay.addEventListener('click', destroy);

  if(saveBtn){
    saveBtn.addEventListener('click', () => {
      const val = toolsInputEl ? toolsInputEl.value : '';
      try{ localStorage.setItem('modern_tools', val); }catch(_){}
      if(typeof loadTools === 'function') loadTools();
      destroy();
    });
  }
}

// Floating Account window with logout
function openAccountWindow(){
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  const modal = document.createElement('div'); modal.className = 'modal-window';
  const user = sessionStorage.getItem('pwa_user') || 'admin';
  modal.innerHTML = `
    <div class="modal-inner">
      <aside class="modal-menu">
        <h3>Conta</h3>
        <ul>
          <li class="active" data-section="profile">Perfil</li>
          <li data-section="security">Segurança</li>
          <li data-section="sessions">Sessões</li>
        </ul>
      </aside>
      <section class="modal-body">
        <div class="modal-section" id="section-profile">
          <h4>Perfil</h4>
          <p><strong>Utilizador:</strong> ${user}</p>
          <p><strong>Função:</strong> Administrador</p>
        </div>
        <div class="modal-section hidden" id="section-security">
          <h4>Segurança</h4>
          <p>Alterar palavra-passe (não funcional nesta demo).</p>
        </div>
        <div class="modal-section hidden" id="section-sessions">
          <h4>Sessões ativas</h4>
          <p>Lista de sessões recentes.</p>
        </div>
        <div class="modal-actions">
          <button id="account-logout" class="btn">Logout</button>
          <button id="account-close" class="btn-accent">Fechar</button>
        </div>
      </section>
    </div>
  `;
  document.body.appendChild(overlay); document.body.appendChild(modal);
  overlay.focus();
  modal.querySelectorAll('.modal-menu ul li').forEach(li => {
    li.addEventListener('click', () => {
      modal.querySelectorAll('.modal-menu ul li').forEach(x=>x.classList.remove('active'));
      li.classList.add('active');
      const section = li.dataset.section;
      modal.querySelectorAll('.modal-section').forEach(s=>s.classList.add('hidden'));
      const el = modal.querySelector('#section-' + section);
      if(el) el.classList.remove('hidden');
    });
  });
  const destroy = () => { modal.remove(); overlay.remove(); };
  overlay.addEventListener('click', destroy);
  const logout = modal.querySelector('#account-logout');
  const closeBtn = modal.querySelector('#account-close');
  if(closeBtn) closeBtn.addEventListener('click', destroy);
  if(logout) logout.addEventListener('click', () => {
    try{ sessionStorage.removeItem('pwa_logged'); sessionStorage.removeItem('pwa_user'); }catch(_){}
    location.reload();
  });
}

function minimizeWindow(id){
  const win = windows[id];
  if(!win) return;
  // animate minimizar
  win.style.transition = 'transform .18s ease, opacity .12s ease';
  win.style.transform = 'scale(0.95)';
  win.style.opacity = '0';
  setTimeout(()=>{ win.style.display = 'none'; win.style.transform=''; win.style.opacity=''; win.style.transition=''; }, 120);

  // adiciona ícone à taskbar
  // only add a taskbar icon if the taskbar element exists
  if(!taskbar) return;
  const icon = document.createElement('div');
  icon.className = 'min-icon';
  icon.dataset.win = id;
  const name = win.querySelector('.titlebar .title')?.textContent || 'Janela';
  icon.textContent = name;
  icon.addEventListener('click', () => {
    // restaurar
    win.style.display = 'flex';
    win.style.zIndex = ++zIndexCounter;
    // anima entrada
    win.style.transform = 'translateY(6px)';
    win.style.opacity = '0';
    setTimeout(() => { win.style.transform=''; win.style.opacity=''; }, 20);
    icon.remove();
  });
  taskbar.appendChild(icon);
}

// Dragging implementation
let dragState = null;
function startDrag(e){
  // only left button
  if(e.button !== 0) return;
  const win = e.currentTarget.parentElement;
  const rect = win.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;
  // use viewport size for bounds
  const vw = Math.max(document.documentElement.clientWidth || window.innerWidth, 0);
  const vh = Math.max(document.documentElement.clientHeight || window.innerHeight, 0);
  dragState = { win, offsetX, offsetY, vw, vh };

  function onMove(ev){
    if(!dragState) return;
    let left = ev.clientX - dragState.offsetX;
    let top = ev.clientY - dragState.offsetY;
    // keep in viewport bounds (allow small margins)
    const minLeft = 4;
    const minTop = 4;
    const maxLeft = dragState.vw - dragState.win.getBoundingClientRect().width - 8;
    const maxTop = dragState.vh - dragState.win.getBoundingClientRect().height - 8;
    left = Math.max(minLeft, Math.min(left, maxLeft));
    top = Math.max(minTop, Math.min(top, maxTop));
    dragState.win.style.left = left + 'px';
    dragState.win.style.top = top + 'px';
  }
  function onUp(){
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    dragState = null;
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// Resize implementation (corner only)
function startResize(e, id){
  e.stopPropagation();
  const win = windows[id];
  if(!win) return;
  const startRect = win.getBoundingClientRect();
  const startX = e.clientX, startY = e.clientY;

  function onMove(ev){
    let newW = Math.max(260, startRect.width + (ev.clientX - startX));
    let newH = Math.max(160, startRect.height + (ev.clientY - startY));
    // limit to viewport
    const vw = Math.max(document.documentElement.clientWidth || window.innerWidth, 0);
    const vh = Math.max(document.documentElement.clientHeight || window.innerHeight, 0);
    const left = startRect.left;
    const top = startRect.top;
    const maxW = Math.max(260, vw - left - 8);
    const maxH = Math.max(160, vh - top - 8);
    newW = Math.min(newW, maxW);
    newH = Math.min(newH, maxH);
    win.style.width = newW + 'px';
    win.style.height = newH + 'px';
  }

  function onUp(){
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// Progresso (simulado)
let procInterval = null;
const startProcessBtn = document.getElementById('start-process');
if(startProcessBtn && progressFill){
  startProcessBtn.addEventListener('click', () => {
    if(procInterval) return;
    let pct = 0;
    progressFill.style.width = '0%';
    procInterval = setInterval(() => {
      pct += Math.random() * 12;
      if(pct >= 100){ pct = 100; clearInterval(procInterval); procInterval = null; setTimeout(()=>progressFill.style.width='0%', 900); }
      progressFill.style.width = Math.round(pct) + '%';
    }, 300);
  });
}

// Abrir janelas iniciais de exemplo
// --- Initialization is gated behind login ---

function initApp(){
  // load saved tools into left column
  if(typeof loadTools === 'function') loadTools();

  // seed demo rows and enable resizers
  seedRandomRows();
  enableResizableColumns();
  try{ if(typeof updateLotesIcons === 'function') updateLotesIcons(); }catch(_){ }

  // ensure only the dashboard panel is visible on startup
  document.querySelectorAll('.data-panel').forEach(p => p.classList.add('hidden'));
  const dash = document.getElementById('panel-dashboard');
  if(dash) dash.classList.remove('hidden');
  // make dashboard tab active
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const dashTab = document.querySelector('.tab[data-target="panel-dashboard"]');
  if(dashTab) dashTab.classList.add('active');

  // Initialize POS system (but don't render products yet)
  posSystem = new POSSystem();
  
  // Setup POS event listeners (delayed to ensure elements exist)
  setTimeout(() => {
    setupPOSEventListeners();
  }, 100);

  // Setup taskbar horizontal scroll
  setupTaskbarScroll();

  // Initialize left column progress
  setTimeout(() => {
    simulateProgress();
  }, 500);

  // ensure filter is applied to the active panel on start
  // hide toolbar for dashboard
  try{ updateToolbarVisibility(); }catch(_){}
  setTimeout(filterTable, 60);
}

function setupPOSEventListeners() {
  // POS Close Button
  const closeBtn = document.getElementById('pos-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const posOverlay = document.getElementById('pos-overlay');
      if (posOverlay) {
        posOverlay.classList.add('hidden');
      }
    });
  }
  
  // POS Settings Button
  const settingsBtn = document.getElementById('pos-settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      const settingsModal = document.getElementById('pos-settings-modal');
      if (settingsModal) {
        settingsModal.classList.remove('hidden');
        loadPOSSettings();
      }
    });
  }
  
  // POS Settings Modal Close
  const closeSettingsBtn = document.getElementById('close-pos-settings');
  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => {
      const settingsModal = document.getElementById('pos-settings-modal');
      if (settingsModal) {
        settingsModal.classList.add('hidden');
      }
    });
  }
  
  // POS Settings Save
  const saveSettingsBtn = document.getElementById('pos-save-settings');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', savePOSSettings);
  }
  
  // POS Settings Reset
  const resetSettingsBtn = document.getElementById('pos-reset-settings');
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', resetPOSSettings);
  }
  
  // Close POS with ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const posOverlay = document.getElementById('pos-overlay');
      if (posOverlay && !posOverlay.classList.contains('hidden')) {
        posOverlay.classList.add('hidden');
      }
    }
  });
  
  // POS Search
  const searchInput = document.getElementById('pos-product-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const activeCategory = document.querySelector('.pos-category-btn.active')?.dataset.category || 'all';
      posSystem.renderProducts(activeCategory, e.target.value);
    });
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && e.target.value) {
        // Try to find exact match and add to cart
        const product = posSystem.products.find(p => 
          p.code.toLowerCase() === e.target.value.toLowerCase() ||
          p.name.toLowerCase().includes(e.target.value.toLowerCase())
        );
        if (product) {
          posSystem.addToCart(product.id);
          e.target.value = '';
          posSystem.renderProducts();
        }
      }
    });
  }

  // Category buttons
  document.querySelectorAll('.pos-category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.pos-category-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const searchTerm = document.getElementById('pos-product-search')?.value || '';
      posSystem.renderProducts(e.target.dataset.category, searchTerm);
    });
  });

  // Payment method buttons
  document.querySelectorAll('.pos-payment-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      posSystem.setPaymentMethod(e.target.dataset.method);
    });
  });

  // Checkout button
  const checkoutBtn = document.getElementById('pos-checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      posSystem.processCheckout();
    });
  }

  // Mobile cart toggle
  const cartToggle = document.getElementById('pos-cart-toggle');
  if (cartToggle) {
    cartToggle.addEventListener('click', () => {
      const cart = document.querySelector('.pos-cart');
      if (cart) {
        cart.classList.toggle('open');
      }
    });
  }

  // Handle resize for responsive POS
  function handlePOSResize() {
    const cartToggle = document.getElementById('pos-cart-toggle');
    if (!cartToggle) return;

    if (window.innerWidth <= 968) {
      cartToggle.style.display = 'block';
    } else {
      cartToggle.style.display = 'none';
      const cart = document.querySelector('.pos-cart');
      if (cart) cart.classList.remove('open');
    }
  }

  window.addEventListener('resize', handlePOSResize);
  handlePOSResize(); // Call initially

  // Focus the bottom SKU entry when POS overlay opens and wire Enter for quick add
  try{
    const skuInput = document.getElementById('pos-entry-sku');
    const qtyInput = document.getElementById('pos-entry-qty');
    if(skuInput){
      // When overlay becomes visible, focus
      const overlay = document.getElementById('pos-overlay');
      if(overlay){
        const mo = new MutationObserver(()=>{
          if(!overlay.classList.contains('hidden')){
            try{ skuInput.focus(); skuInput.select(); }catch(_){ }
          }
        });
        mo.observe(overlay, { attributes:true, attributeFilter:['class'] });
      }

      skuInput.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter'){
          const code = skuInput.value || 'DEMO';
          const qty = parseFloat(qtyInput?.value || '1') || 1;
          // Try using posSystem.addToCart if exists (expects product id)
          try{
            if(window.posSystem && typeof window.posSystem.addToCart === 'function'){
              // attempt to locate a product by code or name
              const prod = (window.posSystem.products || []).find(p => (p.code && p.code.toLowerCase() === code.toLowerCase()) || (p.name && p.name.toLowerCase().includes(code.toLowerCase())));
              if(prod){
                // update the quantity then add
                window.posSystem.addToCart(prod.id, qty);
                skuInput.value = '';
                return;
              }
            }
          }catch(_){ }

          // fallback: append a simple visual item to cart
          const container = document.getElementById('pos-cart-items');
          if(container){
            const div = document.createElement('div');
            div.className = 'pos-cart-item';
            div.innerHTML = `<div class="pos-cart-item-info"><div class="pos-cart-item-name">${code}</div><div class="pos-cart-item-price">€1.25 x ${qty}</div></div>`;
            container.appendChild(div);
          }
        }
      });
    }
  }catch(_){ }
}

// Expor função para consola
window.openWindow = openWindow;

// Open a floating window 'Procura de Artigo' used by the Artigos -> Procurar button
function openProcuraArtigoWindow(){
  const content = `
    <div style="display:flex;flex-direction:column;height:100%;">
      <div class="procura-toolbar" style="display:flex;gap:8px;align-items:center;padding:8px;border-bottom:1px solid #e6eef7;">
        <button class="procura-btn">Filtro</button>
        <button class="procura-btn">Pesquisa Avançada</button>
        <button class="procura-btn">Atualizar</button>
        <div style="flex:1"></div>
        <button class="procura-btn" id="procura-close">Fechar</button>
      </div>

      <div style="padding:12px">
        <div class="procura-card" style="display:flex;gap:12px;align-items:center">
          <div style="flex:1">
            <label style="display:block;font-size:12px;color:#374151;margin-bottom:6px">Descrição</label>
            <div class="procura-search-wrapper">
              <input id="procura-desc" class="procura-input" type="text" placeholder="Pesquisar por descrição..." />
              <span class="procura-search-icon">🔎</span>
            </div>
          </div>
          <div style="width:240px">
            <label style="display:block;font-size:12px;color:#374151;margin-bottom:6px">Referência</label>
            <input id="procura-ref" class="procura-input" type="text" placeholder="Ex: A100" />
          </div>
          <div style="display:flex;align-items:end">
            <button id="procura-search-btn" class="procura-btn btn-accent">Pesquisar</button>
          </div>
        </div>
      </div>

      <div style="padding:12px;flex:1;overflow:auto">
        <div class="procura-table-card">
          <table id="procura-articles-table" style="width:100%;border-collapse:collapse">
            <thead>
              <tr><th>SKU</th><th>Descrição</th><th>Stock</th><th>Preço</th></tr>
            </thead>
            <tbody>
              <tr><td>A100</td><td>Parafuso 4mm</td><td>124</td><td>0,05</td></tr>
              <tr><td>A200</td><td>Lubrificante</td><td>42</td><td>2,50</td></tr>
              <tr><td>B300</td><td>Rolamento</td><td>18</td><td>5,20</td></tr>
              <tr><td>C400</td><td>Arruela</td><td>0</td><td>0,10</td></tr>
              <tr><td>D500</td><td>Porca M6</td><td>-5</td><td>0,08</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const id = openWindow({ title: '🔎 Procura de Artigo', content, width: 720, height: 520, left: 120, top: 90 });

  // attach handlers for the new window
  const winEl = windows[id];
  if(!winEl) return id;
  // If we have artigosData saved, populate the table body from it instead of demo rows
  try{
    const table = winEl.querySelector('#procura-articles-table');
    if(table){
      const tbody = table.querySelector('tbody') || table.appendChild(document.createElement('tbody'));
      if(Array.isArray(window.artigosData) && window.artigosData.length){
        tbody.innerHTML = window.artigosData.map(a => `<tr><td>${(a.ref||'')}</td><td>${(a.name||'')}</td><td>0</td><td>0,00</td></tr>`).join('');
      }
    }
  }catch(_){ }
  // wire dblclick handlers for rows in this Procura window
  try{ wireProcuraRowHandlers(winEl); }catch(_){ }
  // close toolbar button
  const closeBtn = winEl.querySelector('#procura-close');
  if(closeBtn) closeBtn.addEventListener('click', ()=> winEl.remove());

  // wire simple filter: desc/ref inputs filter the table
  const inputDesc = winEl.querySelector('#procura-desc');
  const inputRef = winEl.querySelector('#procura-ref');
  const searchBtn = winEl.querySelector('#procura-search-btn');
  function filterProcura(){
    const qd = (inputDesc && inputDesc.value || '').trim().toLowerCase();
    const qr = (inputRef && inputRef.value || '').trim().toLowerCase();
    const rows = Array.from(winEl.querySelectorAll('#procura-articles-table tbody tr'));
    rows.forEach(r => {
      const sku = (r.children[0].textContent||'').toLowerCase();
      const desc = (r.children[1].textContent||'').toLowerCase();
      let ok = true;
      if(qd) ok = ok && desc.indexOf(qd) !== -1;
      if(qr) ok = ok && sku.indexOf(qr) !== -1;
      r.style.display = ok ? '' : 'none';
    });
  }
  if(inputDesc) inputDesc.addEventListener('input', filterProcura);
  if(inputRef) inputRef.addEventListener('input', filterProcura);
  if(searchBtn) searchBtn.addEventListener('click', filterProcura);

  // focus the description input for quick search and add Enter key to trigger search
  setTimeout(()=>{ try{ if(inputDesc){ inputDesc.focus(); inputDesc.select(); inputDesc.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ filterProcura(); } }); } }catch(_){ } }, 80);

  // enable column resizing in this table as well
  setTimeout(enableResizableColumns, 160);

  return id;
}

// Open Client (Cliente) window
function openClientWindow(){
  const content = `
    <div class="clientes-root">
      <!-- Top header (blue) with artigo-style toolbar -->
      <div class="artigos-toolbar">
        <div class="clientes-toolbar-actions">
          <button class="artigo-btn" title="Novo Cliente"><span class="icon">➕</span><span class="label">Novo</span></button>
          <button class="artigo-btn" title="Procurar Cliente"><span class="icon">🔍</span><span class="label">Procurar</span></button>
          <button class="artigo-btn" title="Alterar Cliente"><span class="icon">✏️</span><span class="label">Alterar</span></button>
          <button class="artigo-btn" title="Eliminar Cliente"><span class="icon">🗑️</span><span class="label">Eliminar</span></button>
          <button class="artigo-btn" title="Imprimir Lista"><span class="icon">🖨️</span><span class="label">Imprimir</span></button>
          <button class="artigo-btn" title="Exportar/Importar Dados"><span class="icon">📤</span><span class="label">Exportar/Importar</span></button>
          <button class="artigo-btn" title="Atualizar Lista"><span class="icon">🔄</span><span class="label">Atualizar</span></button>
        </div>
        <div style="flex:1"></div>
        <div style="flex:0 0 auto;"></div>
      </div>

      <!-- Secondary info row (matches Artigos smaller typographic scale) -->
      <div class="artigo-info clientes-info">
        <div style="display:flex;align-items:center;gap:8px;min-width:220px;">
          <div style="font-weight:700;font-size:11px;min-width:80px;text-align:left;">Nº Cliente</div>
          <input id="client-id" type="text" style="width:120px;border:1px solid #e6eef7;border-radius:6px;font-size:11px;" />
        </div>

        <div style="flex:1;display:flex;align-items:center;gap:12px;">
          <div style="font-weight:700;min-width:60px;font-size:11px;">Nome</div>
          <input id="client-name" type="text" style="flex:1;border:1px solid #e6eef7;border-radius:8px;font-size:11px;" />
        </div>
      </div>

      <!-- Tabs (reuse artigo-menu-btn look) -->
      <div class="artigos-menu-tabs">
        <button class="artigo-menu-btn active"><span class="icon">📋</span><span class="label">Dados Cliente</span></button>
        <button class="artigo-menu-btn"><span class="icon">⚙️</span><span class="label">Configurações</span></button>
        <button class="artigo-menu-btn"><span class="icon">🗂️</span><span class="label">Outros Dados</span></button>
        <button class="artigo-menu-btn"><span class="icon">🏅</span><span class="label">Clube de Pontos</span></button>
        <button class="artigo-menu-btn"><span class="icon">🔒</span><span class="label">RGPD</span></button>
      </div>

      <!-- Main content area (form left, sidebar right) -->
  <div class="clientes-main">
        <div style="flex:1;display:flex;flex-direction:column;gap:12px;min-width:0;">
          <div class="clientes-form-card">
            <div class="clientes-form-grid">
              <label class="pos-small-label">Abrev.:</label>
              <input id="client-abrev" type="text" style="border:1px solid #e6eef7;border-radius:6px;" />
              <label class="pos-small-label">Activo:</label>
              <select id="client-active" style="border:1px solid #e6eef7;border-radius:6px;"><option>SIM</option><option>NÃO</option></select>

              <label class="pos-small-label">Morada 1:</label>
              <input id="client-address1" type="text" style="border:1px solid #e6eef7;border-radius:6px;grid-column:2/span 3;" />

              <label class="pos-small-label">Morada 2:</label>
              <input id="client-address2" type="text" style="border:1px solid #e6eef7;border-radius:6px;grid-column:2/span 3;" />

              <label class="pos-small-label">Código Postal:</label>
              <input id="client-postal" type="text" style="border:1px solid #e6eef7;border-radius:6px;max-width:140px;" />
              <label class="pos-small-label">Localidade:</label>
              <input id="client-city" type="text" style="border:1px solid #e6eef7;border-radius:6px;" />

              <label class="pos-small-label">Contacto:</label>
              <input id="client-contact" type="text" style="border:1px solid #e6eef7;border-radius:6px;" />
              <label class="pos-small-label">Telefone:</label>
              <input id="client-phone" type="text" style="border:1px solid #e6eef7;border-radius:6px;" />

              <label class="pos-small-label">Telemóvel:</label>
              <input id="client-mobile" type="text" style="border:1px solid #e6eef7;border-radius:6px;" />
              <label class="pos-small-label">Fax:</label>
              <input id="client-fax" type="text" style="border:1px solid #e6eef7;border-radius:6px;" />

              <label class="pos-small-label">Nº Contribuinte:</label>
              <input id="client-nif" type="text" style="border:1px solid #e6eef7;border-radius:6px;" />
              <label class="pos-small-label">Nº BI:</label>
              <input id="client-bi" type="text" style="border:1px solid #e6eef7;border-radius:6px;" />

              <label class="pos-small-label">País:</label>
              <select id="client-country" style="border:1px solid #e6eef7;border-radius:6px;"><option>PORTUGAL</option><option>ESPANHA</option></select>
              <label class="pos-small-label">CAE:</label>
              <input id="client-cae" type="text" style="border:1px solid #e6eef7;border-radius:6px;" />
            </div>
          </div>
        </div>

  <aside class="clientes-aside">
          

          <div class="clientes-aside-card">
            <div style="font-weight:700;margin-bottom:8px;">Informação Geral</div>
            <div style="display:grid;grid-template-columns:1fr 60px;gap:6px 10px;align-items:center;font-size:11px;">
              <div>Contas Abertas:</div><div id="client-accounts-open" style="text-align:right;">0</div>
              <div>T.M.R.:</div><div id="client-tmr" style="text-align:right;">0</div>
              <div>Pontos actuais:</div><div id="client-points" style="text-align:right;">0</div>
              <div>Vales dispon.:</div><div id="client-vales" style="text-align:right;">0</div>
            </div>
            <div class="clientes-process"><button class="artigo-btn">Processar</button></div>
          </div>
        </aside>
      </div>
    </div>
  `;

  const winId = openWindow({ title: '👥 FICHA DE CLIENTE', content, width: 980, height: 640, left: 60, top: 48 });
  const winEl = windows[winId];
  try{ if(winEl) winEl.dataset.window = 'dados-clientes'; }catch(_){ }
  if(!winEl) return;

  // wire procurar (search) button inside the clientes toolbar
  try{
    const procurarBtn = winEl.querySelector('.artigos-toolbar .artigo-btn[title="Procurar Cliente"]');
    if(procurarBtn) procurarBtn.addEventListener('click', () => { try{ openProcuraClientesWindow(); }catch(e){ console.error(e); } });
  }catch(_){ }

  // wire close button inside the window content
  try{
    const closeBtn = winEl.querySelector('#client-window-close');
    if(closeBtn){ closeBtn.addEventListener('click', () => winEl.remove()); }
    const cancelBtn = winEl.querySelector('#client-cancel');
    if(cancelBtn){ cancelBtn.addEventListener('click', () => winEl.remove()); }
    const saveBtn = winEl.querySelector('#client-save');
    if(saveBtn){
      saveBtn.addEventListener('click', () => {
        // gather fields
        const client = {
          id: (winEl.querySelector('#client-id')?.value || '').trim(),
          name: winEl.querySelector('#client-name')?.value || '',
          abrev: winEl.querySelector('#client-abrev')?.value || '',
          nif: winEl.querySelector('#client-nif')?.value || '',
          bi: winEl.querySelector('#client-bi')?.value || '',
          phone: winEl.querySelector('#client-phone')?.value || '',
          mobile: winEl.querySelector('#client-mobile')?.value || '',
          fax: winEl.querySelector('#client-fax')?.value || '',
          contact: winEl.querySelector('#client-contact')?.value || '',
          address1: winEl.querySelector('#client-address1')?.value || '',
          address2: winEl.querySelector('#client-address2')?.value || '',
          city: winEl.querySelector('#client-city')?.value || '',
          postal: winEl.querySelector('#client-postal')?.value || '',
          country: winEl.querySelector('#client-country')?.value || '',
          cae: winEl.querySelector('#client-cae')?.value || '',
          createdAt: new Date().toISOString()
        };
        try{
          const key = 'clientes';
          const all = JSON.parse(localStorage.getItem(key) || '[]');
          if(client.id){
            // if client id exists, update existing entry (by id) otherwise add
            const idx = all.findIndex(c => (c.id || '').toString() === client.id.toString());
            if(idx !== -1){
              // preserve createdAt if present
              client.createdAt = all[idx].createdAt || client.createdAt;
              all[idx] = client;
            } else {
              all.push(client);
            }
          } else {
            // no id provided — just push and let caller decide numbering
            all.push(client);
          }
          localStorage.setItem(key, JSON.stringify(all));
          // feedback using custom toast if available
          try{ if(window.showToast) window.showToast('Cliente guardado', 'success', 2000); else alert('Cliente guardado'); }catch(_){ alert('Cliente guardado'); }
          // refresh any open Procura Clientes windows
          try{ if(typeof window.refreshProcuraClients === 'function') window.refreshProcuraClients(); }catch(_){ }
        }catch(e){ console.error('Erro ao guardar cliente', e); if(window.showToast) window.showToast('Erro ao guardar cliente', 'error', 3000); }
      });
    }
    
    // wire toolbar buttons: Novo / Alterar / Eliminar to behave like Artigos
    try{
      const novoBtn = winEl.querySelector('.artigos-toolbar .artigo-btn[title="Novo Cliente"]');
      if(novoBtn){
        novoBtn.addEventListener('click', ()=>{
          try{
            const idEl = winEl.querySelector('#client-id');
            const nameEl = winEl.querySelector('#client-name');
            const idVal = (idEl?.value||'').trim();
            const nameVal = (nameEl?.value||'').trim();
            if(!nameVal){ if(window.showToast) window.showToast('Insira o nome do cliente', 'error'); else alert('Insira o nome do cliente'); if(nameEl) nameEl.focus(); return; }
            const key = 'clientes';
            const all = JSON.parse(localStorage.getItem(key) || '[]');
            if(idVal){
              const exists = all.some(c=> (c.id||'') === idVal);
              if(exists){ if(window.showToast) window.showToast('Já existe um cliente com esse número', 'error'); else alert('Já existe um cliente com esse número'); if(idEl) idEl.focus(); return; }
            } else {
              // generate a simple unique id (timestamp-based)
              let newId = String(Date.now()).slice(-8);
              while(all.some(c=> (c.id||'') === newId)) newId = (Date.now()+Math.floor(Math.random()*1000)).toString().slice(-8);
              if(idEl) idEl.value = newId;
            }
            // gather fields (minimal)
            const client = {
              id: (winEl.querySelector('#client-id')?.value||'').trim(),
              name: winEl.querySelector('#client-name')?.value || '',
              abrev: winEl.querySelector('#client-abrev')?.value || '',
              nif: winEl.querySelector('#client-nif')?.value || '',
              bi: winEl.querySelector('#client-bi')?.value || '',
              phone: winEl.querySelector('#client-phone')?.value || '',
              mobile: winEl.querySelector('#client-mobile')?.value || '',
              fax: winEl.querySelector('#client-fax')?.value || '',
              contact: winEl.querySelector('#client-contact')?.value || '',
              address1: winEl.querySelector('#client-address1')?.value || '',
              address2: winEl.querySelector('#client-address2')?.value || '',
              city: winEl.querySelector('#client-city')?.value || '',
              postal: winEl.querySelector('#client-postal')?.value || '',
              country: winEl.querySelector('#client-country')?.value || '',
              cae: winEl.querySelector('#client-cae')?.value || '',
              createdAt: new Date().toISOString()
            };
            all.push(client);
            localStorage.setItem(key, JSON.stringify(all));
            try{ if(window.showToast) window.showToast('Cliente criado', 'success'); else alert('Cliente criado'); }catch(_){ try{ alert('Cliente criado'); }catch(__){} }
            try{ if(typeof window.refreshProcuraClients === 'function') window.refreshProcuraClients(); }catch(_){ }
          }catch(e){ console.error('Erro handler Novo Cliente', e); }
        });
      }

      const alterarBtn = winEl.querySelector('.artigos-toolbar .artigo-btn[title="Alterar Cliente"]');
      if(alterarBtn){
        alterarBtn.addEventListener('click', ()=>{
          try{
            const idVal = (winEl.querySelector('#client-id')?.value||'').trim();
            if(!idVal){ if(window.showToast) window.showToast('Insira o Nº Cliente antes de alterar', 'error'); else alert('Insira o Nº Cliente antes de alterar'); const f = winEl.querySelector('#client-id'); if(f) f.focus(); return; }
            const key = 'clientes';
            const all = JSON.parse(localStorage.getItem(key) || '[]');
            const idx = all.findIndex(c=> (c.id||'').toString() === idVal.toString());
            if(idx === -1){ if(window.showToast) window.showToast('Cliente não encontrado para alterar', 'error'); else alert('Cliente não encontrado para alterar'); return; }
            const originalCreated = all[idx].createdAt || new Date().toISOString();
            const updated = {
              id: idVal,
              name: winEl.querySelector('#client-name')?.value || '',
              abrev: winEl.querySelector('#client-abrev')?.value || '',
              nif: winEl.querySelector('#client-nif')?.value || '',
              bi: winEl.querySelector('#client-bi')?.value || '',
              phone: winEl.querySelector('#client-phone')?.value || '',
              mobile: winEl.querySelector('#client-mobile')?.value || '',
              fax: winEl.querySelector('#client-fax')?.value || '',
              contact: winEl.querySelector('#client-contact')?.value || '',
              address1: winEl.querySelector('#client-address1')?.value || '',
              address2: winEl.querySelector('#client-address2')?.value || '',
              city: winEl.querySelector('#client-city')?.value || '',
              postal: winEl.querySelector('#client-postal')?.value || '',
              country: winEl.querySelector('#client-country')?.value || '',
              cae: winEl.querySelector('#client-cae')?.value || '',
              createdAt: originalCreated
            };
            all[idx] = updated;
            localStorage.setItem(key, JSON.stringify(all));
            try{ if(window.showToast) window.showToast('Cliente alterado', 'success'); else alert('Cliente alterado'); }catch(_){ }
            try{ if(typeof window.refreshProcuraClients === 'function') window.refreshProcuraClients(); }catch(_){ }
          }catch(e){ console.error('Erro handler Alterar Cliente', e); }
        });
      }

      const eliminarBtn = winEl.querySelector('.artigos-toolbar .artigo-btn[title="Eliminar Cliente"]');
      if(eliminarBtn){
        eliminarBtn.addEventListener('click', ()=>{
          try{
            const idVal = (winEl.querySelector('#client-id')?.value||'').trim();
            if(!idVal){ if(window.showToast) window.showToast('Insira o Nº Cliente antes de eliminar', 'error'); else alert('Insira o Nº Cliente antes de eliminar'); const f = winEl.querySelector('#client-id'); if(f) f.focus(); return; }
            if(!confirm || confirm('Tem a certeza que pretende eliminar este cliente?') ){
              const key = 'clientes';
              const all = JSON.parse(localStorage.getItem(key) || '[]');
              const idx = all.findIndex(c=> (c.id||'').toString() === idVal.toString());
              if(idx === -1){ if(window.showToast) window.showToast('Cliente não encontrado para eliminar', 'error'); else alert('Cliente não encontrado para eliminar'); return; }
              all.splice(idx,1);
              localStorage.setItem(key, JSON.stringify(all));
              // clear form
              try{ winEl.querySelector('#client-id').value = ''; winEl.querySelector('#client-name').value = ''; }catch(_){ }
              try{ if(window.showToast) window.showToast('Cliente eliminado', 'success'); else alert('Cliente eliminado'); }catch(_){ }
              try{ if(typeof window.refreshProcuraClients === 'function') window.refreshProcuraClients(); }catch(_){ }
            }
          }catch(e){ console.error('Erro handler Eliminar Cliente', e); }
        });
      }
    }catch(e){ console.error('Erro a wire toolbar clientes', e); }
  }catch(e){ console.error(e); }
}

// Open Fornecedor (Supplier) window
function openFornecedorWindow(){
  const content = `
    <div style="height:100%;display:flex;flex-direction:column;">
      <div class="artigos-toolbar">
        <button class="artigo-btn"><span class="icon">🆕</span><span class="label">Novo</span></button>
        <button class="artigo-btn"><span class="icon">➕</span><span class="label">Inserir</span></button>
        <button class="artigo-btn"><span class="icon">✏️</span><span class="label">Alterar</span></button>
        <button class="artigo-btn"><span class="icon">🗑️</span><span class="label">Eliminar</span></button>
        <button class="artigo-btn"><span class="icon">📄</span><span class="label">Importar dos Contactos</span></button>
        <button class="artigo-btn"><span class="icon">💰</span><span class="label">Contexto</span></button>
        <div style="flex:1"></div>
        <button id="fornecedor-window-close" class="artigo-btn"><span class="icon">✕</span><span class="label">Fechar</span></button>
      </div>

      <div class="artigo-info" style="display:flex;flex-direction:column;gap:8px;padding:12px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <label class="artigo-ref" style="margin-right:6px;">Nº Fornecedor</label>
            <input id="fornecedor-id" type="text" style="width:90px;padding:6px;border:1px solid #d1d5db;border-radius:6px;" />
            <button class="artigo-btn" style="padding:6px 8px;">F2</button>
          </div>

          <label class="artigo-nome" style="margin-left:6px;">Nome</label>
          <input id="fornecedor-name" type="text" style="flex:1;padding:6px;border:1px solid #d1d5db;border-radius:6px;" />

          <div style="display:flex;gap:6px;margin-left:8px;align-items:center;">
            <button class="artigo-btn">🔎</button>
            <button class="artigo-btn">CRM</button>
          </div>

          <div style="width:180px;display:flex;gap:8px;align-items:center;justify-content:flex-end;">
            <label style="font-size:12px;color:#6b7280;margin-right:6px;">Data Abr:</label>
            <input type="date" value="2025-10-23" style="padding:6px;border:1px solid #d1d5db;border-radius:6px;" />
          </div>
        </div>

        <div style="display:flex;gap:12px;">
          <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
            <div style="display:grid;grid-template-columns:120px 1fr 120px 1fr;gap:8px;align-items:center;">
              <label class="pos-small-label">Abrev.:</label>
              <input id="fornecedor-abrev" type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:6px;" />
              <label class="pos-small-label">Activo:</label>
              <select id="fornecedor-active" style="padding:6px;border:1px solid #d1d5db;border-radius:6px;"><option>SIM</option><option>NÃO</option></select>

              <label class="pos-small-label">Tipo Conta:</label>
              <select id="fornecedor-tipo" style="padding:6px;border:1px solid #d1d5db;border-radius:6px;grid-column:2/span 3;">
                <option>C/CORRENTE</option>
                <option>FORNECEDOR</option>
                <option>SERVIÇOS</option>
              </select>

              <label class="pos-small-label">Morada1:</label>
              <input id="fornecedor-address1" type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:6px;grid-column:2/span 3;" />

              <label class="pos-small-label">Morada2:</label>
              <input id="fornecedor-address2" type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:6px;grid-column:2/span 3;" />

              <label class="pos-small-label">Código Postal:</label>
              <input id="fornecedor-postal" type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:6px;max-width:140px;" />
              <label class="pos-small-label">Localidade:</label>
              <input id="fornecedor-city" type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:6px;" />

              <label class="pos-small-label">Contacto:</label>
              <input id="fornecedor-contact" type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:6px;" />
              <label class="pos-small-label">Telefone:</label>
              <input id="fornecedor-phone" type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:6px;" />

              <label class="pos-small-label">Telemóvel:</label>
              <input id="fornecedor-mobile" type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:6px;" />
              <label class="pos-small-label">Fax:</label>
              <input id="fornecedor-fax" type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:6px;" />

              <label class="pos-small-label">Nº Contribuinte:</label>
              <input id="fornecedor-nif" type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:6px;" />
              <label class="pos-small-label">Website:</label>
              <input id="fornecedor-website" type="url" style="padding:6px;border:1px solid #d1d5db;border-radius:6px;" />

              <label class="pos-small-label">País:</label>
              <select id="fornecedor-country" style="padding:6px;border:1px solid #d1d5db;border-radius:6px;"><option>PORTUGAL</option><option>ESPANHA</option><option>FRANÇA</option><option>ALEMANHA</option></select>
              <label class="pos-small-label">Email:</label>
              <input id="fornecedor-email" type="email" style="padding:6px;border:1px solid #d1d5db;border-radius:6px;" />
            </div>

            <!-- Tabs under Dados do Fornecedor -->
            <div style="margin-top:8px;">
              <div class="artigos-menu-tabs" style="margin-bottom:8px;">
                <button class="artigo-menu-btn active">Dados Fornecedor</button>
                <button class="artigo-menu-btn">Condições</button>
                <button class="artigo-menu-btn">Bancários</button>
                <button class="artigo-menu-btn">Observações</button>
              </div>

              <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;min-height:120px;">
                <div style="display:grid;grid-template-columns:140px 1fr 140px 1fr;gap:8px;align-items:center;">
                  <label class="pos-small-label">Prazo Pagamento:</label>
                  <select style="padding:6px;border:1px solid #d1d5db;border-radius:6px;">
                    <option>30 dias</option>
                    <option>60 dias</option>
                    <option>90 dias</option>
                    <option>Pronto Pagamento</option>
                  </select>
                  <label class="pos-small-label">Moeda:</label>
                  <select style="padding:6px;border:1px solid #d1d5db;border-radius:6px;">
                    <option>EUR</option>
                    <option>USD</option>
                    <option>GBP</option>
                  </select>

                  <label class="pos-small-label">Desconto Comercial:</label>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input type="number" value="0" style="flex:1;padding:6px;border:1px solid #d1d5db;border-radius:6px;text-align:right;" />
                    <span style="color:#6b7280;">%</span>
                  </div>
                  <label class="pos-small-label">IBAN:</label>
                  <input type="text" style="padding:6px;border:1px solid #d1d5db;border-radius:6px;" />
                </div>
              </div>
            </div>
          </div>

          <aside style="width:360px;display:flex;flex-direction:column;gap:8px;">
            <div style="background:white;border:1px solid #e2e8f0;padding:8px;border-radius:8px;min-height:160px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="font-weight:700;color:#0f172a;">Histórico de Compras</div>
                <div style="display:flex;gap:6px;"><button class="artigo-btn">📊</button><button class="artigo-btn">🔍</button></div>
              </div>
              <div style="height:80px;border:1px dashed #e6eef7;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#94a3b8;">(últimas compras)</div>
            </div>

            <div style="background:white;border:1px solid #e2e8f0;padding:8px;border-radius:8px;">
              <div style="font-weight:700;margin-bottom:6px;color:#0f172a">Informação Financeira</div>
              <div style="display:grid;grid-template-columns:1fr 80px;gap:6px 10px;align-items:center;font-size:13px;color:#0f172a;">
                <div>Saldo Actual:</div><div id="fornecedor-saldo" style="text-align:right;font-weight:600;">0,00 €</div>
                <div>Facturas Abertas:</div><div id="fornecedor-facturas" style="text-align:right;">0</div>
                <div>Última Compra:</div><div id="fornecedor-ultima" style="text-align:right;">--</div>
                <div>Valor Anual:</div><div id="fornecedor-anual" style="text-align:right;">0,00 €</div>
              </div>
              <div style="display:flex;justify-content:flex-end;margin-top:8px;"><button class="artigo-btn">Extrato</button></div>
            </div>
          </aside>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px;padding:12px;border-top:1px solid #e6eef7;background:#fafafa;">
        <button id="fornecedor-save" class="btn-accent">Guardar</button>
        <button id="fornecedor-cancel" class="btn">Fechar</button>
      </div>
    </div>
  `;

  const winId = openWindow({ title: '🏭 FICHA DE FORNECEDOR', content, width: 980, height: 640, left: 60, top: 48 });
  const winEl = windows[winId];
  if(!winEl) return;

  // wire close button inside the window content
  try{
    const closeBtn = winEl.querySelector('#fornecedor-window-close');
    if(closeBtn){ closeBtn.addEventListener('click', () => winEl.remove()); }
    const cancelBtn = winEl.querySelector('#fornecedor-cancel');
    if(cancelBtn){ cancelBtn.addEventListener('click', () => winEl.remove()); }
    const saveBtn = winEl.querySelector('#fornecedor-save');
    if(saveBtn){
      saveBtn.addEventListener('click', () => {
        // gather fields (simple demo save to localStorage)
        const fornecedor = {
          id: winEl.querySelector('#fornecedor-id')?.value || '',
          name: winEl.querySelector('#fornecedor-name')?.value || '',
          abrev: winEl.querySelector('#fornecedor-abrev')?.value || '',
          tipo: winEl.querySelector('#fornecedor-tipo')?.value || '',
          nif: winEl.querySelector('#fornecedor-nif')?.value || '',
          phone: winEl.querySelector('#fornecedor-phone')?.value || '',
          mobile: winEl.querySelector('#fornecedor-mobile')?.value || '',
          fax: winEl.querySelector('#fornecedor-fax')?.value || '',
          email: winEl.querySelector('#fornecedor-email')?.value || '',
          website: winEl.querySelector('#fornecedor-website')?.value || '',
          contact: winEl.querySelector('#fornecedor-contact')?.value || '',
          address1: winEl.querySelector('#fornecedor-address1')?.value || '',
          address2: winEl.querySelector('#fornecedor-address2')?.value || '',
          city: winEl.querySelector('#fornecedor-city')?.value || '',
          postal: winEl.querySelector('#fornecedor-postal')?.value || '',
          country: winEl.querySelector('#fornecedor-country')?.value || ''
        };
        try{
          // store under demo key
          const all = JSON.parse(localStorage.getItem('demo_fornecedores') || '[]');
          all.push(fornecedor);
          localStorage.setItem('demo_fornecedores', JSON.stringify(all));
          // give feedback
          alert('Fornecedor guardado (demo).');
        }catch(e){ console.error('Erro ao guardar fornecedor demo', e); }
      });
    }
  }catch(e){ console.error(e); }
}

// Open Orçamento window (beautiful style like Artigos)
function openOrcamentoWindow(){
  const content = `
    <div style="height:100%;display:flex;flex-direction:column;">
      <div class="artigos-toolbar">
        <button class="artigo-btn" title="Inserir F7"> <span class="icon">✅</span> <span class="label">Inserir F7</span></button>
        <button class="artigo-btn" title="Alterar"> <span class="icon">🔄</span> <span class="label">Alterar</span></button>
        <button class="artigo-btn" title="Eliminar"> <span class="icon">⛔</span> <span class="label">Eliminar</span></button>
        <button class="artigo-btn" title="Pré-Visualizar"> <span class="icon">🔍</span> <span class="label">Pré-Visualizar</span></button>
        <button class="artigo-btn" title="Contexto"> <span class="icon">⚙️</span> <span class="label">Contexto</span></button>
        <div style="flex:1"></div>
        <button id="orc-close" class="artigo-btn" title="Fechar"> <span class="icon">✕</span> <span class="label">Fechar</span></button>
      </div>

      <div class="artigo-info">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
          <div class="artigo-ref">
            <label>Tipo de Documento</label>
            <select id="orc-tipo">
              <option>FACTURA PROFORMA</option>
              <option>ORÇAMENTO</option>
            </select>
          </div>
          
          <div style="width:140px;">
            <label>Estado</label>
            <select id="orc-estado">
              <option>23-10-2025</option>
            </select>
          </div>
          
          <div style="flex:1"></div>
          
          <div style="width:80px;">
            <label>Série</label>
            <input id="orc-serie" type="text" value="2025" />
          </div>
          
          <div style="width:80px;">
            <label>Nº Doc.</label>
            <input id="orc-num" type="text" value="0" readonly style="background:#f3f4f6;" />
          </div>
        </div>
        
        <div style="display:flex;gap:8px;align-items:center;">
          <div style="flex:1;">
            <label style="font-weight:700;font-size:13px;">DOCUMENTO ORÇAMENTO</label>
          </div>
          
          <div style="width:140px;">
            <label>Concretizado</label>
            <select id="orc-concretizado">
              <option>NÃO</option>
              <option>SIM</option>
            </select>
          </div>
          
          <div style="width:140px;">
            <label>Secção</label>
            <input id="orc-seccao" type="text" value="BALCÃO" />
          </div>
          
          <div style="width:160px;">
            <label>Data</label>
            <input id="orc-data" type="date" value="2025-10-23" />
          </div>
        </div>
      </div>

      <div class="artigo-content-area" style="flex:1;padding:16px;overflow:auto;">
        <!-- Cabeçalho section -->
        <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);margin-bottom:16px;">
          <div style="background:linear-gradient(90deg,#f8fafc,#eef2ff);padding:6px 10px;margin:-12px -12px 12px -12px;border-bottom:1px solid #e2e8f0;font-weight:600;font-size:12px;border-radius:8px 8px 0 0;">Cabeçalho</div>
          
          <div style="display:grid;grid-template-columns:80px 1fr 110px 1fr;row-gap:8px;column-gap:12px;align-items:center;">
            <label class="pos-small-label">Nº Conta:</label>
            <div style="display:flex;gap:6px;">
              <input id="orc-conta" type="text" style="flex:1;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;" />
              <button style="padding:4px 10px;border:1px solid #cbd5e1;background:linear-gradient(180deg,#f9fafb,#f3f4f6);border-radius:6px;font-size:11px;cursor:pointer;">F2</button>
              <button style="padding:4px 8px;border:1px solid #cbd5e1;background:linear-gradient(180deg,#f9fafb,#f3f4f6);border-radius:6px;cursor:pointer;">👤</button>
            </div>
            <div></div>
            <div></div>

            <label class="pos-small-label">Nome:</label>
            <input id="orc-nome" type="text" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;" />
            <label class="pos-small-label">Nº Contribuinte:</label>
            <input id="orc-nif" type="text" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;" />

            <label class="pos-small-label">Nome Abr.:</label>
            <input id="orc-nome-abrev" type="text" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;" />
            <button style="padding:4px 12px;border:1px solid #3b82f6;background:#dbeafe;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;align-self:start;">c/IVA</button>
            <button style="padding:4px 12px;border:1px solid #cbd5e1;background:linear-gradient(180deg,#f9fafb,#f3f4f6);border-radius:6px;font-size:11px;cursor:pointer;align-self:start;">Anular</button>

            <label class="pos-small-label">Morada:</label>
            <input id="orc-morada" type="text" style="grid-column:2;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;" />
            <label class="pos-small-label">Saldo Actual:</label>
            <div style="display:flex;gap:6px;align-items:center;">
              <input type="text" value="0,00" readonly style="padding:6px 8px;border:1px solid #fbbf24;border-radius:6px;font-size:12px;background:#fef3c7;width:90px;font-weight:600;" />
              <button style="padding:4px 8px;border:1px solid #cbd5e1;background:linear-gradient(180deg,#f9fafb,#f3f4f6);border-radius:6px;cursor:pointer;">✏️</button>
            </div>

            <label class="pos-small-label">CP:</label>
            <input id="orc-postal" type="text" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;max-width:140px;" />
            <label class="pos-small-label">Localidade:</label>
            <input id="orc-localidade" type="text" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;" />

            <label class="pos-small-label">Telefone:</label>
            <input id="orc-telefone" type="text" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;" />
            <label class="pos-small-label">Fax:</label>
            <input id="orc-fax" type="text" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;" />
            
            <div></div>
            <div></div>
            <label class="pos-small-label">Telemóvel:</label>
            <input id="orc-telemovel" type="text" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;" />
          </div>
        </div>

        <!-- Tabs section -->
        <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow:hidden;height:400px;display:flex;flex-direction:column;">
          <div class="artigos-menu-tabs" style="margin:0;border-radius:0;">
            <button class="artigo-menu-btn active" onclick="changeOrcamentoTab(this, 'geral')">
              <span class="icon">📋</span>
              <span class="label">Geral</span>
            </button>
            <button class="artigo-menu-btn" onclick="changeOrcamentoTab(this, 'carga')">
              <span class="icon">📦</span>
              <span class="label">Carga</span>
            </button>
            <button class="artigo-menu-btn" onclick="changeOrcamentoTab(this, 'outros')">
              <span class="icon">📄</span>
              <span class="label">Outros</span>
            </button>
          </div>
          
          <div id="orc-tab-content" style="padding:16px;flex:1;overflow:auto;background:#f8fafc;">
            <div id="orc-tab-geral" style="display:flex;gap:16px;">
              <div style="flex:1;">
                <div style="display:grid;grid-template-columns:160px 1fr;gap:8px 12px;align-items:center;max-width:580px;">
                  <label class="pos-small-label">Vendedor:</label>
                  <select id="orc-vendedor" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;">
                    <option></option>
                  </select>

                  <label class="pos-small-label">Condições de Pagamento:</label>
                  <select id="orc-cond-pag" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;">
                    <option></option>
                  </select>

                  <label class="pos-small-label">Forma de Pagamento:</label>
                  <select id="orc-forma-pag" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;">
                    <option></option>
                  </select>

                  <label class="pos-small-label">Tabela de Preços:</label>
                  <select id="orc-tabela-precos" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;">
                    <option></option>
                  </select>

                  <label class="pos-small-label">Imposto:</label>
                  <select id="orc-imposto" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;">
                    <option></option>
                  </select>

                  <label class="pos-small-label">Banco:</label>
                  <select id="orc-banco" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;">
                    <option></option>
                  </select>

                  <label class="pos-small-label">Docto de Referência:</label>
                  <input id="orc-doc-ref" type="text" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;" />
                </div>
              </div>
              
              <!-- Right side panel inside Geral tab -->
              <div style="width:280px;">
                <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                  <div style="font-weight:600;margin-bottom:12px;color:#0f172a;font-size:13px;">Informações Adicionais</div>
                  <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 10px;align-items:center;font-size:12px;">
                    <label class="pos-small-label" style="white-space:nowrap;">Taxa de Comissão:</label>
                    <div style="display:flex;gap:4px;align-items:center;">
                      <input type="number" value="0" style="flex:1;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;text-align:right;" />
                      <span style="color:#6b7280;">%</span>
                    </div>

                    <label class="pos-small-label" style="white-space:nowrap;">Data de Vencimento:</label>
                    <input type="date" value="2025-10-23" style="padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;" />

                    <label class="pos-small-label" style="white-space:nowrap;">Taxa de Desconto:</label>
                    <div style="display:flex;gap:4px;align-items:center;">
                      <input type="number" value="0" style="flex:1;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;text-align:right;" />
                      <span style="color:#6b7280;white-space:nowrap;">+ 0 %</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div id="orc-tab-carga" style="display:none;">
              <p style="color:#64748b;font-size:13px;text-align:center;margin-top:40px;">Informações de carga...</p>
            </div>
            <div id="orc-tab-outros" style="display:none;">
              <p style="color:#64748b;font-size:13px;text-align:center;margin-top:40px;">Outros dados...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const winId = openWindow({ title: 'FICHA ORÇAMENTO', content, width: 1150, height: 700, left: 50, top: 30 });
  const winEl = windows[winId];
  if(!winEl) return;

  // wire close button
  try{
    const closeBtn = winEl.querySelector('#orc-close'); 
    if(closeBtn) closeBtn.addEventListener('click', () => winEl.remove());
  }catch(e){ console.error('Erro wiring orcamento window', e); }
}

// Function to change Orçamento tabs
window.changeOrcamentoTab = function(btn, tabName) {
  const windowEl = btn.closest('.window');
  if (!windowEl) return;
  
  // Update active button
  const allBtns = windowEl.querySelectorAll('.orc-tab-btn');
  allBtns.forEach(b => {
    b.classList.remove('active');
    b.style.background = '#b8b8b8';
    b.style.fontWeight = 'normal';
  });
  btn.classList.add('active');
  btn.style.background = '#d0d0d0';
  btn.style.fontWeight = '600';
  
  // Show/hide tab content
  const tabs = ['geral', 'carga', 'outros'];
  tabs.forEach(t => {
    const tabEl = windowEl.querySelector(`#orc-tab-${t}`);
    if (tabEl) {
      tabEl.style.display = (t === tabName) ? 'block' : 'none';
    }
  });
}

// Tables search / filter
const tablesSearch = document.getElementById('tables-search');
const tablesFilterSelect = document.getElementById('tables-filter-select');
function getActivePanel(){
  return document.querySelector('.data-panel:not(.hidden)');
}
function filterTable(){
  const panel = getActivePanel();
  if(!panel) return;
  const table = panel.querySelector('table');
  if(!table) return;
  const q = (tablesSearch && tablesSearch.value || '').trim().toLowerCase();
  const mode = (tablesFilterSelect && tablesFilterSelect.value) || 'any';
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  for(const r of rows){
    const cells = Array.from(r.querySelectorAll('td')).map(c=>c.textContent.trim().toLowerCase());
    let ok = false;
    if(!q) ok = true;
    else if(mode === 'any'){
      ok = cells.some(c => c.indexOf(q) !== -1);
    } else if(mode === 'id'){
      ok = cells[0] && cells[0].indexOf(q) !== -1;
    } else if(mode === 'cliente'){
      ok = cells[1] && cells[1].indexOf(q) !== -1;
    } else if(mode === 'data'){
      ok = cells.find(c => /\d{4}-\d{2}-\d{2}/.test(c) && c.indexOf(q) !== -1) || false;
    }
    r.style.display = ok ? '' : 'none';
  }
}
if(tablesSearch) tablesSearch.addEventListener('input', filterTable);
if(tablesFilterSelect) tablesFilterSelect.addEventListener('change', filterTable);

// re-filter when tabs change (so filter applies to new table)
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => setTimeout(filterTable, 50)));

// Make table columns resizable by injecting resizer handles into each th
function enableResizableColumns(){
  document.querySelectorAll('.data-panel table').forEach(table => {
    const ths = table.querySelectorAll('th');
    ths.forEach(th => {
      if(th.querySelector('.col-resizer')) return; // already added
      const handle = document.createElement('div');
      handle.className = 'col-resizer';
      th.appendChild(handle);

      let startX = 0;
      let startWidth = 0;
      function onPointerMove(e){
        const dx = e.clientX - startX;
        const newW = Math.max(40, startWidth + dx);
        th.style.width = newW + 'px';
      }
      function onPointerUp(){
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
      }
      handle.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        startX = ev.clientX;
        startWidth = th.getBoundingClientRect().width;
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
      });
    });
  });
}

// Populate tables with random rows up to 10 rows (if they have fewer)
function seedRandomRows(){
  const tables = document.querySelectorAll('.data-panel table');
  const rand = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
  tables.forEach(table => {
    const tbody = table.querySelector('tbody') || (function(){ const b=document.createElement('tbody'); table.appendChild(b); return b; })();
    const cols = table.querySelectorAll('th').length;
    const existing = tbody.querySelectorAll('tr').length;
    for(let i = existing; i < 10; i++){
      const tr = document.createElement('tr');
      for(let c=0;c<cols;c++){
        const td = document.createElement('td');
        // generate simple random content based on column type guessing from header text
        const hdr = (table.querySelectorAll('th')[c]?.textContent || '').toLowerCase();
        if(hdr.includes('id')||hdr.includes('nº')||hdr.includes('sku')) td.textContent = rand(1000,9999);
        else if(hdr.includes('fornecedor')||hdr.includes('cliente')||hdr.includes('nome')||hdr.includes('destino')) td.textContent = ['Acme','Loja X','Cliente Y','Fornecedor Z'][rand(0,3)];
        else if(hdr.includes('data')) td.textContent = `2025-10-${String(rand(1,28)).padStart(2,'0')}`;
        else if(hdr.includes('total')||hdr.includes('preço')||hdr.includes('stock')) td.textContent = (Math.random()*1000).toFixed(hdr.includes('preço')?2:2);
        else td.textContent = '—';
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  });
}

// init after DOM ready: seed rows and enable resizers
// Wire login form: support both backend auth and demo mode
const loginForm = document.getElementById('login-form');
const loginScreen = document.getElementById('login-screen');
const loginError = document.getElementById('login-error');

// If session says we're already logged in, remove overlay and init immediately
if(sessionStorage.getItem('pwa_logged') === '1'){
  if(loginScreen) loginScreen.remove();
  initApp();
} else if(loginForm){
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const username = (f.querySelector('#login-username') || {}).value || f.username && f.username.value || '';
    const pass = (f.querySelector('#login-password') || {}).value || f.password && f.password.value || '';
    
    (async () => {
      try{
        // Check for demo credentials first
        if(username === 'admin' && pass === 'admin'){
          // Demo mode - no backend required
          try{ sessionStorage.setItem('pwa_logged','1'); sessionStorage.setItem('pwa_user', 'admin'); }catch(_){/* ignore */}
          if(loginScreen){
            loginScreen.classList.add('fade-out');
            const done = () => { loginScreen && loginScreen.remove(); initApp(); };
            let handled = false;
            const onEnd = () => { if(handled) return; handled = true; loginScreen.removeEventListener('transitionend', onEnd); loginScreen.removeEventListener('animationend', onEnd); done(); };
            loginScreen.addEventListener('transitionend', onEnd);
            loginScreen.addEventListener('animationend', onEnd);
            setTimeout(()=>{ if(!handled) onEnd(); }, 700);
          } else { initApp(); }
          return;
        }
        
        // Try backend login (email/password) - only if it looks like an email
        if(username.includes('@') && window.pwaApi){ 
          await window.pwaApi.login(username, pass); 
          try{ sessionStorage.setItem('pwa_logged','1'); sessionStorage.setItem('pwa_user', username); }catch(_){/* ignore */}
          if(loginScreen){
            loginScreen.classList.add('fade-out');
            const done = () => { loginScreen && loginScreen.remove(); initApp(); };
            let handled = false;
            const onEnd = () => { if(handled) return; handled = true; loginScreen.removeEventListener('transitionend', onEnd); loginScreen.removeEventListener('animationend', onEnd); done(); };
            loginScreen.addEventListener('transitionend', onEnd);
            loginScreen.addEventListener('animationend', onEnd);
            setTimeout(()=>{ if(!handled) onEnd(); }, 700);
          } else { initApp(); }
        } else {
          // Not demo credentials and not email format
          throw new Error('Credenciais inválidas. Use admin/admin para modo demo ou email/password para login real.');
        }
      } catch(err){
        if(loginError) {
          loginError.textContent = 'Falha no login: ' + (err.message || 'Use admin/admin para modo demo');
        }
      }
    })();
  });
} else {
  // If no login form is present, initialize immediately (safe fallback)
  initApp();
}

// POS Settings Functions
function loadPOSSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem('posSettings')) || {};
    
    // Load store settings
    document.getElementById('pos-store-name').value = settings.storeName || 'PlastiBorracha';
    document.getElementById('pos-store-address').value = settings.storeAddress || '';
    
    // Load price settings
    document.getElementById('pos-show-tax').checked = settings.showTax !== false;
    document.getElementById('pos-tax-rate').value = settings.taxRate || 23;
    
    // Load receipt settings
    document.getElementById('pos-auto-print').checked = settings.autoPrint || false;
    document.getElementById('pos-show-barcode').checked = settings.showBarcode !== false;
    
    // Load system settings
    document.getElementById('pos-sound-enabled').checked = settings.soundEnabled !== false;
    document.getElementById('pos-theme').value = settings.theme || 'light';
  } catch (e) {
    console.error('Erro ao carregar definições POS:', e);
  }
}

function savePOSSettings() {
  try {
    const settings = {
      storeName: document.getElementById('pos-store-name').value,
      storeAddress: document.getElementById('pos-store-address').value,
      showTax: document.getElementById('pos-show-tax').checked,
      taxRate: parseFloat(document.getElementById('pos-tax-rate').value) || 23,
      autoPrint: document.getElementById('pos-auto-print').checked,
      showBarcode: document.getElementById('pos-show-barcode').checked,
      soundEnabled: document.getElementById('pos-sound-enabled').checked,
      theme: document.getElementById('pos-theme').value
    };
    
    localStorage.setItem('posSettings', JSON.stringify(settings));
    
    // Update POS system with new settings
    if (posSystem) {
      posSystem.updateSettings(settings);
    }
    
    // Close modal
    document.getElementById('pos-settings-modal').classList.add('hidden');
    
    // Show success message
    alert('Definições guardadas com sucesso!');
  } catch (e) {
    console.error('Erro ao guardar definições POS:', e);
    alert('Erro ao guardar definições!');
  }
}

function resetPOSSettings() {
  if (confirm('Tem certeza que deseja repor todas as definições aos valores padrão?')) {
    localStorage.removeItem('posSettings');
    loadPOSSettings();
    alert('Definições repostas aos valores padrão!');
  }
}

// Taskbar Scroll Functions
function setupTaskbarScroll() {
  const taskbar = document.getElementById('taskbar');
  const leftIndicator = document.getElementById('taskbar-left-indicator');
  const rightIndicator = document.getElementById('taskbar-right-indicator');
  
  if (!taskbar) return;

  // Update scroll indicators
  function updateScrollIndicators() {
    const canScrollLeft = taskbar.scrollLeft > 0;
    const canScrollRight = taskbar.scrollLeft < (taskbar.scrollWidth - taskbar.clientWidth);
    
    if (leftIndicator) {
      leftIndicator.classList.toggle('visible', canScrollLeft);
    }
    if (rightIndicator) {
      rightIndicator.classList.toggle('visible', canScrollRight);
    }
  }

  // Add horizontal scroll with mouse wheel
  taskbar.addEventListener('wheel', (e) => {
    // Prevent vertical scrolling
    e.preventDefault();
    
    // Scroll horizontally
    const scrollAmount = e.deltaY > 0 ? 100 : -100;
    taskbar.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  }, { passive: false });

  // Update indicators on scroll
  taskbar.addEventListener('scroll', updateScrollIndicators);

  // Add touch scroll support for mobile
  let startX = 0;
  let scrollLeft = 0;

  taskbar.addEventListener('touchstart', (e) => {
    startX = e.touches[0].pageX - taskbar.offsetLeft;
    scrollLeft = taskbar.scrollLeft;
  });

  taskbar.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const x = e.touches[0].pageX - taskbar.offsetLeft;
    const walk = (x - startX) * 2; // Multiply for faster scroll
    taskbar.scrollLeft = scrollLeft - walk;
  });

  // Add keyboard navigation
  taskbar.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      taskbar.scrollBy({ left: -100, behavior: 'smooth' });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      taskbar.scrollBy({ left: 100, behavior: 'smooth' });
    }
  });

  // Make taskbar focusable for keyboard navigation
  taskbar.setAttribute('tabindex', '0');

  // Observer for when taskbar content changes
  const observer = new MutationObserver(updateScrollIndicators);
  observer.observe(taskbar, { childList: true, subtree: true });

  // Initial check
  setTimeout(updateScrollIndicators, 100);
}

// Left Column Progress Functions
function updateLeftProgress(percentage, text = null) {
  const progressFill = document.getElementById('left-progress-fill');
  const progressText = document.getElementById('left-progress-text');
  
  if (progressFill) {
    progressFill.style.width = percentage + '%';
  }
  
  if (progressText && text) {
    progressText.textContent = text;
  }
}

function simulateProgress() {
  const steps = [
    { progress: 0, text: '0%', delay: 100 },
    { progress: 25, text: '25%', delay: 300 },
    { progress: 50, text: '50%', delay: 500 },
    { progress: 75, text: '75%', delay: 700 },
    { progress: 100, text: '100%', delay: 1000 }
  ];
  
  steps.forEach((step, index) => {
    setTimeout(() => {
      updateLeftProgress(step.progress, step.text);
    }, step.delay);
  });
}

// === Custom context menu for PWA ===
// Prevent the native browser context menu globally except for elements opting out (class .allow-native-context)
;(function(){
  let currentContextTarget = null;

  // create menu element
  const menu = document.createElement('div');
  menu.className = 'custom-context-menu hidden';
  menu.innerHTML = `<ul></ul>`;
  document.body.appendChild(menu);

  function buildTableMenu(tr, table){
    const ul = menu.querySelector('ul');
    ul.innerHTML = '';

    // Copy row text
    const liCopy = document.createElement('li');
    liCopy.textContent = 'Copiar linha';
    liCopy.addEventListener('click', async () => {
      hideMenu();
      if(!tr) return;
      try{
        const text = Array.from(tr.querySelectorAll('td')).map(td=>td.textContent.trim()).join('\t');
        await navigator.clipboard.writeText(text);
      }catch(e){ console.warn('Clipboard failed', e); }
    });
    ul.appendChild(liCopy);

    // Export CSV
    const liCsv = document.createElement('li');
    liCsv.textContent = 'Exportar tabela (CSV)';
    liCsv.addEventListener('click', () => {
      hideMenu();
      exportTableToCSV(table || tr && tr.closest('table'));
    });
    ul.appendChild(liCsv);

    // Select all rows (simple highlight toggle)
    const liSelect = document.createElement('li');
    liSelect.textContent = 'Selecionar todas as linhas';
    liSelect.addEventListener('click', () => {
      hideMenu();
      const all = (table || tr && tr.closest('table'))?.querySelectorAll('tbody tr');
      if(!all) return;
      all.forEach(r => r.classList.add('selected-row'));
      setTimeout(()=> all.forEach(r => r.classList.remove('selected-row')), 1200);
    });
    ul.appendChild(liSelect);

    // small muted hint
    const liHint = document.createElement('li'); liHint.className='muted'; liHint.textContent='Clique fora para fechar';
    ul.appendChild(liHint);
  }

  function showMenu(x,y){
    menu.classList.remove('hidden');
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    // keep inside viewport
    const rect = menu.getBoundingClientRect();
    const pad = 8;
    if(rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width - pad) + 'px';
    if(rect.bottom > window.innerHeight) menu.style.top = (window.innerHeight - rect.height - pad) + 'px';
  }

  function hideMenu(){
    menu.classList.add('hidden');
    currentContextTarget = null;
  }

  function exportTableToCSV(tableEl){
    if(!tableEl) return;
    const rows = Array.from(tableEl.querySelectorAll('tr'));
    const csv = rows.map(r => Array.from(r.querySelectorAll('th,td')).map(cell => '"' + (cell.textContent||'').replace(/"/g,'""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = (tableEl.id || 'tabela') + '.csv';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  // global contextmenu handler
  document.addEventListener('contextmenu', (e) => {
    // allow native context menu if element or ancestor has this class
    if(e.target.closest('.allow-native-context')) return;

    // intercept globally
    e.preventDefault();

    const tr = e.target.closest('tr');
    const table = e.target.closest('table');
    if(table){
      currentContextTarget = {tr, table};
      buildTableMenu(tr, table);
      showMenu(e.clientX, e.clientY);
      return;
    }

    // if clicked outside of a table, hide menu
    hideMenu();
  });

  // hide on click, escape, resize, scroll
  document.addEventListener('click', (e)=>{ if(!e.target.closest('.custom-context-menu')) hideMenu(); });
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') hideMenu(); });
  window.addEventListener('resize', hideMenu);
  window.addEventListener('scroll', hideMenu, true);

  // helper: expose functions for other modules if needed
  window.customContextMenu = {
    showForTable(tableEl, x, y){ buildTableMenu(null, tableEl); showMenu(x,y); },
    hide: hideMenu
  };
})();

// Open Vendas (Sales) window — uses Artigos styles (toolbar, tabs, info area)
function openVendasWindow(){
  const content = `
    <div style="height:100%;display:flex;flex-direction:column;">
      <div class="artigos-toolbar">
        <div style="display:flex;gap:8px;align-items:center;">
          <button class="artigo-btn" title="Novo Documento"><span class="icon">🆕</span><span class="label">Novo</span></button>
          <button class="artigo-btn" title="Procurar Documento"><span class="icon">🔍</span><span class="label">Procurar</span></button>
          <button class="artigo-btn" title="Salvar Documento"><span class="icon">💾</span><span class="label">Salvar</span></button>
          <button class="artigo-btn" title="Imprimir"><span class="icon">🖨️</span><span class="label">Imprimir</span></button>
          <div style="flex:1"></div>
          <button id="vendas-close" class="artigo-btn" title="Fechar"><span class="icon">✕</span><span class="label">Fechar</span></button>
        </div>
      </div>

      <div class="artigo-info" style="display:flex;flex-direction:column;gap:8px;padding:12px 14px;">
        <div style="display:flex;gap:12px;align-items:center;">
          <div style="display:flex;flex-direction:column;min-width:160px">
            <label style="font-size:11px;font-weight:600">Tipo de Documento</label>
            <select id="vendas-tipo" style="padding:6px;border-radius:6px;border:1px solid #e6eef7;font-size:12px"><option>FACTURA</option><option>ORÇAMENTO</option></select>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <div style="display:flex;flex-direction:column"><label style="font-size:11px;font-weight:600">Série</label><input id="vendas-serie" type="text" style="padding:6px;border:1px solid #e6eef7;border-radius:6px;width:90px" value="2025"/></div>
            <div style="display:flex;flex-direction:column"><label style="font-size:11px;font-weight:600">Nº Provisório</label><input id="vendas-num" type="text" style="padding:6px;border:1px solid #e6eef7;border-radius:6px;width:120px"/></div>
            <div style="display:flex;flex-direction:column"><label style="font-size:11px;font-weight:600">Data</label><input id="vendas-data" type="date" value="${(new Date()).toISOString().slice(0,10)}" style="padding:6px;border:1px solid #e6eef7;border-radius:6px;"/></div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:120px 1fr 120px 1fr;gap:8px;align-items:center;margin-top:6px;">
          <label style="font-size:11px;font-weight:600">Nº Conta</label>
          <div style="display:flex;gap:8px;align-items:center"><input id="vendas-conta" type="text" style="padding:6px;border:1px solid #e6eef7;border-radius:6px;flex:1"/><button class="artigo-btn">F2</button></div>
          <label style="font-size:11px;font-weight:600">Nº Contribuinte</label>
          <input id="vendas-nif" type="text" style="padding:6px;border:1px solid #e6eef7;border-radius:6px;"/>

          <label style="font-size:11px;font-weight:600">Nome</label>
          <input id="vendas-name" type="text" style="padding:6px;border:1px solid #e6eef7;border-radius:6px;grid-column:2/span 3;"/>

          <label style="font-size:11px;font-weight:600">Morada</label>
          <input id="vendas-address" type="text" style="padding:6px;border:1px solid #e6eef7;border-radius:6px;grid-column:2/span 3;"/>

          <label style="font-size:11px;font-weight:600">Localidade</label>
          <input id="vendas-city" type="text" style="padding:6px;border:1px solid #e6eef7;border-radius:6px;"/>
          <label style="font-size:11px;font-weight:600">Telefone</label>
          <input id="vendas-phone" type="text" style="padding:6px;border:1px solid #e6eef7;border-radius:6px;"/>
        </div>
      </div>

      <div class="artigos-menu-tabs" style="margin-top:6px;">
        <button class="artigo-menu-btn active"><span class="icon">📋</span><span class="label">Geral</span></button>
        <button class="artigo-menu-btn"><span class="icon">🚚</span><span class="label">Entrega</span></button>
        <button class="artigo-menu-btn"><span class="icon">🧾</span><span class="label">Linhas</span></button>
        <button class="artigo-menu-btn"><span class="icon">⚙️</span><span class="label">Config</span></button>
      </div>

      <div class="artigo-content-area" style="flex:1;overflow:auto;padding:12px;">
        <div style="border:1px solid #e6eef7;border-radius:8px;padding:12px;min-height:120px;">
          <div>Aqui pode inserir as linhas do documento e campos adicionais (demo).</div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px;padding:12px;border-top:1px solid #e6eef7;background:#fafafa;">
        <button id="vendas-save" class="btn-accent">Guardar</button>
        <button id="vendas-cancel" class="btn">Fechar</button>
      </div>
    </div>
  `;

  const id = openWindow({ title: '📄 FICHA DOCUMENTO COMERCIAL - VENDAS', content, width: 980, height: 560, left: 120, top: 80 });
  const winEl = windows[id];
  if(!winEl) return id;

  // wire close/cancel
  try{
    const closeBtn = winEl.querySelector('#vendas-close'); if(closeBtn) closeBtn.addEventListener('click', ()=> winEl.remove());
    const cancel = winEl.querySelector('#vendas-cancel'); if(cancel) cancel.addEventListener('click', ()=> winEl.remove());
  }catch(_){ }

  // wire save (persist minimal demo data to localStorage 'vendas')
  try{
    const saveBtn = winEl.querySelector('#vendas-save');
    if(saveBtn){
      saveBtn.addEventListener('click', ()=>{
        try{
          const doc = {
            tipo: winEl.querySelector('#vendas-tipo')?.value || '',
            serie: winEl.querySelector('#vendas-serie')?.value || '',
            numero: winEl.querySelector('#vendas-num')?.value || '',
            data: winEl.querySelector('#vendas-data')?.value || '',
            conta: winEl.querySelector('#vendas-conta')?.value || '',
            nif: winEl.querySelector('#vendas-nif')?.value || '',
            name: winEl.querySelector('#vendas-name')?.value || '',
            address: winEl.querySelector('#vendas-address')?.value || '',
            city: winEl.querySelector('#vendas-city')?.value || '',
            phone: winEl.querySelector('#vendas-phone')?.value || '',
            createdAt: new Date().toISOString()
          };
          const key = 'vendas';
          const all = JSON.parse(localStorage.getItem(key) || '[]');
          all.push(doc);
          localStorage.setItem(key, JSON.stringify(all));
          try{ if(window.showToast) window.showToast('Documento guardado', 'success'); else alert('Documento guardado'); }catch(_){ }
        }catch(e){ console.error('Erro ao guardar venda', e); if(window.showToast) window.showToast('Erro ao guardar venda', 'error'); }
      });
    }
  }catch(_){ }

  return id;
}
