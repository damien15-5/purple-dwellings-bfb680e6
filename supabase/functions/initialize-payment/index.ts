import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { purchaseId, escrowId } = await req.json();

    console.log('Initializing payment for:', { purchaseId, escrowId });

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');

    // Handle escrow transaction payment (from offers flow)
    if (escrowId) {
      const { data: escrow, error: escrowError } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('id', escrowId)
        .single();

      if (escrowError || !escrow) {
        throw new Error('Escrow transaction not found');
      }

      // Check if already initialized
      if (escrow.paystack_access_code && escrow.paystack_reference) {
        return new Response(
          JSON.stringify({
            success: true,
            authorization_url: `https://checkout.paystack.com/${escrow.paystack_access_code}`,
            access_code: escrow.paystack_access_code,
            reference: escrow.paystack_reference,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get buyer email
      const { data: buyer } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', escrow.buyer_id)
        .single();

      // Get seller's subaccount code for split payment
      const { data: seller } = await supabase
        .from('profiles')
        .select('paystack_subaccount_code, full_name')
        .eq('id', escrow.seller_id)
        .single();

      const reference = `ESC-${escrowId.substring(0, 8)}-${Date.now()}`;
      const amount = Math.round(escrow.total_amount * 100);

      const paystackBody: any = {
        email: buyer?.email || '',
        amount,
        reference,
        currency: 'NGN',
        callback_url: `https://xavorian.xyz/payment-confirmation?escrow=${escrowId}`,
        metadata: {
          escrow_id: escrowId,
          property_id: escrow.property_id,
          buyer_id: escrow.buyer_id,
          buyer_name: buyer?.full_name || '',
          seller_id: escrow.seller_id,
          type: 'escrow_payment',
        },
      };

      // Add split payment if seller has a subaccount
      if (seller?.paystack_subaccount_code) {
        paystackBody.subaccount = seller.paystack_subaccount_code;
        // transaction_charge = Paystack processing fee (goes to main account to cover Paystack's fees)
        // Seller gets: amount - transaction_charge = full property price (100%)
        const propertyPrice = escrow.offer_amount || escrow.transaction_amount;
        const paystackFeeKobo = Math.min(Math.round(propertyPrice * 0.018 * 100), 250000);
        paystackBody.transaction_charge = paystackFeeKobo;
        paystackBody.bearer = 'account';
        console.log('Using split payment with subaccount:', seller.paystack_subaccount_code, 'transaction_charge kobo:', paystackFeeKobo);
      } else {
        console.warn('Seller has no subaccount, payment goes to main account');
      }

      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paystackBody),
      });

      const paystackData = await paystackResponse.json();

      if (!paystackData.status) {
        throw new Error(paystackData.message || 'Failed to initialize payment');
      }

      // Update escrow with Paystack details
      await supabase
        .from('escrow_transactions')
        .update({
          paystack_reference: reference,
          paystack_access_code: paystackData.data.access_code,
          updated_at: new Date().toISOString(),
        })
        .eq('id', escrowId);

      console.log('Escrow payment initialized successfully:', { reference });

      return new Response(
        JSON.stringify({
          success: true,
          authorization_url: paystackData.data.authorization_url,
          access_code: paystackData.data.access_code,
          reference,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle purchase transaction payment (original flow)
    if (purchaseId) {
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchase_transactions')
        .select('*, properties(title, price)')
        .eq('id', purchaseId)
        .single();

      if (purchaseError || !purchase) {
        throw new Error('Purchase transaction not found');
      }

      if (purchase.paystack_access_code && purchase.paystack_reference) {
        return new Response(
          JSON.stringify({
            success: true,
            authorization_url: `https://checkout.paystack.com/${purchase.paystack_access_code}`,
            access_code: purchase.paystack_access_code,
            reference: purchase.paystack_reference,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: buyer } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', purchase.buyer_id)
        .single();

      // Get seller's subaccount code for split payment
      const { data: seller } = await supabase
        .from('profiles')
        .select('paystack_subaccount_code, full_name')
        .eq('id', purchase.seller_id)
        .single();

      const reference = `PUR-${purchaseId.substring(0, 8)}-${Date.now()}`;

      const paystackBody: any = {
        email: buyer?.email || '',
        amount: Math.round(purchase.transaction_amount * 100),
        reference,
        currency: 'NGN',
        callback_url: `https://xavorian.xyz/payment-confirmation?purchase=${purchaseId}`,
        metadata: {
          purchase_id: purchaseId,
          property_id: purchase.property_id,
          buyer_id: purchase.buyer_id,
          buyer_name: buyer?.full_name || '',
          seller_id: purchase.seller_id,
          transaction_amount: purchase.transaction_amount,
        },
      };

      // Add split payment if seller has a subaccount
      if (seller?.paystack_subaccount_code) {
        paystackBody.subaccount = seller.paystack_subaccount_code;
        // transaction_charge covers the Paystack fee; seller gets the rest (100% of property price)
        const paystackFeeKobo = Math.min(Math.round(purchase.transaction_amount * 0.018 * 100), 250000);
        paystackBody.transaction_charge = paystackFeeKobo;
        paystackBody.bearer = 'account';
        console.log('Using split payment with subaccount:', seller.paystack_subaccount_code, 'transaction_charge:', paystackFeeKobo);
      } else {
        console.warn('Seller has no subaccount, payment goes to main account');
      }

      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paystackBody),
      });

      const paystackData = await paystackResponse.json();

      if (!paystackData.status) {
        throw new Error(paystackData.message || 'Failed to initialize payment');
      }

      await supabase
        .from('purchase_transactions')
        .update({
          paystack_reference: reference,
          paystack_access_code: paystackData.data.access_code,
          updated_at: new Date().toISOString(),
        })
        .eq('id', purchaseId);

      console.log('Payment initialized successfully:', { reference });

      return new Response(
        JSON.stringify({
          success: true,
          authorization_url: paystackData.data.authorization_url,
          access_code: paystackData.data.access_code,
          reference,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Either purchaseId or escrowId is required');
  } catch (error) {
    console.error('Error initializing payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
