import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyCard } from './PropertyCard';
import { Link } from 'react-router-dom';

type Property = {
  id: string;
  image: string;
  price: number;
  location: string;
  title: string;
  bedrooms?: number;
  type: string;
  status: string;
};

type ExploreMoreSectionProps = {
  properties: Property[];
  onPropertyView: (id: string) => void;
};

export const ExploreMoreSection = ({ properties, onPropertyView }: ExploreMoreSectionProps) => {
  if (properties.length === 0) return null;

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Explore More</h2>
            <p className="text-sm text-muted-foreground mt-1">Discover more amazing properties</p>
          </div>
          <Link to="/browse">
            <Button variant="outline" className="gap-2 hover:gap-3 transition-all">
              View All Properties
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 animate-fade-in">
          {properties.slice(0, 18).map((property) => (
            <PropertyCard
              key={property.id}
              {...property}
              variant="small"
              onView={() => onPropertyView(property.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};