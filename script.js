/* ==========================================================================
   CARBREEZY — Shared Site Script
   Navbar, scroll reveals, auth (localStorage), cart (localStorage), toasts
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------------------
     1. NAVBAR — scroll state + mobile menu
     --------------------------------------------------------------------- */
  const nav = document.querySelector('.cbz-nav');
  const burger = document.querySelector('.cbz-burger');
  const mobilePanel = document.querySelector('.cbz-mobile-panel');

  const onScroll = () => {
    if (!nav) return;
    if (window.scrollY > 20) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (burger && mobilePanel) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('is-open');
      mobilePanel.classList.toggle('is-open');
      document.body.style.overflow = mobilePanel.classList.contains('is-open') ? 'hidden' : '';
    });
    mobilePanel.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        burger.classList.remove('is-open');
        mobilePanel.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  // Mark active nav link based on current page
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.cbz-nav-links a, .cbz-mobile-panel a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage) a.classList.add('is-active');
  });

  /* ---------------------------------------------------------------------
     2. SCROLL REVEAL — IntersectionObserver
     --------------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el, i) => {
      el.style.setProperty('--i', i % 8);
      io.observe(el);
    });
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------------------------------------------------------------------
     3. ANIMATED STAT COUNTERS  (elements: <span class="stat-num" data-count="120">)
     --------------------------------------------------------------------- */
  const counters = document.querySelectorAll('[data-count]');
  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString() + suffix;
    };
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window && counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => cio.observe(c));
  }

  /* ---------------------------------------------------------------------
     4. TOASTS
     --------------------------------------------------------------------- */
  function ensureToastStack() {
    let stack = document.querySelector('.cbz-toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'cbz-toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  }

  window.cbzToast = function (message, type = 'info') {
    const stack = ensureToastStack();
    const toast = document.createElement('div');
    toast.className = 'cbz-toast';
    if (type === 'error') toast.style.borderLeftColor = '#ff2d37';
    if (type === 'success') toast.style.borderLeftColor = '#17c964';
    toast.textContent = message;
    stack.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('is-leaving');
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  };

  /* ---------------------------------------------------------------------
     5. AUTH — localStorage based register / login / logout
        Users stored at key 'cbz_users' = [{name, email, password}]
        Active session at key 'cbz_session' = {name, email}
     --------------------------------------------------------------------- */
  const USERS_KEY = 'cbz_users';
  const SESSION_KEY = 'cbz_session';

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch { return []; }
  }
  function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  }
  function setSession(user) { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); }
  function clearSession() { localStorage.removeItem(SESSION_KEY); }

  window.cbzAuth = { getUsers, saveUsers, getSession, setSession, clearSession };

  function refreshAuthUI() {
    const session = getSession();
    document.querySelectorAll('[data-auth-slot]').forEach(slot => {
      if (session) {
        slot.innerHTML = `
          <span class="mono text-muted" style="font-size:13px;">Hi, ${session.name.split(' ')[0]}</span>
          <button class="btn btn-ghost btn-sm" id="cbzLogoutBtn">Logout</button>
        `;
      } else {
        slot.innerHTML = `<button class="btn btn-ghost btn-sm" id="cbzLoginOpenBtn">Login</button>`;
      }
    });
    const logoutBtn = document.getElementById('cbzLogoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
      clearSession();
      cbzToast('Logged out successfully');
      refreshAuthUI();
    });
    const loginOpenBtn = document.getElementById('cbzLoginOpenBtn');
    if (loginOpenBtn) loginOpenBtn.addEventListener('click', () => openModal('cbzAuthModal'));
  }
  refreshAuthUI();

  // Modal open/close helpers (generic, used by auth + any other modal)
  function openModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
  }
  function closeModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  }
  window.cbzModal = { open: openModal, close: closeModal };

  document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.getAttribute('data-modal-open')));
  });
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.getAttribute('data-modal-close')));
  });
  document.querySelectorAll('.cbz-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = registerForm.querySelector('[name="name"]').value.trim();
      const email = registerForm.querySelector('[name="email"]').value.trim().toLowerCase();
      const password = registerForm.querySelector('[name="password"]').value;

      if (!name || !email || !password) {
        cbzToast('Please fill all fields', 'error');
        return;
      }
      const users = getUsers();
      if (users.some(u => u.email === email)) {
        cbzToast('An account with this email already exists', 'error');
        return;
      }
      users.push({ name, email, password });
      saveUsers(users);
      setSession({ name, email });
      cbzToast(`Welcome to Carbreezy, ${name.split(' ')[0]}!`, 'success');
      refreshAuthUI();
      closeModal('cbzAuthModal');
      registerForm.reset();
    });
  }

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('[name="email"]').value.trim().toLowerCase();
      const password = loginForm.querySelector('[name="password"]').value;
      const users = getUsers();
      const match = users.find(u => u.email === email && u.password === password);
      if (!match) {
        cbzToast('Invalid email or password', 'error');
        return;
      }
      setSession({ name: match.name, email: match.email });
      cbzToast(`Welcome back, ${match.name.split(' ')[0]}!`, 'success');
      refreshAuthUI();
      closeModal('cbzAuthModal');
      loginForm.reset();
    });
  }

  // Switch between login/register tabs inside the same modal
  document.querySelectorAll('[data-auth-switch]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-auth-switch');
      document.querySelectorAll('.cbz-auth-pane').forEach(p => p.style.display = 'none');
      const pane = document.getElementById(target);
      if (pane) pane.style.display = 'block';
    });
  });

  /* ---------------------------------------------------------------------
     6. CART — localStorage based
        Cart stored at key 'cbz_cart' = [{id, name, image, price, category, qty}]
     --------------------------------------------------------------------- */
  const CART_KEY = 'cbz_cart';

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }
  function addToCart(item) {
    const cart = getCart();
    const existing = cart.find(c => c.id === item.id);
    if (existing) existing.qty += 1;
    else cart.push({ ...item, qty: 1 });
    saveCart(cart);
    cbzToast(`${item.name} added to cart`, 'success');
    renderCartDrawer();
  }
  function removeFromCart(id) {
    saveCart(getCart().filter(c => c.id !== id));
    renderCartDrawer();
  }
  function updateQty(id, delta) {
    const cart = getCart();
    const item = cart.find(c => c.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      saveCart(cart.filter(c => c.id !== id));
    } else {
      saveCart(cart);
    }
    renderCartDrawer();
  }
  function cartTotal() {
    return getCart().reduce((sum, c) => sum + (c.price * c.qty), 0);
  }
  function updateCartBadge() {
    const count = getCart().reduce((sum, c) => sum + c.qty, 0);
    document.querySelectorAll('.cbz-cart-count').forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  window.cbzCart = { getCart, addToCart, removeFromCart, updateQty, cartTotal };

  function renderCartDrawer() {
    const itemsEl = document.querySelector('.cbz-cart-items');
    const footEl = document.querySelector('.cbz-cart-drawer-foot');
    if (!itemsEl) return; // drawer not present on this page

    const cart = getCart();
    if (cart.length === 0) {
      itemsEl.innerHTML = `<p style="text-align:center;padding:40px 0;">Your cart is empty.</p>`;
    } else {
      itemsEl.innerHTML = cart.map(item => `
        <div class="cbz-cart-line">
          <img src="${item.image}" alt="${item.name}">
          <div style="flex:1;">
            <div style="display:flex;justify-content:space-between;gap:8px;">
              <strong style="font-size:14px;">${item.name}</strong>
              <button data-remove="${item.id}" style="color:#9a9aa5;font-size:12px;">Remove</button>
            </div>
            <div class="mono text-muted" style="font-size:12px;margin-top:4px;">${item.category}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <button data-qty-minus="${item.id}" class="btn-icon btn-sm" style="width:28px;height:28px;">–</button>
                <span class="mono">${item.qty}</span>
                <button data-qty-plus="${item.id}" class="btn-icon btn-sm" style="width:28px;height:28px;">+</button>
              </div>
              <span class="mono">$${(item.price * item.qty).toLocaleString()}</span>
            </div>
          </div>
        </div>
      `).join('');
    }

    if (footEl) {
      footEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
          <span class="text-muted">Total</span>
          <span class="mono" style="font-size:20px;font-weight:700;">$${cartTotal().toLocaleString()}</span>
        </div>
        <button class="btn btn-primary" style="width:100%;" id="cbzCheckoutBtn">Checkout</button>
      `;
      const checkoutBtn = document.getElementById('cbzCheckoutBtn');
      if (checkoutBtn) checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) { cbzToast('Your cart is empty', 'error'); return; }
        cbzToast('Booking request received! Our team will contact you shortly.', 'success');
        saveCart([]);
        renderCartDrawer();
        closeCartDrawer();
      });
    }

    itemsEl.querySelectorAll('[data-remove]').forEach(b =>
      b.addEventListener('click', () => removeFromCart(b.getAttribute('data-remove'))));
    itemsEl.querySelectorAll('[data-qty-plus]').forEach(b =>
      b.addEventListener('click', () => updateQty(b.getAttribute('data-qty-plus'), 1)));
    itemsEl.querySelectorAll('[data-qty-minus]').forEach(b =>
      b.addEventListener('click', () => updateQty(b.getAttribute('data-qty-minus'), -1)));
  }

  function openCartDrawer() {
    document.querySelector('.cbz-cart-drawer')?.classList.add('is-open');
    renderCartDrawer();
  }
  function closeCartDrawer() {
    document.querySelector('.cbz-cart-drawer')?.classList.remove('is-open');
  }
  window.cbzCartDrawer = { open: openCartDrawer, close: closeCartDrawer };

  document.querySelectorAll('[data-cart-open]').forEach(b => b.addEventListener('click', openCartDrawer));
  document.querySelectorAll('[data-cart-close]').forEach(b => b.addEventListener('click', closeCartDrawer));

  // "Add to cart" buttons anywhere on the page: <button data-add-to-cart='{"id":"sedan-1","name":"...", ...}'>
  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', () => {
      try {
        const item = JSON.parse(btn.getAttribute('data-add-to-cart'));
        addToCart(item);
      } catch (err) {
        console.error('Invalid data-add-to-cart payload', err);
      }
    });
  });

  updateCartBadge();
  renderCartDrawer();

  /* ---------------------------------------------------------------------
     7. CONTACT FORM — EmailJS (real email, no backend)
        Requires EmailJS SDK + emailjs.init('YOUR_PUBLIC_KEY') in contact.html
     --------------------------------------------------------------------- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      if (typeof emailjs === 'undefined') {
        cbzToast('Email service not configured yet.', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      emailjs.sendForm('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', contactForm)
        .then(() => {
          cbzToast('Message sent! We will get back to you soon.', 'success');
          contactForm.reset();
        })
        .catch((err) => {
          console.error(err);
          cbzToast('Something went wrong. Please try again.', 'error');
        })
        .finally(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    });
  }

});