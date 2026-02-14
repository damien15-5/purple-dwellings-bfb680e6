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

    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Unauthorized');

    const { promotionIds, totalAmount } = await req.json();

    if (!promotionIds?.length || !totalAmount) {
      throw new Error('Missing promotion data');
    }

    // Verify promotions belong to user
    const { data: promotions, error: promoError } = await supabase
      .from('property_promotions')
      .select('id, amount_paid')
      .in('id', promotionIds)
      .eq('user_id', user.id);

    if (promoError || !promotions?.length) {
      throw new Error('Promotions not found');
    }

    // Verify total
    const calculatedTotal = promotions.reduce((sum, p) => sum + Number(p.amount_paid), 0);
    if (Math.abs(calculatedTotal - totalAmount) > 1) {
      throw new Error('Amount mismatch');
    }

    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    const reference = `PROMO-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: profile?.email || user.email || '',
        amount: Math.round(totalAmount * 100),
        reference,
        currency: 'NGN',
        callback_url: `${req.headers.get('origin')}/payment-confirmation?promotion=true&ref=${reference}`,
        metadata: {
          type: 'promotion',
          promotion_ids: promotionIds,
          user_id: user.id,
          total_amount: totalAmount,
        },
      }),
    });

    const paystackData = await paystackResponse.json();
    if (!paystackData.status) {
      throw new Error(paystackData.message || 'Paystack initialization failed');
    }

    // Update promotions with reference
    await supabase
      .from('property_promotions')
      .update({ paystack_reference: reference })
      .in('id', promotionIds);

    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: paystackData.data.authorization_url,
        reference,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
