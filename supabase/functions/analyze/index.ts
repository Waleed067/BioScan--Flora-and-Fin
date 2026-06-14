const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are an elite botanist, ichthyologist, aquarist, and plant/fish pathology expert with decades of taxonomic field experience.
You receive ONE photo that may contain ONE OR MORE subjects (plants, crops, fish, or aquarium life).

IDENTIFICATION PROCESS — follow in order:
1. KINGDOM CHECK FIRST. Decide if the subject is a plant or a fish/aquatic animal BEFORE naming a species. Never label an aquatic animal as a plant or vice versa. If you see scales, fins, gills, or an aquatic background with an animal — kind="fish". If you see leaves, stems, flowers, fruit, or soil/pot — kind="plant".
2. NARROW BY FAMILY, THEN GENUS, THEN SPECIES. List the diagnostic features you actually see (leaf venation/shape/margin/arrangement, flower structure, fruit, growth habit for plants; body shape, fin count/shape, mouth position, scale pattern, coloration/banding, eye placement for fish) and only commit to a species if those features uniquely match.
3. WHEN UNSURE, STAY GENERIC. If two or more species are plausible, use the genus or family name in commonName (e.g. "Pothos (Epipremnum sp.)" or "Tetra (Characidae)") and explain the ambiguity in summary. Do NOT pick a random species to look confident.
4. CONFIDENCE (0–100) MUST reflect visual evidence:
   - 85–100: diagnostic features clearly visible; species unambiguous.
   - 60–84: probable species, minor ambiguity.
   - 40–59: genus/family only; commonName at that level.
   - <40: kind="unknown", commonName="Unable to identify with sufficient confidence", summary names what blocks ID (blur, lighting, angle, partial view, multiple overlapping subjects). Empty diseases.
5. PENALIZE LOW IMAGE QUALITY. Blurry, low-light, far-away, heavily filtered, or partial views → cap confidence at 55. Never inflate confidence to seem helpful.
6. EVIDENCE-BASED PATHOLOGY. Only list a disease if a visible symptom supports it (chlorosis, spots, mold, fin rot, ich spots, clamped fins, swelling, etc.). Healthy-looking subject → empty diseases array, healthStatus="healthy".
7. ONE ENTRY PER DISTINCT SUBJECT. If many instances of the same species are grouped (a school of fish, a row of seedlings), combine into one entry and mention the count in summary.
8. Use accepted scientific binomial names; commonName uses the widely-used English name. For aquarium fish, also note common variant if visible (e.g. "Long-finned", "Albino").
9. NEVER fabricate. If you don't know, say so via kind="unknown" with a low confidence.

Respond ONLY by calling the provided tool. Be specific, accurate, and honest about uncertainty.`;

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
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: [
          { type: "text", text: "First decide plant vs fish/aquatic for each subject. Then list the visible diagnostic features and narrow family → genus → species ONLY as far as the evidence allows. If unsure, stay at genus or set kind=unknown. Set realistic confidence based on actual visible evidence — do NOT guess. Only report diseases you can actually see." },
            { type: "image_url", image_url: { url: image } }
          ]}
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "report" } },
        temperature: 0.2
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
    const rawSubjects = Array.isArray(parsed.subjects) ? parsed.subjects : [];
    // Confidence gating: anything under 40 is forced to "unknown" with safe defaults
    const subjects = rawSubjects.map((s: any) => {
      const conf = typeof s.confidence === "number" ? s.confidence : 0;
      if (conf < 50) {
        return {
          ...s,
          kind: "unknown",
          commonName: "Unable to identify with sufficient confidence",
          scientificName: s.scientificName || "—",
          confidence: conf,
          healthStatus: "unknown",
          healthScore: s.healthScore ?? 0,
          diseases: [],
          summary: s.summary || "The image quality, angle, or visibility is insufficient for a confident identification. Try a closer, sharper, well-lit photo of the subject.",
          care: s.care || {},
        };
      }
      return s;
    });

    return new Response(JSON.stringify({ subjects, sceneSummary: parsed.sceneSummary ?? null, report: subjects[0] ?? null }), { headers: { ...corsHeaders, "Content-Type": "application/json" }});
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }});
  }
});
