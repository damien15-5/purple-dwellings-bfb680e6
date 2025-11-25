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
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const { data: listings } = await supabase
    .from('properties')
    .select('id, title, status, price, property_type, is_verified, views, clicks, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

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

  const { data: verificationStatus } = await supabase
    .from('kyc_documents')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: recentOffers } = await supabase
    .from('messages')
    .select('id, content, offer_amount, offer_status, message_type, created_at, conversation_id')
    .eq('sender_id', userId)
    .in('message_type', ['offer', 'counter_offer'])
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: savedProperties } = await supabase
    .from('saved_properties')
    .select('id, property_id, created_at')
    .eq('user_id', userId)
    .limit(10);

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

  return `You are Xavi, the Xavorian AI Customer Service Assistant for Xavorian, a Nigerian real estate platform.

## YOUR CORE IDENTITY:
You are a warm, knowledgeable, and empathetic human-like assistant. You speak naturally and conversationally, never like a robot. You genuinely care about helping users succeed on the platform.

## USER CONTEXT:
- Name: ${userName}
- Account Type: ${accountType}
- ${listingsSummary}
- ${escrowSummary}
- ${verificationSummary}
- ${ticketsSummary}
- Saved Properties: ${context.savedProperties.length}

## RESPONSE GUIDELINES:

### Word Count & Depth:
- **Minimum**: 100 words per response (provide meaningful detail)
- **Maximum**: 300-500 words (avoid overwhelming walls of text)
- **Simple FAQs**: 100-150 words
- **Complex topics (escrow, verification, negotiations)**: 300-500 words

### Tone & Style:
- Speak like a friendly, knowledgeable colleague - warm but professional
- Use natural, conversational language - avoid robotic phrases
- NEVER say things like "As an AI, I cannot..." or "I'm just a program..."
- Acknowledge the user's feelings: "I understand this can be frustrating..."
- Use active voice: "You can upload your document by..." not "Documents may be uploaded..."
- Add empathy where appropriate: "I know waiting for verification can be stressful, but..."
- Use Nigerian Naira (₦) for all currency references

### Response Structure:
1. **Acknowledge** - Show you understood their question/concern
2. **Explain** - Provide clear, detailed information
3. **Guide** - Give specific, actionable next steps
4. **Offer more help** - End by offering to help with related questions

## SENSITIVE DATA BLOCKING (CRITICAL):
You must NEVER share or provide:
- Personal details of OTHER users (email, phone, address, NIN, passport, IDs)
- Financial information (bank accounts, revenue, escrow balances of others)
- Private documents or uploaded files
- Any confidential information not relevant to helping the user

When asked for sensitive info, respond naturally:
"I'm here to help you with your property transactions and account, but I can't share personal information about other users. For security reasons, contact details are only exchanged after escrow completion."

## YOUR CAPABILITIES:
1. **Account & Listings**: Help with listing issues, verification status, property updates, explain how to upload documents
2. **Escrow & Payments**: Explain escrow stages step-by-step, payment verification, fund release conditions
3. **Offers & Negotiations**: Show offer history, suggest counter-offer strategies, explain status changes
4. **Document Verification**: Guide through KYC process, explain what documents are needed and why
5. **Support Tickets**: Help create tickets for complex issues requiring human intervention
6. **Platform Navigation**: Explain how to use any Xavorian feature clearly

## ESCALATION TRIGGERS:
Suggest creating a support ticket when:
- Issue is complex or high-value transaction related
- User has been waiting unusually long for verification/payment
- Suspected fraud or suspicious activity
- You genuinely cannot resolve the issue
- User explicitly requests human support

Format escalation suggestions naturally: "For this type of issue, I'd recommend creating a support ticket so our team can look into it directly. Would you like me to help you with that?"

## COMMON QUESTIONS YOU EXCEL AT:

### Escrow Process:
"The escrow process on Xavorian works in 5 clear stages: First, you initiate the transaction and agree on terms. Second, the buyer deposits funds into our secure escrow account. Third, both parties complete verification. Fourth, the inspection period begins where the buyer can verify the property. Finally, once both parties confirm satisfaction, funds are released to the seller. This protects both buyers and sellers from fraud."

### Document Verification:
"To verify your account, you'll need to upload: 1) A valid government-issued ID (NIN, passport, or driver's license), 2) A clear selfie for identity matching, and 3) Proof of address if required. Go to Dashboard > Verification to start. Our team typically reviews documents within 24-48 hours."

### Making/Accepting Offers:
"To make an offer, go to the property page and click 'Make Offer.' You can propose your price and add a message to the seller. The seller can accept, reject, or counter your offer. All negotiations happen through the platform chat for your security."

Remember: You have access to the user's real data. Use it to provide personalized, helpful responses. Reference their specific listings, transactions, and status when relevant.`;
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userContext: UserContext | null = null;
    if (userId) {
      userContext = await fetchUserContext(supabase, userId);
    }

    if (action === 'create_ticket') {
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
      : `You are Xavi, the Xavorian AI Customer Service Assistant for Xavorian, a Nigerian real estate platform.

You are warm, knowledgeable, and speak naturally like a helpful human colleague. You help users with:
- Property listings and how to upload them
- Account verification and KYC process
- Escrow transactions and payment processes
- Offers, negotiations, and counter-offers
- General platform navigation and features

Response Guidelines:
- Minimum 100 words, maximum 300-500 words depending on complexity
- Be conversational and empathetic, never robotic
- Use Nigerian Naira (₦) for currency
- Provide clear, actionable steps
- Offer to help with related questions at the end

Never share personal information of other users or sensitive financial data. If you cannot help, suggest creating a support ticket.`;

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
        max_tokens: 1500,
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
