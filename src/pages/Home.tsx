import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/PropertyCard';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-house.jpg';

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
};

export const Home = () => {
  const [searchLocation, setSearchLocation] = useState('');
  const [houses, setHouses] = useState<Property[]>([]);
  const [lands, setLands] = useState<Property[]>([]);
  const [shops, setShops] = useState<Property[]>([]);
  const [apartments, setApartments] = useState<Property[]>([]);
  const [rentals, setRentals] = useState<Property[]>([]);
  const [heroScrolled, setHeroScrolled] = useState(false);

  useEffect(() => {
    fetchProperties();

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setHeroScrolled(true);
      } else {
        setHeroScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(25);

      if (error) throw error;

      const categorized = {
        houses: data?.filter(p => p.property_type?.toLowerCase() === 'house').slice(0, 5) || [],
        lands: data?.filter(p => p.property_type?.toLowerCase() === 'land').slice(0, 5) || [],
        shops: data?.filter(p => p.property_type?.toLowerCase() === 'shop').slice(0, 5) || [],
        apartments: data?.filter(p => p.property_type?.toLowerCase() === 'apartment').slice(0, 5) || [],
        rentals: data?.filter(p => p.property_type?.toLowerCase() === 'rental').slice(0, 5) || [],
      };

      setHouses(categorized.houses);
      setLands(categorized.lands);
      setShops(categorized.shops);
      setApartments(categorized.apartments);
      setRentals(categorized.rentals);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
    }
  };

  const scrollCategory = (containerId: string, direction: 'left' | 'right') => {
    const container = document.getElementById(containerId);
    if (container) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSearch = () => {
    if (searchLocation.trim()) {
      window.location.href = `/browse?search=${encodeURIComponent(searchLocation)}`;
    } else {
      window.location.href = '/browse';
    }
  };

  const CategorySection = ({ title, properties, categoryId }: { title: string; properties: Property[]; categoryId: string }) => {
    if (properties.length === 0) return null;

    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-foreground">{title}</h2>
            <Link to={`/browse?type=${title.toLowerCase()}`}>
              <Button variant="ghost" className="text-primary hover:text-primary-dark">
                View all {title} →
              </Button>
            </Link>
          </div>

          <div className="relative">
            <button
              onClick={() => scrollCategory(categoryId, 'left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div
              id={categoryId}
              className="flex overflow-x-auto gap-6 pb-4 hide-scrollbar scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {properties.map((property) => (
                <div key={property.id} className="flex-none w-[320px]">
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
                      seller: { id: 1, name: 'Seller' },
                      status: 'published',
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => scrollCategory(categoryId, 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className={`relative flex items-center justify-center overflow-hidden transition-all duration-500 ${
          heroScrolled ? 'h-[300px]' : 'h-[50vh]'
        }`}
      >
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Beautiful houses"
            className="w-full h-full object-cover blur-sm"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          {/* Logo/Brand Name */}
          <h1 className={`font-bold text-white mb-8 transition-all duration-500 ${
            heroScrolled ? 'text-4xl' : 'text-6xl md:text-7xl'
          }`}>
            Xavorian
          </h1>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto bg-white rounded-full shadow-2xl p-2 flex items-center gap-2">
            <div className="flex-1 flex items-center px-6">
              <Search className="w-5 h-5 text-muted-foreground mr-3" />
              <Input
                type="text"
                placeholder="Search destinations..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="border-0 focus-visible:ring-0 text-base"
              />
            </div>
            <Button
              onClick={handleSearch}
              size="lg"
              className="rounded-full bg-gradient-to-r from-primary to-accent-purple hover:from-primary-dark hover:to-accent-purple-dark px-8"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-2"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <div className="bg-background">
        <CategorySection title="Houses" properties={houses} categoryId="houses-scroll" />
        <CategorySection title="Lands" properties={lands} categoryId="lands-scroll" />
        <CategorySection title="Shops" properties={shops} categoryId="shops-scroll" />
        <CategorySection title="Apartments" properties={apartments} categoryId="apartments-scroll" />
        <CategorySection title="Rentals" properties={rentals} categoryId="rentals-scroll" />
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};