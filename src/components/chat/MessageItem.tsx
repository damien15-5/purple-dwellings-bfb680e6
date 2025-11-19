import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FileText, Image as ImageIcon, AlertTriangle, HandshakeIcon, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  file_url: string | null;
  file_type: string | null;
  message_type: string;
  offer_amount: number | null;
  offer_status: string | null;
};

type MessageItemProps = {
  message: Message;
  isOwnMessage: boolean;
  senderName: string;
  onAcceptOffer?: (messageId: string, amount: number) => void;
  onRejectOffer?: (messageId: string) => void;
  onCounterOffer?: (messageId: string, currentAmount: number) => void;
};

export const MessageItem = ({ 
  message, 
  isOwnMessage, 
  senderName,
  onAcceptOffer,
  onRejectOffer,
  onCounterOffer 
}: MessageItemProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // System messages (centered)
  if (message.message_type === 'system' || message.message_type === 'warning') {
    return (
      <div className="flex justify-center my-4">
        <div className={`
          max-w-md px-4 py-2 rounded-lg text-sm text-center
          ${message.message_type === 'warning' 
            ? 'bg-destructive/10 text-destructive border border-destructive/20' 
            : 'bg-muted text-muted-foreground'}
        `}>
          {message.message_type === 'warning' && (
            <AlertTriangle className="inline w-4 h-4 mr-2" />
          )}
          {message.content}
        </div>
      </div>
    );
  }

  // Offer messages (centered with actions)
  if (message.message_type === 'offer' || message.message_type === 'counter_offer') {
    return (
      <div className="flex justify-center my-6">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 max-w-md w-full">
          <div className="flex items-center gap-2 mb-2">
            <HandshakeIcon className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">
              {message.message_type === 'offer' ? 'New Offer' : 'Counter Offer'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{message.content}</p>
          {message.offer_amount && (
            <div className="text-2xl font-bold text-primary mb-3">
              {formatPrice(message.offer_amount)}
            </div>
          )}
          {message.offer_status && (
            <Badge variant={
              message.offer_status === 'accepted' ? 'default' : 
              message.offer_status === 'rejected' ? 'destructive' : 
              'secondary'
            }>
              {message.offer_status}
            </Badge>
          )}
          {!isOwnMessage && message.offer_status === 'pending' && (
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="default"
                onClick={() => onAcceptOffer?.(message.id, message.offer_amount!)}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Accept
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onCounterOffer?.(message.id, message.offer_amount!)}
                className="flex-1"
              >
                Counter
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => onRejectOffer?.(message.id)}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Accept/Reject messages
  if (message.message_type === 'accept' || message.message_type === 'reject') {
    return (
      <div className="flex justify-center my-4">
        <div className={`
          max-w-md px-4 py-2 rounded-lg text-sm
          ${message.message_type === 'accept' 
            ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' 
            : 'bg-destructive/10 text-destructive border border-destructive/20'}
        `}>
          {message.message_type === 'accept' ? (
            <CheckCircle className="inline w-4 h-4 mr-2" />
          ) : (
            <XCircle className="inline w-4 h-4 mr-2" />
          )}
          {message.content}
        </div>
      </div>
    );
  }

  // Regular user messages
  return (
    <div className={`flex gap-3 mb-4 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName}`} />
        <AvatarFallback>{senderName[0]}</AvatarFallback>
      </Avatar>
      <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <div className={`
          rounded-lg px-4 py-2
          ${isOwnMessage 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-foreground'}
        `}>
          {message.file_url && (
            <div className="mb-2">
              {message.file_type?.startsWith('image/') ? (
                <img 
                  src={message.file_url} 
                  alt="Shared image" 
                  className="rounded-lg max-w-sm w-full cursor-pointer hover:opacity-90"
                  onClick={() => window.open(message.file_url!, '_blank')}
                />
              ) : (
                <a 
                  href={message.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm underline"
                >
                  <FileText className="w-4 h-4" />
                  View Document
                </a>
              )}
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
          {isOwnMessage && (
            <span className="text-xs text-muted-foreground">
              {message.is_read ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
