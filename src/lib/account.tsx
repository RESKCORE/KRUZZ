import { useCallback, useEffect, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { totalRC, rankFor } from "@/lib/rc";

/**
 * Account hook — Clerk authentication + Convex user profile.
 */
export function useAccount() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { isAuthenticated, isLoading: isConvexLoading } = useConvexAuth();
  const storeUser = useMutation(api.users.storeUser);
  const cloudUser = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    if (isSignedIn && isAuthenticated) {
      const tz =
        typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
      storeUser(tz ? { timezone: tz } : {}).catch(() => {});
    }
  }, [isSignedIn, isAuthenticated, storeUser]);

  return {
    user: user ?? null,
    profile: cloudUser ?? null,
    isLoading: !isLoaded || isConvexLoading,
    isAuthenticated: Boolean(isSignedIn && isAuthenticated),
  };
}

/**
 * Wallet hook — Convex cloud sync when authenticated.
 * Guests have 0 RC and no client-side reward generation.
 */
export function useWallet() {
  const { isAuthenticated } = useConvexAuth();
  const cloudAwards = useQuery(api.awards.getUserAwards, isAuthenticated ? {} : "skip");
  const cloudUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const redeemStoreMutation = useMutation(api.awards.redeemStoreItem);

  const activeAwards: Record<string, number> = useMemo(
    () => (isAuthenticated ? (cloudAwards ?? {}) : {}),
    [isAuthenticated, cloudAwards],
  );
  const points = isAuthenticated ? (cloudUser?.points ?? totalRC(activeAwards)) : 0;

  // Redeem store item via authoritative server-side mutation
  const redeemStoreItem = useCallback(
    async (itemId: string) => {
      if (!isAuthenticated) return { success: false, error: "Authentication required" };
      try {
        return await redeemStoreMutation({ itemId });
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
    [isAuthenticated, redeemStoreMutation],
  );

  // Deprecated client-side award method (strictly disabled)
  const award = useCallback(async () => {
    return false;
  }, []);

  // Check if award exists (supports both case: prefixed and unprefixed formats)
  const has = useCallback(
    (awardId: string) => {
      if (activeAwards[awardId]) return true;
      if (awardId.startsWith("case:")) {
        const stripped = awardId.slice(5);
        if (activeAwards[stripped]) return true;
      } else {
        const prefixed = `case:${awardId}`;
        if (activeAwards[prefixed]) return true;
      }
      return false;
    },
    [activeAwards],
  );

  return {
    points,
    awards: activeAwards,
    award,
    redeemStoreItem,
    has,
    rank: rankFor(points),
    isAuthenticated,
  };
}

/**
 * Streak hook — Convex cloud streak when authenticated.
 * Guests have 0 streaks.
 */
export function useStreak() {
  const { isAuthenticated } = useConvexAuth();
  const cloudStreak = useQuery(api.streaks.getUserStreak, isAuthenticated ? {} : "skip");
  const cloudTouch = useMutation(api.streaks.touchStreak);

  // Auto-touch daily streak on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const tz =
        typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
      cloudTouch(tz ? { timezone: tz } : {}).catch(() => {});
    }
  }, [isAuthenticated, cloudTouch]);

  const touch = useCallback(async () => {
    if (!isAuthenticated) {
      return { streakCurrent: 0, updated: false };
    }
    const tz =
      typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
    return await cloudTouch(tz ? { timezone: tz } : {});
  }, [isAuthenticated, cloudTouch]);

  return {
    current: isAuthenticated ? (cloudStreak?.current ?? 0) : 0,
    longest: isAuthenticated ? (cloudStreak?.longest ?? 0) : 0,
    lastActive: isAuthenticated ? (cloudStreak?.lastActive ?? "") : "",
    touch,
  };
}
