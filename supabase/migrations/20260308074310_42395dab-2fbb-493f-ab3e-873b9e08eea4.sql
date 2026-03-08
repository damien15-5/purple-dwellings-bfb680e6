
-- Drop and recreate foreign keys with SET NULL on delete
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_property_id_fkey;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;

ALTER TABLE public.escrow_transactions DROP CONSTRAINT IF EXISTS escrow_transactions_property_id_fkey;
ALTER TABLE public.escrow_transactions ADD CONSTRAINT escrow_transactions_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;

ALTER TABLE public.saved_properties DROP CONSTRAINT IF EXISTS saved_properties_property_id_fkey;
ALTER TABLE public.saved_properties ADD CONSTRAINT saved_properties_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.property_promotions DROP CONSTRAINT IF EXISTS property_promotions_property_id_fkey;
ALTER TABLE public.property_promotions ADD CONSTRAINT property_promotions_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.purchase_transactions DROP CONSTRAINT IF EXISTS purchase_transactions_property_id_fkey;
ALTER TABLE public.purchase_transactions ADD CONSTRAINT purchase_transactions_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;
