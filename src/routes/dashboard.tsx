import { createFileRoute, Link } from "@tanstack/react-router";
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
import { ArrowRight, BookOpen, CheckCircle2, Cpu, Layers, Sparkles, Trophy } from "lucide-react";

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

  const topLearners = useQuery(api.leaderboard.getTopLearners);
  const cloudProgress = useQuery(
    api.caseProgress.getAllUserProgress,
    isAuthenticated ? {} : "skip",
  );
  const unlockedCases = useQuery(api.caseProgress.getUserUnlockedCases, {});

  const caseStudies = (useQuery(api.caseStudies.list, {}) ?? []) as any[];

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
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full recording-dot" />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
                Command Center · Telemetry
              </p>
            </div>
            <h1 className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-[#f5f5f5]">
              Welcome back, {displayName}
            </h1>
            <p className="mt-1 font-mono text-xs text-[#8a8a8a]">
              Tier: <span className="text-primary font-bold">{rank.name}</span> · Balance:{" "}
              <span className="text-[#f5f5f5] font-bold">{points} RC</span> · Cadence:{" "}
              <span className="text-[#f5f5f5] font-bold">{streakCurrent} Days</span>
            </p>
          </div>

          {nextCase ? (
            <div className="flex items-center gap-3">
              <Link
                to="/cases/$slug"
                params={{ slug: nextCase.slug }}
                className="inline-flex items-center gap-2.5 rounded-xl bg-primary px-4.5 py-2.5 font-mono text-xs font-black text-primary-foreground shadow-[0_0_18px_var(--glow-color,rgba(204,255,0,0.45))] transition-all hover:shadow-[0_0_24px_var(--glow-color,rgba(204,255,0,0.7))] hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Resume Case: {nextCase.shortTitle || nextCase.title}</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/cases"
                className="inline-flex items-center gap-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] px-4.5 py-2.5 font-mono text-xs font-bold text-[#b8b8b8] hover:bg-white/[0.1] hover:text-[#f5f5f5] transition-all"
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
            <div className="glass-panel relative overflow-hidden rounded-3xl p-6 border border-white/[0.08] shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 size-60 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

              {nextCase ? (
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="rounded-md bg-primary/15 border border-primary/30 px-2 py-0.5 font-bold text-primary">
                        CASE {nextCase.index}
                      </span>
                      <span className="text-[#8a8a8a]">·</span>
                      <span className="text-[#8a8a8a]">{nextCase.category}</span>
                    </div>
                    <span className="font-mono text-xs text-[#8a8a8a]">
                      Estimated: {nextCase.estimatedTime}
                    </span>
                  </div>

                  <div className="mt-4">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#f5f5f5]">
                      {nextCase.title}
                    </h2>
                    <p className="mt-2 text-xs leading-relaxed text-[#b8b8b8] max-w-2xl">
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
                        className="rounded-lg bg-white/[0.03] border border-white/[0.07] px-2.5 py-1 font-mono text-[10px] text-[#b8b8b8]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.06]">
                    <Link
                      to="/cases/$slug"
                      params={{ slug: nextCase.slug }}
                      className="rounded-xl bg-[var(--theme-surface,#182608)] border border-primary/40 px-4 py-2 font-mono text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground shadow-[0_0_12px_var(--glow-color,rgba(204,255,0,0.2))] transition-all"
                    >
                      Enter 8-Section Workspace →
                    </Link>

                    <span className="font-mono text-[11px] text-[#8a8a8a]">
                      Potential Yield:{" "}
                      <strong className="text-primary">
                        +{getCaseStudyRc(nextCase.difficulty)} RC
                      </strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="inline-block size-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
                  <p className="font-mono text-xs text-[#8a8a8a]">Loading Next Investigation...</p>
                </div>
              )}
            </div>

            {/* Streak Visualizer */}
            <StreakStrip current={streakCurrent} longest={streakLongest} lastActive={lastActive} />

            {/* Curriculum Track */}
            <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-primary" />
                  <h3 className="font-bold text-sm text-[#f5f5f5]">
                    Core Engineering Track ({caseStudies.length} Cases)
                  </h3>
                </div>
                <Link to="/cases" className="font-mono text-xs text-primary hover:underline">
                  View Library →
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {caseStudies.map((c) => {
                  const progressDoc = cloudProgress?.find((p) => p.caseSlug === c.slug);
                  const isDone = isStudyComplete(awards, progressDoc, c.slug);
                  const isCaseUnlocked = unlockedCases
                    ? unlockedCases.includes(c.slug)
                    : c.rcCost <= 0;
                  const labPassed = isLabCompleted(awards, c.slug) || Boolean(progressDoc?.passed);
                  const viewedCount = progressDoc?.completedSections?.length ?? 0;
                  const labAccounted = labPassed && !progressDoc?.completedSections?.includes(6);
                  const count = isDone ? 8 : Math.min(8, viewedCount + (labAccounted ? 1 : 0));

                  return (
                    <Link
                      key={c.slug}
                      to="/cases/$slug"
                      params={{ slug: c.slug }}
                      className={
                        isDone
                          ? "group flex items-center justify-between rounded-2xl p-4 transition-all border-2 border-primary/60 bg-[var(--theme-surface,#182608)]/90 shadow-[0_0_20px_var(--glow-color,rgba(204,255,0,0.18))] hover:border-primary hover:shadow-[0_0_30px_var(--glow-color,rgba(204,255,0,0.3))]"
                          : isCaseUnlocked
                            ? "neu-btn group flex items-center justify-between rounded-2xl p-4 hover:border-primary/40 transition-all"
                            : "neu-btn group flex items-center justify-between rounded-2xl p-4 opacity-75 hover:border-white/20 transition-all"
                      }
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#8a8a8a]">
                          <span>{c.index}</span>
                          <span>·</span>
                          <span className={isDone ? "text-primary font-bold" : "text-primary"}>
                            {c.learnerLevel}
                          </span>
                        </div>
                        <p
                          className={`mt-1 text-xs font-bold transition-colors ${
                            isDone
                              ? "text-[#f5f5f5] group-hover:text-primary"
                              : "text-[#f5f5f5] group-hover:text-primary"
                          }`}
                        >
                          {c.shortTitle}
                        </p>
                      </div>

                      {isDone ? (
                        <span className="flex items-center gap-1.5 font-mono text-[10px] font-extrabold text-primary-foreground bg-primary px-2.5 py-1 rounded-lg shadow-[0_0_12px_var(--glow-color,rgba(204,255,0,0.4))]">
                          <CheckCircle2 className="size-3.5 stroke-[2.5]" />
                          Completed
                        </span>
                      ) : count > 0 ? (
                        <span className="font-mono text-[10px] text-primary bg-[var(--theme-surface,#182608)] border border-primary/30 px-2 py-1 rounded-lg font-bold">
                          {String(count).padStart(2, "0")} / 08
                        </span>
                      ) : isCaseUnlocked ? (
                        <span className="font-mono text-[10px] text-primary bg-[var(--theme-surface,#182608)] border border-primary/30 px-2 py-1 rounded-lg">
                          🔓 Available
                        </span>
                      ) : c.tier === "premium" ? (
                        <span className="font-mono text-[10px] text-[#f59e0b] bg-[#1c1507] border border-[#f59e0b]/30 px-2 py-1 rounded-lg">
                          🔒 Premium
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-[#8a8a8a] bg-white/[0.03] border border-white/[0.07] px-2 py-1 rounded-lg">
                          🔒 Locked
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* The Unique User Profile Card */}
            <UserProfileCard className="max-w-none" />

            {/* Wallet Panel */}
            <RCWalletPanel />

            {/* Global Leaderboard */}
            <div className="glass-panel rounded-3xl p-5 border border-white/[0.08] shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="size-4 text-primary" />
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#f5f5f5]">
                    Global Standings
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-[#8a8a8a]">By Cases Solved</span>
              </div>

              {topLearners && topLearners.length > 0 ? (
                <div className="space-y-2">
                  {topLearners.slice(0, 5).map((u, i) => (
                    <div
                      key={u._id}
                      className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.05] px-3.5 py-2.5 text-xs transition-colors hover:border-white/10"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`font-mono text-xs font-bold w-4 ${
                            i === 0
                              ? "text-primary"
                              : i === 1
                                ? "text-primary/90"
                                : i === 2
                                  ? "text-[#f5f5f5]"
                                  : "text-[#8a8a8a]"
                          }`}
                        >
                          #{i + 1}
                        </span>
                        <span className="font-medium text-[#f5f5f5] truncate max-w-[130px]">
                          {u.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#8a8a8a]">{u.rank}</span>
                        <span className="font-mono text-xs font-bold text-primary flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          {u.completedCasesCount === 1
                            ? "1 solved"
                            : `${u.completedCasesCount ?? 0} solved`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 text-center">
                  <Sparkles className="size-5 text-primary mx-auto mb-1.5 opacity-80" />
                  <p className="text-xs text-[#8a8a8a]">
                    Complete case investigations to earn your ranking on the global telemetry board.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}
