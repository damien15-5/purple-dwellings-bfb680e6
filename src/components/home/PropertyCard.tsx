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
      card: 'w-[240px]',
      image: 'h-[240px]',
      title: 'text-base',
      price: 'text-lg'
    },
    medium: {
      card: 'w-[220px]',
      image: 'h-[220px]',
      title: 'text-sm',
      price: 'text-base'
    },
    small: {
      card: 'w-full',
      image: 'h-[200px]',
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
      className={`${sizes[variant].card} ${variant === 'small' ? '' : 'flex-shrink-0'} overflow-hidden hover-scale cursor-pointer group relative`}
      onClick={handleCardClick}
    >
      <div className={`relative ${sizes[variant].image} overflow-hidden bg-muted rounded-3xl`}>
        {isIntersecting && (
          <img
            src={image}
            alt={title}
            loading="lazy"
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            } group-hover:scale-110`}
            onLoad={() => setImageLoaded(true)}
          />
        )}
        
        {!imageLoaded && isIntersecting && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/10 to-muted" />
        )}

        <div className="absolute top-3 right-3 flex gap-2">
          {featured && (
            <Badge className="bg-background/70 backdrop-blur-sm text-foreground border border-border/60 shadow-sm">Featured</Badge>
          )}
          <Badge className="bg-background/70 backdrop-blur-sm text-foreground border border-border/60 shadow-sm">{status}</Badge>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsSaved(!isSaved);
          }}
          className="absolute top-3 left-3 bg-white/90 hover:bg-white p-2 rounded-full transition-all hover:scale-110"
        >
          <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>

        {views && (
          <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{views} views</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent h-24 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="text-xs">{type}</Badge>
          {bedrooms && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Bed className="h-3 w-3" />
              <span>{bedrooms} Beds</span>
            </div>
          )}
        </div>

        <h3 className={`${sizes[variant].title} font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors`}>
          {title}
        </h3>

        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm line-clamp-1">{location}</span>
        </div>

        <div className="flex items-center justify-between">
          <p className={`${sizes[variant].price} font-bold text-primary`}>
            {formatPrice(price)}
          </p>
          <Link to={`/property/${id}`} onClick={(e) => e.stopPropagation()}>
            <Button 
              size="sm"
              variant="outline"
              className="gap-2 group-hover:shadow-lg transition-shadow bg-background/80 text-foreground border-border"
            >
              View Property
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};