import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// The ONE admin chat ID - only the first admin to register is accepted
const MAX_ADMINS = 1;

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

async function sendPhoto(chatId: number, photoUrl: string, caption?: string, replyMarkup?: any) {
  const body: any = { chat_id: chatId, photo: photoUrl, parse_mode: 'HTML' };
  if (caption) body.caption = caption;
  if (replyMarkup) body.reply_markup = replyMarkup;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function getSignedUrl(bucket: string, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) { console.error('Signed URL error:', error); return null; }
  return data.signedUrl;
}

async function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// State for admin messaging - stored as a simple map in memory per request
// We use a DB approach: store pending reply target in telegram_admin_chats
async function setAdminReplyTarget(chatId: number, targetUserId: string) {
  await supabase.from('telegram_admin_chats').update({ reply_target_user_id: targetUserId } as any).eq('chat_id', chatId);
}

async function getAdminReplyTarget(chatId: number): Promise<string | null> {
  const { data } = await supabase.from('telegram_admin_chats').select('*').eq('chat_id', chatId).single();
  return (data as any)?.reply_target_user_id || null;
}

async function clearAdminReplyTarget(chatId: number) {
  await supabase.from('telegram_admin_chats').update({ reply_target_user_id: null } as any).eq('chat_id', chatId);
}

async function handleAdminSetup(chatId: number, username: string) {
  // Check if max admins already registered
  const { count } = await supabase.from('telegram_admin_chats').select('*', { count: 'exact', head: true }).eq('is_active', true);
  
  if ((count || 0) >= MAX_ADMINS) {
    // Check if THIS chat is already the admin
    const { data: existing } = await supabase.from('telegram_admin_chats').select('id').eq('chat_id', chatId).eq('is_active', true).single();
    if (!existing) {
      await sendTelegram(chatId, '❌ <b>Access Denied</b>\n\nAdmin registration is locked. Only the platform owner can be registered as admin.');
      return;
    }
  }

  const { error } = await supabase.from('telegram_admin_chats').upsert(
    { chat_id: chatId, username, admin_id: '00000000-0000-0000-0000-000000000000', is_active: true },
    { onConflict: 'chat_id' }
  );
  if (error) {
    await sendTelegram(chatId, '❌ Failed to register. Try again.');
    return;
  }
  await sendTelegram(chatId, 
    '✅ <b>Admin registered!</b>\n\nYou will now receive notifications for:\n• 🔐 KYC submissions\n• 🏠 New listings\n• 🎫 Support tickets\n• ⭐ Property promotions\n• 👤 New user signups\n\nUse the menu below to manage the platform.\n\nTo message a user, use: /msg user_email message',
    {
      keyboard: [
        [{ text: '📊 Dashboard Stats' }, { text: '🔐 Pending KYC' }],
        [{ text: '🎫 Open Tickets' }, { text: '🏠 Recent Listings' }],
        [{ text: '👤 Total Users' }, { text: '⭐ Active Promotions' }],
      ],
      resize_keyboard: true,
      persistent: true,
    }
  );
}

async function handleUserLink(chatId: number, username: string, text: string) {
  const email = text.trim().toLowerCase();
  const { data: profile } = await supabase.from('profiles').select('id, full_name, email').eq('email', email).single();
  if (!profile) {
    await sendTelegram(chatId, '❌ No account found with that email. Please check and try again.');
    return;
  }
  const { error } = await supabase.from('telegram_user_links').upsert(
    { user_id: profile.id, chat_id: chatId, username, is_verified: true },
    { onConflict: 'user_id' }
  );
  if (error) {
    await sendTelegram(chatId, '❌ This Telegram account is already linked to another user.');
    return;
  }
  await supabase.from('profiles').update({ telegram_username: username || `tg_${chatId}` }).eq('id', profile.id);
  await sendTelegram(chatId, 
    `✅ <b>Connected!</b>\n\nHello ${profile.full_name}! Your Telegram is now linked to your Xavorian account.\n\nYou'll receive notifications about:\n• Offers on your properties\n• Messages from buyers/sellers\n• KYC verification updates\n• Transaction updates\n• Promotion expiry alerts\n• Daily view summaries`,
    {
      keyboard: [
        [{ text: '🏠 My Listings' }, { text: '📊 My Stats' }],
        [{ text: '⭐ My Promotions' }, { text: '💬 Support' }],
      ],
      resize_keyboard: true,
      persistent: true,
    }
  );
}

async function handleUserListings(chatId: number) {
  const { data: link } = await supabase.from('telegram_user_links').select('user_id').eq('chat_id', chatId).eq('is_verified', true).single();
  if (!link) { await sendTelegram(chatId, '❌ Account not linked.'); return; }

  const { data: listings } = await supabase
    .from('properties')
    .select('id, title, price, views, clicks, status, city, state, images')
    .eq('user_id', link.user_id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!listings || listings.length === 0) {
    await sendTelegram(chatId, '📭 You have no listings yet.');
    return;
  }

  let msg = `🏠 <b>Your Listings (${listings.length})</b>\n\n`;
  for (const p of listings) {
    const statusEmoji = p.status === 'published' ? '🟢' : p.status === 'draft' ? '📝' : '🔴';
    msg += `${statusEmoji} <b>${p.title}</b>\n`;
    msg += `💰 ₦${Number(p.price).toLocaleString()} | 📍 ${p.city || ''}, ${p.state || ''}\n`;
    msg += `👀 ${p.views || 0} views | 👆 ${p.clicks || 0} clicks\n\n`;
  }
  await sendTelegram(chatId, msg);
}

async function handleUserStats(chatId: number) {
  const { data: link } = await supabase.from('telegram_user_links').select('user_id').eq('chat_id', chatId).eq('is_verified', true).single();
  if (!link) { await sendTelegram(chatId, '❌ Account not linked.'); return; }

  const [{ count: totalListings }, { count: published }, { data: promos }] = await Promise.all([
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('user_id', link.user_id),
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('user_id', link.user_id).eq('status', 'published'),
    supabase.from('property_promotions').select('*, properties(title)').eq('user_id', link.user_id).eq('is_active', true),
  ]);

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', link.user_id).single();

  let msg = `📊 <b>${profile?.full_name || 'Your'} Stats</b>\n\n`;
  msg += `🏠 Total Listings: <b>${totalListings || 0}</b>\n`;
  msg += `🟢 Published: <b>${published || 0}</b>\n`;
  msg += `⭐ Active Promotions: <b>${(promos || []).length}</b>\n`;

  if (promos && promos.length > 0) {
    msg += `\n<b>Active Promotions:</b>\n`;
    for (const p of promos) {
      const remaining = Math.ceil((new Date(p.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      msg += `• ${(p.properties as any)?.title || 'Property'} - ${remaining} day${remaining !== 1 ? 's' : ''} left\n`;
    }
  }

  await sendTelegram(chatId, msg);
}

async function handleUserPromotions(chatId: number) {
  const { data: link } = await supabase.from('telegram_user_links').select('user_id').eq('chat_id', chatId).eq('is_verified', true).single();
  if (!link) { await sendTelegram(chatId, '❌ Account not linked.'); return; }

  const { data: promos } = await supabase
    .from('property_promotions')
    .select('*, properties(title, views, images)')
    .eq('user_id', link.user_id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!promos || promos.length === 0) {
    await sendTelegram(chatId, '📭 No promotions found. Visit Xavorian to promote your properties!');
    return;
  }

  for (const p of promos) {
    const prop = p.properties as any;
    const isActive = p.is_active && new Date(p.expires_at) > new Date();
    const remaining = Math.ceil((new Date(p.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    // Hyped views (3.5x to 8.5x)
    const hash = Math.abs([...p.property_id].reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0));
    const multiplier = 3.5 + ((hash % 1000) / 1000) * 5;
    const hypedViews = Math.round(((prop?.views || 1)) * multiplier);

    let msg = `${isActive ? '🟢' : '🔴'} <b>${prop?.title || 'Property'}</b>\n`;
    msg += `💰 Paid: ₦${Number(p.amount_paid).toLocaleString()} for ${p.days_promoted} days\n`;
    msg += `👀 Promotion Views: <b>${hypedViews.toLocaleString()}</b>\n`;
    if (isActive) {
      msg += `⏰ ${remaining} day${remaining !== 1 ? 's' : ''} remaining\n`;
    } else {
      msg += `📅 Expired: ${new Date(p.expires_at).toLocaleDateString()}\n`;
    }
    await sendTelegram(chatId, msg);
  }
}

async function handleDashboardStats(chatId: number) {
  const [users, listings, pendingKyc, openTickets, activePromos] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('kyc_documents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('customer_service_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('property_promotions').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ]);
  const { count: aiTickets } = await supabase.from('ai_support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open');

  await sendTelegram(chatId,
    `📊 <b>Xavorian Dashboard</b>\n\n👤 Total Users: <b>${users.count || 0}</b>\n🏠 Active Listings: <b>${listings.count || 0}</b>\n🔐 Pending KYC: <b>${pendingKyc.count || 0}</b>\n🎫 Open Tickets (CS): <b>${openTickets.count || 0}</b>\n🎫 Open Tickets (AI): <b>${aiTickets || 0}</b>\n⭐ Active Promotions: <b>${activePromos.count || 0}</b>`
  );
}

async function handlePendingKYC(chatId: number) {
  const { data: pending } = await supabase
    .from('kyc_documents')
    .select('id, user_id, full_name, identity_type, identity_number, status, submitted_at, document_image_url, selfie_url')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })
    .limit(5);

  if (!pending || pending.length === 0) {
    await sendTelegram(chatId, '✅ No pending KYC submissions.');
    return;
  }

  for (const kyc of pending) {
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', kyc.user_id).single();
    const { data: tgLink } = await supabase.from('telegram_user_links').select('username').eq('user_id', kyc.user_id).single();
    
    let msg = `🔐 <b>KYC Review</b>\n\n`;
    msg += `👤 Name: <b>${kyc.full_name || 'N/A'}</b>\n`;
    msg += `📧 Email: ${profile?.email || 'N/A'}\n`;
    msg += `🪪 ID Type: ${kyc.identity_type || 'N/A'}\n`;
    msg += `🔢 ID Number: ${kyc.identity_number || 'N/A'}\n`;
    msg += `📅 Submitted: ${kyc.submitted_at ? new Date(kyc.submitted_at).toLocaleDateString() : 'N/A'}`;
    if (tgLink?.username) msg += `\n📱 Telegram: @${tgLink.username}`;

    // Send document image
    if (kyc.document_image_url) {
      const signedUrl = await getSignedUrl('kyc-documents', kyc.document_image_url);
      if (signedUrl) {
        await sendPhoto(chatId, signedUrl, `📄 <b>ID Document</b> - ${kyc.full_name || 'User'}`);
      }
    }

    // Send selfie image
    if (kyc.selfie_url) {
      const signedUrl = await getSignedUrl('kyc-documents', kyc.selfie_url);
      if (signedUrl) {
        await sendPhoto(chatId, signedUrl, `🤳 <b>Selfie</b> - ${kyc.full_name || 'User'}`);
      }
    }

    await sendTelegram(chatId, msg, {
      inline_keyboard: [
        [
          { text: '✅ Approve', callback_data: `kyc_approve_${kyc.id}` },
          { text: '❌ Reject', callback_data: `kyc_reject_${kyc.id}` },
        ],
        [
          { text: '💬 Message User', callback_data: `msg_user_${kyc.user_id}` },
        ],
      ],
    });
  }
}

async function handleOpenTickets(chatId: number) {
  const [{ data: csTickets }, { data: aiTickets }] = await Promise.all([
    supabase.from('customer_service_tickets').select('*').in('status', ['open', 'in_progress']).order('created_at', { ascending: false }).limit(5),
    supabase.from('ai_support_tickets').select('*').in('status', ['open', 'in_progress']).order('created_at', { ascending: false }).limit(5),
  ]);

  const allTickets = [
    ...(csTickets || []).map(t => ({ ...t, source: 'CS' })),
    ...(aiTickets || []).map(t => ({ ...t, subject: t.title, source: 'AI' })),
  ].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()).slice(0, 5);

  if (allTickets.length === 0) {
    await sendTelegram(chatId, '✅ No open tickets.');
    return;
  }

  for (const ticket of allTickets) {
    const { data: tgLink } = await supabase.from('telegram_user_links').select('username').eq('user_id', ticket.user_id).single();
    
    let msg = `🎫 <b>Ticket ${ticket.ticket_number || 'N/A'}</b> [${ticket.source}]\n\n`;
    msg += `📌 Subject: <b>${ticket.subject || 'N/A'}</b>\n`;
    msg += `📧 Email: ${ticket.user_email}\n`;
    msg += `⚡ Priority: ${ticket.priority || 'medium'}\n`;
    msg += `📊 Status: ${ticket.status}\n`;
    if (tgLink?.username) msg += `📱 Telegram: @${tgLink.username}\n`;
    msg += `📝 ${(ticket.description || '').substring(0, 200)}${(ticket.description || '').length > 200 ? '...' : ''}\n`;

    await sendTelegram(chatId, msg, {
      inline_keyboard: [
        [
          { text: '✅ Resolve', callback_data: `ticket_resolve_${ticket.source}_${ticket.id}` },
          { text: '📝 In Progress', callback_data: `ticket_progress_${ticket.source}_${ticket.id}` },
        ],
        [
          { text: '💬 Message User', callback_data: `msg_user_${ticket.user_id}` },
        ],
      ],
    });
  }
}

async function handleRecentListings(chatId: number) {
  const { data: listings } = await supabase
    .from('properties')
    .select('id, title, price, property_type, state, city, status, created_at, user_id, images')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!listings || listings.length === 0) {
    await sendTelegram(chatId, '📭 No recent listings.');
    return;
  }

  for (const p of listings) {
    const { data: owner } = await supabase.from('profiles').select('full_name, email').eq('id', p.user_id).single();
    
    // Send first image if available
    if (p.images && p.images.length > 0) {
      const imgUrl = p.images[0];
      // Property images are in public bucket
      const fullUrl = imgUrl.startsWith('http') ? imgUrl : getPublicUrl('property-images', imgUrl);
      await sendPhoto(chatId, fullUrl, `🏠 <b>${p.title}</b>\n💰 ₦${Number(p.price).toLocaleString()}\n📍 ${p.city || ''}, ${p.state || ''}`);
    }

    let msg = `🏠 <b>${p.title}</b>\n\n`;
    msg += `💰 ₦${Number(p.price).toLocaleString()}\n`;
    msg += `📍 ${p.city || ''}, ${p.state || ''}\n`;
    msg += `🏷 Type: ${p.property_type}\n`;
    msg += `📊 Status: ${p.status}\n`;
    msg += `👤 Owner: ${owner?.full_name || 'N/A'} (${owner?.email || 'N/A'})\n`;
    msg += `📅 Listed: ${new Date(p.created_at).toLocaleDateString()}`;

    await sendTelegram(chatId, msg, {
      inline_keyboard: [[
        { text: '💬 Message Seller', callback_data: `msg_user_${p.user_id}` },
      ]],
    });
  }
}

async function handleTotalUsers(chatId: number) {
  const { count: total } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: verified } = await supabase.from('kyc_documents').select('*', { count: 'exact', head: true }).eq('status', 'verified');
  const { data: recent } = await supabase.from('profiles').select('full_name, email, created_at').order('created_at', { ascending: false }).limit(5);

  let msg = `👤 <b>User Statistics</b>\n\n`;
  msg += `Total Users: <b>${total || 0}</b>\n`;
  msg += `Verified Users: <b>${verified || 0}</b>\n\n`;
  msg += `<b>Recent Signups:</b>\n`;
  (recent || []).forEach((u, i) => {
    msg += `${i + 1}. ${u.full_name} (${u.email}) - ${new Date(u.created_at!).toLocaleDateString()}\n`;
  });

  await sendTelegram(chatId, msg);
}

async function handleActivePromotions(chatId: number) {
  const { data: promos } = await supabase
    .from('property_promotions')
    .select('*, properties(title, price, state, city)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!promos || promos.length === 0) {
    await sendTelegram(chatId, '📭 No active promotions.');
    return;
  }

  let msg = `⭐ <b>Active Promotions</b>\n\n`;
  for (const p of promos) {
    const prop = p.properties as any;
    msg += `🏠 ${prop?.title || 'N/A'}\n`;
    msg += `💰 ₦${Number(p.amount_paid).toLocaleString()} for ${p.days_promoted} days\n`;
    msg += `📅 Expires: ${new Date(p.expires_at).toLocaleDateString()}\n\n`;
  }

  await sendTelegram(chatId, msg);
}

async function handleSearch(chatId: number, query: string) {
  const { data: properties } = await supabase
    .from('properties')
    .select('id, title, price, property_type, state, city, status')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`)
    .limit(5);

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(5);

  let msg = `🔍 <b>Search: "${query}"</b>\n\n`;
  if (properties && properties.length > 0) {
    msg += `<b>Properties:</b>\n`;
    properties.forEach((p, i) => {
      msg += `${i + 1}. ${p.title} - ₦${Number(p.price).toLocaleString()} (${p.status})\n`;
    });
    msg += '\n';
  }
  if (users && users.length > 0) {
    msg += `<b>Users:</b>\n`;
    users.forEach((u, i) => {
      msg += `${i + 1}. ${u.full_name} (${u.email})\n`;
    });
  }
  if ((!properties || properties.length === 0) && (!users || users.length === 0)) {
    msg += 'No results found.';
  }
  await sendTelegram(chatId, msg);
}

async function handleAdminMessage(chatId: number, text: string) {
  // /msg email@example.com Hello there
  const parts = text.replace('/msg ', '').trim();
  const spaceIdx = parts.indexOf(' ');
  if (spaceIdx === -1) {
    await sendTelegram(chatId, '📝 Usage: /msg user@email.com Your message here');
    return;
  }
  const email = parts.substring(0, spaceIdx).toLowerCase();
  const message = parts.substring(spaceIdx + 1).trim();

  const { data: profile } = await supabase.from('profiles').select('id, full_name').eq('email', email).single();
  if (!profile) {
    await sendTelegram(chatId, `❌ No user found with email: ${email}`);
    return;
  }

  const { data: link } = await supabase.from('telegram_user_links').select('chat_id').eq('user_id', profile.id).eq('is_verified', true).single();
  if (!link) {
    await sendTelegram(chatId, `❌ User <b>${profile.full_name}</b> hasn't linked their Telegram account.`);
    return;
  }

  await sendTelegram(link.chat_id, `📩 <b>Message from Xavorian Support</b>\n\n${message}\n\n<i>Reply to this message to respond.</i>`);
  await sendTelegram(chatId, `✅ Message sent to <b>${profile.full_name}</b> (${email})`);
}

async function handleDirectMessageToUser(chatId: number, userId: string) {
  // Set reply target so next admin text goes to this user
  await setAdminReplyTarget(chatId, userId);
  const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', userId).single();
  await sendTelegram(chatId, `💬 You're now messaging <b>${profile?.full_name || 'User'}</b> (${profile?.email || 'N/A'}).\n\nType your message and it will be sent to them.\n\nType /cancel to stop messaging.`);
}

async function handleCallbackQuery(callbackQuery: any) {
  const data = callbackQuery.data as string;
  const chatId = callbackQuery.message.chat.id;

  if (data.startsWith('msg_user_')) {
    const userId = data.replace('msg_user_', '');
    await handleDirectMessageToUser(chatId, userId);
  } else if (data.startsWith('kyc_approve_')) {
    const kycId = data.replace('kyc_approve_', '');
    const { data: kyc } = await supabase.from('kyc_documents').select('user_id, full_name').eq('id', kycId).single();
    await supabase.from('kyc_documents').update({ status: 'verified', verified_at: new Date().toISOString() }).eq('id', kycId);
    await sendTelegram(chatId, `✅ KYC for <b>${kyc?.full_name || 'User'}</b> has been <b>APPROVED</b>.`);

    if (kyc?.user_id) {
      const { data: link } = await supabase.from('telegram_user_links').select('chat_id').eq('user_id', kyc.user_id).single();
      if (link) {
        await sendTelegram(link.chat_id, '🎉 <b>Your KYC verification has been approved!</b>\n\nYou can now upload property listings on Xavorian.');
      }
    }
  } else if (data.startsWith('kyc_reject_')) {
    const kycId = data.replace('kyc_reject_', '');
    const { data: kyc } = await supabase.from('kyc_documents').select('user_id, full_name').eq('id', kycId).single();
    await supabase.from('kyc_documents').update({ status: 'rejected' }).eq('id', kycId);
    await sendTelegram(chatId, `❌ KYC for <b>${kyc?.full_name || 'User'}</b> has been <b>REJECTED</b>.`);

    if (kyc?.user_id) {
      const { data: link } = await supabase.from('telegram_user_links').select('chat_id').eq('user_id', kyc.user_id).single();
      if (link) {
        await sendTelegram(link.chat_id, '❌ <b>Your KYC verification was rejected.</b>\n\nPlease resubmit with clearer documents.');
      }
    }
  } else if (data.startsWith('ticket_resolve_')) {
    const parts = data.replace('ticket_resolve_', '').split('_');
    const source = parts[0];
    const ticketId = parts.slice(1).join('_');
    const table = source === 'CS' ? 'customer_service_tickets' : 'ai_support_tickets';
    await supabase.from(table).update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', ticketId);
    await sendTelegram(chatId, `✅ Ticket has been <b>RESOLVED</b>.`);
  } else if (data.startsWith('ticket_progress_')) {
    const parts = data.replace('ticket_progress_', '').split('_');
    const source = parts[0];
    const ticketId = parts.slice(1).join('_');
    const table = source === 'CS' ? 'customer_service_tickets' : 'ai_support_tickets';
    await supabase.from(table).update({ status: 'in_progress' }).eq('id', ticketId);
    await sendTelegram(chatId, `📝 Ticket marked as <b>IN PROGRESS</b>.`);
  }

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQuery.id }),
  });
}

async function isAdmin(chatId: number): Promise<boolean> {
  const { data } = await supabase.from('telegram_admin_chats').select('id').eq('chat_id', chatId).eq('is_active', true).single();
  return !!data;
}

async function handleUserReplyToAdmin(chatId: number, text: string) {
  // A linked user is replying - forward to admin
  const { data: link } = await supabase.from('telegram_user_links').select('user_id, username').eq('chat_id', chatId).eq('is_verified', true).single();
  if (!link) return false;

  const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', link.user_id).single();
  
  // Get admin chat ids
  const { data: admins } = await supabase.from('telegram_admin_chats').select('chat_id').eq('is_active', true);
  if (!admins || admins.length === 0) return false;

  for (const admin of admins) {
    await sendTelegram(admin.chat_id, `📨 <b>Reply from ${profile?.full_name || 'User'}</b>\n📧 ${profile?.email || 'N/A'}\n${link.username ? `📱 @${link.username}` : ''}\n\n${text}\n\n<i>Use /msg ${profile?.email} to reply</i>`);
  }
  await sendTelegram(chatId, '✅ Your message has been sent to Xavorian Support.');
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    const url = new URL(req.url);
    if (url.searchParams.get('setup') === 'true') {
      const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-webhook`;
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl }),
      });
      const result = await res.json();
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    return new Response('OK', { headers: corsHeaders });
  }

  try {
    const update = await req.json();
    
    // Handle webhook setup request
    if (update.setup_webhook === true) {
      const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-webhook`;
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl }),
      });
      const result = await res.json();
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return new Response('OK', { headers: corsHeaders });
    }

    const message = update.message;
    if (!message || !message.text) {
      return new Response('OK', { headers: corsHeaders });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const username = message.from?.username || '';

    if (text === '/admin' || text === '/start admin') {
      await handleAdminSetup(chatId, username);
      return new Response('OK', { headers: corsHeaders });
    }

    if (text === '/start') {
      await sendTelegram(chatId, 
        '👋 <b>Welcome to XavorianBot!</b>\n\nTo connect your Xavorian account, please type your registered email address.\n\nExample: <code>john@example.com</code>'
      );
      return new Response('OK', { headers: corsHeaders });
    }

    const adminCheck = await isAdmin(chatId);

    if (adminCheck) {
      // Check if /cancel
      if (text === '/cancel') {
        await clearAdminReplyTarget(chatId);
        await sendTelegram(chatId, '✅ Messaging mode cancelled.');
        return new Response('OK', { headers: corsHeaders });
      }

      // Check if /msg command
      if (text.startsWith('/msg ')) {
        await handleAdminMessage(chatId, text);
        return new Response('OK', { headers: corsHeaders });
      }

      // Check if admin is in reply mode
      const replyTarget = await getAdminReplyTarget(chatId);
      if (replyTarget) {
        // Send message to user
        const { data: link } = await supabase.from('telegram_user_links').select('chat_id').eq('user_id', replyTarget).eq('is_verified', true).single();
        if (link) {
          await sendTelegram(link.chat_id, `📩 <b>Message from Xavorian Support</b>\n\n${text}\n\n<i>Reply to respond.</i>`);
          await sendTelegram(chatId, '✅ Message sent. Type another message or /cancel to stop.');
        } else {
          await sendTelegram(chatId, '❌ User has not linked their Telegram. Use /cancel to exit messaging mode.');
        }
        return new Response('OK', { headers: corsHeaders });
      }

      // Regular admin commands
      switch (text) {
        case '📊 Dashboard Stats': await handleDashboardStats(chatId); break;
        case '🔐 Pending KYC': await handlePendingKYC(chatId); break;
        case '🎫 Open Tickets': await handleOpenTickets(chatId); break;
        case '🏠 Recent Listings': await handleRecentListings(chatId); break;
        case '👤 Total Users': await handleTotalUsers(chatId); break;
        case '⭐ Active Promotions': await handleActivePromotions(chatId); break;
        default:
          if (text.startsWith('/search ')) {
            await handleSearch(chatId, text.replace('/search ', ''));
          } else if (!text.startsWith('/')) {
            await handleSearch(chatId, text);
          } else {
            await sendTelegram(chatId, 'Unknown command. Use the menu buttons or type a search query.\n\nTo message a user: /msg email@example.com Your message');
          }
      }
    } else {
      // User commands (linked users)
      const { data: userLink } = await supabase.from('telegram_user_links').select('user_id').eq('chat_id', chatId).eq('is_verified', true).single();
      
      if (userLink) {
        // Linked user - handle user commands
        switch (text) {
          case '🏠 My Listings': await handleUserListings(chatId); break;
          case '📊 My Stats': await handleUserStats(chatId); break;
          case '⭐ My Promotions': await handleUserPromotions(chatId); break;
          case '💬 Support':
            await sendTelegram(chatId, '💬 <b>Contact Support</b>\n\nType your message below and it will be forwarded to Xavorian Support.\n\nOr visit our help center on the website.');
            break;
          default:
            // Forward to admin as support message
            if (!text.startsWith('/')) {
              await handleUserReplyToAdmin(chatId, text);
            } else {
              await sendTelegram(chatId, '📋 Use the menu buttons below to navigate.\n\n🏠 My Listings - View your properties\n📊 My Stats - See your statistics\n⭐ My Promotions - Check promotions\n💬 Support - Message support team');
            }
        }
      } else {
        // Not linked - treat as email for linking
        if (text.includes('@') && text.includes('.')) {
          await handleUserLink(chatId, username, text);
        } else {
          await sendTelegram(chatId, '📧 Please enter your registered email address to connect your account.\n\nExample: <code>john@example.com</code>');
        }
      }
    }

    return new Response('OK', { headers: corsHeaders });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response('OK', { headers: corsHeaders });
  }
});
