import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Banknote, ArrowRight, Info, AlertTriangle, Copy, CheckCircle, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const StartEscrow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const existingEscrowId = searchParams.get('escrowId');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [existingEscrow, setExistingEscrow] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [notes, setNotes] = useState('');

  const effectivePrice = existingEscrow?.offer_amount || property?.price || 0;

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  useEffect(() => {
    if (existingEscrowId && property) {
      fetchExistingEscrow();
    }
  }, [existingEscrowId, property]);

  const fetchExistingEscrow = async () => {
    try {
      const { data: escrow, error } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('id', existingEscrowId)
        .single();
      if (error) throw error;
      setExistingEscrow(escrow);
    } catch (error: any) {
      console.error('Error fetching existing escrow:', error);
      toast.error(error.message || 'Failed to load escrow details');
    }
  };

  const fetchPropertyDetails = async () => {
    try {
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (propertyError) throw propertyError;
      setProperty(propertyData);
      
      const { data: sellerData } = await supabase
        .from('profiles')
        .select('full_name, email, bank_name, account_number, account_name, bank_verified')
        .eq('id', propertyData.user_id)
        .single();

      setSeller(sellerData || { full_name: 'Property Owner', email: '' });
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleConfirmPaymentMade = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to continue');
        navigate('/login');
        return;
      }

      let escrowId = existingEscrowId;

      if (!escrowId) {
        // Create new escrow transaction
        const { data: escrow, error: escrowError } = await supabase
          .from('escrow_transactions' as any)
          .insert({
            property_id: id,
            buyer_id: user.id,
            seller_id: property.user_id,
            transaction_amount: effectivePrice,
            escrow_fee: 0,
            platform_fee: 0,
            atara_fee: 0,
            total_amount: effectivePrice,
            terms: notes,
            payment_method: 'bank_transfer',
            payment_timing: 'now',
            status: 'funded',
            payment_verified_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (escrowError) throw escrowError;
        escrowId = (escrow as any).id;
      } else {
        // Update existing escrow
        await supabase
          .from('escrow_transactions')
          .update({
            status: 'funded',
            payment_method: 'bank_transfer',
            payment_verified_at: new Date().toISOString(),
            terms: notes,
            escrow_fee: 0,
            platform_fee: 0,
            atara_fee: 0,
            total_amount: effectivePrice,
          })
          .eq('id', escrowId);
      }

      // Notify seller about payment
      await supabase.rpc('create_notification', {
        p_user_id: property.user_id,
        p_title: 'Payment Made',
        p_description: `A buyer has confirmed payment of ₦${effectivePrice.toLocaleString()} for ${property.title}. Please confirm in your Transactions page.`,
        p_type: 'payment',
      });

      // Send Telegram notification to seller
      try {
        await supabase.functions.invoke('telegram-notify', {
          body: {
            type: 'payment_made',
            data: {
              userId: property.user_id,
              amount: effectivePrice,
              propertyTitle: property.title,
              buyerName: user.user_metadata?.full_name || 'A buyer',
            },
          },
        });
      } catch (tgErr) {
        console.error('Telegram notify error:', tgErr);
      }

      toast.success('Payment confirmed! Waiting for seller to verify.');
      navigate('/dashboard/escrow');
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast.error(error.message || 'Failed to confirm payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/5 to-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/5 to-background">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
            <p className="text-muted-foreground mb-6">The property you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/browse')}>Browse Properties</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {[1, 2].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all shadow-md ${
                      s <= step ? 'bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-primary' : 'bg-secondary text-muted-foreground'
                    }`}>
                      {s}
                    </div>
                    {s < 2 && <div className={`flex-1 h-1 mx-2 transition-all rounded-full ${s < step ? 'bg-gradient-to-r from-primary to-primary-light' : 'bg-secondary'}`} />}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className={step >= 1 ? 'text-primary' : 'text-muted-foreground'}>Seller's Account & Review</span>
                <span className={step >= 2 ? 'text-primary' : 'text-muted-foreground'}>Confirm Payment</span>
              </div>
            </div>

            {/* Disclaimer Banner */}
            <div className="mb-6 p-4 bg-destructive/10 border-2 border-destructive/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-destructive text-base">⚠️ Important Disclaimer</p>
                  <p className="text-sm text-foreground mt-1">
                    Xavorian does not control or hold any funds. Payments are made directly between you and the seller. 
                    <strong> Xavorian is not held accountable for any issues after payment has been made.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Advisory Banner */}
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800 dark:text-amber-200 text-base">Before You Pay</p>
                  <ul className="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-1 list-disc list-inside">
                    <li>Make sure you have physically visited and inspected the property</li>
                    <li>Verify all property documents with the seller</li>
                    <li>Confirm the agreed price and terms with the seller</li>
                    <li>Ensure you are satisfied with the property condition</li>
                    <li>Keep records of all communications and agreements</li>
                  </ul>
                </div>
              </div>
            </div>

            <Card className="card-glow border-primary/10">
              <CardHeader className="border-b border-border/50 bg-gradient-to-br from-accent/30 to-transparent">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary-light">
                    <Banknote className="h-6 w-6 text-primary-foreground" />
                  </div>
                  Make Payment
                </CardTitle>
                <CardDescription className="text-base">
                  Transfer directly to the seller's bank account for <strong className="text-foreground">{property.title}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Step 1: Seller Account & Review */}
                {step === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Seller Bank Details */}
                    {seller?.bank_verified && seller?.account_number ? (
                      <div className="border-2 rounded-xl p-6 border-primary bg-primary/5">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Banknote className="h-5 w-5 text-primary" />
                          Seller's Bank Account Details
                        </h3>
                        <div className="space-y-3 bg-background/50 p-4 rounded-lg border border-border/50">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Bank</span>
                            <span className="font-medium">{seller.bank_name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Account Number</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-lg">{seller.account_number}</span>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(seller.account_number)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Account Name</span>
                            <span className="font-medium">{seller.account_name}</span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3 bg-background/50 p-4 rounded-lg border border-border/50">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Amount to Transfer</span>
                            <span className="font-bold text-2xl text-primary">₦{effectivePrice.toLocaleString()}</span>
                          </div>
                          {existingEscrow?.offer_amount && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Negotiated from</span>
                              <span className="line-through text-muted-foreground">₦{property.price.toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <p className="text-xs text-foreground flex items-start gap-2">
                            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span>Transfer the exact amount shown above to the seller's account. After making the transfer, click "Next" to confirm your payment.</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 rounded-xl p-6 border-destructive/30 bg-destructive/5">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                          <div>
                            <h3 className="font-semibold text-lg">Seller Has Not Added Bank Details</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                              The seller hasn't added their bank account yet. Please message the seller and ask them to add their bank details in Account Settings.
                            </p>
                            <Button 
                              variant="outline" 
                              className="mt-4"
                              onClick={() => navigate(`/chat/${id}`)}
                            >
                              Message Seller
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Notes */}
                    <div>
                      <Label htmlFor="notes" className="text-base font-semibold mb-2 block">Additional Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any notes about this payment..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">Cancel</Button>
                      <Button 
                        onClick={() => setStep(2)} 
                        className="flex-1 gap-2"
                        disabled={!seller?.bank_verified || !seller?.account_number}
                      >
                        Next <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Confirm Payment */}
                {step === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-gradient-to-br from-accent/50 to-accent/20 p-6 rounded-xl border border-border/50 space-y-4">
                      <h3 className="font-semibold text-lg">Payment Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Property</span>
                          <span className="font-semibold text-right max-w-[60%]">{property.title}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Seller</span>
                          <span className="font-semibold">{seller?.full_name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Payment Method</span>
                          <span className="font-semibold">Bank Transfer</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Bank</span>
                          <span className="font-semibold">{seller?.bank_name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Account</span>
                          <span className="font-mono font-semibold">{seller?.account_number}</span>
                        </div>
                        <div className="flex justify-between py-3 bg-primary/5 -mx-6 px-6 rounded-lg">
                          <span className="font-semibold text-lg">Total Amount</span>
                          <span className="font-bold text-2xl text-primary">₦{effectivePrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                      <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>
                          By clicking "I Have Made Payment", you confirm that you have transferred ₦{effectivePrice.toLocaleString()} to the seller's account. 
                          The seller will be notified to verify receipt of payment.
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(1)} className="flex-1" disabled={submitting}>Back</Button>
                      <Button 
                        onClick={handleConfirmPaymentMade} 
                        disabled={submitting}
                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            I Have Made Payment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="overflow-hidden card-glow border-primary/10">
              {property.images && property.images.length > 0 && (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-2">{property.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{property.address}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Listing Price</span>
                    <span className="font-semibold">₦{property.price.toLocaleString()}</span>
                  </div>
                  {existingEscrow?.offer_amount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Agreed Price</span>
                      <span className="font-bold text-primary">₦{existingEscrow.offer_amount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow p-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  After confirming payment, the seller will verify receipt. You'll be notified once confirmed.
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
