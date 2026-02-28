"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
  id: string;
}

export default function MermaidDiagram({ chart, id }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    // Dynamically import mermaid (browser only)
    import("mermaid").then((mermaid) => {
      mermaid.default.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          primaryColor: "#7c3aed",
          primaryTextColor: "#e8e8f0",
          primaryBorderColor: "#a855f7",
          lineColor: "#6b6b8a",
          secondaryColor: "#1a1a24",
          tertiaryColor: "#111118",
          background: "#0a0a0f",
        },
      });

      const render = async () => {
        if (!ref.current) return;
        try {
          const safeId = `mermaid-${id}-${Math.random().toString(36).slice(2)}`;
          const { svg } = await mermaid.default.render(safeId, chart);
          if (ref.current) {
            ref.current.innerHTML = svg;
            setRendered(true);
          }
        } catch (err) {
          setError(String(err));
          console.error("Mermaid render error:", err);
        }
      };

      render();
    });
  }, [chart, id]);

  if (error) {
    return (
      <div style={{
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: "8px",
        padding: "1rem",
        fontFamily: "monospace",
        fontSize: "0.75rem",
        color: "#ef4444",
      }}>
        ⚠ Diagram render error — the AI generated invalid Mermaid syntax.
        <pre style={{ marginTop: "0.5rem", overflow: "auto" }}>{chart}</pre>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        justifyContent: "center",
        minHeight: rendered ? "auto" : "120px",
        transition: "opacity 0.3s",
        opacity: rendered ? 1 : 0.3,
      }}
    />
  );
}
