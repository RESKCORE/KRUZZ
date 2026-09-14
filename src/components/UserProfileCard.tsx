import { useMemo, useRef, useState } from "react";
import { useAccount, useWallet, useStreak } from "@/lib/account";
import { caseAwardId, isCaseCompleted } from "@/lib/rc";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Link, useRouter } from "@tanstack/react-router";
import {
  BookOpen,
  Camera,
  Flame,
  ImagePlus,
  Lock,
  Share2,
  ShieldCheck,
  Star,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { ShareProfileModal } from "@/components/ShareProfileModal";
import { SlideToContinue } from "@/components/SlideToContinue";

interface UserProfileCardProps {
  className?: string;
  variant?: "full" | "compact";
}

export function UserProfileCard({ className = "" }: UserProfileCardProps) {
  const router = useRouter();
  const { user, profile, isAuthenticated } = useAccount();
  const { points, rank, awards } = useWallet();
  const { current: streakCurrent } = useStreak();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const picInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.users.generateProfileUploadUrl);
  const setProfileMedia = useMutation(api.users.setProfileMedia);

  const cloudProgress = useQuery(
    api.caseProgress.getAllUserProgress,
    isAuthenticated ? {} : "skip",
  );

  const rawCaseStudies = useQuery(api.caseStudies.list, {});
  const caseStudies = useMemo(() => (rawCaseStudies ?? []) as any[], [rawCaseStudies]);

  const clearedCasesCount = caseStudies.filter((c) => {
    const progressDoc = (
      cloudProgress as
        Array<{ caseSlug: string; passed?: boolean; completedSections?: number[] }> | undefined
    )?.find((p) => p.caseSlug === c.slug);
    return (
      isCaseCompleted(awards, c.slug) ||
      Boolean(progressDoc?.passed && (progressDoc?.completedSections?.length ?? 0) >= 7)
    );
  }).length;

  // Dynamically compute the active/recent case study to continue
  const { recentCaseSlug, recentCaseTitle } = useMemo(() => {
    const defaultSlug = caseStudies?.[0]?.slug ?? "atm-machine";
    const defaultTitle = caseStudies?.[0]?.shortTitle ?? caseStudies?.[0]?.title ?? "ATM Machine";

    if (!caseStudies || caseStudies.length === 0) {
      return { recentCaseSlug: defaultSlug, recentCaseTitle: defaultTitle };
    }

    if (cloudProgress && Array.isArray(cloudProgress) && cloudProgress.length > 0) {
      // Sort progress by updatedAt descending (most recent first)
      const sorted = [...cloudProgress].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

      // 1. Look for an in-progress case that is not yet completed
      const inProgress = sorted.find((p) => {
        const isComplete =
          p.status === "completed" || Boolean(p.passed && (p.completedSections?.length ?? 0) >= 7);
        return !isComplete && caseStudies.some((c) => c.slug === p.caseSlug);
      });
      if (inProgress) {
        const study = caseStudies.find((c) => c.slug === inProgress.caseSlug);
        return {
          recentCaseSlug: inProgress.caseSlug,
          recentCaseTitle: study?.shortTitle ?? study?.title ?? inProgress.caseSlug,
        };
      }

      // 2. If all started cases are complete, find the next sequential case in curriculum
      const latestCaseSlug = sorted[0]?.caseSlug;
      const idx = caseStudies.findIndex((c) => c.slug === latestCaseSlug);
      if (idx !== -1 && idx + 1 < caseStudies.length) {
        const nextStudy = caseStudies[idx + 1];
        return {
          recentCaseSlug: nextStudy.slug,
          recentCaseTitle: nextStudy.shortTitle ?? nextStudy.title ?? nextStudy.slug,
        };
      }

      if (latestCaseSlug) {
        const study = caseStudies.find((c) => c.slug === latestCaseSlug);
        return {
          recentCaseSlug: latestCaseSlug,
          recentCaseTitle: study?.shortTitle ?? study?.title ?? latestCaseSlug,
        };
      }
    }

    return { recentCaseSlug: defaultSlug, recentCaseTitle: defaultTitle };
  }, [caseStudies, cloudProgress]);

  const displayName =
    user?.fullName || profile?.name || (isAuthenticated ? "Engineer" : "Anonymous Investigator");

  const handle = profile?.publicProfileId || "investigator";
  const avatarUrl = profile?.customImageUrl || user?.imageUrl || profile?.imageUrl;
  const bannerUrl = profile?.bannerUrl;

  async function upload(file: File, kind: "image" | "banner") {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = (await res.json()) as { storageId: string };
      await setProfileMedia(
        kind === "image"
          ? { imageStorageId: storageId as Id<"_storage"> }
          : { bannerStorageId: storageId as Id<"_storage"> },
      );
      toast.success(kind === "image" ? "Profile picture updated" : "Banner updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  }

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`glass-panel relative w-full rounded-3xl p-6 border border-white/[0.08] shadow-[0_24px_48px_rgba(0,0,0,0.6)] ${className}`}
    >
      {/* 1. Top Cover Banner */}
      <div className="relative h-32 w-full overflow-hidden rounded-[24px] bg-[#080808] border border-white/[0.08] p-4 group/banner">
        {/* Background Banner Image */}
        <img
          src={bannerUrl || "/Observer.jpg"}
          alt="Profile Banner"
          className="absolute inset-0 size-full object-cover object-center opacity-90 transition-transform duration-700 group-hover/banner:scale-105"
        />
        {/* Subtle Darkening & Glow Overlay to keep badges and avatar seamless */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-[#080808]/90 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(204,255,0,0.18)_0%,transparent_70%)] pointer-events-none" />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#080808]/80 backdrop-blur-md px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#ccff00] border border-[#ccff00]/30">
            <span className="size-1.5 rounded-full recording-dot" />
            {rank.name}
          </span>

          <span className="rounded-full bg-[#080808]/70 backdrop-blur-md px-2.5 py-1 font-mono text-[10px] text-[#8a8a8a] border border-white/[0.08]">
            {isAuthenticated ? `UID: #${handle.slice(0, 7)}` : "GUEST SEAT"}
          </span>
        </div>

        {/* Banner edit control */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            title="Change banner"
            className="absolute bottom-2 right-2 z-20 flex items-center gap-1.5 rounded-full bg-[#080808]/80 backdrop-blur-md px-2.5 py-1 font-mono text-[10px] font-semibold text-[#f5f5f5] border border-white/[0.12] hover:border-[#ccff00]/50 hover:text-[#ccff00] transition-colors"
          >
            <ImagePlus className="size-3.5" />
            <span>Banner</span>
          </button>
        )}
      </div>

      {/* 2. Overlapping Avatar & Action Row */}
      <div className="relative -mt-10 px-2">
        <div className="flex items-end justify-between">
          {/* Avatar with refined ring */}
          <div className="relative">
            <div className="size-20 rounded-full border-[3.5px] border-[#101010] bg-[#161616] overflow-hidden ring-1.5 ring-[#ccff00]/70">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="size-full object-cover" />
              ) : isAuthenticated ? (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#1a2609] to-[#0d1304] font-mono text-base font-black text-[#ccff00]">
                  {initials || "RC"}
                </div>
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#161616] to-[#0a0a0a] text-[#8a8a8a]">
                  <User className="size-8" />
                </div>
              )}
            </div>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => picInputRef.current?.click()}
                title="Change profile picture"
                className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-[#ccff00] text-[#080808] border-2 border-[#101010] hover:scale-110 active:scale-95 transition-transform"
              >
                <Camera className="size-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mb-1">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="neu-btn flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-xs font-semibold text-[#f5f5f5] hover:border-[#ccff00]/40 hover:text-[#ccff00] active:scale-95 transition-all"
              >
                <Share2 className="size-3.5 text-[#ccff00]" />
                <span>Share</span>
              </button>
            ) : (
              <Link
                to="/sign-in"
                className="rounded-full bg-gradient-to-r from-[#d4ff00] to-[#ccff00] px-3.5 py-1.5 font-mono text-xs font-bold text-[#080808] hover:scale-105 transition-all inline-block"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Name & Handle */}
        <div className="mt-3">
          <div className="flex items-center gap-1.5">
            <h3 className="text-lg font-bold tracking-tight text-[#f5f5f5]">{displayName}</h3>
            {isAuthenticated && (
              <span className="text-[#ccff00] text-xs font-bold" title="Verified Investigator">
                <ShieldCheck className="size-4 inline text-[#ccff00]" />
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-[#8a8a8a]">@{handle}</p>
        </div>
      </div>

      {/* 3. Three-Metric Stats Bar */}
      <div className="mt-5 border-y border-white/[0.08] py-3.5">
        <div className="grid grid-cols-3 text-center">
          {/* Metric 1 */}
          <div className="border-r border-white/[0.08] px-1">
            <div className="flex items-center justify-center gap-1 font-mono text-base font-bold text-[#f5f5f5]">
              <Star className="size-3.5 fill-[#ccff00] text-[#ccff00]" />
              <span>{points}</span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-[#8a8a8a] uppercase tracking-wider">
              RC Points
            </p>
          </div>

          {/* Metric 2 */}
          <div className="border-r border-white/[0.08] px-1">
            <div className="flex items-center justify-center gap-1 font-mono text-base font-bold text-[#f5f5f5]">
              <BookOpen className="size-3.5 text-[#ccff00]" />
              <span>
                {clearedCasesCount}/{caseStudies.length || 35}
              </span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-[#8a8a8a] uppercase tracking-wider">
              Cases Solved
            </p>
          </div>

          {/* Metric 3 */}
          <div className="px-1">
            <div className="flex items-center justify-center gap-1 font-mono text-base font-bold text-[#f5f5f5]">
              <Flame className="size-3.5 text-[#ccff00] fill-[#ccff00]/30" />
              <span>{streakCurrent}d</span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-[#8a8a8a] uppercase tracking-wider">
              Day Streak
            </p>
          </div>
        </div>
      </div>

      {/* 4. Bottom Action Slide-to-Continue Slider */}
      <div className="mt-4.5">
        <SlideToContinue
          label={
            isAuthenticated
              ? `Slide to Continue · ${recentCaseTitle.length > 20 ? recentCaseTitle.slice(0, 18) + "..." : recentCaseTitle}`
              : "Slide to Sign In"
          }
          successLabel={isAuthenticated ? "Entering Investigation..." : "Redirecting..."}
          icon={isAuthenticated ? undefined : <Lock className="size-4.5" />}
          onComplete={() => {
            if (isAuthenticated) {
              router.navigate({
                to: "/cases/$slug",
                params: { slug: recentCaseSlug },
              });
            } else {
              router.navigate({ to: "/sign-in" });
            }
          }}
        />
      </div>

      <input
        ref={picInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f, "image");
          e.target.value = "";
        }}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f, "banner");
          e.target.value = "";
        }}
      />

      <ShareProfileModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        user={{
          profileId: profile?.publicProfileId || "",
          name: displayName,
          handle,
          rank: rank.name,
          points,
          streak: streakCurrent,
          solvedCases: clearedCasesCount,
          totalCases: caseStudies.length,
          avatarUrl,
          bannerUrl,
        }}
      />
    </div>
  );
}
