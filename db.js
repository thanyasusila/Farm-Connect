// db.js - FarmConnect Unified Database Client (Supabase with LocalStorage Mock Fallback)

// Realistic Indian Agricultural Seed Data
const DEFAULT_FARMERS = [
  {
    id: "farmer_rajesh",
    name: "Rajesh Kumar",
    farm_name: "Rajesh Organic Farms",
    contact_number: "+91 98765 43210",
    location: "Nashik, Maharashtra",
    products: "Organic Grapes, Tomatoes, Onions"
  },
  {
    id: "farmer_sunita",
    name: "Sunita Devi",
    farm_name: "Green Valley Farm",
    contact_number: "+91 87654 32109",
    location: "Ludhiana, Punjab",
    products: "Basmati Rice, Wheat, Mustard Seed"
  },
  {
    id: "farmer_ramesh",
    name: "Ramesh Patil",
    farm_name: "Sahyadri Agro",
    contact_number: "+91 76543 21098",
    location: "Satara, Maharashtra",
    products: "Strawberries, Potatoes, Carrots"
  },
  {
    id: "farmer_amit",
    name: "Amit Sharma",
    farm_name: "Himalayan Harvest",
    contact_number: "+91 95432 10987",
    location: "Shimla, Himachal Pradesh",
    products: "Royal Delicious Apples, Walnuts"
  },
  {
    id: "farmer_selvam",
    name: "Selvam",
    farm_name: "Madurai Organic Farms",
    contact_number: "+91 94440 12345",
    location: "Madurai, Tamil Nadu",
    products: "Alphonso Mango, Neelum Mango, Banganapalli Mango, Madurai Turmeric"
  }
];

const DEFAULT_CONSUMERS = [
  {
    id: "consumer_arjun",
    name: "Arjun Mehta",
    email: "arjun@gmail.com",
    contact_number: "+91 99887 76655",
    address: "Apt 402, Green Glen Layout, Bangalore, Karnataka - 560103"
  },
  {
    id: "consumer_priya",
    name: "Priya Sharma",
    email: "priya@gmail.com",
    contact_number: "+91 88776 65544",
    address: "H.No. 12, Sector 15, Gurgaon, Haryana - 122001"
  }
];

const DEFAULT_PRODUCTS = [
  {
    id: "prod_grapes",
    product_name: "Organic Nashik Grapes",
    category: "Fruits",
    price: 120.00,
    quantity: 150.0,
    farmer_id: "farmer_rajesh",
    description: "Freshly harvested, sweet, black seedless organic grapes, grown with natural compost.",
    harvest_date: "2026-06-20",
    image_url: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod_tomatoes",
    product_name: "Fresh Vine Tomatoes",
    category: "Vegetables",
    price: 40.00,
    quantity: 200.0,
    farmer_id: "farmer_rajesh",
    description: "Bright red, juicy farm-fresh tomatoes, perfect for salads and curries.",
    harvest_date: "2026-06-21",
    image_url: "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod_rice",
    product_name: "Premium Basmati Rice",
    category: "Grains",
    price: 110.00,
    quantity: 500.0,
    farmer_id: "farmer_sunita",
    description: "Traditional long-grain aromatic Basmati rice, aged for 12 months for ultimate fragrance and fluffiness.",
    harvest_date: "2026-06-05",
    image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod_wheat",
    product_name: "Whole Wheat (Sharbati)",
    category: "Grains",
    price: 45.00,
    quantity: 800.0,
    farmer_id: "farmer_sunita",
    description: "Premium quality Sharbati wheat grains, rich in nutrients, harvested from Punjab's golden fields.",
    harvest_date: "2026-06-01",
    image_url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod_apples",
    product_name: "Sweet Shimla Apples",
    category: "Fruits",
    price: 180.00,
    quantity: 100.0,
    farmer_id: "farmer_amit",
    description: "Crisp, juicy and highly flavorful red Royal Delicious apples direct from Shimla orchards.",
    harvest_date: "2026-06-18",
    image_url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod_carrots",
    product_name: "Organic Orange Carrots",
    category: "Organic",
    price: 60.00,
    quantity: 120.0,
    farmer_id: "farmer_ramesh",
    description: "Sweet, crunchy, pesticide-free carrots, rich in Beta-Carotene.",
    harvest_date: "2026-06-19",
    image_url: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod_potatoes",
    product_name: "Fresh New Potatoes",
    category: "Vegetables",
    price: 30.00,
    quantity: 350.0,
    farmer_id: "farmer_ramesh",
    description: "Freshly dug baby potatoes, thin skinned, excellent taste and texture.",
    harvest_date: "2026-06-17",
    image_url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod_alphonso",
    product_name: "Alphonso Mango",
    category: "Fruits",
    price: 250.00,
    quantity: 100.0,
    farmer_id: "farmer_selvam",
    description: "Premium Alphonso mangoes, known for their rich, sweet, and creamy flavor.",
    harvest_date: "2026-06-22",
    image_url: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod_neelum",
    product_name: "Neelum Mango",
    category: "Fruits",
    price: 150.00,
    quantity: 120.0,
    farmer_id: "farmer_selvam",
    description: "Highly aromatic Neelum mangoes, sweet taste with a unique fiberless texture, direct from Madurai.",
    harvest_date: "2026-06-23",
    image_url: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod_banganapalli",
    product_name: "Banganapalli Mango",
    category: "Fruits",
    price: 180.00,
    quantity: 150.0,
    farmer_id: "farmer_selvam",
    description: "Large-sized sweet Banganapalli mangoes, direct from our Madurai farm.",
    harvest_date: "2026-06-21",
    image_url: "https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod_turmeric",
    product_name: "Organic Madurai Turmeric",
    category: "Organic",
    price: 90.00,
    quantity: 300.0,
    farmer_id: "farmer_selvam",
    description: "Pure, high-curcumin turmeric powder, processed organically in Madurai.",
    harvest_date: "2026-06-15",
    image_url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80"
  }
];

const DEFAULT_ORDERS = [
  {
    id: "order_1",
    customer_id: "consumer_arjun",
    product_id: "prod_grapes",
    quantity: 5,
    total_price: 600.00,
    order_status: "Delivered",
    order_date: "2026-06-15T14:30:00.000Z"
  },
  {
    id: "order_2",
    customer_id: "consumer_arjun",
    product_id: "prod_rice",
    quantity: 10,
    total_price: 1100.00,
    order_status: "Shipped",
    order_date: "2026-06-20T10:15:00.000Z"
  },
  {
    id: "order_3",
    customer_id: "consumer_priya",
    product_id: "prod_apples",
    quantity: 3,
    total_price: 540.00,
    order_status: "Pending",
    order_date: "2026-06-22T08:00:00.000Z"
  }
];

const DEFAULT_REVIEWS = [
  {
    id: "rev_1",
    product_id: "prod_grapes",
    author_name: "Arjun Mehta",
    rating: 5,
    comment: "The grapes were extremely sweet and fresh! My children loved them. Directly from Nashik farm, highly recommended.",
    date: "2026-06-18T10:00:00.000Z"
  },
  {
    id: "rev_2",
    product_id: "prod_grapes",
    author_name: "Priya Sharma",
    rating: 4,
    comment: "ரொம்ப அருமையான திராட்சை பழங்கள். (Very nice grapes. Juicy and fresh!)",
    date: "2026-06-19T14:30:00.000Z"
  },
  {
    id: "rev_3",
    product_id: "prod_rice",
    author_name: "Arjun Mehta",
    rating: 5,
    comment: "Traditional Basmati fragrance is amazing! It cooks so fluffy. Will buy again.",
    date: "2026-06-21T09:15:00.000Z"
  },
  {
    id: "rev_4",
    product_id: "prod_apples",
    author_name: "Priya Sharma",
    rating: 5,
    comment: "Shimla apples are super crisp. Packaging was good. Direct support to farmer feels great.",
    date: "2026-06-22T11:00:00.000Z"
  }
];

// Helper to check if Supabase credentials exist
function getSupabaseConfig() {
  const url = localStorage.getItem("FC_SUPABASE_URL") || window.VITE_SUPABASE_URL || "";
  const key = localStorage.getItem("FC_SUPABASE_ANON_KEY") || window.VITE_SUPABASE_ANON_KEY || "";
  return url && key ? { url, key } : null;
}

// Initializing Mock LocalStorage database if needed
function initMockDb() {
  if (!localStorage.getItem("fc_farmers")) {
    localStorage.setItem("fc_farmers", JSON.stringify(DEFAULT_FARMERS));
  } else {
    // Ensure Selvam is present in mock database if it was already initialized
    const farmers = JSON.parse(localStorage.getItem("fc_farmers"));
    if (!farmers.some(f => f.id === "farmer_selvam")) {
      farmers.push(DEFAULT_FARMERS.find(f => f.id === "farmer_selvam"));
      localStorage.setItem("fc_farmers", JSON.stringify(farmers));
    }
  }
  if (!localStorage.getItem("fc_consumers")) {
    localStorage.setItem("fc_consumers", JSON.stringify(DEFAULT_CONSUMERS));
  }
  if (!localStorage.getItem("fc_products")) {
    localStorage.setItem("fc_products", JSON.stringify(DEFAULT_PRODUCTS));
  } else {
    // Ensure new products are present in mock database if it was already initialized
    const products = JSON.parse(localStorage.getItem("fc_products"));
    const newProductIds = ["prod_alphonso", "prod_neelum", "prod_banganapalli", "prod_turmeric"];
    let updated = false;
    for (const pid of newProductIds) {
      if (!products.some(p => p.id === pid)) {
        const prod = DEFAULT_PRODUCTS.find(p => p.id === pid);
        if (prod) {
          products.push(prod);
          updated = true;
        }
      }
    }
    if (updated) {
      localStorage.setItem("fc_products", JSON.stringify(products));
    }
  }
  if (!localStorage.getItem("fc_orders")) {
    localStorage.setItem("fc_orders", JSON.stringify(DEFAULT_ORDERS));
  }
  if (!localStorage.getItem("fc_reviews")) {
    localStorage.setItem("fc_reviews", JSON.stringify(DEFAULT_REVIEWS));
  }
}

// Mock Database Service Implementation
const MockDbService = {
  async getFarmers() {
    initMockDb();
    return JSON.parse(localStorage.getItem("fc_farmers"));
  },

  async getFarmerById(id) {
    const farmers = await this.getFarmers();
    return farmers.find(f => f.id === id) || null;
  },

  async getConsumers() {
    initMockDb();
    return JSON.parse(localStorage.getItem("fc_consumers"));
  },

  async getConsumerById(id) {
    const consumers = await this.getConsumers();
    return consumers.find(c => c.id === id) || null;
  },

  async getProducts() {
    initMockDb();
    return JSON.parse(localStorage.getItem("fc_products"));
  },

  async getProductById(id) {
    const products = await this.getProducts();
    return products.find(p => p.id === id) || null;
  },

  async getOrders() {
    initMockDb();
    return JSON.parse(localStorage.getItem("fc_orders"));
  },

  async createOrder(orderData) {
    initMockDb();
    const orders = JSON.parse(localStorage.getItem("fc_orders"));
    const products = JSON.parse(localStorage.getItem("fc_products"));

    // We process each cart item separately
    const newOrders = [];
    for (const item of orderData.items) {
      const product = products.find(p => p.id === item.id);
      if (!product) continue;

      // Adjust quantity in stock
      if (product.quantity < item.qty) {
        throw new Error(`Insufficient stock for ${product.product_name}. Available: ${product.quantity} kg`);
      }
      product.quantity -= item.qty;

      const newOrder = {
        id: "order_" + Math.random().toString(36).substr(2, 9),
        customer_id: orderData.customer_id,
        product_id: item.id,
        quantity: item.qty,
        total_price: product.price * item.qty,
        order_status: "Pending",
        order_date: new Date().toISOString()
      };

      orders.push(newOrder);
      newOrders.push(newOrder);
    }

    localStorage.setItem("fc_orders", JSON.stringify(orders));
    localStorage.setItem("fc_products", JSON.stringify(products));
    return newOrders;
  },

  async updateOrderStatus(orderId, status) {
    initMockDb();
    const orders = JSON.parse(localStorage.getItem("fc_orders"));
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index].order_status = status;
      localStorage.setItem("fc_orders", JSON.stringify(orders));
      return orders[index];
    }
    throw new Error("Order not found");
  },

  async registerFarmer(farmerData) {
    initMockDb();
    const farmers = JSON.parse(localStorage.getItem("fc_farmers"));
    
    // Check if farmer contact already registered
    const exists = farmers.find(f => f.contact_number === farmerData.contact_number);
    if (exists) {
      return exists; // Login instead of fail for demonstration ease
    }

    const newFarmer = {
      id: "farmer_" + Math.random().toString(36).substr(2, 9),
      ...farmerData
    };
    farmers.push(newFarmer);
    localStorage.setItem("fc_farmers", JSON.stringify(farmers));
    return newFarmer;
  },

  async registerConsumer(consumerData) {
    initMockDb();
    const consumers = JSON.parse(localStorage.getItem("fc_consumers"));

    // Check if email already registered
    const exists = consumers.find(c => c.email.toLowerCase() === consumerData.email.toLowerCase());
    if (exists) {
      return exists;
    }

    const newConsumer = {
      id: "consumer_" + Math.random().toString(36).substr(2, 9),
      ...consumerData
    };
    consumers.push(newConsumer);
    localStorage.setItem("fc_consumers", JSON.stringify(consumers));
    return newConsumer;
  },

  async addProduct(productData) {
    initMockDb();
    const products = JSON.parse(localStorage.getItem("fc_products"));
    const newProduct = {
      id: "prod_" + Math.random().toString(36).substr(2, 9),
      ...productData,
      price: parseFloat(productData.price),
      quantity: parseFloat(productData.quantity)
    };
    products.unshift(newProduct); // Add to beginning
    localStorage.setItem("fc_products", JSON.stringify(products));
    return newProduct;
  },

  async deleteProduct(productId) {
    initMockDb();
    let products = JSON.parse(localStorage.getItem("fc_products"));
    products = products.filter(p => p.id !== productId);
    localStorage.setItem("fc_products", JSON.stringify(products));
    return true;
  },

  async getStats() {
    const farmers = await this.getFarmers();
    const consumers = await this.getConsumers();
    const products = await this.getProducts();
    const orders = await this.getOrders();

    return {
      totalFarmers: farmers.length,
      totalConsumers: consumers.length,
      totalProducts: products.length,
      totalOrders: orders.length
    };
  },

  async getProductReviews(productId) {
    initMockDb();
    const reviews = JSON.parse(localStorage.getItem("fc_reviews")) || [];
    return reviews.filter(r => r.product_id === productId);
  },

  async submitProductReview(productId, reviewData) {
    initMockDb();
    const reviews = JSON.parse(localStorage.getItem("fc_reviews")) || [];
    const newReview = {
      id: "rev_" + Math.random().toString(36).substr(2, 9),
      product_id: productId,
      author_name: reviewData.author_name,
      rating: parseInt(reviewData.rating),
      comment: reviewData.comment,
      date: new Date().toISOString()
    };
    reviews.unshift(newReview);
    localStorage.setItem("fc_reviews", JSON.stringify(reviews));
    return newReview;
  }
};

// Real Supabase DB Service Implementation
let supabaseInstance = null;
function getSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config) return null;

  if (!supabaseInstance && window.supabase) {
    supabaseInstance = window.supabase.createClient(config.url, config.key);
  }
  return supabaseInstance;
}

const SupabaseDbService = {
  async getFarmers() {
    const client = getSupabaseClient();
    const { data, error } = await client.from("farmers").select("*");
    if (error) throw error;
    return data;
  },

  async getFarmerById(id) {
    const client = getSupabaseClient();
    const { data, error } = await client.from("farmers").select("*").eq("id", id).single();
    if (error) return null;
    return data;
  },

  async getConsumers() {
    const client = getSupabaseClient();
    const { data, error } = await client.from("consumers").select("*");
    if (error) throw error;
    return data;
  },

  async getConsumerById(id) {
    const client = getSupabaseClient();
    const { data, error } = await client.from("consumers").select("*").eq("id", id).single();
    if (error) return null;
    return data;
  },

  async getProducts() {
    const client = getSupabaseClient();
    const { data, error } = await client.from("products").select("*, farmers(name, location)");
    if (error) throw error;
    // Map to include nested farmer data directly for consistency
    return data.map(p => ({
      ...p,
      farmer_name: p.farmers ? p.farmers.name : "Unknown Farmer",
      location: p.farmers ? p.farmers.location : "Unknown Location"
    }));
  },

  async getProductById(id) {
    const client = getSupabaseClient();
    const { data, error } = await client.from("products").select("*, farmers(name, location)").eq("id", id).single();
    if (error) return null;
    return {
      ...data,
      farmer_name: data.farmers ? data.farmers.name : "Unknown Farmer",
      location: data.farmers ? data.farmers.location : "Unknown Location"
    };
  },

  async getOrders() {
    const client = getSupabaseClient();
    const { data, error } = await client.from("orders").select("*, consumers(name, contact_number, address), products(product_name, price, farmer_id, farmers(name))");
    if (error) throw error;
    return data.map(o => ({
      id: o.id,
      customer_id: o.customer_id,
      customer_name: o.consumers ? o.consumers.name : "Unknown",
      customer_contact: o.consumers ? o.consumers.contact_number : "",
      customer_address: o.consumers ? o.consumers.address : "",
      product_id: o.product_id,
      product_name: o.products ? o.products.product_name : "Deleted Product",
      farmer_id: o.products ? o.products.farmer_id : "",
      farmer_name: o.products && o.products.farmers ? o.products.farmers.name : "Unknown Farmer",
      quantity: o.quantity,
      total_price: o.total_price,
      order_status: o.order_status,
      order_date: o.order_date
    }));
  },

  async createOrder(orderData) {
    const client = getSupabaseClient();
    const ordersToInsert = [];
    const productsToUpdate = [];

    // Retrieve product info and check stock levels
    for (const item of orderData.items) {
      const { data: product, error } = await client.from("products").select("*").eq("id", item.id).single();
      if (error || !product) throw new Error(`Product not found.`);
      if (product.quantity < item.qty) {
        throw new Error(`Insufficient stock for ${product.product_name}. Available: ${product.quantity} kg`);
      }
      ordersToInsert.push({
        customer_id: orderData.customer_id,
        product_id: item.id,
        quantity: item.qty,
        total_price: product.price * item.qty,
        order_status: "Pending"
      });
      productsToUpdate.push({
        id: item.id,
        quantity: product.quantity - item.qty
      });
    }

    // Insert orders
    const { data: insertedOrders, error: insertError } = await client.from("orders").insert(ordersToInsert).select();
    if (insertError) throw insertError;

    // Update product stocks
    for (const prod of productsToUpdate) {
      await client.from("products").update({ quantity: prod.quantity }).eq("id", prod.id);
    }

    return insertedOrders;
  },

  async updateOrderStatus(orderId, status) {
    const client = getSupabaseClient();
    const { data, error } = await client.from("orders").update({ order_status: status }).eq("id", orderId).select().single();
    if (error) throw error;
    return data;
  },

  async registerFarmer(farmerData) {
    const client = getSupabaseClient();
    const { data: existing } = await client.from("farmers").select("*").eq("contact_number", farmerData.contact_number).single();
    if (existing) return existing;

    const { data, error } = await client.from("farmers").insert([{
      id: farmerData.id || "farmer_" + Math.random().toString(36).substr(2, 9),
      name: farmerData.name,
      farm_name: farmerData.farm_name,
      contact_number: farmerData.contact_number,
      location: farmerData.location,
      products: farmerData.products
    }]).select().single();
    if (error) throw error;
    return data;
  },

  async registerConsumer(consumerData) {
    const client = getSupabaseClient();
    const { data: existing } = await client.from("consumers").select("*").eq("email", consumerData.email).single();
    if (existing) return existing;

    const { data, error } = await client.from("consumers").insert([{
      id: consumerData.id || "consumer_" + Math.random().toString(36).substr(2, 9),
      name: consumerData.name,
      email: consumerData.email,
      contact_number: consumerData.contact_number,
      address: consumerData.address
    }]).select().single();
    if (error) throw error;
    return data;
  },

  async addProduct(productData) {
    const client = getSupabaseClient();
    const { data, error } = await client.from("products").insert([{
      product_name: productData.product_name,
      category: productData.category,
      price: parseFloat(productData.price),
      quantity: parseFloat(productData.quantity),
      farmer_id: productData.farmer_id,
      description: productData.description,
      harvest_date: productData.harvest_date,
      image_url: productData.image_url
    }]).select().single();
    if (error) throw error;
    return data;
  },

  async deleteProduct(productId) {
    const client = getSupabaseClient();
    const { error } = await client.from("products").delete().eq("id", productId);
    if (error) throw error;
    return true;
  },

  async getStats() {
    const client = getSupabaseClient();
    
    const { count: countFarmers } = await client.from("farmers").select("*", { count: "exact", head: true });
    const { count: countConsumers } = await client.from("consumers").select("*", { count: "exact", head: true });
    const { count: countProducts } = await client.from("products").select("*", { count: "exact", head: true });
    const { count: countOrders } = await client.from("orders").select("*", { count: "exact", head: true });

    return {
      totalFarmers: countFarmers || 0,
      totalConsumers: countConsumers || 0,
      totalProducts: countProducts || 0,
      totalOrders: countOrders || 0
    };
  },

  async getProductReviews(productId) {
    const client = getSupabaseClient();
    try {
      const { data, error } = await client.from("reviews").select("*").eq("product_id", productId);
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn("Supabase reviews table not found, falling back to local storage reviews.", e);
      initMockDb();
      const reviews = JSON.parse(localStorage.getItem("fc_reviews")) || [];
      return reviews.filter(r => r.product_id === productId);
    }
  },

  async submitProductReview(productId, reviewData) {
    const client = getSupabaseClient();
    try {
      const { data, error } = await client.from("reviews").insert([{
        product_id: productId,
        author_name: reviewData.author_name,
        rating: parseInt(reviewData.rating),
        comment: reviewData.comment
      }]).select().single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn("Supabase reviews insert failed, falling back to local storage.", e);
      initMockDb();
      const reviews = JSON.parse(localStorage.getItem("fc_reviews")) || [];
      const newReview = {
        id: "rev_" + Math.random().toString(36).substr(2, 9),
        product_id: productId,
        author_name: reviewData.author_name,
        rating: parseInt(reviewData.rating),
        comment: reviewData.comment,
        date: new Date().toISOString()
      };
      reviews.unshift(newReview);
      localStorage.setItem("fc_reviews", JSON.stringify(reviews));
      return newReview;
    }
  }
};

// Main export client selecting the correct service based on environment
const db = {
  isSupabaseConfigured() {
    return getSupabaseConfig() !== null;
  },
  
  getService() {
    const configured = this.isSupabaseConfigured() && window.supabase;
    if (configured) {
      console.log("FarmConnect: Using real Supabase database backend.");
      return SupabaseDbService;
    } else {
      console.log("FarmConnect: Using LocalStorage Mock database.");
      return MockDbService;
    }
  },

  async getFarmers() { return this.getService().getFarmers(); },
  async getFarmerById(id) { return this.getService().getFarmerById(id); },
  async getConsumers() { return this.getService().getConsumers(); },
  async getConsumerById(id) { return this.getService().getConsumerById(id); },
  async getProducts() { return this.getService().getProducts(); },
  async getProductById(id) { return this.getService().getProductById(id); },
  async getOrders() { return this.getService().getOrders(); },
  async createOrder(orderData) { return this.getService().createOrder(orderData); },
  async updateOrderStatus(orderId, status) { return this.getService().updateOrderStatus(orderId, status); },
  async registerFarmer(farmerData) { return this.getService().registerFarmer(farmerData); },
  async registerConsumer(consumerData) { return this.getService().registerConsumer(consumerData); },
  async addProduct(productData) { return this.getService().addProduct(productData); },
  async deleteProduct(productId) { return this.getService().deleteProduct(productId); },
  async getStats() { return this.getService().getStats(); },
  async getProductReviews(productId) { return this.getService().getProductReviews(productId); },
  async submitProductReview(productId, reviewData) { return this.getService().submitProductReview(productId, reviewData); }
};

// Make it globally accessible
window.db = db;
