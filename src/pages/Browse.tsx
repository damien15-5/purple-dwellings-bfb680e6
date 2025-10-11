import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PropertyCard } from '@/components/PropertyCard';
import { Search, SlidersHorizontal, MapPin, Home as HomeIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Property = {
  id: string;
  title: string;
  description: string;
  property_type: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  status: string;
};

export const Browse = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [searchTerm, propertyType, priceRange, properties]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProperties(data || []);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = properties;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Property type filter
    if (propertyType !== 'all') {
      filtered = filtered.filter((p) => p.property_type === propertyType);
    }

    // Price range filter
    if (priceRange !== 'all') {
      filtered = filtered.filter((p) => {
        switch (priceRange) {
          case 'under10m':
            return p.price < 10000000;
          case '10m-50m':
            return p.price >= 10000000 && p.price < 50000000;
          case '50m-100m':
            return p.price >= 50000000 && p.price < 100000000;
          case 'over100m':
            return p.price >= 100000000;
          default:
            return true;
        }
      });
    }

    setFilteredProperties(filtered);
  };

  return (
    <div className="min-h-screen bg-background py-8 animate-fade-in">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Browse <span className="text-gradient-primary">Properties</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover verified properties from trusted sellers across Nigeria
          </p>
        </div>

        {/* Search & Filters */}
        <Card className="p-6 mb-8 bg-white border-2 border-light-purple-border hover-lift animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search by title, location, or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 border-2 border-light-purple-border focus:border-light-purple-accent"
              />
            </div>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="h-12 border-2 border-light-purple-border">
                <HomeIcon className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="House">House</SelectItem>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Land">Land</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="h-12 border-2 border-light-purple-border">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under10m">Under ₦10M</SelectItem>
                <SelectItem value="10m-50m">₦10M - ₦50M</SelectItem>
                <SelectItem value="50m-100m">₦50M - ₦100M</SelectItem>
                <SelectItem value="over100m">Over ₦100M</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {loading ? (
              'Loading properties...'
            ) : (
              <>
                <span className="font-semibold text-foreground">{filteredProperties.length}</span> properties found
              </>
            )}
          </p>
          <Button variant="outline" className="border-2 border-light-purple-border hover:bg-light-purple-accent/10">
            <MapPin className="w-4 h-4 mr-2" />
            Map View
          </Button>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-light-purple-accent" />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-20">
            <HomeIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50 animate-float" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No properties found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search filters</p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setPropertyType('all');
                setPriceRange('all');
              }}
              className="bg-light-purple-accent hover:bg-light-purple-accent/90"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property, index) => (
              <div
                key={property.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <PropertyCard
                  property={{
                    id: parseInt(property.id) || 1,
                    title: property.title,
                    location: property.address,
                    price: property.price,
                    bedrooms: property.bedrooms || 0,
                    bathrooms: property.bathrooms || 0,
                    sqft: property.area || 0,
                    propertyType: (property.property_type as 'House' | 'Apartment' | 'Villa' | 'Land') || 'House',
                    images: property.images && property.images.length > 0 ? property.images : ['https://images.unsplash.com/photo-1568605114967-8130f3a36994'],
                    description: property.description,
                    seller: {
                      id: 1,
                      name: 'Seller',
                    },
                    status: 'published',
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
