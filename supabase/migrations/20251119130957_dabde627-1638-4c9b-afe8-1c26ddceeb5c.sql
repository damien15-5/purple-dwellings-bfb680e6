-- Allow users to delete messages in their own conversations
CREATE POLICY "Users can delete messages in their conversations"
ON messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
  )
);

-- Allow users to delete their own conversations
CREATE POLICY "Users can delete own conversations"
ON conversations FOR DELETE
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);