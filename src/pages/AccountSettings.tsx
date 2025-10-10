import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Shield, CreditCard } from 'lucide-react';

export const AccountSettings = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // KYC fields
  const [identityType, setIdentityType] = useState<'nin' | 'passport' | 'drivers_license'>('nin');
  const [identityNumber, setIdentityNumber] = useState('');

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
      } else {
        setIsLoggedIn(true);
        setEmail(session.user.email || '');
        loadProfile(session.user.id);
      }
    });
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setFullName(data.full_name || '');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKYCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('kyc_documents')
        .upsert({
          user_id: user.id,
          identity_type: identityType,
          identity_number: identityNumber,
        });

      if (error) throw error;

      toast({
        title: 'KYC updated',
        description: 'Your verification documents have been submitted',
      });
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Account <span className="text-gradient-primary">Settings</span>
            </h1>
            <p className="text-muted-foreground">
              Manage your profile, verification, and payment methods
            </p>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="kyc" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                KYC Verification
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment Methods
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <div className="bg-white rounded-xl p-8 border-2 border-light-purple-border">
                <h2 className="text-2xl font-bold mb-6 text-foreground">Profile Information</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={email}
                      disabled
                      className="h-12 bg-secondary"
                    />
                    <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 xxx xxx xxxx"
                      className="h-12"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent-purple hover:opacity-90"
                  >
                    {loading ? 'Updating...' : 'Save Changes'}
                  </Button>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="kyc">
              <div className="bg-white rounded-xl p-8 border-2 border-light-purple-border">
                <h2 className="text-2xl font-bold mb-6 text-foreground">KYC Verification</h2>
                <form onSubmit={handleKYCSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="identityType">Identity Document Type</Label>
                    <Select value={identityType} onValueChange={(value: any) => setIdentityType(value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nin">National Identity Number (NIN)</SelectItem>
                        <SelectItem value="passport">International Passport</SelectItem>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="identityNumber">Identity Number</Label>
                    <Input
                      id="identityNumber"
                      value={identityNumber}
                      onChange={(e) => setIdentityNumber(e.target.value)}
                      placeholder="Enter your identity number"
                      className="h-12"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent-purple hover:opacity-90"
                  >
                    {loading ? 'Submitting...' : 'Submit for Verification'}
                  </Button>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="payment">
              <div className="bg-white rounded-xl p-8 border-2 border-light-purple-border">
                <h2 className="text-2xl font-bold mb-6 text-foreground">Payment Methods</h2>
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No payment methods added</h3>
                  <p className="text-muted-foreground mb-6">
                    Add a payment method to make transactions faster
                  </p>
                  <Button className="bg-gradient-to-r from-primary to-accent-purple hover:opacity-90">
                    Add Payment Method
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
