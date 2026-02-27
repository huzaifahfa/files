// app/api/generate/route.ts
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic(); // uses ANTHROPIC_API_KEY from env

const MODE_PROMPTS: Record<string, string> = {
  dumbass: `You are explaining research to someone who knows NOTHING about the topic. Use everyday analogies, avoid ALL jargon, make it entertaining. If you must use a technical term, explain it like they're 10 years old. Focus on WHY this matters in real life.`,
  kid: `You are explaining research to a curious 12-year-old. Use fun comparisons (games, food, sports), short sentences, enthusiastic language. Make it feel like a discovery adventure.`,
  parent: `You are explaining research to a parent or general public member. Focus on real-world impact: how does this affect everyday life? What problem does it solve? Avoid equations and jargon. Lead with why it matters.`,
  professor: `You are presenting to a professor outside this specific subfield. Include methodological rigor, assumptions, limitations, and how this fits in the broader academic landscape. Define subdomain-specific terms.`,
  investor: `You are pitching to a venture capitalist or sponsor. Lead with problem size and market opportunity. Emphasize novelty and defensibility. Quantify impact wherever possible. End with a clear ask. Be concise and punchy.`,
  peer: `You are presenting to a fellow researcher in a related field. Go deep on methodology, data sources, statistical approach, and open questions. Discuss what's novel vs. prior work. Mention gaps and future directions.`,
};

const SYSTEM_PROMPT = (mode: string) => `You are Research KISSer, an AI that transforms dense academic research into clear, audience-specific presentations.

${MODE_PROMPTS[mode] || MODE_PROMPTS.dumbass}

Respond with ONLY valid JSON (no markdown, no backticks) in this exact structure:

{
  "title": "presentation title",
  "slides": [
    {
      "num": 1,
      "type": "title",
      "title": "slide title",
      "content": "main content (use \\n• for bullets)",
      "speakerNote": "1-2 sentence presenter note",
      "mermaid": null
    },
    {
      "num": 2,
      "type": "diagram",
      "title": "slide title",
      "content": "brief diagram explanation",
      "speakerNote": "presenter note",
      "mermaid": "flowchart TD\\n  A[Input] --> B[Process]\\n  B --> C[Output]"
    }
  ]
}

Rules:
- Generate exactly 6-8 slides
- Slide types: "title" | "content" | "diagram" | "chart"  
- At least 2 slides MUST have a valid mermaid field
- Valid Mermaid types: flowchart TD, mindmap, sequenceDiagram, xychart-beta
- xychart-beta format: xychart-beta\\n  title "..."\\n  x-axis ["a","b","c"]\\n  y-axis "label" 0 --> 100\\n  bar [val1, val2, val3]
- Node labels must be simple text (no quotes, parens, or special chars inside brackets)
- Adapt ALL content to the audience mode
- JSON only — no other text`;

export async function POST(req: NextRequest) {
  try {
    const { text, mode } = await req.json();

    if (!text || !mode) {
      return NextResponse.json(
        { error: "Missing text or mode" },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4000,
      system: SYSTEM_PROMPT(mode),
      messages: [
        {
          role: "user",
          content: `Transform this research into a ${mode}-mode presentation:\n\n---\n${text.slice(0, 6000)}\n---\n\nJSON only.`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = raw
      .trim()
      .replace(/^```json\n?/, "")
      .replace(/^```\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error("Could not parse Claude response as JSON");
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
