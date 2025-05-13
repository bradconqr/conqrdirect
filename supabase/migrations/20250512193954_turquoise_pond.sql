/*
  # Increase video file size limit for thumbnails bucket
  
  1. Changes
     - Update the file_size_limit for the thumbnails bucket to 5GB (5368709120 bytes)
     - This allows for larger video files to be uploaded as header videos
     
  2. Security
     - No changes to existing policies
*/

-- Update the thumbnails bucket to increase file size limit to 5GB
UPDATE storage.buckets
SET file_size_limit = 5368709120  -- 5GB in bytes
WHERE id = 'thumbnails';

-- Update the allowed MIME types to ensure video types are included
UPDATE storage.buckets
SET allowed_mime_types = '{image/png,image/jpeg,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,video/ogg}'
WHERE id = 'thumbnails';