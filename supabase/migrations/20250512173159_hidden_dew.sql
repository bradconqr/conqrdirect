/*
  # Add bundle and upsell tables
  
  1. New Tables
    - `bundles` - Stores product bundles
    - `bundle_items` - Stores products included in bundles
    - `upsells` - Stores upsell offers
    
  2. Security
    - Enable RLS on all tables
    - Add policies for creators to manage their bundles and upsells
*/

-- Create bundles table
CREATE TABLE IF NOT EXISTS public.bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create bundle_items table
CREATE TABLE IF NOT EXISTS public.bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_percentage INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(bundle_id, product_id)
);

-- Create upsells table
CREATE TABLE IF NOT EXISTS public.upsells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  offer_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL,
  display_location TEXT NOT NULL DEFAULT 'thank_you_page' CHECK (display_location IN ('thank_you_page', 'checkout_page', 'post_purchase_email')),
  is_limited_time_offer BOOLEAN DEFAULT false,
  expiration_time INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsells ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bundles
CREATE POLICY "Creators can view their bundles"
  ON public.bundles FOR SELECT
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can create bundles"
  ON public.bundles FOR INSERT
  WITH CHECK (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can update their bundles"
  ON public.bundles FOR UPDATE
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ))
  WITH CHECK (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can delete their bundles"
  ON public.bundles FOR DELETE
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

-- Create RLS policies for bundle_items
CREATE POLICY "Creators can view their bundle items"
  ON public.bundle_items FOR SELECT
  USING (bundle_id IN (
    SELECT id FROM bundles WHERE creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Creators can create bundle items"
  ON public.bundle_items FOR INSERT
  WITH CHECK (bundle_id IN (
    SELECT id FROM bundles WHERE creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Creators can update their bundle items"
  ON public.bundle_items FOR UPDATE
  USING (bundle_id IN (
    SELECT id FROM bundles WHERE creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  ))
  WITH CHECK (bundle_id IN (
    SELECT id FROM bundles WHERE creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Creators can delete their bundle items"
  ON public.bundle_items FOR DELETE
  USING (bundle_id IN (
    SELECT id FROM bundles WHERE creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  ));

-- Create RLS policies for upsells
CREATE POLICY "Creators can view their upsells"
  ON public.upsells FOR SELECT
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can create upsells"
  ON public.upsells FOR INSERT
  WITH CHECK (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can update their upsells"
  ON public.upsells FOR UPDATE
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ))
  WITH CHECK (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can delete their upsells"
  ON public.upsells FOR DELETE
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

-- Create functions to calculate bundle prices
CREATE OR REPLACE FUNCTION public.calculate_bundle_price(p_bundle_id UUID)
RETURNS TABLE (
  regular_price INTEGER,
  bundle_price INTEGER,
  savings INTEGER,
  savings_percentage INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_regular_price INTEGER := 0;
  v_bundle_price INTEGER := 0;
  v_discount_type TEXT;
  v_discount_value INTEGER;
  v_savings INTEGER;
  v_savings_percentage INTEGER;
BEGIN
  -- Get the bundle discount information
  SELECT discount_type, discount_value
  INTO v_discount_type, v_discount_value
  FROM bundles
  WHERE id = p_bundle_id;
  
  -- Calculate the regular price (sum of all product prices)
  SELECT COALESCE(SUM(p.price), 0)
  INTO v_regular_price
  FROM bundle_items bi
  JOIN products p ON bi.product_id = p.id
  WHERE bi.bundle_id = p_bundle_id;
  
  -- Calculate individual product discounts
  SELECT COALESCE(SUM(
    CASE 
      WHEN bi.discount_percentage > 0 
      THEN p.price - (p.price * bi.discount_percentage / 100)
      ELSE p.price
    END
  ), 0)
  INTO v_bundle_price
  FROM bundle_items bi
  JOIN products p ON bi.product_id = p.id
  WHERE bi.bundle_id = p_bundle_id;
  
  -- Apply bundle-wide discount
  IF v_discount_type = 'percentage' THEN
    v_bundle_price := v_bundle_price * (1 - v_discount_value::float / 100);
  ELSE
    v_bundle_price := GREATEST(0, v_bundle_price - v_discount_value);
  END IF;
  
  -- Calculate savings
  v_savings := v_regular_price - v_bundle_price;
  
  -- Calculate savings percentage
  IF v_regular_price > 0 THEN
    v_savings_percentage := (v_savings::float / v_regular_price::float * 100)::integer;
  ELSE
    v_savings_percentage := 0;
  END IF;
  
  -- Return the results
  regular_price := v_regular_price;
  bundle_price := v_bundle_price;
  savings := v_savings;
  savings_percentage := v_savings_percentage;
  
  RETURN NEXT;
END;
$$;

-- Create function to calculate upsell discount
CREATE OR REPLACE FUNCTION public.calculate_upsell_discount(p_upsell_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_original_price INTEGER;
  v_discounted_price INTEGER;
  v_discount_type TEXT;
  v_discount_value INTEGER;
BEGIN
  -- Get the upsell information
  SELECT u.discount_type, u.discount_value, p.price
  INTO v_discount_type, v_discount_value, v_original_price
  FROM upsells u
  JOIN products p ON u.offer_product_id = p.id
  WHERE u.id = p_upsell_id;
  
  -- Calculate the discounted price
  IF v_discount_type = 'percentage' THEN
    v_discounted_price := v_original_price * (1 - v_discount_value::float / 100);
  ELSE
    v_discounted_price := GREATEST(0, v_original_price - v_discount_value);
  END IF;
  
  RETURN v_discounted_price;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.calculate_bundle_price(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_upsell_discount(UUID) TO authenticated;