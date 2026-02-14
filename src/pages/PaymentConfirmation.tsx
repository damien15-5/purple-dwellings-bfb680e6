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

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    const purchaseId = searchParams.get('purchase');
    const reference = searchParams.get('reference');

    if (!purchaseId) {
      setStatus('failed');
      toast.error('Invalid payment reference');
      return;
    }

    try {
      // Check transaction status
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

      // Try manual verification
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

      // Short poll once more
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
              Your payment has been confirmed. You can view this transaction in your dashboard.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/dashboard/transactions')} className="w-full" size="lg">
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
          <h1 className="text-3xl font-bold mb-4">Payment Failed</h1>
          <p className="text-muted-foreground mb-8">
            We couldn't verify your payment. Please try again or contact support.
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate('/dashboard/transactions')} className="w-full">
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
