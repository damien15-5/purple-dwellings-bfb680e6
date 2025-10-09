import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Home, PlusCircle, LayoutDashboard, MessageSquare, ShieldCheck, TrendingUp } from 'lucide-react';

export const VerifiedUser = () => {
  const userName = localStorage.getItem('userName') || 'Guest';
  
  const stats = [
    { label: 'My Listings', value: '3', icon: Home, color: 'text-primary' },
    { label: 'Active Chats', value: '5', icon: MessageSquare, color: 'text-blue-500' },
    { label: 'Pending Transactions', value: '2', icon: ShieldCheck, color: 'text-green-500' },
  ];

  const recentActivity = [
    { text: 'Your listing "Modern Home in Lekki" received 12 new views', time: '2 hours ago' },
    { text: 'New message from John Doe', time: '3 hours ago' },
    { text: 'Escrow transaction #ESC-123 is pending', time: '1 day ago' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      <div className="container mx-auto px-4 py-12">
        {/* Welcome Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-success animate-float" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Welcome back, {userName}! 🎉</h1>
          <p className="text-muted-foreground text-lg">
            Your account is verified and ready to go
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card
              key={stat.label}
              className="hover-lift card-glow"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-12 w-12 ${stat.color}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-12 card-glow">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with these common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/browse">
              <Button variant="outline" className="w-full h-20 hover-lift">
                <Home className="mr-2 h-5 w-5" />
                Browse Properties
              </Button>
            </Link>
            <Link to="/upload-listing">
              <Button className="w-full h-20 hover-lift animate-glow">
                <PlusCircle className="mr-2 h-5 w-5" />
                Post New Listing
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="w-full h-20 hover-lift">
                <LayoutDashboard className="mr-2 h-5 w-5" />
                View Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="card-glow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Stay updated with your latest actions</CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                >
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm">{activity.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
