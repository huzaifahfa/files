# Research KISSer 🎯
> Keep It Simple Stupid — Turn research PDFs into audience-tuned presentations

## Quick Start

### 1. Clone & Install
```bash
npm install
```

### 2. Set Up API Key
Create a `.env.local` file:
```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

### 3. Run
```bash
npm run dev
# → http://localhost:3000
```

---

## File Structure

```
research-kisser/
├── app/
│   ├── page.tsx              # Main UI
│   ├── page.module.css       # Styles
│   ├── layout.tsx            # Root layout (add Google Fonts here)
│   └── api/
│       └── generate/
│           └── route.ts      # Claude API endpoint
├── components/
│   └── MermaidDiagram.tsx    # Mermaid.js renderer (client-only)
├── package.json
└── .env.local                # Your API key (don't commit this!)
```

---

## How It Works

```
User uploads PDF/TXT
        ↓
Select audience mode (Dumbass / Kid / Parent / Professor / VC / Peer)
        ↓
POST /api/generate
        ↓
Claude parses research → structured JSON (6-8 slides)
        ↓
Frontend renders slides + Mermaid diagrams
        ↓
Export JSON → send to Python backend for .pptx generation
```

---

## Audience Modes

| Mode | What Claude Does |
|------|-----------------|
| 🤡 Dumbass | Zero jargon, pure analogies, entertaining |
| 👦 Kid/Student | Fun comparisons, short sentences, discovery tone |
| 👨‍👩‍👧 Parent/Public | Real-world impact, no equations |
| 👩‍🏫 Professor | Full methodology, assumptions, related work |
| 💰 Investor/VC | Problem size, ROI, novelty, ask at the end |
| 🧑‍🔬 Peer Researcher | Technical depth, gaps, future directions |

---

## Connecting to Python Backend (for .pptx)

The frontend exports a JSON file. Send this to your FastAPI backend:

```python
# backend/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from pptx import Presentation

app = FastAPI()

class SlidesData(BaseModel):
    mode: str
    title: str
    slides: list

@app.post("/generate-pptx")
async def generate_pptx(data: SlidesData):
    prs = Presentation()
    for slide_data in data.slides:
        # Add slide, add mermaid image, add content
        pass
    prs.save("output.pptx")
    return FileResponse("output.pptx")
```

---

## Adding Fonts

In `app/layout.tsx`:
```tsx
import { Syne } from 'next/font/google'

const syne = Syne({ subsets: ['latin'], weight: ['400', '700', '800'] })
```

Or just add to `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono&display=swap" rel="stylesheet" />
```

---

## Demo Mode

The standalone `research-kisser-app.html` file works entirely in the browser (no server needed). It calls the Anthropic API directly from the browser. Use this for quick demos at the hackathon!

**Important**: The HTML demo requires your API key to be entered in the UI. Don't share the key publicly.
