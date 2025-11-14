import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bed, Bath, Square, MapPin, Heart, Share2, MessageSquare, Shield, X, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChatInterface } from '@/components/ChatInterface';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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
  video_url?: string;
  amenities?: string[];
  condition?: string;
  year_built?: number;
  status: string;
  user_id: string;
  is_verified: boolean;
};

export const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellerName, setSellerName] = useState('Seller');
  const [mediaItems, setMediaItems] = useState<{ type: 'image' | 'video'; url: string }[]>([]);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      
      if (!data) {
        sonnerToast.error('Property not found');
        navigate('/browse');
        return;
      }

      setProperty(data);

      // Fetch seller name
      const { data: sellerData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.user_id)
        .single();

      if (sellerData) {
        setSellerName(sellerData.full_name);
      }

      // Combine images and video into mediaItems
      const items: { type: 'image' | 'video'; url: string }[] = [];
      if (data.images) {
        data.images.forEach((img: string) => items.push({ type: 'image', url: img }));
      }
      if (data.video_url) {
        items.push({ type: 'video', url: data.video_url });
      }
      setMediaItems(items);
    } catch (error: any) {
      console.error('Error fetching property:', error);
      sonnerToast.error('Failed to load property');
      navigate('/browse');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading property...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Property Not Found</h2>
          <Link to="/browse">
            <Button variant="outline">Back to Browse</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? 'Removed from favorites' : 'Added to favorites',
      description: isFavorite ? 'Property removed from your favorites' : 'Property added to your favorites',
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link copied!',
      description: 'Property link copied to clipboard',
    });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link to="/browse" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Browse
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Videos */}
          <div className="lg:col-span-2 space-y-4">
            {/* Main Media Display */}
            {mediaItems.length > 0 && (
              <div className="relative h-[500px] rounded-xl overflow-hidden card-glow">
                {mediaItems[selectedImage]?.type === 'image' ? (
                  <img
                    src={mediaItems[selectedImage].url}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video 
                    controls 
                    className="w-full h-full object-cover"
                    src={mediaItems[selectedImage]?.url}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                  {property.property_type}
                </Badge>
                {property.is_verified && (
                  <Badge className="absolute top-4 right-4 bg-green-500 text-white">
                    Verified
                  </Badge>
                )}
              </div>
            )}

            {/* Thumbnail Gallery */}
            {mediaItems.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {mediaItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`h-24 rounded-lg overflow-hidden border-2 transition-all relative ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    {item.type === 'image' ? (
                      <img src={item.url} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <video src={item.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-xl p-8 card-glow space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Description</h2>
                <p className="text-muted-foreground leading-relaxed">{property.description}</p>
              </div>

              {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border">
                {property.bedrooms > 0 && (
                  <div className="text-center">
                    <Bed className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="font-semibold text-foreground">{property.bedrooms}</p>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                  </div>
                )}
                {property.bathrooms > 0 && (
                  <div className="text-center">
                    <Bath className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="font-semibold text-foreground">{property.bathrooms}</p>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                  </div>
                )}
                {property.area && (
                  <div className="text-center">
                    <Square className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="font-semibold text-foreground">{property.area}</p>
                    <p className="text-sm text-muted-foreground">Sq Ft</p>
                  </div>
                )}
                <div className="text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold text-foreground">{property.address}</p>
                  <p className="text-sm text-muted-foreground">Location</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Price Card */}
              <div className="bg-white rounded-xl p-6 card-glow space-y-6">
                <div>
                  <p className="text-3xl font-bold text-primary mb-2">{formatPrice(property.price)}</p>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    {property.address}
                  </div>
                </div>

                <div className="space-y-3">
                  <Dialog open={showChat} onOpenChange={setShowChat}>
                    <DialogTrigger asChild>
                      <Button variant="hero" className="w-full" size="lg">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Contact Seller
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>Chat with Seller</DialogTitle>
                        <DialogDescription>
                          Connect directly with the property owner
                        </DialogDescription>
                      </DialogHeader>
                      <ChatInterface
                        propertyId={property.id}
                        propertyOwnerId={property.user_id}
                        propertyTitle={property.title}
                      />
                    </DialogContent>
                  </Dialog>
                  <Link to={`/start-escrow/${property.id}`}>
                    <Button variant="default" className="w-full" size="lg">
                      <Shield className="w-5 h-5 mr-2" />
                      Start Escrow
                    </Button>
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={handleFavorite} className="w-full">
                      <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
                      {isFavorite ? 'Saved' : 'Save'}
                    </Button>
                    <Button variant="outline" onClick={handleShare} className="w-full">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>

              {/* Seller Info */}
              <div className="bg-white rounded-xl p-6 card-glow">
                <h3 className="font-semibold text-foreground mb-4">Listed By</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {sellerName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{sellerName}</p>
                    <p className="text-sm text-muted-foreground">Verified Seller</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
