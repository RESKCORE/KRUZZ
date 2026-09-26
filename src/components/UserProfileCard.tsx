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
  Globe,
  ImagePlus,
  Loader2,
  Lock,
  Share2,
  ShieldCheck,
  ShieldAlert,
  Star,
  User,
  GraduationCap,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { ShareProfileModal } from "@/components/ShareProfileModal";
import { CampusAffiliationModal } from "@/components/CampusAffiliationModal";
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
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const picInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.users.generateProfileUploadUrl);
  const setProfileMedia = useMutation(api.users.setProfileMedia);
  const updateProfilePrivacy = useMutation(api.users.updateProfilePrivacy);

  const isPublic = Boolean(profile?.isPublic);
  const isAdmin =
    (profile as any)?.role === "admin" ||
    user?.primaryEmailAddress?.emailAddress === "reddysantosh1310@gmail.com";

  async function handleTogglePrivacy(nextState?: boolean) {
    if (!isAuthenticated) return;
    const target = typeof nextState === "boolean" ? nextState : !isPublic;
    setIsUpdatingPrivacy(true);
    try {
      await updateProfilePrivacy({ isPublic: target });
      toast.success(
        target
          ? "Profile is now Public! Anyone with your link or QR code can view your dossier."
          : "Profile is now Private. Your dossier and QR code are hidden from the public.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile privacy");
    } finally {
      setIsUpdatingPrivacy(false);
    }
  }

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
      className={`glass-panel relative w-full rounded-3xl p-6 border-2 border-black bg-white text-black shadow-xs ${className}`}
    >
      {/* 1. Top Cover Banner */}
      <div className="relative h-32 w-full overflow-hidden rounded-[24px] bg-white border-2 border-black p-4 group/banner">
        {/* Background Banner Image */}
        <img
          src={bannerUrl || "/Observer.jpg"}
          alt="Profile Banner"
          className="absolute inset-0 size-full object-cover object-center opacity-90 transition-transform duration-700 group-hover/banner:scale-105"
        />
        {/* Subtle Darkening & Glow Overlay to keep badges and avatar seamless */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/80 pointer-events-none" />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white text-black px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider border-2 border-black shadow-xs">
            <span className="size-2 rounded-full bg-black ring-1 ring-black/20" />
            {rank.name}
          </span>

          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ccff00] text-black border-2 border-black px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider shadow-xs">
                <ShieldAlert className="size-3 text-black" />
                Admin
              </span>
            )}
            {isAuthenticated && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider border-2 ${
                  isPublic ? "bg-white border-black text-black" : "bg-white border-black text-black"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${isPublic ? "bg-black animate-pulse" : "bg-black"}`}
                />
                {isPublic ? "Public" : "Private"}
              </span>
            )}
            <span className="rounded-full bg-white px-2.5 py-1 font-mono text-[10px] font-black text-black border-2 border-black">
              {isAuthenticated ? `UID: #${handle.slice(0, 7)}` : "GUEST SEAT"}
            </span>
          </div>
        </div>

        {/* Banner edit control */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            title="Change banner"
            className="absolute bottom-2 right-2 z-20 flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-mono text-[10px] font-black text-black border-2 border-black hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <ImagePlus className="size-3.5 text-black" />
            <span>Banner</span>
          </button>
        )}
      </div>

      {/* 2. Overlapping Avatar & Action Row */}
      <div className="relative -mt-10 px-2">
        <div className="flex items-end justify-between">
          {/* Avatar with refined ring */}
          <div className="relative">
            <div className="size-20 rounded-full border-[3.5px] border-black bg-white overflow-hidden shadow-xs">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="size-full object-cover" />
              ) : isAuthenticated ? (
                <div className="flex size-full items-center justify-center bg-white font-mono text-base font-black text-black">
                  {initials || "RC"}
                </div>
              ) : (
                <div className="flex size-full items-center justify-center bg-white text-black">
                  <User className="size-8 text-black" />
                </div>
              )}
            </div>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => picInputRef.current?.click()}
                title="Change profile picture"
                className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-black text-white border-2 border-white hover:scale-110 active:scale-95 transition-transform cursor-pointer shadow-xs"
              >
                <Camera className="size-3.5 text-white" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mb-1">
            {isAuthenticated ? (
              <>
                {/* Quick Privacy Toggle Pill Button */}
                <button
                  type="button"
                  onClick={() => handleTogglePrivacy()}
                  disabled={isUpdatingPrivacy}
                  title={
                    isPublic
                      ? "Profile is Public. Click to switch to Private."
                      : "Profile is Private. Click to switch to Public."
                  }
                  className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-xs font-black transition-all cursor-pointer border-2 border-black bg-white text-black hover:bg-neutral-100"
                >
                  {isUpdatingPrivacy ? (
                    <Loader2 className="size-3.5 animate-spin text-black" />
                  ) : isPublic ? (
                    <Globe className="size-3.5 text-black" />
                  ) : (
                    <Lock className="size-3.5 text-black" />
                  )}
                  <span>{isPublic ? "Public" : "Private"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="neu-btn flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-xs font-black text-black border-2 border-black hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer"
                >
                  <Share2 className="size-3.5 text-black" />
                  <span>Share</span>
                </button>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="neu-btn flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-xs font-black text-black bg-[#ccff00] hover:bg-[#b8e600] border-2 border-black active:scale-95 transition-all cursor-pointer shadow-xs"
                    title="Open KRUZZ Admin & Email Broadcast Console"
                  >
                    <ShieldAlert className="size-3.5 text-black" />
                    <span>Admin Console</span>
                  </Link>
                )}
              </>
            ) : (
              <Link
                to="/sign-in"
                className="rounded-full bg-black text-white border-2 border-black px-3.5 py-1.5 font-mono text-xs font-black hover:scale-105 transition-all inline-block shadow-xs"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Name & Handle */}
        <div className="mt-3">
          <div className="flex items-center gap-1.5">
            <h3 className="text-lg font-black tracking-tight text-black">{displayName}</h3>
            {isAuthenticated && (
              <span className="text-black text-xs font-bold" title="Verified Investigator">
                <ShieldCheck className="size-4 inline text-black" />
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-black font-bold">@{handle}</p>
          {isAuthenticated && (
            <div className="mt-1.5 flex items-center gap-2">
              {(profile as any)?.university ? (
                <button
                  type="button"
                  onClick={() => setIsCampusModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-black/25 px-2.5 py-0.5 font-mono text-[10px] font-bold text-black transition-colors cursor-pointer group"
                  title="Click to change your university/college"
                >
                  <GraduationCap className="size-3 text-black" />
                  <span className="truncate max-w-[24ch]">{(profile as any).university}</span>
                  <Pencil className="size-2.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCampusModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-neutral-100 border border-dashed border-black/50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-black transition-colors cursor-pointer"
                  title="Affiliate with your college or university"
                >
                  <GraduationCap className="size-3 text-black" />
                  <span>+ Add University / College</span>
                </button>
              )}
            </div>
          )}
          {!isAuthenticated && Boolean((profile as any)?.university) && (
            <p className="mt-1 inline-flex items-center gap-1 rounded bg-neutral-100 border border-black/25 px-2 py-0.5 font-mono text-[10px] font-bold text-black">
              <GraduationCap className="size-3 text-black" />
              <span>{(profile as any).university}</span>
            </p>
          )}
        </div>

        {/* Profile Visibility Control Bar */}
        {isAuthenticated && (
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-neutral-50 border-2 border-black p-2.5 px-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl border border-black bg-white text-black">
                {isPublic ? (
                  <Globe className="size-3.5 text-black" />
                ) : (
                  <Lock className="size-3.5 text-black" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-black text-black">
                    {isPublic ? "Public Profile" : "Private Profile"}
                  </span>
                  <span className="size-1.5 rounded-full bg-black animate-pulse" />
                </div>
                <p className="font-mono text-[10px] text-black font-semibold">
                  {isPublic
                    ? "Visible to anyone via link or QR code"
                    : "Hidden from public · QR disabled"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleTogglePrivacy()}
              disabled={isUpdatingPrivacy}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1 font-mono text-[11px] font-black transition-all cursor-pointer border-2 border-black ${
                isPublic
                  ? "bg-white text-black hover:bg-neutral-100"
                  : "bg-black text-white hover:bg-neutral-800"
              }`}
            >
              {isUpdatingPrivacy ? (
                <Loader2 className="size-3 animate-spin" />
              ) : isPublic ? (
                <span>Make Private</span>
              ) : (
                <span>Turn Public</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 3. Three-Metric Stats Bar */}
      <div className="mt-5 border-y-2 border-black py-3.5">
        <div className="grid grid-cols-3 text-center">
          {/* Metric 1 */}
          <div className="border-r-2 border-black px-1">
            <div className="flex items-center justify-center gap-1 font-mono text-base font-black text-black">
              <Star className="size-3.5 fill-black text-black" />
              <span>{points}</span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-black font-black uppercase tracking-wider">
              RC Points
            </p>
          </div>

          {/* Metric 2 */}
          <div className="border-r-2 border-black px-1">
            <div className="flex items-center justify-center gap-1 font-mono text-base font-black text-black">
              <BookOpen className="size-3.5 text-black stroke-[2.5]" />
              <span>
                {clearedCasesCount}/{caseStudies.length || 59}
              </span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-black font-black uppercase tracking-wider">
              Cases Solved
            </p>
          </div>

          {/* Metric 3 */}
          <div className="px-1">
            <div className="flex items-center justify-center gap-1 font-mono text-base font-black text-black">
              <Flame className="size-3.5 text-black fill-black" />
              <span>{streakCurrent}d</span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-black font-black uppercase tracking-wider">
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
        onTogglePrivacy={handleTogglePrivacy}
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
          isPublic,
          university: (profile as any)?.university || "",
        }}
      />

      <CampusAffiliationModal
        isOpen={isCampusModalOpen}
        onClose={() => setIsCampusModalOpen(false)}
        currentUniversity={(profile as any)?.university || ""}
      />
    </div>
  );
}
