import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, Heart, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface PropertyListViewProps {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image: string;
  isVerified?: boolean;
  propertyType: string;
}

export const PropertyListView = ({
  id,
  title,
  description,
  price,
  location,
  bedrooms,
  bathrooms,
  area,
  image,
  isVerified,
  propertyType
}: PropertyListViewProps) => {
  const [isSaved, setIsSaved] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-border hover:shadow-md transition-all group">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="md:w-1/4 h-32 md:h-28 relative flex-shrink-0">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsSaved(!isSaved);
            }}
            className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-white p-1 rounded-full transition-all"
          >
            <Heart className={`h-3.5 w-3.5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
          {isVerified && (
            <Badge className="absolute top-1.5 left-1.5 bg-emerald-600/90 backdrop-blur-sm text-white border-0 text-xs py-0.5 px-1.5 gap-1">
              <ShieldCheck className="h-3 w-3" />
              Verified Seller
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="md:w-3/4 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                  {title}
                </h3>
                <div className="flex items-center text-muted-foreground text-xs mt-0.5">
                  <MapPin className="w-3 h-3 mr-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{location}</span>
                </div>
              </div>
              <Badge variant="secondary" className="ml-2 text-xs py-0 px-2 flex-shrink-0">{propertyType}</Badge>
            </div>

            <p className="text-muted-foreground text-xs mb-2 line-clamp-1">
              {description}
            </p>

            <div className="flex items-center gap-3">
              {bedrooms > 0 && (
                <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Bed className="w-3 h-3" />
                  <span>{bedrooms}</span>
                </div>
              )}
              {bathrooms > 0 && (
                <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Bath className="w-3 h-3" />
                  <span>{bathrooms}</span>
                </div>
              )}
              {area > 0 && (
                <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Square className="w-3 h-3" />
                  <span>{area} sqft</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-base font-bold text-foreground">
                {formatPrice(price)}
              </p>
            </div>
            <Link to={`/property/${id}`}>
              <Button variant="default" size="sm" className="text-xs h-7 px-3">View</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
