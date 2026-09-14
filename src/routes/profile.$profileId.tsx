import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppChrome } from "@/components/AppChrome";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAccount } from "@/lib/account";
import { ShareProfileModal } from "@/components/ShareProfileModal";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Flame,
  Link as LinkIcon,
  Lock,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { RANKS } from "@/lib/rc";

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
  const { user: currentUser, profile: userProfile, isAuthenticated } = useAccount();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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
        <div className="mx-auto max-w-4xl px-4 py-32 text-center">
          <div className="inline-block size-7 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
          <p className="font-mono text-xs uppercase tracking-widest text-primary">
            Accessing Verified Investigator Dossier...
          </p>
        </div>
      </AppChrome>
    );
  }

  if (publicData === null) {
    return (
      <AppChrome>
        <div className="mx-auto max-w-2xl px-4 py-28 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <User className="size-7 text-[#8a8a8a]" />
          </div>
          <h2 className="text-2xl font-bold text-[#f5f5f5]">Investigator Profile Not Found</h2>
          <p className="mt-2 text-sm text-[#8a8a8a]">
            The dossier for “{profileId}” does not exist or has been made private.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/cases"
              className="neu-btn rounded-xl px-5 py-2.5 font-mono text-xs font-semibold text-[#f5f5f5]"
            >
              Browse Case Studies
            </Link>
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className="rounded-xl bg-primary px-5 py-2.5 font-mono text-xs font-bold text-primary-foreground shadow-[0_0_12px_var(--glow-color,rgba(204,255,0,0.3))]"
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
  } = publicData;

  const isOwner = Boolean(userProfile && userProfile.publicProfileId === publicProfileId);
  const formattedJoinedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <AppChrome>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-6">
        {/* Top Kicker */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-primary">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="tracking-widest uppercase font-semibold">
              PUBLIC DOSSIER · VERIFIED SYSTEM INVESTIGATOR
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="neu-btn flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-mono text-xs text-[#f5f5f5] hover:border-white/20 transition-all cursor-pointer"
            >
              <LinkIcon className="size-3.5 text-primary" />
              <span>{isCopied ? "Copied!" : "Copy Link"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 font-mono text-xs font-bold text-primary-foreground hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[0_0_12px_var(--glow-color,rgba(204,255,0,0.3))]"
            >
              <Share2 className="size-3.5" />
              <span>Share Badge</span>
            </button>

            {isOwner && (
              <Link
                to="/profile"
                className="neu-btn flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-mono text-xs font-semibold text-[#8a8a8a] hover:text-[#f5f5f5] transition-all"
              >
                <span>Edit Profile</span>
              </Link>
            )}
          </div>
        </div>

        {/* HERO CARD: Profile Identity Deck */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0e0c]/90 shadow-[0_20px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          {/* Banner */}
          <div className="relative h-44 sm:h-56 w-full overflow-hidden bg-[#080808] border-b border-white/[0.06] group/banner">
            <img
              src={bannerUrl || "/Observer.jpg"}
              alt="Profile Banner"
              className="absolute inset-0 size-full object-cover object-center opacity-90 transition-transform duration-700 group-hover/banner:scale-105"
            />
            {/* Subtle Darkening & Glow Overlay to keep badges and avatar seamless */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-[#0c0e0c]/95 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--glow-color,rgba(204,255,0,0.18))_0%,transparent_70%)] pointer-events-none" />

            <div className="absolute top-4 right-4 z-10 rounded-full border border-white/10 bg-black/60 px-3 py-1 font-mono text-[10px] text-[#8a8a8a] backdrop-blur-md">
              UID: #{publicProfileId.slice(0, 12)}
            </div>
          </div>

          {/* Identity Body */}
          <div className="relative px-6 pb-6 pt-0">
            {/* Avatar Row */}
            <div className="flex flex-wrap items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
              <div className="relative">
                <div className="size-24 sm:size-28 rounded-2xl border-2 border-primary bg-black p-1 shadow-[0_0_20px_var(--glow-color,rgba(204,255,0,0.4))] overflow-hidden">
                  {imageUrl ? (
                    <img src={imageUrl} alt={name} className="size-full rounded-xl object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center rounded-xl bg-gradient-to-br from-[var(--theme-surface,#182608)] to-[#080808] font-mono text-2xl font-bold text-primary">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                  <CheckCircle2 className="size-4 stroke-[2.5]" />
                </div>
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-xl border border-primary/40 bg-[var(--theme-surface,#182608)] px-3.5 py-1.5 font-mono text-xs font-bold text-primary shadow-[0_0_10px_var(--glow-color,rgba(204,255,0,0.2))] flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" />
                  {rank}
                </span>
                <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-[#8a8a8a]">
                  Member since {formattedJoinedDate}
                </span>
              </div>
            </div>

            {/* Name & Handle */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#f5f5f5]">
                {name}
              </h1>
              <p className="font-mono text-xs text-[#8a8a8a] mt-0.5">@{publicProfileId}</p>
            </div>

            {/* Stats Triple Bar */}
            <div className="mt-6 grid grid-cols-3 divide-x divide-white/[0.08] rounded-2xl border border-white/[0.08] bg-black/40 py-3 text-center">
              <div>
                <p className="font-mono text-lg sm:text-xl font-black text-primary">{points}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#8a8a8a] mt-0.5">
                  RC Balance
                </p>
              </div>
              <div>
                <p className="font-mono text-lg sm:text-xl font-black text-[#f5f5f5]">
                  {stats.solvedCasesCount} / {stats.totalCasesCount}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#8a8a8a] mt-0.5">
                  Cases Solved
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 font-mono text-lg sm:text-xl font-black text-[#f5f5f5]">
                  <Flame className="size-4 text-primary fill-primary/30" />
                  <span>{streak.current}d</span>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#8a8a8a] mt-0.5">
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
                <BookOpen className="size-4.5 text-primary" />
                <h2 className="text-lg font-bold text-[#f5f5f5]">Completed Case Studies</h2>
              </div>
              <span className="font-mono text-xs text-[#8a8a8a]">
                {completedCases.length} Investigations Solved
              </span>
            </div>

            {completedCases.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {completedCases.map((c, i) => (
                  <div
                    key={c.caseSlug}
                    className="group rounded-2xl border border-white/[0.08] bg-[#0a0c0a]/90 p-4 transition-all hover:border-primary/40 hover:bg-[var(--theme-surface,#182608)]/40 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-lg bg-[var(--theme-surface,#182608)] font-mono text-xs font-bold text-primary">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#8a8a8a]">
                          {c.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 font-mono text-[10px] text-[#8a8a8a]">
                          {c.difficulty}
                        </span>
                        {c.bestScore !== undefined && (
                          <span className="rounded-md border border-primary/30 bg-[var(--theme-surface,#182608)] px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                            Score: {c.bestScore}/100
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="mt-2 text-sm sm:text-base font-bold text-[#f5f5f5] group-hover:text-primary transition-colors">
                      {c.title}
                    </h3>

                    <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
                      <span className="font-mono text-[10px] text-[#8a8a8a]">
                        Solved on {new Date(c.completedAt).toLocaleDateString()}
                      </span>

                      <Link
                        to="/cases/$slug"
                        params={{ slug: c.caseSlug }}
                        className="flex items-center gap-1 font-mono text-xs font-semibold text-primary hover:underline"
                      >
                        <span>Inspect Case</span>
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-white/[0.08] bg-[#0c0e0c]/80 p-8 text-center">
                <BookOpen className="mx-auto size-8 text-[#555] mb-2" />
                <p className="text-sm font-semibold text-[#f5f5f5]">
                  No Case Studies Completed Yet
                </p>
                <p className="mt-1 text-xs text-[#8a8a8a]">
                  This investigator is currently reviewing architectural dossiers.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT 1 COLUMN (33%): Rank Ladder & Visitor Conversion CTA */}
          <div className="flex flex-col gap-6">
            {/* Rank Ladder Card */}
            <div className="glass-panel rounded-3xl p-5 border border-white/[0.08]">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-[#f5f5f5]">System Thinking Standing</h3>
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
                          ? "border border-primary/40 bg-[var(--theme-surface,#182608)] shadow-[0_0_10px_var(--glow-color,rgba(204,255,0,0.15))]"
                          : isPast
                            ? "border border-white/[0.06] bg-white/[0.02]"
                            : "opacity-40 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full ${
                            isCurrent
                              ? "bg-primary animate-pulse"
                              : isPast
                                ? "bg-[#8a8a8a]"
                                : "bg-[#333]"
                          }`}
                        />
                        <span
                          className={`font-mono text-xs ${isCurrent ? "font-bold text-primary" : "text-[#b8b8b8]"}`}
                        >
                          {r.name}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#8a8a8a]">{r.at} RC</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Non-User Conversion Card: Join KRUZZ */}
            {!isAuthenticated ? (
              <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-b from-[var(--theme-surface,#141d0a)] to-[#0a0f05] p-6 shadow-[0_16px_36px_var(--glow-color,rgba(204,255,0,0.1))]">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-4 text-primary" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                    Become an Investigator
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#f5f5f5]">
                  Master Real-World System Architecture
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#b8b8b8]">
                  Learn how real distributed systems, caches, DNS, and payment gateways work. Write
                  code in Python, Java, and C.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    to="/sign-up"
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 font-mono text-xs font-bold text-primary-foreground hover:scale-102 active:scale-98 transition-all shadow-[0_0_15px_var(--glow-color,rgba(204,255,0,0.35))]"
                  >
                    <span>Create Free Account</span>
                    <ChevronRight className="size-3.5" />
                  </Link>
                  <Link
                    to="/cases"
                    className="neu-btn flex items-center justify-center py-2 font-mono text-xs text-[#8a8a8a] hover:text-[#f5f5f5] transition-colors"
                  >
                    Browse 35 Case Studies
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/[0.08] bg-[#0c0e0c] p-5 text-center">
                <ShieldCheck className="mx-auto size-7 text-primary mb-2" />
                <h4 className="text-sm font-bold text-[#f5f5f5]">Active Investigator</h4>
                <p className="mt-1 text-xs text-[#8a8a8a]">
                  You are viewing {name}’s public dossier.
                </p>
                <Link
                  to="/cases"
                  className="mt-4 inline-flex items-center gap-1 font-mono text-xs font-bold text-primary hover:underline"
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
        }}
      />
    </AppChrome>
  );
}
