import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppChrome } from "@/components/AppChrome";
import { UserProfileCard } from "@/components/UserProfileCard";
import { StreakStrip } from "@/components/StreakStrip";
import { RCWalletPanel } from "@/components/RCWallet";
import { useAccount, useWallet, useStreak } from "@/lib/account";
import {
  caseAwardId,
  labAwardId,
  isCaseCompleted,
  isLabCompleted,
  isStudyComplete,
  getCaseStudyRc,
} from "@/lib/rc";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowRight, BookOpen, CheckCircle2, Cpu, Layers } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Center — KRUZZ" },
      {
        name: "description",
        content: "Track your engineering investigations, streaks, and Reasoning Credits.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, profile, isAuthenticated } = useAccount();
  const { points, rank, awards } = useWallet();
  const { current: streakCurrent, longest: streakLongest, lastActive } = useStreak();

  const cloudProgress = useQuery(
    api.caseProgress.getAllUserProgress,
    isAuthenticated ? {} : "skip",
  );
  const unlockedCases = useQuery(api.caseProgress.getUserUnlockedCases, {});

  const rawCaseStudies = useQuery(api.caseStudies.list, {});
  const caseStudies = useMemo(() => (rawCaseStudies ?? []) as any[], [rawCaseStudies]);

  const completedStudies = useMemo(() => {
    return caseStudies.filter((c) => {
      const progressDoc = cloudProgress?.find((p) => p.caseSlug === c.slug);
      return isStudyComplete(awards, progressDoc, c.slug);
    });
  }, [caseStudies, cloudProgress, awards]);

  const displayName =
    user?.fullName || profile?.name || (isAuthenticated ? "Engineer" : "Investigator");

  // Recommended next case: first case that is unlocked but not yet completed
  const nextCase =
    caseStudies.find((c) => {
      const isDone = isStudyComplete(
        awards,
        cloudProgress?.find((p) => p.caseSlug === c.slug),
        c.slug,
      );
      const isUnlocked = unlockedCases ? unlockedCases.includes(c.slug) : c.rcCost <= 0;
      return !isDone && isUnlocked;
    }) ??
    caseStudies.find((c) => !isCaseCompleted(awards, c.slug)) ??
    caseStudies[0];

  return (
    <AppChrome>
      <div className="mx-auto max-w-[1240px] px-4 py-8 md:px-6">
        {/* Telemetry Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-black ring-2 ring-black/20" />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black font-black">
                Command Center · Telemetry
              </p>
            </div>
            <h1 className="mt-1.5 text-2xl md:text-3xl font-black tracking-tight text-black">
              Welcome back, {displayName}
            </h1>
            <p className="mt-1 font-mono text-xs text-black font-medium">
              Tier: <span className="text-black font-black underline">{rank.name}</span> · Balance:{" "}
              <span className="text-black font-black">{points} RC</span> · Cadence:{" "}
              <span className="text-black font-black">{streakCurrent} Days</span>
            </p>
          </div>

          {nextCase ? (
            <div className="flex items-center gap-3">
              <Link
                to="/cases/$slug"
                params={{ slug: nextCase.slug }}
                className="inline-flex items-center gap-2.5 rounded-xl bg-black border-2 border-black px-4.5 py-2.5 font-mono text-xs font-black text-white shadow-xs transition-all hover:bg-neutral-800 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Resume Case: {nextCase.shortTitle || nextCase.title}</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/cases"
                className="inline-flex items-center gap-2.5 rounded-xl bg-white border-2 border-black px-4.5 py-2.5 font-mono text-xs font-black text-black hover:bg-neutral-100 transition-all shadow-xs"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-7 lg:grid-cols-[1fr_380px]">
          {/* Main Column */}
          <div className="space-y-6">
            {/* Active Investigation Card */}
            <div className="glass-panel relative overflow-hidden rounded-3xl p-6 border-2 border-black bg-white text-black shadow-xs">
              {nextCase ? (
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-4">
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="rounded-md bg-white border-2 border-black px-2 py-0.5 font-black text-black">
                        CASE {nextCase.index}
                      </span>
                      <span className="text-black font-bold">·</span>
                      <span className="text-black font-bold">{nextCase.category}</span>
                    </div>
                    <span className="font-mono text-xs text-black font-bold">
                      Estimated: {nextCase.estimatedTime}
                    </span>
                  </div>

                  <div className="mt-4">
                    <h2 className="text-xl md:text-2xl font-black tracking-tight text-black">
                      {nextCase.title}
                    </h2>
                    <p className="mt-2 text-xs leading-relaxed text-black font-medium max-w-2xl">
                      {nextCase.summary}
                    </p>
                  </div>

                  {/* Subsystem Highlights */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      "Architecture Blueprint",
                      "State Flow",
                      "Implementation Lab",
                      "Trade-Off Matrix",
                    ].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg bg-white border-2 border-black px-2.5 py-1 font-mono text-[10px] text-black font-bold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t-2 border-black">
                    <Link
                      to="/cases/$slug"
                      params={{ slug: nextCase.slug }}
                      className="rounded-xl bg-black border-2 border-black px-4 py-2 font-mono text-xs font-black text-white hover:bg-neutral-800 shadow-xs transition-all"
                    >
                      Enter 8-Section Workspace →
                    </Link>

                    <span className="font-mono text-[11px] text-black font-bold">
                      Potential Yield:{" "}
                      <strong className="text-black font-black underline">
                        +{getCaseStudyRc(nextCase.difficulty)} RC
                      </strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="inline-block size-6 animate-spin rounded-full border-2 border-black border-t-transparent mb-3" />
                  <p className="font-mono text-xs text-black font-bold">
                    Loading Next Investigation...
                  </p>
                </div>
              )}
            </div>

            {/* Streak Visualizer */}
            <StreakStrip current={streakCurrent} longest={streakLongest} lastActive={lastActive} />

            {/* Completed Investigations Track (Only completed cases shown) */}
            <div className="glass-panel rounded-3xl p-6 border-2 border-black bg-white text-black shadow-xs">
              <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-black stroke-[2.5]" />
                  <h3 className="font-black text-sm text-black">
                    Completed Investigations ({completedStudies.length} of {caseStudies.length})
                  </h3>
                </div>
                <Link
                  to="/cases"
                  className="font-mono text-xs text-black font-black hover:underline flex items-center gap-1"
                >
                  <span>Explore Arena</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>

              {completedStudies.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {completedStudies.map((c) => (
                    <Link
                      key={c.slug}
                      to="/cases/$slug"
                      params={{ slug: c.slug }}
                      className="group flex items-center justify-between rounded-2xl p-4 transition-all border-2 border-black bg-white hover:bg-neutral-50 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-black font-bold">
                          <span>{c.index}</span>
                          <span>·</span>
                          <span className="text-black font-black">
                            {c.learnerLevel || "Foundations"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-black text-black">
                          {c.shortTitle || c.title}
                        </p>
                      </div>

                      <span className="flex items-center gap-1.5 font-mono text-[10px] font-black text-white bg-black px-2.5 py-1 rounded-lg border-2 border-black shrink-0">
                        <CheckCircle2 className="size-3.5 stroke-[2.5]" />
                        Completed
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-neutral-50 border-2 border-black p-6 text-center shadow-xs">
                  <BookOpen className="size-6 text-black mx-auto mb-2" />
                  <p className="text-sm font-black text-black">No completed investigations yet</p>
                  <p className="text-xs text-neutral-600 mt-1 max-w-sm mx-auto mb-4 font-medium">
                    Solve distributed systems cases in the Arena Centre to clear sections, pass
                    CodeArena implementation labs, and track your achievements here.
                  </p>
                  <Link
                    to="/cases"
                    className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 font-mono text-xs font-black text-white hover:bg-neutral-800 border-2 border-black shadow-xs"
                  >
                    <span>Enter Arena Centre</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* The Unique User Profile Card */}
            <UserProfileCard className="max-w-none" />

            {/* Wallet Panel */}
            <RCWalletPanel />
          </div>
        </div>
      </div>
    </AppChrome>
  );
}
