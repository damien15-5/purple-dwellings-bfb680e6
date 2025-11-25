import { useState, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  onLoad?: () => void;
}

// Singleton to track preloaded images
const preloadedImages = new Set<string>();

// Preload an image
const preloadImage = (src: string): Promise<void> => {
  if (preloadedImages.has(src)) return Promise.resolve();
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      preloadedImages.add(src);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
};

export const OptimizedImage = memo(({
  src,
  alt,
  className,
  containerClassName,
  priority = false,
  onLoad,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(preloadedImages.has(src));
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading with larger margin for early loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          // Start preloading immediately
          if (src) preloadImage(src);
          observer.disconnect();
        }
      },
      { 
        rootMargin: '200px', // Start loading 200px before visible
        threshold: 0 
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, src, isInView]);

  // Preload priority images immediately
  useEffect(() => {
    if (priority && src && !preloadedImages.has(src)) {
      preloadImage(src);
    }
  }, [priority, src]);

  const handleLoad = () => {
    setIsLoaded(true);
    preloadedImages.add(src);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden bg-muted', containerClassName)}>
      {/* Skeleton placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
      )}
      
      {/* Actual image */}
      {(isInView || priority) && !hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
          Failed to load
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// Hook to preload images in advance
export const useImagePreloader = (urls: string[]) => {
  useEffect(() => {
    urls.forEach(url => {
      if (url && !preloadedImages.has(url)) {
        preloadImage(url);
      }
    });
  }, [urls]);
};
