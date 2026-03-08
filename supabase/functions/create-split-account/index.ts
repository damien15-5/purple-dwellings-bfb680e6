import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    const { user_id, bank_code, account_number, account_name, bank_name } = await req.json();

    if (!user_id || !bank_code || !account_number || !account_name) {
      throw new Error('Missing required fields');
    }

    // Get user profile for name match
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user_id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Check name match (relaxed - at least 1 word must match)
    const profileWords = profile.full_name.trim().toLowerCase().split(/\s+/);
    const resolvedWords = account_name.trim().toLowerCase().split(/\s+/);
    const matchCount = profileWords.filter((w: string) => resolvedWords.includes(w)).length;
    if (matchCount < 1) {
      throw new Error(
        `Account name "${account_name}" does not match your profile name "${profile.full_name}". Please update your profile name or use a matching bank account.`
      );
    }

    // Save bank details to profile and mark as verified
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        bank_name,
        account_number,
        account_name,
        bank_verified: true,
      })
      .eq('id', user_id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw new Error('Failed to save bank details');
    }

    console.log('Bank account saved and verified for user:', user_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Bank account verified and saved successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving bank account:', msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
