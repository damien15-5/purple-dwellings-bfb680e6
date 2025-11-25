import imageCompression from 'browser-image-compression';

export interface ImageOptimizationOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
}

// Aggressive compression for web - targets ~10-50KB per image
export const optimizeImageForWeb = async (
  file: File,
  options?: ImageOptimizationOptions
): Promise<File> => {
  // Skip if already optimized WebP and small
  if (file.type === 'image/webp' && file.size < 100 * 1024) {
    return file;
  }

  const compressionOptions = {
    maxSizeMB: options?.maxSizeMB || 0.1, // Target 100KB max
    maxWidthOrHeight: options?.maxWidthOrHeight || 1200,
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: options?.quality || 0.6,
    alwaysKeepResolution: false,
  };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    
    // Convert to webp with proper naming
    const webpFileName = file.name.replace(/\.[^/.]+$/, '.webp');
    const result = new File([compressedFile], webpFileName, { type: 'image/webp' });
    
    console.log(`Image optimized: ${(file.size / 1024).toFixed(1)}KB → ${(result.size / 1024).toFixed(1)}KB`);
    return result;
  } catch (error) {
    console.error('Image optimization failed:', error);
    return file;
  }
};

// Batch optimize multiple images
export const optimizeImagesForWeb = async (
  files: File[],
  options?: ImageOptimizationOptions
): Promise<File[]> => {
  const results = await Promise.all(
    files.map(file => {
      if (file.type.startsWith('video/')) {
        return Promise.resolve(file); // Skip videos, handle separately
      }
      return optimizeImageForWeb(file, options);
    })
  );
  return results;
};

// Create thumbnail for instant preview (very small)
export const createThumbnail = async (file: File): Promise<string> => {
  const options = {
    maxSizeMB: 0.01, // 10KB max
    maxWidthOrHeight: 100,
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: 0.3,
  };

  try {
    const thumbnail = await imageCompression(file, options);
    return URL.createObjectURL(thumbnail);
  } catch {
    return URL.createObjectURL(file);
  }
};

// Preload an image into browser cache
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Preload multiple images
export const preloadImages = async (srcs: string[]): Promise<void> => {
  await Promise.all(srcs.map(src => preloadImage(src).catch(() => {})));
};

// Get optimized image URL with size parameter (if using Supabase transform)
export const getOptimizedImageUrl = (url: string, width?: number, quality?: number): string => {
  if (!url) return '';
  
  // If it's a Supabase storage URL, we can add transformation params
  if (url.includes('supabase.co/storage')) {
    const params = new URLSearchParams();
    if (width) params.set('width', width.toString());
    if (quality) params.set('quality', quality.toString());
    
    const separator = url.includes('?') ? '&' : '?';
    return params.toString() ? `${url}${separator}${params.toString()}` : url;
  }
  
  return url;
};
