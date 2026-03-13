import { SEOHead } from '@/components/SEOHead';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { Mail, MessageSquare, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Contact Us"
        description="Get in touch with Xavorian for support, inquiries, or partnerships. We're here to help with your real estate needs in Nigeria."
        path="/contact"
      />

      <div className="bg-gradient-to-br from-primary/10 via-background to-accent-purple/10 py-16">
        <div className="container mx-auto px-4">
          <BreadcrumbNav items={[
            { label: 'Home', href: '/' },
            { label: 'Contact' },
          ]} />
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Contact <span className="text-primary">Us</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Have questions? We'd love to hear from you.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card rounded-xl p-6 border border-border text-center">
            <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Email</h3>
            <a href="mailto:support@xavorian.com" className="text-primary hover:underline text-sm">
              support@xavorian.com
            </a>
          </div>
          <div className="bg-card rounded-xl p-6 border border-border text-center">
            <MessageSquare className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Live Chat</h3>
            <Link to="/ai-support" className="text-primary hover:underline text-sm">
              Chat with AI Support
            </Link>
          </div>
          <div className="bg-card rounded-xl p-6 border border-border text-center">
            <MapPin className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Location</h3>
            <p className="text-sm text-muted-foreground">Benin City, Edo State, Nigeria</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
          <p className="text-muted-foreground mb-6">Check our FAQ for quick answers or reach out to our support team.</p>
          <div className="flex gap-4 justify-center">
            <Link to="/faq"><Button variant="outline">View FAQ</Button></Link>
            <Link to="/support"><Button>Get Support</Button></Link>
          </div>
        </div>
      </div>
    </div>
  );
};
