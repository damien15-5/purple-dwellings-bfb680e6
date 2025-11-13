-- Update chat-media bucket to be public
UPDATE storage.buckets SET public = true WHERE id = 'chat-media';