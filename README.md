# FarmConnect - Direct Farm-to-Consumer Agri-Tech Marketplace

FarmConnect is a premium, modern, responsive Agri-Tech web application that connects local Indian farmers directly with consumers. By removing middlemen, it allows farmers to earn fairer profits and provides consumers with fresher, pesticide-free, organic produce.

This application is built as a single-page web app using **Vanilla HTML5, CSS3, and ES6 JavaScript**, utilizing **Supabase** as the database backend.

---

## 🌟 Key Features

1. **Homepage**: Premium landing page with dynamic Hero section, visual workflow, benefit grids for farmers and consumers, featured harvests, organic grower success stories, and a contact form.
2. **Marketplace (Shop)**: Real-time search and filter crops by categories (Vegetables, Fruits, Grains, Organic). Modern product cards displaying location, price, and stock levels.
3. **Product Detail Page**: Displays detailed descriptions, harvest dates, available stocks, and a detailed profile of the farm owner. Includes a direct quantity selector and "Buy Now" capabilities.
4. **Shopping Cart**: Review selected crops, adjust quantities with live stock checks, calculate totals, and place orders. Includes a flat delivery charge of ₹50 or FREE delivery above ₹500.
5. **Farmer Registration & Dashboard**:
   - Register a new farm.
   - List new crops (set price, description, category, stock, and harvest date).
   - View and manage incoming orders (mark as *Pending*, *Shipped*, or *Delivered*).
6. **Consumer Registration & Dashboard**:
   - Register a consumer profile (name, mobile, address).
   - View placed orders and track shipment statuses in real-time.
7. **System Admin Panel**:
   - System-wide statistics (Total Farmers, Consumers, Crops, and Orders).
   - View lists of all registered farmers and consumers.
   - Review and delete crop listings.
   - Monitor all transactions and order logs.

---

## 🛠️ Dual-Mode Database Architecture

To make this project presentation-friendly and ensure it works out of the box without complex configuration:

* **Mock Mode (Default)**: The application automatically initializes a database in browser `localStorage`. It comes pre-seeded with realistic Indian farmers (Rajesh from Nashik, Sunita from Punjab, etc.), crop catalog items, and order histories. Any actions (adding crops, registering users, placing orders, changing statuses) persist locally.
* **Supabase Live Mode**: If you have a Supabase project, you can connect the app directly to your live PostgreSQL database using the **Supabase Connection Console** at the bottom of the page. Once credentials are saved, it switches to a live backend immediately!

---

## 🚀 How to Run the Project

Since this is a client-side web application, you do not need Node.js or npm installed. You can launch it using either of these two methods:

### Method A: Double-Click (Easiest)
1. Navigate to the project directory.
2. Double-click [index.html](file:///d:/Farm%20Connect/index.html) to open it directly in any web browser.

### Method B: Local Python Web Server (Recommended)
Running a local web server is best for performance and testing:
1. Open terminal in the project directory.
2. Run the Python server:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and navigate to `http://localhost:8000`.

---

## ⚡ Connecting to Live Supabase Backend

To migrate this presentation from local mock database to a live cloud database:

1. **Create a Supabase Project**: Go to [supabase.com](https://supabase.com) and create a free project.
2. **Execute Database Schema**:
   - Open the **SQL Editor** in your Supabase dashboard.
   - Click "New Query", paste the contents of [supabase_schema.sql](file:///d:/Farm%20Connect/supabase_schema.sql) into the editor, and run it. This will create all tables, set up constraints, and insert the initial Indian farmer profiles.
3. **Retrieve Credentials**:
   - Go to **Project Settings** -> **API**.
   - Copy the **Project URL** and the **Anon Public API Key**.
4. **Connect the App**:
   - Open FarmConnect in your browser.
   - Scroll to the footer and click **Configure Supabase Connection**.
   - Paste the URL and Anon Key, then click **Save Credentials**.
   - The page will refresh and the status pill will change to **Supabase Connected**.

---

## 🔑 Demo Credentials

To present the app's workflows quickly, use the quick login buttons on the **Register / Login** page:

* **Consumer View**: Log in as *Arjun Mehta* to browse the shop, add crops, and place orders.
* **Farmer View**: Log in as *Rajesh Kumar* to list tomatoes or grapes and ship received orders.
* **System Admin View**: Log in as *Administrator* to oversee all system statistics, delete items, and inspect database tables.
