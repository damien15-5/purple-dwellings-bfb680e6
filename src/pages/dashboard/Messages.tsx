import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, Paperclip, Search, Trash2, HandshakeIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MessageItem } from '@/components/chat/MessageItem';

export const Messages = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [escrowStatuses, setEscrowStatuses] = useState<Map<string, any>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!selectedConversation || !currentUserId) return;

    // Real-time subscription for messages in the selected conversation
    const channel = supabase
      .channel(`messages_dashboard_${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, currentUserId]);

  const loadConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUserId(user.id);

    const { data } = await supabase
      .from('conversations')
      .select(`
        *,
        property:properties(title, images, price, user_id)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .not('last_message', 'is', null)
      .order('last_message_time', { ascending: false });

    setConversations(data || []);
    setLoading(false);
  };

  const loadMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setMessages(data);

      // Load escrow status for this conversation
      if (selectedConversation?.property_id) {
        const { data: escrowData } = await supabase
          .from('escrow_transactions')
          .select('*')
          .eq('property_id', selectedConversation.property_id)
          .or(`buyer_id.eq.${currentUserId},seller_id.eq.${currentUserId}`)
          .maybeSingle();
        
        if (escrowData) {
          setEscrowStatuses(prev => new Map(prev).set(convId, escrowData));
        }
      }

      // Mark messages from other person as read & reset unread count
      if (currentUserId) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', convId)
          .neq('sender_id', currentUserId)
          .eq('is_read', false);

        // Reset unread counter for current user
        const updateField = currentUserId === selectedConversation?.buyer_id 
          ? { buyer_unread: 0 } 
          : { seller_unread: 0 };
        await supabase
          .from('conversations')
          .update(updateField)
          .eq('id', convId);

        // Update local state
        setConversations(prev => prev.map(c => 
          c.id === convId 
            ? { ...c, ...(currentUserId === c.buyer_id ? { buyer_unread: 0 } : { seller_unread: 0 }) }
            : c
        ));
      }
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not upload attachment. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let fileUrl: string | null = null;
    let fileType: string | null = null;

    setUploading(true);

    try {
      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile);
        if (!fileUrl) return;
        fileType = selectedFile.type;
      }

      const content = newMessage || (selectedFile ? 'Sent an attachment' : '');

      await supabase.from('messages').insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content,
        file_url: fileUrl,
        file_type: fileType,
        message_type: 'user',
      });

      await supabase
        .from('conversations')
        .update({
          last_message: content,
          last_message_time: new Date().toISOString(),
        })
        .eq('id', selectedConversation.id);

      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSendOffer = async () => {
    if (!offerAmount || !selectedConversation || !currentUserId) return;

    // Property owner cannot make an offer on their own property
    const isOwner = currentUserId === selectedConversation.property?.user_id;
    if (isOwner) {
      toast({
        title: 'Cannot make offer',
        description: 'You cannot make an offer on your own property.',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid offer amount.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const content =
        offerMessage ||
        `I'd like to make an offer of ₦${amount.toLocaleString()} for this property.`;

      const { error: msgError } = await supabase.from('messages').insert({
        conversation_id: selectedConversation.id,
        sender_id: currentUserId,
        content,
        message_type: 'offer',
        offer_amount: amount,
        offer_status: 'pending',
      });

      if (msgError) throw msgError;

      // Only buyer can create escrow transaction
      if (currentUserId === selectedConversation.buyer_id) {
        const { data: existingEscrow } = await supabase
          .from('escrow_transactions')
          .select('*')
          .eq('property_id', selectedConversation.property_id)
          .eq('buyer_id', selectedConversation.buyer_id)
          .eq('seller_id', selectedConversation.seller_id)
          .maybeSingle();

        if (existingEscrow) {
          await supabase
            .from('escrow_transactions')
            .update({
              transaction_amount: amount,
              atara_fee: 0,
              platform_fee: 0,
              escrow_fee: 0,
              total_amount: amount,
              offer_amount: amount,
              offer_status: 'pending',
              offer_message: content,
              status: 'pending_payment',
            })
            .eq('id', existingEscrow.id);
        } else {
          await supabase.from('escrow_transactions').insert({
            property_id: selectedConversation.property_id,
            buyer_id: selectedConversation.buyer_id,
            seller_id: selectedConversation.seller_id,
            transaction_amount: amount,
            atara_fee: 0,
            platform_fee: 0,
            escrow_fee: 0,
            total_amount: amount,
            offer_amount: amount,
            offer_status: 'pending',
            offer_message: content,
            status: 'pending_payment',
          });
        }
      }

      const recipientId =
        currentUserId === selectedConversation.buyer_id
          ? selectedConversation.seller_id
          : selectedConversation.buyer_id;

      if (recipientId) {
        await supabase.rpc('create_notification', {
          p_user_id: recipientId,
          p_title: 'New Offer Received',
          p_description: `You received an offer of ₦${amount.toLocaleString()} for ${
            selectedConversation.property?.title || 'a property'
          }`,
          p_type: 'offer',
        });
      }

      await supabase
        .from('conversations')
        .update({
          last_message: `New offer: ₦${amount.toLocaleString()}`,
          last_message_time: new Date().toISOString(),
        })
        .eq('id', selectedConversation.id);

      setOfferAmount('');
      setOfferMessage('');
      setOfferDialogOpen(false);
      toast({
        title: 'Offer sent',
        description: 'Your offer has been sent to the other party.',
      });
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to send offer. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAcceptOffer = async (messageId: string, amount: number) => {
    if (!selectedConversation || !currentUserId) return;

    try {
      await supabase
        .from('messages')
        .update({ offer_status: 'accepted' })
        .eq('id', messageId);

      await supabase.from('messages').insert({
        conversation_id: selectedConversation.id,
        sender_id: currentUserId,
        content: `Offer of ₦${amount.toLocaleString()} has been accepted!`,
        message_type: 'accept',
      });

      const { data: existingEscrow } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('property_id', selectedConversation.property_id)
        .eq('buyer_id', selectedConversation.buyer_id)
        .eq('seller_id', selectedConversation.seller_id)
        .maybeSingle();

      if (existingEscrow) {
        await supabase
          .from('escrow_transactions')
          .update({
            transaction_amount: amount,
            atara_fee: ataraFee,
            platform_fee: platformFee,
            escrow_fee: totalFees,
            total_amount: amount + totalFees,
            offer_amount: amount,
            offer_status: 'accepted',
            seller_responded_at: new Date().toISOString(),
            seller_response: 'accepted',
          })
          .eq('id', existingEscrow.id);
      }

      const otherPartyId =
        currentUserId === selectedConversation.buyer_id
          ? selectedConversation.seller_id
          : selectedConversation.buyer_id;

      if (otherPartyId) {
        await supabase.rpc('create_notification', {
          p_user_id: otherPartyId,
          p_title: 'Offer Accepted',
          p_description: `Your offer of ₦${amount.toLocaleString()} for ${
            selectedConversation.property?.title || 'a property'
          } has been accepted.`,
          p_type: 'offer_accepted',
        });
      }

      await supabase
        .from('conversations')
        .update({
          last_message: `Offer accepted: ₦${amount.toLocaleString()}`,
          last_message_time: new Date().toISOString(),
        })
        .eq('id', selectedConversation.id);

      toast({
        title: 'Offer accepted',
        description: 'Offer accepted. You can proceed to payment from Offers & Negotiations.',
      });
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept offer. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRejectOffer = async (messageId: string) => {
    if (!selectedConversation || !currentUserId) return;

    try {
      const { data: offerMessage } = await supabase
        .from('messages')
        .select('offer_amount')
        .eq('id', messageId)
        .maybeSingle();

      await supabase
        .from('messages')
        .update({ offer_status: 'rejected' })
        .eq('id', messageId);

      await supabase.from('messages').insert({
        conversation_id: selectedConversation.id,
        sender_id: currentUserId,
        content: 'Offer has been rejected.',
        message_type: 'reject',
      });

      await supabase
        .from('escrow_transactions')
        .update({
          offer_status: 'rejected',
          seller_responded_at: new Date().toISOString(),
          seller_response: 'rejected',
        })
        .eq('property_id', selectedConversation.property_id);

      const otherPartyId =
        currentUserId === selectedConversation.buyer_id
          ? selectedConversation.seller_id
          : selectedConversation.buyer_id;

      if (otherPartyId && offerMessage?.offer_amount) {
        await supabase.rpc('create_notification', {
          p_user_id: otherPartyId,
          p_title: 'Offer Rejected',
          p_description: `Your offer of ₦${offerMessage.offer_amount.toLocaleString()} for ${
            selectedConversation.property?.title || 'a property'
          } has been rejected.`,
          p_type: 'offer_rejected',
        });
      }

      await supabase
        .from('conversations')
        .update({
          last_message: 'Offer rejected',
          last_message_time: new Date().toISOString(),
        })
        .eq('id', selectedConversation.id);

      toast({
        title: 'Offer rejected',
        description: 'The offer has been rejected.',
      });
    } catch (error) {
      console.error('Error rejecting offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject offer. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      // Delete all messages in the conversation
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationToDelete);

      // Delete the conversation itself
      await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationToDelete);

      // If this was the selected conversation, clear it
      if (selectedConversation?.id === conversationToDelete) {
        setSelectedConversation(null);
        setMessages([]);
      }

      // Reload conversations to remove the deleted one
      loadConversations();

      toast({
        title: 'Chat deleted',
        description: 'The conversation has been deleted successfully.',
      });
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete conversation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
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
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Messages</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Communicate with buyers and sellers</p>
      </div>

      {conversations.length === 0 ? (
        <Card className="card-glow">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
            <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No Messages Yet</h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center max-w-md px-4">
              Start a conversation by contacting a property owner or wait for buyers to reach out
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-[500px] sm:h-[600px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 card-glow overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8 sm:pl-10 text-sm"
                />
              </div>
            </div>
            <div className="overflow-y-auto h-[calc(500px-64px)] sm:h-[calc(600px-80px)]">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 sm:p-4 border-b border-border transition-colors hover:bg-accent ${
                    selectedConversation?.id === conversation.id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div
                      onClick={() => {
                        setSelectedConversation(conversation);
                        loadMessages(conversation.id);
                      }}
                      className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer"
                    >
                      {conversation.property?.images?.[0] && (
                        <img
                          src={conversation.property.images[0]}
                          alt=""
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-medium text-xs sm:text-sm truncate">
                            {conversation.property?.title || 'Property'}
                          </p>
                          {(() => {
                            const unread = currentUserId === conversation.buyer_id 
                              ? conversation.buyer_unread 
                              : conversation.seller_unread;
                            return unread > 0 ? (
                              <span className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
                            ) : null;
                          })()}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.last_message || 'No messages yet'}
                        </p>
                        {conversation.last_message_time && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(conversation.last_message_time).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConversationToDelete(conversation.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 card-glow flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3 sm:p-4 border-b border-border">
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      {selectedConversation.property?.images?.[0] && (
                        <img
                          src={selectedConversation.property.images[0]}
                          alt=""
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">
                          {selectedConversation.property?.title}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 sm:gap-2 text-xs sm:text-sm flex-shrink-0"
                      onClick={() => setOfferDialogOpen(true)}
                    >
                      <HandshakeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Offer / Negotiation</span>
                      <span className="sm:hidden">Offer</span>
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-[300px]">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground text-sm">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <MessageItem
                        key={message.id}
                        message={message}
                        isOwnMessage={message.sender_id === currentUserId}
                        senderName={message.sender_id === currentUserId ? 'You' : 'User'}
                        onAcceptOffer={handleAcceptOffer}
                        onRejectOffer={handleRejectOffer}
                        isPaidOrConfirmed={
                          escrowStatuses.get(selectedConversation.id)?.payment_verified_at != null ||
                          escrowStatuses.get(selectedConversation.id)?.status === 'funded' ||
                          escrowStatuses.get(selectedConversation.id)?.status === 'inspection_period' ||
                          escrowStatuses.get(selectedConversation.id)?.status === 'completed'
                        }
                      />
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-3 sm:p-4 border-t border-border">
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setSelectedFile(file);
                      }}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="h-9 w-9 sm:h-10 sm:w-10"
                    >
                      <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Input
                      placeholder="Type..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="text-sm"
                    />
                    <Button
                      variant="hero"
                      onClick={handleSendMessage}
                      disabled={uploading || (!newMessage.trim() && !selectedFile)}
                      className="h-9 w-9 sm:h-10 sm:w-10"
                      size="icon"
                    >
                      <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>

                {/* Offer Dialog */}
                <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Make an Offer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div>
                        <Label htmlFor="offer-amount">Offer Amount (₦)</Label>
                        <Input
                          id="offer-amount"
                          type="number"
                          value={offerAmount}
                          onChange={(e) => setOfferAmount(e.target.value)}
                          placeholder="Enter your offer amount"
                          className="mt-1"
                        />
                        {selectedConversation.property?.price && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Listing price: ₦{selectedConversation.property.price.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="offer-message">Message (optional)</Label>
                        <Input
                          id="offer-message"
                          value={offerMessage}
                          onChange={(e) => setOfferMessage(e.target.value)}
                          placeholder="Add a note with your offer"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOfferDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSendOffer} disabled={uploading}>
                        Send Offer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select a conversation to start messaging
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all messages in this conversation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
