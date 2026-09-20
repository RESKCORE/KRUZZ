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
  ChevronLeft,
  ChevronRight,
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

const BATCH_SIZE = 30;

function LeaderboardPage() {
  const { user } = useAccount();
  const { rank } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentBatch, setCurrentBatch] = useState(1);

  const topLearners = useQuery(api.leaderboard.getTopLearners, {});
  const rawCaseStudies = useQuery(api.caseStudies.list, {});
  const totalCases = (rawCaseStudies as any[])?.length || 40;

  // Filter learners by search
  const filteredLearners = useMemo(() => {
    if (!topLearners) return [];
    if (!searchQuery.trim()) return topLearners;
    const q = searchQuery.toLowerCase().trim();
    return topLearners.filter((u) => u.name.toLowerCase().includes(q));
  }, [topLearners, searchQuery]);

  // Batching / pagination: strictly 30 per batch
  const totalBatches = Math.max(1, Math.ceil(filteredLearners.length / BATCH_SIZE));
  const currentBatchSafe = Math.min(currentBatch, totalBatches);
  const startIndex = (currentBatchSafe - 1) * BATCH_SIZE;
  const endIndex = Math.min(startIndex + BATCH_SIZE, filteredLearners.length);
  const paginatedLearners = useMemo(() => {
    return filteredLearners.slice(startIndex, startIndex + BATCH_SIZE);
  }, [filteredLearners, startIndex]);

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
      <div className="border-b-2 border-black pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-black">
            <span className="size-2.5 rounded-full bg-black ring-2 ring-black/20" />
            <span className="tracking-widest uppercase font-black">
              GLOBAL TELEMETRY · MERITOCRACY STANDINGS
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-black">
            Investigator Leaderboard
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-black font-medium max-w-2xl">
            Ranked strictly by verified distributed system engineering cases completed.
            Investigation badges and curriculum completion determine global standings.
          </p>
        </div>

        {/* User Standing Pill */}
        {user && (
          <div className="flex items-center gap-3 rounded-2xl bg-white border-2 border-black p-3.5 shadow-xs">
            <div className="grid size-10 place-items-center rounded-xl bg-black border-2 border-black text-white font-mono font-black text-sm">
              {userRankIndex >= 0 ? `#${userRankIndex + 1}` : "—"}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-black">Your Standing</span>
                <span className="text-[10px] font-mono text-black font-black underline">
                  {rank.name}
                </span>
              </div>
              <p className="font-mono text-[11px] text-black font-bold">
                {userLeaderboardEntry
                  ? `${userLeaderboardEntry.completedCasesCount} of ${totalCases} cases cleared`
                  : "Solve cases to enter rankings"}
              </p>
            </div>
            <Link
              to="/cases"
              className="ml-2 hidden sm:inline-flex items-center gap-1 text-xs font-mono text-black font-black hover:underline"
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
            <Crown className="size-4 text-black" />
            <h2 className="text-sm font-black uppercase tracking-wider text-black">
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
                  icon={<Medal className="size-4 text-white" />}
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
                  icon={<Trophy className="size-5 text-white" />}
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
                  icon={<Award className="size-4 text-white" />}
                />
              ) : (
                <EmptyPodiumSlot position={3} label="Unclaimed Bronze" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Global Standings Table / List */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6 border-2 border-black bg-white text-black shadow-xs">
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <Trophy className="size-4.5 text-black" />
            <h3 className="font-black text-sm sm:text-base text-black">
              Global Meritocracy Standings
            </h3>
            <span className="font-mono text-xs text-black font-black bg-neutral-100 border border-black px-2 py-0.5 rounded-full">
              {filteredLearners.length}{" "}
              {filteredLearners.length === 1 ? "Investigator" : "Investigators"}
            </span>
            <span className="font-mono text-[10px] text-white bg-black border-2 border-black px-2 py-0.5 rounded-full font-black">
              30 per batch
            </span>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-black font-bold" />
            <input
              type="text"
              placeholder="Search investigator..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentBatch(1);
              }}
              className="w-full rounded-xl bg-white border-2 border-black pl-8.5 pr-3 py-1.5 text-xs text-black placeholder:text-neutral-500 font-medium outline-none focus:ring-2 focus:ring-black transition-colors"
            />
          </div>
        </div>

        {/* Desktop View Table (hidden on mobile and tablet screens) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-black text-black font-mono uppercase tracking-wider text-[10px] font-black">
                <th className="py-3 px-4 w-16">Rank</th>
                <th className="py-3 px-4">Investigator</th>
                <th className="py-3 px-4 w-44">System Tier</th>
                <th className="py-3 px-4 w-52 text-right">Curriculum Mastery</th>
                <th className="py-3 px-4 w-28 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {paginatedLearners.map((u, idx) => {
                const rankNumber = startIndex + idx + 1;
                const isCurrentUser =
                  (u.clerkId && u.clerkId === user?.id) || u.name === user?.fullName;
                const masteryPercent = Math.min(
                  100,
                  Math.round(((u.completedCasesCount ?? 0) / totalCases) * 100),
                );

                return (
                  <tr
                    key={u._id}
                    className={`transition-colors hover:bg-neutral-50 ${
                      isCurrentUser ? "bg-neutral-100 font-bold border-l-4 border-black" : ""
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span
                        className={`inline-grid size-7 place-items-center rounded-lg text-xs font-mono font-black border border-black ${
                          rankNumber === 1
                            ? "bg-black text-white"
                            : rankNumber === 2
                              ? "bg-neutral-800 text-white"
                              : rankNumber === 3
                                ? "bg-neutral-700 text-white"
                                : "bg-neutral-100 text-black"
                        }`}
                      >
                        {rankNumber}
                      </span>
                    </td>

                    {/* Investigator */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-8.5 rounded-full bg-white overflow-hidden border-2 border-black shrink-0">
                          {u.imageUrl ? (
                            <img src={u.imageUrl} alt={u.name} className="size-full object-cover" />
                          ) : (
                            <div className="flex size-full items-center justify-center font-mono text-xs font-black text-black">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-black">{u.name}</span>
                            {isCurrentUser && (
                              <span className="rounded bg-black text-white px-1.5 py-0.2 font-mono text-[9px] font-black uppercase border border-black">
                                YOU
                              </span>
                            )}
                          </div>
                          {u.publicProfileId ? (
                            <span className="font-mono text-[10px] text-neutral-600 font-bold">
                              @{u.publicProfileId}
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] text-neutral-600 font-bold">
                              Investigator
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* System Tier */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 border-2 border-black px-2.5 py-1 font-mono text-[11px] text-black font-black">
                        <ShieldCheck className="size-3 text-black stroke-[2.5]" />
                        <span>{u.rank || "Systems Thinker"}</span>
                      </span>
                    </td>

                    {/* Curriculum Mastery */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-xs font-black text-black flex items-center gap-1">
                          <CheckCircle2 className="size-3.5 stroke-[2.5]" />
                          <span>{u.completedCasesCount ?? 0}</span>
                          <span className="text-black font-normal text-[11px]">
                            / {totalCases} solved
                          </span>
                        </span>
                        <div className="h-1.5 w-28 bg-neutral-200 border border-black rounded-full overflow-hidden">
                          <div
                            className="h-full bg-black rounded-full"
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
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white border-2 border-black px-3 py-1 font-mono text-[11px] font-black text-black hover:bg-black hover:text-white transition-colors shadow-xs cursor-pointer"
                        >
                          <span>Dossier</span>
                          <ExternalLink className="size-3" />
                        </Link>
                      ) : (
                        <span className="font-mono text-[10px] text-black font-bold">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet View: Card Rows */}
        <div className="lg:hidden space-y-2.5">
          {paginatedLearners.map((u, idx) => {
            const rankNumber = startIndex + idx + 1;
            const isCurrentUser =
              (u.clerkId && u.clerkId === user?.id) || u.name === user?.fullName;

            return (
              <div
                key={u._id}
                className={`flex items-center justify-between rounded-2xl p-3 border-2 border-black bg-white transition-all shadow-xs ${
                  isCurrentUser ? "bg-neutral-100" : "hover:bg-neutral-50"
                }`}
              >
                {/* Left: Rank & Avatar & Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`grid size-6 place-items-center rounded-lg text-[11px] font-mono font-black shrink-0 border border-black ${
                      rankNumber === 1
                        ? "bg-black text-white"
                        : rankNumber === 2
                          ? "bg-neutral-800 text-white"
                          : rankNumber === 3
                            ? "bg-neutral-700 text-white"
                            : "bg-neutral-100 text-black"
                    }`}
                  >
                    {rankNumber}
                  </span>

                  <div className="relative size-8 rounded-full bg-white overflow-hidden border-2 border-black shrink-0">
                    {u.imageUrl ? (
                      <img src={u.imageUrl} alt={u.name} className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center font-mono text-[10px] font-black text-black">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-black text-black">{u.name}</p>
                      {isCurrentUser && (
                        <span className="rounded bg-black text-white border border-black px-1 font-mono text-[8px] font-black uppercase shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-neutral-600 font-bold truncate">
                      {u.rank || "Systems Thinker"}
                    </p>
                  </div>
                </div>

                {/* Right: Solved Count & Optional Dossier link */}
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <div className="rounded-xl bg-neutral-100 border-2 border-black px-2.5 py-1 text-right">
                    <div className="flex items-center gap-1 font-mono text-xs font-black text-black">
                      <CheckCircle2 className="size-3 stroke-[2.5]" />
                      <span>{u.completedCasesCount ?? 0}</span>
                    </div>
                    <p className="font-mono text-[9px] text-black font-bold">solved</p>
                  </div>

                  {u.publicProfileId && (
                    <Link
                      to="/profile/$profileId"
                      params={{ profileId: u.publicProfileId }}
                      className="grid size-7 place-items-center rounded-lg bg-white border-2 border-black text-black hover:bg-black hover:text-white transition-colors shadow-xs"
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

        {/* Batch Pagination Controls */}
        {filteredLearners.length > 0 && (
          <div className="mt-6 pt-4 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Batch Info */}
            <div className="flex items-center gap-2 font-mono text-xs text-black">
              <span>
                Showing{" "}
                <strong className="text-black font-black">
                  {filteredLearners.length > 0 ? startIndex + 1 : 0}–{endIndex}
                </strong>{" "}
                of <strong className="text-black font-black">{filteredLearners.length}</strong>{" "}
                Investigators
              </span>
              <span className="rounded-md bg-white border-2 border-black px-2 py-0.5 text-[10px] text-black font-black">
                30 per batch
              </span>
              {totalBatches > 1 && (
                <span className="hidden sm:inline text-black font-bold">
                  · Batch {currentBatchSafe} of {totalBatches}
                </span>
              )}
            </div>

            {/* Navigation Buttons */}
            {totalBatches > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentBatch((prev) => Math.max(1, prev - 1))}
                  disabled={currentBatchSafe === 1}
                  className="flex items-center gap-1 rounded-xl bg-white border-2 border-black hover:bg-neutral-100 px-3 py-1.5 font-mono text-xs font-black text-black transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-xs"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>Prev Batch</span>
                </button>

                {/* Page pills */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalBatches }, (_, i) => i + 1).map((batchNum) => (
                    <button
                      key={batchNum}
                      type="button"
                      onClick={() => setCurrentBatch(batchNum)}
                      className={`size-8 rounded-xl font-mono text-xs font-black border-2 border-black transition-all cursor-pointer ${
                        batchNum === currentBatchSafe
                          ? "bg-black text-white shadow-xs"
                          : "bg-white text-black hover:bg-neutral-100"
                      }`}
                    >
                      {batchNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentBatch((prev) => Math.min(totalBatches, prev + 1))}
                  disabled={currentBatchSafe === totalBatches}
                  className="flex items-center gap-1 rounded-xl bg-white border-2 border-black hover:bg-neutral-100 px-3 py-1.5 font-mono text-xs font-black text-black transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-xs"
                >
                  <span>Next Batch</span>
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {(!filteredLearners || filteredLearners.length === 0) && (
          <div className="py-12 text-center">
            <Sparkles className="size-8 text-black mx-auto mb-2 opacity-60" />
            <p className="text-sm font-black text-black">
              {searchQuery
                ? "No investigators found matching query"
                : "No ranked investigators yet"}
            </p>
            <p className="mt-1 text-xs text-black font-medium max-w-sm mx-auto">
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
  icon: React.ReactNode;
}

function PodiumCard({ badgeLabel, user, totalCases, isFirst = false, icon }: PodiumCardProps) {
  return (
    <div className="relative rounded-3xl bg-white border-2 border-black p-5 sm:p-6 shadow-xs transition-transform hover:-translate-y-1 text-black">
      {/* Top Badge & Icon */}
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black text-white border-2 border-black px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider">
          {icon}
          <span>{badgeLabel}</span>
        </span>

        {user.publicProfileId && (
          <Link
            to="/profile/$profileId"
            params={{ profileId: user.publicProfileId }}
            className="flex items-center gap-1 font-mono text-[11px] font-black text-black hover:underline"
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
          } rounded-full bg-white border-2 border-black overflow-hidden ring-2 ring-black shrink-0`}
        >
          {user.imageUrl ? (
            <img src={user.imageUrl} alt={user.name} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center font-mono text-base font-black text-black">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h4
            className={`font-black tracking-tight text-black truncate ${
              isFirst ? "text-base sm:text-lg" : "text-sm sm:text-base"
            }`}
          >
            {user.name}
          </h4>
          <p className="font-mono text-xs text-neutral-600 font-bold truncate">
            {user.rank || "Systems Thinker"}
          </p>
        </div>
      </div>

      {/* Stats Block */}
      <div className="rounded-2xl bg-neutral-50 border-2 border-black p-3 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] text-black font-black uppercase tracking-wider">
            Verified Solved
          </p>
          <div className="flex items-center gap-1.5 font-mono text-base font-black text-black">
            <CheckCircle2 className="size-4 text-black stroke-[2.5]" />
            <span>{user.completedCasesCount}</span>
            <span className="text-xs font-bold text-black">/ {totalCases}</span>
          </div>
        </div>

        <div className="text-right">
          <p className="font-mono text-[10px] text-black font-black uppercase tracking-wider">
            Mastery
          </p>
          <p className="font-mono text-sm font-black text-black">
            {Math.min(100, Math.round(((user.completedCasesCount ?? 0) / totalCases) * 100))}%
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyPodiumSlot({ position, label }: { position: number; label: string }) {
  return (
    <div className="rounded-3xl bg-white border-2 border-dashed border-black p-6 text-center text-black">
      <div className="grid size-10 place-items-center rounded-full bg-neutral-100 border border-black mx-auto mb-2 font-mono text-xs font-black text-black">
        #{position}
      </div>
      <p className="font-mono text-xs font-bold text-black">{label}</p>
    </div>
  );
}
