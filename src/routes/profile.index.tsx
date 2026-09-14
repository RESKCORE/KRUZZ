import { createFileRoute, Link } from "@tanstack/react-router";
import { AppChrome } from "@/components/AppChrome";
import { UserProfileCard } from "@/components/UserProfileCard";
import { StreakStrip } from "@/components/StreakStrip";
import { useAccount, useWallet, useStreak } from "@/lib/account";
import { isCaseCompleted, isLabCompleted, isStudyComplete, RANKS } from "@/lib/rc";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowRight, Award, CheckCircle2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/profile/")({
  head: () => ({
    meta: [
      { title: "Investigator Profile — KRUZZ" },
      {
        name: "description",
        content:
          "View your verified engineering identity, earned achievements, and reflection logs.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { isAuthenticated } = useAccount();
  const { points, rank, awards } = useWallet();
  const { current: streakCurrent, longest: streakLongest, lastActive } = useStreak();

  const cloudProgress = useQuery(
    api.caseProgress.getAllUserProgress,
    isAuthenticated ? {} : "skip",
  );

  const caseStudies = (useQuery(api.caseStudies.list, {}) ?? []) as any[];
  const totalCases = caseStudies.length;
  const completedCases = caseStudies.filter((c) => {
    const progressDoc = cloudProgress?.find((p) => p.caseSlug === c.slug);
    return isStudyComplete(awards, progressDoc, c.slug);
  });
  const completedLabs = caseStudies.filter((c) => {
    const progressDoc = cloudProgress?.find((p) => p.caseSlug === c.slug);
    return isLabCompleted(awards, c.slug) || Boolean(progressDoc?.passed);
  });

  // Rank progression metrics — thresholds live in @/lib/rc (RANKS)
  const nextTier = rank.next ? RANKS.find((r) => r.name === rank.next) : null;
  const currentTierIdx = RANKS.findIndex((r) => r.name === rank.name);
  const currentTierMin = RANKS[currentTierIdx]?.at ?? 0;
  const nextTierMin = nextTier?.at ?? 1000;
  const rankProgressPercent = nextTier
    ? Math.min(
        100,
        Math.max(0, Math.round(((points - currentTierMin) / (nextTierMin - currentTierMin)) * 100)),
      )
    : 100;

  return (
    <AppChrome>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-6">
        {/* Page Header */}
        <div className="border-b border-white/[0.08] pb-6">
          <div className="flex items-center gap-2 font-mono text-xs text-primary">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="tracking-widest uppercase font-semibold">
              ENGINEERING DOSSIER · VERIFIED IDENTITY
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#f5f5f5] sm:text-4xl">
              Investigator Profile
            </h1>
            <span className="font-mono text-xs text-[#8a8a8a]">
              Tier: <span className="font-bold text-primary">{rank.name}</span> · Balance:{" "}
              <span className="font-bold text-[#f5f5f5]">{points} RC</span>
            </span>
          </div>
        </div>

        {/* =========================================================================
            EQUAL 2-COLUMN HERO DECK: Profile + Streak (Left) & Rank + Leaderboard (Right)
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left Column (50%): Identity & Daily Consistency Matrix */}
          <div className="flex flex-col gap-6">
            <UserProfileCard className="w-full" />
            <StreakStrip current={streakCurrent} longest={streakLongest} lastActive={lastActive} />
          </div>

          {/* Right Column (50%): System Thinking Rank Ladder & Engineering Milestones */}
          <div className="flex flex-col gap-6">
            {/* 1. System Thinking Rank Ladder */}
            <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] shadow-[0_16px_32px_rgba(0,0,0,0.35)]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4.5 text-primary" />
                  <h3 className="font-bold text-sm text-[#f5f5f5]">System Thinking Rank Ladder</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#8a8a8a]">Current Rank:</span>
                  <span className="rounded-lg bg-[var(--theme-surface,#182608)] border border-primary/40 px-2.5 py-0.5 font-mono text-xs font-bold text-primary">
                    {rank.name}
                  </span>
                </div>
              </div>

              {/* Progress to next tier */}
              {nextTier && (
                <div className="mb-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] p-3.5">
                  <div className="flex items-center justify-between font-mono text-xs text-[#8a8a8a] mb-2">
                    <span>
                      Progression to <strong className="text-[#f5f5f5]">{nextTier.name}</strong>
                    </span>
                    <span className="text-primary font-bold">
                      {Math.max(0, nextTierMin - points)} RC needed
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#141414] p-0.5 border border-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-primary shadow-[0_0_12px_var(--glow-color,rgba(204,255,0,0.4))] transition-all duration-500"
                      style={{ width: `${rankProgressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 5 Rank Tiers Grid */}
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-5">
                {RANKS.map((tier, i) => {
                  const isAchieved = points >= tier.at;
                  const isCurrent = rank.name === tier.name;

                  return (
                    <div
                      key={tier.name}
                      className={`rounded-2xl p-3 border text-center transition-all ${
                        isCurrent
                          ? "bg-[var(--theme-surface,#182608)] border-primary/60 shadow-[0_0_12px_var(--glow-color,rgba(204,255,0,0.2))]"
                          : isAchieved
                            ? "bg-white/[0.03] border-white/10"
                            : "bg-black/20 border-white/[0.04] opacity-40"
                      }`}
                    >
                      <span className="font-mono text-[10px] text-[#8a8a8a]">Lv 0{i + 1}</span>
                      <p
                        className={`mt-1 font-bold text-xs truncate ${
                          isCurrent
                            ? "text-primary font-extrabold"
                            : isAchieved
                              ? "text-[#f5f5f5]"
                              : "text-[#8a8a8a]"
                        }`}
                      >
                        {tier.name}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-[#8a8a8a]">{tier.at} RC</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Engineering Telemetry & Verified Milestones (Fills the gap cleanly) */}
            <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] shadow-[0_16px_32px_rgba(0,0,0,0.35)] flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Award className="size-4.5 text-primary" />
                    <h3 className="font-bold text-sm text-[#f5f5f5]">
                      Engineering Telemetry & Milestones
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] text-primary bg-[var(--theme-surface,#182608)] border border-primary/30 px-2.5 py-0.5 rounded-full font-bold">
                    {completedCases.length} of {totalCases} Cleared
                  </span>
                </div>

                {/* 3 Telemetry metric boxes */}
                <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-3">
                    <p className="font-mono text-base font-bold text-[#f5f5f5]">
                      {Math.round((completedCases.length / Math.max(1, totalCases)) * 100)}%
                    </p>
                    <p className="font-mono text-[9px] text-[#8a8a8a] uppercase tracking-wider mt-0.5">
                      Curriculum
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-3">
                    <p className="font-mono text-base font-bold text-primary">
                      {completedLabs.length}
                    </p>
                    <p className="font-mono text-[9px] text-[#8a8a8a] uppercase tracking-wider mt-0.5">
                      Labs Passed
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-3">
                    <p className="font-mono text-base font-bold text-[#f5f5f5]">{streakLongest}d</p>
                    <p className="font-mono text-[9px] text-[#8a8a8a] uppercase tracking-wider mt-0.5">
                      Max Streak
                    </p>
                  </div>
                </div>

                {/* Milestone verification pills */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.05] px-3.5 py-2.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`size-2 rounded-full ${
                          completedCases.length >= 1
                            ? "bg-primary shadow-[0_0_8px_var(--glow-color,rgba(204,255,0,0.5))]"
                            : "bg-white/20"
                        }`}
                      />
                      <span className="font-medium text-[#f5f5f5]">
                        First Principles Investigation
                      </span>
                    </div>
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        completedCases.length >= 1 ? "text-primary" : "text-[#8a8a8a]"
                      }`}
                    >
                      {completedCases.length >= 1 ? "VERIFIED ✓" : "0/1 Cases"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.05] px-3.5 py-2.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`size-2 rounded-full ${
                          streakCurrent >= 3 || streakLongest >= 3
                            ? "bg-primary shadow-[0_0_8px_var(--glow-color,rgba(204,255,0,0.5))]"
                            : "bg-white/20"
                        }`}
                      />
                      <span className="font-medium text-[#f5f5f5]">3-Day Cadence Lock</span>
                    </div>
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        streakCurrent >= 3 || streakLongest >= 3 ? "text-primary" : "text-[#8a8a8a]"
                      }`}
                    >
                      {streakCurrent >= 3 || streakLongest >= 3
                        ? "VERIFIED ✓"
                        : `${streakCurrent}/3 Days`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.05] px-3.5 py-2.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`size-2 rounded-full ${
                          completedCases.length >= 5
                            ? "bg-primary shadow-[0_0_8px_var(--glow-color,rgba(204,255,0,0.5))]"
                            : "bg-white/20"
                        }`}
                      />
                      <span className="font-medium text-[#f5f5f5]">Distributed Architect Tier</span>
                    </div>
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        completedCases.length >= 5 ? "text-primary" : "text-[#8a8a8a]"
                      }`}
                    >
                      {completedCases.length >= 5
                        ? "VERIFIED ✓"
                        : `${completedCases.length}/5 Cases`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action row at bottom */}
              <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#8a8a8a]">System Arena Dossier</span>
                <Link
                  to="/cases"
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-primary hover:underline"
                >
                  <span>Explore Cases</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}
