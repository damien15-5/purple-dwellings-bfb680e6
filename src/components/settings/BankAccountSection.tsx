import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Citibank Nigeria', code: '023' },
  { name: 'Diamond Bank (Access)', code: '063' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Globus Bank', code: '00103' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Jaiz Bank', code: '301' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Lotus Bank', code: '303' },
  { name: 'Moniepoint', code: '50515' },
  { name: 'OPay', code: '999992' },
  { name: 'PalmPay', code: '999991' },
  { name: 'Parallex Bank', code: '104' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'SunTrust Bank', code: '100' },
  { name: 'TAJBank', code: '302' },
  { name: 'Titan Trust Bank', code: '102' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank for Africa', code: '033' },
  { name: 'Unity Bank', code: '215' },
  { name: 'VFD Microfinance Bank', code: '566' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];

interface BankAccountProps {
  bankDetails: {
    bank_name: string;
    account_number: string;
    account_name: string;
    bank_verified: boolean;
    paystack_subaccount_code: string;
  };
  setBankDetails: (d: any) => void;
  userId: string | null;
}

export const BankAccountSection = ({ bankDetails, setBankDetails, userId }: BankAccountProps) => {
  const { toast } = useToast();
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState(bankDetails.account_number || '');
  const [resolvedName, setResolvedName] = useState(bankDetails.account_name || '');
  const [resolving, setResolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleResolveAccount = async () => {
    if (!selectedBankCode) {
      toast({ title: 'Error', description: 'Please select a bank', variant: 'destructive' });
      return;
    }
    if (!/^\d{10}$/.test(accountNumber)) {
      toast({ title: 'Error', description: 'Account number must be exactly 10 digits', variant: 'destructive' });
      return;
    }

    setResolving(true);
    setResolvedName('');
    try {
      const { data, error } = await supabase.functions.invoke('verify-bank-account', {
        body: { account_number: accountNumber, bank_code: selectedBankCode },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Verification failed');

      setResolvedName(data.account_name);
      toast({ title: 'Account Found', description: `Account name: ${data.account_name}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Could not resolve account', variant: 'destructive' });
    } finally {
      setResolving(false);
    }
  };

  const handleVerifyAndPay = async () => {
    if (!resolvedName || !userId) return;

    const selectedBank = NIGERIAN_BANKS.find(b => b.code === selectedBankCode);
    if (!selectedBank) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-split-account', {
        body: {
          user_id: userId,
          bank_code: selectedBankCode,
          account_number: accountNumber,
          account_name: resolvedName,
          bank_name: selectedBank.name,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to create account');

      // Redirect to payment
      if (data.authorization_url) {
        toast({
          title: 'Redirecting to Payment',
          description: 'You will pay ₦100 to verify your account. This amount will be refunded by Paystack.',
        });
        setTimeout(() => {
          window.location.href = data.authorization_url;
        }, 1500);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to verify account', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (bankDetails.bank_verified && bankDetails.paystack_subaccount_code) {
    return (
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-accent-purple" />
            Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-4">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Account Verified</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input value={bankDetails.bank_name} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input value={bankDetails.account_number} disabled className="bg-muted" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Account Name</Label>
              <Input value={bankDetails.account_name} disabled className="bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-accent-purple" />
          Account Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Add your bank account for receiving payments. A ₦100 verification fee will be charged and refunded by Paystack.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Bank Name</Label>
            <Select value={selectedBankCode} onValueChange={setSelectedBankCode}>
              <SelectTrigger>
                <SelectValue placeholder="Select your bank" />
              </SelectTrigger>
              <SelectContent>
                {NIGERIAN_BANKS.map((bank) => (
                  <SelectItem key={bank.code} value={bank.code}>
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_number">Account Number</Label>
            <Input
              id="account_number"
              value={accountNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setAccountNumber(val);
                setResolvedName('');
              }}
              placeholder="Enter 10-digit account number"
              maxLength={10}
            />
          </div>
        </div>

        {!resolvedName && (
          <Button
            variant="outline"
            onClick={handleResolveAccount}
            disabled={resolving || !selectedBankCode || accountNumber.length !== 10}
            className="w-full md:w-auto"
          >
            {resolving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        )}

        {resolvedName && (
          <>
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input value={resolvedName} disabled className="bg-muted font-medium" />
            </div>
            <Button
              onClick={handleVerifyAndPay}
              disabled={submitting}
              className="w-full md:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Verify & Pay ₦100 to Initialize'
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              The ₦100 will be refunded to your account by Paystack after verification.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
