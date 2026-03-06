import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/contexts/AdminContext';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Eye, Edit, Trash2, Search, ShieldCheck, ShieldOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  account_type: string | null;
  created_at: string;
  is_verified_badge?: boolean;
  kycStatus?: string;
  listingsCount?: number;
}

const AdminUsers = () => {
  const { admin } = useAdmin();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [togglingBadge, setTogglingBadge] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profiles) {
        const usersWithData = await Promise.all(
          profiles.map(async (profile) => {
            const { data: kyc } = await supabase
              .from('kyc_documents')
              .select('status')
              .eq('user_id', profile.id)
              .single();

            const { count: listingsCount } = await supabase
              .from('properties')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', profile.id);

            return {
              ...profile,
              is_verified_badge: (profile as any).is_verified_badge || false,
              kycStatus: kyc?.status || 'none',
              listingsCount: listingsCount || 0,
            };
          })
        );
        setUsers(usersWithData);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBadge = async (userId: string, currentStatus: boolean) => {
    setTogglingBadge(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified_badge: !currentStatus } as any)
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified_badge: !currentStatus } : u));
      toast({
        title: !currentStatus ? 'Badge Added' : 'Badge Removed',
        description: `Verification badge ${!currentStatus ? 'added to' : 'removed from'} user`,
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update badge', variant: 'destructive' });
    } finally {
      setTogglingBadge(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (admin?.role !== 'super_admin') {
      toast({ title: 'Access Denied', description: 'Only super admin can delete users', variant: 'destructive' });
      return;
    }
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      toast({ title: 'User Deleted', description: 'User has been successfully deleted' });
      loadUsers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getKycBadge = (status: string) => {
    const variants: any = { verified: 'default', pending: 'secondary', rejected: 'destructive', none: 'outline' };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground mt-1">View and manage all platform users</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Account Type</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead>Badge</TableHead>
              <TableHead>Listings</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8">Loading users...</TableCell></TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      {user.full_name}
                      {user.is_verified_badge && <ShieldCheck className="h-4 w-4 text-emerald-600" />}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell><Badge variant="outline">{user.account_type || 'buyer'}</Badge></TableCell>
                  <TableCell>{getKycBadge(user.kycStatus || 'none')}</TableCell>
                  <TableCell>
                    <Button
                      variant={user.is_verified_badge ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleBadge(user.id, !!user.is_verified_badge)}
                      disabled={togglingBadge === user.id}
                      className="gap-1"
                    >
                      {user.is_verified_badge ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                      {user.is_verified_badge ? 'Verified' : 'Add Badge'}
                    </Button>
                  </TableCell>
                  <TableCell>{user.listingsCount}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      {admin?.role === 'super_admin' && (
                        <>
                          <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUsers;
