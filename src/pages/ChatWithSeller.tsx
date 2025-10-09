import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Paperclip, Smile, Phone, MoreVertical, ShieldCheck, Star } from 'lucide-react';
import { mockProperties } from '@/data/mockData';
import { toast } from 'sonner';

export const ChatWithSeller = () => {
  const { id } = useParams();
  const property = mockProperties.find(p => p.id === Number(id));
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'buyer', text: 'Hi, I\'m interested in this property. Is it still available?', time: '10:30 AM' },
    { id: 2, sender: 'seller', text: 'Hello! Yes, the property is still available. Would you like to schedule a viewing?', time: '10:32 AM' },
    { id: 3, sender: 'buyer', text: 'That would be great! What times work for you this week?', time: '10:35 AM' },
    { id: 4, sender: 'seller', text: 'I\'m available Tuesday and Thursday afternoons. Which works better for you?', time: '10:37 AM' },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    
    const newMessage = {
      id: messages.length + 1,
      sender: 'buyer',
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
    
    // Simulate seller typing
    setTimeout(() => {
      const response = {
        id: messages.length + 2,
        sender: 'seller',
        text: 'Thank you for your message. Let me check that for you.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, response]);
    }, 2000);
  };

  if (!property) return <div>Property not found</div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/property/${id}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Avatar className="h-12 w-12">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${property.seller.name}`} />
                <AvatarFallback>{property.seller.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{property.seller.name}</h2>
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>4.8</span>
                  </div>
                  <span>•</span>
                  <span className="text-green-500">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'buyer' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        msg.sender === 'buyer'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent text-accent-foreground'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-2 ${
                        msg.sender === 'buyer' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-900">
                  🛡️ Your personal information is protected. Never share contact details in chat.
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1"
                  />
                  <Button onClick={handleSend} className="hover-lift">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Property Preview */}
            <Card className="overflow-hidden hover-lift card-glow">
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold mb-2">{property.title}</h3>
                <p className="text-2xl font-bold text-primary mb-2">
                  ₦{property.price.toLocaleString()}
                </p>
                <Link to={`/property/${property.id}`}>
                  <Button variant="outline" className="w-full">
                    View Listing Details
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 space-y-3">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <Link to={`/start-escrow/${property.id}`}>
                <Button className="w-full hover-lift animate-glow">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Start Escrow
                </Button>
              </Link>
              <Link to={`/3d-tour/${property.id}`}>
                <Button variant="outline" className="w-full hover-lift">
                  View 3D Tour
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
