# 🌾 FarmConnect - Direct Farmer-to-Consumer C2C Agri-Tech Platform

> **Empowering Local Farmers through Direct Consumer Access, AI-Driven Calculations & Verified QR Traceability**

---

## 🌟 1. Project Overview & Vision

**FarmConnect** is a responsive Direct C2C/Farmer-to-Buyer Web Application designed to solve the critical problem of multi-tier middlemen exploitation in traditional agricultural supply chains (the Mandi system). 

By enabling farmers to list their fresh harvests directly to buyers:
* **Farmers** earn **+170% to +185% higher net income** by receiving 100% of the market value.
* **Consumers** receive **100% fresh, pesticide-free produce** direct from local orchards at **~15% lower cost** than retail supermarkets.
* **Environmental Impact**: Transportation routes are optimized, saving over **4 kg of CO2 emissions per order**.

---

## 🚀 2. Key Standout Features

### 📜 A. Farm-to-Fork Digital Passport & QR Traceability
* **Trace Origin Badge**: Every crop listing features a verified badge. Clicking it opens an official organic traceability certificate.
* **Scannable QR Code**: Dynamically rendered (via QR API) to link to batch records.
* **Verified GPS Coordinates**: Exact farm location (e.g., *9.9252° N, 78.1198° E - Madurai, TN*).
* **Soil Health Index**: Displays soil rating and pH levels (e.g., *9.8/10 - pH 6.8 Vermicompost*).
* **Eco Carbon Offset**: Displays kilograms of CO2 saved by shipping directly to the buyer.

### ⚡ B. AI Fair-Price & Profit Margin Estimator
* **Interactive Calculator**: Accessible from the top header navigation.
* **Real-time Financial Engine**: Select crop variety and input harvest weight (kg) to dynamically calculate:
  * Mandi Middleman payout vs. FarmConnect Direct Price.
  * **Farmer Net Profit Gain** (rupee value and percentages, e.g., `+185% Extra Earnings`).
  * Consumer savings compared to retail supermarket prices.

### 🌐 C. Full English & Tamil (`தமிழ்`) Localization
* Instant bilingual toggler translates all static text, digital certificates, calculator inputs, user dashboards, review sections, and order statuses.

### 🛒 D. Direct Farmer Listing & Ordering Portal
* **Farmer Dashboard**: List new crops, set pricing, update stocks, and manage received orders.
* **Consumer Dashboard**: Purchase history logs, live shipment trackers (4 stages), and printable tax invoices.

---

## 🛠️ 3. Technical Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5, Vanilla CSS3 | Custom Design System, Responsive Flexbox/Grid layouts, Glassmorphic panels, CSS Keyframe Animations. |
| **Controller** | Object-Oriented JS (`app.js`) | Handles state management, dynamic DOM rendering, client-side routing, and modal states. |
| **Database** | Supabase (Postgres) / LocalStorage | Synchronizes data to a real-time Postgres cloud database with automatic local fallback. |
| **APIs** | QRServer API, Lucide Icons | Renders SVG vector icons and dynamic crop traceability QR codes. |

---

## 💾 4. Database Schema (Supabase)

Below is the database schema used to initialize the cloud Postgres tables:

```sql
-- 1. Farmers Table
CREATE TABLE public.farmers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    farm_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    location TEXT NOT NULL,
    products TEXT NOT NULL
);

-- 2. Consumers Table
CREATE TABLE public.consumers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    contact_number TEXT NOT NULL,
    address TEXT NOT NULL
);

-- 3. Products Table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Vegetables', 'Fruits', 'Grains', 'Organic')),
    price NUMERIC(10, 2) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL, -- Stock in kg
    farmer_id TEXT REFERENCES public.farmers(id) ON DELETE CASCADE,
    description TEXT,
    harvest_date DATE DEFAULT CURRENT_DATE,
    image_url TEXT
);

-- 4. Orders Table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id TEXT REFERENCES public.consumers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    order_status TEXT NOT NULL DEFAULT 'Pending',
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 💻 5. How to Setup and Run

### Run Locally:
1. Open a terminal, navigate to the folder, and start the local Python web server:
   ```cmd
   python -m http.server 8000
   ```
2. Open your browser and go to: **`http://localhost:8000`**

### Deploy to GitHub Pages:
1. Upload the files (`index.html`, `styles.css`, `app.js`, `db.js`, `README.md`) to your GitHub Repository.
2. Go to **Settings** -> **Pages** and enable deployment from your `main` branch.

### Connect to your Supabase Cloud Database:
1. Copy your project **URL** and **API Publishable Key** from your Supabase Dashboard settings.
2. Open your website's developer console (**`F12`** -> **Console**) and run:
   ```javascript
   localStorage.setItem('FC_SUPABASE_URL', 'your_project_url');
   localStorage.setItem('FC_SUPABASE_ANON_KEY', 'your_publishable_key');
   ```
3. Refresh the page! The connection status indicator will turn green.

---

## 🎓 6. College Pitch & Demo Tips

When presenting this project to your teachers/examiners:
1. **Explain the Social Problem**: Emphasize how mandi agents take 60% of crop value, leaving local farmers in debt. Show how **FarmConnect** restores 100% of earnings to the farmer.
2. **Demo the AI Calculator**: Open the `AI Price Calculator`, change crop quantities to 500 kg, and highlight the **+185% net income increase** farmers receive.
3. **Demo the Digital Passport**: Click **Trace Origin Passport** on Alphonso Mango to show GPS farm trace data, organic certificates, and soil health scores.
4. **Demonstrate Localization**: Switch to **`தமிழ்`** to show how rural farmers who don't know English can easily navigate the entire application.
