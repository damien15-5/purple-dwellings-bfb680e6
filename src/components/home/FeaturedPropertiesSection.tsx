import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyCard } from './PropertyCard';
import { Link } from 'react-router-dom';

type Property = {
  id: string;
  image: string;
  price: number;
  location: string;
  title: string;
  bedrooms: number;
  type: string;
  status: string;
  views: number;
  clicks: number;
};

type FeaturedPropertiesSectionProps = {
  properties: Property[];
  onPropertyView: (id: string) => void;
};

export const FeaturedPropertiesSection = ({ properties, onPropertyView }: FeaturedPropertiesSectionProps) => {
  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('featured-scroll');
    if (container) {
      const scrollAmount = direction === 'left' ? -450 : 450;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (properties.length === 0) return null;

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-7 w-7 text-primary" />
            <div>
              <h2 className="text-3xl font-bold text-foreground">Featured Properties</h2>
              <p className="text-sm text-muted-foreground mt-1">Most viewed and popular properties</p>
            </div>
          </div>
          <Link to="/browse">
            <Button variant="outline" className="gap-2 hover:gap-3 transition-all">
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="relative group">
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-xl rounded-full p-3 hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <div
            id="featured-scroll"
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                {...property}
                variant="large"
                featured={true}
                onView={() => onPropertyView(property.id)}
              />
            ))}
          </div>

          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-xl rounded-full p-3 hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </section>
  );
};