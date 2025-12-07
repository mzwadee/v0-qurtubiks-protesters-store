-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  image TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  points INTEGER NOT NULL DEFAULT 100,
  unlimited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Since this is a public store without user authentication,
-- we'll make these tables publicly accessible
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products
CREATE POLICY "Allow public read access to products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to products" ON products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to products" ON products FOR DELETE USING (true);

-- Allow public access to customers
CREATE POLICY "Allow public read access to customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to customers" ON customers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to customers" ON customers FOR DELETE USING (true);

-- Allow public access to orders
CREATE POLICY "Allow public read access to orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to orders" ON orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to orders" ON orders FOR DELETE USING (true);
