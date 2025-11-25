import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface GCSUploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
}

/**
 * Upload a file to Google Cloud Storage via edge function
 */
export async function uploadToGCS(
  file: File | Blob,
  folder: string = 'uploads',
  fileName?: string
): Promise<GCSUploadResult> {
  try {
    const formData = new FormData();
    
    // If it's a Blob without a name, create a File with a name
    if (file instanceof Blob && !(file instanceof File)) {
      const ext = file.type.split('/')[1] || 'bin';
      const name = fileName || `file-${Date.now()}.${ext}`;
      file = new File([file], name, { type: file.type });
    }
    
    formData.append('file', file);
    formData.append('folder', folder);
    
    console.log(`Uploading to GCS: ${(file as File).name}, size: ${file.size}`);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/gcs-upload`, {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('GCS upload error:', result.error);
      return { success: false, error: result.error };
    }
    
    console.log('GCS upload successful:', result.url);
    return {
      success: true,
      url: result.url,
      fileName: result.fileName,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('GCS upload exception:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Upload multiple files to GCS in parallel
 */
export async function uploadMultipleToGCS(
  files: (File | Blob)[],
  folder: string = 'uploads'
): Promise<GCSUploadResult[]> {
  const uploads = files.map(file => uploadToGCS(file, folder));
  return Promise.all(uploads);
}

/**
 * Check if GCS is configured (for fallback to Supabase storage)
 */
export async function isGCSConfigured(): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/gcs-upload`, {
      method: 'OPTIONS',
    });
    return response.ok;
  } catch {
    return false;
  }
}
