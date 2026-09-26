import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppChrome } from "@/components/AppChrome";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAccount } from "@/lib/account";
import { ShareProfileModal } from "@/components/ShareProfileModal";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Flame,
  GraduationCap,
  Link as LinkIcon,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { RANKS } from "@/lib/rc";
import { CampusAffiliationModal } from "@/components/CampusAffiliationModal";

export const Route = createFileRoute("/profile/$profileId")({
  loader: ({ params }) => ({ profileId: params.profileId }),
  head: () => ({
    meta: [
      { title: "Public Investigator Dossier — KRUZZ" },
      {
        name: "description",
        content:
          "Verified software engineering portfolio, streak, and completed system architecture case studies on KRUZZ.",
      },
    ],
  }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { profileId: rawProfileId } = Route.useParams();
  const profileId = decodeURIComponent(rawProfileId);
  const { profile: userProfile, isAuthenticated } = useAccount();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch the public profile from Convex using the opaque publicProfileId
  const publicData = useQuery(api.users.getPublicProfile, { publicProfileId: profileId });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    toast.success("Profile link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (publicData === undefined) {
    return (
      <AppChrome>
        <div className="mx-auto max-w-4xl px-4 py-32 text-center text-black">
          <div className="inline-block size-8 animate-spin rounded-full border-2 border-black border-t-transparent mb-4 shadow-xs" />
          <p className="font-mono text-xs uppercase tracking-widest text-black font-black">
            Accessing Verified Investigator Dossier...
          </p>
        </div>
      </AppChrome>
    );
  }

  if (publicData === null) {
    return (
      <AppChrome>
        <div className="mx-auto max-w-2xl px-4 py-28 text-center text-black">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border-2 border-black bg-white shadow-xs">
            <User className="size-7 text-black" />
          </div>
          <h2 className="text-2xl font-black text-black">Investigator Profile Not Found</h2>
          <p className="mt-2 text-sm text-neutral-600">
            The dossier for “{profileId}” does not exist or has been made private.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/cases"
              className="border-2 border-black bg-white text-black hover:bg-neutral-100 rounded-xl px-5 py-2.5 font-mono text-xs font-black shadow-xs"
            >
              Browse Case Studies
            </Link>
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className="rounded-xl bg-black px-5 py-2.5 font-mono text-xs font-black text-white hover:bg-neutral-800 shadow-xs"
            >
              {isAuthenticated ? "Return to Dashboard" : "Return Home"}
            </Link>
          </div>
        </div>
      </AppChrome>
    );
  }

  const {
    name,
    imageUrl,
    bannerUrl,
    points,
    rank,
    streak,
    stats,
    completedCases,
    createdAt,
    publicProfileId,
    university,
  } = publicData;

  const isOwner = Boolean(userProfile && userProfile.publicProfileId === publicProfileId);
  const formattedJoinedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <AppChrome>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-6 text-black">
        {/* Top Kicker */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black/10 pb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-black">
            <span className="size-2 rounded-full bg-black" />
            <span className="tracking-widest uppercase font-black">
              PUBLIC DOSSIER · VERIFIED SYSTEM INVESTIGATOR
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-xl border-2 border-black bg-white px-3.5 py-1.5 font-mono text-xs font-black text-black hover:bg-neutral-100 transition-all cursor-pointer shadow-xs"
            >
              <LinkIcon className="size-3.5 text-black" />
              <span>{isCopied ? "Copied!" : "Copy Link"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border-2 border-black bg-black px-3.5 py-1.5 font-mono text-xs font-black text-white hover:bg-neutral-800 transition-all cursor-pointer shadow-xs"
            >
              <Share2 className="size-3.5" />
              <span>Share Badge</span>
            </button>

            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => setIsCampusModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-black bg-white px-3.5 py-1.5 font-mono text-xs font-black text-black hover:bg-neutral-100 transition-all shadow-xs cursor-pointer"
                  title="Update your university or college"
                >
                  <GraduationCap className="size-3.5" />
                  <span>{university ? "Change Campus" : "Set Campus"}</span>
                </button>
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 rounded-xl border-2 border-black bg-white px-3.5 py-1.5 font-mono text-xs font-black text-black hover:bg-neutral-100 transition-all shadow-xs"
                >
                  <span>Edit Profile</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* HERO CARD: Profile Identity Deck */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-black bg-white shadow-xs">
          {/* Banner */}
          <div className="relative h-44 sm:h-56 w-full overflow-hidden bg-neutral-100 border-b-2 border-black group/banner">
            <img
              src={bannerUrl || "/Observer.jpg"}
              alt="Profile Banner"
              className="absolute inset-0 size-full object-cover object-center transition-transform duration-700 group-hover/banner:scale-105"
            />
            <div className="absolute top-4 right-4 z-10 rounded-full border-2 border-black bg-white px-3 py-1 font-mono text-[10px] text-black font-black shadow-xs">
              UID: #{publicProfileId.slice(0, 12)}
            </div>
          </div>

          {/* Identity Body */}
          <div className="relative px-6 pb-6 pt-0">
            {/* Avatar Row */}
            <div className="flex flex-wrap items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
              <div className="relative">
                <div className="size-24 sm:size-28 rounded-2xl border-2 border-black bg-white p-1 shadow-xs overflow-hidden">
                  {imageUrl ? (
                    <img src={imageUrl} alt={name} className="size-full rounded-xl object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center rounded-xl bg-neutral-100 font-mono text-2xl font-black text-black">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-black text-white shadow-md">
                  <CheckCircle2 className="size-4 stroke-[2.5]" />
                </div>
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-xl border-2 border-black bg-neutral-100 px-3.5 py-1.5 font-mono text-xs font-black text-black shadow-xs flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" />
                  {rank}
                </span>
                <span className="rounded-xl border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-bold text-black shadow-xs">
                  Member since {formattedJoinedDate}
                </span>
                {Boolean(university && university !== "Independent / Self-Taught") && (
                  <span className="rounded-xl border-2 border-black bg-neutral-100 px-3 py-1.5 font-mono text-xs font-black text-black shadow-xs flex items-center gap-1.5">
                    <GraduationCap className="size-3.5 text-black" />
                    <span>{university}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Name & Handle */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black">{name}</h1>
              <p className="font-mono text-xs text-neutral-600 font-bold mt-0.5">
                @{publicProfileId}
              </p>
            </div>

            {/* Stats Triple Bar */}
            <div className="mt-6 grid grid-cols-3 divide-x-2 divide-black/10 rounded-2xl border-2 border-black bg-neutral-50 py-3 text-center shadow-xs">
              <div>
                <p className="font-mono text-lg sm:text-xl font-black text-black">{points}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-600 font-bold mt-0.5">
                  RC Balance
                </p>
              </div>
              <div>
                <p className="font-mono text-lg sm:text-xl font-black text-black">
                  {stats.solvedCasesCount} / {stats.totalCasesCount}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-600 font-bold mt-0.5">
                  Cases Solved
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 font-mono text-lg sm:text-xl font-black text-black">
                  <Flame className="size-4 text-black fill-black" />
                  <span>{streak.current}d</span>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-600 font-bold mt-0.5">
                  Day Streak
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2-COLUMN MAIN SECTION: Solved Cases (Left) & Consistency & Motivation (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT 2 COLUMNS (66%): Solved Case Studies Portfolio */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4.5 text-black" />
                <h2 className="text-lg font-black text-black">Completed Case Studies</h2>
              </div>
              <span className="font-mono text-xs text-neutral-600 font-bold">
                {completedCases.length} Investigations Solved
              </span>
            </div>

            {completedCases.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {completedCases.map((c, i) => (
                  <div
                    key={c.caseSlug}
                    className="group rounded-2xl border-2 border-black bg-white p-4 transition-all hover:bg-neutral-50 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-lg bg-black font-mono text-xs font-black text-white">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-600 font-bold">
                          {c.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-black bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-bold text-black">
                          {c.difficulty}
                        </span>
                        {c.bestScore !== undefined && (
                          <span className="rounded-md border border-black bg-black px-2 py-0.5 font-mono text-[10px] font-black text-white">
                            Score: {c.bestScore}/100
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="mt-2 text-sm sm:text-base font-black text-black">{c.title}</h3>

                    <div className="mt-3 flex items-center justify-between border-t-2 border-black/10 pt-2.5">
                      <span className="font-mono text-[10px] text-neutral-600 font-bold">
                        Solved on {new Date(c.completedAt).toLocaleDateString()}
                      </span>

                      <Link
                        to="/cases/$slug"
                        params={{ slug: c.caseSlug }}
                        className="flex items-center gap-1 font-mono text-xs font-black text-black hover:underline"
                      >
                        <span>Inspect Case</span>
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-black bg-white p-8 text-center shadow-xs">
                <BookOpen className="mx-auto size-8 text-neutral-400 mb-2" />
                <p className="text-sm font-black text-black">No Case Studies Completed Yet</p>
                <p className="mt-1 text-xs text-neutral-600">
                  This investigator is currently reviewing architectural dossiers.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT 1 COLUMN (33%): Rank Ladder & Visitor Conversion CTA */}
          <div className="flex flex-col gap-6">
            {/* Rank Ladder Card */}
            <div className="rounded-3xl p-5 border-2 border-black bg-white shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="size-4 text-black" />
                <h3 className="text-sm font-black text-black">System Thinking Standing</h3>
              </div>

              <div className="space-y-2">
                {RANKS.map((r) => {
                  const isCurrent = r.name === rank;
                  const isPast = points >= r.at;
                  return (
                    <div
                      key={r.name}
                      className={`flex items-center justify-between rounded-xl p-2.5 transition-all ${
                        isCurrent
                          ? "border-2 border-black bg-black text-white font-black shadow-xs"
                          : isPast
                            ? "border border-black/40 bg-neutral-50 text-black font-bold"
                            : "border border-black/15 bg-white text-neutral-700 font-semibold"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full ${
                            isCurrent
                              ? "bg-white ring-2 ring-white/30"
                              : isPast
                                ? "bg-black"
                                : "bg-neutral-300"
                          }`}
                        />
                        <span
                          className={`font-mono text-xs ${isCurrent ? "font-black text-white" : "text-black"}`}
                        >
                          {r.name}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-[10px] ${isCurrent ? "text-neutral-300 font-black" : "text-neutral-600 font-bold"}`}
                      >
                        {r.at} RC
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Non-User Conversion Card: Join KRUZZ */}
            {!isAuthenticated ? (
              <div className="relative overflow-hidden rounded-3xl border-2 border-black bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-4 text-black" />
                  <span className="font-mono text-[10px] font-black uppercase tracking-widest text-black">
                    Become an Investigator
                  </span>
                </div>
                <h3 className="text-base font-black text-black">
                  Master Real-World System Architecture
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                  Learn how real distributed systems, caches, DNS, and payment gateways work. Write
                  code in Python, Java, and C.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    to="/sign-up"
                    className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-black bg-black py-2.5 font-mono text-xs font-black text-white hover:bg-neutral-800 transition-all shadow-xs"
                  >
                    <span>Create Free Account</span>
                    <ChevronRight className="size-3.5" />
                  </Link>
                  <Link
                    to="/cases"
                    className="flex items-center justify-center py-2 font-mono text-xs font-black text-black border-2 border-black bg-white hover:bg-neutral-100 rounded-xl transition-colors shadow-xs"
                  >
                    Browse 59 Case Studies
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-black bg-white p-5 text-center shadow-xs">
                <ShieldCheck className="mx-auto size-7 text-black mb-2" />
                <h4 className="text-sm font-black text-black">Active Investigator</h4>
                <p className="mt-1 text-xs text-neutral-600">
                  You are viewing {name}’s public dossier.
                </p>
                <Link
                  to="/cases"
                  className="mt-4 inline-flex items-center gap-1 font-mono text-xs font-black text-black hover:underline"
                >
                  <span>Explore Cases in Arena</span>
                  <ChevronRight className="size-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareProfileModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        user={{
          profileId: publicProfileId,
          name,
          handle: name || "Investigator",
          rank,
          points,
          streak: streak.current,
          solvedCases: stats.solvedCasesCount,
          totalCases: stats.totalCasesCount,
          avatarUrl: imageUrl,
          bannerUrl: bannerUrl || "/Observer.jpg",
          isPublic: true,
          university: university || "",
        }}
      />

      {isOwner && (
        <CampusAffiliationModal
          isOpen={isCampusModalOpen}
          onClose={() => setIsCampusModalOpen(false)}
          currentUniversity={university || ""}
        />
      )}
    </AppChrome>
  );
}
