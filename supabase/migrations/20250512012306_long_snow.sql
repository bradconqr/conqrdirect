/*
  # Add product metadata table for Stripe integration

  1. New Tables
    - `product_metadata` - Stores Stripe product and price IDs for each product
  2. Security
    - Enable RLS on the new table
    - Add policies for creators to manage their product metadata
*/

-- Create product_metadata table
CREATE TABLE IF NOT EXISTS product_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stripe_product_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id)
);

-- Enable Row Level Security
ALTER TABLE product_metadata ENABLE ROW LEVEL SECURITY;

-- Product metadata RLS policies
CREATE POLICY "Creators can view metadata for their products"
  ON product_metadata FOR SELECT
  USING (product_id IN (
    SELECT id FROM products WHERE creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Creators can create metadata for their products"
  ON product_metadata FOR INSERT
  WITH CHECK (product_id IN (
    SELECT id FROM products WHERE creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Creators can update metadata for their products"
  ON product_metadata FOR UPDATE
  USING (product_id IN (
    SELECT id FROM products WHERE creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  ))
  WITH CHECK (product_id IN (
    SELECT id FROM products WHERE creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Creators can delete metadata for their products"
  ON product_metadata FOR DELETE
  USING (product_id IN (
    SELECT id FROM products WHERE creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  ));