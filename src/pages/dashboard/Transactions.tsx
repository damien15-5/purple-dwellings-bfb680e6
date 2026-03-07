import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Clock, CheckCircle, XCircle, Eye, Filter, Trash2, Printer, Star, Handshake, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UnifiedTransaction {
  id: string;
  type: 'escrow' | 'purchase' | 'promotion';
  typeLabel: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  date: string;
  paymentMethod: string;
  imageUrl?: string;
  raw: any;
}

export const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<UnifiedTransaction | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    let filtered = transactions;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }
    setFilteredTransactions(filtered);
  }, [statusFilter, typeFilter, transactions]);

  const loadTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [escrowRes, purchaseRes, promotionRes] = await Promise.all([
      supabase
        .from('escrow_transactions')
        .select('*, property:properties(title, address, images)')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false }),
      supabase
        .from('purchase_transactions')
        .select('*, property:properties(title, address, images)')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false }),
      supabase
        .from('property_promotions')
        .select('*, property:properties(title, address, images)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    const unified: UnifiedTransaction[] = [];

    // Map escrow transactions
    for (const e of escrowRes.data || []) {
      const normalizedStatus = mapEscrowStatus(e.status);
      unified.push({
        id: e.id,
        type: 'escrow',
        typeLabel: 'Property Payment',
        title: e.property?.title || 'Property Transaction',
        description: e.property?.address || '',
        amount: Number(e.total_amount || e.transaction_amount),
        status: normalizedStatus,
        date: e.created_at,
        paymentMethod: 'Paystack',
        imageUrl: e.property?.images?.[0],
        raw: e,
      });
    }

    // Map purchase transactions
    for (const p of purchaseRes.data || []) {
      unified.push({
        id: p.id,
        type: 'purchase',
        typeLabel: 'Direct Purchase',
        title: p.property?.title || 'Property Purchase',
        description: p.property?.address || '',
        amount: Number(p.transaction_amount),
        status: p.status,
        date: p.created_at,
        paymentMethod: p.payment_method === 'paystack' ? 'Paystack' : 'Bank Transfer',
        imageUrl: p.property?.images?.[0],
        raw: p,
      });
    }

    // Map promotions
    for (const pr of promotionRes.data || []) {
      unified.push({
        id: pr.id,
        type: 'promotion',
        typeLabel: 'Property Promotion',
        title: pr.property?.title || 'Property Promotion',
        description: `${pr.days_promoted} day${pr.days_promoted > 1 ? 's' : ''} promotion`,
        amount: Number(pr.amount_paid),
        status: pr.is_active ? 'successful' : 'completed',
        date: pr.created_at,
        paymentMethod: 'Paystack',
        imageUrl: pr.property?.images?.[0],
        raw: pr,
      });
    }

    // Sort by date descending
    unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate total spent
    const total = unified
      .filter(t => ['successful', 'completed', 'funded', 'inspection_period'].includes(t.status))
      .reduce((sum, t) => sum + t.amount, 0);

    setTotalSpent(total);
    setTransactions(unified);
    setFilteredTransactions(unified);
    setLoading(false);
  };

  const mapEscrowStatus = (status: string): string => {
    switch (status) {
      case 'pending_payment': return 'pending';
      case 'funded':
      case 'inspection_period':
      case 'completed': return 'successful';
      case 'cancelled':
      case 'refunded': return 'cancelled';
      case 'disputed': return 'failed';
      default: return status;
    }
  };

  const handleMakePayment = async (transaction: UnifiedTransaction) => {
    try {
      toast.loading('Preparing payment gateway...');
      const body = transaction.type === 'escrow'
        ? { escrowId: transaction.id }
        : { purchaseId: transaction.id };
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'initialize-payment',
        { body }
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

  const handleDeleteTransaction = async (transaction: UnifiedTransaction) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    setTransactions(prev => prev.filter(t => t.id !== transaction.id));

    try {
      const table = transaction.type === 'escrow' ? 'escrow_transactions' : 'purchase_transactions';
      if (transaction.type === 'promotion') {
        toast.error('Promotion records cannot be deleted');
        loadTransactions();
        return;
      }
      const { error } = await supabase.from(table).delete().eq('id', transaction.id);
      if (error) throw error;
      toast.success('Transaction deleted');
    } catch {
      toast.error('Failed to delete transaction');
      loadTransactions();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'escrow': return <Handshake className="h-4 w-4" />;
      case 'promotion': return <Star className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'escrow': return 'bg-blue-500';
      case 'promotion': return 'bg-purple-500';
      default: return 'bg-green-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'bg-yellow-500', icon: Clock, label: 'Pending' },
      successful: { color: 'bg-green-500', icon: CheckCircle, label: 'Successful' },
      completed: { color: 'bg-green-500', icon: CheckCircle, label: 'Completed' },
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Transactions</h1>
          <p className="text-muted-foreground">All your payments — property purchases, promotions & more</p>
        </div>
        <Card className="card-glow px-5 py-3">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Spent</p>
              <p className="text-lg font-bold text-primary">₦{totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="successful">Successful</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="escrow">Property Payments</SelectItem>
            <SelectItem value="purchase">Direct Purchases</SelectItem>
            <SelectItem value="promotion">Promotions</SelectItem>
          </SelectContent>
        </Select>
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
        <div className="grid grid-cols-1 gap-4">
          {filteredTransactions.map((transaction) => (
            <Card key={`${transaction.type}-${transaction.id}`} className="card-glow">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  {transaction.imageUrl && (
                    <img
                      src={transaction.imageUrl}
                      alt={transaction.title}
                      className="w-20 h-20 rounded-lg object-cover border-2 border-border hidden sm:block"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <CardTitle className="text-base truncate">{transaction.title}</CardTitle>
                      {getStatusBadge(transaction.status)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{transaction.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`${getTypeBadgeColor(transaction.type)} text-white gap-1 text-xs`}>
                        {getTypeIcon(transaction.type)}
                        {transaction.typeLabel}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-lg font-bold text-primary">₦{transaction.amount.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {transaction.status === 'pending' && transaction.type !== 'promotion' && (
                      <Button size="sm" variant="hero" className="gap-1" onClick={() => handleMakePayment(transaction)}>
                        <CreditCard className="h-3.5 w-3.5" /> Pay Now
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => { setSelectedTransaction(transaction); setShowBreakdown(true); }}>
                      <Eye className="h-3.5 w-3.5" /> Details
                    </Button>
                    {transaction.status === 'pending' && transaction.type !== 'promotion' && (
                      <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleDeleteTransaction(transaction)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                {selectedTransaction.imageUrl && (
                  <img src={selectedTransaction.imageUrl} alt={selectedTransaction.title} className="w-24 h-24 rounded-lg object-cover border-2 border-border" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{selectedTransaction.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{selectedTransaction.description}</p>
                  <div className="flex gap-2">
                    {getStatusBadge(selectedTransaction.status)}
                    <Badge className={`${getTypeBadgeColor(selectedTransaction.type)} text-white text-xs`}>
                      {selectedTransaction.typeLabel}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-gradient-to-br from-accent/30 to-transparent rounded-lg border border-border/50">
                <h4 className="font-semibold">Payment Breakdown</h4>

                {selectedTransaction.type === 'escrow' && (
                  <>
                    <div className="flex justify-between py-2 border-b border-border/30">
                      <span className="text-muted-foreground">Property Price</span>
                      <span className="font-medium">₦{Number(selectedTransaction.raw.transaction_amount).toLocaleString()}</span>
                    </div>
                    {selectedTransaction.raw.offer_amount && (
                      <div className="flex justify-between py-2 border-b border-border/30">
                        <span className="text-muted-foreground">Negotiated Price</span>
                        <span className="font-medium text-primary">₦{Number(selectedTransaction.raw.offer_amount).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-border/30">
                      <span className="text-muted-foreground">Paystack Fee</span>
                      <span className="font-medium">₦{Number(selectedTransaction.raw.platform_fee || 0).toLocaleString()}</span>
                    </div>
                  </>
                )}

                {selectedTransaction.type === 'promotion' && (
                  <>
                    <div className="flex justify-between py-2 border-b border-border/30">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{selectedTransaction.raw.days_promoted} days</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/30">
                      <span className="text-muted-foreground">Active Until</span>
                      <span className="font-medium">{new Date(selectedTransaction.raw.expires_at).toLocaleDateString()}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium">{selectedTransaction.paymentMethod}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{new Date(selectedTransaction.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs">{selectedTransaction.id.substring(0, 12)}...</span>
                </div>
                <div className="flex justify-between py-3 bg-primary/5 -mx-4 px-4 rounded-lg">
                  <span className="font-semibold">Total Paid</span>
                  <span className="font-bold text-lg text-primary">₦{selectedTransaction.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
