import { useParams, Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PropertyCard } from '@/components/PropertyCard';
import { getLandingPageBySlug } from '@/data/locationData';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';

interface LandingPageProps {
  slug?: string;
}

export const LandingPage = ({ slug: propSlug }: LandingPageProps) => {
  const params = useParams<{ slug: string }>();
  const slug = propSlug || params.slug || '';
  const config = getLandingPageBySlug(slug);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!config) return;
    const fetchProps = async () => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(24);

      if (config.filters.property_type) {
        query = query.ilike('property_type', `%${config.filters.property_type}%`);
      }
      if (config.filters.listing_type) {
        query = query.ilike('listing_type', `%${config.filters.listing_type}%`);
      }
      if (config.filters.state) {
        query = query.ilike('state', `%${config.filters.state}%`);
      }
      if (config.filters.city) {
        query = query.ilike('city', `%${config.filters.city}%`);
      }

      const { data } = await query;
      setProperties(data || []);
      setLoading(false);
    };
    fetchProps();
  }, [slug]);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">Page Not Found</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={config.metaTitle.replace(' | Xavorian', '')}
        description={config.metaDescription}
        path={`/${config.slug}`}
      />

      <div className="bg-gradient-to-br from-primary/10 via-background to-accent-purple/10 py-16">
        <div className="container mx-auto px-4">
          <BreadcrumbNav items={[
            { label: 'Home', href: '/' },
            { label: 'Properties', href: '/browse' },
            { label: config.h1 },
          ]} />
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{config.h1}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">{config.description}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-12">
        <section>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
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
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">No matching properties found yet.</p>
              <Link to="/browse" className="text-primary hover:underline">Browse all properties →</Link>
            </div>
          )}
        </section>

        {config.locationLinks.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Explore Related Areas</h2>
            <div className="flex flex-wrap gap-3">
              {config.locationLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm hover:border-primary/50 transition-colors"
                >
                  {link.label} <ArrowRight className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
