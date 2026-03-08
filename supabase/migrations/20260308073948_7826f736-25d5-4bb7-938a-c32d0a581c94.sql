
-- 1. Add UPDATE policy for messages so offer_status can be updated
CREATE POLICY "Users can update messages in their conversations"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
  )
);

-- 2. Add payment_confirmed_deadline column to track 72h auto-confirm
ALTER TABLE public.escrow_transactions ADD COLUMN IF NOT EXISTS payment_confirmed_deadline timestamp with time zone DEFAULT NULL;
