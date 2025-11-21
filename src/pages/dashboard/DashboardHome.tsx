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
  Lock,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

export const DashboardHome = () => {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    savedProperties: 0,
    myListings: 0,
    offers: 0,
    escrow: 0,
  });
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile and verification first (most important)
      const [profileData, kycData] = await Promise.all([
        supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
        supabase.from('kyc_documents').select('status').eq('user_id', user.id).eq('status', 'verified').maybeSingle(),
      ]);

      setProfile(profileData.data);
      setIsVerified(!!kycData.data);
      setLoading(false);

      // Load counts in background (non-blocking)
      Promise.all([
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('escrow_transactions').select('id', { count: 'exact', head: true })
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .eq('offer_status', 'pending'),
        supabase.from('saved_properties').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]).then(([listingsCount, activeOffersCount, savedCount]) => {
        setStats({
          savedProperties: savedCount.count || 0,
          myListings: listingsCount.count || 0,
          offers: activeOffersCount.count || 0,
          escrow: activeOffersCount.count || 0,
        });
      });

      // Load analytics lazily (lowest priority)
      setTimeout(async () => {
        const { data: analyticsData } = await supabase
          .from('user_analytics')
          .select('total_views, total_sales, total_revenue')
          .eq('user_id', user.id)
          .maybeSingle();

        if (analyticsData) {
          setAnalytics(analyticsData);
        }
      }, 300);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
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
      title: 'Escrow Transactions', 
      value: stats.escrow, 
      icon: Lock, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      link: '/dashboard/escrow'
    },
  ];

  const quickActions = [
    { label: 'Upload Property', icon: Upload, link: '/upload-listing', variant: 'hero' as const },
    { label: 'View Listings', icon: Home, link: '/dashboard/my-listings', variant: 'outline' as const },
    { label: 'View Offers', icon: Handshake, link: '/dashboard/offers', variant: 'outline' as const },
    { label: 'Escrow Dashboard', icon: Lock, link: '/dashboard/escrow', variant: 'outline' as const },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent-purple to-accent-purple-light p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold">
              Welcome back, {profile?.full_name || 'User'}! 👋
            </h1>
            {isVerified && (
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <CheckCircle className="h-5 w-5 text-blue-300" />
                <span className="text-sm font-medium">Verified</span>
              </div>
            )}
          </div>
          <p className="text-white/90 text-lg">
            Here's what's happening with your properties today
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className="hover-lift card-glow cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  View details
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Analytics Section */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" />
                Total Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {analytics.total_views || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All-time property views</p>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Total Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {analytics.total_sales || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Successful transactions</p>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-500" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                ₦{(analytics.total_revenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total earnings</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.link}>
                <Button
                  variant={action.variant}
                  className="w-full h-auto py-4 flex flex-col items-center gap-2"
                >
                  <action.icon className="h-6 w-6" />
                  <span>{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
