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

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    // Get user email from profiles
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
    const matchCount = profileWords.filter(w => resolvedWords.includes(w)).length;
    if (matchCount < 1) {
      throw new Error(
        `Account name "${account_name}" does not match your profile name "${profile.full_name}". Please update your profile name or use a matching bank account.`
      );
    }

    // Create Paystack subaccount
    const subaccountRes = await fetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business_name: account_name,
        bank_code,
        account_number,
        percentage_charge: 0, // We handle splits manually
        primary_contact_email: profile.email,
      }),
    });

    const subaccountData = await subaccountRes.json();

    if (!subaccountData.status) {
      throw new Error(subaccountData.message || 'Failed to create subaccount');
    }

    const subaccountCode = subaccountData.data.subaccount_code;

    // Save bank details to profiles but do NOT mark as verified yet
    // bank_verified will be set to true only after successful payment
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        bank_name,
        account_number,
        account_name,
        paystack_subaccount_code: subaccountCode,
        bank_verified: false,
      })
      .eq('id', user_id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw new Error('Failed to save bank details');
    }

    // Initialize ₦100 verification payment
    const reference = `INIT-${user_id.substring(0, 8)}-${Date.now()}`;
    const paymentRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: profile.email,
        amount: 10000, // ₦100 in kobo
        reference,
        currency: 'NGN',
        callback_url: 'https://xavorian.xyz/dashboard/settings?bank_verified=pending',
        metadata: {
          type: 'account_initialization',
          user_id,
          subaccount_code: subaccountCode,
          auto_refund: true,
        },
      }),
    });

    const paymentData = await paymentRes.json();

    if (!paymentData.status) {
      throw new Error(paymentData.message || 'Failed to initialize verification payment');
    }

    return new Response(
      JSON.stringify({
        success: true,
        subaccount_code: subaccountCode,
        authorization_url: paymentData.data.authorization_url,
        reference,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating split account:', msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
