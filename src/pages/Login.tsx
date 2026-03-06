import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import xavorianLogo from '@/assets/xavorian-logo.png';
import houseBackground from '@/assets/house-background.jpg';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      sessionStorage.setItem('xavorian_just_logged_in', 'true');
      
      try {
        await supabase.functions.invoke('telegram-notify', {
          body: {
            type: 'login_alert',
            data: { userId: data.user?.id, time: new Date().toLocaleString() }
          }
        });
      } catch (e) { /* silent */ }
      
      toast({
        title: 'Welcome back!',
        description: 'Successfully logged in',
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-0 bg-background">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-light-purple-border">
        <div 
          className="hidden lg:flex flex-col justify-center items-center p-0 relative bg-cover bg-center"
          style={{ backgroundImage: `url(${houseBackground})` }}
        />

        <div className="bg-card p-6 sm:p-8 md:p-12 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto space-y-8">
            <div className="lg:hidden text-center mb-8">
              <img src={xavorianLogo} alt="Xavorian" className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Welcome to Xavorian</h2>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">User Login</h2>
              <p className="text-muted-foreground">Access your account</p>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-primary to-accent-purple hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
