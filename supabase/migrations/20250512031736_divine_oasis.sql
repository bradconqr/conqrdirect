-- Create storage buckets for product files and thumbnails
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES
  ('thumbnails', 'thumbnails', true, false, 10485760, '{image/png,image/jpeg,image/gif,image/webp,image/svg+xml}'),
  ('product-files', 'product-files', false, false, 1073741824, NULL)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create policies for the thumbnails bucket (public read, creator write)
CREATE POLICY "Public Access for Thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Creator Can Upload Thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Creator Can Update Their Thumbnails"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Creator Can Delete Their Thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'thumbnails');

-- Create policies for the product-files bucket (protected, authenticated access only)
CREATE POLICY "Creator Can Upload Product Files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-files');

CREATE POLICY "Creator Can Update Their Product Files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-files');

CREATE POLICY "Creator Can Delete Their Product Files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-files');

-- Special policy for product-files that allows buyers to access files they've purchased
CREATE POLICY "Buyers Can Access Purchased Product Files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'product-files' AND
    EXISTS (
      SELECT 1 FROM public.purchases p
      JOIN public.products prod ON p.product_id = prod.id
      WHERE
        p.customer_id = auth.uid() AND
        p.status = 'completed' AND
        prod.file_url LIKE '%' || storage.filename(name) || '%'
    )
  );

-- Create function to get signed URLs for purchased files
CREATE OR REPLACE FUNCTION public.get_download_url(product_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_file_url TEXT;
  v_file_path TEXT;
  v_signed_url TEXT;
  v_has_access BOOLEAN;
BEGIN
  -- Check if the user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Check if the user has purchased the product
  SELECT EXISTS (
    SELECT 1 FROM purchases
    WHERE customer_id = auth.uid()
      AND product_id = get_download_url.product_id
      AND status = 'completed'
  ) INTO v_has_access;
  
  IF NOT v_has_access THEN
    RETURN NULL;
  END IF;
  
  -- Get the file URL from the product
  SELECT file_url INTO v_file_url
  FROM products
  WHERE id = get_download_url.product_id;
  
  IF v_file_url IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Extract the file path from the URL
  -- This depends on how your URLs are structured, adjust as needed
  v_file_path := replace(v_file_url, storage.urlfor('product-files', ''), '');
  v_file_path := split_part(v_file_path, '?', 1);
  
  -- Generate the signed URL (valid for 1 hour)
  SELECT url INTO v_signed_url
  FROM storage.create_signed_url('product-files', v_file_path, 3600);
  
  RETURN v_signed_url;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_download_url(UUID) TO authenticated;

-- Create function to check if a user has access to a product
CREATE OR REPLACE FUNCTION public.has_product_access(product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_access BOOLEAN;
BEGIN
  -- Check if the user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the user has purchased the product
  SELECT EXISTS (
    SELECT 1 FROM purchases
    WHERE customer_id = auth.uid()
      AND product_id = has_product_access.product_id
      AND status = 'completed'
  ) INTO v_has_access;
  
  -- Also check if the user is the creator of the product
  IF NOT v_has_access THEN
    SELECT EXISTS (
      SELECT 1 FROM products p
      JOIN creators c ON p.creator_id = c.id
      WHERE p.id = has_product_access.product_id
        AND c.user_id = auth.uid()
    ) INTO v_has_access;
  END IF;
  
  RETURN v_has_access;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.has_product_access(UUID) TO authenticated;