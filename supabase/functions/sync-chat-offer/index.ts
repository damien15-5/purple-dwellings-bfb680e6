import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type CreateOfferPayload = {
  action: 'create_offer';
  conversationId: string;
  amount: number;
  message?: string;
};

type UpdateOfferStatusPayload = {
  action: 'update_offer_status';
  conversationId: string;
  messageId: string;
  status: 'accepted' | 'rejected';
  amount?: number;
};

type Payload = CreateOfferPayload | UpdateOfferStatusPayload;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: Payload = await req.json();

    if (payload.action === 'create_offer') {
      const { conversationId, amount } = payload;
      const trimmedMessage = payload.message?.trim() || '';

      if (!conversationId || !Number.isFinite(amount) || amount <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid offer payload' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: conversation, error: conversationError } = await admin
        .from('conversations')
        .select('id, property_id, buyer_id, seller_id')
        .eq('id', conversationId)
        .maybeSingle();

      if (conversationError || !conversation) {
        return new Response(JSON.stringify({ error: 'Conversation not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const isParticipant = userId === conversation.buyer_id || userId === conversation.seller_id;
      if (!isParticipant) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const recipientId = userId === conversation.buyer_id ? conversation.seller_id : conversation.buyer_id;

      const { data: property } = await admin
        .from('properties')
        .select('user_id, title')
        .eq('id', conversation.property_id)
        .maybeSingle();

      if (property?.user_id === userId) {
        return new Response(JSON.stringify({ error: 'You cannot make an offer on your own property.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const content =
        trimmedMessage || `I'd like to make an offer of ₦${amount.toLocaleString()} for this property.`;

      const { data: offerMessage, error: msgError } = await admin
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content,
          message_type: 'offer',
          offer_amount: amount,
          offer_status: 'pending',
        })
        .select('id')
        .single();

      if (msgError || !offerMessage) {
        return new Response(JSON.stringify({ error: msgError?.message || 'Failed to create offer message' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: escrowRow, error: escrowInsertError } = await admin
        .from('escrow_transactions')
        .insert({
          property_id: conversation.property_id,
          buyer_id: userId,
          seller_id: recipientId,
          transaction_amount: amount,
          escrow_fee: 0,
          total_amount: amount,
          status: 'pending_payment',
          offer_amount: amount,
          offer_status: 'pending',
          offer_message: content,
          platform_fee: 0,
          atara_fee: 0,
          payment_method: 'direct',
        })
        .select('id')
        .single();

      if (escrowInsertError || !escrowRow) {
        await admin.from('messages').delete().eq('id', offerMessage.id);

        return new Response(
          JSON.stringify({ error: escrowInsertError?.message || 'Failed to save offer transaction record' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      await admin
        .from('conversations')
        .update({
          last_message: `New offer: ₦${amount.toLocaleString()}`,
          last_message_time: new Date().toISOString(),
        })
        .eq('id', conversationId);

      await admin.rpc('create_notification', {
        p_user_id: recipientId,
        p_title: 'New Offer Received',
        p_description: `You received an offer of ₦${amount.toLocaleString()} for ${property?.title || 'a property'}`,
        p_type: 'offer',
      });

      return new Response(
        JSON.stringify({ success: true, messageId: offerMessage.id, escrowId: escrowRow.id }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (payload.action === 'update_offer_status') {
      const { conversationId, messageId, status, amount } = payload;

      if (!conversationId || !messageId || !['accepted', 'rejected'].includes(status)) {
        return new Response(JSON.stringify({ error: 'Invalid status update payload' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: conversation, error: conversationError } = await admin
        .from('conversations')
        .select('id, property_id, buyer_id, seller_id')
        .eq('id', conversationId)
        .maybeSingle();

      if (conversationError || !conversation) {
        return new Response(JSON.stringify({ error: 'Conversation not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const isParticipant = userId === conversation.buyer_id || userId === conversation.seller_id;
      if (!isParticipant) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: offerMessage, error: offerMessageError } = await admin
        .from('messages')
        .select('id, sender_id, offer_amount, message_type')
        .eq('id', messageId)
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (offerMessageError || !offerMessage || offerMessage.message_type !== 'offer') {
        return new Response(JSON.stringify({ error: 'Offer message not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (offerMessage.sender_id === userId) {
        return new Response(JSON.stringify({ error: 'You cannot respond to your own offer' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const resolvedAmount = Number(offerMessage.offer_amount ?? amount ?? 0);

      if (!Number.isFinite(resolvedAmount) || resolvedAmount <= 0) {
        return new Response(JSON.stringify({ error: 'Invalid offer amount' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await admin
        .from('messages')
        .update({ offer_status: status })
        .eq('id', messageId);

      await admin.from('messages').insert({
        conversation_id: conversationId,
        sender_id: userId,
        content:
          status === 'accepted'
            ? `Offer of ₦${resolvedAmount.toLocaleString()} has been accepted!`
            : `Offer of ₦${resolvedAmount.toLocaleString()} has been rejected.`,
        message_type: status === 'accepted' ? 'accept' : 'reject',
      });

      const { data: escrowToUpdate } = await admin
        .from('escrow_transactions')
        .select('id')
        .eq('property_id', conversation.property_id)
        .eq('offer_amount', resolvedAmount)
        .eq('buyer_id', offerMessage.sender_id)
        .eq('seller_id', userId)
        .in('offer_status', ['pending', 'none'])
        .eq('status', 'pending_payment')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (escrowToUpdate?.id) {
        await admin
          .from('escrow_transactions')
          .update({
            offer_status: status,
            seller_responded_at: new Date().toISOString(),
            seller_response: status,
          })
          .eq('id', escrowToUpdate.id);
      }

      await admin
        .from('conversations')
        .update({
          last_message: status === 'accepted' ? `Offer accepted: ₦${resolvedAmount.toLocaleString()}` : 'Offer rejected',
          last_message_time: new Date().toISOString(),
        })
        .eq('id', conversationId);

      await admin.rpc('create_notification', {
        p_user_id: offerMessage.sender_id,
        p_title: status === 'accepted' ? 'Offer Accepted' : 'Offer Rejected',
        p_description:
          status === 'accepted'
            ? `Your offer of ₦${resolvedAmount.toLocaleString()} has been accepted.`
            : `Your offer of ₦${resolvedAmount.toLocaleString()} has been rejected.`,
        p_type: status === 'accepted' ? 'offer_accepted' : 'offer_rejected',
      });

      return new Response(JSON.stringify({ success: true, status }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unsupported action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('sync-chat-offer error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
