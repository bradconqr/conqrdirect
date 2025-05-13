/*
  # Discounts table and policies

  1. New Tables
    - `discounts` - Stores discount codes for creator products
      - `id` (uuid, primary key)
      - `creator_id` (uuid, references creators)
      - `code` (text)
      - `product_id` (uuid, references products, optional)
      - `type` (text, either 'percentage' or 'fixed')
      - `value` (integer)
      - `start_date` (timestamptz, optional)
      - `end_date` (timestamptz, optional)
      - `max_uses` (integer, optional)
      - `current_uses` (integer, default 0)
      - `created_at` (timestamptz, default now())
      
  2. Constraints
    - Unique constraint on (creator_id, code)
    - Check constraint on type
    
  3. Security
    - Enable RLS on discounts table
    - Policies for creators to manage their discounts
    - Policy for public to view discounts
    
  4. Functions
    - Function to increment discount usage
*/

-- Create discounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value INTEGER NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Each creator can only have one discount with the same code
  UNIQUE(creator_id, code)
);

-- Enable Row Level Security
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- Add policies with checks to prevent errors
DO $$
BEGIN
    -- Check if the INSERT policy exists before creating it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'discounts' AND policyname = 'Creators can create discounts'
    ) THEN
        -- Creators can create discounts for their store
        CREATE POLICY "Creators can create discounts"
          ON public.discounts FOR INSERT
          TO public
          WITH CHECK (creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
          ));
    END IF;

    -- Check if the UPDATE policy exists before creating it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'discounts' AND policyname = 'Creators can update their discounts'
    ) THEN
        -- Creators can update their own discounts
        CREATE POLICY "Creators can update their discounts"
          ON public.discounts FOR UPDATE
          TO public
          USING (creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
          ))
          WITH CHECK (creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
          ));
    END IF;

    -- Check if the DELETE policy exists before creating it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'discounts' AND policyname = 'Creators can delete their discounts'
    ) THEN
        -- Creators can delete their discounts
        CREATE POLICY "Creators can delete their discounts"
          ON public.discounts FOR DELETE
          TO public
          USING (creator_id IN (
            SELECT id FROM creators WHERE user_id = auth.uid()
          ));
    END IF;

    -- Check if the SELECT policy exists before creating it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'discounts' AND policyname = 'Discounts are viewable by anyone'
    ) THEN
        -- Anyone can view discount codes (for validation during checkout)
        CREATE POLICY "Discounts are viewable by anyone"
          ON public.discounts FOR SELECT
          TO public
          USING (true);
    END IF;
END $$;

-- Create function to increment the usage count of a discount
CREATE OR REPLACE FUNCTION public.increment_discount_usage(discount_code TEXT, creator_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  discount_record public.discounts%ROWTYPE;
  can_use BOOLEAN := false;
BEGIN
  -- Get the discount record
  SELECT * INTO discount_record
  FROM public.discounts
  WHERE code = discount_code AND creator_id = creator_id_param;
  
  -- Check if discount exists and can be used
  IF FOUND THEN
    -- Check usage limits
    IF discount_record.max_uses IS NULL OR discount_record.current_uses < discount_record.max_uses THEN
      -- Check date validity
      IF (discount_record.start_date IS NULL OR discount_record.start_date <= CURRENT_TIMESTAMP) AND
         (discount_record.end_date IS NULL OR discount_record.end_date >= CURRENT_TIMESTAMP) THEN
        
        -- Update usage count
        UPDATE public.discounts
        SET current_uses = current_uses + 1
        WHERE id = discount_record.id;
        
        can_use := true;
      END IF;
    END IF;
  END IF;
  
  RETURN can_use;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;