const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are an elite botanist, ichthyologist and plant/fish pathology expert.
You receive ONE photo that may contain ONE OR MORE subjects (plants and/or fish).
Identify EVERY distinct subject visible in the image and return one entry per subject in the "subjects" array.
If multiple instances of the exact same species appear together as a single group, you may combine them into one entry (mention the count in the summary).
For each subject decide if it is a PLANT or a FISH (or "unknown"), identify the species, and assess health/diseases. Be specific, accurate, practical.
Respond ONLY by calling the provided tool.`;

const subjectSchema = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["plant", "fish", "unknown"] },
    confidence: { type: "number", description: "0-100 confidence in identification" },
    commonName: { type: "string" },
    scientificName: { type: "string" },
    category: { type: "string", description: "e.g. Houseplant / Tropical freshwater fish" },
    locationHint: { type: "string", description: "Where this subject sits in the image, e.g. 'top-left', 'center', 'foreground right'" },
    summary: { type: "string", description: "2-3 sentence overview" },
    healthScore: { type: "number", description: "0-100, 100 = perfect health" },
    healthStatus: { type: "string", enum: ["healthy", "minor_issues", "diseased", "critical", "unknown"] },
    diseases: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          severity: { type: "string", enum: ["low", "moderate", "high", "severe"] },
          symptoms: { type: "string" },
          causes: { type: "string" },
          treatment: { type: "string" },
          prevention: { type: "string" },
          recoveryDays: { type: "string" }
        },
        required: ["name", "severity", "symptoms", "causes", "treatment", "prevention"]
      }
    },
    care: {
      type: "object",
      properties: {
        light: { type: "string" },
        water: { type: "string" },
        temperature: { type: "string" },
        food: { type: "string" },
        environment: { type: "string" },
        extras: { type: "array", items: { type: "string" } }
      }
    },
    funFacts: { type: "array", items: { type: "string" } }
  },
  required: ["kind", "confidence", "commonName", "scientificName", "summary", "healthScore", "healthStatus", "diseases", "care"]
};

const tool = {
  type: "function",
  function: {
    name: "report",
    description: "Return a structured identification + diagnosis report for every distinct subject in the image.",
    parameters: {
      type: "object",
      properties: {
        subjects: {
          type: "array",
          description: "One entry per distinct plant or fish detected in the image.",
          items: subjectSchema
        },
        sceneSummary: { type: "string", description: "One-sentence overview of what is in the image overall." }
      },
      required: ["subjects"]
    }
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { image } = await req.json();
    if (!image) return new Response(JSON.stringify({ error: "Missing image" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: [
            { type: "text", text: "Identify and diagnose EVERY distinct plant or fish in this image. Return one entry per subject in the subjects array." },
            { type: "image_url", image_url: { url: image } }
          ]}
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "report" } }
      })
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }});
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable workspace settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }});
      const t = await resp.text();
      console.error("Gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("No structured response from AI");
    const parsed = JSON.parse(call.function.arguments);
    const subjects = Array.isArray(parsed.subjects) ? parsed.subjects : [];

    return new Response(JSON.stringify({ subjects, sceneSummary: parsed.sceneSummary ?? null, report: subjects[0] ?? null }), { headers: { ...corsHeaders, "Content-Type": "application/json" }});
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }});
  }
});
