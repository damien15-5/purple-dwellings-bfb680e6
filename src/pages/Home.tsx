import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/PropertyCard';
import { mockProperties } from '@/data/mockData';
import { Search, Shield, MessageSquare, CheckCircle, TrendingUp, Users } from 'lucide-react';
import heroImage from '@/assets/hero-property.jpg';

export const Home = () => {
  const featuredProperties = mockProperties.slice(0, 3);

  const features = [
    {
      icon: Shield,
      title: 'Secure Transactions',
      description: 'Escrow protection ensures safe and secure property transactions for all parties.',
    },
    {
      icon: MessageSquare,
      title: 'Direct Communication',
      description: 'Chat directly with sellers and buyers in a seamless, integrated platform.',
    },
    {
      icon: CheckCircle,
      title: 'Verified Listings',
      description: 'All properties undergo thorough verification with document checks.',
    },
  ];

  const stats = [
    { icon: Users, value: '10,000+', label: 'Happy Customers' },
    { icon: TrendingUp, value: '₦50B+', label: 'Properties Sold' },
    { icon: CheckCircle, value: '5,000+', label: 'Verified Listings' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Hero Property"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
            Find Your Dream
            <span className="block text-gradient-purple">
              Property Today
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto">
            Secure, verified property transactions with escrow protection
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/browse">
              <Button variant="hero" size="lg" className="w-full sm:w-auto">
                <Search className="w-5 h-5 mr-2" />
                Browse Properties
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 text-white border-white/30 hover:bg-white hover:text-foreground backdrop-blur-sm">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-12 h-12 mx-auto mb-4 text-primary" />
                <p className="text-4xl font-bold text-foreground mb-2">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why Choose <span className="text-gradient-purple">PropertyMarket</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience a secure and seamless property transaction platform
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="p-8 rounded-xl border-animated card-glow text-center group hover-lift stagger-animation"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center group-hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-shadow duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-2">
                Featured <span className="text-gradient-purple">Properties</span>
              </h2>
              <p className="text-muted-foreground">Discover our handpicked selection</p>
            </div>
            <Link to="/browse">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.map((property, index) => (
              <div 
                key={property.id}
                className="stagger-animation"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-light opacity-10" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied buyers and sellers on our platform
          </p>
          <Link to="/signup">
            <Button variant="hero" size="lg">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
