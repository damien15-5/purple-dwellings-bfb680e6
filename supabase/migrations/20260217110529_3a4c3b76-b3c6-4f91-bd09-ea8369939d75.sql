-- Allow users to delete their own KYC records (needed for re-submission)
CREATE POLICY "Users can delete own KYC"
ON public.kyc_documents
FOR DELETE
USING (auth.uid() = user_id);