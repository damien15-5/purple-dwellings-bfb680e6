import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Get user's email from profiles
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

    // Type-based emoji mapping
    const typeEmoji: Record<string, string> = {
      message: '💬',
      offer: '🤝',
      offer_response: '📩',
      escrow: '🔐',
      property: '🏠',
      verification: '✅',
      saved: '❤️',
      transaction: '💰',
      login: '🔑',
      general: '📢',
    };

    const emoji = typeEmoji[type] || '📢';

    // Build HTML email
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family:Arial, sans-serif;">
  <div style="max-width:600px; margin:0 auto; padding:20px;">
    <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding:24px; border-radius:16px 16px 0 0; text-align:center;">
      <h1 style="color:#ffffff; margin:0; font-size:24px;">Xavorian</h1>
      <p style="color:#e9d5ff; margin:4px 0 0; font-size:14px;">Property Marketplace</p>
    </div>
    <div style="background:#f8f7ff; padding:32px 24px; border:1px solid #e9d5ff; border-top:none;">
      <p style="font-size:16px; color:#1f2937; margin:0 0 8px;">Hi ${profile.full_name || 'there'},</p>
      <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:20px; margin:16px 0;">
        <h2 style="margin:0 0 8px; font-size:18px; color:#1f2937;">${emoji} ${title}</h2>
        <p style="margin:0; font-size:14px; color:#6b7280; line-height:1.5;">${description}</p>
      </div>
      <div style="text-align:center; margin:24px 0;">
        <a href="https://www.xavorian.xyz/dashboard" style="display:inline-block; background:linear-gradient(135deg, #7c3aed, #a855f7); color:#ffffff; padding:12px 32px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">Open Dashboard</a>
      </div>
    </div>
    <div style="text-align:center; padding:16px; border-radius:0 0 16px 16px; background:#f3f4f6;">
      <p style="margin:0; font-size:12px; color:#9ca3af;">© ${new Date().getFullYear()} Xavorian. All rights reserved.</p>
      <p style="margin:4px 0 0; font-size:11px; color:#9ca3af;">You received this because you have an account on Xavorian.</p>
    </div>
  </div>
</body>
</html>`;

    // Send email using Gmail SMTP via base64 encoded credentials
    const emailPayload = [
      `From: Xavorian <${notificationEmail}>`,
      `To: ${profile.full_name} <${profile.email}>`,
      `Subject: ${emoji} ${title} - Xavorian`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      htmlBody,
    ].join('\r\n');

    // Use Gmail SMTP via fetch to Google's API
    // Using OAuth2-less approach with App Password via SMTP
    const smtpAuth = btoa(`\x00${notificationEmail}\x00${notificationPassword}`);
    
    // Alternative: Use Gmail's API via service account or use a simpler HTTP-based approach
    // For now, use a direct SMTP connection via Deno
    const conn = await Deno.connect({ hostname: 'smtp.gmail.com', port: 465 });
    
    // Use TLS
    const tlsConn = await Deno.startTls(conn, { hostname: 'smtp.gmail.com' });
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readResponse = async () => {
      const buf = new Uint8Array(4096);
      const n = await tlsConn.read(buf);
      return n ? decoder.decode(buf.subarray(0, n)) : '';
    };

    const sendCommand = async (cmd: string) => {
      await tlsConn.write(encoder.encode(cmd + '\r\n'));
      return await readResponse();
    };

    // SMTP handshake
    await readResponse(); // greeting
    await sendCommand('EHLO xavorian.xyz');
    await sendCommand(`AUTH LOGIN`);
    await sendCommand(btoa(notificationEmail));
    await sendCommand(btoa(notificationPassword));
    await sendCommand(`MAIL FROM:<${notificationEmail}>`);
    await sendCommand(`RCPT TO:<${profile.email}>`);
    await sendCommand('DATA');
    await sendCommand(emailPayload + '\r\n.');
    await sendCommand('QUIT');

    tlsConn.close();

    console.log(`Email sent to ${profile.email} for notification: ${title}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending notification email:', error);
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 200, // Don't fail the notification flow
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});