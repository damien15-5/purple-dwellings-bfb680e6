import { Link } from 'react-router-dom';
import { Property } from '@/types/property';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bed, Bath, Square, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

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
      <Card className="overflow-hidden bg-white border-2 border-[#D8C4F0] hover:shadow-xl cursor-pointer group transition-all duration-300 hover:-translate-y-1">
        <div className="relative h-64 overflow-hidden">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <Badge className="bg-[#9B6FD1] text-white border-0">
              {property.propertyType}
            </Badge>
            {property.isVerified !== undefined && (
              <Badge className={property.isVerified ? "bg-green-500 text-white border-0" : "bg-yellow-500 text-white border-0"}>
                {property.isVerified ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Not Verified
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>
        <div className="p-6 space-y-3 bg-white">
          <div className="flex items-start justify-between">
            <h3 className="font-bold text-lg text-foreground line-clamp-1">
              {property.title}
            </h3>
          </div>
          <div className="flex items-center text-muted-foreground text-sm">
            <MapPin className="w-4 h-4 mr-1 text-[#9B6FD1]" />
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
          <div className="pt-3 border-t border-[#D8C4F0]">
            <p className="text-2xl font-bold text-black">{formatPrice(property.price)}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
};