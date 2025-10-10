import { Target, Lightbulb, TrendingUp, Globe } from 'lucide-react';

export const OurVision = () => {
  const visionPoints = [
    {
      icon: Target,
      title: 'Our Goal',
      description: 'To become the world\'s most trusted platform for property transactions, eliminating fraud and building confidence in real estate markets globally.',
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'Continuously advancing AI and blockchain technology to create unprecedented security and transparency in property transactions.',
    },
    {
      icon: TrendingUp,
      title: 'Growth',
      description: 'Expanding our services to new markets and property types, making secure transactions accessible to everyone, everywhere.',
    },
    {
      icon: Globe,
      title: 'Global Impact',
      description: 'Creating a unified global real estate marketplace where borders don\'t limit opportunities and trust is built into every transaction.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-accent-purple/10 via-background to-primary/10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Our <span className="text-gradient-purple">Vision</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Building the future of trusted, transparent real estate transactions
            </p>
          </div>
        </div>
      </div>

      {/* Vision Statement */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary/10 to-accent-purple/10 rounded-2xl p-8 md:p-12 border-2 border-light-purple-border">
            <h2 className="text-3xl font-bold mb-6 text-foreground text-center">The Xavorian Vision</h2>
            <p className="text-lg text-muted-foreground leading-relaxed text-center mb-6">
              We envision a world where <span className="text-light-purple-accent font-semibold">property transactions are as simple, secure, and trustworthy</span> as sending a message to a friend. A world where fraud is virtually eliminated, where buyers and sellers can connect with confidence, and where technology empowers people to make informed decisions about their most important investments.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed text-center">
              At Xavorian, we're not just building a platform—we're <span className="text-light-purple-accent font-semibold">reimagining the entire real estate experience</span> from the ground up.
            </p>
          </div>
        </div>
      </div>

      {/* Vision Points Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            How We're <span className="text-gradient-primary">Achieving It</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {visionPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-8 border-2 border-light-purple-border hover-lift"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-accent-purple to-accent-purple-light rounded-xl flex items-center justify-center mb-6 animate-float">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-foreground">{point.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{point.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Future Section */}
      <div className="bg-gradient-to-br from-secondary to-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              The <span className="text-gradient-purple">Future</span> of Real Estate
            </h2>
            <div className="space-y-6 bg-white rounded-2xl p-8 md:p-12 border-2 border-light-purple-border">
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <h3 className="text-2xl font-bold text-foreground mb-4">What's Next?</h3>
                <p>
                  In the next five years, we see Xavorian becoming the <span className="text-light-purple-accent font-semibold">global standard</span> for secure property transactions. We're developing new technologies that will make our platform even more powerful:
                </p>
                <ul className="space-y-3 ml-6">
                  <li className="flex items-start">
                    <span className="text-light-purple-accent mr-3">•</span>
                    <span><strong className="text-foreground">Blockchain-based Title Registry:</strong> Immutable property records that eliminate title fraud forever</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-light-purple-accent mr-3">•</span>
                    <span><strong className="text-foreground">Advanced AI Agents:</strong> Intelligent assistants that guide users through every step of their transaction</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-light-purple-accent mr-3">•</span>
                    <span><strong className="text-foreground">Virtual Property Tours:</strong> Immersive 3D experiences that let you explore properties from anywhere</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-light-purple-accent mr-3">•</span>
                    <span><strong className="text-foreground">Instant Verification:</strong> Real-time document authentication in seconds, not days</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-light-purple-accent mr-3">•</span>
                    <span><strong className="text-foreground">Cross-Border Transactions:</strong> Seamless international property purchases with automatic currency conversion and compliance</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Join Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-primary to-accent-purple rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Be Part of the Vision
            </h2>
            <p className="text-lg mb-8 opacity-90 leading-relaxed">
              Join thousands of users who are already experiencing the future of real estate. Together, we're building a world where property transactions are safe, simple, and accessible to everyone.
            </p>
            <a
              href="/signup"
              className="inline-block bg-white text-primary font-bold px-8 py-4 rounded-lg hover:scale-105 transition-transform"
            >
              Get Started Today
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
