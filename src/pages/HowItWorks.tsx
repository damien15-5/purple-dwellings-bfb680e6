import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Search, MessageSquare, FileCheck, Shield, CheckCircle } from 'lucide-react';

export const HowItWorks = () => {
  const buyerSteps = [
    {
      icon: Search,
      title: 'Browse Properties',
      description: 'Search through thousands of verified property listings with detailed information, high-quality images, and comprehensive property details.',
    },
    {
      icon: MessageSquare,
      title: 'Contact Sellers',
      description: 'Chat directly with property owners to ask questions, discuss terms, and schedule convenient viewings at your preferred time.',
    },
    {
      icon: FileCheck,
      title: 'Verify Documents',
      description: 'Review all essential property documents including Certificate of Occupancy, title deeds, and land surveys before making your purchase decision.',
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: 'Complete your transaction with confidence using our secure escrow service that provides full buyer protection throughout the process.',
    },
  ];

  const sellerSteps = [
    {
      icon: FileCheck,
      title: 'Upload Property',
      description: 'Create a comprehensive listing with professional photos, detailed property information, and accurate specifications to attract buyers.',
    },
    {
      icon: CheckCircle,
      title: 'Document Verification',
      description: 'Submit all required legal documents for thorough verification to build trust and credibility with potential buyers.',
    },
    {
      icon: MessageSquare,
      title: 'Engage with Buyers',
      description: 'Respond promptly to buyer inquiries, answer questions professionally, and schedule property viewings to close deals faster.',
    },
    {
      icon: Shield,
      title: 'Complete Transaction',
      description: 'Receive your payment securely and promptly through our trusted escrow service with complete seller protection.',
    },
  ];

  return (
    <div className="min-h-screen py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
            How <span className="text-[#9B6FD1]">It Works</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A <span className="text-[#9B6FD1] font-semibold">simple and secure</span> process for buying and selling properties
          </p>
        </div>

        {/* Buyer Journey */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">For Buyers</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">Your <span className="text-[#9B6FD1] font-semibold">path to finding</span> the perfect property</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {buyerSteps.map((step, index) => (
              <div key={step.title} className="relative bg-white border-2 border-[#D8C4F0] rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 bg-white border-2 border-[#9B6FD1] rounded-full flex items-center justify-center">
                      <step.icon className="w-10 h-10 text-white fill-white stroke-[#9B6FD1] stroke-[2px]" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#9B6FD1] text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 leading-snug">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seller Journey */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">For Sellers</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">List your property and <span className="text-[#9B6FD1] font-semibold">reach thousands</span> of qualified buyers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {sellerSteps.map((step, index) => (
              <div key={step.title} className="relative bg-white border-2 border-[#D8C4F0] rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 bg-white border-2 border-[#9B6FD1] rounded-full flex items-center justify-center">
                      <step.icon className="w-10 h-10 text-white fill-white stroke-[#9B6FD1] stroke-[2px]" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#9B6FD1] text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 leading-snug">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Escrow Explanation */}
        <section className="bg-white border-2 border-[#D8C4F0] rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-white rounded-2xl border-2 border-[#9B6FD1]">
            <Shield className="w-10 h-10 text-white fill-white stroke-[#9B6FD1] stroke-[2px]" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">Secure Escrow Protection</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Our <span className="text-[#9B6FD1] font-semibold">escrow service protects</span> both buyers and sellers by holding funds securely until all conditions are met.
            Documents are verified, and both parties agree before payment is released, ensuring <span className="text-[#9B6FD1] font-semibold">complete peace of mind</span>.
          </p>
          <Link to="/signup">
            <Button variant="hero" size="lg">
              Get Started Today
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
};