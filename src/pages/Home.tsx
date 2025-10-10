import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/PropertyCard';
import { mockProperties } from '@/data/mockData';
import { Search, Shield, MessageSquare, CheckCircle, TrendingUp, Users } from 'lucide-react';
import heroImage from '@/assets/hero-house.jpg';

export const Home = () => {
  const featuredProperties = mockProperties.slice(0, 3);

  const features = [
    {
      icon: Shield,
      title: 'Secure Transactions',
      description: 'Experience complete peace of mind with our advanced escrow protection system. Every transaction is safeguarded, ensuring safe and secure property deals for all parties involved.',
    },
    {
      icon: MessageSquare,
      title: 'Direct Communication',
      description: 'Connect instantly with sellers and buyers through our seamless messaging platform. Build relationships, ask questions, and negotiate deals all in one place.',
    },
    {
      icon: CheckCircle,
      title: 'Verified Listings',
      description: 'Trust in authenticity—every property listing undergoes rigorous verification with comprehensive document checks to protect your investment.',
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
            alt="Beautiful luxury house"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in leading-tight">
            Find Your Dream
            <span className="block text-gradient-purple">
              Property Today
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/95 max-w-2xl mx-auto leading-relaxed font-medium">
            Secure, verified property transactions with <span className="text-[#D8C4F0]">escrow protection</span>
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
      <section className="py-16 bg-gradient-to-b from-secondary to-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-white rounded-2xl border-2 border-[#D8C4F0]">
                  <stat.icon className="w-8 h-8 text-[#9B6FD1] stroke-[2px]" />
                </div>
                <p className="text-4xl font-bold text-foreground mb-2">{stat.value}</p>
                <p className="text-muted-foreground text-lg">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              Why Choose <span className="text-[#9B6FD1]">Xavorian</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Experience a <span className="text-[#9B6FD1] font-semibold">secure and seamless</span> property transaction platform
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="p-8 rounded-xl bg-white border-2 border-[#D8C4F0] hover:shadow-lg transition-all duration-300 hover:-translate-y-1 stagger-animation"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-white rounded-xl border-2 border-[#9B6FD1]">
                  <feature.icon className="w-8 h-8 text-white fill-white stroke-[#9B6FD1] stroke-[2px]" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4 leading-snug">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-gradient-to-b from-white to-secondary">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-2 leading-tight">
                Featured <span className="text-[#9B6FD1]">Properties</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">Discover our <span className="text-[#9B6FD1] font-semibold">handpicked selection</span> of premium properties</p>
            </div>
            <Link to="/browse">
              <Button variant="outline" className="border-[#D8C4F0] hover:border-[#9B6FD1] hover:bg-[#9B6FD1]/5">View All</Button>
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
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#9B6FD1]/5 to-[#D8C4F0]/5" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Join <span className="text-[#9B6FD1] font-semibold">thousands of satisfied</span> buyers and sellers on our platform
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