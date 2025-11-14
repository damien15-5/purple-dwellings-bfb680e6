import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const PaymentConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [escrowId, setEscrowId] = useState<string | null>(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    const escrow = searchParams.get('escrow');
    const reference = searchParams.get('reference');

    if (!escrow) {
      setStatus('failed');
      toast.error('Invalid payment reference');
      return;
    }

    setEscrowId(escrow);

    try {
      // Check escrow status
      const { data: escrowData, error } = await supabase
        .from('escrow_transactions')
        .select('status, paystack_reference')
        .eq('id', escrow)
        .single();

      if (error) throw error;

      // Check if payment was successful
      if (escrowData.status === 'funded') {
        setStatus('success');
        toast.success('Payment confirmed successfully');
      } else if (escrowData.status === 'pending_payment') {
        // Wait a bit and check again (webhook might be processing)
        setTimeout(async () => {
          const { data: updatedData } = await supabase
            .from('escrow_transactions')
            .select('status')
            .eq('id', escrow)
            .single();

          if (updatedData?.status === 'funded') {
            setStatus('success');
            toast.success('Payment confirmed successfully');
          } else {
            setStatus('failed');
            toast.error('Payment verification failed');
          }
        }, 3000);
      } else {
        setStatus('failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setStatus('failed');
      toast.error('Failed to verify payment');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/5 to-background">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
            <h2 className="text-2xl font-bold mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/5 to-background p-4">
        <Card className="max-w-2xl w-full animate-scale-in">
          <CardContent className="text-center py-12">
            <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto mb-6 animate-float" />
            <h1 className="text-3xl font-bold mb-4">Payment Successful</h1>
            <p className="text-muted-foreground mb-8">
              Your payment has been confirmed and funds are now held securely in escrow.
              The inspection period has begun.
            </p>

            <Card className="bg-accent/50 p-6 mb-8 text-left">
              <h3 className="font-semibold mb-4">What Happens Next?</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Funds are securely held in escrow for 14 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Inspect the property during the inspection period</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Confirm transaction to release funds to seller</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span>Raise a dispute if there are any issues</span>
                </li>
              </ul>
            </Card>

            <div className="space-y-3">
              <Button onClick={() => navigate('/dashboard/escrows')} className="w-full" size="lg">
                View My Escrows
              </Button>
              <Button onClick={() => navigate('/browse')} variant="outline" className="w-full">
                Browse More Properties
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/5 to-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="text-center py-12">
          <XCircle className="h-24 w-24 text-destructive mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Payment Failed</h1>
          <p className="text-muted-foreground mb-8">
            We couldn't verify your payment. Please try again or contact support.
          </p>

          <div className="space-y-3">
            {escrowId && (
              <Button onClick={() => navigate(`/start-escrow/${escrowId}`)} className="w-full">
                Try Again
              </Button>
            )}
            <Button onClick={() => navigate('/browse')} variant="outline" className="w-full">
              Back to Properties
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
