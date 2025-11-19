import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { ChatList } from '@/components/chat/ChatList';

type Conversation = {
  id: string;
  buyer_id: string;
  seller_id: string;
  property_id: string;
  last_message: string;
  last_message_time: string;
  buyer_unread: number;
  seller_unread: number;
  property: {
    title: string;
    images: string[];
  };
  other_user: {
    full_name: string;
  };
};

export const MyChats = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initChats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      setIsLoggedIn(true);
      setCurrentUserId(session.user.id);

      try {
        // Fetch conversations
        const { data: convData, error } = await supabase
          .from('conversations')
          .select(`
            *,
            property:properties(title, images)
          `)
          .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
          .order('last_message_time', { ascending: false });

        if (error) throw error;

        // Fetch other user details for each conversation
        const conversationsWithUsers = await Promise.all(
          (convData || []).map(async (conv) => {
            const otherUserId = conv.buyer_id === session.user.id ? conv.seller_id : conv.buyer_id;
            const { data: userData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', otherUserId)
              .single();

            return {
              ...conv,
              other_user: userData || { full_name: 'User' },
            };
          })
        );

        setConversations(conversationsWithUsers);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    initChats();
  }, [navigate]);

  if (!isLoggedIn) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
              My <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Chats</span>
            </h1>
            <p className="text-muted-foreground">
              View and manage your conversations with buyers and sellers
            </p>
          </div>

          <ChatList 
            conversations={conversations}
            currentUserId={currentUserId}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};
