const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subjective, objective, assessment, patientInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert clinical pharmacist and medical AI assistant specializing in evidence-based prescription planning. Generate comprehensive, clinically sound prescription recommendations following this exact structure:

**MEDICATION RECOMMENDATION**

**Medication for Current Condition:**
- <Drug name> <Dosage> <Dosage form> (<route>) - <Frequency> for <Duration>
  Special Instructions: <detailed instructions including warnings, precautions, and patient counseling points>

(Include 2-4 medications as appropriate for the current condition)

**Medication for Ongoing Condition:**
- <Drug name> <Dosage> <Dosage form> (<route>) - <Frequency> for <Duration>
  Special Instructions: <detailed instructions for chronic medication management>

(Include relevant chronic medications based on patient's medical history)

**NON-PHARMACOLOGIC RECOMMENDATIONS & PLAN**

**Advices for Current Condition:**
- <Specific, actionable advice related to the presenting complaint>
- <Evidence-based non-drug interventions>
- <Self-care measures and when to seek help>

**Lifestyle & Safety Measures:**
- Activity modifications and restrictions
- Diet and hydration recommendations
- Sleep hygiene and rest requirements
- Safety precautions specific to the condition
- Environmental modifications if needed

**Follow-up and Monitoring:**
- Specific follow-up timeline (e.g., "Follow-up in 3-5 days if symptoms persist")
- What symptoms to monitor
- Red flag warning signs requiring immediate attention
- Laboratory or imaging follow-up if indicated
- When to return for re-evaluation

**INVESTIGATION ADVISES**
- Recommended laboratory tests with rationale
- Imaging studies if indicated
- Specialist referrals if needed
- Diagnostic procedures with timing

Use evidence-based guidelines, consider drug interactions, patient age, comorbidities, and contraindications. Be specific with dosing, duration, and safety instructions. Format with proper markdown including bold headings and bullet points.`;

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
            content: `Generate a comprehensive, evidence-based prescription following the specified structure.

Patient Information:
${patientInfo ? `Age: ${patientInfo.age}, Gender: ${patientInfo.gender}, Medical History: ${patientInfo.medicalHistory || 'Not provided'}` : 'Not provided'}

Clinical Information:
Subjective: ${subjective || 'Not provided'}
Objective: ${objective || 'Not provided'}
Assessment: ${assessment || 'Not provided'}

Generate detailed medication recommendations with proper dosing, frequencies, durations, and comprehensive special instructions. Include non-pharmacologic interventions and appropriate follow-up plans.` 
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate prescription");
    }

    const data = await response.json();
    const prescription = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ prescription }),
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
