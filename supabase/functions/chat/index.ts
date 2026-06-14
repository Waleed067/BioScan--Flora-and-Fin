const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are BioScan Assistant, an expert in plants, fish, aquariums, and crop health.

ANSWER STYLE — strict:
• Keep replies SHORT. Aim for under 90 words. Hard cap 130 words.
• NEVER write long paragraphs. Use compact markdown.
• Always structure the answer with these labeled sections (omit ones that don't apply):
  **Identification:** one short line.
  **Likely cause:** 1 sentence.
  **Do this now:** 2–4 bullet points, each one short imperative line.
  **Prevent:** 1 short bullet (optional).
• Bullets must be one line each. No nested lists. No filler intros like "Sure!" or "Great question".
• If the user asks a direct yes/no or factual question, answer in 1–2 sentences without the section headers.
• If a scan image is attached, ground your answer in what is actually visible.
• If off-topic, redirect in one sentence then briefly help.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        temperature: 0.3,
        max_tokens: 350,
        messages: [{ role: "system", content: SYSTEM }, ...(messages ?? [])],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("Gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(resp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});