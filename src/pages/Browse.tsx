import { useState, useMemo } from 'react';
import { PropertyCard } from '@/components/PropertyCard';
import { mockProperties } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';

export const Browse = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyType, setPropertyType] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [bedrooms, setBedrooms] = useState<string>('all');

  const filteredProperties = useMemo(() => {
    return mockProperties.filter((property) => {
      const matchesSearch =
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = propertyType === 'all' || property.propertyType === propertyType;

      let matchesPrice = true;
      if (priceRange !== 'all') {
        const price = property.price;
        switch (priceRange) {
          case 'under-30m':
            matchesPrice = price < 30000000;
            break;
          case '30m-50m':
            matchesPrice = price >= 30000000 && price <= 50000000;
            break;
          case '50m-100m':
            matchesPrice = price >= 50000000 && price <= 100000000;
            break;
          case 'over-100m':
            matchesPrice = price > 100000000;
            break;
        }
      }

      const matchesBedrooms =
        bedrooms === 'all' || property.bedrooms === parseInt(bedrooms) || (bedrooms === '4+' && property.bedrooms >= 4);

      return matchesSearch && matchesType && matchesPrice && matchesBedrooms;
    });
  }, [searchTerm, propertyType, priceRange, bedrooms]);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Browse <span className="text-gradient-purple">Properties</span>
          </h1>
          <p className="text-muted-foreground">
            Showing {filteredProperties.length} of {mockProperties.length} properties
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by location or property name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="h-12">
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
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under-30m">Under ₦30M</SelectItem>
                <SelectItem value="30m-50m">₦30M - ₦50M</SelectItem>
                <SelectItem value="50m-100m">₦50M - ₦100M</SelectItem>
                <SelectItem value="over-100m">Over ₦100M</SelectItem>
              </SelectContent>
            </Select>

            <Select value={bedrooms} onValueChange={setBedrooms}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Bedrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Bedrooms</SelectItem>
                <SelectItem value="1">1 Bedroom</SelectItem>
                <SelectItem value="2">2 Bedrooms</SelectItem>
                <SelectItem value="3">3 Bedrooms</SelectItem>
                <SelectItem value="4">4 Bedrooms</SelectItem>
                <SelectItem value="4+">4+ Bedrooms</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="h-12"
              onClick={() => {
                setSearchTerm('');
                setPropertyType('all');
                setPriceRange('all');
                setBedrooms('all');
              }}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property, index) => (
              <div 
                key={property.id}
                className="stagger-animation"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-2xl text-muted-foreground mb-4">No properties found</p>
            <p className="text-muted-foreground mb-6">Try adjusting your filters</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setPropertyType('all');
                setPriceRange('all');
                setBedrooms('all');
              }}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
