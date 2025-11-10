import { Link } from 'react-router-dom';
import { Instagram, Youtube } from 'lucide-react';
import { SiTiktok, SiX } from 'react-icons/si';

export const Footer = () => {
  const footerSections = [
    {
      title: 'Company',
      links: [
        { label: 'About Us', to: '/about' },
        { label: 'Our Vision', to: '/vision' },
        { label: 'Contact Us', to: '/contact' },
        { label: 'Blog', to: '/blog' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'How It Works', to: '/how-it-works' },
        { label: 'FAQ', to: '/faq' },
        { label: 'Customer Support', to: '/support' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms & Conditions', to: '/terms' },
        { label: 'Privacy Policy', to: '/privacy' },
      ],
    },
  ];

  return (
    <footer className="bg-secondary mt-20 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">X</span>
              </div>
              <span className="text-xl font-bold text-foreground">
                Xavorian
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your trusted platform for secure property transactions
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/xavorianxyz" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://x.com/Xavorianxyz" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <SiX className="w-5 h-5" />
              </a>
              <a href="https://tiktok.com/@xavorianxyz" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <SiTiktok className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@Xavorianxyz" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-foreground mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Xavorian. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
