-- Supabase Database Schema for FarmConnect
-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Farmers Table
CREATE TABLE IF NOT EXISTS public.farmers (
    id TEXT PRIMARY KEY, -- Can be Supabase auth.users.id UUID or unique username/id
    name TEXT NOT NULL,
    farm_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    location TEXT NOT NULL, -- Village, District
    products TEXT NOT NULL, -- Products grown description
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Consumers Table
CREATE TABLE IF NOT EXISTS public.consumers (
    id TEXT PRIMARY KEY, -- Can be Supabase auth.users.id UUID or unique username/id
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    contact_number TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Vegetables', 'Fruits', 'Grains', 'Organic')),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity >= 0), -- Available stock in kg
    farmer_id TEXT REFERENCES public.farmers(id) ON DELETE CASCADE,
    description TEXT,
    harvest_date DATE DEFAULT CURRENT_DATE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id TEXT REFERENCES public.consumers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    order_status TEXT NOT NULL CHECK (order_status IN ('Pending', 'Shipped', 'Delivered')) DEFAULT 'Pending',
    order_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (optional - disabled by default for presentation ease, but configured here)
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products & farmers
CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public read access to farmers" ON public.farmers FOR SELECT USING (true);

-- Allow all actions for authenticated users (simplified for presentation)
CREATE POLICY "Allow all actions on farmers for authenticated users" ON public.farmers FOR ALL USING (true);
CREATE POLICY "Allow all actions on consumers for authenticated users" ON public.consumers FOR ALL USING (true);
CREATE POLICY "Allow all actions on products for farmers" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow all actions on orders for buyers and sellers" ON public.orders FOR ALL USING (true);

-- Seed Data for Indian Farmers
INSERT INTO public.farmers (id, name, farm_name, contact_number, location, products) VALUES
('farmer_rajesh', 'Rajesh Kumar', 'Rajesh Organic Farms', '+91 98765 43210', 'Nashik, Maharashtra', 'Organic Grapes, Tomatoes, Onions'),
('farmer_sunita', 'Sunita Devi', 'Green Valley Farm', '+91 87654 32109', 'Ludhiana, Punjab', 'Basmati Rice, Wheat, Mustard Seed'),
('farmer_ramesh', 'Ramesh Patil', 'Sahyadri Agro', '+91 76543 21098', 'Satara, Maharashtra', 'Strawberries, Potatoes, Carrots'),
('farmer_amit', 'Amit Sharma', 'Himalayan Harvest', '+91 95432 10987', 'Shimla, Himachal Pradesh', 'Royal Delicious Apples, Walnuts');

-- Seed Data for Products
INSERT INTO public.products (id, product_name, category, price, quantity, farmer_id, description, harvest_date, image_url) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Organic Nashik Grapes', 'Fruits', 120.00, 150.0, 'farmer_rajesh', 'Freshly harvested sweet black seedless organic grapes.', CURRENT_DATE - 2, 'grapes'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Fresh Vine Tomatoes', 'Vegetables', 40.00, 200.0, 'farmer_rajesh', 'Bright red juicy farm-fresh tomatoes.', CURRENT_DATE - 1, 'tomatoes'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Premium Basmati Rice', 'Grains', 110.00, 500.0, 'farmer_sunita', 'Traditional long-grain aromatic Basmati rice, aged to perfection.', CURRENT_DATE - 15, 'rice'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Whole Wheat (Sharbati)', 'Grains', 45.00, 800.0, 'farmer_sunita', 'Premium quality Sharbati wheat flour grains from Punjab fields.', CURRENT_DATE - 20, 'wheat'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Sweet Shimla Apples', 'Fruits', 180.00, 100.0, 'farmer_amit', 'Crisp, juicy and highly flavorful red apples direct from orchards.', CURRENT_DATE - 4, 'apples'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Organic Carrots', 'Organic', 60.00, 120.0, 'farmer_ramesh', 'Sweet, orange, pesticide-free baby carrots.', CURRENT_DATE - 3, 'carrots'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Fresh Potatoes', 'Vegetables', 30.00, 350.0, 'farmer_ramesh', 'Freshly dug soil potatoes, perfect for daily cooking.', CURRENT_DATE - 5, 'potatoes');
