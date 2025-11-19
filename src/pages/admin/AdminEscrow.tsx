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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EscrowTransaction {
  id: string;
  buyer_id: string;
  seller_id: string;
  property_id: string | null;
  transaction_amount: number;
  escrow_fee: number;
  total_amount: number;
  status: string;
  created_at: string;
  buyerName?: string;
  sellerName?: string;
  propertyTitle?: string;
}

const AdminEscrow = () => {
  const { admin } = useAdmin();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFunds: 0,
    completed: 0,
    active: 0,
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const { data: escrows } = await supabase
        .from('escrow_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (escrows) {
        const escrowsWithDetails = await Promise.all(
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

        setTransactions(escrowsWithDetails);

        // Calculate stats
        const totalFunds = escrowsWithDetails
          .filter((e) => ['funded', 'inspection_period'].includes(e.status))
          .reduce((sum, e) => sum + Number(e.total_amount), 0);

        const completed = escrowsWithDetails.filter((e) => e.status === 'completed').length;
        const active = escrowsWithDetails.filter((e) =>
          ['funded', 'inspection_period', 'pending_payment'].includes(e.status)
        ).length;

        setStats({ totalFunds, completed, active });
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      completed: 'default',
      funded: 'secondary',
      inspection_period: 'outline',
      pending_payment: 'outline',
      cancelled: 'destructive',
      disputed: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status.replace('_', ' ')}</Badge>;
  };

  const isSubAdmin = admin?.role === 'sub_admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Escrow Management</h1>
        <p className="text-muted-foreground mt-1">
          {isSubAdmin
            ? 'View escrow transactions (financial details hidden)'
            : 'Manage all escrow transactions'}
        </p>
      </div>

      {!isSubAdmin && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Escrow Funds
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{stats.totalFunds.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Transactions
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Transactions
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Property</TableHead>
              {!isSubAdmin && <TableHead>Amount</TableHead>}
              {!isSubAdmin && <TableHead>Escrow Fee</TableHead>}
              {!isSubAdmin && <TableHead>Total</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={isSubAdmin ? 6 : 9} className="text-center py-8">
                  Loading transactions...
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSubAdmin ? 6 : 9} className="text-center py-8 text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-xs">
                    {tx.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>{tx.buyerName}</TableCell>
                  <TableCell>{tx.sellerName}</TableCell>
                  <TableCell className="max-w-xs truncate">{tx.propertyTitle}</TableCell>
                  {!isSubAdmin && (
                    <>
                      <TableCell>₦{Number(tx.transaction_amount).toLocaleString()}</TableCell>
                      <TableCell>₦{Number(tx.escrow_fee).toLocaleString()}</TableCell>
                      <TableCell className="font-semibold">
                        ₦{Number(tx.total_amount).toLocaleString()}
                      </TableCell>
                    </>
                  )}
                  <TableCell>{getStatusBadge(tx.status)}</TableCell>
                  <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminEscrow;