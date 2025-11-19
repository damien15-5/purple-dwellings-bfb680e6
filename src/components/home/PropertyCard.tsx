import { Link } from 'react-router-dom';
import { MapPin, Bed, Eye, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState, useRef, useEffect } from 'react';

type PropertyCardProps = {
  id: string;
  image: string;
  price: number;
  location: string;
  title: string;
  bedrooms?: number;
  type: string;
  status: string;
  views?: number;
  variant?: 'large' | 'medium' | 'small';
  featured?: boolean;
  onView?: () => void;
};

export const PropertyCard = ({
  id,
  image,
  price,
  location,
  title,
  bedrooms,
  type,
  status,
  views,
  variant = 'medium',
  featured = false,
  onView
}: PropertyCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const sizes = {
    large: {
      card: 'w-[280px]',
      container: 'aspect-[4/3]',
      title: 'text-sm',
      price: 'text-base'
    },
    medium: {
      card: 'w-[260px]',
      container: 'aspect-[4/3]',
      title: 'text-sm',
      price: 'text-base'
    },
    small: {
      card: 'w-full',
      container: 'aspect-[4/3]',
      title: 'text-sm',
      price: 'text-base'
    }
  };

  const handleCardClick = () => {
    if (onView) onView();
  };

  return (
    <Card
      ref={cardRef}
      className={`${sizes[variant].card} ${variant === 'small' ? '' : 'flex-shrink-0'} overflow-hidden cursor-pointer group relative border-0 shadow-none bg-transparent`}
      onClick={handleCardClick}
    >
      <div className={`relative ${sizes[variant].container} overflow-hidden bg-muted rounded-xl mb-3`}>
        {isIntersecting && (
          <img
            src={image}
            alt={title}
            loading="lazy"
            className={`w-full h-full object-cover transition-all duration-300 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            } group-hover:scale-105`}
            onLoad={() => setImageLoaded(true)}
          />
        )}
        
        {!imageLoaded && isIntersecting && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/10 to-muted" />
        )}

        {featured && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-foreground border-0 shadow-sm font-medium">
              Guest favorite
            </Badge>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsSaved(!isSaved);
          }}
          className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full transition-all hover:scale-110 shadow-sm z-10"
        >
          <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
        </button>

        {views && (
          <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{views} views</span>
          </div>
        )}

      </div>

      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`${sizes[variant].title} font-semibold text-foreground line-clamp-1`}>
            {title}
          </h3>
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </div>

        <div className="flex items-baseline gap-1 pt-1">
          <span className={`${sizes[variant].price} font-semibold text-foreground`}>
            {formatPrice(price)}
          </span>
          <span className="text-sm text-muted-foreground">total</span>
        </div>
      </div>
    </Card>
  );
};