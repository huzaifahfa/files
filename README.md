# 🚀 Research Visualizer

**Making complex research understandable, fundable, and actionable.**

Great ideas often fail not because they’re weak, but because they’re hard to explain. **Research Visualizer** is an AI-powered platform that transforms dense academic research into clear, interactive visual stories. It dynamically tailors its output to the exact audience you’re communicating with—whether that’s a venture backer, a peer researcher, or a general audience.

---

## 🎯 The Problem

Researchers and innovators regularly struggle to bridge the communication gap. Specifically, they face challenges trying to:

* Pitch technical ideas to non-technical decision-makers.
* Justify research value and ROI to sponsors and funders.
* Communicate across disciplines efficiently.
* Translate dense papers, equations, or data into intuition.

**The Result:** Promising research gets overlooked, funding conversations stall, and real-world impact is delayed.

---

## 💡 Our Solution

Research Visualizer uses AI as infrastructure to understand the *structure* of your research—not just summarize it. It generates visual, context-aware presentations that adapt to who’s in the room.

**What you upload:**
* A research abstract, full paper, or proposal.
* Equations, code snippets, or raw datasets.
* Domain-specific data like audio, signals, or simulations.

**What you get:**
* Intuition-first visual explanations.
* Interactive diagrams and structural flowcharts.
* Multiple presentation "views" tailored perfectly to your audience's context.

---

## 🧠 Context-Aware Storytelling (The Magic)

Unlike static slides or generic chat tools, Research Visualizer dynamically adapts its output to turn research into a conversation. 

Imagine uploading a computational mathematics project comparing Euler and Runge-Kutta methods on a harmonic oscillator model derived from audio signals. Here is how the platform adapts that single upload:

* **Sponsors & Funders:** Focuses on computational efficiency gains, real-world applications in audio software, and ROI.
* **Venture Backers:** Highlights scalability, market differentiation, and commercial opportunity.
* **Peer Researchers:** Delivers deep dives into mathematical rigor, error margins, stability regions, and methodology.
* **Students:** Provides step-by-step interactive diagrams showing how the algorithms handle step sizes differently.
* **General Audience:** Uses plain-language analogies and visual animations to explain the core concept without equations.

---

## 🤖 Why This Isn’t a "ChatGPT Wrapper"

We use AI to architect understanding, not just to generate text. 

* **Structured Decomposition:** Research is broken down into core components (models, methods, data, goals).
* **Targeted Generation:** Visual modules are selected based on the specific research type.
* **Factual Grounding:** Explanations are strictly grounded in the provided math and data, preventing hallucination.
* **Visual Priority:** Outputs prioritize visual understanding and spatial layout over walls of text.

The result is trustable, explainable, and highly reusable research communication.

---

## 🏗️ Built For Innovation Teams

Research Visualizer is the ultimate translation layer for anywhere research needs to be understood before it can be supported:

* Research labs and universities
* Startups working on deep tech
* Nonprofits and policy organizations
* Sponsors evaluating technical proposals
* Educators and student researchers

---

## 🌱 Vision

We believe the future of research isn’t just about discovering new ideas—it’s about making those ideas accessible. Research Visualizer helps ideas travel the critical path: **PDF → Understanding → Support → Real-World Impact.**

---

## 🛠️ Installation & Setup

Follow these steps to get Research Visualizer running locally on your machine.

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) installed. 

### 2. Clone & Install Dependencies
Clone the repository and install the required packages. This project relies on `pptxgenjs` for client-side PowerPoint generation and `mermaid` for interactive diagrams.

```bash
git clone [https://github.com/your-username/research-visualizer.git](https://github.com/your-username/research-visualizer.git)
cd research-visualizer
npm install
npm install pptxgenjs mermaid

# Research KISSer

## 3. Environment Variables

Research Visualizer uses Google's Gemini 2.5 Flash model for multimodal document processing. Create a `.env.local` file in the root of your project and add your API key:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 4. Next.js Configuration (Crucial for PPTX Export)

Because `pptxgenjs` is a universal library, Next.js needs to be told to ignore Node.js-specific file system modules when compiling for the browser.

Ensure you have a `next.config.mjs` file in your root directory configured exactly like this:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Tell Webpack to ignore Node-specific modules for the client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        "node:fs": false,
        path: false,
        crypto: false,
        stream: false,
        os: false,
      };
    }
    return config;
  },
};

export default nextConfig;
```

---

## 5. Run the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start uploading PDFs and generating presentations!

---

> 🏆 **Hackathon Note:** This project was built as part of an AI for Productivity & Research hackathon, with a strict focus on solving real-world research communication barriers, interdisciplinary understanding, and sponsor-facing clarity.