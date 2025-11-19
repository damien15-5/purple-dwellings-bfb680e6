import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import heroImage from '@/assets/hero-house.jpg';
import { supabase } from '@/integrations/supabase/client';
import { FeaturedPropertiesSection } from '@/components/home/FeaturedPropertiesSection';
import { LocalitySection } from '@/components/home/LocalitySection';
import { ExploreMoreSection } from '@/components/home/ExploreMoreSection';
import { RecommendationsSection } from '@/components/home/RecommendationsSection';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  distance?: string;
  matchScore?: number;
  city?: string;
  state?: string;
  address?: string;
};

export const Home = () => {
  const [priceRange, setPriceRange] = useState([0, 200000000]);
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [town, setTown] = useState('');
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<string>('');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    fetchProperties();
    detectUserLocation();
  }, []);

  const detectUserLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (data.city) {
        setUserLocation(data.city);
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      setUserLocation('Lagos');
    }
  };

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const transformedProperties: Property[] = data.map(p => ({
          id: p.id,
          image: p.images?.[0] || '',
          price: p.price,
          location: `${p.city || ''}, ${p.state || ''}`.trim(),
          title: p.title,
          bedrooms: p.bedrooms || 0,
          type: p.property_type,
          status: p.status,
          views: 0,
          clicks: 0,
          city: p.city || '',
          state: p.state || '',
          address: p.address || '',
          matchScore: Math.floor(Math.random() * 40) + 60
        }));

        setAllProperties(transformedProperties);
      }
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPriceRange([0, 200000000]);
    setLocation('');
    setPropertyType('');
    setBedrooms('');
    setStatus('');
    setSearchTerm('');
    setCountry('');
    setState('');
    setTown('');
  };

  const handlePropertyView = async (id: string) => {
    try {
      setAllProperties(prev => 
        prev.map(p => p.id === id ? { ...p, views: p.views + 1, clicks: p.clicks + 1 } : p)
      );
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filteredProperties = allProperties.filter(property => {
    const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];
    const matchesLocation = !location || property.location.toLowerCase().includes(location.toLowerCase());
    const matchesType = !propertyType || property.type === propertyType;
    const matchesBedrooms = !bedrooms || property.bedrooms.toString() === bedrooms;
    const matchesStatus = !status || property.status === status;
    const matchesSearch = !searchTerm || 
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      property.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = !country || property.address?.toLowerCase().includes(country.toLowerCase());
    const matchesState = !state || property.state?.toLowerCase().includes(state.toLowerCase());
    const matchesTown = !town || property.city?.toLowerCase().includes(town.toLowerCase());
    
    return matchesPrice && matchesLocation && matchesType && matchesBedrooms && matchesStatus && matchesSearch && matchesCountry && matchesState && matchesTown;
  });

  const featuredProperties = [...filteredProperties]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 6);

  const localityProperties = filteredProperties
    .filter(p => {
      if (!userLocation) return true;
      return p.city?.toLowerCase().includes(userLocation.toLowerCase()) || 
             p.state?.toLowerCase().includes(userLocation.toLowerCase()) ||
             p.location.toLowerCase().includes(userLocation.toLowerCase());
    })
    .slice(0, 8);

  const exploreMoreProperties = filteredProperties.slice(0, 9);

  const recommendedProperties = [...filteredProperties]
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, 8);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="relative h-[70vh] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Hero" 
            className="w-full h-full object-cover blur-sm scale-110"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="relative container mx-auto px-4 h-full">
          <div className="grid lg:grid-cols-2 gap-8 h-full items-center">
            <div className="text-white space-y-6 animate-fade-in">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Find Your Dream Property
              </h1>
              <p className="text-xl text-white/90 max-w-lg">
                Discover the perfect home, apartment, or investment property with our extensive listings
              </p>

              <div className="flex gap-2 bg-white rounded-lg p-2 shadow-2xl max-w-2xl">
                <div className="flex-1">
                  <Input
                    placeholder="Search by location or property name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-0 h-12 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                
                <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2 h-12 border-0">
                      <SlidersHorizontal className="h-5 w-5" />
                      Filters
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[600px] p-6" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">Filter Properties</h3>
                        <Button variant="ghost" size="sm" onClick={handleReset}>
                          Reset
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Price Range</label>
                        <Slider
                          value={priceRange}
                          onValueChange={setPriceRange}
                          max={200000000}
                          step={5000000}
                          className="w-full"
                        />
                        <div className="text-xs text-muted-foreground flex justify-between">
                          <span>{formatPrice(priceRange[0])}</span>
                          <span>{formatPrice(priceRange[1])}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Country</label>
                          <Input
                            placeholder="Enter country..."
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">State</label>
                          <Input
                            placeholder="Enter state..."
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Town/City</label>
                          <Input
                            placeholder="Enter town..."
                            value={town}
                            onChange={(e) => setTown(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Property Type</label>
                          <Select value={propertyType || "all"} onValueChange={(value) => setPropertyType(value === "all" ? "" : value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="house">House</SelectItem>
                              <SelectItem value="apartment">Apartment</SelectItem>
                              <SelectItem value="villa">Villa</SelectItem>
                              <SelectItem value="land">Land</SelectItem>
                              <SelectItem value="duplex">Duplex</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Bedrooms</label>
                          <Select value={bedrooms || "all"} onValueChange={(value) => setBedrooms(value === "all" ? "" : value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Any" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Any</SelectItem>
                              <SelectItem value="1">1 Bedroom</SelectItem>
                              <SelectItem value="2">2 Bedrooms</SelectItem>
                              <SelectItem value="3">3 Bedrooms</SelectItem>
                              <SelectItem value="4">4 Bedrooms</SelectItem>
                              <SelectItem value="5">5+ Bedrooms</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Listing Status</label>
                          <Select value={status || "all"} onValueChange={(value) => setStatus(value === "all" ? "" : value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button className="w-full" onClick={() => setFilterOpen(false)}>
                        Apply Filters
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Link to="/browse">
                  <Button className="gap-2 h-12">
                    <Search className="h-5 w-5" />
                    Search
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hidden lg:block" />
          </div>
        </div>
      </section>

      {featuredProperties.length > 0 && (
        <FeaturedPropertiesSection 
          properties={featuredProperties}
          onPropertyView={handlePropertyView}
        />
      )}

      {localityProperties.length > 0 && (
        <LocalitySection 
          properties={localityProperties}
          userLocation={userLocation || 'your area'}
          onPropertyView={handlePropertyView}
        />
      )}

      {recommendedProperties.length > 0 && (
        <RecommendationsSection 
          properties={recommendedProperties}
          onPropertyView={handlePropertyView}
        />
      )}

      {exploreMoreProperties.length > 0 && (
        <ExploreMoreSection 
          properties={exploreMoreProperties}
          onPropertyView={handlePropertyView}
        />
      )}

      {allProperties.length === 0 && (
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-muted-foreground mb-4">
            No Properties Available Yet
          </h2>
          <p className="text-muted-foreground mb-8">
            Be the first to list a property on our platform
          </p>
          <Link to="/upload-listing">
            <Button size="lg">List Your Property</Button>
          </Link>
        </div>
      )}
    </div>
  );
};