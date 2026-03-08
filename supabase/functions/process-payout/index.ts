import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Paystack fee: 1.5% capped at ₦2,000
function calculatePaystackFee(amountNaira: number): number {
  return Math.min(Math.round(amountNaira * 0.015), 2000);
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

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) throw new Error('Paystack secret key not configured');

    const { escrow_id } = await req.json();
    if (!escrow_id) throw new Error('escrow_id is required');

    const { data: escrow, error: escrowErr } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('id', escrow_id)
      .single();

    if (escrowErr || !escrow) throw new Error('Escrow not found');

    if (!['funded', 'completed', 'inspection_period'].includes(escrow.status)) {
      throw new Error(`Escrow is not in a payable state: ${escrow.status}`);
    }

    const { data: seller } = await supabase
      .from('profiles')
      .select('paystack_subaccount_code, full_name, bank_name, account_number, account_name')
      .eq('id', escrow.seller_id)
      .single();

    if (!seller?.paystack_subaccount_code) {
      throw new Error('Seller has no verified bank account / recipient code');
    }

    const transactionAmountNaira = escrow.offer_amount || escrow.transaction_amount;
    const paystackFeeNaira = calculatePaystackFee(transactionAmountNaira);
    const payoutAmountKobo = Math.round((transactionAmountNaira - paystackFeeNaira) * 100);

    if (payoutAmountKobo <= 0) {
      throw new Error('Payout amount is zero or negative after fees');
    }

    console.log(`Processing payout: Amount ₦${transactionAmountNaira}, Paystack fee ₦${paystackFeeNaira}, Payout ₦${payoutAmountKobo / 100}`);

    // Disable OTP for transfers
    try {
      await fetch('https://api.paystack.co/transfer/disable_otp', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${paystackSecretKey}`, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      console.warn('OTP disable request failed (may already be disabled):', e);
    }

    const transferRef = `PAYOUT-${escrow_id.substring(0, 8)}-${Date.now()}`;
    const transferRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: payoutAmountKobo,
        recipient: seller.paystack_subaccount_code,
        reason: `Property payment payout for escrow ${escrow_id.substring(0, 8)}`,
        reference: transferRef,
        currency: 'NGN',
      }),
    });

    const transferData = await transferRes.json();
    console.log('Transfer response:', JSON.stringify(transferData));

    if (!transferData.status) {
      // Notify admin via Telegram on failure
      const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
      if (telegramToken) {
        try {
          const { data: adminChats } = await supabase
            .from('telegram_admin_chats')
            .select('chat_id')
            .eq('is_active', true);

          const failMsg = `🚨 *PAYOUT FAILED*\n\nEscrow: \`${escrow_id.substring(0, 8)}\`\nSeller: ${seller.full_name}\nAmount: ₦${(payoutAmountKobo / 100).toLocaleString()}\nError: ${transferData.message || 'Unknown'}\n\nPlease process manually.`;

          for (const chat of adminChats || []) {
            await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chat.chat_id, text: failMsg, parse_mode: 'Markdown' }),
            });
          }
        } catch (tgErr) {
          console.error('Telegram alert failed:', tgErr);
        }
      }

      throw new Error(transferData.message || 'Transfer initiation failed');
    }

    // Update escrow with transfer status
    await supabase
      .from('escrow_transactions')
      .update({
        platform_fee: paystackFeeNaira,
        atara_fee: paystackFeeNaira,
        status: 'completed',
        transfer_status: transferData.data?.status === 'success' ? 'success' : 'pending',
        transfer_reference: transferRef,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', escrow_id);

    // Log the payout
    await supabase.from('audit_logs').insert({
      escrow_id,
      actor_id: escrow.buyer_id,
      action: 'payout_initiated',
      before_state: { status: escrow.status },
      after_state: {
        status: 'completed',
        payout_amount: payoutAmountKobo / 100,
        paystack_fee: paystackFeeNaira,
        transfer_reference: transferRef,
      },
      reason: 'Auto payout triggered after payment confirmation',
    });

    // Notify admin via Telegram on success
    const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (telegramToken) {
      try {
        const { data: adminChats } = await supabase
          .from('telegram_admin_chats')
          .select('chat_id')
          .eq('is_active', true);

        const successMsg = `✅ *PAYOUT SUCCESSFUL*\n\nEscrow: \`${escrow_id.substring(0, 8)}\`\nSeller: ${seller.full_name}\nBank: ${seller.bank_name} - ${seller.account_number}\nPayout: ₦${(payoutAmountKobo / 100).toLocaleString()}\nPaystack Fee: ₦${paystackFeeNaira.toLocaleString()}\nRef: \`${transferRef}\``;

        for (const chat of adminChats || []) {
          await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chat.chat_id, text: successMsg, parse_mode: 'Markdown' }),
          });
        }
      } catch (tgErr) {
        console.error('Telegram success alert failed:', tgErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transfer_reference: transferRef,
        payout_amount: payoutAmountKobo / 100,
        paystack_fee: paystackFeeNaira,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Payout error:', msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
