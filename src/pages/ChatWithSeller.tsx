import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, ShieldCheck, AlertCircle, Paperclip, X, Loader2, HandshakeIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { filterContactInfo } from '@/utils/contentFilter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageItem } from '@/components/chat/MessageItem';

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  file_url: string | null;
  file_type: string | null;
  message_type: string;
  offer_amount: number | null;
  offer_status: string | null;
};

type Property = {
  id: string;
  title: string;
  price: number;
  images: string[];
  user_id: string;
};

export const ChatWithSeller = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sellerName, setSellerName] = useState<string>('Seller');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [counterOfferAmount, setCounterOfferAmount] = useState('');
  const [counterDialogOpen, setCounterDialogOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      setCurrentUserId(session.user.id);

      // Fetch property
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (propertyError || !propertyData) {
        toast.error('Property not found');
        navigate('/browse');
        return;
      }

      setProperty(propertyData);

      // Get seller name
      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', propertyData.user_id)
        .single();

      if (sellerProfile) {
        setSellerName(sellerProfile.full_name);
      }

      // Find or create conversation
      let { data: existingConv, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('property_id', id)
        .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
        .single();

      if (!existingConv) {
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            buyer_id: session.user.id,
            seller_id: propertyData.user_id,
            property_id: id,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating conversation:', createError);
          toast.error('Failed to start chat');
          return;
        }

        existingConv = newConv;
      }

      setConversationId(existingConv.id);

      // Fetch messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', existingConv.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (messagesData) {
        setMessages(messagesData);
      }

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', existingConv.id)
        .neq('sender_id', session.user.id);

      // Subscribe to new messages
      const channel = supabase
        .channel(`messages:${existingConv.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${existingConv.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    initChat();
  }, [id, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast.error('Only images (JPG, PNG, JPEG) and videos (MP4) are allowed');
      return;
    }

    const maxSize = isImage ? 2 * 1024 * 1024 : 5 * 1024 * 1024; // 2MB for images, 5MB for videos
    if (file.size > maxSize) {
      toast.error(`File too large. Max size: ${isImage ? '2MB' : '5MB'}`);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    return fileName;
  };

  const handleSend = async () => {
    if ((!message.trim() && !selectedFile) || !conversationId || !currentUserId) return;

    let fileUrl: string | null = null;
    let fileType: string | null = null;

    setUploading(true);

    try {
      // Upload file if selected
      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile);
        fileType = selectedFile.type.startsWith('image/') ? 'image' : 'video';
      }

      // Filter contact information from text
      const { filtered, blocked } = filterContactInfo(message);

      if (blocked && message.trim()) {
        toast.error('Contact details are removed for your security.', {
          duration: 5000,
        });
      }

      const messageContent = filtered || (fileType === 'image' ? '📷 Image' : '🎥 Video');

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: messageContent,
          file_url: fileUrl,
          file_type: fileType,
        });

      if (error) throw error;

      // Update conversation
      await supabase
        .from('conversations')
        .update({
          last_message: messageContent,
          last_message_time: new Date().toISOString(),
        })
        .eq('id', conversationId);

      setMessage('');
      clearSelectedFile();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  const handleSendOffer = async () => {
    if (!offerAmount || !conversationId || !currentUserId || !property) return;

    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const content = offerMessage || `I'd like to make an offer of ₦${amount.toLocaleString()} for this property.`;
      
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content,
          message_type: 'offer',
          offer_amount: amount,
          offer_status: 'pending'
        });

      if (error) throw error;

      // Create or update escrow transaction with offer
      const { data: existingEscrow } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('property_id', property.id)
        .eq('buyer_id', currentUserId)
        .eq('seller_id', property.user_id)
        .single();

      if (existingEscrow) {
        await supabase
          .from('escrow_transactions')
          .update({
            offer_amount: amount,
            offer_status: 'pending',
            offer_message: content
          })
          .eq('id', existingEscrow.id);
      } else {
        // Calculate fees
        const ataraFee = amount * 0.015;
        const platformFee = amount > 30000000 ? amount * 0.005 : amount * 0.01;
        const totalFees = ataraFee + platformFee;

        await supabase
          .from('escrow_transactions')
          .insert({
            property_id: property.id,
            buyer_id: currentUserId,
            seller_id: property.user_id,
            transaction_amount: amount,
            escrow_fee: ataraFee,
            platform_fee: platformFee,
            atara_fee: ataraFee,
            total_amount: amount + totalFees,
            offer_amount: amount,
            offer_status: 'pending',
            offer_message: content,
            status: 'pending_payment'
          });
      }

      // Create notification for seller
      await supabase.rpc('create_notification', {
        p_user_id: property.user_id,
        p_title: 'New Offer Received',
        p_description: `You received an offer of ₦${amount.toLocaleString()} for ${property.title}`,
        p_type: 'offer'
      });

      await supabase
        .from('conversations')
        .update({
          last_message: `New offer: ₦${amount.toLocaleString()}`,
          last_message_time: new Date().toISOString(),
        })
        .eq('id', conversationId);

      setOfferAmount('');
      setOfferMessage('');
      setOfferDialogOpen(false);
      toast.success('Offer sent successfully');
    } catch (error) {
      console.error('Error sending offer:', error);
      toast.error('Failed to send offer');
    }
  };

  const handleAcceptOffer = async (messageId: string, amount: number) => {
    if (!conversationId || !currentUserId || !property) return;

    try {
      // Update message status
      const { error: msgError } = await supabase
        .from('messages')
        .update({ offer_status: 'accepted' })
        .eq('id', messageId);

      if (msgError) throw msgError;

      // Send acceptance message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: `Offer of ₦${amount.toLocaleString()} has been accepted!`,
          message_type: 'accept'
        });

      // Update escrow transaction
      await supabase
        .from('escrow_transactions')
        .update({
          offer_status: 'accepted',
          seller_responded_at: new Date().toISOString(),
          seller_response: 'accepted'
        })
        .eq('property_id', property.id)
        .eq('offer_amount', amount);

      // Notify the buyer
      const { data: conversation } = await supabase
        .from('conversations')
        .select('buyer_id')
        .eq('id', conversationId)
        .single();

      if (conversation) {
        await supabase.rpc('create_notification', {
          p_user_id: conversation.buyer_id,
          p_title: 'Offer Accepted',
          p_description: `Your offer of ₦${amount.toLocaleString()} for ${property.title} has been accepted!`,
          p_type: 'offer_accepted'
        });
      }

      await supabase
        .from('conversations')
        .update({
          last_message: `Offer accepted: ₦${amount.toLocaleString()}`,
          last_message_time: new Date().toISOString(),
        })
        .eq('id', conversationId);

      toast.success('Offer accepted successfully');
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast.error('Failed to accept offer');
    }
  };

  const handleRejectOffer = async (messageId: string) => {
    if (!conversationId || !currentUserId || !property) return;

    try {
      // Update message status
      const { error: msgError } = await supabase
        .from('messages')
        .update({ offer_status: 'rejected' })
        .eq('id', messageId);

      if (msgError) throw msgError;

      // Send rejection message
      const { data: msg } = await supabase
        .from('messages')
        .select('offer_amount')
        .eq('id', messageId)
        .single();

      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: `Offer of ₦${msg?.offer_amount?.toLocaleString()} has been rejected.`,
          message_type: 'reject'
        });

      // Update escrow transaction
      await supabase
        .from('escrow_transactions')
        .update({
          offer_status: 'rejected',
          seller_responded_at: new Date().toISOString(),
          seller_response: 'rejected'
        })
        .eq('property_id', property.id)
        .eq('offer_amount', msg?.offer_amount);

      // Notify the buyer
      const { data: conversation } = await supabase
        .from('conversations')
        .select('buyer_id')
        .eq('id', conversationId)
        .single();

      if (conversation) {
        await supabase.rpc('create_notification', {
          p_user_id: conversation.buyer_id,
          p_title: 'Offer Rejected',
          p_description: `Your offer of ₦${msg?.offer_amount?.toLocaleString()} for ${property.title} has been rejected.`,
          p_type: 'offer_rejected'
        });
      }

      await supabase
        .from('conversations')
        .update({
          last_message: 'Offer rejected',
          last_message_time: new Date().toISOString(),
        })
        .eq('id', conversationId);

      toast.success('Offer rejected');
    } catch (error) {
      console.error('Error rejecting offer:', error);
      toast.error('Failed to reject offer');
    }
  };

  const handleCounterOffer = async (messageId: string, currentAmount: number) => {
    setSelectedMessageId(messageId);
    setCounterOfferAmount(currentAmount.toString());
    setCounterDialogOpen(true);
  };

  const handleSendCounterOffer = async () => {
    if (!counterOfferAmount || !conversationId || !currentUserId || !property || !selectedMessageId) return;

    const amount = parseFloat(counterOfferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      // Update original message
      await supabase
        .from('messages')
        .update({ offer_status: 'countered' })
        .eq('id', selectedMessageId);

      // Send counter offer message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: `Counter offer: ₦${amount.toLocaleString()}`,
          message_type: 'counter_offer',
          offer_amount: amount,
          offer_status: 'pending'
        });

      // Update escrow transaction
      await supabase
        .from('escrow_transactions')
        .update({
          offer_amount: amount,
          offer_status: 'pending',
          offer_message: `Counter offer: ₦${amount.toLocaleString()}`
        })
        .eq('property_id', property.id);

      // Notify the other party
      const { data: conversation } = await supabase
        .from('conversations')
        .select('buyer_id, seller_id')
        .eq('id', conversationId)
        .single();

      const recipientId = currentUserId === conversation?.buyer_id ? conversation?.seller_id : conversation?.buyer_id;
      
      if (recipientId) {
        await supabase.rpc('create_notification', {
          p_user_id: recipientId,
          p_title: 'Counter Offer Received',
          p_description: `Counter offer of ₦${amount.toLocaleString()} for ${property.title}`,
          p_type: 'counter_offer'
        });
      }

      await supabase
        .from('conversations')
        .update({
          last_message: `Counter offer: ₦${amount.toLocaleString()}`,
          last_message_time: new Date().toISOString(),
        })
        .eq('id', conversationId);

      setCounterOfferAmount('');
      setCounterDialogOpen(false);
      setSelectedMessageId(null);
      toast.success('Counter offer sent');
    } catch (error) {
      console.error('Error sending counter offer:', error);
      toast.error('Failed to send counter offer');
    }
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10 border-2 border-light-purple-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/property/${id}`}>
                <Button variant="ghost" size="icon" className="hover-lift">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Avatar className="h-12 w-12 animate-float">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${sellerName}`} />
                <AvatarFallback>{sellerName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-foreground">{sellerName}</h2>
                  <ShieldCheck className="h-4 w-4 text-light-purple-accent" />
                </div>
                <p className="text-sm text-muted-foreground">Property Seller</p>
              </div>
            </div>
            <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2 border-2 border-light-purple-accent hover:bg-light-purple-accent hover:text-white transition-all"
                >
                  <HandshakeIcon className="h-4 w-4" />
                  Make Offer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Make an Offer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="header-offer-amount">Offer Amount (₦)</Label>
                    <Input
                      id="header-offer-amount"
                      type="number"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                      placeholder="Enter your offer amount"
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Original price: ₦{property?.price.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="header-offer-message">Message (Optional)</Label>
                    <Textarea
                      id="header-offer-message"
                      value={offerMessage}
                      onChange={(e) => setOfferMessage(e.target.value)}
                      placeholder="Add a message with your offer..."
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={handleSendOffer} className="w-full">
                    Send Offer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2 space-y-4">
            <Link to={`/start-escrow/${id}`} className="block">
              <Button className="w-full" size="lg">
                <ShieldCheck className="w-5 h-5 mr-2" />
                Make Payment
              </Button>
            </Link>
            <Card className="h-[600px] flex flex-col bg-white border-2 border-light-purple-border animate-fade-in">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageItem
                      key={msg.id}
                      message={msg}
                      isOwnMessage={msg.sender_id === currentUserId}
                      senderName={msg.sender_id === currentUserId ? 'You' : sellerName}
                      onAcceptOffer={handleAcceptOffer}
                      onRejectOffer={handleRejectOffer}
                      onCounterOffer={handleCounterOffer}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-light-purple-border p-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-900 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p>
                    🛡️ <strong>Security Notice:</strong> Phone numbers, emails, and links are automatically removed. Media: Images (max 2MB), Videos (max 5MB).
                  </p>
                </div>
                
                {/* File Preview */}
                {previewUrl && (
                  <div className="mb-3 relative inline-block">
                    <div className="relative">
                      {selectedFile?.type.startsWith('image/') ? (
                        <img src={previewUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
                      ) : (
                        <video src={previewUrl} className="h-20 w-20 object-cover rounded-lg" />
                      )}
                      <button
                        onClick={clearSelectedFile}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,video/mp4,video/quicktime,video/x-msvideo"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="border-2 border-light-purple-border hover:bg-light-purple-accent/10"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="border-2 border-light-purple-border hover:bg-light-purple-accent/10"
                      >
                        <HandshakeIcon className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Make an Offer</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
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
                          <p className="text-sm text-muted-foreground mt-1">
                            Original price: ₦{property?.price.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="offer-message">Message (Optional)</Label>
                          <Textarea
                            id="offer-message"
                            value={offerMessage}
                            onChange={(e) => setOfferMessage(e.target.value)}
                            placeholder="Add a message with your offer..."
                            className="mt-1"
                          />
                        </div>
                        <Button onClick={handleSendOffer} className="w-full">
                          Send Offer
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !uploading && handleSend()}
                    disabled={uploading}
                    className="flex-1 border-2 border-light-purple-border focus:border-light-purple-accent"
                  />
                  <Button 
                    onClick={handleSend} 
                    disabled={uploading || (!message.trim() && !selectedFile)}
                    className="hover-lift bg-light-purple-accent hover:bg-light-purple-accent/90"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                
                {/* Counter Offer Dialog */}
                <Dialog open={counterDialogOpen} onOpenChange={setCounterDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Counter Offer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="counter-amount">Counter Offer Amount (₦)</Label>
                        <Input
                          id="counter-amount"
                          type="number"
                          value={counterOfferAmount}
                          onChange={(e) => setCounterOfferAmount(e.target.value)}
                          placeholder="Enter your counter offer"
                          className="mt-1"
                        />
                      </div>
                      <Button onClick={handleSendCounterOffer} className="w-full">
                        Send Counter Offer
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Property Preview */}
            <Card className="overflow-hidden hover-lift bg-white border-2 border-light-purple-border animate-fade-in">
              {property.images && property.images.length > 0 && (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold mb-2 text-foreground">{property.title}</h3>
                <p className="text-2xl font-bold mb-2" style={{ color: '#000000' }}>
                  ₦{property.price.toLocaleString()}
                </p>
                <Link to={`/property/${property.id}`}>
                  <Button variant="outline" className="w-full border-2 border-light-purple-border hover:bg-light-purple-accent/10">
                    View Listing Details
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 space-y-3 bg-white border-2 border-light-purple-border animate-fade-in">
              <h3 className="font-semibold mb-4 text-foreground">Quick Actions</h3>
              <Link to={`/start-escrow/${property.id}`}>
                <Button className="w-full hover-lift animate-glow bg-light-purple-accent hover:bg-light-purple-accent/90">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Make Payment
                </Button>
              </Link>
              <Link to={`/3d-tour/${property.id}`}>
                <Button variant="outline" className="w-full hover-lift border-2 border-light-purple-border hover:bg-light-purple-accent/10">
                  View 3D Tour
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
