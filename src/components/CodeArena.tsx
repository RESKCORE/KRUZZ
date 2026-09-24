import { useState } from "react";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import { CodeEditor } from "@/components/CodeEditor";
import type { CodeLab } from "@/data/schema";
import { RC_RULES } from "@/lib/rc";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { LabGrade } from "../../convex/ai";
import { executeCode, type ExecutionResult } from "@/lib/codeRunner";
import { resolveCodeLab } from "@/lib/codeLabs";
import {
  Play,
  Terminal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  HelpCircle,
  X,
  Trash2,
} from "lucide-react";

const MIN_WORDS = 20;
const PASS_THRESHOLD = 80;

const LANGUAGES = ["Python", "Java", "C"] as const;
type Lang = (typeof LANGUAGES)[number];

function starterFor(lang: Lang, lab?: CodeLab | null): string {
  if (!lab) {
    return "# Write your solution here\npass\n";
  }
  const fn = lab.functionName || "solution";
  const hints = Array.isArray(lab.hints) ? lab.hints : [];

  if (lang === "Python") {
    if (lab.starterCode && lab.starterCode.trim()) {
      return lab.starterCode;
    }
    const sig =
      lab.languages?.python?.signature ??
      lab.pythonSignature ??
      lab.signature ??
      `def ${fn}(*args):`;
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
    if (lab.javaStarterCode && lab.javaStarterCode.trim()) {
      return lab.javaStarterCode;
    }
    const sig =
      lab.languages?.java?.signature ??
      lab.javaSignature ??
      `public static Object ${fn}(Object... args)`;
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
  if (lab.cStarterCode && lab.cStarterCode.trim()) {
    return lab.cStarterCode;
  }
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
  caseRc = RC_RULES.codeLab,
  isAuthenticated,
  onSolved,
}: {
  lab?: CodeLab | null;
  earned: boolean;
  caseSlug: string;
  caseRc?: number;
  isAuthenticated: boolean;
  onSolved: () => void;
}) {
  const activeLab =
    lab && lab.functionName ? lab : resolveCodeLab({ slug: caseSlug, codeLab: lab });

  const [language, setLanguage] = useState<Lang>("Python");
  const [code, setCode] = useState(() => starterFor("Python", activeLab));
  const [explanation, setExplanation] = useState("");
  const [result, setResult] = useState<LabGrade | null>(null);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Execution & Terminal Panel State
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [terminalTab, setTerminalTab] = useState<"terminal" | "tests" | "output">("terminal");
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const submitLab = useAction(api.caseProgress.submitCaseLab);
  const runDryRunAction = useAction(api.caseProgress.runCodeDryRun);

  const words = explanation.trim() ? explanation.trim().split(/\s+/).length : 0;
  const enoughWords = words >= MIN_WORDS;
  const hasEnoughCode = code.trim().length >= 30;

  function switchLanguage(lang: Lang) {
    setLanguage(lang);
    setCode(starterFor(lang, activeLab));
    setResult(null);
    setError(null);
    setExecutionResult(null);
  }

  // ── Execute / Test Run Handler ──
  async function handleRunCode() {
    if (isRunning) return;
    setIsRunning(true);
    setIsTerminalOpen(true);
    setError(null);

    try {
      const exec = await executeCode({
        language,
        code: code.trim(),
        functionName: activeLab.functionName || "solution",
        tests: activeLab.tests || [],
        runAction: runDryRunAction,
      });
      setExecutionResult(exec);

      // Default to tests tab if errors or some tests failed, else terminal
      if (exec.testResults.some((t) => !t.passed) || exec.compileError) {
        setTerminalTab("tests");
      } else {
        setTerminalTab("terminal");
      }
    } catch (err) {
      console.error("Code execution error:", err);
      setError((err as Error).message || "Failed to execute code runner.");
    } finally {
      setIsRunning(false);
    }
  }

  // ── Official AI Grading Submission Handler ──
  async function handleCheck() {
    if (!enoughWords || !hasEnoughCode || earned || checking) return;

    setChecking(true);
    setError(null);

    try {
      const fullLabContext = [
        activeLab.brief ? `Brief: ${activeLab.brief}` : "",
        activeLab.signature ? `Function Signature: ${activeLab.signature}` : "",
        activeLab.hints && activeLab.hints.length > 0
          ? `Hints & Architecture:\n${activeLab.hints.map((h) => `- ${h}`).join("\n")}`
          : "",
        activeLab.explanationPrompt ? `Explanation Prompt: ${activeLab.explanationPrompt}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const grade = await submitLab({
        caseSlug,
        language,
        code: code.trim(),
        explanation: explanation.trim(),
        labTitle: activeLab.title || "Code Lab",
        labPrompt: fullLabContext || activeLab.explanationPrompt || "Case study implementation lab",
      });

      setResult(grade as LabGrade);

      if (grade.passed) {
        onSolved();
      }
    } catch (e) {
      const rawMsg = (e as Error).message || "AI grading failed. Please try again.";
      const errorMsg = rawMsg
        .replace(/\[CONVEX[^\]]*\]\s*/g, "")
        .replace(/Server Error Uncaught Error:\s*/g, "")
        .replace(/Called by client\s*/g, "")
        .trim();
      setError(errorMsg || "AI grading failed. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  const authBlocked = !isAuthenticated && !earned;

  return (
    <div className="rounded-2xl border-2 border-black bg-white p-4 sm:p-6 shadow-sm min-w-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-black" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-black font-bold">
              Interactive Code Lab &middot; {language}
            </p>
          </div>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-black">{activeLab.title}</h2>
        </div>
        <span
          className={`rounded-lg px-3 py-1 font-mono text-xs font-bold ${
            earned
              ? "bg-black text-white border-2 border-black"
              : "bg-neutral-100 text-black border-2 border-black"
          }`}
        >
          {earned ? `✓ +${caseRc} RC earned` : `+${caseRc} RC reward`}
        </span>
      </div>

      <p className="mt-3 max-w-[68ch] text-[13px] leading-relaxed text-neutral-700">
        {activeLab.brief}
      </p>

      {/* Edge cases preview */}
      {activeLab.tests && activeLab.tests.length > 0 && (
        <div className="mt-4 rounded-xl bg-neutral-50 border-2 border-black p-3.5">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Unit Test Suite Requirements ({activeLab.tests.length} test assertions)
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {activeLab.tests.map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px] text-neutral-700">
                <span className="font-mono text-[10px] text-black font-bold">
                  [{String(i + 1).padStart(2, "0")}]
                </span>
                <span className="truncate">{(t as any).name ?? `Test Case ${i + 1}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Architecture diagram if present */}
      {activeLab.mermaid && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
          <MermaidDiagram chart={activeLab.mermaid} />
        </div>
      )}

      {/* Language selector & Signature bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5">
        <p className="font-mono text-[11px] text-black font-semibold">
          {language === "Java"
            ? (activeLab.javaSignature ??
              activeLab.languages?.java?.signature ??
              activeLab.signature)
            : language === "C"
              ? ((activeLab as any).cSignature ??
                (activeLab.languages as any)?.c?.signature ??
                `bool ${activeLab.functionName || "solution"}(...)`)
              : (activeLab.pythonSignature ??
                activeLab.languages?.python?.signature ??
                activeLab.signature)}
        </p>
        <div className="flex gap-1 rounded-lg bg-neutral-100 p-1 border-2 border-black">
          {LANGUAGES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => switchLanguage(l)}
              disabled={earned}
              className={`rounded px-3 py-1 font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                language === l
                  ? "bg-black text-white shadow-xs"
                  : "text-neutral-600 hover:text-black"
              } disabled:opacity-40`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Code Editor */}
      <div className="mt-2">
        <CodeEditor
          value={code}
          onChange={setCode}
          language={language}
          disabled={earned}
          rows={16}
        />
      </div>

      {/* Editor Control Toolbar: Run, Reset, Hints */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
        <div className="flex items-center gap-2">
          {/* PRIMARY RUN BUTTON */}
          <button
            type="button"
            onClick={handleRunCode}
            disabled={isRunning || code.trim().length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-black hover:bg-neutral-800 active:bg-neutral-900 text-white px-4 py-2 font-mono text-xs font-bold shadow-sm transition-all disabled:opacity-40 cursor-pointer"
            title="Execute code against unit tests in real-time"
          >
            {isRunning ? (
              <>
                <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
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
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-current" />
                <span>Run Code</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setCode(starterFor(language, activeLab));
              setResult(null);
              setError(null);
              setExecutionResult(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-neutral-100 text-black px-3 py-2 font-mono text-xs font-medium border-2 border-black transition-colors cursor-pointer"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={() => setHintsOpen((h) => !h)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-neutral-100 text-black px-3 py-2 font-mono text-xs font-medium border-2 border-black transition-colors cursor-pointer"
          >
            <HelpCircle className="size-3" />
            <span>{hintsOpen ? "Hide hints" : `Hints (${(activeLab.hints || []).length})`}</span>
          </button>
        </div>

        {/* Terminal Toggle Badge */}
        {executionResult && !isTerminalOpen && (
          <button
            type="button"
            onClick={() => setIsTerminalOpen(true)}
            className="inline-flex items-center gap-1.5 font-mono text-xs text-black font-bold hover:underline"
          >
            <Terminal className="size-3.5" />
            <span>View Terminal Output ({executionResult.summary})</span>
          </button>
        )}
      </div>

      {/* Hints dropdown */}
      {hintsOpen && (
        <ul className="mt-3 space-y-1.5 rounded-xl bg-neutral-50 border-2 border-black p-4 text-[12px] leading-relaxed text-neutral-700">
          {(activeLab.hints || []).map((h) => (
            <li key={h} className="flex items-start gap-2">
              <span className="text-black font-bold">&bull;</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}

      {/* ─── VS CODE TERMINAL / OUTPUT PANEL ─── */}
      {isTerminalOpen && (
        <div className="mt-4 rounded-xl border-2 border-[#111827] bg-[#0b1120] overflow-hidden shadow-2xl font-mono text-xs text-[#f8fafc]">
          {/* Panel Tab Header */}
          <div className="flex items-center justify-between border-b border-[#475569] bg-[#1e293b] px-3 py-1.5 select-none">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTerminalTab("terminal")}
                className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold transition-colors rounded ${
                  terminalTab === "terminal"
                    ? "bg-[#0f172a] text-white shadow-xs"
                    : "text-[#cbd5e1] hover:text-white"
                }`}
              >
                <Terminal className="size-3" />
                TERMINAL
              </button>

              <button
                type="button"
                onClick={() => setTerminalTab("tests")}
                className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold transition-colors rounded ${
                  terminalTab === "tests"
                    ? "bg-[#0f172a] text-white shadow-xs"
                    : "text-[#cbd5e1] hover:text-white"
                }`}
              >
                <CheckCircle className="size-3 text-[#4ec9b0]" />
                TEST CASES
                {executionResult?.testResults && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded text-[10px] ${
                      executionResult.testResults.every((t) => t.passed)
                        ? "bg-[#14532d] text-[#bbf7d0]"
                        : "bg-[#7f1d1d] text-[#fecaca]"
                    }`}
                  >
                    {executionResult.testResults.filter((t) => t.passed).length}/
                    {executionResult.testResults.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setTerminalTab("output")}
                className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold transition-colors rounded ${
                  terminalTab === "output"
                    ? "bg-[#0f172a] text-white shadow-xs"
                    : "text-[#cbd5e1] hover:text-white"
                }`}
              >
                OUTPUT
              </button>
            </div>

            <div className="flex items-center gap-2 text-[#cbd5e1]">
              {executionResult && (
                <span className="text-[10px] hidden sm:inline">
                  {executionResult.runner === "pyodide-wasm" ? "Python 3.12 (WASM)" : "IDE Engine"}{" "}
                  &middot; {executionResult.executionTimeMs}ms
                </span>
              )}
              <button
                type="button"
                onClick={() => setExecutionResult(null)}
                title="Clear Console"
                className="hover:text-white p-1"
              >
                <Trash2 className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => setIsTerminalOpen(false)}
                title="Hide Panel"
                className="hover:text-white p-1"
              >
                <X className="size-3" />
              </button>
            </div>
          </div>

          {/* Panel Body */}
          <div className="p-3.5 max-h-[420px] overflow-y-auto space-y-2 font-mono text-[12px] leading-relaxed">
            {isRunning && (
              <div className="flex items-center gap-2 text-[#cccccc] py-3">
                <svg className="size-4 animate-spin text-[#007acc]" viewBox="0 0 24 24" fill="none">
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
                <span>Executing test assertions in {language}...</span>
              </div>
            )}

            {!isRunning && !executionResult && (
              <p className="text-[#858585] italic py-2">
                Click &quot;Run Code&quot; above to execute your solution against the test suite and
                inspect terminal stdout.
              </p>
            )}

            {/* TAB: TERMINAL */}
            {!isRunning && executionResult && terminalTab === "terminal" && (
              <div className="space-y-2 text-[#cccccc]">
                <div className="text-[#858585]">
                  &gt;{" "}
                  {language === "Python"
                    ? "python3"
                    : language === "Java"
                      ? "javac Solution.java && java Solution"
                      : "gcc main.c && ./a.out"}{" "}
                  solution
                </div>

                {executionResult.compileError ? (
                  <div className="p-2.5 rounded bg-[#331111] border border-[#f14c4c]/40 text-[#f14c4c]">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="size-3.5" />
                      Execution / Compilation Error:
                    </p>
                    <pre className="mt-1 text-[11px] whitespace-pre-wrap">
                      {executionResult.compileError}
                    </pre>
                  </div>
                ) : (
                  <>
                    {executionResult.stdout && (
                      <div className="border-l-2 border-[#007acc] pl-2 text-[#d4d4d4]">
                        <p className="text-[10px] text-[#858585] uppercase">
                          Standard Output (stdout):
                        </p>
                        <pre className="whitespace-pre-wrap">{executionResult.stdout}</pre>
                      </div>
                    )}

                    <div className="space-y-1 pt-1">
                      {executionResult.testResults.map((t, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          {t.passed ? (
                            <span className="text-[#4ec9b0] font-bold">&#10003; [PASS]</span>
                          ) : (
                            <span className="text-[#f14c4c] font-bold">&#10007; [FAIL]</span>
                          )}
                          <span className="text-[#f5f5f5] font-semibold">{t.name}:</span>
                          <span className={t.passed ? "text-[#858585]" : "text-[#f14c4c]"}>
                            {t.passed
                              ? `returned ${JSON.stringify(t.actual)}`
                              : t.error ||
                                `expected ${JSON.stringify(t.expected)}, got ${JSON.stringify(t.actual)}`}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 text-[11px] text-[#858585] border-t border-[#2d2d2d] flex justify-between">
                      <span>{executionResult.summary}</span>
                      <span>
                        Process exited with code{" "}
                        {executionResult.testResults.every((t) => t.passed) ? "0 (SUCCESS)" : "1"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB: TEST CASES */}
            {!isRunning && executionResult && terminalTab === "tests" && (
              <div className="space-y-2">
                {executionResult.testResults.map((t, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg p-3 border ${
                      t.passed
                        ? "bg-[#123524] border-[#4ade80]/60 text-[#f8fafc]"
                        : "bg-[#451a1a] border-[#f87171]/70 text-[#f8fafc]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold flex items-center gap-1.5">
                        {t.passed ? (
                          <CheckCircle className="size-3.5 text-[#4ec9b0]" />
                        ) : (
                          <XCircle className="size-3.5 text-[#f14c4c]" />
                        )}
                        Test {idx + 1}: {t.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.passed ? "bg-[#166534] text-[#dcfce7]" : "bg-[#991b1b] text-[#fee2e2]"
                        }`}
                      >
                        {t.passed ? "PASSED" : "FAILED"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/[0.06]">
                      <div>
                        <span className="text-[#cbd5e1]">Input:</span>{" "}
                        <code className="text-[#bae6fd]">{JSON.stringify(t.input)}</code>
                      </div>
                      <div>
                        <span className="text-[#cbd5e1]">Expected:</span>{" "}
                        <code className="text-[#86efac]">{JSON.stringify(t.expected)}</code>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[#cbd5e1]">Actual Return:</span>{" "}
                        <code className={t.passed ? "text-[#86efac]" : "text-[#fca5a5]"}>
                          {t.actual !== undefined ? JSON.stringify(t.actual) : "undefined / null"}
                        </code>
                        {t.error && <p className="mt-1 text-[#fca5a5]">{t.error}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: OUTPUT */}
            {!isRunning && executionResult && terminalTab === "output" && (
              <div>
                {executionResult.stdout ? (
                  <pre className="text-[#d4d4d4] whitespace-pre-wrap">{executionResult.stdout}</pre>
                ) : (
                  <p className="text-[#858585] italic">
                    No standard output printed during execution.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 p-3.5 font-mono text-xs leading-relaxed text-red-700 border-2 border-red-300">
          {error}
        </p>
      )}

      {/* ── Rich AI Feedback for Official Grading ── */}
      {result && !earned && (
        <>
          {result.passed ? (
            <div className="mt-4 rounded-xl bg-neutral-100 border-2 border-black p-4 space-y-3 text-black">
              <div className="flex items-center gap-2">
                <span className="text-black font-black font-mono text-sm">
                  &#10003; {result.score}/100 — Passed
                </span>
                <span className="rounded-md bg-black text-white px-2 py-0.5 font-mono text-[10px] font-black">
                  +{caseRc} RC earned
                </span>
              </div>
              <p className="text-[13px] text-neutral-800 leading-relaxed font-medium">
                {result.summary}
              </p>
              {result.strengths.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-600 font-bold mb-1.5">
                    What you did well
                  </p>
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-neutral-800">
                        <span className="text-black font-black mt-0.5">+</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.mistakes.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-600 font-bold mb-1.5">
                    Minor areas to polish
                  </p>
                  <ul className="space-y-2">
                    {result.mistakes.map((m, i) => (
                      <li
                        key={i}
                        className="rounded-xl bg-white border border-black/20 p-3 text-[12px] space-y-0.5"
                      >
                        <p className="font-mono text-[10px] text-black font-black">{m.area}</p>
                        <p className="text-neutral-700">{m.problem}</p>
                        <p className="text-black font-bold italic">&rarr; {m.suggestion}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-[12px] text-black font-mono font-bold">{result.nextStep}</p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-red-50 border-2 border-red-300 p-4 space-y-3">
              <p className="font-mono text-xs font-bold text-red-700">
                Score {result.score}/100 — below {PASS_THRESHOLD}, no RC awarded yet.
              </p>
              <p className="text-[13px] text-neutral-700 leading-relaxed">{result.summary}</p>
              {result.mistakes.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5">
                    Issues to fix
                  </p>
                  <ul className="space-y-2">
                    {result.mistakes.map((m, i) => (
                      <li
                        key={i}
                        className="space-y-0.5 rounded-xl border border-red-200 bg-white p-3 text-[12px]"
                      >
                        <p className="font-mono text-[10px] font-black text-red-600">{m.area}</p>
                        <p className="text-neutral-800">{m.problem}</p>
                        <p className="text-black font-bold italic">&rarr; {m.suggestion}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-[12px] text-red-600 font-mono font-bold">{result.nextStep}</p>
            </div>
          )}
        </>
      )}

      {/* ── Explanation Section & Official AI Submission ── */}
      <div className="mt-6 border-t-2 border-black pt-5">
        <label
          htmlFor="lab-explanation"
          className="block font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500"
        >
          Step 2: Explain your solution in your own words
        </label>
        <p className="mt-1 text-[12px] leading-relaxed text-neutral-600">
          {activeLab.explanationPrompt}
        </p>

        <textarea
          id="lab-explanation"
          rows={4}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          disabled={earned}
          placeholder={`At least ${MIN_WORDS} words. Once your code passes the 'Run Code' checks, submit here for AI architectural grading and +${caseRc} RC.`}
          className="explanation-area mt-2.5"
        />

        {/* Word count + submit button */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs transition-colors ${
                enoughWords ? "text-black font-bold" : "text-neutral-400"
              }`}
            >
              {words}/{MIN_WORDS} words
            </span>
            <span className="text-neutral-300">&middot;</span>
            <span className="font-mono text-xs text-neutral-400">
              {code.trim().length} chars code
            </span>
          </div>

          {authBlocked && (
            <span className="rounded-lg bg-neutral-100 border-2 border-black px-3.5 py-2 font-mono text-xs font-semibold text-black">
              Sign in to submit your lab for AI grading and RC reward
            </span>
          )}

          {!earned && !authBlocked && (
            <button
              type="button"
              onClick={handleCheck}
              disabled={!enoughWords || !hasEnoughCode || checking}
              className="rounded-lg bg-black text-white hover:bg-neutral-800 px-5 py-2 font-mono text-xs font-black border-2 border-black shadow-xs disabled:opacity-30 disabled:pointer-events-none transition-all hover:scale-[1.02] cursor-pointer"
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
                  Grading with AI...
                </span>
              ) : (
                `Submit & Grade (+${caseRc} RC)`
              )}
            </button>
          )}

          {(earned || result?.passed) && (
            <span className="rounded-lg bg-neutral-100 border-2 border-black px-3.5 py-2 font-mono text-xs font-black text-black shadow-xs">
              &check; Passed {result?.score ?? 100}/100 &middot; +{caseRc} RC banked
            </span>
          )}
        </div>

        <p className="mt-3 font-mono text-[10px] text-neutral-400 flex items-center gap-1.5">
          <span className="text-black font-bold">&#9432;</span>
          <span>
            Test runs execute directly in your sandbox. Official grading evaluates pedagogical
            quality and architectural trade-offs.
          </span>
        </p>
      </div>
    </div>
  );
}
