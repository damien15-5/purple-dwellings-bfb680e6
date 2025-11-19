import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, Paperclip, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const Messages = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('conversations')
      .select(`
        *,
        property:properties(title, images)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('last_message_time', { ascending: false });

    setConversations(data || []);
    setLoading(false);
  };

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('messages').insert({
      conversation_id: selectedConversation.id,
      sender_id: user.id,
      content: newMessage,
    });

    setNewMessage('');
    loadMessages(selectedConversation.id);
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
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Messages</h1>
        <p className="text-muted-foreground">Communicate with buyers and sellers</p>
      </div>

      {conversations.length === 0 ? (
        <Card className="card-glow">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Messages Yet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Start a conversation by contacting a property owner or wait for buyers to reach out
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 card-glow overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="overflow-y-auto h-[calc(600px-80px)]">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    loadMessages(conversation.id);
                  }}
                  className={`p-4 border-b border-border cursor-pointer transition-colors hover:bg-accent ${
                    selectedConversation?.id === conversation.id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {conversation.property?.images?.[0] && (
                      <img
                        src={conversation.property.images[0]}
                        alt=""
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-sm truncate">
                          {conversation.property?.title || 'Property'}
                        </p>
                        {(conversation.buyer_unread > 0 || conversation.seller_unread > 0) && (
                          <Badge className="bg-accent-purple text-white flex-shrink-0">
                            {conversation.buyer_unread || conversation.seller_unread}
                          </Badge>
                        )}
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
                </div>
              ))}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 card-glow flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    {selectedConversation.property?.images?.[0] && (
                      <img
                        src={selectedConversation.property.images[0]}
                        alt=""
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold">
                        {selectedConversation.property?.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Contact info available after escrow
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === selectedConversation.buyer_id
                          ? 'justify-start'
                          : 'justify-end'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender_id === selectedConversation.buyer_id
                            ? 'bg-muted'
                            : 'bg-gradient-to-r from-accent-purple to-accent-purple-light text-white'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender_id === selectedConversation.buyer_id
                              ? 'text-muted-foreground'
                              : 'text-white/70'
                          }`}
                        >
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button variant="hero" onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
    </div>
  );
};
