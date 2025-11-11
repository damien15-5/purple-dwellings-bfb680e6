import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('type') || 'all');
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
    <div className="min-h-screen py-16 bg-gradient-to-b from-secondary/30 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-center animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground leading-tight">
            Browse <span className="text-gradient-purple">Properties</span>
          </h1>
          <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
            Discover <span className="text-accent-purple font-semibold">verified properties</span> from trusted sellers across Nigeria
          </p>
        </div>

        {/* Search & Filters */}
        <Card className="p-8 mb-10 card-glow border-2 border-border animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-accent-purple" />
            Filter Properties
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 relative">
              <label className="text-sm font-semibold text-foreground mb-2 block">Search Location</label>
              <Search className="absolute left-3 bottom-4 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Enter location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 border-2 focus:border-accent-purple"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Property Type</label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="h-12 border-2">
                  <HomeIcon className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="House">House</SelectItem>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="Villa">Villa</SelectItem>
                  <SelectItem value="Land">Land</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Price Range</label>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="h-12 border-2">
                  <SelectValue placeholder="All Prices" />
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
          </div>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-lg">
            {loading ? (
              <span className="text-muted-foreground">Loading properties...</span>
            ) : (
              <>
                <span className="font-bold text-accent-purple text-2xl">{filteredProperties.length}</span> 
                <span className="text-foreground font-semibold ml-2">{filteredProperties.length === 1 ? 'property' : 'properties'} found</span>
              </>
            )}
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm('');
              setPropertyType('all');
              setPriceRange('all');
            }}
            className="border-2 hover:border-accent-purple hover:bg-accent-purple/5"
          >
            Clear Filters
          </Button>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-16 h-16 animate-spin text-accent-purple mb-6" />
            <p className="text-muted-foreground text-lg">Loading amazing properties...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <Card className="text-center py-24 card-glow">
            <HomeIcon className="w-24 h-24 mx-auto mb-6 text-accent-purple/40 animate-float" />
            <h3 className="text-3xl font-bold text-foreground mb-4">No properties found</h3>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              Try adjusting your filters to see more results
            </p>
            <Button
              variant="hero"
              onClick={() => {
                setSearchTerm('');
                setPropertyType('all');
                setPriceRange('all');
              }}
            >
              Clear All Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property, index) => (
              <div
                key={property.id}
                className="stagger-animation"
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
