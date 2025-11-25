import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  type: 'message' | 'offer' | 'transaction' | 'login' | 'general';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  loadMoreNotifications: () => void;
  hasMore: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'xavorian_notifications';
const INITIAL_LOAD = 10;
const LOAD_MORE_COUNT = 10;

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [displayCount, setDisplayCount] = useState(INITIAL_LOAD);
  const [userId, setUserId] = useState<string | null>(null);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setAllNotifications(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse notifications:', e);
      }
    }
  }, []);

  // Save to localStorage whenever notifications change
  useEffect(() => {
    if (allNotifications.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotifications));
    }
  }, [allNotifications]);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Set up realtime listeners
  useEffect(() => {
    if (!userId) return;

    // Listen for new messages
    const messagesChannel = supabase
      .channel('messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=in.(select id from conversations where buyer_id=eq.${userId} or seller_id=eq.${userId})`
        },
        async (payload: any) => {
          if (payload.new.sender_id !== userId) {
            // Get sender name
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', payload.new.sender_id)
              .single();

            addNotification({
              type: 'message',
              title: 'New Message',
              message: `${profile?.full_name || 'Someone'} sent you a message`,
              link: `/dashboard/chats`
            });
          }
        }
      )
      .subscribe();

    // Listen for escrow transactions
    const escrowChannel = supabase
      .channel('escrow-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'escrow_transactions',
          filter: `buyer_id=eq.${userId},seller_id=eq.${userId}`
        },
        (payload: any) => {
          const event = payload.eventType;
          const data = payload.new || payload.old;
          
          let title = '';
          let message = '';
          
          if (event === 'INSERT') {
            title = 'New Escrow Created';
            message = 'A new escrow transaction has been initiated';
          } else if (event === 'UPDATE') {
            if (data.status === 'funded') {
              title = 'Payment Received';
              message = 'Escrow has been funded successfully';
            } else if (data.status === 'completed') {
              title = 'Transaction Completed';
              message = 'Escrow transaction has been completed';
            } else if (data.status === 'disputed') {
              title = 'Dispute Raised';
              message = 'A dispute has been raised on your transaction';
            }
          }
          
          if (title) {
            addNotification({
              type: 'transaction',
              title,
              message,
              link: '/dashboard/escrows'
            });
          }
        }
      )
      .subscribe();

    // Listen for offers (via messages with offer_amount)
    const offersChannel = supabase
      .channel('offers-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=in.(select id from conversations where buyer_id=eq.${userId} or seller_id=eq.${userId})`
        },
        async (payload: any) => {
          if (payload.new.sender_id !== userId && payload.new.offer_amount) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', payload.new.sender_id)
              .single();

            addNotification({
              type: 'offer',
              title: 'New Offer Received',
              message: `${profile?.full_name || 'Someone'} made an offer of ₦${payload.new.offer_amount.toLocaleString()}`,
              link: '/dashboard/offers'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(escrowChannel);
      supabase.removeChannel(offersChannel);
    };
  }, [userId]);

  // Track login events - only show notification on actual login, not session restoration
  useEffect(() => {
    // Check if this is a fresh login vs session restoration
    const sessionKey = 'xavorian_session_active';
    const wasAlreadyLoggedIn = sessionStorage.getItem(sessionKey) === 'true';

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // Only show notification if user wasn't already logged in (fresh login)
        if (!wasAlreadyLoggedIn) {
          addNotification({
            type: 'login',
            title: 'Welcome Back!',
            message: `Logged in at ${new Date().toLocaleTimeString()}`
          });
        }
        // Mark session as active
        sessionStorage.setItem(sessionKey, 'true');
      } else if (event === 'SIGNED_OUT') {
        // Clear session marker on logout
        sessionStorage.removeItem(sessionKey);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      read: false
    };

    setAllNotifications(prev => [newNotification, ...prev].slice(0, 100)); // Keep max 100 notifications
  };

  const markAsRead = (id: string) => {
    setAllNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setAllNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setAllNotifications([]);
    localStorage.removeItem(STORAGE_KEY);
    setDisplayCount(INITIAL_LOAD);
  };

  const loadMoreNotifications = () => {
    setDisplayCount(prev => Math.min(prev + LOAD_MORE_COUNT, allNotifications.length));
  };

  const notifications = allNotifications.slice(0, displayCount);
  const unreadCount = allNotifications.filter(n => !n.read).length;
  const hasMore = displayCount < allNotifications.length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        loadMoreNotifications,
        hasMore
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
