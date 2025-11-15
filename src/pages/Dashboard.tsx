import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  Home, 
  Eye, 
  ShoppingCart, 
  DollarSign,
  Upload,
  TrendingUp,
  MessageSquare,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [pendingOffers, setPendingOffers] = useState<any[]>([]);
  const [payLaterEscrows, setPayLaterEscrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
    const channel = supabase
      .channel('user_analytics_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_analytics' }, (payload) => {
        setAnalytics((prev: any) => ({ ...prev, ...payload.new }));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [navigate]);

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Load roles
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    // Load analytics with LIVE data
    const { data: analyticsData } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Load properties
    const { data: propertiesData } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Load pending offers for seller
    const { data: offersData } = await supabase
      .from('escrow_transactions')
      .select(`
        *,
        property:properties(title, address, images),
        buyer:profiles!escrow_transactions_buyer_id_fkey(full_name, email)
      `)
      .eq('seller_id', user.id)
      .eq('offer_status', 'pending')
      .order('created_at', { ascending: false });

    // Load pay later escrows for buyer
    const { data: payLaterData } = await supabase
      .from('escrow_transactions')
      .select(`
        *,
        property:properties(title, address, images)
      `)
      .eq('buyer_id', user.id)
      .eq('pay_later', true)
      .eq('status', 'pending_payment')
      .order('created_at', { ascending: false });

    setProfile(profileData);
    setRoles(rolesData?.map(r => r.role) || []);
    setAnalytics(analyticsData);
    setProperties(propertiesData || []);
    setPendingOffers(offersData || []);
    setPayLaterEscrows(payLaterData || []);
    setLoading(false);
  };

  const handleOfferResponse = async (escrowId: string, accept: boolean, response: string) => {
    try {
      const { error } = await supabase
        .from('escrow_transactions')
        .update({
          offer_status: accept ? 'accepted' : 'rejected',
          seller_response: response,
          seller_responded_at: new Date().toISOString(),
        })
        .eq('id', escrowId);

      if (error) throw error;
      
      // Reload offers
      loadDashboardData();
    } catch (error) {
      console.error('Error responding to offer:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isSeller = roles.includes('seller') || roles.includes('agent') || roles.includes('admin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Header */}
        <div className="mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent-purple/10 rounded-3xl blur-3xl opacity-50"></div>
          <div className="relative bg-card/80 backdrop-blur-xl rounded-3xl p-8 border border-border/50 shadow-lg">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              Welcome back, <span className="text-gradient-primary">{profile?.full_name}</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link to="/dashboard/listings" className="group">
            <Card className="hover-lift card-glow border-border/50 bg-card/80 backdrop-blur-xl cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Listings</CardTitle>
                <Home className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-foreground">{analytics?.total_listings || properties.length}</div>
                <p className="text-xs text-muted-foreground mt-2">Active properties</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="hover-lift card-glow border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
              <Eye className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">{analytics?.total_views || 0}</div>
              <p className="text-xs text-emerald-500 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Live data
              </p>
            </CardContent>
          </Card>

          <Card className="hover-lift card-glow border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
              <ShoppingCart className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">{analytics?.total_sales || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">Completed transactions</p>
            </CardContent>
          </Card>

          <Card className="hover-lift card-glow border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                ₦{(analytics?.total_revenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-emerald-500 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Live data
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Offers for Seller */}
        {isSeller && pendingOffers.length > 0 && (
          <Card className="mb-8 border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Pending Offers ({pendingOffers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingOffers.map((offer) => (
                <div key={offer.id} className="p-4 rounded-lg border border-border/50 bg-muted/30 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{offer.property?.title}</h4>
                      <p className="text-sm text-muted-foreground">{offer.buyer?.full_name}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Original Price:</span>{' '}
                          <span className="font-semibold">₦{offer.transaction_amount.toLocaleString()}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Offer Amount:</span>{' '}
                          <span className="font-semibold text-primary">₦{offer.offer_amount?.toLocaleString()}</span>
                        </p>
                        {offer.offer_message && (
                          <p className="text-sm text-muted-foreground italic">"{offer.offer_message}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleOfferResponse(offer.id, true, 'Offer accepted')}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept Offer
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleOfferResponse(offer.id, false, 'Offer declined')}
                      className="flex-1"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Pay Later Reminders for Buyer */}
        {payLaterEscrows.length > 0 && (
          <Card className="mb-8 border-border/50 bg-card/80 backdrop-blur-xl border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Payment Reminders ({payLaterEscrows.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {payLaterEscrows.map((escrow) => (
                <div key={escrow.id} className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{escrow.property?.title}</h4>
                      <p className="text-sm text-muted-foreground">{escrow.property?.address}</p>
                      <p className="text-sm mt-2">
                        <span className="text-muted-foreground">Amount:</span>{' '}
                        <span className="font-semibold">₦{escrow.total_amount.toLocaleString()}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Transaction ID: {escrow.tx_hash}
                      </p>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate(`/start-escrow/${escrow.property_id}?resume=${escrow.id}`)}
                  >
                    Complete Payment Now
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Quick Actions */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/upload-listing">
                <Button className="w-full justify-start" variant="outline">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Property
                </Button>
              </Link>
              <Link to="/browse">
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Browse Properties
                </Button>
              </Link>
              <Link to="/dashboard/chats">
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Messages
                </Button>
              </Link>
              <Link to="/support">
                <Button className="w-full justify-start" variant="outline">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Get Support
                </Button>
              </Link>
              <Link to="/account-settings">
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="mr-2 h-5 w-5" />
                  Settings
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Listings */}
          {isSeller && properties.length > 0 && (
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Recent Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {properties.map((property) => (
                    <Link 
                      key={property.id} 
                      to={`/property/${property.id}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-border/50 hover-lift"
                    >
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {property.images?.[0] ? (
                          <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                        ) : (
                          <Home className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{property.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">{property.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">₦{property.price.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground capitalize">{property.status}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
