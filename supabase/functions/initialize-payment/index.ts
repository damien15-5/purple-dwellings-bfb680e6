import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { escrowId } = await req.json();

    console.log('Initializing payment for escrow:', escrowId);

    // Get escrow details
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_transactions')
      .select('*, properties(title)')
      .eq('id', escrowId)
      .single();

    if (escrowError || !escrow) {
      throw new Error('Escrow transaction not found');
    }

    // Check if already initialized
    if (escrow.paystack_access_code) {
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
      .select('email')
      .eq('id', escrow.buyer_id)
      .single();

    // Initialize Paystack payment
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    const reference = `ESC-${escrowId.substring(0, 8)}-${Date.now()}`;
    
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: buyer?.email || '',
        amount: Math.round(escrow.total_amount * 100), // Convert to kobo
        reference,
        currency: 'NGN',
        callback_url: `${req.headers.get('origin')}/payment-confirmation?escrow=${escrowId}`,
        metadata: {
          escrow_id: escrowId,
          property_id: escrow.property_id,
          buyer_id: escrow.buyer_id,
          seller_id: escrow.seller_id,
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      throw new Error(paystackData.message || 'Failed to initialize payment');
    }

    // Update escrow with Paystack details
    const { error: updateError } = await supabase
      .from('escrow_transactions')
      .update({
        paystack_reference: reference,
        paystack_access_code: paystackData.data.access_code,
        updated_at: new Date().toISOString(),
      })
      .eq('id', escrowId);

    if (updateError) {
      console.error('Error updating escrow:', updateError);
    }

    console.log('Payment initialized successfully:', reference);

    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error initializing payment:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
