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
      <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} Xavorian. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    // Use Gmail SMTP via raw TCP (Deno.connect with TLS)
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const conn = await Deno.connectTls({
      hostname: "smtp.gmail.com",
      port: 465,
    });

    const readResponse = async (): Promise<string> => {
      const buf = new Uint8Array(4096);
      const n = await conn.read(buf);
      if (n === null) return '';
      return decoder.decode(buf.subarray(0, n));
    };

    const sendCommand = async (cmd: string): Promise<string> => {
      await conn.write(encoder.encode(cmd + "\r\n"));
      return await readResponse();
    };

    // Read greeting
    await readResponse();

    // EHLO
    await sendCommand("EHLO localhost");

    // AUTH LOGIN
    await sendCommand("AUTH LOGIN");
    await sendCommand(btoa(notificationEmail));
    const authResult = await sendCommand(btoa(notificationPassword));

    if (!authResult.startsWith('235')) {
      conn.close();
      console.error('SMTP auth failed:', authResult);
      return new Response(JSON.stringify({ error: 'SMTP authentication failed', details: authResult }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // MAIL FROM
    await sendCommand(`MAIL FROM:<${notificationEmail}>`);

    // RCPT TO
    await sendCommand(`RCPT TO:<${profile.email}>`);

    // DATA
    await sendCommand("DATA");

    // Build email with MIME
    const boundary = "----=_Part_" + Date.now();
    const emailData = [
      `From: Xavorian <${notificationEmail}>`,
      `To: ${profile.email}`,
      `Subject: ${emoji} ${title} - Xavorian`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      ``,
      `${title}\n\n${description}\n\nVisit: https://www.xavorian.xyz/dashboard`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      htmlBody,
      ``,
      `--${boundary}--`,
    ].join("\r\n");

    const sendResult = await sendCommand(emailData + "\r\n.");

    // QUIT
    await sendCommand("QUIT");
    conn.close();

    if (sendResult.startsWith('250')) {
      console.log(`Email sent to ${profile.email} for: ${title}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.error('SMTP send failed:', sendResult);
      return new Response(JSON.stringify({ error: 'Send failed', details: sendResult }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error sending notification email:', error);
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
