import { Link } from 'react-router-dom';
import { Property } from '@/types/property';
import { MapPin, Heart } from 'lucide-react';
import { useState } from 'react';

interface PropertyCardProps {
  property: Property;
}

export const PropertyCard = ({ property }: PropertyCardProps) => {
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
        <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
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
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white transition-colors z-10"
          >
            <Heart
              className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700'}`}
            />
          </button>
        </div>
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base line-clamp-1">{property.title}</h3>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{property.location}</span>
          </div>
          <div className="flex items-baseline gap-1 pt-1">
            <span className="font-semibold text-base">{formatPrice(property.price)}</span>
            <span className="text-sm text-muted-foreground">total</span>
          </div>
        </div>
      </Link>
    </div>
  );
};