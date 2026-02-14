import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Clock, CheckCircle, XCircle, Eye, Filter, Trash2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

    const { data } = await supabase
      .from('purchase_transactions')
      .select(`
        *,
        property:properties(title, address, images),
        buyer_profile:profiles!purchase_transactions_buyer_id_fkey(full_name, email),
        seller_profile:profiles!purchase_transactions_seller_id_fkey(full_name, email, bank_name, account_number, account_name)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    setTransactions(data || []);
    setFilteredTransactions(data || []);
    setLoading(false);
  };

  const handleMakePayment = async (transaction: any) => {
    try {
      toast.loading('Preparing payment gateway...');
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'initialize-payment',
        { body: { purchaseId: transaction.id } }
      );
      if (paymentError) throw paymentError;
      if (paymentData.success) {
        toast.success('Redirecting to Paystack...');
        window.location.href = paymentData.authorization_url;
      } else {
        throw new Error(paymentData.error || 'Failed to initialize payment');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to initialize payment');
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    setFilteredTransactions(prev => prev.filter(t => t.id !== transactionId));

    try {
      const { error } = await supabase
        .from('purchase_transactions')
        .delete()
        .eq('id', transactionId);
      if (error) throw error;
      toast.success('Transaction deleted');
    } catch {
      toast.error('Failed to delete transaction');
      loadTransactions();
    }
  };

  const handlePrintReceipt = (transaction: any) => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;
    
    receiptWindow.document.write(`
      <html>
        <head><title>Payment Receipt</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
          h1 { color: #333; font-size: 24px; }
          .info { margin: 20px 0; }
          .info div { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 20px; font-weight: bold; color: #7c3aed; }
          .badge { background: #22c55e; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; }
          .disclaimer { margin-top: 30px; padding: 16px; background: #fef3cd; border-radius: 8px; font-size: 13px; }
        </style>
        </head>
        <body>
          <h1>🏠 Xavorian Payment Receipt</h1>
          <p style="color:#666">Transaction ID: ${transaction.id.substring(0, 8)}...</p>
          <div class="info">
            <div><span>Property</span><span>${transaction.property?.title || 'N/A'}</span></div>
            <div><span>Buyer</span><span>${transaction.buyer_profile?.full_name || 'N/A'}</span></div>
            <div><span>Seller</span><span>${transaction.seller_profile?.full_name || 'N/A'}</span></div>
            <div><span>Amount</span><span class="total">₦${Number(transaction.transaction_amount).toLocaleString()}</span></div>
            <div><span>Payment Method</span><span>${transaction.payment_method === 'paystack' ? 'Paystack' : 'Bank Transfer'}</span></div>
            <div><span>Date</span><span>${new Date(transaction.created_at).toLocaleDateString()}</span></div>
            <div><span>Status</span><span class="badge">${transaction.status}</span></div>
          </div>
          <div class="disclaimer">
            ⚠️ Xavorian does not control funds. This receipt is for record keeping purposes only.
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'bg-yellow-500', icon: Clock, label: 'Pending' },
      successful: { color: 'bg-green-500', icon: CheckCircle, label: 'Successful' },
      failed: { color: 'bg-red-500', icon: XCircle, label: 'Failed' },
      cancelled: { color: 'bg-gray-500', icon: XCircle, label: 'Cancelled' },
    };
    const c = config[status] || { color: 'bg-gray-500', icon: Clock, label: status };
    const Icon = c.icon;
    return (
      <Badge className={`${c.color} text-white gap-2`}>
        <Icon className="h-3 w-3" />
        {c.label}
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
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="successful">Successful</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {transactions.length === 0 ? (
        <Card className="card-glow">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <CreditCard className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Transactions Yet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You don't have any payment transactions yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="card-glow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  {transaction.property?.images?.[0] && (
                    <img
                      src={transaction.property.images[0]}
                      alt={transaction.property.title}
                      className="w-24 h-24 rounded-lg object-cover border-2 border-border"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg">{transaction.property?.title}</CardTitle>
                      {getStatusBadge(transaction.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{transaction.property?.address}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <div><span className="font-medium">Buyer:</span> {transaction.buyer_profile?.full_name || 'Unknown'}</div>
                      <div><span className="font-medium">Seller:</span> {transaction.seller_profile?.full_name || 'Unknown'}</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Amount</p>
                    <p className="text-lg font-semibold">₦{Number(transaction.transaction_amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                    <p className="text-sm font-medium">{transaction.payment_method === 'paystack' ? 'Paystack' : 'Bank Transfer'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date</p>
                    <p className="text-sm">{new Date(transaction.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  {transaction.status === 'pending' && transaction.payment_method === 'paystack' && (
                    <Button 
                      variant="hero" 
                      className="flex-1 gap-2"
                      onClick={() => handleMakePayment(transaction)}
                    >
                      <CreditCard className="h-4 w-4" />
                      Pay Now
                    </Button>
                  )}
                  {transaction.status === 'successful' && (
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => handlePrintReceipt(transaction)}
                    >
                      <Printer className="h-4 w-4" />
                      Print Receipt
                    </Button>
                  )}
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
                  {transaction.status !== 'successful' && (
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

      {/* Details Dialog */}
      <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                {selectedTransaction.property?.images?.[0] && (
                  <img
                    src={selectedTransaction.property.images[0]}
                    alt={selectedTransaction.property.title}
                    className="w-32 h-32 rounded-lg object-cover border-2 border-border"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{selectedTransaction.property?.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{selectedTransaction.property?.address}</p>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
              </div>

              <div className="space-y-3 p-4 bg-gradient-to-br from-accent/30 to-transparent rounded-lg border border-border/50">
                <h4 className="font-semibold mb-3">Payment Details</h4>
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-lg text-accent-purple">₦{Number(selectedTransaction.transaction_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium">{selectedTransaction.payment_method === 'paystack' ? 'Paystack' : 'Bank Transfer'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs">{selectedTransaction.id}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Date</span>
                  <span>{new Date(selectedTransaction.created_at).toLocaleDateString()}</span>
                </div>
                {selectedTransaction.payment_verified_at && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Verified At</span>
                    <span>{new Date(selectedTransaction.payment_verified_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {selectedTransaction.payment_method === 'transfer' && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Seller Bank Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank</span>
                      <span>{selectedTransaction.seller_bank_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Number</span>
                      <span className="font-mono">{selectedTransaction.seller_account_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Name</span>
                      <span>{selectedTransaction.seller_account_name || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
