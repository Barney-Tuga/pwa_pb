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
}

// Expor função para consola
window.openWindow = openWindow;

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