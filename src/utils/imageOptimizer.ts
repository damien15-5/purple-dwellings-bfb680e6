import imageCompression from 'browser-image-compression';

export interface ImageOptimizationOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
  useWebWorker?: boolean;
}

export const optimizeImage = async (
  file: File,
  options?: ImageOptimizationOptions
): Promise<File> => {
  const defaultOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1500,
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: options?.quality || 0.7,
  };

  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    
    // Convert to webp with proper naming
    const webpFileName = file.name.replace(/\.[^/.]+$/, '.webp');
    return new File([compressedFile], webpFileName, { type: 'image/webp' });
  } catch (error) {
    console.error('Image optimization failed:', error);
    return file; // Return original file if optimization fails
  }
};

export const optimizeImages = async (
  files: File[],
  options?: ImageOptimizationOptions
): Promise<File[]> => {
  return Promise.all(files.map(file => optimizeImage(file, options)));
};
