import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const PaymentConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    const purchaseId = searchParams.get('purchase');
    const escrowId = searchParams.get('escrow');
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    const isPromotion = searchParams.get('promotion') === 'true';
    const promoRef = searchParams.get('ref');

    // Handle promotion payment verification
    if (isPromotion && promoRef) {
      try {
        const { data, error } = await supabase.functions.invoke('verify-promotion-payment', {
          body: { reference: promoRef },
        });
        if (!error && data?.success) {
          setStatus('success');
          toast.success('Promotions activated successfully!');
        } else {
          setStatus('failed');
          toast.error('Promotion payment verification failed');
        }
      } catch {
        setStatus('failed');
        toast.error('Failed to verify promotion payment');
      }
      return;
    }

    // Handle escrow payment verification
    if (escrowId) {
      try {
        const { data: escrow } = await supabase
          .from('escrow_transactions')
          .select('status, payment_verified_at')
          .eq('id', escrowId)
          .single();

        if (escrow?.status === 'funded' && escrow?.payment_verified_at) {
          setStatus('success');
          toast.success('Payment confirmed successfully');
          return;
        }

        const { data: verifyResp, error: verifyErr } = await supabase.functions.invoke('verify-payment', {
          body: { escrowId, reference }
        });

        if (!verifyErr && verifyResp?.success) {
          setStatus('success');
          toast.success('Payment confirmed successfully');
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 3000));

        const { data: retryEscrow } = await supabase
          .from('escrow_transactions')
          .select('status, payment_verified_at')
          .eq('id', escrowId)
          .single();

        if (retryEscrow?.status === 'funded' && retryEscrow?.payment_verified_at) {
          setStatus('success');
          toast.success('Payment confirmed successfully');
        } else {
          await new Promise(resolve => setTimeout(resolve, 3000));
          const { data: finalEscrow } = await supabase
            .from('escrow_transactions')
            .select('status, payment_verified_at')
            .eq('id', escrowId)
            .single();

          if (finalEscrow?.status === 'funded' && finalEscrow?.payment_verified_at) {
            setStatus('success');
            toast.success('Payment confirmed successfully');
          } else {
            setStatus('failed');
            toast.error('Payment verification is taking longer than expected. Check your transactions page.');
          }
        }
      } catch (error: any) {
        console.error('Escrow payment verification error:', error);
        setStatus('failed');
        toast.error('Failed to verify payment');
      }
      return;
    }

    // Handle purchase transaction payment
    if (!purchaseId) {
      setStatus('failed');
      toast.error('Invalid payment reference');
      return;
    }

    try {
      const { data: txData, error } = await supabase
        .from('purchase_transactions')
        .select('status')
        .eq('id', purchaseId)
        .single();

      if (error) throw error;

      if (txData.status === 'successful') {
        setStatus('success');
        toast.success('Payment confirmed successfully');
        return;
      }

      if (reference) {
        const { data: verifyResp, error: verifyErr } = await supabase.functions.invoke('verify-payment', {
          body: { purchaseId, reference }
        });
        if (!verifyErr && verifyResp?.success) {
          setStatus('success');
          toast.success('Payment confirmed');
          return;
        }
      }

      setTimeout(async () => {
        const { data: updatedData } = await supabase
          .from('purchase_transactions')
          .select('status')
          .eq('id', purchaseId)
          .single();

        if (updatedData?.status === 'successful') {
          setStatus('success');
          toast.success('Payment confirmed successfully');
        } else {
          setStatus('failed');
          toast.error('Payment verification failed');
        }
      }, 2000);
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setStatus('failed');
      toast.error('Failed to verify payment');
    }
  };

  const getRedirectPath = () => {
    const isPromo = searchParams.get('promotion') === 'true';
    const escrowId = searchParams.get('escrow');
    if (isPromo) return '/dashboard/promotions';
    if (escrowId) return '/dashboard/escrow';
    return '/dashboard/transactions';
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
            <p className="text-muted-foreground mb-4">
              Your payment has been confirmed. You can view this transaction in your dashboard.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-8 flex items-start gap-2 text-sm text-muted-foreground max-w-md mx-auto">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                The seller will receive the funds within <strong>T+1 business day</strong>. This is Paystack's standard settlement timeline, not ours.
              </span>
            </div>
            <div className="space-y-3">
              <Button onClick={() => navigate(getRedirectPath())} className="w-full" size="lg">
                View Transactions
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
          <h1 className="text-3xl font-bold mb-4">Verification Pending</h1>
          <p className="text-muted-foreground mb-8">
            Payment verification is still processing. Please check your transactions page in a few moments.
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate(getRedirectPath())} className="w-full">
              View Transactions
            </Button>
            <Button onClick={() => navigate('/browse')} variant="outline" className="w-full">
              Back to Properties
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
