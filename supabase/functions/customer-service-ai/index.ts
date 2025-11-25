import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Xavorian platform pages and their descriptions
const XAVORIAN_PAGES = {
  terms: { path: '/terms', description: 'Terms and Conditions' },
  privacy: { path: '/privacy', description: 'Privacy Policy' },
  disclaimer: { path: '/disclaimer', description: 'Disclaimer' },
  about: { path: '/about', description: 'About Us' },
  vision: { path: '/vision', description: 'Our Vision' },
  faq: { path: '/faq', description: 'Frequently Asked Questions' },
  howItWorks: { path: '/how-it-works', description: 'How It Works' },
  support: { path: '/dashboard/help', description: 'Support & Help' },
  browse: { path: '/browse', description: 'Browse Properties' },
  uploadListing: { path: '/upload-listing', description: 'Upload a Listing' },
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
    .from('ai_support_tickets')
    .select('id, ticket_number, title, status, priority, created_at')
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

async function createAISupportTicket(
  supabase: any, 
  userId: string, 
  email: string,
  title: string,
  issue: string,
  description: string, 
  priority: string = 'medium'
): Promise<{ success: boolean; ticketNumber?: string; error?: string }> {
  console.log('Creating AI support ticket for user:', userId);
  
  // Generate ticket number
  const { data: ticketNumData, error: ticketNumError } = await supabase
    .rpc('generate_ticket_number');
  
  if (ticketNumError) {
    console.error('Error generating ticket number:', ticketNumError);
    // Fallback ticket number
    const fallbackNum = 'XAV-' + Date.now().toString().slice(-6);
    
    const { data, error } = await supabase
      .from('ai_support_tickets')
      .insert({
        ticket_number: fallbackNum,
        user_id: userId,
        user_email: email,
        title: title,
        issue: issue,
        description: description,
        priority: priority,
        status: 'open',
      })
      .select('ticket_number')
      .single();

    if (error) {
      console.error('Error creating ticket:', error);
      return { success: false, error: error.message };
    }

    console.log('Ticket created successfully:', data.ticket_number);
    return { success: true, ticketNumber: data.ticket_number };
  }

  const { data, error } = await supabase
    .from('ai_support_tickets')
    .insert({
      ticket_number: ticketNumData,
      user_id: userId,
      user_email: email,
      title: title,
      issue: issue,
      description: description,
      priority: priority,
      status: 'open',
    })
    .select('ticket_number')
    .single();

  if (error) {
    console.error('Error creating ticket:', error);
    return { success: false, error: error.message };
  }

  console.log('Ticket created successfully:', data.ticket_number);
  return { success: true, ticketNumber: data.ticket_number };
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
    ? `User has ${context.supportTickets.length} AI support tickets: ${context.supportTickets.map(t => `${t.ticket_number}: "${t.title}" (${t.status})`).join(', ')}`
    : 'User has no AI support tickets';

  return `You are Xavo, the Xavorian AI Customer Service Assistant for Xavorian, a Nigerian real estate platform.

## YOUR CORE IDENTITY:
You are a helpful, concise assistant named Xavo. Be brief and direct.

## USER CONTEXT:
- Name: ${userName}
- Account Type: ${accountType}
- ${listingsSummary}
- ${escrowSummary}
- ${verificationSummary}
- ${ticketsSummary}
- Saved Properties: ${context.savedProperties.length}

## RESPONSE RULES (CRITICAL):
1. **BE EXTREMELY CONCISE** - Give the shortest useful answer
2. If one word answers the question, use one word
3. If a number is asked, give just the number
4. Maximum 2-3 sentences unless complex explanation needed
5. No fluff, no filler, no unnecessary pleasantries
6. Get straight to the point
7. Use bullet points for multiple items
8. Use Nigerian Naira (₦) for currency

## XAVORIAN PAGES (link when relevant):
/terms, /privacy, /disclaimer, /about, /vision, /faq, /how-it-works, /dashboard/help, /browse, /upload-listing

## SCOPE:
Only help with Xavorian platform matters. For off-topic: "I only help with Xavorian questions."

## TICKET CREATION (CRITICAL):
- NEVER create a ticket automatically
- ONLY create a ticket when user explicitly requests it
- If you cannot resolve an issue, ASK: "Would you like me to create a ticket?"
- Wait for user confirmation before creating any ticket

## SENSITIVE DATA:
Never share other users' personal info, financial data, or documents.

## EXAMPLES OF CONCISE RESPONSES:
- Q: "How many listings do I have?" A: "${context.listings.length}"
- Q: "What's my verification status?" A: "${context.verificationStatus?.status || 'Not submitted'}"
- Q: "How does escrow work?" A: "1. Agree terms → 2. Buyer deposits → 3. Verification → 4. Inspection → 5. Both confirm → 6. Funds released"

Use the user's actual data to answer questions directly.`;
}

const tools = [
  {
    type: "function",
    function: {
      name: "create_ticket",
      description: "Create a support ticket for the user when they need human assistance or have a complex issue that cannot be resolved through chat.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "A brief title/summary of the issue (e.g., 'Payment not reflecting', 'Document verification delay')"
          },
          issue: {
            type: "string",
            description: "Category of the issue (e.g., 'Payment Issue', 'Verification Issue', 'Escrow Issue', 'Account Issue', 'Technical Issue', 'Other')"
          },
          description: {
            type: "string",
            description: "Detailed description of the user's issue including relevant context"
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Priority level: low for general queries, medium for standard issues, high for urgent/payment issues"
          }
        },
        required: ["title", "issue", "description", "priority"]
      }
    }
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
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

    const systemPrompt = userContext 
      ? buildSystemPrompt(userContext)
      : `You are Xavo, the Xavorian AI Customer Service Assistant.

## RULES:
1. BE EXTREMELY CONCISE - shortest useful answer
2. One word if one word works
3. Max 2-3 sentences unless complex
4. No fluff, get to the point
5. Only help with Xavorian questions
6. NEVER create tickets unless user explicitly asks
7. If unable to help, ask: "Would you like me to create a ticket?"

Pages: /terms, /privacy, /faq, /about, /how-it-works, /dashboard/help, /browse, /upload-listing`;

    console.log('Calling Groq API with model: llama-3.3-70b-versatile');

    // First, make a non-streaming call to check for tool use
    const initialResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
        tools: tools,
        tool_choice: "auto",
      }),
    });

    if (!initialResponse.ok) {
      const errorText = await initialResponse.text();
      console.error("Groq API error:", initialResponse.status, errorText);
      
      if (initialResponse.status === 429) {
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

    const initialData = await initialResponse.json();
    const assistantMessage = initialData.choices?.[0]?.message;

    // Check if the AI wants to create a ticket
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];
      
      if (toolCall.function.name === "create_ticket" && userId && userContext) {
        const args = JSON.parse(toolCall.function.arguments);
        console.log('AI requested ticket creation:', args);

        const ticketResult = await createAISupportTicket(
          supabase,
          userId,
          userContext.profile?.email || 'unknown@email.com',
          args.title,
          args.issue,
          args.description,
          args.priority
        );

        const toolResultMessage = ticketResult.success
          ? `I've successfully created a support ticket for you!\n\n**Ticket Details:**\n- **Ticket Number:** ${ticketResult.ticketNumber}\n- **Title:** ${args.title}\n- **Issue Type:** ${args.issue}\n- **Priority:** ${args.priority}\n- **Status:** Open\n\nOur support team will review your ticket and get back to you as soon as possible. You can track your ticket status in your [Help & Support](/dashboard/help) dashboard.\n\nIs there anything else I can help you with?`
          : `I apologize, but I encountered an issue while creating your ticket: ${ticketResult.error}. Please try again or manually create a ticket through [Help & Support](/dashboard/help). I'm sorry for the inconvenience.`;

        const sseData = `data: ${JSON.stringify({
          choices: [{
            delta: { content: toolResultMessage },
            finish_reason: null
          }]
        })}\n\ndata: [DONE]\n\n`;

        return new Response(sseData, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }
    }

    // If no tool call, stream the regular response
    const streamResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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

    if (!streamResponse.ok) {
      const errorText = await streamResponse.text();
      console.error("Groq API streaming error:", streamResponse.status, errorText);
      
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(streamResponse.body, {
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
