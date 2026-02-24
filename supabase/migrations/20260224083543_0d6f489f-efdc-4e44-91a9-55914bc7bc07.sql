-- Allow authenticated users to view basic profile info (needed for offers, chat, etc.)
CREATE POLICY "Authenticated users can view basic profiles"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);