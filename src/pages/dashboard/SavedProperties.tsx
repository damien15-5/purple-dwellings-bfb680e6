import { useState, memo, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Eye, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const SavedProperties = () => {
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSavedProperties();
  }, []);

  const loadSavedProperties = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // For non-logged in users, load from localStorage only
        const localSaved = await loadFromLocalStorage();
        setSavedProperties(localSaved);
        setLoading(false);
        return;
      }

      // Load from database first (faster)
      const { data } = await supabase
        .from('saved_properties')
        .select(`
          id,
          created_at,
          property:properties(
            id,
            title,
            address,
            price,
            images
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setSavedProperties(data || []);
      setLoading(false);

      // Sync localStorage in background
      syncLocalStorage(user.id);
    } catch (error) {
      console.error('Error loading saved properties:', error);
      setLoading(false);
    }
  };

  const loadFromLocalStorage = async () => {
    const saved: any[] = [];
    const propertyIds: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('saved_')) {
        propertyIds.push(key.replace('saved_', ''));
      }
    }

    if (propertyIds.length === 0) return [];

    const { data } = await supabase
      .from('properties')
      .select('id, title, address, price, images')
      .in('id', propertyIds)
      .eq('status', 'published');

    return (data || []).map(property => ({
      id: `saved_${property.id}`,
      property,
      created_at: new Date().toISOString()
    }));
  };

  const syncLocalStorage = async (userId: string) => {
    const propertyIds: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('saved_')) {
        propertyIds.push(key.replace('saved_', ''));
      }
    }

    if (propertyIds.length > 0) {
      // Insert saved properties from localStorage to database
      await supabase
        .from('saved_properties')
        .upsert(
          propertyIds.map(id => ({ user_id: userId, property_id: id })),
          { onConflict: 'user_id,property_id', ignoreDuplicates: true }
        );
    }
  };

  const handleRemove = async (savedId: string, propertyId?: string) => {
    try {
      // Remove from localStorage if it's a local save
      if (savedId.startsWith('saved_')) {
        localStorage.removeItem(savedId);
      } else {
        // Remove from database
        const { error } = await supabase
          .from('saved_properties')
          .delete()
          .eq('id', savedId);

        if (error) throw error;
      }

      // Also remove from localStorage by property ID
      if (propertyId) {
        localStorage.removeItem(`saved_${propertyId}`);
      }

      toast({
        title: 'Success',
        description: 'Property removed from saved list',
      });

      loadSavedProperties();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove property',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Saved Properties</h1>
        <p className="text-muted-foreground">Properties you've saved for later</p>
      </div>

      {savedProperties.length === 0 ? (
        <Card className="card-glow">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Heart className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Saved Properties</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              You haven't saved any properties yet. Browse listings and save your favorites!
            </p>
            <Link to="/browse">
              <Button variant="hero">Browse Properties</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedProperties.map((saved) => (
            <PropertyCardMemo key={saved.id} saved={saved} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
};

const PropertyCardMemo = memo(({ saved, onRemove }: { saved: any; onRemove: (id: string, propertyId?: string) => void }) => {
  const property = saved.property;
  if (!property) return null;

  return (
    <Card className="card-glow hover-lift overflow-hidden group">
      <div className="relative h-48 overflow-hidden">
        <img
          src={property.images?.[0] || '/placeholder.svg'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/90 hover:bg-white"
          onClick={() => onRemove(saved.id, property.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.title}</h3>
        <p className="text-muted-foreground text-sm flex items-center gap-1 mb-3">
          <MapPin className="h-4 w-4" />
          {property.address}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-accent-purple">
            ₦{property.price?.toLocaleString()}
          </span>
          <Link to={`/property/${property.id}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              View
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
});
