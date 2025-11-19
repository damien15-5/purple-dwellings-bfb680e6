import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

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

type ChatListProps = {
  conversations: Conversation[];
  currentUserId: string | null;
  loading: boolean;
};

export const ChatList = ({ conversations, currentUserId, loading }: ChatListProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter((conv) =>
    conv.other_user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.property?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
        {filteredConversations.length === 0 ? (
          <div className="p-6 flex items-center justify-center py-20">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
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
                  className="block p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.other_user.full_name}`} />
                        <AvatarFallback>{conv.other_user.full_name[0]}</AvatarFallback>
                      </Avatar>
                      {conv.property?.images?.[0] && (
                        <img 
                          src={conv.property.images[0]} 
                          alt={conv.property.title}
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-background object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {conv.other_user.full_name}
                        </h3>
                        {conv.last_message_time && (
                          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                            {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-primary/80 mb-1 truncate">{conv.property?.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.last_message || 'No messages yet'}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <Badge variant="default" className="bg-primary text-primary-foreground flex-shrink-0">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
