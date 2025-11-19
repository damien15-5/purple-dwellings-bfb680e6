import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PropertyCard } from '@/components/home/PropertyCard';

export const SellerProperties = () => {
  const { sellerId } = useParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerName, setSellerName] = useState('');

  useEffect(() => {
    fetchSellerProperties();
  }, [sellerId]);

  const fetchSellerProperties = async () => {
    try {
      // Fetch seller info
      const { data: sellerData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', sellerId)
        .single();

      if (sellerData) {
        setSellerName(sellerData.full_name);
      }

      // Fetch properties
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', sellerId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <Link to="/browse" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Browse
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Properties by {sellerName}
          </h1>
          <p className="text-muted-foreground">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} listed
          </p>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No properties found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                title={property.title}
                price={property.price}
                location={property.address}
                image={property.images?.[0] || '/placeholder.svg'}
                type={property.property_type}
                status={property.status}
                bedrooms={property.bedrooms}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
