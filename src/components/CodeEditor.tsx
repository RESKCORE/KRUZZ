import { useRef, useEffect, useCallback, type KeyboardEvent } from "react";

type Lang = "Python" | "Java" | "JavaScript" | "C";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: Lang;
  disabled?: boolean;
  rows?: number;
}

// ─── Minimal regex-based syntax highlighter ──────────────────────────────────

const PATTERNS: Record<Lang, { regex: RegExp; cls: string }[]> = {
  Python: [
    {
      regex:
        /\b(def|class|return|if|elif|else|for|while|import|from|as|pass|break|continue|and|or|not|in|is|None|True|False|lambda|with|try|except|finally|raise|yield|global|nonlocal|del|assert|async|await)\b/g,
      cls: "tok-kw",
    },
    {
      regex: /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
      cls: "tok-str",
    },
    { regex: /#.*/g, cls: "tok-comment" },
    { regex: /\b(\d+\.?\d*)\b/g, cls: "tok-num" },
    { regex: /\b([A-Z][a-zA-Z0-9_]*)\b/g, cls: "tok-type" },
    { regex: /\b([a-z_][a-zA-Z0-9_]*)\s*(?=\()/g, cls: "tok-fn" },
    { regex: /(@\w+)/g, cls: "tok-decorator" },
  ],
  JavaScript: [
    {
      regex:
        /\b(const|let|var|function|return|if|else|for|while|class|new|this|typeof|instanceof|import|export|default|from|async|await|try|catch|finally|throw|break|continue|of|in|delete|void|switch|case|null|undefined|true|false|extends|super|static|get|set|yield|do)\b/g,
      cls: "tok-kw",
    },
    { regex: /(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, cls: "tok-str" },
    { regex: /\/\/.*/g, cls: "tok-comment" },
    { regex: /\/\*[\s\S]*?\*\//g, cls: "tok-comment" },
    { regex: /\b(\d+\.?\d*)\b/g, cls: "tok-num" },
    { regex: /\b([A-Z][a-zA-Z0-9_]*)\b/g, cls: "tok-type" },
    { regex: /\b([a-z_][a-zA-Z0-9_]*)\s*(?=\()/g, cls: "tok-fn" },
    { regex: /=>/g, cls: "tok-op" },
  ],
  Java: [
    {
      regex:
        /\b(public|private|protected|static|final|class|interface|extends|implements|new|return|if|else|for|while|do|try|catch|finally|throw|throws|import|package|void|int|long|double|float|boolean|char|byte|short|String|null|true|false|this|super|abstract|synchronized|volatile|transient|native|instanceof|break|continue|switch|case|default|enum|assert|strictfp)\b/g,
      cls: "tok-kw",
    },
    { regex: /("(?:[^"\\]|\\.)*")/g, cls: "tok-str" },
    { regex: /\/\/.*/g, cls: "tok-comment" },
    { regex: /\/\*[\s\S]*?\*\//g, cls: "tok-comment" },
    { regex: /\b(\d+\.?\d*[lLfFdD]?)\b/g, cls: "tok-num" },
    { regex: /\b([A-Z][a-zA-Z0-9_]*)\b/g, cls: "tok-type" },
    { regex: /\b([a-z_][a-zA-Z0-9_]*)\s*(?=\()/g, cls: "tok-fn" },
    { regex: /@\w+/g, cls: "tok-decorator" },
  ],
  C: [
    { regex: /#\s*(include|define|ifdef|ifndef|endif|pragma)[^\n]*/g, cls: "tok-decorator" },
    {
      regex:
        /\b(int|long|short|char|float|double|unsigned|signed|void|struct|typedef|enum|union|const|static|extern|return|if|else|while|do|switch|case|break|continue|malloc|calloc|realloc|free|sizeof|NULL)\b/g,
      cls: "tok-kw",
    },
    { regex: /\/\*[\s\S]*?\*\/|\/\/.*/g, cls: "tok-comment" },
    { regex: /"(?:[^"\\]|\\.)*"/g, cls: "tok-str" },
    { regex: /\b\d+\.?\d*[uUlLfF]?\b/g, cls: "tok-num" },
    { regex: /\b([A-Z][a-zA-Z0-9_]*)\b/g, cls: "tok-type" },
    { regex: /\b([a-z_][a-zA-Z0-9_]*)\s*(?=\()/g, cls: "tok-fn" },
  ],
};

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlight(code: string, lang: Lang): string {
  const patterns = PATTERNS[lang];
  // We annotate ranges to avoid double-highlighting
  const len = code.length;
  const tagged = new Uint8Array(len); // 0 = free
  const labels: { start: number; end: number; cls: string }[] = [];

  for (const { regex, cls } of patterns) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(code)) !== null) {
      const s = m.index;
      const e = s + m[0].length;
      // Only tag if not already claimed
      let free = true;
      for (let i = s; i < e; i++) {
        if (tagged[i]) {
          free = false;
          break;
        }
      }
      if (free) {
        for (let i = s; i < e; i++) tagged[i] = 1;
        labels.push({ start: s, end: e, cls });
      }
    }
  }

  labels.sort((a, b) => a.start - b.start);

  let result = "";
  let cursor = 0;
  for (const { start, end, cls } of labels) {
    result += escapeHtml(code.slice(cursor, start));
    result += `<span class="${cls}">${escapeHtml(code.slice(start, end))}</span>`;
    cursor = end;
  }
  result += escapeHtml(code.slice(cursor));
  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CodeEditor({
  value,
  onChange,
  language,
  disabled = false,
  rows = 14,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and highlight layer
  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    const hl = highlightRef.current;
    if (!ta || !hl) return;
    hl.scrollTop = ta.scrollTop;
    hl.scrollLeft = ta.scrollLeft;
  }, []);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.addEventListener("scroll", syncScroll, { passive: true });
    return () => ta.removeEventListener("scroll", syncScroll);
  }, [syncScroll]);

  // Handle Tab key — indent instead of focus-skip
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newVal = value.substring(0, start) + "    " + value.substring(end);
        onChange(newVal);
        // restore cursor position after react re-render
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 4;
        });
      }
    },
    [value, onChange],
  );

  const lines = value.split("\n");
  const lineCount = Math.max(lines.length, rows);
  const highlighted = highlight(value, language);

  // line-height must match between textarea, highlight div, and gutter line numbers
  const LINE_H = 24; // px
  const bodyHeight = lineCount * LINE_H + 24; // 12px padding top+bottom

  return (
    <div ref={containerRef} className="code-editor-root">
      {/* Editor row: gutter + body */}
      <div style={{ display: "flex", flexDirection: "row", height: bodyHeight }}>
        {/* Gutter — line numbers */}
        <div className="code-editor-gutter" aria-hidden="true" style={{ height: bodyHeight }}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="code-editor-lineno" style={{ height: LINE_H, lineHeight: `${LINE_H}px` }}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* Highlight layer + textarea */}
        <div className="code-editor-body" style={{ height: bodyHeight }}>
          <div
            ref={highlightRef}
            className="code-editor-highlight"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: highlighted + "\n" }}
            style={{ lineHeight: `${LINE_H}px` }}
          />

          {/* Transparent textarea on top */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            disabled={disabled}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            className="code-editor-textarea"
            style={{ lineHeight: `${LINE_H}px` }}
            aria-label={`${language} code editor`}
          />
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="code-editor-statusbar">
        <span>{language}</span>
        <span>
          Ln {lines.length} · Col {value.length - value.lastIndexOf("\n") - 1}
        </span>
        <span>{value.trim().length} chars</span>
      </div>
    </div>
  );
}
