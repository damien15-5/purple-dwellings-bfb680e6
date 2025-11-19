import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Lock, CreditCard, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

export const EscrowTransactions = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('escrow_transactions')
      .select(`
        *,
        property:properties(title, address, images)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    setTransactions(data || []);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending_payment: { color: 'bg-yellow-500', icon: Clock, label: 'Pending Payment' },
      funded: { color: 'bg-blue-500', icon: Lock, label: 'Payment Received' },
      inspection_period: { color: 'bg-purple-500', icon: Eye, label: 'Verification in Progress' },
      completed: { color: 'bg-green-500', icon: CheckCircle, label: 'Completed' },
      disputed: { color: 'bg-red-500', icon: XCircle, label: 'Disputed' },
      cancelled: { color: 'bg-gray-500', icon: XCircle, label: 'Cancelled' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-500', icon: Clock, label: status };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white gap-2`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Escrow Transactions</h1>
        <p className="text-muted-foreground">Track your secure property transactions</p>
      </div>

      {transactions.length === 0 ? (
        <Card className="card-glow">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Lock className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Transactions Yet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You don't have any escrow transactions at the moment
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {transactions.map((transaction) => (
            <Card key={transaction.id} className="card-glow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {transaction.property?.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {transaction.property?.address}
                    </p>
                  </div>
                  {getStatusBadge(transaction.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Transaction Amount</p>
                    <p className="text-lg font-semibold">
                      ₦{transaction.transaction_amount?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Escrow Fee</p>
                    <p className="text-lg font-semibold text-muted-foreground">
                      ₦{transaction.escrow_fee?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                    <p className="text-lg font-semibold text-accent-purple">
                      ₦{transaction.total_amount?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date Created</p>
                    <p className="text-sm">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Progress Timeline */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        transaction.status !== 'pending_payment' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-yellow-500 text-white'
                      }`}>
                        {transaction.status !== 'pending_payment' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Payment</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.payment_verified_at 
                            ? `Paid on ${new Date(transaction.payment_verified_at).toLocaleDateString()}`
                            : 'Awaiting payment'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        transaction.status === 'inspection_period' || transaction.status === 'completed'
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {transaction.status === 'inspection_period' || transaction.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Inspection Period</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.inspection_start_date
                            ? `${new Date(transaction.inspection_start_date).toLocaleDateString()} - ${new Date(transaction.inspection_end_date).toLocaleDateString()}`
                            : 'Not started'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        transaction.status === 'completed'
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {transaction.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Completion</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.completed_at
                            ? `Completed on ${new Date(transaction.completed_at).toLocaleDateString()}`
                            : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {transaction.status === 'pending_payment' && (
                    <Button variant="hero" className="flex-1 gap-2">
                      <CreditCard className="h-4 w-4" />
                      Make Payment
                    </Button>
                  )}
                  {(transaction.status === 'inspection_period' || transaction.status === 'funded') && (
                    <Button variant="hero" className="flex-1 gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Confirm Transaction
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1 gap-2">
                    <Eye className="h-4 w-4" />
                    View Breakdown
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
