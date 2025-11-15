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

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';

    const { escrowId, reference, tx_hash } = await req.json();

    if (!reference && !tx_hash && !escrowId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing reference or tx_hash or escrowId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Locate escrow by tx_hash, reference, or id
    let { data: escrow } = await supabase
      .from('escrow_transactions')
      .select('*')
      .or([
        tx_hash ? `tx_hash.eq.${tx_hash}` : '',
        reference ? `paystack_reference.eq.${reference}` : '',
        escrowId ? `id.eq.${escrowId}` : '',
      ].filter(Boolean).join(','))
      .single();

    if (!escrow) {
      return new Response(
        JSON.stringify({ success: false, error: 'Escrow not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Idempotency: if already funded, succeed
    if (escrow.status === 'funded' && escrow.payment_verified_at) {
      return new Response(
        JSON.stringify({ success: true, message: 'Already verified', escrow_id: escrow.id, tx_hash: escrow.tx_hash, reference: escrow.paystack_reference }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no reference on escrow, try to find a payment record by tx_hash then use its reference
    let ref = reference || escrow.paystack_reference;

    if (!ref) {
      const { data: pr } = await supabase
        .from('payment_records')
        .select('paystack_reference')
        .eq('tx_hash', escrow.tx_hash || tx_hash)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (pr?.paystack_reference) ref = pr.paystack_reference;
    }

    if (!ref) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing paystack reference to verify' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify payment with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${ref}` , {
      headers: { Authorization: `Bearer ${paystackSecretKey}` },
    });
    const verifyData = await verifyResponse.json();

    // Log transaction verify attempt
    await supabase.from('transactions').insert({
      tx_hash: escrow.tx_hash || tx_hash || 'unknown',
      event_type: 'manual_verify_attempt',
      payload: { reference: ref, response: verifyData },
    });

    if (!verifyData.status || verifyData.data?.status !== 'success') {
      // Mark failed if currently pending
      await supabase.from('audit_logs').insert({
        escrow_id: escrow.id,
        actor_id: escrow.buyer_id,
        action: 'payment_verification_failed',
        before_state: { status: escrow.status },
        after_state: { status: 'pending_payment' },
        reason: 'Manual verify returned non-success',
      });

      return new Response(
        JSON.stringify({ success: false, error: 'Verification failed', details: verifyData }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const channel = verifyData.data?.channel;
    const amount = verifyData.data?.amount || 0;
    const paid_at = verifyData.data?.paid_at || new Date().toISOString();

    // Create payment record
    await supabase.from('payment_records').insert({
      escrow_id: escrow.id,
      tx_hash: escrow.tx_hash || tx_hash,
      paystack_reference: ref,
      amount: amount / 100,
      status: 'success',
      payment_method: channel,
      paid_at: new Date(paid_at).toISOString(),
      webhook_data: verifyData.data,
    });

    // Update escrow to funded + inspection window 21 days
    const inspectionStartDate = new Date();
    const inspectionEndDate = new Date();
    inspectionEndDate.setDate(inspectionEndDate.getDate() + 21);

    await supabase
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

    await supabase.from('transactions').insert({
      tx_hash: escrow.tx_hash || tx_hash,
      event_type: 'payment_verified',
      payload: { reference: ref, amount: amount / 100, channel },
    });

    await supabase.from('audit_logs').insert({
      escrow_id: escrow.id,
      actor_id: escrow.buyer_id,
      action: 'payment_confirmed',
      before_state: { status: 'pending_payment' },
      after_state: { status: 'funded', inspection_start: inspectionStartDate.toISOString(), inspection_end: inspectionEndDate.toISOString() },
      reason: 'Manual verification via verify-payment',
    });

    return new Response(
      JSON.stringify({ success: true, escrow_id: escrow.id, tx_hash: escrow.tx_hash, reference: ref }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Verify payment error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
