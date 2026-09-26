import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppChrome } from "@/components/AppChrome";
import { UserProfileCard } from "@/components/UserProfileCard";
import { StreakStrip } from "@/components/StreakStrip";
import { CampusAffiliationModal } from "@/components/CampusAffiliationModal";
import { useAccount, useWallet, useStreak } from "@/lib/account";
import { isCaseCompleted, isLabCompleted, isStudyComplete, RANKS } from "@/lib/rc";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowRight, Award, Edit3, GraduationCap, ShieldCheck, Trophy } from "lucide-react";

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
  const { user, profile, isAuthenticated } = useAccount();
  const { points, rank, awards } = useWallet();
  const { current: streakCurrent, longest: streakLongest, lastActive } = useStreak();
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);

  const userUniversity = (profile as any)?.university || "";

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
        <div className="border-b-2 border-black pb-6">
          <div className="flex items-center gap-2 font-mono text-xs text-black">
            <span className="size-2.5 rounded-full bg-black ring-2 ring-black/20" />
            <span className="tracking-widest uppercase font-black">
              ENGINEERING DOSSIER · VERIFIED IDENTITY
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="text-3xl font-black tracking-tight text-black sm:text-4xl">
              Investigator Profile
            </h1>
            <span className="font-mono text-xs text-black font-bold">
              Tier: <span className="font-black underline">{rank.name}</span> · Balance:{" "}
              <span className="font-black">{points} RC</span>
            </span>
          </div>
        </div>

        {/* =========================================================================
            EQUAL 2-COLUMN HERO DECK: Profile + Streak (Left) & Rank + Telemetry (Right)
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
            <div className="glass-panel rounded-3xl p-6 border-2 border-black bg-white text-black shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b-2 border-black pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4.5 text-black stroke-[2.5]" />
                  <h3 className="font-black text-sm text-black">System Thinking Rank Ladder</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-black font-bold">Current Rank:</span>
                  <span className="rounded-lg bg-black text-white border-2 border-black px-2.5 py-0.5 font-mono text-xs font-black">
                    {rank.name}
                  </span>
                </div>
              </div>

              {/* Progress to next tier */}
              {nextTier && (
                <div className="mb-5 rounded-2xl bg-neutral-50 border-2 border-black p-3.5 text-black">
                  <div className="flex items-center justify-between font-mono text-xs text-black mb-2">
                    <span className="font-bold">
                      Progression to{" "}
                      <strong className="font-black underline">{nextTier.name}</strong>
                    </span>
                    <span className="font-black">
                      {Math.max(0, nextTierMin - points)} RC needed
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 p-0.5 border border-black">
                    <div
                      className="h-full rounded-full bg-black transition-all duration-500"
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
                      className={`rounded-2xl p-3 border-2 border-black text-center transition-all shadow-xs ${
                        isCurrent
                          ? "bg-black text-white"
                          : isAchieved
                            ? "bg-neutral-100 text-black font-black"
                            : "bg-white text-black"
                      }`}
                    >
                      <span
                        className={`font-mono text-[10px] font-bold ${
                          isCurrent ? "text-neutral-300" : "text-neutral-600"
                        }`}
                      >
                        Lv 0{i + 1}
                      </span>
                      <p
                        className={`mt-1 font-black text-xs truncate ${
                          isCurrent ? "text-white" : "text-black"
                        }`}
                      >
                        {tier.name}
                      </p>
                      <p
                        className={`mt-1 font-mono text-[10px] font-bold ${
                          isCurrent ? "text-neutral-300" : "text-neutral-600"
                        }`}
                      >
                        {tier.at} RC
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Engineering Telemetry & Verified Milestones */}
            <div className="glass-panel rounded-3xl p-6 border-2 border-black bg-white text-black shadow-xs flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-black">
                  <div className="flex items-center gap-2">
                    <Award className="size-4.5 text-black stroke-[2.5]" />
                    <h3 className="font-black text-sm text-black">
                      Engineering Telemetry & Milestones
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] text-white bg-black border-2 border-black px-2.5 py-0.5 rounded-full font-black">
                    {completedCases.length} of {totalCases} Cleared
                  </span>
                </div>

                {/* 3 Telemetry metric boxes */}
                <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
                  <div className="rounded-2xl bg-neutral-50 border-2 border-black p-3 shadow-xs">
                    <p className="font-mono text-base font-black text-black">
                      {Math.round((completedCases.length / Math.max(1, totalCases)) * 100)}%
                    </p>
                    <p className="font-mono text-[9px] text-black font-black uppercase tracking-wider mt-0.5">
                      Curriculum
                    </p>
                  </div>

                  <div className="rounded-2xl bg-neutral-50 border-2 border-black p-3 shadow-xs">
                    <p className="font-mono text-base font-black text-black">
                      {completedLabs.length}
                    </p>
                    <p className="font-mono text-[9px] text-black font-black uppercase tracking-wider mt-0.5">
                      Labs Passed
                    </p>
                  </div>

                  <div className="rounded-2xl bg-neutral-50 border-2 border-black p-3 shadow-xs">
                    <p className="font-mono text-base font-black text-black">{streakLongest}d</p>
                    <p className="font-mono text-[9px] text-black font-black uppercase tracking-wider mt-0.5">
                      Max Streak
                    </p>
                  </div>
                </div>

                {/* Milestone verification pills */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-xl bg-neutral-50 border-2 border-black px-3.5 py-2.5 text-xs shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`size-2.5 rounded-full ${
                          completedCases.length >= 1
                            ? "bg-black ring-2 ring-black/20"
                            : "bg-neutral-300"
                        }`}
                      />
                      <span className="font-black text-black">First Principles Investigation</span>
                    </div>
                    <span
                      className={`font-mono text-[10px] font-black ${
                        completedCases.length >= 1 ? "text-black" : "text-neutral-500"
                      }`}
                    >
                      {completedCases.length >= 1 ? "VERIFIED ✓" : "0/1 Cases"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-neutral-50 border-2 border-black px-3.5 py-2.5 text-xs shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`size-2.5 rounded-full ${
                          streakCurrent >= 3 || streakLongest >= 3
                            ? "bg-black ring-2 ring-black/20"
                            : "bg-neutral-300"
                        }`}
                      />
                      <span className="font-black text-black">3-Day Cadence Lock</span>
                    </div>
                    <span
                      className={`font-mono text-[10px] font-black ${
                        streakCurrent >= 3 || streakLongest >= 3 ? "text-black" : "text-neutral-500"
                      }`}
                    >
                      {streakCurrent >= 3 || streakLongest >= 3
                        ? "VERIFIED ✓"
                        : `${streakCurrent}/3 Days`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-neutral-50 border-2 border-black px-3.5 py-2.5 text-xs shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`size-2.5 rounded-full ${
                          completedCases.length >= 5
                            ? "bg-black ring-2 ring-black/20"
                            : "bg-neutral-300"
                        }`}
                      />
                      <span className="font-black text-black">Distributed Architect Tier</span>
                    </div>
                    <span
                      className={`font-mono text-[10px] font-black ${
                        completedCases.length >= 5 ? "text-black" : "text-neutral-500"
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
              <div className="mt-5 pt-3.5 border-t-2 border-black flex items-center justify-between">
                <span className="font-mono text-[10px] text-black font-black uppercase tracking-wider">
                  System Arena Dossier
                </span>
                <Link
                  to="/cases"
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-black text-black hover:underline"
                >
                  <span>Explore Cases</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CAMPUS & UNIVERSITY AFFILIATION (INTER-CAMPUS LEADERBOARD COHORT)
           ========================================================================= */}
        {isAuthenticated && (
          <div className="rounded-3xl border-2 border-black bg-white p-6 sm:p-8 shadow-xs text-black">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b-2 border-black/10 pb-6">
              <div className="flex items-start gap-3.5">
                <div className="grid size-12 place-items-center rounded-2xl bg-black text-white shrink-0">
                  <GraduationCap className="size-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black bg-neutral-100 border border-black/20 px-2 py-0.5 rounded">
                      University Cup & Campus Cohort
                    </span>
                    <span className="font-mono text-xs font-bold text-neutral-600">
                      {userUniversity && userUniversity !== "Independent / Self-Taught"
                        ? `Affiliated: ${userUniversity}`
                        : "No university affiliated"}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-black mt-1">
                    Campus & College Affiliation
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-neutral-700 font-medium max-w-2xl leading-relaxed">
                    Represent your university on the global Leaderboard. All{" "}
                    <strong>{completedCases.length}</strong> of your cleared investigations
                    contribute to your campus cohort's cumulative rank in the Inter-Campus Cup.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCampusModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-5 py-2.5 font-mono text-xs font-black border-2 border-black shadow-xs hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  <Edit3 className="size-3.5" />
                  <span>
                    {userUniversity && userUniversity !== "Independent / Self-Taught"
                      ? "Change University"
                      : "Affiliate Your University / College"}
                  </span>
                </button>

                <Link
                  to="/leaderboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-neutral-100 text-black px-4 py-2.5 font-mono text-xs font-black border-2 border-black/20 hover:border-black transition-all"
                >
                  <Trophy className="size-3.5" />
                  <span>Campus Leaderboard</span>
                </Link>
              </div>
            </div>

            {/* Status Details Bar */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border-2 border-black/10 bg-neutral-50 p-4">
                <p className="font-mono text-[10px] uppercase font-bold text-neutral-500">
                  Affiliated Institution
                </p>
                <p className="font-black text-sm text-black mt-1 truncate">
                  {userUniversity || "Independent / Self-Taught"}
                </p>
                <p className="font-mono text-[10px] text-neutral-600 mt-1">
                  Shown on your public dossier and shareable QR card.
                </p>
              </div>

              <div className="rounded-2xl border-2 border-black/10 bg-neutral-50 p-4">
                <p className="font-mono text-[10px] uppercase font-bold text-neutral-500">
                  Cohort Points Contributed
                </p>
                <p className="font-mono text-base font-black text-black mt-1">{points} RC Points</p>
                <p className="font-mono text-[10px] text-neutral-600 mt-1">
                  Pooled into {userUniversity || "independent"} standings.
                </p>
              </div>

              <div className="rounded-2xl border-2 border-black/10 bg-neutral-50 p-4">
                <p className="font-mono text-[10px] uppercase font-bold text-neutral-500">
                  Campus Placement Focus
                </p>
                <p className="font-black text-sm text-black mt-1">Track 0 & Track 7 Free Tier</p>
                <p className="font-mono text-[10px] text-neutral-600 mt-1">
                  12 Machine Coding & LLD interview cases ready.
                </p>
              </div>
            </div>
          </div>
        )}

        <CampusAffiliationModal
          isOpen={isCampusModalOpen}
          onClose={() => setIsCampusModalOpen(false)}
          currentUniversity={userUniversity}
        />
      </div>
    </AppChrome>
  );
}
