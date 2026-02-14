import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Star, Sparkles, Clock, CheckCircle, XCircle } from 'lucide-react';

export const Promotions = () => {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('property_promotions')
      .select('*, properties(title, images, city, state)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setPromotions(data || []);
    setLoading(false);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);

  const getStatus = (promo: any) => {
    if (!promo.is_active) return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    if (new Date(promo.expires_at) < new Date()) return { label: 'Expired', color: 'bg-muted text-muted-foreground', icon: XCircle };
    return { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const getRemainingDays = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

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
            const remaining = getRemainingDays(promo.expires_at);
            const StatusIcon = status.icon;
            return (
              <Card key={promo.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={promo.properties?.images?.[0] || '/placeholder.svg'}
                      alt={promo.properties?.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{promo.properties?.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {promo.properties?.city}, {promo.properties?.state}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${status.color} border-0 text-xs`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                      {status.label === 'Active' && (
                        <span className="text-xs text-muted-foreground">{remaining} day{remaining !== 1 ? 's' : ''} left</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatPrice(promo.amount_paid)}</p>
                    <p className="text-xs text-muted-foreground">{promo.days_promoted} day{promo.days_promoted > 1 ? 's' : ''}</p>
                    <p className="text-xs text-muted-foreground font-mono">{promo.promotion_id}</p>
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
