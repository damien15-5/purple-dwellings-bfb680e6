import { Link } from 'react-router-dom';
import { Property } from '@/types/property';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bed, Bath, Square, MapPin } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
}

export const PropertyCard = ({ property }: PropertyCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link to={`/property/${property.id}`}>
      <Card className="overflow-hidden hover-lift card-glow cursor-pointer group">
        <div className="relative h-64 overflow-hidden">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
            {property.propertyType}
          </Badge>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg text-foreground line-clamp-1">
              {property.title}
            </h3>
          </div>
          <div className="flex items-center text-muted-foreground text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            {property.location}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {property.bedrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                <span>{property.bedrooms} Beds</span>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                <span>{property.bathrooms} Baths</span>
              </div>
            )}
            {property.sqft && (
              <div className="flex items-center gap-1">
                <Square className="w-4 h-4" />
                <span>{property.sqft} sqft</span>
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-border">
            <p className="text-2xl font-bold text-primary">{formatPrice(property.price)}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
};
