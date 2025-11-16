const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subjective, objective } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a medical AI assistant helping to generate clinical assessments. Based on the provided subjective and objective information, generate a well-structured assessment following this format:

Primary Working Diagnosis
- [Diagnosis Name]
  - Including Features: [List supporting features]
  - Excluding Features: [List features that rule out this diagnosis]

Key Differential Diagnoses
1. [Alternative Diagnosis 1]
   - [Brief reasoning]
2. [Alternative Diagnosis 2]
   - [Brief reasoning]

Evidence-Based Reasoning
- [Clinical reasoning and evidence supporting the assessment]

Format with proper headings, subheadings, bullet points, and bold text where appropriate. Be specific, concise, and clinically accurate.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a clinical assessment based on:\n\nSubjective:\n${subjective}\n\nObjective:\n${objective}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate assessment");
    }

    const data = await response.json();
    const assessment = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ assessment }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
