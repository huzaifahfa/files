"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import styles from "./page.module.css";

// Dynamically import MermaidDiagram (no SSR — mermaid is browser-only)
const MermaidDiagram = dynamic(() => import("./components/MermaidDiagram"), {
  ssr: false,
  loading: () => (
    <div className={styles.mermaidLoading}>Rendering diagram...</div>
  ),
});

// ─── TYPES ───────────────────────────────────────────────────────────────────
type AudienceMode = "dumbass" | "kid" | "parent" | "professor" | "investor" | "peer";
type SlideType = "title" | "content" | "diagram" | "chart";

interface Slide {
  num: number;
  type: SlideType;
  title: string;
  content: string;
  speakerNote?: string;
  mermaid?: string | null;
}

interface GenerationResult {
  title: string;
  slides: Slide[];
}

// ─── AUDIENCE CONFIG ──────────────────────────────────────────────────────────
const AUDIENCE_MODES: { id: AudienceMode; emoji: string; label: string; desc: string }[] = [
  { id: "dumbass", emoji: "🤡", label: "Dumbass", desc: "Zero jargon" },
  { id: "kid", emoji: "👦", label: "Kid / Student", desc: "Fun & simple" },
  { id: "parent", emoji: "👨‍👩‍👧", label: "Parent / Public", desc: "Real-world impact" },
  { id: "professor", emoji: "👩‍🏫", label: "Professor", desc: "Full rigor" },
  { id: "investor", emoji: "💰", label: "Investor / VC", desc: "ROI & novelty" },
  { id: "peer", emoji: "🧑‍🔬", label: "Peer Researcher", desc: "Technical depth" },
];

const SLIDE_TYPE_COLORS: Record<SlideType, string> = {
  title: "#10b981",
  diagram: "#06b6d4",
  chart: "#f59e0b",
  content: "#a855f7",
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function Home() {
  const [mode, setMode] = useState<AudienceMode>("dumbass");
  const [uploadedText, setUploadedText] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [logs, setLogs] = useState<{ msg: string; status: "done" | "working" | "error" }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── FILE HANDLING ─────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    const text = await file.text();
    setUploadedText(text.slice(0, 8000));
    setFileName(file.name);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ─── GENERATE ──────────────────────────────────────────────────────────────
  const generate = async () => {
    if (!uploadedText) return;

    setLoading(true);
    setResult(null);
    setLogs([{ msg: "Reading research content...", status: "done" }]);

    try {
      setLogs(l => [...l, { msg: `Audience mode: ${mode}`, status: "done" }]);
      setLogs(l => [...l, { msg: "Calling Gemini API...", status: "working" }]);

      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: uploadedText, mode }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      const data: GenerationResult = await resp.json();

      setLogs([
        { msg: `✓ ${data.slides.length} slides generated`, status: "done" },
        { msg: `✓ ${data.slides.filter(s => s.mermaid).length} Mermaid diagram(s) ready`, status: "done" },
        { msg: `✓ Audience: ${mode}`, status: "done" },
      ]);

      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setLogs(l => [...l, { msg: `Error: ${msg}`, status: "error" }]);
    }

    setLoading(false);
  };

  // ─── COPY / DOWNLOAD ───────────────────────────────────────────────────────
  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(result?.slides, null, 2));
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify({ mode, ...result }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "research-kisser-slides.json";
    a.click();
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <main className={styles.main}>
      {/* BG ORBS */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span>Research</span>
          <span className={styles.logoKiss}>KISS</span>
          <span className={styles.logoEr}>er</span>
          <span className={styles.logoTag}>KEEP IT SIMPLE STUPID</span>
        </div>
        <div className={styles.headerRight}>AI · PDF → PPTX · Mermaid.js</div>
      </header>

      {/* HERO */}
      <div className={styles.hero}>
        <div className={styles.eyebrow}>Research Translator</div>
        <h1 className={styles.h1}>
          Make your research<br />
          <span className={styles.highlight}>actually understood.</span>
        </h1>
        <p className={styles.heroSub}>
          Upload your research PDF. Pick your audience. Get a presentation with diagrams
          and explanations tuned to who&apos;s in the room.
        </p>
      </div>

      {/* APP SHELL */}
      <div className={styles.appShell}>

        {/* LEFT PANEL */}
        <aside className={styles.leftPanel}>

          {/* UPLOAD */}
          <section className={styles.panelSection}>
            <h3 className={styles.sectionLabel}>01 — Upload Research</h3>
            <div
              className={`${styles.uploadZone} ${dragOver ? styles.dragOver : ""} ${fileName ? styles.hasFile : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                style={{ display: "none" }}
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
              <div className={styles.uploadIcon}>📄</div>
              <div className={styles.uploadTitle}>
                {fileName || "Drop your PDF here"}
              </div>
              <div className={styles.uploadSub}>
                {fileName ? "Click to replace" : "or click to browse · PDF or TXT"}
              </div>
            </div>
          </section>

          {/* AUDIENCE MODE */}
          <section className={styles.panelSection}>
            <h3 className={styles.sectionLabel}>02 — Select Audience</h3>
            <div className={styles.modeGrid}>
              {AUDIENCE_MODES.map(m => (
                <button
                  key={m.id}
                  className={`${styles.modeBtn} ${mode === m.id ? styles.modeActive : ""}`}
                  onClick={() => setMode(m.id)}
                >
                  <span className={styles.modeEmoji}>{m.emoji}</span>
                  <span className={styles.modeLabel}>{m.label}</span>
                  <span className={styles.modeDesc}>{m.desc}</span>
                </button>
              ))}
            </div>
          </section>

          {/* GENERATE */}
          <section className={styles.panelSection}>
            <button
              className={`${styles.generateBtn} ${loading ? styles.loading : ""}`}
              onClick={generate}
              disabled={!uploadedText || loading}
            >
              {loading ? "⏳ Generating..." : "✦ Generate Presentation"}
            </button>
          </section>
        </aside>

        {/* RIGHT PANEL */}
        <div className={styles.rightPanel}>

          {/* LOGS */}
          {logs.length > 0 && (
            <div className={styles.progressLog}>
              {logs.map((l, i) => (
                <div key={i} className={styles.logLine}>
                  <div className={`${styles.logDot} ${styles[`dot_${l.status}`]}`} />
                  <span className={`${styles.logText} ${l.status === "working" ? styles.logActive : ""}`}>
                    {l.msg}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* EMPTY STATE */}
          {!result && logs.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyGrid}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={styles.emptyCell} style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
              <p className={styles.emptyText}>
                Upload a PDF to generate your presentation
              </p>
            </div>
          )}

          {/* SLIDES OUTPUT */}
          {result && (
            <>
              <div className={styles.slidesHeader}>
                <h2 className={styles.slidesTitle}>{result.title}</h2>
                <span className={styles.slideCountBadge}>{result.slides.length} slides</span>
              </div>

              {result.slides.map((slide, i) => (
                <div
                  key={i}
                  className={styles.slideCard}
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className={styles.slideHeader}>
                    <span className={styles.slideNum}>SLIDE {slide.num}</span>
                    <span className={styles.slideTitle}>{slide.title}</span>
                    <span
                      className={styles.slideTypeBadge}
                      style={{ color: SLIDE_TYPE_COLORS[slide.type], borderColor: `${SLIDE_TYPE_COLORS[slide.type]}44`, background: `${SLIDE_TYPE_COLORS[slide.type]}18` }}
                    >
                      {slide.type}
                    </span>
                  </div>
                  <div className={styles.slideBody}>
                    {slide.content && (
                      <div className={styles.slideContent}>
                        {slide.content.split("\n").map((line, j) =>
                          line.startsWith("•") || line.startsWith("-") ? (
                            <div key={j} className={styles.bulletItem}>
                              <span className={styles.bullet}>▸</span>
                              {line.replace(/^[•\-]\s*/, "")}
                            </div>
                          ) : line.trim() ? (
                            <p key={j}>{line}</p>
                          ) : null
                        )}
                      </div>
                    )}

                    {slide.mermaid && (
                      <div className={styles.mermaidWrap}>
                        <MermaidDiagram chart={slide.mermaid} id={`slide-${i}`} />
                      </div>
                    )}

                    {slide.speakerNote && (
                      <div className={styles.speakerNote}>{slide.speakerNote}</div>
                    )}
                  </div>
                </div>
              ))}

              {/* DOWNLOAD BAR */}
              <div className={styles.downloadBar}>
                <button className={styles.dlBtn} onClick={copyJSON}>📋 Copy JSON</button>
                <button className={styles.dlBtn} onClick={downloadJSON}>⬇ Download JSON</button>
                <button className={`${styles.dlBtn} ${styles.dlPrimary}`} onClick={downloadJSON}>
                  🎯 Export for PPTX
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
