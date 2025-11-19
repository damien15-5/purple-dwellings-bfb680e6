import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyCard } from './PropertyCard';

type Property = {
  id: string;
  image: string;
  price: number;
  location: string;
  title: string;
  bedrooms: number;
  type: string;
  status: string;
  distance?: string;
};

type LocalitySectionProps = {
  properties: Property[];
  userLocation?: string;
  onPropertyView: (id: string) => void;
};

export const LocalitySection = ({ properties, userLocation = "Lagos", onPropertyView }: LocalitySectionProps) => {
  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('locality-scroll');
    if (container) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (properties.length === 0) return null;

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MapPin className="h-7 w-7 text-primary" />
            <div>
              <h2 className="text-3xl font-bold text-foreground">Around Your Locality</h2>
              <p className="text-sm text-muted-foreground mt-1">Properties near {userLocation}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="gap-2 hover:gap-3 transition-all" 
            onClick={() => scroll('right')}
          >
            Explore More
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative group">
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-xl rounded-full p-3 hover:bg-primary hover:text-primary-foreground transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div
            id="locality-scroll"
            className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                {...property}
                variant="medium"
                onView={() => onPropertyView(property.id)}
              />
            ))}
          </div>

          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-xl rounded-full p-3 hover:bg-primary hover:text-primary-foreground transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </section>
  );
};