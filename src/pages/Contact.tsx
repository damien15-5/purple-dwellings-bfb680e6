import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, Bot, User } from 'lucide-react';
import { toast } from 'sonner';

export const Contact = () => {
  const [aiMessages, setAiMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I help you today?' }
  ]);
  const [message, setMessage] = useState('');

  const quickReplies = [
    'How does escrow work?',
    'How do I verify documents?',
    'How do I list a property?',
    'Talk to human agent'
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;
    setAiMessages([...aiMessages, { sender: 'user', text: message }]);
    setMessage('');
    setTimeout(() => {
      setAiMessages(prev => [...prev, { sender: 'bot', text: 'I understand your question. Let me help you with that...' }]);
    }, 1000);
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Support ticket created successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <h1 className="text-4xl font-bold text-center mb-12 animate-fade-in">Contact Customer Care</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Chat */}
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Chat with AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto space-y-4 mb-4">
                {aiMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mb-4">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                />
                <Button onClick={handleSendMessage}><Send className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quickReplies.map(reply => (
                  <Button key={reply} variant="outline" size="sm" onClick={() => setMessage(reply)}>
                    {reply}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Support Ticket */}
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Create Support Ticket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="payment">Payment Issue</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea placeholder="Describe your issue..." rows={8} required />
                <Button type="submit" className="w-full hover-lift">Submit Ticket</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
