import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PropertyCard } from '@/components/PropertyCard';
import { PlusCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const MyListings = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProperties();
  }, []);

  const fetchUserProperties = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const publishedProperties = properties.filter(p => p.status === 'published');
  const pendingProperties = properties.filter(p => p.status === 'pending');
  const draftProperties = properties.filter(p => p.status === 'draft');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
              Published <span className="ml-2 font-bold">({publishedProperties.length})</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-accent-purple data-[state=active]:text-white text-base py-3 px-6">
              Pending <span className="ml-2 font-bold">({pendingProperties.length})</span>
            </TabsTrigger>
            <TabsTrigger value="drafts" className="data-[state=active]:bg-accent-purple data-[state=active]:text-white text-base py-3 px-6">
              Drafts <span className="ml-2 font-bold">({draftProperties.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="published">
            {publishedProperties.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No published properties yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {publishedProperties.map((property, index) => (
                  <div 
                    key={property.id}
                    className="stagger-animation"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <PropertyCard property={{
                      id: property.id,
                      title: property.title,
                      location: property.address,
                      price: property.price,
                      bedrooms: property.bedrooms || 0,
                      bathrooms: property.bathrooms || 0,
                      sqft: property.area || 0,
                      propertyType: 'House',
                      images: property.images || ['/placeholder.svg'],
                      description: property.description,
                      seller: { id: 1, name: 'Seller' },
                      status: 'published',
                      isVerified: property.is_verified,
                    }} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending">
            {pendingProperties.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No pending properties
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pendingProperties.map((property, index) => (
                  <div 
                    key={property.id}
                    className="stagger-animation"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <PropertyCard property={{
                      id: property.id,
                      title: property.title,
                      location: property.address,
                      price: property.price,
                      bedrooms: property.bedrooms || 0,
                      bathrooms: property.bathrooms || 0,
                      sqft: property.area || 0,
                      propertyType: 'House',
                      images: property.images || ['/placeholder.svg'],
                      description: property.description,
                      seller: { id: 1, name: 'Seller' },
                      status: 'pending',
                      isVerified: property.is_verified,
                    }} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="drafts">
            {draftProperties.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No draft properties
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {draftProperties.map((property, index) => (
                  <div 
                    key={property.id}
                    className="stagger-animation"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <PropertyCard property={{
                      id: property.id,
                      title: property.title,
                      location: property.address,
                      price: property.price,
                      bedrooms: property.bedrooms || 0,
                      bathrooms: property.bathrooms || 0,
                      sqft: property.area || 0,
                      propertyType: 'House',
                      images: property.images || ['/placeholder.svg'],
                      description: property.description,
                      seller: { id: 1, name: 'Seller' },
                      status: 'draft',
                      isVerified: property.is_verified,
                    }} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
