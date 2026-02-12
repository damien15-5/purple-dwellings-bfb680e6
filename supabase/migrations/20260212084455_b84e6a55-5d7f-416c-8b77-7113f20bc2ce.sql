
-- Add more fields to kyc_documents for the full KYC flow
ALTER TABLE public.kyc_documents 
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS nationality text DEFAULT 'Nigerian',
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS lga text,
  ADD COLUMN IF NOT EXISTS document_image_url text,
  ADD COLUMN IF NOT EXISTS selfie_url text,
  ADD COLUMN IF NOT EXISTS extracted_data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS kyc_reference text;

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for kyc-documents bucket
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own KYC documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow admins to view all KYC documents
CREATE POLICY "Admins can view all KYC documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view KYC records
CREATE POLICY "Admins can view all KYC records"
ON public.kyc_documents FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update KYC status
CREATE POLICY "Admins can update KYC records"
ON public.kyc_documents FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));
