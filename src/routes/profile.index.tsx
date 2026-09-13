import { createFileRoute, Link } from "@tanstack/react-router";
import { AppChrome } from "@/components/AppChrome";
import { UserProfileCard } from "@/components/UserProfileCard";
import { StreakStrip } from "@/components/StreakStrip";
import { useAccount, useWallet, useStreak } from "@/lib/account";
import { isCaseCompleted, isLabCompleted, isStudyComplete, RANKS } from "@/lib/rc";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { BookOpen, ShieldCheck, Trophy } from "lucide-react";

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

  const globalLeaderboard = useQuery(api.leaderboard.getTopLearners);
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
  const currentTierIdx = RANKS.findIndex((t) => t.name === rank.name);
  const nextTier = RANKS[currentTierIdx + 1];
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
          <div className="flex items-center gap-2 font-mono text-xs text-[#ccff00]">
            <span className="size-2 rounded-full bg-[#ccff00] animate-pulse" />
            <span className="tracking-widest uppercase font-semibold">
              ENGINEERING DOSSIER · VERIFIED IDENTITY
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#f5f5f5] sm:text-4xl">
              Investigator Profile
            </h1>
            <span className="font-mono text-xs text-[#8a8a8a]">
              Tier: <span className="font-bold text-[#ccff00]">{rank.name}</span> · Balance:{" "}
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

          {/* Right Column (50%): System Thinking Rank Ladder & Global Standings */}
          <div className="flex flex-col gap-6">
            {/* 1. System Thinking Rank Ladder */}
            <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] shadow-[0_16px_32px_rgba(0,0,0,0.35)]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4.5 text-[#ccff00]" />
                  <h3 className="font-bold text-sm text-[#f5f5f5]">System Thinking Rank Ladder</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#8a8a8a]">Current Rank:</span>
                  <span className="rounded-lg bg-[#182608] border border-[#ccff00]/40 px-2.5 py-0.5 font-mono text-xs font-bold text-[#ccff00]">
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
                    <span className="text-[#ccff00] font-bold">
                      {Math.max(0, nextTierMin - points)} RC needed
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#141414] p-0.5 border border-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] transition-all duration-500"
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
                          ? "bg-[#182608] border-[#ccff00]/60"
                          : isAchieved
                            ? "bg-white/[0.03] border-white/10"
                            : "bg-black/20 border-white/[0.04] opacity-40"
                      }`}
                    >
                      <span className="font-mono text-[10px] text-[#8a8a8a]">Lv 0{i + 1}</span>
                      <p
                        className={`mt-1 font-bold text-xs truncate ${
                          isCurrent
                            ? "text-[#ccff00]"
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

            {/* 2. Global Investigator Rankings */}
            <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] shadow-[0_16px_32px_rgba(0,0,0,0.35)] flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Trophy className="size-4 text-[#ccff00]" />
                  <h3 className="font-bold text-sm text-[#f5f5f5]">Global Standings</h3>
                </div>
                <span className="font-mono text-[10px] text-[#8a8a8a] uppercase tracking-wider">
                  Public Standings
                </span>
              </div>

              <div className="flex flex-col gap-2.5 flex-1">
                {globalLeaderboard && globalLeaderboard.length > 0 ? (
                  globalLeaderboard.slice(0, 6).map((userRank, idx) => (
                    <div
                      key={userRank._id}
                      className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.05] p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid size-6 place-items-center rounded-lg font-mono text-xs font-bold ${
                            idx === 0
                              ? "bg-[#ccff00] text-[#080808]"
                              : idx === 1
                                ? "bg-white/20 text-[#f5f5f5]"
                                : idx === 2
                                  ? "bg-[#a3e635]/20 text-[#a3e635]"
                                  : "bg-white/5 text-[#8a8a8a]"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-[#f5f5f5]">{userRank.name}</p>
                          <p className="font-mono text-[10px] text-[#8a8a8a]">{userRank.rank}</p>
                        </div>
                      </div>

                      <span className="font-mono text-xs font-bold text-[#ccff00]">
                        {userRank.points} RC
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 text-center">
                    <p className="text-xs text-[#8a8a8a]">
                      Global standings are updating in real-time as investigators clear system
                      cases.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            FULL-WIDTH ENGINEERING CASE SOLVED RECORDS
           ========================================================================= */}
        <div className="glass-panel rounded-3xl p-6 border border-white/[0.08] shadow-[0_16px_32px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-[#ccff00]" />
              <h3 className="font-bold text-sm text-[#f5f5f5]">
                Engineering Case Solved Records ({completedCases.length} of {totalCases})
              </h3>
            </div>
            <span className="font-mono text-xs text-[#8a8a8a]">
              {Math.round((completedCases.length / totalCases) * 100)}% Complete
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {caseStudies.map((c) => {
              const progressDoc = cloudProgress?.find((p) => p.caseSlug === c.slug);
              const isDone = isStudyComplete(awards, progressDoc, c.slug);
              const labDone = isLabCompleted(awards, c.slug) || Boolean(progressDoc?.passed);
              const viewedCount = progressDoc?.completedSections?.length ?? 0;
              const labAccounted = labDone && !progressDoc?.completedSections?.includes(6);
              const count = isDone ? 8 : Math.min(8, viewedCount + (labAccounted ? 1 : 0));

              return (
                <div
                  key={c.slug}
                  className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4 transition-all ${
                    isDone
                      ? "bg-gradient-to-r from-[#182608]/80 to-[#0e1704]/80 border-2 border-[#ccff00]/50 shadow-[0_0_24px_rgba(204,255,0,0.12)] hover:border-[#ccff00]"
                      : "bg-white/[0.02] border border-white/[0.06] hover:border-white/15"
                  }`}
                >
                  <div className="min-w-[240px] flex-1">
                    <div className="flex items-center gap-2 font-mono text-[10px] text-[#8a8a8a]">
                      <span>Case {c.index}</span>
                      <span>·</span>
                      <span className="text-[#ccff00] font-bold">{c.category}</span>
                    </div>
                    <p
                      className={`mt-1 font-bold text-sm transition-colors ${
                        isDone ? "text-[#f5f5f5]" : "text-[#f5f5f5]"
                      }`}
                    >
                      {c.title}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-mono text-[10px] px-2.5 py-1 rounded-lg border font-bold ${
                        labDone
                          ? "bg-[#182608] border-[#ccff00]/40 text-[#ccff00]"
                          : "bg-white/[0.04] border-white/[0.08] text-[#8a8a8a]"
                      }`}
                    >
                      CodeArena: {labDone ? "PASSED ✓" : "PENDING"}
                    </span>

                    <span
                      className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                        isDone
                          ? "bg-gradient-to-r from-[#d4ff00] via-[#ccff00] to-[#9df000] text-[#080808] font-black shadow-[0_0_12px_rgba(204,255,0,0.4)]"
                          : count > 0
                            ? "bg-[#141a05] border-[#ccff00]/30 text-[#ccff00]"
                            : "bg-white/[0.04] border-white/[0.08] text-[#8a8a8a]"
                      }`}
                    >
                      {isDone ? "✓ 8/8 CLEARED" : count > 0 ? `${count}/8 SECTIONS` : "NOT STARTED"}
                    </span>

                    <Link
                      to="/cases/$slug"
                      params={{ slug: c.slug }}
                      className={
                        isDone
                          ? "rounded-xl bg-[#ccff00] text-[#080808] hover:bg-[#d4ff00] px-3.5 py-1.5 font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(204,255,0,0.35)]"
                          : "rounded-xl bg-white/[0.04] hover:bg-[#ccff00] hover:text-[#080808] border border-white/10 px-3 py-1.5 font-mono text-xs font-semibold text-[#f5f5f5] transition-colors"
                      }
                    >
                      {isDone ? "Review" : "Open"} →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppChrome>
  );
}
