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
1. Start with <h1> for the main article title
2. Use <h2> for main section headings (Overview, Pathophysiology, Clinical Features, etc.)
3. Use <h3> for subsections within each main section
4. Wrap EVERY paragraph in <p> tags with proper closing tags
5. Add <br><br> between major sections for clear visual separation
6. Use <ul> and <li> for bullet lists
7. Use <ol> and <li> for numbered lists
8. Use <table>, <thead>, <tbody>, <tr>, <th>, <td> for tabular data with proper structure
9. Use <strong> for emphasis and <em> for italics
10. NO plain text line breaks (\\n) - ONLY use proper HTML tags
11. Ensure each <h2> section is followed by <br> for spacing
12. Each paragraph <p> should have content, then close properly before the next element

MANDATORY ARTICLE STRUCTURE WITH SPACING:
1. <h1>Article Title</h1><br><br>
2. <h2>Introduction</h2><br><p>Content in paragraphs...</p><p>More paragraphs...</p><br><br>
3. <h2>Definition</h2><br><p>Content...</p><br><br>
4. <h2>Epidemiology</h2><br><p>Content...</p><br><br>
5. <h2>Etiology</h2><br><p>Content...</p><br><br>
6. <h2>Pathophysiology</h2><br><p>Content...</p><br><br>
7. <h2>Clinical Features</h2><br><h3>Signs and Symptoms</h3><p>Content...</p><br><br>
8. <h2>Diagnosis</h2><br><p>Content...</p><table>...</table><br><br>
9. <h2>Differential Diagnosis</h2><br><p>Content...</p><br><br>
10. <h2>Management</h2><br><h3>Pharmacological</h3><p>Content...</p><h3>Non-pharmacological</h3><p>Content...</p><br><br>
11. <h2>Complications</h2><br><p>Content...</p><br><br>
12. <h2>Prognosis</h2><br><p>Content...</p><br><br>
13. <h2>Key Points</h2><br><ul><li>Point 1</li><li>Point 2</li></ul><br><br>
14. <h2>References</h2><br><ol><li>Reference 1</li><li>Reference 2</li></ol>

SPACING RULES:
- Add <br><br> after each major <h2> section
- Add <br> after each <h2> or <h3> heading before content
- Wrap each paragraph in <p></p> tags
- Tables should be on their own with <br> before and after

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
- "title": A clear, professional medical title (do NOT include this in the content HTML)
- "content": The full article starting with <h1>Title</h1> followed by all sections with proper spacing using <br><br> between sections`;

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
            content: "You are a senior medical writer and physician creating comprehensive, evidence-based medical articles. Generate well-structured articles with: <h1> for title, <h2> for main sections, <h3> for subsections. Use <br><br> between major sections for clear spacing. Wrap all paragraphs in <p> tags. Use proper tables with <table>, <thead>, <tbody>, <tr>, <th>, <td>. Add <br> after headings before content. Include 5-8 properly formatted medical references in an <ol> list. Return valid JSON with 'title' and 'content' fields where content contains the full HTML including the <h1> title."
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
      // Remove markdown code blocks if present
      let cleanedContent = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
        // Clean up any \n characters, JSON artifacts, and extra brackets in the content
        if (result.content) {
          result.content = result.content
            .replace(/\\n/g, '')
            .replace(/\n/g, '')
            .replace(/^\{+|\}+$/g, '')  // Remove leading/trailing brackets
            .replace(/^"content":\s*"/i, '')  // Remove JSON key prefix
            .replace(/"$/g, '');  // Remove trailing quote
        }
      } else {
        // If no JSON found, treat the whole response as HTML content
        const cleanContent = cleanedContent
          .replace(/\\n/g, '')
          .replace(/\n/g, '')
          .replace(/^\{+|\}+$/g, '')
          .replace(/^"content":\s*"/i, '')
          .replace(/"$/g, '');
        result = {
          title: topic,
          content: cleanContent
        };
      }
    } catch {
      const cleanContent = rawContent
        .replace(/\\n/g, '')
        .replace(/\n/g, '')
        .replace(/^\{+|\}+$/g, '')
        .replace(/^"content":\s*"/i, '')
        .replace(/"$/g, '');
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
