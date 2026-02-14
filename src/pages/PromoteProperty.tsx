import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Star, ArrowRight, ArrowLeft, CheckCircle, Loader2, Sparkles } from 'lucide-react';

type UserProperty = {
  id: string;
  title: string;
  price: number;
  images: string[];
  city: string;
  state: string;
  address: string;
};

type PromotionConfig = {
  propertyId: string;
  days: number;
  cost: number;
};

const PRICE_PER_DAY = 1000;
const MIN_DAYS = 1;
const MAX_DAYS = 30;

export const PromoteProperty = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: select properties, 2: set durations, 3: summary & pay
  const [myProperties, setMyProperties] = useState<UserProperty[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [promotionConfigs, setPromotionConfigs] = useState<PromotionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadMyProperties();
  }, []);

  const loadMyProperties = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }

    const { data } = await supabase
      .from('properties')
      .select('id, title, price, images, city, state, address')
      .eq('user_id', user.id)
      .eq('status', 'published');

    setMyProperties(data || []);
    setLoading(false);
  };

  const toggleProperty = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const goToStep2 = () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one property to promote');
      return;
    }
    setPromotionConfigs(
      selectedIds.map(id => ({ propertyId: id, days: 1, cost: PRICE_PER_DAY }))
    );
    setStep(2);
  };

  const updateDays = (propertyId: string, days: number) => {
    // Round to whole days
    const roundedDays = Math.max(MIN_DAYS, Math.round(days));
    setPromotionConfigs(prev =>
      prev.map(c =>
        c.propertyId === propertyId
          ? { ...c, days: roundedDays, cost: roundedDays * PRICE_PER_DAY }
          : c
      )
    );
  };

  const totalCost = promotionConfigs.reduce((sum, c) => sum + c.cost, 0);

  const handlePay = async () => {
    setPaying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create promotion records with pending status
      const promotions = promotionConfigs.map(c => ({
        property_id: c.propertyId,
        user_id: user.id,
        promotion_id: `PROMO-${c.propertyId.substring(0, 6)}-${Date.now()}`,
        days_promoted: c.days,
        amount_paid: c.cost,
        is_active: false, // Will activate after payment
        expires_at: new Date(Date.now() + c.days * 24 * 60 * 60 * 1000).toISOString(),
      }));

      const { data: inserted, error: insertError } = await supabase
        .from('property_promotions')
        .insert(promotions)
        .select();

      if (insertError) throw insertError;

      // Initialize Paystack payment via edge function
      const promotionIds = inserted.map(p => p.id);
      const response = await supabase.functions.invoke('initialize-promotion-payment', {
        body: { promotionIds, totalAmount: totalCost },
      });

      if (response.error || !response.data?.success) {
        throw new Error(response.data?.error || 'Payment initialization failed');
      }

      // Redirect to Paystack
      window.location.href = response.data.authorization_url;
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to initialize payment');
      setPaying(false);
    }
  };

  const getProperty = (id: string) => myProperties.find(p => p.id === id);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-1 rounded-full ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Promote Your Properties
          </h1>
          <p className="text-muted-foreground mt-1">
            {step === 1 && 'Select properties to promote'}
            {step === 2 && 'Set promotion duration for each property'}
            {step === 3 && 'Review and pay'}
          </p>
        </div>

        {/* Step 1: Select Properties */}
        {step === 1 && (
          <div className="space-y-4">
            {myProperties.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">You don't have any published listings to promote.</p>
                  <Button onClick={() => navigate('/upload-listing')}>Upload a Listing</Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {selectedIds.length} of {myProperties.length} selected
                </p>
                {myProperties.map(property => (
                  <Card
                    key={property.id}
                    className={`cursor-pointer transition-all border-2 ${
                      selectedIds.includes(property.id)
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/40'
                    }`}
                    onClick={() => toggleProperty(property.id)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <Checkbox
                        checked={selectedIds.includes(property.id)}
                        onCheckedChange={() => toggleProperty(property.id)}
                        className="data-[state=checked]:bg-primary"
                      />
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={property.images?.[0] || '/placeholder.svg'}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{property.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {property.city}, {property.state}
                        </p>
                        <p className="text-sm font-medium text-foreground">{formatPrice(property.price)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button className="w-full" size="lg" onClick={goToStep2}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Step 2: Set Duration */}
        {step === 2 && (
          <div className="space-y-4">
            {promotionConfigs.map(config => {
              const property = getProperty(config.propertyId);
              if (!property) return null;
              return (
                <Card key={config.propertyId} className="border-2 border-border">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={property.images?.[0] || '/placeholder.svg'}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{property.title}</h3>
                        <p className="text-xs text-muted-foreground">{property.city}, {property.state}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{formatPrice(config.cost)}</p>
                        <p className="text-xs text-muted-foreground">{config.days} day{config.days > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Duration (₦{PRICE_PER_DAY.toLocaleString()}/day)</span>
                        <span className="font-medium">{config.days} day{config.days > 1 ? 's' : ''}</span>
                      </div>
                      <Slider
                        value={[config.days]}
                        onValueChange={([v]) => updateDays(config.propertyId, v)}
                        min={MIN_DAYS}
                        max={MAX_DAYS}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={MIN_DAYS}
                          max={MAX_DAYS}
                          value={config.days}
                          onChange={e => updateDays(config.propertyId, parseInt(e.target.value) || MIN_DAYS)}
                          className="w-20 h-8 text-sm text-center"
                        />
                        <span className="text-xs text-muted-foreground">days</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="font-semibold text-foreground">Total Cost</span>
                <span className="text-2xl font-bold text-primary">{formatPrice(totalCost)}</span>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button className="flex-1" onClick={() => setStep(3)}>
                Review <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Summary & Pay */}
        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Promotion Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {promotionConfigs.map(config => {
                  const property = getProperty(config.propertyId);
                  if (!property) return null;
                  return (
                    <div key={config.propertyId} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={property.images?.[0] || '/placeholder.svg'} alt={property.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm truncate max-w-[180px]">{property.title}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 text-primary" />
                            {config.days} day{config.days > 1 ? 's' : ''} promotion
                          </div>
                        </div>
                      </div>
                      <span className="font-semibold text-foreground">{formatPrice(config.cost)}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{promotionConfigs.length} properties</span>
                  <span className="text-muted-foreground">{promotionConfigs.reduce((s, c) => s + c.days, 0)} total days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground text-lg">Total</span>
                  <span className="text-2xl font-bold text-primary">{formatPrice(totalCost)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button className="flex-1" size="lg" onClick={handlePay} disabled={paying}>
                {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
                {paying ? 'Processing...' : `Pay ${formatPrice(totalCost)}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
