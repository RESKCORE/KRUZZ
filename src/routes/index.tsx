import { useEffect } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AppChrome } from "@/components/AppChrome";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { HeroArchitectureVisual } from "@/components/HeroArchitectureVisual";

import { useAccount } from "@/lib/account";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowRight, Sparkles } from "lucide-react";

const TITLE = "KRUZZ — Real-World System Architecture Case Studies";
const DESCRIPTION =
  "Read and reconstruct real software systems through progressive investigations: tracing architectural trade-offs, state flows, and production code.";

export const Route = createFileRoute("/")({
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
  Explorer: "bg-[#a3e635]/15 text-[#a3e635] border-[#a3e635]/30",
  Builder: "bg-[#ccff00]/15 text-[#ccff00] border-[#ccff00]/30",
  Engineer: "bg-[#d4ff00]/20 text-[#d4ff00] border-[#d4ff00]/40 font-bold",
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
      router.navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, router]);

  const caseStudies = (useQuery(api.caseStudies.list, {}) ?? []) as any[];
  const firstCase = caseStudies[0] ?? { slug: "atm-machine", shortTitle: "ATM Machine" };
  const featuredCases = (["Beginner", "Medium", "Advanced"] as const)
    .map((difficulty) => caseStudies.find((c) => homeDifficulty(c) === difficulty))
    .filter((c): c is (typeof caseStudies)[number] => Boolean(c));

  return (
    <AppChrome>
      <div className="grid-bg min-h-screen text-[#f5f5f5]">
        <main className="mx-auto max-w-[1240px] px-5 sm:px-6">
          {/* ========================================================================= */}
          {/* HERO SECTION                                                              */}
          {/* ========================================================================= */}
          <section className="pt-14 pb-10 md:pt-20 md:pb-14">
            <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              {/* Left Column: Bold Headline & Call to Action */}
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-[#ccff00] font-bold">
                  System Thinking Arena
                </p>

                <h1 className="mt-3 text-balance text-5xl md:text-6xl lg:text-[64px] font-extrabold leading-[1.04] tracking-tight text-[#f5f5f5]">
                  Stop memorizing syntax. Start reading how real systems are built.
                </h1>

                <p className="mt-5 max-w-[54ch] text-pretty text-base md:text-lg leading-relaxed text-[#b8b8b8]">
                  KRUZZ turns real software engineering dilemmas into progressive investigations —
                  tracing a problem through the architecture, the decisions, and the code that
                  actually ships.
                </p>

                {/* Single Primary CTA + Clean Plain Secondary Link */}
                <div className="mt-8 flex flex-wrap items-center gap-6">
                  <Link
                    to="/cases/$slug"
                    params={{ slug: firstCase.slug }}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] px-6 py-3.5 text-sm font-black text-[#080808] shadow-[0_0_20px_rgba(204,255,0,0.45)] transition-all hover:shadow-[0_0_30px_rgba(204,255,0,0.7)] hover:-translate-y-px"
                  >
                    <span>Start Case 01: {firstCase.shortTitle}</span>
                    <ArrowRight className="size-4 stroke-[2.5]" />
                  </Link>

                  <Link
                    to="/cases"
                    className="text-sm font-medium text-[#b8b8b8] hover:text-[#f5f5f5] hover:underline underline-offset-4 transition-colors"
                  >
                    Browse all {caseStudies.length || 30} investigations →
                  </Link>
                </div>

                {/* Clean Inline Trust Row Separated by Thin Pipes (No generic dots/pills) */}
                <div className="mt-9 flex flex-wrap items-center gap-3.5 font-mono text-xs text-[#8a8a8a]">
                  <span>3 Difficulty Paths</span>
                  <span className="text-white/20">|</span>
                  <span>40 Progressive Sections</span>
                  <span className="text-white/20">|</span>
                  <span>Convex Cloud Persistence</span>
                  <span className="text-white/20">|</span>
                  <span>Zero Syntax Drills</span>
                </div>
              </div>

              {/* Right Column: The 5-Step Learning Chain (No pill badges on tags) */}
              <div className="space-y-6">
                <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                    <h3 className="font-bold text-sm text-[#f5f5f5]">
                      The 5-Stage Reasoning Chain
                    </h3>
                    <span className="font-mono text-xs text-[#8a8a8a]">Standardized Method</span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {CHAIN.map((step, i) => (
                      <div key={step.n}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-6 font-mono text-xs font-bold text-[#ccff00]">
                              {step.n}
                            </span>
                            <span className="text-sm font-semibold text-[#f5f5f5]">
                              {step.label}
                            </span>
                          </div>

                          {/* Plain right-aligned muted italic label (NO pills, NO borders) */}
                          <span className="text-xs text-[#8a8a8a] italic font-normal">
                            {step.tag}
                          </span>
                        </div>
                        {i < CHAIN.length - 1 && (
                          <div className="ml-8 my-1.5 h-2.5 w-px bg-white/10" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 border-t border-white/[0.06] pt-4">
                    <p className="text-xs leading-relaxed text-[#8a8a8a]">
                      Shift from <span className="text-[#f5f5f5]">&ldquo;I know syntax&rdquo;</span>{" "}
                      to{" "}
                      <span className="text-[#ccff00] font-medium">
                        &ldquo;I understand why this architecture is mandatory.&rdquo;
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bespoke Visual Anchor: Live Micro-Architecture Telemetry Widget */}
            <div className="mt-12">
              <HeroArchitectureVisual />
            </div>
          </section>

          {/* ========================================================================= */}
          {/* INVESTIGATION CATALOG (Intentional Asymmetry & Varied Emphasis)           */}
          {/* ========================================================================= */}
          <section className="mt-16 md:mt-24 pb-16">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] pb-5">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-[#f5f5f5]">
                  System Architecture Investigations
                </h2>
                <p className="mt-1.5 text-sm text-[#8a8a8a]">
                  Each investigation guides you from real dilemma through interactive code and
                  architecture.
                </p>
              </div>

              <Link
                to="/cases"
                className="text-xs font-mono font-medium text-[#ccff00] hover:text-[#d4ff00] hover:underline transition-colors"
              >
                Open Complete Case Index ({caseStudies.length}) →
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {featuredCases.map((c, index) => (
                <Link
                  key={c.slug}
                  to="/cases/$slug"
                  params={{ slug: c.slug }}
                  className={`glass-panel group flex flex-col justify-between rounded-3xl p-6 border border-white/[0.08] transition-all hover:border-[#ccff00]/40 hover:-translate-y-1 ${
                    index === 0
                      ? "border-l-2 border-l-[#ccff00] shadow-[0_24px_48px_rgba(204,255,0,0.08)]"
                      : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-[#ccff00] font-bold">
                        {homeDifficulty(c).toUpperCase()} · CASE {c.index}
                      </span>
                      <span className="text-xs text-[#8a8a8a]">8 sections · {c.estimatedTime}</span>
                    </div>

                    <h3 className="mt-3 text-lg font-bold tracking-tight text-[#f5f5f5] group-hover:text-[#ccff00] transition-colors">
                      {c.title}
                    </h3>

                    <p className="mt-2 text-xs leading-relaxed text-[#b8b8b8]">{c.summary}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-wrap gap-1.5">
                    <span
                      className={`rounded-lg px-2 py-0.5 font-mono text-[10px] font-medium border ${
                        DIFFICULTY_TONES[c.learnerLevel] ?? "text-[#8a8a8a]"
                      }`}
                    >
                      {c.learnerLevel}
                    </span>

                    {(c.tech ?? []).map((t: string) => (
                      <span
                        key={t}
                        className="rounded-lg bg-white/[0.03] border border-white/[0.07] px-2 py-0.5 font-mono text-[10px] text-[#b8b8b8]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* CURRICULUM PROGRESSION GRAPH                                              */}
          {/* ========================================================================= */}
          <section className="mt-8 pb-24 border-t border-white/[0.06] pt-12">
            <div className="mb-6 flex items-baseline justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#f5f5f5]">
                  How Each Case Builds System Thinking
                </h2>
                <p className="mt-1 text-xs text-[#8a8a8a]">
                  Concepts are reinforced cumulatively: early architectural decisions become
                  dependencies later.
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
