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
      .select('id, days_promoted, property_id')
      .eq('paystack_reference', reference);

    if (promotions && promotions.length > 0) {
      const now = new Date();
      for (const promo of promotions) {
        // Check if there's an existing active promotion for this property
        const { data: existing } = await supabase
          .from('property_promotions')
          .select('id, expires_at, days_promoted, amount_paid')
          .eq('property_id', promo.property_id)
          .eq('is_active', true)
          .gt('expires_at', now.toISOString())
          .neq('id', promo.id)
          .order('expires_at', { ascending: false })
          .limit(1);

        if (existing && existing.length > 0) {
          // Stack: extend the existing promotion
          const existingPromo = existing[0];
          const currentExpiry = new Date(existingPromo.expires_at);
          const newExpiry = new Date(currentExpiry.getTime() + promo.days_promoted * 24 * 60 * 60 * 1000);
          
          await supabase
            .from('property_promotions')
            .update({
              days_promoted: existingPromo.days_promoted + promo.days_promoted,
              amount_paid: Number(existingPromo.amount_paid) + Number(promo.days_promoted) * 1000,
              expires_at: newExpiry.toISOString(),
            })
            .eq('id', existingPromo.id);

          // Delete the new duplicate record since we merged it
          await supabase
            .from('property_promotions')
            .delete()
            .eq('id', promo.id);
        } else {
          // No existing active promotion, activate this one
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
    }

    // Notify admin via Telegram
    try {
      for (const promo of promotions || []) {
        const { data: prop } = await supabase.from('properties').select('title, user_id').eq('id', promo.property_id).single();
        if (prop) {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/telegram-notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
            body: JSON.stringify({
              type: 'promotion_purchased',
              data: { propertyTitle: prop.title, amount: promo.days_promoted * 1000, days: promo.days_promoted, userId: prop.user_id },
            }),
          });
        }
      }
    } catch (e) { console.error('Telegram notify error:', e); }

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
