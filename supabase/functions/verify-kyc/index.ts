import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  kyc_id: string;
  personal_info: {
    full_name: string;
    date_of_birth: string;
    gender: string;
    phone: string;
  };
  ocr_data: {
    documentNumber: string | null;
    name: string | null;
    dob: string | null;
    gender: string | null;
    [key: string]: any;
  };
  doc_type: string;
  document_image_path: string;
  selfie_path: string;
}

function normalizeStr(s: string | null | undefined): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

function nameSimilarity(a: string, b: string): number {
  const na = normalizeStr(a).split(" ").filter(Boolean);
  const nb = normalizeStr(b).split(" ").filter(Boolean);
  if (!na.length || !nb.length) return 0;
  let matches = 0;
  for (const wa of na) {
    if (nb.some((wb: string) => wb === wa || wb.includes(wa) || wa.includes(wb))) matches++;
  }
  return matches / Math.max(na.length, nb.length);
}

function dobMatch(ocrDob: string | null, inputDob: string | null): boolean {
  if (!ocrDob || !inputDob) return false;
  const clean = (s: string) => s.replace(/[^0-9]/g, "");
  const d1 = clean(ocrDob);
  const d2 = clean(inputDob);
  if (d1 === d2) return true;
  // Try reverse
  if (d1.length === 8 && d2.length === 8) {
    const rev = d1.slice(4) + d1.slice(2, 4) + d1.slice(0, 2);
    if (rev === d2) return true;
  }
  return false;
}

function validateDocNumber(num: string | null, docType: string): boolean {
  if (!num) return false;
  switch (docType) {
    case "national_id": return /^\d{11}$/.test(num);
    case "passport": return /^[A-Z]\d{8}$/i.test(num);
    case "drivers_license": return /^[A-Z]{3}\s?[A-Z0-9]{8,12}$/i.test(num);
    case "voters_card": return /^[A-Z0-9]{19}$/i.test(num);
    default: return num.length > 5;
  }
}

async function imageToBase64(supabase: any, bucket: string, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw new Error(`Failed to download ${path}: ${error.message}`);
  const arrayBuffer = await data.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function analyzeWithAI(documentB64: string, selfieB64: string, ocrData: any, personalInfo: any, docType: string): Promise<any> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("AI API key not configured");

  const prompt = `You are a KYC document verification expert. Analyze these two images and data carefully.

IMAGE 1: An identity document (${docType}).
IMAGE 2: A selfie of the person claiming to own this document.

USER-PROVIDED PERSONAL INFO:
- Full Name: ${personalInfo.full_name}
- Date of Birth: ${personalInfo.date_of_birth}
- Gender: ${personalInfo.gender}

OCR EXTRACTED DATA FROM DOCUMENT:
${JSON.stringify(ocrData, null, 2)}

Perform these checks and respond in STRICT JSON format:

1. **document_authentic**: Is the document image a real, unedited government-issued ID? Look for signs of digital editing (inconsistent fonts, misaligned text, unnatural shadows, pixelation around text/photo, color inconsistencies, blurred edges around pasted elements). Rate 0-100.

2. **face_match**: Do the faces in the document photo and the selfie appear to be the same person? Consider angle differences but focus on facial features. Rate 0-100.

3. **document_readable**: Is the document text clearly readable? Rate 0-100.

4. **tampering_signs**: List any specific signs of image tampering or editing detected. Be specific.

5. **face_match_details**: Explain your face comparison reasoning.

6. **overall_verdict**: "approved" | "rejected" | "manual_review"

7. **rejection_reasons**: Array of specific reasons if rejected.

Respond ONLY with valid JSON, no markdown:
{"document_authentic": number, "face_match": number, "document_readable": number, "tampering_signs": [], "face_match_details": "", "overall_verdict": "", "rejection_reasons": []}`;

  const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:image/webp;base64,${documentB64}` } },
            { type: "image_url", image_url: { url: `data:image/webp;base64,${selfieB64}` } },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API error: ${response.status} - ${errText}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || "";
  
  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI returned invalid response format");
  
  return JSON.parse(jsonMatch[0]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) throw new Error("Unauthorized");

    const body: VerifyRequest = await req.json();
    const { kyc_id, personal_info, ocr_data, doc_type, document_image_path, selfie_path } = body;

    // Verify this KYC belongs to the user
    const { data: kyc } = await supabase.from("kyc_documents").select("*").eq("id", kyc_id).eq("user_id", user.id).single();
    if (!kyc) throw new Error("KYC record not found");

    const verificationResults: any = {
      data_checks: {},
      ai_analysis: null,
      final_status: "pending",
      confidence_score: 0,
    };

    // === Step 1: Programmatic Data Validation ===
    const nameScore = nameSimilarity(ocr_data.name, personal_info.full_name);
    const docNumValid = validateDocNumber(ocr_data.documentNumber, doc_type);
    const dobMatched = dobMatch(ocr_data.dob, personal_info.date_of_birth);
    const genderMatch = ocr_data.gender && personal_info.gender
      ? normalizeStr(ocr_data.gender)[0] === normalizeStr(personal_info.gender)[0]
      : null;

    verificationResults.data_checks = {
      name_similarity: Math.round(nameScore * 100),
      document_number_valid: docNumValid,
      dob_matched: dobMatched,
      gender_matched: genderMatch,
    };

    // === Step 2: AI Vision Analysis ===
    try {
      const docB64 = await imageToBase64(supabase, "kyc-documents", document_image_path);
      const selfieB64 = await imageToBase64(supabase, "kyc-documents", selfie_path);
      
      const aiResult = await analyzeWithAI(docB64, selfieB64, ocr_data, personal_info, doc_type);
      verificationResults.ai_analysis = aiResult;
    } catch (aiErr: any) {
      console.error("AI analysis error:", aiErr.message);
      verificationResults.ai_analysis = { error: aiErr.message, overall_verdict: "manual_review" };
    }

    // === Step 3: Calculate Final Verdict ===
    const ai = verificationResults.ai_analysis;
    let score = 0;
    let maxScore = 0;

    // Data checks (40% weight)
    maxScore += 40;
    if (nameScore >= 0.5) score += 15;
    else if (nameScore >= 0.3) score += 8;
    if (docNumValid) score += 10;
    if (dobMatched) score += 10;
    if (genderMatch) score += 5;

    // AI checks (60% weight) 
    if (ai && !ai.error) {
      maxScore += 60;
      if (ai.document_authentic >= 70) score += 20;
      else if (ai.document_authentic >= 40) score += 10;
      if (ai.face_match >= 60) score += 25;
      else if (ai.face_match >= 35) score += 12;
      if (ai.document_readable >= 50) score += 5;
      if (!ai.tampering_signs || ai.tampering_signs.length === 0) score += 10;
    }

    const confidence = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    verificationResults.confidence_score = confidence;

    let finalStatus: string;
    const aiVerdict = ai?.overall_verdict;

    if (aiVerdict === "rejected" || confidence < 30) {
      finalStatus = "rejected";
    } else if (confidence >= 65 && aiVerdict !== "manual_review") {
      finalStatus = "verified";
    } else {
      finalStatus = "pending"; // needs manual review
    }

    verificationResults.final_status = finalStatus;

    // === Step 4: Update KYC Record ===
    const updateData: any = {
      status: finalStatus,
      extracted_data: {
        ...ocr_data,
        verification_results: verificationResults,
        verified_at: new Date().toISOString(),
      },
    };

    if (finalStatus === "verified") {
      updateData.verified_at = new Date().toISOString();
    }

    await supabase.from("kyc_documents").update(updateData).eq("id", kyc_id);

    return new Response(JSON.stringify({
      status: finalStatus,
      confidence: confidence,
      details: verificationResults,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Verify KYC error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
