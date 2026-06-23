// app.js - FarmConnect Single-Page Application Controller

class FarmConnectApp {
  constructor() {
    this.currentUser = null;
    this.cart = [];
    this.currentView = 'home';
    this.shopCategory = 'All';
    this.activeProductDetailsId = null;
    this.currentLang = 'en';
    this.selectedRating = 5;
    this.activeOrderDetailsId = null;

    // Selected tabs within dashboards
    this.farmerDbTab = 'products';
    this.adminDbTab = 'farmers';

    // Init hooks
    window.addEventListener('hashchange', () => this.handleRouting());
    window.addEventListener('scroll', () => {
      const header = document.getElementById('app-header');
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });

    this.init();
  }

  async init() {
    // Load session user if exists
    const savedUser = sessionStorage.getItem('fc_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }

    // Load cart if exists
    const savedCart = localStorage.getItem('fc_cart');
    if (savedCart) {
      this.cart = JSON.parse(savedCart);
    }

    // Load language if exists
    const savedLang = localStorage.getItem('fc_lang');
    if (savedLang) {
      this.currentLang = savedLang;
    }

    // Update UI elements for connection status
    this.updateDbStatusIndicator();

    // Trigger router for current location hash
    this.handleRouting();

    // Setup initial product counters and cart badges
    this.updateCartBadge();

    // Apply translation configurations
    this.applyLanguage();
  }

  // ================= ROUTING & VIEW CONTROLLER =================
  handleRouting() {
    const hash = window.location.hash || '#/';
    let path = hash.substring(1); // remove #
    
    // Parse query params if any
    let queryParams = {};
    if (path.includes('?')) {
      const parts = path.split('?');
      path = parts[0];
      const searchParams = new URLSearchParams(parts[1]);
      for (const [key, val] of searchParams.entries()) {
        queryParams[key] = val;
      }
    }

    // Routing Table
    if (path === '/' || path === '') {
      this.switchView('home');
      this.renderHome();
    } else if (path === '/shop') {
      this.switchView('shop');
      this.renderShop();
    } else if (path.startsWith('/product/')) {
      const productId = path.split('/product/')[1];
      this.activeProductDetailsId = productId;
      this.switchView('product-details');
      this.renderProductDetails(productId);
    } else if (path === '/cart') {
      this.switchView('cart');
      this.renderCart();
    } else if (path === '/register') {
      // Redirect if already logged in
      if (this.currentUser) {
        this.redirectToDashboard();
        return;
      }
      this.switchView('register');
      // Set query param tab if specified
      if (queryParams.role === 'farmer') {
        this.setAuthTab('farmer');
      } else {
        this.setAuthTab('consumer');
      }
    } else if (path === '/farmer-dashboard') {
      if (!this.currentUser || this.currentUser.role !== 'farmer') {
        this.showToast('Please login as a Farmer to access this portal.', 'error');
        this.navigateTo('/register?role=farmer');
        return;
      }
      this.switchView('farmer-dashboard');
      this.renderFarmerDashboard();
    } else if (path === '/consumer-dashboard') {
      if (!this.currentUser || this.currentUser.role !== 'consumer') {
        this.showToast('Please login to view your order history.', 'error');
        this.navigateTo('/register?role=consumer');
        return;
      }
      this.switchView('consumer-dashboard');
      this.renderConsumerDashboard();
    } else if (path === '/admin-dashboard') {
      if (!this.currentUser || this.currentUser.role !== 'admin') {
        this.showToast('Access denied: Administrators only.', 'error');
        this.navigateTo('/register');
        return;
      }
      this.switchView('admin-dashboard');
      this.renderAdminDashboard();
    } else {
      // Fallback
      window.location.hash = '#/';
    }

    // Refresh Lucide Icons for dynamic content
    setTimeout(() => lucide.createIcons(), 50);
  }

  navigateTo(path) {
    window.location.hash = `#${path}`;
  }

  redirectToDashboard() {
    if (!this.currentUser) {
      this.navigateTo('/');
      return;
    }
    if (this.currentUser.role === 'farmer') {
      this.navigateTo('/farmer-dashboard');
    } else if (this.currentUser.role === 'consumer') {
      this.navigateTo('/consumer-dashboard');
    } else if (this.currentUser.role === 'admin') {
      this.navigateTo('/admin-dashboard');
    }
  }

  switchView(viewName) {
    this.currentView = viewName;
    
    // Hide all view containers
    document.querySelectorAll('.view-container').forEach(el => el.classList.remove('active'));
    
    // Show current container
    const activeEl = document.getElementById(`view-${viewName}`);
    if (activeEl) activeEl.classList.add('active');

    // Scroll to top
    window.scrollTo(0, 0);

    // Update Nav active classes
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    
    if (viewName === 'home') document.getElementById('nav-home').classList.add('active');
    if (viewName === 'shop') document.getElementById('nav-shop').classList.add('active');
    
    // Auth displays
    this.updateHeaderAuthUI();
  }

  updateHeaderAuthUI() {
    const authLink = document.getElementById('nav-register');
    const farmerDbLink = document.getElementById('nav-farmer-db');
    const consumerDbLink = document.getElementById('nav-consumer-db');
    const adminDbLink = document.getElementById('nav-admin-db');
    const profileBadge = document.getElementById('user-profile-badge');

    if (this.currentUser) {
      authLink.style.display = 'none';
      profileBadge.style.display = 'flex';
      
      // Initials and display name
      document.getElementById('user-avatar-initials').innerText = this.currentUser.name ? this.currentUser.name.substring(0, 2).toUpperCase() : 'U';
      document.getElementById('user-display-name').innerText = this.currentUser.name.split(' ')[0];

      // Dashboards toggles
      if (this.currentUser.role === 'farmer') {
        farmerDbLink.style.display = 'block';
        consumerDbLink.style.display = 'none';
        adminDbLink.style.display = 'none';
        
        farmerDbLink.classList.toggle('active', this.currentView === 'farmer-dashboard');
      } else if (this.currentUser.role === 'consumer') {
        farmerDbLink.style.display = 'none';
        consumerDbLink.style.display = 'block';
        adminDbLink.style.display = 'none';
        
        consumerDbLink.classList.toggle('active', this.currentView === 'consumer-dashboard');
      } else if (this.currentUser.role === 'admin') {
        farmerDbLink.style.display = 'none';
        consumerDbLink.style.display = 'none';
        adminDbLink.style.display = 'block';
        
        adminDbLink.classList.toggle('active', this.currentView === 'admin-dashboard');
      }
    } else {
      // Guest Mode
      authLink.style.display = 'block';
      profileBadge.style.display = 'none';
      farmerDbLink.style.display = 'none';
      consumerDbLink.style.display = 'none';
      adminDbLink.style.display = 'none';

      authLink.classList.toggle('active', this.currentView === 'register');
    }
  }

  // ================= DYNAMIC VIEWS RENDERING =================

  // 1. Homepage Rendering
  async renderHome() {
    try {
      const products = await window.db.getProducts();
      // Take first 4 for featured
      const featured = products.slice(0, 4);
      const container = document.getElementById('featured-products-container');
      
      if (featured.length === 0) {
        container.innerHTML = '<div class="no-results">No crop harvests listed today. Check back later!</div>';
        return;
      }

      container.innerHTML = featured.map(p => this.createProductCardHtml(p)).join('');
    } catch (e) {
      console.error(e);
      document.getElementById('featured-products-container').innerHTML = '<div class="no-results">Error loading featured products.</div>';
    }
  }

  // 2. Shop Page Rendering
  async renderShop() {
    try {
      const container = document.getElementById('shop-products-container');
      container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding: 40px;"><p>Loading fresh harvest catalog...</p></div>';
      
      this.filterProducts(); // Handles rendering, search and category checking
    } catch (e) {
      console.error(e);
    }
  }

  async filterProducts() {
    try {
      const searchVal = document.getElementById('shop-search').value.toLowerCase();
      const products = await window.db.getProducts();
      
      // Filter by category
      let filtered = products;
      if (this.shopCategory !== 'All') {
        filtered = products.filter(p => p.category === this.shopCategory);
      }

      // Filter by search query (name or farmer location/name)
      if (searchVal.trim() !== '') {
        filtered = filtered.filter(p => 
          p.product_name.toLowerCase().includes(searchVal) || 
          p.description.toLowerCase().includes(searchVal) ||
          (p.farmer_name && p.farmer_name.toLowerCase().includes(searchVal)) ||
          (p.location && p.location.toLowerCase().includes(searchVal))
        );
      }

      const resultsCountEl = document.getElementById('shop-results-count');
      resultsCountEl.innerText = `Showing ${filtered.length} products ${this.shopCategory !== 'All' ? `in category "${this.shopCategory}"` : ''}`;

      const container = document.getElementById('shop-products-container');
      if (filtered.length === 0) {
        container.innerHTML = `<div class="no-results">
          <i data-lucide="info" style="width:40px; height:40px; color:var(--text-muted); margin-bottom:12px;"></i>
          <p>No products found matching your search filters.</p>
        </div>`;
        lucide.createIcons();
        return;
      }

      container.innerHTML = filtered.map(p => this.createProductCardHtml(p)).join('');
      lucide.createIcons();
    } catch (e) {
      console.error(e);
      this.showToast("Failed to retrieve products.", "error");
    }
  }

  setShopCategory(category) {
    this.shopCategory = category;
    
    // Highlight category pill
    document.querySelectorAll('.category-filters .filter-pill').forEach(btn => btn.classList.remove('active'));
    
    if (category === 'All') document.getElementById('filter-all').classList.add('active');
    if (category === 'Vegetables') document.getElementById('filter-veg').classList.add('active');
    if (category === 'Fruits') document.getElementById('filter-fruits').classList.add('active');
    if (category === 'Grains') document.getElementById('filter-grains').classList.add('active');
    if (category === 'Organic') document.getElementById('filter-organic').classList.add('active');

    this.filterProducts();
  }

  createProductCardHtml(p) {
    const isOutOfStock = parseFloat(p.quantity) <= 0;
    const stockClass = isOutOfStock ? 'out-of-stock' : 'in-stock';
    const stockText = isOutOfStock ? 'Sold Out' : `${p.quantity} kg available`;

    return `
      <div class="product-card">
        <div class="product-image-container" onclick="app.navigateTo('/product/${p.id}')" style="cursor:pointer;">
          <img src="${p.image_url}" alt="${p.product_name}" class="product-image" onerror="this.src='https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=600&q=80'">
          <span class="product-category">${p.category}</span>
        </div>
        <div class="product-details">
          <h3 class="product-name" onclick="app.navigateTo('/product/${p.id}')" style="cursor:pointer;">${p.product_name}</h3>
          
          <div class="farmer-info">
            <i data-lucide="user" style="width:14px; height:14px;"></i>
            <span>${p.farmer_name || 'Rajesh Kumar'}</span>
          </div>
          
          <div class="location-info">
            <i data-lucide="map-pin" style="width:14px; height:14px;"></i>
            <span>${p.location || 'Nashik, Maharashtra'}</span>
          </div>
          
          <div class="price-stock-row">
            <div class="product-price">₹${parseFloat(p.price).toFixed(2)} <span>/ kg</span></div>
            <span class="product-stock ${stockClass}">${stockText}</span>
          </div>
          
          <button class="btn-add-cart" onclick="app.addToCart('${p.id}', 1)" ${isOutOfStock ? 'disabled' : ''}>
            <i data-lucide="shopping-cart" style="width:16px; height:16px;"></i> Add to Cart
          </button>
        </div>
      </div>
    `;
  }

  // 3. Product Details Rendering
  async renderProductDetails(productId) {
    const container = document.getElementById('product-details-content');
    container.innerHTML = '<p style="text-align:center; grid-column:1/-1;">Loading harvest details...</p>';

    try {
      const p = await window.db.getProductById(productId);
      if (!p) {
        container.innerHTML = `<div class="no-results" style="grid-column: 1 / -1;">
          <h3>Harvest item not found</h3>
          <p>This product might have been deleted by the farmer or does not exist.</p>
          <button class="btn btn-primary" onclick="app.navigateTo('/shop')">Return to Shop</button>
        </div>`;
        lucide.createIcons();
        return;
      }

      const isOutOfStock = parseFloat(p.quantity) <= 0;
      
      container.innerHTML = `
        <div class="details-image-container">
          <img src="${p.image_url}" alt="${p.product_name}" class="details-image" onerror="this.src='https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=600&q=80'">
        </div>
        <div class="details-info">
          <span class="details-category">${p.category}</span>
          <h2 class="details-name">${p.product_name}</h2>
          
          <div class="details-farmer-card">
            <div class="farmer-avatar-large">${p.farmer_name ? p.farmer_name.substring(0, 2).toUpperCase() : 'F'}</div>
            <div class="farmer-card-details">
              <h4>Grown by ${p.farmer_name || 'Rajesh Kumar'}</h4>
              <p><i data-lucide="map-pin" style="width:12px; height:12px; display:inline-block; vertical-align:middle;"></i> ${p.location || 'Nashik, Maharashtra'}</p>
            </div>
          </div>
          
          <p class="details-description">${p.description || 'No description provided. This is fresh organic farm crop grown with care.'}</p>
          
          <div class="details-meta-grid">
            <div class="meta-box">
              <div class="meta-box-label">Harvest Date</div>
              <div class="meta-box-value">${p.harvest_date || 'Harvested recently'}</div>
            </div>
            <div class="meta-box">
              <div class="meta-box-label">Available Stock</div>
              <div class="meta-box-value">${isOutOfStock ? 'Sold Out' : `${p.quantity} kg`}</div>
            </div>
          </div>
          
          <div class="details-pricing-row">
            <div class="details-price">₹${parseFloat(p.price).toFixed(2)} <span>/ kg</span></div>
            
            <div class="details-qty-selector" style="${isOutOfStock ? 'display:none;' : ''}">
              <span style="font-weight:600; font-size:14px; color:var(--text-muted);">Quantity:</span>
              <button class="details-qty-btn" onclick="app.adjustDetailsQty(-1)">-</button>
              <span class="details-qty-val" id="details-qty-val">1</span>
              <button class="details-qty-btn" onclick="app.adjustDetailsQty(1, ${p.quantity})">+</button>
              <span style="font-size:14px; font-weight:600; color:var(--text-muted);">kg</span>
            </div>
          </div>
          
          <div class="details-actions-row">
            <button class="btn btn-primary" onclick="app.handleBuyNow('${p.id}')" ${isOutOfStock ? 'disabled' : ''}>
              Buy Now
            </button>
            <button class="btn btn-secondary" onclick="app.handleDetailsAddToCart('${p.id}')" ${isOutOfStock ? 'disabled' : ''}>
              <i data-lucide="shopping-cart"></i> Add to Cart
            </button>
          </div>
        </div>
      `;
      this.renderReviewsForProduct(productId);
      lucide.createIcons();
    } catch (e) {
      console.error(e);
      container.innerHTML = '<p style="text-align:center; grid-column:1/-1;">Error loading product details.</p>';
    }
  }

  adjustDetailsQty(amount, maxStock) {
    const qtyEl = document.getElementById('details-qty-val');
    if (!qtyEl) return;
    
    let current = parseInt(qtyEl.innerText);
    current += amount;
    
    if (current < 1) current = 1;
    if (maxStock && current > maxStock) {
      current = maxStock;
      this.showToast(`Cannot exceed available farm stock (${maxStock} kg).`, 'error');
    }
    
    qtyEl.innerText = current;
  }

  // 4. Shopping Cart Rendering
  async renderCart() {
    const gridContainer = document.getElementById('cart-grid-container');
    const emptyState = document.getElementById('cart-empty-state');
    
    if (this.cart.length === 0) {
      gridContainer.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    gridContainer.style.display = 'grid';
    emptyState.style.display = 'none';

    const cartListEl = document.getElementById('cart-items-list');
    cartListEl.innerHTML = '<p>Loading cart details...</p>';

    try {
      // Gather all products
      const products = await window.db.getProducts();
      
      let cartHtml = '';
      let subtotal = 0;

      for (const item of this.cart) {
        const p = products.find(prod => prod.id === item.id);
        if (!p) {
          // Product doesn't exist anymore, remove from cart
          this.cart = this.cart.filter(c => c.id !== item.id);
          this.saveCart();
          continue;
        }

        const itemTotal = p.price * item.qty;
        subtotal += itemTotal;

        cartHtml += `
          <div class="cart-item-row">
            <img src="${p.image_url}" alt="${p.product_name}" class="cart-item-image" onerror="this.src='https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=600&q=80'">
            <div class="cart-item-details">
              <h4>${p.product_name}</h4>
              <p>Farmer: ${p.farmer_name} | Location: ${p.location}</p>
              <p style="font-weight:600; color:var(--primary-dark); margin-top:4px;">₹${p.price.toFixed(2)} per kg</p>
            </div>
            <div class="cart-item-qty">
              <button class="details-qty-btn" style="width:28px; height:28px; font-size:12px;" onclick="app.updateCartQty('${item.id}', -1)">-</button>
              <span style="font-weight:700; width:16px; text-align:center;">${item.qty}</span>
              <button class="details-qty-btn" style="width:28px; height:28px; font-size:12px;" onclick="app.updateCartQty('${item.id}', 1, ${p.quantity})">+</button>
              <span style="font-size:13px; color:var(--text-muted);">kg</span>
            </div>
            <div class="cart-item-price">₹${itemTotal.toFixed(2)}</div>
            <button class="btn-remove-cart" onclick="app.removeFromCart('${item.id}')" title="Remove Item">
              <i data-lucide="trash-2" style="width:18px; height:18px;"></i>
            </button>
          </div>
        `;
      }

      cartListEl.innerHTML = cartHtml;

      // Render summary
      const deliveryCharge = subtotal >= 500 ? 0 : 50; // free delivery above 500
      const totalAmount = subtotal + deliveryCharge;

      const summaryCard = document.getElementById('cart-summary-card');
      summaryCard.innerHTML = `
        <h3>Order Summary</h3>
        <div class="summary-row">
          <span>Cart Subtotal</span>
          <span>₹${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Direct Delivery Charge</span>
          <span>${deliveryCharge === 0 ? '<strong style="color:var(--primary-green)">FREE</strong>' : `₹${deliveryCharge.toFixed(2)}`}</span>
        </div>
        <div class="summary-row" style="font-size: 12px; margin-bottom: 24px;">
          <span>* Free delivery on orders above ₹500.00</span>
        </div>
        <div class="summary-row total">
          <span>Grand Total</span>
          <span class="total-price-val">₹${totalAmount.toFixed(2)}</span>
        </div>
        <button class="btn btn-primary btn-checkout" onclick="app.handleCheckout()">
          Place Direct Order
        </button>
        <button class="btn btn-outline" style="width:100%; margin-top:12px;" onclick="app.navigateTo('/shop')">
          Continue Shopping
        </button>
      `;

      lucide.createIcons();
    } catch (e) {
      console.error(e);
      cartListEl.innerHTML = '<p>Error loading shopping cart items.</p>';
    }
  }

  // 5. Farmer Dashboard Rendering
  async renderFarmerDashboard() {
    const avatarName = document.getElementById('farmer-db-avatar');
    const displayName = document.getElementById('farmer-db-name');
    
    avatarName.innerText = this.currentUser.name ? this.currentUser.name.substring(0, 2).toUpperCase() : 'F';
    displayName.innerText = this.currentUser.name || 'Farmer';

    // Auto set defaults for add crop form
    document.getElementById('prod-harvest').value = new Date().toISOString().substring(0, 10);

    // Refresh sub-panes
    this.refreshFarmerDbContent();
  }

  async refreshFarmerDbContent() {
    if (this.farmerDbTab === 'products') {
      const tableBody = document.getElementById('farmer-products-table-body');
      tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading crop listings...</td></tr>';
      
      try {
        const products = await window.db.getProducts();
        // Filter products belonging to this farmer
        const farmerProducts = products.filter(p => p.farmer_id === this.currentUser.id);
        
        if (farmerProducts.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">You have not listed any crops yet. Click "List New Crop" above to start selling!</td></tr>';
          return;
        }

        tableBody.innerHTML = farmerProducts.map(p => `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:12px;">
                <img src="${p.image_url}" style="width:40px; height:40px; border-radius:4px; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=600&q=80'">
                <strong style="color:var(--text-dark);">${p.product_name}</strong>
              </div>
            </td>
            <td>${p.category}</td>
            <td><strong>₹${parseFloat(p.price).toFixed(2)}</strong></td>
            <td>${p.quantity} kg</td>
            <td>${p.harvest_date}</td>
            <td>
              <button class="btn btn-outline" style="padding:6px 12px; font-size:12px; color:#C62828; border-color:rgba(198,40,40,0.2);" onclick="app.handleDeleteProduct('${p.id}')">
                Delete
              </button>
            </td>
          </tr>
        `).join('');
      } catch (e) {
        console.error(e);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#C62828;">Failed to load listings.</td></tr>';
      }
    } else if (this.farmerDbTab === 'orders') {
      const tableBody = document.getElementById('farmer-orders-table-body');
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading customer orders...</td></tr>';

      try {
        const orders = await window.db.getOrders();
        // Filter orders for products belonging to this farmer
        const farmerOrders = orders.filter(o => o.farmer_id === this.currentUser.id);

        if (farmerOrders.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No orders received yet for your crops. We will notify you when buyers order!</td></tr>';
          return;
        }

        // Sort by date desc
        farmerOrders.sort((a,b) => new Date(b.order_date) - new Date(a.order_date));

        tableBody.innerHTML = farmerOrders.map(o => {
          const statusClass = o.order_status.toLowerCase();
          const orderDate = new Date(o.order_date).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
          });

          return `
            <tr>
              <td><small>${o.id.substring(0, 8)}...</small></td>
              <td><strong>${o.product_name}</strong></td>
              <td>
                <div style="font-weight:600;">${o.customer_name}</div>
                <div style="font-size:12px; color:var(--text-muted);">${o.customer_contact}</div>
                <div style="font-size:11px; color:var(--text-muted); white-space:normal; width:200px;">${o.customer_address}</div>
              </td>
              <td>${o.quantity} kg</td>
              <td><strong style="color:var(--primary-green)">₹${parseFloat(o.total_price).toFixed(2)}</strong></td>
              <td><span class="status-badge ${statusClass}">${o.order_status}</span></td>
              <td>
                <select class="order-status-select" onchange="app.handleUpdateOrderStatus('${o.id}', this.value)">
                  <option value="Pending" ${o.order_status === 'Pending' ? 'selected' : ''}>Pending</option>
                  <option value="Shipped" ${o.order_status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                  <option value="Delivered" ${o.order_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                </select>
              </td>
            </tr>
          `;
        }).join('');
      } catch (e) {
        console.error(e);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#C62828;">Failed to load received orders.</td></tr>';
      }
    }
  }

  // 6. Consumer Dashboard Rendering
  async renderConsumerDashboard() {
    const avatarName = document.getElementById('consumer-db-avatar');
    const displayName = document.getElementById('consumer-db-name');
    
    avatarName.innerText = this.currentUser.name ? this.currentUser.name.substring(0, 2).toUpperCase() : 'C';
    displayName.innerText = this.currentUser.name || 'Consumer';

    const tableBody = document.getElementById('consumer-orders-table-body');
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading purchase history...</td></tr>';

    try {
      const orders = await window.db.getOrders();
      // Filter orders placed by this customer
      const myOrders = orders.filter(o => o.customer_id === this.currentUser.id);

      if (myOrders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:30px 0;">You have not placed any orders yet. Visit the <a onclick="app.navigateTo(\'/shop\')" style="color:var(--primary-green); text-decoration:underline; cursor:pointer;">Marketplace</a> to purchase fresh food!</td></tr>';
        return;
      }

      // Sort by date desc
      myOrders.sort((a,b) => new Date(b.order_date) - new Date(a.order_date));

      tableBody.innerHTML = myOrders.map(o => {
        const statusClass = o.order_status.toLowerCase();
        const orderDate = new Date(o.order_date).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        return `
          <tr style="cursor:pointer;" onclick="app.showOrderDetails('${o.id}')" title="Click to view shipment tracking and invoice">
            <td><small>${o.id.substring(0, 8)}...</small></td>
            <td><strong>${o.product_name}</strong></td>
            <td>${o.farmer_name || 'Local Farmer'}</td>
            <td>${o.quantity} kg</td>
            <td><strong>₹${parseFloat(o.total_price).toFixed(2)}</strong></td>
            <td><span style="font-size:12px; color:var(--text-muted);">${orderDate}</span></td>
            <td><span class="status-badge ${statusClass}">${o.order_status}</span></td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      console.error(e);
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#C62828;">Failed to load order history.</td></tr>';
    }
  }

  // 7. Admin Dashboard Rendering
  async renderAdminDashboard() {
    try {
      // 1. Load system stats
      const stats = await window.db.getStats();
      document.getElementById('stat-farmers').innerText = stats.totalFarmers;
      document.getElementById('stat-consumers').innerText = stats.totalConsumers;
      document.getElementById('stat-products').innerText = stats.totalProducts;
      document.getElementById('stat-orders').innerText = stats.totalOrders;

      // 2. Load and refresh active tab
      this.refreshAdminDbContent();
    } catch (e) {
      console.error(e);
      this.showToast("Failed to retrieve administrative overview stats.", "error");
    }
  }

  async refreshAdminDbContent() {
    if (this.adminDbTab === 'farmers') {
      const tableBody = document.getElementById('admin-farmers-table-body');
      tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading farmers list...</td></tr>';
      try {
        const farmers = await window.db.getFarmers();
        if (farmers.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No farmers registered in system.</td></tr>';
          return;
        }
        tableBody.innerHTML = farmers.map(f => `
          <tr>
            <td><small>${f.id}</small></td>
            <td><strong>${f.name}</strong></td>
            <td>${f.farm_name}</td>
            <td>${f.contact_number}</td>
            <td>${f.location}</td>
            <td><span style="font-size:12px; color:var(--text-muted);">${f.products}</span></td>
          </tr>
        `).join('');
      } catch (e) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#C62828;">Error reading farmer records.</td></tr>';
      }
    } else if (this.adminDbTab === 'consumers') {
      const tableBody = document.getElementById('admin-consumers-table-body');
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading consumers list...</td></tr>';
      try {
        const consumers = await window.db.getConsumers();
        if (consumers.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No consumers registered in system.</td></tr>';
          return;
        }
        tableBody.innerHTML = consumers.map(c => `
          <tr>
            <td><small>${c.id}</small></td>
            <td><strong>${c.name}</strong></td>
            <td>${c.email}</td>
            <td>${c.contact_number}</td>
            <td><span style="font-size:12px; color:var(--text-muted); white-space:normal; display:inline-block; max-width:250px;">${c.address}</span></td>
          </tr>
        `).join('');
      } catch (e) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#C62828;">Error reading consumer records.</td></tr>';
      }
    } else if (this.adminDbTab === 'products') {
      const tableBody = document.getElementById('admin-products-table-body');
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading crops listings...</td></tr>';
      try {
        const products = await window.db.getProducts();
        if (products.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No crop listings cataloged.</td></tr>';
          return;
        }
        tableBody.innerHTML = products.map(p => `
          <tr>
            <td><small>${p.id.substring(0, 8)}...</small></td>
            <td><strong>${p.product_name}</strong></td>
            <td>${p.category}</td>
            <td><strong>₹${parseFloat(p.price).toFixed(2)}</strong></td>
            <td>${p.quantity} kg</td>
            <td>${p.farmer_name || 'Local Farmer'}</td>
            <td>
              <button class="btn btn-outline" style="padding:4px 10px; font-size:12px; color:#C62828; border-color:rgba(198,40,40,0.15);" onclick="app.handleAdminDeleteProduct('${p.id}')">
                Delete
              </button>
            </td>
          </tr>
        `).join('');
      } catch (e) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#C62828;">Error loading catalog.</td></tr>';
      }
    } else if (this.adminDbTab === 'orders') {
      const tableBody = document.getElementById('admin-orders-table-body');
      tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Loading orders register...</td></tr>';
      try {
        const orders = await window.db.getOrders();
        if (orders.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No purchases made in system.</td></tr>';
          return;
        }
        
        // Sort by date desc
        orders.sort((a,b) => new Date(b.order_date) - new Date(a.order_date));

        tableBody.innerHTML = orders.map(o => {
          const statusClass = o.order_status.toLowerCase();
          const orderDate = new Date(o.order_date).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
          });

          return `
            <tr>
              <td><small>${o.id.substring(0, 8)}...</small></td>
              <td><strong>${o.product_name}</strong></td>
              <td>${o.customer_name}</td>
              <td>${o.quantity} kg</td>
              <td><strong>₹${parseFloat(o.total_price).toFixed(2)}</strong></td>
              <td>${o.farmer_name || 'Local Farmer'}</td>
              <td><span style="font-size:12px; color:var(--text-muted);">${orderDate}</span></td>
              <td><span class="status-badge ${statusClass}">${o.order_status}</span></td>
            </tr>
          `;
        }).join('');
      } catch (e) {
        console.error(e);
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#C62828;">Error loading order records.</td></tr>';
      }
    }
  }


  // ================= ACTION HANDLERS =================

  // 1. Toast Alert Utility
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Choose icon based on type
    const iconName = type === 'success' ? 'check-circle' : 'alert-circle';
    
    toast.innerHTML = `
      <i data-lucide="${iconName}" style="width:18px; height:18px;"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    // Auto remove after 3.5s
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s reverse';
      toast.addEventListener('animationend', () => toast.remove());
    }, 3500);
  }

  // 2. Authentication Logic
  setAuthTab(role) {
    document.getElementById('tab-consumer').classList.toggle('active', role === 'consumer');
    document.getElementById('tab-farmer').classList.toggle('active', role === 'farmer');
    
    document.getElementById('pane-consumer').classList.toggle('active', role === 'consumer');
    document.getElementById('pane-farmer').classList.toggle('active', role === 'farmer');
  }

  async handleConsumerRegister() {
    const name = document.getElementById('cons-name').value;
    const email = document.getElementById('cons-email').value;
    const mobile = document.getElementById('cons-mobile').value;
    const address = document.getElementById('cons-address').value;

    try {
      const consumer = await window.db.registerConsumer({
        name, email, contact_number: mobile, address
      });

      this.currentUser = {
        id: consumer.id,
        name: consumer.name,
        email: consumer.email,
        role: 'consumer'
      };

      sessionStorage.setItem('fc_user', JSON.stringify(this.currentUser));
      this.showToast(`Welcome ${consumer.name}! Registered successfully.`, 'success');
      this.updateHeaderAuthUI();
      this.navigateTo('/consumer-dashboard');

      // Clear form
      document.getElementById('consumer-reg-form').reset();
    } catch (e) {
      console.error(e);
      this.showToast(`Registration failed: ${e.message || e.details || JSON.stringify(e)}`, 'error');
    }
  }

  async handleFarmerRegister() {
    const name = document.getElementById('farm-owner').value;
    const farmName = document.getElementById('farm-name').value;
    const mobile = document.getElementById('farm-mobile').value;
    const village = document.getElementById('farm-village').value;
    const district = document.getElementById('farm-district').value;
    const crops = document.getElementById('farm-crops').value;

    try {
      const farmer = await window.db.registerFarmer({
        name,
        farm_name: farmName,
        contact_number: mobile,
        location: `${village}, ${district}`,
        products: crops
      });

      this.currentUser = {
        id: farmer.id,
        name: farmer.name,
        role: 'farmer'
      };

      sessionStorage.setItem('fc_user', JSON.stringify(this.currentUser));
      this.showToast(`Welcome, Farmer ${farmer.name}! Portal active.`, 'success');
      this.updateHeaderAuthUI();
      this.navigateTo('/farmer-dashboard');

      // Clear form
      document.getElementById('farmer-reg-form').reset();
    } catch (e) {
      console.error(e);
      this.showToast(`Registration failed: ${e.message || e.details || JSON.stringify(e)}`, 'error');
    }
  }

  loginDemo(role) {
    if (role === 'admin') {
      this.currentUser = {
        id: 'admin_sys',
        name: 'System Admin',
        email: 'admin@farmconnect.com',
        role: 'admin'
      };
      this.showToast('Logged in as Administrator (Presentation Mode).', 'success');
    } else if (role === 'farmer') {
      this.currentUser = {
        id: 'farmer_rajesh',
        name: 'Rajesh Kumar',
        role: 'farmer'
      };
      this.showToast('Logged in as Rajesh Kumar (Farmer).', 'success');
    } else if (role === 'consumer') {
      this.currentUser = {
        id: 'consumer_arjun',
        name: 'Arjun Mehta',
        email: 'arjun@gmail.com',
        role: 'consumer'
      };
      this.showToast('Logged in as Arjun Mehta (Consumer).', 'success');
    }

    sessionStorage.setItem('fc_user', JSON.stringify(this.currentUser));
    this.updateHeaderAuthUI();
    this.redirectToDashboard();
  }

  logout(event) {
    if (event) event.stopPropagation(); // prevent header toggle click
    
    this.currentUser = null;
    sessionStorage.removeItem('fc_user');
    this.showToast('Logged out successfully.', 'success');
    this.updateHeaderAuthUI();
    this.navigateTo('/');
  }

  toggleUserMenu() {
    this.redirectToDashboard();
  }

  // 3. Shopping Cart Operations
  addToCart(productId, qty) {
    // Check if item already in cart
    const existing = this.cart.find(c => c.id === productId);
    if (existing) {
      existing.qty += qty;
    } else {
      this.cart.push({ id: productId, qty: qty });
    }
    
    this.saveCart();
    this.updateCartBadge();
    this.showToast('Harvest item added to your shopping cart!', 'success');
  }

  updateCartQty(productId, delta, maxStock) {
    const item = this.cart.find(c => c.id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty < 1) item.qty = 1;
    if (maxStock && item.qty > maxStock) {
      item.qty = maxStock;
      this.showToast(`Cannot exceed available farm stock of ${maxStock} kg.`, 'error');
    }

    this.saveCart();
    this.renderCart();
    this.updateCartBadge();
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(c => c.id !== productId);
    this.saveCart();
    this.renderCart();
    this.updateCartBadge();
    this.showToast('Item removed from cart.', 'success');
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
    this.updateCartBadge();
  }

  saveCart() {
    localStorage.setItem('fc_cart', JSON.stringify(this.cart));
  }

  updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (badge) {
      const count = this.cart.reduce((sum, item) => sum + item.qty, 0);
      badge.innerText = count;
    }
  }

  handleDetailsAddToCart(productId) {
    const qtyVal = parseInt(document.getElementById('details-qty-val').innerText);
    this.addToCart(productId, qtyVal);
  }

  handleBuyNow(productId) {
    const qtyVal = parseInt(document.getElementById('details-qty-val').innerText);
    // Add to cart and navigate immediately to checkout
    const existing = this.cart.find(c => c.id === productId);
    if (existing) {
      existing.qty = qtyVal;
    } else {
      this.cart.push({ id: productId, qty: qtyVal });
    }
    this.saveCart();
    this.updateCartBadge();
    this.navigateTo('/cart');
  }

  async handleCheckout() {
    // 1. Verify consumer logged in
    if (!this.currentUser) {
      this.showToast('Please register or login as a Consumer to complete purchase.', 'error');
      this.navigateTo('/register?role=consumer');
      return;
    }

    if (this.currentUser.role !== 'consumer') {
      this.showToast('Please login using a Consumer account to buy crops. Farmer accounts cannot make purchases.', 'error');
      return;
    }

    try {
      // 2. Call DB to record order and decrement stock
      await window.db.createOrder({
        customer_id: this.currentUser.id,
        items: this.cart
      });

      this.showToast('Order placed successfully! Connecting to farmer shipping...', 'success');
      this.clearCart();
      this.navigateTo('/consumer-dashboard');
    } catch (e) {
      console.error(e);
      this.showToast(e.message || 'Checkout failed. Stock level changed.', 'error');
    }
  }

  // 4. Farmer Actions
  setDbTab(role, tabName) {
    if (role === 'farmer') {
      this.farmerDbTab = tabName;
      document.getElementById('db-farm-tab-products').classList.toggle('active', tabName === 'products');
      document.getElementById('db-farm-tab-add').classList.toggle('active', tabName === 'add-product');
      document.getElementById('db-farm-tab-orders').classList.toggle('active', tabName === 'orders');

      document.getElementById('farm-sec-products').classList.toggle('active', tabName === 'products');
      document.getElementById('farm-sec-add-product').classList.toggle('active', tabName === 'add-product');
      document.getElementById('farm-sec-orders').classList.toggle('active', tabName === 'orders');
      
      this.refreshFarmerDbContent();
    } else if (role === 'admin') {
      this.adminDbTab = tabName;
      document.getElementById('db-admin-tab-farmers').classList.toggle('active', tabName === 'farmers');
      document.getElementById('db-admin-tab-consumers').classList.toggle('active', tabName === 'consumers');
      document.getElementById('db-admin-tab-products').classList.toggle('active', tabName === 'products');
      document.getElementById('db-admin-tab-orders').classList.toggle('active', tabName === 'orders');

      document.getElementById('admin-sec-farmers').classList.toggle('active', tabName === 'farmers');
      document.getElementById('admin-sec-consumers').classList.toggle('active', tabName === 'consumers');
      document.getElementById('admin-sec-products').classList.toggle('active', tabName === 'products');
      document.getElementById('admin-sec-orders').classList.toggle('active', tabName === 'orders');
      
      this.refreshAdminDbContent();
    }
    lucide.createIcons();
  }

  async handleAddProduct() {
    const name = document.getElementById('prod-name').value;
    const category = document.getElementById('prod-cat').value;
    const price = document.getElementById('prod-price').value;
    const quantity = document.getElementById('prod-qty').value;
    const harvestDate = document.getElementById('prod-harvest').value;
    const imageUrl = document.getElementById('prod-image').value;
    const description = document.getElementById('prod-desc').value;

    try {
      await window.db.addProduct({
        product_name: name,
        category,
        price,
        quantity,
        farmer_id: this.currentUser.id,
        harvest_date: harvestDate,
        image_url: imageUrl,
        description,
        farmer_name: this.currentUser.name,
        location: this.currentUser.location || 'Local Farm, India'
      });

      this.showToast('New crop catalog listing published successfully!', 'success');
      document.getElementById('add-product-form').reset();
      this.setDbTab('farmer', 'products');
    } catch (e) {
      console.error(e);
      this.showToast('Listing crop failed.', 'error');
    }
  }

  async handleDeleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this listing from the market?')) return;

    try {
      await window.db.deleteProduct(productId);
      this.showToast('Crop listing removed.', 'success');
      this.refreshFarmerDbContent();
    } catch (e) {
      console.error(e);
      this.showToast('Failed to delete listing.', 'error');
    }
  }

  async handleUpdateOrderStatus(orderId, newStatus) {
    try {
      await window.db.updateOrderStatus(orderId, newStatus);
      this.showToast(`Order status updated to "${newStatus}"!`, 'success');
      this.refreshFarmerDbContent();
    } catch (e) {
      console.error(e);
      this.showToast('Failed to change status.', 'error');
    }
  }

  // 5. Admin Actions
  async handleAdminDeleteProduct(productId) {
    if (!confirm('Admin Override: Remove this product listing from the system permanently?')) return;
    try {
      await window.db.deleteProduct(productId);
      this.showToast('Product removed.', 'success');
      this.renderAdminDashboard();
    } catch (e) {
      this.showToast('Admin delete failed.', 'error');
    }
  }

  // 6. Contact & Newsletters Forms
  handleContactSubmit() {
    this.showToast('Thank you! Your query has been submitted. Our team will contact you shortly.', 'success');
    document.getElementById('home-contact-form').reset();
  }

  handleNewsletterSubmit() {
    this.showToast('Subscription successful! Welcome to the FarmConnect forecast alerts.', 'success');
    document.getElementById('news-email').value = '';
  }

  // ================= SUPABASE CONFIGURATION =================
  toggleConfigFields() {
    const el = document.getElementById('supabase-config-fields');
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';

    // Populate existing config
    if (el.style.display === 'flex') {
      document.getElementById('sb-url').value = localStorage.getItem('FC_SUPABASE_URL') || '';
      document.getElementById('sb-key').value = localStorage.getItem('FC_SUPABASE_ANON_KEY') || '';
    }
  }

  saveSupabaseConfig() {
    const url = document.getElementById('sb-url').value.trim();
    const key = document.getElementById('sb-key').value.trim();

    if (url === '' || key === '') {
      this.showToast('Please enter both Supabase URL and Anon Key.', 'error');
      return;
    }

    localStorage.setItem('FC_SUPABASE_URL', url);
    localStorage.setItem('FC_SUPABASE_ANON_KEY', key);

    this.showToast('Supabase config saved! Page reloading to establish connection...', 'success');
    setTimeout(() => window.location.reload(), 1500);
  }

  clearSupabaseConfig() {
    localStorage.removeItem('FC_SUPABASE_URL');
    localStorage.removeItem('FC_SUPABASE_ANON_KEY');
    
    // Clear out localstorage tables to force fresh mock seeding next time
    localStorage.removeItem('fc_farmers');
    localStorage.removeItem('fc_consumers');
    localStorage.removeItem('fc_products');
    localStorage.removeItem('fc_orders');

    this.showToast('Configuration reset. Reverting to Local Mock Database...', 'success');
    setTimeout(() => window.location.reload(), 1500);
  }

  updateDbStatusIndicator() {
    const pill = document.getElementById('supabase-status-pill');
    if (!pill) return;

    const configured = window.db.isSupabaseConfigured();
    if (configured) {
      pill.innerText = 'Supabase Connected';
      pill.className = 'supabase-status-pill connected';
    } else {
      pill.innerText = 'LocalStorage Mock DB';
      pill.className = 'supabase-status-pill disconnected';
    }
  }

  // ========================================================
  // BILINGUAL SUPPORT (ENGLISH & TAMIL)
  // ========================================================
  toggleLanguage() {
    this.currentLang = this.currentLang === 'en' ? 'ta' : 'en';
    this.applyLanguage();
    this.showToast(this.currentLang === 'en' ? 'Language switched to English' : 'மொழி தமிழிற்கு மாற்றப்பட்டது', 'success');
  }

  applyLanguage() {
    localStorage.setItem('fc_lang', this.currentLang);
    
    // Update button text in header
    const btnText = document.getElementById('lang-btn-text');
    if (btnText) {
      btnText.innerText = this.currentLang === 'en' ? 'தமிழ்' : 'English';
    }

    const dict = TRANSLATIONS[this.currentLang];
    
    // Translate standard elements by ID
    for (const key in dict) {
      const el = document.getElementById(key);
      if (el) {
        // Check if input/textarea
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.placeholder) {
            el.placeholder = dict[key];
          }
        } else {
          el.innerText = dict[key];
        }
      }
    }

    // Dynamic Context Translations
    this.translateStaticHTML();
    
    // Refresh active view to apply translations
    if (this.currentView === 'home') this.renderHome();
    if (this.currentView === 'shop') this.filterProducts();
    if (this.currentView === 'product-details') this.renderProductDetails(this.activeProductDetailsId);
    if (this.currentView === 'cart') this.renderCart();
    if (this.currentView === 'consumer-dashboard') this.renderConsumerDashboard();
    if (this.currentView === 'farmer-dashboard') this.refreshFarmerDbContent();
    if (this.currentView === 'admin-dashboard') this.renderAdminDashboard();
  }

  translateStaticHTML() {
    const isTa = this.currentLang === 'ta';
    
    // 1. Hero Section
    const heroTitle = document.querySelector('.hero-content h1');
    if (heroTitle) {
      heroTitle.innerHTML = isTa 
        ? 'விவசாய நிலத்திலிருந்து நேரடி,<br><span>உங்கள் இல்லத்திற்கு!</span>' 
        : 'Fresh From Farm,<br><span>Direct To Your Home</span>';
    }
    const heroSub = document.querySelector('.hero-content p');
    if (heroSub) {
      heroSub.innerText = isTa
        ? 'இடைத்தரகர்கள் இன்றி, உள்ளூர் விவசாயிகளிடமிருந்து நேரடியாக புதிய விளைபொருட்களை நியாயமான விலையில் வாங்கி மகிழுங்கள்.'
        : 'Buy fresh produce directly from local farmers while helping them earn better profits by removing middlemen.';
    }
    const heroBtn1 = document.querySelector('.hero-buttons .btn-primary');
    if (heroBtn1) {
      heroBtn1.innerText = isTa ? 'இப்போதே வாங்குங்கள்' : 'Shop Now';
    }
    const heroBtn2 = document.querySelector('.hero-buttons .btn-secondary');
    if (heroBtn2) {
      heroBtn2.innerText = isTa ? 'விவசாயியாக பதிவு செய்க' : 'Register as Farmer';
    }

    // 2. How it works section
    const howTitle = document.querySelector('#how-it-works .section-header h2');
    if (howTitle) howTitle.innerText = isTa ? 'செயல்முறை விளக்கம்' : 'How FarmConnect Works';
    const howSub = document.querySelector('#how-it-works .section-header p');
    if (howSub) howSub.innerText = isTa ? 'விளைநிலத்தையும் நுகர்வோரையும் இணைக்கும் 3 எளிய வழிகள்' : 'Connecting soil and spoon in three simple steps';

    const cards = document.querySelectorAll('#how-it-works .workflow-card');
    if (cards.length === 3) {
      // Card 1
      cards[0].querySelector('h3').innerText = isTa ? 'விவசாயி பதிவு' : 'Farmers Register';
      cards[0].querySelector('p').innerText = isTa ? 'விவசாயிகள் தங்களின் புதிய அறுவடை, விலை மற்றும் இருப்பு விவரங்களை எளிய முறையில் பதிவு செய்கின்றனர்.' : 'Farmers list their fresh harvests, upload descriptions, locations, and set fair prices per kilogram.';
      // Card 2
      cards[1].querySelector('h3').innerText = isTa ? 'நுகர்வோர் தேர்வு' : 'Consumers Shop';
      cards[1].querySelector('p').innerText = isTa ? 'வாங்குபவர்கள் காய்கறிகள், பழங்கள் மற்றும் தானியங்களை ஒப்பிட்டு தங்களுக்கு தேவையானதை ஆர்டர் செய்கிறார்கள்.' : 'Customers browse the shop by categories (Vegetables, Fruits, Grains, Organic) and place direct orders.';
      // Card 3
      cards[2].querySelector('h3').innerText = isTa ? 'நேரடி விநியோகம்' : 'Direct Delivery';
      cards[2].querySelector('p').innerText = isTa ? 'விளைபொருட்கள் பண்ணையிலிருந்து நேரடியாக பேக் செய்யப்பட்டு புதிய சுவையுடன் உங்கள் வீட்டு வாசலுக்கு விநியோகிக்கப்படும்.' : 'Produce is packed at the farm and delivered directly to the consumer\'s doorstep, retaining full freshness.';
    }

    // 3. Benefits Section
    const benTitle = document.querySelector('#benefits .section-header h2');
    if (benTitle) benTitle.innerText = isTa ? 'இருதரப்பு நன்மைகள்' : 'Empowering both ends of the chain';
    const benSub = document.querySelector('#benefits .section-header p');
    if (benSub) benSub.innerText = isTa ? 'நேரடி கொள்முதல் ஏன் சிறந்தது?' : 'Why choose direct-from-farm connection?';

    const blocks = document.querySelectorAll('#benefits .benefit-block');
    if (blocks.length === 2) {
      // Farmer benefit
      blocks[0].querySelector('h3').innerHTML = isTa ? '<i data-lucide="sprout"></i> விவசாயிகளுக்கு' : '<i data-lucide="sprout"></i> For Farmers';
      const itemsF = blocks[0].querySelectorAll('.benefit-item-content');
      if (itemsF.length === 3) {
        itemsF[0].querySelector('h4').innerText = isTa ? '100% தரகர்கள் இல்லை' : '100% Middlemen Free';
        itemsF[0].querySelector('p').innerText = isTa ? 'உங்கள் உழைப்பின் முழு லாபத்தையும் நீங்களே பெற்றுக்கொண்டு விற்பனை விலையை நீங்களே தீர்மானியுங்கள்.' : 'Keep 100% of the sales revenue and set your own agricultural crop prices.';
        itemsF[1].querySelector('h4').innerText = isTa ? 'நேரடி சந்தை இணைப்பு' : 'Direct Market Access';
        itemsF[1].querySelector('p').innerText = isTa ? 'அலைச்சல் இன்றி, பெருநகரங்களில் இருக்கும் ஆயிரக்கணக்கான நுகர்வோரை நேரடியாக சென்றடையலாம்.' : 'Reach thousands of consumers in cities without travel or wholesale agents.';
        itemsF[2].querySelector('h4').innerText = isTa ? 'பாதுகாப்பான கொடுப்பனவுகள்' : 'Secure & Fast Payments';
        itemsF[2].querySelector('p').innerText = isTa ? 'அறுவடை டெலிவரி செய்யப்பட்டவுடன் உங்கள் வங்கி கணக்கில் நேரடியாக பணம் செலுத்தப்படும்.' : 'Get money transferred directly to your bank account upon delivery validation.';
      }

      // Consumer benefit
      blocks[1].querySelector('h3').innerHTML = isTa ? '<i data-lucide="users"></i> நுகர்வோருக்கு' : '<i data-lucide="users"></i> For Consumers';
      const itemsC = blocks[1].querySelectorAll('.benefit-item-content');
      if (itemsC.length === 3) {
        itemsC[0].querySelector('h4').innerText = isTa ? 'புதிய மற்றும் ஆரோக்கியம்' : 'Nutrient-Rich Freshness';
        itemsC[0].querySelector('p').innerText = isTa ? 'குளிர்சாதன கிடங்குகளில் சேமிக்கப்படாத, சில மணி நேரங்களுக்கு முன் அறுவடை செய்யப்பட்ட புதிய காய்கறிகள்.' : 'Receive produce harvested hours ago instead of items stored in cold warehouses.';
        itemsC[1].querySelector('h4').innerText = isTa ? 'விவசாயி விவரங்கள்' : 'Traceability to the Source';
        itemsC[1].querySelector('p').innerText = isTa ? 'உங்கள் உணவு எந்த கிராமத்தில், எந்த விவசாயியால் பயிரிடப்பட்டது என்ற முழு விவரங்களை அறியலாம்.' : 'Know exactly which farm, village, and farmer grew the food your family eats.';
        itemsC[2].querySelector('h4').innerText = isTa ? 'நியாயமான விலை' : 'Fair, Honest Pricing';
        itemsC[2].querySelector('p').innerText = isTa ? 'சூப்பர் மார்க்கெட்களை விட குறைந்த விலை, ஆனால் விவசாயிக்கு அதிக லாபம் தரும் விலை.' : 'Slightly lower costs than grocery stores, while paying farmers much higher rates.';
      }
    }

    // 4. Shop Page filters
    const filterAll = document.getElementById('filter-all');
    if (filterAll) filterAll.innerText = isTa ? 'அனைத்து பயிர்கள்' : 'All Crops';
    const filterVeg = document.getElementById('filter-veg');
    if (filterVeg) filterVeg.innerText = isTa ? 'காய்கறிகள்' : 'Vegetables';
    const filterFruits = document.getElementById('filter-fruits');
    if (filterFruits) filterFruits.innerText = isTa ? 'பழங்கள்' : 'Fruits';
    const filterGrains = document.getElementById('filter-grains');
    if (filterGrains) filterGrains.innerText = isTa ? 'தானியங்கள்' : 'Grains';
    const filterOrganic = document.getElementById('filter-organic');
    if (filterOrganic) filterOrganic.innerText = isTa ? 'இயற்கை தயாரிப்பு' : 'Organic';

    // 5. Featured product headers
    const featHead = document.querySelector('#featured .section-header h2');
    if (featHead) featHead.innerText = isTa ? 'இன்றைய புதிய அறுவடைகள்' : 'Featured Fresh Harvests';
    const featSub = document.querySelector('#featured .section-header p');
    if (featSub) featSub.innerText = isTa ? 'விவசாயிகளிடமிருந்து இன்று பட்டியலிடப்பட்ட விளைபொருட்கள்' : 'Hand-picked premium products listed today';

    // 6. Testimonial Section
    const storyHead = document.querySelector('#stories .section-header h2');
    if (storyHead) storyHead.innerText = isTa ? 'வெற்றியாளர்களின் குரல்' : 'Success Stories';
    const storySub = document.querySelector('#stories .section-header p');
    if (storySub) storySub.innerText = isTa ? 'எங்கள் விவசாய குடும்பங்களின் நேரடி அனுபவங்கள்' : 'Real voices from our organic network';

    // 7. Contact Section
    const contactHead = document.querySelector('#contact .contact-info h3');
    if (contactHead) contactHead.innerText = isTa ? 'தொடர்பு கொள்ள' : 'Get In Touch';
    const contactSub = document.querySelector('#contact .contact-info p');
    if (contactSub) contactSub.innerText = isTa ? 'நேரடி கொள்முதல், விநியோக முறைகள் பற்றி மேலும் அறிய எங்களை தொடர்பு கொள்ளுங்கள்.' : 'Have questions about direct procurement, logistics, or setting up a corporate partnership? Send us a message.';
    
    const contactLabels = document.querySelectorAll('#home-contact-form label');
    if (contactLabels.length === 3) {
      contactLabels[0].innerText = isTa ? 'உங்கள் பெயர்' : 'Your Name';
      contactLabels[1].innerText = isTa ? 'மின்னஞ்சல் முகவரி' : 'Email Address';
      contactLabels[2].innerText = isTa ? 'கருத்து / கேள்வி' : 'Message';
    }
    const contactBtn = document.querySelector('#home-contact-form button[type="submit"]');
    if (contactBtn) contactBtn.innerText = isTa ? 'செய்தி அனுப்பு' : 'Send Message';

    // 8. Footer Columns
    const footerHeaders = document.querySelectorAll('footer .footer-column h3');
    if (footerHeaders.length === 3) {
      footerHeaders[0].innerText = isTa ? 'செயல்பாடுகள்' : 'Core Modules';
      footerHeaders[1].innerText = isTa ? 'விளக்கம் / உதவிகள்' : 'Presentation';
      footerHeaders[2].innerText = isTa ? 'செய்தி மடல்' : 'Newsletter';
    }

    // Refresh Lucide Icons to bind translated icons correctly
    lucide.createIcons();
  }

  // ========================================================
  // REVIEWS & RATINGS SYSTEM
  // ========================================================
  async renderReviewsForProduct(productId) {
    const reviewsSection = document.getElementById('product-reviews-section');
    if (!reviewsSection) return;

    // Show section
    reviewsSection.style.display = 'block';

    const listContainer = document.getElementById('reviews-list-container');
    const avgValEl = document.getElementById('avg-rating-value');
    const avgStarsEl = document.getElementById('avg-rating-stars');
    const countEl = document.getElementById('reviews-count-text');

    listContainer.innerHTML = '<p>Loading reviews...</p>';

    try {
      const reviews = await window.db.getProductReviews(productId);
      
      // Calculate statistics
      const count = reviews.length;
      let average = 0.0;
      
      if (count > 0) {
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        average = sum / count;
      }

      avgValEl.innerText = average.toFixed(1);
      countEl.innerText = this.currentLang === 'en' 
        ? `Based on ${count} review${count !== 1 ? 's' : ''}` 
        : `${count} கருத்துக்களின் அடிப்படையில்`;

      // Render average stars
      let avgStarsHtml = '';
      for (let i = 1; i <= 5; i++) {
        if (i <= Math.round(average)) {
          avgStarsHtml += '<i data-lucide="star" style="fill:#FFC107; color:#FFC107; width:18px; height:18px;"></i>';
        } else {
          avgStarsHtml += '<i data-lucide="star" style="color:#E0E0E0; width:18px; height:18px;"></i>';
        }
      }
      avgStarsEl.innerHTML = avgStarsHtml;

      // Render reviews list
      if (count === 0) {
        listContainer.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">
          <p>${this.currentLang === 'en' ? 'No reviews yet. Be the first to review!' : 'கருத்துக்கள் இன்னும் இல்லை. முதல் நபராக கருத்து தெரிவிக்கவும்!'}</p>
        </div>`;
        return;
      }

      // Sort by date desc
      reviews.sort((a,b) => new Date(b.date) - new Date(a.date));

      listContainer.innerHTML = reviews.map(r => {
        const dateStr = new Date(r.date).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric'
        });

        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
          if (i <= r.rating) {
            starsHtml += '<i data-lucide="star" style="fill:#FFC107; color:#FFC107; width:12px; height:12px;"></i>';
          } else {
            starsHtml += '<i data-lucide="star" class="empty" style="color:#E0E0E0; width:12px; height:12px;"></i>';
          }
        }

        return `
          <div class="review-item-card">
            <div class="review-item-meta">
              <span class="review-item-author">${r.author_name}</span>
              <span class="review-item-date">${dateStr}</span>
            </div>
            <div class="review-stars">${starsHtml}</div>
            <p class="review-comment">${r.comment}</p>
          </div>
        `;
      }).join('');

      // Reset review form inputs
      this.setRatingValue(5);
      document.getElementById('product-review-form').reset();
      
      lucide.createIcons();
    } catch (e) {
      console.error(e);
      listContainer.innerHTML = '<p>Error loading product reviews.</p>';
    }
  }

  setRatingValue(val) {
    this.selectedRating = val;
    document.getElementById('review-rating-val').value = val;

    // Toggle active stars in UI
    const stars = document.querySelectorAll('#rating-star-selector i');
    stars.forEach((star, idx) => {
      if (idx < val) {
        star.classList.add('selected');
        star.style.fill = '#FFC107';
        star.style.color = '#FFC107';
      } else {
        star.classList.remove('selected');
        star.style.fill = 'none';
        star.style.color = '#E0E0E0';
      }
    });
  }

  async handleReviewSubmit() {
    if (!this.currentUser) {
      this.showToast(this.currentLang === 'en' ? 'Please log in to submit a review.' : 'மதிப்பீட்டை சமர்ப்பிக்க தயவுசெய்து உள்நுழையவும்.', 'error');
      this.navigateTo('/register');
      return;
    }

    const rating = this.selectedRating;
    const comment = document.getElementById('review-comment-text').value;
    const authorName = this.currentUser.name;

    try {
      await window.db.submitProductReview(this.activeProductDetailsId, {
        author_name: authorName,
        rating,
        comment
      });

      this.showToast(this.currentLang === 'en' ? 'Thank you! Review submitted.' : 'நன்றி! உங்களது கருத்து சமர்ப்பிக்கப்பட்டது.', 'success');
      this.renderReviewsForProduct(this.activeProductDetailsId);
    } catch (e) {
      console.error(e);
      this.showToast('Failed to submit review.', 'error');
    }
  }

  // ========================================================
  // CUSTOMER DASHBOARD - ORDER TRACKING TIMELINE
  // ========================================================
  async showOrderDetails(orderId) {
    this.activeOrderDetailsId = orderId;
    const detailsContainer = document.getElementById('consumer-order-details-container');
    
    // Clear and Show
    detailsContainer.innerHTML = '<p>Loading order shipment tracking details...</p>';
    detailsContainer.style.display = 'block';

    try {
      const orders = await window.db.getOrders();
      const o = orders.find(ord => ord.id === orderId);

      if (!o) {
        detailsContainer.innerHTML = '<p class="error">Order not found.</p>';
        return;
      }

      const products = await window.db.getProducts();
      const p = products.find(prod => prod.id === o.product_id);

      const status = o.order_status; // Pending, Shipped, Delivered
      const isTa = this.currentLang === 'ta';

      // Define visual progress percentage & nodes active
      let progressWidth = '0%';
      let step1 = 'active', step2 = '', step3 = '', step4 = '';

      if (status === 'Pending') {
        progressWidth = '0%';
        step1 = 'active';
      } else if (status === 'Shipped') {
        progressWidth = '66%';
        step1 = 'completed';
        step2 = 'completed';
        step3 = 'active';
      } else if (status === 'Delivered') {
        progressWidth = '100%';
        step1 = 'completed';
        step2 = 'completed';
        step3 = 'completed';
        step4 = 'active';
      }

      // Format date
      const orderDateStr = new Date(o.order_date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      // Calculate fake estimated delivery date (Order Date + 3 days)
      const estDate = new Date(o.order_date);
      estDate.setDate(estDate.getDate() + 3);
      const estDateStr = estDate.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });

      detailsContainer.innerHTML = `
        <div class="order-details-card">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; border-bottom:1px solid var(--border-color); padding-bottom:12px; margin-bottom:16px;">
            <div>
              <h4 style="font-size:16px; font-weight:700; color:var(--primary-dark);">
                ${isTa ? 'ஆர்டர் விவரங்கள்' : 'Order Tracking Details'}
              </h4>
              <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">
                ID: <span style="font-family:monospace; font-weight:600;">${o.id}</span>
              </p>
            </div>
            <div style="display:flex; gap:12px;">
              <button class="btn btn-outline" style="padding:6px 14px; font-size:12px;" onclick="app.showInvoiceModal('${o.id}')">
                <i data-lucide="file-text" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i>
                ${isTa ? 'விலைப்பட்டியல் (Invoice)' : 'View Invoice'}
              </button>
              <button class="btn btn-outline" style="padding:6px 14px; font-size:12px; color:#C62828;" onclick="document.getElementById('consumer-order-details-container').style.display='none'">
                ${isTa ? 'மூடு' : 'Close Details'}
              </button>
            </div>
          </div>

          <!-- Shipment Progress Timeline -->
          <div class="timeline-container">
            <div class="tracking-steps">
              <div class="tracking-progress-line" style="width: ${progressWidth}"></div>
              
              <div class="tracking-step ${step1}">
                <div class="step-node"><i data-lucide="shopping-bag"></i></div>
                <div class="step-label">${isTa ? 'ஆர்டர் செய்யப்பட்டது' : 'Order Placed'}</div>
              </div>
              <div class="tracking-step ${step2 || (status !== 'Pending' ? 'completed' : '')}">
                <div class="step-node"><i data-lucide="package"></i></div>
                <div class="step-label">${isTa ? 'அறுவடை தயார்' : 'Harvest Packed'}</div>
              </div>
              <div class="tracking-step ${step3}">
                <div class="step-node"><i data-lucide="truck"></i></div>
                <div class="step-label">${isTa ? 'வழியில் உள்ளது' : 'In Transit'}</div>
              </div>
              <div class="tracking-step ${step4}">
                <div class="step-node"><i data-lucide="check-circle"></i></div>
                <div class="step-label">${isTa ? 'டெலிவரி செய்யப்பட்டது' : 'Delivered'}</div>
              </div>
            </div>
          </div>

          <!-- Detailed Info Grid -->
          <div class="order-details-grid">
            <div style="border-right:1px solid var(--border-color); padding-right:16px;">
              <p style="margin-bottom:6px;"><strong>${isTa ? 'பயிர் விவரம்:' : 'Crop Details:'}</strong> ${o.product_name}</p>
              <p style="margin-bottom:6px;"><strong>${isTa ? 'வாங்கிய அளவு:' : 'Quantity Purchased:'}</strong> ${o.quantity} kg</p>
              <p style="margin-bottom:6px;"><strong>${isTa ? 'செலுத்திய தொகை:' : 'Total Amount Paid:'}</strong> ₹${parseFloat(o.total_price).toFixed(2)}</p>
              <p style="margin-bottom:6px;"><strong>${isTa ? 'ஆர்டர் தேதி:' : 'Order Date:'}</strong> ${orderDateStr}</p>
              <p style="margin-bottom:6px; color:var(--primary-dark)">
                <strong>${isTa ? 'டெலிவரி தேதி (தோராயமாக):' : 'Est. Delivery Date:'}</strong> ${status === 'Delivered' ? (isTa ? 'டெலிவரி செய்யப்பட்டது' : 'Delivered successfully') : estDateStr}
              </p>
            </div>
            
            <div style="padding-left:16px;">
              <p style="margin-bottom:6px;"><strong>${isTa ? 'விவசாயி பெயர்:' : 'Farmer Details:'}</strong> ${o.farmer_name || 'Local Farmer'}</p>
              <p style="margin-bottom:6px;"><strong>${isTa ? 'விவசாய நிலம்:' : 'Farm Location:'}</strong> ${p ? p.location : 'Tamil Nadu, India'}</p>
              <p style="margin-bottom:6px;"><strong>${isTa ? 'வாங்குபவர் முகவரி:' : 'Delivery Address:'}</strong> ${o.customer_address}</p>
            </div>
          </div>
        </div>
      `;

      // Scroll smoothly to order details container
      detailsContainer.scrollIntoView({ behavior: 'smooth' });
      lucide.createIcons();
    } catch (e) {
      console.error(e);
      detailsContainer.innerHTML = '<p class="error">Error loading details.</p>';
    }
  }

  // ========================================================
  // INVOICE PRINT MODAL LOGIC
  // ========================================================
  async showInvoiceModal(orderId) {
    const modal = document.getElementById('invoice-modal');
    const invoicePrintArea = document.getElementById('invoice-print-area');
    
    invoicePrintArea.innerHTML = '<p>Loading invoice details...</p>';
    modal.style.display = 'flex';

    try {
      const orders = await window.db.getOrders();
      const o = orders.find(ord => ord.id === orderId);

      if (!o) {
        invoicePrintArea.innerHTML = '<p class="error">Order not found.</p>';
        return;
      }

      const products = await window.db.getProducts();
      const p = products.find(prod => prod.id === o.product_id);

      const isTa = this.currentLang === 'ta';
      const orderDateStr = new Date(o.order_date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      // Math breakdowns
      const grandTotal = parseFloat(o.total_price);
      const deliveryCharge = grandTotal >= 500 ? 0 : 50;
      const subtotal = grandTotal - deliveryCharge;
      const basePrice = subtotal / 1.05; // Assuming 5% total tax (2.5% CGST + 2.5% SGST)
      const totalTax = subtotal - basePrice;
      const cgst = totalTax / 2;
      const sgst = totalTax / 2;

      invoicePrintArea.innerHTML = `
        <div class="invoice-paper">
          <div class="invoice-header-row">
            <div>
              <h2 style="color:var(--primary-green); font-family:var(--font-heading); font-size:24px; font-weight:800; display:flex; align-items:center; gap:8px;">
                🌱 FarmConnect
              </h2>
              <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">Fresh from Farm, Direct to Home</p>
            </div>
            <div style="text-align:right;">
              <h3 style="font-family:var(--font-heading); font-size:18px; text-transform:uppercase; color:var(--text-dark)">
                ${isTa ? 'வரி விலைப்பட்டியல்' : 'Tax Invoice'}
              </h3>
              <p style="font-size:11px; margin-top:4px;">
                <strong>Invoice No:</strong> FC-${o.id.substring(0, 8).toUpperCase()}
              </p>
              <p style="font-size:11px;">
                <strong>Date:</strong> ${orderDateStr}
              </p>
            </div>
          </div>

          <div class="invoice-bill-to">
            <div>
              <h4 style="border-bottom:1px solid var(--border-color); padding-bottom:4px; margin-bottom:6px; color:var(--primary-dark)">
                ${isTa ? 'விளக்கம் / வாங்குபவர்:' : 'Bill To (Customer):'}
              </h4>
              <p><strong>${o.customer_name}</strong></p>
              <p>${o.customer_contact}</p>
              <p style="white-space:normal; width:220px;">${o.customer_address}</p>
            </div>
            
            <div style="text-align:right;">
              <h4 style="border-bottom:1px solid var(--border-color); padding-bottom:4px; margin-bottom:6px; color:var(--primary-dark)">
                ${isTa ? 'விவரம் / விவசாயி:' : 'Seller (Farmer):'}
              </h4>
              <p><strong>${o.farmer_name || 'Local Farmer'}</strong></p>
              <p>Village: ${p ? p.location : 'Local Village'}</p>
              <p>FarmConnect Organic Partner</p>
            </div>
          </div>

          <table class="invoice-table">
            <thead>
              <tr>
                <th>${isTa ? 'பொருள் பெயர்' : 'Item Description'}</th>
                <th style="text-align:right;">${isTa ? 'விலை/கிலோ' : 'Rate / kg'}</th>
                <th style="text-align:right;">${isTa ? 'அளவு (கிலோ)' : 'Qty (kg)'}</th>
                <th style="text-align:right;">${isTa ? 'மொத்த தொகை' : 'Subtotal'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${o.product_name}</strong><br><small style="color:var(--text-muted)">Category: ${p ? p.category : 'Fresh Produce'}</small></td>
                <td style="text-align:right;">₹${(subtotal/o.quantity).toFixed(2)}</td>
                <td style="text-align:right;">${o.quantity} kg</td>
                <td style="text-align:right;">₹${subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="invoice-totals">
            <div class="invoice-totals-row">
              <span>${isTa ? 'விளைபொருள் மதிப்பு' : 'Crop Subtotal'}:</span>
              <span>₹${basePrice.toFixed(2)}</span>
            </div>
            <div class="invoice-totals-row" style="color:var(--text-muted); font-size:11px;">
              <span>CGST (2.5%):</span>
              <span>₹${cgst.toFixed(2)}</span>
            </div>
            <div class="invoice-totals-row" style="color:var(--text-muted); font-size:11px;">
              <span>SGST (2.5%):</span>
              <span>₹${sgst.toFixed(2)}</span>
            </div>
            <div class="invoice-totals-row">
              <span>${isTa ? 'விநியோக கட்டணம்' : 'Delivery Charge'}:</span>
              <span>${deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}</span>
            </div>
            <div class="invoice-totals-row" style="border-top:1px solid var(--border-color); padding-top:6px; font-weight:800; font-size:15px; color:var(--primary-green)">
              <span>${isTa ? 'மொத்த தொகை (இந்திய ரூபாய்)' : 'Grand Total'}:</span>
              <span>₹${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div style="margin-top:30px; border-top:1px dashed var(--border-color); padding-top:12px; text-align:center; font-size:11px; color:var(--text-muted)">
            <p>${isTa ? 'பண்ணையிலிருந்து நேரடியாக வாங்கியதற்கு நன்றி!' : 'Thank you for buying direct and supporting local farmers!'}</p>
            <p style="margin-top:4px; font-weight:600;">FarmConnect College Presentation Module - No real payments collected</p>
          </div>
        </div>
      `;

      lucide.createIcons();
    } catch (e) {
      console.error(e);
      invoicePrintArea.innerHTML = '<p class="error">Error loading invoice.</p>';
    }
  }

  closeInvoiceModal() {
    document.getElementById('invoice-modal').style.display = 'none';
  }
}

// BILINGUAL LANGUAGE DICTIONARY DECLARATION
const TRANSLATIONS = {
  en: {
    "nav-home": "Home",
    "nav-shop": "Shop",
    "nav-register": "Register / Login",
    "nav-farmer-db": "Farmer Portal",
    "nav-consumer-db": "My Orders",
    "nav-admin-db": "Admin",
    "txt-reviews-title": "Customer Reviews",
    "txt-reviews-subtitle": "What other buyers say about this harvest",
    "txt-write-review-title": "Write a Review",
    "lbl-rating": "Your Rating",
    "lbl-review-comment": "Review Comments",
    "btn-submit-review": "Submit Review",
    "txt-invoice-header-title": "Order Invoice",
    "btn-print-invoice-action": "Print Invoice",
    "btn-close-invoice": "Close"
  },
  ta: {
    "nav-home": "முகப்பு",
    "nav-shop": "விவசாய சந்தை",
    "nav-register": "பதிவு / உள்நுழைவு",
    "nav-farmer-db": "விவசாயி தளம்",
    "nav-consumer-db": "எனது ஆர்டர்கள்",
    "nav-admin-db": "நிர்வாகி",
    "txt-reviews-title": "வாடிக்கையாளர் கருத்துக்கள்",
    "txt-reviews-subtitle": "இந்த விளைச்சல் பற்றி நுகர்வோர்கள் கூறுவது",
    "txt-write-review-title": "மதிப்பீட்டை எழுதவும்",
    "lbl-rating": "உங்கள் மதிப்பீடு",
    "lbl-review-comment": "கருத்துகள்",
    "btn-submit-review": "கருத்தை சமர்ப்பிக்கவும்",
    "txt-invoice-header-title": "வரி விலைப்பட்டியல் (Invoice)",
    "btn-print-invoice-action": "பில் பிரிண்ட் செய்க",
    "btn-close-invoice": "மூடு"
  }
};


// Instantiate and expose the app controller globally
const app = new FarmConnectApp();
window.app = app;
