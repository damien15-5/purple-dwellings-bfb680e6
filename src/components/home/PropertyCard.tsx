import { Link } from 'react-router-dom';
import { MapPin, Bed, Eye, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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

  useEffect(() => {
    const checkSaved = async () => {
      const localKey = `saved_${id}`;
      if (localStorage.getItem(localKey)) {
        setIsSaved(true);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('saved_properties')
          .select('id')
          .eq('user_id', user.id)
          .eq('property_id', id)
          .maybeSingle();
        
        if (data) setIsSaved(true);
      }
    };
    checkSaved();
  }, [id]);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const localKey = `saved_${id}`;
    const { data: { user } } = await supabase.auth.getUser();

    if (isSaved) {
      localStorage.removeItem(localKey);
      if (user) {
        await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', id);
      }
      setIsSaved(false);
      toast({ description: 'Removed from saved properties' });
    } else {
      localStorage.setItem(localKey, 'true');
      if (user) {
        await supabase
          .from('saved_properties')
          .insert({ user_id: user.id, property_id: id });
      }
      setIsSaved(true);
      toast({ description: 'Added to saved properties' });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const sizes = {
    large: {
      card: 'w-[220px]',
      container: 'aspect-[4/3]',
      title: 'text-sm',
      price: 'text-sm'
    },
    medium: {
      card: 'w-[200px]',
      container: 'aspect-[4/3]',
      title: 'text-sm',
      price: 'text-sm'
    },
    small: {
      card: 'w-full',
      container: 'aspect-[4/3]',
      title: 'text-xs',
      price: 'text-sm'
    }
  };

  const handleCardClick = async () => {
    // Track view in database
    try {
      const { data: property } = await supabase
        .from('properties')
        .select('views, clicks')
        .eq('id', id)
        .single();
      
      if (property) {
        await supabase
          .from('properties')
          .update({ 
            views: (property.views || 0) + 1,
            clicks: (property.clicks || 0) + 1
          })
          .eq('id', id);
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
    
    if (onView) onView();
  };

  return (
    <Link to={`/property/${id}`} onClick={handleCardClick}>
      <Card
        ref={cardRef}
        className={`${sizes[variant].card} ${variant === 'small' ? '' : 'flex-shrink-0'} overflow-hidden cursor-pointer group relative border-0 shadow-none bg-transparent`}
      >
      <div className={`relative ${sizes[variant].container} overflow-hidden bg-muted rounded-xl mb-2`}>
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
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-foreground border-0 shadow-sm font-medium text-xs px-2 py-0.5">
              Guest favorite
            </Badge>
          </div>
        )}

        <button
          onClick={handleToggleSave}
          className="absolute top-2 right-2 bg-white/90 hover:bg-white p-1.5 rounded-full transition-all hover:scale-110 shadow-sm z-10"
        >
          <Heart className={`h-3.5 w-3.5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
        </button>

        {views && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{views} views</span>
          </div>
        )}

      </div>

      <div className="space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`${sizes[variant].title} font-semibold text-foreground line-clamp-1`}>
            {title}
          </h3>
        </div>

        <div className="flex items-center text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </div>

        <div className="flex items-baseline gap-1 pt-0.5">
          <span className={`${sizes[variant].price} font-semibold text-foreground`}>
            {formatPrice(price)}
          </span>
          <span className="text-xs text-muted-foreground">total</span>
        </div>
      </div>
    </Card>
    </Link>
  );
};