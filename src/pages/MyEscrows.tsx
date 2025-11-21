import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export const MyEscrows = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [escrows, setEscrows] = useState<any[]>([]);
  const [disputeDialog, setDisputeDialog] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEscrows();
  }, []);

  const fetchEscrows = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('escrow_transactions' as any)
        .select(`
          *,
          properties(title, address, images)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEscrows(data || []);
    } catch (error: any) {
      console.error('Error fetching escrows:', error);
      toast.error('Failed to load escrows');
    } finally {
      setLoading(false);
    }
  };

  const confirmEscrow = async (escrowId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('confirm-escrow', {
        body: { escrowId },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Escrow confirmed successfully');
        fetchEscrows();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error confirming escrow:', error);
      toast.error(error.message || 'Failed to confirm escrow');
    }
  };

  const raiseDispute = async () => {
    if (!selectedEscrow || !disputeReason || !disputeDescription) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('raise-dispute', {
        body: {
          escrowId: selectedEscrow,
          reason: disputeReason,
          description: disputeDescription,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Dispute raised successfully');
        setDisputeDialog(false);
        setDisputeReason('');
        setDisputeDescription('');
        fetchEscrows();
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Clock className="w-5 h-5" />;
      case 'funded':
      case 'inspection_period':
        return <ShieldCheck className="w-5 h-5" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'disputed':
        return <AlertTriangle className="w-5 h-5" />;
      case 'cancelled':
      case 'refunded':
        return <XCircle className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return 'bg-yellow-500';
      case 'funded':
      case 'inspection_period':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'disputed':
        return 'bg-orange-500';
      case 'cancelled':
      case 'refunded':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Escrows</h1>
          <p className="text-muted-foreground">Manage your secure property transactions</p>
        </div>

        {escrows.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ShieldCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Escrows Yet</h3>
              <p className="text-muted-foreground mb-6">Start a secure transaction on a property</p>
              <Button onClick={() => navigate('/browse')}>Browse Properties</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {escrows.map((escrow) => (
              <Card key={escrow.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{escrow.properties.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{escrow.properties.address}</p>
                    </div>
                    <Badge className={`${getStatusColor(escrow.status)} text-white`}>
                      <span className="mr-1">{getStatusIcon(escrow.status)}</span>
                      {escrow.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-semibold">₦{escrow.transaction_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Escrow Fee</p>
                      <p className="font-semibold">₦{escrow.escrow_fee.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                      <p className="font-semibold text-primary">₦{escrow.total_amount.toLocaleString()}</p>
                    </div>
                    {escrow.inspection_end_date && (
                      <div>
                        <p className="text-sm text-muted-foreground">Days Remaining</p>
                        <p className="font-semibold">{getDaysRemaining(escrow.inspection_end_date)} days</p>
                      </div>
                    )}
                  </div>

                  {(escrow.status === 'funded' || escrow.status === 'inspection_period') && (
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => confirmEscrow(escrow.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Confirm & Release Funds
                      </Button>
                      <Dialog open={disputeDialog} onOpenChange={setDisputeDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => setSelectedEscrow(escrow.id)}
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Raise Dispute
                          </Button>
                        </DialogTrigger>
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
                              {submitting ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                'Submit Dispute'
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Created: {new Date(escrow.created_at).toLocaleDateString()} | 
                    Reference: {escrow.id.substring(0, 8)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
