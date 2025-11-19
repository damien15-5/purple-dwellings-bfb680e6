import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Offer {
  id: string;
  buyer_id: string;
  seller_id: string;
  property_id: string | null;
  offer_amount: number | null;
  offer_status: string | null;
  offer_message: string | null;
  created_at: string;
  buyerName?: string;
  sellerName?: string;
  propertyTitle?: string;
}

const AdminOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    accepted: 0,
    rejected: 0,
    pending: 0,
  });

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const { data: escrows } = await supabase
        .from('escrow_transactions')
        .select('*')
        .not('offer_amount', 'is', null)
        .order('created_at', { ascending: false });

      if (escrows) {
        const offersWithDetails = await Promise.all(
          escrows.map(async (escrow) => {
            const { data: buyer } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', escrow.buyer_id)
              .single();

            const { data: seller } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', escrow.seller_id)
              .single();

            let propertyTitle = 'N/A';
            if (escrow.property_id) {
              const { data: property } = await supabase
                .from('properties')
                .select('title')
                .eq('id', escrow.property_id)
                .single();
              propertyTitle = property?.title || 'N/A';
            }

            return {
              ...escrow,
              buyerName: buyer?.full_name || 'Unknown',
              sellerName: seller?.full_name || 'Unknown',
              propertyTitle,
            };
          })
        );

        setOffers(offersWithDetails);

        // Calculate stats
        const total = offersWithDetails.length;
        const accepted = offersWithDetails.filter((o) => o.offer_status === 'accepted').length;
        const rejected = offersWithDetails.filter((o) => o.offer_status === 'rejected').length;
        const pending = offersWithDetails.filter(
          (o) => o.offer_status === 'pending' || o.offer_status === 'none'
        ).length;

        setStats({ total, accepted, rejected, pending });
      }
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const variants: any = {
      accepted: 'default',
      rejected: 'destructive',
      pending: 'secondary',
      none: 'outline',
    };
    return (
      <Badge variant={variants[status || 'none'] || 'outline'}>
        {status === 'none' ? 'pending' : status || 'pending'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Offers & Negotiations</h1>
        <p className="text-muted-foreground mt-1">View all property offers and negotiations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Offers
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accepted
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Buyer</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Offer Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading offers...
                </TableCell>
              </TableRow>
            ) : offers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No offers found
                </TableCell>
              </TableRow>
            ) : (
              offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell>{offer.buyerName}</TableCell>
                  <TableCell>{offer.sellerName}</TableCell>
                  <TableCell className="max-w-xs truncate">{offer.propertyTitle}</TableCell>
                  <TableCell className="font-semibold">
                    ₦{Number(offer.offer_amount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(offer.offer_status)}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {offer.offer_message || 'No message'}
                  </TableCell>
                  <TableCell>{new Date(offer.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminOffers;