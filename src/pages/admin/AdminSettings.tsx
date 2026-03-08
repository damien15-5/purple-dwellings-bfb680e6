import React, { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, Shield, Bell, Database, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminSettings = () => {
  const { admin } = useAdmin();
  const [otpStep, setOtpStep] = useState<'idle' | 'awaiting_otp' | 'processing'>('idle');
  const [otpValue, setOtpValue] = useState('');

  const handleInitiateDisableOTP = async () => {
    setOtpStep('processing');
    try {
      const { data, error } = await supabase.functions.invoke('paystack-disable-otp', {
        body: { action: 'initiate' },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'Failed to initiate');
      toast.success(data.message || 'OTP sent to your business phone number');
      setOtpStep('awaiting_otp');
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate OTP disable');
      setOtpStep('idle');
    }
  };

  const handleFinalizeDisableOTP = async () => {
    if (!otpValue.trim()) {
      toast.error('Please enter the OTP');
      return;
    }
    setOtpStep('processing');
    try {
      const { data, error } = await supabase.functions.invoke('paystack-disable-otp', {
        body: { action: 'finalize', otp: otpValue.trim() },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'Failed to finalize');
      toast.success('Transfer OTP disabled successfully! Auto-transfers will now work.');
      setOtpStep('idle');
      setOtpValue('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to finalize OTP disable');
      setOtpStep('awaiting_otp');
    }
  };

  if (admin?.role !== 'super_admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">System configuration</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">Access Denied</p>
              <p className="text-sm text-muted-foreground mt-2">
                Only Super Admin can access settings
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage platform configuration</p>
      </div>

      <div className="grid gap-6">
        {/* Paystack Transfer OTP Control */}
        <Card className="border-2 border-orange-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-500" />
              <CardTitle>Paystack Transfer OTP</CardTitle>
            </div>
            <CardDescription>
              Disable transfer OTP to enable automatic payouts to sellers. An OTP will be sent to your Paystack business phone number for verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {otpStep === 'idle' && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Disable Transfer OTP</p>
                  <p className="text-sm text-muted-foreground">
                    Step 1: Click to receive an OTP on your business phone
                  </p>
                </div>
                <Button variant="destructive" onClick={handleInitiateDisableOTP}>
                  Disable OTP
                </Button>
              </div>
            )}

            {otpStep === 'awaiting_otp' && (
              <div className="space-y-3">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-orange-900">
                    ✅ OTP sent! Check your Paystack business phone number.
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Enter the OTP below to complete the process.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter OTP from your phone"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    maxLength={10}
                  />
                  <Button onClick={handleFinalizeDisableOTP}>
                    Confirm
                  </Button>
                  <Button variant="outline" onClick={() => { setOtpStep('idle'); setOtpValue(''); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {otpStep === 'processing' && (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-sm text-muted-foreground">Processing...</p>
              </div>
            )}

            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                ⚠️ <strong>Security Warning:</strong> Disabling OTP means all transfers happen automatically without secondary verification. Only do this if auto-payouts are required.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>General Settings</CardTitle>
            </div>
            <CardDescription>Platform-wide configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Maintenance Mode</p>
                <p className="text-sm text-muted-foreground">Put the platform in maintenance mode</p>
              </div>
              <Button variant="outline" onClick={() => alert('Maintenance mode configuration coming soon')}>Configure</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Feature Toggles</p>
                <p className="text-sm text-muted-foreground">Enable or disable platform features</p>
              </div>
              <Button variant="outline" onClick={() => alert('Feature toggles management coming soon')}>Manage</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>Security and authentication settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Change Admin Password</p>
                <p className="text-sm text-muted-foreground">Update your admin password</p>
              </div>
              <Button variant="outline" onClick={() => alert('Password change functionality coming soon')}>Change</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">IP Access Control</p>
                <p className="text-sm text-muted-foreground">Manage allowed IP addresses</p>
              </div>
              <Button variant="outline" onClick={() => alert('IP access control coming soon')}>Configure</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Security Logs</p>
                <p className="text-sm text-muted-foreground">View security and access logs</p>
              </div>
              <Button variant="outline" onClick={() => alert('Security logs coming soon')}>View Logs</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Transaction Settings</CardTitle>
            </div>
            <CardDescription>Escrow and fee configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Escrow Fee Percentage</p>
                <p className="text-sm text-muted-foreground">Configure platform fee percentage</p>
              </div>
              <Button variant="outline" onClick={() => alert('Escrow fee configuration coming soon')}>Configure</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Verification Thresholds</p>
                <p className="text-sm text-muted-foreground">Set KYC verification requirements</p>
              </div>
              <Button variant="outline" onClick={() => alert('Verification threshold configuration coming soon')}>Configure</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Configure email notification settings</p>
              </div>
              <Button variant="outline" onClick={() => alert('Email notification configuration coming soon')}>Configure</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alert Preferences</p>
                <p className="text-sm text-muted-foreground">Manage admin alert preferences</p>
              </div>
              <Button variant="outline" onClick={() => alert('Alert preferences coming soon')}>Configure</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
