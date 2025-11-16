const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subjective, objective, assessment } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a medical AI assistant helping to generate clinical treatment plans. Based on the provided subjective, objective, and assessment information, generate a comprehensive, well-structured treatment plan following this format:

1. Further Subjective Query (if needed)
   - List any additional questions to clarify the diagnosis

2. Further Objective inquiry
   - Detail additional examinations or tests needed
   - Include specific maneuvers or assessments

3. Proposed Diagnostic Investigations
   - List recommended tests or imaging
   - Provide reasoning for each

4. Detailed Treatment Plan / Medication Plan
   Medications:
   - <Drug name> <Dosage> <Dosage form> (<route>) - <Frequency> for <Duration>
   - Include special instructions for each medication
   
   Procedures:
   - Name and describe any recommended procedures
   - Include frequency and special instructions

5. Next Steps
   Referrals:
   - List any specialist referrals needed
   
   Follow-up Timeline:
   - Specify follow-up schedule
   
   Red Flag Warning Signs:
   - List signs requiring immediate attention

6. Lifestyle Recommendations
   - Activity & Sleep recommendations
   - Exercise guidance
   - Dietary suggestions

7. Safety Considerations
   - Age & comorbidity considerations
   - Medication interactions
   - Fall risk or other safety concerns

Format with proper headings, subheadings, numbered lists, bullet points, and bold text where appropriate. Be specific, actionable, and clinically sound.`;

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
          { 
            role: "user", 
            content: `Generate a comprehensive treatment plan based on:\n\nSubjective:\n${subjective}\n\nObjective:\n${objective}\n\nAssessment:\n${assessment}` 
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate plan");
    }

    const data = await response.json();
    const plan = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ plan }),
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
