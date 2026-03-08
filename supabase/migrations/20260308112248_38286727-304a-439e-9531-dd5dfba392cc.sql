
CREATE OR REPLACE FUNCTION public.auto_verify_properties_on_kyc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') THEN
    UPDATE properties
    SET is_verified = true
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_kyc_verified_update_properties
  AFTER UPDATE OF status ON public.kyc_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_verify_properties_on_kyc();

CREATE TRIGGER on_kyc_verified_insert_properties
  AFTER INSERT ON public.kyc_documents
  FOR EACH ROW
  WHEN (NEW.status = 'verified')
  EXECUTE FUNCTION public.auto_verify_properties_on_kyc();
