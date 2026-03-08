import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Handshake, Check, X, MessageSquare, Clock, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const OffersNegotiations = () => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const [responseMessage, setResponseMessage] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [respondingOffers, setRespondingOffers] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const init = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (!user) {
        setCurrentUserId(null);
        setOffers([]);
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);
      await loadOffers(user.id);

      const channel = supabase
        .channel(`offers-realtime-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'escrow_transactions',
            filter: `buyer_id=eq.${user.id}`,
          },
          () => loadOffers(user.id)
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'escrow_transactions',
            filter: `seller_id=eq.${user.id}`,
          },
          () => loadOffers(user.id)
        )
        .subscribe();

      pollInterval = setInterval(() => {
        loadOffers(user.id);
      }, 5000);

      return () => {
        supabase.removeChannel(channel);
      };
    };

    let cleanupChannel: (() => void) | undefined;
    init().then((cleanup) => {
      cleanupChannel = cleanup;
    });

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      cleanupChannel?.();
    };
  }, []);

  const loadOffers = async (userId?: string) => {
    try {
      let resolvedUserId = userId;

      if (!resolvedUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setOffers([]);
          return;
        }
        resolvedUserId = user.id;
        setCurrentUserId(user.id);
      }

      const { data, error } = await supabase
        .from('escrow_transactions')
        .select(`
          *,
          property:properties(id, title, address, images, price),
          buyer:profiles!escrow_transactions_buyer_id_fkey(full_name, email),
          seller:profiles!escrow_transactions_seller_id_fkey(full_name, email)
        `)
        .or(`buyer_id.eq.${resolvedUserId},seller_id.eq.${resolvedUserId}`)
        .not('offer_amount', 'is', null)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOffers(data || []);
    } catch (error) {
      console.error('Failed to load offers:', error);
      // Keep the last known list rendered; polling/realtime will retry automatically
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (offerId: string, accept: boolean) => {
    // Mark this offer as being responded to
    setRespondingOffers(prev => new Set(prev).add(offerId));
    
    try {
      const { error } = await supabase
        .from('escrow_transactions')
        .update({
          offer_status: accept ? 'accepted' : 'rejected',
          seller_response: responseMessage,
          seller_responded_at: new Date().toISOString(),
        })
        .eq('id', offerId);

      if (error) throw error;

      // Find the offer to get buyer info for notification
      const offer = offers.find(o => o.id === offerId);
      if (offer) {
        const buyerId = offer.buyer_id;
        const sellerName = offer.seller?.full_name || 'Seller';
        const propertyTitle = offer.property?.title || 'Property';
        const offerAmount = offer.offer_amount;

        // Notify buyer via Telegram
        try {
          await supabase.functions.invoke('telegram-notify', {
            body: {
              type: 'offer_responded',
              data: {
                userId: buyerId,
                sellerName,
                propertyTitle,
                amount: offerAmount,
                accepted: accept,
                sellerResponse: responseMessage,
              },
            },
          });
        } catch (e) { console.error('Telegram notify error:', e); }
      }

      toast({
        title: 'Success',
        description: `Offer ${accept ? 'accepted' : 'rejected'} successfully`,
      });

      loadOffers();
      setSelectedOffer(null);
      setResponseMessage('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to respond to offer',
        variant: 'destructive',
      });
      // Remove from responding set on error
      setRespondingOffers(prev => {
        const newSet = new Set(prev);
        newSet.delete(offerId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (offer: any) => {
    // If payment completed (seller confirmed)
    if (offer.status === 'completed') {
      return <Badge className="bg-emerald-600 gap-2"><CheckCircle className="h-3 w-3" />Payment Confirmed</Badge>;
    }
    // If payment made by buyer, waiting for seller
    if (offer.status === 'funded') {
      return <Badge className="bg-blue-500 gap-2"><Clock className="h-3 w-3" />Payment Made - Awaiting Confirmation</Badge>;
    }
    // If disputed
    if (offer.status === 'disputed') {
      return <Badge className="bg-red-600 gap-2"><XCircle className="h-3 w-3" />Disputed</Badge>;
    }
    
    const status = offer.offer_status;
    switch (status) {
      case 'pending':
      case 'none':
        return <Badge className="bg-yellow-500 gap-2"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500 gap-2"><CheckCircle className="h-3 w-3" />Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 gap-2"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500 gap-2"><Clock className="h-3 w-3" />Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Offers & Negotiations</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Manage your property offers and negotiations</p>
      </div>

      {offers.length === 0 ? (
        <Card className="card-glow">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Handshake className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No Offers Yet</h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center max-w-md">
              You don't have any offers or negotiations at the moment
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {offers.map((offer) => {
            const isUserBuyer = offer.buyer_id === currentUserId;
            
            return (
              <Card key={offer.id} className="card-glow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{offer.property?.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{offer.property?.address}</p>
                    </div>
                    {getStatusBadge(offer.offer_status || 'none')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Current Price</p>
                      <p className="text-lg font-semibold">
                        ₦{offer.property?.price?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Offered Price</p>
                      <p className="text-lg font-semibold text-accent-purple">
                        ₦{offer.offer_amount?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Initiated By</p>
                      <p className="text-sm font-medium">{offer.buyer?.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Date</p>
                      <p className="text-sm">
                        {new Date(offer.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {offer.offer_message && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm font-medium mb-1">Offer Message:</p>
                      <p className="text-sm text-muted-foreground">{offer.offer_message}</p>
                    </div>
                  )}

                  {offer.seller_response && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium mb-1 text-blue-900">Response:</p>
                      <p className="text-sm text-blue-700">{offer.seller_response}</p>
                    </div>
                  )}

                  {!isUserBuyer && (offer.offer_status === 'pending' || offer.offer_status === 'none' || !offer.offer_status) && !offer.payment_verified_at && offer.status === 'pending_payment' && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="hero"
                            className="flex-1 gap-2 text-sm"
                            onClick={() => setSelectedOffer(offer)}
                            disabled={respondingOffers.has(offer.id)}
                          >
                            <Check className="h-4 w-4" />
                            Accept Offer
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Accept Offer</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              placeholder="Add a response message (optional)"
                              value={responseMessage}
                              onChange={(e) => setResponseMessage(e.target.value)}
                              rows={4}
                            />
                            <Button
                              onClick={() => handleResponse(offer.id, true)}
                              className="w-full"
                              variant="hero"
                            >
                              Confirm Accept
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="flex-1 gap-2 text-sm"
                            onClick={() => setSelectedOffer(offer)}
                            disabled={respondingOffers.has(offer.id)}
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Offer</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              placeholder="Add a reason for rejection (optional)"
                              value={responseMessage}
                              onChange={(e) => setResponseMessage(e.target.value)}
                              rows={4}
                            />
                            <Button
                              onClick={() => handleResponse(offer.id, false)}
                              className="w-full"
                              variant="destructive"
                            >
                              Confirm Reject
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  {offer.offer_status === 'accepted' && (offer.payment_verified_at || offer.status === 'funded' || offer.status === 'inspection_period' || offer.status === 'completed') && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-700">
                        <ShieldCheck className="h-5 w-5" />
                        <span className="font-semibold">Offer Confirmed & Payment Received</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">This transaction is now secured in escrow</p>
                    </div>
                  )}

                  {isUserBuyer && offer.offer_status === 'accepted' && !offer.payment_verified_at && offer.status === 'pending_payment' && (
                    <Link to={`/start-escrow/${offer.property?.id}?escrowId=${offer.id}`} className="block">
                      <Button variant="hero" className="w-full gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Make Payment
                      </Button>
                    </Link>
                  )}
                  
                  {isUserBuyer && offer.offer_status === 'accepted' && (offer.payment_verified_at || offer.status === 'funded' || offer.status === 'inspection_period' || offer.status === 'completed') && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Payment Confirmed</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">Your payment has been secured in escrow</p>
                    </div>
                  )}

                  <Link to={`/chat/${offer.property?.id}`}>
                    <Button variant="outline" className="w-full gap-2">
                      <MessageSquare className="h-4 w-4" />
                      View Negotiation History
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
