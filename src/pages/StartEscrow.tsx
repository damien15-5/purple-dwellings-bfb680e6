import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ShieldCheck, AlertCircle, MapPin, Home, Bed, Bath, Maximize, FileText, CheckCircle2 } from 'lucide-react';
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
  const [payment, setPayment] = useState<{ authorization_url: string; access_code: string; reference: string; tx_hash: string } | null>(null);
  const [formData, setFormData] = useState({
    paymentMethod: 'card',
    terms: '',
    agreeToTerms: false,
    readyToProceed: false,
  });

  const calculateEscrowFee = (price: number) => {
    const feePercentage = price > 30000000 ? 0.01 : 0.015;
    return price * feePercentage;
  };

  const escrowFee = property ? calculateEscrowFee(property.price) : 0;
  const totalAmount = property ? property.price + escrowFee : 0;

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

  const handleNext = () => {
    if (step === 2 && (!formData.agreeToTerms || !formData.readyToProceed)) {
      toast.error('Please accept all terms to proceed');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    // If payment already prepared, just redirect
    if (payment?.authorization_url) {
      window.location.href = payment.authorization_url;
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to continue');
        navigate('/login');
        return;
      }

      const { data: escrow, error: escrowError } = await supabase
        .from('escrow_transactions' as any)
        .insert({
          property_id: id,
          buyer_id: user.id,
          seller_id: property.user_id,
          transaction_amount: property.price,
          escrow_fee: escrowFee,
          total_amount: totalAmount,
          terms: formData.terms,
          status: 'pending_payment',
          inspection_start_date: new Date().toISOString(),
          inspection_end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (escrowError) throw escrowError;

      // Initialize payment but DO NOT redirect automatically
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'initialize-payment',
        {
          body: { escrowId: (escrow as any).id },
        }
      );

      if (paymentError) throw paymentError;

      if (paymentData.success) {
        setPayment({
          authorization_url: paymentData.authorization_url,
          access_code: paymentData.access_code,
          reference: paymentData.reference,
          tx_hash: paymentData.tx_hash,
        });
        toast.success('Payment generated. Review details below and click Pay Now');
      } else {
        throw new Error(paymentData.error || 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('Error creating escrow:', error);
      toast.error(error.message || 'Failed to create escrow');
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
                  Terms & Documents
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
                    <ShieldCheck className="h-6 w-6 text-primary-foreground" />
                  </div>
                  Secure Escrow Transaction
                </CardTitle>
                <CardDescription className="text-base">
                  Complete the form below to initiate a secure escrow for <strong className="text-foreground">{property.title}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Step 1: Payment Method */}
                {step === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-gradient-to-br from-accent/50 to-accent/20 p-6 rounded-xl border border-border/50">
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Transaction Summary
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Property Price</span>
                          <span className="font-bold text-lg">₦{property.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/30">
                          <span className="text-muted-foreground">
                            Escrow Fee ({property.price > 30000000 ? '1%' : '1.5%'})
                          </span>
                          <span className="font-bold text-lg text-primary">₦{escrowFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 bg-primary/5 -mx-6 px-6 rounded-lg">
                          <span className="font-semibold text-lg">Total Amount</span>
                          <span className="font-bold text-2xl text-primary">₦{totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-sm text-foreground">
                          <strong>Escrow Period:</strong> 21 Days - All transactions must be completed within this timeframe.
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-semibold mb-3 block">Select Payment Method</Label>
                      <RadioGroup
                        value={formData.paymentMethod}
                        onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                        className="space-y-3"
                      >
                        <div className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${
                          formData.paymentMethod === 'bank-transfer' ? 'border-primary bg-primary/5' : 'border-border'
                        }`}>
                          <RadioGroupItem value="bank-transfer" id="bank" />
                          <Label htmlFor="bank" className="cursor-pointer flex-1 font-medium">
                            Bank Transfer
                          </Label>
                        </div>
                        <div className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${
                          formData.paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border'
                        }`}>
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card" className="cursor-pointer flex-1 font-medium">
                            Debit/Credit Card
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {/* Step 2: Terms & Documents */}
                {step === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <Label htmlFor="terms" className="text-base font-semibold mb-2 block">
                        Additional Terms (Optional)
                      </Label>
                      <Textarea
                        id="terms"
                        placeholder="Add any special terms or conditions for this transaction..."
                        value={formData.terms}
                        onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    <div>
                      <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Documents Uploaded
                      </Label>
                      <div className="space-y-2 bg-gradient-to-br from-accent/50 to-accent/20 p-5 rounded-xl border border-border/50">
                        {property.documents && Array.isArray(property.documents) && property.documents.length > 0 ? (
                          property.documents.map((doc: any, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-background/80 rounded-lg">
                              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{doc.name || `Document ${index + 1}`}</p>
                                <p className="text-xs text-muted-foreground">{doc.type || 'Document'}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-background/80 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-sm">Property documentation verified by seller</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 bg-primary/5 p-5 rounded-xl border border-primary/20">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="agreeTerms"
                          checked={formData.agreeToTerms}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, agreeToTerms: checked as boolean })
                          }
                          className="mt-1"
                        />
                        <Label htmlFor="agreeTerms" className="cursor-pointer leading-relaxed">
                          I agree to the escrow terms and conditions, including the 21-day transaction period
                        </Label>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="readyProceed"
                          checked={formData.readyToProceed}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, readyToProceed: checked as boolean })
                          }
                          className="mt-1"
                        />
                        <Label htmlFor="readyProceed" className="cursor-pointer leading-relaxed">
                          I am ready to proceed with this transaction and understand that funds will be held in escrow
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-gradient-to-br from-accent/50 to-accent/20 p-6 rounded-xl space-y-4 border border-border/50">
                      <h3 className="font-semibold text-lg mb-4">Transaction Details</h3>
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="text-muted-foreground">Property</span>
                        <span className="font-semibold text-right">{property.title}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="text-muted-foreground">Property Price</span>
                        <span className="font-semibold">₦{property.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="text-muted-foreground">Escrow Fee</span>
                        <span className="font-semibold text-primary">₦{escrowFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 bg-primary/5 -mx-6 px-6 rounded-lg">
                        <span className="font-semibold text-lg">Total to Pay</span>
                        <span className="font-bold text-2xl text-primary">₦{totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="text-muted-foreground">Payment Method</span>
                        <span className="font-semibold capitalize">{formData.paymentMethod.replace('-', ' ')}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="text-muted-foreground">Escrow Period</span>
                        <span className="font-semibold">21 Days</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Seller</span>
                        <span className="font-semibold">{seller?.full_name || 'Property Owner'}</span>
                      </div>
                    </div>

                    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-primary/20">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg mb-2">Escrow Protection Active</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              Your total payment of ₦{totalAmount.toLocaleString()} will be held securely by our escrow service. 
                              Funds will only be released to the seller after you confirm receipt and satisfaction with the property. 
                              You have 21 days to complete all inspections and confirmations.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 1 || submitting}
                    className="hover-lift"
                    size="lg"
                  >
                    Back
                  </Button>
                  {step < 3 ? (
                    <Button onClick={handleNext} className="hover-lift" size="lg">
                      Continue
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubmit} 
                      disabled={submitting}
                      className="hover-lift bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary"
                      size="lg"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Proceed to Payment'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Property Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="card-glow overflow-hidden">
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={property.images?.[0] || '/placeholder.svg'}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                    {property.property_type}
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl mb-2 line-clamp-2">{property.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="line-clamp-1">{property.address}</span>
                  </p>

                  <div className="space-y-3 mb-4">
                    {property.bedrooms && (
                      <div className="flex items-center gap-3 text-sm">
                        <Bed className="h-4 w-4 text-muted-foreground" />
                        <span>{property.bedrooms} Bedrooms</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center gap-3 text-sm">
                        <Bath className="h-4 w-4 text-muted-foreground" />
                        <span>{property.bathrooms} Bathrooms</span>
                      </div>
                    )}
                    {property.area && (
                      <div className="flex items-center gap-3 text-sm">
                        <Maximize className="h-4 w-4 text-muted-foreground" />
                        <span>{property.area} sqm</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Property Price</span>
                      <span className="text-2xl font-bold text-primary">
                        ₦{property.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold mb-1">100% Secure</p>
                      <p className="text-muted-foreground text-xs">
                        Your payment is protected by our escrow service until transaction completion.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
