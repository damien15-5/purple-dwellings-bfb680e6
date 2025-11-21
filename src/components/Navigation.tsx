import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Home, User, LogOut, LayoutDashboard, HelpCircle, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import xavorianLogo from '@/assets/xavorian-logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        setUserName(session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User');
        
        // Check verification status
        const { data: kycData } = await supabase
          .from('kyc_documents')
          .select('status')
          .eq('user_id', session.user.id)
          .eq('status', 'verified')
          .maybeSingle();
        
        setIsVerified(!!kycData);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsLoggedIn(true);
        setUserName(session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User');
        
        setTimeout(async () => {
          const { data: kycData } = await supabase
            .from('kyc_documents')
            .select('status')
            .eq('user_id', session.user.id)
            .eq('status', 'verified')
            .maybeSingle();
          
          setIsVerified(!!kycData);
        }, 0);
      } else {
        setIsLoggedIn(false);
        setUserName('');
        setIsVerified(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/browse', label: 'Properties', icon: null },
    { to: '/upload-listing', label: 'Upload Listing', icon: null },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/chats', label: 'Messages', icon: MessageSquare },
    { to: '/about', label: 'About Us', icon: null },
    { to: '/contact', label: 'Contact', icon: null },
    { to: '/faq', label: 'FAQ', icon: HelpCircle },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group shrink-0">
            <img 
              src={xavorianLogo} 
              alt="Xavorian" 
              className="w-10 h-10 transition-transform group-hover:scale-110"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent-purple bg-clip-text text-transparent hidden sm:inline-block">
              Xavorian
            </span>
          </Link>

          {/* Hamburger Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="w-6 h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Navigation Links */}
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to}>
                  <DropdownMenuItem className="cursor-pointer">
                    {link.icon && <link.icon className="w-4 h-4 mr-2" />}
                    {link.label}
                  </DropdownMenuItem>
                </Link>
              ))}
              
              <DropdownMenuSeparator />
              
              {/* User Section */}
              {isLoggedIn ? (
                <>
                  <Link to="/dashboard">
                    <DropdownMenuItem className="cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    {userName}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <DropdownMenuItem className="cursor-pointer">
                      Login
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/signup">
                    <DropdownMenuItem className="cursor-pointer font-semibold">
                      Get Started
                    </DropdownMenuItem>
                  </Link>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};
