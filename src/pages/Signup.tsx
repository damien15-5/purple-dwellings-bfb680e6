import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import xavorianLogo from '@/assets/xavorian-logo.png';
import houseBackground from '@/assets/house-background.jpg';
import { CheckCircle2 } from 'lucide-react';

export const Signup = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Step 1 fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState<'buyer' | 'seller' | 'agent'>('buyer');

  // Step 2 fields (KYC)
  const [identityType, setIdentityType] = useState<'nin' | 'passport' | 'drivers_license'>('nin');
  const [identityNumber, setIdentityNumber] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 18) {
      toast({
        title: 'Invalid age',
        description: 'You must be at least 18 years old',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            age: ageNum,
            account_type: accountType,
          },
          emailRedirectTo: 'https://xavorian.xyz/verified',
        },
      });

      if (error) throw error;

      if (data.user) {
        // Profile is automatically created by database trigger
        // Delay Telegram notification to allow profile trigger to complete
        setTimeout(async () => {
          try {
            await supabase.functions.invoke('telegram-notify', {
              body: { type: 'new_user', data: { fullName, email, accountType, userId: data.user!.id } },
            });
          } catch (e) { console.error('Telegram notify error:', e); }
        }, 2000);
        
        // Move to KYC step
        setStep(2);
        toast({
          title: 'Account created!',
          description: 'Please complete your KYC verification',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Signup failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('kyc_documents')
        .insert({
          user_id: user.id,
          identity_type: identityType,
          identity_number: identityNumber,
        });

      if (error) throw error;

      toast({
        title: 'KYC submitted!',
        description: 'Your documents are being verified',
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'KYC submission failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipKYC = async () => {
    toast({
      title: 'KYC skipped',
      description: 'You can complete KYC verification later from your profile',
    });
    navigate('/dashboard');
  };

  const handleGoogleSignup = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://xavorian.xyz/dashboard',
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: 'Google signup failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-0 bg-background">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-light-purple-border">
        {/* Left side - House image without overlay */}
        <div 
          className="hidden lg:flex flex-col justify-center items-center p-0 relative bg-cover bg-center"
          style={{ backgroundImage: `url(${houseBackground})` }}
        >
          {/* No overlay - pure image */}
        </div>

        {/* Right side - Signup form */}
        <div className="bg-card p-6 sm:p-8 md:p-12 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto space-y-8">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <img src={xavorianLogo} alt="Xavorian" className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Join Xavorian</h2>
            </div>

            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-foreground">Create Account</h2>
                  <p className="text-muted-foreground">Enter your details to get started</p>
                </div>

                <form onSubmit={handleStep1Submit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      Full Name (as on ID card)
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-sm font-medium">
                      Age
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="18"
                      min="18"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountType" className="text-sm font-medium">
                      Account Type
                    </Label>
                    <Select value={accountType} onValueChange={(value: any) => setAccountType(value)}>
                      <SelectTrigger id="accountType" className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buyer">
                          <div className="flex flex-col items-start">
                            <span className="font-semibold">Buyer</span>
                            <span className="text-xs text-muted-foreground">Browse and purchase properties</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="seller">
                          <div className="flex flex-col items-start">
                            <span className="font-semibold">Seller</span>
                            <span className="text-xs text-muted-foreground">List and sell properties</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="agent">
                          <div className="flex flex-col items-start">
                            <span className="font-semibold">Agent (Buyer + Seller)</span>
                            <span className="text-xs text-muted-foreground">Buy and sell properties</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent-purple hover:opacity-90 transition-opacity"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Next'}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12"
                  onClick={handleGoogleSignup}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign up with Google
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary font-semibold hover:underline">
                    Log in
                  </Link>
                </p>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-foreground">KYC Verification</h2>
                  <p className="text-muted-foreground">Complete your identity verification (optional)</p>
                </div>

                <form onSubmit={handleStep2Submit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="identityType" className="text-sm font-medium">
                      Identity Document Type
                    </Label>
                    <Select value={identityType} onValueChange={(value: any) => setIdentityType(value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nin">National Identity Number (NIN)</SelectItem>
                        <SelectItem value="passport">International Passport</SelectItem>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="identityNumber" className="text-sm font-medium">
                      Identity Number
                    </Label>
                    <Input
                      id="identityNumber"
                      type="text"
                      placeholder="Enter your identity number"
                      value={identityNumber}
                      onChange={(e) => setIdentityNumber(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-3">
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-primary to-accent-purple hover:opacity-90 transition-opacity"
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : 'Submit KYC'}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12"
                      onClick={handleSkipKYC}
                      disabled={loading}
                    >
                      Skip for now
                    </Button>
                  </div>
                </form>

                <p className="text-xs text-muted-foreground text-center">
                  You can complete KYC verification later from your profile settings
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
