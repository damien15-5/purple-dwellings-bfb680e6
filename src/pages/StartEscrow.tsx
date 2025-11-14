import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const StartEscrow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [escrowFees, setEscrowFees] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    agreedPrice: 0,
    paymentMethod: 'card',
    escrowPeriod: '14',
    terms: '',
    agreeToTerms: false,
    readyToProceed: false,
  });
  const [calculatedFee, setCalculatedFee] = useState({ fee: 0, total: 0 });

  useEffect(() => {
    fetchPropertyAndFees();
  }, [id]);

  useEffect(() => {
    if (formData.agreedPrice > 0 && escrowFees.length > 0) {
      calculateFee();
    }
  }, [formData.agreedPrice, escrowFees]);

  const fetchPropertyAndFees = async () => {
    try {
      // Get property details
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (propertyError) throw propertyError;

      setProperty(propertyData);
      
      // Get seller profile
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
      
      setFormData(prev => ({ ...prev, agreedPrice: propertyData.price }));

      // Get escrow fees
      const { data: feesData, error: feesError } = await supabase
        .from('escrow_fees')
        .select('*')
        .order('min_amount', { ascending: true });

      if (feesError) throw feesError;
      setEscrowFees(feesData);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const calculateFee = () => {
    const amount = formData.agreedPrice;
    const tier = escrowFees.find(
      fee => amount >= fee.min_amount && (fee.max_amount === null || amount <= fee.max_amount)
    );

    if (tier) {
      const fee = (amount * tier.fee_percentage / 100) + tier.fixed_fee;
      setCalculatedFee({ fee, total: amount + fee });
    }
  };

  const handleNext = () => {
    if (step === 1 && formData.agreedPrice <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (step === 2 && (!formData.agreeToTerms || !formData.readyToProceed)) {
      toast.error('Please accept all terms to proceed');
      return;
    }
    setStep(step + 1);
  };

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

      // Create escrow transaction
      const { data: escrow, error: escrowError } = await supabase
        .from('escrow_transactions')
        .insert({
          property_id: id,
          buyer_id: user.id,
          seller_id: property.user_id,
          transaction_amount: formData.agreedPrice,
          escrow_fee: calculatedFee.fee,
          total_amount: calculatedFee.total,
          terms: formData.terms,
          status: 'pending_payment',
        })
        .select()
        .single();

      if (escrowError) throw escrowError;

      // Initialize payment
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'initialize-payment',
        {
          body: { escrowId: escrow.id },
        }
      );

      if (paymentError) throw paymentError;

      if (paymentData.success) {
        // Redirect to Paystack payment page
        window.location.href = paymentData.authorization_url;
      } else {
        throw new Error(paymentData.error || 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('Error creating escrow:', error);
      toast.error(error.message || 'Failed to create escrow');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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

  if (step === 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full animate-scale-in">
          <CardContent className="text-center py-12">
            <CheckCircle2 className="h-24 w-24 text-success mx-auto mb-6 animate-float" />
            <h1 className="text-3xl font-bold mb-4">Escrow Created Successfully!</h1>
            <p className="text-muted-foreground mb-8">
              Your escrow transaction has been initiated and is now secure
            </p>
            
            <Card className="bg-accent/50 p-6 mb-8">
              <Label className="text-sm text-muted-foreground mb-2 block">Transaction Code</Label>
              <div className="flex items-center justify-center gap-2">
                <code className="text-2xl font-mono font-bold">{escrowCode}</code>
                <Button variant="ghost" size="icon" onClick={copyCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            <div className="space-y-3">
              <Button onClick={() => navigate('/my-escrow')} className="w-full hover-lift">
                View Transaction
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
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    s <= step ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      s < step ? 'bg-primary' : 'bg-accent'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            <span className={step >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}>
              Transaction Details
            </span>
            <span className={step >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'}>
              Terms & Conditions
            </span>
            <span className={step >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'}>
              Review & Confirm
            </span>
          </div>
        </div>

        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Start Secure Escrow
            </CardTitle>
            <CardDescription>
              Create a secure escrow transaction for: <strong>{property.title}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Transaction Details */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <Label>Property Price (Read-only)</Label>
                  <Input
                    value={`₦${property.price.toLocaleString()}`}
                    disabled
                    className="bg-accent"
                  />
                </div>
                
                <div>
                  <Label htmlFor="agreedPrice">Agreed Price *</Label>
                  <Input
                    id="agreedPrice"
                    type="number"
                    value={formData.agreedPrice}
                    onChange={(e) => setFormData({ ...formData, agreedPrice: Number(e.target.value) })}
                    placeholder="Enter agreed price"
                  />
                </div>

                <div>
                  <Label>Payment Method *</Label>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="bank-transfer" id="bank" />
                      <Label htmlFor="bank" className="cursor-pointer flex-1">Bank Transfer</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="cursor-pointer flex-1">Debit/Credit Card</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="crypto" id="crypto" />
                      <Label htmlFor="crypto" className="cursor-pointer flex-1">Cryptocurrency</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Escrow Period *</Label>
                  <RadioGroup
                    value={formData.escrowPeriod}
                    onValueChange={(value) => setFormData({ ...formData, escrowPeriod: value })}
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="7" id="7days" />
                      <Label htmlFor="7days" className="cursor-pointer flex-1">7 Days</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="14" id="14days" />
                      <Label htmlFor="14days" className="cursor-pointer flex-1">14 Days (Recommended)</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="30" id="30days" />
                      <Label htmlFor="30days" className="cursor-pointer flex-1">30 Days</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 2: Terms */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <Label htmlFor="terms">Terms of Transaction</Label>
                  <Textarea
                    id="terms"
                    placeholder="Describe any special terms or conditions..."
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Document Requirements</Label>
                  <div className="space-y-3 bg-accent/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-sm">Property Deed ✓</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-sm">Certificate of Ownership ✓</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-sm">ID Verified ✓</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agreeTerms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, agreeToTerms: checked as boolean })
                      }
                    />
                    <Label htmlFor="agreeTerms" className="cursor-pointer">
                      I agree to the escrow terms and conditions *
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="readyProceed"
                      checked={formData.readyToProceed}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, readyToProceed: checked as boolean })
                      }
                    />
                    <Label htmlFor="readyProceed" className="cursor-pointer">
                      I am ready to proceed with this transaction *
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-accent/50 p-6 rounded-lg space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Property</span>
                    <span className="font-semibold">{property.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agreed Price</span>
                    <span className="font-semibold">₦{formData.agreedPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-semibold capitalize">{formData.paymentMethod.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Escrow Period</span>
                    <span className="font-semibold">{formData.escrowPeriod} Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seller</span>
                    <span className="font-semibold">{property.seller.name}</span>
                  </div>
                </div>

                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-semibold mb-2">Escrow Protection</h4>
                        <p className="text-sm text-muted-foreground">
                          Your funds will be held securely by our escrow service until both parties confirm completion of the transaction.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
                className="hover-lift"
              >
                Back
              </Button>
              {step < 3 ? (
                <Button onClick={handleNext} className="hover-lift">
                  Next Step
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="hover-lift animate-glow">
                  Confirm & Create Escrow
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
