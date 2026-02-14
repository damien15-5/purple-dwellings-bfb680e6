import { Link } from 'react-router-dom';
import { Property } from '@/types/property';
import { MapPin, Heart, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, memo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface PropertyCardProps {
  property: Property;
  priority?: boolean;
}

export const PropertyCard = memo(({ property, priority = false }: PropertyCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkSaved = async () => {
      const localKey = `saved_${String(property.id)}`;
      if (localStorage.getItem(localKey)) {
        setIsFavorite(true);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('saved_properties')
          .select('id')
          .eq('user_id', user.id)
          .eq('property_id', String(property.id))
          .maybeSingle();
        
        if (data) setIsFavorite(true);
      }
    };
    checkSaved();
  }, [property.id]);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    const localKey = `saved_${String(property.id)}`;
    const { data: { user } } = await supabase.auth.getUser();

    if (isFavorite) {
      localStorage.removeItem(localKey);
      if (user) {
        await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', String(property.id));
      }
      setIsFavorite(false);
      toast({ description: 'Removed from saved properties' });
    } else {
      localStorage.setItem(localKey, 'true');
      if (user) {
        await supabase
          .from('saved_properties')
          .insert({ user_id: user.id, property_id: String(property.id) });
      }
      setIsFavorite(true);
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

  const imageUrl = Array.isArray(property.images) && property.images.length > 0 
    ? property.images[0] 
    : '/placeholder.svg';

  return (
    <div className="group cursor-pointer">
      <Link to={`/property/${property.id}`} className="block">
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
          <OptimizedImage
            src={imageUrl}
            alt={property.title}
            priority={priority}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            containerClassName="w-full h-full"
          />
          <button
            onClick={handleToggleSave}
            className="absolute top-2 right-2 p-1 sm:p-1.5 rounded-full bg-background/80 hover:bg-background hover:scale-110 transition-all z-10"
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-foreground'}`}
            />
          </button>
          {property.isVerified && (
            <div className="absolute top-2 left-2 z-10">
              <Badge className="bg-emerald-600/90 backdrop-blur-sm text-white border-0 shadow-sm font-medium text-xs px-2 py-0.5 gap-1">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </Badge>
            </div>
          )}
        </div>
        <div className="space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-xs sm:text-sm line-clamp-1">{property.title}</h3>
          </div>
          <div className="flex items-center text-[10px] sm:text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{property.location}</span>
          </div>
          <div className="flex items-baseline gap-1 pt-0.5">
            <span className="font-semibold text-xs sm:text-sm">{formatPrice(property.price)}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">total</span>
          </div>
        </div>
      </Link>
    </div>
  );
});

PropertyCard.displayName = 'PropertyCard';
