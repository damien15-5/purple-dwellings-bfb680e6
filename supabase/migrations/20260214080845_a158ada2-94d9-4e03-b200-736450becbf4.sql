-- Allow service role to delete promotion records (for merging stacked promotions)
CREATE POLICY "Service can delete promotions for merging"
ON public.property_promotions
FOR DELETE
USING (true);