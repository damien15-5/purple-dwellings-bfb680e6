import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle, CreditCard, ArrowRight, Info } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    paymentTiming: 'now' as 'now' | 'later',
    terms: '',
  });

  const PLATFORM_FEE = 2000; // ₦2,000 platform fee
  const effectivePrice = existingEscrow?.offer_amount || property?.price || 0;
  const totalWithFee = effectivePrice + PLATFORM_FEE;

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
        .select('full_name, email')
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

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
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
        const { data: escrow, error: escrowError } = await supabase
          .from('escrow_transactions' as any)
          .insert({
            property_id: id,
            buyer_id: user.id,
            seller_id: property.user_id,
            transaction_amount: effectivePrice,
            atara_fee: 0,
            platform_fee: 0,
            escrow_fee: 0,
            total_amount: effectivePrice,
            terms: formData.terms,
            payment_method: 'direct',
            payment_timing: formData.paymentTiming,
            status: 'pending_payment',
            inspection_start_date: new Date().toISOString(),
            inspection_end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single();

        if (escrowError) throw escrowError;
        escrowId = (escrow as any).id;
      } else {
        await supabase
          .from('escrow_transactions')
          .update({
            payment_method: 'direct',
            payment_timing: formData.paymentTiming,
            terms: formData.terms,
            atara_fee: 0,
            platform_fee: 0,
            escrow_fee: 0,
            total_amount: effectivePrice,
          })
          .eq('id', escrowId);
      }

      if (formData.paymentTiming === 'later') {
        toast.success('Payment saved! You can complete it from your Transactions page.');
        navigate('/dashboard/escrow');
        return;
      }

      toast.loading('Preparing payment gateway...');
      
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'initialize-payment',
        { body: { escrowId } }
      );

      if (paymentError) throw paymentError;

      if (paymentData.success) {
        toast.success('Redirecting to Paystack...');
        window.location.href = paymentData.authorization_url;
      } else {
        throw new Error(paymentData.error || 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error(error.message || 'Failed to create payment');
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
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all shadow-md ${
                      s <= step ? 'bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-primary' : 'bg-secondary text-muted-foreground'
                    }`}>
                      {s}
                    </div>
                    {s < 3 && <div className={`flex-1 h-1 mx-2 transition-all rounded-full ${s < step ? 'bg-gradient-to-r from-primary to-primary-light' : 'bg-secondary'}`} />}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className={step >= 1 ? 'text-primary' : 'text-muted-foreground'}>Payment Info</span>
                <span className={step >= 2 ? 'text-primary' : 'text-muted-foreground'}>Payment Timing</span>
                <span className={step >= 3 ? 'text-primary' : 'text-muted-foreground'}>Review & Confirm</span>
              </div>
            </div>

            <Card className="card-glow border-primary/10">
              <CardHeader className="border-b border-border/50 bg-gradient-to-br from-accent/30 to-transparent">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary-light">
                    <CreditCard className="h-6 w-6 text-primary-foreground" />
                  </div>
                  Make Payment
                </CardTitle>
                <CardDescription className="text-base">
                  Pay via Paystack for <strong className="text-foreground">{property.title}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Step 1: Payment Info */}
                {step === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="border-2 rounded-xl p-6 border-primary bg-primary/5">
                      <div className="flex items-start gap-4">
                        <CreditCard className="h-6 w-6 text-primary mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">Pay via Paystack</h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            Pay securely via Paystack. Full property price is transferred to the seller after a ₦2,000 platform fee.
                          </p>
                          
                          <div className="mt-4 space-y-3 bg-background/50 p-4 rounded-lg border border-border/50">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Property Price</span>
                                <span className="font-medium">₦{effectivePrice.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Platform Fee</span>
                                <span className="font-medium">₦{PLATFORM_FEE.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Paystack Processing Fees</span>
                                <span>Included in total</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-border/50">
                                <span className="font-semibold">Total Payment</span>
                                <span className="font-bold text-lg text-primary">₦{totalWithFee.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                              <p className="text-xs text-foreground flex items-start gap-2">
                                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <span>₦{effectivePrice.toLocaleString()} goes to the seller. ₦{PLATFORM_FEE.toLocaleString()} platform fee. Paystack fees stay within the payment processor.</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">Cancel</Button>
                      <Button onClick={handleNext} className="flex-1 gap-2">Continue <ArrowRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Payment Timing */}
                {step === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <Label className="text-base font-semibold mb-4 block">When would you like to pay?</Label>
                      <RadioGroup
                        value={formData.paymentTiming}
                        onValueChange={(value: any) => setFormData({ ...formData, paymentTiming: value })}
                        className="space-y-4"
                      >
                        <div className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
                          formData.paymentTiming === 'now' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}>
                          <div className="flex items-start gap-4">
                            <RadioGroupItem value="now" id="now" className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor="now" className="cursor-pointer font-semibold text-lg">Make Payment Now</Label>
                              <p className="text-sm text-muted-foreground mt-1">Process payment immediately via Paystack</p>
                            </div>
                          </div>
                        </div>
                        <div className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
                          formData.paymentTiming === 'later' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}>
                          <div className="flex items-start gap-4">
                            <RadioGroupItem value="later" id="later" className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor="later" className="cursor-pointer font-semibold text-lg">Make Payment Later</Label>
                              <p className="text-sm text-muted-foreground mt-1">Save and complete from your Transactions page</p>
                            </div>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="terms" className="text-base font-semibold mb-2 block">Additional Notes (Optional)</Label>
                      <Textarea
                        id="terms"
                        placeholder="Add any special notes or instructions..."
                        value={formData.terms}
                        onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                      <Button onClick={handleNext} className="flex-1 gap-2">Continue <ArrowRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Confirm */}
                {step === 3 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-gradient-to-br from-accent/50 to-accent/20 p-6 rounded-xl border border-border/50 space-y-4">
                      <h3 className="font-semibold text-lg">Payment Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Property</span>
                          <span className="font-semibold text-right max-w-[60%]">{property.title}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Payment Method</span>
                          <span className="font-semibold">Paystack</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Payment Timing</span>
                          <span className="font-semibold">{formData.paymentTiming === 'now' ? 'Pay Now' : 'Pay Later'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Property Price</span>
                          <span className="font-semibold">₦{effectivePrice.toLocaleString()}</span>
                        </div>
                        {existingEscrow?.offer_amount && (
                          <div className="flex justify-between py-2 bg-accent/30 -mx-6 px-6">
                            <span className="text-sm text-foreground">Negotiated Offer</span>
                            <span className="text-sm font-semibold text-primary">
                              Saved ₦{(property.price - existingEscrow.offer_amount).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Fees</span>
                          <span className="font-semibold text-green-600">₦0 (Free)</span>
                        </div>
                        <div className="flex justify-between py-3 bg-primary/5 -mx-6 px-6 rounded-lg">
                          <span className="font-semibold text-lg">Total Amount</span>
                          <span className="font-bold text-2xl text-primary">₦{effectivePrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handleBack} className="flex-1" disabled={submitting}>Back</Button>
                      <Button onClick={handleSubmit} className="flex-1 gap-2" disabled={submitting}>
                        {submitting ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                        ) : (
                          <>{formData.paymentTiming === 'now' ? 'Proceed to Payment' : 'Save Payment'} <ArrowRight className="h-4 w-4" /></>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Property Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 card-glow">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-lg">Property Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {property.images && property.images.length > 0 && (
                  <img src={property.images[0]} alt={property.title} className="w-full h-48 object-cover rounded-lg border border-border" />
                )}
                <div>
                  <h3 className="font-semibold text-lg mb-1">{property.title}</h3>
                  <p className="text-sm text-muted-foreground">{property.address}</p>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Seller</span>
                    <span className="text-sm font-medium">{seller?.full_name}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Original Price</span>
                    <span className="text-sm font-bold">₦{property.price.toLocaleString()}</span>
                  </div>
                  {existingEscrow?.offer_amount && (
                    <>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-primary">Negotiated Price</span>
                        <span className="text-sm font-bold text-primary">₦{existingEscrow.offer_amount.toLocaleString()}</span>
                      </div>
                      <div className="bg-accent/30 p-2 rounded-lg border border-border/50">
                        <p className="text-xs text-foreground text-center">
                          You saved ₦{(property.price - existingEscrow.offer_amount).toLocaleString()}!
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
