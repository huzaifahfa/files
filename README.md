# Research KISSer 🎯
> Keep It Simple Stupid — Turn research PDFs into audience-tuned presentations
> Powered by **Google Gemini Flash** (free tier)

## Quick Start

### 1. Get a FREE Gemini API Key
→ Go to https://aistudio.google.com/apikey
→ Sign in with Google → Create API key → Copy it

No credit card required. Generous free tier.

### 2. Clone & Install
```bash
npm install
```

### 3. Set Up API Key
Create a `.env.local` file in the project root:
```
GEMINI_API_KEY=AIzaSy...your-key-here
```

### 4. Run
```bash
npm run dev
# → http://localhost:3000
```

---

## For the Hackathon Demo (No Server Needed)
Open `research-kisser-app.html` directly in your browser.
Paste your Gemini API key in the UI field and upload any PDF/TXT.
The K-pop ODE research is pre-loaded so you can demo instantly.

---

## File Structure

```
research-kisser/
├── app/
│   ├── page.tsx                  # Main UI
│   ├── page.module.css           # Styles
│   ├── layout.tsx                # Root layout
│   └── api/
│       └── generate/
│           └── route.ts          # Gemini API endpoint
├── components/
│   └── MermaidDiagram.tsx        # Mermaid.js renderer (client-only)
├── package.json                  # No Anthropic SDK needed!
└── .env.local                    # GEMINI_API_KEY=AIza... (don't commit!)
```

---

## How It Works

```
User uploads PDF/TXT
        ↓
Select audience mode
        ↓
POST /api/generate  (server-side, key stays safe in .env.local)
        ↓
Gemini Flash parses research → structured JSON (6-8 slides)
  - responseMimeType: "application/json" forces clean JSON output
        ↓
Frontend renders slide cards + Mermaid diagrams
        ↓
Export JSON → Python backend → .pptx file
```

---

## Why Gemini Flash?
- ✅ Free tier — no credit card needed
- ✅ `responseMimeType: "application/json"` — outputs pure JSON natively (no parsing hacks)
- ✅ Fast — ~2-3 seconds per generation
- ✅ 1M token context window — handles very large PDFs
- ✅ No SDK needed — plain `fetch()` to their REST API

---

## Audience Modes

| Mode | Behavior |
|------|----------|
| 🤡 Dumbass | Zero jargon, pure analogies, entertaining |
| 👦 Kid/Student | Fun comparisons, short sentences |
| 👨‍👩‍👧 Parent/Public | Real-world impact, no equations |
| 👩‍🏫 Professor | Full methodology, assumptions, related work |
| 💰 Investor/VC | Problem size, ROI, novelty, clear ask |
| 🧑‍🔬 Peer Researcher | Technical depth, gaps, future directions |

---

## Connecting to Python Backend (for .pptx export)

The frontend downloads a JSON file. Feed it to your FastAPI backend:

```python
# backend/main.py
from fastapi import FastAPI
from fastapi.responses import FileResponse
from pptx import Presentation
from pydantic import BaseModel

app = FastAPI()

class SlidesPayload(BaseModel):
    mode: str
    title: str
    slides: list

@app.post("/generate-pptx")
async def generate_pptx(data: SlidesPayload):
    prs = Presentation()
    for slide_data in data.slides:
        layout = prs.slide_layouts[1]
        slide = prs.slides.add_slide(layout)
        slide.shapes.title.text = slide_data["title"]
        # Add mermaid image if present, add content, etc.
    prs.save("/tmp/output.pptx")
    return FileResponse("/tmp/output.pptx", filename="research-kisser.pptx")
```

Install: `pip install fastapi python-pptx uvicorn`
Run: `uvicorn main:app --reload`
