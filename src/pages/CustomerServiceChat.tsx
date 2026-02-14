import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  User, 
  ArrowLeft, 
  Loader2, 
  TicketPlus,
  Home,
  FileCheck,
  CreditCard,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import xavorianLogo from '@/assets/xavorian-logo.png';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const quickActions = [
  { icon: Home, label: 'My Listings', prompt: 'Show me the status of my property listings' },
  { icon: FileCheck, label: 'Verification', prompt: 'What is my account verification status?' },
  { icon: CreditCard, label: 'Escrow Status', prompt: 'Show me my escrow transactions and their status' },
  { icon: MessageSquare, label: 'Recent Offers', prompt: 'What offers have I received or sent recently?' },
  { icon: AlertCircle, label: 'Report Issue', prompt: 'I need to report a problem with a transaction' },
  { icon: HelpCircle, label: 'How Escrow Works', prompt: 'Explain how the escrow process works on Xavorian' },
];

const getWelcomeMessage = (): Message => ({
  id: '1',
  role: 'assistant',
  content: `Hi! I'm **Xevo**, your Xavorian AI assistant. 👋

How can I help you today?`,
  timestamp: new Date(),
});

const CustomerServiceChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([getWelcomeMessage()]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load user and existing conversation on mount
  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await loadConversation(user.id);
      }
      setIsLoadingConversation(false);
    };
    initChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing conversation from database
  const loadConversation = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_chat_conversations')
        .select('*')
        .eq('user_id', uid)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading conversation:', error);
        return;
      }

      if (data && data.messages) {
        const storedMessages = data.messages as unknown as StoredMessage[];
        if (Array.isArray(storedMessages) && storedMessages.length > 0) {
          const loadedMessages: Message[] = storedMessages.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
          setMessages(loadedMessages);
          setConversationId(data.id);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  // Save conversation to database
  const saveConversation = useCallback(async (messagesToSave: Message[]) => {
    if (!userId) return;

    const storedMessages: StoredMessage[] = messagesToSave
      .filter(m => !m.isTyping)
      .map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
      }));

    try {
      // Convert to JSON-safe format
      const messagesJson = JSON.parse(JSON.stringify(storedMessages));
      
      if (conversationId) {
        // Update existing conversation
        await supabase
          .from('ai_chat_conversations')
          .update({ 
            messages: messagesJson,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);
      } else {
        // Create new conversation
        const { data, error } = await supabase
          .from('ai_chat_conversations')
          .insert([{
            user_id: userId,
            messages: messagesJson,
          }])
          .select()
          .single();

        if (!error && data) {
          setConversationId(data.id);
        }
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }, [userId, conversationId]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const conversationHistory = messages
        .filter(m => !m.isTyping)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-service-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...conversationHistory, { role: 'user', content: text }],
            userId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      // Remove typing indicator and add empty assistant message
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'typing');
        return [...filtered, assistantMessage];
      });

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  assistantContent += content;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'assistant') {
                      lastMessage.content = assistantContent;
                    }
                    return newMessages;
                  });
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // Save conversation after receiving complete response
      const finalMessages = [...newMessages, { ...assistantMessage, content: assistantContent }];
      await saveConversation(finalMessages);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.filter(m => m.id !== 'typing'));
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClearConversation = async () => {
    if (!userId) return;
    
    const welcomeMsg = getWelcomeMessage();
    setMessages([welcomeMsg]);
    
    if (conversationId) {
      await supabase
        .from('ai_chat_conversations')
        .delete()
        .eq('id', conversationId);
      setConversationId(null);
    }
    
    toast.success('Conversation cleared');
  };

  const handleCreateTicket = () => {
    navigate('/dashboard/help');
  };

  // Safe text formatting without dangerouslySetInnerHTML
  const formatMessage = (content: string) => {
    const parts: React.ReactNode[] = [];
    let remaining = content;
    let key = 0;

    // Process the text piece by piece
    while (remaining.length > 0) {
      // Check for bold **text**
      const boldMatch = remaining.match(/^\*\*(.*?)\*\*/);
      if (boldMatch) {
        parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Check for italic *text*
      const italicMatch = remaining.match(/^\*(.*?)\*/);
      if (italicMatch) {
        parts.push(<em key={key++}>{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Check for internal links [text](/path)
      const internalLinkMatch = remaining.match(/^\[(.*?)\]\((\/[^\)]+)\)/);
      if (internalLinkMatch) {
        parts.push(
          <Link 
            key={key++} 
            to={internalLinkMatch[2]} 
            className="text-primary underline hover:text-primary/80"
          >
            {internalLinkMatch[1]}
          </Link>
        );
        remaining = remaining.slice(internalLinkMatch[0].length);
        continue;
      }

      // Check for external links [text](https://...)
      const externalLinkMatch = remaining.match(/^\[(.*?)\]\((https?:\/\/[^\)]+)\)/);
      if (externalLinkMatch) {
        parts.push(
          <a 
            key={key++} 
            href={externalLinkMatch[2]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80"
          >
            {externalLinkMatch[1]}
          </a>
        );
        remaining = remaining.slice(externalLinkMatch[0].length);
        continue;
      }

      // Check for newline
      if (remaining.startsWith('\n')) {
        parts.push(<br key={key++} />);
        remaining = remaining.slice(1);
        continue;
      }

      // Find the next special character or add text up to it
      const nextSpecial = remaining.search(/(\*\*|\*|\[|\n)/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        // If we're at a special character but didn't match it, just add it
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return parts;
  };

  if (isLoadingConversation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={xavorianLogo} alt="Xavo" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  XA
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-semibold">Xavo - AI Support</h1>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? 'Typing...' : 'Online'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 1 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClearConversation}
                className="gap-2 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCreateTicket}
              className="gap-2"
            >
              <TicketPlus className="h-4 w-4" />
              Create Ticket
            </Button>
          </div>
        </div>

        {/* Chat Container */}
        <Card className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <Avatar className={`h-8 w-8 shrink-0 ${
                    message.role === 'user' ? 'bg-muted' : ''
                  }`}>
                    {message.role === 'assistant' ? (
                      <>
                        <AvatarImage src={xavorianLogo} alt="Xavo" />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          XA
                        </AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback className="bg-muted">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.isTyping ? (
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      <div className="text-sm whitespace-pre-wrap">
                        {formatMessage(message.content)}
                      </div>
                    )}
                    <span className="text-xs opacity-60 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          {messages.length <= 2 && (
            <div className="p-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleSendMessage(action.prompt)}
                    disabled={isLoading}
                  >
                    <action.icon className="h-3.5 w-3.5" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
                maxLength={2000}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </Card>

        {/* Info Banner */}
        <div className="mt-4 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="gap-1">
            <img src={xavorianLogo} alt="Xavorian" className="h-3 w-3" />
            Xavorian AI
          </Badge>
          <Link 
            to="/dashboard/help"
            className="hover:text-primary hover:underline transition-colors"
          >
            Need human help? Create a support ticket →
          </Link>
        </div>
      </main>
    </div>
  );
};

export default CustomerServiceChat;