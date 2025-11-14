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
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { escrowId } = await req.json();

    console.log('Confirming escrow:', escrowId, 'by user:', user.id);

    // Get escrow details
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('id', escrowId)
      .single();

    if (escrowError || !escrow) {
      throw new Error('Escrow transaction not found');
    }

    // Check if user is the buyer
    if (escrow.buyer_id !== user.id) {
      throw new Error('Only the buyer can confirm the escrow');
    }

    // Check if escrow is in correct status
    if (escrow.status !== 'funded' && escrow.status !== 'inspection_period') {
      throw new Error('Escrow cannot be confirmed in current status');
    }

    // Use service role to update escrow
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update escrow to completed
    const { error: updateError } = await supabaseAdmin
      .from('escrow_transactions')
      .update({
        status: 'completed',
        buyer_confirmed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', escrowId);

    if (updateError) {
      throw new Error('Failed to confirm escrow');
    }

    console.log('Escrow confirmed and completed:', escrowId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Escrow confirmed successfully. Funds will be released to the seller.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error confirming escrow:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
