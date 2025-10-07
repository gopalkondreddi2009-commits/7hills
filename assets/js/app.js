(function () {
  const services = [
    { id: 'copyedit', name: 'Copyediting', description: 'Fix grammar, clarity, and style for polished prose.', price: 79, image: 'assets/images/Copyediting/file_00000000bc186243ba5c7764c8aed06d.png' }
  ];

  const currency = (n) => `₹${n.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

  function getCart() {
    try {
      const raw = localStorage.getItem('cart');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
  }

  function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const el = document.getElementById('cart-count');
    if (el) el.textContent = String(count);
  }

  function addToCart(serviceId) {
    const cart = getCart();
    const existing = cart.find((i) => i.id === serviceId);
    if (existing) existing.quantity += 1; else cart.push({ id: serviceId, quantity: 1 });
    saveCart(cart);
    // Prompt for customer address on first add if not present
    if (!getCustomerAddress()) {
      openAddressModal();
    }
  }

  function removeFromCart(serviceId) {
    let cart = getCart();
    cart = cart.filter((i) => i.id !== serviceId);
    saveCart(cart);
    renderCheckout && renderCheckout();
  }

  function setQty(serviceId, qty) {
    const q = Math.max(1, Number(qty) || 1);
    const cart = getCart();
    const item = cart.find((i) => i.id === serviceId);
    if (item) item.quantity = q;
    saveCart(cart);
    renderCheckout && renderCheckout();
  }

  // Customer address storage
  function getCustomerAddress() {
    try {
      return JSON.parse(localStorage.getItem('customerAddress')) || null;
    } catch (e) {
      return null;
    }
  }

  function saveCustomerAddress(addr) {
    localStorage.setItem('customerAddress', JSON.stringify(addr));
  }

  function getCustomServices() {
    try {
      return JSON.parse(localStorage.getItem('customServices')) || [];
    } catch (e) {
      return [];
    }
  }

  function getAllServices() {
    const custom = getCustomServices();
    return [...custom, ...services];
  }

  function renderServices() {
    const grid = document.getElementById('services-grid');
    if (!grid) return;
    const all = getAllServices();
    grid.innerHTML = all.map((s) => {
      return `
        <div class="card service-card">
          <img class="product-img" src="${s.image}" alt="${s.name}" loading="lazy" />
          <h3>${s.name}</h3>
          <p class="service-meta">${s.description}</p>
          <p class="price">${currency(s.price)}</p>
          <div class="service-actions">
            <button class="btn btn-ghost" data-more="${s.id}">Learn more</button>
            <button class="btn btn-primary" data-add="${s.id}">Add to cart</button>
            <a class="btn btn-ghost" href="pages/checkout.html">Checkout</a>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('[data-add]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-add');
        addToCart(id);
        btn.textContent = 'Added';
        setTimeout(() => (btn.textContent = 'Add to cart'), 1000);
      });
    });

    grid.querySelectorAll('[data-more]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-more');
        const svc = getService(id);
        if (svc) openServiceModal(svc);
      });
    });
  }

  // products section removed

  function renderFooterYear() {
    const y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function getService(id) {
    return services.find((s) => s.id === id);
  }

  function summarizeCart() {
    const cart = getCart();
    const lines = cart.map((i) => {
      const s = getService(i.id);
      const unit = s ? s.price : 0;
      return { id: i.id, name: s ? s.name : i.id, qty: i.quantity, unit, total: unit * i.quantity };
    });
    const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
    const tax = Math.round(subtotal * 0.18);
    const grand = subtotal + tax;
    return { lines, subtotal, tax, grand };
  }

  function renderOrderSummary() {
    const host = document.getElementById('order-summary');
    if (!host) return;
    const { lines, subtotal, tax, grand } = summarizeCart();
    if (lines.length === 0) {
      host.innerHTML = `
        <div class="card">
          <p class="muted">Your cart is empty.</p>
          <a class="btn btn-primary" href="../index.html#services">Browse services</a>
        </div>
      `;
      return;
    }
    host.innerHTML = `
      <div class="card">
        ${lines.map(l => `
          <div style="display:flex; align-items:center; justify-content: space-between; gap: 12px; margin-bottom: 10px;">
            <div>
              <div style="font-weight:600">${l.name}</div>
              <div class="muted">${currency(l.unit)} each</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <input type="number" min="1" value="${l.qty}" data-qty="${l.id}" style="width:74px;" />
              <button class="btn btn-ghost" data-remove="${l.id}">Remove</button>
              <div style="width:80px; text-align:right; font-weight:700;">${currency(l.total)}</div>
            </div>
          </div>
        `).join('')}
        <hr style="border-color:#223045; border-top:none;" />
        <div style="display:grid; grid-template-columns: 1fr auto; gap:6px;">
          <div class="muted">Subtotal</div><div>${currency(subtotal)}</div>
          <div class="muted">GST (18%)</div><div>${currency(tax)}</div>
          <div style="font-weight:700">Total</div><div style="font-weight:700">${currency(grand)}</div>
        </div>
      </div>
    `;

    host.querySelectorAll('[data-remove]').forEach((b) => {
      b.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-remove');
        removeFromCart(id);
      });
    });
    host.querySelectorAll('[data-qty]').forEach((i) => {
      i.addEventListener('change', (e) => {
        const id = e.currentTarget.getAttribute('data-qty');
        setQty(id, e.currentTarget.value);
      });
    });
  }

  function handleCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const hasItems = getCart().length > 0;
      if (!hasItems) {
        alert('Your cart is empty. Please add services before placing an order.');
        return;
      }
      if (!data.name || !data.email) {
        alert('Please fill in required fields.');
        return;
      }
      // Simulated order placement
      alert('Thank you! Your order has been placed. We will email you shortly.');
      localStorage.removeItem('cart');
      updateCartCount();
      window.location.href = '../index.html';
    });
  }

  function initHome() {
    renderServices();
  }

  function initShared() {
    renderFooterYear();
    updateCartCount();
  }

  function ensureModalHost() {
    let host = document.getElementById('modal-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'modal-host';
      document.body.appendChild(host);
    }
    return host;
  }

  function openServiceModal(service) {
    const host = ensureModalHost();
    host.innerHTML = `
      <div class="modal-backdrop show" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal">
          <header>
            <h3 id="modal-title" style="margin:0;">${service.name}</h3>
            <button class="btn btn-ghost" data-close>Close</button>
          </header>
          <div class="content">
            <p>${service.description}</p>
            <p class="muted">Typical turnaround: 2-3 business days. Includes tracked changes and summary notes.</p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" data-close>Cancel</button>
            <button class="btn btn-primary" data-add-now="${service.id}">Add to cart — ${currency(service.price)}</button>
          </div>
        </div>
      </div>
    `;
    const close = () => { host.innerHTML = ''; };
    host.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
    host.querySelector('[data-add-now]').addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-add-now');
      addToCart(id);
      close();
    });
    host.querySelector('.modal-backdrop').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) close();
    });
    document.addEventListener('keydown', function esc(ev) {
      if (ev.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
  }

  function openAddressModal() {
    const host = ensureModalHost();
    host.innerHTML = `
      <div class="modal-backdrop show" role="dialog" aria-modal="true" aria-labelledby="addr-title">
        <div class="modal">
          <header>
            <h3 id="addr-title" style="margin:0;">Customer address</h3>
            <button class="btn btn-ghost" data-close>Close</button>
          </header>
          <div class="content">
            <div class="grid-form">
              <label>
                <span>Full name</span>
                <input type="text" id="addr-name" />
              </label>
              <label>
                <span>Phone</span>
                <input type="tel" id="addr-phone" />
              </label>
              <label>
                <span>Address</span>
                <input type="text" id="addr-line" />
              </label>
              <label>
                <span>City</span>
                <input type="text" id="addr-city" />
              </label>
              <label>
                <span>State</span>
                <input type="text" id="addr-state" />
              </label>
              <label>
                <span>Postal code</span>
                <input type="text" id="addr-postal" />
              </label>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" data-close>Cancel</button>
            <button class="btn btn-primary" id="addr-save">Save address</button>
          </div>
        </div>
      </div>
    `;
    const close = () => { host.innerHTML = ''; };
    host.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
    host.querySelector('#addr-save').addEventListener('click', () => {
      const address = {
        name: document.getElementById('addr-name').value.trim(),
        phone: document.getElementById('addr-phone').value.trim(),
        line: document.getElementById('addr-line').value.trim(),
        city: document.getElementById('addr-city').value.trim(),
        state: document.getElementById('addr-state').value.trim(),
        postal: document.getElementById('addr-postal').value.trim(),
      };
      saveCustomerAddress(address);
      close();
      alert('Address saved. You can edit it at checkout.');
    });
    host.querySelector('.modal-backdrop').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) close();
    });
    document.addEventListener('keydown', function esc(ev) {
      if (ev.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
  }

  window.renderCheckout = function () {
    renderOrderSummary();
    handleCheckoutForm();
    updateCartCount();
    prefillCheckoutAddress();
    renderSavedAddressPanel();
  };

  document.addEventListener('DOMContentLoaded', function () {
    initShared();
    initHome();
  });

  function prefillCheckoutAddress() {
    const addr = getCustomerAddress();
    if (!addr) return;
    const set = (name, val) => {
      const el = document.querySelector(`[name="${name}"]`);
      if (el && !el.value) el.value = val || '';
    };
    set('name', addr.name);
    set('phone', addr.phone);
    set('addressLine', addr.line);
    set('city', addr.city);
    set('state', addr.state);
    set('postal', addr.postal);
  }

  function renderSavedAddressPanel() {
    const host = document.getElementById('saved-address');
    if (!host) return;
    const addr = getCustomerAddress();
    if (!addr) { host.innerHTML = ''; return; }
    host.innerHTML = `
      <div class="card" style="background:#fffdf5; border-color:#fde68a;">
        <div style="display:flex; align-items:center; justify-content: space-between; gap: 10px;">
          <div>
            <strong>Saved address</strong>
            <div class="muted">${addr.name} • ${addr.phone}</div>
            <div class="muted">${addr.line}, ${addr.city}, ${addr.state} ${addr.postal}</div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-primary" id="use-addr">Use this</button>
            <button class="btn btn-ghost" id="edit-addr">Edit</button>
          </div>
        </div>
      </div>
    `;
    const useBtn = document.getElementById('use-addr');
    const editBtn = document.getElementById('edit-addr');
    useBtn && useBtn.addEventListener('click', () => {
      prefillCheckoutAddress();
      alert('Saved address filled into the form.');
    });
    editBtn && editBtn.addEventListener('click', () => {
      openAddressModal();
    });
  }
})();


