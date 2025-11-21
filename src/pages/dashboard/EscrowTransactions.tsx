import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Lock, CreditCard, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

export const EscrowTransactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUserId(user.id);

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

  const handleConfirmTransaction = async (escrowId: string) => {
    setConfirming(true);
    try {
      const { data, error } = await supabase.functions.invoke('confirm-escrow', {
        body: { escrowId }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Transaction confirmed successfully!');
        loadTransactions();
      } else {
        throw new Error(data.error || 'Failed to confirm transaction');
      }
    } catch (error: any) {
      console.error('Error confirming transaction:', error);
      toast.error(error.message || 'Failed to confirm transaction');
    } finally {
      setConfirming(false);
    }
  };

  const handleMakePayment = (escrowId: string, propertyId: string) => {
    navigate(`/start-escrow/${propertyId}?escrowId=${escrowId}`);
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
                <div className="flex items-start gap-4">
                  {/* Property Image */}
                  {transaction.property?.images && transaction.property.images.length > 0 && (
                    <img
                      src={transaction.property.images[0]}
                      alt={transaction.property.title}
                      className="w-24 h-24 rounded-lg object-cover border-2 border-border"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg">
                        {transaction.property?.title}
                      </CardTitle>
                      {getStatusBadge(transaction.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {transaction.property?.address}
                    </p>
                  </div>
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
                  {transaction.status === 'pending_payment' && transaction.buyer_id === currentUserId && (
                    <Button 
                      variant="hero" 
                      className="flex-1 gap-2"
                      onClick={() => handleMakePayment(transaction.id, transaction.property_id)}
                    >
                      <CreditCard className="h-4 w-4" />
                      Make Payment
                    </Button>
                  )}
                  {(transaction.status === 'inspection_period' || transaction.status === 'funded') && transaction.buyer_id === currentUserId && (
                    <Button 
                      variant="hero" 
                      className="flex-1 gap-2"
                      onClick={() => handleConfirmTransaction(transaction.id)}
                      disabled={confirming}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {confirming ? 'Confirming...' : 'Confirm Transaction'}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setShowBreakdown(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    View Breakdown
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Breakdown Dialog */}
      <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Summary</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              {/* Property Image and Details */}
              <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                {selectedTransaction.property?.images && selectedTransaction.property.images.length > 0 && (
                  <img
                    src={selectedTransaction.property.images[0]}
                    alt={selectedTransaction.property.title}
                    className="w-32 h-32 rounded-lg object-cover border-2 border-border"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {selectedTransaction.property?.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {selectedTransaction.property?.address}
                  </p>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-accent/30 to-transparent rounded-lg border border-border/50">
                <h4 className="font-semibold mb-3">Transaction Breakdown</h4>
                
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Property Price</span>
                  <span className="font-semibold">
                    ₦{selectedTransaction.transaction_amount?.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Escrow Fee</span>
                  <span className="font-semibold text-accent-purple">
                    ₦{selectedTransaction.escrow_fee?.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between py-3 bg-primary/5 -mx-4 px-4 rounded-lg">
                  <span className="font-semibold text-lg">Total Amount</span>
                  <span className="font-bold text-2xl text-accent-purple">
                    ₦{selectedTransaction.total_amount?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs">{selectedTransaction.id}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created Date</span>
                  <span>{new Date(selectedTransaction.created_at).toLocaleDateString()}</span>
                </div>
                
                {selectedTransaction.payment_verified_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Date</span>
                    <span>{new Date(selectedTransaction.payment_verified_at).toLocaleDateString()}</span>
                  </div>
                )}
                
                {selectedTransaction.inspection_start_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Inspection Period</span>
                    <span>
                      {new Date(selectedTransaction.inspection_start_date).toLocaleDateString()} - {new Date(selectedTransaction.inspection_end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                {selectedTransaction.completed_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed Date</span>
                    <span>{new Date(selectedTransaction.completed_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {selectedTransaction.terms && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Additional Terms</p>
                  <p className="text-sm">{selectedTransaction.terms}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
