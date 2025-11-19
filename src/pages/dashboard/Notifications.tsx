import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const mockNotifications = [
  {
    id: 1,
    type: 'offer_accepted',
    title: 'Offer Accepted',
    description: 'Your offer for Modern 3 Bedroom Apartment has been accepted',
    timestamp: '2 hours ago',
    read: false,
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    id: 2,
    type: 'counter_offer',
    title: 'Counter Offer Received',
    description: 'Seller has made a counter offer on Luxury Villa in Lekki',
    timestamp: '5 hours ago',
    read: false,
    icon: MessageSquare,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    id: 3,
    type: 'payment_escrow',
    title: 'Payment Entered Escrow',
    description: 'Payment for Duplex in Ikoyi has been secured in escrow',
    timestamp: '1 day ago',
    read: true,
    icon: Lock,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    id: 4,
    type: 'document_verification',
    title: 'Documents Verified',
    description: 'All documents for your property have been verified successfully',
    timestamp: '2 days ago',
    read: true,
    icon: FileCheck,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    id: 5,
    type: 'funds_released',
    title: 'Funds Released',
    description: 'Escrow funds have been released. Check your account.',
    timestamp: '3 days ago',
    read: true,
    icon: DollarSign,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    id: 6,
    type: 'price_change',
    title: 'Price Change Request',
    description: 'Buyer has requested a price change for your listing',
    timestamp: '3 days ago',
    read: true,
    icon: TrendingUp,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
];

export const Notifications = () => {
  const [notifications] = useState(mockNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

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
        <Button variant="outline">Mark all as read</Button>
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
            const Icon = notification.icon;
            return (
              <Card 
                key={notification.id} 
                className={`card-glow cursor-pointer transition-all hover:shadow-lg ${
                  !notification.read ? 'border-l-4 border-l-accent-purple' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-lg ${notification.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-6 w-6 ${notification.color}`} />
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
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {notification.timestamp}
                        </span>
                        <Button variant="ghost" size="sm" className="text-accent-purple hover:text-accent-purple">
                          View Details
                        </Button>
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
