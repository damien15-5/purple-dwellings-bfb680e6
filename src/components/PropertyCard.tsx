import { Link } from 'react-router-dom';
import { Property } from '@/types/property';
import { MapPin, Heart } from 'lucide-react';
import { useState, memo } from 'react';

interface PropertyCardProps {
  property: Property;
}

export const PropertyCard = memo(({ property }: PropertyCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);

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
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsFavorite(!isFavorite);
            }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background hover:scale-110 transition-all z-10"
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-foreground'}`}
            />
          </button>
        </div>
        <div className="space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm line-clamp-1">{property.title}</h3>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{property.location}</span>
          </div>
          <div className="flex items-baseline gap-1 pt-0.5">
            <span className="font-semibold text-sm">{formatPrice(property.price)}</span>
            <span className="text-xs text-muted-foreground">total</span>
          </div>
        </div>
      </Link>
    </div>
  );
});