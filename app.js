// app.js - FarmConnect Single-Page Application Controller

class FarmConnectApp {
  constructor() {
    this.currentUser = null;
    this.cart = [];
    this.currentView = 'home';
    this.shopCategory = 'All';
    this.activeProductDetailsId = null;

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

    // Update UI elements for connection status
    this.updateDbStatusIndicator();

    // Trigger router for current location hash
    this.handleRouting();

    // Setup initial product counters and cart badges
    this.updateCartBadge();
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
          <tr>
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
}

// Instantiate and expose the app controller globally
const app = new FarmConnectApp();
window.app = app;
