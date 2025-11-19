import React, { useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  Home,
  Shield,
  DollarSign,
  MessageSquare,
  MessageCircle,
  Bot,
  LifeBuoy,
  BarChart3,
  Settings,
  UserCog,
  LogOut,
  Menu,
  Search,
  Bell,
} from 'lucide-react';

const AdminLayout = () => {
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/damienxavorianezeani');
  };

  const navItems = [
    { to: '/damienxavorianezeani/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/damienxavorianezeani/users', icon: Users, label: 'Users' },
    { to: '/damienxavorianezeani/listings', icon: Home, label: 'Listings' },
    { to: '/damienxavorianezeani/verification', icon: Shield, label: 'Verification Center' },
    { to: '/damienxavorianezeani/escrow', icon: DollarSign, label: 'Escrow / Transactions' },
    { to: '/damienxavorianezeani/offers', icon: MessageSquare, label: 'Offers & Negotiations' },
    { to: '/damienxavorianezeani/messages', icon: MessageCircle, label: 'Messages' },
    { to: '/damienxavorianezeani/ai-logs', icon: Bot, label: 'AI Logs' },
    { to: '/damienxavorianezeani/tickets', icon: LifeBuoy, label: 'Tickets' },
    { to: '/damienxavorianezeani/reports', icon: BarChart3, label: 'Reports' },
    { to: '/damienxavorianezeani/settings', icon: Settings, label: 'Settings' },
  ];

  // Add Admin Management only for super admin
  if (admin?.role === 'super_admin') {
    navItems.push({
      to: '/damienxavorianezeani/admin-management',
      icon: UserCog,
      label: 'Admin Management',
    });
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-primary">Xavorian Admin</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {admin?.role === 'super_admin' ? 'Super Admin' : 'Sub Admin'}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 border-b flex items-center justify-between px-4 lg:px-6 bg-card">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>

            <div className="relative w-64 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {admin?.username.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:inline">{admin?.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
