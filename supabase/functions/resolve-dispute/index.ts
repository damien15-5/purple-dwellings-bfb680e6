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

    // Check if user is admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      throw new Error('Only admins can resolve disputes');
    }

    const { disputeId, resolution, adminNotes } = await req.json();

    console.log('Resolving dispute:', disputeId, 'by admin:', user.id);

    // Get dispute details
    const { data: dispute, error: disputeError } = await supabase
      .from('escrow_disputes')
      .select('*, escrow_transactions(*)')
      .eq('id', disputeId)
      .single();

    if (disputeError || !dispute) {
      throw new Error('Dispute not found');
    }

    // Use service role for updates
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update dispute
    const { error: updateDisputeError } = await supabaseAdmin
      .from('escrow_disputes')
      .update({
        status: resolution,
        resolution_action: resolution,
        admin_notes: adminNotes,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', disputeId);

    if (updateDisputeError) {
      throw new Error('Failed to update dispute');
    }

    // Update escrow based on resolution
    let newEscrowStatus = 'disputed';
    if (resolution === 'resolved_buyer') {
      newEscrowStatus = 'refunded';
    } else if (resolution === 'resolved_seller') {
      newEscrowStatus = 'completed';
    }

    const { error: updateEscrowError } = await supabaseAdmin
      .from('escrow_transactions')
      .update({
        status: newEscrowStatus,
        completed_at: newEscrowStatus === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dispute.escrow_id);

    if (updateEscrowError) {
      console.error('Error updating escrow:', updateEscrowError);
    }

    console.log('Dispute resolved:', disputeId, 'Resolution:', resolution);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Dispute resolved successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
