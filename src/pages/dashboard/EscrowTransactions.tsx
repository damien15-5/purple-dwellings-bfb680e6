import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Lock, CreditCard, Clock, CheckCircle, XCircle, Eye, AlertTriangle, Filter, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const EscrowTransactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter(t => t.status === statusFilter));
    }
  }, [statusFilter, transactions]);

  const loadTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUserId(user.id);

    const { data } = await supabase
      .from('escrow_transactions')
      .select(`
        *,
        property:properties(title, address, images),
        buyer_profile:profiles!escrow_transactions_buyer_id_fkey(full_name, email),
        seller_profile:profiles!escrow_transactions_seller_id_fkey(full_name, email)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    setTransactions(data || []);
    setFilteredTransactions(data || []);
    setLoading(false);
  };

  const handleSellerConfirmPayment = async (escrowId: string) => {
    setConfirming(true);
    try {
      const transaction = transactions.find(t => t.id === escrowId);
      
      await supabase
        .from('escrow_transactions')
        .update({
          status: 'completed',
          seller_confirmed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', escrowId);

      // Notify buyer
      if (transaction) {
        await supabase.rpc('create_notification', {
          p_user_id: transaction.buyer_id,
          p_title: 'Payment Confirmed',
          p_description: `The seller has confirmed receiving your payment of ₦${transaction.transaction_amount?.toLocaleString()} for ${transaction.property?.title}. Transaction completed!`,
          p_type: 'payment_confirmed',
        });

        // Telegram notify buyer
        try {
          await supabase.functions.invoke('telegram-notify', {
            body: {
              type: 'payment_confirmed',
              data: {
                userId: transaction.buyer_id,
                amount: transaction.transaction_amount,
                propertyTitle: transaction.property?.title,
                sellerName: transaction.seller_profile?.full_name,
              },
            },
          });
        } catch (tgErr) {
          console.error('Telegram notify error:', tgErr);
        }
      }

      toast.success('Payment confirmed! Transaction completed.');
      loadTransactions();
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast.error(error.message || 'Failed to confirm payment');
    } finally {
      setConfirming(false);
    }
  };

  const handleSellerDenyPayment = async (escrowId: string) => {
    setConfirming(true);
    try {
      const transaction = transactions.find(t => t.id === escrowId);
      
      await supabase
        .from('escrow_transactions')
        .update({
          status: 'disputed',
          seller_confirmed: false,
        })
        .eq('id', escrowId);

      // Notify buyer
      if (transaction) {
        await supabase.rpc('create_notification', {
          p_user_id: transaction.buyer_id,
          p_title: 'Payment Not Confirmed',
          p_description: `The seller has not confirmed receiving payment for ${transaction.property?.title}. Please contact the seller or raise a dispute.`,
          p_type: 'payment_denied',
        });

        try {
          await supabase.functions.invoke('telegram-notify', {
            body: {
              type: 'payment_denied',
              data: {
                userId: transaction.buyer_id,
                propertyTitle: transaction.property?.title,
                sellerName: transaction.seller_profile?.full_name,
              },
            },
          });
        } catch (tgErr) {
          console.error('Telegram notify error:', tgErr);
        }
      }

      toast.success('Payment marked as not received.');
      loadTransactions();
    } catch (error: any) {
      console.error('Error denying payment:', error);
      toast.error(error.message || 'Failed to update payment status');
    } finally {
      setConfirming(false);
    }
  };

  const handleMakePayment = (escrowId: string, propertyId: string) => {
    navigate(`/start-escrow/${propertyId}?escrowId=${escrowId}`);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return;
    }

    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    setFilteredTransactions(prev => prev.filter(t => t.id !== transactionId));

    try {
      const { error } = await supabase
        .from('escrow_transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;
      toast.success('Transaction deleted successfully');
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
      loadTransactions();
    }
  };

  const raiseDispute = async () => {
    if (!selectedTransaction || !disputeReason || !disputeDescription) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('raise-dispute', {
        body: {
          escrowId: selectedTransaction.id,
          reason: disputeReason,
          description: disputeDescription,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Dispute raised successfully');
        setShowDispute(false);
        setDisputeReason('');
        setDisputeDescription('');
        loadTransactions();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error raising dispute:', error);
      toast.error(error.message || 'Failed to raise dispute');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending_payment: { color: 'bg-yellow-500', icon: Clock, label: 'Pending Payment' },
      funded: { color: 'bg-blue-500', icon: Lock, label: 'Payment Made - Awaiting Confirmation' },
      inspection_period: { color: 'bg-purple-500', icon: Eye, label: 'In Progress' },
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Transactions</h1>
          <p className="text-muted-foreground">Track your property payment transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_payment">Pending Payment</SelectItem>
              <SelectItem value="funded">Awaiting Confirmation</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {transactions.length === 0 ? (
        <Card className="card-glow">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Lock className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Transactions Yet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You don't have any transactions at the moment
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="card-glow">
              <CardHeader>
                <div className="flex items-start gap-4">
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
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Buyer:</span> {transaction.buyer_profile?.full_name || 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Seller:</span> {transaction.seller_profile?.full_name || 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Amount</p>
                    <p className="text-lg font-semibold">
                      ₦{transaction.transaction_amount?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                    <p className="text-sm font-semibold">Bank Transfer</p>
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
                            ? `Buyer confirmed on ${new Date(transaction.payment_verified_at).toLocaleDateString()}`
                            : 'Awaiting buyer payment'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        transaction.status === 'completed'
                          ? 'bg-green-500 text-white' 
                          : transaction.status === 'funded'
                          ? 'bg-blue-500 text-white animate-pulse'
                          : transaction.status === 'disputed'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {transaction.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : transaction.status === 'disputed' ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Seller Confirmation</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.status === 'completed'
                            ? `Confirmed on ${new Date(transaction.completed_at).toLocaleDateString()}`
                            : transaction.status === 'funded'
                            ? 'Waiting for seller to confirm payment'
                            : transaction.status === 'disputed'
                            ? 'Payment not confirmed by seller'
                            : 'Pending'}
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

                {/* Seller Actions: Confirm or Deny payment */}
                {transaction.status === 'funded' && transaction.seller_id === currentUserId && (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>The buyer says they have made payment. Please check your bank account and confirm.</span>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                        onClick={() => handleSellerConfirmPayment(transaction.id)}
                        disabled={confirming}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Payment Received
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 gap-2"
                        onClick={() => handleSellerDenyPayment(transaction.id)}
                        disabled={confirming}
                      >
                        <XCircle className="h-4 w-4" />
                        Payment Not Received
                      </Button>
                    </div>
                  </div>
                )}

                {/* Buyer view: waiting for seller */}
                {transaction.status === 'funded' && transaction.buyer_id === currentUserId && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                      <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>Payment made successfully! Waiting for seller to confirm receipt of payment.</span>
                    </p>
                  </div>
                )}

                {/* Buyer pending payment */}
                {transaction.status === 'pending_payment' && transaction.buyer_id === currentUserId && (
                  <Button 
                    variant="hero" 
                    className="w-full gap-2"
                    onClick={() => handleMakePayment(transaction.id, transaction.property_id)}
                  >
                    <CreditCard className="h-4 w-4" />
                    Make Payment
                  </Button>
                )}

                {/* Dispute option for funded transactions */}
                {transaction.status === 'disputed' && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>This transaction is disputed. Please contact the other party or raise a support ticket.</span>
                    </p>
                  </div>
                )}

                <div className="flex gap-3 flex-wrap">
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setShowBreakdown(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                  {transaction.status === 'funded' && (
                    <Button 
                      variant="outline" 
                      className="gap-2 text-destructive border-destructive/30"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setShowDispute(true);
                      }}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Raise Dispute
                    </Button>
                  )}
                  {transaction.status !== 'completed' && transaction.status !== 'funded' && (
                    <Button 
                      variant="destructive" 
                      className="gap-2"
                      onClick={() => handleDeleteTransaction(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  )}
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
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
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

              <div className="space-y-3 p-4 bg-gradient-to-br from-accent/30 to-transparent rounded-lg border border-border/50">
                <h4 className="font-semibold mb-3">Transaction Summary</h4>
                
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-xl text-primary">
                    ₦{selectedTransaction.transaction_amount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-semibold">Bank Transfer</span>
                </div>
              </div>

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
                {selectedTransaction.completed_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed Date</span>
                    <span>{new Date(selectedTransaction.completed_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {selectedTransaction.terms && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selectedTransaction.terms}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={showDispute} onOpenChange={setShowDispute}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise a Dispute</DialogTitle>
            <DialogDescription>
              Describe the issue with this transaction. An admin will review your case.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="reason">Dispute Reason</Label>
              <Textarea
                id="reason"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Brief reason for dispute..."
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                placeholder="Provide detailed information about the issue..."
                className="mt-2 min-h-32"
              />
            </div>
            <Button
              onClick={raiseDispute}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
