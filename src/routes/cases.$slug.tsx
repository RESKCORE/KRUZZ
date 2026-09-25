import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppChrome } from "@/components/AppChrome";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import {
  PRACTICE_PURPOSE,
  SECTION_KICKERS,
  SECTION_LABELS,
  MIN_REFLECTION_CHARS,
  MIN_REFLECTION_WORDS,
  type CaseStudy,
  type Exercise,
  type PracticeLevel,
  type Primer,
  type TechNote,
} from "@/data/schema";
import { CodeArena } from "@/components/CodeArena";
import { CodeEditor } from "@/components/CodeEditor";
import { RCWalletPanel } from "@/components/RCWallet";
import { resolveCodeLab } from "@/lib/codeLabs";
import {
  RC_RULES,
  caseAwardId,
  isUnlocked,
  labAwardId,
  sectionAwardId,
  unlockThreshold,
  isStudyComplete,
  isLabCompleted,
  getCaseStudyRc,
} from "@/lib/rc";
import { toast } from "sonner";
import { useWallet } from "@/lib/account";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  CheckCircle2,
  Sparkles,
  Award,
  Lock,
  BookOpen,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  X,
  FileText,
  GitBranch,
  FolderOpen,
  Briefcase,
  Building2,
  GraduationCap,
} from "lucide-react";
import { getCaseInterviewBadges } from "@/data/interviewBadges";

export const Route = createFileRoute("/cases/$slug")({
  loader: ({ params }) => {
    return { slug: params.slug };
  },
  head: () => {
    return {
      meta: [
        { title: "KRUZZ System Investigation" },
        { name: "description", content: "Real-world engineering case study" },
      ],
    };
  },
  notFoundComponent: CaseNotFound,
  component: CaseStudyPage,
});

function CaseNotFound() {
  return (
    <AppChrome>
      <div className="mx-auto max-w-[1240px] px-5 py-24 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black font-black">
          Case Index
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-black">No such case study</h1>
        <p className="mt-3 text-sm text-black font-medium">
          That investigation isn&rsquo;t on the board yet.
        </p>
        <Link
          to="/cases"
          className="mt-6 inline-flex rounded-xl bg-black px-5 py-2.5 font-mono text-xs font-black text-white border-2 border-black hover:bg-neutral-800 transition-all shadow-xs"
        >
          Back to the Arena Centre
        </Link>
      </div>
    </AppChrome>
  );
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2
    className="mt-2 w-full font-extrabold tracking-tight leading-none"
    style={{ fontSize: "clamp(1.6rem, 4.2vw, 3rem)" }}
  >
    {children}
  </h2>
);

const Kicker = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-ink2">{children}</p>
);

function ArrowChain({ steps }: { steps: string[] }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {steps.map((s, i) => (
        <span key={`${s}-${i}`} className="flex items-center gap-2">
          <span className="rounded-lg bg-card/70 px-3 py-1.5 text-[12px] ring-1 ring-line/70">
            {s}
          </span>
          {i < steps.length - 1 && <span className="font-mono text-[11px] text-primary">→</span>}
        </span>
      ))}
    </div>
  );
}

const SECTION_FILES = [
  { name: "01_discover.md", label: "01 Discover", ext: "md" },
  { name: "02_understand.md", label: "02 Understand", ext: "md" },
  { name: "03_principles.md", label: "03 Principles", ext: "md" },
  { name: "04_architecture.md", label: "04 Architecture", ext: "md" },
  { name: "05_decisions.md", label: "05 Decisions", ext: "md" },
  { name: "06_implementation.md", label: "06 Implementation", ext: "md" },
  { name: "07_practice.py", label: "07 Practice", ext: "py" },
  { name: "08_reflection.md", label: "08 Reflection", ext: "md" },
] as const;

function VSCodeExplorerSidebar({
  step,
  setStep,
  sectionsDone,
  prerequisites,
  companionTab,
  setCompanionTab,
  primer,
  techNotesList,
  engineeringConceptsList,
  caseRewarded,
  caseRc,
  doneCount,
  labEarned,
  points,
  onSelect,
}: {
  step: number;
  setStep: (step: number) => void;
  sectionsDone: boolean[];
  prerequisites?: string[] | undefined;
  companionTab: "primer" | "principles" | "concepts";
  setCompanionTab: (tab: "primer" | "principles" | "concepts") => void;
  primer?: Primer | undefined;
  techNotesList: TechNote[];
  engineeringConceptsList: string[];
  caseRewarded: boolean;
  caseRc: number;
  doneCount: number;
  labEarned: boolean;
  points: number;
  onSelect?: () => void;
}) {
  const [sectionsOpen, setSectionsOpen] = useState(true);
  const [prereqsOpen, setPrereqsOpen] = useState(true);
  const [companionOpen, setCompanionOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-700 font-mono text-xs select-none">
      {/* Explorer Sidebar Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 bg-[#f1f5f9] text-[11px] font-bold text-slate-600 tracking-wider uppercase">
        <span className="flex items-center gap-1.5">
          <FolderOpen className="size-3.5 text-[#0284c7]" />
          Explorer
        </span>
        <span className="text-[10px] text-[#0284c7] font-bold">CASE-WORKSPACE</span>
      </div>

      <div className="overflow-y-auto flex-1 divide-y divide-slate-200">
        {/* Accordion 1: SECTIONS / FILES (Tree Stack) */}
        <div>
          <button
            type="button"
            onClick={() => setSectionsOpen(!sectionsOpen)}
            className="w-full flex items-center justify-between px-3 py-2 font-bold text-[11px] text-slate-600 hover:text-slate-900 bg-[#f1f5f9] hover:bg-slate-200/60 transition-colors"
          >
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              {sectionsOpen ? (
                <ChevronDown className="size-3.5 text-[#0284c7]" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
              Sections (08)
            </span>
            <span className="text-[10px] text-black font-black">
              {sectionsDone.filter(Boolean).length}/8 done
            </span>
          </button>

          {sectionsOpen && (
            <div className="py-1 space-y-0.5">
              {SECTION_FILES.map((file, idx) => {
                const current = idx === step;
                const done = sectionsDone[idx];
                const isCode = idx === 6;

                return (
                  <button
                    key={file.name}
                    type="button"
                    onClick={() => {
                      setStep(idx);
                      onSelect?.();
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-all cursor-pointer ${
                      current
                        ? "bg-[#e0f2fe] text-[#0284c7] font-semibold border-l-2 border-[#0284c7] shadow-xs"
                        : done
                          ? "text-black font-bold hover:bg-slate-100"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {isCode ? (
                      <span className="text-[#b45309] font-mono font-bold text-[10px] px-1 py-0.2 rounded bg-amber-100">
                        PY
                      </span>
                    ) : (
                      <FileText className="size-3.5 text-[#0284c7] shrink-0" />
                    )}

                    <span className="truncate flex-1 font-mono text-[12px]">{file.name}</span>

                    {done ? (
                      <span
                        className="text-black font-black text-[11px] shrink-0"
                        title="Completed"
                      >
                        ✓
                      </span>
                    ) : current ? (
                      <span className="size-1.5 rounded-full bg-[#0284c7] shrink-0 animate-pulse" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Accordion 2: PREREQUISITES */}
        {prerequisites && prerequisites.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setPrereqsOpen(!prereqsOpen)}
              className="w-full flex items-center gap-1.5 px-3 py-2 font-bold text-[11px] text-slate-600 hover:text-slate-900 bg-[#f1f5f9] hover:bg-slate-200/60 transition-colors"
            >
              {prereqsOpen ? (
                <ChevronDown className="size-3.5 text-[#0284c7]" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
              <span className="uppercase tracking-wider">
                Prerequisites ({prerequisites.length})
              </span>
            </button>

            {prereqsOpen && (
              <div className="px-4 py-2 space-y-1.5 text-[11px] text-slate-600 font-sans leading-relaxed">
                {prerequisites.map((p) => (
                  <div key={p} className="flex items-start gap-2">
                    <span className="text-[#0284c7] font-mono font-bold">&bull;</span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Accordion 3: KNOWLEDGE COMPANION */}
        <div>
          <button
            type="button"
            onClick={() => setCompanionOpen(!companionOpen)}
            className="w-full flex items-center justify-between px-3 py-2 font-bold text-[11px] text-slate-600 hover:text-slate-900 bg-[#f1f5f9] hover:bg-slate-200/60 transition-colors"
          >
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              {companionOpen ? (
                <ChevronDown className="size-3.5 text-[#0284c7]" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
              Knowledge Companion
            </span>
            {primer && <span className="size-2 rounded-full bg-black" title="Primer ready" />}
          </button>

          {companionOpen && (
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded border border-slate-200 text-[10px]">
                <button
                  type="button"
                  onClick={() => setCompanionTab("primer")}
                  className={`py-1 rounded font-bold transition-colors ${
                    companionTab === "primer"
                      ? "bg-[#0284c7] text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Primer
                </button>
                <button
                  type="button"
                  onClick={() => setCompanionTab("principles")}
                  className={`py-1 rounded font-bold transition-colors ${
                    companionTab === "principles"
                      ? "bg-[#0284c7] text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Principles
                </button>
                <button
                  type="button"
                  onClick={() => setCompanionTab("concepts")}
                  className={`py-1 rounded font-bold transition-colors ${
                    companionTab === "concepts"
                      ? "bg-[#0284c7] text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Concepts
                </button>
              </div>

              {companionTab === "primer" && primer && (
                <div className="space-y-2 text-[11px] font-sans text-slate-700 leading-relaxed">
                  <p className="font-mono text-[10px] text-[#0284c7] uppercase font-bold">
                    {primer.minutes}m Primer: {primer.concept}
                  </p>
                  <p className="text-slate-600">{primer.definition}</p>
                  <div className="p-2.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                    <span className="text-slate-500 block font-mono font-bold uppercase text-[10px] mb-0.5">
                      Why it matters
                    </span>
                    <span>{primer.whyNeeded}</span>
                  </div>
                  {primer.tinyExample && (
                    <pre className="p-2.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px] overflow-x-auto text-sky-200">
                      <code>{primer.tinyExample}</code>
                    </pre>
                  )}
                </div>
              )}

              {companionTab === "principles" && (
                <div className="space-y-2 text-[11px] font-sans">
                  {techNotesList.length > 0 ? (
                    techNotesList.map((t) => (
                      <div
                        key={t.name}
                        className="p-2.5 rounded bg-slate-100 border border-slate-200 space-y-1"
                      >
                        <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-white text-slate-600 font-bold border border-slate-200">
                          {t.kind}
                        </span>
                        <p className="font-bold text-slate-800 text-[11px]">{t.name}</p>
                        <p className="text-slate-600 text-[10.5px] leading-relaxed">{t.note}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 py-2 text-center">No tech notes available</p>
                  )}
                </div>
              )}

              {companionTab === "concepts" && (
                <div className="flex flex-wrap gap-1.5">
                  {engineeringConceptsList.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-700 hover:border-[#0284c7]/40"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Accordion 4: WALLET & REWARDS */}
        <div>
          <button
            type="button"
            onClick={() => setWalletOpen(!walletOpen)}
            className="w-full flex items-center justify-between px-3 py-2 font-bold text-[11px] text-slate-600 hover:text-slate-900 bg-[#f1f5f9] hover:bg-slate-200/60 transition-colors"
          >
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              {walletOpen ? (
                <ChevronDown className="size-3.5 text-[#0284c7]" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
              Wallet & Progress
            </span>
            <span className="text-[10px] text-black font-black">
              +{caseRewarded ? caseRc : 0} RC
            </span>
          </button>

          {walletOpen && (
            <div className="p-3 space-y-3 font-sans text-xs">
              <RCWalletPanel />
              <div className="space-y-1.5 pt-2 border-t border-slate-200 font-mono text-[10px] text-slate-600">
                <div className="flex justify-between">
                  <span>Reading Steps (0-5, 7)</span>
                  <span className={doneCount >= 7 ? "text-black font-black" : ""}>
                    {doneCount >= 7 ? "✓ Complete" : `${doneCount}/7`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Practice Lab (07)</span>
                  <span className={labEarned ? "text-black font-black" : ""}>
                    {labEarned ? "✓ Passed" : "Pending"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold">
                  <span>Full Case Bonus</span>
                  <span className="text-black font-black">+{caseRc} RC</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompanionHub({
  companionTab,
  setCompanionTab,
  primer,
  techNotesList,
  engineeringConceptsList,
  caseRewarded,
  caseRc,
  doneCount,
  labEarned,
}: {
  companionTab: "primer" | "principles" | "concepts";
  setCompanionTab: (tab: "primer" | "principles" | "concepts") => void;
  primer?: Primer | undefined;
  techNotesList: TechNote[];
  engineeringConceptsList: string[];
  caseRewarded: boolean;
  caseRc: number;
  doneCount: number;
  labEarned: boolean;
}) {
  return (
    <>
      {/* 1. Wallet & Session Yield */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#121212]/90 p-4 shadow-sm">
        <RCWalletPanel />

        {/* RC Yield in this case */}
        <div className="mt-4 pt-3.5 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#8a8a8a]">
              Case Yield Potential
            </p>
            <span className="font-mono text-xs font-black text-black">
              +{caseRewarded ? caseRc : 0} / {caseRc} RC
            </span>
          </div>

          <p className="mb-2 text-[11px] leading-relaxed text-black font-medium">
            Full {caseRc} RC is awarded upon completing the entire 8-section path (reading, passing
            the code lab, and writing reflection).
          </p>

          <div className="space-y-1.5 font-mono text-[11px] text-black">
            <div className="flex justify-between items-center py-0.5">
              <span>Reading Steps (0-5, 7)</span>
              <span className={doneCount >= 7 ? "text-black font-black" : "text-neutral-500"}>
                {doneCount >= 7 ? "✓ Viewed" : `${doneCount}/7 complete`}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span>Practice (CodeArena)</span>
              <span className={labEarned ? "text-black font-black" : "text-neutral-500"}>
                {labEarned ? "✓ Passed" : "pending"}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span>Full Case Complete</span>
              <span className={caseRewarded ? "text-black font-black" : "text-neutral-500"}>
                {caseRewarded ? `+${caseRc} RC ✓` : `+${caseRc} RC`}
              </span>
            </div>
          </div>

          {caseRewarded && (
            <div className="mt-3 rounded-xl bg-neutral-100 border-2 border-black px-3 py-2 font-mono text-xs font-black text-black flex items-center gap-1.5">
              <span>✓</span>
              <span>Case mastered · {caseRc} RC banked</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Modular Knowledge Hub (Tabs: Primer | Principles | Concepts) */}
      <div className="rounded-2xl border-2 border-black bg-white p-4 shadow-xs space-y-4 text-black">
        {/* Tab Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-black font-black">
            Knowledge Companion
          </span>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1 border-2 border-black">
          <button
            type="button"
            onClick={() => setCompanionTab("primer")}
            className={`rounded-lg py-1.5 text-center font-mono text-[11px] font-black transition-all ${
              companionTab === "primer" ? "bg-black text-white" : "text-black hover:bg-neutral-200"
            }`}
          >
            Primer
          </button>
          <button
            type="button"
            onClick={() => setCompanionTab("principles")}
            className={`rounded-lg py-1.5 text-center font-mono text-[11px] font-black transition-all ${
              companionTab === "principles"
                ? "bg-black text-white"
                : "text-black hover:bg-neutral-200"
            }`}
          >
            Principles ({techNotesList.length})
          </button>
          <button
            type="button"
            onClick={() => setCompanionTab("concepts")}
            className={`rounded-lg py-1.5 text-center font-mono text-[11px] font-black transition-all ${
              companionTab === "concepts"
                ? "bg-black text-white"
                : "text-black hover:bg-neutral-200"
            }`}
          >
            Concepts
          </button>
        </div>

        {/* Tab Content */}
        <div className="pt-1">
          {/* TAB 1: Primer */}
          {companionTab === "primer" && (
            <div>
              {primer ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="size-2 rounded-full bg-black" />
                      <span className="font-mono text-[10px] text-black font-black">
                        {primer.minutes} MIN ARCHITECTURE PRIMER
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-black">{primer.concept}</h4>
                  </div>

                  <p className="text-xs leading-relaxed text-black font-medium">
                    {primer.definition}
                  </p>

                  <div className="rounded-xl bg-neutral-50 border-2 border-black p-3 text-xs leading-relaxed text-black">
                    <p className="font-mono text-[10px] uppercase text-black mb-1 font-black">
                      Why it matters
                    </p>
                    <p>{primer.whyNeeded}</p>
                  </div>

                  <div className="rounded-xl bg-neutral-50 border-2 border-black p-3 text-xs leading-relaxed text-black">
                    <span className="font-mono text-[10px] font-black text-black block mb-1">
                      Analogy
                    </span>
                    <p>{primer.analogy}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] text-black uppercase font-black">
                        Code Pattern
                      </span>
                    </div>
                    <pre className="overflow-x-auto rounded-xl bg-neutral-900 p-3 font-mono text-[11px] text-white border-2 border-black leading-snug">
                      <code>{primer.tinyExample}</code>
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-500 py-4 text-center">
                  No dedicated primer needed for this case.
                </p>
              )}
            </div>
          )}

          {/* TAB 2: Architectural Principles */}
          {companionTab === "principles" && (
            <div className="space-y-3">
              {techNotesList.length > 0 ? (
                techNotesList.map((t) => (
                  <div
                    key={t.name}
                    className="rounded-xl bg-white border-2 border-black p-3.5 shadow-xs transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-neutral-100 border border-black px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-black font-black">
                        {t.kind}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-black text-black">{t.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-700">{t.note}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-500 py-4 text-center">
                  No architectural notes for this case.
                </p>
              )}
            </div>
          )}

          {/* TAB 3: Engineering Concepts */}
          {companionTab === "concepts" && (
            <div className="space-y-3">
              <p className="font-mono text-[11px] text-black font-bold">
                Key domain concepts mastered in this case:
              </p>
              <div className="flex flex-wrap gap-2">
                {engineeringConceptsList.map((concept) => (
                  <span
                    key={concept}
                    className="rounded-lg bg-white border-2 border-black px-2.5 py-1 font-mono text-xs font-black text-black shadow-xs"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function CaseStudyPage() {
  const { slug } = Route.useLoaderData();
  const { points, has, awards, isAuthenticated } = useWallet();
  const study = useQuery(
    api.caseStudies.getBySlug,
    isAuthenticated ? { slug } : "skip",
  ) as unknown as (CaseStudy & { isLocked?: boolean }) | undefined | null;
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [openTabs, setOpenTabs] = useState<number[]>([0, 6]);
  const workspaceTopRef = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState(0);
  const [level, setLevel] = useState(0);
  const [openConcept, setOpenConcept] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const [companionTab, setCompanionTab] = useState<"primer" | "principles" | "concepts">("primer");
  const [mobileSectionsOpen, setMobileSectionsOpen] = useState(false);
  const [mobileCompanionOpen, setMobileCompanionOpen] = useState(false);

  // Reset tab/step state when navigating to a different case study
  useEffect(() => {
    setStep(0);
    setOpenTabs([0, 6]);
    setLang(0);
    setLevel(0);
    setOpenConcept(null);
    setReflection("");
  }, [slug]);

  // Guarantee a complete, non-null CodeLab for any case study
  const resolvedLab = useMemo(() => resolveCodeLab(study), [study]);

  // Smooth step setter that tracks open tabs and smoothly scrolls content to top
  const handleSetStep = useCallback((newStep: number) => {
    setStep(newStep);
    setOpenTabs((prev) => (prev.includes(newStep) ? prev : [...prev, newStep]));
    requestAnimationFrame(() => {
      workspaceTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  // Gracefully close tab in the editor tab bar
  const closeTab = useCallback(
    (tabIdxToClose: number, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setOpenTabs((prev) => {
        if (prev.length <= 1) return prev;
        const nextTabs = prev.filter((idx) => idx !== tabIdxToClose);
        if (step === tabIdxToClose) {
          const closedPosition = prev.indexOf(tabIdxToClose);
          const nextActive = nextTabs[Math.min(closedPosition, nextTabs.length - 1)] ?? 0;
          setStep(nextActive);
        }
        return nextTabs;
      });
    },
    [step],
  );

  // Keyboard navigation: Alt + ArrowLeft / ArrowRight to step through case study
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        handleSetStep(Math.min(SECTION_FILES.length - 1, step + 1));
      } else if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        handleSetStep(Math.max(0, step - 1));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, handleSetStep]);

  const cloudProgress = useQuery(
    api.caseProgress.getCaseProgress,
    isAuthenticated && study && !study.isLocked ? { caseSlug: study.slug } : "skip",
  );
  const saveProgress = useMutation(api.caseProgress.saveCaseProgress);
  const markComplete = useMutation(api.caseProgress.markCaseComplete);
  const reconcileAwards = useMutation(api.caseProgress.reconcileUserAwards);
  const unlockedCases = useQuery(api.caseProgress.getUserUnlockedCases, {});

  useEffect(() => {
    if (study?.concepts?.[0]?.id && !openConcept) {
      setOpenConcept(study.concepts[0].id);
    }
  }, [study, openConcept]);

  useEffect(() => {
    if (cloudProgress?.reflection && !reflection) {
      setReflection(cloudProgress.reflection);
    }
  }, [cloudProgress, reflection]);

  // Automatically mark section as viewed when moving through reading sections
  useEffect(() => {
    if (isAuthenticated && study && !study.isLocked && step >= 0 && step <= 7 && step !== 6) {
      saveProgress({
        caseSlug: study.slug,
        completedSections: [step],
      }).catch(() => {});
    }
  }, [step, isAuthenticated, study, saveProgress]);

  // Reconcile awards if lab was passed but completion bonus has not been credited
  useEffect(() => {
    if (isAuthenticated && cloudProgress?.passed && study?.slug && !has(caseAwardId(study.slug))) {
      reconcileAwards().catch(() => {});
    }
  }, [isAuthenticated, cloudProgress?.passed, study?.slug, has, reconcileAwards]);

  // If unauthenticated: render authentication requirement screen
  if (!isAuthenticated) {
    return (
      <AppChrome>
        <div className="mx-auto max-w-[720px] px-5 py-32 text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border-2 border-black bg-white text-black shadow-xs">
            <Lock className="size-8 text-black" />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black font-black">
            Authentication Required
          </p>
          <h1 className="mt-3 text-3xl font-black text-black sm:text-4xl">
            Sign in to Enter the Case Arena
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-black font-medium max-w-[50ch] mx-auto">
            KRUZZ system architecture investigations, engineering trade-off matrices, and
            interactive AI coding labs require an active investigator session.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/sign-in"
              search={{ redirect: `/cases/${slug}` }}
              className="rounded-xl bg-black px-6 py-3 font-mono text-xs font-black text-white border-2 border-black shadow-xs hover:bg-neutral-800 active:scale-95 transition-all"
            >
              Sign In to Proceed
            </Link>
            <Link
              to="/cases"
              className="rounded-xl bg-white border-2 border-black px-6 py-3 font-mono text-xs font-black text-black hover:bg-neutral-100 shadow-xs transition-all"
            >
              Browse Topic Catalog
            </Link>
          </div>
        </div>
      </AppChrome>
    );
  }

  if (study === undefined) {
    return (
      <AppChrome>
        <div className="mx-auto max-w-[1240px] px-5 py-32 text-center">
          <div className="inline-block size-6 animate-spin rounded-full border-2 border-black border-t-transparent mb-4" />
          <p className="font-mono text-xs uppercase tracking-widest text-black font-black">
            Accessing Case Dossier from Database...
          </p>
        </div>
      </AppChrome>
    );
  }

  if (!study) {
    return <CaseNotFound />;
  }

  // If authenticated but case is locked: render locked barrier projection
  if (study.isLocked) {
    return (
      <AppChrome>
        <div className="mx-auto max-w-[720px] px-5 py-28 text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-[#f59e0b]/40 bg-[#1f1505] text-[#f59e0b] shadow-[0_0_25px_rgba(245,158,11,0.2)]">
            <Lock className="size-8" />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#f59e0b] font-bold">
            Investigation Locked
          </p>
          <h1 className="mt-3 text-3xl font-extrabold text-[#f5f5f5] sm:text-4xl">{study.title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-[#b8b8b8] max-w-[55ch] mx-auto">
            {study.summary}
          </p>
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-2 font-mono text-xs text-[#8a8a8a]">
            <span>
              Tier: <strong className="text-[#f59e0b] uppercase">{study.tier}</strong>
            </span>
            <span>·</span>
            <span>Prerequisite: Complete preceding system architecture case studies</span>
          </div>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/cases"
              className="neu-btn rounded-xl px-6 py-3 font-mono text-xs font-semibold text-[#f5f5f5]"
            >
              Return to Case Deck
            </Link>
          </div>
        </div>
      </AppChrome>
    );
  }

  // Reflection validation — must meet MIN_REFLECTION_CHARS and MIN_REFLECTION_WORDS
  const reflectionTrimmed = reflection.trim();
  const reflectionCharCount = reflectionTrimmed.length;
  const reflectionWordCount = reflectionTrimmed
    ? reflectionTrimmed.split(/\s+/).filter(Boolean).length
    : 0;
  const reflectionValid =
    reflectionCharCount >= MIN_REFLECTION_CHARS && reflectionWordCount >= MIN_REFLECTION_WORDS;

  const viewedSections = cloudProgress?.completedSections ?? [];
  const caseRewarded = has(caseAwardId(study.slug));
  const labEarned = Boolean(
    cloudProgress?.passed ||
    cloudProgress?.completedSections?.includes(6) ||
    has(labAwardId(study.slug)) ||
    isLabCompleted(awards, study.slug),
  );
  const isCompleted = caseRewarded || cloudProgress?.status === "completed";
  const sectionDone = (i: number) =>
    i === 6 ? labEarned : isCompleted || viewedSections.includes(i);
  const sectionsDone = SECTION_LABELS.map((_, i) => sectionDone(i));
  const doneCount = isCompleted ? SECTION_LABELS.length : sectionsDone.filter(Boolean).length;
  const isUnlockedByProgression = unlockedCases
    ? unlockedCases.includes(study.slug)
    : study.rcCost <= 0;
  const locked = !isUnlockedByProgression && !isCompleted;
  const caseRc = getCaseStudyRc(study.difficulty);
  const needed = unlockThreshold(study.rcCost);

  const progress = isCompleted ? 100 : Math.round((doneCount / SECTION_LABELS.length) * 100);

  const sampleCount = study.implementation?.samples?.length ?? 0;
  const activeLang = sampleCount > 0 ? Math.min(lang, sampleCount - 1) : 0;
  const sample = study.implementation?.samples?.[activeLang] ?? study.implementation?.samples?.[0];

  const levelCount = study.architecture?.levels?.length ?? 0;
  const activeLevel = levelCount > 0 ? Math.min(level, levelCount - 1) : 0;
  const diagram = study.architecture?.levels?.[activeLevel] ?? study.architecture?.levels?.[0];
  const activeMermaid =
    diagram?.mermaid || (study.architecture as any)?.mermaid || resolvedLab?.mermaid || "";

  const primer = study.primers?.[0];
  const activeFile = SECTION_FILES[step] || SECTION_FILES[0];

  const rawPracticeList: Exercise[] = Array.isArray(study.practice)
    ? study.practice
    : Array.isArray((study.practice as any)?.tasks)
      ? (study.practice as any).tasks.map((t: string, idx: number) => ({
          level: ["Understand", "Modify", "Build", "Think"][idx % 4] as PracticeLevel,
          title: `Challenge ${idx + 1}`,
          brief: t,
        }))
      : [];

  const practiceList: Exercise[] =
    rawPracticeList.length > 0
      ? rawPracticeList
      : [
          {
            level: "Understand",
            title: "Trace Request Flow",
            brief: `Trace how ${study.title} coordinates state transitions and handles invalid payloads.`,
          },
          {
            level: "Modify",
            title: "Add Metric Gauges",
            brief: `Introduce latency instrumentation and error counter telemetry into the system handler.`,
          },
          {
            level: "Build",
            title: "Concurrency Guard",
            brief: `Enforce boundary guards and validation checks for edge cases under burst workloads.`,
          },
          {
            level: "Think",
            title: "Distributed Failure Modes",
            brief: `What happens when upstream services timeout or partition under high concurrency?`,
          },
        ];

  const rawReflectionList: string[] = Array.isArray(study.reflection)
    ? study.reflection
    : typeof (study.reflection as any)?.takeaway === "string"
      ? [(study.reflection as any).takeaway, (study.reflection as any).nextSteps].filter(Boolean)
      : [];

  const reflectionList: string[] =
    rawReflectionList.length > 0
      ? rawReflectionList
      : [
          `How does ${study.title} maintain consistency and avoid race conditions under real-world workloads?`,
          "What architectural trade-offs did you make in your implementation, and what would you improve in a high-scale deployment?",
        ];

  const decisionsList: any[] =
    Array.isArray(study.decisions) && study.decisions.length > 0
      ? study.decisions
      : Array.isArray(study.tradeOffs) && study.tradeOffs.length > 0
        ? study.tradeOffs
        : [
            {
              title: "Primary Architecture Trade-off",
              what: "Explicit Boundary Validation & State Guarding",
              why: "Guarantees deterministic behavior and prevents unhandled state corruption under stress.",
              problemSolved: "Silent data desynchronization across concurrent clients.",
              withoutIt: "Inconsistent state requiring manual operational intervention.",
              tradeoff:
                "Slightly higher verification latency in exchange for strict data integrity.",
            },
          ];

  const techNotesList: TechNote[] = Array.isArray(study.techNotes)
    ? study.techNotes
    : (study.techNotes as any)?.notice
      ? [{ name: "System Note", kind: "Architecture", note: (study.techNotes as any).notice }]
      : [];

  const engineeringConceptsList: string[] = Array.isArray(study.engineeringConcepts)
    ? study.engineeringConcepts
    : [];

  if (locked) {
    if (study.tier === "premium") {
      return (
        <AppChrome>
          <div className="mx-auto max-w-[720px] px-5 py-20 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#241705] border border-[#f59e0b]/50 px-3.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#f59e0b] font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              🔒 Premium Case Study · {study.category}
            </span>
            <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight text-[#f5f5f5]">
              {study.title}
            </h1>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-[#b8b8b8]">
              {study.summary}
            </p>

            <div className="glass-panel mx-auto mt-8 max-w-[460px] rounded-3xl p-6 text-left border border-[#f59e0b]/30 bg-gradient-to-b from-[#1c1507]/90 to-[#120e05]/90 shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#f59e0b] font-bold">
                Premium Access Tier
              </p>
              <p className="mt-1 text-xl font-bold text-[#f5f5f5]">
                Requires KRUZ Premium Membership
              </p>
              <p className="mt-3 text-xs leading-relaxed text-[#d4d4d4]">
                Free-tier sequential unlocks stop at the foundational curriculum. Advanced
                distributed architectures, real-time fan-out, and high-concurrency rate limiters
                require verified premium access.
              </p>
            </div>

            <Link
              to="/cases"
              className="mt-6 inline-flex rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 px-5 py-2.5 font-mono text-xs font-bold text-[#f5f5f5] transition-all"
            >
              ← Back to Available Free Cases
            </Link>
          </div>
        </AppChrome>
      );
    }

    return (
      <AppChrome>
        <div className="mx-auto max-w-[720px] px-5 py-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 border-2 border-black px-3.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-black font-black shadow-xs">
            🔒 Locked Free-Tier Case · {study.category}
          </span>
          <h1 className="mt-3 text-balance text-3xl font-black tracking-tight text-black">
            {study.title}
          </h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-black font-medium">
            {study.summary}
          </p>
          <div className="glass-panel mx-auto mt-8 max-w-[460px] rounded-3xl p-6 text-left border-2 border-black bg-white text-black shadow-xs">
            <p className="font-mono text-[10px] uppercase tracking-widest text-black font-black">
              Sequential Progression Requirement
            </p>
            <p className="mt-1 text-lg font-black text-black">
              Complete previous case study to unlock
            </p>
            <p className="mt-3 text-xs leading-relaxed text-black font-medium">
              This case study is included in the free tier and unlocks automatically when you
              complete all 8 sections and pass the CodeArena lab of the preceding investigation.
            </p>
          </div>
          <Link
            to="/cases"
            className="mt-6 inline-flex rounded-xl bg-black px-5 py-2.5 font-mono text-xs font-black text-white border-2 border-black shadow-xs hover:bg-neutral-800 active:scale-[0.98] transition-all"
          >
            Go to Free Cases Library
          </Link>
        </div>
      </AppChrome>
    );
  }

  return (
    <AppChrome>
      <div className="mx-auto max-w-[1536px] px-3 sm:px-6 md:px-8 py-6">
        <div className="glass-panel overflow-hidden rounded-3xl border-2 border-black bg-white text-black shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black bg-neutral-50 px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-black font-bold">
                Case {study.index} / {study.category} · {study.subcategory}
              </span>
              <h1 className="text-base font-black tracking-tight text-black">{study.title}</h1>
              <span className="rounded-lg bg-white border-2 border-black px-2 py-0.5 font-mono text-[10px] font-black text-black">
                {study.learnerLevel}
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black border-2 border-black px-3 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                  <CheckCircle2 className="size-3 stroke-[2.5]" />
                  Completed · 100%
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 font-mono text-xs text-black">
              <span className="font-bold">Progress</span>
              <div className="h-2 w-40 overflow-hidden rounded-full bg-neutral-200 p-0.5 border border-black">
                <div
                  className="h-full rounded-full transition-all duration-300 bg-black"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-black font-black">{progress}%</span>
            </div>
          </div>

          {/* Company & Interview Intel Strip */}
          {(() => {
            const interviewMeta = getCaseInterviewBadges(study.slug || study.index);
            return (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black bg-white px-6 py-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-black text-white px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider shadow-xs">
                    <Briefcase className="size-3 stroke-[2.5]" />
                    {interviewMeta.roundType}
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[11px] font-black text-black flex items-center gap-1">
                      <Building2 className="size-3.5 text-neutral-800" />
                      Target Employers:
                    </span>
                    {interviewMeta.companies.map((comp) => (
                      <span
                        key={comp}
                        className="rounded-md bg-neutral-100 border border-black px-2 py-0.5 font-mono text-[10px] font-black text-black"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-[10px]">
                  <span className="rounded bg-neutral-100 border border-black/30 px-2 py-0.5 font-bold text-black">
                    {interviewMeta.targetRole}
                  </span>
                  <span className="hidden xl:inline text-neutral-600 font-medium italic">
                    &ldquo;{interviewMeta.interviewPrompt}&rdquo;
                  </span>
                </div>
              </div>
            );
          })()}

          <div className="grid lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr] border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
            {/* LEFT RAIL — VS Code Explorer Sidebar (Desktop only) */}
            <aside className="hidden lg:block border-r border-slate-200 bg-[#f8fafc]">
              <VSCodeExplorerSidebar
                step={step}
                setStep={handleSetStep}
                sectionsDone={sectionsDone}
                prerequisites={study.prerequisites}
                companionTab={companionTab}
                setCompanionTab={setCompanionTab}
                primer={primer}
                techNotesList={techNotesList}
                engineeringConceptsList={engineeringConceptsList}
                caseRewarded={caseRewarded}
                caseRc={caseRc}
                doneCount={doneCount}
                labEarned={labEarned}
                points={points}
              />
            </aside>

            {/* MAIN WORKSPACE / EDITOR COLUMN */}
            <div className="min-w-0 w-full flex flex-col bg-white">
              {/* VS Code Editor Tab Bar — Smooth Multi-Tab IDE Experience */}
              <div className="hidden lg:flex items-center justify-between border-b border-slate-200 bg-[#f1f5f9] select-none overflow-x-auto">
                <div className="flex items-center flex-nowrap min-w-0">
                  {openTabs.map((tabIdx) => {
                    const file = SECTION_FILES[tabIdx] || SECTION_FILES[0];
                    const isActive = step === tabIdx;
                    const isCode = tabIdx === 6;

                    return (
                      <div
                        key={file.name}
                        onClick={() => handleSetStep(tabIdx)}
                        className={`group flex items-center gap-2 px-3.5 py-2 text-xs font-mono border-r border-slate-200 transition-all cursor-pointer select-none ${
                          isActive
                            ? "border-t-2 border-[#0284c7] bg-white text-slate-900 font-semibold shadow-xs"
                            : "bg-[#f1f5f9] text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
                        }`}
                      >
                        {isCode ? (
                          <span className="text-[#b45309] font-mono font-bold text-[10px] px-1 py-0.2 rounded bg-amber-100">
                            PY
                          </span>
                        ) : (
                          <FileText
                            className={`size-3.5 transition-colors ${
                              isActive
                                ? "text-[#0284c7]"
                                : "text-slate-400 group-hover:text-slate-600"
                            }`}
                          />
                        )}
                        <span className="truncate max-w-[140px]">{file.name}</span>
                        {openTabs.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => closeTab(tabIdx, e)}
                            className="p-0.5 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 transition-colors ml-1"
                            title={`Close ${file.name}`}
                          >
                            <span className="text-[11px] leading-none">✕</span>
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Quick button to open Practice tab if not already open */}
                  {!openTabs.includes(6) && (
                    <button
                      type="button"
                      onClick={() => handleSetStep(6)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 border-r border-slate-200 transition-colors cursor-pointer"
                      title="Open 07_practice.py in Editor"
                    >
                      <span className="text-[#b45309] font-mono font-bold text-[10px] px-1 py-0.2 rounded bg-amber-100/70">
                        PY
                      </span>
                      <span>+ 07_practice.py</span>
                    </button>
                  )}
                </div>

                {/* Editor Tab Actions: Prev / Next */}
                <div className="flex items-center gap-1 px-3 shrink-0">
                  <button
                    type="button"
                    disabled={step === 0}
                    onClick={() => handleSetStep(Math.max(0, step - 1))}
                    className="px-2.5 py-1 rounded font-mono text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Previous section (Alt+Left)"
                  >
                    ← Prev
                  </button>
                  <span className="font-mono text-[10px] text-slate-500 px-1">
                    {String(step + 1).padStart(2, "0")} / 08
                  </span>
                  <button
                    type="button"
                    disabled={step === SECTION_FILES.length - 1}
                    onClick={() => handleSetStep(Math.min(SECTION_FILES.length - 1, step + 1))}
                    className="px-2.5 py-1 rounded font-mono text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Next section (Alt+Right)"
                  >
                    Next →
                  </button>
                </div>
              </div>

              {/* VS Code Breadcrumbs */}
              <div className="hidden lg:flex items-center gap-1.5 px-5 py-1.5 border-b border-slate-200 bg-white font-mono text-[11px] text-slate-500">
                <span>kruzz-workspace</span>
                <span>›</span>
                <span>cases</span>
                <span>›</span>
                <span className="text-[#0284c7]">{study.slug}</span>
                <span>›</span>
                <span className="text-slate-900 font-medium">{activeFile.name}</span>
              </div>

              {/* MOBILE STICKY SUBHEADER (< lg) */}
              <div className="lg:hidden sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/95 backdrop-blur-md px-3.5 py-2.5">
                <button
                  type="button"
                  onClick={() => setMobileSectionsOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-3 py-1.5 font-mono text-xs font-semibold text-slate-800 hover:border-[#0284c7]/40 transition-colors"
                >
                  <FileText className="size-3.5 text-[#0284c7]" />
                  <span className="truncate max-w-[150px] sm:max-w-[220px]">{activeFile.name}</span>
                  <ChevronDown className="size-3 text-slate-500" />
                </button>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-black">{progress}%</span>
                  <button
                    type="button"
                    onClick={() => setMobileCompanionOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-white border-2 border-black px-3 py-1.5 font-mono text-xs font-black text-black shadow-xs"
                  >
                    <Lightbulb className="size-3.5 text-black" />
                    <span>Notes & RC</span>
                  </button>
                </div>
              </div>

              <div
                ref={workspaceTopRef}
                key={step}
                className="animate-in fade-in-50 duration-200 ease-out p-4 sm:p-6 lg:p-8 min-w-0 w-full"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#007acc] font-bold">
                  {String(step + 1).padStart(2, "0")} — {SECTION_KICKERS[step]}
                </p>

                {/* 01 — DISCOVER */}
                {step === 0 && (
                  <>
                    <H2>The situation</H2>
                    <p className="mt-3 w-full text-pretty text-sm leading-relaxed text-ink2">
                      {study.discover?.situation || (study.discover as any)?.task}
                    </p>
                    <ArrowChain steps={study.discover?.humanFlow ?? []} />
                    <div className="mt-5 rounded-2xl bg-rose/40 p-5 ring-1 ring-primary/15">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-ink2">
                        The question
                      </p>
                      <p className="mt-2 text-pretty text-sm font-medium leading-relaxed">
                        {study.discover?.question ||
                          (study.discover as any)?.action ||
                          "How does this system guarantee reliability and correctness?"}
                      </p>
                    </div>
                    <Kicker>Why the problem exists</Kicker>
                    <ul className="mt-3 space-y-2">
                      {(study.discover?.whyItExists ?? []).map((r) => (
                        <li key={r} className="flex gap-3 text-sm text-ink2">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                          <span className="text-pretty leading-relaxed">{r}</span>
                        </li>
                      ))}
                    </ul>
                    <Kicker>What you will be able to do</Kicker>
                    <ul className="mt-3 space-y-2">
                      {(study.learningObjectives ?? []).map((o) => (
                        <li
                          key={o}
                          className="rounded-lg bg-card/60 px-3 py-2 text-[13px] leading-relaxed text-ink2 ring-1 ring-line/70"
                        >
                          {o}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {/* 02 — UNDERSTAND */}
                {step === 1 && (
                  <>
                    <H2>How the system behaves</H2>
                    <p className="mt-3 w-full text-pretty text-sm leading-relaxed text-ink2">
                      {study.understand?.overview}
                    </p>

                    <Kicker>Each component: what, why, what it does</Kicker>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {(study.understand?.components ?? []).map((c) => (
                        <div
                          key={c.name}
                          className="rounded-2xl bg-card/60 p-4 ring-1 ring-line/70"
                        >
                          <p className="text-sm font-semibold tracking-tight">{c.name}</p>
                          <dl className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-ink2">
                            <dt className="font-mono text-[10px] uppercase tracking-widest">
                              What is it
                            </dt>
                            <dd>{c.whatIsIt}</dd>
                            <dt className="font-mono text-[10px] uppercase tracking-widest">
                              Why it exists
                            </dt>
                            <dd>{c.whyItExists}</dd>
                            <dt className="font-mono text-[10px] uppercase tracking-widest">
                              What it does
                            </dt>
                            <dd>{c.whatItDoes}</dd>
                          </dl>
                        </div>
                      ))}
                    </div>

                    {study.understand?.analogy && (
                      <>
                        <Kicker>Analogy · {study.understand.analogy.title}</Kicker>
                        <ArrowChain steps={study.understand.analogy.everyday ?? []} />
                        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink2">
                          Mapped to the technical model
                        </p>
                        <ArrowChain steps={study.understand.analogy.technical ?? []} />
                      </>
                    )}

                    <Kicker>The flow, step by step</Kicker>
                    <ol className="mt-3 space-y-2">
                      {(study.understand?.flow ?? []).map((s, i) => (
                        <li key={s}>
                          <div className="flex items-center gap-3 rounded-lg bg-card/60 px-3 py-2 ring-1 ring-line/70">
                            <span className="font-mono text-[10px] text-primary">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="text-sm">{s}</span>
                          </div>
                          {i < (study.understand?.flow?.length ?? 0) - 1 && (
                            <div className="ml-6 h-3 w-px bg-line" />
                          )}
                        </li>
                      ))}
                    </ol>
                  </>
                )}

                {/* 03 — PRINCIPLES */}
                {step === 2 && (
                  <>
                    <H2>What holds this system up</H2>
                    <p className="mt-3 w-full text-pretty text-sm leading-relaxed text-ink2">
                      Every concept follows the same shape: what it is, why it exists, an everyday
                      analogy, the technical explanation, and where it appears in this case.
                    </p>
                    <div className="mt-5 space-y-3">
                      {(study.concepts && study.concepts.length > 0
                        ? study.concepts
                        : (study.engineeringConcepts ?? []).map((name: string, idx: number) => ({
                            id: `concept-${idx}`,
                            name,
                            difficulty: "Core",
                            simpleDefinition: `${name} provides structured coordination and reliability guarantees in ${study.title}.`,
                            whyItExists:
                              "Mitigates failure modes, prevents data corruption, and ensures correct operational semantics.",
                            realWorldAnalogy:
                              "Like a traffic signal preventing gridlock at a crowded intersection.",
                            technicalExplanation: `The system applies ${name} as a strict architectural contract across data and transport boundaries.`,
                            caseApplication: `Directly drives the state machine and invariant checking in this case study.`,
                            commonMistakes: [
                              "Assuming best-effort success without explicit timeouts or rollback mechanisms.",
                            ],
                            practice: [
                              "Trace execution flow when input parameters violate invariant constraints.",
                            ],
                          }))
                      ).map((c: any) => {
                        const open = openConcept === c.id;
                        return (
                          <div
                            key={c.id}
                            className="overflow-hidden rounded-2xl bg-card/60 ring-1 ring-line/70"
                          >
                            <button
                              type="button"
                              onClick={() => setOpenConcept(open ? null : c.id)}
                              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                            >
                              <span className="text-sm font-semibold tracking-tight">{c.name}</span>
                              <span className="flex items-center gap-2 font-mono text-[10px] text-ink2">
                                <span className="rounded bg-butter/70 px-2 py-0.5">
                                  {c.difficulty || "Core"}
                                </span>
                                {open ? "−" : "+"}
                              </span>
                            </button>
                            {open && (
                              <div className="border-t border-line/70 px-4 py-3">
                                <dl className="space-y-2 text-[12px] leading-relaxed text-ink2">
                                  <dt className="font-mono text-[10px] uppercase tracking-widest">
                                    Simple definition
                                  </dt>
                                  <dd>{c.simpleDefinition}</dd>
                                  <dt className="font-mono text-[10px] uppercase tracking-widest">
                                    Why it exists
                                  </dt>
                                  <dd>{c.whyItExists}</dd>
                                  <dt className="font-mono text-[10px] uppercase tracking-widest">
                                    Real-world analogy
                                  </dt>
                                  <dd>{c.realWorldAnalogy}</dd>
                                  <dt className="font-mono text-[10px] uppercase tracking-widest">
                                    Technical explanation
                                  </dt>
                                  <dd>{c.technicalExplanation}</dd>
                                  <dt className="font-mono text-[10px] uppercase tracking-widest">
                                    Where it appears here
                                  </dt>
                                  <dd>{c.caseApplication}</dd>
                                </dl>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-xl bg-rose/40 p-3 ring-1 ring-primary/10">
                                    <p className="font-mono text-[10px] uppercase tracking-widest text-ink2">
                                      Common mistakes
                                    </p>
                                    <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-ink2">
                                      {(c.commonMistakes ?? []).map((m: string) => (
                                        <li key={m}>· {m}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="rounded-xl bg-mint/40 p-3 ring-1 ring-primary/10">
                                    <p className="font-mono text-[10px] uppercase tracking-widest text-ink2">
                                      Practice
                                    </p>
                                    <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-ink2">
                                      {(
                                        ((c as any).practice ||
                                          (c as any).microDrills ||
                                          []) as string[]
                                      ).map((p: string) => (
                                        <li key={p}>· {p}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* 04 — ARCHITECTURE */}
                {step === 3 && (
                  <>
                    <H2>How the pieces connect</H2>
                    <p className="mt-3 w-full text-pretty text-sm leading-relaxed text-ink2">
                      {study.architecture?.caption ||
                        (study.architecture as any)?.overview ||
                        `Architectural blueprint and component topology for ${study.title}.`}
                    </p>
                    {(study.architecture?.levels ?? []).length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {study.architecture!.levels.map((l: any, i: number) => (
                          <button
                            key={l.title || i}
                            type="button"
                            onClick={() => setLevel(i)}
                            className={`rounded-lg px-3 py-1.5 font-mono text-[11px] ring-1 transition-colors ${
                              i === activeLevel
                                ? "bg-primary/10 text-ink ring-primary/30"
                                : "bg-card/60 text-ink2 ring-line/70 hover:text-ink"
                            }`}
                          >
                            {l.title || `Level ${i + 1}`}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 rounded-2xl bg-paper/70 p-5 ring-1 ring-primary/10">
                      <p className="mb-4 text-[12px] leading-relaxed text-ink2">
                        {diagram?.description ||
                          "Interactive component flow and state transitions."}
                      </p>
                      {activeMermaid && <MermaidDiagram chart={activeMermaid} />}
                      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-line/70 pt-3 font-mono text-[10px] text-ink2">
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-rose ring-1 ring-primary/20" />
                          request in
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-mint ring-1 ring-primary/20" />
                          process
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-butter ring-1 ring-primary/20" />
                          persist
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* 05 — DECISIONS */}
                {step === 4 && (
                  <>
                    <H2>Why this technology, and what it costs</H2>
                    <p className="mt-3 w-full text-pretty text-sm leading-relaxed text-ink2">
                      Every decision answers the same six questions, so you learn why a technology
                      exists rather than memorising its name.
                    </p>
                    <div className="mt-5 space-y-4">
                      {decisionsList.map((d: any, idx: number) => {
                        if (typeof d === "string") {
                          return (
                            <div
                              key={d + idx}
                              className="rounded-2xl bg-card/70 p-5 ring-1 ring-line/80 shadow-xs"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                                  {`Decision ${String(idx + 1).padStart(2, "0")}`}
                                </span>
                              </div>
                              <p className="text-sm font-semibold tracking-tight text-ink">{`Architecture Decision ${idx + 1}`}</p>
                              <p className="mt-2 text-[13px] leading-relaxed text-ink2">{d}</p>
                            </div>
                          );
                        }

                        // Determine fields across all schema variants
                        const isSimpleChoiceRationale = Boolean(
                          d.choice && d.rationale && !d.title && !d.decision,
                        );
                        const isChoiceABVerdict = Boolean(d.choiceA && (d.choiceB || d.verdict));

                        const title =
                          d.title || d.decision || d.choice || `Architecture Decision ${idx + 1}`;

                        // Avoid duplicating the title in "what" when title was derived from choice
                        const what = isSimpleChoiceRationale
                          ? undefined
                          : d.what ||
                            d.choiceA ||
                            (d.choice && d.choice !== title ? d.choice : undefined);

                        const why = d.why || d.verdict || d.rationale;
                        const problem = d.problemSolved;
                        const withoutIt = d.withoutIt;
                        const altText = d.choiceB
                          ? d.choiceB
                          : Array.isArray(d.alternatives)
                            ? d.alternatives.join(" · ")
                            : d.alternatives || null;
                        const tradeoff = d.tradeoff;

                        return (
                          <div
                            key={title + idx}
                            className="rounded-2xl bg-card/70 p-5 ring-1 ring-line/80 shadow-xs transition-all hover:ring-line"
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="font-mono text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                                {`Decision ${String(idx + 1).padStart(2, "0")}`}
                              </span>
                              {isChoiceABVerdict && (
                                <span className="font-mono text-[10px] text-ink2">
                                  A/B Architecture Trade-off
                                </span>
                              )}
                            </div>

                            <p className="text-sm font-bold tracking-tight text-ink">{title}</p>

                            <dl className="mt-3 space-y-2 text-[12px] leading-relaxed text-ink2">
                              {what && (
                                <div className="rounded-xl bg-paper/60 p-3 ring-1 ring-line/40">
                                  <dt className="font-mono text-[10px] uppercase tracking-widest font-bold text-primary mb-1">
                                    {isChoiceABVerdict
                                      ? "Chosen Architecture (Option A)"
                                      : "Choice / Pattern"}
                                  </dt>
                                  <dd className="font-medium text-ink">{what}</dd>
                                </div>
                              )}

                              {altText && (
                                <div className="rounded-xl bg-paper/40 p-3 ring-1 ring-line/30">
                                  <dt className="font-mono text-[10px] uppercase tracking-widest font-bold text-ink2 mb-1">
                                    {isChoiceABVerdict
                                      ? "Alternative Considered (Option B)"
                                      : "Alternatives Considered"}
                                  </dt>
                                  <dd className="text-ink2">{altText}</dd>
                                </div>
                              )}

                              {why && (
                                <div className="pt-1">
                                  <dt className="font-mono text-[10px] uppercase tracking-widest font-bold text-primary mb-0.5">
                                    {isChoiceABVerdict
                                      ? "Verdict & Engineering Justification"
                                      : "Why & Rationale"}
                                  </dt>
                                  <dd className="text-ink leading-relaxed">{why}</dd>
                                </div>
                              )}

                              {problem && (
                                <div className="pt-1">
                                  <dt className="font-mono text-[10px] uppercase tracking-widest font-bold text-primary mb-0.5">
                                    Problem it solves
                                  </dt>
                                  <dd className="text-ink2">{problem}</dd>
                                </div>
                              )}

                              {withoutIt && (
                                <div className="pt-1">
                                  <dt className="font-mono text-[10px] uppercase tracking-widest font-bold text-rose mb-0.5">
                                    Without it (Failure mode)
                                  </dt>
                                  <dd className="text-ink2">{withoutIt}</dd>
                                </div>
                              )}
                            </dl>

                            {tradeoff && (
                              <div className="mt-3 rounded-xl bg-butter/40 border border-butter/70 px-3.5 py-2.5 text-[12px] leading-relaxed text-ink">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-ink2 font-bold mr-1.5">
                                  Trade-off ·
                                </span>
                                <span>{tradeoff}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {Array.isArray(study.tradeOffs) &&
                      study.tradeOffs.length > 0 &&
                      typeof study.tradeOffs[0] === "string" && (
                        <div className="mt-6 rounded-2xl bg-paper/60 border border-line/70 p-5 shadow-xs">
                          <p className="font-mono text-[11px] uppercase tracking-widest text-ink font-bold mb-3 flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-primary" />
                            System Trade-Off Analysis
                          </p>
                          <ul className="space-y-2.5 text-[12px] leading-relaxed text-ink2">
                            {study.tradeOffs.map((t: string, i: number) => (
                              <li key={i} className="flex gap-2.5">
                                <span className="font-mono text-primary font-bold">·</span>
                                <span className="text-ink">{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </>
                )}

                {/* 06 — IMPLEMENTATION */}
                {step === 5 && (
                  <>
                    <H2>From reasoning to code</H2>
                    <p className="mt-3 w-full text-pretty text-sm leading-relaxed text-ink2">
                      {study.implementation?.behaviour ||
                        `Concrete implementation algorithms and reference code across Python, Java, and C.`}
                    </p>

                    <Kicker>Language-independent algorithm</Kicker>
                    <ol className="mt-3 space-y-2">
                      {((study.implementation?.algorithm ?? []).length > 0
                        ? study.implementation!.algorithm!
                        : [
                            "Parse input request and validate parameters against boundary schema.",
                            "Acquire resource lock or verify preconditions in persistent state.",
                            "Execute state mutation with transactional rollback protection.",
                            "Dispatch confirmation result and release temporary operational locks.",
                          ]
                      ).map((s: string, i: number) => (
                        <li key={s} className="flex gap-3 text-sm text-ink2">
                          <span className="font-mono text-[11px] text-primary">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-pretty leading-relaxed">{s}</span>
                        </li>
                      ))}
                    </ol>

                    {(study.implementation?.ladder ?? []).length > 0 && (
                      <>
                        <Kicker>The implementation ladder</Kicker>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {(study.implementation?.ladder ?? []).map((l: any) => (
                            <div
                              key={l.level || l.step}
                              className="rounded-xl bg-card/60 p-3 ring-1 ring-line/70"
                            >
                              <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
                                {l.level || `Step ${l.step}`} · {l.title || l.focus}
                              </p>
                              <p className="mt-1 text-[12px] leading-relaxed text-ink2">
                                {l.detail || l.buildsOn}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Language tabs */}
                    {study.implementation?.samples && study.implementation.samples.length > 0 && (
                      <div className="mt-5 flex flex-wrap items-center gap-1.5 rounded-xl bg-black/40 p-1.5 border border-white/[0.06] max-w-full">
                        {study.implementation.samples.map((s: any, i: number) => (
                          <button
                            key={s.language || i}
                            type="button"
                            onClick={() => setLang(i)}
                            className={`rounded-lg px-3.5 py-2 sm:py-1.5 font-mono text-[11px] font-bold transition-all cursor-pointer ${
                              i === activeLang
                                ? "bg-black text-white border-2 border-black font-black shadow-xs"
                                : "bg-white text-black border-2 border-black/30 hover:border-black font-bold"
                            }`}
                          >
                            {(s.language || "Code").charAt(0).toUpperCase() +
                              (s.language || "code").slice(1)}
                          </button>
                        ))}
                        <span className="ml-auto px-2 font-mono text-[10px] text-[#777]">
                          {sample?.filename ||
                            `${sample?.language || "solution"}.${sample?.language === "python" ? "py" : sample?.language === "c" ? "c" : "java"}`}
                        </span>
                      </div>
                    )}

                    {(() => {
                      const codeToDisplay =
                        sample?.code ||
                        (study.implementation as any)?.code ||
                        resolvedLab.starterCode;
                      if (!codeToDisplay) return null;
                      const langKey =
                        (
                          {
                            python: "Python",
                            java: "Java",
                            javascript: "JavaScript",
                            c: "C",
                          } as const
                        )[
                          String(sample?.language ?? "python").toLowerCase() as
                            "python" | "java" | "javascript" | "c"
                        ] ?? "Python";
                      return (
                        <CodeEditor
                          value={codeToDisplay}
                          onChange={() => {}}
                          language={langKey}
                          disabled={true}
                          rows={Math.max(12, codeToDisplay.split("\n").length + 1)}
                        />
                      );
                    })()}

                    {sample?.explanations && sample.explanations.length > 0 && (
                      <>
                        <Kicker>Line by line, in plain language</Kicker>
                        <div className="mt-3 space-y-2">
                          {sample.explanations.map((e: any, idx: number) => (
                            <div
                              key={(e.code || "") + idx}
                              className="rounded-xl bg-card/60 p-3 ring-1 ring-line/70"
                            >
                              <code className="font-mono text-[11px] text-primary">{e.code}</code>
                              <p className="mt-1 text-[12px] leading-relaxed text-ink2">
                                {e.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {study.implementation?.simulationNote && (
                      <p className="mt-5 rounded-xl bg-sky/40 p-3 text-[12px] leading-relaxed text-ink2 ring-1 ring-primary/10">
                        <span className="font-mono text-[10px] uppercase tracking-widest">
                          Educational model ·{" "}
                        </span>
                        {study.implementation.simulationNote}
                      </p>
                    )}
                  </>
                )}

                {/* 07 — PRACTICE */}
                {step === 6 && (
                  <>
                    <H2>Understand, modify, build, think</H2>
                    <div className="mt-3 grid gap-3">
                      {practiceList.map((ch, i) => (
                        <div
                          key={ch.title || i}
                          className="rounded-2xl bg-card/60 p-4 ring-1 ring-line/70"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-ink2">
                              Task {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="rounded bg-butter/70 px-2 py-1 font-mono text-[10px]">
                              {ch.level}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-semibold tracking-tight">{ch.title}</p>
                          <p className="mt-1.5 text-pretty text-[12px] leading-relaxed text-ink2">
                            {ch.brief}
                          </p>
                          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink2">
                            {PRACTICE_PURPOSE[ch.level] || "Hands-on engineering application"}
                          </p>
                        </div>
                      ))}
                    </div>

                    <CodeArena
                      lab={resolvedLab}
                      earned={labEarned}
                      caseSlug={study.slug}
                      caseRc={caseRc}
                      isAuthenticated={isAuthenticated}
                      onSolved={() => {
                        // Server awards the lab + case-complete RC on pass.
                        // Keep the learner on the page so they can review their pass score,
                        // continue to Section 08 (Reflection), or click Back to Arena Centre.
                      }}
                    />
                  </>
                )}

                {/* 08 — REFLECTION */}
                {step === 7 && (
                  <>
                    <H2>Now explain it yourself</H2>
                    <ul className="mt-4 space-y-2">
                      {reflectionList.map((q, idx) => (
                        <li
                          key={q || idx}
                          className="rounded-lg bg-sky/40 px-3 py-2 text-pretty text-sm leading-relaxed ring-1 ring-primary/10"
                        >
                          {q}
                        </li>
                      ))}
                    </ul>
                    <label
                      htmlFor="reflection"
                      className="mt-6 block font-mono text-[11px] uppercase tracking-[0.18em] text-ink2"
                    >
                      Your written explanation
                    </label>
                    <textarea
                      id="reflection"
                      rows={6}
                      value={reflection}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReflection(val);
                        if (isAuthenticated && val.trim()) {
                          saveProgress({
                            caseSlug: study.slug,
                            reflection: val.trim(),
                          }).catch(() => {});
                        }
                      }}
                      placeholder="Explain the system in your own words: what each part is responsible for, why it exists, and what you would change. Minimum 300 characters and 50 words."
                      className={`mt-2 w-full rounded-2xl bg-white p-4 text-sm leading-relaxed text-black outline-none border-2 border-black placeholder:text-neutral-500 transition-colors ${
                        reflectionValid ? "ring-2 ring-black" : "focus:ring-2 focus:ring-black"
                      }`}
                    />
                    {/* Character / word counter */}
                    <div className="mt-2 flex items-center gap-4 font-mono text-[10px]">
                      <span
                        className={
                          reflectionCharCount >= MIN_REFLECTION_CHARS
                            ? "text-black font-black"
                            : "text-neutral-500"
                        }
                      >
                        {reflectionCharCount} / {MIN_REFLECTION_CHARS} chars
                      </span>
                      <span className="text-black">·</span>
                      <span
                        className={
                          reflectionWordCount >= MIN_REFLECTION_WORDS
                            ? "text-black font-black"
                            : "text-neutral-500"
                        }
                      >
                        {reflectionWordCount} / {MIN_REFLECTION_WORDS} words
                      </span>
                      {reflectionValid && (
                        <span className="text-black font-black">Ready to complete</span>
                      )}
                      {isAuthenticated && reflectionTrimmed && (
                        <span className="text-neutral-500 ml-auto">synced to cloud</span>
                      )}
                    </div>
                  </>
                )}

                {step === 7 && isCompleted && (
                  <div className="mt-8 rounded-3xl bg-neutral-50 border-2 border-black p-6 shadow-xs text-black">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-black border-2 border-black flex items-center justify-center text-white font-bold shadow-xs">
                          <CheckCircle2 className="size-6 stroke-[2.5]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-black font-black">
                              Investigation Mastered
                            </span>
                            <span className="rounded-md bg-white text-black font-mono text-[10px] px-2 py-0.5 font-black border-2 border-black">
                              +{caseRc} RC Banked
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-black mt-0.5">
                            {study.title} Cleared!
                          </h3>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/cases" })}
                        className="rounded-xl bg-black border-2 border-black px-5 py-2.5 font-mono text-xs font-black text-white shadow-xs hover:bg-neutral-800 transition-all cursor-pointer"
                      >
                        ✓ Back to Arena Centre
                      </button>
                    </div>
                  </div>
                )}

                {step === 6 ? (
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-neutral-50 border-2 border-black p-4 shadow-xs">
                    <p className="text-[12px] leading-relaxed text-black font-medium">
                      {labEarned
                        ? `Practice complete — you passed the lab at 80%+! Proceed to reflection to complete the case study.`
                        : `This section unlocks only by passing the AI-judged code lab above at 80% or higher.`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {labEarned ? (
                        <button
                          type="button"
                          onClick={() => handleSetStep(7)}
                          className="rounded-xl bg-black border-2 border-black px-5 py-2.5 font-mono text-xs font-black text-white shadow-xs hover:bg-neutral-800 transition-all cursor-pointer"
                        >
                          Proceed to Reflection (Step 08) →
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetStep(7)}
                          className="rounded-xl bg-white border-2 border-black px-4 py-2.5 font-mono text-xs font-black text-black hover:bg-neutral-100 shadow-xs transition-all cursor-pointer"
                          title="Preview Reflection prompt"
                        >
                          Preview Reflection (Step 08) →
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/cases" })}
                        className="rounded-xl bg-white border-2 border-black px-4 py-2.5 font-mono text-xs font-black text-black hover:bg-neutral-100 shadow-xs transition-all cursor-pointer"
                      >
                        Back to the Arena Centre
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-neutral-50 border-2 border-black p-4 shadow-xs">
                    <div className="flex-1">
                      <p className="text-[12px] leading-relaxed text-black font-medium">
                        {step === 7
                          ? caseRewarded
                            ? "Case study fully mastered and RC points banked."
                            : !labEarned
                              ? "Pass the Practice lab first, then write your reflection to complete."
                              : !reflectionValid
                                ? `Write your reflection (${reflectionCharCount}/${MIN_REFLECTION_CHARS} chars, ${reflectionWordCount}/${MIN_REFLECTION_WORDS} words) to unlock completion.`
                                : "Reflection meets requirements. Ready to complete this case study."
                          : sectionsDone[step]
                            ? `Section ${step + 1} of 8 viewed.`
                            : `Finished reading this section? Mark it done to track progress.`}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={
                        step === 7
                          ? !labEarned || !reflectionValid || caseRewarded
                          : sectionsDone[step]
                      }
                      onClick={async () => {
                        if (isAuthenticated) {
                          if (step === 7 && labEarned && reflectionValid && !caseRewarded) {
                            try {
                              await markComplete({
                                caseSlug: study.slug,
                                reflection: reflectionTrimmed,
                              });
                              toast.success(`+${caseRc} RC — Case study complete!`);
                            } catch (err: unknown) {
                              toast.error((err as Error).message || "Failed to complete case");
                            }
                          } else {
                            saveProgress({
                              caseSlug: study.slug,
                              completedSections: [step],
                            }).catch(() => {});
                          }
                        }
                        if (step !== 7) {
                          handleSetStep(Math.min(SECTION_LABELS.length - 1, step + 1));
                        }
                      }}
                      className="rounded-xl bg-black border-2 border-black px-4 py-2.5 font-mono text-xs font-black text-white shadow-xs hover:bg-neutral-800 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    >
                      {step === 7
                        ? caseRewarded
                          ? "Case Study Mastered"
                          : !labEarned
                            ? "Pass practice first"
                            : !reflectionValid
                              ? `Reflection: ${reflectionCharCount}/${MIN_REFLECTION_CHARS} chars`
                              : `Complete Case + Claim +${caseRc} RC`
                        : sectionsDone[step]
                          ? "Viewed"
                          : "Mark section done"}
                    </button>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t-2 border-black pt-4">
                  <button
                    type="button"
                    disabled={step === 0}
                    onClick={() => handleSetStep(Math.max(0, step - 1))}
                    className="rounded-xl bg-white border-2 border-black px-4 py-2 font-mono text-xs font-black text-black hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-xs transition-all active:scale-95"
                    title="Previous section (Alt+Left)"
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileSectionsOpen(true)}
                    className="lg:hidden flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-black font-black px-2.5 py-1 rounded-lg border-2 border-black bg-white hover:bg-neutral-100"
                  >
                    <span>{String(step + 1).padStart(2, "0")} / 08</span>
                    <BookOpen className="size-3 text-black" />
                  </button>
                  <span className="hidden lg:inline font-mono text-[11px] uppercase tracking-widest text-black font-black">
                    {String(step + 1).padStart(2, "0")} / 08
                  </span>
                  <button
                    type="button"
                    disabled={step === SECTION_LABELS.length - 1}
                    onClick={() => handleSetStep(Math.min(SECTION_LABELS.length - 1, step + 1))}
                    className="rounded-xl bg-black border-2 border-black px-4 py-2 font-mono text-xs font-black text-white shadow-xs hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all active:scale-95"
                    title="Next section (Alt+Right)"
                  >
                    Next →
                  </button>
                </div>

                {/* VS Code Bottom Status Bar */}
                <div className="flex flex-wrap items-center justify-between border-t border-[#2d2d2d] bg-[#007acc] text-white px-3 py-1 font-mono text-[11px] select-none mt-8 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 lg:-mx-8 lg:-mb-8">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold">
                      <GitBranch className="size-3" />
                      main
                    </span>
                    <span>&bull;</span>
                    <span>0 errors, 0 warnings</span>
                    <span>&bull;</span>
                    <span className="font-semibold">{activeFile.label}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span>{progress}% complete</span>
                    <span>&bull;</span>
                    <span>UTF-8</span>
                    <span>&bull;</span>
                    <span>{step === 6 ? resolvedLab?.language || "Python" : "Markdown"}</span>
                    <span>&bull;</span>
                    <span className="font-bold">{points} RC</span>
                  </div>
                </div>
              </div>
              {/* End inner content */}
            </div>
            {/* End MAIN WORKSPACE COLUMN */}
          </div>
        </div>

        {/* MOBILE SECTIONS DRAWER (Left Slide-Over) */}
        {mobileSectionsOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setMobileSectionsOpen(false)}
          >
            <div
              className="fixed inset-y-0 left-0 w-[85vw] max-w-[320px] bg-[#181818] border-r border-[#2d2d2d] p-0 shadow-2xl overflow-y-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#2d2d2d] bg-[#1f1f1f] p-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#007acc] font-bold">
                    Case Workspace
                  </p>
                  <h3 className="text-sm font-bold text-[#f5f5f5]">{study.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSectionsOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8a8a8a] hover:text-[#f5f5f5]"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <VSCodeExplorerSidebar
                  step={step}
                  setStep={setStep}
                  sectionsDone={sectionsDone}
                  prerequisites={study.prerequisites}
                  companionTab={companionTab}
                  setCompanionTab={setCompanionTab}
                  primer={primer}
                  techNotesList={techNotesList}
                  engineeringConceptsList={engineeringConceptsList}
                  caseRewarded={caseRewarded}
                  caseRc={caseRc}
                  doneCount={doneCount}
                  labEarned={labEarned}
                  points={points}
                  onSelect={() => setMobileSectionsOpen(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* MOBILE COMPANION DRAWER (Right Slide-Over) */}
        {mobileCompanionOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setMobileCompanionOpen(false)}
          >
            <div
              className="fixed inset-y-0 right-0 w-[90vw] max-w-[380px] bg-white border-l-2 border-black p-5 shadow-2xl overflow-y-auto space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-black font-black">
                    Knowledge & Wallet
                  </p>
                  <h3 className="text-sm font-black text-black">Case Companion</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileCompanionOpen(false)}
                  className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-black border-2 border-black cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
              <CompanionHub
                companionTab={companionTab}
                setCompanionTab={setCompanionTab}
                primer={primer}
                techNotesList={techNotesList}
                engineeringConceptsList={engineeringConceptsList}
                caseRewarded={caseRewarded}
                caseRc={caseRc}
                doneCount={doneCount}
                labEarned={labEarned}
              />
            </div>
          </div>
        )}
      </div>
    </AppChrome>
  );
}
