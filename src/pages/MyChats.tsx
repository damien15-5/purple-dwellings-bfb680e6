import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

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
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredConversations = conversations.filter((conv) =>
    conv.other_user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.property?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
              My <span className="text-gradient-primary">Chats</span>
            </h1>
            <p className="text-muted-foreground">
              View and manage your conversations with buyers and sellers
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-light-purple-border mb-6 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 border-2 border-light-purple-border focus:border-light-purple-accent"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-light-purple-border animate-fade-in">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-light-purple-accent" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 flex items-center justify-center py-20">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50 animate-float" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No conversations yet</h3>
                  <p className="text-muted-foreground">
                    Start chatting with sellers or buyers to see your messages here
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredConversations.map((conv) => {
                  const unreadCount = currentUserId === conv.buyer_id ? conv.buyer_unread : conv.seller_unread;
                  
                  return (
                    <Link
                      key={conv.id}
                      to={`/chat/${conv.property_id}`}
                      className="block p-6 hover:bg-accent/50 transition-colors hover-lift"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 animate-float">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.other_user.full_name}`} />
                          <AvatarFallback>{conv.other_user.full_name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-foreground truncate">
                              {conv.other_user.full_name}
                            </h3>
                            {conv.last_message_time && (
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-light-purple-accent mb-1">{conv.property?.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.last_message || 'No messages yet'}
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <div className="bg-light-purple-accent text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                            {unreadCount}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
