import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/contexts/AdminContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Eye, Edit, Trash2, Search, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ListingData {
  id: string;
  title: string;
  price: number;
  property_type: string;
  status: string;
  city: string;
  state: string;
  images: string[] | null;
  created_at: string;
  user_id: string;
  is_verified: boolean | null;
  ownerName?: string;
}

const AdminListings = () => {
  const { admin } = useAdmin();
  const { toast } = useToast();
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (properties) {
        // Get owner names
        const listingsWithOwners = await Promise.all(
          properties.map(async (property) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', property.user_id)
              .single();

            return {
              ...property,
              ownerName: profile?.full_name || 'Unknown',
            };
          })
        );

        setListings(listingsWithOwners);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (admin?.role !== 'super_admin') {
      toast({
        title: 'Access Denied',
        description: 'Only super admin can approve listings',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: 'published', is_verified: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Listing Approved',
        description: 'Listing has been published',
      });
      loadListings();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve listing',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (id: string) => {
    if (admin?.role !== 'super_admin') {
      toast({
        title: 'Access Denied',
        description: 'Only super admin can reject listings',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: 'draft', is_verified: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Listing Rejected',
        description: 'Listing has been rejected',
      });
      loadListings();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject listing',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (admin?.role !== 'super_admin') {
      toast({
        title: 'Access Denied',
        description: 'Only super admin can delete listings',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const { error } = await supabase.from('properties').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Listing Deleted',
        description: 'Listing has been successfully deleted',
      });
      loadListings();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete listing',
        variant: 'destructive',
      });
    }
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.property_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: any = {
      published: 'default',
      draft: 'secondary',
      pending: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Listings Management</h1>
          <p className="text-muted-foreground mt-1">View and manage all property listings</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Loading listings...
                </TableCell>
              </TableRow>
            ) : filteredListings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No listings found
                </TableCell>
              </TableRow>
            ) : (
              filteredListings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell className="font-medium max-w-xs truncate">{listing.title}</TableCell>
                  <TableCell>{listing.ownerName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{listing.property_type}</Badge>
                  </TableCell>
                  <TableCell>₦{listing.price.toLocaleString()}</TableCell>
                  <TableCell>
                    {listing.city}, {listing.state}
                  </TableCell>
                  <TableCell>{getStatusBadge(listing.status)}</TableCell>
                  <TableCell>
                    {listing.is_verified ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>{new Date(listing.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {admin?.role === 'super_admin' && (
                        <>
                          {listing.status !== 'published' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(listing.id)}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(listing.id)}
                          >
                            <XCircle className="h-4 w-4 text-orange-600" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(listing.id)}
                          >
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

export default AdminListings;