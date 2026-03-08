import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Admin registration is handled via the web admin management page only

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

async function sendDocument(chatId: number, fileBuffer: Uint8Array, filename: string, caption?: string) {
  const formData = new FormData();
  formData.append('chat_id', chatId.toString());
  formData.append('document', new Blob([fileBuffer]), filename);
  if (caption) formData.append('caption', caption);
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
    method: 'POST',
    body: formData,
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

async function isSuperAdmin(chatId: number): Promise<boolean> {
  const { data: adminChat } = await supabase.from('telegram_admin_chats').select('admin_id').eq('chat_id', chatId).eq('is_active', true).single();
  if (!adminChat) return false;
  const { data: cred } = await supabase.from('admin_credentials').select('role').eq('id', adminChat.admin_id).single();
  return cred?.role === 'super_admin';
}

async function getAdminName(chatId: number): Promise<string> {
  const { data: adminChat } = await supabase.from('telegram_admin_chats').select('admin_id, username').eq('chat_id', chatId).eq('is_active', true).single();
  if (!adminChat) return 'Unknown';
  const { data: cred } = await supabase.from('admin_credentials').select('username').eq('id', adminChat.admin_id).single();
  return cred?.username || adminChat.username || 'Unknown';
}

async function logAdminAction(chatId: number, action: string, details?: string) {
  const adminName = await getAdminName(chatId);
  await supabase.from('telegram_admin_actions').insert({
    admin_chat_id: chatId,
    admin_username: adminName,
    action,
    details: details || null,
  });
}

async function setCommandsForChat(chatId: number, role: 'admin' | 'user' | 'super_admin') {
  const adminCommands = [
    { command: 'help', description: 'Show all available commands' },
    { command: 'searchuser', description: 'Search users by name or email' },
    { command: 'searchkyc', description: 'Search KYC by name, email, or status' },
    { command: 'searchlisting', description: 'Search listings by title, city, or status' },
    { command: 'searchpromo', description: 'Search promotions by title or email' },
    { command: 'exportusers', description: 'Export all users as CSV' },
    { command: 'exportkyc', description: 'Export all KYC records as CSV' },
    { command: 'exportlistings', description: 'Export all listings as CSV' },
    { command: 'exportpromos', description: 'Export all promotions as CSV' },
    { command: 'msg', description: 'Message a user: /msg email message' },
    { command: 'disableotp', description: 'Disable Paystack transfer OTP' },
    { command: 'enableotp', description: 'Re-enable Paystack transfer OTP' },
    { command: 'cancel', description: 'Cancel messaging mode' },
  ];

  if (role === 'super_admin') {
    adminCommands.push(
      { command: 'addadmin', description: 'Add admin: /addadmin email' },
      { command: 'removeadmin', description: 'Remove admin: /removeadmin email' },
      { command: 'adminlog', description: 'View recent admin activity' },
    );
  }

  const userCommands = [
    { command: 'help', description: 'Show all available commands' },
    { command: 'mylistings', description: 'View your property listings' },
    { command: 'mystats', description: 'View your account statistics' },
    { command: 'mypromotions', description: 'Check your promotions' },
    { command: 'myoffers', description: 'View your offers' },
    { command: 'mytransactions', description: 'View payment history' },
    { command: 'support', description: 'Contact support' },
  ];

  const commands = role === 'admin' ? adminCommands : userCommands;

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commands,
      scope: { type: 'chat', chat_id: chatId },
    }),
  });
}

async function handleAdminSetup(chatId: number, username: string) {
  // Check if this Telegram username is registered as an admin in admin_credentials
  const { data: adminCred } = await supabase
    .from('admin_credentials')
    .select('id, username, role, telegram_username')
    .ilike('telegram_username', username)
    .eq('is_active', true)
    .single();

  if (!adminCred) {
    await sendTelegram(chatId, '❌ <b>Access Denied</b>\n\nYour Telegram username is not registered as an admin. An admin must add your Telegram username from the Admin Management page first.');
    return;
  }

  const { error } = await supabase.from('telegram_admin_chats').upsert(
    { chat_id: chatId, username, admin_id: adminCred.id, is_active: true },
    { onConflict: 'chat_id' }
  );
  if (error) {
    await sendTelegram(chatId, '❌ Failed to register. Try again.');
    return;
  }
  await sendTelegram(chatId, 
    `✅ <b>Admin registered!</b>\n\nWelcome, <b>${adminCred.username}</b> (${adminCred.role.replace('_', ' ')})!\n\nYou will now receive notifications for:\n• 🔐 KYC submissions\n• 🏠 New listings\n• 🎫 Support tickets\n• ⭐ Property promotions\n• 👤 New user signups\n\nUse the menu below or type / to see all commands.`,
    {
      keyboard: [
        [{ text: '📊 Dashboard Stats' }, { text: '🔐 Pending KYC' }],
        [{ text: '🎫 Open Tickets' }, { text: '🏠 Recent Listings' }],
        [{ text: '👤 Total Users' }, { text: '⭐ Active Promotions' }],
        [{ text: '🔍 Search Help' }],
      ],
      resize_keyboard: true,
      persistent: true,
    }
  );

  // Set bot commands for this admin user
  await setCommandsForChat(chatId, 'admin');
}

async function handleUserLink(chatId: number, username: string, text: string) {
  const email = text.trim().toLowerCase();
  // Use ilike for case-insensitive match
  const { data: profile } = await supabase.from('profiles').select('id, full_name, email').ilike('email', email).single();
  if (!profile) {
    await sendTelegram(chatId, '❌ No account found with that email. Please check and try again.\n\n<i>Note: If you just created your account, please wait a moment and try again.</i>');
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
        [{ text: '⭐ My Promotions' }, { text: '🤝 My Offers' }],
        [{ text: '💳 My Transactions' }, { text: '💬 Support' }],
      ],
      resize_keyboard: true,
      persistent: true,
    }
  );
  // Set user slash commands
  await setCommandsForChat(chatId, 'user');
}

// ==================== USER COMMANDS ====================

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
    
    const hash = Math.abs([...p.property_id].reduce((a: number, c: string) => ((a << 5) - a) + c.charCodeAt(0), 0));
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

async function handleUserOffers(chatId: number) {
  const { data: link } = await supabase.from('telegram_user_links').select('user_id').eq('chat_id', chatId).eq('is_verified', true).single();
  if (!link) { await sendTelegram(chatId, '❌ Account not linked.'); return; }

  const { data: offers } = await supabase
    .from('escrow_transactions')
    .select('id, offer_amount, offer_status, offer_message, seller_response, created_at, property:properties(title, price), buyer:profiles!escrow_transactions_buyer_id_fkey(full_name), seller:profiles!escrow_transactions_seller_id_fkey(full_name)')
    .or(`buyer_id.eq.${link.user_id},seller_id.eq.${link.user_id}`)
    .not('offer_amount', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!offers || offers.length === 0) {
    await sendTelegram(chatId, '📭 You have no offers yet.');
    return;
  }

  let msg = `🤝 <b>Your Offers (${offers.length})</b>\n\n`;
  for (const o of offers) {
    const prop = o.property as any;
    const buyer = o.buyer as any;
    const seller = o.seller as any;
    const statusEmoji = o.offer_status === 'accepted' ? '✅' : o.offer_status === 'rejected' ? '❌' : '⏳';
    
    msg += `${statusEmoji} <b>${prop?.title || 'Property'}</b>\n`;
    msg += `💰 Offer: ₦${Number(o.offer_amount).toLocaleString()} (Listed: ₦${Number(prop?.price || 0).toLocaleString()})\n`;
    msg += `👤 From: ${buyer?.full_name || 'N/A'} → ${seller?.full_name || 'N/A'}\n`;
    msg += `📊 Status: <b>${o.offer_status || 'none'}</b>\n`;
    if (o.offer_message) msg += `💬 "${o.offer_message.substring(0, 80)}${o.offer_message.length > 80 ? '...' : ''}"\n`;
    if (o.seller_response) msg += `📝 Response: "${o.seller_response.substring(0, 80)}"\n`;
    msg += `📅 ${new Date(o.created_at).toLocaleDateString()}\n\n`;
  }

  await sendTelegram(chatId, msg);
}

async function handleUserTransactions(chatId: number) {
  const { data: link } = await supabase.from('telegram_user_links').select('user_id').eq('chat_id', chatId).eq('is_verified', true).single();
  if (!link) { await sendTelegram(chatId, '❌ Account not linked.'); return; }

  const { data: transactions } = await supabase
    .from('purchase_transactions')
    .select('id, transaction_amount, status, payment_method, created_at, payment_verified_at, property:properties(title), buyer_profile:profiles!purchase_transactions_buyer_id_fkey(full_name), seller_profile:profiles!purchase_transactions_seller_id_fkey(full_name)')
    .or(`buyer_id.eq.${link.user_id},seller_id.eq.${link.user_id}`)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!transactions || transactions.length === 0) {
    await sendTelegram(chatId, '📭 You have no transactions yet.');
    return;
  }

  let msg = `💳 <b>Your Transactions (${transactions.length})</b>\n\n`;
  for (const t of transactions) {
    const prop = t.property as any;
    const buyer = t.buyer_profile as any;
    const seller = t.seller_profile as any;
    const statusEmoji = t.status === 'successful' ? '✅' : t.status === 'pending' ? '⏳' : '❌';
    
    msg += `${statusEmoji} <b>${prop?.title || 'Property'}</b>\n`;
    msg += `💰 ₦${Number(t.transaction_amount).toLocaleString()}\n`;
    msg += `👤 ${buyer?.full_name || 'N/A'} → ${seller?.full_name || 'N/A'}\n`;
    msg += `💳 ${t.payment_method === 'paystack' ? 'Paystack' : 'Bank Transfer'}\n`;
    msg += `📊 Status: <b>${t.status}</b>\n`;
    if (t.payment_verified_at) msg += `✅ Verified: ${new Date(t.payment_verified_at).toLocaleDateString()}\n`;
    msg += `📅 ${new Date(t.created_at).toLocaleDateString()}\n\n`;
  }

  await sendTelegram(chatId, msg);
}

// ==================== ADMIN COMMANDS ====================

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

    if (kyc.document_image_url) {
      const signedUrl = await getSignedUrl('kyc-documents', kyc.document_image_url);
      if (signedUrl) await sendPhoto(chatId, signedUrl, `📄 <b>ID Document</b> - ${kyc.full_name || 'User'}`);
    }
    if (kyc.selfie_url) {
      const signedUrl = await getSignedUrl('kyc-documents', kyc.selfie_url);
      if (signedUrl) await sendPhoto(chatId, signedUrl, `🤳 <b>Selfie</b> - ${kyc.full_name || 'User'}`);
    }

    await sendTelegram(chatId, msg, {
      inline_keyboard: [
        [
          { text: '✅ Approve', callback_data: `kyc_approve_${kyc.id}` },
          { text: '❌ Reject', callback_data: `kyc_reject_${kyc.id}` },
        ],
        [{ text: '💬 Message User', callback_data: `msg_user_${kyc.user_id}` }],
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
        [{ text: '💬 Message User', callback_data: `msg_user_${ticket.user_id}` }],
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
    
    if (p.images && p.images.length > 0) {
      const imgUrl = p.images[0];
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
      inline_keyboard: [[{ text: '💬 Message Seller', callback_data: `msg_user_${p.user_id}` }]],
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
  msg += `\n<i>Search: /searchuser name or email\nExport: /exportusers</i>`;

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
  msg += `<i>Search: /searchpromo title\nExport: /exportpromos</i>`;

  await sendTelegram(chatId, msg);
}

// ==================== SEARCH COMMANDS ====================

async function handleSearchUsers(chatId: number, query: string) {
  if (!query.trim()) {
    await sendTelegram(chatId, '📝 Usage: /searchuser <name or email>\n\nExample:\n/searchuser john\n/searchuser john@gmail.com');
    return;
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, account_type, created_at')
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!users || users.length === 0) {
    await sendTelegram(chatId, `🔍 No users found for "<b>${query}</b>".`);
    return;
  }

  let msg = `🔍 <b>User Search: "${query}"</b>\nFound: ${users.length} result(s)\n\n`;
  for (const u of users) {
    // Get KYC status
    const { data: kyc } = await supabase.from('kyc_documents').select('status').eq('user_id', u.id).single();
    const { count: listingsCount } = await supabase.from('properties').select('*', { count: 'exact', head: true }).eq('user_id', u.id);
    
    msg += `👤 <b>${u.full_name}</b>\n`;
    msg += `📧 ${u.email}\n`;
    msg += `📱 ${u.phone || 'No phone'}\n`;
    msg += `🏷 Account: ${u.account_type || 'buyer'}\n`;
    msg += `🔐 KYC: ${kyc?.status || 'none'}\n`;
    msg += `🏠 Listings: ${listingsCount || 0}\n`;
    msg += `📅 Joined: ${new Date(u.created_at!).toLocaleDateString()}\n\n`;
  }

  await sendTelegram(chatId, msg, {
    inline_keyboard: users.slice(0, 3).map(u => ([
      { text: `💬 Message ${u.full_name.split(' ')[0]}`, callback_data: `msg_user_${u.id}` },
    ])),
  });
}

async function handleSearchKYC(chatId: number, query: string) {
  if (!query.trim()) {
    await sendTelegram(chatId, '📝 Usage: /searchkyc <name, email, or status>\n\nStatus options: pending, verified, rejected\n\nExamples:\n/searchkyc pending\n/searchkyc john\n/searchkyc verified');
    return;
  }

  const statusFilter = ['pending', 'verified', 'rejected'].includes(query.toLowerCase());
  
  let kycQuery = supabase
    .from('kyc_documents')
    .select('id, user_id, full_name, identity_type, identity_number, status, submitted_at, document_image_url, selfie_url')
    .order('submitted_at', { ascending: false })
    .limit(10);

  if (statusFilter) {
    kycQuery = kycQuery.eq('status', query.toLowerCase());
  } else {
    kycQuery = kycQuery.or(`full_name.ilike.%${query}%,identity_number.ilike.%${query}%`);
  }

  const { data: kycResults } = await kycQuery;

  if (!kycResults || kycResults.length === 0) {
    // If searching by name didn't work, try by email via profiles
    if (!statusFilter) {
      const { data: profiles } = await supabase.from('profiles').select('id').ilike('email', `%${query}%`).limit(10);
      if (profiles && profiles.length > 0) {
        const userIds = profiles.map(p => p.id);
        const { data: kycByEmail } = await supabase
          .from('kyc_documents')
          .select('id, user_id, full_name, identity_type, identity_number, status, submitted_at, document_image_url, selfie_url')
          .in('user_id', userIds)
          .limit(10);
        
        if (kycByEmail && kycByEmail.length > 0) {
          await displayKYCResults(chatId, kycByEmail, query);
          return;
        }
      }
    }
    await sendTelegram(chatId, `🔍 No KYC records found for "<b>${query}</b>".`);
    return;
  }

  await displayKYCResults(chatId, kycResults, query);
}

async function displayKYCResults(chatId: number, results: any[], query: string) {
  await sendTelegram(chatId, `🔍 <b>KYC Search: "${query}"</b>\nFound: ${results.length} result(s)\n`);

  for (const kyc of results) {
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', kyc.user_id).single();
    const statusEmoji = kyc.status === 'verified' ? '✅' : kyc.status === 'pending' ? '⏳' : '❌';

    if (kyc.document_image_url) {
      const signedUrl = await getSignedUrl('kyc-documents', kyc.document_image_url);
      if (signedUrl) await sendPhoto(chatId, signedUrl, `📄 ID - ${kyc.full_name || 'User'}`);
    }
    if (kyc.selfie_url) {
      const signedUrl = await getSignedUrl('kyc-documents', kyc.selfie_url);
      if (signedUrl) await sendPhoto(chatId, signedUrl, `🤳 Selfie - ${kyc.full_name || 'User'}`);
    }

    let msg = `${statusEmoji} <b>${kyc.full_name || 'N/A'}</b>\n`;
    msg += `📧 ${profile?.email || 'N/A'}\n`;
    msg += `🪪 ${kyc.identity_type || 'N/A'} - ${kyc.identity_number || 'N/A'}\n`;
    msg += `📊 Status: <b>${kyc.status}</b>\n`;
    msg += `📅 ${kyc.submitted_at ? new Date(kyc.submitted_at).toLocaleDateString() : 'N/A'}`;

    const buttons: any[] = [
      [{ text: '💬 Message User', callback_data: `msg_user_${kyc.user_id}` }],
    ];
    if (kyc.status === 'pending') {
      buttons.unshift([
        { text: '✅ Approve', callback_data: `kyc_approve_${kyc.id}` },
        { text: '❌ Reject', callback_data: `kyc_reject_${kyc.id}` },
      ]);
    }

    await sendTelegram(chatId, msg, { inline_keyboard: buttons });
  }
}

async function handleSearchListings(chatId: number, query: string) {
  if (!query.trim()) {
    await sendTelegram(chatId, '📝 Usage: /searchlisting <title, city, state, or status>\n\nStatus options: published, draft, pending\n\nExamples:\n/searchlisting Lagos\n/searchlisting 3 bedroom\n/searchlisting published');
    return;
  }

  const statusFilter = ['published', 'draft', 'pending'].includes(query.toLowerCase());

  let listingQuery = supabase
    .from('properties')
    .select('id, title, price, property_type, state, city, status, created_at, user_id, images, views, clicks')
    .order('created_at', { ascending: false })
    .limit(10);

  if (statusFilter) {
    listingQuery = listingQuery.eq('status', query.toLowerCase());
  } else {
    listingQuery = listingQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%,property_type.ilike.%${query}%`);
  }

  const { data: listings } = await listingQuery;

  if (!listings || listings.length === 0) {
    await sendTelegram(chatId, `🔍 No listings found for "<b>${query}</b>".`);
    return;
  }

  await sendTelegram(chatId, `🔍 <b>Listing Search: "${query}"</b>\nFound: ${listings.length} result(s)\n`);

  for (const p of listings) {
    const { data: owner } = await supabase.from('profiles').select('full_name, email').eq('id', p.user_id).single();

    if (p.images && p.images.length > 0) {
      const imgUrl = p.images[0];
      const fullUrl = imgUrl.startsWith('http') ? imgUrl : getPublicUrl('property-images', imgUrl);
      await sendPhoto(chatId, fullUrl, `🏠 ${p.title}`);
    }

    let msg = `🏠 <b>${p.title}</b>\n`;
    msg += `💰 ₦${Number(p.price).toLocaleString()}\n`;
    msg += `📍 ${p.city || ''}, ${p.state || ''}\n`;
    msg += `🏷 ${p.property_type} | 📊 ${p.status}\n`;
    msg += `👀 ${p.views || 0} views | 👆 ${p.clicks || 0} clicks\n`;
    msg += `👤 ${owner?.full_name || 'N/A'} (${owner?.email || 'N/A'})\n`;
    msg += `📅 ${new Date(p.created_at).toLocaleDateString()}`;

    await sendTelegram(chatId, msg, {
      inline_keyboard: [[{ text: '💬 Message Seller', callback_data: `msg_user_${p.user_id}` }]],
    });
  }
}

async function handleSearchPromotions(chatId: number, query: string) {
  if (!query.trim()) {
    await sendTelegram(chatId, '📝 Usage: /searchpromo <property title or user email>\n\nExamples:\n/searchpromo luxury\n/searchpromo john@email.com');
    return;
  }

  // Search by property title
  const { data: promos } = await supabase
    .from('property_promotions')
    .select('*, properties(title, price, state, city, views)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(20);

  // Filter by query matching property title or user
  const filtered = (promos || []).filter(p => {
    const prop = p.properties as any;
    return (prop?.title || '').toLowerCase().includes(query.toLowerCase());
  });

  // Also search by user email
  if (filtered.length === 0) {
    const { data: profiles } = await supabase.from('profiles').select('id').ilike('email', `%${query}%`).limit(5);
    if (profiles && profiles.length > 0) {
      const { data: userPromos } = await supabase
        .from('property_promotions')
        .select('*, properties(title, price, state, city, views)')
        .in('user_id', profiles.map(p => p.id))
        .order('created_at', { ascending: false })
        .limit(10);

      if (userPromos && userPromos.length > 0) {
        await displayPromoResults(chatId, userPromos, query);
        return;
      }
    }
    await sendTelegram(chatId, `🔍 No promotions found for "<b>${query}</b>".`);
    return;
  }

  await displayPromoResults(chatId, filtered, query);
}

async function displayPromoResults(chatId: number, promos: any[], query: string) {
  let msg = `🔍 <b>Promotion Search: "${query}"</b>\nFound: ${promos.length} result(s)\n\n`;

  for (const p of promos) {
    const prop = p.properties as any;
    const isActive = p.is_active && new Date(p.expires_at) > new Date();
    const remaining = Math.ceil((new Date(p.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const { data: owner } = await supabase.from('profiles').select('full_name, email').eq('id', p.user_id).single();

    msg += `${isActive ? '🟢' : '🔴'} <b>${prop?.title || 'N/A'}</b>\n`;
    msg += `👤 ${owner?.full_name || 'N/A'} (${owner?.email || 'N/A'})\n`;
    msg += `💰 ₦${Number(p.amount_paid).toLocaleString()} for ${p.days_promoted} days\n`;
    msg += `📅 Expires: ${new Date(p.expires_at).toLocaleDateString()}`;
    if (isActive) msg += ` (${remaining}d left)`;
    msg += `\n\n`;
  }

  await sendTelegram(chatId, msg);
}

// ==================== CSV EXPORT COMMANDS ====================

async function handleExportUsers(chatId: number) {
  await sendTelegram(chatId, '⏳ Generating users CSV...');

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, account_type, created_at')
    .order('created_at', { ascending: false });

  if (!users || users.length === 0) {
    await sendTelegram(chatId, '📭 No users to export.');
    return;
  }

  // Get KYC status for each
  const rows: string[] = ['Name,Email,Phone,Account Type,KYC Status,Listings,Joined'];
  for (const u of users) {
    const { data: kyc } = await supabase.from('kyc_documents').select('status').eq('user_id', u.id).single();
    const { count } = await supabase.from('properties').select('*', { count: 'exact', head: true }).eq('user_id', u.id);
    
    const name = (u.full_name || '').replace(/,/g, ' ');
    rows.push(`"${name}","${u.email}","${u.phone || ''}","${u.account_type || 'buyer'}","${kyc?.status || 'none'}","${count || 0}","${new Date(u.created_at!).toLocaleDateString()}"`);
  }

  const csv = rows.join('\n');
  const encoder = new TextEncoder();
  const buffer = encoder.encode(csv);
  await sendDocument(chatId, buffer, `xavorian_users_${new Date().toISOString().split('T')[0]}.csv`, `📊 Users Export - ${users.length} records`);
}

async function handleExportKYC(chatId: number) {
  await sendTelegram(chatId, '⏳ Generating KYC CSV...');

  const { data: kycRecords } = await supabase
    .from('kyc_documents')
    .select('user_id, full_name, identity_type, identity_number, status, submitted_at, verified_at, state, lga')
    .order('submitted_at', { ascending: false });

  if (!kycRecords || kycRecords.length === 0) {
    await sendTelegram(chatId, '📭 No KYC records to export.');
    return;
  }

  const rows: string[] = ['Name,Email,ID Type,ID Number,Status,State,LGA,Submitted,Verified'];
  for (const k of kycRecords) {
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', k.user_id).single();
    const name = (k.full_name || '').replace(/,/g, ' ');
    rows.push(`"${name}","${profile?.email || ''}","${k.identity_type || ''}","${k.identity_number || ''}","${k.status || ''}","${k.state || ''}","${k.lga || ''}","${k.submitted_at ? new Date(k.submitted_at).toLocaleDateString() : ''}","${k.verified_at ? new Date(k.verified_at).toLocaleDateString() : ''}"`);
  }

  const csv = rows.join('\n');
  const buffer = new TextEncoder().encode(csv);
  await sendDocument(chatId, buffer, `xavorian_kyc_${new Date().toISOString().split('T')[0]}.csv`, `🔐 KYC Export - ${kycRecords.length} records`);
}

async function handleExportListings(chatId: number) {
  await sendTelegram(chatId, '⏳ Generating listings CSV...');

  const { data: listings } = await supabase
    .from('properties')
    .select('id, title, price, property_type, state, city, status, views, clicks, created_at, user_id')
    .order('created_at', { ascending: false });

  if (!listings || listings.length === 0) {
    await sendTelegram(chatId, '📭 No listings to export.');
    return;
  }

  const rows: string[] = ['Title,Price,Type,City,State,Status,Views,Clicks,Owner,Email,Listed'];
  for (const p of listings) {
    const { data: owner } = await supabase.from('profiles').select('full_name, email').eq('id', p.user_id).single();
    const title = (p.title || '').replace(/,/g, ' ');
    rows.push(`"${title}","₦${Number(p.price).toLocaleString()}","${p.property_type}","${p.city || ''}","${p.state || ''}","${p.status}","${p.views || 0}","${p.clicks || 0}","${(owner?.full_name || '').replace(/,/g, ' ')}","${owner?.email || ''}","${new Date(p.created_at).toLocaleDateString()}"`);
  }

  const csv = rows.join('\n');
  const buffer = new TextEncoder().encode(csv);
  await sendDocument(chatId, buffer, `xavorian_listings_${new Date().toISOString().split('T')[0]}.csv`, `🏠 Listings Export - ${listings.length} records`);
}

async function handleExportPromotions(chatId: number) {
  await sendTelegram(chatId, '⏳ Generating promotions CSV...');

  const { data: promos } = await supabase
    .from('property_promotions')
    .select('*, properties(title, price)')
    .order('created_at', { ascending: false });

  if (!promos || promos.length === 0) {
    await sendTelegram(chatId, '📭 No promotions to export.');
    return;
  }

  const rows: string[] = ['Property,Amount Paid,Days,Started,Expires,Active,Owner Email'];
  for (const p of promos) {
    const prop = p.properties as any;
    const { data: owner } = await supabase.from('profiles').select('email').eq('id', p.user_id).single();
    const isActive = p.is_active && new Date(p.expires_at) > new Date();
    rows.push(`"${(prop?.title || '').replace(/,/g, ' ')}","₦${Number(p.amount_paid).toLocaleString()}","${p.days_promoted}","${new Date(p.started_at).toLocaleDateString()}","${new Date(p.expires_at).toLocaleDateString()}","${isActive ? 'Yes' : 'No'}","${owner?.email || ''}"`);
  }

  const csv = rows.join('\n');
  const buffer = new TextEncoder().encode(csv);
  await sendDocument(chatId, buffer, `xavorian_promotions_${new Date().toISOString().split('T')[0]}.csv`, `⭐ Promotions Export - ${promos.length} records`);
}

// ==================== SEARCH HELP ====================

async function handleSearchHelp(chatId: number) {
  await sendTelegram(chatId, 
    `🔍 <b>Search & Export Commands</b>\n\n` +
    `<b>Search:</b>\n` +
    `/searchuser <name or email>\n` +
    `/searchkyc <name, email, or status>\n` +
    `/searchlisting <title, city, or status>\n` +
    `/searchpromo <property title or email>\n\n` +
    `<b>KYC Status filters:</b> pending, verified, rejected\n` +
    `<b>Listing Status filters:</b> published, draft, pending\n\n` +
    `<b>Export as CSV:</b>\n` +
    `/exportusers - All users\n` +
    `/exportkyc - All KYC records\n` +
    `/exportlistings - All listings\n` +
    `/exportpromos - All promotions\n\n` +
    `<b>Messaging:</b>\n` +
    `/msg email@example.com Your message\n` +
    `/cancel - Stop messaging mode`
  );
}

// ==================== GENERAL SEARCH ====================

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
  msg += `\n<i>For detailed search use:\n/searchuser, /searchkyc, /searchlisting, /searchpromo</i>`;
  await sendTelegram(chatId, msg);
}

// ==================== PAYSTACK OTP CONTROL ====================

async function handleDisableOTP(chatId: number) {
  const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!paystackSecretKey) {
    await sendTelegram(chatId, '❌ Paystack secret key not configured.');
    return;
  }

  await sendTelegram(chatId, '⏳ Initiating OTP disable... Paystack will send an OTP to your business phone.');

  try {
    const res = await fetch('https://api.paystack.co/transfer/disable_otp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    console.log('Disable OTP initiate:', JSON.stringify(data));

    if (data.status) {
      await sendTelegram(chatId,
        `✅ <b>OTP Sent!</b>\n\n${data.message || 'Check your Paystack business phone for the OTP.'}\n\nNow send the OTP using:\n<code>/confirmotp 123456</code>\n\n⚠️ Replace 123456 with the actual OTP you received.`
      );
    } else {
      await sendTelegram(chatId, `❌ Failed: ${data.message || 'Unknown error from Paystack'}`);
    }
  } catch (err) {
    await sendTelegram(chatId, `❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

async function handleConfirmOTP(chatId: number, otp: string) {
  if (!otp || otp.length < 4) {
    await sendTelegram(chatId, '❌ Please provide a valid OTP.\n\nUsage: <code>/confirmotp 123456</code>');
    return;
  }

  const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!paystackSecretKey) {
    await sendTelegram(chatId, '❌ Paystack secret key not configured.');
    return;
  }

  await sendTelegram(chatId, '⏳ Finalizing OTP disable...');

  try {
    const res = await fetch('https://api.paystack.co/transfer/disable_otp_finalize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ otp }),
    });
    const data = await res.json();
    console.log('Disable OTP finalize:', JSON.stringify(data));

    if (data.status) {
      await sendTelegram(chatId, '🎉 <b>Transfer OTP Disabled Successfully!</b>\n\nAutomatic payouts to sellers will now work without OTP verification.\n\n⚠️ To re-enable, use /enableotp');
    } else {
      await sendTelegram(chatId, `❌ Failed: ${data.message || 'Invalid OTP or expired. Try /disableotp again.'}`);
    }
  } catch (err) {
    await sendTelegram(chatId, `❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

async function handleEnableOTP(chatId: number) {
  const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!paystackSecretKey) {
    await sendTelegram(chatId, '❌ Paystack secret key not configured.');
    return;
  }

  try {
    const res = await fetch('https://api.paystack.co/transfer/enable_otp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();

    if (data.status) {
      await sendTelegram(chatId, '✅ <b>Transfer OTP Re-enabled!</b>\n\nTransfers will now require OTP verification again.');
    } else {
      await sendTelegram(chatId, `❌ Failed: ${data.message || 'Unknown error'}`);
    }
  } catch (err) {
    await sendTelegram(chatId, `❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// ==================== MESSAGING ====================

async function handleAdminMessage(chatId: number, text: string) {
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
  await setAdminReplyTarget(chatId, userId);
  const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', userId).single();
  await sendTelegram(chatId, `💬 You're now messaging <b>${profile?.full_name || 'User'}</b> (${profile?.email || 'N/A'}).\n\nType your message and it will be sent to them.\n\nType /cancel to stop messaging.`);
}

// ==================== CALLBACKS ====================

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
      if (link) await sendTelegram(link.chat_id, '🎉 <b>Your KYC verification has been approved!</b>\n\nYou can now upload property listings on Xavorian.');
    }
  } else if (data.startsWith('kyc_reject_')) {
    const kycId = data.replace('kyc_reject_', '');
    const { data: kyc } = await supabase.from('kyc_documents').select('user_id, full_name').eq('id', kycId).single();
    await supabase.from('kyc_documents').update({ status: 'rejected' }).eq('id', kycId);
    await sendTelegram(chatId, `❌ KYC for <b>${kyc?.full_name || 'User'}</b> has been <b>REJECTED</b>.`);

    if (kyc?.user_id) {
      const { data: link } = await supabase.from('telegram_user_links').select('chat_id').eq('user_id', kyc.user_id).single();
      if (link) await sendTelegram(link.chat_id, '❌ <b>Your KYC verification was rejected.</b>\n\nPlease resubmit with clearer documents.');
    }
  } else if (data.startsWith('payment_confirm_')) {
    const escrowId = data.replace('payment_confirm_', '');
    const { data: escrow } = await supabase.from('escrow_transactions').select('id, buyer_id, seller_id, offer_amount, transaction_amount, property_id, status').eq('id', escrowId).single();
    if (escrow && escrow.status === 'funded') {
      await supabase.from('escrow_transactions').update({ status: 'completed', seller_confirmed: true, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', escrowId);
      // Get property title
      const { data: prop } = await supabase.from('properties').select('title').eq('id', escrow.property_id).single();
      const { data: sellerProfile } = await supabase.from('profiles').select('full_name').eq('id', escrow.seller_id).single();
      // Notify buyer
      const buyerChatId = await getUserChatId(escrow.buyer_id);
      if (buyerChatId) {
        await sendTelegram(buyerChatId, `✅ <b>Payment Confirmed!</b>\n\n🏠 "${prop?.title || 'Property'}"\n💰 ₦${Number(escrow.offer_amount || escrow.transaction_amount).toLocaleString()}\n\nThe seller (${sellerProfile?.full_name || 'Seller'}) has confirmed receiving your payment. Transaction complete! 🎉`);
      }
      await sendTelegram(chatId, `✅ Payment for "<b>${prop?.title || 'Property'}</b>" has been <b>CONFIRMED</b>. Transaction complete!`);
    } else {
      await sendTelegram(chatId, '⚠️ This transaction has already been processed.');
    }
  } else if (data.startsWith('payment_deny_')) {
    const escrowId = data.replace('payment_deny_', '');
    const { data: escrow } = await supabase.from('escrow_transactions').select('id, buyer_id, seller_id, property_id, status').eq('id', escrowId).single();
    if (escrow && escrow.status === 'funded') {
      await supabase.from('escrow_transactions').update({ status: 'disputed', updated_at: new Date().toISOString() }).eq('id', escrowId);
      const { data: prop } = await supabase.from('properties').select('title').eq('id', escrow.property_id).single();
      const { data: sellerProfile } = await supabase.from('profiles').select('full_name').eq('id', escrow.seller_id).single();
      // Notify buyer
      const buyerChatId = await getUserChatId(escrow.buyer_id);
      if (buyerChatId) {
        await sendTelegram(buyerChatId, `❌ <b>Payment Not Confirmed</b>\n\n🏠 "${prop?.title || 'Property'}"\n\nThe seller (${sellerProfile?.full_name || 'Seller'}) has not confirmed receiving your payment. Please contact the seller or raise a dispute.`);
      }
      await sendTelegram(chatId, `❌ Payment for "<b>${prop?.title || 'Property'}</b>" marked as <b>NOT RECEIVED</b>.`);
    } else {
      await sendTelegram(chatId, '⚠️ This transaction has already been processed.');
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
  const { data: link } = await supabase.from('telegram_user_links').select('user_id, username').eq('chat_id', chatId).eq('is_verified', true).single();
  if (!link) return false;

  const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', link.user_id).single();
  const { data: admins } = await supabase.from('telegram_admin_chats').select('chat_id').eq('is_active', true);
  if (!admins || admins.length === 0) return false;

  for (const admin of admins) {
    await sendTelegram(admin.chat_id, `📨 <b>Reply from ${profile?.full_name || 'User'}</b>\n📧 ${profile?.email || 'N/A'}\n${link.username ? `📱 @${link.username}` : ''}\n\n${text}\n\n<i>Use /msg ${profile?.email} to reply</i>`);
  }
  await sendTelegram(chatId, '✅ Your message has been sent to Xavorian Support.');
  return true;
}

// ==================== MAIN HANDLER ====================

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

    // Check if username is a registered admin via admin_credentials
    if (text === '/start') {
      // Check if already admin
      const existingAdmin = await isAdmin(chatId);
      if (existingAdmin) {
        await sendTelegram(chatId, '👋 <b>Welcome back, Admin!</b>\n\nUse the menu below or type / to see available commands.', {
          keyboard: [
            [{ text: '📊 Dashboard Stats' }, { text: '🔐 Pending KYC' }],
            [{ text: '🎫 Open Tickets' }, { text: '🏠 Recent Listings' }],
            [{ text: '👤 Total Users' }, { text: '⭐ Active Promotions' }],
            [{ text: '🔍 Search Help' }],
          ],
          resize_keyboard: true,
          persistent: true,
        });
        await setCommandsForChat(chatId, 'admin');
        return new Response('OK', { headers: corsHeaders });
      }

      // Check if their Telegram username is registered as admin
      if (username) {
        const { data: adminCred } = await supabase
          .from('admin_credentials')
          .select('id, username, role, telegram_username')
          .ilike('telegram_username', username)
          .eq('is_active', true)
          .single();

        if (adminCred) {
          await handleAdminSetup(chatId, username);
          return new Response('OK', { headers: corsHeaders });
        }
      }

      // Check if already linked user
      const { data: existingLink } = await supabase.from('telegram_user_links').select('user_id').eq('chat_id', chatId).eq('is_verified', true).single();
      if (existingLink) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', existingLink.user_id).single();
        await sendTelegram(chatId, `👋 <b>Welcome back, ${profile?.full_name || 'User'}!</b>\n\nUse the menu below or type / to see available commands.`, {
          keyboard: [
            [{ text: '🏠 My Listings' }, { text: '📊 My Stats' }],
            [{ text: '⭐ My Promotions' }, { text: '🤝 My Offers' }],
            [{ text: '💳 My Transactions' }, { text: '💬 Support' }],
          ],
          resize_keyboard: true,
          persistent: true,
        });
        await setCommandsForChat(chatId, 'user');
        return new Response('OK', { headers: corsHeaders });
      }

      await sendTelegram(chatId, 
        '👋 <b>Welcome to XavorianBot!</b>\n\nTo connect your Xavorian account, please type your registered email address.\n\nExample: <code>john@example.com</code>'
      );
      return new Response('OK', { headers: corsHeaders });
    }

    const adminCheck = await isAdmin(chatId);

    if (adminCheck) {
      if (text === '/cancel') {
        await clearAdminReplyTarget(chatId);
        await sendTelegram(chatId, '✅ Messaging mode cancelled.');
        return new Response('OK', { headers: corsHeaders });
      }

      if (text === '/help') {
        await handleSearchHelp(chatId);
        return new Response('OK', { headers: corsHeaders });
      }

      if (text.startsWith('/msg')) {
        const args = text.replace(/^\/msg\s*/, '').trim();
        if (!args) {
          await sendTelegram(chatId, '📝 Usage: /msg user@email.com Your message here\n\nExample:\n/msg john@gmail.com Hello, please check your KYC');
        } else {
          await handleAdminMessage(chatId, '/msg ' + args);
        }
        return new Response('OK', { headers: corsHeaders });
      }

      // Search commands - handle with or without arguments
      if (text === '/searchuser' || text.startsWith('/searchuser ')) {
        const query = text.replace(/^\/searchuser\s*/, '').trim();
        await handleSearchUsers(chatId, query);
        return new Response('OK', { headers: corsHeaders });
      }
      if (text === '/searchkyc' || text.startsWith('/searchkyc ')) {
        const query = text.replace(/^\/searchkyc\s*/, '').trim();
        await handleSearchKYC(chatId, query);
        return new Response('OK', { headers: corsHeaders });
      }
      if (text === '/searchlisting' || text.startsWith('/searchlisting ')) {
        const query = text.replace(/^\/searchlisting\s*/, '').trim();
        await handleSearchListings(chatId, query);
        return new Response('OK', { headers: corsHeaders });
      }
      if (text === '/searchpromo' || text.startsWith('/searchpromo ')) {
        const query = text.replace(/^\/searchpromo\s*/, '').trim();
        await handleSearchPromotions(chatId, query);
        return new Response('OK', { headers: corsHeaders });
      }

      // Export commands
      if (text === '/exportusers') { await handleExportUsers(chatId); return new Response('OK', { headers: corsHeaders }); }
      if (text === '/exportkyc') { await handleExportKYC(chatId); return new Response('OK', { headers: corsHeaders }); }
      if (text === '/exportlistings') { await handleExportListings(chatId); return new Response('OK', { headers: corsHeaders }); }
      if (text === '/exportpromos') { await handleExportPromotions(chatId); return new Response('OK', { headers: corsHeaders }); }

      // Paystack OTP commands
      if (text === '/disableotp') { await handleDisableOTP(chatId); return new Response('OK', { headers: corsHeaders }); }
      if (text === '/enableotp') { await handleEnableOTP(chatId); return new Response('OK', { headers: corsHeaders }); }
      if (text.startsWith('/confirmotp')) {
        const otp = text.replace(/^\/confirmotp\s*/, '').trim();
        await handleConfirmOTP(chatId, otp);
        return new Response('OK', { headers: corsHeaders });
      }
      if (text === '/search' || text.startsWith('/search ')) {
        const query = text.replace(/^\/search\s*/, '').trim();
        if (query) { await handleSearch(chatId, query); } else { await handleSearchHelp(chatId); }
        return new Response('OK', { headers: corsHeaders });
      }

      // Check reply mode
      const replyTarget = await getAdminReplyTarget(chatId);
      if (replyTarget) {
        const { data: link } = await supabase.from('telegram_user_links').select('chat_id').eq('user_id', replyTarget).eq('is_verified', true).single();
        if (link) {
          await sendTelegram(link.chat_id, `📩 <b>Message from Xavorian Support</b>\n\n${text}\n\n<i>Reply to respond.</i>`);
          await sendTelegram(chatId, '✅ Message sent. Type another message or /cancel to stop.');
        } else {
          await sendTelegram(chatId, '❌ User has not linked their Telegram. Use /cancel to exit messaging mode.');
        }
        return new Response('OK', { headers: corsHeaders });
      }

      // Menu button commands
      switch (text) {
        case '📊 Dashboard Stats': await handleDashboardStats(chatId); break;
        case '🔐 Pending KYC': await handlePendingKYC(chatId); break;
        case '🎫 Open Tickets': await handleOpenTickets(chatId); break;
        case '🏠 Recent Listings': await handleRecentListings(chatId); break;
        case '👤 Total Users': await handleTotalUsers(chatId); break;
        case '⭐ Active Promotions': await handleActivePromotions(chatId); break;
        case '🔍 Search Help': await handleSearchHelp(chatId); break;
        default:
          if (text.startsWith('/search ')) {
            await handleSearch(chatId, text.replace('/search ', ''));
          } else if (!text.startsWith('/')) {
            await handleSearch(chatId, text);
          } else {
            await sendTelegram(chatId, 'Unknown command. Use the menu buttons or:\n\n/searchuser, /searchkyc, /searchlisting, /searchpromo\n/exportusers, /exportkyc, /exportlistings, /exportpromos\n/msg email message');
          }
      }
    } else {
      // User commands
      const { data: userLink } = await supabase.from('telegram_user_links').select('user_id').eq('chat_id', chatId).eq('is_verified', true).single();
      
      if (userLink) {
        switch (text) {
          case '🏠 My Listings': case '/mylistings': await handleUserListings(chatId); break;
          case '📊 My Stats': case '/mystats': await handleUserStats(chatId); break;
          case '⭐ My Promotions': case '/mypromotions': await handleUserPromotions(chatId); break;
          case '🤝 My Offers': case '/myoffers': await handleUserOffers(chatId); break;
          case '💳 My Transactions': case '/mytransactions': await handleUserTransactions(chatId); break;
          case '💬 Support': case '/support':
            await sendTelegram(chatId, '💬 <b>Contact Support</b>\n\nType your message below and it will be forwarded to Xavorian Support.');
            break;
          case '/help':
            await sendTelegram(chatId, '📋 <b>Available Commands</b>\n\n/mylistings - View your property listings\n/mystats - See your account statistics\n/mypromotions - Check your promotions\n/myoffers - View your offers\n/mytransactions - View payment history\n/support - Contact support team\n/help - Show this help message\n\nOr use the menu buttons below!');
            break;
          default:
            if (!text.startsWith('/')) {
              await handleUserReplyToAdmin(chatId, text);
            } else {
              await sendTelegram(chatId, '📋 Unknown command. Type /help to see all available commands.');
            }
        }
      } else {
        // Not linked - treat as email for linking (case insensitive)
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
