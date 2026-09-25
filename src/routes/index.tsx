import { useEffect } from "react";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { AppChrome } from "@/components/AppChrome";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { HeroArchitectureVisual } from "@/components/HeroArchitectureVisual";

import { useAccount } from "@/lib/account";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ArrowRight,
  Sparkles,
  Briefcase,
  Building2,
  GraduationCap,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Code2,
} from "lucide-react";
import { getCaseInterviewBadges, getTrack0MachineCodingCases } from "@/data/interviewBadges";

const TITLE = "KRUZZ — Real-World System Architecture & Machine Coding (LLD)";
const DESCRIPTION =
  "Master real-world system architecture and campus placement machine coding (LLD). Reverse-engineer 59 production systems with FAANG company interview tags.";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && window.localStorage.getItem("kruzz_has_session") === "1") {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Landing,
});

const CHAIN = [
  {
    n: "01",
    label: "Discover",
    tag: "why it exists",
  },
  {
    n: "02",
    label: "Understand",
    tag: "how it flows",
  },
  {
    n: "03",
    label: "Principles",
    tag: "the fundamentals",
  },
  {
    n: "04",
    label: "Architecture",
    tag: "the components",
  },
  {
    n: "05",
    label: "Implementation",
    tag: "the code that ships",
  },
];

const DIFFICULTY_TONES: Record<string, string> = {
  Explorer: "bg-neutral-100 text-black border border-black",
  Builder: "bg-neutral-100 text-black border border-black",
  Engineer: "bg-neutral-100 text-black border border-black font-bold",
};

type HomeDifficulty = "Beginner" | "Medium" | "Advanced";

function homeDifficulty(caseStudy: any): HomeDifficulty {
  if (caseStudy.difficulty === "Advanced") return "Advanced";
  if (caseStudy.difficulty === "Intermediate" || caseStudy.difficulty === "Medium") {
    return "Medium";
  }

  const index = Number.parseInt(caseStudy.index, 10);
  if (index >= 18) return "Advanced";
  if (index >= 8) return "Medium";
  return "Beginner";
}

function Landing() {
  const { isAuthenticated } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.navigate({ to: "/dashboard", replace: true });
    }
  }, [isAuthenticated, router]);

  const caseStudies = (useQuery(api.caseStudies.list, {}) ?? []) as any[];
  const firstCase = caseStudies[0] ?? { slug: "atm-machine", shortTitle: "ATM Machine" };
  const featuredCases = (["Beginner", "Medium", "Advanced"] as const)
    .map((difficulty) => caseStudies.find((c) => homeDifficulty(c) === difficulty))
    .filter((c): c is (typeof caseStudies)[number] => Boolean(c));

  const track0Cases = getTrack0MachineCodingCases();

  if (isAuthenticated) {
    return (
      <AppChrome>
        <div className="grid-bg min-h-screen flex flex-col items-center justify-center gap-4 text-black">
          <div className="size-8 animate-spin rounded-full border-2 border-black border-t-transparent shadow-xs" />
          <p className="font-mono text-xs uppercase tracking-widest text-black font-bold">
            Entering Command Center...
          </p>
        </div>
      </AppChrome>
    );
  }

  return (
    <AppChrome>
      <div className="grid-bg min-h-screen text-black">
        <main className="mx-auto max-w-[1240px] px-5 sm:px-6">
          {/* ========================================================================= */}
          {/* HERO SECTION                                                              */}
          {/* ========================================================================= */}
          <section className="pt-14 pb-10 md:pt-20 md:pb-14">
            <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              {/* Left Column: Bold Headline & Call to Action */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 border-2 border-black px-3.5 py-1 font-mono text-[11px] uppercase tracking-wider text-black font-black mb-3">
                  <GraduationCap className="size-3.5 stroke-[2.5]" />
                  <span>Campus Placements & FAANG System Design</span>
                </div>

                <h1 className="mt-2 text-balance text-5xl md:text-6xl lg:text-[64px] font-extrabold leading-[1.04] tracking-tight text-black">
                  Stop memorizing syntax. Start building real systems.
                </h1>

                <p className="mt-5 max-w-[54ch] text-pretty text-base md:text-lg leading-relaxed text-neutral-600">
                  KRUZZ bridges the gap between college programming and production engineering.
                  Master <strong>Low-Level Design (Machine Coding)</strong> and{" "}
                  <strong>Distributed Architectures</strong> through progressive investigations
                  tagged by target employer.
                </p>

                {/* Single Primary CTA + Clean Plain Secondary Link */}
                <div className="mt-8 flex flex-wrap items-center gap-6">
                  <Link
                    to="/cases/$slug"
                    params={{ slug: firstCase.slug }}
                    className="inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3.5 text-sm font-black text-white hover:bg-neutral-800 shadow-xs transition-all hover:-translate-y-px"
                  >
                    <span>Start Case 01: {firstCase.shortTitle} (Free)</span>
                    <ArrowRight className="size-4 stroke-[2.5]" />
                  </Link>

                  <Link
                    to="/cases"
                    className="text-sm font-bold text-neutral-600 hover:text-black hover:underline underline-offset-4 transition-colors"
                  >
                    Browse all {caseStudies.length || 59} investigations →
                  </Link>

                  <Link
                    to="/method"
                    className="text-sm font-bold text-neutral-600 hover:text-black hover:underline underline-offset-4 transition-colors"
                  >
                    How KRUZZ Works →
                  </Link>
                </div>

                {/* Trust Row */}
                <div className="mt-9 flex flex-wrap items-center gap-3.5 font-mono text-xs text-neutral-600 font-bold">
                  <span className="text-black font-black">🎓 Campus Placement Ready</span>
                  <span className="text-black/20">|</span>
                  <span className="text-black font-black">Track 0: Machine Coding (LLD)</span>
                  <span className="text-black/20">|</span>
                  <span>FAANG Company Tags</span>
                  <span className="text-black/20">|</span>
                  <span>Zero Syntax Drills</span>
                </div>
              </div>

              {/* Right Column: The 5-Step Learning Chain */}
              <div className="space-y-6">
                <div className="rounded-3xl p-6 border-2 border-black bg-white shadow-xs">
                  <div className="flex items-center justify-between border-b-2 border-black/10 pb-4">
                    <h3 className="font-black text-sm text-black">The 5-Stage Reasoning Chain</h3>
                    <span className="font-mono text-xs text-neutral-600 font-bold">
                      Standardized Method
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {CHAIN.map((step, i) => (
                      <div key={step.n}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-6 font-mono text-xs font-black text-black">
                              {step.n}
                            </span>
                            <span className="text-sm font-black text-black">{step.label}</span>
                          </div>

                          <span className="text-xs text-neutral-600 italic font-medium">
                            {step.tag}
                          </span>
                        </div>
                        {i < CHAIN.length - 1 && (
                          <div className="ml-8 my-1.5 h-2.5 w-px bg-black/20" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 border-t-2 border-black/10 pt-4">
                    <p className="text-xs leading-relaxed text-neutral-600">
                      Shift from{" "}
                      <span className="text-black font-bold">&ldquo;I know syntax&rdquo;</span> to{" "}
                      <span className="text-black font-black">
                        &ldquo;I understand why this architecture is mandatory.&rdquo;
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro-Architecture Telemetry Widget */}
            <div className="mt-12">
              <HeroArchitectureVisual />
            </div>
          </section>

          {/* ========================================================================= */}
          {/* TRACK 0: MACHINE CODING & LOW-LEVEL DESIGN (LLD) SPOTLIGHT                */}
          {/* ========================================================================= */}
          <section className="mt-12 rounded-3xl border-2 border-black bg-white p-6 sm:p-10 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b-2 border-black">
              <div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-3 py-1 font-mono text-xs font-black uppercase tracking-wider mb-2">
                  <Code2 className="size-3.5 stroke-[2.5]" />
                  <span>Track 0: Machine Coding & Low-Level Design (LLD)</span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-black mt-1">
                  Built for Campus Hiring & Live Coding Rounds
                </h2>
                <p className="mt-2 text-sm sm:text-base text-neutral-600 max-w-3xl leading-relaxed">
                  Top engineering loops at <strong>Amazon</strong>, <strong>Uber</strong>,{" "}
                  <strong>Swiggy</strong>, <strong>Bloomberg</strong>, and <strong>Google</strong>{" "}
                  evaluate candidates with 90-minute live Object-Oriented Design problems. Track 0
                  covers the exact 7 foundational machine coding systems from scratch—100% free.
                </p>
              </div>

              <Link
                to="/cases"
                className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 font-mono text-xs font-black text-white hover:bg-neutral-800 transition-all shrink-0"
              >
                <span>Launch Track 0 (Case 01)</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {/* 7 Foundational LLD Systems Grid */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {track0Cases.map((meta, idx) => (
                <Link
                  key={meta.slug}
                  to="/cases/$slug"
                  params={{ slug: meta.slug }}
                  className="group rounded-2xl border-2 border-black bg-neutral-50 p-4 transition-all hover:bg-white hover:-translate-y-1 hover:shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between font-mono text-[10px] text-neutral-600 font-black">
                      <span>CASE {meta.index}</span>
                      <span className="rounded bg-black text-white px-1.5 py-0.2 uppercase text-[9px]">
                        FREE
                      </span>
                    </div>

                    <h3 className="mt-2 text-base font-black text-black group-hover:underline">
                      {meta.slug
                        .split("-")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                    </h3>

                    <p className="mt-1.5 text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                      {meta.interviewPrompt}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/15 space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] font-mono text-black font-black">
                      <Building2 className="size-3 text-neutral-700" />
                      <span>Asked at:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {meta.companies.map((comp) => (
                        <span
                          key={comp}
                          className="rounded bg-white border border-black/30 px-1.5 py-0.2 font-mono text-[9px] font-bold text-black"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}

              {/* Bonus 8th Card: Student Placement Advantage */}
              <div className="rounded-2xl border-2 border-dashed border-black/40 bg-neutral-100 p-4 flex flex-col justify-center text-center">
                <ShieldCheck className="mx-auto size-7 text-black stroke-[2]" />
                <h4 className="mt-2 text-sm font-black text-black">Multi-Language CodeArena</h4>
                <p className="mt-1 text-[11px] text-neutral-600 leading-snug">
                  Practice in Python, Java, or C with automated unit tests and multi-provider AI
                  reasoning review.
                </p>
                <Link
                  to="/cases"
                  className="mt-3 text-xs font-mono font-black text-black underline underline-offset-2"
                >
                  Explore All 59 Cases →
                </Link>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* INVESTIGATION CATALOG                                                     */}
          {/* ========================================================================= */}
          <section className="mt-16 md:mt-24 pb-16">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-black/10 pb-5">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-black">
                  System Architecture Investigations
                </h2>
                <p className="mt-1.5 text-sm text-neutral-600">
                  Each investigation guides you from real dilemma through interactive code and
                  architecture with verified interview tags.
                </p>
              </div>

              <Link
                to="/cases"
                className="text-xs font-mono font-black text-black hover:underline transition-colors"
              >
                Open Complete Case Index ({caseStudies.length || 59}) →
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {featuredCases.map((c) => {
                const interview = getCaseInterviewBadges(c.slug || c.index);

                return (
                  <Link
                    key={c.slug}
                    to="/cases/$slug"
                    params={{ slug: c.slug }}
                    className="group flex flex-col justify-between rounded-3xl p-6 border-2 border-black bg-white text-black shadow-xs transition-all hover:bg-neutral-50 hover:-translate-y-1"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-black font-black">
                          {homeDifficulty(c).toUpperCase()} · CASE {c.index}
                        </span>
                        <span className="text-xs text-neutral-600 font-bold">
                          8 sections · {c.estimatedTime}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-black tracking-tight text-black">
                        {c.title}
                      </h3>

                      <p className="mt-2 text-xs leading-relaxed text-neutral-600">{c.summary}</p>

                      {/* Company & Round Badge */}
                      <div className="mt-3.5 rounded-xl bg-neutral-50 border border-black/20 p-2 space-y-1">
                        <div className="flex items-center justify-between gap-1 text-[9px] font-mono">
                          <span className="rounded bg-black text-white px-1.5 py-0.2 font-black uppercase">
                            {interview.roundType}
                          </span>
                          <span className="text-neutral-500 font-bold">{interview.targetRole}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <span className="font-mono text-[9px] font-black text-black">Asked:</span>
                          {interview.companies.slice(0, 3).map((comp) => (
                            <span
                              key={comp}
                              className="rounded bg-white border border-black/30 px-1.5 py-0.2 font-mono text-[9px] font-bold text-black"
                            >
                              {comp}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t-2 border-black/10 flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-lg px-2 py-0.5 font-mono text-[10px] font-bold border-2 border-black ${
                          DIFFICULTY_TONES[c.learnerLevel] ?? "bg-neutral-100 text-black"
                        }`}
                      >
                        {c.learnerLevel}
                      </span>

                      {(c.tech ?? []).map((t: string) => (
                        <span
                          key={t}
                          className="rounded-lg bg-neutral-100 border border-black/30 px-2 py-0.5 font-mono text-[10px] text-black font-medium"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* CURRICULUM PROGRESSION GRAPH                                              */}
          {/* ========================================================================= */}
          <section className="mt-8 pb-24 border-t border-black/10 pt-12">
            <div className="mb-6 flex items-baseline justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-black">
                  How Each Case Builds System Thinking
                </h2>
                <p className="mt-1 text-xs text-neutral-600">
                  Concepts are reinforced cumulatively: early architectural decisions become
                  dependencies for high-scale distributed systems.
                </p>
              </div>
            </div>
          </section>
        </main>

        {/* Cinematic Curtain-Reveal Footer */}
        <CinematicFooter />
      </div>
    </AppChrome>
  );
}
