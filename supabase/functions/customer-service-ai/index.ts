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

  return `You are Xavo, the Xavorian Customer Service AI.

## ABOUT XAVORIAN
Xavorian is a Nigerian real estate escrow platform founded by Ezeani Chukwuebuka (CEO/Founder). The platform prevents scams in property transactions by providing secure escrow services, verified listings, and a safe marketplace for buyers and sellers. Currency: Nigerian Naira (₦).

## YOUR IDENTITY
- Name: Xavo
- Role: Customer Service AI for Xavorian
- Purpose: Help users navigate the platform, answer questions, resolve issues, and ensure safe transactions

## USER CONTEXT
- Name: ${userName}
- Account Type: ${accountType} (buyer = can browse/buy, seller = can list/sell, agent = can do both)
- ${listingsSummary}
- ${escrowSummary}
- ${verificationSummary}
- ${ticketsSummary}
- Saved Properties: ${context.savedProperties.length}

## COMPLETE PLATFORM KNOWLEDGE

### ACCOUNT TYPES
1. **Buyer**: Can browse properties, save favorites, message sellers, make offers, and purchase via escrow
2. **Seller**: Can list properties, upload documents, receive offers, negotiate, and receive payments via escrow
3. **Agent**: Has both buyer and seller capabilities

### USER REGISTRATION & KYC
1. User signs up with: Full name (as on ID), email, age (must be 18+), password, account type
2. After signup, optional KYC verification: Submit identity document (NIN, Passport, or Driver's License) with ID number
3. KYC status: pending → verified OR failed. Users can skip KYC initially and complete later from /dashboard/verification
4. Google OAuth login/signup is also available

### PROPERTY LISTING FLOW (For Sellers)
**Step 1 - Basic Details** (required):
- Property type: House, Apartment, Villa, Land, Others
- Listing type: Sale or Rent
- Location: State, City, Street, Google Maps link
- Price, Size (sqft)
- Description

**Step 2 - Amenities**:
- Bedrooms, Bathrooms, Toilets, Kitchens, Parking spaces
- Features: Balcony, Wardrobes, POP ceiling, Water/Power supply, Security, CCTV, Gatehouse
- Premium: Swimming pool, Gym, Elevator, Accessibility, Pet-friendly, Internet, Playground
- Finishing: Flooring type, Kitchen type, AC, Water heater
- For rentals: Daily/Weekly/Monthly prices, Service fee, Rent duration

**Step 3 - Images** (required):
- Minimum 3 images required
- Optional: 1 video (max 5MB)
- Images are optimized to WebP format automatically

**Step 4 - Documents** (Sale listings only):
- Required: At least 3 documents
- Document types: Certificate of Occupancy (C of O), Deed of Assignment, Survey Plan, Land Title, Building Approval, Tax Clearance
- Receipt required for non-land properties

**Step 5 - Review & Publish**:
- Review all details before publishing
- Status becomes "published" and property appears on /browse

### PROPERTY BROWSING (For Buyers)
- Browse at /browse with filters: price range, property type, bedrooms, bathrooms, location, verified only
- View modes: Grid or List
- Property details page shows: images, video, description, amenities, seller info
- Actions: Save to favorites, Share, Message Seller, Make Payment (start escrow)

### MESSAGING SYSTEM
- Chat between buyer and seller at /chat/{propertyId}
- Features: Text messages, Image/Video sharing (2MB images, 5MB videos)
- Contact information (phone, email) is automatically filtered for security
- Offer system: Buyer can send offers with custom amounts
- Seller can Accept or Reject offers
- Real-time messaging with notifications

### OFFER & NEGOTIATION FLOW
1. Buyer sends offer with amount and optional message
2. Seller receives notification
3. Seller can Accept (creates escrow with offer amount) or Reject
4. If accepted, buyer proceeds to payment
5. Counter-offers possible through chat

### ESCROW PAYMENT FLOW (CRITICAL)
**Payment Methods:**
1. **Escrow via Atara Pay** (Recommended, Secure):
   - Funds held safely until property verification complete
   - Full platform protection
   - Fees: Atara Pay Fee (1.5%) + Platform Fee (1% for <₦30M, 0.5% for >₦30M)

2. **Direct to Seller** (Not recommended):
   - Same fees apply but no escrow protection
   - Higher risk - funds go directly to seller

**Payment Timing:**
- Pay Now: Redirects to Paystack immediately
- Pay Later: Creates pending transaction, pay from /dashboard/escrow

**Escrow Statuses:**
- pending_payment: Waiting for buyer payment
- funded: Payment received, funds held
- inspection_period: 21-day inspection window (buyer can inspect property/documents)
- completed: Both parties confirmed, funds released to seller
- disputed: Issue raised, under review
- cancelled: Transaction cancelled
- refunded: Funds returned to buyer

**Confirmation Process:**
- Buyer confirms after property inspection and document verification
- Seller confirms delivery
- Both confirmations required to release funds

### DASHBOARD SECTIONS (/dashboard/*)
- **Home** (/dashboard): Overview stats, quick actions
- **My Listings** (/dashboard/my-listings): Manage your properties
- **Saved Properties** (/dashboard/saved): Favorited properties
- **Messages** (/dashboard/messages): All conversations
- **Offers & Negotiations** (/dashboard/offers): Track offers
- **Escrow Transactions** (/dashboard/escrow): All escrow payments
- **Verification** (/dashboard/verification): KYC status
- **Documents** (/dashboard/documents): Uploaded documents
- **Help & Support** (/dashboard/help): Support tickets
- **Settings** (/dashboard/settings): Account settings
- **Notifications** (/dashboard/notifications): All notifications

### IMPORTANT PLATFORM PAGES
- / (Home): Search, featured properties, recommendations
- /browse: All published properties with filters
- /property/{id}: Property details
- /chat/{propertyId}: Message seller
- /start-escrow/{propertyId}: Make payment
- /upload-listing: Create new listing
- /login, /signup: Authentication
- /how-it-works: Platform guide for buyers and sellers
- /about: About Xavorian
- /faq: Frequently asked questions
- /terms, /privacy, /disclaimer: Legal pages

### FEE STRUCTURE
- Atara Pay Fee: 1.5% of transaction amount
- Platform Fee: 1% (amounts ≤₦30M) or 0.5% (amounts >₦30M)
- Fees paid by buyer on top of property price
- Example: ₦50M property = ₦50M + ₦750K (Atara) + ₦250K (Platform) = ₦51M total

### DISPUTE HANDLING
- Disputes can be raised during escrow
- Admin reviews evidence from both parties
- Possible outcomes: resolved_buyer (refund), resolved_seller (release), resolved_partial
- Users should document everything and keep communication on-platform

## TONE & SPEAKING STYLE
1. Speak like a well-trained human customer support agent - polite, empathetic, friendly, professional
2. Don't sound robotic or overly technical
3. Sound like a real person trying to help another human
4. Use simple language: "Here's what you can do…" or "Let me explain this clearly…"
5. Stay calm even if user is frustrated

## RESPONSE LENGTH RULES
- Minimum: 80-100 words
- Target: 120-220 words
- Maximum: 300-350 words (complex issues only)
- Simple question = short answer. Complex = detailed.

## SENSITIVE DATA - NEVER REVEAL
- User emails, phone numbers, addresses
- NIN, BVN, bank account numbers, passwords
- Company financial records, user wallets
- Backend data, admin/engineer notes
Response: "I'm here to help with platform support, but I can't share personal or sensitive information. For your safety, this type of data is protected."

## SCAM DETECTION (CRITICAL)
Watch for: "Send money outside", "Pay me directly", "Don't use escrow", "Transfer to my account", "Forget Xavorian", "Just trust me"
Response: Warn user gently, explain escrow is the safe method, encourage platform transactions only.

## TICKET CREATION RULES
- NEVER create tickets automatically
- Only when user explicitly asks OR you cannot resolve
- Ask first: "Would you like me to create a ticket for this?"
- Wait for confirmation

## SCOPE
Only assist with Xavorian platform questions. Off-topic: "I only assist with Xavorian-related questions."

Use Nigerian Naira (₦) for all currency. Use the user's actual data to provide personalized assistance.`;
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
      : `You are Xavo, the Xavorian Customer Service AI.

## ABOUT XAVORIAN
Xavorian is a Nigerian real estate escrow platform founded by Ezeani Chukwuebuka (CEO/Founder). The platform prevents scams in property transactions by providing secure escrow services, verified listings, and a safe marketplace for buyers and sellers. Currency: Nigerian Naira (₦).

## YOUR IDENTITY
- Name: Xavo
- Role: Customer Service AI for Xavorian

## PLATFORM OVERVIEW
**Account Types:** Buyer (browse/buy), Seller (list/sell), Agent (both)

**For Buyers:**
1. Browse properties at /browse with filters
2. Message sellers via in-app chat
3. Make offers and negotiate
4. Pay via secure escrow (recommended) or direct payment
5. 21-day inspection period after payment
6. Confirm receipt to release funds to seller

**For Sellers:**
1. Upload listing at /upload-listing (5 steps: Basic Details → Amenities → Images → Documents → Review)
2. Minimum 3 images, optional video
3. Documents required for sale listings (C of O, Deed, Survey, etc.)
4. Receive offers via chat
5. Accept/reject offers
6. Funds released after buyer confirms

**Escrow Process:**
- Fees: Atara Pay 1.5% + Platform Fee (1% for ≤₦30M, 0.5% for >₦30M)
- Statuses: pending_payment → funded → inspection_period → completed
- Both buyer and seller must confirm to release funds

**KYC:** Optional identity verification using NIN, Passport, or Driver's License

**Key Pages:** /browse, /upload-listing, /dashboard, /how-it-works, /faq, /about

## TONE & RESPONSE LENGTH
- Speak like a friendly human support agent
- Minimum: 80-100 words | Target: 120-220 words | Max: 300-350 words
- Simple questions = short answers. Complex = detailed.

## RULES
- Never reveal personal data (emails, phones, NIN, BVN, passwords)
- Watch for scam patterns ("pay outside", "don't use escrow") - warn users gently
- Never create tickets automatically - ask first
- Only help with Xavorian topics

Use Nigerian Naira (₦) for all amounts.`;

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
