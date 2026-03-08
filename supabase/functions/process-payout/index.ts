import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Paystack fee: 1.5% capped at ₦2,500
function calculatePaystackFee(amountNaira: number): number {
  return Math.min(Math.round(amountNaira * 0.015), 2500);
}

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

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) throw new Error('Paystack secret key not configured');

    const { escrow_id } = await req.json();
    if (!escrow_id) throw new Error('escrow_id is required');

    // Fetch escrow
    const { data: escrow, error: escrowErr } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('id', escrow_id)
      .single();

    if (escrowErr || !escrow) throw new Error('Escrow not found');

    // Only process if in a payable state
    if (!['funded', 'completed', 'inspection_period'].includes(escrow.status)) {
      throw new Error(`Escrow is not in a payable state: ${escrow.status}`);
    }

    // Skip if already transferred
    if (escrow.transfer_status === 'success' || escrow.transfer_status === 'pending') {
      console.log('Transfer already processed, skipping');
      return new Response(
        JSON.stringify({ success: true, message: 'Transfer already processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get seller's recipient code
    const { data: seller } = await supabase
      .from('profiles')
      .select('paystack_subaccount_code, full_name, bank_name, account_number, account_name')
      .eq('id', escrow.seller_id)
      .single();

    if (!seller?.paystack_subaccount_code) {
      const errMsg = 'Seller has no verified bank account / recipient code';
      await notifyAdminsTelegram(supabase,
        `🚨 *PAYOUT BLOCKED*\n\nEscrow: \`${escrow_id.substring(0, 8)}\`\nReason: ${errMsg}\n\nSeller needs to add bank details.`
      );
      throw new Error(errMsg);
    }

    // Calculate amounts
    const transactionAmountNaira = escrow.offer_amount || escrow.transaction_amount;
    const paystackFeeNaira = calculatePaystackFee(transactionAmountNaira);
    const payoutAmountKobo = Math.round((transactionAmountNaira - paystackFeeNaira) * 100);

    if (payoutAmountKobo <= 0) {
      throw new Error('Payout amount is zero or negative after fees');
    }

    console.log(`Processing payout: Amount ₦${transactionAmountNaira}, Paystack fee ₦${paystackFeeNaira}, Payout ₦${payoutAmountKobo / 100}`);

    // Initiate Paystack Transfer
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
        reason: `Property payment for escrow ${escrow_id.substring(0, 8)}`,
        reference: transferRef,
        currency: 'NGN',
      }),
    });

    const transferData = await transferRes.json();
    console.log('Transfer API response:', JSON.stringify(transferData));

    if (!transferData.status) {
      // Transfer failed — save status and alert admin
      await supabase
        .from('escrow_transactions')
        .update({
          transfer_status: 'failed',
          transfer_reference: transferRef,
          updated_at: new Date().toISOString(),
        })
        .eq('id', escrow_id);

      await notifyAdminsTelegram(supabase,
        `🚨 *PAYOUT FAILED*\n\nEscrow: \`${escrow_id.substring(0, 8)}\`\nSeller: ${seller.full_name}\nBank: ${seller.bank_name} - ${seller.account_number}\nAmount: ₦${(payoutAmountKobo / 100).toLocaleString()}\nError: ${transferData.message || 'Unknown'}\nRef: \`${transferRef}\`\n\nPlease process manually.`
      );

      throw new Error(transferData.message || 'Transfer initiation failed');
    }

    // Transfer initiated — update escrow
    const transferStatus = transferData.data?.status === 'success' ? 'success' : 'pending';

    await supabase
      .from('escrow_transactions')
      .update({
        platform_fee: paystackFeeNaira,
        atara_fee: paystackFeeNaira,
        status: 'completed',
        transfer_status: transferStatus,
        transfer_reference: transferRef,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', escrow_id);

    // Audit log
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
        transfer_status: transferStatus,
      },
      reason: 'Auto payout after payment confirmation',
    });

    // Notify admin on success
    await notifyAdminsTelegram(supabase,
      `✅ *PAYOUT ${transferStatus === 'success' ? 'SUCCESSFUL' : 'PENDING'}*\n\nEscrow: \`${escrow_id.substring(0, 8)}\`\nSeller: ${seller.full_name}\nBank: ${seller.bank_name} - ${seller.account_number}\nPayout: ₦${(payoutAmountKobo / 100).toLocaleString()}\nPaystack Fee: ₦${paystackFeeNaira.toLocaleString()}\nRef: \`${transferRef}\``
    );

    return new Response(
      JSON.stringify({
        success: true,
        transfer_reference: transferRef,
        transfer_status: transferStatus,
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
