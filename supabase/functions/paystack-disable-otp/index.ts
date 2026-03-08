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
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) throw new Error('Paystack secret key not configured');

    const { action, otp } = await req.json();

    if (action === 'initiate') {
      // Step 1: Initiate OTP disable — Paystack sends OTP to business phone
      const res = await fetch('https://api.paystack.co/transfer/disable_otp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      console.log('Disable OTP initiate response:', JSON.stringify(data));

      return new Response(
        JSON.stringify({
          success: data.status,
          message: data.message || 'OTP sent to your business phone number',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'finalize') {
      if (!otp) throw new Error('OTP is required to finalize');

      // Step 2: Finalize OTP disable with the received OTP
      const res = await fetch('https://api.paystack.co/transfer/disable_otp_finalize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp }),
      });

      const data = await res.json();
      console.log('Disable OTP finalize response:', JSON.stringify(data));

      return new Response(
        JSON.stringify({
          success: data.status,
          message: data.message || 'Transfer OTP has been disabled',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also support re-enabling OTP
    if (action === 'enable') {
      const res = await fetch('https://api.paystack.co/transfer/enable_otp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      console.log('Enable OTP response:', JSON.stringify(data));

      return new Response(
        JSON.stringify({
          success: data.status,
          message: data.message || 'Transfer OTP has been re-enabled',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action. Use "initiate", "finalize", or "enable"');
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Paystack OTP control error:', msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
