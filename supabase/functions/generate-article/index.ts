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

    const prompt = `Generate a comprehensive, well-structured medical knowledge article about: ${topic}

${context ? `Additional context: ${context}` : ''}
${category ? `Category: ${category}` : ''}

CRITICAL FORMATTING REQUIREMENTS:
1. Use proper HTML structure with semantic tags
2. Use <h2> for main section headings (e.g., "Overview", "Pathophysiology", "Clinical Features")
3. Use <h3> for subsections within each main section
4. Use <p> tags for all paragraphs (NEVER use \\n for line breaks)
5. Use <ul> and <li> for bullet lists
6. Use <ol> and <li> for numbered lists
7. Use <table>, <thead>, <tbody>, <tr>, <th>, <td> for tabular data
8. Use <strong> for emphasis and <em> for italics
9. NO plain text line breaks (\\n) - ONLY use proper HTML tags

MANDATORY ARTICLE STRUCTURE:
1. Introduction (2-3 paragraphs with <h2>Introduction</h2>)
2. Definition/Overview (<h2>Definition</h2>)
3. Epidemiology (<h2>Epidemiology</h2>)
4. Etiology/Causes (<h2>Etiology</h2>)
5. Pathophysiology (<h2>Pathophysiology</h2>)
6. Clinical Features (<h2>Clinical Features</h2>)
   - Use <h3> for subsections like Signs and Symptoms
7. Diagnosis (<h2>Diagnosis</h2>)
   - Include diagnostic criteria in a table if applicable
8. Differential Diagnosis (<h2>Differential Diagnosis</h2>)
9. Management/Treatment (<h2>Management</h2>)
   - Use <h3> for subsections like Pharmacological and Non-pharmacological
   - Include medication tables with dosages
10. Complications (<h2>Complications</h2>)
11. Prognosis (<h2>Prognosis</h2>)
12. Key Points (<h2>Key Points</h2> with bullet list)
13. References (<h2>References</h2>)
    - Include 5-8 properly formatted medical references
    - Use <ol> for numbered reference list
    - Format: Author(s). Title. Journal. Year;Volume(Issue):Pages.

TABLES: Use tables for:
- Diagnostic criteria
- Medication dosages
- Staging systems
- Comparison of treatment options

EXAMPLE REFERENCE FORMAT:
<h2>References</h2>
<ol>
<li>Smith JA, Jones BC. Management of condition X. N Engl J Med. 2023;388(15):1402-1411.</li>
<li>Brown CD, et al. Clinical outcomes in patients with Y. JAMA. 2022;327(8):734-745.</li>
</ol>

Provide the output as valid JSON with two fields:
- "title": A clear, professional medical title
- "content": The full article in properly formatted HTML (NO \\n characters, only HTML tags)`;

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
            content: "You are a senior medical writer and physician creating comprehensive, evidence-based medical articles. Generate well-structured articles with clear sections including Introduction, Definition, Epidemiology, Etiology, Pathophysiology, Clinical Features, Diagnosis, Differential Diagnosis, Management, Complications, Prognosis, Key Points, and References. Use PERFECT HTML formatting with proper headings (<h2>, <h3>), paragraphs (<p>), lists (<ul>, <ol>), and tables. NEVER use \\n for line breaks. Include 5-8 properly formatted medical references. Return valid JSON with 'title' and 'content' fields."
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
