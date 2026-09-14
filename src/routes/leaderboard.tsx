import { createFileRoute, Link } from "@tanstack/react-router";
import { AppChrome } from "@/components/AppChrome";
import { useAccount, useWallet } from "@/lib/account";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useMemo } from "react";
import {
  Trophy,
  Medal,
  Award,
  CheckCircle2,
  Search,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Crown,
} from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Investigator Leaderboard — KRUZZ" },
      {
        name: "description",
        content:
          "Global curriculum meritocracy standings. Track top system investigators by verified cases completed.",
      },
    ],
  }),
  component: LeaderboardRoute,
});

function LeaderboardRoute() {
  return (
    <AppChrome>
      <LeaderboardPage />
    </AppChrome>
  );
}

function LeaderboardPage() {
  const { user } = useAccount();
  const { rank } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");

  const topLearners = useQuery(api.leaderboard.getTopLearners);
  const rawCaseStudies = useQuery(api.caseStudies.list, {});
  const totalCases = (rawCaseStudies as any[])?.length || 40;

  // Filter learners by search
  const filteredLearners = useMemo(() => {
    if (!topLearners) return [];
    if (!searchQuery.trim()) return topLearners;
    const q = searchQuery.toLowerCase().trim();
    return topLearners.filter((u) => u.name.toLowerCase().includes(q));
  }, [topLearners, searchQuery]);

  // Current user's index in global leaderboard
  const userRankIndex = useMemo(() => {
    if (!topLearners || !user) return -1;
    return topLearners.findIndex(
      (u) => (u.clerkId && u.clerkId === user.id) || u.name === user.fullName,
    );
  }, [topLearners, user]);

  const userLeaderboardEntry = userRankIndex >= 0 ? topLearners?.[userRankIndex] : null;

  // Top 3 Podium
  const top1 = topLearners?.[0];
  const top2 = topLearners?.[1];
  const top3 = topLearners?.[2];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-8">
      {/* 1. Header Telemetry & Title */}
      <div className="border-b border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-primary">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="tracking-widest uppercase font-semibold">
              GLOBAL TELEMETRY · MERITOCRACY STANDINGS
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#f5f5f5]">
            Investigator Leaderboard
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#8a8a8a] max-w-2xl">
            Ranked strictly by verified distributed system engineering cases completed.
            Investigation badges and curriculum completion determine global standings.
          </p>
        </div>

        {/* User Standing Pill */}
        {user && (
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-3.5 backdrop-blur-md">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 border border-primary/30 text-primary font-mono font-black text-sm">
              {userRankIndex >= 0 ? `#${userRankIndex + 1}` : "—"}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#f5f5f5]">Your Standing</span>
                <span className="text-[10px] font-mono text-primary font-bold">{rank.name}</span>
              </div>
              <p className="font-mono text-[11px] text-[#8a8a8a]">
                {userLeaderboardEntry
                  ? `${userLeaderboardEntry.completedCasesCount} of ${totalCases} cases cleared`
                  : "Solve cases to enter rankings"}
              </p>
            </div>
            <Link
              to="/cases"
              className="ml-2 hidden sm:inline-flex items-center gap-1 text-xs font-mono text-primary hover:underline"
            >
              <span>Arena</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        )}
      </div>

      {/* 2. Top 3 Podium (Shown when at least 1 learner is available) */}
      {topLearners && topLearners.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="size-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#f5f5f5]">
              Curriculum Vanguard · Top 3
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-end">
            {/* 2nd Place (Silver) */}
            <div className="order-2 md:order-1">
              {top2 ? (
                <PodiumCard
                  position={2}
                  badgeLabel="2ND PLACE"
                  user={top2}
                  totalCases={totalCases}
                  accentClass="from-slate-400/15 via-slate-400/5 to-transparent border-slate-300/30 text-slate-200"
                  ringClass="ring-slate-300/60"
                  icon={<Medal className="size-5 text-slate-300" />}
                />
              ) : (
                <EmptyPodiumSlot position={2} label="Unclaimed Silver" />
              )}
            </div>

            {/* 1st Place (Gold) - Elevated */}
            <div className="order-1 md:order-2 md:-translate-y-2">
              {top1 ? (
                <PodiumCard
                  position={1}
                  badgeLabel="CHAMPION · 1ST"
                  user={top1}
                  totalCases={totalCases}
                  isFirst={true}
                  accentClass="from-yellow-500/20 via-yellow-500/5 to-transparent border-yellow-500/40 text-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.15)]"
                  ringClass="ring-yellow-400/80"
                  icon={<Trophy className="size-6 text-yellow-400" />}
                />
              ) : (
                <EmptyPodiumSlot position={1} label="Unclaimed Champion" />
              )}
            </div>

            {/* 3rd Place (Bronze) */}
            <div className="order-3 md:order-3">
              {top3 ? (
                <PodiumCard
                  position={3}
                  badgeLabel="3RD PLACE"
                  user={top3}
                  totalCases={totalCases}
                  accentClass="from-amber-700/15 via-amber-700/5 to-transparent border-amber-600/30 text-amber-300"
                  ringClass="ring-amber-500/60"
                  icon={<Award className="size-5 text-amber-500" />}
                />
              ) : (
                <EmptyPodiumSlot position={3} label="Unclaimed Bronze" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Global Standings Table / List */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6 border border-white/[0.08] shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Trophy className="size-4.5 text-primary" />
            <h3 className="font-bold text-sm sm:text-base text-[#f5f5f5]">
              Global Meritocracy Standings
            </h3>
            <span className="font-mono text-xs text-[#8a8a8a] bg-white/[0.04] px-2 py-0.5 rounded-full">
              {filteredLearners.length}{" "}
              {filteredLearners.length === 1 ? "Investigator" : "Investigators"}
            </span>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#8a8a8a]" />
            <input
              type="text"
              placeholder="Search investigator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] pl-8.5 pr-3 py-1.5 text-xs text-[#f5f5f5] placeholder-[#8a8a8a] outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        {/* Desktop View Table (hidden on mobile and tablet screens) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[#8a8a8a] font-mono uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 w-16">Rank</th>
                <th className="py-3 px-4">Investigator</th>
                <th className="py-3 px-4 w-44">System Tier</th>
                <th className="py-3 px-4 w-52 text-right">Curriculum Mastery</th>
                <th className="py-3 px-4 w-28 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredLearners.map((u, idx) => {
                const isCurrentUser =
                  (u.clerkId && u.clerkId === user?.id) || u.name === user?.fullName;
                const masteryPercent = Math.min(
                  100,
                  Math.round(((u.completedCasesCount ?? 0) / totalCases) * 100),
                );

                return (
                  <tr
                    key={u._id}
                    className={`transition-colors hover:bg-white/[0.02] ${
                      isCurrentUser
                        ? "bg-[var(--theme-surface,#182608)]/40 border-l-2 border-primary"
                        : ""
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span
                        className={`inline-grid size-7 place-items-center rounded-lg text-xs font-mono font-black ${
                          idx === 0
                            ? "bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                            : idx === 1
                              ? "bg-slate-300 text-black"
                              : idx === 2
                                ? "bg-amber-600 text-white"
                                : "bg-white/[0.05] text-[#8a8a8a]"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>

                    {/* Investigator */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-8.5 rounded-full bg-white/[0.06] overflow-hidden border border-white/[0.1] shrink-0">
                          {u.imageUrl ? (
                            <img src={u.imageUrl} alt={u.name} className="size-full object-cover" />
                          ) : (
                            <div className="flex size-full items-center justify-center font-mono text-xs font-bold text-primary">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#f5f5f5]">{u.name}</span>
                            {isCurrentUser && (
                              <span className="rounded bg-primary/20 border border-primary/40 px-1 py-0.2 font-mono text-[9px] font-black uppercase text-primary">
                                YOU
                              </span>
                            )}
                          </div>
                          {u.publicProfileId ? (
                            <span className="font-mono text-[10px] text-[#8a8a8a]">
                              @{u.publicProfileId}
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] text-[#8a8a8a]">
                              Investigator
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* System Tier */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 font-mono text-[11px] text-[#f5f5f5]">
                        <ShieldCheck className="size-3 text-primary" />
                        <span>{u.rank || "Systems Thinker"}</span>
                      </span>
                    </td>

                    {/* Curriculum Mastery */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-xs font-bold text-primary flex items-center gap-1">
                          <CheckCircle2 className="size-3.5" />
                          <span>{u.completedCasesCount ?? 0}</span>
                          <span className="text-[#8a8a8a] font-normal text-[11px]">
                            / {totalCases} solved
                          </span>
                        </span>
                        <div className="h-1.5 w-28 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${masteryPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      {u.publicProfileId ? (
                        <Link
                          to="/profile/$profileId"
                          params={{ profileId: u.publicProfileId }}
                          className="inline-flex items-center gap-1 rounded-lg bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 font-mono text-[10px] font-semibold text-[#b8b8b8] hover:text-[#f5f5f5] hover:border-primary/40 transition-colors"
                        >
                          <span>Dossier</span>
                          <ExternalLink className="size-3" />
                        </Link>
                      ) : (
                        <span className="font-mono text-[10px] text-[#8a8a8a]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet View: Card Rows (Fluid & Responsive for Small Screens) */}
        <div className="lg:hidden space-y-2.5">
          {filteredLearners.map((u, idx) => {
            const isCurrentUser =
              (u.clerkId && u.clerkId === user?.id) || u.name === user?.fullName;

            return (
              <div
                key={u._id}
                className={`flex items-center justify-between rounded-2xl p-3 border transition-colors ${
                  isCurrentUser
                    ? "bg-[var(--theme-surface,#182608)]/60 border-primary/50 shadow-[0_0_15px_rgba(204,255,0,0.15)]"
                    : "bg-white/[0.02] border-white/[0.06] hover:border-white/10"
                }`}
              >
                {/* Left: Rank & Avatar & Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`grid size-6 place-items-center rounded-lg text-[11px] font-mono font-black shrink-0 ${
                      idx === 0
                        ? "bg-yellow-500 text-black"
                        : idx === 1
                          ? "bg-slate-300 text-black"
                          : idx === 2
                            ? "bg-amber-600 text-white"
                            : "bg-white/[0.06] text-[#8a8a8a]"
                    }`}
                  >
                    {idx + 1}
                  </span>

                  <div className="relative size-8 rounded-full bg-white/[0.06] overflow-hidden border border-white/[0.1] shrink-0">
                    {u.imageUrl ? (
                      <img src={u.imageUrl} alt={u.name} className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center font-mono text-[10px] font-bold text-primary">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-bold text-[#f5f5f5]">{u.name}</p>
                      {isCurrentUser && (
                        <span className="rounded bg-primary/20 border border-primary/40 px-1 font-mono text-[8px] font-black uppercase text-primary shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-[#8a8a8a] truncate">
                      {u.rank || "Systems Thinker"}
                    </p>
                  </div>
                </div>

                {/* Right: Solved Count & Optional Dossier link */}
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <div className="rounded-xl bg-primary/10 border border-primary/30 px-2.5 py-1 text-right">
                    <div className="flex items-center gap-1 font-mono text-xs font-bold text-primary">
                      <CheckCircle2 className="size-3" />
                      <span>{u.completedCasesCount ?? 0}</span>
                    </div>
                    <p className="font-mono text-[9px] text-[#8a8a8a]">solved</p>
                  </div>

                  {u.publicProfileId && (
                    <Link
                      to="/profile/$profileId"
                      params={{ profileId: u.publicProfileId }}
                      className="grid size-7 place-items-center rounded-lg bg-white/[0.05] border border-white/[0.08] text-[#8a8a8a] hover:text-[#f5f5f5]"
                      title="View Dossier"
                    >
                      <ExternalLink className="size-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {(!filteredLearners || filteredLearners.length === 0) && (
          <div className="py-12 text-center">
            <Sparkles className="size-8 text-primary mx-auto mb-2 opacity-60" />
            <p className="text-sm font-bold text-[#f5f5f5]">
              {searchQuery
                ? "No investigators found matching query"
                : "No ranked investigators yet"}
            </p>
            <p className="mt-1 text-xs text-[#8a8a8a] max-w-sm mx-auto">
              Complete engineering investigations in the Arena Centre to establish your placement on
              the global leaderboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface PodiumCardProps {
  position: number;
  badgeLabel: string;
  user: {
    _id: string;
    name: string;
    completedCasesCount: number;
    rank?: string | undefined;
    imageUrl?: string | undefined;
    publicProfileId?: string | undefined;
  };
  totalCases: number;
  isFirst?: boolean;
  accentClass: string;
  ringClass: string;
  icon: React.ReactNode;
}

function PodiumCard({
  badgeLabel,
  user,
  totalCases,
  isFirst = false,
  accentClass,
  ringClass,
  icon,
}: PodiumCardProps) {
  return (
    <div
      className={`relative rounded-3xl bg-gradient-to-b ${accentClass} border p-5 sm:p-6 backdrop-blur-xl transition-transform hover:-translate-y-1`}
    >
      {/* Top Badge & Icon */}
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 border border-white/[0.1] px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider">
          {icon}
          <span>{badgeLabel}</span>
        </span>

        {user.publicProfileId && (
          <Link
            to="/profile/$profileId"
            params={{ profileId: user.publicProfileId }}
            className="flex items-center gap-1 font-mono text-[10px] text-[#8a8a8a] hover:text-[#f5f5f5] transition-colors"
          >
            <span>Dossier</span>
            <ExternalLink className="size-3" />
          </Link>
        )}
      </div>

      {/* Avatar & Name */}
      <div className="flex items-center gap-3.5 mb-4">
        <div
          className={`relative ${
            isFirst ? "size-16" : "size-13"
          } rounded-full bg-[#121212] overflow-hidden ring-2 ${ringClass} shrink-0`}
        >
          {user.imageUrl ? (
            <img src={user.imageUrl} alt={user.name} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center font-mono text-base font-black text-primary">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h4
            className={`font-black tracking-tight text-[#f5f5f5] truncate ${
              isFirst ? "text-base sm:text-lg" : "text-sm sm:text-base"
            }`}
          >
            {user.name}
          </h4>
          <p className="font-mono text-xs text-[#8a8a8a] truncate">
            {user.rank || "Systems Thinker"}
          </p>
        </div>
      </div>

      {/* Stats Block */}
      <div className="rounded-2xl bg-black/50 border border-white/[0.06] p-3 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] text-[#8a8a8a] uppercase tracking-wider">
            Verified Solved
          </p>
          <div className="flex items-center gap-1.5 font-mono text-base font-black text-[#f5f5f5]">
            <CheckCircle2 className="size-4 text-primary" />
            <span>{user.completedCasesCount}</span>
            <span className="text-xs font-normal text-[#8a8a8a]">/ {totalCases}</span>
          </div>
        </div>

        <div className="text-right">
          <p className="font-mono text-[10px] text-[#8a8a8a] uppercase tracking-wider">Mastery</p>
          <p className="font-mono text-sm font-bold text-primary">
            {Math.min(100, Math.round(((user.completedCasesCount ?? 0) / totalCases) * 100))}%
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyPodiumSlot({ position, label }: { position: number; label: string }) {
  return (
    <div className="rounded-3xl bg-white/[0.02] border border-white/[0.06] border-dashed p-6 text-center">
      <div className="grid size-10 place-items-center rounded-full bg-white/[0.04] mx-auto mb-2 font-mono text-xs text-[#8a8a8a]">
        #{position}
      </div>
      <p className="font-mono text-xs text-[#8a8a8a]">{label}</p>
    </div>
  );
}
