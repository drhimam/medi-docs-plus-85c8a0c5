const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, targetLanguage } = await req.json();
    
    // Input validation
    if (!text || typeof text !== 'string') {
      throw new Error("Text is required and must be a string");
    }
    if (!targetLanguage || typeof targetLanguage !== 'string') {
      throw new Error("Target language is required and must be a string");
    }
    if (text.length > 20000) {
      throw new Error("Text must be 20000 characters or less");
    }
    if (targetLanguage.length > 50) {
      throw new Error("Target language must be 50 characters or less");
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are a professional medical translator. Translate the provided text to ${targetLanguage}. Maintain medical terminology accuracy and formatting. Return only the translated text without any explanations or additional commentary.` 
          },
          { 
            role: "user", 
            content: text
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to translate text");
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ translatedText }),
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
