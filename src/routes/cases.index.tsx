import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppChrome } from "@/components/AppChrome";
import {
  isUnlocked,
  unlockThreshold,
  caseAwardId,
  labAwardId,
  isStudyComplete,
  getCaseStudyRc,
} from "@/lib/rc";
import { useWallet } from "@/lib/account";
import { RCWalletPanel } from "@/components/RCWallet";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  CheckCircle2,
  Sparkles,
  Award,
  Briefcase,
  Building2,
  GraduationCap,
  Filter,
  Layers,
} from "lucide-react";
import {
  getCaseInterviewBadges,
  FEATURED_COMPANIES,
  INTERVIEW_ROUND_CATEGORIES,
} from "@/data/interviewBadges";

const TITLE = "Arena Centre — Real-World Engineering Investigations";
const DESCRIPTION =
  "Browse KRUZZ's real-world engineering investigations: from client-server architecture to distributed rate limiting with company interview tags.";

export const Route = createFileRoute("/cases/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Library,
});

const DIFFICULTY_TONES: Record<string, string> = {
  Explorer: "bg-white text-black border-2 border-black",
  Builder: "bg-white text-black border-2 border-black",
  Engineer: "bg-white text-black border-2 border-black font-bold",
};

function Library() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedCompany, setSelectedCompany] = useState<string>("All");
  const [selectedRound, setSelectedRound] = useState<string>("All Rounds");

  const { points, has, isAuthenticated, awards } = useWallet();
  const cloudProgress = useQuery(
    api.caseProgress.getAllUserProgress,
    isAuthenticated ? {} : "skip",
  );
  const unlockedCases = useQuery(api.caseProgress.getUserUnlockedCases, {});

  const rawDbCases = useQuery(api.caseStudies.list, {});
  const allDbCases = useMemo(() => (rawDbCases ?? []) as any[], [rawDbCases]);

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(allDbCases.map((c: any) => c.category).filter(Boolean)))];
  }, [allDbCases]);

  // Multi-dimensional filtering by Category, Company, and Interview Round
  const shown = useMemo(() => {
    return allDbCases.filter((c) => {
      if (activeCategory !== "All" && c.category !== activeCategory) {
        return false;
      }
      const interview = getCaseInterviewBadges(c.slug || c.index);
      if (selectedCompany !== "All" && !interview.companies.includes(selectedCompany)) {
        return false;
      }
      if (selectedRound !== "All Rounds" && interview.roundType !== selectedRound) {
        return false;
      }
      return true;
    });
  }, [allDbCases, activeCategory, selectedCompany, selectedRound]);

  return (
    <AppChrome>
      <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6">
        {/* Header Telemetry */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-black ring-2 ring-black/20" />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black font-black">
                Investigation Deck · Interview Ready
              </p>
            </div>
            <h1 className="text-balance text-3xl font-black tracking-tight text-black mt-1.5 md:text-4xl">
              Engineering Investigations & Interview Prep
            </h1>
            <p className="mt-2 max-w-[62ch] text-pretty text-sm leading-relaxed text-black font-medium">
              Every case guides you through real production dilemmas and maps directly to live
              technical rounds: <strong>Machine Coding (LLD)</strong>,{" "}
              <strong>System Design</strong>, and <strong>Distributed Concurrency</strong> at top
              tech employers.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 rounded-2xl bg-white border-2 border-black p-2.5 shadow-xs">
            <GraduationCap className="size-5 text-black" />
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase text-neutral-600 font-bold">Catalog</p>
              <p className="font-mono text-xs font-black text-black">
                {shown.length} of {allDbCases.length || 59} Filtered
              </p>
            </div>
          </div>
        </div>

        {/* Student / Interview Accelerator Banner */}
        <div className="mb-6 rounded-3xl bg-neutral-50 border-2 border-black p-4.5 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-black text-white shrink-0">
              <Briefcase className="size-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-black text-white px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider">
                  Campus & FAANG Kit
                </span>
                <span className="font-mono text-xs text-neutral-600 font-bold">
                  Machine Coding + High-Scale Architecture
                </span>
              </div>
              <p className="mt-1 text-xs text-black font-medium leading-relaxed">
                Filter case studies by your upcoming interview round or prospective employer. Track
                0 cases (ATM, Parking Lot, Seat Booking) are optimized for 90-minute live Machine
                Coding campus rounds.
              </p>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveCategory("All");
                setSelectedCompany("All");
                setSelectedRound("Machine Coding (LLD)");
              }}
              className={`rounded-xl px-3.5 py-1.5 font-mono text-xs font-black border-2 border-black transition-all ${
                selectedRound === "Machine Coding (LLD)"
                  ? "bg-black text-white shadow-xs"
                  : "bg-white text-black hover:bg-neutral-100"
              }`}
            >
              🎯 Machine Coding (LLD)
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCategory("All");
                setSelectedCompany("Amazon");
                setSelectedRound("All Rounds");
              }}
              className={`rounded-xl px-3.5 py-1.5 font-mono text-xs font-black border-2 border-black transition-all ${
                selectedCompany === "Amazon"
                  ? "bg-black text-white shadow-xs"
                  : "bg-white text-black hover:bg-neutral-100"
              }`}
            >
              Amazon Cases
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCategory("All");
                setSelectedCompany("All");
                setSelectedRound("All Rounds");
              }}
              className="rounded-xl bg-white border-2 border-black px-3 py-1.5 font-mono text-xs font-bold text-neutral-600 hover:text-black hover:bg-neutral-100 transition-all"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="mb-8 space-y-4">
          {/* 1. Track / Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-black text-black flex items-center gap-1.5 mr-1">
              <Layers className="size-3.5" />
              Track:
            </span>
            {categories.map((cat) => {
              const selected = cat === activeCategory;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={
                    selected
                      ? "rounded-xl bg-black px-3.5 py-1.5 font-mono text-xs font-black text-white border-2 border-black shadow-xs"
                      : "rounded-xl bg-white border-2 border-black px-3.5 py-1.5 font-mono text-xs font-black text-black hover:bg-neutral-100 transition-all shadow-xs"
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* 2. Company & Interview Round Filter Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/10">
            {/* Company Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-xs font-black text-black flex items-center gap-1 mr-1">
                <Building2 className="size-3.5" />
                Company:
              </span>
              {FEATURED_COMPANIES.map((comp) => {
                const isSelected = selectedCompany === comp;
                return (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => setSelectedCompany(comp)}
                    className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold border transition-all ${
                      isSelected
                        ? "bg-black text-white border-black font-black shadow-xs"
                        : "bg-white text-neutral-700 border-black/25 hover:border-black hover:text-black"
                    }`}
                  >
                    {comp}
                  </button>
                );
              })}
            </div>

            {/* Round Category Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-xs font-black text-black flex items-center gap-1 mr-1">
                <Briefcase className="size-3.5" />
                Round:
              </span>
              {INTERVIEW_ROUND_CATEGORIES.map((round) => {
                const isSelected = selectedRound === round;
                return (
                  <button
                    key={round}
                    type="button"
                    onClick={() => setSelectedRound(round)}
                    className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold border transition-all ${
                      isSelected
                        ? "bg-black text-white border-black font-black shadow-xs"
                        : "bg-white text-neutral-700 border-black/25 hover:border-black hover:text-black"
                    }`}
                  >
                    {round}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gamified Reward Banner + Live Wallet Status */}
        <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="glass-panel rounded-3xl p-5 border-2 border-black bg-white text-black shadow-xs">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <p className="font-mono text-xs uppercase tracking-wider text-black font-black">
                Reasoning Credit (RC) Rules
              </p>
              <span className="font-mono text-[10px] text-black font-black">GAMIFIED PROGRESS</span>
            </div>
            <ul className="mt-3.5 grid gap-2.5 text-xs leading-relaxed text-black font-medium sm:grid-cols-2">
              <li className="flex items-start gap-2">
                <span className="text-black font-black underline">+20 RC</span>
                <span>Beginner / LLD Case complete (100% path)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black font-black underline">+30 RC</span>
                <span>Medium Architecture Case complete (100% path)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black font-black underline">+50 RC</span>
                <span>Advanced Distributed Systems Case complete (100% path)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black font-black underline">Verification</span>
                <span>CodeArena AI grader evaluates your implementation live</span>
              </li>
            </ul>
          </div>
          <RCWalletPanel />
        </div>

        {/* Case Cards Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => {
            const userProgressDoc = (
              cloudProgress as
                | Array<{ caseSlug: string; completedSections?: number[]; passed?: boolean }>
                | undefined
            )?.find((p) => p.caseSlug === c.slug);
            const isCompleted = isStudyComplete(awards, userProgressDoc, c.slug);
            const isCaseUnlocked = unlockedCases ? unlockedCases.includes(c.slug) : c.rcCost <= 0;
            const open = isCaseUnlocked || isCompleted;
            const labPassed = has(labAwardId(c.slug));
            const viewedCount = userProgressDoc?.completedSections?.length ?? 0;
            const labAccounted = labPassed && !userProgressDoc?.completedSections?.includes(6);
            const completedCount = isCompleted
              ? 8
              : Math.min(8, viewedCount + (labAccounted ? 1 : 0));
            const progressPercent = isCompleted ? 100 : Math.round((completedCount / 8) * 100);

            const interview = getCaseInterviewBadges(c.slug || c.index);

            const card = (
              <>
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-widest ${
                      isCompleted ? "text-black font-black" : "text-black font-bold"
                    }`}
                  >
                    {c.category}
                  </span>

                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black border-2 border-black px-3 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                      <CheckCircle2 className="size-3 stroke-[2.5]" />
                      Completed
                    </span>
                  ) : open ? (
                    <span className="font-mono text-[10px] font-black text-black bg-neutral-100 border-2 border-black px-2.5 py-0.5 rounded-full">
                      🔓 Available · {c.index}
                    </span>
                  ) : c.tier === "premium" ? (
                    <span className="font-mono text-[10px] font-black text-black bg-neutral-100 border-2 border-black px-2.5 py-0.5 rounded-full">
                      🔒 Premium Tier
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] font-black text-black bg-white border-2 border-black px-2.5 py-0.5 rounded-full">
                      🔒 Locked (Sequential)
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-balance text-lg font-black tracking-tight text-black group-hover:underline transition-colors">
                  {c.title}
                </h2>

                <p className="mt-2 text-pretty text-xs leading-relaxed text-black font-medium line-clamp-3">
                  {c.summary}
                </p>

                {/* Company & Interview Intel Badge Strip */}
                <div className="mt-3 rounded-2xl bg-neutral-50 border-2 border-black/15 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded bg-black text-white px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider">
                      <Briefcase className="size-2.5 stroke-[2.5]" />
                      {interview.roundType}
                    </span>
                    <span className="font-mono text-[9px] text-neutral-600 font-bold uppercase">
                      {interview.targetRole}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="font-mono text-[10px] text-black font-black flex items-center gap-1">
                      <Building2 className="size-3 text-neutral-700" />
                      Asked at:
                    </span>
                    {interview.companies.map((comp) => (
                      <span
                        key={comp}
                        className="rounded-md bg-white border border-black/30 px-1.5 py-0.2 font-mono text-[10px] font-black text-black"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Progress bar visual for completed & in-progress cases */}
                {isCompleted ? (
                  <div className="mt-4 space-y-1.5 rounded-2xl bg-neutral-100 border-2 border-black p-2.5">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-black font-black flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        Investigation Cleared
                      </span>
                      <span className="text-black font-black">08 / 08 Sections</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 border border-black">
                      <div className="h-full w-full rounded-full bg-black" />
                    </div>
                  </div>
                ) : completedCount > 0 ? (
                  <div className="mt-4 space-y-1.5 rounded-2xl bg-neutral-50 border-2 border-black p-2.5">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-black font-black">In Progress</span>
                      <span className="text-black font-bold">
                        {completedCount} / 08 Sections ({progressPercent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 border border-black">
                      <div
                        className="h-full rounded-full bg-black"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-lg px-2.5 py-0.5 font-mono text-[10px] font-black border-2 border-black bg-white text-black">
                    {c.learnerLevel}
                  </span>

                  <span className="rounded-lg bg-white border-2 border-black px-2 py-0.5 font-mono text-[10px] font-black text-black">
                    {c.estimatedTime}
                  </span>

                  {(c.tech ?? []).map((t: string) => (
                    <span
                      key={t}
                      className="rounded-lg bg-white border-2 border-black px-2 py-0.5 font-mono text-[10px] font-bold text-black"
                    >
                      {t}
                    </span>
                  ))}

                  {isCompleted ? (
                    <span className="rounded-lg bg-black text-white border-2 border-black px-2 py-0.5 font-mono text-[10px] font-black ml-auto">
                      ✓ +{getCaseStudyRc(c.difficulty)} RC
                    </span>
                  ) : (
                    <span className="rounded-lg bg-white border-2 border-black px-2 py-0.5 font-mono text-[10px] font-black text-black ml-auto">
                      +{getCaseStudyRc(c.difficulty)} RC
                    </span>
                  )}
                </div>

                {!open && (
                  <p className="mt-4 rounded-xl px-3 py-2 font-mono text-[11px] leading-relaxed border-2 border-black bg-neutral-100 text-black font-black">
                    {c.tier === "premium"
                      ? "🔒 Locked · Premium tier architecture study."
                      : "🔒 Locked · Complete preceding case study to unlock."}
                  </p>
                )}
              </>
            );

            if (!isAuthenticated) {
              return (
                <Link
                  key={c.slug}
                  to="/sign-in"
                  search={{ redirect: `/cases/${c.slug}` }}
                  className="glass-panel group block rounded-3xl p-6 transition-all border-2 border-black bg-white text-black shadow-xs hover:bg-neutral-50 hover:-translate-y-1"
                >
                  {card}
                </Link>
              );
            }

            return (
              <Link
                key={c.slug}
                to="/cases/$slug"
                params={{ slug: c.slug }}
                className="glass-panel group block rounded-3xl p-6 transition-all border-2 border-black bg-white text-black shadow-xs hover:bg-neutral-50 hover:-translate-y-1"
              >
                {card}
              </Link>
            );
          })}
        </div>

        {shown.length === 0 && (
          <div className="rounded-3xl border-2 border-black bg-white p-12 text-center text-black">
            <Filter className="mx-auto size-8 text-neutral-400" />
            <h3 className="mt-3 text-lg font-black">
              No investigations match the selected filters
            </h3>
            <p className="mt-1 text-xs text-neutral-600">
              Try adjusting your category, company, or interview round selection.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory("All");
                setSelectedCompany("All");
                setSelectedRound("All Rounds");
              }}
              className="mt-4 inline-flex rounded-xl bg-black px-4 py-2 font-mono text-xs font-black text-white"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </AppChrome>
  );
}
