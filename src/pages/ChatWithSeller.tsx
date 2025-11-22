import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, ShieldCheck, AlertCircle, Paperclip, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { filterContactInfo } from '@/utils/contentFilter';

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  file_url: string | null;
  file_type: string | null;
};

type Property = {
  id: string;
  title: string;
  price: number;
  images: string[];
  user_id: string;
};

export const ChatWithSeller = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sellerName, setSellerName] = useState<string>('Seller');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      setCurrentUserId(session.user.id);

      // Fetch property
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (propertyError || !propertyData) {
        toast.error('Property not found');
        navigate('/browse');
        return;
      }

      setProperty(propertyData);

      // Get seller name
      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', propertyData.user_id)
        .single();

      if (sellerProfile) {
        setSellerName(sellerProfile.full_name);
      }

      // Find or create conversation
      let { data: existingConv, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('property_id', id)
        .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
        .single();

      if (!existingConv) {
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            buyer_id: session.user.id,
            seller_id: propertyData.user_id,
            property_id: id,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating conversation:', createError);
          toast.error('Failed to start chat');
          return;
        }

        existingConv = newConv;
      }

      setConversationId(existingConv.id);

      // Fetch messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', existingConv.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (messagesData) {
        setMessages(messagesData);
      }

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', existingConv.id)
        .neq('sender_id', session.user.id);

      // Subscribe to new messages
      const channel = supabase
        .channel(`messages:${existingConv.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${existingConv.id}`,
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
    };

    initChat();
  }, [id, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type === 'video/mp4';
    
    if (!isImage && !isVideo) {
      toast.error('Only images (JPG, PNG) and videos (MP4) are allowed');
      return;
    }

    const maxSize = isImage ? 2 * 1024 * 1024 : 5 * 1024 * 1024; // 2MB for images, 5MB for videos
    if (file.size > maxSize) {
      toast.error(`File too large. Max size: ${isImage ? '2MB' : '5MB'}`);
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

  const handleSend = async () => {
    if ((!message.trim() && !selectedFile) || !conversationId || !currentUserId) return;

    let fileUrl: string | null = null;
    let fileType: string | null = null;

    setUploading(true);

    try {
      // Upload file if selected
      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile);
        fileType = selectedFile.type.startsWith('image/') ? 'image' : 'video';
      }

      // Filter contact information from text
      const { filtered, blocked } = filterContactInfo(message);

      if (blocked && message.trim()) {
        toast.error('Contact details are removed for your security.', {
          duration: 5000,
        });
      }

      const messageContent = filtered || (fileType === 'image' ? '📷 Image' : '🎥 Video');

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: messageContent,
          file_url: fileUrl,
          file_type: fileType,
        });

      if (error) throw error;

      // Update conversation
      await supabase
        .from('conversations')
        .update({
          last_message: messageContent,
          last_message_time: new Date().toISOString(),
        })
        .eq('id', conversationId);

      setMessage('');
      clearSelectedFile();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10 border-2 border-light-purple-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/property/${id}`}>
                <Button variant="ghost" size="icon" className="hover-lift">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Avatar className="h-12 w-12 animate-float">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${sellerName}`} />
                <AvatarFallback>{sellerName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-foreground">{sellerName}</h2>
                  <ShieldCheck className="h-4 w-4 text-light-purple-accent" />
                </div>
                <p className="text-sm text-muted-foreground">Property Seller</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2 space-y-4">
            <Link to={`/start-escrow/${id}`} className="block">
              <Button className="w-full" size="lg">
                <ShieldCheck className="w-5 h-5 mr-2" />
                Make Payment
              </Button>
            </Link>
            <Card className="h-[600px] flex flex-col bg-white border-2 border-light-purple-border animate-fade-in">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-4 ${
                          msg.sender_id === currentUserId
                            ? 'bg-light-purple-accent text-black'
                            : 'bg-black text-white'
                        }`}
                      >
                        {msg.file_url && (
                          <div className="mb-2">
                            {msg.file_type === 'image' ? (
                              <img
                                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/chat-media/${msg.file_url}`}
                                alt="Shared image"
                                className="rounded-lg max-w-full h-auto cursor-pointer"
                                onClick={() => window.open(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/chat-media/${msg.file_url}`, '_blank')}
                              />
                            ) : (
                              <video
                                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/chat-media/${msg.file_url}`}
                                controls
                                className="rounded-lg max-w-full h-auto"
                              />
                            )}
                          </div>
                        )}
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-2 ${msg.sender_id === currentUserId ? 'text-black/70' : 'text-white/70'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-light-purple-border p-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-900 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p>
                    🛡️ <strong>Security Notice:</strong> Phone numbers, emails, and links are automatically removed. Media: Images (JPG/PNG, max 2MB), Videos (MP4, max 5MB).
                  </p>
                </div>
                
                {/* File Preview */}
                {previewUrl && (
                  <div className="mb-3 relative inline-block">
                    <div className="relative">
                      {selectedFile?.type.startsWith('image/') ? (
                        <img src={previewUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
                      ) : (
                        <video src={previewUrl} className="h-20 w-20 object-cover rounded-lg" />
                      )}
                      <button
                        onClick={clearSelectedFile}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
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
                    className="border-2 border-light-purple-border hover:bg-light-purple-accent/10"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !uploading && handleSend()}
                    disabled={uploading}
                    className="flex-1 border-2 border-light-purple-border focus:border-light-purple-accent"
                  />
                  <Button 
                    onClick={handleSend} 
                    disabled={uploading || (!message.trim() && !selectedFile)}
                    className="hover-lift bg-light-purple-accent hover:bg-light-purple-accent/90"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Property Preview */}
            <Card className="overflow-hidden hover-lift bg-white border-2 border-light-purple-border animate-fade-in">
              {property.images && property.images.length > 0 && (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold mb-2 text-foreground">{property.title}</h3>
                <p className="text-2xl font-bold mb-2" style={{ color: '#000000' }}>
                  ₦{property.price.toLocaleString()}
                </p>
                <Link to={`/property/${property.id}`}>
                  <Button variant="outline" className="w-full border-2 border-light-purple-border hover:bg-light-purple-accent/10">
                    View Listing Details
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 space-y-3 bg-white border-2 border-light-purple-border animate-fade-in">
              <h3 className="font-semibold mb-4 text-foreground">Quick Actions</h3>
              <Link to={`/start-escrow/${property.id}`}>
                <Button className="w-full hover-lift animate-glow bg-light-purple-accent hover:bg-light-purple-accent/90">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Make Payment
                </Button>
              </Link>
              <Link to={`/3d-tour/${property.id}`}>
                <Button variant="outline" className="w-full hover-lift border-2 border-light-purple-border hover:bg-light-purple-accent/10">
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
