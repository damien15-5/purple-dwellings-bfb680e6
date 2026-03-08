import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageItem } from '@/components/chat/MessageItem';
import { ChatInput } from '@/components/chat/ChatInput';
import { PropertyInfoPanel } from '@/components/chat/PropertyInfoPanel';
import { filterContactInfo } from '@/utils/contentFilter';
import imageCompression from 'browser-image-compression';
import { ScrollArea } from '@/components/ui/scroll-area';

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

export const Chat = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initChat();
  }, [propertyId]);

  useEffect(() => {
    if (!conversationId) return;

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`messages_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
          scrollToBottom();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages((prev) => 
            prev.map((msg) => msg.id === updatedMessage.id ? updatedMessage : msg)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const initChat = async () => {
    try {
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
        .eq('id', propertyId)
        .single();

      if (propertyError || !propertyData) {
        toast.error('Property not found');
        navigate('/browse');
        return;
      }

      setProperty(propertyData);

      // Determine other user ID
      const otherUserId = propertyData.user_id === session.user.id 
        ? null // Will need to get from conversation
        : propertyData.user_id;

      // Get other user name
      if (otherUserId) {
        const { data: otherUserProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', otherUserId)
          .single();

        if (otherUserProfile) {
          setOtherUserName(otherUserProfile.full_name);
        }
      }

      // Find or create conversation
      let { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('property_id', propertyId)
        .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
        .maybeSingle();

      if (!existingConv) {
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            buyer_id: session.user.id,
            seller_id: propertyData.user_id,
            property_id: propertyId,
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

      // Get other user name if we're the seller
      if (propertyData.user_id === session.user.id) {
        const { data: buyerProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', existingConv.buyer_id)
          .single();

        if (buyerProfile) {
          setOtherUserName(buyerProfile.full_name);
        }
      }

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
      const isOwner = propertyData.user_id === session.user.id;
      await supabase
        .from('conversations')
        .update({ 
          [isOwner ? 'seller_unread' : 'buyer_unread']: 0 
        })
        .eq('id', existingConv.id);

      setLoading(false);
      scrollToBottom();
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to load chat');
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      let fileToUpload = file;

      // Compress images
      if (file.type.startsWith('image/')) {
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/webp',
        });
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${currentUserId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
      return null;
    }
  };

  // Mark message as read
  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Mark all unread messages as read when viewing conversation
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const markAllAsRead = async () => {
      try {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', currentUserId)
          .eq('is_read', false);

        // Update conversation unread count
        const isUserBuyer = property?.user_id !== currentUserId;
        await supabase
          .from('conversations')
          .update({ 
            [isUserBuyer ? 'buyer_unread' : 'seller_unread']: 0 
          })
          .eq('id', conversationId);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    markAllAsRead();
  }, [conversationId, currentUserId, property]);

  const handleSendMessage = async (content: string, file?: File) => {
    if (!conversationId || !currentUserId || (!content.trim() && !file)) return;

    // Check for contact info
    const { filtered: filteredContent, blocked } = filterContactInfo(content);
    if (blocked) {
      // Send warning message
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: '⚠️ Contact information sharing detected. Please complete escrow before sharing personal details.',
        message_type: 'warning',
      });
      return;
    }

    let fileUrl = null;
    let fileType = null;

    if (file) {
      setUploading(true);
      fileUrl = await uploadFile(file);
      fileType = file.type;
      setUploading(false);
      
      if (!fileUrl) return;
    }

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content || 'Sent an attachment',
      file_url: fileUrl,
      file_type: fileType,
      message_type: 'user',
    });

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return;
    }

    // Update conversation
    await supabase
      .from('conversations')
      .update({
        last_message: content || 'Sent an attachment',
        last_message_time: new Date().toISOString(),
        [property?.user_id === currentUserId ? 'buyer_unread' : 'seller_unread']: 0,
      })
      .eq('id', conversationId);

    scrollToBottom();
  };

  const handleSendOffer = async (amount: number, message: string) => {
    if (!conversationId || !currentUserId) return;

    try {
      const { data, error } = await supabase.functions.invoke('sync-chat-offer', {
        body: {
          action: 'create_offer',
          conversationId,
          amount,
          message,
        },
      });

      if (error) throw new Error(error.message || 'Failed to send offer');
      if (data?.error) throw new Error(data.error);

      scrollToBottom();
      toast.success('Offer sent successfully');
    } catch (error: any) {
      console.error('Error sending offer:', error);
      toast.error(error?.message || 'Failed to send offer');
    }
  };

  const handleAcceptOffer = async (messageId: string, amount: number) => {
    // Update offer message status
    await supabase
      .from('messages')
      .update({ offer_status: 'accepted' })
      .eq('id', messageId);

    // Send system message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId!,
      content: `✅ Offer accepted! Agreed price: ${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)}`,
      message_type: 'accept',
    });

    toast.success('Offer accepted! You can now proceed to escrow.');
  };

  const handleRejectOffer = async (messageId: string) => {
    // Update offer message status
    await supabase
      .from('messages')
      .update({ offer_status: 'rejected' })
      .eq('id', messageId);

    // Send system message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId!,
      content: '❌ Offer was rejected.',
      message_type: 'reject',
    });

    toast.info('Offer rejected');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Chat Area - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              {/* Header */}
              <div className="border-b border-border p-4 bg-muted/30">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => navigate('/my-chats')}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserName}`} />
                    <AvatarFallback>{otherUserName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="font-semibold text-foreground">{otherUserName}</h2>
                    <Link 
                      to={`/property/${property.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {property.title}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="h-[calc(100vh-350px)] min-h-[400px]">
                <div className="p-4 space-y-1">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <MessageItem
                        key={message.id}
                        message={message}
                        isOwnMessage={message.sender_id === currentUserId}
                        senderName={message.sender_id === currentUserId ? 'You' : otherUserName}
                        onAcceptOffer={handleAcceptOffer}
                        onRejectOffer={handleRejectOffer}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <ChatInput
                onSendMessage={handleSendMessage}
                onSendOffer={handleSendOffer}
                uploading={uploading}
                propertyPrice={property.price}
              />
            </div>
          </div>

          {/* Property Info Panel - 1 column on large screens */}
          <div className="lg:col-span-1">
            <PropertyInfoPanel
              property={property}
              onStartEscrow={() => navigate(`/start-escrow/${property.id}`)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
