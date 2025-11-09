import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { User } from '@/types/property';
import { LayoutDashboard, Heart, MessageSquare, Shield, Upload, Settings } from 'lucide-react';

export const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(currentUser));
    }
  }, [navigate]);

  if (!user) return null;

  const dashboardCards = [
    {
      icon: Heart,
      title: 'My Favorites',
      description: 'View your saved properties',
      link: '/dashboard/favorites',
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: MessageSquare,
      title: 'My Chats',
      description: 'Messages with sellers and buyers',
      link: '/dashboard/chats',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Shield,
      title: 'Escrow Transactions',
      description: 'View your active and completed transactions',
      link: '/dashboard/escrow',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Upload,
      title: 'My Listings',
      description: 'Manage your property listings',
      link: '/dashboard/listings',
      color: 'from-purple-500 to-violet-500',
      showForSeller: true,
    },
    {
      icon: Settings,
      title: 'Account Settings',
      description: 'Update your profile and preferences',
      link: '/account-settings',
      color: 'from-gray-500 to-slate-500',
    },
  ];

  const filteredCards = dashboardCards.filter(
    (card) => !card.showForSeller || user.userType === 'Seller' || user.userType === 'Admin' || user.userType === 'Agent'
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            Welcome back, <span className="text-gradient-purple">{user.name}</span>!
          </h1>
          <p className="text-muted-foreground text-lg">
            {user.userType === 'Seller' || user.userType === 'Admin' || user.userType === 'Agent'
              ? 'Manage your property listings and transactions' 
              : 'Browse properties and manage your account'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 bg-gradient-to-br from-primary to-accent-purple text-white border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 mb-1 font-medium">Account Type</p>
                <p className="text-3xl font-bold">{user.userType}</p>
              </div>
              <LayoutDashboard className="w-12 h-12 text-white/30" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 mb-1 font-medium">Active Chats</p>
                <p className="text-3xl font-bold">3</p>
              </div>
              <MessageSquare className="w-12 h-12 text-white/30" />
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-pink-500 to-rose-500 text-white border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 mb-1 font-medium">Saved Properties</p>
                <p className="text-3xl font-bold">12</p>
              </div>
              <Heart className="w-12 h-12 text-white/30" />
            </div>
          </Card>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => (
            <Link key={card.title} to={card.link}>
              <Card className="p-6 hover-lift card-glow cursor-pointer group h-full bg-white border-2 border-border hover:border-primary transition-all duration-300">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <card.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{card.title}</h3>
                <p className="text-muted-foreground text-sm">{card.description}</p>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions for Sellers/Agents */}
        {(user.userType === 'Seller' || user.userType === 'Admin' || user.userType === 'Agent') && (
          <Card className="mt-12 p-8 card-glow bg-gradient-to-br from-primary/5 to-accent-purple/5 border-2 border-primary/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Ready to list a property?</h2>
                <p className="text-muted-foreground text-lg">
                  Upload a new property listing and reach thousands of potential buyers
                </p>
              </div>
              <Link to="/upload-listing">
                <Button variant="hero" size="lg" className="whitespace-nowrap shadow-lg">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Property
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Buyer-Specific Section */}
        {user.userType === 'Buyer' && (
          <Card className="mt-12 p-8 card-glow bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-2 border-blue-500/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Find Your Dream Property</h2>
                <p className="text-muted-foreground text-lg">
                  Browse thousands of verified listings from trusted sellers
                </p>
              </div>
              <Link to="/browse">
                <Button size="lg" className="whitespace-nowrap bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 shadow-lg">
                  Browse Properties
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
