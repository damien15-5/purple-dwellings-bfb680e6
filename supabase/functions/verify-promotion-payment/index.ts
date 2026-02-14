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

    const { reference } = await req.json();
    if (!reference) throw new Error('Missing reference');

    // Verify with Paystack
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { 'Authorization': `Bearer ${paystackSecretKey}` },
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== 'success') {
      throw new Error('Payment verification failed');
    }

    // Activate all promotions with this reference
    const { data: promotions } = await supabase
      .from('property_promotions')
      .select('id, days_promoted')
      .eq('paystack_reference', reference);

    if (promotions && promotions.length > 0) {
      const now = new Date();
      for (const promo of promotions) {
        const expiresAt = new Date(now.getTime() + promo.days_promoted * 24 * 60 * 60 * 1000);
        await supabase
          .from('property_promotions')
          .update({
            is_active: true,
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          })
          .eq('id', promo.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Promotions activated' }),
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
