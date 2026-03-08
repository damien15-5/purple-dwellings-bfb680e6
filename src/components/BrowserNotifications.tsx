import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const BrowserNotifications = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      // Check if browser supports notifications
      if (!('Notification' in window)) return;

      // If permission not yet decided, show custom prompt after a short delay
      if (Notification.permission === 'default') {
        const dismissed = sessionStorage.getItem('notif-prompt-dismissed');
        if (!dismissed) {
          setTimeout(() => setShowPrompt(true), 3000);
        }
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUserId(session.user.id);
        if ('Notification' in window && Notification.permission === 'default') {
          const dismissed = sessionStorage.getItem('notif-prompt-dismissed');
          if (!dismissed) {
            setTimeout(() => setShowPrompt(true), 3000);
          }
        }
      } else {
        setUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!userId) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const channel = supabase
      .channel('browser-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notif = payload.new as { title: string; description: string; type: string };
          
          // Send browser notification
          try {
            const notification = new Notification(notif.title || 'Xavorian', {
              body: notif.description,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: `xavorian-${Date.now()}`,
            });

            notification.onclick = () => {
              window.focus();
              // Navigate based on notification type
              const typeRoutes: Record<string, string> = {
                message: '/dashboard/messages',
                offer: '/dashboard/offers',
                offer_response: '/dashboard/offers',
                escrow: '/dashboard/transactions',
                property: '/dashboard/my-listings',
                verification: '/dashboard/verification',
                saved: '/dashboard/saved',
              };
              const route = typeRoutes[notif.type] || '/dashboard/notifications';
              window.location.href = route;
            };
          } catch (e) {
            console.warn('Browser notification failed:', e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleAllow = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Notifications enabled! You\'ll receive alerts for messages, offers, and more.');
      } else {
        toast.info('You can enable notifications later in your browser settings.');
      }
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('notif-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-fade-in">
      <div className="bg-card border-2 border-primary/20 rounded-2xl shadow-2xl p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Bell className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-sm">Xavorian wants to send you notifications</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Get instant alerts for messages, offers, payments, and property updates.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleAllow}
              className="bg-gradient-to-r from-primary to-primary-light text-xs h-8 px-4"
            >
              Allow
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
              className="text-xs h-8 px-4"
            >
              Not now
            </Button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
