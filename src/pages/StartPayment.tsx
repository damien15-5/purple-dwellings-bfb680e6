import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, AlertCircle, CreditCard, AlertTriangle, ArrowRight, Banknote, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const StartPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    paymentMethod: 'paystack' as 'paystack' | 'transfer',
    paymentTiming: 'now' as 'now' | 'later',
  });

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
      
      const { data: sellerData } = await supabase
        .from('profiles')
        .select('full_name, email, bank_name, account_number, account_name')
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

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to continue');
        navigate('/login');
        return;
      }

      // Create purchase transaction
      const { data: transaction, error } = await supabase
        .from('purchase_transactions')
        .insert({
          property_id: id,
          buyer_id: user.id,
          seller_id: property.user_id,
          transaction_amount: property.price,
          payment_method: formData.paymentMethod,
          payment_timing: formData.paymentTiming,
          status: 'pending',
          seller_bank_name: seller?.bank_name || null,
          seller_account_number: seller?.account_number || null,
          seller_account_name: seller?.account_name || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (formData.paymentMethod === 'transfer') {
        toast.success('Transaction created! Transfer details are shown.');
        navigate('/dashboard/transactions');
        return;
      }

      if (formData.paymentTiming === 'later') {
        toast.success('Payment saved! You can complete it from your Transactions page.');
        navigate('/dashboard/transactions');
        return;
      }

      // Initialize Paystack payment
      toast.loading('Preparing payment gateway...');
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'initialize-payment',
        { body: { purchaseId: transaction.id } }
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
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
                <span className={step >= 1 ? 'text-primary' : 'text-muted-foreground'}>Payment Method</span>
                <span className={step >= 2 ? 'text-primary' : 'text-muted-foreground'}>Payment Timing</span>
                <span className={step >= 3 ? 'text-primary' : 'text-muted-foreground'}>Review & Confirm</span>
              </div>
            </div>

            {/* Disclaimer Banner */}
            <div className="mb-6 p-4 bg-destructive/10 border-2 border-destructive/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-destructive text-base">⚠️ Important Disclaimer</p>
                  <p className="text-sm text-foreground mt-1">
                    Xavorian does not control funds. Make sure you have fully negotiated with the seller before you make any transfers or payments. All transactions are between you and the seller directly.
                  </p>
                </div>
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
                  Choose your payment method for <strong className="text-foreground">{property.title}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Step 1: Payment Method */}
                {step === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <Label className="text-base font-semibold mb-4 block">Select Payment Method</Label>
                    <RadioGroup
                      value={formData.paymentMethod}
                      onValueChange={(value: any) => setFormData({ ...formData, paymentMethod: value })}
                      className="space-y-4"
                    >
                      {/* Paystack Option */}
                      <div className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                        formData.paymentMethod === 'paystack' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}>
                        <div className="flex items-start gap-4">
                          <RadioGroupItem value="paystack" id="paystack" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="paystack" className="cursor-pointer font-semibold text-lg flex items-center gap-2">
                              <CreditCard className="h-5 w-5 text-primary" />
                              Pay with Paystack
                            </Label>
                            <p className="text-sm text-muted-foreground mt-2">
                              Pay securely via card, bank transfer, or USSD through Paystack payment gateway.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Transfer Option */}
                      <div className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                        formData.paymentMethod === 'transfer' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}>
                        <div className="flex items-start gap-4">
                          <RadioGroupItem value="transfer" id="transfer" className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor="transfer" className="cursor-pointer font-semibold text-lg flex items-center gap-2">
                              <Banknote className="h-5 w-5 text-primary" />
                              Pay with Transfer
                            </Label>
                            <p className="text-sm text-muted-foreground mt-2">
                              Transfer directly to the seller's bank account. You'll see their account details after confirmation.
                            </p>
                            
                            {formData.paymentMethod === 'transfer' && seller?.account_number && (
                              <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border/50 space-y-3">
                                <h4 className="font-semibold text-sm">Seller's Bank Details</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Bank</span>
                                    <span className="font-medium">{seller.bank_name}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Account Number</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-medium">{seller.account_number}</span>
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(seller.account_number)}>
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Account Name</span>
                                    <span className="font-medium">{seller.account_name}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {formData.paymentMethod === 'transfer' && !seller?.account_number && (
                              <div className="mt-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                                <p className="text-sm text-destructive font-medium">
                                  ⚠️ Seller has not added their bank details yet. Contact the seller to get their account information.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </RadioGroup>

                    <div className="flex justify-end pt-4">
                      <Button onClick={() => setStep(2)} className="gap-2">
                        Next <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Payment Timing (only for Paystack) */}
                {step === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    {formData.paymentMethod === 'paystack' ? (
                      <>
                        <Label className="text-base font-semibold mb-4 block">When do you want to pay?</Label>
                        <RadioGroup
                          value={formData.paymentTiming}
                          onValueChange={(value: any) => setFormData({ ...formData, paymentTiming: value })}
                          className="space-y-4"
                        >
                          <div className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                            formData.paymentTiming === 'now' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          }`}>
                            <div className="flex items-start gap-4">
                              <RadioGroupItem value="now" id="now" className="mt-1" />
                              <div>
                                <Label htmlFor="now" className="cursor-pointer font-semibold text-lg">Pay Now</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  You'll be redirected to Paystack to complete payment immediately.
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                            formData.paymentTiming === 'later' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          }`}>
                            <div className="flex items-start gap-4">
                              <RadioGroupItem value="later" id="later" className="mt-1" />
                              <div>
                                <Label htmlFor="later" className="cursor-pointer font-semibold text-lg">Pay Later</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Save this transaction and pay from your Transactions page when ready. Status will show as "Pending".
                                </p>
                              </div>
                            </div>
                          </div>
                        </RadioGroup>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Banknote className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Bank Transfer Selected</h3>
                        <p className="text-muted-foreground">
                          You'll transfer directly to the seller's bank account. This transaction will be saved for your records.
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                      <Button onClick={() => setStep(3)} className="gap-2">
                        Next <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Review Your Payment</h3>
                      
                      <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Property</span>
                          <span className="font-medium">{property.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-bold text-xl text-primary">₦{property.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Method</span>
                          <span className="font-medium">{formData.paymentMethod === 'paystack' ? 'Paystack' : 'Bank Transfer'}</span>
                        </div>
                        {formData.paymentMethod === 'paystack' && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Timing</span>
                            <span className="font-medium">{formData.paymentTiming === 'now' ? 'Pay Now' : 'Pay Later'}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Seller</span>
                          <span className="font-medium">{seller?.full_name || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Disclaimer again */}
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-foreground">
                            <strong>Xavorian does not control funds.</strong> Make sure you have fully negotiated with the seller before making any payments.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                      <Button 
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="gap-2"
                      >
                        {submitting ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                        ) : formData.paymentMethod === 'transfer' ? (
                          'Confirm Transaction'
                        ) : formData.paymentTiming === 'now' ? (
                          'Proceed to Payment'
                        ) : (
                          'Save for Later'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Property Summary */}
          <div className="lg:col-span-1">
            <Card className="card-glow sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Property Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.images?.[0] && (
                  <img src={property.images[0]} alt={property.title} className="w-full h-48 object-cover rounded-lg" />
                )}
                <div>
                  <h3 className="font-semibold">{property.title}</h3>
                  <p className="text-sm text-muted-foreground">{property.address}</p>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold text-primary">₦{property.price.toLocaleString()}</p>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Seller</p>
                  <p className="font-medium">{seller?.full_name || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
