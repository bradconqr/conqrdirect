/*
  # Add media support to community posts

  1. Changes
    - Add media_url and media_type columns to community_posts table
    - Create a storage bucket for community media files
    - Add storage policies to allow creators to upload and manage media
    
  2. Security
    - Enable public access to view media
    - Restrict upload and delete operations to authenticated users
*/

-- Add media columns to community posts table
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT;

-- Create a bucket for community media files
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES
  ('community-media', 'community-media', true, false, 104857600, '{image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm,video/ogg}')
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create policies for community-media bucket
-- For public read access
CREATE POLICY "Public Access for Community Media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'community-media');

-- For upload permissions
CREATE POLICY "Creators Can Upload Community Media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'community-media');

-- For update permissions
CREATE POLICY "Creators Can Update Their Community Media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'community-media');

-- For delete permissions
CREATE POLICY "Creators Can Delete Their Community Media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'community-media');