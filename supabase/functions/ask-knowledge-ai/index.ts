const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from user's knowledge base (RAG approach)
    let contextText = "";
    if (context && context.length > 0) {
      contextText = "\n\nRelevant information from your knowledge base:\n\n";
      context.forEach((article: any, index: number) => {
        contextText += `Article ${index + 1}: ${article.title}\n`;
        if (article.category) contextText += `Category: ${article.category}\n`;
        contextText += `${article.content.substring(0, 500)}...\n\n`;
      });
    }

    const prompt = `${question}${contextText}

Please provide a comprehensive, evidence-based answer to this medical question. If relevant information from the knowledge base is provided, incorporate it into your answer while ensuring medical accuracy.`;

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
            content: "You are a knowledgeable medical AI assistant. Provide accurate, evidence-based medical information. When user knowledge base articles are provided, use them as additional context but always ensure medical accuracy. Be clear, professional, and helpful. IMPORTANT: Keep answers brief and concise. Get straight to the point without unnecessary elaboration. Use bullet points for lists."
          },
          { 
            role: "user", 
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ answer }),
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
