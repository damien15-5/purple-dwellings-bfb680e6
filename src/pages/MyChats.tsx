import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export const MyChats = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
      } else {
        setIsLoggedIn(true);
      }
    });
  }, [navigate]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              My <span className="text-gradient-primary">Chats</span>
            </h1>
            <p className="text-muted-foreground">
              View and manage your conversations with buyers and sellers
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-light-purple-border mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search conversations..."
                className="pl-10 h-12"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-light-purple-border">
            <div className="divide-y divide-border">
              <div className="p-6 flex items-center justify-center py-20">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No conversations yet</h3>
                  <p className="text-muted-foreground">
                    Start chatting with sellers or buyers to see your messages here
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
