import { useEffect, useState } from "react";
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
} from "@/data/schema";
import { CodeArena } from "@/components/CodeArena";
import { CodeEditor } from "@/components/CodeEditor";
import { RCWalletPanel } from "@/components/RCWallet";
import {
  RC_RULES,
  caseAwardId,
  isUnlocked,
  labAwardId,
  sectionAwardId,
  unlockThreshold,
  isStudyComplete,
} from "@/lib/rc";
import { toast } from "sonner";
import { useWallet } from "@/lib/account";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CheckCircle2, Sparkles, Award } from "lucide-react";

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
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ccff00] font-bold">
          Case Index
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#f5f5f5]">
          No such case study
        </h1>
        <p className="mt-3 text-sm text-[#8a8a8a]">
          That investigation isn&rsquo;t on the board yet.
        </p>
        <Link
          to="/cases"
          className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-[#d4ff00] to-[#ccff00] px-5 py-2.5 font-mono text-xs font-black text-[#080808] shadow-[0_0_15px_rgba(204,255,0,0.4)]"
        >
          Back to the Arena Centre
        </Link>
      </div>
    </AppChrome>
  );
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-2 max-w-[34ch] text-balance text-2xl font-semibold tracking-tight">
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

function CaseStudyPage() {
  const { slug } = Route.useLoaderData();
  const study = useQuery(api.caseStudies.getBySlug, { slug }) as unknown as
    CaseStudy | undefined | null;
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState(0);
  const [level, setLevel] = useState(0);
  const [openConcept, setOpenConcept] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const [companionTab, setCompanionTab] = useState<"primer" | "principles" | "concepts">("primer");

  const { points, has, awards, isAuthenticated } = useWallet();
  const cloudProgress = useQuery(
    api.caseProgress.getCaseProgress,
    isAuthenticated && study ? { caseSlug: study.slug } : "skip",
  );
  const saveProgress = useMutation(api.caseProgress.saveCaseProgress);
  const markComplete = useMutation(api.caseProgress.markCaseComplete);
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

  // Reflection validation — must meet MIN_REFLECTION_CHARS and MIN_REFLECTION_WORDS
  const reflectionTrimmed = reflection.trim();
  const reflectionCharCount = reflectionTrimmed.length;
  const reflectionWordCount = reflectionTrimmed
    ? reflectionTrimmed.split(/\s+/).filter(Boolean).length
    : 0;
  const reflectionValid =
    reflectionCharCount >= MIN_REFLECTION_CHARS && reflectionWordCount >= MIN_REFLECTION_WORDS;

  if (study === undefined) {
    return (
      <AppChrome>
        <div className="mx-auto max-w-[1240px] px-5 py-32 text-center">
          <div className="inline-block size-6 animate-spin rounded-full border-2 border-[#ccff00] border-t-transparent mb-4" />
          <p className="font-mono text-xs uppercase tracking-widest text-[#ccff00]">
            Accessing Case Dossier from Database...
          </p>
        </div>
      </AppChrome>
    );
  }

  if (!study) {
    return <CaseNotFound />;
  }

  const viewedSections = cloudProgress?.completedSections ?? [];
  const caseRewarded = has(caseAwardId(study.slug));
  const labEarned = has(labAwardId(study.slug));
  const isCompleted = isStudyComplete(awards, cloudProgress, study.slug);
  const sectionDone = (i: number) =>
    i === 6 ? labEarned : isCompleted || viewedSections.includes(i);
  const sectionsDone = SECTION_LABELS.map((_, i) => sectionDone(i));
  const doneCount = isCompleted ? SECTION_LABELS.length : sectionsDone.filter(Boolean).length;
  const isUnlockedByProgression = unlockedCases
    ? unlockedCases.includes(study.slug)
    : study.rcCost <= 0;
  const locked = !isUnlockedByProgression && !isCompleted;
  const needed = unlockThreshold(study.rcCost);

  const progress = isCompleted ? 100 : Math.round((doneCount / SECTION_LABELS.length) * 100);
  const sample = study.implementation?.samples?.[lang] ?? study.implementation?.samples?.[0];
  const diagram = study.architecture?.levels?.[level] ?? study.architecture?.levels?.[0];
  const primer = study.primers?.[0];

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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#141a05] border border-[#ccff00]/40 px-3.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#ccff00] font-bold shadow-[0_0_15px_rgba(204,255,0,0.25)]">
            🔒 Locked Free-Tier Case · {study.category}
          </span>
          <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight text-[#f5f5f5]">
            {study.title}
          </h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-[#b8b8b8]">{study.summary}</p>
          <div className="glass-panel mx-auto mt-8 max-w-[460px] rounded-3xl p-6 text-left border border-white/[0.08]">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#8a8a8a]">
              Sequential Progression Requirement
            </p>
            <p className="mt-1 text-lg font-bold text-[#f5f5f5]">
              Complete previous case study to unlock
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[#b8b8b8]">
              This case study is included in the free tier and unlocks automatically when you
              complete all 8 sections and pass the CodeArena lab of the preceding investigation.
            </p>
          </div>
          <Link
            to="/cases"
            className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] px-5 py-2.5 font-mono text-xs font-bold text-[#080808] shadow-[0_0_15px_rgba(204,255,0,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
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
        <div className="glass-panel overflow-hidden rounded-3xl border border-white/[0.08] shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-[#141414]/60 px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#8a8a8a]">
                Case {study.index} / {study.category} · {study.subcategory}
              </span>
              <h1 className="text-base font-bold tracking-tight text-[#f5f5f5]">{study.title}</h1>
              <span className="rounded-lg bg-[#ccff00]/15 border border-[#ccff00]/30 px-2 py-0.5 font-mono text-[10px] font-bold text-[#ccff00]">
                {study.learnerLevel}
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] px-3 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-[#080808] shadow-[0_0_15px_rgba(204,255,0,0.45)]">
                  <CheckCircle2 className="size-3 stroke-[2.5]" />
                  Completed · 100%
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 font-mono text-xs text-[#8a8a8a]">
              <span>Progress</span>
              <div className="h-2 w-40 overflow-hidden rounded-full bg-[#1a1a1a] p-0.5 border border-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] shadow-[0_0_10px_rgba(204,255,0,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[#ccff00] font-bold">{progress}%</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[210px_1fr_340px] xl:grid-cols-[220px_1fr_360px]">
            {/* LEFT RAIL — stepper */}
            <aside className="border-b border-white/[0.08] p-4 lg:border-b-0 lg:border-r">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a8a8a]">
                Sections
              </p>
              <ol className="space-y-1.5">
                {SECTION_LABELS.map((label, i) => {
                  const done = sectionsDone[i] ?? false;
                  const current = i === step;
                  return (
                    <li key={label}>
                      <button
                        type="button"
                        onClick={() => setStep(i)}
                        className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-all ${
                          current
                            ? "bg-[#182608] text-[#ccff00] border border-[#ccff00]/40 shadow-[0_0_12px_rgba(204,255,0,0.25)]"
                            : done
                              ? "bg-[#182608]/70 text-[#ccff00] border border-[#ccff00]/25"
                              : "text-[#8a8a8a] hover:bg-white/[0.04] hover:text-[#f5f5f5]"
                        }`}
                      >
                        <span
                          className={`font-mono text-[10px] font-bold ${
                            current ? "text-[#ccff00]" : ""
                          }`}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={`text-xs ${
                            current
                              ? "font-bold text-[#ccff00]"
                              : done
                                ? "font-medium text-[#ccff00]"
                                : "font-medium"
                          }`}
                        >
                          {label}
                        </span>
                        {current && (
                          <span className="ml-auto size-1.5 rounded-full recording-dot" />
                        )}
                        {done && !current && (
                          <span className="ml-auto font-mono text-[10px] text-[#ccff00]">✓</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>

              <p className="mb-2 mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a8a8a]">
                Prerequisites
              </p>
              <ul className="space-y-1.5">
                {study.prerequisites.map((p) => (
                  <li key={p} className="text-[11px] leading-relaxed text-[#8a8a8a]">
                    · {p}
                  </li>
                ))}
              </ul>
            </aside>

            {/* MAIN CONTENT */}
            <div className="p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                {String(step + 1).padStart(2, "0")} — {SECTION_KICKERS[step]}
              </p>

              {/* 01 — DISCOVER */}
              {step === 0 && (
                <>
                  <H2>The situation</H2>
                  <p className="mt-3 max-w-[62ch] text-pretty text-sm leading-relaxed text-ink2">
                    {study.discover.situation}
                  </p>
                  <ArrowChain steps={study.discover.humanFlow} />
                  <div className="mt-5 rounded-2xl bg-rose/40 p-5 ring-1 ring-primary/15">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-ink2">
                      The question
                    </p>
                    <p className="mt-2 text-pretty text-sm font-medium leading-relaxed">
                      {study.discover.question}
                    </p>
                  </div>
                  <Kicker>Why the problem exists</Kicker>
                  <ul className="mt-3 space-y-2">
                    {study.discover.whyItExists.map((r) => (
                      <li key={r} className="flex gap-3 text-sm text-ink2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        <span className="text-pretty leading-relaxed">{r}</span>
                      </li>
                    ))}
                  </ul>
                  <Kicker>What you will be able to do</Kicker>
                  <ul className="mt-3 space-y-2">
                    {study.learningObjectives.map((o) => (
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
                  <p className="mt-3 max-w-[62ch] text-pretty text-sm leading-relaxed text-ink2">
                    {study.understand.overview}
                  </p>

                  <Kicker>Each component: what, why, what it does</Kicker>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {study.understand.components.map((c) => (
                      <div key={c.name} className="rounded-2xl bg-card/60 p-4 ring-1 ring-line/70">
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

                  <Kicker>Analogy · {study.understand.analogy.title}</Kicker>
                  <ArrowChain steps={study.understand.analogy.everyday} />
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink2">
                    Mapped to the technical model
                  </p>
                  <ArrowChain steps={study.understand.analogy.technical} />

                  <Kicker>The flow, step by step</Kicker>
                  <ol className="mt-3 space-y-2">
                    {study.understand.flow.map((s, i) => (
                      <li key={s}>
                        <div className="flex items-center gap-3 rounded-lg bg-card/60 px-3 py-2 ring-1 ring-line/70">
                          <span className="font-mono text-[10px] text-primary">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-sm">{s}</span>
                        </div>
                        {i < study.understand.flow.length - 1 && (
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
                  <p className="mt-3 max-w-[62ch] text-pretty text-sm leading-relaxed text-ink2">
                    Every concept follows the same shape: what it is, why it exists, an everyday
                    analogy, the technical explanation, and where it appears in this case.
                  </p>
                  <div className="mt-5 space-y-3">
                    {study.concepts.map((c) => {
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
                                {c.difficulty}
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
                  <p className="mt-3 max-w-[62ch] text-pretty text-sm leading-relaxed text-ink2">
                    {study.architecture.caption}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {study.architecture.levels.map((l, i) => (
                      <button
                        key={l.title}
                        type="button"
                        onClick={() => setLevel(i)}
                        className={`rounded-lg px-3 py-1.5 font-mono text-[11px] ring-1 transition-colors ${
                          i === level
                            ? "bg-primary/10 text-ink ring-primary/30"
                            : "bg-card/60 text-ink2 ring-line/70 hover:text-ink"
                        }`}
                      >
                        {l.title}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl bg-paper/70 p-5 ring-1 ring-primary/10">
                    <p className="mb-4 text-[12px] leading-relaxed text-ink2">
                      {diagram?.description}
                    </p>
                    {diagram && <MermaidDiagram chart={diagram.mermaid} />}
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
                  <p className="mt-3 max-w-[62ch] text-pretty text-sm leading-relaxed text-ink2">
                    Every decision answers the same six questions, so you learn why a technology
                    exists rather than memorising its name.
                  </p>
                  <div className="mt-5 space-y-3">
                    {(study.decisions ?? []).map((d: any, idx: number) => {
                      const title = d.title || d.decision || `Decision ${idx + 1}`;
                      const what = d.what || d.choiceA;
                      const why = d.why || d.verdict;
                      const problem = d.problemSolved;
                      const withoutIt = d.withoutIt || d.choiceB;
                      const alts = Array.isArray(d.alternatives)
                        ? d.alternatives.join(" · ")
                        : d.alternatives || (d.choiceB ? `Alternative: ${d.choiceB}` : null);
                      const tradeoff = d.tradeoff;

                      return (
                        <div
                          key={title + idx}
                          className="rounded-2xl bg-card/60 p-4 ring-1 ring-line/70"
                        >
                          <p className="text-sm font-semibold tracking-tight">{title}</p>
                          <dl className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-ink2">
                            {what && (
                              <>
                                <dt className="font-mono text-[10px] uppercase tracking-widest">
                                  What
                                </dt>
                                <dd>{what}</dd>
                              </>
                            )}
                            {why && (
                              <>
                                <dt className="font-mono text-[10px] uppercase tracking-widest">
                                  Why
                                </dt>
                                <dd>{why}</dd>
                              </>
                            )}
                            {problem && (
                              <>
                                <dt className="font-mono text-[10px] uppercase tracking-widest">
                                  Problem it solves
                                </dt>
                                <dd>{problem}</dd>
                              </>
                            )}
                            {withoutIt && (
                              <>
                                <dt className="font-mono text-[10px] uppercase tracking-widest">
                                  Without it
                                </dt>
                                <dd>{withoutIt}</dd>
                              </>
                            )}
                            {alts && (
                              <>
                                <dt className="font-mono text-[10px] uppercase tracking-widest">
                                  Alternatives
                                </dt>
                                <dd>{alts}</dd>
                              </>
                            )}
                          </dl>
                          {tradeoff && (
                            <p className="mt-2 rounded-lg bg-butter/50 px-3 py-2 text-[12px] leading-relaxed text-ink">
                              <span className="font-mono text-[10px] uppercase tracking-widest text-ink2">
                                Trade-off ·{" "}
                              </span>
                              {tradeoff}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* 06 — IMPLEMENTATION */}
              {step === 5 && (
                <>
                  <H2>From reasoning to code</H2>
                  <p className="mt-3 max-w-[62ch] text-pretty text-sm leading-relaxed text-ink2">
                    {study.implementation?.behaviour}
                  </p>

                  <Kicker>Language-independent algorithm</Kicker>
                  <ol className="mt-3 space-y-2">
                    {(study.implementation?.algorithm ?? []).map((s: string, i: number) => (
                      <li key={s} className="flex gap-3 text-sm text-ink2">
                        <span className="font-mono text-[11px] text-primary">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-pretty leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ol>

                  {study.implementation?.ladder && study.implementation.ladder.length > 0 && (
                    <>
                      <Kicker>The implementation ladder</Kicker>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {study.implementation.ladder.map((l: any) => (
                          <div
                            key={l.level}
                            className="rounded-xl bg-card/60 p-3 ring-1 ring-line/70"
                          >
                            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
                              {l.level} · {l.title}
                            </p>
                            <p className="mt-1 text-[12px] leading-relaxed text-ink2">{l.detail}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Language tabs */}
                  {study.implementation?.samples && study.implementation.samples.length > 0 && (
                    <div className="mt-5 flex items-center gap-1 rounded-xl bg-black/40 p-1 border border-white/[0.06] w-fit">
                      {study.implementation.samples.map((s: any, i: number) => (
                        <button
                          key={s.language}
                          type="button"
                          onClick={() => setLang(i)}
                          className={`rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold transition-all ${
                            i === lang
                              ? "bg-[#182608] text-[#ccff00] border border-[#ccff00]/40"
                              : "text-[#8a8a8a] hover:text-[#f5f5f5]"
                          }`}
                        >
                          {s.language.charAt(0).toUpperCase() + s.language.slice(1)}
                        </button>
                      ))}
                      <span className="ml-3 font-mono text-[10px] text-[#5a5a5a]">
                        {sample?.filename}
                      </span>
                    </div>
                  )}

                  {sample?.code &&
                    (() => {
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
                          value={sample.code}
                          onChange={() => {}}
                          language={langKey}
                          disabled={true}
                          rows={Math.max(12, sample.code.split("\n").length + 1)}
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
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {(study.practice ?? []).map((ch, i) => (
                      <div
                        key={ch.title}
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
                          {PRACTICE_PURPOSE[ch.level]}
                        </p>
                      </div>
                    ))}
                  </div>

                  <CodeArena
                    lab={study.codeLab}
                    earned={labEarned}
                    caseSlug={study.slug}
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
                    {(study.reflection ?? []).map((q) => (
                      <li
                        key={q}
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
                    className={`mt-2 w-full rounded-2xl bg-card/70 p-4 text-sm leading-relaxed text-ink outline-none ring-1 placeholder:text-ink2/60 transition-colors ${
                      reflectionValid
                        ? "ring-[#ccff00]/40 focus:ring-[#ccff00]/60"
                        : "ring-line/70 focus:ring-primary/40"
                    }`}
                  />
                  {/* Character / word counter */}
                  <div className="mt-2 flex items-center gap-4 font-mono text-[10px]">
                    <span
                      className={
                        reflectionCharCount >= MIN_REFLECTION_CHARS
                          ? "text-[#ccff00]"
                          : "text-[#8a8a8a]"
                      }
                    >
                      {reflectionCharCount} / {MIN_REFLECTION_CHARS} chars
                    </span>
                    <span className="text-[#3a3a3a]">·</span>
                    <span
                      className={
                        reflectionWordCount >= MIN_REFLECTION_WORDS
                          ? "text-[#ccff00]"
                          : "text-[#8a8a8a]"
                      }
                    >
                      {reflectionWordCount} / {MIN_REFLECTION_WORDS} words
                    </span>
                    {reflectionValid && (
                      <span className="text-[#ccff00] font-bold">Ready to complete</span>
                    )}
                    {isAuthenticated && reflectionTrimmed && (
                      <span className="text-[#5a5a5a] ml-auto">synced to cloud</span>
                    )}
                  </div>
                </>
              )}

              {step === 7 && isCompleted && (
                <div className="mt-8 rounded-3xl bg-gradient-to-b from-[#182608] via-[#101905] to-[#080c03] border-2 border-[#ccff00]/60 p-6 shadow-[0_0_35px_rgba(204,255,0,0.25)]">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-2xl bg-gradient-to-br from-[#d4ff00] to-[#ccff00] flex items-center justify-center text-[#080808] font-bold shadow-[0_0_15px_rgba(204,255,0,0.5)]">
                        <CheckCircle2 className="size-6 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-[#ccff00] font-bold">
                            Investigation Mastered
                          </span>
                          <span className="rounded-md bg-[#182608] text-[#ccff00] font-mono text-[10px] px-2 py-0.5 font-bold border border-[#ccff00]/40">
                            +30 RC Banked
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-[#f5f5f5] mt-0.5">
                          {study.title} Cleared!
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/cases" })}
                      className="rounded-xl bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] px-5 py-2.5 font-mono text-xs font-bold text-[#080808] shadow-[0_0_15px_rgba(204,255,0,0.4)] hover:shadow-[0_0_25px_rgba(204,255,0,0.6)] transition-all"
                    >
                      ✓ Back to Arena Centre
                    </button>
                  </div>
                </div>
              )}

              {step === 6 ? (
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-mint/40 p-3 ring-1 ring-primary/15">
                  <p className="text-[12px] leading-relaxed text-ink2">
                    {labEarned
                      ? `Practice complete — you passed the lab at 80%+ and earned RC.`
                      : `This section unlocks only by passing the AI-judged code lab above at 80% or higher.`}
                  </p>
                  {labEarned && (
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/cases" })}
                      className="rounded-xl bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] px-4 py-2.5 font-mono text-xs font-bold text-[#080808] shadow-[0_0_15px_rgba(204,255,0,0.4)] transition-all hover:shadow-[0_0_20px_rgba(204,255,0,0.6)]"
                    >
                      Back to the Arena Centre
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-mint/40 p-3 ring-1 ring-primary/15">
                  <div className="flex-1">
                    <p className="text-[12px] leading-relaxed text-ink2">
                      {step === 7
                        ? isCompleted
                          ? "Case study fully mastered."
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
                        ? !labEarned || !reflectionValid || isCompleted
                        : sectionsDone[step]
                    }
                    onClick={() => {
                      if (isAuthenticated) {
                        saveProgress({
                          caseSlug: study.slug,
                          completedSections: [step],
                        })
                          .then(() => {
                            if (!has(sectionAwardId(study.slug, step))) {
                              toast.success("+1 RC earned");
                            }
                          })
                          .catch(() => {});
                        if (step === 7 && labEarned && reflectionValid) {
                          markComplete({ caseSlug: study.slug })
                            .then(() => toast.success("+20 RC — Case study complete!"))
                            .catch((err: Error) => toast.error(err.message));
                        }
                      }
                      if (step !== 7) {
                        setStep((s) => Math.min(SECTION_LABELS.length - 1, s + 1));
                      }
                    }}
                    className="rounded-xl bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] px-4 py-2.5 font-mono text-xs font-bold text-[#080808] shadow-[0_0_15px_rgba(204,255,0,0.4)] transition-all hover:shadow-[0_0_20px_rgba(204,255,0,0.6)] disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {step === 7
                      ? isCompleted
                        ? "Case Study Mastered"
                        : !labEarned
                          ? "Pass practice first"
                          : !reflectionValid
                            ? `Reflection: ${reflectionCharCount}/${MIN_REFLECTION_CHARS} chars`
                            : "Complete Arena + Claim +20 RC"
                      : sectionsDone[step]
                        ? "Viewed"
                        : "Mark section done"}
                  </button>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-4">
                <button
                  type="button"
                  disabled={step === 0}
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="neu-btn rounded-xl px-4 py-2 font-mono text-xs font-medium text-[#b8b8b8] hover:text-[#f5f5f5] disabled:opacity-30 disabled:pointer-events-none"
                >
                  ← Previous
                </button>
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#8a8a8a]">
                  {String(step + 1).padStart(2, "0")} / 08
                </span>
                <button
                  type="button"
                  disabled={step === SECTION_LABELS.length - 1}
                  onClick={() => setStep((s) => Math.min(SECTION_LABELS.length - 1, s + 1))}
                  className="rounded-xl bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] px-4 py-2 font-mono text-xs font-bold text-[#080808] shadow-[0_0_12px_rgba(204,255,0,0.35)] disabled:opacity-30 disabled:pointer-events-none"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* RIGHT COMPANION RAIL */}
            <aside className="space-y-4 border-t border-white/[0.08] p-5 lg:border-l lg:border-t-0 bg-[#0d0d0d]/40">
              {/* 1. Wallet & Session Yield */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#121212]/90 p-4 shadow-sm">
                <RCWalletPanel />

                {/* RC Yield in this case */}
                <div className="mt-4 pt-3.5 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[#8a8a8a]">
                      Case Yield Potential
                    </p>
                    <span className="font-mono text-xs font-bold text-[#ccff00]">
                      +
                      {(labEarned ? RC_RULES.codeLab : 0) +
                        (caseRewarded ? RC_RULES.caseComplete : 0)}{" "}
                      / {RC_RULES.codeLab + RC_RULES.caseComplete} RC
                    </span>
                  </div>

                  <p className="mb-2 text-[11px] leading-relaxed text-[#8a8a8a]">
                    RC is earned only by passing the AI-judged code lab (score &ge; 80%) in your
                    chosen language.
                  </p>

                  <div className="space-y-1.5 font-mono text-[11px] text-[#8a8a8a]">
                    <div className="flex justify-between items-center py-0.5">
                      <span>CodeArena Lab</span>
                      <span className={labEarned ? "text-[#ccff00] font-bold" : "text-[#8a8a8a]"}>
                        {labEarned ? `+${RC_RULES.codeLab} RC ✓` : "pending"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span>Case Complete</span>
                      <span
                        className={caseRewarded ? "text-[#ccff00] font-bold" : "text-[#8a8a8a]"}
                      >
                        {caseRewarded ? `+${RC_RULES.caseComplete} RC ✓` : "locked"}
                      </span>
                    </div>
                  </div>

                  {caseRewarded && (
                    <div className="mt-3 rounded-xl bg-[#182608] border border-[#ccff00]/30 px-3 py-2 font-mono text-xs font-bold text-[#ccff00] flex items-center gap-1.5">
                      <span>✓</span>
                      <span>Lab passed · RC banked</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Modular Knowledge Hub (Tabs: Primer | Principles | Concepts) */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#121212]/90 p-4 shadow-sm space-y-4">
                {/* Tab Header */}
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#8a8a8a] font-bold">
                    Knowledge Companion
                  </span>
                </div>

                {/* Segmented Tab Switcher */}
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/40 p-1 border border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setCompanionTab("primer")}
                    className={`rounded-lg py-1.5 text-center font-mono text-[11px] font-bold transition-all ${
                      companionTab === "primer"
                        ? "bg-[#182608] text-[#ccff00] border border-[#ccff00]/40"
                        : "text-[#8a8a8a] hover:text-[#f5f5f5]"
                    }`}
                  >
                    Primer
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompanionTab("principles")}
                    className={`rounded-lg py-1.5 text-center font-mono text-[11px] font-bold transition-all ${
                      companionTab === "principles"
                        ? "bg-[#182608] text-[#ccff00] border border-[#ccff00]/40"
                        : "text-[#8a8a8a] hover:text-[#f5f5f5]"
                    }`}
                  >
                    Principles ({study.techNotes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompanionTab("concepts")}
                    className={`rounded-lg py-1.5 text-center font-mono text-[11px] font-bold transition-all ${
                      companionTab === "concepts"
                        ? "bg-[#182608] text-[#ccff00] border border-[#ccff00]/40"
                        : "text-[#8a8a8a] hover:text-[#f5f5f5]"
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
                              <span className="size-1.5 rounded-full recording-dot" />
                              <span className="font-mono text-[10px] text-[#ccff00] font-bold">
                                {primer.minutes} MIN ARCHITECTURE PRIMER
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-[#f5f5f5]">{primer.concept}</h4>
                          </div>

                          <p className="text-xs leading-relaxed text-[#b8b8b8]">
                            {primer.definition}
                          </p>

                          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 text-xs leading-relaxed text-[#b8b8b8]">
                            <p className="font-mono text-[10px] uppercase text-[#8a8a8a] mb-1 font-bold">
                              Why it matters
                            </p>
                            <p>{primer.whyNeeded}</p>
                          </div>

                          <div className="rounded-xl bg-[#141a05] border border-[#ccff00]/25 p-3 text-xs leading-relaxed text-[#a3e635]">
                            <span className="font-mono text-[10px] font-bold text-[#ccff00] block mb-1">
                              Analogy
                            </span>
                            <p>{primer.analogy}</p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-mono text-[10px] text-[#8a8a8a] uppercase">
                                Code Pattern
                              </span>
                            </div>
                            <pre className="overflow-x-auto rounded-xl bg-[#080808] p-3 font-mono text-[11px] text-[#f5f5f5] border border-white/10 leading-snug">
                              <code>{primer.tinyExample}</code>
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[#8a8a8a] py-4 text-center">
                          No dedicated primer needed for this case.
                        </p>
                      )}
                    </div>
                  )}

                  {/* TAB 2: Architectural Principles */}
                  {companionTab === "principles" && (
                    <div className="space-y-3">
                      {study.techNotes.map((t) => (
                        <div
                          key={t.name}
                          className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3.5 hover:border-white/15 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="rounded-md bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#8a8a8a]">
                              {t.kind}
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs font-bold text-[#f5f5f5]">{t.name}</p>
                          <p className="mt-1 text-xs leading-relaxed text-[#8a8a8a]">{t.note}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 3: Engineering Concepts */}
                  {companionTab === "concepts" && (
                    <div className="space-y-3">
                      <p className="font-mono text-[11px] text-[#8a8a8a]">
                        Key domain concepts mastered in this case:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {study.engineeringConcepts.map((concept) => (
                          <span
                            key={concept}
                            className="rounded-lg bg-white/[0.03] border border-white/[0.08] px-2.5 py-1 font-mono text-xs text-[#f5f5f5] hover:border-[#ccff00]/40 hover:text-[#ccff00] transition-colors"
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}
