import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  LayoutDashboard, 
  Home, 
  TrendingUp, 
  ShoppingCart, 
  MessageSquare, 
  Settings,
  Upload,
  Eye,
  DollarSign,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
    // Realtime subscription for analytics updates
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

    // Load analytics
    const { data: analyticsData } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Load properties if seller
    const { data: propertiesData } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    setProfile(profileData);
    setRoles(rolesData?.map(r => r.role) || []);
    setAnalytics(analyticsData);
    setProperties(propertiesData || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isSeller = roles.includes('seller') || roles.includes('agent') || roles.includes('admin');
  const isBuyer = roles.includes('buyer') || roles.includes('agent');
  const isAdmin = roles.includes('admin');

  // Mock data for charts
  const revenueData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Apr', value: 4500 },
    { name: 'May', value: 6000 },
    { name: 'Jun', value: 5500 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, <span className="text-primary">{profile?.full_name}</span>
          </h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover-lift border-border/50 bg-card/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Listings</CardTitle>
              <Home className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{analytics?.total_listings || properties.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active properties</p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-border/50 bg-card/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{analytics?.total_views || 0}</div>
              <p className="text-xs text-emerald-500 mt-1">↑ 12% from last month</p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-border/50 bg-card/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{analytics?.total_sales || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed transactions</p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-border/50 bg-card/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                ${(analytics?.total_revenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-emerald-500 mt-1">↑ 8% from last month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Overview removed per request */}
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/upload-listing">
                <Button className="w-full justify-start" variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Property
                </Button>
              </Link>
              <Link to="/browse">
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Browse Properties
                </Button>
              </Link>
              <Link to="/dashboard/chats">
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </Button>
              </Link>
              <Link to="/support">
                <Button className="w-full justify-start" variant="outline">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Get Support
                </Button>
              </Link>
              <Link to="/account-settings">
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Properties */}
        {isSeller && properties.length > 0 && (
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Recent Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {properties.map((property) => (
                  <Link 
                    key={property.id} 
                    to={`/property/${property.id}`}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors border border-border/50"
                  >
                    <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {property.images?.[0] ? (
                        <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                      ) : (
                        <Home className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{property.title}</h4>
                      <p className="text-sm text-muted-foreground">{property.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">${property.price.toLocaleString()}</p>
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
  );
};
