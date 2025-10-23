// Modernized JS: mantém funcionalidades (abrir janelas, redimensionar, minimizar, taskbar, guardar ferramentas)
// Registo service worker (se existir)
console.log('app.js (pwa_02) loaded — guarded listeners enabled');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(()=>{ /* ignore */ });
}

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
                    <small>Adicione produtos para começar</small>
                </div>
            `;
            summary.style.display = 'none';
            return;
        }

        container.innerHTML = this.cart.map(item => `
            <div class="pos-cart-item">
                <div class="pos-cart-item-info">
                    <div class="pos-cart-item-name">${item.name}</div>
                    <div class="pos-cart-item-price">€${item.price.toFixed(2)} x ${item.quantity}</div>
                </div>
                <div class="pos-cart-item-controls">
                    <button class="pos-qty-btn" onclick="posSystem.updateQuantity(${item.id}, -1)">-</button>
                    <span class="pos-qty-display">${item.quantity}</span>
                    <button class="pos-qty-btn" onclick="posSystem.updateQuantity(${item.id}, 1)">+</button>
                    <button class="pos-qty-btn pos-remove-btn" onclick="posSystem.removeFromCart(${item.id})">×</button>
                </div>
            </div>
        `).join('');

        this.updateCartSummary();
        summary.style.display = 'block';
    }

    updateCartSummary() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * this.taxRate;
        const total = subtotal + tax;

        document.getElementById('pos-subtotal').textContent = `€${subtotal.toFixed(2)}`;
        document.getElementById('pos-tax').textContent = `€${tax.toFixed(2)}`;
        document.getElementById('pos-total').textContent = `€${total.toFixed(2)}`;
    }

    updateCheckoutButton() {
        const button = document.getElementById('pos-checkout-btn');
        if (!button) return;

        if (this.cart.length === 0) {
            button.disabled = true;
            button.textContent = 'Finalizar Venda - €0,00';
        } else {
            const total = this.getTotal();
            button.disabled = false;
            button.textContent = `Finalizar Venda - €${total.toFixed(2)}`;
        }
    }

    getTotal() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return subtotal + (subtotal * this.taxRate);
    }

    processCheckout() {
        if (this.cart.length === 0) return;

        // Update stock
        this.cart.forEach(item => {
            const product = this.products.find(p => p.id === item.id);
            if (product) {
                product.stock -= item.quantity;
            }
        });

        const total = this.getTotal();
        alert(`Venda processada com sucesso!\nTotal: €${total.toFixed(2)}\nMétodo: ${this.getPaymentMethodName()}`);

        // Clear cart and update displays
        this.cart = [];
        this.renderCart();
        this.renderProducts();
        this.updateCheckoutButton();
    }

    getPaymentMethodName() {
        const methods = {
            cash: 'Dinheiro',
            card: 'Cartão',
            mb: 'MB WAY',
            transfer: 'Transferência'
        };
        return methods[this.currentPaymentMethod] || 'Desconhecido';
    }

    setPaymentMethod(method) {
        this.currentPaymentMethod = method;
        document.querySelectorAll('.pos-payment-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-method="${method}"]`).classList.add('active');
    }

    updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        
        // Update tax rate
        if (settings.taxRate) {
            this.taxRate = settings.taxRate / 100;
        }
        
        // Update display based on settings
        this.updateCartDisplay();
        
        // Apply theme if changed
        if (settings.theme) {
            document.body.className = document.body.className.replace(/theme-\w+/g, '');
            if (settings.theme !== 'auto') {
                document.body.classList.add(`theme-${settings.theme}`);
            }
        }
        
        console.log('POS settings updated:', this.settings);
    }
}

let posSystem;

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
                <input type="text" placeholder="Ex: A100" />
              </div>
              <div class="artigo-nome">
                <label>NOME/DESCRIÇÃO</label>
                <input type="text" placeholder="Descrição do artigo" />
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
        // wire the procurar button inside the artigos window to open the Procura de Artigo window
        try{
          const lastId = 'win-' + winCounter; // openWindow increments winCounter
          const winEl = windows[lastId];
          if(winEl){
            const procurarBtn = winEl.querySelector('.artigos-toolbar .artigo-btn[title="Procurar Artigo"]');
            if(procurarBtn){
              procurarBtn.addEventListener('click', () => { try{ openProcuraArtigoWindow(); }catch(e){ console.error(e); } });
            }
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
                  <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left; width: 80px; position: relative; cursor: pointer;" onclick="sortTable(2)" data-sort="none">
                    Validade
                    <div class="resize-handle" style="position: absolute; right: 0; top: 0; width: 5px; height: 100%; cursor: col-resize;"></div>
                  </th>
                  <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left; width: 60px; position: relative; cursor: pointer;" onclick="sortTable(3)" data-sort="none">
                    Quant.
                    <div class="resize-handle" style="position: absolute; right: 0; top: 0; width: 5px; height: 100%; cursor: col-resize;"></div>
                  </th>
                  <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left; width: 80px; position: relative; cursor: pointer;" onclick="sortTable(4)" data-sort="none">
                    Criado em
                  </th>
                </tr>
              </thead>
              <tbody id="lotes-tbody">
                <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">🟢</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">ROLOS 400m</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">31-07-2026</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">5200</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">31-07-2020</td>
                </tr>
                <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">🟢</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">BRANCO - rolos 400m</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">13-11-2026</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">1500</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">13-11-2020</td>
                </tr>
                <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">🟡</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">RETALHO 1</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">31-07-2025</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">120</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">31-07-2020</td>
                </tr>
                <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">🟡</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">RETALHO 22.01</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">31-07-2024</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">0</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">20-06-2022</td>
                </tr>
                <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">🟢</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">ROLOS 300m</td>
                  <td style="padding: 4px; border: 1px solid #e2e8f0;">11-07-2025</td>
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
      contentArea.innerHTML = '<p style="color: #64748b; text-align: center; margin-top: 50px;">Conteúdo para ' + (sectionNames[section] || section) + ' em desenvolvimento</p>';
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
    if (columnIndex === 3) { // Quantidade
      aText = parseInt(aText) || 0;
      bText = parseInt(bText) || 0;
      return sortOrder === 'asc' ? aText - bText : bText - aText;
    }
    
    // Handle date columns
    if (columnIndex === 2 || columnIndex === 4) { // Validade ou Criado em
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
                      <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left;">Validade</th>
                      <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left;">Quant.</th>
                      <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left;">Criado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">🟢</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">ROLOS 400m</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">31-07-2026</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">5200</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">31-07-2020</td>
                    </tr>
                    <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">🟢</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">BRANCO - rolos 400m</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">13-11-2026</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">1500</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">13-11-2020</td>
                    </tr>
                    <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">🟡</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">RETALHO 1</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">31-07-2025</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">120</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">31-07-2020</td>
                    </tr>
                    <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">🟡</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">RETALHO 22.01</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">31-07-2024</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">0</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">20-06-2022</td>
                    </tr>
                    <tr style="cursor: pointer;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='white'">
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">🟢</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">ROLOS 300m</td>
                      <td style="padding: 4px; border: 1px solid #e2e8f0;">11-07-2025</td>
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
      const qtyCell = row.children[3]; // Quant. column expected
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
    <div style="display:flex;flex-direction:column;height:100%;">
      <div style="display:flex;align-items:center;gap:8px;padding:8px;border-bottom:1px solid #e6eef7;background:linear-gradient(90deg,#f8fafc,#eef2ff);">
        <button class="btn">Novo</button>
        <button class="btn">Inserir</button>
        <button class="btn">Alterar</button>
        <button class="btn">Eliminar</button>
        <div style="flex:1"></div>
        <button id="client-window-close" class="btn">Fechar</button>
      </div>
      <div style="display:flex;gap:12px;padding:12px;flex:1;overflow:auto;">
        <div style="flex:1;">
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px;">
            <label style="font-size:13px;font-weight:600">Nº Cliente:</label>
            <input type="text" id="client-id" style="padding:6px;border:1px solid #d1d5db;border-radius:6px;" />
            <button class="btn">F2</button>
            <label style="font-size:13px;font-weight:600;margin-left:12px">Nome:</label>
            <input type="text" id="client-name" style="flex:1;padding:6px;border:1px solid #d1d5db;border-radius:6px;" />
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div>
              <label class="pos-small-label">Morada</label>
              <input type="text" id="client-address1" style="width:100%;padding:6px;border:1px solid #d1d5db;border-radius:6px;" />
            </div>
            <div>
              <label class="pos-small-label">Localidade</label>
              <input type="text" id="client-city" style="width:100%;padding:6px;border:1px solid #d1d5db;border-radius:6px;" />
            </div>
            <div>
              <label class="pos-small-label">Código Postal</label>
              <input type="text" id="client-postal" style="width:100%;padding:6px;border:1px solid #d1d5db;border-radius:6px;" />
            </div>
            <div>
              <label class="pos-small-label">Telefone</label>
              <input type="text" id="client-phone" style="width:100%;padding:6px;border:1px solid #d1d5db;border-radius:6px;" />
            </div>
            <div>
              <label class="pos-small-label">Telemóvel</label>
              <input type="text" id="client-mobile" style="width:100%;padding:6px;border:1px solid #d1d5db;border-radius:6px;" />
            </div>
            <div>
              <label class="pos-small-label">Email</label>
              <input type="email" id="client-email" style="width:100%;padding:6px;border:1px solid #d1d5db;border-radius:6px;" />
            </div>
            <div>
              <label class="pos-small-label">Nº Contribuinte (NIF)</label>
              <input type="text" id="client-nif" style="width:100%;padding:6px;border:1px solid #d1d5db;border-radius:6px;" />
            </div>
            <div>
              <label class="pos-small-label">País</label>
              <select id="client-country" style="width:100%;padding:6px;border:1px solid #d1d5db;border-radius:6px;"><option>PORTUGAL</option><option>ESPANHA</option></select>
            </div>
          </div>
        </div>

        <aside style="width:360px;display:flex;flex-direction:column;gap:8px;">
          <div style="background:#fff;border:1px solid #e6eef7;padding:8px;border-radius:8px;">
            <div style="font-weight:700;margin-bottom:6px;color:#0f172a">Informação Geral</div>
            <div style="display:flex;justify-content:space-between;font-size:13px;color:#6b7280"><div>Contas Abertas</div><div id="client-accounts-open">0</div></div>
            <div style="display:flex;justify-content:space-between;font-size:13px;color:#6b7280"><div>T.M.R.</div><div id="client-tmr">0</div></div>
            <div style="display:flex;justify-content:space-between;font-size:13px;color:#6b7280"><div>Pontos actuais</div><div id="client-points">0</div></div>
          </div>

          <div style="background:#fff;border:1px solid #e6eef7;padding:8px;border-radius:8px;flex:1;overflow:auto;"> 
            <div style="font-weight:700;margin-bottom:6px;color:#0f172a">Notas / Observações</div>
            <textarea id="client-notes" style="width:100%;height:140px;padding:8px;border:1px solid #e6eef7;border-radius:6px;"></textarea>
          </div>
        </aside>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px;padding:12px;border-top:1px solid #e6eef7;background:#fafafa;">
        <button id="client-save" class="btn-accent">Guardar</button>
        <button id="client-cancel" class="btn">Fechar</button>
      </div>
    </div>
  `;

  const winId = openWindow({ title: '👥 Ficha de Cliente', content, width: 980, height: 620, left: 80, top: 60 });
  const winEl = windows[winId];
  if(!winEl) return;

  // wire close button inside the window content
  try{
    const closeBtn = winEl.querySelector('#client-window-close');
    if(closeBtn){ closeBtn.addEventListener('click', () => winEl.remove()); }
    const cancelBtn = winEl.querySelector('#client-cancel');
    if(cancelBtn){ cancelBtn.addEventListener('click', () => winEl.remove()); }
    const saveBtn = winEl.querySelector('#client-save');
    if(saveBtn){
      saveBtn.addEventListener('click', () => {
        // gather fields (simple demo save to localStorage)
        const client = {
          id: winEl.querySelector('#client-id')?.value || '',
          name: winEl.querySelector('#client-name')?.value || '',
          nif: winEl.querySelector('#client-nif')?.value || '',
          phone: winEl.querySelector('#client-phone')?.value || '',
          mobile: winEl.querySelector('#client-mobile')?.value || '',
          email: winEl.querySelector('#client-email')?.value || '',
          address1: winEl.querySelector('#client-address1')?.value || '',
          city: winEl.querySelector('#client-city')?.value || '',
          postal: winEl.querySelector('#client-postal')?.value || '',
          country: winEl.querySelector('#client-country')?.value || '',
          notes: winEl.querySelector('#client-notes')?.value || ''
        };
        try{
          // store under demo key
          const all = JSON.parse(localStorage.getItem('demo_clients') || '[]');
          all.push(client);
          localStorage.setItem('demo_clients', JSON.stringify(all));
          // give feedback
          alert('Cliente guardado (demo).');
        }catch(e){ console.error('Erro ao guardar cliente demo', e); }
      });
    }
  }catch(e){ console.error(e); }
}

// Settings menu interactions (show/hide sections)
document.addEventListener('click', (e) => {
  if(!e.target) return;
  const li = e.target.closest && e.target.closest('.settings-menu li');
  if(li){
    const section = li.dataset.section;
    document.querySelectorAll('.settings-menu li').forEach(x=>x.classList.remove('active'));
    li.classList.add('active');
    document.querySelectorAll('.settings-section').forEach(s=>s.classList.add('hidden'));
    const target = document.getElementById(section);
    if(target) target.classList.remove('hidden');
  }
});

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
