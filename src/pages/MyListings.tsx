import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PropertyCard } from '@/components/PropertyCard';
import { mockProperties } from '@/data/mockData';
import { PlusCircle } from 'lucide-react';

export const MyListings = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">My Listings</h1>
        <Link to="/upload-listing">
          <Button className="hover-lift animate-glow">
            <PlusCircle className="mr-2 h-4 w-4" />
            Post New Listing
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="published">
        <TabsList className="mb-6">
          <TabsTrigger value="published">Published (3)</TabsTrigger>
          <TabsTrigger value="pending">Pending (1)</TabsTrigger>
          <TabsTrigger value="drafts">Drafts (2)</TabsTrigger>
        </TabsList>

        <TabsContent value="published">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProperties.slice(0, 3).map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProperties.slice(3, 4).map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="drafts">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProperties.slice(4, 6).map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
