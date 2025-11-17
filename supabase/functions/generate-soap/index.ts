import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subjective, objective, patientHistory, currentMedications, allergies } = await req.json();
    
    // Input validation
    if (!subjective || typeof subjective !== 'string') {
      throw new Error("Subjective is required and must be a string");
    }
    if (!objective || typeof objective !== 'string') {
      throw new Error("Objective is required and must be a string");
    }
    if (subjective.length > 5000) {
      throw new Error("Subjective must be 5000 characters or less");
    }
    if (objective.length > 5000) {
      throw new Error("Objective must be 5000 characters or less");
    }
    if (patientHistory && typeof patientHistory === 'string' && patientHistory.length > 5000) {
      throw new Error("Patient history must be 5000 characters or less");
    }
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    // Build context
    let context = '';
    if (patientHistory) context += `Patient History: ${patientHistory}\n`;
    if (currentMedications?.length) context += `Medications: ${currentMedications.join(', ')}\n`;
    if (allergies?.length) context += `Allergies: ${allergies.join(', ')}\n`;

    const prompt = `You are a medical AI assistant. Generate Assessment and Plan for a SOAP note.

PATIENT CONTEXT:
${context}

CURRENT VISIT:
Subjective: ${subjective}

Objective: ${objective}

Generate:
1. Enhanced Subjective (add clinical relevance if needed)
2. Enhanced Objective (add interpretation of findings)  
3. Assessment: Differential diagnosis with most likely first, clinical reasoning
4. Plan: Detailed treatment plan with medications, lifestyle, follow-up

Return JSON with: enhancedSubjective, enhancedObjective, assessment, plan`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI Error:', error);
      throw new Error('AI generation failed');
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
