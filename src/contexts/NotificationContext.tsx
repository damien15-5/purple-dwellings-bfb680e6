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

  // Get current user and handle login notifications
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
      
      // Only show login notification when user actually logged in (not session restore)
      if (event === 'SIGNED_IN' && sessionStorage.getItem('xavorian_just_logged_in') === 'true') {
        sessionStorage.removeItem('xavorian_just_logged_in');
        addNotification({
          type: 'login',
          title: 'Welcome Back!',
          message: `Logged in at ${new Date().toLocaleTimeString()}`
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Set up realtime listeners
  useEffect(() => {
    if (!userId) return;

    // Listen for new messages (membership checked in callback)
    const messagesChannel = supabase
      .channel(`messages-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload: any) => {
          if (payload.new.sender_id === userId) return;

          const conversationId = payload.new.conversation_id;
          if (!conversationId) return;

          const { data: conversation } = await supabase
            .from('conversations')
            .select('buyer_id, seller_id')
            .eq('id', conversationId)
            .maybeSingle();

          if (!conversation) return;
          if (conversation.buyer_id !== userId && conversation.seller_id !== userId) return;

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
      )
      .subscribe();

    const handleEscrowChange = (payload: any, role: 'buyer' | 'seller') => {
      const event = payload.eventType;
      const oldData = payload.old || {};
      const newData = payload.new || {};

      if (event === 'INSERT' && role === 'seller' && newData.offer_amount) {
        addNotification({
          type: 'offer',
          title: 'New Offer Received',
          message: `You received an offer of ₦${Number(newData.offer_amount).toLocaleString()}`,
          link: '/dashboard/offers'
        });
        return;
      }

      if (event === 'UPDATE') {
        if (oldData.offer_status !== newData.offer_status) {
          if (role === 'buyer' && newData.offer_status === 'accepted' && newData.status === 'pending_payment' && !newData.payment_verified_at) {
            addNotification({
              type: 'offer',
              title: 'Offer Accepted',
              message: 'Your offer was accepted. Complete payment to continue.',
              link: '/dashboard/offers'
            });
          }

          if (role === 'buyer' && newData.offer_status === 'rejected') {
            addNotification({
              type: 'offer',
              title: 'Offer Rejected',
              message: 'Your offer was rejected by the seller.',
              link: '/dashboard/offers'
            });
          }
        }

        if (oldData.status !== newData.status) {
          if (newData.status === 'funded') {
            addNotification({
              type: 'transaction',
              title: 'Payment Received',
              message: 'Escrow has been funded successfully',
              link: '/dashboard/escrows'
            });
          } else if (newData.status === 'completed') {
            addNotification({
              type: 'transaction',
              title: 'Transaction Completed',
              message: 'Escrow transaction has been completed',
              link: '/dashboard/escrows'
            });
          } else if (newData.status === 'disputed') {
            addNotification({
              type: 'transaction',
              title: 'Dispute Raised',
              message: 'A dispute has been raised on your transaction',
              link: '/dashboard/escrows'
            });
          }
        }
      }
    };

    const escrowBuyerChannel = supabase
      .channel(`escrow-notifications-buyer-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'escrow_transactions',
          filter: `buyer_id=eq.${userId}`
        },
        (payload: any) => handleEscrowChange(payload, 'buyer')
      )
      .subscribe();

    const escrowSellerChannel = supabase
      .channel(`escrow-notifications-seller-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'escrow_transactions',
          filter: `seller_id=eq.${userId}`
        },
        (payload: any) => handleEscrowChange(payload, 'seller')
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(escrowBuyerChannel);
      supabase.removeChannel(escrowSellerChannel);
    };
  }, [userId]);

  // Track login events - only on actual user-initiated login, not session restoration
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // Mark that next SIGNED_IN should trigger notification
        sessionStorage.setItem('xavorian_expect_login', 'true');
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
