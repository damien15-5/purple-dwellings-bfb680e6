import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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
  matchScore?: number;
};

type RecommendationsSectionProps = {
  properties: Property[];
  onPropertyView: (id: string) => void;
};

export const RecommendationsSection = ({ properties, onPropertyView }: RecommendationsSectionProps) => {
  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('recommendations-scroll');
    if (container) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (properties.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-b from-muted/20 to-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-primary" />
            <div>
              <h2 className="text-3xl font-bold text-foreground">Recommended For You</h2>
              <p className="text-sm text-muted-foreground mt-1">Properties matching your preferences</p>
            </div>
          </div>
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
            id="recommendations-scroll"
            className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {properties.map((property) => (
              <div key={property.id} className="relative">
                {property.matchScore && property.matchScore > 80 && (
                  <div className="absolute -top-2 -right-2 z-10 bg-accent-purple text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                    {property.matchScore}% Match
                  </div>
                )}
                <PropertyCard
                  {...property}
                  variant="medium"
                  onView={() => onPropertyView(property.id)}
                />
              </div>
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