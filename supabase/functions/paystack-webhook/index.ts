import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

async function notifyAdminsTelegram(supabase: any, message: string) {
  const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!telegramToken) return;
  try {
    const { data: adminChats } = await supabase
      .from('telegram_admin_chats')
      .select('chat_id')
      .eq('is_active', true);
    for (const chat of adminChats || []) {
      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat.chat_id, text: message, parse_mode: 'Markdown' }),
      });
    }
  } catch (tgErr) {
    console.error('Telegram alert failed:', tgErr);
  }
}

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

    // Verify signature
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
      console.warn('No signature provided');
    }

    const event = JSON.parse(body);
    console.log('Webhook event received:', event.event, 'Data:', JSON.stringify(event.data));

    if (event.event === 'charge.success') {
      const { reference, amount, metadata, paid_at, channel, status: paystackStatus } = event.data;
      const txHash = metadata?.tx_hash;

      console.log('Processing payment:', { reference, txHash, paystackStatus, metadata });

      // Handle account initialization payment (₦100 bank verification) - LEGACY
      if (metadata?.type === 'account_initialization') {
        console.log('Processing account initialization payment for user:', metadata.user_id);
        
        const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: { 'Authorization': `Bearer ${paystackSecretKey}` },
        });
        const verifyData = await verifyResponse.json();

        if (verifyData.status && verifyData.data?.status === 'success') {
          await supabase
            .from('profiles')
            .update({ bank_verified: true })
            .eq('id', metadata.user_id);
          console.log('Bank account verified successfully for user:', metadata.user_id);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find escrow transaction by reference or tx_hash
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

      // Idempotency check
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
          tx_hash: escrow.tx_hash || txHash || reference,
          event_type: 'payment_verification_failed',
          payload: { reference, paystack_response: verifyData, webhook_data: event.data },
        });
        return new Response(
          JSON.stringify({ success: false, error: 'Payment verification failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Payment verified successfully - create payment record
      console.log('Payment verified successfully');

      await supabase
        .from('payment_records')
        .insert({
          escrow_id: escrow.id,
          tx_hash: escrow.tx_hash || txHash || reference,
          paystack_reference: reference,
          amount: amount / 100,
          status: 'success',
          payment_method: channel,
          paid_at: new Date(paid_at).toISOString(),
          webhook_data: event.data,
        });

      await supabase.from('transactions').insert({
        tx_hash: escrow.tx_hash || txHash || reference,
        event_type: 'payment_verified',
        payload: { reference, amount: amount / 100, channel, paystack_verification: verifyData.data },
      });

      const inspectionStartDate = new Date();
      const inspectionEndDate = new Date();
      inspectionEndDate.setDate(inspectionEndDate.getDate() + 21);

      // Update escrow to funded — with split payments, Paystack auto-settles to seller's subaccount
      // No need to trigger process-payout anymore
      await supabase
        .from('escrow_transactions')
        .update({
          status: 'funded',
          payment_verified_at: new Date().toISOString(),
          paystack_verified_at: new Date().toISOString(),
          inspection_start_date: inspectionStartDate.toISOString(),
          inspection_end_date: inspectionEndDate.toISOString(),
          transfer_status: 'split_auto', // Indicates split payment handles settlement
          updated_at: new Date().toISOString(),
        })
        .eq('id', escrow.id);

      await supabase.from('audit_logs').insert({
        escrow_id: escrow.id,
        actor_id: escrow.buyer_id,
        action: 'payment_confirmed',
        before_state: { status: escrow.status },
        after_state: { status: 'funded', settlement: 'split_auto' },
        reason: 'Payment verified by Paystack. Seller receives funds via split payment in T+1 business day.',
      });

      // Notify admins
      const { data: seller } = await supabase
        .from('profiles')
        .select('full_name, bank_name, account_number')
        .eq('id', escrow.seller_id)
        .single();

      await notifyAdminsTelegram(supabase,
        `✅ *PAYMENT RECEIVED (Split)*\n\nEscrow: \`${escrow.id.substring(0, 8)}\`\nAmount: ₦${(amount / 100).toLocaleString()}\nSeller: ${seller?.full_name || 'Unknown'}\nBank: ${seller?.bank_name || 'N/A'} - ${seller?.account_number || 'N/A'}\n\nSeller receives funds automatically via Paystack split in T+1 business day.`
      );

      console.log('Escrow funded successfully (split payment):', escrow.id);
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
