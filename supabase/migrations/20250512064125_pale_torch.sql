/*
  # Add AMA (Ask Me Anything) product type
  
  1. Changes
     - Update the products table's type CHECK constraint to include 'ama'
     - Add new fields specifically for AMA products:
         - response_time (integer) - hours to respond
         - max_question_length (integer) - character limit
         - topic_categories (text[]) - topics the creator will answer
         - allow_attachments (boolean) - whether attachments are allowed
         - attachment_types (text[]) - allowed attachment types
         - anonymous_allowed (boolean) - whether anonymous questions are allowed
*/

-- First update the type check constraint to allow 'ama' type
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;
ALTER TABLE products ADD CONSTRAINT products_type_check 
  CHECK (type IN ('download', 'course', 'membership', 'webinar', '1on1call', 'external_link', 'lead_magnet', 'ama'));

-- Add new columns for AMA products
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS response_time INTEGER,
  ADD COLUMN IF NOT EXISTS max_question_length INTEGER,
  ADD COLUMN IF NOT EXISTS topic_categories TEXT[],
  ADD COLUMN IF NOT EXISTS allow_attachments BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS attachment_types TEXT[],
  ADD COLUMN IF NOT EXISTS anonymous_allowed BOOLEAN DEFAULT FALSE;

-- Create table for AMA questions
CREATE TABLE IF NOT EXISTS public.ama_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_attachment_url TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'rejected')),
  response TEXT,
  response_attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  answered_at TIMESTAMPTZ
);

-- Enable Row Level Security on the ama_questions table
ALTER TABLE public.ama_questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ama_questions
CREATE POLICY "Creators can view questions for their products"
  ON public.ama_questions FOR SELECT
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Customers can view their own questions"
  ON public.ama_questions FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can create questions"
  ON public.ama_questions FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Creators can update question responses"
  ON public.ama_questions FOR UPDATE
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ))
  WITH CHECK (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

-- Function to submit a new AMA question
CREATE OR REPLACE FUNCTION public.submit_ama_question(
  p_product_id UUID,
  p_question TEXT,
  p_attachment_url TEXT DEFAULT NULL,
  p_is_anonymous BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_creator_id UUID;
  v_product products%ROWTYPE;
  v_question_id UUID;
  v_allow_attachments BOOLEAN;
  v_anonymous_allowed BOOLEAN;
  v_max_length INTEGER;
BEGIN
  -- Check if the user is authenticated
  v_customer_id := auth.uid();
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get product details
  SELECT * INTO v_product
  FROM products
  WHERE id = p_product_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  
  -- Check if this is an AMA product
  IF v_product.type != 'ama' THEN
    RAISE EXCEPTION 'This is not an AMA product';
  END IF;
  
  v_creator_id := v_product.creator_id;
  v_allow_attachments := COALESCE(v_product.allow_attachments, FALSE);
  v_anonymous_allowed := COALESCE(v_product.anonymous_allowed, FALSE);
  v_max_length := v_product.max_question_length;
  
  -- Validate question
  IF v_max_length IS NOT NULL AND LENGTH(p_question) > v_max_length THEN
    RAISE EXCEPTION 'Question exceeds maximum allowed length';
  END IF;
  
  -- Check if attachments are allowed
  IF p_attachment_url IS NOT NULL AND NOT v_allow_attachments THEN
    RAISE EXCEPTION 'Attachments are not allowed for this AMA';
  END IF;
  
  -- Check if anonymous is allowed
  IF p_is_anonymous AND NOT v_anonymous_allowed THEN
    RAISE EXCEPTION 'Anonymous questions are not allowed for this AMA';
  END IF;
  
  -- Create the question
  INSERT INTO ama_questions (
    product_id,
    customer_id,
    creator_id,
    question,
    question_attachment_url,
    is_anonymous,
    created_at,
    updated_at
  )
  VALUES (
    p_product_id,
    v_customer_id,
    v_creator_id,
    p_question,
    p_attachment_url,
    p_is_anonymous,
    now(),
    now()
  )
  RETURNING id INTO v_question_id;
  
  RETURN v_question_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.submit_ama_question(UUID, TEXT, TEXT, BOOLEAN) TO authenticated;

-- Function to answer an AMA question
CREATE OR REPLACE FUNCTION public.answer_ama_question(
  p_question_id UUID,
  p_response TEXT,
  p_attachment_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_creator_id UUID;
  v_creator_user_id UUID;
BEGIN
  -- Check if the user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get the question's creator ID
  SELECT creator_id INTO v_creator_id
  FROM ama_questions
  WHERE id = p_question_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the authenticated user is the creator
  SELECT user_id INTO v_creator_user_id
  FROM creators
  WHERE id = v_creator_id;
  
  IF v_creator_user_id != auth.uid() THEN
    RETURN FALSE;
  END IF;
  
  -- Update the question with the response
  UPDATE ama_questions
  SET 
    response = p_response,
    response_attachment_url = p_attachment_url,
    status = 'answered',
    answered_at = now(),
    updated_at = now()
  WHERE id = p_question_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.answer_ama_question(UUID, TEXT, TEXT) TO authenticated;