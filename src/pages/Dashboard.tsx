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
      link: '/dashboard/settings',
      color: 'from-gray-500 to-slate-500',
    },
  ];

  const filteredCards = dashboardCards.filter(
    (card) => !card.showForSeller || user.userType === 'Seller' || user.userType === 'Admin'
  );

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, <span className="text-gradient-purple">{user.name}</span>!
          </h1>
          <p className="text-muted-foreground">Manage your property marketplace activities</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 card-glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Account Type</p>
                <p className="text-2xl font-bold text-foreground">{user.userType}</p>
              </div>
              <LayoutDashboard className="w-12 h-12 text-primary opacity-20" />
            </div>
          </Card>
          <Card className="p-6 card-glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Chats</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
              <MessageSquare className="w-12 h-12 text-primary opacity-20" />
            </div>
          </Card>
          <Card className="p-6 card-glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Saved Properties</p>
                <p className="text-2xl font-bold text-foreground">12</p>
              </div>
              <Heart className="w-12 h-12 text-primary opacity-20" />
            </div>
          </Card>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => (
            <Link key={card.title} to={card.link}>
              <Card className="p-6 hover-lift card-glow cursor-pointer group h-full">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{card.title}</h3>
                <p className="text-muted-foreground text-sm">{card.description}</p>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        {(user.userType === 'Seller' || user.userType === 'Admin') && (
          <Card className="mt-12 p-8 card-glow border-gradient">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Ready to list a property?</h2>
                <p className="text-muted-foreground">
                  Upload a new property listing and reach thousands of potential buyers
                </p>
              </div>
              <Link to="/upload-listing">
                <Button variant="hero" size="lg" className="whitespace-nowrap">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Property
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
