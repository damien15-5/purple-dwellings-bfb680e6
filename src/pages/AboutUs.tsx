import { Building2, Shield, Users, Award } from 'lucide-react';

export const AboutUs = () => {
  const values = [
    {
      icon: Shield,
      title: 'Security',
      description: 'We prioritize the safety of your personal information and financial transactions. Our escrow service is designed to protect both tenants and landlords, ensuring that funds are only released when all parties are satisfied.',
    },
    {
      icon: Users,
      title: 'Transparency',
      description: 'We believe in clear communication and transparency throughout the rental process. Our platform provides detailed property listings, allowing renters to make informed choices.',
    },
    {
      icon: Building2,
      title: 'Support',
      description: 'Our dedicated customer support team is available to assist you at every step of your journey. Whether you have questions about the rental process or need help resolving an issue, we are here to help.',
    },
    {
      icon: Award,
      title: 'Community Focused',
      description: 'At XAVORIAN, we are committed to fostering a community where renters and landlords can connect meaningfully. We strive to create lasting relationships built on trust and mutual respect.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-accent-purple/10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About <span className="text-gradient-primary">Xavorian</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Transforming real estate transactions through technology, trust, and transparency
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 md:p-12 border-2 border-light-purple-border hover-lift">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              Our mission is to simplify the rental process by providing a reliable platform that safeguards the interests of all parties involved. We aim to empower renters with the information they need to make informed decisions while offering landlords and agents a trustworthy avenue to connect with potential tenants.
            </p>
          </div>
        </div>
      </div>

      {/* What We Do Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 md:p-12 border-2 border-light-purple-border hover-lift">
            <h2 className="text-3xl font-bold mb-6 text-foreground">What We Do</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              XAVORIAN acts as an intermediary in rental transactions, ensuring that all agreements are honored and that funds are securely held until all conditions of the rental agreement are met. Our user-friendly platform allows tenants to browse available properties, communicate directly with landlords or agents, and complete transactions with confidence.
            </p>
          </div>
        </div>
      </div>

      {/* Why Choose XAVORIAN Section */}
      <div className="bg-gradient-to-br from-secondary to-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              Why Choose <span className="text-gradient-primary">XAVORIAN</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent-purple rounded-xl flex items-center justify-center mb-6 animate-float">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-foreground">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Join Us Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 md:p-12 border-2 border-light-purple-border hover-lift">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Join Us Today</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Whether you are a tenant looking for your next home or a landlord seeking reliable tenants, XAVORIAN is here to facilitate your journey. Explore our platform today and experience a new standard in rental transactions.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
