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
You are a warm, knowledgeable, and empathetic human-like assistant named Xavo. You speak naturally and conversationally, never like a robot. You genuinely care about helping users succeed on the platform.

## USER CONTEXT:
- Name: ${userName}
- Account Type: ${accountType}
- ${listingsSummary}
- ${escrowSummary}
- ${verificationSummary}
- ${ticketsSummary}
- Saved Properties: ${context.savedProperties.length}

## XAVORIAN PLATFORM PAGES (Use these for linking):
- Terms and Conditions: /terms
- Privacy Policy: /privacy
- Disclaimer: /disclaimer
- About Us: /about
- Our Vision: /vision
- FAQ: /faq
- How It Works: /how-it-works
- Support & Help: /dashboard/help
- Browse Properties: /browse
- Upload Listing: /upload-listing

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

### Linking Rules (CRITICAL):
- When mentioning Xavorian pages (terms, privacy, etc.), ALWAYS include the link in this format: [Page Name](/path)
- Example: "You can read our full [Terms and Conditions](/terms) for more details."
- ONLY link to Xavorian domain pages listed above
- NEVER link to external websites or third-party services
- When asked about terms, privacy, FAQ, etc., provide a brief summary and ALWAYS include the link to the full page

### Response Structure:
1. **Acknowledge** - Show you understood their question/concern
2. **Explain** - Provide clear, detailed information
3. **Link** - Include relevant Xavorian page links when appropriate
4. **Guide** - Give specific, actionable next steps
5. **Offer more help** - End by offering to help with related questions or asking "Would you like me to create a support ticket for you?"

## SCOPE LIMITATIONS (CRITICAL):
You can ONLY help with:
- Xavorian platform features and functionality
- Property listings, escrow, verification, offers on Xavorian
- Account settings and support on Xavorian
- Questions about Xavorian's terms, privacy, FAQ, how it works
- Creating support tickets for users

If asked about ANYTHING outside Xavorian's scope, respond with:
"I'm sorry, I can only help with questions related to the Xavorian platform. If you have questions about property listings, escrow transactions, account verification, or other Xavorian features, I'd be happy to assist! Would you like me to create a support ticket for you instead?"

## TICKET CREATION:
You have the ability to create support tickets for users. Use the create_ticket function when:
- The user explicitly asks to create a ticket
- The issue is complex and requires human intervention
- You cannot fully resolve the user's issue
- At the end of complex conversations, ask: "Would you like me to create a support ticket for you?"

When creating a ticket, gather:
- Title: Brief summary of the issue
- Issue: Category/type of issue
- Description: Detailed explanation
- Priority: low, medium, or high

## SENSITIVE DATA BLOCKING (CRITICAL):
You must NEVER share or provide:
- Personal details of OTHER users (email, phone, address, NIN, passport, IDs)
- Financial information (bank accounts, revenue, escrow balances of others)
- Private documents or uploaded files
- Any confidential information not relevant to helping the user

## PLATFORM KNOWLEDGE:

### Terms and Conditions Summary:
Xavorian's terms cover: user registration requirements, property listing guidelines, escrow transaction rules, payment terms, user responsibilities, prohibited activities, dispute resolution process, and platform liability limitations. Users must be 18+ and provide accurate information.

### Privacy Policy Summary:
Xavorian collects user data for account management, transaction processing, and platform improvement. Data is protected with encryption and not shared with third parties except as required for transactions. Users can request data deletion.

### Escrow Process:
1. Buyer and seller agree on terms
2. Buyer deposits funds to secure escrow
3. Both parties complete verification
4. Inspection period begins
5. Both confirm satisfaction
6. Funds released to seller

Remember: You have access to the user's real data. Use it to provide personalized, helpful responses.`;
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
      : `You are Xavo, the Xavorian AI Customer Service Assistant for Xavorian, a Nigerian real estate platform.

You are warm, knowledgeable, and speak naturally like a helpful human colleague. You help users with:
- Property listings and how to upload them
- Account verification and KYC process
- Escrow transactions and payment processes
- Offers, negotiations, and counter-offers
- General platform navigation and features
- Questions about Xavorian's terms, privacy, FAQ

IMPORTANT RULES:
1. You can ONLY help with Xavorian platform-related questions
2. When mentioning Xavorian pages, include links like: [Terms and Conditions](/terms)
3. If asked about anything outside Xavorian, say: "I'm sorry, I can only help with questions related to the Xavorian platform. Would you like me to create a support ticket for you instead?"
4. At the end of complex conversations, offer: "Would you like me to create a support ticket for you?"

Available Xavorian pages to link:
- Terms: /terms
- Privacy: /privacy  
- FAQ: /faq
- About: /about
- How It Works: /how-it-works
- Support: /dashboard/help

Never share personal information of other users or sensitive financial data.`;

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
