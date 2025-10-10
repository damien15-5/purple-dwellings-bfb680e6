import { Building2, Shield, Users, Award } from 'lucide-react';

export const AboutUs = () => {
  const values = [
    {
      icon: Shield,
      title: 'Trust & Security',
      description: 'We implement AI-powered verification and escrow protection to ensure every transaction is secure and trustworthy.',
    },
    {
      icon: Users,
      title: 'User-Centric',
      description: 'Our platform is designed with you in mind, making property transactions simple, transparent, and accessible.',
    },
    {
      icon: Building2,
      title: 'Innovation',
      description: 'We leverage cutting-edge technology to revolutionize the real estate industry and create better experiences.',
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'We strive for excellence in every aspect of our service, from verification to customer support.',
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
              Xavorian was founded with a simple yet powerful mission: to make property transactions <span className="text-light-purple-accent font-semibold">safe, transparent, and accessible</span> for everyone. We recognized that the traditional real estate industry was plagued by fraud, inefficiency, and a lack of trust between buyers and sellers.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Our platform combines <span className="text-light-purple-accent font-semibold">AI-powered document verification</span>, secure escrow services, and intelligent fraud detection to create a marketplace where users can transact with confidence. We believe that technology can solve the fundamental challenges in real estate and create a better future for property transactions.
            </p>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gradient-to-br from-secondary to-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              Our <span className="text-gradient-primary">Core Values</span>
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

      {/* Story Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 md:p-12 border-2 border-light-purple-border hover-lift">
            <h2 className="text-3xl font-bold mb-6 text-foreground">Our Story</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Xavorian was born from firsthand experience with the challenges of property transactions. Our founders witnessed countless cases of <span className="text-light-purple-accent font-semibold">fraud, title disputes, and failed deals</span> that left both buyers and sellers frustrated and financially hurt.
              </p>
              <p>
                We knew there had to be a better way. By combining expertise in real estate, technology, and artificial intelligence, we built a platform that addresses the root causes of these problems. Our <span className="text-light-purple-accent font-semibold">AI verification system</span> can detect fraudulent documents with unprecedented accuracy, while our secure escrow process ensures that funds are protected throughout the transaction.
              </p>
              <p>
                Today, Xavorian serves thousands of users who have successfully completed property transactions on our platform. But we're just getting started. We continue to innovate, improve, and expand our services to make real estate transactions safer and more efficient for everyone.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-gradient-to-br from-secondary to-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Join Our <span className="text-gradient-primary">Journey</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              We're building the future of real estate, one transaction at a time. Whether you're buying your first home or selling a commercial property, Xavorian is here to make your experience <span className="text-light-purple-accent font-semibold">safe, simple, and successful</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
