import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bed, Bath, Square, MapPin, Heart, Share2, MessageSquare, Play, ChevronLeft, ChevronRight, Eye, Car, Wifi, Dumbbell, Waves, ShieldCheck, Zap, Droplets, AirVent, Trees } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

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
  location_link?: string;
  listing_type?: string;
  furnishing_status?: string;
  flooring_type?: string;
  kitchen_type?: string;
  toilets?: number;
  kitchens?: number;
  parking_spaces?: number;
  has_balcony?: boolean;
  has_wardrobes?: boolean;
  has_pop_ceiling?: boolean;
  has_water_supply?: boolean;
  has_power_supply?: boolean;
  has_security?: boolean;
  has_cctv?: boolean;
  has_gatehouse?: boolean;
  has_swimming_pool?: boolean;
  has_gym?: boolean;
  has_elevator?: boolean;
  has_accessibility?: boolean;
  is_pet_friendly?: boolean;
  has_internet?: boolean;
  has_playground?: boolean;
  has_air_conditioning?: boolean;
  has_water_heater?: boolean;
  daily_price?: number;
  weekly_price?: number;
  monthly_price?: number;
  service_fee?: number;
  agency_fee?: number;
  agreement_fee?: number;
  land_size?: number;
  rent_duration?: string;
  title_type?: string;
  city?: string;
  state?: string;
  street?: string;
};

export const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellerName, setSellerName] = useState('Seller');
  const [sellerAvatar, setSellerAvatar] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState<{ type: 'image' | 'video'; url: string }[]>([]);
  const [isPaidFor, setIsPaidFor] = useState(false);

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

      // Fetch seller info
      const { data: sellerData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', data.user_id)
        .single();

      if (sellerData) {
        setSellerName(sellerData.full_name);
        setSellerAvatar(sellerData.avatar_url);
      }

      // Check if property is saved
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const savedInDb = await supabase
          .from('saved_properties')
          .select('id')
          .eq('user_id', user.id)
          .eq('property_id', data.id)
          .maybeSingle();
        
        const savedInLocal = localStorage.getItem(`saved_${data.id}`) === 'true';
        setIsFavorite(!!savedInDb.data || savedInLocal);
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

  const handleFavorite = async () => {
    if (!property) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!isFavorite) {
      // Save to localStorage
      localStorage.setItem(`saved_${property.id}`, 'true');
      
      // Try to save to database if user is logged in
      if (user) {
        await supabase
          .from('saved_properties')
          .insert({
            user_id: user.id,
            property_id: property.id
          });
      }
      
      setIsFavorite(true);
      toast({
        title: 'Saved to favorites',
        description: 'Property saved to your dashboard',
      });
    } else {
      // Remove from localStorage
      localStorage.removeItem(`saved_${property.id}`);
      
      // Remove from database if user is logged in
      if (user) {
        await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', property.id);
      }
      
      setIsFavorite(false);
      toast({
        title: 'Removed from favorites',
        description: 'Property removed from your favorites',
      });
    }
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
              <div className="relative h-[250px] sm:h-[350px] md:h-[400px] lg:h-[500px] rounded-xl overflow-hidden card-glow bg-black">
                {mediaItems[selectedImage]?.type === 'image' ? (
                  <img
                    src={mediaItems[selectedImage].url}
                    alt={property.title}
                    className="w-full h-full object-contain md:object-cover"
                  />
                ) : (
                  <video 
                    controls 
                    className="w-full h-full object-contain md:object-cover"
                    src={mediaItems[selectedImage]?.url}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
                <Badge className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-primary text-primary-foreground text-xs sm:text-sm">
                  {property.property_type}
                </Badge>
                {property.is_verified && (
                  <Badge className="absolute top-2 left-28 sm:top-4 sm:left-40 bg-emerald-600/90 backdrop-blur-sm text-white border-0 text-xs sm:text-sm gap-1">
                    <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Verified Seller
                  </Badge>
                )}
              </div>
            )}

            {/* Thumbnail Carousel */}
            {mediaItems.length > 1 && (
              <div className="relative px-8 sm:px-12">
                <Carousel
                  opts={{
                    align: "start",
                    loop: false,
                  }}
                  className="w-full"
                >
                  <CarouselContent>
                    {mediaItems.map((item, index) => (
                      <CarouselItem key={index} className="basis-1/3 sm:basis-1/4">
                        <button
                          onClick={() => setSelectedImage(index)}
                          className={`h-16 sm:h-20 md:h-24 rounded-lg overflow-hidden border-2 transition-all relative w-full ${
                            selectedImage === index ? 'border-primary' : 'border-transparent'
                          }`}
                        >
                          {item.type === 'image' ? (
                            <img src={item.url} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <video src={item.url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                              </div>
                            </>
                          )}
                        </button>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="absolute -left-2 sm:-left-4 h-7 w-7 sm:h-8 sm:w-8" />
                  <CarouselNext className="absolute -right-2 sm:-right-4 h-7 w-7 sm:h-8 sm:w-8" />
                </Carousel>
              </div>
            )}

            {/* Property specs and breakdown */}
            <div className="bg-white rounded-xl p-8 card-glow space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <p className="font-semibold text-foreground text-xs">{property.address}</p>
                  <p className="text-sm text-muted-foreground">Location</p>
                </div>
              </div>

              {/* View Full Breakdown */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2">
                    <Eye className="w-4 h-4" />
                    View Full Breakdown
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl">{property.title} — Full Details</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    {/* Description */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Description</h3>
                      <p className="text-muted-foreground leading-relaxed">{property.description}</p>
                    </div>

                    {/* Basic Info */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Property Info</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Type:</span> {property.property_type}</div>
                        {property.listing_type && <div><span className="text-muted-foreground">Listing:</span> {property.listing_type}</div>}
                        {property.condition && <div><span className="text-muted-foreground">Condition:</span> {property.condition}</div>}
                        {property.year_built && <div><span className="text-muted-foreground">Year Built:</span> {property.year_built}</div>}
                        {property.furnishing_status && <div><span className="text-muted-foreground">Furnishing:</span> {property.furnishing_status}</div>}
                        {property.flooring_type && <div><span className="text-muted-foreground">Flooring:</span> {property.flooring_type}</div>}
                        {property.kitchen_type && <div><span className="text-muted-foreground">Kitchen:</span> {property.kitchen_type}</div>}
                        {property.title_type && <div><span className="text-muted-foreground">Title:</span> {property.title_type}</div>}
                        {property.rent_duration && <div><span className="text-muted-foreground">Rent Duration:</span> {property.rent_duration}</div>}
                        {property.land_size && <div><span className="text-muted-foreground">Land Size:</span> {property.land_size} sqm</div>}
                      </div>
                    </div>

                    {/* Rooms & Spaces */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Rooms & Spaces</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        {property.bedrooms > 0 && <div>🛏️ {property.bedrooms} Bedrooms</div>}
                        {property.bathrooms > 0 && <div>🚿 {property.bathrooms} Bathrooms</div>}
                        {(property.toilets ?? 0) > 0 && <div>🚽 {property.toilets} Toilets</div>}
                        {(property.kitchens ?? 0) > 0 && <div>🍳 {property.kitchens} Kitchens</div>}
                        {(property.parking_spaces ?? 0) > 0 && <div>🅿️ {property.parking_spaces} Parking</div>}
                        {property.area && <div>📐 {property.area} sqm</div>}
                      </div>
                    </div>

                    {/* Pricing */}
                    {(property.daily_price || property.weekly_price || property.monthly_price || property.service_fee || property.agency_fee || property.agreement_fee) && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Pricing Details</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {property.daily_price && <div><span className="text-muted-foreground">Daily:</span> {formatPrice(property.daily_price)}</div>}
                          {property.weekly_price && <div><span className="text-muted-foreground">Weekly:</span> {formatPrice(property.weekly_price)}</div>}
                          {property.monthly_price && <div><span className="text-muted-foreground">Monthly:</span> {formatPrice(property.monthly_price)}</div>}
                          {property.service_fee && <div><span className="text-muted-foreground">Service Fee:</span> {formatPrice(property.service_fee)}</div>}
                          {property.agency_fee && <div><span className="text-muted-foreground">Agency Fee:</span> {formatPrice(property.agency_fee)}</div>}
                          {property.agreement_fee && <div><span className="text-muted-foreground">Agreement Fee:</span> {formatPrice(property.agreement_fee)}</div>}
                        </div>
                      </div>
                    )}

                    {/* Amenities */}
                    {property.amenities && property.amenities.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                          {property.amenities.map((amenity) => (
                            <Badge key={amenity} variant="secondary">{amenity}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Features */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Features</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {property.has_balcony && <div className="flex items-center gap-2">✅ Balcony</div>}
                        {property.has_wardrobes && <div className="flex items-center gap-2">✅ Wardrobes</div>}
                        {property.has_pop_ceiling && <div className="flex items-center gap-2">✅ POP Ceiling</div>}
                        {property.has_water_supply && <div className="flex items-center gap-2">✅ Water Supply</div>}
                        {property.has_power_supply && <div className="flex items-center gap-2">✅ Power Supply</div>}
                        {property.has_security && <div className="flex items-center gap-2">✅ Security</div>}
                        {property.has_cctv && <div className="flex items-center gap-2">✅ CCTV</div>}
                        {property.has_gatehouse && <div className="flex items-center gap-2">✅ Gatehouse</div>}
                        {property.has_swimming_pool && <div className="flex items-center gap-2">✅ Swimming Pool</div>}
                        {property.has_gym && <div className="flex items-center gap-2">✅ Gym</div>}
                        {property.has_elevator && <div className="flex items-center gap-2">✅ Elevator</div>}
                        {property.has_accessibility && <div className="flex items-center gap-2">✅ Accessibility</div>}
                        {property.is_pet_friendly && <div className="flex items-center gap-2">✅ Pet Friendly</div>}
                        {property.has_internet && <div className="flex items-center gap-2">✅ Internet</div>}
                        {property.has_playground && <div className="flex items-center gap-2">✅ Playground</div>}
                        {property.has_air_conditioning && <div className="flex items-center gap-2">✅ Air Conditioning</div>}
                        {property.has_water_heater && <div className="flex items-center gap-2">✅ Water Heater</div>}
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Location</h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{property.address}</p>
                        {property.street && <p>Street: {property.street}</p>}
                        {property.city && <p>City: {property.city}</p>}
                        {property.state && <p>State: {property.state}</p>}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Google Map */}
            {property.location_link && (
              <div className="bg-white rounded-xl p-6 card-glow">
                <h2 className="text-xl font-bold text-foreground mb-4">Location on Map</h2>
                {property.location_link.includes('iframe') ? (
                  <div className="rounded-lg overflow-hidden" dangerouslySetInnerHTML={{ __html: property.location_link }} />
                ) : (
                  <a
                    href={property.location_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <MapPin className="w-5 h-5" />
                    View on Google Maps
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Price Card */}
              <div className="bg-white rounded-xl p-6 card-glow space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">{property.title}</h1>
                  <p className="text-3xl font-bold text-foreground mb-2">{formatPrice(property.price)}</p>
                  <div className="flex items-center text-primary text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    {property.address}
                  </div>
                </div>

                {/* Blurred Action Buttons */}
                <div className="space-y-2.5">
                  <Button 
                    onClick={async () => {
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) {
                        toast({
                          title: 'Login Required',
                          description: 'Please log in to message the seller',
                        });
                        navigate('/login');
                        return;
                      }
                      navigate(`/chat/${property.id}`);
                    }}
                    className="w-full relative overflow-hidden group bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary hover:to-primary text-white shadow-xl hover:shadow-2xl transition-all duration-300 border-0" 
                    size="lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <MessageSquare className="w-5 h-5 mr-2 relative z-10" />
                    <span className="relative z-10 font-semibold">Message Seller</span>
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
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

              {/* Seller Info */}
              <div className="bg-white rounded-xl p-6 card-glow">
                <h3 className="font-semibold text-foreground mb-4">Listed By</h3>
                <Link 
                  to={`/seller/${property.user_id}`}
                  className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={sellerAvatar || undefined} alt={sellerName} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white">
                      {sellerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground hover:text-primary transition-colors">
                      {sellerName}
                    </p>
                    <p className="text-sm text-muted-foreground">View all properties</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
