import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, Bot, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Message = { role: 'user' | 'assistant'; content: string };

export const Contact = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! How can I help you today?' }
  ]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ticketIssueType, setTicketIssueType] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickReplies = [
    'How does escrow work?',
    'How do I verify documents?',
    'How do I list a property?',
    'Talk to human agent'
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: [...messages, userMessage] }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let textBuffer = '';
      let streamDone = false;

      const upsertAssistant = (chunk: string) => {
        assistantMessage += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantMessage } : m
            );
          }
          return [...prev, { role: 'assistant', content: assistantMessage }];
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please login to submit a ticket');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        toast.error('Profile not found');
        return;
      }

      const { error } = await supabase
        .from('customer_service_tickets')
        .insert({
          user_id: session.user.id,
          user_email: profile.email,
          subject: ticketIssueType,
          description: ticketDescription,
          priority: ticketPriority,
          status: 'open',
        });

      if (error) throw error;

      toast.success('Support ticket created successfully!');
      setTicketIssueType('');
      setTicketDescription('');
      setTicketPriority('medium');
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-3 sm:mb-4 animate-fade-in text-foreground">Contact Customer Care</h1>
        <p className="text-center text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base px-4">Get instant support from our AI assistant or create a ticket for human assistance</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* AI Chat */}
          <Card className="bg-white border-2 border-light-purple-border hover-lift">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-light-purple-accent" />
                Chat with AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="h-80 sm:h-96 overflow-y-auto space-y-3 sm:space-y-4 mb-3 sm:mb-4 px-1">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[85%] sm:max-w-[80%] p-2.5 sm:p-3 rounded-lg text-sm sm:text-base ${msg.role === 'user' ? 'bg-light-purple-accent text-white' : 'bg-accent/50 border border-light-purple-border text-foreground'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-accent/50 border border-light-purple-border p-3 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="text-sm sm:text-base"
                />
                <Button onClick={handleSendMessage} disabled={isLoading} size="sm" className="sm:size-default">
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickReplies.map(reply => (
                  <Button 
                    key={reply} 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setMessage(reply)}
                    disabled={isLoading}
                  >
                    {reply}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Support Ticket */}
          <Card className="bg-white border-2 border-light-purple-border hover-lift">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-light-purple-accent" />
                Create Support Ticket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTicketSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <Select value={ticketIssueType} onValueChange={setTicketIssueType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bug Report">Bug Report</SelectItem>
                      <SelectItem value="Feature Request">Feature Request</SelectItem>
                      <SelectItem value="Payment Issue">Payment Issue</SelectItem>
                      <SelectItem value="Account Issue">Account Issue</SelectItem>
                      <SelectItem value="Property Listing">Property Listing</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={ticketPriority} onValueChange={setTicketPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea 
                  placeholder="Describe your issue..." 
                  rows={6} 
                  required 
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  className="text-sm sm:text-base min-h-[120px] sm:min-h-[160px]"
                />
                <Button type="submit" className="w-full hover-lift text-sm sm:text-base">Submit Ticket</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
