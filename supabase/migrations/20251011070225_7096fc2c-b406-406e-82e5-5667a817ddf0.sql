-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  property_type TEXT NOT NULL,
  address TEXT NOT NULL,
  price DECIMAL NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  area DECIMAL,
  year_built INTEGER,
  condition TEXT,
  amenities TEXT[],
  status TEXT NOT NULL DEFAULT 'draft',
  images TEXT[],
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id),
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  buyer_unread INTEGER DEFAULT 0,
  seller_unread INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  is_read BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Properties RLS policies
CREATE POLICY "Anyone can view published properties" 
ON public.properties FOR SELECT 
USING (status = 'published' OR auth.uid() = user_id);

CREATE POLICY "Users can create own properties" 
ON public.properties FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties" 
ON public.properties FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties" 
ON public.properties FOR DELETE 
USING (auth.uid() = user_id);

-- Conversations RLS policies
CREATE POLICY "Users can view own conversations" 
ON public.conversations FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create conversations" 
ON public.conversations FOR INSERT 
WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can update own conversations" 
ON public.conversations FOR UPDATE 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Messages RLS policies
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations" 
ON public.messages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = conversation_id 
    AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
  )
);

-- Create indexes for performance
CREATE INDEX idx_properties_user_id ON public.properties(user_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_conversations_buyer_id ON public.conversations(buyer_id);
CREATE INDEX idx_conversations_seller_id ON public.conversations(seller_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);

-- Create updated_at trigger for properties
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;