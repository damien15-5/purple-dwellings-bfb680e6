import { useEffect, useState, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  Home, 
  Eye, 
  DollarSign,
  Upload,
  Heart,
  Handshake,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Star,
  CreditCard
} from 'lucide-react';

export const DashboardHome = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [stats, setStats] = useState({
    savedProperties: 0,
    myListings: 0,
    offers: 0,
    transactions: 0,
    promotedProperties: 0,
  });
  const [financialStats, setFinancialStats] = useState({
    totalTransactionsMade: 0,
    totalSpentBuying: 0,
  });
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load summary data
    const [profileData, kycData, listingsCount, activeOffersCount, transactionsCount, savedCount, activePromotions] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('kyc_documents').select('status').eq('user_id', user.id).eq('status', 'verified').maybeSingle(),
      supabase.from('properties').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('escrow_transactions').select('id', { count: 'exact', head: true }).or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).in('offer_status', ['pending', 'accepted']),
      supabase.from('purchase_transactions').select('id', { count: 'exact', head: true }).or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`),
      supabase.from('saved_properties').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('property_promotions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true).gt('expires_at', new Date().toISOString()),
    ]);

    setProfile(profileData.data);
    setIsVerified(!!kycData.data);
    setStats({
      savedProperties: savedCount.count || 0,
      myListings: listingsCount.count || 0,
      offers: activeOffersCount.count || 0,
      transactions: transactionsCount.count || 0,
      promotedProperties: activePromotions.count || 0,
    });

    // Load financial stats
    const [completedAsSeller, completedAsBuyer] = await Promise.all([
      supabase.from('escrow_transactions').select('total_amount').eq('seller_id', user.id).eq('status', 'completed'),
      supabase.from('escrow_transactions').select('total_amount').eq('buyer_id', user.id).eq('status', 'completed'),
    ]);

    const totalTransactionsMade = completedAsSeller.data?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;
    const totalSpentBuying = completedAsBuyer.data?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0;

    setFinancialStats({
      totalTransactionsMade,
      totalSpentBuying,
    });

    // Load analytics lazily
    setTimeout(async () => {
      const { data: analyticsData } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setAnalytics(analyticsData);
    }, 100);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple" />
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Saved Properties', 
      value: stats.savedProperties, 
      icon: Heart, 
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      link: '/dashboard/saved'
    },
    { 
      title: 'My Listings', 
      value: stats.myListings, 
      icon: Home, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      link: '/dashboard/my-listings'
    },
    { 
      title: 'Offers & Negotiations', 
      value: stats.offers, 
      icon: Handshake, 
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      link: '/dashboard/offers'
    },
    { 
      title: 'Transactions', 
      value: stats.transactions, 
      icon: CreditCard, 
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      link: '/dashboard/transactions'
    },
    { 
      title: 'Promoted Properties', 
      value: stats.promotedProperties, 
      icon: Star, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      link: '/dashboard/promotions'
    },
  ];

  const quickActions = [
    { label: 'Upload Property', icon: Upload, link: '/upload-listing', variant: 'hero' as const },
    { label: 'View Listings', icon: Home, link: '/dashboard/my-listings', variant: 'outline' as const },
    { label: 'View Offers', icon: Handshake, link: '/dashboard/offers', variant: 'outline' as const },
    { label: 'Promote Property', icon: Star, link: '/promote-property', variant: 'outline' as const },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-r from-accent-purple to-accent-purple-light p-4 sm:p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-2 md:gap-3 flex-wrap">
            Welcome back, {profile?.full_name || 'User'}! 👋
            {isVerified && (
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs sm:text-sm font-medium">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                Verified
              </span>
            )}
          </h1>
          <p className="text-white/90 text-sm sm:text-base md:text-lg">
            Here's what's happening with your properties today
          </p>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-36 sm:h-36 md:w-48 md:h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className="hover-lift card-glow cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 sm:p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  View details
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Financial Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card className="card-glow">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
              Total Transactions Made
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-foreground">
              ₦{financialStats.totalTransactionsMade.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From properties sold</p>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
              Total Spent Buying
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-foreground">
              ₦{financialStats.totalSpentBuying.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">On purchased properties</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="card-glow">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                Total Views
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {analytics.total_views || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All-time property views</p>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                Total Sales
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {analytics.total_sales || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Successful transactions</p>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                ₦{(analytics.total_revenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total earnings</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="card-glow">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.link}>
                <Button
                  variant={action.variant}
                  className="w-full h-auto py-3 sm:py-4 flex flex-col items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                >
                  <action.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                  <span className="text-center leading-tight">{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
