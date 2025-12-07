-- Run this script first to set up all tables

-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS message_groups CASCADE;
DROP TABLE IF EXISTS message_group_members CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- Create customers table with password
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  points INTEGER DEFAULT 100,
  unlimited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message groups table
CREATE TABLE message_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message group members table
CREATE TABLE message_group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES message_groups(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, customer_id)
);

-- Create messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_group_members ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is an internal store app)
CREATE POLICY "Allow all on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on message_groups" ON message_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on message_group_members" ON message_group_members FOR ALL USING (true) WITH CHECK (true);

-- Insert default products
INSERT INTO products (id, name, price, image) VALUES
  ('1', 'Palestine Flag', 15.00, '/placeholder.svg?height=200&width=200'),
  ('2', 'Keffiyeh Scarf', 25.00, '/placeholder.svg?height=200&width=200'),
  ('3', 'Free Palestine T-Shirt', 20.00, '/placeholder.svg?height=200&width=200'),
  ('4', 'Solidarity Pin', 5.00, '/placeholder.svg?height=200&width=200'),
  ('5', 'Peace Poster', 10.00, '/placeholder.svg?height=200&width=200');
