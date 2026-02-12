import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const ChangePasswordSection = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: 'Error', description: 'Please fill in all password fields', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Success', description: 'Password updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update password', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-accent-purple" />
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new_password">New Password</Label>
          <Input
            id="new_password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm New Password</Label>
          <Input
            id="confirm_password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />
        </div>
        <Button variant="outline" className="w-full md:w-auto" onClick={handleUpdatePassword} disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </Button>
      </CardContent>
    </Card>
  );
};
