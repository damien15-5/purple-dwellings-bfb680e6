import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Shield, UserCog, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface AdminUser {
  id: string;
  username: string;
  role: string;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
  telegram_username: string | null;
}

const AdminManagement = () => {
  const { admin } = useAdmin();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminDialogOpen, setNewAdminDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newSecondPassword, setNewSecondPassword] = useState('');
  const [newTelegramUsername, setNewTelegramUsername] = useState('');

  useEffect(() => {
    if (admin?.role === 'super_admin') {
      loadAdmins();
    }
  }, [admin]);

  const loadAdmins = async () => {
    try {
      const { data } = await supabase
        .from('admin_credentials')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setAdmins(data as any[]);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCredentials = () => {
    const username = Math.random().toString(36).substring(2, 10);
    const password = Math.random().toString(36).substring(2, 12);
    const secondPassword = Math.random().toString(36).substring(2, 12);

    setNewUsername(username);
    setNewPassword(password);
    setNewSecondPassword(secondPassword);
  };

  const handleCreateAdmin = async () => {
    if (!newUsername || !newPassword || !newSecondPassword) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.from('admin_credentials').insert({
        username: newUsername,
        password_hash: newPassword,
        second_password_hash: newSecondPassword,
        role: 'sub_admin',
        telegram_username: newTelegramUsername || null,
      } as any);

      if (error) throw error;

      toast({
        title: 'Admin Created',
        description: `Sub-admin created successfully. Username: ${newUsername}`,
      });

      setNewAdminDialogOpen(false);
      setNewUsername('');
      setNewPassword('');
      setNewSecondPassword('');
      setNewTelegramUsername('');
      loadAdmins();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create admin',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAdmin = async (id: string, username: string) => {
    if (username === 'damien15_5') {
      toast({
        title: 'Cannot Delete',
        description: 'Cannot delete super admin account',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete admin: ${username}?`)) return;

    try {
      const { error } = await supabase.from('admin_credentials').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Admin Deleted',
        description: 'Admin has been deleted',
      });
      loadAdmins();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete admin',
        variant: 'destructive',
      });
    }
  };

  if (admin?.role !== 'super_admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Management</h1>
          <p className="text-muted-foreground mt-1">Manage admin accounts</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">Access Denied</p>
              <p className="text-sm text-muted-foreground mt-2">
                Only Super Admin can manage admin accounts
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Management</h1>
          <p className="text-muted-foreground mt-1">Manage admin accounts and permissions</p>
        </div>

        <Dialog open={newAdminDialogOpen} onOpenChange={setNewAdminDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Admin</DialogTitle>
              <DialogDescription>
                Create a new sub-admin account with generated credentials
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Username (max 8 characters)</Label>
                <div className="flex gap-2">
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    maxLength={8}
                  />
                  <Button onClick={generateCredentials} variant="outline">
                    Generate
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Password (max 10 characters)</Label>
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  maxLength={10}
                  type="password"
                />
              </div>
              <div className="space-y-2">
                <Label>Second Password (max 10 characters)</Label>
                <Input
                  value={newSecondPassword}
                  onChange={(e) => setNewSecondPassword(e.target.value)}
                  maxLength={10}
                  type="password"
                />
              </div>
              <div className="space-y-2">
                <Label>Telegram Username (without @)</Label>
                <Input
                  value={newTelegramUsername}
                  onChange={(e) => setNewTelegramUsername(e.target.value.replace('@', ''))}
                  placeholder="e.g. john_doe"
                />
                <p className="text-xs text-muted-foreground">
                  This links their Telegram account as an admin on the bot
                </p>
              </div>
              <Button onClick={handleCreateAdmin} className="w-full">
                Create Sub-Admin
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Loading admins...</div>
        ) : admins.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">No admins found</div>
            </CardContent>
          </Card>
        ) : (
          admins.map((adminUser) => (
            <Card key={adminUser.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserCog className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-lg">{adminUser.username}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Created: {new Date(adminUser.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={adminUser.role === 'super_admin' ? 'default' : 'secondary'}>
                      {adminUser.role.replace('_', ' ')}
                    </Badge>
                    {(adminUser as any).telegram_username && (
                      <Badge variant="outline">📱 @{(adminUser as any).telegram_username}</Badge>
                    )}
                    {adminUser.is_active ? (
                      <Badge variant="outline">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Last login: {adminUser.last_login ? new Date(adminUser.last_login).toLocaleString() : 'Never'}
                  </p>
                  {adminUser.username !== 'damien15_5' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAdmin(adminUser.id, adminUser.username)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminManagement;