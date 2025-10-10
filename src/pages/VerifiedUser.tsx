import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import xavorianLogo from '@/assets/xavorian-logo.png';

export const VerifiedUser = () => {
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setVerifying(false);
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else {
          setError('Verification failed. Please try logging in.');
          setVerifying(false);
        }
      } catch (err: any) {
        setError(err.message);
        setVerifying(false);
      }
    };

    verifyUser();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent-purple/10">
      <div className="w-full max-w-md">
        <div className="bg-card p-8 rounded-2xl shadow-2xl border-animated text-center space-y-6">
          <img src={xavorianLogo} alt="Xavorian" className="w-20 h-20 mx-auto" />
          
          {verifying ? (
            <>
              <div className="animate-pulse">
                <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
                  <div className="w-10 h-10 bg-primary rounded-full"></div>
                </div>
              </div>
              <h1 className="text-2xl font-bold">Verifying your account...</h1>
              <p className="text-muted-foreground">Please wait while we verify your email address</p>
            </>
          ) : error ? (
            <>
              <div className="w-16 h-16 bg-destructive/20 rounded-full mx-auto flex items-center justify-center">
                <span className="text-3xl">❌</span>
              </div>
              <h1 className="text-2xl font-bold text-destructive">Verification Failed</h1>
              <p className="text-muted-foreground">{error}</p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-primary to-accent-purple"
              >
                Go to Login
              </Button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full mx-auto flex items-center justify-center animate-scale-in">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-green-500">Email Verified!</h1>
              <p className="text-muted-foreground">
                Your account has been successfully verified. Redirecting to dashboard...
              </p>
              <div className="w-full bg-accent rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-accent-purple animate-[slide-in-right_3s_ease-in-out]"></div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
