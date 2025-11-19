import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useRef } from 'react';

interface SuggestedProperty {
  id: string;
  image: string;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
}

interface SuggestedPropertiesProps {
  properties: SuggestedProperty[];
}

export const SuggestedProperties = ({ properties }: SuggestedPropertiesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (properties.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">
            Suggested For You
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-background border border-border hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-background border border-border hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {properties.slice(0, 5).map((property) => (
          <Link
            key={property.id}
            to={`/property/${property.id}`}
            className="flex-shrink-0 w-64 group"
          >
            <div className="bg-white rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all">
              <div className="relative h-48">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                  {property.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-2 flex items-center">
                  <span className="line-clamp-1">{property.location}</span>
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">
                    {formatPrice(property.price)}
                  </span>
                  {property.bedrooms > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {property.bedrooms} beds
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
