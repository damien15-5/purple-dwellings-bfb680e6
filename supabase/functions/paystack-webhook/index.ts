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

    // In test mode, Paystack might not send signature
    // For production, always verify signature
    if (signature) {
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
    } else {
      console.warn('No signature provided - test mode?');
    }

    const event = JSON.parse(body);
    console.log('Webhook event received:', event.event, 'Data:', JSON.stringify(event.data));

    // Handle charge.success event
    if (event.event === 'charge.success') {
      const { reference, amount, metadata, paid_at, channel, status: paystackStatus } = event.data;
      const txHash = metadata?.tx_hash;

      console.log('Processing payment:', { reference, txHash, paystackStatus, metadata });

      // Handle account initialization payment (₦100 bank verification)
      if (metadata?.type === 'account_initialization') {
        console.log('Processing account initialization payment for user:', metadata.user_id);
        
        // Verify payment with Paystack
        const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: { 'Authorization': `Bearer ${paystackSecretKey}` },
        });
        const verifyData = await verifyResponse.json();

        if (verifyData.status && verifyData.data?.status === 'success') {
          // Mark bank as verified
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ bank_verified: true })
            .eq('id', metadata.user_id);

          if (updateError) {
            console.error('Error marking bank verified:', updateError);
          } else {
            console.log('Bank account verified successfully for user:', metadata.user_id);
          }
        } else {
          console.error('Account init payment verification failed:', verifyData);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find escrow transaction by tx_hash or reference
      let escrow;
      if (txHash) {
        const { data: escrowByHash } = await supabase
          .from('escrow_transactions')
          .select('*')
          .eq('tx_hash', txHash)
          .single();
        escrow = escrowByHash;
      }

      if (!escrow) {
        const { data: escrowByRef } = await supabase
          .from('escrow_transactions')
          .select('*')
          .eq('paystack_reference', reference)
          .single();
        escrow = escrowByRef;
      }

      if (!escrow) {
        console.error('Escrow not found for:', { reference, txHash });
        return new Response(
          JSON.stringify({ success: false, error: 'Escrow not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check for idempotency
      if (escrow.status === 'funded' && escrow.payment_verified_at) {
        console.log('Payment already processed, returning success');
        return new Response(
          JSON.stringify({ success: true, message: 'Already processed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify payment with Paystack API
      const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { 'Authorization': `Bearer ${paystackSecretKey}` },
      });
      const verifyData = await verifyResponse.json();

      if (!verifyData.status || verifyData.data?.status !== 'success') {
        console.error('Payment verification failed:', verifyData);
        await supabase.from('transactions').insert({
          tx_hash: escrow.tx_hash || txHash,
          event_type: 'payment_verification_failed',
          payload: { reference, paystack_response: verifyData, webhook_data: event.data },
        });
        await supabase.from('audit_logs').insert({
          escrow_id: escrow.id,
          action: 'payment_verification_failed',
          before_state: { status: escrow.status },
          after_state: { status: 'pending_payment' },
          reason: 'Paystack verification returned non-success status',
        });
        return new Response(
          JSON.stringify({ success: false, error: 'Payment verification failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Payment verified successfully
      console.log('Payment verified successfully');

      const { error: paymentError } = await supabase
        .from('payment_records')
        .insert({
          escrow_id: escrow.id,
          tx_hash: escrow.tx_hash || txHash,
          paystack_reference: reference,
          amount: amount / 100,
          status: 'success',
          payment_method: channel,
          paid_at: new Date(paid_at).toISOString(),
          webhook_data: event.data,
        });
      if (paymentError) console.error('Error creating payment record:', paymentError);

      await supabase.from('transactions').insert({
        tx_hash: escrow.tx_hash || txHash,
        event_type: 'payment_verified',
        payload: { reference, amount: amount / 100, channel, paystack_verification: verifyData.data },
      });

      const inspectionStartDate = new Date();
      const inspectionEndDate = new Date();
      inspectionEndDate.setDate(inspectionEndDate.getDate() + 21);

      const { error: updateError } = await supabase
        .from('escrow_transactions')
        .update({
          status: 'funded',
          payment_verified_at: new Date().toISOString(),
          paystack_verified_at: new Date().toISOString(),
          inspection_start_date: inspectionStartDate.toISOString(),
          inspection_end_date: inspectionEndDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', escrow.id);
      if (updateError) console.error('Error updating escrow status:', updateError);

      await supabase.from('audit_logs').insert({
        escrow_id: escrow.id,
        actor_id: escrow.buyer_id,
        action: 'payment_confirmed',
        before_state: { status: escrow.status },
        after_state: { status: 'funded', inspection_start: inspectionStartDate.toISOString(), inspection_end: inspectionEndDate.toISOString() },
        reason: 'Payment verified and confirmed by Paystack',
      });

      console.log('Escrow funded successfully:', escrow.id);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
