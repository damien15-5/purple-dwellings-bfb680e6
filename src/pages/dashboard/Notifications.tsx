import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Lock,
  FileCheck,
  TrendingUp,
  Megaphone
} from 'lucide-react';

export const Notifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setNotifications(data || []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    loadNotifications();
  };

  const getNotificationLink = (type: string) => {
    const links: Record<string, string> = {
      offer_accepted: '/dashboard/escrows',
      counter_offer: '/dashboard/offers',
      payment_escrow: '/dashboard/escrows',
      document_verification: '/dashboard/verification',
      funds_released: '/dashboard/escrows',
      price_change: '/dashboard/saved',
    };
    return links[type] || null;
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    const link = getNotificationLink(notification.type);
    if (link) {
      navigate(link);
    } else {
      // For system notifications, toggle expand
      setExpandedId(expandedId === notification.id ? null : notification.id);
    }
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    loadNotifications();
  };

  const getIcon = (type: string) => {
    const icons: Record<string, any> = {
      offer_accepted: CheckCircle,
      counter_offer: MessageSquare,
      payment_escrow: Lock,
      document_verification: FileCheck,
      funds_released: DollarSign,
      price_change: TrendingUp,
      system: Megaphone,
    };
    return icons[type] || Bell;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your property activities
            {unreadCount > 0 && (
              <span className="ml-2">
                • <span className="font-semibold">{unreadCount} unread</span>
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" onClick={markAllAsRead}>Mark all as read</Button>
      </div>

      {notifications.length === 0 ? (
        <Card className="card-glow">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Notifications</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You're all caught up! Check back later for new updates.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = getIcon(notification.type);
            return (
              <Card 
                key={notification.id} 
                className={`card-glow cursor-pointer transition-all hover:shadow-lg ${
                  !notification.read ? 'border-l-4 border-l-accent-purple' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-accent-purple" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <Badge className="bg-accent-purple text-white flex-shrink-0">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm text-muted-foreground mb-2 ${
                        expandedId === notification.id ? '' : 'line-clamp-2'
                      }`}>
                        {notification.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {getNotificationLink(notification.type) && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-accent-purple hover:text-accent-purple"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notification);
                            }}
                          >
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
