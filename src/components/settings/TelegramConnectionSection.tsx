import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TelegramConnectionProps {
  userId: string | null;
}

export const TelegramConnectionSection = ({ userId }: TelegramConnectionProps) => {
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);

  useEffect(() => {
    if (userId) checkLink();
  }, [userId]);

  const checkLink = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('telegram_user_links' as any)
      .select('is_verified, username')
      .eq('user_id', userId)
      .single();
    if ((data as any)?.is_verified) {
      setTelegramLinked(true);
      setTelegramUsername((data as any)?.username || null);
    }
  };

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-accent-purple" />
          Telegram Connection
        </CardTitle>
      </CardHeader>
      <CardContent>
        {telegramLinked ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">Telegram Connected</p>
                <Badge variant="secondary" className="gap-1 text-xs">
                  <CheckCircle className="h-3 w-3" /> Linked
                </Badge>
              </div>
              {telegramUsername && (
                <p className="text-sm text-muted-foreground mt-1">@{telegramUsername}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                You'll receive instant notifications about offers, messages, and updates.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your Telegram to receive instant notifications about offers, messages, verification updates, and more.
            </p>
            <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-2">
              <p className="font-medium text-sm">How to connect:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open the Xavorian bot on Telegram</li>
                <li>Press <b>Start</b></li>
                <li>Send your registered email address</li>
                <li>Your account will be linked automatically</li>
              </ol>
            </div>
            <Button
              variant="outline"
              className="gap-2 w-full sm:w-auto"
              onClick={() => window.open('https://t.me/xavorian_bot', '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              Open XavorianBot
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
