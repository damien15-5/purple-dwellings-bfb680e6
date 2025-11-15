import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate transaction hash: txs_YYYYMMDDHHMMSS_UUID_CRC32
function generateTransactionHash(escrowId: string): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:]/g, '')
    .replace('T', 'T')
    .split('.')[0];
  
  // Simple CRC32-like checksum (simplified for demo)
  const crc = Math.abs(
    escrowId.split('').reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0)
  ).toString(16).padStart(8, '0');
  
  return `txs_${timestamp}_${escrowId.substring(0, 8)}_${crc}`;
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

    const { escrowId } = await req.json();

    console.log('Initializing payment for escrow:', escrowId);

    // Get escrow details
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_transactions')
      .select('*, properties(title, price)')
      .eq('id', escrowId)
      .single();

    if (escrowError || !escrow) {
      throw new Error('Escrow transaction not found');
    }

    // Check if already initialized and has tx_hash
    if (escrow.paystack_access_code && escrow.tx_hash) {
      console.log('Payment already initialized, returning existing details');
      return new Response(
        JSON.stringify({
          success: true,
          authorization_url: `https://checkout.paystack.com/${escrow.paystack_access_code}`,
          access_code: escrow.paystack_access_code,
          reference: escrow.paystack_reference,
          tx_hash: escrow.tx_hash,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate transaction hash
    const txHash = generateTransactionHash(escrowId);
    console.log('Generated transaction hash:', txHash);

    // Log transaction creation
    await supabase.from('transactions').insert({
      tx_hash: txHash,
      event_type: 'payment_created',
      payload: {
        escrow_id: escrowId,
        amount: escrow.total_amount,
        status: 'created',
        timestamp: new Date().toISOString(),
      },
    });

    // Log audit entry
    await supabase.from('audit_logs').insert({
      escrow_id: escrowId,
      actor_id: escrow.buyer_id,
      action: 'payment_initiated',
      before_state: { status: escrow.status },
      after_state: { status: 'pending_payment', tx_hash: txHash },
      reason: 'Payment initialization started',
    });

    // Get buyer email
    const { data: buyer } = await supabase
      .from('profiles')
      .select('email, full_name')
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
        callback_url: `${req.headers.get('origin')}/payment-confirmation?escrow=${escrowId}&tx_hash=${txHash}`,
        metadata: {
          tx_hash: txHash,
          escrow_id: escrowId,
          property_id: escrow.property_id,
          buyer_id: escrow.buyer_id,
          buyer_name: buyer?.full_name || '',
          seller_id: escrow.seller_id,
          transaction_amount: escrow.transaction_amount,
          escrow_fee: escrow.escrow_fee,
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      throw new Error(paystackData.message || 'Failed to initialize payment');
    }

    // Update escrow with Paystack details and tx_hash
    const { error: updateError } = await supabase
      .from('escrow_transactions')
      .update({
        tx_hash: txHash,
        paystack_reference: reference,
        paystack_access_code: paystackData.data.access_code,
        updated_at: new Date().toISOString(),
      })
      .eq('id', escrowId);

    if (updateError) {
      console.error('Error updating escrow:', updateError);
    }

    console.log('Payment initialized successfully:', { reference, txHash });

    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference,
        tx_hash: txHash,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
