import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import xavorianLogo from '@/assets/xavorian-logo.png';
import houseBackground from '@/assets/house-background.jpg';

export const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have a recovery session from the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');

    if (type === 'recovery' && accessToken) {
      setIsValidSession(true);
    } else {
      // Also check if user already has a session (redirected via Supabase)
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsValidSession(!!session);
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      // Backfill profile if missing (for users who signed up before trigger fix)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          await supabase.from('profiles').insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || 'User',
            email: user.email || '',
            age: user.user_metadata?.age ? parseInt(user.user_metadata.age) : null,
            account_type: user.user_metadata?.account_type || 'buyer',
          });
        }
      }

      setSuccess(true);
      toast({ title: 'Password updated!', description: 'You can now log in with your new password' });
      
      // Sign out and redirect to login after 2s
      await supabase.auth.signOut();
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-0 bg-background">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-light-purple-border">
        <div
          className="hidden lg:flex flex-col justify-center p-12 text-white relative bg-cover bg-center"
          style={{ backgroundImage: `url(${houseBackground})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-accent-purple/90" />
          <div className="relative z-10 space-y-6 animate-fade-in">
            <img src={xavorianLogo} alt="Xavorian" className="w-24 h-24 mb-4" />
            <h1 className="text-5xl font-bold leading-tight">Set New<br />Password</h1>
            <p className="text-lg text-white/90">Choose a strong password to keep your account secure.</p>
          </div>
        </div>

        <div className="bg-card p-6 sm:p-8 md:p-12 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto space-y-8">
            <div className="lg:hidden text-center mb-8">
              <img src={xavorianLogo} alt="Xavorian" className="w-16 h-16 mx-auto mb-4" />
            </div>

            <Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
            </Link>

            {isValidSession === false && (
              <div className="text-center space-y-4 py-8">
                <div className="w-16 h-16 bg-destructive/20 rounded-full mx-auto flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold">Invalid or Expired Link</h2>
                <p className="text-muted-foreground">This password reset link is invalid or has expired. Please request a new one.</p>
                <Button onClick={() => navigate('/forgot-password')} className="w-full">Request New Link</Button>
              </div>
            )}

            {isValidSession && !success && (
              <>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-foreground">Set New Password</h2>
                  <p className="text-muted-foreground">Enter your new password below</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input id="password" type="password" placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="h-12" />
                  </div>

                  {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

                  <Button type="submit" className="w-full h-12 bg-gradient-to-r from-primary to-accent-purple hover:opacity-90 transition-opacity" disabled={loading}>
                    <KeyRound className="w-4 h-4 mr-2" />
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </>
            )}

            {success && (
              <div className="text-center space-y-6 py-8">
                <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Password Updated!</h2>
                <p className="text-muted-foreground">Redirecting you to login...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
