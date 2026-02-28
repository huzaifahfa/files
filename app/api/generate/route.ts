// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
// Using the updated Gemini 2.5 Flash model
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

// ─── AUDIENCE PROMPTS ─────────────────────────────────────────────────────────
const MODE_PROMPTS: Record<string, string> = {
  dumbass: `You are explaining research to someone who knows NOTHING about the topic. Use everyday analogies, avoid ALL jargon, make it entertaining. If you must use a technical term, explain it like they're 10 years old. Focus on WHY this matters in real life.`,
  kid: `You are explaining research to a curious 12-year-old. Use fun comparisons (games, food, sports), short sentences, enthusiastic language. Make it feel like a discovery adventure.`,
  parent: `You are explaining research to a parent or general public member. Focus on real-world impact: how does this affect everyday life? Avoid equations and jargon. Lead with why it matters.`,
  professor: `You are presenting to a professor outside this specific subfield. Include methodological rigor, assumptions, limitations, and how this fits in the broader academic landscape. Define subdomain-specific terms.`,
  investor: `You are pitching to a venture capitalist or sponsor. Lead with problem size and market opportunity. Emphasize novelty and defensibility. Quantify impact. End with a clear ask. Be concise and punchy.`,
  peer: `You are presenting to a fellow researcher in a related field. Go deep on methodology, data sources, statistical approach, and open questions. Discuss what is novel vs. prior work. Mention gaps and future directions.`,
};

// ─── PROMPT BUILDER ────────────────────────────────────────────────────────────
const buildPrompt = (mode: string) => `
You are Research KISSer, an AI that transforms dense academic research into clear, audience-specific presentations.

AUDIENCE INSTRUCTIONS:
${MODE_PROMPTS[mode] || MODE_PROMPTS.dumbass}

STRICT RULES:
1. Generate exactly 6 to 8 slides total.
2. Slide types must be one of: title, content, diagram, chart.
3. At least 2 slides MUST include a mermaid diagram.
4. MERMAID SYNTAX CRITICAL: Do NOT use quotes (""), parentheses (), or brackets [] inside your node labels.
5. MERMAID SINGLE-LINE CRITICAL: You MUST use semicolons (;) to separate Mermaid statements instead of newlines. The entire mermaid string MUST be on a single line. Example: flowchart TD; A[Step 1] --> B[Step 2]; B --> C[Result];
6. NO LITERAL NEWLINES: Do not use literal newline characters anywhere in your text fields. If you need a visual line break for bullet points, use the exact characters "\\n".
7. Base your presentation ONLY on the research provided in the attached document.
`.trim();

// ─── ROUTE HANDLER ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set in .env.local" },
        { status: 500 }
      );
    }

    const { fileData, mode } = await req.json();

    if (!fileData || !fileData.base64 || !mode) {
      return NextResponse.json(
        { error: "Missing fileData or mode in request body" },
        { status: 400 }
      );
    }

    // Call Gemini API
    const geminiResp = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: buildPrompt(mode) },
              {
                inlineData: {
                  mimeType: fileData.mimeType,
                  data: fileData.base64
                }
              }
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              slides: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    num: { type: "integer" },
                    type: { type: "string" },
                    title: { type: "string" },
                    content: { type: "string" },
                    speakerNote: { type: "string", nullable: true },
                    mermaid: { type: "string", nullable: true }
                  },
                  // Removed mermaid and speakerNote from required so missing fields don't throw schema errors
                  required: ["num", "type", "title", "content"]
                }
              }
            },
            required: ["title", "slides"]
          }
        },
      }),
    });

    if (!geminiResp.ok) {
      const errBody = await geminiResp.json();
      const msg = errBody?.error?.message || `Gemini API error ${geminiResp.status}`;
      throw new Error(msg);
    }

    const geminiData = await geminiResp.json();

    const raw: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!raw) {
      throw new Error("Gemini returned an empty response. Try again.");
    }

    const cleaned = raw
      .trim()
      .replace(/^```json\n?/, "")
      .replace(/^```\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    let parsed;
    try {
      // First attempt: Standard parse
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      // Fallback: The LLM likely injected literal newlines into strings.
      // Replacing literal newlines with spaces minifies the JSON and neutralizes the error.
      console.warn("Standard JSON parse failed. Attempting aggressive newline scrub...");
      
      const scrubbed = cleaned.replace(/\n/g, " ").replace(/\r/g, "");
      const match = scrubbed.match(/\{.*\}/);
      
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch (secondError) {
          console.error("Fatal Parse Error on scrubbed string:", scrubbed);
          throw new Error("JSON parse completely failed. The AI generated malformed text.");
        }
      } else {
        throw new Error("No JSON object could be extracted from the AI response.");
      }
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/generate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}