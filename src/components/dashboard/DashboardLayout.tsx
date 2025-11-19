import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  Home, 
  Settings, 
  Shield, 
  ListChecks, 
  Heart, 
  Handshake, 
  Lock, 
  FileCheck, 
  Bell, 
  MessageSquare, 
  HelpCircle,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home', end: true },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
  { to: '/dashboard/verification', icon: Shield, label: 'Verification' },
  { to: '/dashboard/my-listings', icon: ListChecks, label: 'My Listings' },
  { to: '/dashboard/saved', icon: Heart, label: 'Saved Properties' },
  { to: '/dashboard/offers', icon: Handshake, label: 'Offers & Negotiations' },
  { to: '/dashboard/escrow', icon: Lock, label: 'Escrow Transactions' },
  { to: '/dashboard/documents', icon: FileCheck, label: 'Document Verification' },
  { to: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
  { to: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/dashboard/help', icon: HelpCircle, label: 'Help & Support' },
];

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <h1 className="ml-4 text-xl font-bold text-gradient-purple">Dashboard</h1>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-40
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="h-16 flex items-center justify-center border-b border-border">
          <h1 className="text-2xl font-bold text-gradient-purple">Xavorian</h1>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-8rem)]">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive 
                  ? 'bg-gradient-to-r from-accent-purple to-accent-purple-light text-white shadow-lg' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
