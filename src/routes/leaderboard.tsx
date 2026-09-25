import { createFileRoute, Link } from "@tanstack/react-router";
import { AppChrome } from "@/components/AppChrome";
import { useAccount, useWallet } from "@/lib/account";
import { useQuery, useMutation } from "convex/react";
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
  GraduationCap,
  Building2,
  School,
  Edit3,
  Check,
  Users,
  Flame,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Investigator Leaderboard & University Cup — KRUZZ" },
      {
        name: "description",
        content:
          "Global curriculum meritocracy standings and campus rankings. Track top system investigators and university cohorts.",
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

const CURATED_UNIVERSITIES = [
  "All Campuses",
  "UC Berkeley",
  "Stanford University",
  "MIT",
  "Carnegie Mellon (CMU)",
  "University of Waterloo",
  "IIT Bombay",
  "IIT Delhi",
  "Georgia Tech",
  "UT Austin",
  "University of Toronto",
  "University of Washington",
  "NUS Singapore",
  "Tsinghua University",
  "Cambridge University",
  "Independent / Self-Taught",
] as const;

function LeaderboardPage() {
  const { user, profile, isAuthenticated } = useAccount();
  const { rank } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentBatch, setCurrentBatch] = useState(1);
  const [activeTab, setActiveTab] = useState<"students" | "campuses">("students");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("All Campuses");

  // Campus modal / inline editor state
  const [isEditingCampus, setIsEditingCampus] = useState(false);
  const [customCampusInput, setCustomCampusInput] = useState("");
  const [isSavingCampus, setIsSavingCampus] = useState(false);

  const updateUniversity = useMutation(api.users.updateUniversity);

  const topLearners = useQuery(api.leaderboard.getTopLearners, {});
  const rawCaseStudies = useQuery(api.caseStudies.list, {});
  const totalCases = (rawCaseStudies as any[])?.length || 59;

  const userUniversity = (profile as any)?.university || "";

  // Dynamic set of universities detected from all learners
  const availableUniversities = useMemo(() => {
    const set = new Set<string>();
    CURATED_UNIVERSITIES.forEach((u) => set.add(u));
    if (topLearners) {
      topLearners.forEach((l: any) => {
        if (l.university && l.university.trim()) {
          set.add(l.university.trim());
        }
      });
    }
    return Array.from(set);
  }, [topLearners]);

  // Aggregated University Cup standings
  const campusRankings = useMemo(() => {
    if (!topLearners) return [];
    const map = new Map<
      string,
      {
        university: string;
        totalCases: number;
        totalPoints: number;
        studentCount: number;
        topStudent: any;
      }
    >();

    for (const u of topLearners as any[]) {
      const uni = (u.university || "").trim() || "Independent / Self-Taught";
      const existing = map.get(uni) || {
        university: uni,
        totalCases: 0,
        totalPoints: 0,
        studentCount: 0,
        topStudent: u,
      };

      existing.totalCases += u.completedCasesCount ?? 0;
      existing.totalPoints += u.points ?? 0;
      existing.studentCount += 1;
      if ((u.completedCasesCount ?? 0) > (existing.topStudent?.completedCasesCount ?? 0)) {
        existing.topStudent = u;
      }
      map.set(uni, existing);
    }

    const list = Array.from(map.values());
    list.sort((a, b) => {
      if (b.totalCases !== a.totalCases) return b.totalCases - a.totalCases;
      return b.totalPoints - a.totalPoints;
    });
    return list;
  }, [topLearners]);

  // Filter individual learners by search query and university filter
  const filteredLearners = useMemo(() => {
    if (!topLearners) return [];
    return (topLearners as any[]).filter((u) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (u.name || "").toLowerCase().includes(q);
        const matchesUni = (u.university || "").toLowerCase().includes(q);
        if (!matchesName && !matchesUni) return false;
      }
      if (selectedUniversity !== "All Campuses") {
        const uni = (u.university || "").trim() || "Independent / Self-Taught";
        if (selectedUniversity === "My Campus") {
          if (!userUniversity || uni.toLowerCase() !== userUniversity.toLowerCase()) {
            return false;
          }
        } else if (uni.toLowerCase() !== selectedUniversity.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [topLearners, searchQuery, selectedUniversity, userUniversity]);

  // Batching / pagination: strictly 30 per batch
  const totalBatches = Math.max(1, Math.ceil(filteredLearners.length / BATCH_SIZE));
  const currentBatchSafe = Math.min(currentBatch, totalBatches);
  const startIndex = (currentBatchSafe - 1) * BATCH_SIZE;
  const paginatedLearners = useMemo(() => {
    return filteredLearners.slice(startIndex, startIndex + BATCH_SIZE);
  }, [filteredLearners, startIndex]);

  // Current user's index in global leaderboard
  const userRankIndex = useMemo(() => {
    if (!topLearners || !user) return -1;
    return (topLearners as any[]).findIndex(
      (u) => (u.clerkId && u.clerkId === user.id) || u.name === user.fullName,
    );
  }, [topLearners, user]);

  const userLeaderboardEntry = userRankIndex >= 0 ? (topLearners as any[])?.[userRankIndex] : null;

  // Top 3 Podium for individual students
  const top1 = filteredLearners[0];
  const top2 = filteredLearners[1];
  const top3 = filteredLearners[2];

  // Top 3 Campuses for University Cup
  const topCampus1 = campusRankings[0];
  const topCampus2 = campusRankings[1];
  const topCampus3 = campusRankings[2];

  async function handleSaveUniversity(uni: string) {
    if (!uni.trim()) return;
    setIsSavingCampus(true);
    try {
      await updateUniversity({ university: uni.trim() });
      toast.success(`Campus affiliation saved as "${uni.trim()}"!`);
      setIsEditingCampus(false);
      setCustomCampusInput("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save university");
    } finally {
      setIsSavingCampus(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-8">
      {/* 1. Header Telemetry & Title */}
      <div className="border-b-2 border-black pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-black">
            <span className="size-2.5 rounded-full bg-black ring-2 ring-black/20" />
            <span className="tracking-widest uppercase font-black">
              GLOBAL TELEMETRY · MERITOCRACY & CAMPUS STANDINGS
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-black">
            Investigator Leaderboard & University Cup
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-black font-medium max-w-2xl">
            Ranked strictly by verified distributed systems engineering cases completed. Represent
            your university or college cohort in the inter-campus rankings.
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
              {userUniversity && (
                <p className="font-mono text-[10px] text-neutral-600 font-bold flex items-center gap-1 mt-0.5">
                  <GraduationCap className="size-3 text-black" />
                  <span>{userUniversity}</span>
                </p>
              )}
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

      {/* 2. Campus Affiliation Prompt / Banner for Authenticated Students */}
      {isAuthenticated && (
        <div className="rounded-3xl border-2 border-black bg-neutral-50 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-black text-white shrink-0">
              <GraduationCap className="size-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-black text-white px-2 py-0.5 font-mono text-[10px] font-black uppercase">
                  Campus Representative
                </span>
                <span className="font-mono text-xs text-neutral-600 font-bold">
                  {userUniversity ? `Affiliated: ${userUniversity}` : "No campus selected yet"}
                </span>
              </div>
              <p className="mt-1 text-xs text-black font-medium">
                {userUniversity
                  ? `Every case study you clear contributes to ${userUniversity}'s standing in the University Cup.`
                  : "Select your college or university to add your solved cases to your campus tally and compete on the college leaderboard!"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditingCampus(!isEditingCampus)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-black text-white px-4 py-2 font-mono text-xs font-black border-2 border-black shadow-xs hover:bg-neutral-800 transition-all cursor-pointer"
            >
              <Edit3 className="size-3.5" />
              <span>{userUniversity ? "Change Campus" : "Set Your University"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Campus Selector Drawer / Modal */}
      {isEditingCampus && (
        <div className="rounded-3xl border-2 border-black bg-white p-5 shadow-xs animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between border-b-2 border-black/10 pb-3 mb-4">
            <h3 className="font-black text-sm text-black flex items-center gap-1.5">
              <School className="size-4" />
              <span>Select or Enter Your University / College</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsEditingCampus(false)}
              className="font-mono text-xs text-neutral-500 hover:text-black font-bold"
            >
              ✕ Close
            </button>
          </div>

          {/* Quick Click Campus Pills */}
          <div className="space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-600 font-black">
              Popular Campuses:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CURATED_UNIVERSITIES.filter((u) => u !== "All Campuses").map((uni) => (
                <button
                  key={uni}
                  type="button"
                  onClick={() => handleSaveUniversity(uni)}
                  disabled={isSavingCampus}
                  className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold border-2 transition-all cursor-pointer ${
                    userUniversity === uni
                      ? "bg-black text-white border-black"
                      : "bg-neutral-100 hover:bg-white text-black border-black/20 hover:border-black"
                  }`}
                >
                  {uni}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="pt-3 border-t border-black/10 flex flex-col sm:flex-row gap-2 items-center">
              <input
                type="text"
                placeholder="Or type custom university name (e.g. University of Michigan)..."
                value={customCampusInput}
                onChange={(e) => setCustomCampusInput(e.target.value)}
                className="w-full sm:flex-1 rounded-xl bg-neutral-50 border-2 border-black px-3.5 py-2 text-xs font-medium text-black outline-none focus:bg-white"
              />
              <button
                type="button"
                onClick={() => handleSaveUniversity(customCampusInput)}
                disabled={!customCampusInput.trim() || isSavingCampus}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-black text-white px-5 py-2 font-mono text-xs font-black disabled:opacity-40 cursor-pointer"
              >
                <Check className="size-3.5 stroke-[3]" />
                <span>Save Affiliation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Views Tab Switcher & Campus Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-4">
        {/* Tab Buttons */}
        <div className="inline-flex rounded-2xl bg-neutral-100 p-1 border-2 border-black shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("students")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-black transition-all cursor-pointer ${
              activeTab === "students"
                ? "bg-black text-white shadow-xs"
                : "text-black hover:bg-neutral-200"
            }`}
          >
            <Trophy className="size-3.5" />
            <span>Top Student Investigators ({filteredLearners.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("campuses")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-black transition-all cursor-pointer ${
              activeTab === "campuses"
                ? "bg-black text-white shadow-xs"
                : "text-black hover:bg-neutral-200"
            }`}
          >
            <GraduationCap className="size-3.5 stroke-[2.5]" />
            <span>University Cup Rankings ({campusRankings.length})</span>
          </button>
        </div>

        {/* University Filter Dropdown / Selector (Available for Students view) */}
        {activeTab === "students" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-black text-black flex items-center gap-1">
              <GraduationCap className="size-3.5" />
              Filter Campus:
            </span>
            <select
              value={selectedUniversity}
              onChange={(e) => {
                setSelectedUniversity(e.target.value);
                setCurrentBatch(1);
              }}
              className="rounded-xl bg-white border-2 border-black px-3 py-1.5 font-mono text-xs font-black text-black outline-none focus:ring-2 focus:ring-black cursor-pointer shadow-xs"
            >
              <option value="All Campuses">All Campuses</option>
              {userUniversity && <option value="My Campus">My Campus ({userUniversity})</option>}
              {availableUniversities
                .filter((u) => u !== "All Campuses")
                .map((uni) => (
                  <option key={uni} value={uni}>
                    {uni}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW A: TOP INDIVIDUAL STUDENTS                                            */}
      {/* ========================================================================= */}
      {activeTab === "students" && (
        <>
          {/* Top 3 Podium */}
          {filteredLearners && filteredLearners.length > 0 && (
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

          {/* Standings Table */}
          <div className="glass-panel rounded-3xl p-4 sm:p-6 border-2 border-black bg-white text-black shadow-xs">
            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <Trophy className="size-4.5 text-black" />
                <h3 className="font-black text-sm sm:text-base text-black">
                  Student Meritocracy Standings
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
                  placeholder="Search by student or campus..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentBatch(1);
                  }}
                  className="w-full rounded-xl bg-white border-2 border-black pl-8.5 pr-3 py-1.5 text-xs text-black placeholder:text-neutral-500 font-medium outline-none focus:ring-2 focus:ring-black transition-colors"
                />
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-black text-black font-mono uppercase tracking-wider text-[10px] font-black">
                    <th className="py-3 px-4 w-16">Rank</th>
                    <th className="py-3 px-4">Investigator</th>
                    <th className="py-3 px-4 w-52">Campus / Affiliation</th>
                    <th className="py-3 px-4 w-40">System Tier</th>
                    <th className="py-3 px-4 w-48 text-right">Curriculum Mastery</th>
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

                        {/* Investigator Name & Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative size-8.5 rounded-full bg-white overflow-hidden border-2 border-black shrink-0">
                              {u.imageUrl ? (
                                <img
                                  src={u.imageUrl}
                                  alt={u.name}
                                  className="size-full object-cover"
                                />
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

                        {/* University / Campus Tag */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 border border-black/25 px-2 py-1 font-mono text-[11px] font-bold text-black">
                            <GraduationCap className="size-3 text-neutral-600" />
                            <span>{u.university || "Independent"}</span>
                          </span>
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

                        {/* Dossier Link */}
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

            {/* Mobile Cards View */}
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
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="grid size-6 place-items-center rounded-lg text-[11px] font-mono font-black shrink-0 border border-black bg-neutral-100 text-black">
                        {rankNumber}
                      </span>
                      <div className="min-w-0">
                        <p className="font-black text-xs text-black truncate">{u.name}</p>
                        <p className="font-mono text-[10px] text-neutral-600 flex items-center gap-1">
                          <GraduationCap className="size-2.5" />
                          <span className="truncate">{u.university || "Independent"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-black text-black">
                        {u.completedCasesCount ?? 0} solved
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalBatches > 1 && (
              <div className="mt-6 flex items-center justify-between pt-4 border-t-2 border-black/10">
                <button
                  type="button"
                  onClick={() => setCurrentBatch((b) => Math.max(1, b - 1))}
                  disabled={currentBatchSafe <= 1}
                  className="rounded-xl border-2 border-black bg-white px-3 py-1 font-mono text-xs font-black disabled:opacity-30"
                >
                  Previous
                </button>
                <span className="font-mono text-xs font-black text-black">
                  Batch {currentBatchSafe} of {totalBatches}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentBatch((b) => Math.min(totalBatches, b + 1))}
                  disabled={currentBatchSafe >= totalBatches}
                  className="rounded-xl border-2 border-black bg-white px-3 py-1 font-mono text-xs font-black disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: UNIVERSITY CUP (CAMPUS STANDINGS)                                 */}
      {/* ========================================================================= */}
      {activeTab === "campuses" && (
        <div className="space-y-6">
          {/* Top 3 Campus Podiums */}
          {campusRankings.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-end">
              {/* 2nd Campus */}
              <div className="order-2 md:order-1">
                {topCampus2 ? (
                  <CampusPodiumCard
                    position={2}
                    badgeLabel="SILVER CAMPUS"
                    campus={topCampus2}
                    icon={<Medal className="size-4 text-white" />}
                  />
                ) : (
                  <EmptyPodiumSlot position={2} label="Unclaimed Silver Campus" />
                )}
              </div>

              {/* 1st Campus (Champion) */}
              <div className="order-1 md:order-2 md:-translate-y-2">
                {topCampus1 ? (
                  <CampusPodiumCard
                    position={1}
                    badgeLabel="CAMPUS CHAMPION · 1ST"
                    campus={topCampus1}
                    isFirst={true}
                    icon={<Trophy className="size-5 text-white" />}
                  />
                ) : (
                  <EmptyPodiumSlot position={1} label="Unclaimed Campus Champion" />
                )}
              </div>

              {/* 3rd Campus */}
              <div className="order-3 md:order-3">
                {topCampus3 ? (
                  <CampusPodiumCard
                    position={3}
                    badgeLabel="BRONZE CAMPUS"
                    campus={topCampus3}
                    icon={<Award className="size-4 text-white" />}
                  />
                ) : (
                  <EmptyPodiumSlot position={3} label="Unclaimed Bronze Campus" />
                )}
              </div>
            </div>
          )}

          {/* Campus Leaderboard Table */}
          <div className="glass-panel rounded-3xl p-5 sm:p-6 border-2 border-black bg-white text-black shadow-xs">
            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-5 stroke-[2.5]" />
                <h3 className="font-black text-base text-black">University Cup Leaderboard</h3>
                <span className="font-mono text-xs bg-neutral-100 border border-black px-2 py-0.5 rounded-full font-black">
                  {campusRankings.length} Campuses Active
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-black text-black font-mono uppercase tracking-wider text-[10px] font-black">
                    <th className="py-3 px-4 w-16">Rank</th>
                    <th className="py-3 px-4">University / College</th>
                    <th className="py-3 px-4 w-40 text-center">Active Engineers</th>
                    <th className="py-3 px-4 w-44 text-right">Total Cases Solved</th>
                    <th className="py-3 px-4 w-44 text-right">Top Representative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {campusRankings.map((c, idx) => {
                    const isMyCampus =
                      userUniversity && userUniversity.toLowerCase() === c.university.toLowerCase();

                    return (
                      <tr
                        key={c.university}
                        className={`transition-colors hover:bg-neutral-50 ${
                          isMyCampus ? "bg-neutral-100 font-bold border-l-4 border-black" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <span
                            className={`inline-grid size-7 place-items-center rounded-lg text-xs font-mono font-black border border-black ${
                              idx === 0
                                ? "bg-black text-white"
                                : idx === 1
                                  ? "bg-neutral-800 text-white"
                                  : idx === 2
                                    ? "bg-neutral-700 text-white"
                                    : "bg-neutral-100 text-black"
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-black">{c.university}</span>
                            {isMyCampus && (
                              <span className="rounded bg-black text-white px-1.5 py-0.2 font-mono text-[9px] font-black uppercase">
                                YOUR CAMPUS
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-neutral-700">
                            <Users className="size-3" />
                            {c.studentCount}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span className="font-mono text-sm font-black text-black">
                            {c.totalCases} cleared
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {c.topStudent ? (
                            <span className="font-mono text-xs text-neutral-800 font-bold">
                              {c.topStudent.name} ({c.topStudent.completedCasesCount})
                            </span>
                          ) : (
                            <span className="text-neutral-400 font-mono">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
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
    university?: string | undefined;
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
          <div className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-neutral-700 font-bold truncate">
            <GraduationCap className="size-3 text-black shrink-0" />
            <span className="truncate">{user.university || "Independent"}</span>
          </div>
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

function CampusPodiumCard({
  position,
  badgeLabel,
  campus,
  isFirst = false,
  icon,
}: {
  position?: number;
  badgeLabel: string;
  campus: {
    university: string;
    totalCases: number;
    totalPoints: number;
    studentCount: number;
    topStudent: any;
  };
  isFirst?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative rounded-3xl bg-white border-2 border-black p-5 sm:p-6 shadow-xs transition-transform hover:-translate-y-1 text-black">
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black text-white border-2 border-black px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider">
          {icon}
          <span>{badgeLabel}</span>
        </span>
        <span className="font-mono text-[11px] font-black text-black flex items-center gap-1">
          <Users className="size-3" />
          {campus.studentCount} Students
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap className="size-6 text-black stroke-[2.5]" />
          <h4
            className={`font-black tracking-tight text-black truncate ${
              isFirst ? "text-lg sm:text-xl" : "text-base sm:text-lg"
            }`}
          >
            {campus.university}
          </h4>
        </div>
        {campus.topStudent && (
          <p className="font-mono text-[11px] text-neutral-600 font-bold truncate">
            Top Leader: <span className="text-black font-black">{campus.topStudent.name}</span>
          </p>
        )}
      </div>

      <div className="rounded-2xl bg-neutral-50 border-2 border-black p-3 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] text-black font-black uppercase tracking-wider">
            Campus Total Cleared
          </p>
          <div className="flex items-center gap-1.5 font-mono text-base font-black text-black">
            <CheckCircle2 className="size-4 text-black stroke-[2.5]" />
            <span>{campus.totalCases} cases</span>
          </div>
        </div>

        <div className="text-right">
          <p className="font-mono text-[10px] text-black font-black uppercase tracking-wider">
            Campus RC
          </p>
          <p className="font-mono text-sm font-black text-black">{campus.totalPoints} RC</p>
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
