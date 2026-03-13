import { useParams, Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PropertyCard } from '@/components/PropertyCard';
import { getCityBySlug, getAreaBySlug } from '@/data/locationData';
import { Skeleton } from '@/components/ui/skeleton';

export const LocationArea = () => {
  const { city, area } = useParams<{ city: string; area: string }>();
  const cityData = getCityBySlug(city || '');
  const areaData = getAreaBySlug(city || '', area || '');
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!areaData || !cityData) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'published')
        .or(`city.ilike.%${areaData.name}%,street.ilike.%${areaData.name}%,address.ilike.%${areaData.name}%`)
        .order('created_at', { ascending: false })
        .limit(20);
      setProperties(data || []);
      setLoading(false);
    };
    fetch();
  }, [city, area]);

  if (!cityData || !areaData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Area Not Found</h1>
          <Link to="/browse" className="text-primary hover:underline">Browse all properties</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`Properties in ${areaData.name}, ${cityData.name} | Verified Listings`}
        description={`Find verified properties in ${areaData.name}, ${cityData.name}. ${areaData.description.slice(0, 120)}`}
        path={`/location/${cityData.slug}/${areaData.slug}`}
      />

      <div className="bg-gradient-to-br from-primary/10 via-background to-accent-purple/10 py-16">
        <div className="container mx-auto px-4">
          <BreadcrumbNav items={[
            { label: 'Home', href: '/' },
            { label: 'Locations', href: '/browse' },
            { label: cityData.name, href: `/location/${cityData.slug}` },
            { label: areaData.name },
          ]} />
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Properties in <span className="text-primary">{areaData.name}</span>, {cityData.name}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">{areaData.description}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-12">
        <section>
          <h2 className="text-2xl font-bold mb-6">Listings in {areaData.name}</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[4/3] rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
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
            <p className="text-muted-foreground">No listings in {areaData.name} yet. <Link to="/upload-listing" className="text-primary hover:underline">Be the first to list</Link>.</p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">More in {cityData.name}</h2>
          <div className="flex flex-wrap gap-3">
            {cityData.areas.filter(a => a.slug !== areaData.slug).map(a => (
              <Link
                key={a.slug}
                to={`/location/${cityData.slug}/${a.slug}`}
                className="px-4 py-2 bg-card border border-border rounded-lg text-sm hover:border-primary/50 transition-colors"
              >
                {a.name}
              </Link>
            ))}
            <Link
              to={`/location/${cityData.slug}`}
              className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary font-medium hover:bg-primary/20 transition-colors"
            >
              All {cityData.name} →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};
