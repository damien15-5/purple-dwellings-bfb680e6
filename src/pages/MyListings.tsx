import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PropertyCard } from '@/components/PropertyCard';
import { mockProperties } from '@/data/mockData';
import { PlusCircle } from 'lucide-react';

export const MyListings = () => {
  return (
    <div className="min-h-screen py-16 bg-gradient-to-b from-secondary/30 to-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 animate-fade-in">
          <div>
            <h1 className="text-5xl font-bold text-foreground mb-3">
              My <span className="text-gradient-purple">Listings</span>
            </h1>
            <p className="text-xl text-muted-foreground">Manage and track your property listings</p>
          </div>
          <Link to="/upload-listing">
            <Button variant="hero" size="lg" className="hover-lift">
              <PlusCircle className="w-5 h-5 mr-2" />
              Upload New Listing
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="published" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid h-auto p-1.5 bg-white border-2 border-border shadow-sm">
            <TabsTrigger value="published" className="data-[state=active]:bg-accent-purple data-[state=active]:text-white text-base py-3 px-6">
              Published <span className="ml-2 font-bold">(3)</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-accent-purple data-[state=active]:text-white text-base py-3 px-6">
              Pending <span className="ml-2 font-bold">(1)</span>
            </TabsTrigger>
            <TabsTrigger value="drafts" className="data-[state=active]:bg-accent-purple data-[state=active]:text-white text-base py-3 px-6">
              Drafts <span className="ml-2 font-bold">(2)</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="published">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mockProperties.slice(0, 3).map((property, index) => (
                <div 
                  key={property.id}
                  className="stagger-animation"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mockProperties.slice(3, 4).map((property, index) => (
                <div 
                  key={property.id}
                  className="stagger-animation"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="drafts">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mockProperties.slice(4, 6).map((property, index) => (
                <div 
                  key={property.id}
                  className="stagger-animation"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
