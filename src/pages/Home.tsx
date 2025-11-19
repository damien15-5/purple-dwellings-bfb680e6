import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import heroImage from '@/assets/hero-house.jpg';
import { SearchFilterBar } from '@/components/home/SearchFilterBar';
import { FeaturedPropertiesSection } from '@/components/home/FeaturedPropertiesSection';
import { LocalitySection } from '@/components/home/LocalitySection';
import { ExploreMoreSection } from '@/components/home/ExploreMoreSection';
import { RecommendationsSection } from '@/components/home/RecommendationsSection';

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
};

// Enhanced dummy data with engagement metrics
const allProperties: Property[] = [
  { id: '1', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', price: 45000000, location: 'Lekki, Lagos', title: 'Modern 3-Bedroom House', bedrooms: 3, type: 'House', status: 'Published', views: 1250, clicks: 89, matchScore: 95 },
  { id: '2', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', price: 120000000, location: 'Victoria Island, Lagos', title: 'Luxury 4-Bedroom Villa', bedrooms: 4, type: 'Villa', status: 'Published', views: 2150, clicks: 145, matchScore: 88 },
  { id: '3', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', price: 28000000, location: 'Ikeja, Lagos', title: 'Cozy 2-Bedroom Apartment', bedrooms: 2, type: 'Apartment', status: 'Published', views: 980, clicks: 67, matchScore: 75 },
  { id: '4', image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', price: 85000000, location: 'Ikoyi, Lagos', title: 'Spacious 5-Bedroom Duplex', bedrooms: 5, type: 'Duplex', status: 'Published', views: 1890, clicks: 123, matchScore: 82 },
  { id: '5', image: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800', price: 32000000, location: 'Yaba, Lagos', title: 'Elegant 3-Bedroom Flat', bedrooms: 3, type: 'Apartment', status: 'Published', views: 1120, clicks: 78, matchScore: 91 },
  { id: '6', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', price: 95000000, location: 'Banana Island, Lagos', title: 'Premium 4-Bedroom Mansion', bedrooms: 4, type: 'House', status: 'Published', views: 3200, clicks: 210, matchScore: 70 },
  { id: '7', image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800', price: 52000000, location: 'Surulere, Lagos', title: 'Contemporary 3-Bedroom House', bedrooms: 3, type: 'House', status: 'Pending', views: 890, clicks: 54, matchScore: 85 },
  { id: '8', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', price: 38000000, location: 'Ajah, Lagos', title: 'Modern 2-Bedroom Apartment', bedrooms: 2, type: 'Apartment', status: 'Published', views: 1450, clicks: 95, matchScore: 78 },
  { id: '9', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', price: 150000000, location: 'Ikoyi, Lagos', title: 'Luxury 5-Bedroom Villa', bedrooms: 5, type: 'Villa', status: 'Published', views: 2890, clicks: 167, matchScore: 65 },
  { id: '10', image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800', price: 42000000, location: 'Gbagada, Lagos', title: '3-Bedroom Detached House', bedrooms: 3, type: 'House', status: 'Published', views: 1340, clicks: 88, matchScore: 92 },
  { id: '11', image: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800', price: 65000000, location: 'Lekki Phase 1, Lagos', title: '4-Bedroom Terrace Duplex', bedrooms: 4, type: 'Duplex', status: 'Sold', views: 2100, clicks: 134, matchScore: 73 },
  { id: '12', image: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?w=800', price: 29000000, location: 'Magodo, Lagos', title: 'Stylish 2-Bedroom Flat', bedrooms: 2, type: 'Apartment', status: 'Published', views: 1050, clicks: 71, matchScore: 89 },
  { id: '13', image: 'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800', price: 78000000, location: 'Lekki, Lagos', title: 'Executive 4-Bedroom House', bedrooms: 4, type: 'House', status: 'Published', views: 1680, clicks: 112, matchScore: 86 },
  { id: '14', image: 'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800', price: 55000000, location: 'Victoria Island, Lagos', title: 'Modern 3-Bedroom Penthouse', bedrooms: 3, type: 'Apartment', status: 'Published', views: 1920, clicks: 128, matchScore: 81 },
  { id: '15', image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800', price: 110000000, location: 'Ikoyi, Lagos', title: 'Waterfront 5-Bedroom Villa', bedrooms: 5, type: 'Villa', status: 'Published', views: 2650, clicks: 178, matchScore: 68 },
];

export const Home = () => {
  const [priceRange, setPriceRange] = useState([0, 200000000]);
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyViews, setPropertyViews] = useState<Record<string, number>>({});

  const handleReset = () => {
    setPriceRange([0, 200000000]);
    setLocation('');
    setPropertyType('');
    setBedrooms('');
    setStatus('');
    setSearchTerm('');
  };

  const handlePropertyView = (id: string) => {
    setPropertyViews(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  // Apply filters
  const filteredProperties = allProperties.filter(property => {
    const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];
    const matchesLocation = !location || property.location.toLowerCase().includes(location.toLowerCase());
    const matchesType = !propertyType || property.type === propertyType;
    const matchesBedrooms = !bedrooms || property.bedrooms.toString() === bedrooms;
    const matchesStatus = !status || property.status === status;
    const matchesSearch = !searchTerm || 
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      property.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesPrice && matchesLocation && matchesType && matchesBedrooms && matchesStatus && matchesSearch;
  });

  // Featured: Sort by clicks (engagement)
  const featuredProperties = [...filteredProperties]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 6);

  // Locality: Properties near user (dummy logic - filter by Lagos)
  const localityProperties = filteredProperties
    .filter(p => p.location.includes('Lagos'))
    .slice(0, 8);

  // Explore More: Random selection
  const exploreMoreProperties = [...filteredProperties]
    .sort(() => Math.random() - 0.5)
    .slice(0, 9);

  // Recommendations: Sort by match score
  const recommendedProperties = [...filteredProperties]
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section 
        className="relative h-[600px] bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-fade-in">
            Find Your Dream Property
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl animate-fade-in">
            Discover the perfect home, apartment, or investment property with our extensive listings
          </p>
          
          {/* Quick Search */}
          <div className="w-full max-w-2xl bg-white rounded-lg p-4 shadow-2xl animate-scale-in">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search by location or property name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 text-base"
                />
              </div>
              <Link to="/browse">
                <Button className="gap-2 h-12 px-6">
                  <Search className="h-5 w-5" />
                  Search
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        location={location}
        setLocation={setLocation}
        propertyType={propertyType}
        setPropertyType={setPropertyType}
        bedrooms={bedrooms}
        setBedrooms={setBedrooms}
        status={status}
        setStatus={setStatus}
        onReset={handleReset}
      />

      {/* Featured Properties Section */}
      <FeaturedPropertiesSection 
        properties={featuredProperties}
        onPropertyView={handlePropertyView}
      />

      {/* Around Your Locality Section */}
      <LocalitySection 
        properties={localityProperties}
        userLocation="Lagos"
        onPropertyView={handlePropertyView}
      />

      {/* Personalized Recommendations Section */}
      <RecommendationsSection 
        properties={recommendedProperties}
        onPropertyView={handlePropertyView}
      />

      {/* Explore More Section */}
      <ExploreMoreSection 
        properties={exploreMoreProperties}
        onPropertyView={handlePropertyView}
      />
    </div>
  );
};