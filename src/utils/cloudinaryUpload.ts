const CLOUD_NAME = 'dp21kb6dy';
const UPLOAD_PRESET = 'xavorian_uploads';

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
}

/**
 * Upload a file to Cloudinary using unsigned upload preset
 */
export async function uploadToCloudinary(
  file: File | Blob,
  folder: string = 'uploads',
  fileName?: string
): Promise<CloudinaryUploadResult> {
  try {
    if (file instanceof Blob && !(file instanceof File)) {
      const ext = file.type.split('/')[1] || 'bin';
      const name = fileName || `file-${Date.now()}.${ext}`;
      file = new File([file], name, { type: file.type });
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);

    const isVideo = file.type.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      { method: 'POST', body: formData }
    );

    const result = await response.json();

    if (!response.ok || result.error) {
      const errMsg = result.error?.message || 'Upload failed';
      console.error('Cloudinary upload error:', errMsg);
      return { success: false, error: errMsg };
    }

    return {
      success: true,
      url: result.secure_url,
      fileName: result.public_id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cloudinary upload exception:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Upload multiple files to Cloudinary in parallel
 */
export async function uploadMultipleToCloudinary(
  files: (File | Blob)[],
  folder: string = 'uploads'
): Promise<CloudinaryUploadResult[]> {
  return Promise.all(files.map(file => uploadToCloudinary(file, folder)));
}
