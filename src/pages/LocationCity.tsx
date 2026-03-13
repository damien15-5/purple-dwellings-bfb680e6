import { useParams, Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PropertyCard } from '@/components/PropertyCard';
import { getCityBySlug } from '@/data/locationData';
import { MapPin, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const LocationCity = () => {
  const { city } = useParams<{ city: string }>();
  const cityData = getCityBySlug(city || '');
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cityData) return;
    const fetchProperties = async () => {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'published')
        .ilike('city', `%${cityData.name}%`)
        .order('created_at', { ascending: false })
        .limit(20);
      setProperties(data || []);
      setLoading(false);
    };
    fetchProperties();
  }, [city]);

  if (!cityData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Location Not Found</h1>
          <Link to="/browse" className="text-primary hover:underline">Browse all properties</Link>
        </div>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Xavorian – Real Estate in ${cityData.name}`,
    url: `https://www.xavorian.xyz/location/${cityData.slug}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: cityData.name,
      addressRegion: cityData.state,
      addressCountry: 'NG',
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`Real Estate in ${cityData.name}, ${cityData.state} | Verified Listings`}
        description={`Browse verified property listings in ${cityData.name}, ${cityData.state}. Rent, buy or sell scam-free on Xavorian.`}
        path={`/location/${cityData.slug}`}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="bg-gradient-to-br from-primary/10 via-background to-accent-purple/10 py-16">
        <div className="container mx-auto px-4">
          <BreadcrumbNav items={[
            { label: 'Home', href: '/' },
            { label: 'Locations', href: '/browse' },
            { label: cityData.name },
          ]} />
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Real Estate in <span className="text-primary">{cityData.name}</span>, {cityData.state}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">{cityData.description}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-16">
        {/* Listings */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Verified Listings in {cityData.name}</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[4/3] rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {properties.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={{
                    id: p.id,
                    title: p.title,
                    location: p.address,
                    price: p.price,
                    bedrooms: p.bedrooms || 0,
                    bathrooms: p.bathrooms || 0,
                    sqft: p.area || 0,
                    propertyType: p.property_type || 'House',
                    images: p.images || ['/placeholder.svg'],
                    description: p.description,
                    seller: { id: 1, name: 'Seller' },
                    status: p.status || 'published',
                    isVerified: p.is_verified,
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No properties listed in {cityData.name} yet. <Link to="/upload-listing" className="text-primary hover:underline">List yours now</Link>.</p>
          )}
        </section>

        {/* Popular Areas */}
        {cityData.areas.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Popular Areas in {cityData.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {cityData.areas.map((area) => (
                <Link
                  key={area.slug}
                  to={`/location/${cityData.slug}/${area.slug}`}
                  className="group bg-card rounded-xl p-6 border border-border hover:border-primary/50 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{area.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{area.description}</p>
                  <span className="inline-flex items-center gap-1 text-sm text-primary mt-3 font-medium">
                    View listings <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Average Prices */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Average Property Prices in {cityData.name}</h2>
          <p className="text-muted-foreground">
            Property prices in {cityData.name} vary significantly by area and property type. Browse our listings above for current market prices, or <Link to="/browse" className="text-primary hover:underline">search all properties</Link> to compare.
          </p>
        </section>

        {/* Verified Agents */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Verified Agents in {cityData.name}</h2>
          <p className="text-muted-foreground">
            Find <Link to="/agents" className="text-primary hover:underline">KYC-verified agents</Link> operating in {cityData.name} for a safer transaction experience.
          </p>
        </section>
      </div>
    </div>
  );
};
