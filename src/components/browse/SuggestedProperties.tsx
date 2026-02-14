import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, Star } from 'lucide-react';
import { useRef } from 'react';
import { Badge } from '@/components/ui/badge';

interface SuggestedProperty {
  id: string;
  image: string;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  isPromoted?: boolean;
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
            className="flex-shrink-0 w-[280px] group"
          >
            <div className="bg-transparent rounded-xl overflow-hidden">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {property.isPromoted && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="bg-primary/90 backdrop-blur-sm text-primary-foreground border-0 shadow-sm font-medium text-xs px-2 py-0.5 gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Promoted
                    </Badge>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base line-clamp-1">
                  {property.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {property.location}
                </p>
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="text-base font-semibold text-foreground">
                    {formatPrice(property.price)}
                  </span>
                  <span className="text-sm text-muted-foreground">total</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
