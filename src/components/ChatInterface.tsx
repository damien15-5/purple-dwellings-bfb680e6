import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { filterContactInfo } from '@/utils/contentFilter';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface ChatInterfaceProps {
  propertyId: string;
  propertyOwnerId: string;
  propertyTitle: string;
}

export const ChatInterface = ({ propertyId, propertyOwnerId, propertyTitle }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        await initializeConversation(user.id);
      }
    };

    getCurrentUser();
  }, [propertyId]);

  const initializeConversation = async (userId: string) => {
    try {
      // Check if conversation exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('property_id', propertyId)
        .eq('buyer_id', userId)
        .maybeSingle();

      if (existingConv) {
        setConversationId(existingConv.id);
        loadMessages(existingConv.id);
      } else {
        // Create new conversation
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            property_id: propertyId,
            buyer_id: userId,
            seller_id: propertyOwnerId,
          })
          .select('id')
          .single();

        if (error) throw error;
        if (newConv) {
          setConversationId(newConv.id);
          loadMessages(newConv.id);
        }
      }
    } catch (error: any) {
      console.error('Error initializing conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize chat',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!currentUserId || !conversationId) return;

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
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, conversationId]);

  const loadMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setMessages(data);
      scrollToBottom();
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || !conversationId) return;

    // Filter contact information
    const { filtered, blocked } = filterContactInfo(newMessage);
    
    if (blocked) {
      toast({
        title: 'Message Blocked',
        description: 'Sharing external contact details is not allowed. Please chat safely within Xavorian.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Update last message in conversation
      await supabase
        .from('conversations')
        .update({
          last_message: filtered,
          last_message_time: new Date().toISOString(),
        })
        .eq('id', conversationId);

      // Send message
      const { error } = await supabase.from('messages').insert({
        content: filtered,
        sender_id: currentUserId,
        conversation_id: conversationId,
      });

      if (error) throw error;

      setNewMessage('');
      scrollToBottom();
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[500px] max-h-[80vh] w-full">
      {/* Chat Header */}
      <div className="p-3 border-b bg-gradient-to-r from-primary to-primary/80 text-white rounded-t-lg">
        <h3 className="font-semibold text-base">{propertyTitle}</h3>
        <p className="text-xs text-white/80">Connect with the property owner</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  message.sender_id === currentUserId
                    ? 'bg-light-purple-accent text-white'
                    : 'bg-black text-white'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <span className="text-xs text-white/70 mt-1 block">
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t bg-background">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={loading || !conversationId}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !newMessage.trim() || !conversationId} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
};
