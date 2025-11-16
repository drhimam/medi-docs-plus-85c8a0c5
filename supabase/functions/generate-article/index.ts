import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, context, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Generate a comprehensive medical knowledge article about: ${topic}

${context ? `Additional context: ${context}` : ''}
${category ? `Category: ${category}` : ''}

CRITICAL FORMATTING REQUIREMENTS:
1. Use proper HTML structure with semantic tags
2. Use <h2> for main section headings
3. Use <h3> for subsections
4. Use <p> tags for paragraphs (never use \\n for line breaks)
5. Use <ul> and <li> for bullet lists
6. Use <ol> and <li> for numbered lists
7. Use <table>, <thead>, <tbody>, <tr>, <th>, <td> for tabular data
8. Use <strong> for emphasis
9. NO plain text line breaks (\\n) - always use proper HTML tags

ARTICLE STRUCTURE:
- Start with an introduction paragraph
- Include multiple sections with <h2> headings such as:
  * Overview/Definition
  * Etiology/Pathophysiology
  * Clinical Presentation/Symptoms
  * Diagnosis
  * Treatment/Management
  * Prognosis
  * Key Points (as a bullet list)
- Use tables where appropriate for comparing data, dosages, or classifications
- Include relevant clinical information in well-organized lists

Provide the output as valid JSON with two fields:
- "title": A clear, professional title for the article
- "content": The full article content in properly formatted HTML (NO \\n characters, only HTML tags)`;

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
            content: "You are a medical knowledge expert. Generate comprehensive, evidence-based medical articles with PERFECT HTML formatting. NEVER use \\n for line breaks. ALWAYS use proper HTML tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <table>, etc. Return valid JSON with 'title' and 'content' fields where content is clean, semantic HTML."
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
      throw new Error("Failed to generate article");
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    
    // Try to parse as JSON, if it fails, create a simple structure
    let result;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
        // Clean up any \n characters in the content
        if (result.content) {
          result.content = result.content.replace(/\\n/g, '');
        }
      } else {
        // If no JSON found, treat the whole response as HTML content
        const cleanContent = rawContent.replace(/\\n/g, '').replace(/\n/g, '');
        result = {
          title: topic,
          content: cleanContent
        };
      }
    } catch {
      const cleanContent = rawContent.replace(/\\n/g, '').replace(/\n/g, '');
      result = {
        title: topic,
        content: cleanContent
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
