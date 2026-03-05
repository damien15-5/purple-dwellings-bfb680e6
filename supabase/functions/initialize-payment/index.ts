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
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    // Handle escrow transaction payment
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

      const reference = `ESC-${escrowId.substring(0, 8)}-${Date.now()}`;
      const amount = Math.round((escrow.offer_amount || escrow.transaction_amount) * 100);

      // No split payment - 100% goes to seller directly (0% platform fee)
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

    // Handle purchase transaction payment
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

      const reference = `PUR-${purchaseId.substring(0, 8)}-${Date.now()}`;

      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        }),
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
