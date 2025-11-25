// Video optimization utilities
// Note: Full video transcoding in browser is resource-intensive
// This provides basic video compression and format handling

export interface VideoOptimizationOptions {
  maxSizeMB?: number;
  targetResolution?: '720p' | '1080p';
  targetFormat?: 'mp4';
}

// Check if video needs optimization
export const needsOptimization = (file: File): boolean => {
  const maxSize = 50 * 1024 * 1024; // 50MB threshold
  const isMP4 = file.type === 'video/mp4';
  return file.size > maxSize || !isMP4;
};

// Get video metadata
export const getVideoMetadata = (file: File): Promise<{
  duration: number;
  width: number;
  height: number;
}> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

// Create video thumbnail from first frame
export const createVideoThumbnail = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadeddata = () => {
      video.currentTime = 1; // Seek to 1 second for better thumbnail
    };
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/webp', 0.5);
        URL.revokeObjectURL(video.src);
        resolve(thumbnail);
      } else {
        reject(new Error('Failed to create canvas context'));
      }
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

// Validate video file
export const validateVideo = async (file: File): Promise<{
  valid: boolean;
  message?: string;
  metadata?: { duration: number; width: number; height: number };
}> => {
  const maxSize = 100 * 1024 * 1024; // 100MB max
  const maxDuration = 120; // 2 minutes max
  
  if (file.size > maxSize) {
    return { valid: false, message: 'Video must be under 100MB' };
  }
  
  const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, message: 'Please upload MP4, WebM, MOV, or AVI format' };
  }
  
  try {
    const metadata = await getVideoMetadata(file);
    
    if (metadata.duration > maxDuration) {
      return { valid: false, message: 'Video must be under 2 minutes' };
    }
    
    return { valid: true, metadata };
  } catch {
    return { valid: false, message: 'Could not read video file' };
  }
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
