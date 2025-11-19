import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, Heart } from 'lucide-react';
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
    <div className="bg-white rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all group">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="md:w-1/3 h-64 md:h-auto relative">
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
            className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full transition-all"
          >
            <Heart className={`h-5 w-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
          {isVerified && (
            <Badge className="absolute top-3 left-3 bg-primary">Verified</Badge>
          )}
        </div>

        {/* Content */}
        <div className="md:w-2/3 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-1 line-clamp-1">
                  {title}
                </h3>
                <div className="flex items-center text-muted-foreground text-sm mb-3">
                  <MapPin className="w-4 h-4 mr-1" />
                  {location}
                </div>
              </div>
              <Badge variant="secondary">{propertyType}</Badge>
            </div>

            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {description}
            </p>

            <div className="flex items-center gap-4 mb-4">
              {bedrooms > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Bed className="w-4 h-4" />
                  <span>{bedrooms} Beds</span>
                </div>
              )}
              {bathrooms > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Bath className="w-4 h-4" />
                  <span>{bathrooms} Baths</span>
                </div>
              )}
              {area > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Square className="w-4 h-4" />
                  <span>{area} sqft</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-foreground">
                {formatPrice(price)}
              </p>
            </div>
            <Link to={`/property/${id}`}>
              <Button variant="default">View Property</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
