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
          theme: "base",
          themeVariables: {
            background: "transparent",
            primaryColor: "#ffffff",
            primaryTextColor: "#000000",
            primaryBorderColor: "#000000",
            lineColor: "#000000",
            secondaryColor: "#f8fafc",
            secondaryTextColor: "#000000",
            secondaryBorderColor: "#000000",
            tertiaryColor: "#f1f5f9",
            tertiaryTextColor: "#000000",
            tertiaryBorderColor: "#000000",
            mainBkg: "#ffffff",
            nodeBorder: "#000000",
            clusterBkg: "#f8fafc",
            clusterBorder: "#000000",
            edgeLabelBackground: "#ffffff",
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
