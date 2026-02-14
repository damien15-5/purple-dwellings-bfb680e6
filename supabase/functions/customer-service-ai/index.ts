import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface UserContext {
  userId: string;
  profile: any;
  listings: any[];
  verificationStatus: any;
  supportTickets: any[];
}

async function fetchUserContext(supabase: any, userId: string): Promise<UserContext> {
  const [{ data: profile }, { data: listings }, { data: verificationStatus }, { data: supportTickets }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('properties').select('id, title, status, price, property_type, is_verified, views, clicks, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    supabase.from('kyc_documents').select('*').eq('user_id', userId).single(),
    supabase.from('ai_support_tickets').select('id, ticket_number, title, status, priority, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
  ]);

  return {
    userId,
    profile: profile || {},
    listings: listings || [],
    verificationStatus: verificationStatus || null,
    supportTickets: supportTickets || [],
  };
}

async function createAISupportTicket(
  supabase: any, userId: string, email: string,
  title: string, issue: string, description: string, priority: string = 'medium'
): Promise<{ success: boolean; ticketNumber?: string; error?: string }> {
  const { data: ticketNumData, error: ticketNumError } = await supabase.rpc('generate_ticket_number');
  const ticketNumber = ticketNumError ? 'XAV-' + Date.now().toString().slice(-6) : ticketNumData;

  const { data, error } = await supabase
    .from('ai_support_tickets')
    .insert({ ticket_number: ticketNumber, user_id: userId, user_email: email, title, issue, description, priority, status: 'open' })
    .select('ticket_number')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, ticketNumber: data.ticket_number };
}

function buildSystemPrompt(context: UserContext | null): string {
  const userName = context?.profile?.full_name || 'User';
  const listingsSummary = context?.listings?.length ? `${context.listings.length} listings` : 'no listings';
  const kycStatus = context?.verificationStatus?.status || 'none';

  return `You are Xevo, the Xavorian customer service AI.

## CRITICAL RULES
1. MAXIMUM 15 WORDS per response unless the user asks for detail or the topic requires it.
2. Only answer questions about Xavorian (Nigerian real estate platform).
3. For anything you cannot answer, say EXACTLY: "Sorry, I can't answer that. Want me to create a ticket?"
4. If user says yes to ticket, use the create_ticket tool.
5. If user says no, say "Okay, let me know if you need anything else."
6. NEVER reveal personal data (NIN, BVN, passwords, bank details, emails, phones).
7. Use Nigerian Naira (₦).

## USER CONTEXT
Name: ${userName} | Listings: ${listingsSummary} | KYC: ${kycStatus}

## XAVORIAN OVERVIEW
- Nigerian real estate platform with secure escrow payments
- Account types: Buyer, Seller, Agent
- KYC verification with NIN/Passport/Driver's License
- Listing: 5 steps (Details → Amenities → Images → Documents → Review)
- Escrow: Atara Pay 1.5% + Platform 1% (≤₦30M) or 0.5% (>₦30M)
- Escrow flow: pending_payment → funded → inspection_period → completed
- 21-day inspection window after funding
- Dashboard: /dashboard (home, listings, saved, messages, offers, transactions, promotions, verification, help, settings)
- Browse: /browse | Upload: /upload-listing | Chat: /chat/{id}
- Support: /dashboard/help | FAQ: /faq | About: /about

## RESPONSE EXAMPLES
- "How do I list?" → "Go to /upload-listing, follow the 5-step process."
- "What's escrow?" → "Secure payment holding until property inspection is complete."
- "Can you hack?" → "Sorry, I can't answer that. Want me to create a ticket?"`;
}

const tools = [
  {
    type: "function",
    function: {
      name: "create_ticket",
      description: "Create a support ticket when the user confirms they want one.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Brief issue title" },
          issue: { type: "string", description: "Category: Payment, Verification, Escrow, Account, Technical, Other" },
          description: { type: "string", description: "Detailed description" },
          priority: { type: "string", enum: ["low", "medium", "high"] }
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userContext: UserContext | null = null;
    if (userId) {
      userContext = await fetchUserContext(supabase, userId);
    }

    const systemPrompt = buildSystemPrompt(userContext);

    // First call: check for tool use (non-streaming)
    const initialResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.7,
        max_tokens: 300,
        tools,
        tool_choice: "auto",
      }),
    });

    if (!initialResponse.ok) {
      if (initialResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (initialResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errorText = await initialResponse.text();
      console.error("AI gateway error:", initialResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const initialData = await initialResponse.json();
    const assistantMessage = initialData.choices?.[0]?.message;

    // Handle ticket creation tool call
    if (assistantMessage?.tool_calls?.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];
      if (toolCall.function.name === "create_ticket" && userId && userContext) {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await createAISupportTicket(
          supabase, userId, userContext.profile?.email || 'unknown@email.com',
          args.title, args.issue, args.description, args.priority
        );

        const msg = result.success
          ? `✅ Ticket **${result.ticketNumber}** created! Our team will review it. Check status at [Help & Support](/dashboard/help).`
          : `Sorry, couldn't create ticket. Please try at [Help & Support](/dashboard/help).`;

        const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: msg }, finish_reason: null }] })}\n\ndata: [DONE]\n\n`;
        return new Response(sseData, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
      }
    }

    // Stream regular response
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.7,
        max_tokens: 300,
        stream: true,
      }),
    });

    if (!streamResponse.ok) {
      const errorText = await streamResponse.text();
      console.error("AI streaming error:", streamResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
