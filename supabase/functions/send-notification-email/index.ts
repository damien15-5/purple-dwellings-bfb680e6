import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, title, description, type } = await req.json();

    if (!user_id || !title || !description) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user_id)
      .single();

    if (!profile?.email) {
      console.log('No email found for user:', user_id);
      return new Response(JSON.stringify({ success: true, skipped: 'no_email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const notificationEmail = Deno.env.get('NOTIFICATION_EMAIL');
    const notificationPassword = Deno.env.get('NOTIFICATION_EMAIL_PASSWORD');

    if (!notificationEmail || !notificationPassword) {
      console.error('Email credentials not configured');
      return new Response(JSON.stringify({ error: 'Email not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const typeEmoji: Record<string, string> = {
      message: '💬',
      offer: '🤝',
      offer_response: '📩',
      offer_rejected: '❌',
      escrow: '🔐',
      property: '🏠',
      verification: '✅',
      saved: '❤️',
      transaction: '💰',
      login: '🔑',
      general: '📢',
    };

    const emoji = typeEmoji[type] || '📢';

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:24px;border-radius:16px 16px 0 0;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;">Xavorian</h1>
      <p style="color:#e9d5ff;margin:4px 0 0;font-size:14px;">Property Marketplace</p>
    </div>
    <div style="background:#f8f7ff;padding:32px 24px;border:1px solid #e9d5ff;border-top:none;">
      <p style="font-size:16px;color:#1f2937;margin:0 0 8px;">Hi ${profile.full_name || 'there'},</p>
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin:16px 0;">
        <h2 style="margin:0 0 8px;font-size:18px;color:#1f2937;">${emoji} ${title}</h2>
        <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">${description}</p>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://www.xavorian.xyz/dashboard" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Open Dashboard</a>
      </div>
    </div>
    <div style="text-align:center;padding:16px;border-radius:0 0 16px 16px;background:#f3f4f6;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Xavorian. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    // Send via Gmail SMTP
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.zoho.com",
        port: 465,
        tls: true,
        auth: {
          username: notificationEmail,
          password: notificationPassword,
        },
      },
    });

    await client.send({
      from: `Xavorian <${notificationEmail}>`,
      to: profile.email,
      subject: `${emoji} ${title} - Xavorian`,
      content: "auto",
      html: htmlBody,
    });

    await client.close();

    console.log(`Email sent to ${profile.email} for: ${title}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending notification email:', error);
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
