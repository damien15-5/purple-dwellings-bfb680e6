import React from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, Shield, Bell, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminSettings = () => {
  const { admin } = useAdmin();

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