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

    const { escrowId, reason, description } = await req.json();

    console.log('Raising dispute for escrow:', escrowId, 'by user:', user.id);

    // Get escrow details
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('id', escrowId)
      .single();

    if (escrowError || !escrow) {
      throw new Error('Escrow transaction not found');
    }

    // Check if user is buyer or seller
    if (escrow.buyer_id !== user.id && escrow.seller_id !== user.id) {
      throw new Error('You are not part of this escrow transaction');
    }

    // Check if escrow can be disputed
    if (!['funded', 'inspection_period'].includes(escrow.status)) {
      throw new Error('Escrow cannot be disputed in current status');
    }

    // Create dispute
    const { data: dispute, error: disputeError } = await supabase
      .from('escrow_disputes')
      .insert({
        escrow_id: escrowId,
        raised_by: user.id,
        reason,
        description,
        status: 'pending',
      })
      .select()
      .single();

    if (disputeError) {
      throw new Error('Failed to create dispute');
    }

    // Update escrow status to disputed
    const { error: updateError } = await supabase
      .from('escrow_transactions')
      .update({
        status: 'disputed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', escrowId);

    if (updateError) {
      console.error('Error updating escrow status:', updateError);
    }

    console.log('Dispute created:', dispute.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Dispute raised successfully. An admin will review your case.',
        disputeId: dispute.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error raising dispute:', error);
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
