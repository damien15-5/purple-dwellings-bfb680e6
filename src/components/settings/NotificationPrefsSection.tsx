import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, ExternalLink, CheckCircle } from 'lucide-react';
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
  const [telegramLinked, setTelegramLinked] = useState(false);

  useEffect(() => {
    if (userId) {
      checkTelegramLink();
    }
  }, [userId]);

  const checkTelegramLink = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('telegram_user_links' as any)
      .select('is_verified')
      .eq('user_id', userId)
      .single();
    setTelegramLinked(!!(data as any)?.is_verified);
  };

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
    { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email', disabled: false },
    { key: 'push', label: 'Push Notifications', desc: 'Receive push notifications', disabled: false },
    { key: 'offers', label: 'Offer Notifications', desc: 'Get notified about new offers', disabled: false },
    { key: 'messages', label: 'Message Notifications', desc: 'Get notified about new messages', disabled: false },
    { key: 'telegram', label: 'Telegram Notifications', desc: telegramLinked ? 'Get notified via Telegram' : 'Connect Telegram bot first', disabled: !telegramLinked },
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
        {/* Telegram Bot Connection */}
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">Telegram Bot</p>
                {telegramLinked && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <CheckCircle className="h-3 w-3" /> Connected
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {telegramLinked
                  ? 'Your Telegram is connected. You\'ll receive instant notifications.'
                  : 'Connect via our Telegram bot to receive instant notifications about offers, messages, and verification updates.'}
              </p>
            </div>
            {!telegramLinked && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
                onClick={() => window.open('https://t.me/xavorian_bot', '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                Connect Bot
              </Button>
            )}
          </div>
          {!telegramLinked && (
            <p className="text-xs text-muted-foreground mt-2">
              Open the bot → Press Start → Enter your registered email to link your account.
            </p>
          )}
        </div>

        {items.map(({ key, label, desc, disabled }) => (
          <div key={key} className={`flex items-center justify-between ${disabled ? 'opacity-50' : ''}`}>
            <div>
              <p className="font-medium">{label}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
            <Switch
              checked={(notifications as any)[key]}
              onCheckedChange={(checked) => handleToggle(key, checked)}
              disabled={disabled}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
