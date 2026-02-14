-- Enable realtime for escrow_transactions and purchase_transactions so offers and payments update live
ALTER PUBLICATION supabase_realtime ADD TABLE public.escrow_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_transactions;