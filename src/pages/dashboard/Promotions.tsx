import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Star, Sparkles, Clock, CheckCircle, XCircle, Eye, TrendingUp, AlertTriangle } from 'lucide-react';

// Deterministic daily hype multiplier based on date + property ID
const getHypeMultiplier = (date: string, propertyId: string) => {
  let hash = 0;
  const seed = date + propertyId;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const normalized = (Math.abs(hash) % 1000) / 1000;
  return 3.5 + (normalized * 5);
};

const getHypedViews = (actualViews: number, propertyId: string) => {
  const today = new Date().toISOString().split('T')[0];
  const multiplier = getHypeMultiplier(today, propertyId);
  return Math.round((actualViews || 1) * multiplier);
};

type StackedPromotion = {
  property_id: string;
  total_days: number;
  total_amount: number;
  latest_expires_at: string;
  latest_started_at: string;
  is_active: boolean;
  property: {
    title: string;
    images: string[];
    city: string;
    state: string;
    views: number;
    clicks: number;
  } | null;
};

export const Promotions = () => {
  const [promotions, setPromotions] = useState<StackedPromotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('property_promotions')
      .select('*, properties(title, images, city, state, views, clicks)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Stack promotions by property_id
    const stackedMap = new Map<string, StackedPromotion>();
    for (const promo of (data || [])) {
      const existing = stackedMap.get(promo.property_id);
      if (existing) {
        existing.total_days += promo.days_promoted;
        existing.total_amount += Number(promo.amount_paid);
        if (new Date(promo.expires_at) > new Date(existing.latest_expires_at)) {
          existing.latest_expires_at = promo.expires_at;
          existing.is_active = promo.is_active;
        }
        if (new Date(promo.started_at) < new Date(existing.latest_started_at)) {
          existing.latest_started_at = promo.started_at;
        }
      } else {
        stackedMap.set(promo.property_id, {
          property_id: promo.property_id,
          total_days: promo.days_promoted,
          total_amount: Number(promo.amount_paid),
          latest_expires_at: promo.expires_at,
          latest_started_at: promo.started_at,
          is_active: promo.is_active,
          property: promo.properties,
        });
      }
    }

    setPromotions(Array.from(stackedMap.values()));
    setLoading(false);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);

  const getStatus = (promo: StackedPromotion) => {
    if (!promo.is_active) return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    if (new Date(promo.latest_expires_at) < new Date()) return { label: 'Expired', color: 'bg-muted text-muted-foreground', icon: XCircle };
    return { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const getRemainingTime = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return { text: 'Expired', urgent: false };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 3) return { text: `${days} days left`, urgent: false };
    if (days > 0) return { text: `${days}d ${hours}h left`, urgent: true };
    return { text: `${hours}h left`, urgent: true };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const activeCount = promotions.filter(p => getStatus(p).label === 'Active').length;
  const totalHypedViews = promotions
    .filter(p => getStatus(p).label === 'Active')
    .reduce((sum, p) => sum + getHypedViews(p.property?.views || 0, p.property_id), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Promoted Properties
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your property promotions</p>
        </div>
        <Link to="/promote-property">
          <Button className="gap-2">
            <Star className="h-4 w-4" />
            Promote Property
          </Button>
        </Link>
      </div>

      {promotions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active Promotions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                <Eye className="h-5 w-5" />
                {totalHypedViews.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total Views Today</p>
            </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{promotions.length}</p>
              <p className="text-xs text-muted-foreground">Total Properties</p>
            </CardContent>
          </Card>
        </div>
      )}

      {promotions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Promotions Yet</h3>
            <p className="text-muted-foreground mb-6">Promote your properties to reach more buyers</p>
            <Link to="/promote-property">
              <Button>Start Promoting</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {promotions.map(promo => {
            const status = getStatus(promo);
            const remaining = getRemainingTime(promo.latest_expires_at);
            const StatusIcon = status.icon;
            const hypedViews = getHypedViews(promo.property?.views || 0, promo.property_id);
            const isActive = status.label === 'Active';
            return (
              <Card key={promo.property_id} className={remaining.urgent && isActive ? 'border-yellow-400' : ''}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={promo.property?.images?.[0] || '/placeholder.svg'}
                      alt={promo.property?.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{promo.property?.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {promo.property?.city}, {promo.property?.state}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge className={`${status.color} border-0 text-xs`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                      {isActive && (
                        <span className={`text-xs flex items-center gap-1 ${remaining.urgent ? 'text-yellow-600 font-semibold' : 'text-muted-foreground'}`}>
                          {remaining.urgent && <AlertTriangle className="h-3 w-3" />}
                          {remaining.text}
                        </span>
                      )}
                      {isActive && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          {hypedViews.toLocaleString()} views
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="font-semibold text-foreground">{formatPrice(promo.total_amount)}</p>
                    <p className="text-xs text-muted-foreground">{promo.total_days} day{promo.total_days > 1 ? 's' : ''}</p>
                    {(status.label === 'Active' || status.label === 'Expired') && (
                      <Link to={`/promote-property?propertyId=${promo.property_id}`}>
                        <Button variant="outline" size="sm" className="text-xs h-7">
                          {status.label === 'Expired' ? 'Renew' : 'Extend'}
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
