// app/api/generate/route.ts
// Uses Google Gemini Flash (free tier) — set GEMINI_API_KEY in .env.local

import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
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
const buildPrompt = (mode: string, text: string) => `
You are Research KISSer, an AI that transforms dense academic research into clear, audience-specific presentations.

AUDIENCE INSTRUCTIONS:
${MODE_PROMPTS[mode] || MODE_PROMPTS.dumbass}

Transform the research below into a presentation. Respond with ONLY valid JSON — no markdown fences, no backticks, no extra text whatsoever.

Required JSON structure:
{
  "title": "presentation title",
  "slides": [
    {
      "num": 1,
      "type": "title",
      "title": "slide title",
      "content": "main content text. use \\n• for bullet points",
      "speakerNote": "1-2 sentence note for the presenter",
      "mermaid": null
    },
    {
      "num": 2,
      "type": "diagram",
      "title": "slide title",
      "content": "brief explanation of what the diagram shows",
      "speakerNote": "presenter note",
      "mermaid": "flowchart TD\\n  A[Step One] --> B[Step Two]\\n  B --> C[Result]"
    }
  ]
}

STRICT RULES:
- Generate exactly 6 to 8 slides total
- Slide types must be one of: title, content, diagram, chart
- At least 2 slides MUST include a mermaid diagram (non-null mermaid field)
- Valid Mermaid diagram types: flowchart TD, mindmap, sequenceDiagram, xychart-beta
- xychart-beta example: xychart-beta\\n  title "My Chart"\\n  x-axis ["A","B","C"]\\n  y-axis "Score" 0 --> 100\\n  bar [40, 75, 90]
- Mermaid node labels: plain text only, no quotes or special characters inside []
- Adapt every single slide to the audience mode above
- Output JSON only — absolutely nothing else before or after the JSON
- CRITICAL: Base your presentation ONLY on the research text provided below. Do NOT use external knowledge or make up content.

RESEARCH TO TRANSFORM (USE THIS TEXT ONLY):
---
${text.slice(0, 6000)}
---
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

    const { text, mode } = await req.json();

    if (!text || !mode) {
      return NextResponse.json(
        { error: "Missing text or mode in request body" },
        { status: 400 }
      );
    }

    // Call Gemini Flash
    const geminiResp = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt(mode, text) }],
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
                    speakerNote: { type: "string" },
                    mermaid: { type: "string" }
                  },
                  required: ["num", "type", "title", "content", "speakerNote"]
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

    // Extract text from Gemini response
    const raw: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!raw) {
      throw new Error("Gemini returned an empty response. Try again.");
    }

    // Clean any accidental fences (belt-and-suspenders)
    const cleaned = raw
      .trim()
      .replace(/^```json\n?/, "")
      .replace(/^```\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      // Last resort: pull the first JSON object out of the string
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch (secondError) {
          console.error("Raw Gemini response:", raw);
          console.error("Cleaned response:", cleaned);
          throw new Error(`JSON parse failed. Response preview: ${cleaned.slice(0, 500)}...`);
        }
      } else {
        console.error("Raw Gemini response:", raw);
        throw new Error(`No JSON found in response. Preview: ${cleaned.slice(0, 200)}...`);
      }
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/generate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
