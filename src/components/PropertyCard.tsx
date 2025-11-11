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
    <Link to={`/property/${property.id}`} className="block">
      <Card className="overflow-hidden bg-card hover:shadow-xl cursor-pointer group transition-all duration-300 hover:-translate-y-1 h-full border border-border">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          {property.isVerified !== undefined && (
            <Badge className={`absolute top-2 right-2 ${property.isVerified ? "bg-green-500" : "bg-yellow-500"} text-white border-0 text-xs`}>
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
        <div className="p-3 space-y-1">
          <h3 className="font-semibold text-sm text-foreground line-clamp-1">
            {property.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {property.location}
          </p>
          <p className="text-base font-bold text-foreground pt-1">
            {formatPrice(property.price)}
          </p>
        </div>
      </Card>
    </Link>
  );
};