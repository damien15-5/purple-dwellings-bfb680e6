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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        loadMessages();
      }
    };

    getCurrentUser();
  }, [propertyId]);

  useEffect(() => {
    if (!currentUserId) return;

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`messages_${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${propertyId}`,
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
  }, [currentUserId, propertyId]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', propertyId)
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
    if (!newMessage.trim() || !currentUserId) return;

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
      // First, ensure conversation exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('property_id', propertyId)
        .eq('buyer_id', currentUserId)
        .single();

      if (!existingConv) {
        // Create conversation
        await supabase.from('conversations').insert({
          property_id: propertyId,
          buyer_id: currentUserId,
          seller_id: propertyOwnerId,
          last_message: filtered,
          last_message_time: new Date().toISOString(),
        });
      } else {
        // Update last message
        await supabase
          .from('conversations')
          .update({
            last_message: filtered,
            last_message_time: new Date().toISOString(),
          })
          .eq('id', existingConv.id);
      }

      // Send message
      const { error } = await supabase.from('messages').insert({
        content: filtered,
        sender_id: currentUserId,
        conversation_id: propertyId,
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
    <Card className="flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary to-accent-purple text-white rounded-t-lg">
        <h3 className="font-semibold text-lg">Chat about: {propertyTitle}</h3>
        <p className="text-sm text-white/80">Connect with the property owner</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/20">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
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
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender_id === currentUserId
                    ? 'bg-gradient-to-r from-primary to-accent-purple text-white'
                    : 'bg-white border border-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <UserIcon className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    {message.sender_id === currentUserId ? 'You' : 'Owner'}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(message.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !newMessage.trim()} variant="hero">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
};
