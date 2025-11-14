import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
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

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
    const signature = req.headers.get('x-paystack-signature');
    const body = await req.text();

    // Verify webhook signature
    const hash = createHmac('sha512', paystackSecretKey)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid signature');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const event = JSON.parse(body);
    console.log('Webhook event received:', event.event);

    // Handle charge.success event
    if (event.event === 'charge.success') {
      const { reference, amount, metadata, paid_at, channel } = event.data;

      console.log('Processing payment for reference:', reference);

      // Find escrow transaction
      const { data: escrow, error: escrowError } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('paystack_reference', reference)
        .single();

      if (escrowError || !escrow) {
        console.error('Escrow not found for reference:', reference);
        return new Response(
          JSON.stringify({ success: false, error: 'Escrow not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payment_records')
        .insert({
          escrow_id: escrow.id,
          paystack_reference: reference,
          amount: amount / 100, // Convert from kobo
          status: 'success',
          payment_method: channel,
          paid_at: new Date(paid_at).toISOString(),
          webhook_data: event.data,
        });

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
      }

      // Update escrow status to funded and set inspection period
      const inspectionStartDate = new Date();
      const inspectionEndDate = new Date();
      inspectionEndDate.setDate(inspectionEndDate.getDate() + 14); // 2 weeks inspection period

      const { error: updateError } = await supabase
        .from('escrow_transactions')
        .update({
          status: 'funded',
          payment_verified_at: new Date().toISOString(),
          inspection_start_date: inspectionStartDate.toISOString(),
          inspection_end_date: inspectionEndDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', escrow.id);

      if (updateError) {
        console.error('Error updating escrow status:', updateError);
      } else {
        console.log('Escrow funded successfully:', escrow.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
