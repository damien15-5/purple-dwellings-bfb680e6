import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Grid3x3, List, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertyListView } from '@/components/browse/PropertyListView';
import { FilterBar } from '@/components/browse/FilterBar';
import { SuggestedProperties } from '@/components/browse/SuggestedProperties';

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
  is_verified: boolean;
  city?: string;
  state?: string;
  country?: string;
  isPromoted?: boolean;
};

export const Browse = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [propertyType, setPropertyType] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000000]);
  const [bedrooms, setBedrooms] = useState('any');
  const [bathrooms, setBathrooms] = useState('any');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  
  // Data states
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [displayedProperties, setDisplayedProperties] = useState<Property[]>([]);
  const [suggestedProperties, setSuggestedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const propertiesPerPage = 12;

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [searchTerm, propertyType, priceRange, bedrooms, bathrooms, country, state, verifiedOnly, allProperties]);

  useEffect(() => {
    paginateProperties();
  }, [filteredProperties, page]);

  const fetchProperties = async () => {
    try {
      const [propertiesRes, promotionsRes] = await Promise.all([
        supabase
          .from('properties')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false }),
        supabase
          .from('property_promotions')
          .select('property_id')
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString()),
      ]);

      if (propertiesRes.error) throw propertiesRes.error;

      const promotedIds = new Set((promotionsRes.data || []).map(p => p.property_id));
      const propertiesWithPromo = (propertiesRes.data || []).map(p => ({
        ...p,
        isPromoted: promotedIds.has(p.id),
      }));

      // Sort: promoted first
      propertiesWithPromo.sort((a, b) => {
        if (a.isPromoted && !b.isPromoted) return -1;
        if (!a.isPromoted && b.isPromoted) return 1;
        return 0;
      });

      setAllProperties(propertiesWithPromo);
      
      // Suggested: promoted properties first
      const suggested = propertiesWithPromo.filter(p => p.isPromoted).slice(0, 5);
      if (suggested.length < 5) {
        suggested.push(...propertiesWithPromo.filter(p => !p.isPromoted).slice(0, 5 - suggested.length));
      }
      setSuggestedProperties(suggested);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    let filtered = allProperties;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.state?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Property type filter
    if (propertyType !== 'all') {
      filtered = filtered.filter((p) => p.property_type === propertyType);
    }

    // Price range filter
    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Bedrooms filter
    if (bedrooms !== 'any') {
      filtered = filtered.filter((p) => p.bedrooms >= parseInt(bedrooms));
    }

    // Bathrooms filter
    if (bathrooms !== 'any') {
      filtered = filtered.filter((p) => p.bathrooms >= parseInt(bathrooms));
    }

    // Country filter
    if (country) {
      filtered = filtered.filter((p) =>
        p.country?.toLowerCase().includes(country.toLowerCase())
      );
    }

    // State filter
    if (state) {
      filtered = filtered.filter((p) =>
        p.state?.toLowerCase().includes(state.toLowerCase())
      );
    }

    // Verified filter
    if (verifiedOnly) {
      filtered = filtered.filter((p) => p.is_verified);
    }

    setFilteredProperties(filtered);
    setPage(1); // Reset to first page when filters change
  };

  const paginateProperties = () => {
    const startIndex = 0;
    const endIndex = page * propertiesPerPage;
    setDisplayedProperties(filteredProperties.slice(startIndex, endIndex));
  };

  const handleLoadMore = () => {
    setPage(page + 1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setPropertyType('all');
    setPriceRange([0, 500000000]);
    setBedrooms('any');
    setBathrooms('any');
    setCountry('');
    setState('');
    setVerifiedOnly(false);
  };

  const hasMoreProperties = displayedProperties.length < filteredProperties.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background">
      {/* Header */}
      <div className="pt-12 sm:pt-16 pb-6 sm:pb-8 bg-gradient-to-r from-primary/10 to-primary/5 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 text-foreground">
            Browse <span className="text-primary">Properties</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-3xl mx-auto px-4">
            Discover verified properties from trusted sellers across Nigeria
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        propertyType={propertyType}
        setPropertyType={setPropertyType}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        bedrooms={bedrooms}
        setBedrooms={setBedrooms}
        bathrooms={bathrooms}
        setBathrooms={setBathrooms}
        country={country}
        setCountry={setCountry}
        state={state}
        setState={setState}
        verifiedOnly={verifiedOnly}
        setVerifiedOnly={setVerifiedOnly}
        onClearFilters={handleClearFilters}
        totalResults={filteredProperties.length}
      />

      <div className="container mx-auto px-4 pb-16">
        {/* Suggested Properties */}
        {!searchTerm && !loading && (
          <SuggestedProperties
            properties={suggestedProperties.map(p => ({
              id: p.id,
              image: p.images?.[0] || '/placeholder.svg',
              title: p.title,
              price: p.price,
              location: p.address,
              bedrooms: p.bedrooms,
              isPromoted: p.isPromoted
            }))}
          />
        )}

        {/* View Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            All Properties
          </h2>
          <div className="flex gap-2 bg-white rounded-lg p-1 border border-border">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Grid3x3 className="w-3 h-3 sm:w-4 sm:h-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <List className="w-3 h-3 sm:w-4 sm:h-4" />
              List
            </Button>
          </div>
        </div>

        {/* Properties Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 sm:py-32 px-4">
            <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-primary mb-4 sm:mb-6" />
            <p className="text-muted-foreground text-base sm:text-lg">Loading properties...</p>
          </div>
        ) : displayedProperties.length === 0 ? (
          <div className="text-center py-16 sm:py-24 bg-white rounded-xl border border-border px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-muted flex items-center justify-center">
              <Grid3x3 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">No properties found</h3>
            <p className="text-muted-foreground text-base sm:text-lg mb-6 sm:mb-8 max-w-md mx-auto px-4">
              Try adjusting your filters to see more results
            </p>
            <Button onClick={handleClearFilters} variant="default">
              Clear All Filters
            </Button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
                {displayedProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={{
                      id: property.id,
                      title: property.title,
                      location: property.address,
                      price: property.price,
                      bedrooms: property.bedrooms || 0,
                      bathrooms: property.bathrooms || 0,
                      sqft: property.area || 0,
                      propertyType: (property.property_type as 'Apartment' | 'House' | 'Land' | 'Villa') || 'House',
                      images: property.images || ['/placeholder.svg'],
                      description: property.description,
                      seller: { id: 1, name: 'Seller' },
                      status: (property.status as 'draft' | 'pending' | 'published') || 'published',
                      isVerified: property.is_verified,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {displayedProperties.map((property) => (
                  <PropertyListView
                    key={property.id}
                    id={property.id}
                    title={property.title}
                    description={property.description}
                    price={property.price}
                    location={property.address}
                    bedrooms={property.bedrooms || 0}
                    bathrooms={property.bathrooms || 0}
                    area={property.area || 0}
                    image={property.images?.[0] || '/placeholder.svg'}
                    isVerified={property.is_verified}
                    propertyType={property.property_type}
                  />
                ))}
              </div>
            )}

            {/* Load More / Pagination */}
            {hasMoreProperties && (
              <div className="flex justify-center mt-8 sm:mt-12 px-4">
                <Button
                  onClick={handleLoadMore}
                  size="lg"
                  variant="outline"
                  className="min-w-[180px] sm:min-w-[200px] text-sm sm:text-base"
                >
                  Load More Properties
                </Button>
              </div>
            )}

            {/* Results Summary */}
            <div className="text-center mt-6 sm:mt-8 text-muted-foreground text-sm sm:text-base px-4">
              Showing {displayedProperties.length} of {filteredProperties.length} properties
            </div>
          </>
        )}
      </div>
    </div>
  );
};
