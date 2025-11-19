import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Eye, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SavedProperties = () => {
  const [savedProperties] = useState<any[]>([]);

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
          {savedProperties.map((property) => (
            <Card key={property.id} className="card-glow hover-lift overflow-hidden group">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={property.images?.[0] || '/placeholder.svg'}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white"
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
          ))}
        </div>
      )}
    </div>
  );
};
