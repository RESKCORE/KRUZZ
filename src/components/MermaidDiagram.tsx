import { useEffect, useId, useRef, useState } from "react";
import { sanitizeSvg } from "@/lib/utils";

/**
 * Renders a Mermaid definition to inline SVG on the client.
 * Configured with the Dark Neumorphic & Electric Acid Lime palette and strict sanitization.
 */
export function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);
  const rawId = useId();
  const id = `mmd${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          look: "handDrawn",
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          theme: "dark",
          themeVariables: {
            background: "transparent",
            primaryColor: "#1a2608",
            primaryTextColor: "#f5f5f5",
            primaryBorderColor: "#ccff00",
            lineColor: "#ccff00",
            secondaryColor: "#121a05",
            secondaryTextColor: "#f5f5f5",
            secondaryBorderColor: "#a3e635",
            tertiaryColor: "#141414",
            tertiaryTextColor: "#f5f5f5",
            tertiaryBorderColor: "rgba(255, 255, 255, 0.15)",
            mainBkg: "#141414",
            nodeBorder: "#ccff00",
            clusterBkg: "#0d0d0d",
            clusterBorder: "rgba(204, 255, 0, 0.3)",
            edgeLabelBackground: "#141414",
            fontSize: "13px",
          },
        });
        const { svg } = await mermaid.render(id, chart);
        const sanitized = sanitizeSvg(svg);
        if (!cancelled && ref.current) ref.current.innerHTML = sanitized;
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (failed) {
    return (
      <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-muted-foreground">
        {chart}
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      aria-label="System architecture diagram"
      className="flex min-h-[140px] w-full items-center justify-center overflow-x-auto [&_svg]:max-w-full"
    />
  );
}
