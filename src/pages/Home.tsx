import { useState, useEffect, useMemo } from 'react';
import { SEOHead } from '@/components/SEOHead';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useImagePreloader } from '@/components/ui/OptimizedImage';
import { usePersonalization, getPersonalizationScore } from '@/hooks/usePersonalization';

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
  isPromoted?: boolean;
  promotionAmount?: number;
  isVerifiedSeller?: boolean;
};

// Loading skeleton for property sections
const PropertySkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="aspect-[4/3] rounded-xl" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    ))}
  </div>
);

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
  const { preferences } = usePersonalization();

  useEffect(() => {
    fetchProperties();
    detectUserLocation();
  }, []);

  const [userState, setUserState] = useState<string>('');

  const detectUserLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (data.region) {
        setUserState(data.region);
      }
      if (data.city) {
        setUserLocation(data.city);
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      setUserLocation('Lagos');
      setUserState('Lagos');
    }
  };

  const fetchProperties = async () => {
    try {
      // Fetch properties, active promotions, and paid properties in parallel
      const [propertiesRes, promotionsRes, paidPropertiesRes] = await Promise.all([
        supabase
          .from('properties')
          .select('id, title, price, images, city, state, address, bedrooms, property_type, status, views, clicks, is_verified')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('property_promotions')
          .select('property_id, amount_paid, is_active, expires_at')
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString()),
        supabase
          .from('purchase_transactions')
          .select('property_id')
          .in('status', ['completed', 'confirmed']),
      ]);

      if (propertiesRes.error) throw propertiesRes.error;

      // Build a map of property_id -> total promotion amount (stackable promotions)
      const promotionAmounts = new Map<string, number>();
      (promotionsRes.data || []).forEach(p => {
        const current = promotionAmounts.get(p.property_id) || 0;
        promotionAmounts.set(p.property_id, current + Number(p.amount_paid));
      });
      const promotedIds = new Set(promotionAmounts.keys());

      // Build set of paid property IDs
      const paidPropertyIds = new Set(
        (paidPropertiesRes.data || []).map(t => t.property_id).filter(Boolean)
      );

      if (propertiesRes.data) {
        const transformedProperties: Property[] = propertiesRes.data.map(p => ({
          id: p.id,
          image: p.images?.[0] || '',
          price: p.price,
          location: `${p.city || ''}, ${p.state || ''}`.trim(),
          title: p.title,
          bedrooms: p.bedrooms || 0,
          type: p.property_type,
          status: p.status,
          views: p.views || 0,
          clicks: p.clicks || 0,
          city: p.city || '',
          state: p.state || '',
          address: p.address || '',
          matchScore: Math.floor(Math.random() * 40) + 60,
          isPromoted: promotedIds.has(p.id),
          promotionAmount: promotionAmounts.get(p.id) || 0,
          isVerifiedSeller: p.is_verified === true,
          isPaid: paidPropertyIds.has(p.id),
        }));

        setAllProperties(transformedProperties);
      }
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      setLoading(false);
    }
  };

  // Preload first 6 images for instant display
  const imagesToPreload = useMemo(() => 
    allProperties.slice(0, 6).map(p => p.image).filter(Boolean),
    [allProperties]
  );
  useImagePreloader(imagesToPreload);

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
      const { data: property } = await supabase
        .from('properties')
        .select('views, clicks')
        .eq('id', id)
        .single();
      
      if (property) {
        const { error } = await supabase
          .from('properties')
          .update({ 
            views: (property.views || 0) + 1,
            clicks: (property.clicks || 0) + 1
          })
          .eq('id', id);
        
        if (error) throw error;

        setAllProperties(prev => 
          prev.map(p => p.id === id ? { ...p, views: p.views + 1, clicks: p.clicks + 1 } : p)
        );
      }
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

  const filteredProperties = useMemo(() => allProperties.filter(property => {
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
  }), [allProperties, priceRange, location, propertyType, bedrooms, status, searchTerm, country, state, town]);

  // Sort helper: promoted first by amount_paid (higher = higher priority), then fallback
  const promotionSort = (a: Property, b: Property) => {
    if (a.isPromoted && !b.isPromoted) return -1;
    if (!a.isPromoted && b.isPromoted) return 1;
    if (a.isPromoted && b.isPromoted) {
      return (b.promotionAmount || 0) - (a.promotionAmount || 0);
    }
    return 0;
  };

  // Featured: promoted first (by amount), then by clicks
  const featuredProperties = useMemo(() => 
    [...filteredProperties]
      .sort((a, b) => {
        const promoResult = promotionSort(a, b);
        if (promoResult !== 0) return promoResult;
        return b.clicks - a.clicks;
      })
      .slice(0, 6),
    [filteredProperties]
  );

  // Locality: match by detected state/city, promoted first by amount
  const localityProperties = useMemo(() => 
    filteredProperties
      .filter(p => {
        // Match by state first (from IP), then city
        if (userState) {
          if (p.state?.toLowerCase().includes(userState.toLowerCase())) return true;
        }
        if (userLocation) {
          if (p.city?.toLowerCase().includes(userLocation.toLowerCase())) return true;
          if (p.location.toLowerCase().includes(userLocation.toLowerCase())) return true;
        }
        // If no location detected, show all
        return !userState && !userLocation;
      })
      .sort((a, b) => {
        const promoResult = promotionSort(a, b);
        if (promoResult !== 0) return promoResult;
        return 0;
      })
      .slice(0, 8),
    [filteredProperties, userLocation, userState]
  );

  // Explore more: promoted first by amount, then personalized
  const exploreMoreProperties = useMemo(() => 
    [...filteredProperties]
      .sort((a, b) => {
        const promoResult = promotionSort(a, b);
        if (promoResult !== 0) return promoResult;
        // Secondary: personalization score
        const aScore = getPersonalizationScore(a, preferences);
        const bScore = getPersonalizationScore(b, preferences);
        return bScore - aScore;
      })
      .slice(0, 9),
    [filteredProperties, preferences]
  );

  // Recommended: personalized by viewing history, promoted by amount gets priority
  const recommendedProperties = useMemo(() => 
    [...filteredProperties]
      .map(p => ({
        ...p,
        matchScore: getPersonalizationScore(p, preferences),
      }))
      .sort((a, b) => {
        const promoResult = promotionSort(a, b);
        if (promoResult !== 0) return promoResult;
        return (b.matchScore || 0) - (a.matchScore || 0);
      })
      .slice(0, 8),
    [filteredProperties, preferences]
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Buy & Sell Properties in Nigeria" description="Find verified properties for sale and rent across Nigeria. Browse thousands of listings with secure transactions on Xavorian." path="/" />
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Hero" 
            className="w-full h-full object-cover blur-sm scale-110"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center">
          <div className="text-center space-y-4 md:space-y-6 animate-fade-in max-w-5xl w-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white">
              XAVORIAN
            </h1>

            <div className="flex gap-1.5 sm:gap-2 bg-white rounded-full p-1 sm:p-1.5 shadow-2xl w-full max-w-3xl mx-auto">
              <div className="flex-1 relative min-w-0">
                <Search className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 h-8 sm:h-9 md:h-10 pl-8 sm:pl-10 md:pl-12 text-xs sm:text-sm md:text-base rounded-full focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              
              <Button className="rounded-full h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 p-0 bg-primary hover:bg-primary/90 shrink-0">
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              </Button>

              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="rounded-full h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 p-0 border-0 hover:bg-muted shrink-0">
                    <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[380px] p-4 bg-background" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Filters</h3>
                      <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 text-xs">
                        Reset
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium">Price Range</label>
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

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Country</label>
                        <Input
                          placeholder="Country..."
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium">State</label>
                        <Input
                          placeholder="State..."
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium">Town/City</label>
                        <Input
                          placeholder="Town..."
                          value={town}
                          onChange={(e) => setTown(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium">Type</label>
                        <Select value={propertyType || "all"} onValueChange={(value) => setPropertyType(value === "all" ? "" : value)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="house">House</SelectItem>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="villa">Villa</SelectItem>
                            <SelectItem value="land">Land</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium">Bedrooms</label>
                        <Select value={bedrooms || "all"} onValueChange={(value) => setBedrooms(value === "all" ? "" : value)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium">Status</label>
                        <Select value={status || "all"} onValueChange={(value) => setStatus(value === "all" ? "" : value)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button className="w-full h-9" onClick={() => setFilterOpen(false)}>
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-48 mb-6" />
          <PropertySkeleton />
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};
