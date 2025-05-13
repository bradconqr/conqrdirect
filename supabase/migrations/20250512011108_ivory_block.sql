/*
  # Initial schema for Stan Store clone

  1. New Tables
    - `creators` - Extends user profiles with creator-specific data
    - `products` - Products that creators can sell
    - `purchases` - Records of purchases made
    - `cart_items` - Items in user shopping carts
    - `discounts` - Discount codes for products
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create creators table
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  store_description TEXT,
  social_links JSONB,
  custom_domain TEXT,
  stripe_connected_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('download', 'course', 'membership', 'webinar')),
  price INTEGER NOT NULL,
  discount_price INTEGER,
  thumbnail TEXT,
  featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Download product specific fields
  file_url TEXT,
  file_size INTEGER,
  file_type TEXT,
  
  -- Course product specific fields
  modules JSONB,
  total_duration INTEGER,
  
  -- Membership product specific fields
  benefits JSONB,
  interval TEXT CHECK (interval IN ('monthly', 'yearly')),
  
  -- Webinar product specific fields
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  max_attendees INTEGER,
  meeting_url TEXT
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price INTEGER NOT NULL,
  discount_applied INTEGER,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, product_id)
);

-- Create discounts table
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value INTEGER NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (creator_id, code)
);

-- Enable Row Level Security
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Creators RLS policies
CREATE POLICY "Creators are viewable by anyone"
  ON creators FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own creator profile"
  ON creators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can update their own profile"
  ON creators FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Products RLS policies
CREATE POLICY "Published products are viewable by anyone"
  ON products FOR SELECT
  USING (published_at IS NOT NULL);

CREATE POLICY "Creators can view all their products"
  ON products FOR SELECT
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can create products"
  ON products FOR INSERT
  WITH CHECK (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can update their products"
  ON products FOR UPDATE
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ))
  WITH CHECK (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can delete their products"
  ON products FOR DELETE
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

-- Purchases RLS policies
CREATE POLICY "Users can view their own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Creators can view purchases of their products"
  ON purchases FOR SELECT
  USING (product_id IN (
    SELECT id FROM products WHERE creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Authenticated users can create purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Cart items RLS policies
CREATE POLICY "Users can view their own cart"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add items to their cart"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their cart"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove items from their cart"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- Discounts RLS policies
CREATE POLICY "Discounts are viewable by anyone"
  ON discounts FOR SELECT
  USING (true);

CREATE POLICY "Creators can create discounts"
  ON discounts FOR INSERT
  WITH CHECK (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can update their discounts"
  ON discounts FOR UPDATE
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ))
  WITH CHECK (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can delete their discounts"
  ON discounts FOR DELETE
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));