import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ShieldCheck, AlertCircle, CreditCard, AlertTriangle, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const StartEscrow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    paymentMethod: 'escrow' as 'escrow' | 'direct',
    paymentTiming: 'now' as 'now' | 'later',
    terms: '',
  });

  // Fee calculations
  const calculateFees = (price: number) => {
    const ataraFee = price * 0.015; // 1.5%
    const platformFee = price > 30000000 ? price * 0.005 : price * 0.01; // 0.5% or 1%
    return { ataraFee, platformFee };
  };

  const fees = property ? calculateFees(property.price) : { ataraFee: 0, platformFee: 0 };
  const totalFees = fees.ataraFee + fees.platformFee;
  const totalAmount = property ? property.price + totalFees : 0;

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

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
      
      const { data: sellerData, error: sellerError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', propertyData.user_id)
        .single();

      if (sellerError) {
        console.error('Error fetching seller:', sellerError);
        setSeller({ full_name: 'Property Owner', email: '' });
      } else {
        setSeller(sellerData);
      }
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

      // Create transaction record
      const { data: escrow, error: escrowError } = await supabase
        .from('escrow_transactions' as any)
        .insert({
          property_id: id,
          buyer_id: user.id,
          seller_id: property.user_id,
          transaction_amount: property.price,
          atara_fee: fees.ataraFee,
          platform_fee: fees.platformFee,
          escrow_fee: totalFees,
          total_amount: totalAmount,
          terms: formData.terms,
          payment_method: formData.paymentMethod,
          payment_timing: formData.paymentTiming,
          status: formData.paymentTiming === 'now' ? 'pending_payment' : 'pending_payment',
          inspection_start_date: new Date().toISOString(),
          inspection_end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (escrowError) throw escrowError;

      if (formData.paymentTiming === 'later') {
        toast.success('Payment scheduled! You can complete it from your Transactions page.');
        navigate('/dashboard/escrow');
        return;
      }

      // Initialize payment for "Pay Now"
      if (formData.paymentMethod === 'escrow') {
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
          'initialize-payment',
          {
            body: { escrowId: (escrow as any).id },
          }
        );

        if (paymentError) throw paymentError;

        if (paymentData.success) {
          toast.success('Redirecting to payment gateway...');
          window.location.href = paymentData.authorization_url;
        } else {
          throw new Error(paymentData.error || 'Failed to initialize payment');
        }
      } else {
        // Direct payment - show confirmation and navigate
        toast.success('Payment request created. Please complete payment directly to the seller.');
        navigate('/dashboard/escrow');
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error(error.message || 'Failed to create payment');
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
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all shadow-md ${
                        s <= step 
                          ? 'bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-primary' 
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {s}
                    </div>
                    {s < 3 && (
                      <div
                        className={`flex-1 h-1 mx-2 transition-all rounded-full ${
                          s < step ? 'bg-gradient-to-r from-primary to-primary-light' : 'bg-secondary'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className={step >= 1 ? 'text-primary' : 'text-muted-foreground'}>
                  Payment Method
                </span>
                <span className={step >= 2 ? 'text-primary' : 'text-muted-foreground'}>
                  Payment Timing
                </span>
                <span className={step >= 3 ? 'text-primary' : 'text-muted-foreground'}>
                  Review & Confirm
                </span>
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
                  Choose your preferred payment method for <strong className="text-foreground">{property.title}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Step 1: Payment Method */}
                {step === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <Label className="text-base font-semibold mb-4 block">Select Payment Method</Label>
                      <RadioGroup
                        value={formData.paymentMethod}
                        onValueChange={(value: any) => setFormData({ ...formData, paymentMethod: value })}
                        className="space-y-4"
                      >
                        {/* Escrow Payment Option */}
                        <div className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                          formData.paymentMethod === 'escrow' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}>
                          <div className="flex items-start gap-4">
                            <RadioGroupItem value="escrow" id="escrow" className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor="escrow" className="cursor-pointer font-semibold text-lg flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                Make Payment via Escrow (Atara Pay)
                              </Label>
                              <p className="text-sm text-muted-foreground mt-2">
                                Secure payment held in escrow until property verification is complete. Full platform protection.
                              </p>
                              
                              {formData.paymentMethod === 'escrow' && (
                                <div className="mt-4 space-y-3 bg-background/50 p-4 rounded-lg border border-border/50">
                                  <h4 className="font-semibold text-sm">Fee Breakdown</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Atara Pay Fee (1.5%)</span>
                                      <span className="font-medium">₦{fees.ataraFee.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Platform Fee ({property.price > 30000000 ? '0.5%' : '1%'})
                                      </span>
                                      <span className="font-medium">₦{fees.platformFee.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-border/50">
                                      <span className="font-semibold">Total Fees</span>
                                      <span className="font-semibold text-primary">₦{totalFees.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-border/50">
                                      <span className="font-semibold">Total Payment</span>
                                      <span className="font-bold text-lg text-primary">₦{totalAmount.toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                                    <p className="text-xs text-foreground flex items-start gap-2">
                                      <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                      <span>Funds are securely held until you confirm property delivery and sign documents.</span>
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Direct Payment Option */}
                        <div className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                          formData.paymentMethod === 'direct' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}>
                          <div className="flex items-start gap-4">
                            <RadioGroupItem value="direct" id="direct" className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor="direct" className="cursor-pointer font-semibold text-lg flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                Make Payment Directly to Seller's Account
                              </Label>
                              <p className="text-sm text-muted-foreground mt-2">
                                Pay directly to the seller without escrow protection. Lower fees but higher risk.
                              </p>
                              
                              {formData.paymentMethod === 'direct' && (
                                <div className="mt-4 space-y-3">
                                  <div className="bg-background/50 p-4 rounded-lg border border-border/50">
                                    <h4 className="font-semibold text-sm mb-3">Fee Breakdown</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Paystack Fee (1.5%)</span>
                                        <span className="font-medium">₦{fees.ataraFee.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                          Platform Fee ({property.price > 30000000 ? '0.5%' : '1%'})
                                        </span>
                                        <span className="font-medium">₦{fees.platformFee.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between pt-2 border-t border-border/50">
                                        <span className="font-semibold">Total Fees</span>
                                        <span className="font-semibold text-primary">₦{totalFees.toLocaleString()}</span>
                                      </div>
                                      <div className="flex justify-between pt-2 border-t border-border/50">
                                        <span className="font-semibold">Total Payment</span>
                                        <span className="font-bold text-lg text-primary">₦{totalAmount.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                                    <div className="flex items-start gap-2">
                                      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                                      <div>
                                        <h4 className="font-semibold text-sm text-destructive mb-1">Risk Warning</h4>
                                        <p className="text-xs text-foreground">
                                          Direct payments are not protected by escrow. The platform cannot guarantee transaction security or 
                                          recover funds in case of fraud or disputes. Proceed with caution and only if you trust the seller.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={handleNext} className="flex-1 gap-2">
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </Button>
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
                              <Label htmlFor="now" className="cursor-pointer font-semibold text-lg">
                                Make Payment Now
                              </Label>
                              <p className="text-sm text-muted-foreground mt-1">
                                Process payment immediately and secure the property
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${
                          formData.paymentTiming === 'later' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}>
                          <div className="flex items-start gap-4">
                            <RadioGroupItem value="later" id="later" className="mt-1" />
                            <div className="flex-1">
                              <Label htmlFor="later" className="cursor-pointer font-semibold text-lg">
                                Make Payment Later
                              </Label>
                              <p className="text-sm text-muted-foreground mt-1">
                                Save payment details and complete transaction from your Transactions page
                              </p>
                            </div>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="terms" className="text-base font-semibold mb-2 block">
                        Additional Notes (Optional)
                      </Label>
                      <Textarea
                        id="terms"
                        placeholder="Add any special notes or instructions for this payment..."
                        value={formData.terms}
                        onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handleBack} className="flex-1">
                        Back
                      </Button>
                      <Button onClick={handleNext} className="flex-1 gap-2">
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </Button>
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
                          <span className="font-semibold">
                            {formData.paymentMethod === 'escrow' ? 'Escrow (Atara Pay)' : 'Direct to Seller'}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Payment Timing</span>
                          <span className="font-semibold">
                            {formData.paymentTiming === 'now' ? 'Pay Now' : 'Pay Later'}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Property Price</span>
                          <span className="font-semibold">₦{property.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Processing Fee</span>
                          <span className="font-semibold">₦{fees.ataraFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Platform Fee</span>
                          <span className="font-semibold">₦{fees.platformFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-3 bg-primary/5 -mx-6 px-6 rounded-lg">
                          <span className="font-semibold text-lg">Total Amount</span>
                          <span className="font-bold text-2xl text-primary">₦{totalAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      {formData.paymentMethod === 'escrow' && (
                        <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <p className="text-xs text-foreground flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />
                            <span>Funds will be held securely in escrow and released to seller after you confirm property delivery.</span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handleBack} className="flex-1" disabled={submitting}>
                        Back
                      </Button>
                      <Button 
                        onClick={handleSubmit} 
                        className="flex-1 gap-2"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            {formData.paymentTiming === 'now' ? 'Proceed to Payment' : 'Save Payment'}
                            <ArrowRight className="h-4 w-4" />
                          </>
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
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-48 object-cover rounded-lg border border-border"
                  />
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
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Property Price</span>
                    <span className="text-sm font-bold">₦{property.price.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};