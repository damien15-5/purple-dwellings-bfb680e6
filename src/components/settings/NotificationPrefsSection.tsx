import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationPrefsProps {
  notifications: {
    email: boolean;
    push: boolean;
    offers: boolean;
    messages: boolean;
    telegram: boolean;
  };
  setNotifications: (n: any) => void;
  userId: string | null;
  hasTelegram: boolean;
}

export const NotificationPrefsSection = ({ notifications, setNotifications, userId, hasTelegram }: NotificationPrefsProps) => {
  const { toast } = useToast();

  const handleToggle = async (key: string, checked: boolean) => {
    const updated = { ...notifications, [key]: checked };
    setNotifications(updated);

    if (!userId) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_email: updated.email,
          notification_push: updated.push,
          notification_offers: updated.offers,
          notification_messages: updated.messages,
          notification_telegram: updated.telegram,
        })
        .eq('id', userId);
      if (error) throw error;
    } catch {
      toast({ title: 'Error', description: 'Failed to save notification preferences', variant: 'destructive' });
      setNotifications({ ...notifications }); // revert
    }
  };

  const items = [
    { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
    { key: 'push', label: 'Push Notifications', desc: 'Receive push notifications' },
    { key: 'offers', label: 'Offer Notifications', desc: 'Get notified about new offers' },
    { key: 'messages', label: 'Message Notifications', desc: 'Get notified about new messages' },
    ...(hasTelegram
      ? [{ key: 'telegram', label: 'Telegram Notifications', desc: 'Get notified via Telegram' }]
      : []),
  ];

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-accent-purple" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{label}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
            <Switch
              checked={(notifications as any)[key]}
              onCheckedChange={(checked) => handleToggle(key, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
