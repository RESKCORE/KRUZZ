import { useState } from "react";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import { CodeEditor } from "@/components/CodeEditor";
import type { CodeLab } from "@/data/schema";
import { RC_RULES } from "@/lib/rc";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { LabGrade } from "../../convex/ai";

const MIN_WORDS = 20;
const PASS_THRESHOLD = 80;

const LANGUAGES = ["Python", "Java", "C"] as const;
type Lang = (typeof LANGUAGES)[number];

/**
 * Generate a blank starter template for the learner — NEVER uses the reference
 * solution stored in lab.starterCode / lab.javaStarterCode / lab.languages.*.starterCode.
 * The template shows the function signature + requirements from hints as a
 * docstring/comment block so the learner understands the task without seeing the answer.
 */
function starterFor(lang: Lang, lab: CodeLab): string {
  const fn = lab.functionName;
  const hints = lab.hints ?? [];

  if (lang === "Python") {
    const sig = lab.languages?.python?.signature ?? lab.pythonSignature ?? lab.signature;
    const hintLines = hints.map((h, i) => `    ${i + 1}. ${h}`).join("\n");
    const taskLine = lab.explanationPrompt ? `\n    Task: ${lab.explanationPrompt}\n` : "";
    return [
      sig,
      `    """${taskLine}`,
      `    Requirements:`,
      hintLines || "    (see the diagram above)",
      `    """`,
      `    # Write your solution here`,
      `    pass`,
      ``,
    ].join("\n");
  }

  if (lang === "Java") {
    const sig = lab.languages?.java?.signature ?? lab.javaSignature ?? lab.signature;
    const hintLines = hints.map((h, i) => `        // ${i + 1}. ${h}`).join("\n");
    return [
      `// ${sig}`,
      `public class Solution {`,
      `    public static Object ${fn}(Object... args) {`,
      `        // Requirements:`,
      hintLines || `        // (see the diagram above)`,
      ``,
      `        // Write your solution here`,
      `        return null;`,
      `    }`,
      `}`,
      ``,
    ].join("\n");
  }

  // C language template
  const cSig =
    (lab as any).cSignature ??
    (lab.languages as any)?.c?.signature ??
    `bool ${fn}(/* arguments */)`;
  const hintLines = hints.map((h, i) => `// ${i + 1}. ${h}`).join("\n");
  return [
    `#include <stdio.h>`,
    `#include <stdbool.h>`,
    `#include <string.h>`,
    ``,
    `// Signature: ${cSig}`,
    `// Requirements:`,
    hintLines || `// (see the diagram above)`,
    ``,
    `// Write your solution here:`,
    `${cSig} {`,
    `    return true;`,
    `}`,
    ``,
  ].join("\n");
}

export function CodeArena({
  lab,
  earned,
  caseSlug,
  isAuthenticated,
  onSolved,
}: {
  lab: CodeLab;
  earned: boolean;
  caseSlug: string;
  isAuthenticated: boolean;
  onSolved: () => void;
}) {
  const [language, setLanguage] = useState<Lang>("Python");
  const [code, setCode] = useState(() => starterFor("Python", lab));
  const [explanation, setExplanation] = useState("");
  const [result, setResult] = useState<LabGrade | null>(null);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitLab = useAction(api.caseProgress.submitCaseLab);

  const words = explanation.trim() ? explanation.trim().split(/\s+/).length : 0;
  const enoughWords = words >= MIN_WORDS;
  const hasEnoughCode = code.trim().length >= 50;

  function switchLanguage(lang: Lang) {
    setLanguage(lang);
    setCode(starterFor(lang, lab));
    setResult(null);
    setError(null);
  }

  async function handleCheck() {
    if (!enoughWords || !hasEnoughCode || earned || checking) return;

    setChecking(true);
    setError(null);

    try {
      const fullLabContext = [
        lab.brief ? `Brief: ${lab.brief}` : "",
        lab.signature ? `Function Signature: ${lab.signature}` : "",
        lab.hints && lab.hints.length > 0
          ? `Hints & Architecture:\n${lab.hints.map((h) => `- ${h}`).join("\n")}`
          : "",
        lab.explanationPrompt ? `Explanation Prompt: ${lab.explanationPrompt}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const grade = await submitLab({
        caseSlug,
        language,
        code: code.trim(),
        explanation: explanation.trim(),
        labTitle: lab.title,
        labPrompt: fullLabContext || lab.explanationPrompt,
      });

      setResult(grade as LabGrade);

      if (grade.passed) {
        onSolved();
      }
    } catch (e) {
      const errorMsg = (e as Error).message || "AI grading failed. Please try again.";
      setError(errorMsg);
    } finally {
      setChecking(false);
    }
  }

  const authBlocked = !isAuthenticated && !earned;

  return (
    <div className="glass-panel mt-6 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-[0_20px_40px_rgba(0,0,0,0.45)] min-w-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full recording-dot" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#ccff00]">
              Code Arena · AI-Judged Lab
            </p>
          </div>
          <p className="mt-1 text-base font-bold tracking-tight text-[#f5f5f5]">{lab.title}</p>
        </div>
        <span
          className={`rounded-[10px] px-3 py-1 font-mono text-[11px] font-bold ${
            earned
              ? "bg-[#182608] text-[#ccff00] border border-[#ccff00]/40"
              : "bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] text-[#080808] shadow-[0_0_12px_rgba(204,255,0,0.4)]"
          }`}
        >
          {earned ? `✓ +${RC_RULES.codeLab} RC earned` : `+${RC_RULES.codeLab} RC reward`}
        </span>
      </div>

      <p className="mt-2.5 max-w-[62ch] text-pretty text-[13px] leading-relaxed text-[#b8b8b8]">
        {lab.brief}
      </p>

      {/* Edge cases from test names */}
      {lab.tests && lab.tests.length > 0 && (
        <div className="mt-4 rounded-2xl bg-[#0e0e0e] border border-white/[0.07] p-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[#8a8a8a]">
            Edge cases your solution must handle
          </p>
          <ul className="space-y-1">
            {lab.tests.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-[#b8b8b8]">
                <span className="mt-0.5 font-mono text-[10px] text-[#ccff00]/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{(t as any).name ?? `Test case ${i + 1}`}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-[#121212] p-4 border border-white/[0.08]">
        <MermaidDiagram chart={lab.mermaid} />
      </div>

      {/* Language selector */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5">
        <p className="font-mono text-[11px] text-[#ccff00]/80">
          {language === "Java"
            ? (lab.javaSignature ?? lab.languages?.java?.signature ?? lab.signature)
            : language === "C"
              ? ((lab as any).cSignature ?? (lab.languages as any)?.c?.signature ?? `bool ${lab.functionName}(...)`)
              : (lab.pythonSignature ?? lab.languages?.python?.signature ?? lab.signature)}
        </p>
        <div className="flex gap-1 rounded-xl bg-black/40 p-1 border border-white/[0.06]">
          {LANGUAGES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => switchLanguage(l)}
              disabled={earned}
              className={`rounded-lg px-3.5 py-1.5 font-mono text-[11px] font-bold transition-all cursor-pointer ${
                language === l
                  ? "bg-[#182608] text-[#ccff00] border border-[#ccff00]/40 shadow-[0_0_8px_rgba(204,255,0,0.25)]"
                  : "text-[#8a8a8a] hover:text-[#f5f5f5]"
              } disabled:opacity-40`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Code Editor — starts blank (skeleton only, not the reference solution) */}
      <CodeEditor value={code} onChange={setCode} language={language} disabled={earned} rows={16} />

      {/* Action buttons */}
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            setCode(starterFor(language, lab));
            setResult(null);
            setError(null);
          }}
          className="neu-btn rounded-xl px-3.5 py-2 font-mono text-xs font-medium text-[#b8b8b8] hover:text-[#f5f5f5]"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => setHintsOpen((h) => !h)}
          className="neu-btn rounded-xl px-3.5 py-2 font-mono text-xs font-medium text-[#b8b8b8] hover:text-[#f5f5f5]"
        >
          {hintsOpen ? "Hide hints" : `Hints (${lab.hints.length})`}
        </button>
      </div>

      {hintsOpen && (
        <ul className="mt-3 space-y-1.5 rounded-2xl bg-[#161616] p-4 text-[12px] leading-relaxed text-[#b8b8b8] border border-white/[0.08]">
          {lab.hints.map((h) => (
            <li key={h} className="flex items-start gap-2">
              <span className="text-[#ccff00]">·</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-3 rounded-2xl bg-[#201010] p-4 font-mono text-xs leading-relaxed text-[#ff5555] border border-[#ff5555]/30">
          {error}
        </p>
      )}

      {/* ── Rich AI feedback ── */}
      {result && !earned && (
        <>
          {result.passed ? (
            /* PASS banner */
            <div className="mt-4 rounded-2xl bg-[#0f1f0a] border border-[#ccff00]/40 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[#ccff00] font-bold font-mono text-sm">
                  \u2713 {result.score}/100 — Passed
                </span>
                <span className="rounded-md bg-[#182608] border border-[#ccff00]/30 px-2 py-0.5 font-mono text-[10px] text-[#ccff00]">
                  +{RC_RULES.codeLab} RC earned
                </span>
              </div>
              <p className="text-[13px] text-[#b8b8b8] leading-relaxed">{result.summary}</p>
              {result.strengths.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#8a8a8a] mb-1.5">
                    What you did well
                  </p>
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[#b8b8b8]">
                        <span className="text-[#ccff00] mt-0.5">+</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.mistakes.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#8a8a8a] mb-1.5">
                    Minor areas to polish
                  </p>
                  <ul className="space-y-2">
                    {result.mistakes.map((m, i) => (
                      <li key={i} className="rounded-xl bg-[#131f0a] p-3 text-[12px] space-y-0.5">
                        <p className="font-mono text-[10px] text-[#ccff00]/80 font-bold">
                          {m.area}
                        </p>
                        <p className="text-[#b8b8b8]">{m.problem}</p>
                        <p className="text-[#7aff00]/80 italic">\u2192 {m.suggestion}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-[12px] text-[#ccff00]/70 font-mono">{result.nextStep}</p>
            </div>
          ) : (
            /* FAIL banner */
            <div className="mt-4 rounded-2xl bg-[#201010] border border-[#ff5555]/30 p-4 space-y-3">
              <p className="font-mono text-xs font-bold text-[#ff5555]">
                Score {result.score}/100 — below {PASS_THRESHOLD}, no RC awarded yet.
              </p>
              <p className="text-[13px] text-[#b8b8b8] leading-relaxed">{result.summary}</p>
              {result.mistakes.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#8a8a8a] mb-1.5">
                    Issues to fix
                  </p>
                  <ul className="space-y-2">
                    {result.mistakes.map((m, i) => (
                      <li key={i} className="rounded-xl bg-[#2a1010] p-3 text-[12px] space-y-0.5">
                        <p className="font-mono text-[10px] text-[#ff5555]/80 font-bold">
                          {m.area}
                        </p>
                        <p className="text-[#f5f5f5]">{m.problem}</p>
                        <p className="text-[#ffaa55]/80 italic">\u2192 {m.suggestion}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-[12px] text-[#ff5555]/70 font-mono">{result.nextStep}</p>
            </div>
          )}
        </>
      )}

      {/* ── Explanation section ── */}
      <div className="mt-6 border-t border-white/[0.08] pt-5">
        <label
          htmlFor="lab-explanation"
          className="block font-mono text-[11px] uppercase tracking-[0.18em] text-[#8a8a8a]"
        >
          Explain your solution in your own words
        </label>
        <p className="mt-1 text-[12px] leading-relaxed text-[#b8b8b8]">{lab.explanationPrompt}</p>

        <textarea
          id="lab-explanation"
          rows={5}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          disabled={earned}
          placeholder={`At least ${MIN_WORDS} words. Your code and explanation are graded by AI — your writing is never stored, and you earn RC only at ${PASS_THRESHOLD}%+.`}
          className="explanation-area mt-2.5"
        />

        {/* Word count + submit */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs transition-colors ${
                enoughWords ? "text-[#ccff00]" : "text-[#8a8a8a]"
              }`}
            >
              {words}/{MIN_WORDS} words
            </span>
            <span className="text-[#3a3a3a]">·</span>
            <span className="font-mono text-xs text-[#8a8a8a]">
              {code.trim().length} chars code
            </span>
          </div>

          {authBlocked && (
            <span className="rounded-xl bg-[#161616] border border-[#ccff00]/40 px-3.5 py-2 font-mono text-xs font-bold text-[#ccff00]">
              Sign in to have your lab AI-graded and earn RC
            </span>
          )}
          {!earned && !authBlocked && (
            <button
              type="button"
              onClick={handleCheck}
              disabled={!enoughWords || !hasEnoughCode || checking}
              className="rounded-xl bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] px-4 py-2 font-mono text-xs font-bold text-[#080808] shadow-[0_0_15px_rgba(204,255,0,0.4)] disabled:opacity-30 disabled:pointer-events-none transition-all hover:shadow-[0_0_24px_rgba(204,255,0,0.6)]"
            >
              {checking ? (
                <span className="flex items-center gap-1.5">
                  <svg className="size-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Grading...
                </span>
              ) : (
                "Grade my attempt"
              )}
            </button>
          )}
          {(earned || result?.passed) && (
            <span className="rounded-xl bg-[#182608] border border-[#ccff00]/40 px-3.5 py-2 font-mono text-xs font-bold text-[#ccff00]">
              \u2713 Passed {result?.score ?? 100}/100 &middot; +{RC_RULES.codeLab} RC
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
