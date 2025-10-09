import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Search, MessageSquare, FileCheck, Shield, CheckCircle } from 'lucide-react';

export const HowItWorks = () => {
  const buyerSteps = [
    {
      icon: Search,
      title: 'Browse Properties',
      description: 'Search through thousands of verified property listings with detailed information and images.',
    },
    {
      icon: MessageSquare,
      title: 'Contact Sellers',
      description: 'Chat directly with property owners to ask questions and schedule viewings.',
    },
    {
      icon: FileCheck,
      title: 'Verify Documents',
      description: 'Review property documents including C of O, deeds, and surveys before purchase.',
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: 'Use our escrow service for secure transactions with full buyer protection.',
    },
  ];

  const sellerSteps = [
    {
      icon: FileCheck,
      title: 'Upload Property',
      description: 'Create a detailed listing with photos and property information.',
    },
    {
      icon: CheckCircle,
      title: 'Document Verification',
      description: 'Submit required documents for verification to build trust with buyers.',
    },
    {
      icon: MessageSquare,
      title: 'Engage with Buyers',
      description: 'Respond to inquiries and schedule property viewings.',
    },
    {
      icon: Shield,
      title: 'Complete Transaction',
      description: 'Receive payment securely through our escrow service.',
    },
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            How <span className="text-gradient-purple">It Works</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A simple and secure process for buying and selling properties
          </p>
        </div>

        {/* Buyer Journey */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">For Buyers</h2>
            <p className="text-muted-foreground">Your path to finding the perfect property</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {buyerSteps.map((step, index) => (
              <div key={step.title} className="relative">
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center animate-glow">
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-foreground text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < buyerSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-transparent" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Seller Journey */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">For Sellers</h2>
            <p className="text-muted-foreground">List your property and reach thousands of buyers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {sellerSteps.map((step, index) => (
              <div key={step.title} className="relative">
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center animate-glow">
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-foreground text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < sellerSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-transparent" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Escrow Explanation */}
        <section className="bg-gradient-to-r from-accent to-secondary rounded-2xl p-12 text-center">
          <Shield className="w-16 h-16 mx-auto mb-6 text-primary" />
          <h2 className="text-3xl font-bold text-foreground mb-4">Secure Escrow Protection</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            Our escrow service protects both buyers and sellers by holding funds securely until all conditions are met.
            Documents are verified, and both parties agree before payment is released.
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
