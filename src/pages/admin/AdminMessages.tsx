import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  property_id: string | null;
  last_message: string | null;
  last_message_time: string | null;
  created_at: string;
  buyerName?: string;
  sellerName?: string;
  propertyTitle?: string;
  messageCount?: number;
}

const AdminMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
  });

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data: convos } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_time', { ascending: false });

      if (convos) {
        const convosWithDetails = await Promise.all(
          convos.map(async (convo) => {
            const { data: buyer } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', convo.buyer_id)
              .single();

            const { data: seller } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', convo.seller_id)
              .single();

            let propertyTitle = 'N/A';
            if (convo.property_id) {
              const { data: property } = await supabase
                .from('properties')
                .select('title')
                .eq('id', convo.property_id)
                .single();
              propertyTitle = property?.title || 'N/A';
            }

            const { count: messageCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', convo.id);

            return {
              ...convo,
              buyerName: buyer?.full_name || 'Unknown',
              sellerName: seller?.full_name || 'Unknown',
              propertyTitle,
              messageCount: messageCount || 0,
            };
          })
        );

        setConversations(convosWithDetails);

        const totalMessages = convosWithDetails.reduce(
          (sum, c) => sum + (c.messageCount || 0),
          0
        );
        setStats({
          totalConversations: convosWithDetails.length,
          totalMessages,
        });
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-1">View all user conversations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Conversations
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Messages
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {loading ? (
              <div className="text-center py-8">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No conversations found
              </div>
            ) : (
              <div className="space-y-4">
                {conversations.map((convo) => (
                  <Card key={convo.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{convo.buyerName}</Badge>
                            <span className="text-muted-foreground">↔</span>
                            <Badge variant="outline">{convo.sellerName}</Badge>
                          </div>
                          <Badge variant="secondary">{convo.messageCount} messages</Badge>
                        </div>
                        <p className="text-sm font-medium">{convo.propertyTitle}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {convo.last_message || 'No messages yet'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {convo.last_message_time
                            ? new Date(convo.last_message_time).toLocaleString()
                            : new Date(convo.created_at).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMessages;