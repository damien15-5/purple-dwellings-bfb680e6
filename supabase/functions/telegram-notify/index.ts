import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendTelegram(chatId: number, text: string, replyMarkup?: any) {
  const body: any = { chat_id: chatId, text, parse_mode: 'HTML' };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.ok;
}

async function sendPhoto(chatId: number, photoUrl: string, caption?: string) {
  const body: any = { chat_id: chatId, photo: photoUrl, parse_mode: 'HTML' };
  if (caption) body.caption = caption;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function getSignedUrl(bucket: string, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

async function getAdminChatIds(): Promise<number[]> {
  const { data } = await supabase.from('telegram_admin_chats').select('chat_id').eq('is_active', true);
  return (data || []).map((d: any) => d.chat_id);
}

async function getUserChatId(userId: string): Promise<number | null> {
  const { data } = await supabase.from('telegram_user_links').select('chat_id').eq('user_id', userId).eq('is_verified', true).single();
  return data?.chat_id || null;
}

async function notifyAdmins(message: string, replyMarkup?: any) {
  const chatIds = await getAdminChatIds();
  for (const chatId of chatIds) {
    await sendTelegram(chatId, message, replyMarkup);
    await supabase.from('telegram_notifications').insert({
      chat_id: chatId,
      message_type: 'admin_notification',
      message_text: message,
    });
  }
}

async function notifyAdminsWithPhotos(photos: { url: string; caption: string }[], message: string, replyMarkup?: any) {
  const chatIds = await getAdminChatIds();
  for (const chatId of chatIds) {
    for (const photo of photos) {
      await sendPhoto(chatId, photo.url, photo.caption);
    }
    await sendTelegram(chatId, message, replyMarkup);
    await supabase.from('telegram_notifications').insert({
      chat_id: chatId,
      message_type: 'admin_notification',
      message_text: message,
    });
  }
}

async function notifyUser(userId: string, message: string) {
  const chatId = await getUserChatId(userId);
  if (chatId) {
    await sendTelegram(chatId, message);
    await supabase.from('telegram_notifications').insert({
      chat_id: chatId,
      message_type: 'user_notification',
      message_text: message,
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();

    switch (type) {
      case 'kyc_submitted': {
        const { userId, fullName, identityType, documentImagePath, selfiePath } = data;
        const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).single();
        
        const photos: { url: string; caption: string }[] = [];

        // Get signed URLs for KYC images
        if (documentImagePath) {
          const signedUrl = await getSignedUrl('kyc-documents', documentImagePath);
          if (signedUrl) photos.push({ url: signedUrl, caption: `📄 <b>ID Document</b> - ${fullName || 'User'}` });
        }
        if (selfiePath) {
          const signedUrl = await getSignedUrl('kyc-documents', selfiePath);
          if (signedUrl) photos.push({ url: signedUrl, caption: `🤳 <b>Selfie</b> - ${fullName || 'User'}` });
        }

        let msg = `🔐 <b>New KYC Submission</b>\n\n`;
        msg += `👤 Name: <b>${fullName || 'N/A'}</b>\n`;
        msg += `📧 Email: ${profile?.email || 'N/A'}\n`;
        msg += `🪪 ID Type: ${identityType || 'N/A'}\n`;
        msg += `📅 Time: ${new Date().toLocaleString()}`;

        if (photos.length > 0) {
          await notifyAdminsWithPhotos(photos, msg, {
            inline_keyboard: [[
              { text: '💬 Message User', callback_data: `msg_user_${userId}` },
            ]],
          });
        } else {
          await notifyAdmins(msg);
        }
        break;
      }

      case 'ticket_created': {
        const { ticketNumber, subject, userEmail, description, priority, userId } = data;
        const { data: userLink } = await supabase.from('telegram_user_links').select('username').eq('user_id', userId).single();
        
        let msg = `🎫 <b>New Support Ticket</b>\n\n`;
        msg += `🔢 Ticket: <b>${ticketNumber}</b>\n`;
        msg += `📌 Subject: ${subject}\n`;
        msg += `📧 Email: ${userEmail}\n`;
        msg += `⚡ Priority: ${priority || 'medium'}\n`;
        if (userLink?.username) msg += `📱 Telegram: @${userLink.username}\n`;
        msg += `\n📝 ${(description || '').substring(0, 300)}`;

        await notifyAdmins(msg, {
          inline_keyboard: [[
            { text: '💬 Message User', callback_data: `msg_user_${userId}` },
          ]],
        });
        break;
      }

      case 'new_listing': {
        const { propertyId, title, price, propertyType, state, city, userId, images } = data;
        const { data: owner } = await supabase.from('profiles').select('full_name, email').eq('id', userId).single();
        
        const photos: { url: string; caption: string }[] = [];
        
        // Send first few property images
        if (images && images.length > 0) {
          for (const img of images.slice(0, 3)) {
            const imgUrl = img.startsWith('http') ? img : supabase.storage.from('property-images').getPublicUrl(img).data.publicUrl;
            photos.push({ url: imgUrl, caption: `🏠 ${title}` });
          }
        }

        let msg = `🏠 <b>New Property Listed</b>\n\n`;
        msg += `📌 ${title}\n`;
        msg += `💰 ₦${Number(price).toLocaleString()}\n`;
        msg += `🏷 Type: ${propertyType}\n`;
        msg += `📍 ${city || ''}, ${state || ''}\n`;
        msg += `👤 By: ${owner?.full_name || 'N/A'} (${owner?.email || 'N/A'})`;

        if (photos.length > 0) {
          await notifyAdminsWithPhotos(photos, msg, {
            inline_keyboard: [[
              { text: '💬 Message Seller', callback_data: `msg_user_${userId}` },
            ]],
          });
        } else {
          await notifyAdmins(msg);
        }
        break;
      }

      case 'promotion_purchased': {
        const { propertyTitle, amount, days, userId } = data;
        const { data: owner } = await supabase.from('profiles').select('full_name, email').eq('id', userId).single();
        
        let msg = `⭐ <b>Property Promoted</b>\n\n`;
        msg += `🏠 ${propertyTitle}\n`;
        msg += `💰 ₦${Number(amount).toLocaleString()} for ${days} days\n`;
        msg += `👤 By: ${owner?.full_name || 'N/A'} (${owner?.email || 'N/A'})`;

        await notifyAdmins(msg);
        break;
      }

      case 'new_user': {
        const { fullName, email, accountType } = data;
        await notifyAdmins(`👤 <b>New User Signup</b>\n\n📛 ${fullName}\n📧 ${email}\n🏷 Type: ${accountType || 'buyer'}`);
        break;
      }

      case 'user_notification': {
        const { userId, message } = data;
        await notifyUser(userId, message);
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown type' }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Notify error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
