import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserContext {
  userId: string;
  profile: any;
  listings: any[];
  escrowTransactions: any[];
  verificationStatus: any;
  recentOffers: any[];
  savedProperties: any[];
  supportTickets: any[];
}

async function fetchUserContext(supabase: any, userId: string): Promise<UserContext> {
  console.log('Fetching context for user:', userId);
  
  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // Fetch user's listings
  const { data: listings } = await supabase
    .from('properties')
    .select('id, title, status, price, property_type, is_verified, views, clicks, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch user's escrow transactions (as buyer or seller)
  const { data: escrowTransactions } = await supabase
    .from('escrow_transactions')
    .select(`
      id, status, transaction_amount, total_amount, offer_status, offer_amount,
      created_at, buyer_confirmed, seller_confirmed, payment_verified_at,
      property_id
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch KYC/verification status
  const { data: verificationStatus } = await supabase
    .from('kyc_documents')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Fetch recent offers/messages with offer content
  const { data: recentOffers } = await supabase
    .from('messages')
    .select('id, content, offer_amount, offer_status, message_type, created_at, conversation_id')
    .eq('sender_id', userId)
    .in('message_type', ['offer', 'counter_offer'])
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch saved properties
  const { data: savedProperties } = await supabase
    .from('saved_properties')
    .select('id, property_id, created_at')
    .eq('user_id', userId)
    .limit(10);

  // Fetch support tickets
  const { data: supportTickets } = await supabase
    .from('customer_service_tickets')
    .select('id, subject, status, priority, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    userId,
    profile: profile || {},
    listings: listings || [],
    escrowTransactions: escrowTransactions || [],
    verificationStatus: verificationStatus || null,
    recentOffers: recentOffers || [],
    savedProperties: savedProperties || [],
    supportTickets: supportTickets || [],
  };
}

function buildSystemPrompt(context: UserContext): string {
  const userName = context.profile?.full_name || 'User';
  const accountType = context.profile?.account_type || 'buyer';
  
  const listingsSummary = context.listings.length > 0
    ? `User has ${context.listings.length} listings: ${context.listings.map(l => `"${l.title}" (${l.status}, ${l.is_verified ? 'verified' : 'unverified'})`).join(', ')}`
    : 'User has no listings';

  const escrowSummary = context.escrowTransactions.length > 0
    ? `User has ${context.escrowTransactions.length} escrow transactions: ${context.escrowTransactions.map(e => `Status: ${e.status}, Amount: ₦${e.total_amount?.toLocaleString()}`).join('; ')}`
    : 'User has no escrow transactions';

  const verificationSummary = context.verificationStatus
    ? `Verification status: ${context.verificationStatus.status} (${context.verificationStatus.identity_type || 'Unknown document type'})`
    : 'User has not submitted verification documents';

  const ticketsSummary = context.supportTickets.length > 0
    ? `User has ${context.supportTickets.length} support tickets: ${context.supportTickets.map(t => `"${t.subject}" (${t.status})`).join(', ')}`
    : 'User has no open support tickets';

  return `You are Xavi, the Xavorian AI Customer Service Assistant for Xavorian, a Nigerian real estate platform. You provide helpful, accurate, and personalized support.

## User Context:
- Name: ${userName}
- Account Type: ${accountType}
- Email: ${context.profile?.email || 'Not provided'}
- Phone: ${context.profile?.phone || 'Not provided'}

## User's Platform Data:
- ${listingsSummary}
- ${escrowSummary}
- ${verificationSummary}
- ${ticketsSummary}
- Saved Properties: ${context.savedProperties.length}

## Your Capabilities:
1. **Account & Listings**: Help with listing issues, verification status, property updates
2. **Escrow & Payments**: Explain escrow stages, payment verification, fund release conditions
3. **Offers & Negotiations**: Show offer history, suggest counter-offers, explain status changes
4. **Document Verification**: Guide through KYC process, explain verification requirements
5. **Support Tickets**: Help create tickets for complex issues
6. **Platform Guidance**: Explain how to use Xavorian features

## Important Rules:
1. NEVER share personal contact information (phone, email, WhatsApp) until escrow is complete
2. Always be polite, professional, and helpful
3. Use Nigerian Naira (₦) for currency
4. If you cannot help, suggest creating a support ticket
5. For complex or high-value transaction issues, recommend human support
6. Be concise but thorough in explanations
7. Reference user's actual data when relevant

## Response Format:
- Keep responses conversational and friendly
- Use bullet points for lists
- Bold important information
- If suggesting an action, be specific about next steps
- If there's an issue requiring escalation, clearly state: "[ESCALATE] Reason for escalation"

## Common FAQs You Can Answer:
- How does escrow work on Xavorian?
- How do I verify my account?
- What documents are needed for listing?
- How do I make/accept an offer?
- When are funds released from escrow?
- How do I contact the seller/buyer?
- What fees does Xavorian charge?

Remember: You have access to the user's real data. Use it to provide personalized, helpful responses.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId, action } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user context if userId is provided
    let userContext: UserContext | null = null;
    if (userId) {
      userContext = await fetchUserContext(supabase, userId);
    }

    // Handle special actions
    if (action === 'create_ticket') {
      // Return ticket creation prompt
      return new Response(
        JSON.stringify({ 
          type: 'action',
          action: 'create_ticket',
          message: 'I\'ll help you create a support ticket. What issue would you like to report?'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = userContext 
      ? buildSystemPrompt(userContext)
      : `You are Xavi, the Xavorian AI Customer Service Assistant for Xavorian, a Nigerian real estate platform. Help users with general questions about the platform, escrow process, property listings, and account setup. Be friendly and professional.`;

    console.log('Calling Groq API with model: llama-3.3-70b-versatile');

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream the response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Customer service AI error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
