import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sanitize a filename to be safe for storage
 * @param filename The filename to sanitize
 * @returns A sanitized filename safe for storage
 */
export const sanitizeFilename = (filename: string): string => {
  // Replace all characters that aren't alphanumeric, underscore, hyphen, or period
  // This ensures we only keep safe characters for storage paths
  return filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
};

/**
 * Upload a file to Supabase Storage
 * @param file The file to upload
 * @param bucket The storage bucket to upload to
 * @param path Optional path within the bucket
 * @returns The public URL of the uploaded file
 */
export const uploadFile = async (
  file: File,
  bucket: 'product-files' | 'thumbnails' | 'course-media' | 'course-resources',
  path?: string
): Promise<{
  url: string;
  fileSize: number;
  fileType: string;
  filePath: string;
}> => {
  if (!file) {
    throw new Error('No file provided');
  }

  // Create a unique file path to avoid collisions
  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = path ? `${path}/${fileName}` : fileName;

  // Upload the file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: publicUrlData.publicUrl,
    fileSize: file.size,
    fileType: file.type,
    filePath: data.path
  };
};

/**
 * Remove a file from Supabase Storage
 * @param path The path of the file to remove
 * @param bucket The storage bucket the file is in
 */
export const removeFile = async (
  path: string,
  bucket: 'product-files' | 'thumbnails' | 'course-media' | 'course-resources'
): Promise<void> => {
  if (!path) return;

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('Error removing file:', error);
    throw new Error(`Failed to remove file: ${error.message}`);
  }
};

/**
 * Get a signed URL for a file that requires authentication
 * @param path The path of the file
 * @param bucket The storage bucket the file is in
 * @param expiresIn Expiry time in seconds, defaults to 1 hour
 * @returns The signed URL
 */
export const getSignedUrl = async (
  path: string,
  bucket: 'product-files' | 'thumbnails' | 'course-media' | 'course-resources',
  expiresIn = 3600
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Error creating signed URL:', error);
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
};

/**
 * Format file size in a human-readable format
 * @param bytes Size in bytes
 * @returns Human-readable formatted size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Extract the file name from a URL or path
 * @param urlOrPath The URL or path to extract from
 * @returns The file name
 */
export const getFileNameFromPath = (urlOrPath: string): string => {
  if (!urlOrPath) return '';
  
  // Handle both URLs and paths
  const parts = urlOrPath.split('/');
  const fileName = parts[parts.length - 1];
  
  // Remove query parameters if present
  return fileName.split('?')[0];
};

/**
 * Detect media type from file object
 * @param file The file to analyze
 * @returns The detected media type
 */
export const detectMediaType = (file: File): 'video' | 'audio' | 'pdf' | 'doc' | 'image' | 'other' => {
  const type = file.type.toLowerCase();
  
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type === 'application/pdf') return 'pdf';
  if (type.includes('image/')) return 'image';
  
  // Document types
  if (type.includes('word') || 
      type.includes('document') || 
      type.includes('msword') || 
      type.includes('officedocument') ||
      file.name.endsWith('.doc') || 
      file.name.endsWith('.docx') || 
      file.name.endsWith('.ppt') || 
      file.name.endsWith('.pptx')) {
    return 'doc';
  }
  
  return 'other';
};

/**
 * Get file duration (for video/audio)
 * @param file The media file
 * @returns Promise resolving to duration in seconds
 */
export const getMediaDuration = async (file: File): Promise<number> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      resolve(0);
      return;
    }
    
    const url = URL.createObjectURL(file);
    const media = file.type.startsWith('video/') ? document.createElement('video') : document.createElement('audio');
    
    media.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(media.duration));
    };
    
    media.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    
    media.src = url;
  });
};

/**
 * Generate thumbnail from video file
 * @param file The video file
 * @returns Promise resolving to thumbnail data URL
 */
export const generateVideoThumbnail = async (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('video/')) {
      resolve(null);
      return;
    }
    
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.onloadedmetadata = () => {
      // Seek to 25% of the video
      video.currentTime = video.duration * 0.25;
    };
    
    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    
    video.src = url;
  });
};