import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Paperclip, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { filterContactInfo } from '@/utils/contentFilter';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  file_url: string | null;
  file_type: string | null;
}

interface ChatInterfaceProps {
  propertyId: string;
  propertyOwnerId: string;
  propertyTitle: string;
}

export const ChatInterface = ({ propertyId, propertyOwnerId, propertyTitle }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        await initializeConversation(user.id);
      }
    };

    getCurrentUser();
  }, [propertyId]);

  const initializeConversation = async (userId: string) => {
    try {
      // Check if conversation exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('property_id', propertyId)
        .eq('buyer_id', userId)
        .maybeSingle();

      if (existingConv) {
        setConversationId(existingConv.id);
        loadMessages(existingConv.id);
      } else {
        // Create new conversation
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            property_id: propertyId,
            buyer_id: userId,
            seller_id: propertyOwnerId,
          })
          .select('id')
          .single();

        if (error) throw error;
        if (newConv) {
          setConversationId(newConv.id);
          loadMessages(newConv.id);
        }
      }
    } catch (error: any) {
      console.error('Error initializing conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize chat',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!currentUserId || !conversationId) return;

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`messages_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, conversationId]);

  const loadMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setMessages(data);
      scrollToBottom();
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type === 'video/mp4';
    
    if (!isImage && !isVideo) {
      toast({
        title: 'Invalid file type',
        description: 'Only images (JPG, PNG) and videos (MP4) are allowed',
        variant: 'destructive',
      });
      return;
    }

    const maxSize = isImage ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: `Max size: ${isImage ? '2MB' : '5MB'}`,
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    return fileName;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !currentUserId || !conversationId) return;

    let fileUrl: string | null = null;
    let fileType: string | null = null;

    setLoading(true);
    setUploading(true);

    try {
      // Upload file if selected
      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile);
        fileType = selectedFile.type.startsWith('image/') ? 'image' : 'video';
      }

      // Filter contact information
      const { filtered, blocked } = filterContactInfo(newMessage);
      
      if (blocked && newMessage.trim()) {
        toast({
          title: 'Message Blocked',
          description: 'Contact details are removed for your security.',
          variant: 'destructive',
        });
      }

      const messageContent = filtered || (fileType === 'image' ? '📷 Image' : '🎥 Video');

      // Update last message in conversation
      await supabase
        .from('conversations')
        .update({
          last_message: messageContent,
          last_message_time: new Date().toISOString(),
        })
        .eq('id', conversationId);

      // Send message
      const { error } = await supabase.from('messages').insert({
        content: messageContent,
        sender_id: currentUserId,
        conversation_id: conversationId,
        file_url: fileUrl,
        file_type: fileType,
      });

      if (error) throw error;

      setNewMessage('');
      clearSelectedFile();
      scrollToBottom();
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[500px] max-h-[80vh] w-full">
      {/* Chat Header */}
      <div className="p-3 border-b bg-gradient-to-r from-primary to-primary/80 text-white rounded-t-lg">
        <h3 className="font-semibold text-base">{propertyTitle}</h3>
        <p className="text-xs text-white/80">Connect with the property owner</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  message.sender_id === currentUserId
                    ? 'bg-light-purple-accent text-black'
                    : 'bg-black text-white'
                }`}
              >
                {message.file_url && (
                  <div className="mb-2">
                    {message.file_type === 'image' ? (
                      <img
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/chat-media/${message.file_url}`}
                        alt="Shared image"
                        className="rounded-lg max-w-full h-auto cursor-pointer"
                        onClick={() => window.open(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/chat-media/${message.file_url}`, '_blank')}
                      />
                    ) : (
                      <video
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/chat-media/${message.file_url}`}
                        controls
                        className="rounded-lg max-w-full h-auto"
                      />
                    )}
                  </div>
                )}
                <p className="text-sm">{message.content}</p>
                <span className={`text-xs mt-1 block ${message.sender_id === currentUserId ? 'text-black/70' : 'text-white/70'}`}>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t bg-background">
        {previewUrl && (
          <div className="mb-2 relative inline-block">
            <div className="relative">
              {selectedFile?.type.startsWith('image/') ? (
                <img src={previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-lg" />
              ) : (
                <video src={previewUrl} className="h-16 w-16 object-cover rounded-lg" />
              )}
              <button
                type="button"
                onClick={clearSelectedFile}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,video/mp4"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={loading || !conversationId}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={loading || uploading || (!newMessage.trim() && !selectedFile) || !conversationId} 
            size="icon"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </form>
    </Card>
  );
};
