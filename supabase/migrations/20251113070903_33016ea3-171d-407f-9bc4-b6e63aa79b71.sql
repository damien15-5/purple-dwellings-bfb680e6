-- Create storage bucket for chat media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media',
  'chat-media',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'video/mp4']
);

-- Create storage policies for chat media
CREATE POLICY "Users can upload chat media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their chat media"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-media' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM messages m
      INNER JOIN conversations c ON m.conversation_id = c.id
      WHERE m.file_url = storage.objects.name
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can delete their chat media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);