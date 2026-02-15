import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Mail } from 'lucide-react';
import xavorianLogo from '@/assets/xavorian-logo.png';
import houseBackground from '@/assets/house-background.jpg';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://xavorian.xyz/reset-password',
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: 'Reset email sent!',
        description: 'Check your email for the password reset link',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to send reset email',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-0">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl border-animated">
        {/* Left side - Welcome section */}
        <div 
          className="hidden lg:flex flex-col justify-center p-12 text-white relative bg-cover bg-center"
          style={{ backgroundImage: `url(${houseBackground})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-accent-purple/90"></div>
          <div className="relative z-10 space-y-6 animate-fade-in">
            <img src={xavorianLogo} alt="Xavorian" className="w-24 h-24 mb-4" />
            <h1 className="text-5xl font-bold leading-tight">
              Reset Your<br />Password
            </h1>
            <p className="text-lg text-white/90">
              Don't worry! It happens. Enter your email and we'll send you a link to reset your password.
            </p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="bg-card p-6 sm:p-8 md:p-12 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto space-y-8">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <img src={xavorianLogo} alt="Xavorian" className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Reset Password</h2>
            </div>

            <Link 
              to="/login" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Link>

            {!sent ? (
              <>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-foreground">Forgot Password?</h2>
                  <p className="text-muted-foreground">
                    Enter your email address and we'll send you a link to reset your password
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent-purple hover:opacity-90 transition-opacity"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center space-y-6 py-8">
                <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Check Your Email</h2>
                  <p className="text-muted-foreground">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Click the link in the email to reset your password. If you don't see it, check your spam folder.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSent(false)}
                  className="w-full"
                >
                  Use different email
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
